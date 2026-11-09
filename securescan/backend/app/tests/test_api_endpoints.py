import pytest
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse, TokenResponse
from app.schemas.scan import ScanCreateRequest, ScanResponse
from app.schemas.report import ReportResponse, FindingsSummary
from app.schemas.analytics import DashboardResponse, RecentScan


def test_auth_schemas():
    req = RegisterRequest(name="SecOps Engineer", email="secops@enterprise.corp", password="ComplexPassword123!")
    assert req.email == "secops@enterprise.corp"
    assert req.name == "SecOps Engineer"

    login = LoginRequest(email="secops@enterprise.corp", password="ComplexPassword123!")
    assert login.email == "secops@enterprise.corp"


def test_scan_request_url_validation():
    req = ScanCreateRequest(target_url="example.com")
    assert req.target_url == "https://example.com"

    req2 = ScanCreateRequest(target_url="http://insecure.internal")
    assert req2.target_url == "http://insecure.internal"


def test_report_schema():
    rep = ReportResponse(
        id="rep-1234",
        scan_id="scan-5678",
        user_id="user-9999",
        target_url="https://target.corp",
        score=92,
        grade="A",
        category_scores={"tls_https": 25, "security_headers": 40, "cookie_security": 15, "information_disclosure": 12},
        findings_summary=FindingsSummary(critical=0, high=0, medium=1, low=2, info=3),
        created_at="2026-11-05T20:00:00Z",
    )
    assert rep.grade == "A"
    assert rep.score == 92
    assert rep.findings_summary.critical == 0
