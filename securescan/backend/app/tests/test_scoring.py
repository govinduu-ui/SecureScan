from app.scanner.scoring import calculate_grade, compute_scan_score, CATEGORY_MAX_POINTS


def test_grade_thresholds():
    assert calculate_grade(98) == "A+"
    assert calculate_grade(95) == "A+"
    assert calculate_grade(92) == "A"
    assert calculate_grade(87) == "B+"
    assert calculate_grade(82) == "B"
    assert calculate_grade(75) == "C"
    assert calculate_grade(64) == "D"
    assert calculate_grade(45) == "F"


def test_compute_scan_score():
    findings = [
        {"category": "tls_https", "points_earned": 10, "points_possible": 10},
        {"category": "tls_https", "points_earned": 10, "points_possible": 10},
        {"category": "tls_https", "points_earned": 5, "points_possible": 5},
        {"category": "security_headers", "points_earned": 10, "points_possible": 10},
        {"category": "security_headers", "points_earned": 10, "points_possible": 10},
        {"category": "security_headers", "points_earned": 5, "points_possible": 5},
        {"category": "security_headers", "points_earned": 5, "points_possible": 5},
        {"category": "security_headers", "points_earned": 5, "points_possible": 5},
        {"category": "security_headers", "points_earned": 5, "points_possible": 5},
        {"category": "security_headers", "points_earned": 5, "points_possible": 5},
        {"category": "cookie_security", "points_earned": 5, "points_possible": 5},
        {"category": "cookie_security", "points_earned": 5, "points_possible": 5},
        {"category": "cookie_security", "points_earned": 5, "points_possible": 5},
        {"category": "information_disclosure", "points_earned": 15, "points_possible": 15},
    ]

    total_score, grade, category_scores = compute_scan_score(findings)

    assert total_score == 100
    assert grade == "A+"
    assert category_scores["tls_https"] == CATEGORY_MAX_POINTS["tls_https"]
    assert category_scores["security_headers"] == CATEGORY_MAX_POINTS["security_headers"]
    assert category_scores["cookie_security"] == CATEGORY_MAX_POINTS["cookie_security"]
    assert category_scores["information_disclosure"] == CATEGORY_MAX_POINTS["information_disclosure"]


def test_clamping_category_scores():
    # If points exceed category max, they must clamp to category max
    findings = [
        {"category": "tls_https", "points_earned": 50, "points_possible": 25},
    ]
    total_score, grade, category_scores = compute_scan_score(findings)
    assert category_scores["tls_https"] == 25
    assert total_score == 25
    assert grade == "F"

