"""
Integration tests for game history endpoints.
Tests against real Supabase.
"""

import pytest
from fastapi.testclient import TestClient


class TestGameFlow:
    """Test game history endpoints against real Supabase."""

    def _register_and_get_token(
        self, client: TestClient, email: str, password: str
    ) -> str:
        """Helper to register user and get token."""
        response = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password},
        )
        if response.status_code == 201 and response.json().get("data"):
            return response.json()["data"]["access_token"]
        
        # Check for rate limiting
        error_msg = response.json().get("error", "")
        if "rate limit" in error_msg.lower():
            pytest.skip("Supabase email rate limit exceeded")
        
        # If already registered, try login
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        if response.status_code == 200 and response.json().get("data"):
            return response.json()["data"]["access_token"]
        
        pytest.skip(f"Could not authenticate: {response.json()}")

    def test_get_game_history_empty(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test getting game history for user with no games."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        response = client.get(
            "/api/v1/games/history",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    def test_get_game_history_with_limit(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test getting game history with limit parameter."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        response = client.get(
            "/api/v1/games/history?limit=5",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_get_game_history_requires_auth(self, client: TestClient):
        """Test that game history requires authentication."""
        response = client.get("/api/v1/games/history")
        
        assert response.status_code == 401

    def test_get_nonexistent_game_returns_404(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test getting a game that doesn't exist returns 404."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        response = client.get(
            "/api/v1/games/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 404
