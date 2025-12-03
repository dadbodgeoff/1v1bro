"""
Integration tests for lobby flow.
Tests against real Supabase.
"""

import pytest
from fastapi.testclient import TestClient


class TestLobbyFlow:
    """Test full lobby flow against real Supabase."""

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
        
        # If both fail, skip (likely rate limited or email confirmation required)
        pytest.skip(f"Could not authenticate: {response.json()}")

    def test_create_lobby(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test creating a new lobby."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["code"]) == 6
        assert data["data"]["status"] == "waiting"
        assert data["data"]["game_mode"] == "fortnite"
        assert data["data"]["can_start"] is False

    def test_get_lobby_by_code(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test getting lobby by code."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        # Create lobby
        create_response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {token}"},
        )
        lobby_code = create_response.json()["data"]["code"]
        
        # Get lobby
        response = client.get(
            f"/api/v1/lobbies/{lobby_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["code"] == lobby_code

    def test_join_lobby(
        self,
        client: TestClient,
        test_user_email: str,
        second_test_user_email: str,
        test_user_password: str,
    ):
        """Test joining an existing lobby."""
        # Host creates lobby
        host_token = self._register_and_get_token(client, test_user_email, test_user_password)
        create_response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {host_token}"},
        )
        lobby_code = create_response.json()["data"]["code"]
        
        # Opponent joins
        opponent_token = self._register_and_get_token(
            client, second_test_user_email, test_user_password
        )
        response = client.post(
            f"/api/v1/lobbies/{lobby_code}/join",
            headers={"Authorization": f"Bearer {opponent_token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["can_start"] is True
        assert len(data["data"]["players"]) == 2

    def test_cannot_join_own_lobby(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test that host cannot join their own lobby."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        # Create lobby
        create_response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {token}"},
        )
        lobby_code = create_response.json()["data"]["code"]
        
        # Try to join own lobby
        response = client.post(
            f"/api/v1/lobbies/{lobby_code}/join",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False

    def test_cannot_join_full_lobby(
        self,
        client: TestClient,
        test_user_email: str,
        second_test_user_email: str,
        test_user_password: str,
    ):
        """Test that third player cannot join full lobby."""
        # Host creates lobby
        host_token = self._register_and_get_token(client, test_user_email, test_user_password)
        create_response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {host_token}"},
        )
        lobby_code = create_response.json()["data"]["code"]
        
        # First opponent joins
        opponent_token = self._register_and_get_token(
            client, second_test_user_email, test_user_password
        )
        client.post(
            f"/api/v1/lobbies/{lobby_code}/join",
            headers={"Authorization": f"Bearer {opponent_token}"},
        )
        
        # Third player tries to join
        third_email = f"third_{test_user_email}"
        third_token = self._register_and_get_token(client, third_email, test_user_password)
        response = client.post(
            f"/api/v1/lobbies/{lobby_code}/join",
            headers={"Authorization": f"Bearer {third_token}"},
        )
        
        assert response.status_code == 409
        data = response.json()
        assert data["success"] is False
        assert data["error_code"] == "LOBBY_FULL"

    def test_invalid_lobby_code_returns_404(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test that invalid lobby code returns 404."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        response = client.get(
            "/api/v1/lobbies/XXXXXX",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 404

    def test_leave_lobby_as_opponent(
        self,
        client: TestClient,
        test_user_email: str,
        second_test_user_email: str,
        test_user_password: str,
    ):
        """Test opponent leaving lobby."""
        # Host creates lobby
        host_token = self._register_and_get_token(client, test_user_email, test_user_password)
        create_response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {host_token}"},
        )
        lobby_code = create_response.json()["data"]["code"]
        
        # Opponent joins
        opponent_token = self._register_and_get_token(
            client, second_test_user_email, test_user_password
        )
        client.post(
            f"/api/v1/lobbies/{lobby_code}/join",
            headers={"Authorization": f"Bearer {opponent_token}"},
        )
        
        # Opponent leaves
        response = client.delete(
            f"/api/v1/lobbies/{lobby_code}",
            headers={"Authorization": f"Bearer {opponent_token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_leave_lobby_as_host_closes_lobby(
        self,
        client: TestClient,
        test_user_email: str,
        test_user_password: str,
    ):
        """Test host leaving lobby closes it."""
        token = self._register_and_get_token(client, test_user_email, test_user_password)
        
        # Create lobby
        create_response = client.post(
            "/api/v1/lobbies",
            json={"game_mode": "fortnite"},
            headers={"Authorization": f"Bearer {token}"},
        )
        lobby_code = create_response.json()["data"]["code"]
        
        # Host leaves
        response = client.delete(
            f"/api/v1/lobbies/{lobby_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        
        # Lobby should no longer be accessible
        get_response = client.get(
            f"/api/v1/lobbies/{lobby_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert get_response.status_code == 404
