"""
ScamShield AI - backend (Flask).

    GET  /api/health                 -> is the service up, are the artifacts loaded?
    POST /api/predict                -> fraud probability + thresholded prediction
                                        (saved to the user's history when signed in)
    /api/v1/auth/...                 -> register / login / me          (auth.py)
    /api/v1/history, /dashboard/...  -> per-user records and stats     (records.py)
    everything else                  -> the built React app (../dist), if present

The model and vectorizer are only ever *loaded* here; nothing is re-fitted.
"""

import json
import logging
import os
import secrets
import socket
from pathlib import Path

import joblib
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

import analysis as rule_checks
import auth
import records
from database import Analysis, db

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = Path(os.environ.get("SCAMSHIELD_FRONTEND_DIST", BASE_DIR.parent / "dist"))
DEFAULT_DATABASE_URL = f"sqlite:///{(BASE_DIR / 'scamshield.db').as_posix()}"
ARTIFACTS_DIR = Path(os.environ.get("SCAMSHIELD_ARTIFACTS_DIR", BASE_DIR))
MODEL_PATH = ARTIFACTS_DIR / os.environ.get("SCAMSHIELD_MODEL_FILE", "scamshield_tfidf_logreg.joblib")
VECTORIZER_PATH = ARTIFACTS_DIR / os.environ.get(
    "SCAMSHIELD_VECTORIZER_FILE", "scamshield_tfidf_vectorizer.joblib"
)
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

DEFAULT_THRESHOLD = 0.55
FRAUD_LABEL = 1  # metadata label_mapping: "1" -> fraudulent
MAX_TEXT_LENGTH = 20000

# Development only: the Vite dev server. Override with a comma-separated list.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

DISCLAIMER = (
    "This is a statistical estimate from a model trained on historical job postings. "
    "It is not proof that a listing is fraudulent or legitimate."
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("scamshield")


# --------------------------------------------------------------------------- #
# Artifact loading
# --------------------------------------------------------------------------- #

class ModelState:
    def __init__(self):
        self.metadata = {}
        self.model = None
        self.vectorizer = None
        self.fraud_index = None
        self.threshold = DEFAULT_THRESHOLD
        self.text_columns = ["title", "description"]
        self.errors = []

    @property
    def ready(self):
        return self.model is not None and self.vectorizer is not None and not self.errors


def load_artifacts():
    state = ModelState()

    # Metadata: threshold and the text columns used during training.
    try:
        with open(METADATA_PATH, encoding="utf-8") as fh:
            state.metadata = json.load(fh)
        # The operational threshold for the API. Not "decision_threshold_for_reported_metrics",
        # which is only the threshold the evaluation metrics were computed at.
        for key in ("target_decision_threshold_flask", "decision_threshold"):
            if key in state.metadata:
                state.threshold = float(state.metadata[key])
                break
        if state.metadata.get("text_columns"):
            state.text_columns = list(state.metadata["text_columns"])
    except FileNotFoundError:
        log.warning("Metadata not found at %s; using threshold %.2f", METADATA_PATH, DEFAULT_THRESHOLD)
    except (OSError, ValueError, TypeError) as exc:
        state.errors.append(f"Could not read model metadata: {exc}")

    # Optional override without editing the metadata file.
    override = os.environ.get("SCAMSHIELD_THRESHOLD", "").strip()
    if override:
        try:
            state.threshold = float(override)
        except ValueError:
            state.errors.append(f"SCAMSHIELD_THRESHOLD must be a number, got {override!r}")
    if not 0 < state.threshold < 1:
        state.errors.append(f"Decision threshold must be between 0 and 1, got {state.threshold}")

    # Classifier.
    try:
        model = joblib.load(MODEL_PATH)
        if not hasattr(model, "predict_proba"):
            raise TypeError(f"{type(model).__name__} does not support predict_proba()")
        classes = list(getattr(model, "classes_", []))
        if FRAUD_LABEL not in classes:
            raise ValueError(f"fraud label {FRAUD_LABEL!r} not in model classes {classes}")
        state.model = model
        state.fraud_index = classes.index(FRAUD_LABEL)
        log.info("Loaded model %s (classes=%s, n_features_in_=%s)",
                 type(model).__name__, classes, getattr(model, "n_features_in_", "?"))
    except FileNotFoundError:
        state.errors.append(f"Model file not found: {MODEL_PATH.name}")
    except Exception as exc:  # corrupt file, version mismatch, wrong object...
        state.errors.append(f"Could not load model: {exc}")

    # Vectorizer: must be the one fitted together with this model.
    try:
        vectorizer = joblib.load(VECTORIZER_PATH)
        if not hasattr(vectorizer, "transform"):
            raise TypeError(f"{type(vectorizer).__name__} has no transform()")
        if state.model is not None:
            expected = getattr(state.model, "n_features_in_", None)
            actual = len(getattr(vectorizer, "vocabulary_", {})) or None
            if expected is not None and actual != expected:
                raise ValueError(
                    f"vectorizer produces {actual} features but the model expects {expected}; "
                    "it is not the vectorizer this model was trained with"
                )
            documented = state.metadata.get("vectorizer_features")
            if documented is not None and actual != int(documented):
                raise ValueError(
                    f"vectorizer produces {actual} features but model_metadata.json "
                    f"documents {documented}"
                )
        state.vectorizer = vectorizer
        log.info("Loaded vectorizer %s", type(vectorizer).__name__)
    except FileNotFoundError:
        state.errors.append(
            f"Vectorizer file not found: {VECTORIZER_PATH.name}. Add the fitted TF-IDF vectorizer "
            "from the same training run to the artifacts folder."
        )
    except Exception as exc:
        state.errors.append(f"Could not load vectorizer: {exc}")

    for error in state.errors:
        log.error(error)
    log.info("Decision threshold: %.2f | ready: %s", state.threshold, state.ready)
    return state


# --------------------------------------------------------------------------- #
# Preprocessing
# --------------------------------------------------------------------------- #

def build_model_text(fields, text_columns):
    """
    Combine the input fields into the single string the vectorizer expects.

    Mirrors training: the metadata's text_columns joined with spaces, missing
    columns as empty strings. Lowercasing/tokenising is done by the vectorizer.
    Consistent with the fitted vocabulary (no "nan" token, no column-name
    prefixes); the training column order itself could not be verified.
    """
    return " ".join(str(fields.get(column) or "") for column in text_columns).strip()


def parse_request(payload, text_columns):
    """Validate the JSON body. Returns (fields, error_message)."""
    if not isinstance(payload, dict):
        return None, "Request body must be a JSON object."

    description = payload.get("job_description")
    if description is None:
        return None, "Field 'job_description' is required."
    if not isinstance(description, str):
        return None, "Field 'job_description' must be a string."
    if not description.strip():
        return None, "Field 'job_description' must not be empty."
    if len(description) > MAX_TEXT_LENGTH:
        return None, f"Field 'job_description' must be {MAX_TEXT_LENGTH} characters or fewer."

    fields = {"description": description.strip()}
    # Optional extra training columns (e.g. "title"), accepted when sent as strings.
    for column in text_columns:
        if column == "description" or column not in payload or payload[column] is None:
            continue
        value = payload[column]
        if not isinstance(value, str):
            return None, f"Field '{column}' must be a string."
        if len(value) > MAX_TEXT_LENGTH:
            return None, f"Field '{column}' must be {MAX_TEXT_LENGTH} characters or fewer."
        fields[column] = value.strip()
    return fields, None


# Stored with the analysis for the user's history; never fed to the model.
RECORD_FIELDS = {"company_name": 300, "recruiter_email": 254, "source": 60}


def parse_record_fields(payload):
    """Optional display-only fields. Returns (fields, error_message)."""
    fields = {}
    for name, max_length in RECORD_FIELDS.items():
        value = payload.get(name)
        if value is None:
            fields[name] = ""
            continue
        if not isinstance(value, str):
            return None, f"Field '{name}' must be a string."
        if len(value.strip()) > max_length:
            return None, f"Field '{name}' must be {max_length} characters or fewer."
        fields[name] = value.strip()
    return fields, None


# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

def database_url():
    url = os.environ.get("DATABASE_URL", "").strip() or DEFAULT_DATABASE_URL
    # Render/Heroku-style URLs -> the psycopg 3 driver SQLAlchemy should use.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def secret_key():
    key = os.environ.get("SECRET_KEY", "").strip()
    if key:
        return key
    log.warning("SECRET_KEY is not set; using a random key. Sign-ins will not survive a restart.")
    return secrets.token_urlsafe(48)


# --------------------------------------------------------------------------- #
# App
# --------------------------------------------------------------------------- #

def error_response(status, message, code):
    return jsonify({"success": False, "error": code, "detail": message}), status


def create_app(state=None, config=None):
    app = Flask(__name__)
    app.config.update(
        MAX_CONTENT_LENGTH=256 * 1024,
        SECRET_KEY=secret_key(),
        SQLALCHEMY_DATABASE_URI=database_url(),
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
    )
    app.config.update(config or {})
    CORS(
        app,
        resources={r"/api/*": {"origins": CORS_ORIGINS}},
        methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    db.init_app(app)
    with app.app_context():
        db.create_all()
    if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite") and os.environ.get("RENDER"):
        log.warning("Using SQLite on Render: data is lost on every redeploy. Set DATABASE_URL.")

    app.register_blueprint(auth.bp)
    app.register_blueprint(records.bp)

    state = state or load_artifacts()
    app.config["MODEL_STATE"] = state

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok" if state.ready else "degraded",
            "ready": state.ready,
            "model_loaded": state.model is not None,
            "vectorizer_loaded": state.vectorizer is not None,
            "threshold": state.threshold,
            "model_name": state.metadata.get("model_name"),
            "errors": state.errors,
        })

    @app.post("/api/predict")
    def predict():
        payload = request.get_json(silent=True)
        fields, problem = parse_request(payload, state.text_columns)
        if not problem:
            record_fields, problem = parse_record_fields(payload)
        if problem:
            return error_response(400, problem, "invalid_request")

        # Anonymous use is allowed; a token that is sent must be valid.
        try:
            user = auth.user_from_request(required=False)
        except auth.AuthError as exc:
            return error_response(401, exc.message, "unauthorized")

        if not state.ready:
            return error_response(
                503,
                "The prediction model is not available: " + "; ".join(state.errors),
                "model_unavailable",
            )

        try:
            text = build_model_text(fields, state.text_columns)
            features = state.vectorizer.transform([text])
            fraud_probability = float(state.model.predict_proba(features)[0][state.fraud_index])
        except Exception:
            log.exception("Prediction failed")
            return error_response(500, "The model failed to score this job posting.", "prediction_failed")

        is_fraudulent = fraud_probability >= state.threshold
        result = {
            "success": True,
            "prediction": "Fraudulent" if is_fraudulent else "Legitimate",
            "label": "Potentially Fraudulent" if is_fraudulent else "Likely Legitimate",
            "is_fraudulent": is_fraudulent,
            "fraud_probability": round(fraud_probability, 4),
            "threshold": state.threshold,
            "disclaimer": DISCLAIMER,
            "saved": False,
        }

        # Rule-based text checks (separate from the model; they never change the probability).
        try:
            result.update(rule_checks.analyze_posting(
                fields, record_fields.get("recruiter_email", ""), is_fraudulent))
        except Exception:
            log.exception("Rule-based checks failed; returning the model result only")

        if user is not None:
            analysis = Analysis(
                user_id=user.id,
                job_title=fields.get("title", "")[:300],
                description=fields["description"],
                is_fraudulent=is_fraudulent,
                fraud_probability=result["fraud_probability"],
                threshold=state.threshold,
                **record_fields,
            )
            try:
                db.session.add(analysis)
                db.session.commit()
                result.update(saved=True, id=analysis.id, created_at=analysis.summary()["created_at"])
            except Exception:
                db.session.rollback()
                log.exception("Could not save analysis to history")

        return jsonify(result)

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    # ---- built React app (single-page app: unknown paths -> index.html) ----
    @app.get("/")
    @app.get("/<path:path>")
    def frontend(path=""):
        if path == "api" or path.startswith("api/"):
            return error_response(404, "Unknown API endpoint.", "not_found")
        index = FRONTEND_DIST / "index.html"
        if not index.is_file():
            return error_response(
                404, "The frontend has not been built. Run 'npm run build' in the project root.",
                "frontend_not_built",
            )
        candidate = (FRONTEND_DIST / path).resolve()
        if path and candidate.is_file() and FRONTEND_DIST.resolve() in candidate.parents:
            # Vite fingerprints files in /assets, so they can be cached for a year.
            max_age = 31536000 if path.startswith("assets/") else 3600
            return send_from_directory(FRONTEND_DIST, path, max_age=max_age)
        response = send_from_directory(FRONTEND_DIST, "index.html", max_age=0)
        response.headers["Cache-Control"] = "no-cache"
        return response

    @app.errorhandler(HTTPException)
    def http_error(exc):
        return error_response(exc.code, exc.description, exc.name.lower().replace(" ", "_"))

    @app.errorhandler(Exception)
    def unexpected_error(exc):
        log.exception("Unhandled error")
        return error_response(500, "Internal server error.", "internal_error")

    return app


def port_in_use(port):
    # Windows lets a second server bind the same port silently; an older
    # instance would then keep answering requests. Refuse to start instead.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("127.0.0.1", port)) == 0


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    if port_in_use(port):
        log.error("Port %d is already in use - another backend is probably still running. "
                  "Stop it (Ctrl+C in its window) and start this one again.", port)
        raise SystemExit(1)
    log.info("Allowing CORS from: %s", ", ".join(CORS_ORIGINS))
    if not os.environ.get("SECRET_KEY"):
        # Stable key for local development only, so sign-ins survive restarts.
        os.environ["SECRET_KEY"] = "local-dev-only-not-for-production"
    create_app().run(host="127.0.0.1", port=port, debug=False)
