from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class FindingResponse(BaseModel):
    id: str
    scan_id: str
    check_id: str
    title: str
    description: str
    severity: str
    category: str
    points_earned: int
    points_possible: int
    details: Optional[str] = None
    recommendation: Optional[str] = None
    created_at: datetime


class FindingsListResponse(BaseModel):
    findings: List[FindingResponse]
    total: int
