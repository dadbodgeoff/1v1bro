"""
Integration test fixtures for real Supabase testing.
"""

import os
import sys
import uuid
from pathlib import Path
from typing import Generator

import pytest

# Add backend directory to path FIRST
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Force set real environment variables
os.environ["SUPABASE_URL"] = "https://ikbshpdvvkydbpirbahl.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnNocGR2dmt5ZGJwaXJiYWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTM3OTIsImV4cCI6MjA4MDI4OTc5Mn0.5JmbUYYKsxuQN3XLJxXll-W-gQH_ZsyNrtqzqDrYFk4"
os.environ["SUPABASE_SERVICE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnNocGR2dmt5ZGJwaXJiYWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzc5MiwiZXhwIjoyMDgwMjg5NzkyfQ.mfEmm6fURTaP4iVZA1gfxkY5f9R0LdcORv7GCox05-k"
os.environ["JWT_SECRET_KEY"] = "radaW+9e7ZvfIPsg7n4zRZRcIGiHi29i0i1/iSpG4+bhWKzPze5abaFcLHvFKrIuw3+WXp0BBC3DorhSBQR59w=="

# Clear any cached settings and supabase clients
from app.core.config import get_settings
from app.database.supabase_client import get_supabase_client, get_supabase_service_client
get_settings.cache_clear()
get_supabase_client.cache_clear()
get_supabase_service_client.cache_clear()

from fastapi.testclient import TestClient
from app.main import app
from app.database.supabase_client import get_supabase_client, get_supabase_service_client
from app.services.auth_service import AuthService
from app.services.lobby_service import LobbyService
from app.services.game_service import GameService


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def supabase_client():
    """Get real Supabase client."""
    return get_supabase_client()


@pytest.fixture(scope="module")
def supabase_service_client():
    """Get real Supabase service client (bypasses RLS)."""
    return get_supabase_service_client()


@pytest.fixture
def auth_service(supabase_client):
    """Get AuthService instance."""
    return AuthService(supabase_client)


@pytest.fixture
def lobby_service(supabase_client):
    """Get LobbyService instance."""
    return LobbyService(supabase_client)


@pytest.fixture
def game_service(supabase_client):
    """Get GameService instance."""
    return GameService(supabase_client)


@pytest.fixture
def test_user_email() -> str:
    """Generate unique test user email."""
    return f"test_{uuid.uuid4().hex[:8]}@gmail.com"


@pytest.fixture
def test_user_password() -> str:
    """Test user password."""
    return "TestPassword123!"


@pytest.fixture
def second_test_user_email() -> str:
    """Generate unique second test user email."""
    return f"test2_{uuid.uuid4().hex[:8]}@gmail.com"


def cleanup_test_user(service_client, user_id: str):
    """Clean up a test user and their data."""
    try:
        # Delete user profile
        service_client.table("user_profiles").delete().eq("id", user_id).execute()
        # Delete from auth (requires admin API, skip for now)
    except Exception:
        pass


def cleanup_test_lobby(service_client, lobby_id: str):
    """Clean up a test lobby."""
    try:
        service_client.table("lobbies").delete().eq("id", lobby_id).execute()
    except Exception:
        pass


def cleanup_test_game(service_client, game_id: str):
    """Clean up a test game."""
    try:
        service_client.table("games").delete().eq("id", game_id).execute()
    except Exception:
        pass
