"""
Supabase client factory.
Provides cached client instances for database operations.
"""

from functools import lru_cache
from typing import Optional

from supabase import create_client, Client

from app.core.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get Supabase client with anon key for user-context operations.
    Uses lru_cache to ensure only one client instance is created.
    """
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache()
def get_supabase_service_client() -> Client:
    """
    Get Supabase client with service key for admin operations.
    Use this for operations that bypass RLS (Row Level Security).
    """
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_client_for_user(access_token: Optional[str] = None) -> Client:
    """
    Get a Supabase client configured for a specific user's session.
    If no token provided, returns the anon client.
    """
    if not access_token:
        return get_supabase_client()
    
    settings = get_settings()
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    # Set the auth token for this client
    client.auth.set_session(access_token, "")
    return client
