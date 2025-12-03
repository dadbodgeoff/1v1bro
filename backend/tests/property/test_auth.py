"""
Property-based tests for authentication.

Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
Validates: Requirements 9.4
"""

import pytest
from hypothesis import given, strategies as st, settings
from datetime import datetime, timedelta
from jose import jwt

from app.middleware.auth import create_jwt_token, decode_jwt_token
from app.core.config import get_settings
from app.core.exceptions import AuthenticationError


test_settings = get_settings()


class TestProtectedEndpointAuthentication:
    """
    Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
    
    For any request to a protected endpoint without a valid JWT token,
    the system SHALL return HTTP 401 Unauthorized.
    """

    @given(
        user_id=st.uuids().map(str),
        email=st.emails(),
    )
    @settings(max_examples=100)
    def test_valid_token_can_be_decoded(self, user_id, email):
        """
        Property: Valid tokens can be decoded to retrieve user info.
        Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
        Validates: Requirements 9.4
        """
        token = create_jwt_token(user_id, email)
        payload = decode_jwt_token(token)
        
        assert payload["sub"] == user_id
        assert payload["email"] == email
        assert "exp" in payload
        assert "iat" in payload

    @given(user_id=st.uuids().map(str))
    @settings(max_examples=100)
    def test_token_contains_required_claims(self, user_id):
        """
        Property: All tokens contain required claims (sub, exp, iat, type).
        Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
        Validates: Requirements 9.4
        """
        token = create_jwt_token(user_id)
        payload = decode_jwt_token(token)
        
        # Required claims
        assert "sub" in payload
        assert "exp" in payload
        assert "iat" in payload
        assert "type" in payload
        assert payload["type"] == "access"

    @given(invalid_token=st.text(min_size=10, max_size=100))
    @settings(max_examples=100)
    def test_invalid_token_raises_error(self, invalid_token):
        """
        Property: Invalid tokens raise AuthenticationError.
        Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
        Validates: Requirements 9.4
        """
        with pytest.raises(AuthenticationError):
            decode_jwt_token(invalid_token)

    @given(user_id=st.uuids().map(str))
    @settings(max_examples=50)
    def test_expired_token_is_detected(self, user_id):
        """
        Property: Expired tokens are detected during validation.
        Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
        Validates: Requirements 9.4
        """
        # Create an expired token manually
        expire = datetime.utcnow() - timedelta(hours=1)
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow() - timedelta(hours=2),
            "type": "access",
        }
        expired_token = jwt.encode(
            to_encode,
            test_settings.JWT_SECRET_KEY,
            algorithm=test_settings.JWT_ALGORITHM,
        )
        
        # Decoding should fail due to expiration
        with pytest.raises(Exception):  # jose raises ExpiredSignatureError
            decode_jwt_token(expired_token)

    @given(user_id=st.uuids().map(str))
    @settings(max_examples=50)
    def test_token_with_wrong_secret_fails(self, user_id):
        """
        Property: Tokens signed with wrong secret are rejected.
        Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
        Validates: Requirements 9.4
        """
        # Create token with different secret
        expire = datetime.utcnow() + timedelta(hours=1)
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access",
        }
        wrong_secret_token = jwt.encode(
            to_encode,
            "wrong-secret-key",
            algorithm=test_settings.JWT_ALGORITHM,
        )
        
        with pytest.raises(AuthenticationError):
            decode_jwt_token(wrong_secret_token)

    @given(
        user_id=st.uuids().map(str),
        email=st.emails(),
    )
    @settings(max_examples=100)
    def test_token_roundtrip(self, user_id, email):
        """
        Property: Creating and decoding a token preserves user information.
        Feature: trivia-battle-mvp, Property 16: Protected Endpoint Authentication
        Validates: Requirements 9.4
        """
        # Create token
        token = create_jwt_token(user_id, email)
        
        # Decode token
        payload = decode_jwt_token(token)
        
        # Verify roundtrip
        assert payload["sub"] == user_id
        assert payload["email"] == email
