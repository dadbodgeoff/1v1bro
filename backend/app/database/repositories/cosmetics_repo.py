"""
Cosmetics repository - Database operations for cosmetics, inventory, and loadouts.
Requirements: 3.3-3.6
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class CosmeticsRepository:
    """Repository for cosmetics database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _catalog(self):
        return self._client.table("cosmetics_catalog")

    def _inventory(self):
        return self._client.table("inventory")

    def _loadouts(self):
        return self._client.table("loadouts")

    # ============================================
    # Catalog Operations
    # ============================================

    async def get_shop(
        self,
        type_filter: Optional[str] = None,
        rarity_filter: Optional[str] = None,
        event_filter: Optional[str] = None,
        is_limited: Optional[bool] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get cosmetics from catalog with optional filtering.
        
        Only returns items where shop_available = true (excludes battle pass items).
        
        Args:
            type_filter: Filter by cosmetic type
            rarity_filter: Filter by rarity
            event_filter: Filter by event name
            is_limited: Filter limited items only
            min_price: Minimum price in coins
            max_price: Maximum price in coins
            limit: Max items to return
            offset: Pagination offset
            
        Returns:
            List of cosmetic items
        """
        query = self._catalog().select("*")
        
        # Only show items available in shop (excludes battle pass items)
        query = query.eq("shop_available", True)
        
        if type_filter:
            query = query.eq("type", type_filter)
        if rarity_filter:
            query = query.eq("rarity", rarity_filter)
        if event_filter:
            query = query.eq("event", event_filter)
        if is_limited is not None:
            query = query.eq("is_limited", is_limited)
        if min_price is not None:
            query = query.gte("price_coins", min_price)
        if max_price is not None:
            query = query.lte("price_coins", max_price)

        query = query.order("release_date", desc=True)
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        return result.data or []

    async def get_shop_count(
        self,
        type_filter: Optional[str] = None,
        rarity_filter: Optional[str] = None,
    ) -> int:
        """Get total count of cosmetics matching filters (excludes battle pass items)."""
        query = self._catalog().select("id", count="exact")
        
        # Only count items available in shop
        query = query.eq("shop_available", True)
        
        if type_filter:
            query = query.eq("type", type_filter)
        if rarity_filter:
            query = query.eq("rarity", rarity_filter)
        
        result = query.execute()
        return result.count or 0

    async def get_cosmetic(self, cosmetic_id: str) -> Optional[dict]:
        """Get a single cosmetic by ID."""
        result = (
            self._catalog()
            .select("*")
            .eq("id", cosmetic_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_cosmetics_by_type(self, cosmetic_type: str) -> List[dict]:
        """Get all cosmetics of a specific type."""
        result = (
            self._catalog()
            .select("*")
            .eq("type", cosmetic_type)
            .order("rarity")
            .execute()
        )
        return result.data or []

    # ============================================
    # Inventory Operations
    # ============================================

    async def get_inventory(self, user_id: str) -> List[dict]:
        """
        Get user's inventory with cosmetic details.
        
        Returns inventory items joined with cosmetic catalog data.
        """
        result = (
            self._inventory()
            .select("*, cosmetics_catalog(*)")
            .eq("user_id", user_id)
            .order("acquired_date", desc=True)
            .execute()
        )
        return result.data or []

    async def add_to_inventory(
        self, user_id: str, cosmetic_id: str
    ) -> Optional[dict]:
        """
        Add a cosmetic to user's inventory.
        
        Returns the new inventory entry or None if already owned.
        """
        insert_data = {
            "user_id": user_id,
            "cosmetic_id": cosmetic_id,
            "acquired_date": datetime.utcnow().isoformat(),
            "is_equipped": False,
        }
        
        result = (
            self._inventory()
            .insert(insert_data)
            .execute()
        )
        
        if not result.data:
            return None
        return result.data[0]

    async def check_ownership(self, user_id: str, cosmetic_id: str) -> bool:
        """Check if user owns a specific cosmetic."""
        result = (
            self._inventory()
            .select("id")
            .eq("user_id", user_id)
            .eq("cosmetic_id", cosmetic_id)
            .execute()
        )
        return bool(result.data)

    async def get_inventory_item(
        self, user_id: str, cosmetic_id: str
    ) -> Optional[dict]:
        """Get a specific inventory item."""
        result = (
            self._inventory()
            .select("*, cosmetics_catalog(*)")
            .eq("user_id", user_id)
            .eq("cosmetic_id", cosmetic_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def update_equipped_status(
        self, user_id: str, cosmetic_id: str, is_equipped: bool
    ) -> Optional[dict]:
        """Update the equipped status of an inventory item."""
        result = (
            self._inventory()
            .update({"is_equipped": is_equipped})
            .eq("user_id", user_id)
            .eq("cosmetic_id", cosmetic_id)
            .execute()
        )
        
        if not result.data:
            return None
        return result.data[0]

    async def get_inventory_count(self, user_id: str) -> int:
        """Get total count of items in user's inventory."""
        result = (
            self._inventory()
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0


    # ============================================
    # Loadout Operations
    # ============================================

    async def get_loadout(self, user_id: str) -> Optional[dict]:
        """Get user's current loadout."""
        result = (
            self._loadouts()
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_loadout_with_cosmetics(self, user_id: str) -> Optional[dict]:
        """
        Get user's loadout with full cosmetic details.
        
        Fetches the loadout and then fetches each equipped cosmetic.
        """
        loadout = await self.get_loadout(user_id)
        if not loadout:
            return None
        
        # Fetch cosmetic details for each equipped slot
        equipped_ids = []
        for slot in ["skin_equipped", "emote_equipped", "banner_equipped", 
                     "nameplate_equipped", "effect_equipped", "trail_equipped", "playercard_equipped"]:
            if loadout.get(slot):
                equipped_ids.append(loadout[slot])
        
        if equipped_ids:
            cosmetics_result = (
                self._catalog()
                .select("*")
                .in_("id", equipped_ids)
                .execute()
            )
            cosmetics_map = {c["id"]: c for c in (cosmetics_result.data or [])}
            
            # Replace IDs with full cosmetic objects
            for slot in ["skin_equipped", "emote_equipped", "banner_equipped",
                         "nameplate_equipped", "effect_equipped", "trail_equipped", "playercard_equipped"]:
                if loadout.get(slot) and loadout[slot] in cosmetics_map:
                    loadout[f"{slot}_data"] = cosmetics_map[loadout[slot]]
        
        return loadout

    async def create_loadout(self, user_id: str) -> dict:
        """Create an empty loadout for a user."""
        result = (
            self._loadouts()
            .insert({
                "user_id": user_id,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .execute()
        )
        return result.data[0] if result.data else {}

    async def update_loadout(
        self,
        user_id: str,
        slot: str,
        cosmetic_id: Optional[str],
    ) -> Optional[dict]:
        """
        Update a specific slot in the loadout.
        
        Args:
            user_id: User UUID
            slot: Slot name (skin_equipped, emote_equipped, etc.)
            cosmetic_id: Cosmetic ID to equip, or None to unequip
            
        Returns:
            Updated loadout or None if not found
        """
        # Ensure loadout exists
        existing = await self.get_loadout(user_id)
        if not existing:
            await self.create_loadout(user_id)
        
        update_data = {
            slot: cosmetic_id,
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        result = (
            self._loadouts()
            .update(update_data)
            .eq("user_id", user_id)
            .execute()
        )
        
        if not result.data:
            return None
        return result.data[0]

    async def clear_loadout_slot(self, user_id: str, slot: str) -> Optional[dict]:
        """Clear a specific slot in the loadout."""
        return await self.update_loadout(user_id, slot, None)

    # ============================================
    # Analytics Operations
    # ============================================

    async def increment_owned_count(self, cosmetic_id: str) -> None:
        """Increment the owned_by_count for a cosmetic."""
        # Get current count
        cosmetic = await self.get_cosmetic(cosmetic_id)
        if cosmetic:
            new_count = (cosmetic.get("owned_by_count", 0) or 0) + 1
            self._catalog().update(
                {"owned_by_count": new_count}
            ).eq("id", cosmetic_id).execute()


    # ============================================
    # Admin CRUD Operations (Dynamic Shop CMS)
    # Requirements: 2.1, 2.2, 2.3, 2.4, 3.1
    # ============================================

    async def create_cosmetic(self, data: dict) -> Optional[dict]:
        """
        Create a new cosmetic in the catalog.
        
        Property 5: Cosmetic creation stores all fields.
        
        Args:
            data: Cosmetic data dictionary
            
        Returns:
            Created cosmetic or None
        """
        # Set defaults
        data.setdefault("release_date", datetime.utcnow().isoformat())
        data.setdefault("created_at", datetime.utcnow().isoformat())
        data.setdefault("owned_by_count", 0)
        
        result = self._catalog().insert(data).execute()
        return result.data[0] if result.data else None

    async def update_cosmetic(
        self, cosmetic_id: str, data: dict
    ) -> Optional[dict]:
        """
        Update a cosmetic in the catalog.
        
        Property 6: Partial update preserves unchanged fields.
        Only updates fields present in data dict.
        
        Args:
            cosmetic_id: ID of cosmetic to update
            data: Fields to update
            
        Returns:
            Updated cosmetic or None
        """
        # Remove None values to preserve existing data
        update_data = {k: v for k, v in data.items() if v is not None}
        
        if not update_data:
            return await self.get_cosmetic(cosmetic_id)
        
        result = (
            self._catalog()
            .update(update_data)
            .eq("id", cosmetic_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_cosmetic(self, cosmetic_id: str) -> bool:
        """
        Delete a cosmetic from the catalog.
        
        Property 7: Delete cascades - asset_metadata has ON DELETE CASCADE.
        
        Args:
            cosmetic_id: ID of cosmetic to delete
            
        Returns:
            True if deleted
        """
        result = (
            self._catalog()
            .delete()
            .eq("id", cosmetic_id)
            .execute()
        )
        return bool(result.data)

    async def get_featured(self) -> List[dict]:
        """
        Get featured cosmetics.
        
        Property 10: Featured flag behavior.
        
        Returns:
            List of featured cosmetics
        """
        now = datetime.utcnow().isoformat()
        query = (
            self._catalog()
            .select("*")
            .eq("is_featured", True)
        )
        
        # Filter by availability window
        query = query.or_(f"available_from.is.null,available_from.lte.{now}")
        query = query.or_(f"available_until.is.null,available_until.gte.{now}")
        
        result = query.order("sort_order").execute()
        return result.data or []

    async def get_available_shop(
        self,
        type_filter: Optional[str] = None,
        rarity_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get shop items respecting availability windows.
        
        Property 8: Availability window enforcement.
        Excludes battle pass items (shop_available = false).
        
        Returns:
            List of available cosmetics
        """
        now = datetime.utcnow().isoformat()
        query = self._catalog().select("*")
        
        # Only show items available in shop (excludes battle pass items)
        query = query.eq("shop_available", True)
        
        if type_filter:
            query = query.eq("type", type_filter)
        if rarity_filter:
            query = query.eq("rarity", rarity_filter)
        
        # Filter by availability window
        query = query.or_(f"available_from.is.null,available_from.lte.{now}")
        query = query.or_(f"available_until.is.null,available_until.gte.{now}")
        
        query = query.order("sort_order").order("release_date", desc=True)
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        return result.data or []

    async def set_featured(self, cosmetic_id: str, is_featured: bool) -> Optional[dict]:
        """Set the featured flag for a cosmetic."""
        return await self.update_cosmetic(cosmetic_id, {"is_featured": is_featured})

    async def get_all_admin(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """Get all cosmetics for admin view (no availability filtering)."""
        result = (
            self._catalog()
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    async def get_total_count(self) -> int:
        """Get total count of all cosmetics."""
        result = self._catalog().select("id", count="exact").execute()
        return result.count or 0
