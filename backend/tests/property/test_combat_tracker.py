"""
Property-based tests for combat tracker.

Tests for:
- Event recording
- Summary aggregation
- Session management
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.utils.combat_tracker import CombatTracker


class TestCombatTrackerInitialization:
    """
    Feature: player-stats-leaderboards, Property: Combat Tracker Init
    Validates: Requirements 6.1
    """

    def setup_method(self):
        """Clear tracker before each test."""
        CombatTracker.clear_all()

    @given(
        lobby_id=st.uuids().map(str),
        player_ids=st.lists(st.uuids().map(str), min_size=2, max_size=4, unique=True),
    )
    @settings(max_examples=50)
    def test_initialize_creates_session(self, lobby_id, player_ids):
        """
        Property: Initialize creates tracking for all players.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.1
        """
        CombatTracker.initialize(lobby_id, player_ids)
        
        # Verify each player has empty summary
        for pid in player_ids:
            summary = CombatTracker.get_summary(lobby_id, pid)
            assert summary["kills"] == 0
            assert summary["deaths"] == 0
            assert summary["damage_dealt"] == 0
            assert summary["shots_fired"] == 0
        
        CombatTracker.cleanup(lobby_id)

    @given(lobby_id=st.uuids().map(str))
    @settings(max_examples=50)
    def test_uninitialized_lobby_returns_empty(self, lobby_id):
        """
        Property: Uninitialized lobby returns empty summary.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.1
        """
        summary = CombatTracker.get_summary(lobby_id, "unknown-player")
        
        assert summary["kills"] == 0
        assert summary["deaths"] == 0
        assert summary["damage_dealt"] == 0


class TestKillTracking:
    """
    Feature: player-stats-leaderboards, Property: Kill Tracking
    Validates: Requirements 6.2
    """

    def setup_method(self):
        """Clear tracker before each test."""
        CombatTracker.clear_all()

    @given(
        lobby_id=st.uuids().map(str),
        killer_id=st.uuids().map(str),
        victim_id=st.uuids().map(str),
        kill_count=st.integers(min_value=1, max_value=20),
    )
    @settings(max_examples=50)
    def test_kills_are_counted(self, lobby_id, killer_id, victim_id, kill_count):
        """
        Property: Kills are counted correctly for killer.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.2
        """
        assume(killer_id != victim_id)
        
        CombatTracker.initialize(lobby_id, [killer_id, victim_id])
        
        for _ in range(kill_count):
            CombatTracker.record_kill(lobby_id, killer_id, victim_id)
        
        killer_summary = CombatTracker.get_summary(lobby_id, killer_id)
        victim_summary = CombatTracker.get_summary(lobby_id, victim_id)
        
        assert killer_summary["kills"] == kill_count
        assert victim_summary["deaths"] == kill_count
        
        CombatTracker.cleanup(lobby_id)

    @given(
        lobby_id=st.uuids().map(str),
        p1_id=st.uuids().map(str),
        p2_id=st.uuids().map(str),
        p1_kills=st.integers(min_value=0, max_value=10),
        p2_kills=st.integers(min_value=0, max_value=10),
    )
    @settings(max_examples=50)
    def test_mutual_kills_tracked_separately(
        self, lobby_id, p1_id, p2_id, p1_kills, p2_kills
    ):
        """
        Property: Mutual kills are tracked separately for each player.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.2
        """
        assume(p1_id != p2_id)
        
        CombatTracker.initialize(lobby_id, [p1_id, p2_id])
        
        for _ in range(p1_kills):
            CombatTracker.record_kill(lobby_id, p1_id, p2_id)
        for _ in range(p2_kills):
            CombatTracker.record_kill(lobby_id, p2_id, p1_id)
        
        p1_summary = CombatTracker.get_summary(lobby_id, p1_id)
        p2_summary = CombatTracker.get_summary(lobby_id, p2_id)
        
        assert p1_summary["kills"] == p1_kills
        assert p1_summary["deaths"] == p2_kills
        assert p2_summary["kills"] == p2_kills
        assert p2_summary["deaths"] == p1_kills
        
        CombatTracker.cleanup(lobby_id)


class TestDamageTracking:
    """
    Feature: player-stats-leaderboards, Property: Damage Tracking
    Validates: Requirements 6.2
    """

    def setup_method(self):
        """Clear tracker before each test."""
        CombatTracker.clear_all()

    @given(
        lobby_id=st.uuids().map(str),
        dealer_id=st.uuids().map(str),
        target_id=st.uuids().map(str),
        damages=st.lists(st.integers(min_value=1, max_value=100), min_size=1, max_size=20),
    )
    @settings(max_examples=50)
    def test_damage_is_summed(self, lobby_id, dealer_id, target_id, damages):
        """
        Property: Damage dealt is summed correctly.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.2
        """
        assume(dealer_id != target_id)
        
        CombatTracker.initialize(lobby_id, [dealer_id, target_id])
        
        for dmg in damages:
            CombatTracker.record_damage(lobby_id, dealer_id, target_id, dmg)
        
        dealer_summary = CombatTracker.get_summary(lobby_id, dealer_id)
        target_summary = CombatTracker.get_summary(lobby_id, target_id)
        
        assert dealer_summary["damage_dealt"] == sum(damages)
        assert target_summary["damage_taken"] == sum(damages)
        
        CombatTracker.cleanup(lobby_id)


class TestShotTracking:
    """
    Feature: player-stats-leaderboards, Property: Shot Tracking
    Validates: Requirements 6.3
    """

    def setup_method(self):
        """Clear tracker before each test."""
        CombatTracker.clear_all()

    @given(
        lobby_id=st.uuids().map(str),
        player_id=st.uuids().map(str),
        shots=st.lists(st.booleans(), min_size=1, max_size=100),
    )
    @settings(max_examples=50)
    def test_shots_and_hits_counted(self, lobby_id, player_id, shots):
        """
        Property: Shots fired and hits are counted correctly.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.3
        """
        CombatTracker.initialize(lobby_id, [player_id])
        
        for hit in shots:
            CombatTracker.record_shot(lobby_id, player_id, hit)
        
        summary = CombatTracker.get_summary(lobby_id, player_id)
        
        assert summary["shots_fired"] == len(shots)
        assert summary["shots_hit"] == sum(shots)
        
        CombatTracker.cleanup(lobby_id)

    @given(
        lobby_id=st.uuids().map(str),
        player_id=st.uuids().map(str),
        total_shots=st.integers(min_value=1, max_value=100),
        hit_rate=st.floats(min_value=0, max_value=1),
    )
    @settings(max_examples=50)
    def test_accuracy_calculation(self, lobby_id, player_id, total_shots, hit_rate):
        """
        Property: Accuracy can be calculated from shots data.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.3
        """
        hits = int(total_shots * hit_rate)
        
        CombatTracker.initialize(lobby_id, [player_id])
        
        for i in range(total_shots):
            CombatTracker.record_shot(lobby_id, player_id, i < hits)
        
        summary = CombatTracker.get_summary(lobby_id, player_id)
        
        if summary["shots_fired"] > 0:
            accuracy = summary["shots_hit"] / summary["shots_fired"] * 100
            assert 0 <= accuracy <= 100
        
        CombatTracker.cleanup(lobby_id)


class TestPowerupTracking:
    """
    Feature: player-stats-leaderboards, Property: Powerup Tracking
    Validates: Requirements 6.4
    """

    def setup_method(self):
        """Clear tracker before each test."""
        CombatTracker.clear_all()

    @given(
        lobby_id=st.uuids().map(str),
        player_id=st.uuids().map(str),
        powerup_count=st.integers(min_value=0, max_value=20),
    )
    @settings(max_examples=50)
    def test_powerups_counted(self, lobby_id, player_id, powerup_count):
        """
        Property: Powerups collected are counted correctly.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.4
        """
        CombatTracker.initialize(lobby_id, [player_id])
        
        for _ in range(powerup_count):
            CombatTracker.record_powerup(lobby_id, player_id, "shield")
        
        summary = CombatTracker.get_summary(lobby_id, player_id)
        
        assert summary["powerups_collected"] == powerup_count
        
        CombatTracker.cleanup(lobby_id)


class TestSessionCleanup:
    """
    Feature: player-stats-leaderboards, Property: Session Cleanup
    Validates: Requirements 6.1
    """

    def setup_method(self):
        """Clear tracker before each test."""
        CombatTracker.clear_all()

    @given(
        lobby_id=st.uuids().map(str),
        player_ids=st.lists(st.uuids().map(str), min_size=2, max_size=4, unique=True),
    )
    @settings(max_examples=50)
    def test_cleanup_removes_session(self, lobby_id, player_ids):
        """
        Property: Cleanup removes all session data.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.1
        """
        CombatTracker.initialize(lobby_id, player_ids)
        
        # Record some data
        CombatTracker.record_kill(lobby_id, player_ids[0], player_ids[1])
        
        # Cleanup
        CombatTracker.cleanup(lobby_id)
        
        # Verify data is gone
        summary = CombatTracker.get_summary(lobby_id, player_ids[0])
        assert summary["kills"] == 0

    @given(
        lobby1=st.uuids().map(str),
        lobby2=st.uuids().map(str),
        player_id=st.uuids().map(str),
    )
    @settings(max_examples=50)
    def test_cleanup_only_affects_target_lobby(self, lobby1, lobby2, player_id):
        """
        Property: Cleanup only affects the specified lobby.
        Feature: player-stats-leaderboards
        Validates: Requirements 6.1
        """
        assume(lobby1 != lobby2)
        
        CombatTracker.initialize(lobby1, [player_id])
        CombatTracker.initialize(lobby2, [player_id])
        
        CombatTracker.record_shot(lobby1, player_id, True)
        CombatTracker.record_shot(lobby2, player_id, True)
        
        # Cleanup only lobby1
        CombatTracker.cleanup(lobby1)
        
        # lobby1 should be empty
        summary1 = CombatTracker.get_summary(lobby1, player_id)
        assert summary1["shots_fired"] == 0
        
        # lobby2 should still have data
        summary2 = CombatTracker.get_summary(lobby2, player_id)
        assert summary2["shots_fired"] == 1
        
        CombatTracker.cleanup(lobby2)
