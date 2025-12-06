"""
Property-based tests for API layer.

Feature: trivia-battle-mvp, Property 15: Request Validation
Validates: Requirements 9.1
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.lobby import LobbyCreate, LobbyJoin
from app.schemas.ws_messages import AnswerPayload


class TestRequestValidation:
    """
    Feature: trivia-battle-mvp, Property 15: Request Validation
    
    For any API request with invalid data according to the Pydantic schema,
    the system SHALL return HTTP 422 with validation error details.
    """

    @given(
        local_part=st.text(
            min_size=1,
            max_size=20,
            alphabet="abcdefghijklmnopqrstuvwxyz0123456789._-",
        ).filter(lambda x: x and x[0].isalnum() and not x.endswith('.') and '..' not in x),
        domain=st.text(
            min_size=2,
            max_size=10,
            alphabet="abcdefghijklmnopqrstuvwxyz0123456789",
        ).filter(lambda x: len(x) >= 2 and x[0].isalpha()),
        password=st.text(
            min_size=6,
            max_size=50,
            alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%",
        ),
    )
    @settings(max_examples=100)
    def test_valid_login_request_passes(self, local_part, domain, password):
        """
        Property: Valid login requests pass validation.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        email = f"{local_part}@{domain}.com"
        request = LoginRequest(email=email, password=password)
        # Email is validated and stored
        assert "@" in request.email
        assert request.password == password

    @given(password=st.text(min_size=1, max_size=5))
    @settings(max_examples=50)
    def test_short_password_rejected(self, password):
        """
        Property: Passwords shorter than 6 characters are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        assume(len(password) < 6)
        with pytest.raises(ValidationError):
            LoginRequest(email="test@example.com", password=password)

    @given(email=st.text(min_size=1, max_size=50).filter(lambda x: "@" not in x))
    @settings(max_examples=50)
    def test_invalid_email_rejected(self, email):
        """
        Property: Invalid email formats are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        with pytest.raises(ValidationError):
            LoginRequest(email=email, password="validpassword")

    @given(
        local_part=st.text(
            min_size=1,
            max_size=20,
            alphabet="abcdefghijklmnopqrstuvwxyz0123456789",
        ).filter(lambda x: x and x[0].isalnum()),
        domain=st.text(
            min_size=2,
            max_size=10,
            alphabet="abcdefghijklmnopqrstuvwxyz",
        ).filter(lambda x: len(x) >= 2 and x[0].isalpha()),
        password=st.text(
            min_size=6,
            max_size=50,
            alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        ),
        display_name=st.one_of(
            st.none(),
            st.text(
                min_size=2,
                max_size=50,
                alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            ),
        ),
    )
    @settings(max_examples=100)
    def test_valid_register_request_passes(self, local_part, domain, password, display_name):
        """
        Property: Valid register requests pass validation.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        email = f"{local_part}@{domain}.com"
        request = RegisterRequest(
            email=email,
            password=password,
            display_name=display_name,
        )
        # Email is validated and stored
        assert "@" in request.email
        assert request.password == password

    @given(
        display_name=st.text(
            min_size=51,
            max_size=100,
            alphabet="abcdefghijklmnopqrstuvwxyz0123456789",
        )
    )
    @settings(max_examples=50)
    def test_long_display_name_rejected(self, display_name):
        """
        Property: Display names longer than 50 characters are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        # Ensure we have a truly long name (no whitespace stripping)
        assume(len(display_name) > 50)
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@example.com",
                password="validpassword",
                display_name=display_name,
            )


class TestLobbyRequestValidation:
    """Tests for lobby request validation."""

    @given(code=st.text(alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", min_size=6, max_size=6))
    @settings(max_examples=100)
    def test_valid_lobby_code_passes(self, code):
        """
        Property: Valid 6-character lobby codes pass validation.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        request = LobbyJoin(code=code)
        assert len(request.code) == 6

    @given(code=st.text(max_size=5))
    @settings(max_examples=50)
    def test_short_lobby_code_rejected(self, code):
        """
        Property: Lobby codes shorter than 6 characters are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        assume(len(code) < 6)
        with pytest.raises(ValidationError):
            LobbyJoin(code=code)

    @given(code=st.text(min_size=7, max_size=20, alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"))
    @settings(max_examples=50)
    def test_long_lobby_code_rejected(self, code):
        """
        Property: Lobby codes longer than 6 characters are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        assume(len(code) > 6)
        with pytest.raises(ValidationError):
            LobbyJoin(code=code)


class TestAnswerPayloadValidation:
    """Tests for answer payload validation."""

    @given(
        q_num=st.integers(min_value=1, max_value=15),
        answer=st.sampled_from(["A", "B", "C", "D"]),
        time_ms=st.integers(min_value=0, max_value=30000),
    )
    @settings(max_examples=100)
    def test_valid_answer_payload_passes(self, q_num, answer, time_ms):
        """
        Property: Valid answer payloads pass validation.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        payload = AnswerPayload(q_num=q_num, answer=answer, time_ms=time_ms)
        assert payload.q_num == q_num
        assert payload.answer == answer
        assert payload.time_ms == time_ms

    @given(q_num=st.integers(max_value=0))
    @settings(max_examples=50)
    def test_invalid_question_number_rejected(self, q_num):
        """
        Property: Question numbers below 1 are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        with pytest.raises(ValidationError):
            AnswerPayload(q_num=q_num, answer="A", time_ms=5000)

    @given(time_ms=st.integers(min_value=30001, max_value=100000))
    @settings(max_examples=50)
    def test_time_over_30s_rejected(self, time_ms):
        """
        Property: Answer times over 30000ms are rejected.
        Feature: trivia-battle-mvp, Property 15: Request Validation
        Validates: Requirements 9.1
        """
        with pytest.raises(ValidationError):
            AnswerPayload(q_num=1, answer="A", time_ms=time_ms)
