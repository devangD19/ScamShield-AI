# ScamShield AI — Prediction Backend (Flask)

Serves the trained TF-IDF + Logistic Regression model, user accounts, per-user
history and dashboard statistics — and, in production, the built React app.

| File | Contents |
| --- | --- |
| `app.py` | App factory, `/api/health`, `/api/predict`, serves `../dist` |
| `auth.py` | `/api/v1/auth/register`, `/login`, `/me`; bearer tokens; login rate limiting |
| `records.py` | `/api/v1/history`, `/api/v1/history/{id}`, `/api/v1/dashboard/stats` |
| `database.py` | `users` and `analyses` tables (Flask-SQLAlchemy) |

Full request/response reference: [docs/API_CONTRACT.md](../docs/API_CONTRACT.md).

## Required artifacts (in `backend/`)

| File | Contents |
| --- | --- |
| `scamshield_tfidf_logreg.joblib` | Trained LogisticRegression (classes `0` = not fraudulent, `1` = fraudulent) |
| `scamshield_tfidf_vectorizer.joblib` | Fitted TF-IDF vectorizer from the same training run (150,000 features, 1-2 word n-grams) |
| `model_metadata.json` | Threshold (0.55), training text columns, documented feature count |

If a file is missing or broken the server still starts, `/api/health` reports
`"ready": false` with the reason, and `/api/predict` answers `503`.
A vectorizer whose vocabulary size does not match the model (or the metadata)
is refused.

## First-time setup (Windows, run from the project root)

```powershell
# 1. Create a private Python environment for the backend (one time only)
py -3.12 -m venv backend\.venv

# 2. Install the exact library versions the model needs
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

`scikit-learn` is pinned to **1.6.1** because that is the version the model
was saved with; other versions may load it incorrectly.

## Start the backend

```powershell
backend\.venv\Scripts\python.exe backend\app.py
```

It listens on `http://127.0.0.1:8000`. Leave this window open while you use the app.
Check it from a second terminal:

```powershell
curl.exe http://127.0.0.1:8000/api/health
```

## Configuration (environment variables)

| Variable | Default | Notes |
| --- | --- | --- |
| `SECRET_KEY` | local dev key (when run with `python app.py`) | **Required in production.** Signs login tokens; changing it signs everyone out |
| `DATABASE_URL` | SQLite file `backend/scamshield.db` | **Use Postgres in production** (`postgres://…` URLs are accepted) |
| `PORT` | `8000` | |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Only needed when the frontend runs on a different origin (dev) |
| `SCAMSHIELD_FRONTEND_DIST` | `../dist` | Built React app to serve |
| `SCAMSHIELD_ARTIFACTS_DIR` | `backend/` | |
| `SCAMSHIELD_MODEL_FILE` | `scamshield_tfidf_logreg.joblib` | |
| `SCAMSHIELD_VECTORIZER_FILE` | `scamshield_tfidf_vectorizer.joblib` | |

Tables are created automatically on startup.

## Security

- Passwords are hashed with Werkzeug (scrypt); they are never stored or logged in plain text.
- Tokens are signed and expire after 7 days. Logging out forgets the token in the browser.
- Every history/dashboard query is scoped to the signed-in user.
- 10 failed logins for one email within 15 minutes → temporarily blocked (`429`).

## Preprocessing

`build_model_text()` in `app.py` joins the metadata's `text_columns` with
single spaces (missing columns → `""`); the vectorizer itself lowercases and
tokenises. This is consistent with the vectorizer's vocabulary (no `nan`
token, no column-name prefixes), but the exact column order used in training
could not be verified from the artifacts.

Predictions are estimates from a model trained on historical postings, not proof of fraud.
