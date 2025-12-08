"""
Asset Metadata Repository - Database operations for asset metadata.
Requirements: 6.3
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class AssetMetadataRepository:
    """Repository for asset metadata database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _table(self):
        return self._client.table("asset_metadata")

    async def create(
        self,
        cosmetic_id: str,
        asset_type: str,
        storage_path: str,
        public_url: str,
        content_type: str,
        file_size: int,
        width: Optional[int] = None,
        height: Optional[int] = None,
        frame_count: Optional[int] = None,
        uploaded_by: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Create asset metadata record.
        
        Property 19: Asset metadata completeness - stores all required fields.
        
        Args:
            cosmetic_id: ID of the associated cosmetic
            asset_type: Type of asset (image, sprite_sheet, sprite_meta, video)
            storage_path: Path in storage bucket
            public_url: Public URL for the asset
            content_type: MIME type
            file_size: Size in bytes
            width: Image width (optional)
            height: Image height (optional)
            frame_count: Number of frames for sprite sheets (optional)
            uploaded_by: User ID who uploaded (optional)
            
        Returns:
            Created metadata record or None
        """
        data = {
            "cosmetic_id": cosmetic_id,
            "asset_type": asset_type,
            "storage_path": storage_path,
            "public_url": public_url,
            "content_type": content_type,
            "file_size": file_size,
            "uploaded_at": datetime.utcnow().isoformat(),
        }
        
        if width is not None:
            data["width"] = width
        if height is not None:
            data["height"] = height
        if frame_count is not None:
            data["frame_count"] = frame_count
        if uploaded_by:
            data["uploaded_by"] = uploaded_by
        
        result = self._table().insert(data).execute()
        return result.data[0] if result.data else None

    async def get_by_cosmetic(self, cosmetic_id: str) -> List[dict]:
        """Get all asset metadata for a cosmetic."""
        result = (
            self._table()
            .select("*")
            .eq("cosmetic_id", cosmetic_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_by_type(self, cosmetic_id: str, asset_type: str) -> Optional[dict]:
        """Get asset metadata by cosmetic and type."""
        result = (
            self._table()
            .select("*")
            .eq("cosmetic_id", cosmetic_id)
            .eq("asset_type", asset_type)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_by_cosmetic(self, cosmetic_id: str) -> int:
        """Delete all asset metadata for a cosmetic."""
        result = (
            self._table()
            .delete()
            .eq("cosmetic_id", cosmetic_id)
            .execute()
        )
        return len(result.data) if result.data else 0

    async def delete(self, metadata_id: str) -> bool:
        """Delete a specific metadata record."""
        result = (
            self._table()
            .delete()
            .eq("id", metadata_id)
            .execute()
        )
        return bool(result.data)
