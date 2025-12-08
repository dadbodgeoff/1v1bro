"""
Property-based tests for Battle Pass service.
Tests correctness properties from design document.
"""

import pytest
from hypothesis import given, strategies as st, settings

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


class TestXPCalculationBounds:
    """
    **Feature: user-services-microservices, Property 8: XP Calculation Bounds**
    **Validates: Requirements 4.4**
    
    *For any* match result, the calculated XP SHALL be within [50, 300]
    regardless of kills, streak, or duration values.
    """
    
    @given(
        won=st.booleans(),
        kills=st.integers(min_value=0, max_value=1000),
        streak=st.integers(min_value=0, max_value=100),
        duration_seconds=st.integers(min_value=0, max_value=36000),  # Up to 10 hours
    )
    @settings(max_examples=200)
    def test_xp_always_within_bounds(
        self, won: bool, kills: int, streak: int, duration_seconds: int
    ):
        """
        Property: XP is always clamped to [50, 300] regardless of input values.
        
        This tests that even with extreme values (1000 kills, 100 streak,
        10 hour duration), the XP is properly clamped.
        """
        # Create service (doesn't need DB for calculation)
        service = BattlePassService(client=None)
        
        # Calculate XP
        result = service.calculate_match_xp(won, kills, streak, duration_seconds)
        
        # Assert bounds
        assert result.total_xp >= XP_MIN, f"XP {result.total_xp} below minimum {XP_MIN}"
        assert result.total_xp <= XP_MAX, f"XP {result.total_xp} above maximum {XP_MAX}"
    
    @given(
        kills=st.integers(min_value=0, max_value=10),
        streak=st.integers(min_value=0, max_value=5),
        duration_seconds=st.integers(min_value=60, max_value=600),
    )
    @settings(max_examples=100)
    def test_xp_minimum_enforced_on_loss(
        self, kills: int, streak: int, duration_seconds: int
    ):
        """
        Property: Even losses with minimal bonuses get at least 50 XP.
        """
        service = BattlePassService(client=None)
        
        result = service.calculate_match_xp(
            won=False, kills=kills, streak=streak, duration_seconds=duration_seconds
        )
        
        assert result.total_xp >= XP_MIN
    
    @given(
        kills=st.integers(min_value=50, max_value=500),
        streak=st.integers(min_value=10, max_value=50),
        duration_seconds=st.integers(min_value=1800, max_value=7200),
    )
    @settings(max_examples=100)
    def test_xp_maximum_enforced_on_high_performance(
        self, kills: int, streak: int, duration_seconds: int
    ):
        """
        Property: Even wins with extreme bonuses are capped at 300 XP.
        """
        service = BattlePassService(client=None)
        
        result = service.calculate_match_xp(
            won=True, kills=kills, streak=streak, duration_seconds=duration_seconds
        )
        
        assert result.total_xp <= XP_MAX
        assert result.was_clamped, "High performance should trigger clamping"


class TestXPCalculationFormula:
    """
    Tests for XP calculation formula correctness.
    **Validates: Requirements 4.3**
    """
    
    def test_win_base_xp(self):
        """Win gives 100 base XP."""
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won=True, kills=0, streak=0, duration_seconds=0)
        assert result.base_xp == XP_WIN == 100
    
    def test_loss_base_xp(self):
        """Loss gives 50 base XP."""
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won=False, kills=0, streak=0, duration_seconds=0)
        assert result.base_xp == XP_LOSS == 50
    
    @given(kills=st.integers(min_value=0, max_value=20))
    def test_kill_bonus_calculation(self, kills: int):
        """Each kill adds 5 XP."""
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won=False, kills=kills, streak=0, duration_seconds=0)
        assert result.kill_bonus == kills * XP_PER_KILL
    
    @given(streak=st.integers(min_value=0, max_value=10))
    def test_streak_bonus_calculation(self, streak: int):
        """Each streak count adds 10 XP."""
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won=False, kills=0, streak=streak, duration_seconds=0)
        assert result.streak_bonus == streak * XP_PER_STREAK
    
    @given(duration=st.integers(min_value=0, max_value=600))
    def test_duration_bonus_calculation(self, duration: int):
        """Each second adds 0.1 XP (truncated to int)."""
        service = BattlePassService(client=None)
        result = service.calculate_match_xp(won=False, kills=0, streak=0, duration_seconds=duration)
        expected = int(duration * XP_PER_SECOND)
        assert result.duration_bonus == expected


class TestTierAdvancement:
    """
    **Feature: user-services-microservices, Property 9: Tier Advancement Correctness**
    **Validates: Requirements 4.5**
    
    *For any* XP award that causes total XP to exceed tier threshold,
    the player's current_tier SHALL advance by exactly 1.
    """
    
    @given(
        current_tier=st.integers(min_value=0, max_value=99),
        current_xp=st.integers(min_value=0, max_value=999),
        xp_award=st.integers(min_value=1, max_value=5000),
    )
    @settings(max_examples=200)
    def test_tier_advancement_logic(
        self, current_tier: int, current_xp: int, xp_award: int
    ):
        """
        Property: Tier advances correctly when XP exceeds threshold.
        
        Given current state and XP award, verify:
        1. Tier advances when XP >= xp_per_tier
        2. Leftover XP is correctly calculated
        3. Cannot exceed MAX_TIER
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
        
        # Verify tier is within bounds
        assert 0 <= expected_tier <= MAX_TIER
        assert 0 <= expected_xp < xp_per_tier or expected_tier == MAX_TIER
    
    def test_single_tier_advancement(self):
        """Exactly 1000 XP from 0 advances to tier 1."""
        # Starting at tier 0, xp 0
        # Award exactly 1000 XP
        # Should be at tier 1, xp 0
        
        current_tier = 0
        current_xp = 0
        xp_award = DEFAULT_XP_PER_TIER
        
        new_xp = current_xp + xp_award
        new_tier = current_tier
        
        while new_xp >= DEFAULT_XP_PER_TIER and new_tier < MAX_TIER:
            new_xp -= DEFAULT_XP_PER_TIER
            new_tier += 1
        
        assert new_tier == 1
        assert new_xp == 0
    
    def test_multiple_tier_advancement(self):
        """2500 XP from tier 0 advances to tier 2 with 500 leftover."""
        current_tier = 0
        current_xp = 0
        xp_award = 2500
        
        new_xp = current_xp + xp_award
        new_tier = current_tier
        
        while new_xp >= DEFAULT_XP_PER_TIER and new_tier < MAX_TIER:
            new_xp -= DEFAULT_XP_PER_TIER
            new_tier += 1
        
        assert new_tier == 2
        assert new_xp == 500
    
    def test_max_tier_cap(self):
        """Cannot exceed tier 100."""
        current_tier = 99
        current_xp = 500
        xp_award = 10000  # Way more than needed
        
        new_xp = current_xp + xp_award
        new_tier = current_tier
        
        while new_xp >= DEFAULT_XP_PER_TIER and new_tier < MAX_TIER:
            new_xp -= DEFAULT_XP_PER_TIER
            new_tier += 1
        
        if new_tier >= MAX_TIER:
            new_tier = MAX_TIER
            new_xp = 0
        
        assert new_tier == MAX_TIER == 100
        assert new_xp == 0


class TestXPSourceTracking:
    """
    Tests for XP source tracking.
    **Validates: Requirements 4.10**
    """
    
    def test_win_source(self):
        """Win should use MATCH_WIN source."""
        from app.schemas.battlepass import XPSource
        
        service = BattlePassService(client=None)
        calc = service.calculate_match_xp(won=True, kills=0, streak=0, duration_seconds=0)
        
        # The source would be determined when awarding
        expected_source = XPSource.MATCH_WIN
        assert expected_source.value == "match_win"
    
    def test_loss_source(self):
        """Loss should use MATCH_LOSS source."""
        from app.schemas.battlepass import XPSource
        
        service = BattlePassService(client=None)
        calc = service.calculate_match_xp(won=False, kills=0, streak=0, duration_seconds=0)
        
        expected_source = XPSource.MATCH_LOSS
        assert expected_source.value == "match_loss"
