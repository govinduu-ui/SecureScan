from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
import uuid


class ReportModel(BaseModel):
    """MongoDB document model for scan reports."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    scan_id: str
    user_id: str
    target_url: str
    score: int
    grade: str
    category_scores: dict
    findings_summary: dict
    pdf_path: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
