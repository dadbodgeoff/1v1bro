"""
Shared pytest fixtures and configuration.

NOTE: This file should NOT import from app modules at the top level,
as that would trigger settings to be cached before integration tests
can set real environment variables.
"""

import os
import sys
from pathlib import Path

import pytest

# Add backend directory to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Load .env file if it exists (for integration tests with real Supabase)
from dotenv import load_dotenv
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)

# Only set test defaults if not already set (allows .env to take precedence)
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing")
os.environ.setdefault("DEBUG", "true")


@pytest.fixture
def test_settings():
    """Provide test settings (for property tests that don't need real Supabase)."""
    from app.core.config import Settings
    return Settings(
        SUPABASE_URL="https://test.supabase.co",
        SUPABASE_ANON_KEY="test-anon-key",
        SUPABASE_SERVICE_KEY="test-service-key",
        JWT_SECRET_KEY="test-secret-key",
        DEBUG=True,
    )
