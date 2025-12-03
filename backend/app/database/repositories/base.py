"""
Base repository with generic CRUD operations.
All entity repositories inherit from this class.
"""

from typing import Any, Generic, Optional, TypeVar

from supabase import Client

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """
    Generic repository providing common CRUD operations.
    
    Subclasses should specify the table_name and can override
    methods for custom behavior.
    """

    def __init__(self, client: Client, table_name: str):
        """
        Initialize repository with Supabase client and table name.
        
        Args:
            client: Supabase client instance
            table_name: Name of the database table
        """
        self.client = client
        self.table_name = table_name

    def _table(self):
        """Get table reference for queries."""
        return self.client.table(self.table_name)

    async def get_by_id(self, id: str) -> Optional[dict]:
        """
        Get a single record by ID.
        
        Args:
            id: Record UUID
            
        Returns:
            Record dict or None if not found
        """
        result = self._table().select("*").eq("id", id).execute()
        return result.data[0] if result.data else None

    async def get_all(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """
        Get all records with pagination.
        
        Args:
            limit: Maximum records to return
            offset: Number of records to skip
            
        Returns:
            List of record dicts
        """
        result = self._table().select("*").range(offset, offset + limit - 1).execute()
        return result.data

    async def create(self, data: dict) -> dict:
        """
        Create a new record.
        
        Args:
            data: Record data to insert
            
        Returns:
            Created record dict
        """
        result = self._table().insert(data).execute()
        return result.data[0]

    async def update(self, id: str, data: dict) -> Optional[dict]:
        """
        Update an existing record.
        
        Args:
            id: Record UUID
            data: Fields to update
            
        Returns:
            Updated record dict or None if not found
        """
        result = self._table().update(data).eq("id", id).execute()
        return result.data[0] if result.data else None

    async def delete(self, id: str) -> bool:
        """
        Delete a record by ID.
        
        Args:
            id: Record UUID
            
        Returns:
            True if deleted, False if not found
        """
        result = self._table().delete().eq("id", id).execute()
        return len(result.data) > 0

    async def exists(self, id: str) -> bool:
        """
        Check if a record exists.
        
        Args:
            id: Record UUID
            
        Returns:
            True if exists, False otherwise
        """
        result = self._table().select("id").eq("id", id).execute()
        return len(result.data) > 0

    async def count(self, filters: Optional[dict[str, Any]] = None) -> int:
        """
        Count records matching optional filters.
        
        Args:
            filters: Optional dict of field=value filters
            
        Returns:
            Count of matching records
        """
        query = self._table().select("*", count="exact")
        if filters:
            for field, value in filters.items():
                query = query.eq(field, value)
        result = query.execute()
        return result.count or 0
