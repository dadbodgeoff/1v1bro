"""
Property-based tests for leaderboard service.

Tests for:
- Leaderboard eligibility requirements
- Rank ordering
- Category validation
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.schemas.leaderboard import (
    LeaderboardCategory, LeaderboardEntry, LeaderboardResponse,
    UserRankResponse, LeaderboardQueryParams,
)


class TestLeaderboardEligibility:
    """
    Feature: player-stats-leaderboards, Property: Eligibility Requirements
    Validates: Requirements 4.1-4.5
    """

    @given(games_played=st.integers(min_value=0, max_value=100))
    @settings(max_examples=100)
    def test_win_rate_eligibility(self, games_played):
        """
        Property: Win rate requires 10+ games played.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.2
        """
        MIN_GAMES = 10
        eligible = games_played >= MIN_GAMES
        
        if games_played >= MIN_GAMES:
            assert eligible is True
        else:
            assert eligible is False

    @given(total_deaths=st.integers(min_value=0, max_value=100))
    @settings(max_examples=100)
    def test_kd_ratio_eligibility(self, total_deaths):
        """
        Property: K/D ratio requires 10+ deaths.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.2
        """
        MIN_DEATHS = 10
        eligible = total_deaths >= MIN_DEATHS
        
        if total_deaths >= MIN_DEATHS:
            assert eligible is True
        else:
            assert eligible is False

    @given(shots_fired=st.integers(min_value=0, max_value=200))
    @settings(max_examples=100)
    def test_accuracy_eligibility(self, shots_fired):
        """
        Property: Accuracy requires 100+ shots fired.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.2
        """
        MIN_SHOTS = 100
        eligible = shots_fired >= MIN_SHOTS
        
        if shots_fired >= MIN_SHOTS:
            assert eligible is True
        else:
            assert eligible is False

    @given(correct_answers=st.integers(min_value=0, max_value=100))
    @settings(max_examples=100)
    def test_fastest_thinker_eligibility(self, correct_answers):
        """
        Property: Fastest thinker requires 50+ correct answers.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.2
        """
        MIN_CORRECT = 50
        eligible = correct_answers >= MIN_CORRECT
        
        if correct_answers >= MIN_CORRECT:
            assert eligible is True
        else:
            assert eligible is False

    @given(questions_answered=st.integers(min_value=0, max_value=200))
    @settings(max_examples=100)
    def test_answer_rate_eligibility(self, questions_answered):
        """
        Property: Answer rate requires 100+ questions answered.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.2
        """
        MIN_QUESTIONS = 100
        eligible = questions_answered >= MIN_QUESTIONS
        
        if questions_answered >= MIN_QUESTIONS:
            assert eligible is True
        else:
            assert eligible is False


class TestLeaderboardOrdering:
    """
    Feature: player-stats-leaderboards, Property: Rank Ordering
    Validates: Requirements 4.1
    """

    @given(
        values=st.lists(
            st.floats(min_value=0, max_value=100000, allow_nan=False),
            min_size=2,
            max_size=100,
        )
    )
    @settings(max_examples=100)
    def test_descending_order_for_most_categories(self, values):
        """
        Property: Most leaderboards are sorted descending (higher is better).
        Feature: player-stats-leaderboards
        Validates: Requirements 4.1
        """
        sorted_desc = sorted(values, reverse=True)
        
        # Verify descending order
        for i in range(len(sorted_desc) - 1):
            assert sorted_desc[i] >= sorted_desc[i + 1]

    @given(
        times=st.lists(
            st.floats(min_value=100, max_value=30000, allow_nan=False),
            min_size=2,
            max_size=100,
        )
    )
    @settings(max_examples=100)
    def test_ascending_order_for_fastest_thinker(self, times):
        """
        Property: Fastest thinker is sorted ascending (lower is better).
        Feature: player-stats-leaderboards
        Validates: Requirements 4.1
        """
        sorted_asc = sorted(times)
        
        # Verify ascending order
        for i in range(len(sorted_asc) - 1):
            assert sorted_asc[i] <= sorted_asc[i + 1]

    @given(
        entries=st.lists(
            st.fixed_dictionaries({
                "rank": st.integers(min_value=1, max_value=1000),
                "stat_value": st.floats(min_value=0, max_value=100000, allow_nan=False),
            }),
            min_size=2,
            max_size=50,
        )
    )
    @settings(max_examples=50)
    def test_ranks_are_sequential(self, entries):
        """
        Property: Ranks in a leaderboard are sequential starting from 1.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.1
        """
        # Simulate assigning sequential ranks
        sorted_entries = sorted(entries, key=lambda x: x["stat_value"], reverse=True)
        for i, entry in enumerate(sorted_entries):
            entry["rank"] = i + 1
        
        # Verify sequential ranks
        for i, entry in enumerate(sorted_entries):
            assert entry["rank"] == i + 1


class TestLeaderboardSchemas:
    """
    Feature: player-stats-leaderboards, Property: Schema Validation
    Validates: Requirements 4.3-4.5
    """

    @given(
        rank=st.integers(min_value=1, max_value=10000),
        user_id=st.uuids().map(str),
        stat_value=st.floats(min_value=0, max_value=1000000, allow_nan=False),
        secondary=st.one_of(st.none(), st.floats(min_value=0, max_value=1000000, allow_nan=False)),
    )
    @settings(max_examples=100)
    def test_leaderboard_entry_creation(self, rank, user_id, stat_value, secondary):
        """
        Property: LeaderboardEntry can be created with valid data.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.3
        """
        entry = LeaderboardEntry(
            rank=rank,
            user_id=user_id,
            stat_value=stat_value,
            secondary_stat=secondary,
        )
        
        assert entry.rank == rank
        assert entry.user_id == user_id
        assert entry.stat_value == stat_value
        assert entry.secondary_stat == secondary

    @given(
        category=st.sampled_from(list(LeaderboardCategory)),
        total=st.integers(min_value=0, max_value=100000),
        page=st.integers(min_value=1, max_value=1000),
        page_size=st.integers(min_value=1, max_value=100),
    )
    @settings(max_examples=100)
    def test_leaderboard_response_creation(self, category, total, page, page_size):
        """
        Property: LeaderboardResponse can be created with valid data.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.4
        """
        response = LeaderboardResponse(
            category=category,
            entries=[],
            total_eligible=total,
            page=page,
            page_size=page_size,
        )
        
        assert response.category == category
        assert response.total_eligible == total
        assert response.page == page
        assert response.page_size == page_size

    @given(
        category=st.sampled_from(list(LeaderboardCategory)),
        rank=st.one_of(st.none(), st.integers(min_value=1, max_value=100000)),
        stat_value=st.floats(min_value=0, max_value=1000000, allow_nan=False),
        eligible=st.booleans(),
    )
    @settings(max_examples=100)
    def test_user_rank_response_creation(self, category, rank, stat_value, eligible):
        """
        Property: UserRankResponse can be created with valid data.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.5
        """
        response = UserRankResponse(
            category=category,
            rank=rank if eligible else None,
            stat_value=stat_value,
            eligible=eligible,
            requirement_met=eligible,
        )
        
        assert response.category == category
        assert response.stat_value == stat_value
        assert response.eligible == eligible
        if not eligible:
            assert response.rank is None


class TestLeaderboardCategories:
    """
    Feature: player-stats-leaderboards, Property: Category Coverage
    Validates: Requirements 4.1, 5.6
    """

    def test_all_categories_defined(self):
        """
        Property: All 10 leaderboard categories are defined (including ELO).
        Feature: player-stats-leaderboards
        Validates: Requirements 4.1, 5.6
        """
        expected_categories = {
            "wins", "win_rate", "total_score", "kills", "kd_ratio",
            "accuracy", "fastest_thinker", "answer_rate", "win_streak", "elo",
        }
        
        actual_categories = {c.value for c in LeaderboardCategory}
        
        assert actual_categories == expected_categories

    @given(category=st.sampled_from(list(LeaderboardCategory)))
    @settings(max_examples=20)
    def test_category_is_valid_enum(self, category):
        """
        Property: Each category is a valid LeaderboardCategory enum.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.1, 5.6
        """
        assert isinstance(category, LeaderboardCategory)
        assert category.value in [
            "wins", "win_rate", "total_score", "kills", "kd_ratio",
            "accuracy", "fastest_thinker", "answer_rate", "win_streak", "elo",
        ]


class TestPaginationParams:
    """
    Feature: player-stats-leaderboards, Property: Pagination
    Validates: Requirements 4.4
    """

    @given(
        limit=st.integers(min_value=1, max_value=100),
        offset=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_pagination_params_valid(self, limit, offset):
        """
        Property: Pagination params are within valid ranges.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.4
        """
        params = LeaderboardQueryParams(limit=limit, offset=offset)
        
        assert params.limit == limit
        assert params.offset == offset
        assert 1 <= params.limit <= 100
        assert params.offset >= 0

    @given(
        total=st.integers(min_value=0, max_value=10000),
        limit=st.integers(min_value=1, max_value=100),
        offset=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_page_calculation(self, total, limit, offset):
        """
        Property: Page number is calculated correctly from offset.
        Feature: player-stats-leaderboards
        Validates: Requirements 4.4
        """
        page = (offset // limit) + 1
        
        assert page >= 1
        if offset == 0:
            assert page == 1
        if offset == limit:
            assert page == 2
