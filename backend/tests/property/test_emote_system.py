"""
Property-based tests for the Emote System.
Tests emote data validity, tier distribution, and reproducibility.

Feature: emote-system
"""

import random
import re
import sys
import os

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st

# Add scripts directory to path for importing seed script functions
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'scripts'))

# Import the emote data and functions from seed script
# We'll test the data structures and logic directly
from seed_battlepass_season1 import (
    BATTLEPASS_EMOTES,
    BATTLEPASS_SKINS,
    BATTLEPASS_PLAYERCARDS,
    get_emote_tiers,
    storage_url,
)


class TestEmoteDataValidity:
    """
    **Feature: emote-system, Property 1: Emote Data Validity**
    
    For any emote created by the seed script, the emote SHALL have:
    - type field equal to "emote"
    - rarity field in valid set {"common", "uncommon", "rare", "epic", "legendary"}
    - image_url matching pattern {SUPABASE_URL}/storage/v1/object/public/cosmetics/emotes/{filename}.jpg
    - non-empty name and description
    
    **Validates: Requirements 1.1, 1.2, 1.3**
    """
    
    VALID_RARITIES = {"common", "uncommon", "rare", "epic", "legendary"}
    
    @given(emote_index=st.integers(min_value=0, max_value=7))
    @settings(max_examples=100)
    def test_emote_type_is_emote(self, emote_index: int):
        """All emotes must have type='emote'."""
        emote = BATTLEPASS_EMOTES[emote_index]
        assert emote["type"] == "emote", f"Emote {emote['name']} has type {emote['type']}, expected 'emote'"
    
    @given(emote_index=st.integers(min_value=0, max_value=7))
    @settings(max_examples=100)
    def test_emote_rarity_is_valid(self, emote_index: int):
        """All emotes must have a valid rarity value."""
        emote = BATTLEPASS_EMOTES[emote_index]
        assert emote["rarity"] in self.VALID_RARITIES, (
            f"Emote {emote['name']} has invalid rarity {emote['rarity']}"
        )
    
    @given(emote_index=st.integers(min_value=0, max_value=7))
    @settings(max_examples=100)
    def test_emote_image_url_format(self, emote_index: int):
        """All emote image URLs must follow the storage URL pattern."""
        emote = BATTLEPASS_EMOTES[emote_index]
        url = emote["image_url"]
        
        # URL should contain the emotes path
        assert "/storage/v1/object/public/cosmetics/emotes/" in url, (
            f"Emote {emote['name']} has invalid URL format: {url}"
        )
        
        # URL should end with .jpg
        assert url.endswith(".jpg"), (
            f"Emote {emote['name']} URL should end with .jpg: {url}"
        )
    
    @given(emote_index=st.integers(min_value=0, max_value=7))
    @settings(max_examples=100)
    def test_emote_has_name_and_description(self, emote_index: int):
        """All emotes must have non-empty name and description."""
        emote = BATTLEPASS_EMOTES[emote_index]
        
        assert emote.get("name"), f"Emote at index {emote_index} has no name"
        assert len(emote["name"]) > 0, f"Emote at index {emote_index} has empty name"
        
        assert emote.get("description"), f"Emote {emote['name']} has no description"
        assert len(emote["description"]) > 0, f"Emote {emote['name']} has empty description"
    
    def test_exactly_8_emotes(self):
        """There must be exactly 8 emotes defined."""
        assert len(BATTLEPASS_EMOTES) == 8, f"Expected 8 emotes, got {len(BATTLEPASS_EMOTES)}"
    
    def test_emote_sort_orders_are_unique(self):
        """All emote sort_order values must be unique."""
        sort_orders = [e["sort_order"] for e in BATTLEPASS_EMOTES]
        assert len(sort_orders) == len(set(sort_orders)), "Emote sort_order values are not unique"
    
    def test_emote_sort_orders_in_range(self):
        """Emote sort_order values should be in 300-307 range."""
        for emote in BATTLEPASS_EMOTES:
            assert 300 <= emote["sort_order"] <= 307, (
                f"Emote {emote['name']} sort_order {emote['sort_order']} not in range 300-307"
            )


class TestEmoteTierNonOverlap:
    """
    **Feature: emote-system, Property 2: Emote Tier Non-Overlap**
    
    For any tier assigned to an emote, that tier SHALL NOT be in the reserved set
    {1, 2, 8, 9, 15, 16, 22, 23, 29, 30, 34, 35} (skin and playercard tiers).
    
    **Validates: Requirements 2.1**
    """
    
    SKIN_TIERS = {1, 8, 15, 22, 29, 35}
    PLAYERCARD_TIERS = {2, 9, 16, 23, 30, 34}
    RESERVED_TIERS = SKIN_TIERS | PLAYERCARD_TIERS
    
    def test_emote_tiers_do_not_overlap_with_reserved(self):
        """Emote tiers must not overlap with skin or playercard tiers."""
        emote_tiers = get_emote_tiers()
        emote_tier_numbers = set(emote_tiers.keys())
        
        overlap = emote_tier_numbers & self.RESERVED_TIERS
        assert not overlap, f"Emote tiers overlap with reserved tiers: {overlap}"
    
    @given(st.integers(min_value=0, max_value=100))
    @settings(max_examples=100)
    def test_emote_tiers_always_avoid_reserved(self, _):
        """Property: emote tier selection always avoids reserved tiers."""
        emote_tiers = get_emote_tiers()
        
        for tier_num in emote_tiers.keys():
            assert tier_num not in self.RESERVED_TIERS, (
                f"Emote assigned to reserved tier {tier_num}"
            )


class TestTierDistributionInvariant:
    """
    **Feature: emote-system, Property 3: Tier Distribution Invariant**
    
    For any completed seed operation, the battle pass SHALL have exactly:
    - 6 skin rewards (at tiers 1, 8, 15, 22, 29, 35)
    - 6 playercard rewards (at tiers 2, 9, 16, 23, 30, 34)
    - 8 emote rewards (at 8 distinct non-reserved tiers)
    - 15 static rewards (coins, XP boosts, or empty)
    - Total: 35 tiers
    
    **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
    """
    
    def test_correct_cosmetic_counts(self):
        """Verify correct counts of each cosmetic type."""
        assert len(BATTLEPASS_SKINS) == 6, f"Expected 6 skins, got {len(BATTLEPASS_SKINS)}"
        assert len(BATTLEPASS_PLAYERCARDS) == 6, f"Expected 6 playercards, got {len(BATTLEPASS_PLAYERCARDS)}"
        assert len(BATTLEPASS_EMOTES) == 8, f"Expected 8 emotes, got {len(BATTLEPASS_EMOTES)}"
    
    def test_total_cosmetics_is_20(self):
        """Total cosmetic rewards should be 20."""
        total = len(BATTLEPASS_SKINS) + len(BATTLEPASS_PLAYERCARDS) + len(BATTLEPASS_EMOTES)
        assert total == 20, f"Expected 20 total cosmetics, got {total}"
    
    def test_emote_tiers_are_exactly_8(self):
        """Exactly 8 tiers should be assigned to emotes."""
        emote_tiers = get_emote_tiers()
        assert len(emote_tiers) == 8, f"Expected 8 emote tiers, got {len(emote_tiers)}"
    
    def test_emote_tiers_are_distinct(self):
        """All emote tiers should be distinct."""
        emote_tiers = get_emote_tiers()
        tier_numbers = list(emote_tiers.keys())
        assert len(tier_numbers) == len(set(tier_numbers)), "Emote tiers are not distinct"
    
    def test_emote_tiers_in_valid_range(self):
        """All emote tiers should be in range 1-35."""
        emote_tiers = get_emote_tiers()
        for tier_num in emote_tiers.keys():
            assert 1 <= tier_num <= 35, f"Emote tier {tier_num} out of range 1-35"
    
    def test_static_reward_count(self):
        """15 tiers should be available for static rewards."""
        skin_tiers = {1, 8, 15, 22, 29, 35}
        playercard_tiers = {2, 9, 16, 23, 30, 34}
        emote_tiers = set(get_emote_tiers().keys())
        
        cosmetic_tiers = skin_tiers | playercard_tiers | emote_tiers
        static_tiers = set(range(1, 36)) - cosmetic_tiers
        
        assert len(static_tiers) == 15, f"Expected 15 static reward tiers, got {len(static_tiers)}"


class TestReproducibleTierSelection:
    """
    **Feature: emote-system, Property 4: Reproducible Tier Selection**
    
    For any two executions of the tier selection algorithm with the same seed value,
    the resulting emote tier assignments SHALL be identical.
    
    **Validates: Requirements 5.1**
    """
    
    @given(st.integers(min_value=1, max_value=100))
    @settings(max_examples=100)
    def test_tier_selection_is_reproducible(self, num_calls: int):
        """Multiple calls to get_emote_tiers() should return identical results."""
        # Get first result
        first_result = get_emote_tiers()
        
        # Call multiple times and verify identical results
        for _ in range(num_calls):
            result = get_emote_tiers()
            assert result == first_result, "Tier selection is not reproducible"
    
    def test_specific_tier_assignments_are_stable(self):
        """The specific tier assignments should be stable across runs."""
        result1 = get_emote_tiers()
        result2 = get_emote_tiers()
        result3 = get_emote_tiers()
        
        assert result1 == result2 == result3, "Tier assignments changed between calls"
    
    def test_emote_names_in_tiers_match_definitions(self):
        """Emote names in tier assignments should match BATTLEPASS_EMOTES."""
        emote_tiers = get_emote_tiers()
        defined_names = {e["name"] for e in BATTLEPASS_EMOTES}
        
        for tier_num, (emote_name, track) in emote_tiers.items():
            assert emote_name in defined_names, (
                f"Emote '{emote_name}' at tier {tier_num} not in BATTLEPASS_EMOTES"
            )
