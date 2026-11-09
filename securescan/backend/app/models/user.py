from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone
from typing import Optional
import uuid


class UserModel(BaseModel):
    """MongoDB document model for users."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    email: EmailStr
    name: Optional[str] = None
    username: str
    hashed_password: str
    is_active: bool = True
    scan_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
