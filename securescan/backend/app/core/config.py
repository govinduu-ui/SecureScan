from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Any, Union
import json
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database Provider ("auto", "mongodb", "supabase")
    DATABASE_PROVIDER: str = "auto"

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "securescan"

    # JWT
    JWT_SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_NAME: str = "SecureScan"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped == "*":
                return ["*"]
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass
            return [origin.strip() for origin in v_stripped.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Scanner
    SCANNER_CONNECT_TIMEOUT: int = 10
    SCANNER_TOTAL_TIMEOUT: int = 30
    SCANNER_MAX_RESPONSE_SIZE: int = 10_485_760  # 10MB

    # Cloud Storage (Object / File Storage for PDF Reports)
    CLOUD_STORAGE_PROVIDER: str = "local"  # "local", "supabase", "s3"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "securescan-reports"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_BUCKET_NAME: str = "securescan-reports"
    AWS_S3_ENDPOINT_URL: str = ""

    model_config = ConfigDict(
        env_file=(
            ".env",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            "securescan/backend/.env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
