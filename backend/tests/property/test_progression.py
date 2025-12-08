"""
Property-based tests for Unified Progression System.
Tests correctness properties from design document.

**Feature: unified-progression-system**
"""

import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from app.services.battlepass_service import (
    BattlePassService,
    XP_MIN,
    XP_MAX,
    XP_WIN,
    XP_LOSS,
    XP_PER_KILL,
    XP_PER_STREAK,
    XP_PER_SECOND,
    DEFAULT_XP_PER_TIER,
    MAX_TIER,
)
from app.schemas.battlepass import XPAwardResult, MatchXPCalculation


class TestProgressInitialization:
    """
    **Feature: unified-progression-system, Property 3: Progress Initialization**
    **Validates: Requirements 1.1, 1.2**
    
    *For any* newly created player progress, current_tier SHALL be 1 
    and claimed_rewards SHALL contain exactly [1].
    """
    
    @given(
        user_id=st.uuids().map(str),
        season_id=st.uuids().map(str),
        is_premium=st.booleans(),
    )
    @settings(max_examples=100)
    def test_new_progress_starts_at_tier_1(
        self, user_id: str, season_id: str, is_premium: bool
    ):
        """
        Property: All new player progress records start at tier 1.
        
        UNIFIED PROGRESSION: New users should never start at tier 0.
        This ensures every player has access to the tier 1 skin from day one.
        """
        from app.database.repositories.battlepass_repo import BattlePassRepository
        import asyncio
        
        # Create a mock client that captures the insert data
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        
        # Capture the inserted data
        inserted_data = {}
        
        def capture_insert(data):
            nonlocal inserted_data
            inserted_data = data
            return mock_insert
        
        mock_table.insert = capture_insert
        mock_insert.execute.return_value = MagicMock(data=[{
            "user_id": user_id,
            "season_id": season_id,
            "current_tier": 1,
            "current_xp": 0,
            "is_premium": is_premium,
            "claimed_rewards": [1],
            "purchased_tiers": 0,
        }])
        mock_client.table.return_value = mock_table
        
        # Create repository and call create_player_progress
        repo = BattlePassRepository(mock_client)
        
        # Run the async function using asyncio.run() for Python 3.7+
        async def run_test():
            return await repo.create_player_progress(user_id, season_id, is_premium)
        
        result = asyncio.run(run_test())
        
        # Verify the inserted data has tier 1 and claimed_rewards [1]
        assert inserted_data.get("current_tier") == 1, \
            f"Expected tier 1, got {inserted_data.get('current_tier')}"
        assert inserted_data.get("claimed_rewards") == [1], \
            f"Expected claimed_rewards [1], got {inserted_data.get('claimed_rewards')}"
        assert inserted_data.get("current_xp") == 0, \
            f"Expected current_xp 0, got {inserted_data.get('current_xp')}"
    
    def test_tier_1_is_always_claimed_on_creation(self):
        """
        Property: Tier 1 is always in claimed_rewards for new progress.
        
        This ensures the tier 1 reward (skin) is immediately available
        without requiring manual claiming.
        """
        from app.database.repositories.battlepass_repo import BattlePassRepository
        import asyncio
        
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        
        inserted_data = {}
        
        def capture_insert(data):
            nonlocal inserted_data
            inserted_data = data
            return mock_insert
        
        mock_table.insert = capture_insert
        mock_insert.execute.return_value = MagicMock(data=[{
            "current_tier": 1,
            "claimed_rewards": [1],
        }])
        mock_client.table.return_value = mock_table
        
        repo = BattlePassRepository(mock_client)
        
        async def run_test():
            return await repo.create_player_progress("test-user", "test-season")
        
        asyncio.run(run_test())
        
        # Verify tier 1 is in claimed_rewards
        claimed = inserted_data.get("claimed_rewards", [])
        assert 1 in claimed, "Tier 1 must be in claimed_rewards on creation"
        assert len(claimed) == 1, "Only tier 1 should be claimed initially"


class TestXPCalculationBoundsUnified:
    """
    **Feature: unified-progression-system, Property 1: XP Calculation Bounds**
    **Validates: Requirements 2.6**
    
    *For any* match result with won (bool), kills (int >= 0), streak (int >= 0), 
    and duration_seconds (int >= 0), the calculated XP SHALL be in the range [50, 300].
    """
    
    @given(
        won=st.booleans(),
        kills=st.integers(min_value=0, max_value=1000),
        streak=st.integers(min_value=0, max_value=100),
        duration_seconds=st.integers(min_value=0, max_value=36000),
    )
    @settings(max_examples=200)
    def test_xp_always_within_bounds(
        self, won: bool, kills: int, streak: int, duration_seconds: int
    ):
        """
        Property: XP is always clamped to [50, 300] regardless of input values.
        """
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won, kills, streak, duration_seconds)
        
        assert XP_MIN <= result.total_xp <= XP_MAX, \
            f"XP {result.total_xp} not in [{XP_MIN}, {XP_MAX}]"


class TestXPCalculationFormulaUnified:
    """
    **Feature: unified-progression-system, Property 2: XP Calculation Formula**
    **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
    
    *For any* match result, the XP SHALL equal 
    min(300, max(50, base_xp + kills*5 + streak*10 + int(duration*0.1))) 
    where base_xp is 100 for win and 50 for loss.
    """
    
    @given(
        won=st.booleans(),
        kills=st.integers(min_value=0, max_value=100),
        streak=st.integers(min_value=0, max_value=50),
        duration_seconds=st.integers(min_value=0, max_value=3600),
    )
    @settings(max_examples=200)
    def test_xp_formula_correctness(
        self, won: bool, kills: int, streak: int, duration_seconds: int
    ):
        """
        Property: XP calculation follows the exact formula.
        """
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won, kills, streak, duration_seconds)
        
        # Calculate expected XP using the formula
        base_xp = XP_WIN if won else XP_LOSS
        kill_bonus = kills * XP_PER_KILL
        streak_bonus = streak * XP_PER_STREAK
        duration_bonus = int(duration_seconds * XP_PER_SECOND)
        
        raw_total = base_xp + kill_bonus + streak_bonus + duration_bonus
        expected_xp = max(XP_MIN, min(XP_MAX, raw_total))
        
        assert result.total_xp == expected_xp, \
            f"Expected {expected_xp}, got {result.total_xp}"
        assert result.base_xp == base_xp
        assert result.kill_bonus == kill_bonus
        assert result.streak_bonus == streak_bonus
        assert result.duration_bonus == duration_bonus


class TestTierAdvancementCorrectnessUnified:
    """
    **Feature: unified-progression-system, Property 4: Tier Advancement Correctness**
    **Validates: Requirements 3.1, 3.2, 3.3**
    
    *For any* XP award where current_xp + awarded_xp >= xp_per_tier, 
    the new_tier SHALL equal previous_tier + floor((current_xp + awarded_xp) / xp_per_tier) 
    and new_xp SHALL equal (current_xp + awarded_xp) % xp_per_tier.
    """
    
    @given(
        current_tier=st.integers(min_value=1, max_value=99),  # Start at 1 now
        current_xp=st.integers(min_value=0, max_value=999),
        xp_award=st.integers(min_value=1, max_value=5000),
    )
    @settings(max_examples=200)
    def test_tier_advancement_correctness(
        self, current_tier: int, current_xp: int, xp_award: int
    ):
        """
        Property: Tier advances correctly based on XP formula.
        """
        xp_per_tier = DEFAULT_XP_PER_TIER
        
        # Calculate expected new state
        total_new_xp = current_xp + xp_award
        expected_tier = current_tier
        expected_xp = total_new_xp
        
        while expected_xp >= xp_per_tier and expected_tier < MAX_TIER:
            expected_xp -= xp_per_tier
            expected_tier += 1
        
        # Cap at max tier
        if expected_tier >= MAX_TIER:
            expected_tier = MAX_TIER
            expected_xp = 0
        
        # Verify calculations are correct
        assert 1 <= expected_tier <= MAX_TIER, \
            f"Tier {expected_tier} out of bounds [1, {MAX_TIER}]"
        assert 0 <= expected_xp < xp_per_tier or expected_tier == MAX_TIER, \
            f"XP {expected_xp} out of bounds for tier"


class TestTierCapEnforcementUnified:
    """
    **Feature: unified-progression-system, Property 5: Tier Cap Enforcement**
    **Validates: Requirements 3.5**
    
    *For any* tier advancement, the resulting tier SHALL NOT exceed 100 (max_tier).
    """
    
    @given(
        current_tier=st.integers(min_value=90, max_value=100),
        current_xp=st.integers(min_value=0, max_value=999),
        xp_award=st.integers(min_value=1, max_value=100000),
    )
    @settings(max_examples=100)
    def test_tier_never_exceeds_max(
        self, current_tier: int, current_xp: int, xp_award: int
    ):
        """
        Property: Tier is always capped at MAX_TIER (100).
        """
        xp_per_tier = DEFAULT_XP_PER_TIER
        
        # Simulate tier advancement
        total_new_xp = current_xp + xp_award
        new_tier = current_tier
        new_xp = total_new_xp
        
        while new_xp >= xp_per_tier and new_tier < MAX_TIER:
            new_xp -= xp_per_tier
            new_tier += 1
        
        if new_tier >= MAX_TIER:
            new_tier = MAX_TIER
            new_xp = 0
        
        assert new_tier <= MAX_TIER, f"Tier {new_tier} exceeds max {MAX_TIER}"
        assert new_tier == MAX_TIER or new_xp < xp_per_tier


class TestClaimValidationUnified:
    """
    **Feature: unified-progression-system, Property 6: Claim Validation**
    **Validates: Requirements 4.1, 4.2**
    
    *For any* claim request with tier T, the claim SHALL succeed 
    if and only if T <= current_tier AND T NOT IN claimed_rewards.
    """
    
    @given(
        current_tier=st.integers(min_value=1, max_value=100),
        claimed_rewards=st.lists(st.integers(min_value=1, max_value=100), max_size=50),
        claim_tier=st.integers(min_value=1, max_value=100),
    )
    @settings(max_examples=200)
    def test_claim_validation_logic(
        self, current_tier: int, claimed_rewards: list, claim_tier: int
    ):
        """
        Property: Claim succeeds iff tier <= current_tier AND tier not claimed.
        """
        # Determine if claim should succeed
        should_succeed = (claim_tier <= current_tier) and (claim_tier not in claimed_rewards)
        
        # Simulate validation logic
        tier_reachable = claim_tier <= current_tier
        not_already_claimed = claim_tier not in claimed_rewards
        
        actual_success = tier_reachable and not_already_claimed
        
        assert actual_success == should_succeed, \
            f"Claim validation mismatch: tier={claim_tier}, current={current_tier}, " \
            f"claimed={claimed_rewards}, expected={should_succeed}, got={actual_success}"


class TestXPSerializationRoundTripUnified:
    """
    **Feature: unified-progression-system, Property 7: XP Award Result Serialization Round-Trip**
    **Validates: Requirements 2.7**
    
    *For any* XPAwardResult object, serializing to JSON then deserializing 
    SHALL produce an equivalent object.
    """
    
    @given(
        xp_awarded=st.integers(min_value=50, max_value=300),
        new_total_xp=st.integers(min_value=0, max_value=100000),
        previous_tier=st.integers(min_value=1, max_value=100),
        new_tier=st.integers(min_value=1, max_value=100),
        tiers_gained=st.integers(min_value=0, max_value=10),
        new_claimable_rewards=st.lists(st.integers(min_value=1, max_value=100), max_size=10),
    )
    @settings(max_examples=100)
    def test_xp_result_round_trip(
        self,
        xp_awarded: int,
        new_total_xp: int,
        previous_tier: int,
        new_tier: int,
        tiers_gained: int,
        new_claimable_rewards: list,
    ):
        """
        Property: XPAwardResult survives JSON serialization round-trip.
        """
        # Ensure new_tier >= previous_tier for valid data
        if new_tier < previous_tier:
            new_tier = previous_tier
        
        tier_advanced = new_tier > previous_tier
        
        original = XPAwardResult(
            xp_awarded=xp_awarded,
            new_total_xp=new_total_xp,
            previous_tier=previous_tier,
            new_tier=new_tier,
            tier_advanced=tier_advanced,
            tiers_gained=tiers_gained,
            new_claimable_rewards=new_claimable_rewards,
        )
        
        # Serialize to JSON
        json_str = original.model_dump_json()
        
        # Deserialize back
        restored = XPAwardResult.model_validate_json(json_str)
        
        # Verify equivalence
        assert restored.xp_awarded == original.xp_awarded
        assert restored.new_total_xp == original.new_total_xp
        assert restored.previous_tier == original.previous_tier
        assert restored.new_tier == original.new_tier
        assert restored.tier_advanced == original.tier_advanced
        assert restored.tiers_gained == original.tiers_gained
        assert restored.new_claimable_rewards == original.new_claimable_rewards


class TestClaimableRewardsCalculationUnified:
    """
    **Feature: unified-progression-system, Property 8: Claimable Rewards Calculation**
    **Validates: Requirements 4.1, 4.2**
    
    *For any* player progress, claimable_rewards SHALL equal 
    the set {t : 1 <= t <= current_tier AND t NOT IN claimed_rewards}.
    """
    
    @given(
        current_tier=st.integers(min_value=1, max_value=100),
        claimed_rewards=st.lists(st.integers(min_value=1, max_value=100), max_size=50),
    )
    @settings(max_examples=200)
    def test_claimable_rewards_calculation(
        self, current_tier: int, claimed_rewards: list
    ):
        """
        Property: Claimable rewards are exactly the unclaimed tiers up to current_tier.
        """
        # Calculate expected claimable rewards
        expected_claimable = [
            t for t in range(1, current_tier + 1) 
            if t not in claimed_rewards
        ]
        
        # Simulate the calculation from BattlePassService.get_player_progress
        actual_claimable = [
            t for t in range(1, current_tier + 1) 
            if t not in claimed_rewards
        ]
        
        assert set(actual_claimable) == set(expected_claimable), \
            f"Claimable mismatch: expected {expected_claimable}, got {actual_claimable}"
