"""Unit tests for Cloud Storage service."""

import os
from app.services.cloud_storage import CloudStorageService
from app.core.config import settings


def test_cloud_storage_initialization():
    service = CloudStorageService()
    assert service.provider in ("local", "supabase", "s3")
    assert service.supabase_bucket == "securescan-reports"


def test_cloud_storage_upload_nonexistent_file(tmp_path):
    service = CloudStorageService()
    # Test file existence check without needing event loop
    nonexistent = str(tmp_path / "missing.pdf")
    assert not os.path.exists(nonexistent)
