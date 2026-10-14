"""
Per-user analysis history and dashboard statistics.

Every query is scoped to the signed-in user; another user's record id is
answered with 404 so its existence is not revealed.
"""

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func

from auth import error_response, login_required
from database import Analysis, db

bp = Blueprint("records", __name__, url_prefix="/api/v1")

MAX_PAGE_SIZE = 100
RECENT_COUNT = 8


def _int_arg(name, default, minimum, maximum):
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, value))


def _own_analysis(analysis_id):
    return Analysis.query.filter_by(id=analysis_id, user_id=g.user.id).first()


@bp.get("/history")
@login_required
def list_history():
    page = _int_arg("page", 1, 1, 10_000)
    page_size = _int_arg("page_size", 20, 1, MAX_PAGE_SIZE)

    query = Analysis.query.filter_by(user_id=g.user.id)

    search = (request.args.get("search") or "").strip()
    if search:
        pattern = f"%{search[:100]}%"
        query = query.filter(
            Analysis.job_title.ilike(pattern) | Analysis.company_name.ilike(pattern)
        )

    outcome = (request.args.get("prediction") or "").strip().lower()
    if outcome in ("fraudulent", "legitimate"):
        query = query.filter(Analysis.is_fraudulent.is_(outcome == "fraudulent"))

    order = Analysis.created_at.asc() if request.args.get("sort") == "oldest" else Analysis.created_at.desc()
    total = query.count()
    rows = query.order_by(order, Analysis.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return jsonify({
        "items": [row.summary() for row in rows],
        "meta": {"page": page, "page_size": page_size, "total": total},
    })


@bp.get("/history/<int:analysis_id>")
@login_required
def get_history_item(analysis_id):
    analysis = _own_analysis(analysis_id)
    if analysis is None:
        return error_response(404, "This analysis was not found. It may have been deleted.", "not_found")
    return jsonify({"analysis": analysis.to_dict()})


@bp.delete("/history/<int:analysis_id>")
@login_required
def delete_history_item(analysis_id):
    analysis = _own_analysis(analysis_id)
    if analysis is None:
        return error_response(404, "This analysis was not found. It may have been deleted already.", "not_found")
    db.session.delete(analysis)
    db.session.commit()
    return jsonify({"success": True, "id": analysis_id})


@bp.get("/dashboard/stats")
@login_required
def dashboard_stats():
    counts = dict(
        db.session.query(Analysis.is_fraudulent, func.count(Analysis.id))
        .filter(Analysis.user_id == g.user.id)
        .group_by(Analysis.is_fraudulent)
        .all()
    )
    fraudulent = counts.get(True, 0)
    legitimate = counts.get(False, 0)

    recent = (
        Analysis.query.filter_by(user_id=g.user.id)
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        .limit(RECENT_COUNT)
        .all()
    )

    return jsonify({
        "total_analyzed": fraudulent + legitimate,
        "fraudulent": fraudulent,
        "legitimate": legitimate,
        "recent_analyses": [row.summary() for row in recent],
    })
