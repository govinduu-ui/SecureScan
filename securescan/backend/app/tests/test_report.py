import os
from datetime import datetime, timezone
from app.services.report_service import generate_pdf


def test_pdf_report_generation():
    report_doc = {
        "scan_id": "test-scan-uuid-8888",
        "user_id": "test-user-uuid-1111",
        "target_url": "https://fintech-vault.example.com",
        "score": 84,
        "grade": "B+",
        "category_scores": {
            "tls_https": 25,
            "security_headers": 30,
            "cookie_security": 14,
            "information_disclosure": 15,
        },
        "findings_summary": {
            "critical": 0,
            "high": 1,
            "medium": 2,
            "low": 1,
            "info": 0,
        },
        "created_at": datetime.now(timezone.utc),
    }

    findings = [
        {
            "title": "Strict-Transport-Security (HSTS)",
            "severity": "high",
            "category": "security_headers",
            "points_earned": 5,
            "points_possible": 10,
            "description": "Missing preload directive in HSTS header.",
            "details": "strict-transport-security: max-age=15768000",
            "recommendation": "Configure includeSubDomains and preload.",
        },
        {
            "title": "Content-Security-Policy (CSP)",
            "severity": "medium",
            "category": "security_headers",
            "points_earned": 5,
            "points_possible": 10,
            "description": "'unsafe-inline' detected in script-src directive.",
            "details": "content-security-policy: default-src 'self' 'unsafe-inline'",
            "recommendation": "Remove unsafe-inline and adopt nonces.",
        },
        {
            "title": "SSL Certificate Chain & CA Trust",
            "severity": "pass",
            "category": "tls_https",
            "points_earned": 10,
            "points_possible": 10,
            "description": "Valid certificate issued by Let's Encrypt.",
            "details": "Expires in 78 days",
            "recommendation": "Keep automatic renewal active.",
        },
    ]

    pdf_path = generate_pdf(report_doc, findings)

    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 1000  # PDF should be generated with real content

