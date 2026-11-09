"""Transparent scoring algorithm and grade computation for SecureScan.

Category point breakdown (Total: 100 points):
- TLS & HTTPS (25 points):
    1. HTTPS Availability (10 points)
    2. SSL Certificate Validity (10 points)
    3. SSL Expiration Health (5 points)
- Security Headers (45 points):
    4. Strict-Transport-Security (HSTS) (10 points)
    5. Content-Security-Policy (CSP) (10 points)
    6. X-Frame-Options (Clickjacking Mitigation) (5 points)
    7. X-Content-Type-Options (MIME Sniffing Mitigation) (5 points)
    8. Referrer-Policy (5 points)
    9. Permissions-Policy (5 points)
    10. Server Information Disclosure Hygiene (5 points)
- Cookie Security (15 points):
    11. Secure Cookie Flag (5 points)
    12. HttpOnly Cookie Flag (5 points)
    13. SameSite Cookie Attribute (5 points)
- Information Disclosure (15 points):
    (Integrated with Server Information Disclosure and Technology Header Leakage)

Grade Thresholds:
- A+ : 95 - 100
- A  : 90 - 94
- B+ : 85 - 89
- B  : 80 - 84
- C  : 70 - 79
- D  : 60 - 69
- F  : < 60
"""

from typing import Dict, List, Tuple, Any

CATEGORY_MAX_POINTS: Dict[str, int] = {
    "tls_https": 25,
    "security_headers": 45,
    "cookie_security": 15,
    "information_disclosure": 15,
}

DISCLAIMER: str = (
    "SecureScan performs passive, non-intrusive telemetry analysis based on public network responses. "
    "It does not execute active exploits, injection attacks, or brute force, and cannot guarantee complete website security "
    "or substitute for an authorized professional penetration test."
)


def calculate_grade(score: int) -> str:
    """Map numeric score (0-100) to a letter grade."""
    if score >= 95:
        return "A+"
    if score >= 90:
        return "A"
    if score >= 85:
        return "B+"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def compute_scan_score(findings: List[Dict[str, Any]]) -> Tuple[int, str, Dict[str, int]]:
    """Compute overall score, grade, and category breakdown from findings.

    Each check awards points_earned out of points_possible.
    Points are aggregated per category and clamped to the category's maximum.
    """
    category_totals: Dict[str, int] = {
        "tls_https": 0,
        "security_headers": 0,
        "cookie_security": 0,
        "information_disclosure": 0,
    }

    for finding in findings:
        cat = finding.get("category")
        points = finding.get("points_earned", 0)
        if cat in category_totals:
            category_totals[cat] += points

    # Normalize category scores to their respective maximums
    clamped_category_scores = {}
    for cat, max_pts in CATEGORY_MAX_POINTS.items():
        earned = max(0, min(category_totals.get(cat, 0), max_pts))
        clamped_category_scores[cat] = earned

    total_score = sum(clamped_category_scores.values())
    total_score = max(0, min(100, total_score))
    grade = calculate_grade(total_score)

    return total_score, grade, clamped_category_scores

