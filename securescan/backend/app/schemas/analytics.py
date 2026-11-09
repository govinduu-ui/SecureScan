from pydantic import BaseModel
from typing import List, Optional


class GradeDistribution(BaseModel):
    grade: str
    count: int


class CategoryAverage(BaseModel):
    category: str
    average_score: float
    max_score: int


class RecentScan(BaseModel):
    id: str
    target_url: str
    score: Optional[int] = None
    grade: Optional[str] = None
    status: str
    created_at: str


class DashboardResponse(BaseModel):
    total_scans: int
    completed_scans: int
    average_score: Optional[float] = None
    grade_distribution: List[GradeDistribution]
    category_averages: List[CategoryAverage]
    recent_scans: List[RecentScan]
    scans_this_month: int
