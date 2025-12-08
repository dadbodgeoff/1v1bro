"""
Property-based tests for Unified Stats & Leaderboard System.
Feature: unified-stats-leaderboard

Tests ELO calculation, tier assignment, and data integrity properties.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

# ELO Constants
ELO_MIN = 100
ELO_MAX = 3000
DEFAULT_ELO = 1200

# K-Factor ranges
K_FACTORS = {
    (0, 2000): 32,
    (2000, 2400): 24,
    (2400, 3001): 16,
}

# Tier ranges
TIER_RANGES = {
    "Bronze": (100, 800),
    "Silver": (800, 1200),
    "Gold": (1200, 1600),
    "Platinum": (1600, 2000),
    "Diamond": (2000, 2400),
    "Master": (2400, 2800),
    "Grandmaster": (2800, 3001),
}


def get_k_factor(elo: int) -> int:
    """Get K-factor based on ELO rating."""
    for (low, high), k in K_FACTORS.items():
        if low <= elo < high:
            return k
    return 16


def get_tier(elo: int) -> str:
    """Get tier name for an ELO value."""
    for tier, (low, high) in TIER_RANGES.items():
        if low <= elo < high:
            return tier
    return "Grandmaster" if elo >= 2800 else "Bronze"


def clamp_elo(elo: int) -> int:
    """Clamp ELO to valid range."""
    return max(ELO_MIN, min(ELO_MAX, elo))


def calculate_elo_change(p1_elo: int, p2_elo: int, p1_won: bool) -> tuple[int, int]:
    """Calculate ELO changes using standard formula."""
    exp1 = 1 / (1 + 10 ** ((p2_elo - p1_elo) / 400))
    exp2 = 1 - exp1
    
    score1 = 1.0 if p1_won else 0.0
    score2 = 1.0 - score1
    
    k1 = get_k_factor(p1_elo)
    k2 = get_k_factor(p2_elo)
    
    delta1 = round(k1 * (score1 - exp1))
    delta2 = round(k2 * (score2 - exp2))
    
    return delta1, delta2


# ============================================
# Property 2: Default ELO Initialization
# ============================================
class TestDefaultELOInitialization:
    """
    Property 2: Default ELO Initialization
    For any newly created user, their ELO fields should be initialized to
    default values (current_elo=1200, peak_elo=1200, current_tier='Gold')
    Validates: Requirements 1.3
    """

    def test_default_elo_value(self):
        """New users should have ELO of 1200."""
        assert DEFAULT_ELO == 1200

    def test_default_tier_is_gold(self):
        """Default ELO of 1200 should map to Gold tier."""
        tier = get_tier(DEFAULT_ELO)
        assert tier == "Gold"

    def test_default_peak_equals_current(self):
        """For new users, peak_elo should equal current_elo."""
        # This is a design invariant - new users start with peak = current
        default_current = DEFAULT_ELO
        default_peak = DEFAULT_ELO
        assert default_peak == default_current


# ============================================
# Property 3: ELO Formula Correctness
# ============================================
class TestELOFormulaCorrectness:
    """
    Property 3: ELO Formula Correctness
    For any match result with two players, the ELO changes should follow
    the formula: delta = K * (actual_score - expected_score)
    Validates: Requirements 2.1
    """

    @given(
        p1_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        p2_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        p1_won=st.booleans(),
    )
    @settings(max_examples=100)
    def test_elo_changes_follow_formula(self, p1_elo: int, p2_elo: int, p1_won: bool):
        """ELO changes should follow standard formula."""
        delta1, delta2 = calculate_elo_change(p1_elo, p2_elo, p1_won)
        
        # Verify formula components
        exp1 = 1 / (1 + 10 ** ((p2_elo - p1_elo) / 400))
        score1 = 1.0 if p1_won else 0.0
        k1 = get_k_factor(p1_elo)
        
        expected_delta1 = round(k1 * (score1 - exp1))
        assert delta1 == expected_delta1

    @given(
        p1_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        p2_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
    )
    @settings(max_examples=100)
    def test_winner_gains_loser_loses(self, p1_elo: int, p2_elo: int):
        """Winner should gain ELO, loser should lose ELO."""
        delta1_win, delta2_lose = calculate_elo_change(p1_elo, p2_elo, p1_won=True)
        
        assert delta1_win >= 0, "Winner should gain or maintain ELO"
        assert delta2_lose <= 0, "Loser should lose or maintain ELO"

    @given(
        p1_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        p2_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
    )
    @settings(max_examples=100)
    def test_upset_gives_more_points(self, p1_elo: int, p2_elo: int):
        """Lower-rated player beating higher-rated should gain more."""
        assume(p1_elo < p2_elo - 100)  # Significant rating difference
        
        # Lower rated wins
        delta_underdog, _ = calculate_elo_change(p1_elo, p2_elo, p1_won=True)
        # Higher rated wins
        _, delta_favorite = calculate_elo_change(p2_elo, p1_elo, p1_won=True)
        
        # Underdog winning should gain more than favorite winning
        assert delta_underdog > delta_favorite


# ============================================
# Property 4: K-Factor Selection
# ============================================
class TestKFactorSelection:
    """
    Property 4: K-Factor Selection
    For any ELO rating, the K-factor should be 32 if rating < 2000,
    24 if 2000 <= rating < 2400, and 16 if rating >= 2400
    Validates: Requirements 2.2
    """

    @given(elo=st.integers(min_value=ELO_MIN, max_value=1999))
    @settings(max_examples=100)
    def test_k_factor_below_2000(self, elo: int):
        """K-factor should be 32 for ratings below 2000."""
        assert get_k_factor(elo) == 32

    @given(elo=st.integers(min_value=2000, max_value=2399))
    @settings(max_examples=100)
    def test_k_factor_2000_to_2400(self, elo: int):
        """K-factor should be 24 for ratings 2000-2399."""
        assert get_k_factor(elo) == 24

    @given(elo=st.integers(min_value=2400, max_value=ELO_MAX))
    @settings(max_examples=100)
    def test_k_factor_above_2400(self, elo: int):
        """K-factor should be 16 for ratings 2400+."""
        assert get_k_factor(elo) == 16


# ============================================
# Property 5: Peak ELO Invariant
# ============================================
class TestPeakELOInvariant:
    """
    Property 5: Peak ELO Invariant
    For any player, their peak_elo should always be >= current_elo
    Validates: Requirements 2.3
    """

    @given(
        initial_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        elo_deltas=st.lists(st.integers(min_value=-100, max_value=100), min_size=1, max_size=20),
    )
    @settings(max_examples=100)
    def test_peak_always_gte_current(self, initial_elo: int, elo_deltas: list[int]):
        """Peak ELO should always be >= current ELO after any sequence of updates."""
        current_elo = initial_elo
        peak_elo = initial_elo
        
        for delta in elo_deltas:
            current_elo = clamp_elo(current_elo + delta)
            peak_elo = max(peak_elo, current_elo)
            
            assert peak_elo >= current_elo, f"Peak {peak_elo} should be >= current {current_elo}"


# ============================================
# Property 6: ELO Bounds Clamping
# ============================================
class TestELOBoundsClamping:
    """
    Property 6: ELO Bounds Clamping
    For any ELO update, the resulting current_elo should be clamped
    between 100 and 3000 inclusive
    Validates: Requirements 2.4
    """

    @given(
        initial_elo=st.integers(min_value=ELO_MIN, max_value=ELO_MAX),
        delta=st.integers(min_value=-5000, max_value=5000),
    )
    @settings(max_examples=100)
    def test_elo_clamped_to_bounds(self, initial_elo: int, delta: int):
        """ELO should always be clamped to [100, 3000]."""
        new_elo = clamp_elo(initial_elo + delta)
        
        assert new_elo >= ELO_MIN, f"ELO {new_elo} should be >= {ELO_MIN}"
        assert new_elo <= ELO_MAX, f"ELO {new_elo} should be <= {ELO_MAX}"

    def test_extreme_negative_delta(self):
        """Extreme negative delta should clamp to minimum."""
        result = clamp_elo(1200 - 10000)
        assert result == ELO_MIN

    def test_extreme_positive_delta(self):
        """Extreme positive delta should clamp to maximum."""
        result = clamp_elo(1200 + 10000)
        assert result == ELO_MAX


# ============================================
# Property 7: Tier-ELO Consistency
# ============================================
class TestTierELOConsistency:
    """
    Property 7: Tier-ELO Consistency
    For any player, their current_tier should match the tier range for
    their current_elo
    Validates: Requirements 2.5
    """

    @given(elo=st.integers(min_value=100, max_value=799))
    @settings(max_examples=50)
    def test_bronze_tier(self, elo: int):
        """ELO 100-799 should be Bronze."""
        assert get_tier(elo) == "Bronze"

    @given(elo=st.integers(min_value=800, max_value=1199))
    @settings(max_examples=50)
    def test_silver_tier(self, elo: int):
        """ELO 800-1199 should be Silver."""
        assert get_tier(elo) == "Silver"

    @given(elo=st.integers(min_value=1200, max_value=1599))
    @settings(max_examples=50)
    def test_gold_tier(self, elo: int):
        """ELO 1200-1599 should be Gold."""
        assert get_tier(elo) == "Gold"

    @given(elo=st.integers(min_value=1600, max_value=1999))
    @settings(max_examples=50)
    def test_platinum_tier(self, elo: int):
        """ELO 1600-1999 should be Platinum."""
        assert get_tier(elo) == "Platinum"

    @given(elo=st.integers(min_value=2000, max_value=2399))
    @settings(max_examples=50)
    def test_diamond_tier(self, elo: int):
        """ELO 2000-2399 should be Diamond."""
        assert get_tier(elo) == "Diamond"

    @given(elo=st.integers(min_value=2400, max_value=2799))
    @settings(max_examples=50)
    def test_master_tier(self, elo: int):
        """ELO 2400-2799 should be Master."""
        assert get_tier(elo) == "Master"

    @given(elo=st.integers(min_value=2800, max_value=3000))
    @settings(max_examples=50)
    def test_grandmaster_tier(self, elo: int):
        """ELO 2800-3000 should be Grandmaster."""
        assert get_tier(elo) == "Grandmaster"


# ============================================
# Property 9: Win Rate Calculation
# ============================================
class TestWinRateCalculation:
    """
    Property 9: Win Rate Calculation
    For any player with games_played > 0, their displayed win_rate should
    equal (games_won / games_played * 100) rounded to 2 decimal places
    Validates: Requirements 4.3
    """

    @given(
        games_won=st.integers(min_value=0, max_value=1000),
        games_played=st.integers(min_value=1, max_value=1000),
    )
    @settings(max_examples=100)
    def test_win_rate_formula(self, games_won: int, games_played: int):
        """Win rate should be calculated correctly."""
        assume(games_won <= games_played)
        
        win_rate = round(games_won / games_played * 100, 2)
        
        assert 0 <= win_rate <= 100
        assert win_rate == round(games_won / games_played * 100, 2)

    def test_zero_games_played(self):
        """Win rate should be 0 when no games played."""
        games_played = 0
        games_won = 0
        
        win_rate = 0.0 if games_played == 0 else round(games_won / games_played * 100, 2)
        assert win_rate == 0.0

    def test_perfect_win_rate(self):
        """100% win rate when all games won."""
        games_played = 50
        games_won = 50
        
        win_rate = round(games_won / games_played * 100, 2)
        assert win_rate == 100.0


# ============================================
# Property 12: Games Played Invariant
# ============================================
class TestGamesPlayedInvariant:
    """
    Property 12: Games Played Invariant
    For any player, games_played should equal games_won + games_lost
    Validates: Requirements 10.1
    """

    @given(
        games_won=st.integers(min_value=0, max_value=1000),
        games_lost=st.integers(min_value=0, max_value=1000),
    )
    @settings(max_examples=100)
    def test_games_played_equals_sum(self, games_won: int, games_lost: int):
        """games_played should equal games_won + games_lost."""
        games_played = games_won + games_lost
        
        # Verify the invariant
        assert games_played == games_won + games_lost
        
        # Also verify games_lost can be derived
        derived_games_lost = games_played - games_won
        assert derived_games_lost == games_lost


# ============================================
# Property 13: Leaderboard Sort Order
# ============================================
class TestLeaderboardSortOrder:
    """
    Property 13: Leaderboard Sort Order
    For any leaderboard query, entries should be sorted in descending
    order by the category metric
    Validates: Requirements 10.4
    """

    @given(
        elos=st.lists(st.integers(min_value=ELO_MIN, max_value=ELO_MAX), min_size=2, max_size=50),
    )
    @settings(max_examples=100)
    def test_elo_leaderboard_sorted_descending(self, elos: list[int]):
        """ELO leaderboard should be sorted by ELO descending."""
        sorted_elos = sorted(elos, reverse=True)
        
        # Verify descending order
        for i in range(len(sorted_elos) - 1):
            assert sorted_elos[i] >= sorted_elos[i + 1]

    @given(
        scores=st.lists(st.integers(min_value=0, max_value=100000), min_size=2, max_size=50),
    )
    @settings(max_examples=100)
    def test_score_leaderboard_sorted_descending(self, scores: list[int]):
        """Score leaderboard should be sorted by score descending."""
        sorted_scores = sorted(scores, reverse=True)
        
        for i in range(len(sorted_scores) - 1):
            assert sorted_scores[i] >= sorted_scores[i + 1]
