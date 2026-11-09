"""Cloud object storage service supporting Supabase Storage, AWS S3, and local fallback."""

import os
import logging
import re
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger("securescan.cloud_storage")


class CloudStorageService:
    """Enterprise Cloud Storage client for audit reports and binary deliverables."""

    def __init__(self):
        self.provider = settings.CLOUD_STORAGE_PROVIDER.lower()
        self.supabase_url = re.sub(r"/rest(/v1)?/?$", "", settings.SUPABASE_URL.strip()).rstrip("/")
        self.supabase_key = settings.SUPABASE_KEY
        self.supabase_bucket = settings.SUPABASE_BUCKET
        self.s3_bucket = settings.AWS_BUCKET_NAME

    async def get_storage_status(self) -> Dict[str, Any]:
        """Check cloud storage connectivity and status."""
        if self.provider == "supabase" and self.supabase_url and self.supabase_key:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        f"{self.supabase_url}/storage/v1/bucket",
                        headers={
                            "apikey": self.supabase_key,
                            "Authorization": f"Bearer {self.supabase_key}",
                        },
                    )
                    if resp.status_code == 200:
                        buckets = [b.get("name") for b in resp.json()]
                        return {
                            "provider": "supabase",
                            "connected": True,
                            "bucket": self.supabase_bucket,
                            "bucket_exists": self.supabase_bucket in buckets,
                            "available_buckets": buckets,
                        }
                    return {
                        "provider": "supabase",
                        "connected": False,
                        "error": f"Supabase Storage returned HTTP {resp.status_code}",
                    }
            except Exception as e:
                return {"provider": "supabase", "connected": False, "error": str(e)}

        elif self.provider == "s3" and settings.AWS_ACCESS_KEY_ID:
            return {
                "provider": "s3",
                "connected": True,
                "bucket": self.s3_bucket,
                "region": settings.AWS_REGION,
            }

        return {
            "provider": "local",
            "connected": True,
            "storage_path": "reports_storage",
            "info": "Operating on local disk storage. Set CLOUD_STORAGE_PROVIDER and credentials in .env to enable cloud storage.",
        }

    async def upload_pdf(self, file_path: str, filename: str) -> Optional[str]:
        """
        Upload generated PDF file to cloud storage provider.
        Returns the public or accessible cloud URL, or None if using local storage.
        """
        if not os.path.exists(file_path):
            logger.error(f"Cannot upload non-existent file: {file_path}")
            return None

        # 1. Supabase Storage Provider
        if self.provider == "supabase" and self.supabase_url and self.supabase_key:
            try:
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                upload_url = f"{self.supabase_url}/storage/v1/object/{self.supabase_bucket}/{filename}"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/pdf",
                    "x-upsert": "true",
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(upload_url, headers=headers, content=file_bytes)

                    if response.status_code in (200, 201):
                        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.supabase_bucket}/{filename}"
                        logger.info(f"Successfully uploaded {filename} to Supabase Storage: {public_url}")
                        return public_url
                    else:
                        logger.warning(
                            f"Supabase upload failed ({response.status_code}): {response.text}"
                        )
            except Exception as e:
                logger.error(f"Error uploading to Supabase Storage: {e}")

        # 2. AWS S3 Provider
        elif self.provider == "s3" and settings.AWS_ACCESS_KEY_ID:
            try:
                import boto3  # type: ignore

                s3_kwargs = {
                    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
                    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
                    "region_name": settings.AWS_REGION,
                }
                if settings.AWS_S3_ENDPOINT_URL:
                    s3_kwargs["endpoint_url"] = settings.AWS_S3_ENDPOINT_URL

                s3_client = boto3.client("s3", **s3_kwargs)
                s3_client.upload_file(
                    file_path,
                    self.s3_bucket,
                    filename,
                    ExtraArgs={"ContentType": "application/pdf"},
                )
                url = f"https://{self.s3_bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
                logger.info(f"Successfully uploaded {filename} to AWS S3: {url}")
                return url
            except ImportError:
                logger.warning("boto3 package not installed; falling back to local storage.")
            except Exception as e:
                logger.error(f"Error uploading to AWS S3: {e}")

        # Local storage fallback
        return None


cloud_storage = CloudStorageService()

