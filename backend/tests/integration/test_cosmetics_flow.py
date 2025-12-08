"""
Integration tests for cosmetics service flow.
Requirements: 3.1-3.10
"""

import pytest


class TestCosmeticSchemas:
    """Test cosmetic schema validation."""

    def test_cosmetic_type_enum(self):
        """CosmeticType enum should have expected values."""
        from app.schemas.cosmetic import CosmeticType
        
        assert CosmeticType.SKIN.value == "skin"
        assert CosmeticType.EMOTE.value == "emote"
        assert CosmeticType.BANNER.value == "banner"

    def test_rarity_enum(self):
        """Rarity enum should have expected values."""
        from app.schemas.cosmetic import Rarity
        
        assert Rarity.COMMON.value == "common"
        assert Rarity.UNCOMMON.value == "uncommon"
        assert Rarity.RARE.value == "rare"
        assert Rarity.EPIC.value == "epic"
        assert Rarity.LEGENDARY.value == "legendary"

    def test_cosmetic_schema(self):
        """Cosmetic schema should validate correctly."""
        from app.schemas.cosmetic import Cosmetic, CosmeticType, Rarity
        
        cosmetic = Cosmetic(
            id="cosmetic-1",
            name="Cool Skin",
            type=CosmeticType.SKIN,
            rarity=Rarity.RARE,
            price_coins=500,
            image_url="https://example.com/skin.png",
        )
        
        assert cosmetic.id == "cosmetic-1"
        assert cosmetic.name == "Cool Skin"
        assert cosmetic.type == CosmeticType.SKIN
        assert cosmetic.rarity == Rarity.RARE
        assert cosmetic.price_coins == 500


class TestInventorySchemas:
    """Test inventory schema validation."""

    def test_inventory_item_simple_schema(self):
        """InventoryItemSimple schema should validate correctly."""
        from app.schemas.cosmetic import InventoryItemSimple
        
        item = InventoryItemSimple(
            id="inv-1",
            cosmetic_id="cosmetic-1",
            acquired_date="2024-01-01T00:00:00Z",
        )
        
        assert item.id == "inv-1"
        assert item.cosmetic_id == "cosmetic-1"


class TestLoadoutSchemas:
    """Test loadout schema validation."""

    def test_loadout_simple_schema(self):
        """LoadoutSimple schema should validate correctly."""
        from app.schemas.cosmetic import LoadoutSimple
        
        loadout = LoadoutSimple(
            user_id="user-1",
            skin_equipped="skin-1",
            emote_equipped="emote-1",
        )
        
        assert loadout.user_id == "user-1"
        assert loadout.skin_equipped == "skin-1"
        assert loadout.emote_equipped == "emote-1"


class TestShopFilters:
    """Test shop filter schema."""

    def test_shop_filters_optional(self):
        """ShopFilters should have optional fields."""
        from app.schemas.cosmetic import ShopFilters
        
        filters = ShopFilters()
        assert filters.type is None
        assert filters.rarity is None
        assert filters.max_price is None
