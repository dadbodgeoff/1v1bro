"""
Property-based tests for API response envelope.

Feature: trivia-battle-mvp, Property 14: API Response Envelope
Validates: Requirements 9.2
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck

from app.core.responses import APIResponse


# Simple strategies for generating test data (avoiding slow recursive generation)
simple_values = st.one_of(
    st.none(),
    st.booleans(),
    st.integers(min_value=-1000, max_value=1000),
    st.text(max_size=50),
)

# Simple dict/list for data payloads
json_values = st.one_of(
    simple_values,
    st.lists(simple_values, max_size=3),
    st.dictionaries(st.text(min_size=1, max_size=10), simple_values, max_size=3),
)


class TestAPIResponseEnvelope:
    """
    Feature: trivia-battle-mvp, Property 14: API Response Envelope
    
    For any API response, it SHALL contain a "success" boolean field,
    and either "data" (on success) or "error" and "error_code" fields (on failure).
    """

    @given(data=json_values)
    @settings(max_examples=100)
    def test_ok_response_has_required_fields(self, data):
        """
        Property: Successful responses have success=True and data field.
        Feature: trivia-battle-mvp, Property 14: API Response Envelope
        Validates: Requirements 9.2
        """
        response = APIResponse.ok(data)
        
        # Must have success field as boolean
        assert isinstance(response.success, bool)
        assert response.success is True
        
        # Must have data field with the provided data
        assert response.data == data
        
        # Error fields should be None on success
        assert response.error is None
        assert response.error_code is None

    @given(
        error_msg=st.text(min_size=1, max_size=200),
        error_code=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
        details=json_values,
    )
    @settings(max_examples=100)
    def test_fail_response_has_required_fields(self, error_msg, error_code, details):
        """
        Property: Failed responses have success=False, error, and error_code fields.
        Feature: trivia-battle-mvp, Property 14: API Response Envelope
        Validates: Requirements 9.2
        """
        response = APIResponse.fail(error=error_msg, error_code=error_code, details=details)
        
        # Must have success field as boolean
        assert isinstance(response.success, bool)
        assert response.success is False
        
        # Must have error and error_code fields
        assert response.error == error_msg
        assert response.error_code == error_code
        
        # Details should match if provided
        assert response.details == details
        
        # Data should be None on failure
        assert response.data is None

    @given(data=json_values)
    @settings(max_examples=100)
    def test_response_serializes_to_valid_json(self, data):
        """
        Property: All responses can be serialized to valid JSON with required fields.
        Feature: trivia-battle-mvp, Property 14: API Response Envelope
        Validates: Requirements 9.2
        """
        response = APIResponse.ok(data)
        json_dict = response.model_dump()
        
        # Must contain all required fields
        assert "success" in json_dict
        assert "data" in json_dict
        assert "error" in json_dict
        assert "error_code" in json_dict
        assert "details" in json_dict

    @given(
        error_msg=st.text(min_size=1, max_size=100),
    )
    @settings(max_examples=100)
    def test_fail_with_default_error_code(self, error_msg):
        """
        Property: Failed responses use default error code when not specified.
        Feature: trivia-battle-mvp, Property 14: API Response Envelope
        Validates: Requirements 9.2
        """
        response = APIResponse.fail(error=error_msg)
        
        assert response.success is False
        assert response.error == error_msg
        assert response.error_code == "ERROR"  # Default value
        assert response.details is None
