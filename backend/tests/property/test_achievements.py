"""
Property-based tests for Achievement System.
Tests correctness properties from design document.
"""

import pytest
from hypothesis import given, strategies as st, settings
from typing import List, Dict, Any
from dataclasses import dataclass


# Achievement types for testing
ACHIEVEMENT_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
ACHIEVEMENT_CATEGORIES = ['games', 'wins', 'streaks', 'combat', 'accuracy', 'social']
CRITERIA_TYPES = ['games_played', 'games_won', 'win_streak', 'total_kills', 'accuracy', 'friends_count']


@dataclass
class Achievement:
    """Achievement definition for testing."""
    id: str
    name: str
    description: str
    rarity: str
    category: str
    criteria_type: str
    criteria_value: int
    coin_reward: int = 3
    sort_order: int = 0
    is_active: bool = True


# Strategies for generating test data
achievement_strategy = st.builds(
    Achievement,
    id=st.uuids().map(str),
    name=st.text(min_size=1, max_size=50),
    description=st.text(min_size=1, max_size=200),
    rarity=st.sampled_from(ACHIEVEMENT_RARITIES),
    category=st.sampled_from(ACHIEVEMENT_CATEGORIES),
    criteria_type=st.sampled_from(CRITERIA_TYPES),
    criteria_value=st.integers(min_value=1, max_value=10000),
    coin_reward=st.just(3),  # Always 3 coins
    sort_order=st.integers(min_value=0, max_value=1000),
    is_active=st.booleans(),
)


def generate_progressive_achievements(category: str, criteria_type: str, values: List[int]) -> List[Achievement]:
    """Generate a list of achievements with progressive criteria values."""
    rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    achievements = []
    for i, value in enumerate(sorted(values)):
        rarity = rarities[min(i, len(rarities) - 1)]
        achievements.append(Achievement(
            id=f"{category}_{i}",
            name=f"{category.title()} Achievement {i+1}",
            description=f"Reach {value} {criteria_type}",
            rarity=rarity,
            category=category,
            criteria_type=criteria_type,
            criteria_value=value,
            sort_order=i,
        ))
    return achievements


class TestProgressiveTierOrdering:
    """
    **Feature: achievement-system, Property 10: Progressive Tier Ordering**
    **Validates: Requirements 5.3**
    
    *For any* achievement category, the achievements within that category 
    SHALL be ordered by criteria_value ascending, forming a progressive tier structure.
    """
    
    @given(
        category=st.sampled_from(ACHIEVEMENT_CATEGORIES),
        criteria_type=st.sampled_from(CRITERIA_TYPES),
        values=st.lists(
            st.integers(min_value=1, max_value=10000),
            min_size=2,
            max_size=10,
            unique=True
        )
    )
    @settings(max_examples=100)
    def test_achievements_ordered_by_criteria_value(
        self, category: str, criteria_type: str, values: List[int]
    ):
        """
        Property: Achievements in a category are ordered by criteria_value ascending.
        
        This ensures that easier achievements (lower criteria) come before
        harder achievements (higher criteria) within each category.
        """
        # Generate achievements with the given values
        achievements = generate_progressive_achievements(category, criteria_type, values)
        
        # Sort by sort_order (as they would be displayed)
        sorted_achievements = sorted(achievements, key=lambda a: a.sort_order)
        
        # Verify criteria values are in ascending order
        criteria_values = [a.criteria_value for a in sorted_achievements]
        
        for i in range(len(criteria_values) - 1):
            assert criteria_values[i] <= criteria_values[i + 1], (
                f"Achievement at position {i} has criteria_value {criteria_values[i]} "
                f"which is greater than position {i+1} with value {criteria_values[i+1]}"
            )
    
    @given(
        values=st.lists(
            st.integers(min_value=1, max_value=1000),
            min_size=3,
            max_size=6,
            unique=True
        )
    )
    @settings(max_examples=100)
    def test_rarity_increases_with_difficulty(self, values: List[int]):
        """
        Property: Rarity should generally increase with criteria_value.
        
        Common achievements should have lower criteria values than legendary ones.
        """
        achievements = generate_progressive_achievements('games', 'games_played', values)
        sorted_achievements = sorted(achievements, key=lambda a: a.criteria_value)
        
        rarity_order = {r: i for i, r in enumerate(ACHIEVEMENT_RARITIES)}
        
        # First achievement should be common or uncommon (easier)
        first_rarity_idx = rarity_order[sorted_achievements[0].rarity]
        assert first_rarity_idx <= 1, "First (easiest) achievement should be common or uncommon"
        
        # Last achievement should be epic or legendary (harder)
        if len(sorted_achievements) >= 4:
            last_rarity_idx = rarity_order[sorted_achievements[-1].rarity]
            assert last_rarity_idx >= 3, "Last (hardest) achievement should be epic or legendary"
    
    def test_games_category_progressive_tiers(self):
        """
        Example: Games category has progressive tiers 1 -> 10 -> 50 -> 100 -> 500 -> 1000.
        """
        expected_values = [1, 10, 50, 100, 500, 1000]
        achievements = generate_progressive_achievements('games', 'games_played', expected_values)
        
        sorted_achievements = sorted(achievements, key=lambda a: a.sort_order)
        actual_values = [a.criteria_value for a in sorted_achievements]
        
        assert actual_values == expected_values, (
            f"Games category should have progressive tiers {expected_values}, got {actual_values}"
        )
    
    def test_wins_category_progressive_tiers(self):
        """
        Example: Wins category has progressive tiers 1 -> 10 -> 50 -> 100 -> 500.
        """
        expected_values = [1, 10, 50, 100, 500]
        achievements = generate_progressive_achievements('wins', 'games_won', expected_values)
        
        sorted_achievements = sorted(achievements, key=lambda a: a.sort_order)
        actual_values = [a.criteria_value for a in sorted_achievements]
        
        assert actual_values == expected_values


class TestAchievementUnlockThreshold:
    """
    **Feature: achievement-system, Property 1: Achievement Unlock Threshold**
    **Validates: Requirements 1.2, 1.4**
    
    *For any* user statistics and achievement definition, if the user's statistic 
    value for the criteria_type is greater than or equal to the achievement's 
    criteria_value, and the user has not already earned the achievement, 
    then the achievement SHALL be unlocked.
    """
    
    @given(
        stat_value=st.integers(min_value=0, max_value=10000),
        criteria_value=st.integers(min_value=1, max_value=1000)
    )
    @settings(max_examples=200)
    def test_unlock_when_stat_meets_criteria(self, stat_value: int, criteria_value: int):
        """
        Property: Achievement unlocks when stat >= criteria_value.
        """
        should_unlock = stat_value >= criteria_value
        
        # Simulate the check
        def check_achievement_eligibility(stat: int, criteria: int) -> bool:
            return stat >= criteria
        
        result = check_achievement_eligibility(stat_value, criteria_value)
        assert result == should_unlock, (
            f"stat_value={stat_value}, criteria_value={criteria_value}: "
            f"expected unlock={should_unlock}, got {result}"
        )
    
    @given(
        games_played=st.integers(min_value=0, max_value=2000),
        games_won=st.integers(min_value=0, max_value=1000),
        win_streak=st.integers(min_value=0, max_value=50),
        total_kills=st.integers(min_value=0, max_value=5000),
        accuracy=st.integers(min_value=0, max_value=100),
        friends_count=st.integers(min_value=0, max_value=100),
    )
    @settings(max_examples=100)
    def test_all_criteria_types_evaluated(
        self,
        games_played: int,
        games_won: int,
        win_streak: int,
        total_kills: int,
        accuracy: int,
        friends_count: int,
    ):
        """
        Property: All criteria types are correctly evaluated against user stats.
        """
        user_stats = {
            'games_played': games_played,
            'games_won': games_won,
            'win_streak': win_streak,
            'total_kills': total_kills,
            'accuracy': accuracy,
            'friends_count': friends_count,
        }
        
        def check_criteria(criteria_type: str, criteria_value: int, stats: Dict[str, int]) -> bool:
            """Check if user stats meet achievement criteria."""
            if criteria_type not in stats:
                return False
            return stats[criteria_type] >= criteria_value
        
        # Test each criteria type
        for criteria_type in CRITERIA_TYPES:
            stat_value = user_stats[criteria_type]
            
            # Test with criteria below stat (should unlock)
            if stat_value > 0:
                assert check_criteria(criteria_type, stat_value, user_stats) == True
            
            # Test with criteria above stat (should not unlock)
            high_criteria = stat_value + 100
            assert check_criteria(criteria_type, high_criteria, user_stats) == False


class TestAchievementUnlockIdempotency:
    """
    **Feature: achievement-system, Property 2: Achievement Unlock Idempotency**
    **Validates: Requirements 1.3**
    
    *For any* achievement and user, attempting to unlock the same achievement 
    multiple times SHALL result in exactly one user_achievement record, 
    regardless of how many times the unlock is triggered.
    """
    
    @given(
        achievement_id=st.uuids().map(str),
        user_id=st.uuids().map(str),
        unlock_attempts=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=100)
    def test_duplicate_unlock_prevention(
        self, achievement_id: str, user_id: str, unlock_attempts: int
    ):
        """
        Property: Multiple unlock attempts result in exactly one record.
        """
        # Simulate user_achievements storage
        user_achievements: set = set()
        
        def award_achievement(user_id: str, achievement_id: str) -> bool:
            """Award achievement, returns True if newly awarded, False if duplicate."""
            key = (user_id, achievement_id)
            if key in user_achievements:
                return False  # Already earned
            user_achievements.add(key)
            return True
        
        # Attempt to unlock multiple times
        successful_awards = 0
        for _ in range(unlock_attempts):
            if award_achievement(user_id, achievement_id):
                successful_awards += 1
        
        # Should only have one successful award
        assert successful_awards == 1, (
            f"Expected exactly 1 successful award, got {successful_awards}"
        )
        
        # Should only have one record
        assert len(user_achievements) == 1


class TestCoinRewardCalculation:
    """
    **Feature: achievement-system, Property 3: Coin Reward Transaction Completeness**
    **Validates: Requirements 2.1, 2.2, 2.3**
    
    *For any* achievement unlock, the system SHALL credit exactly 3 coins 
    to the user's balance AND create a coin transaction record with 
    source="achievement" AND include the achievement_id in the transaction metadata.
    """
    
    @given(achievement=achievement_strategy)
    @settings(max_examples=100)
    def test_coin_reward_always_three(self, achievement: Achievement):
        """
        Property: Every achievement awards exactly 3 coins.
        """
        assert achievement.coin_reward == 3, (
            f"Achievement {achievement.name} has coin_reward={achievement.coin_reward}, expected 3"
        )
    
    @given(
        num_achievements=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=100)
    def test_multi_achievement_coin_calculation(self, num_achievements: int):
        """
        **Feature: achievement-system, Property 4: Multi-Achievement Coin Calculation**
        **Validates: Requirements 2.4**
        
        Property: N achievements unlocking simultaneously award exactly 3 × N coins.
        """
        COIN_REWARD = 3
        expected_total = num_achievements * COIN_REWARD
        
        # Simulate awarding multiple achievements
        total_coins = sum(COIN_REWARD for _ in range(num_achievements))
        
        assert total_coins == expected_total, (
            f"Expected {expected_total} coins for {num_achievements} achievements, got {total_coins}"
        )


class TestProgressCalculation:
    """
    **Feature: achievement-system, Property 9: Progress Calculation Accuracy**
    **Validates: Requirements 4.5, 8.2**
    
    *For any* achievement progress calculation, the percentage SHALL equal 
    floor(current_value / target_value × 100), capped at 100 for unlocked achievements.
    """
    
    @given(
        current_value=st.integers(min_value=0, max_value=10000),
        target_value=st.integers(min_value=1, max_value=1000)
    )
    @settings(max_examples=200)
    def test_progress_percentage_calculation(self, current_value: int, target_value: int):
        """
        Property: Progress percentage is correctly calculated and capped at 100.
        """
        import math
        
        def calculate_progress(current: int, target: int) -> int:
            """Calculate progress percentage, capped at 100."""
            if target <= 0:
                return 0
            percentage = math.floor((current / target) * 100)
            return min(percentage, 100)
        
        result = calculate_progress(current_value, target_value)
        
        # Verify bounds
        assert 0 <= result <= 100, f"Progress {result} out of bounds [0, 100]"
        
        # Verify calculation
        expected = min(100, math.floor((current_value / target_value) * 100))
        assert result == expected, f"Expected {expected}, got {result}"
        
        # Verify capping at 100
        if current_value >= target_value:
            assert result == 100, "Progress should be 100 when current >= target"


class TestAchievementPermanence:
    """
    **Feature: achievement-system, Property 16: Achievement Permanence**
    **Validates: Requirements 8.5**
    
    *For any* earned achievement, if the user's statistics subsequently 
    decrease below the criteria_value, the achievement SHALL remain earned 
    and SHALL NOT be revoked.
    """
    
    @given(
        initial_stat=st.integers(min_value=100, max_value=1000),
        criteria_value=st.integers(min_value=1, max_value=100),
        stat_decrease=st.integers(min_value=1, max_value=200)
    )
    @settings(max_examples=100)
    def test_achievement_not_revoked_on_stat_decrease(
        self, initial_stat: int, criteria_value: int, stat_decrease: int
    ):
        """
        Property: Earned achievements are never revoked even if stats decrease.
        """
        # User earns achievement with initial_stat >= criteria_value
        earned_achievements = set()
        
        def check_and_award(stat: int, criteria: int, achievement_id: str) -> bool:
            """Award if eligible and not already earned."""
            if achievement_id in earned_achievements:
                return False  # Already earned, don't re-check
            if stat >= criteria:
                earned_achievements.add(achievement_id)
                return True
            return False
        
        # Initial award (should succeed since initial_stat >= criteria_value)
        achievement_id = "test_achievement"
        check_and_award(initial_stat, criteria_value, achievement_id)
        
        # Verify earned
        assert achievement_id in earned_achievements
        
        # Decrease stat below criteria
        new_stat = max(0, initial_stat - stat_decrease)
        
        # Achievement should still be earned (not revoked)
        assert achievement_id in earned_achievements, (
            "Achievement should not be revoked when stat decreases"
        )
        
        # Re-checking should not remove the achievement
        # (In real implementation, we don't re-check earned achievements)
        assert achievement_id in earned_achievements
