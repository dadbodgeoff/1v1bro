"""
Base service class with common patterns.
"""

from typing import TypeVar, Generic

from supabase import Client

T = TypeVar("T")


class BaseService(Generic[T]):
    """
    Base service providing common patterns for business logic.
    Services handle business rules and orchestrate repository operations.
    """

    def __init__(self, client: Client):
        """
        Initialize service with Supabase client.
        
        Args:
            client: Supabase client for database operations
        """
        self.client = client
