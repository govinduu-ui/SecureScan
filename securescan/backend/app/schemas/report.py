from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union, Dict


class FindingsSummary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class ReportResponse(BaseModel):
    id: str
    scan_id: str
    user_id: str
    target_url: str
    score: int
    grade: str
    category_scores: Dict[str, int]
    findings_summary: Union[FindingsSummary, Dict[str, int]]
    created_at: datetime
    cloud_report_url: Optional[str] = None
