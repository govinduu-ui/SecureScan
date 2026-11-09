from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from collections import Counter

from app.core.dependencies import get_current_user
from app.database.connection import get_database
from app.schemas.analytics import (
    DashboardResponse,
    GradeDistribution,
    CategoryAverage,
    RecentScan,
)

router = APIRouter()

CATEGORY_MAX_SCORES = {
    "tls_https": 25,
    "security_headers": 45,
    "cookie_security": 15,
    "information_disclosure": 15,
}


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Return aggregated analytics for the current user's dashboard."""
    db = get_database()
    user_id = current_user["_id"]

    # Total and completed counts
    total_scans = await db.scans.count_documents({"user_id": user_id})
    completed_scans = await db.scans.count_documents(
        {"user_id": user_id, "status": "completed"}
    )

    # Scans this month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    scans_this_month = await db.scans.count_documents(
        {"user_id": user_id, "created_at": {"$gte": month_start}}
    )

    # Fetch all completed scans for analytics
    completed_cursor = db.scans.find(
        {"user_id": user_id, "status": "completed", "score": {"$ne": None}}
    )
    completed_docs = await completed_cursor.to_list(length=1000)

    # Average score
    average_score = None
    if completed_docs:
        scores = [d["score"] for d in completed_docs if d.get("score") is not None]
        if scores:
            average_score = round(sum(scores) / len(scores), 1)

    # Grade distribution
    grade_counter = Counter()
    for doc in completed_docs:
        grade = doc.get("grade")
        if grade:
            grade_counter[grade] += 1
    grade_distribution = [
        GradeDistribution(grade=g, count=c)
        for g, c in sorted(grade_counter.items())
    ]

    # Category averages
    category_totals: dict[str, list[float]] = {}
    for doc in completed_docs:
        cat_scores = doc.get("category_scores", {})
        for cat, score in cat_scores.items():
            if cat not in category_totals:
                category_totals[cat] = []
            category_totals[cat].append(score)

    category_averages = [
        CategoryAverage(
            category=cat,
            average_score=round(sum(vals) / len(vals), 1),
            max_score=CATEGORY_MAX_SCORES.get(cat, 0),
        )
        for cat, vals in category_totals.items()
        if vals
    ]

    # Recent scans (last 10)
    recent_cursor = (
        db.scans.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(10)
    )
    recent_docs = await recent_cursor.to_list(length=10)
    recent_scans = [
        RecentScan(
            id=d["_id"],
            target_url=d["target_url"],
            score=d.get("score"),
            grade=d.get("grade"),
            status=d["status"],
            created_at=d["created_at"].isoformat() if isinstance(d["created_at"], datetime) else str(d["created_at"]),
        )
        for d in recent_docs
    ]

    return DashboardResponse(
        total_scans=total_scans,
        completed_scans=completed_scans,
        average_score=average_score,
        grade_distribution=grade_distribution,
        category_averages=category_averages,
        recent_scans=recent_scans,
        scans_this_month=scans_this_month,
    )
