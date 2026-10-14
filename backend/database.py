"""
Database models (Flask-SQLAlchemy).

SQLite locally; any SQLAlchemy URL (e.g. Postgres) via DATABASE_URL in production.
"""

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utcnow():
    return datetime.now(timezone.utc)


def iso(value):
    if value is None:
        return None
    if value.tzinfo is None:  # SQLite drops tzinfo; values are always stored as UTC
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(254), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    analyses = db.relationship(
        "Analysis", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "created_at": iso(self.created_at),
        }


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_title = db.Column(db.String(300), nullable=False, default="")
    company_name = db.Column(db.String(300), nullable=False, default="")
    recruiter_email = db.Column(db.String(254), nullable=False, default="")
    source = db.Column(db.String(60), nullable=False, default="")
    description = db.Column(db.Text, nullable=False)
    is_fraudulent = db.Column(db.Boolean, nullable=False)
    fraud_probability = db.Column(db.Float, nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, index=True)

    user = db.relationship("User", back_populates="analyses")

    def summary(self):
        return {
            "id": self.id,
            "job_title": self.job_title,
            "company_name": self.company_name,
            "source": self.source,
            "prediction": "Fraudulent" if self.is_fraudulent else "Legitimate",
            "label": "Potentially Fraudulent" if self.is_fraudulent else "Likely Legitimate",
            "is_fraudulent": self.is_fraudulent,
            "fraud_probability": self.fraud_probability,
            "threshold": self.threshold,
            "created_at": iso(self.created_at),
        }

    def to_dict(self):
        return {
            **self.summary(),
            "recruiter_email": self.recruiter_email,
            "description": self.description,
        }
