from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse


class ScanCreateRequest(BaseModel):
    target_url: str = Field(min_length=1, max_length=2048)

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        parsed = urlparse(v)
        if not parsed.hostname:
            raise ValueError("Invalid URL: no hostname found")
        return v


class ScanResponse(BaseModel):
    id: str
    user_id: str
    target_url: str
    status: str
    score: Optional[int] = None
    grade: Optional[str] = None
    category_scores: Optional[dict] = None
    findings_count: int = 0
    duration_ms: Optional[int] = None
    raw_headers: Optional[List[Dict[str, str]]] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ScanListResponse(BaseModel):
    scans: List[ScanResponse]
    total: int
    page: int
    page_size: int
