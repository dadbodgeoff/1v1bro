"""
Tests for the server-side tick system.

Tests:
- Game creation and player initialization
- Input validation (anti-cheat)
- Position history for lag compensation
"""

import pytest
import time
from hypothesis import given, strategies as st, settings

from app.game.tick_system import TickSystem
from app.game.models import PlayerState, PlayerInput, GameState
from app.game.validation import InputValidator
from app.game.lag_compensation import LagCompensator
from app.game.config import MOVEMENT_CONFIG, ANTI_CHEAT_CONFIG


class TestTickSystemBasics:
    """Basic tick system functionality tests."""

    def test_create_game(self):
        """Test game creation with two players."""
        system = TickSystem()
        game = system.create_game(
            lobby_id="test-lobby",
            player1_id="player1",
            player2_id="player2",
            spawn1=(100, 200),
            spawn2=(900, 200),
        )
        
        assert game.lobby_id == "test-lobby"
        assert len(game.players) == 2
        assert "player1" in game.players
        assert "player2" in game.players
        assert game.players["player1"].x == 100
        assert game.players["player1"].y == 200

    def test_queue_input(self):
        """Test input queuing."""
        system = TickSystem()
        game = system.create_game(
            lobby_id="test-lobby",
            player1_id="player1",
            player2_id="player2",
        )
        game.is_running = True
        
        result = system.queue_input("test-lobby", PlayerInput(
            player_id="player1",
            x=170,
            y=360,
            sequence=1,
        ))
        assert result is True
        assert len(game.pending_inputs) == 1

    def test_queue_input_not_running(self):
        """Test that inputs are rejected when game not running."""
        system = TickSystem()
        system.create_game(
            lobby_id="test-lobby",
            player1_id="player1",
            player2_id="player2",
        )
        
        result = system.queue_input("test-lobby", PlayerInput(
            player_id="player1",
            x=170,
            y=360,
            sequence=1,
        ))
        assert result is False


class TestInputValidation:
    """Tests for anti-cheat input validation."""

    def test_valid_input(self):
        """Test that valid inputs pass validation."""
        validator = InputValidator()
        game = GameState(lobby_id="test")
        player = PlayerState(player_id="p1", x=160, y=360)
        
        is_valid, reason = validator.validate(game, player, PlayerInput(
            player_id="p1",
            x=165,  # 5px movement
            y=360,
            sequence=1,
        ))
        
        assert is_valid is True
        assert reason == "valid"

    def test_teleport_detection(self):
        """Test that teleportation is detected."""
        validator = InputValidator()
        game = GameState(lobby_id="test")
        player = PlayerState(player_id="p1", x=160, y=360)
        
        is_valid, reason = validator.validate(game, player, PlayerInput(
            player_id="p1",
            x=500,  # 340px - way too far
            y=360,
            sequence=1,
        ))
        
        assert is_valid is False
        assert reason == "teleport_detected"
        assert player.violation_count == 1

    def test_old_sequence_rejected(self):
        """Test that very old sequences are rejected."""
        validator = InputValidator()
        game = GameState(lobby_id="test")
        player = PlayerState(player_id="p1", last_input_sequence=100)
        
        is_valid, reason = validator.validate(game, player, PlayerInput(
            player_id="p1",
            x=165,
            y=360,
            sequence=50,  # Way behind
        ))
        
        assert is_valid is False
        assert reason == "sequence_too_old"

    def test_violation_decay(self):
        """Test that violations decay over time."""
        validator = InputValidator()
        player = PlayerState(player_id="p1", violation_count=5, last_decay_tick=0)
        
        # Simulate enough ticks for decay
        validator.decay_violations(player, ANTI_CHEAT_CONFIG.decay_ticks + 1)
        
        assert player.violation_count == 4


class TestLagCompensation:
    """Tests for position history and lag compensation."""

    def test_record_position(self):
        """Test position recording."""
        lag_comp = LagCompensator()
        player = PlayerState(player_id="test", x=100, y=200)
        
        timestamp = time.time()
        lag_comp.record_position(player, timestamp, 1)
        
        assert len(player.position_history) == 1
        frame = player.position_history[0]
        assert frame.x == 100
        assert frame.y == 200

    def test_get_position_interpolated(self):
        """Test position interpolation between frames."""
        lag_comp = LagCompensator()
        player = PlayerState(player_id="test")
        
        # Use recent timestamps (within lag comp window)
        now = time.time()
        t1 = now - 0.1  # 100ms ago
        t2 = now  # now
        
        player.x, player.y = 100, 200
        lag_comp.record_position(player, t1, 1)
        
        player.x, player.y = 200, 200
        lag_comp.record_position(player, t2, 2)
        
        # Get position at midpoint
        frame = lag_comp.get_position_at_time(player, t1 + 0.05)
        
        assert frame is not None
        assert 145 <= frame.x <= 155  # ~150

    def test_hit_check(self):
        """Test hit detection with lag compensation."""
        lag_comp = LagCompensator()
        player = PlayerState(player_id="target", x=200, y=200)
        
        t1 = time.time()
        lag_comp.record_position(player, t1, 1)
        
        # Move target
        player.x = 300
        lag_comp.record_position(player, t1 + 0.1, 2)
        
        # Check hit at old position
        hit, _ = lag_comp.check_hit(player, (200, 200), t1, hitbox_radius=15.0)
        assert hit is True

    def test_hit_miss(self):
        """Test that shots miss when target wasn't there."""
        lag_comp = LagCompensator()
        player = PlayerState(player_id="target", x=200, y=200)
        
        lag_comp.record_position(player, time.time(), 1)
        
        hit, _ = lag_comp.check_hit(player, (500, 200), time.time(), hitbox_radius=15.0)
        assert hit is False


class TestPropertyBased:
    """Property-based tests using Hypothesis."""

    @given(
        x=st.floats(min_value=0, max_value=1280, allow_nan=False),
        y=st.floats(min_value=0, max_value=720, allow_nan=False),
    )
    @settings(max_examples=50)
    def test_position_recording_preserves_values(self, x: float, y: float):
        """Test that recorded positions are preserved exactly."""
        lag_comp = LagCompensator()
        player = PlayerState(player_id="test", x=x, y=y)
        
        lag_comp.record_position(player, time.time(), 1)
        
        frame = player.position_history[-1]
        assert frame.x == x
        assert frame.y == y

    @given(
        dx=st.floats(min_value=-10, max_value=10, allow_nan=False),
        dy=st.floats(min_value=-10, max_value=10, allow_nan=False),
    )
    @settings(max_examples=50)
    def test_small_movements_always_valid(self, dx: float, dy: float):
        """Test that small movements are always valid."""
        validator = InputValidator()
        game = GameState(lobby_id="test")
        player = PlayerState(player_id="p1", x=640, y=360)
        
        is_valid, _ = validator.validate(game, player, PlayerInput(
            player_id="p1",
            x=640 + dx,
            y=360 + dy,
            sequence=1,
        ))
        
        assert is_valid is True
