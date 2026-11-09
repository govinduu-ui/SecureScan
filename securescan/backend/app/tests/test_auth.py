import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


def test_password_hashing():
    raw_password = "SecurePassword123!"
    hashed = hash_password(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_lifecycle():
    data = {"sub": "user_uuid_12345", "email": "secops@securescan.internal"}
    token = create_access_token(data)

    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user_uuid_12345"
    assert payload["email"] == "secops@securescan.internal"


def test_invalid_jwt_token():
    payload = decode_access_token("invalid.token.string")
    assert payload is None

