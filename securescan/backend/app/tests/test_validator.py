import pytest
from app.scanner.validator import validate_url, _is_private_ip, ValidationError


def test_private_ip_detection():
    # Loopback
    assert _is_private_ip("127.0.0.1") is True
    assert _is_private_ip("127.0.1.1") is True
    assert _is_private_ip("::1") is True

    # Private IPv4
    assert _is_private_ip("10.0.0.1") is True
    assert _is_private_ip("172.16.0.1") is True
    assert _is_private_ip("172.31.255.255") is True
    assert _is_private_ip("192.168.1.1") is True

    # Link-local / Cloud metadata
    assert _is_private_ip("169.254.169.254") is True
    assert _is_private_ip("169.254.1.1") is True

    # Public IPs
    assert _is_private_ip("8.8.8.8") is False
    assert _is_private_ip("1.1.1.1") is False
    assert _is_private_ip("104.21.43.190") is False


def test_url_protocol_restriction():
    with pytest.raises(ValidationError, match="Unsupported protocol"):
        validate_url("ftp://example.com")

    with pytest.raises(ValidationError, match="Unsupported protocol"):
        validate_url("file:///etc/passwd")

    with pytest.raises(ValidationError, match="Unsupported protocol"):
        validate_url("gopher://example.com")


def test_blocked_cloud_metadata():
    with pytest.raises(ValidationError, match="Blocked hostname"):
        validate_url("http://169.254.169.254/latest/meta-data")

    with pytest.raises(ValidationError, match="Blocked hostname"):
        validate_url("http://metadata.google.internal")


def test_private_ip_in_url():
    with pytest.raises(ValidationError, match="Private, loopback, and reserved"):
        validate_url("http://127.0.0.1:8080")

    with pytest.raises(ValidationError, match="Private, loopback, and reserved"):
        validate_url("http://192.168.1.50/admin")
