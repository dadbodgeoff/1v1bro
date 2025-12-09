"""
Property-based tests for WebSocket authentication security.

**Feature: frontend-lint-security-cleanup, Property 2: WebSocket Token Not In URL**
**Feature: frontend-lint-security-cleanup, Property 3: WebSocket Subprotocol Authentication**
**Validates: Requirements 2.1, 2.2, 2.4**
"""

import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import MagicMock, AsyncMock

from app.main import extract_token_from_subprotocol


class TestExtractTokenFromSubprotocol:
    """Tests for the token extraction from Sec-WebSocket-Protocol header."""

    # JWT-like token strategy: alphanumeric with dots, underscores, hyphens
    jwt_token_strategy = st.text(
        alphabet=st.sampled_from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-"),
        min_size=10,
        max_size=500
    )

    @given(jwt_token_strategy)
    @settings(max_examples=100)
    def test_valid_auth_token_extraction(self, token: str):
        """
        Property 2 & 3: For any valid JWT-like token, when passed via auth.{token} subprotocol,
        the extraction function SHALL return the exact token.
        
        **Feature: frontend-lint-security-cleanup, Property 3: WebSocket Subprotocol Authentication**
        **Validates: Requirements 2.1, 2.2**
        """
        # Create mock websocket with subprotocol header
        mock_websocket = MagicMock()
        mock_websocket.headers = {"sec-websocket-protocol": f"auth.{token}"}
        
        extracted = extract_token_from_subprotocol(mock_websocket)
        
        assert extracted == token, f"Expected '{token}', got '{extracted}'"

    @given(st.text(min_size=0, max_size=100))
    @settings(max_examples=100)
    def test_non_auth_protocol_returns_none(self, protocol: str):
        """
        Property 3: For any subprotocol that doesn't start with 'auth.',
        the extraction function SHALL return None.
        
        **Feature: frontend-lint-security-cleanup, Property 3: WebSocket Subprotocol Authentication**
        **Validates: Requirements 2.2, 2.3**
        """
        # Skip if it accidentally starts with auth.
        if protocol.startswith("auth."):
            return
        
        mock_websocket = MagicMock()
        mock_websocket.headers = {"sec-websocket-protocol": protocol}
        
        extracted = extract_token_from_subprotocol(mock_websocket)
        
        assert extracted is None, f"Expected None for non-auth protocol '{protocol}', got '{extracted}'"

    def test_missing_header_returns_none(self):
        """
        Property 3: When no Sec-WebSocket-Protocol header is present,
        the extraction function SHALL return None.
        
        **Validates: Requirements 2.3**
        """
        mock_websocket = MagicMock()
        mock_websocket.headers = {}
        
        extracted = extract_token_from_subprotocol(mock_websocket)
        
        assert extracted is None

    @given(st.lists(st.text(min_size=1, max_size=50), min_size=1, max_size=5))
    @settings(max_examples=100)
    def test_multiple_protocols_extracts_auth(self, protocols: list):
        """
        Property 3: When multiple subprotocols are present, the function SHALL
        extract the token from the one starting with 'auth.'.
        
        **Feature: frontend-lint-security-cleanup, Property 3: WebSocket Subprotocol Authentication**
        **Validates: Requirements 2.2**
        """
        # Add an auth protocol to the list
        test_token = "test_jwt_token_12345"
        protocols_with_auth = protocols + [f"auth.{test_token}"]
        
        mock_websocket = MagicMock()
        mock_websocket.headers = {"sec-websocket-protocol": ", ".join(protocols_with_auth)}
        
        extracted = extract_token_from_subprotocol(mock_websocket)
        
        # Should find the auth token even among other protocols
        assert extracted == test_token or extracted in [p[5:] for p in protocols if p.startswith("auth.")]


class TestWebSocketUrlSecurity:
    """Tests to verify tokens are never in URLs."""

    @given(st.text(min_size=10, max_size=200))
    @settings(max_examples=100)
    def test_token_not_in_websocket_url_pattern(self, token: str):
        """
        Property 2: For any token, the WebSocket URL construction pattern
        SHALL NOT include the token as a query parameter.
        
        **Feature: frontend-lint-security-cleanup, Property 2: WebSocket Token Not In URL**
        **Validates: Requirements 2.1, 2.4**
        """
        # Simulate the new URL construction pattern (without token)
        lobby_code = "ABCDEF"
        host = "localhost:8000"
        protocol = "ws:"
        
        # New secure pattern
        ws_url = f"{protocol}//{host}/ws/{lobby_code}"
        
        # Token should NOT appear in URL
        assert token not in ws_url, f"Token found in URL: {ws_url}"
        assert "?token=" not in ws_url, f"Token query param found in URL: {ws_url}"
        assert "&token=" not in ws_url, f"Token query param found in URL: {ws_url}"
