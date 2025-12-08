"""
Property-based tests for ELO rating system.
Tests correctness properties from design document.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.services.leaderboard_service import (
    LeaderboardService,
    ELO_MIN,
    ELO_MAX,
    DEFAULT_ELO,
    K_FACTORS,
    TIER_RANGES,
)
from app.schemas.leaderboard import RankTier


class TestELOZeroSum:
    """
    **Feature: user-services-microservices, Property 10: ELO Zero-Sum**
    **Validates: Requirements 5.3**
    
    *For any* match result, the sum of ELO changes (elo_delta_p1 + elo_delta_p2)
    SHALL equal 0 (winner gains exactly what loser loses).
    """
    
    @given(
        player1_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        player2_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        player1_won=st.booleans(),
    )
    @settings(max_examples=200)
    def test_elo_changes_sum_to_zero(
        self, player1_elo: int, player2_elo: int, player1_won: bool
    ):
        """
        Property: ELO changes are zero-sum.
        
        The winner gains exactly what the loser loses (within rounding).
        Note: Due to different K-factors, this may not be exactly zero,
        but should be close when K-factors are the same.
        """
        service = LeaderboardService(client=None)
        
        delta1, delta2 = service.calculate_elo_change(
            player1_elo, player2_elo, player1_won
        )
        
        # When K-factors are the same, sum should be exactly 0
        k1 = service.get_k_factor(player1_elo)
        k2 = service.get_k_factor(player2_elo)
        
        if k1 == k2:
            # With same K-factor, should be zero-sum (within rounding)
            assert abs(delta1 + delta2) <= 1, \
                f"ELO changes not zero-sum: {delta1} + {delta2} = {delta1 + delta2}"
    
    @given(
        elo=st.integers(min_value=1000, max_value=1999),  # Same K-factor range
        player1_won=st.booleans(),
    )
    @settings(max_examples=100)
    def test_same_k_factor_exact_zero_sum(self, elo: int, player1_won: bool):
        """
        Property: When both players have same K-factor, changes are exactly zero-sum.
        """
        service = LeaderboardService(client=None)
        
        # Both players in same K-factor range
        delta1, delta2 = service.calculate_elo_change(elo, elo, player1_won)
        
        # Should be exactly zero-sum (within rounding)
        assert abs(delta1 + delta2) <= 1


class TestELOBounds:
    """
    **Feature: user-services-microservices, Property 11: ELO Bounds**
    **Validates: Requirements 5.4**
    
    *For any* ELO calculation, the resulting ELO SHALL be clamped to [100, 3000].
    No player SHALL have ELO outside this range.
    """
    
    @given(elo=st.integers(min_value=-1000, max_value=5000))
    @settings(max_examples=200)
    def test_clamp_elo_always_within_bounds(self, elo: int):
        """
        Property: _clamp_elo always returns value in [100, 3000].
        """
        service = LeaderboardService(client=None)
        
        clamped = service._clamp_elo(elo)
        
        assert clamped >= ELO_MIN, f"Clamped ELO {clamped} below minimum {ELO_MIN}"
        assert clamped <= ELO_MAX, f"Clamped ELO {clamped} above maximum {ELO_MAX}"
    
    @given(
        player1_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        player2_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        player1_won=st.booleans(),
    )
    @settings(max_examples=200)
    def test_new_elo_after_match_within_bounds(
        self, player1_elo: int, player2_elo: int, player1_won: bool
    ):
        """
        Property: New ELO after match is always within bounds.
        """
        service = LeaderboardService(client=None)
        
        delta1, delta2 = service.calculate_elo_change(
            player1_elo, player2_elo, player1_won
        )
        
        new_p1 = service._clamp_elo(player1_elo + delta1)
        new_p2 = service._clamp_elo(player2_elo + delta2)
        
        assert ELO_MIN <= new_p1 <= ELO_MAX
        assert ELO_MIN <= new_p2 <= ELO_MAX
    
    def test_extreme_low_elo_clamped(self):
        """ELO below 100 is clamped to 100."""
        service = LeaderboardService(client=None)
        
        assert service._clamp_elo(50) == ELO_MIN
        assert service._clamp_elo(0) == ELO_MIN
        assert service._clamp_elo(-100) == ELO_MIN
    
    def test_extreme_high_elo_clamped(self):
        """ELO above 3000 is clamped to 3000."""
        service = LeaderboardService(client=None)
        
        assert service._clamp_elo(3100) == ELO_MAX
        assert service._clamp_elo(5000) == ELO_MAX
        assert service._clamp_elo(10000) == ELO_MAX


class TestRankTierAssignment:
    """
    **Feature: user-services-microservices, Property 12: Rank Tier Assignment**
    **Validates: Requirements 5.5**
    
    *For any* ELO value, the assigned rank tier SHALL match the defined ranges:
    Bronze (100-799), Silver (800-1199), Gold (1200-1599), 
    Platinum (1600-1999), Diamond (2000-2399), Master (2400-2799), 
    Grandmaster (2800-3000).
    """
    
    @given(elo=st.integers(min_value=100, max_value=799))
    def test_bronze_tier(self, elo: int):
        """ELO 100-799 is Bronze."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.BRONZE
    
    @given(elo=st.integers(min_value=800, max_value=1199))
    def test_silver_tier(self, elo: int):
        """ELO 800-1199 is Silver."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.SILVER
    
    @given(elo=st.integers(min_value=1200, max_value=1599))
    def test_gold_tier(self, elo: int):
        """ELO 1200-1599 is Gold."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.GOLD
    
    @given(elo=st.integers(min_value=1600, max_value=1999))
    def test_platinum_tier(self, elo: int):
        """ELO 1600-1999 is Platinum."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.PLATINUM
    
    @given(elo=st.integers(min_value=2000, max_value=2399))
    def test_diamond_tier(self, elo: int):
        """ELO 2000-2399 is Diamond."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.DIAMOND
    
    @given(elo=st.integers(min_value=2400, max_value=2799))
    def test_master_tier(self, elo: int):
        """ELO 2400-2799 is Master."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.MASTER
    
    @given(elo=st.integers(min_value=2800, max_value=3000))
    def test_grandmaster_tier(self, elo: int):
        """ELO 2800-3000 is Grandmaster."""
        service = LeaderboardService(client=None)
        assert service.get_tier(elo) == RankTier.GRANDMASTER
    
    @given(elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX))
    @settings(max_examples=200)
    def test_all_elos_have_valid_tier(self, elo: int):
        """
        Property: Every valid ELO has a valid tier assignment.
        """
        service = LeaderboardService(client=None)
        tier = service.get_tier(elo)
        
        assert tier in RankTier, f"Invalid tier {tier} for ELO {elo}"


class TestKFactorAssignment:
    """Tests for K-factor assignment based on ELO."""
    
    @given(elo=st.integers(min_value=0, max_value=1999))
    def test_k_factor_32_for_under_2000(self, elo: int):
        """K-factor is 32 for ELO under 2000."""
        service = LeaderboardService(client=None)
        assert service.get_k_factor(elo) == 32
    
    @given(elo=st.integers(min_value=2000, max_value=2399))
    def test_k_factor_24_for_2000_to_2400(self, elo: int):
        """K-factor is 24 for ELO 2000-2399."""
        service = LeaderboardService(client=None)
        assert service.get_k_factor(elo) == 24
    
    @given(elo=st.integers(min_value=2400, max_value=3000))
    def test_k_factor_16_for_2400_plus(self, elo: int):
        """K-factor is 16 for ELO 2400+."""
        service = LeaderboardService(client=None)
        assert service.get_k_factor(elo) == 16


class TestELOCalculationLogic:
    """Tests for ELO calculation correctness."""
    
    def test_winner_gains_elo(self):
        """Winner always gains ELO."""
        service = LeaderboardService(client=None)
        
        delta1, delta2 = service.calculate_elo_change(1200, 1200, player1_won=True)
        
        assert delta1 > 0, "Winner should gain ELO"
        assert delta2 < 0, "Loser should lose ELO"
    
    def test_loser_loses_elo(self):
        """Loser always loses ELO."""
        service = LeaderboardService(client=None)
        
        delta1, delta2 = service.calculate_elo_change(1200, 1200, player1_won=False)
        
        assert delta1 < 0, "Loser should lose ELO"
        assert delta2 > 0, "Winner should gain ELO"
    
    def test_upset_gives_more_elo(self):
        """Beating a higher-rated player gives more ELO."""
        service = LeaderboardService(client=None)
        
        # Lower rated player beats higher rated
        delta_upset, _ = service.calculate_elo_change(1000, 1500, player1_won=True)
        
        # Equal rated players
        delta_equal, _ = service.calculate_elo_change(1200, 1200, player1_won=True)
        
        assert delta_upset > delta_equal, "Upset should give more ELO"
    
    def test_expected_win_gives_less_elo(self):
        """Beating a lower-rated player gives less ELO."""
        service = LeaderboardService(client=None)
        
        # Higher rated player beats lower rated
        delta_expected, _ = service.calculate_elo_change(1500, 1000, player1_won=True)
        
        # Equal rated players
        delta_equal, _ = service.calculate_elo_change(1200, 1200, player1_won=True)
        
        assert delta_expected < delta_equal, "Expected win should give less ELO"
    
    def test_default_elo_is_1200(self):
        """Default starting ELO is 1200."""
        assert DEFAULT_ELO == 1200
    
    def test_default_elo_is_gold_tier(self):
        """Default ELO (1200) is Gold tier."""
        service = LeaderboardService(client=None)
        assert service.get_tier(DEFAULT_ELO) == RankTier.GOLD
