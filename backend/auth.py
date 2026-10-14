"""
Account registration, login and bearer-token authentication.

Passwords are hashed with Werkzeug (scrypt). Tokens are signed and time-limited
with itsdangerous using the app's SECRET_KEY; nothing about them is stored.
"""

import re
import threading
import time
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from database import User, db

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

TOKEN_MAX_AGE = 7 * 24 * 3600  # seconds
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

# Brute-force protection: per-email failed logins within a sliding window.
MAX_FAILED_LOGINS = 10
FAILED_LOGIN_WINDOW = 15 * 60
_failed_logins = {}
_failed_lock = threading.Lock()

# Compared against when the email is unknown, so response time doesn't reveal it.
_DUMMY_HASH = generate_password_hash("not-a-real-password")


def error_response(status, message, code):
    return jsonify({"success": False, "error": code, "detail": message}), status


# --------------------------------------------------------------------------- #
# Tokens
# --------------------------------------------------------------------------- #

def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="scamshield-auth")


def issue_token(user):
    return _serializer().dumps({"uid": user.id})


class AuthError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


def user_from_request(required):
    """
    Resolve the bearer token on the current request.

    Returns the User, or None when no token was sent and `required` is False.
    Raises AuthError when a token is required, invalid or expired.
    """
    header = request.headers.get("Authorization", "")
    if not header:
        if required:
            raise AuthError("Please sign in to continue.")
        return None

    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AuthError("Malformed Authorization header.")

    try:
        payload = _serializer().loads(token.strip(), max_age=TOKEN_MAX_AGE)
    except SignatureExpired:
        raise AuthError("Your session has expired. Please sign in again.")
    except BadSignature:
        raise AuthError("Your session is invalid. Please sign in again.")

    user = db.session.get(User, payload.get("uid")) if isinstance(payload, dict) else None
    if user is None:
        raise AuthError("Your account no longer exists. Please sign in again.")
    return user


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        try:
            g.user = user_from_request(required=True)
        except AuthError as exc:
            return error_response(401, exc.message, "unauthorized")
        return view(*args, **kwargs)

    return wrapper


# --------------------------------------------------------------------------- #
# Rate limiting (in-process; adequate for a single small instance)
# --------------------------------------------------------------------------- #

def _recent_failures(email, now):
    attempts = [t for t in _failed_logins.get(email, []) if now - t < FAILED_LOGIN_WINDOW]
    _failed_logins[email] = attempts
    return attempts


def _is_locked(email):
    with _failed_lock:
        return len(_recent_failures(email, time.monotonic())) >= MAX_FAILED_LOGINS


def _record_failure(email):
    with _failed_lock:
        now = time.monotonic()
        _recent_failures(email, now).append(now)


def _clear_failures(email):
    with _failed_lock:
        _failed_logins.pop(email, None)


# --------------------------------------------------------------------------- #
# Validation
# --------------------------------------------------------------------------- #

def _json_body():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else None


def _clean_email(value):
    return value.strip().lower() if isinstance(value, str) else ""


def _password_problem(password):
    if not isinstance(password, str) or not password:
        return "Password is required."
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if len(password) > 128:
        return "Password must be 128 characters or fewer."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
        return "Password must contain at least one letter and one number."
    return None


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #

@bp.post("/register")
def register():
    payload = _json_body()
    if payload is None:
        return error_response(400, "Request body must be a JSON object.", "invalid_request")

    full_name = payload.get("full_name")
    full_name = full_name.strip() if isinstance(full_name, str) else ""
    email = _clean_email(payload.get("email"))
    password = payload.get("password")

    if not full_name:
        return error_response(400, "Full name is required.", "invalid_request")
    if len(full_name) > 120:
        return error_response(400, "Full name must be 120 characters or fewer.", "invalid_request")
    if not EMAIL_PATTERN.match(email) or len(email) > 254:
        return error_response(400, "Enter a valid email address.", "invalid_request")
    problem = _password_problem(password)
    if problem:
        return error_response(400, problem, "invalid_request")

    if User.query.filter_by(email=email).first() is not None:
        return error_response(409, "An account with this email already exists.", "email_taken")

    user = User(full_name=full_name, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:  # concurrent registration with the same email
        db.session.rollback()
        return error_response(409, "An account with this email already exists.", "email_taken")

    return jsonify({"success": True, "user": user.to_dict()}), 201


@bp.post("/login")
def login():
    payload = _json_body()
    if payload is None:
        return error_response(400, "Request body must be a JSON object.", "invalid_request")

    email = _clean_email(payload.get("email"))
    password = payload.get("password")
    if not email or not isinstance(password, str) or not password:
        return error_response(400, "Email and password are required.", "invalid_request")

    if _is_locked(email):
        return error_response(
            429, "Too many failed sign-in attempts. Please wait 15 minutes and try again.",
            "too_many_attempts",
        )

    user = User.query.filter_by(email=email).first()
    valid = check_password_hash(user.password_hash if user else _DUMMY_HASH, password)
    if not user or not valid:
        _record_failure(email)
        return error_response(401, "Invalid email or password.", "invalid_credentials")

    _clear_failures(email)
    return jsonify({
        "success": True,
        "user": user.to_dict(),
        "token": issue_token(user),
        "expires_in": TOKEN_MAX_AGE,
    })


@bp.get("/me")
@login_required
def me():
    return jsonify({"success": True, "user": g.user.to_dict()})
