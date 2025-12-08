"""
Cosmetics service for cosmetics and inventory management.
Requirements: 3.3-3.10
"""

from typing import Optional, List

from supabase import Client

from app.database.repositories.cosmetics_repo import CosmeticsRepository
from app.cache.cache_manager import CacheManager
from app.schemas.cosmetic import (
    Cosmetic,
    CosmeticType,
    Rarity,
    InventoryItem,
    Loadout,
    ShopFilters,
    ShopResponse,
    InventoryResponse,
)


# Cache TTLs
SHOP_CACHE_TTL = 86400  # 24 hours for cosmetics catalog
INVENTORY_CACHE_TTL = 300  # 5 minutes for user inventory


class CosmeticsService:
    """Service for cosmetics and inventory management."""
    
    # Slot mapping from CosmeticType to loadout column
    SLOT_MAP = {
        CosmeticType.SKIN: "skin_equipped",
        CosmeticType.EMOTE: "emote_equipped",
        CosmeticType.BANNER: "banner_equipped",
        CosmeticType.NAMEPLATE: "nameplate_equipped",
        CosmeticType.EFFECT: "effect_equipped",
        CosmeticType.TRAIL: "trail_equipped",
        CosmeticType.PLAYERCARD: "playercard_equipped",
    }
    
    def __init__(
        self,
        client: Client,
        cache: Optional[CacheManager] = None,
    ):
        self.cosmetics_repo = CosmeticsRepository(client)
        self.cache = cache
    
    def _shop_cache_key(self, filters: Optional[ShopFilters] = None) -> str:
        """Generate cache key for shop listing."""
        if not filters:
            return CacheManager.key("cosmetics", "shop", "all")
        
        parts = []
        if filters.type:
            parts.append(f"type:{filters.type.value}")
        if filters.rarity:
            parts.append(f"rarity:{filters.rarity.value}")
        if filters.event:
            parts.append(f"event:{filters.event}")
        
        filter_str = "_".join(parts) if parts else "all"
        return CacheManager.key("cosmetics", "shop", filter_str)

    def _inventory_cache_key(self, user_id: str) -> str:
        """Generate cache key for user inventory."""
        return CacheManager.key("cosmetics", "inventory", user_id)
    
    # ============================================
    # Shop Operations
    # ============================================
    
    async def get_shop(
        self,
        filters: Optional[ShopFilters] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ShopResponse:
        """
        Get available cosmetics with optional filtering.
        
        Caches results for 24 hours (Requirements: 3.7).
        """
        # Check cache first
        if self.cache and not filters:
            cache_key = self._shop_cache_key(filters)
            cached = await self.cache.get_json(cache_key)
            if cached:
                return ShopResponse(**cached)
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Fetch from database
        items = await self.cosmetics_repo.get_shop(
            type_filter=filters.type.value if filters and filters.type else None,
            rarity_filter=filters.rarity.value if filters and filters.rarity else None,
            event_filter=filters.event if filters else None,
            is_limited=filters.is_limited if filters else None,
            min_price=filters.min_price if filters else None,
            max_price=filters.max_price if filters else None,
            limit=page_size,
            offset=offset,
        )
        
        # Get total count
        total = await self.cosmetics_repo.get_shop_count(
            type_filter=filters.type.value if filters and filters.type else None,
            rarity_filter=filters.rarity.value if filters and filters.rarity else None,
        )
        
        # Convert to Cosmetic objects
        cosmetics = [Cosmetic(**item) for item in items]
        
        response = ShopResponse(
            items=cosmetics,
            total=total,
            page=page,
            page_size=page_size,
        )
        
        # Cache if no filters (full catalog)
        if self.cache and not filters:
            cache_key = self._shop_cache_key(filters)
            await self.cache.set_json(cache_key, response.model_dump(), SHOP_CACHE_TTL)
        
        return response
    
    async def get_cosmetic(self, cosmetic_id: str) -> Optional[Cosmetic]:
        """Get a single cosmetic by ID."""
        data = await self.cosmetics_repo.get_cosmetic(cosmetic_id)
        if not data:
            return None
        return Cosmetic(**data)
    
    async def get_cosmetics_by_type(
        self, cosmetic_type: CosmeticType
    ) -> List[Cosmetic]:
        """Get all cosmetics of a specific type."""
        items = await self.cosmetics_repo.get_cosmetics_by_type(cosmetic_type.value)
        return [Cosmetic(**item) for item in items]

    # ============================================
    # Inventory Operations
    # ============================================
    
    async def get_inventory(self, user_id: str) -> InventoryResponse:
        """
        Get user's owned cosmetics.
        
        Caches results for 5 minutes (Requirements: 3.8).
        """
        # Check cache first
        if self.cache:
            cache_key = self._inventory_cache_key(user_id)
            cached = await self.cache.get_json(cache_key)
            if cached:
                return InventoryResponse(**cached)
        
        # Fetch from database
        items_data = await self.cosmetics_repo.get_inventory(user_id)
        
        # Convert to InventoryItem objects
        items = []
        for item in items_data:
            cosmetic_data = item.get("cosmetics_catalog", {})
            if cosmetic_data:
                items.append(InventoryItem(
                    id=item["id"],
                    cosmetic_id=item["cosmetic_id"],
                    cosmetic=Cosmetic(**cosmetic_data),
                    acquired_date=item["acquired_date"],
                    is_equipped=item.get("is_equipped", False),
                ))
        
        # Get loadout
        loadout = await self.get_loadout(user_id)
        
        response = InventoryResponse(
            items=items,
            total=len(items),
            loadout=loadout,
        )
        
        # Cache result
        if self.cache:
            cache_key = self._inventory_cache_key(user_id)
            await self.cache.set_json(cache_key, response.model_dump(), INVENTORY_CACHE_TTL)
        
        return response
    
    async def purchase_cosmetic(
        self, user_id: str, cosmetic_id: str
    ) -> Optional[InventoryItem]:
        """
        Purchase a cosmetic and add to inventory.
        
        Requirements: 3.4 - Add item with acquired_date timestamp.
        
        Returns:
            InventoryItem if successful, None if already owned or not found.
        """
        print(f"[purchase_cosmetic] Starting purchase: user={user_id}, cosmetic={cosmetic_id}")
        
        # Check if cosmetic exists
        cosmetic = await self.get_cosmetic(cosmetic_id)
        if not cosmetic:
            print(f"[purchase_cosmetic] Cosmetic not found: {cosmetic_id}")
            return None
        
        print(f"[purchase_cosmetic] Found cosmetic: {cosmetic.name}")
        
        # Check if already owned
        if await self.cosmetics_repo.check_ownership(user_id, cosmetic_id):
            print(f"[purchase_cosmetic] Already owned by user")
            return None  # Already owned
        
        # Add to inventory
        print(f"[purchase_cosmetic] Adding to inventory...")
        inventory_data = await self.cosmetics_repo.add_to_inventory(user_id, cosmetic_id)
        if not inventory_data:
            print(f"[purchase_cosmetic] Failed to add to inventory!")
            return None
        
        print(f"[purchase_cosmetic] Added to inventory: {inventory_data}")
        
        # Increment owned count
        await self.cosmetics_repo.increment_owned_count(cosmetic_id)
        
        # Invalidate inventory cache
        await self._invalidate_inventory_cache(user_id)
        
        print(f"[purchase_cosmetic] Purchase complete!")
        
        return InventoryItem(
            id=inventory_data["id"],
            cosmetic_id=cosmetic_id,
            cosmetic=cosmetic,
            acquired_date=inventory_data["acquired_date"],
            is_equipped=False,
        )

    # ============================================
    # Loadout Operations
    # ============================================
    
    async def get_loadout(self, user_id: str) -> Optional[Loadout]:
        """Get user's currently equipped cosmetics."""
        loadout_data = await self.cosmetics_repo.get_loadout_with_cosmetics(user_id)
        
        if not loadout_data:
            return None
        
        # Build Loadout with full cosmetic objects
        return Loadout(
            user_id=user_id,
            skin_equipped=Cosmetic(**loadout_data["skin_equipped_data"]) 
                if loadout_data.get("skin_equipped_data") else None,
            emote_equipped=Cosmetic(**loadout_data["emote_equipped_data"]) 
                if loadout_data.get("emote_equipped_data") else None,
            banner_equipped=Cosmetic(**loadout_data["banner_equipped_data"]) 
                if loadout_data.get("banner_equipped_data") else None,
            nameplate_equipped=Cosmetic(**loadout_data["nameplate_equipped_data"]) 
                if loadout_data.get("nameplate_equipped_data") else None,
            effect_equipped=Cosmetic(**loadout_data["effect_equipped_data"]) 
                if loadout_data.get("effect_equipped_data") else None,
            trail_equipped=Cosmetic(**loadout_data["trail_equipped_data"]) 
                if loadout_data.get("trail_equipped_data") else None,
            playercard_equipped=Cosmetic(**loadout_data["playercard_equipped_data"]) 
                if loadout_data.get("playercard_equipped_data") else None,
            updated_at=loadout_data.get("updated_at"),
        )
    
    async def equip_cosmetic(
        self, user_id: str, cosmetic_id: str
    ) -> Optional[Loadout]:
        """
        Equip a cosmetic to the appropriate loadout slot.
        
        Requirements: 3.5 - Update loadout for appropriate slot.
        
        Returns:
            Updated Loadout or None if cosmetic not owned.
        """
        print(f"[equip_cosmetic] Starting equip: user={user_id}, cosmetic={cosmetic_id}")
        
        # Check ownership
        if not await self.cosmetics_repo.check_ownership(user_id, cosmetic_id):
            print(f"[equip_cosmetic] User does not own cosmetic")
            return None
        
        # Get cosmetic to determine slot
        cosmetic = await self.get_cosmetic(cosmetic_id)
        if not cosmetic:
            print(f"[equip_cosmetic] Cosmetic not found")
            return None
        
        print(f"[equip_cosmetic] Equipping {cosmetic.name} (type: {cosmetic.type})")
        
        # Determine slot from cosmetic type
        slot = self.SLOT_MAP.get(cosmetic.type)
        if not slot:
            print(f"[equip_cosmetic] No slot mapping for type: {cosmetic.type}")
            return None
        
        print(f"[equip_cosmetic] Using slot: {slot}")
        
        # Get current loadout to find previously equipped item
        current_loadout = await self.cosmetics_repo.get_loadout(user_id)
        if current_loadout:
            old_cosmetic_id = current_loadout.get(slot)
            if old_cosmetic_id:
                # Unmark old item as equipped
                print(f"[equip_cosmetic] Unequipping old item: {old_cosmetic_id}")
                await self.cosmetics_repo.update_equipped_status(
                    user_id, old_cosmetic_id, False
                )
        
        # Update loadout
        print(f"[equip_cosmetic] Updating loadout...")
        await self.cosmetics_repo.update_loadout(user_id, slot, cosmetic_id)
        
        # Mark new item as equipped in inventory
        await self.cosmetics_repo.update_equipped_status(user_id, cosmetic_id, True)
        
        # Invalidate cache
        await self._invalidate_inventory_cache(user_id)
        
        return await self.get_loadout(user_id)
    
    async def unequip_cosmetic(
        self, user_id: str, slot: CosmeticType
    ) -> Optional[Loadout]:
        """
        Unequip a cosmetic from a slot.
        
        Returns:
            Updated Loadout or None if slot was empty.
        """
        slot_name = self.SLOT_MAP.get(slot)
        if not slot_name:
            return None
        
        # Get current loadout
        current_loadout = await self.cosmetics_repo.get_loadout(user_id)
        if not current_loadout:
            return None
        
        # Get currently equipped cosmetic ID
        cosmetic_id = current_loadout.get(slot_name)
        if cosmetic_id:
            # Unmark as equipped in inventory
            await self.cosmetics_repo.update_equipped_status(user_id, cosmetic_id, False)
        
        # Clear the slot
        await self.cosmetics_repo.clear_loadout_slot(user_id, slot_name)
        
        # Invalidate cache
        await self._invalidate_inventory_cache(user_id)
        
        return await self.get_loadout(user_id)
    
    # ============================================
    # Cache Operations
    # ============================================
    
    async def _invalidate_inventory_cache(self, user_id: str) -> None:
        """
        Invalidate inventory cache on changes.
        
        Requirements: 3.8 - Cache invalidated on purchase/equip.
        """
        if self.cache:
            cache_key = self._inventory_cache_key(user_id)
            await self.cache.delete(cache_key)
