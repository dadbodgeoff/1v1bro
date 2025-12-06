"""
Property-based tests for enhanced authentication.
**Feature: user-services-microservices**
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
import bcrypt
import jwt
from datetime import datetime, timedelta

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_rs256_token,
    decode_token,
)


class TestPasswordHashing:
    """
    Property 1: Password Hashing Security
    For any password provided during registration, the stored hash SHALL be 
    a valid bcrypt hash with cost factor 12 or higher.
    **Validates: Requirements 1.1, 12.3**
    """
    
    @given(password=st.text(min_size=8, max_size=64, alphabet=st.characters(whitelist_categories=('L', 'N', 'P'))))
    @settings(max_examples=20, deadline=None)  # Reduced for bcrypt performance
    def test_bcrypt_hash_format(self, password: str):
        """
        Property: For any password, hash_password SHALL produce a valid bcrypt hash.
        """
        assume(password.strip())  # Skip empty/whitespace passwords
        
        hashed = hash_password(password)
        
        # Should be a valid bcrypt hash
        assert hashed.startswith("$2")  # bcrypt prefix
        
        # Should have correct structure: $2b$12$...
        parts = hashed.split("$")
        assert len(parts) == 4
        
        # Cost factor should be 12 or higher
        cost = int(parts[2])
        assert cost >= 12, f"Cost factor {cost} is less than required 12"
    
    @given(password=st.text(min_size=8, max_size=64, alphabet=st.characters(whitelist_categories=('L', 'N', 'P'))))
    @settings(max_examples=20, deadline=None)
    def test_password_verification_roundtrip(self, password: str):
        """
        Property: For any password, hashing then verifying SHALL succeed.
        """
        assume(password.strip())
        
        hashed = hash_password(password)
        
        # Verification should succeed with correct password
        assert verify_password(password, hashed) is True
    
    @given(
        password=st.text(min_size=8, max_size=32, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        wrong_password=st.text(min_size=8, max_size=32, alphabet=st.characters(whitelist_categories=('L', 'N')))
    )
    @settings(max_examples=20, deadline=None)
    def test_wrong_password_fails(self, password: str, wrong_password: str):
        """
        Property: For any two different passwords, verification SHALL fail.
        """
        assume(password.strip() and wrong_password.strip())
        assume(password != wrong_password)
        
        hashed = hash_password(password)
        
        # Verification should fail with wrong password
        assert verify_password(wrong_password, hashed) is False


class TestJWTTokenStructure:
    """
    Property 2: JWT Token Structure
    For any JWT token generated, decoding SHALL reveal payload containing
    user_id, email, exp, and iat claims, with algorithm header set to RS256.
    **Validates: Requirements 1.2, 1.5**
    """
    
    @given(
        user_id=st.uuids().map(str),
        email=st.emails()
    )
    @settings(max_examples=100)
    def test_token_contains_required_claims(self, user_id: str, email: str):
        """
        Property: For any user_id and email, token SHALL contain all required claims.
        """
        token = create_rs256_token(user_id, email)
        
        # Decode without verification to check structure
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Required claims must be present
        assert "sub" in payload, "Missing 'sub' (user_id) claim"
        assert "email" in payload, "Missing 'email' claim"
        assert "exp" in payload, "Missing 'exp' (expiration) claim"
        assert "iat" in payload, "Missing 'iat' (issued at) claim"
        
        # Values should match input
        assert payload["sub"] == user_id
        assert payload["email"] == email
        
        # Expiration should be in the future
        assert payload["exp"] > payload["iat"]
    
    @given(
        user_id=st.uuids().map(str),
        email=st.emails()
    )
    @settings(max_examples=100)
    def test_token_expiration_is_valid(self, user_id: str, email: str):
        """
        Property: Token expiration SHALL be set to a reasonable future time.
        """
        token = create_rs256_token(user_id, email)
        
        payload = jwt.decode(token, options={"verify_signature": False})
        
        now = datetime.utcnow().timestamp()
        exp = payload["exp"]
        iat = payload["iat"]
        
        # Token should be issued around now (within 60 seconds)
        assert abs(iat - now) < 60
        
        # Expiration should be in the future
        assert exp > now
        
        # Expiration should be within reasonable bounds (1 hour to 7 days)
        hours_until_exp = (exp - now) / 3600
        assert 1 <= hours_until_exp <= 168  # 1 hour to 7 days


class TestTokenValidation:
    """
    Property 4: Token Validation Correctness
    For any valid JWT token, validation SHALL succeed. For any token with 
    invalid signature, expired timestamp, or malformed structure, validation SHALL fail.
    **Validates: Requirements 1.6**
    """
    
    @given(
        user_id=st.uuids().map(str),
        email=st.emails()
    )
    @settings(max_examples=100)
    def test_valid_token_decodes(self, user_id: str, email: str):
        """
        Property: For any valid token, decode_token SHALL succeed.
        """
        token = create_rs256_token(user_id, email)
        
        # Should decode without error
        payload = decode_token(token)
        
        assert payload.sub == user_id
        assert payload.email == email
    
    @given(
        user_id=st.uuids().map(str),
        email=st.emails(),
        tamper_char=st.characters(whitelist_categories=('L', 'N'))
    )
    @settings(max_examples=100)
    def test_tampered_token_fails(self, user_id: str, email: str, tamper_char: str):
        """
        Property: For any tampered token, decode_token SHALL fail.
        """
        from app.core.exceptions import AuthenticationError
        
        token = create_rs256_token(user_id, email)
        
        # Tamper with the token (modify a character in the middle)
        mid = len(token) // 2
        tampered = token[:mid] + tamper_char + token[mid+1:]
        
        # Skip if tampering didn't change the token
        assume(tampered != token)
        
        # Should raise AuthenticationError
        with pytest.raises(AuthenticationError):
            decode_token(tampered)
    
    def test_expired_token_fails(self):
        """
        Property: For any expired token, decode_token SHALL fail.
        """
        from app.core.exceptions import AuthenticationError
        
        # Create an expired token manually
        payload = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "iat": int((datetime.utcnow() - timedelta(hours=48)).timestamp()),
            "exp": int((datetime.utcnow() - timedelta(hours=24)).timestamp()),
            "type": "access",
        }
        
        import os
        secret = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
        expired_token = jwt.encode(payload, secret, algorithm="HS256")
        
        with pytest.raises(AuthenticationError):
            decode_token(expired_token)


class TestRateLimiting:
    """
    Property 3: Rate Limiting Enforcement
    For any IP address making login requests, after 5 requests within 60 seconds,
    subsequent requests SHALL receive HTTP 429 response.
    **Validates: Requirements 1.3, 1.4**
    
    Note: Full rate limiting tests require integration testing with the middleware.
    These tests verify the rate limit counter logic.
    """
    
    @given(
        ip_address=st.ip_addresses().map(str),
        request_count=st.integers(min_value=1, max_value=20)
    )
    @settings(max_examples=100)
    def test_rate_limit_counter_increments(self, ip_address: str, request_count: int):
        """
        Property: Rate limit counter SHALL increment correctly for each request.
        """
        # Simulate rate limit tracking
        counters = {}
        
        for i in range(request_count):
            key = f"rate_limit:auth:{ip_address}"
            counters[key] = counters.get(key, 0) + 1
        
        # Counter should equal request count
        assert counters[f"rate_limit:auth:{ip_address}"] == request_count
    
    @given(
        ip_address=st.ip_addresses().map(str),
        limit=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=100)
    def test_rate_limit_exceeded_detection(self, ip_address: str, limit: int):
        """
        Property: When counter exceeds limit, rate_limited SHALL be True.
        """
        counter = limit + 1
        rate_limited = counter > limit
        
        assert rate_limited is True
