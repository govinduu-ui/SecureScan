from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
import uuid


class ScanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanModel(BaseModel):
    """MongoDB document model for scans."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    target_url: str
    status: ScanStatus = ScanStatus.PENDING
    score: Optional[int] = None
    grade: Optional[str] = None
    category_scores: Optional[dict] = None
    findings_count: int = 0
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
