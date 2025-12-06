"""
Cosmetic schemas for cosmetics and inventory management.
Requirements: 3.1, 3.2, 3.3
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampMixin


# ============================================
# Enums
# ============================================

class CosmeticType(str, Enum):
    """Cosmetic item types. Requirements: 3.1"""
    SKIN = "skin"
    EMOTE = "emote"
    BANNER = "banner"
    NAMEPLATE = "nameplate"
    EFFECT = "effect"
    TRAIL = "trail"


class Rarity(str, Enum):
    """Cosmetic rarity tiers. Requirements: 3.2"""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


# ============================================
# Cosmetic Schemas
# ============================================

class Cosmetic(BaseSchema):
    """Cosmetic item definition from catalog."""
    
    id: str = Field(..., description="Cosmetic UUID")
    name: str = Field(..., description="Cosmetic name")
    type: CosmeticType = Field(..., description="Cosmetic type")
    rarity: Rarity = Field(..., description="Rarity tier")
    description: Optional[str] = Field(None, description="Item description")
    image_url: str = Field(..., description="Image URL for display")
    preview_video_url: Optional[str] = Field(None, description="Preview video URL")
    price_coins: int = Field(default=0, description="Price in coins")
    price_premium: Optional[int] = Field(None, description="Price in premium currency")
    release_date: datetime = Field(default_factory=datetime.utcnow, description="Release date")
    event: Optional[str] = Field(None, description="Associated event name")
    is_limited: bool = Field(default=False, description="Limited edition flag")
    owned_by_count: int = Field(default=0, description="Number of players who own this")


class CosmeticCreate(BaseSchema):
    """Schema for creating a new cosmetic (admin only)."""
    
    name: str = Field(..., min_length=1, max_length=100)
    type: CosmeticType
    rarity: Rarity
    description: Optional[str] = Field(None, max_length=500)
    image_url: str
    preview_video_url: Optional[str] = None
    price_coins: int = Field(default=0, ge=0)
    price_premium: Optional[int] = Field(None, ge=0)
    event: Optional[str] = Field(None, max_length=50)
    is_limited: bool = False


# ============================================
# Inventory Schemas
# ============================================

class InventoryItem(BaseSchema):
    """Item in player inventory."""
    
    id: str = Field(..., description="Inventory entry UUID")
    cosmetic: Cosmetic = Field(..., description="The cosmetic item")
    acquired_date: datetime = Field(..., description="When the item was acquired")
    is_equipped: bool = Field(default=False, description="Whether item is currently equipped")


class InventoryItemSimple(BaseSchema):
    """Simplified inventory item (without full cosmetic details)."""
    
    id: str
    cosmetic_id: str
    acquired_date: datetime
    is_equipped: bool = False


# ============================================
# Loadout Schemas
# ============================================

class Loadout(BaseSchema):
    """Currently equipped cosmetics."""
    
    user_id: str = Field(..., description="User UUID")
    skin_equipped: Optional[Cosmetic] = Field(None, description="Equipped skin")
    emote_equipped: Optional[Cosmetic] = Field(None, description="Equipped emote")
    banner_equipped: Optional[Cosmetic] = Field(None, description="Equipped banner")
    nameplate_equipped: Optional[Cosmetic] = Field(None, description="Equipped nameplate")
    effect_equipped: Optional[Cosmetic] = Field(None, description="Equipped effect")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class LoadoutSimple(BaseSchema):
    """Simplified loadout with just IDs."""
    
    user_id: str
    skin_equipped: Optional[str] = None
    emote_equipped: Optional[str] = None
    banner_equipped: Optional[str] = None
    nameplate_equipped: Optional[str] = None
    effect_equipped: Optional[str] = None


# ============================================
# Shop Schemas
# ============================================

class ShopFilters(BaseSchema):
    """Filters for shop browsing."""
    
    type: Optional[CosmeticType] = Field(None, description="Filter by cosmetic type")
    rarity: Optional[Rarity] = Field(None, description="Filter by rarity")
    event: Optional[str] = Field(None, description="Filter by event")
    is_limited: Optional[bool] = Field(None, description="Filter limited items only")
    max_price: Optional[int] = Field(None, ge=0, description="Maximum price in coins")
    min_price: Optional[int] = Field(None, ge=0, description="Minimum price in coins")


class ShopResponse(BaseSchema):
    """Shop listing response."""
    
    items: List[Cosmetic] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=20)


# ============================================
# Purchase Schemas
# ============================================

class PurchaseRequest(BaseSchema):
    """Request to purchase a cosmetic."""
    
    cosmetic_id: str = Field(..., description="ID of cosmetic to purchase")
    currency: str = Field(default="coins", description="Currency to use: coins or premium")


class PurchaseResponse(BaseSchema):
    """Response after successful purchase."""
    
    success: bool = True
    inventory_item: InventoryItem
    remaining_balance: int = Field(..., description="Remaining currency balance")


# ============================================
# Equip Schemas
# ============================================

class EquipRequest(BaseSchema):
    """Request to equip a cosmetic."""
    
    cosmetic_id: str = Field(..., description="ID of cosmetic to equip")


class UnequipRequest(BaseSchema):
    """Request to unequip a cosmetic slot."""
    
    slot: CosmeticType = Field(..., description="Slot to unequip")


# ============================================
# Inventory Response
# ============================================

class InventoryResponse(BaseSchema):
    """Full inventory response."""
    
    items: List[InventoryItem] = Field(default_factory=list)
    total: int = Field(default=0)
    loadout: Optional[Loadout] = None
