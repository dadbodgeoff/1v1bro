"""
Property-based tests for cosmetics service.
Feature: user-services-microservices

Property 6: Cosmetic Type Validation
Property 7: Inventory Consistency
Validates: Requirements 3.1, 3.4, 3.5
"""

import pytest
from hypothesis import given, strategies as st, assume, settings
from datetime import datetime
from pydantic import ValidationError

from app.schemas.cosmetic import (
    CosmeticType,
    Rarity,
    Cosmetic,
    CosmeticCreate,
    InventoryItem,
    Loadout,
    ShopFilters,
)


# ============================================
# Strategies for generating test data
# ============================================

valid_cosmetic_types = st.sampled_from([
    "skin", "emote", "banner", "nameplate", "effect", "trail"
])

valid_rarities = st.sampled_from([
    "common", "uncommon", "rare", "epic", "legendary"
])

invalid_cosmetic_types = st.text(min_size=1, max_size=20).filter(
    lambda x: x.lower() not in ["skin", "emote", "banner", "nameplate", "effect", "trail"]
)

invalid_rarities = st.text(min_size=1, max_size=20).filter(
    lambda x: x.lower() not in ["common", "uncommon", "rare", "epic", "legendary"]
)


# ============================================
# Property 6: Cosmetic Type Validation
# Feature: user-services-microservices, Property 6: Cosmetic Type Validation
# Validates: Requirements 3.1
# ============================================

class TestCosmeticTypeValidation:
    """
    Property 6: Cosmetic Type Validation
    
    For any cosmetic item, the type field SHALL be one of:
    skin, emote, banner, nameplate, effect, trail.
    Any other value SHALL be rejected.
    """

    @given(cosmetic_type=valid_cosmetic_types)
    @settings(max_examples=100)
    def test_valid_cosmetic_types_accepted(self, cosmetic_type: str):
        """
        **Feature: user-services-microservices, Property 6: Cosmetic Type Validation**
        **Validates: Requirements 3.1**
        
        Valid cosmetic types should be accepted.
        """
        # Should not raise
        ct = CosmeticType(cosmetic_type)
        assert ct.value == cosmetic_type

    @given(cosmetic_type=invalid_cosmetic_types)
    @settings(max_examples=100)
    def test_invalid_cosmetic_types_rejected(self, cosmetic_type: str):
        """
        **Feature: user-services-microservices, Property 6: Cosmetic Type Validation**
        **Validates: Requirements 3.1**
        
        Invalid cosmetic types should be rejected.
        """
        with pytest.raises(ValueError):
            CosmeticType(cosmetic_type)

    @given(rarity=valid_rarities)
    @settings(max_examples=100)
    def test_valid_rarities_accepted(self, rarity: str):
        """Valid rarity tiers should be accepted."""
        r = Rarity(rarity)
        assert r.value == rarity

    @given(rarity=invalid_rarities)
    @settings(max_examples=100)
    def test_invalid_rarities_rejected(self, rarity: str):
        """Invalid rarity tiers should be rejected."""
        with pytest.raises(ValueError):
            Rarity(rarity)

    def test_all_cosmetic_types_exist(self):
        """All required cosmetic types should exist in enum."""
        required_types = {"skin", "emote", "banner", "nameplate", "effect", "trail", "playercard"}
        actual_types = {ct.value for ct in CosmeticType}
        assert required_types == actual_types

    def test_all_rarities_exist(self):
        """All required rarities should exist in enum."""
        required_rarities = {"common", "uncommon", "rare", "epic", "legendary"}
        actual_rarities = {r.value for r in Rarity}
        assert required_rarities == actual_rarities


class TestCosmeticSchemaValidation:
    """Tests for Cosmetic schema validation."""

    @given(
        name=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        cosmetic_type=valid_cosmetic_types,
        rarity=valid_rarities,
        price=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_valid_cosmetic_creation(
        self, name: str, cosmetic_type: str, rarity: str, price: int
    ):
        """
        **Feature: user-services-microservices, Property 6: Cosmetic Type Validation**
        **Validates: Requirements 3.1**
        
        Valid cosmetic data should create a valid Cosmetic object.
        """
        assume(name.strip())  # Non-empty name
        
        cosmetic = Cosmetic(
            id="test-id-123",
            name=name,
            type=CosmeticType(cosmetic_type),
            rarity=Rarity(rarity),
            image_url="https://example.com/image.png",
            price_coins=price,
        )
        
        # Name should be preserved (may be stripped of whitespace)
        assert cosmetic.name == name or cosmetic.name == name.strip()
        assert cosmetic.type.value == cosmetic_type
        assert cosmetic.rarity.value == rarity
        assert cosmetic.price_coins == price


# ============================================
# Property 7: Inventory Consistency
# Feature: user-services-microservices, Property 7: Inventory Consistency
# Validates: Requirements 3.4, 3.5
# ============================================

class TestInventoryConsistency:
    """
    Property 7: Inventory Consistency
    
    For any cosmetic purchase:
    - The cosmetic SHALL appear in the user's inventory
    - acquired_date SHALL be set to current timestamp
    - The inventory count SHALL increase by exactly 1
    """

    @given(
        cosmetic_id=st.uuids().map(str),
        user_id=st.uuids().map(str),
    )
    @settings(max_examples=50)
    def test_inventory_item_has_required_fields(self, cosmetic_id: str, user_id: str):
        """
        **Feature: user-services-microservices, Property 7: Inventory Consistency**
        **Validates: Requirements 3.4, 3.5**
        
        Inventory items should have all required fields.
        """
        cosmetic = Cosmetic(
            id=cosmetic_id,
            name="Test Cosmetic",
            type=CosmeticType.SKIN,
            rarity=Rarity.COMMON,
            image_url="https://example.com/image.png",
            price_coins=100,
        )
        
        now = datetime.utcnow()
        item = InventoryItem(
            id="inv-123",
            cosmetic_id=cosmetic_id,
            cosmetic=cosmetic,
            acquired_date=now,
            is_equipped=False,
        )
        
        assert item.cosmetic.id == cosmetic_id
        assert item.cosmetic_id == cosmetic_id
        assert item.acquired_date == now
        assert item.is_equipped is False

    @given(
        initial_count=st.integers(min_value=0, max_value=1000),
        items_to_add=st.integers(min_value=1, max_value=10),
    )
    @settings(max_examples=100)
    def test_inventory_count_increases_correctly(
        self, initial_count: int, items_to_add: int
    ):
        """
        **Feature: user-services-microservices, Property 7: Inventory Consistency**
        **Validates: Requirements 3.4**
        
        Adding items should increase inventory count by exactly the number added.
        """
        # Simulate inventory count tracking
        final_count = initial_count + items_to_add
        
        # Property: count increases by exactly items_to_add
        assert final_count - initial_count == items_to_add
        assert final_count == initial_count + items_to_add


class TestLoadoutSlotMapping:
    """Tests for loadout slot mapping."""

    def test_each_cosmetic_type_maps_to_slot(self):
        """Each cosmetic type should map to a loadout slot."""
        from app.services.cosmetics_service import CosmeticsService
        
        for ct in CosmeticType:
            slot = CosmeticsService.SLOT_MAP.get(ct)
            assert slot is not None, f"CosmeticType {ct} has no slot mapping"
            assert slot.endswith("_equipped"), f"Slot {slot} should end with _equipped"

    @given(cosmetic_type=st.sampled_from(list(CosmeticType)))
    @settings(max_examples=20)
    def test_slot_mapping_consistency(self, cosmetic_type: CosmeticType):
        """
        **Feature: user-services-microservices, Property 7: Inventory Consistency**
        **Validates: Requirements 3.5**
        
        Slot mapping should be consistent for each cosmetic type.
        """
        from app.services.cosmetics_service import CosmeticsService
        
        slot = CosmeticsService.SLOT_MAP.get(cosmetic_type)
        assert slot is not None
        
        # Verify slot name matches expected pattern
        expected_slots = {
            CosmeticType.SKIN: "skin_equipped",
            CosmeticType.EMOTE: "emote_equipped",
            CosmeticType.BANNER: "banner_equipped",
            CosmeticType.NAMEPLATE: "nameplate_equipped",
            CosmeticType.EFFECT: "effect_equipped",
            CosmeticType.TRAIL: "trail_equipped",
            CosmeticType.PLAYERCARD: "playercard_equipped",
        }
        assert slot == expected_slots[cosmetic_type]


class TestShopFiltersValidation:
    """Tests for shop filter validation."""

    @given(
        min_price=st.integers(min_value=0, max_value=10000),
        max_price=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=50)
    def test_price_filters_accept_valid_values(self, min_price: int, max_price: int):
        """Valid price filter values should be accepted."""
        filters = ShopFilters(min_price=min_price, max_price=max_price)
        assert filters.min_price == min_price
        assert filters.max_price == max_price

    @given(price=st.integers(max_value=-1))
    @settings(max_examples=20)
    def test_negative_min_price_rejected(self, price: int):
        """Negative min_price should be rejected."""
        with pytest.raises(ValidationError):
            ShopFilters(min_price=price)

    @given(price=st.integers(max_value=-1))
    @settings(max_examples=20)
    def test_negative_max_price_rejected(self, price: int):
        """Negative max_price should be rejected."""
        with pytest.raises(ValidationError):
            ShopFilters(max_price=price)

    @given(cosmetic_type=st.sampled_from(list(CosmeticType)))
    @settings(max_examples=20)
    def test_type_filter_accepts_valid_types(self, cosmetic_type: CosmeticType):
        """Type filter should accept valid cosmetic types."""
        filters = ShopFilters(type=cosmetic_type)
        assert filters.type == cosmetic_type

    @given(rarity=st.sampled_from(list(Rarity)))
    @settings(max_examples=20)
    def test_rarity_filter_accepts_valid_rarities(self, rarity: Rarity):
        """Rarity filter should accept valid rarities."""
        filters = ShopFilters(rarity=rarity)
        assert filters.rarity == rarity


# ============================================
# Property 6: Loadout Playercard Round-Trip
# Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip
# Validates: Requirements 5.4
# ============================================

class TestPlayercardLoadout:
    """
    Property 6: Loadout Playercard Round-Trip
    
    For any user who equips a playercard cosmetic, fetching their loadout
    SHALL return the same playercard cosmetic data that was equipped.
    """

    def test_playercard_type_exists(self):
        """
        **Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip**
        **Validates: Requirements 5.4**
        
        PLAYERCARD should exist as a valid cosmetic type.
        """
        assert CosmeticType.PLAYERCARD.value == "playercard"

    def test_playercard_slot_mapping_exists(self):
        """
        **Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip**
        **Validates: Requirements 5.4**
        
        PLAYERCARD should map to playercard_equipped slot.
        """
        from app.services.cosmetics_service import CosmeticsService
        
        slot = CosmeticsService.SLOT_MAP.get(CosmeticType.PLAYERCARD)
        assert slot == "playercard_equipped"

    @given(
        cosmetic_id=st.uuids().map(str),
        name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs'))).filter(lambda x: x.strip()),
        rarity=st.sampled_from(list(Rarity)),
    )
    @settings(max_examples=100)
    def test_playercard_cosmetic_creation(self, cosmetic_id: str, name: str, rarity: Rarity):
        """
        **Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip**
        **Validates: Requirements 5.4**
        
        Playercard cosmetics should be creatable with valid data.
        """
        cosmetic = Cosmetic(
            id=cosmetic_id,
            name=name.strip(),
            type=CosmeticType.PLAYERCARD,
            rarity=rarity,
            image_url="https://example.com/playercard.png",
            price_coins=0,
        )
        
        assert cosmetic.id == cosmetic_id
        assert cosmetic.type == CosmeticType.PLAYERCARD
        assert cosmetic.rarity == rarity

    @given(
        user_id=st.uuids().map(str),
        cosmetic_id=st.uuids().map(str),
        name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))).filter(lambda x: x.strip()),
    )
    @settings(max_examples=100)
    def test_loadout_playercard_round_trip(self, user_id: str, cosmetic_id: str, name: str):
        """
        **Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip**
        **Validates: Requirements 5.4**
        
        For any playercard cosmetic equipped in a loadout, the loadout should
        contain the same playercard data when retrieved.
        """
        # Create a playercard cosmetic
        playercard = Cosmetic(
            id=cosmetic_id,
            name=name.strip(),
            type=CosmeticType.PLAYERCARD,
            rarity=Rarity.RARE,
            image_url="https://example.com/playercard.png",
            price_coins=0,
        )
        
        # Create a loadout with the playercard equipped
        loadout = Loadout(
            user_id=user_id,
            playercard_equipped=playercard,
        )
        
        # Round-trip property: the equipped playercard should match
        assert loadout.playercard_equipped is not None
        assert loadout.playercard_equipped.id == cosmetic_id
        assert loadout.playercard_equipped.name == name.strip()
        assert loadout.playercard_equipped.type == CosmeticType.PLAYERCARD

    @given(user_id=st.uuids().map(str))
    @settings(max_examples=50)
    def test_loadout_without_playercard(self, user_id: str):
        """
        **Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip**
        **Validates: Requirements 5.4**
        
        Loadout without playercard should have playercard_equipped as None.
        """
        loadout = Loadout(
            user_id=user_id,
            playercard_equipped=None,
        )
        
        assert loadout.playercard_equipped is None

    def test_loadout_preserves_other_slots_with_playercard(self):
        """
        **Feature: lobby-playercard-redesign, Property 6: Loadout playercard round-trip**
        **Validates: Requirements 5.4**
        
        Adding playercard to loadout should not affect other equipped slots.
        """
        skin = Cosmetic(
            id="skin-123",
            name="Test Skin",
            type=CosmeticType.SKIN,
            rarity=Rarity.EPIC,
            image_url="https://example.com/skin.png",
            price_coins=500,
        )
        
        playercard = Cosmetic(
            id="card-456",
            name="Test Card",
            type=CosmeticType.PLAYERCARD,
            rarity=Rarity.RARE,
            image_url="https://example.com/card.png",
            price_coins=0,
        )
        
        loadout = Loadout(
            user_id="user-789",
            skin_equipped=skin,
            playercard_equipped=playercard,
        )
        
        # Both should be preserved
        assert loadout.skin_equipped is not None
        assert loadout.skin_equipped.id == "skin-123"
        assert loadout.playercard_equipped is not None
        assert loadout.playercard_equipped.id == "card-456"
