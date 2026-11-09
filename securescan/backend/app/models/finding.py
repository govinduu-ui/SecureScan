from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
from enum import Enum
import uuid


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"
    PASS = "pass"


class FindingCategory(str, Enum):
    TLS_HTTPS = "tls_https"
    SECURITY_HEADERS = "security_headers"
    COOKIE_SECURITY = "cookie_security"
    INFORMATION_DISCLOSURE = "information_disclosure"


class FindingModel(BaseModel):
    """MongoDB document model for individual scan findings."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    scan_id: str
    check_id: str
    title: str
    description: str
    severity: Severity
    category: FindingCategory
    points_earned: int = 0
    points_possible: int = 0
    details: Optional[str] = None
    recommendation: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
