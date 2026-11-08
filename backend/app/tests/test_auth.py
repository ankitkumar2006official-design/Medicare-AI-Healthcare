import pytest
from app.auth import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    pw = "MediGuardSecure2026!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_generation_and_decoding():
    payload = {"sub": "user-test-01", "role": "doctor", "email": "doctor@mediguard.ai"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "user-test-01"
    assert decoded["role"] == "doctor"
    assert decoded["email"] == "doctor@mediguard.ai"
