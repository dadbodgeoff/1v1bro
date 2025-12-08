"""
Shop Rotation Repository - Database operations for shop rotations.
Requirements: 3.3, 3.4
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class ShopRotationRepository:
    """Repository for shop rotation database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _table(self):
        return self._client.table("shop_rotations")

    async def create(self, data: dict) -> Optional[dict]:
        """Create a new shop rotation."""
        data.setdefault("created_at", datetime.utcnow().isoformat())
        result = self._table().insert(data).execute()
        return result.data[0] if result.data else None

    async def get(self, rotation_id: str) -> Optional[dict]:
        """Get a rotation by ID."""
        result = (
            self._table()
            .select("*")
            .eq("id", rotation_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_active(self) -> Optional[dict]:
        """Get the currently active rotation."""
        now = datetime.utcnow().isoformat()
        result = (
            self._table()
            .select("*")
            .eq("is_active", True)
            .lte("starts_at", now)
            .or_(f"ends_at.is.null,ends_at.gte.{now}")
            .order("starts_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_scheduled(self) -> List[dict]:
        """Get all scheduled (future) rotations."""
        now = datetime.utcnow().isoformat()
        result = (
            self._table()
            .select("*")
            .gt("starts_at", now)
            .order("starts_at")
            .execute()
        )
        return result.data or []

    async def get_all(self, limit: int = 50, offset: int = 0) -> List[dict]:
        """Get all rotations."""
        result = (
            self._table()
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    async def update(self, rotation_id: str, data: dict) -> Optional[dict]:
        """Update a rotation."""
        result = (
            self._table()
            .update(data)
            .eq("id", rotation_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete(self, rotation_id: str) -> bool:
        """Delete a rotation."""
        result = self._table().delete().eq("id", rotation_id).execute()
        return bool(result.data)

    async def set_active(self, rotation_id: str, is_active: bool) -> Optional[dict]:
        """Set the active status of a rotation."""
        return await self.update(rotation_id, {"is_active": is_active})

    async def deactivate_all(self) -> int:
        """Deactivate all rotations."""
        result = (
            self._table()
            .update({"is_active": False})
            .eq("is_active", True)
            .execute()
        )
        return len(result.data) if result.data else 0
