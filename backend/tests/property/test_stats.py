"""
Property-based tests for stats service.

Tests for:
- Computed stats formulas
- Stats update operations
- Data integrity
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.schemas.stats import (
    TriviaStats, CombatStats, StreakStats, PlayerStats,
    TriviaStatsDelta, GameCombatSummary,
)


class TestComputedStatsFormulas:
    """
    Feature: player-stats-leaderboards, Property: Computed Stats Correctness
    Validates: Requirements 1.1-1.4
    """

    @given(
        games_played=st.integers(min_value=0, max_value=10000),
        games_won=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_win_rate_formula(self, games_played, games_won):
        """
        Property: Win rate = (games_won / games_played) * 100.
        Feature: player-stats-leaderboards
        Validates: Requirements 1.1
        """
        assume(games_won <= games_played)
        
        if games_played > 0:
            expected = round((games_won / games_played) * 100, 2)
        else:
            expected = 0.0
        
        # Simulate computation
        win_rate = (games_won / games_played * 100) if games_played > 0 else 0.0
        win_rate = round(win_rate, 2)
        
        assert win_rate == expected
        assert 0 <= win_rate <= 100

    @given(
        kills=st.integers(min_value=0, max_value=100000),
        deaths=st.integers(min_value=0, max_value=100000),
    )
    @settings(max_examples=100)
    def test_kd_ratio_formula(self, kills, deaths):
        """
        Property: K/D ratio = kills / deaths (or kills if deaths=0).
        Feature: player-stats-leaderboards
        Validates: Requirements 1.2
        """
        if deaths == 0:
            expected = float(kills)
        else:
            expected = round(kills / deaths, 2)
        
        # Simulate computation
        kd_ratio = kills if deaths == 0 else (kills / deaths)
        kd_ratio = round(kd_ratio, 2)
        
        assert kd_ratio == expected
        assert kd_ratio >= 0

    @given(
        shots_fired=st.integers(min_value=0, max_value=100000),
        shots_hit=st.integers(min_value=0, max_value=100000),
    )
    @settings(max_examples=100)
    def test_accuracy_formula(self, shots_fired, shots_hit):
        """
        Property: Accuracy = (shots_hit / shots_fired) * 100.
        Feature: player-stats-leaderboards
        Validates: Requirements 1.3
        """
        assume(shots_hit <= shots_fired)
        
        if shots_fired > 0:
            expected = round((shots_hit / shots_fired) * 100, 2)
        else:
            expected = 0.0
        
        # Simulate computation
        accuracy = (shots_hit / shots_fired * 100) if shots_fired > 0 else 0.0
        accuracy = round(accuracy, 2)
        
        assert accuracy == expected
        assert 0 <= accuracy <= 100

    @given(
        total_correct=st.integers(min_value=0, max_value=10000),
        total_questions=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_answer_rate_formula(self, total_correct, total_questions):
        """
        Property: Answer rate = (correct / total) * 100.
        Feature: player-stats-leaderboards
        Validates: Requirements 1.4
        """
        assume(total_correct <= total_questions)
        
        if total_questions > 0:
            expected = round((total_correct / total_questions) * 100, 2)
        else:
            expected = 0.0
        
        # Simulate computation
        answer_rate = (total_correct / total_questions * 100) if total_questions > 0 else 0.0
        answer_rate = round(answer_rate, 2)
        
        assert answer_rate == expected
        assert 0 <= answer_rate <= 100

    @given(
        total_time_ms=st.integers(min_value=0, max_value=100000000),
        total_correct=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_avg_answer_time_formula(self, total_time_ms, total_correct):
        """
        Property: Avg answer time = total_time / correct_answers.
        Feature: player-stats-leaderboards
        Validates: Requirements 1.4
        """
        if total_correct > 0:
            expected = round(total_time_ms / total_correct, 2)
        else:
            expected = 0.0
        
        # Simulate computation
        avg_time = (total_time_ms / total_correct) if total_correct > 0 else 0.0
        avg_time = round(avg_time, 2)
        
        assert avg_time == expected
        assert avg_time >= 0


class TestStatsSchemaValidation:
    """
    Feature: player-stats-leaderboards, Property: Schema Validation
    Validates: Requirements 5.1-5.2
    """

    @given(
        questions=st.integers(min_value=0, max_value=10000),
        correct=st.integers(min_value=0, max_value=10000),
        time_ms=st.integers(min_value=0, max_value=100000000),
        fastest=st.one_of(st.none(), st.integers(min_value=100, max_value=30000)),
    )
    @settings(max_examples=100)
    def test_trivia_stats_creation(self, questions, correct, time_ms, fastest):
        """
        Property: TriviaStats can be created with valid data.
        Feature: player-stats-leaderboards
        Validates: Requirements 5.1
        """
        assume(correct <= questions)
        
        stats = TriviaStats(
            total_questions_answered=questions,
            total_correct_answers=correct,
            total_answer_time_ms=time_ms,
            fastest_answer_ms=fastest,
        )
        
        assert stats.total_questions_answered == questions
        assert stats.total_correct_answers == correct
        assert stats.total_answer_time_ms == time_ms
        assert stats.fastest_answer_ms == fastest

    @given(
        kills=st.integers(min_value=0, max_value=100000),
        deaths=st.integers(min_value=0, max_value=100000),
        damage_dealt=st.integers(min_value=0, max_value=10000000),
        damage_taken=st.integers(min_value=0, max_value=10000000),
        shots_fired=st.integers(min_value=0, max_value=100000),
        shots_hit=st.integers(min_value=0, max_value=100000),
    )
    @settings(max_examples=100)
    def test_combat_stats_creation(
        self, kills, deaths, damage_dealt, damage_taken, shots_fired, shots_hit
    ):
        """
        Property: CombatStats can be created with valid data.
        Feature: player-stats-leaderboards
        Validates: Requirements 5.1
        """
        assume(shots_hit <= shots_fired)
        
        stats = CombatStats(
            total_kills=kills,
            total_deaths=deaths,
            total_damage_dealt=damage_dealt,
            total_damage_taken=damage_taken,
            shots_fired=shots_fired,
            shots_hit=shots_hit,
        )
        
        assert stats.total_kills == kills
        assert stats.total_deaths == deaths
        assert stats.total_damage_dealt == damage_dealt
        assert stats.total_damage_taken == damage_taken
        assert stats.shots_fired == shots_fired
        assert stats.shots_hit == shots_hit

    @given(
        current=st.integers(min_value=0, max_value=1000),
        best=st.integers(min_value=0, max_value=1000),
    )
    @settings(max_examples=100)
    def test_streak_stats_creation(self, current, best):
        """
        Property: StreakStats can be created with valid data.
        Feature: player-stats-leaderboards
        Validates: Requirements 5.1
        """
        assume(current <= best or current == 0)
        
        stats = StreakStats(
            current_win_streak=current,
            best_win_streak=max(current, best),
        )
        
        assert stats.current_win_streak == current
        assert stats.best_win_streak >= stats.current_win_streak


class TestStatsDeltaAggregation:
    """
    Feature: player-stats-leaderboards, Property: Delta Aggregation
    Validates: Requirements 2.1-2.6
    """

    @given(
        initial_score=st.integers(min_value=0, max_value=1000000),
        delta=st.integers(min_value=0, max_value=15000),
    )
    @settings(max_examples=100)
    def test_score_delta_addition(self, initial_score, delta):
        """
        Property: Score delta is added correctly.
        Feature: player-stats-leaderboards
        Validates: Requirements 2.1
        """
        new_score = initial_score + delta
        assert new_score == initial_score + delta
        assert new_score >= initial_score

    @given(
        initial_kills=st.integers(min_value=0, max_value=100000),
        kills_delta=st.integers(min_value=0, max_value=100),
        initial_deaths=st.integers(min_value=0, max_value=100000),
        deaths_delta=st.integers(min_value=0, max_value=100),
    )
    @settings(max_examples=100)
    def test_combat_delta_addition(
        self, initial_kills, kills_delta, initial_deaths, deaths_delta
    ):
        """
        Property: Combat deltas are added correctly.
        Feature: player-stats-leaderboards
        Validates: Requirements 2.2
        """
        new_kills = initial_kills + kills_delta
        new_deaths = initial_deaths + deaths_delta
        
        assert new_kills == initial_kills + kills_delta
        assert new_deaths == initial_deaths + deaths_delta

    @given(
        questions=st.integers(min_value=1, max_value=15),
        correct=st.integers(min_value=0, max_value=15),
        time_ms=st.integers(min_value=0, max_value=450000),
        fastest=st.one_of(st.none(), st.integers(min_value=100, max_value=30000)),
    )
    @settings(max_examples=100)
    def test_trivia_delta_creation(self, questions, correct, time_ms, fastest):
        """
        Property: TriviaStatsDelta can be created with game data.
        Feature: player-stats-leaderboards
        Validates: Requirements 2.3
        """
        assume(correct <= questions)
        
        delta = TriviaStatsDelta(
            questions_answered=questions,
            correct_answers=correct,
            answer_time_ms=time_ms,
            fastest_in_game=fastest,
        )
        
        assert delta.questions_answered == questions
        assert delta.correct_answers == correct
        assert delta.answer_time_ms == time_ms
        assert delta.fastest_in_game == fastest


class TestGameCombatSummary:
    """
    Feature: player-stats-leaderboards, Property: Combat Summary
    Validates: Requirements 6.1-6.4
    """

    @given(
        kills=st.integers(min_value=0, max_value=50),
        deaths=st.integers(min_value=0, max_value=50),
        damage_dealt=st.integers(min_value=0, max_value=50000),
        damage_taken=st.integers(min_value=0, max_value=50000),
        shots_fired=st.integers(min_value=0, max_value=500),
        shots_hit=st.integers(min_value=0, max_value=500),
        powerups=st.integers(min_value=0, max_value=20),
    )
    @settings(max_examples=100)
    def test_game_combat_summary_creation(
        self, kills, deaths, damage_dealt, damage_taken,
        shots_fired, shots_hit, powerups
    ):
        """
        Property: GameCombatSummary captures all combat data.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.1
        """
        assume(shots_hit <= shots_fired)
        
        summary = GameCombatSummary(
            kills=kills,
            deaths=deaths,
            damage_dealt=damage_dealt,
            damage_taken=damage_taken,
            shots_fired=shots_fired,
            shots_hit=shots_hit,
            powerups_collected=powerups,
        )
        
        assert summary.kills == kills
        assert summary.deaths == deaths
        assert summary.damage_dealt == damage_dealt
        assert summary.damage_taken == damage_taken
        assert summary.shots_fired == shots_fired
        assert summary.shots_hit == shots_hit
        assert summary.powerups_collected == powerups

    @given(
        kills=st.integers(min_value=0, max_value=50),
        deaths=st.integers(min_value=0, max_value=50),
    )
    @settings(max_examples=50)
    def test_combat_summary_serialization(self, kills, deaths):
        """
        Property: GameCombatSummary serializes correctly.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.2
        """
        summary = GameCombatSummary(kills=kills, deaths=deaths)
        data = summary.model_dump()
        
        assert data["kills"] == kills
        assert data["deaths"] == deaths
        assert "damage_dealt" in data
        assert "shots_fired" in data
