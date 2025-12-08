"""
Property-based tests for Arena Server Authority systems.

Tests barrier, power-up, buff, door, and platform server authority.
Uses hypothesis for property-based testing.

**Feature: arena-server-authority-audit**
"""

import math
import pytest
from hypothesis import given, strategies as st, settings, assume

from app.game.arena.barriers import BarrierManager, BarrierType, ServerBarrier
from app.game.arena.types import ArenaEvent


# =============================================================================
# Strategies
# =============================================================================

@st.composite
def barrier_position(draw):
    """Generate valid barrier position."""
    return {
        "x": draw(st.floats(min_value=0, max_value=1000, allow_nan=False, allow_infinity=False)),
        "y": draw(st.floats(min_value=0, max_value=1000, allow_nan=False, allow_infinity=False)),
        "width": draw(st.floats(min_value=10, max_value=200, allow_nan=False, allow_infinity=False)),
        "height": draw(st.floats(min_value=10, max_value=200, allow_nan=False, allow_infinity=False)),
    }


@st.composite
def player_position(draw):
    """Generate valid player position."""
    return (
        draw(st.floats(min_value=0, max_value=1000, allow_nan=False, allow_infinity=False)),
        draw(st.floats(min_value=0, max_value=1000, allow_nan=False, allow_infinity=False)),
    )


# =============================================================================
# Property 1: Barrier damage validation
# **Feature: arena-server-authority-audit, Property 1: Barrier damage validation**
# =============================================================================

class TestBarrierDamageValidation:
    """
    **Feature: arena-server-authority-audit, Property 1: Barrier damage validation**
    
    For any damage event applied to a barrier, the server SHALL validate
    the damage amount is positive and update health correctly
    (new_health = max(0, old_health - damage)).
    
    Validates: Requirements 1.1
    """
    
    @given(
        initial_health=st.integers(min_value=1, max_value=1000),
        damage=st.integers(min_value=0, max_value=500),
    )
    @settings(max_examples=100)
    def test_damage_updates_health_correctly(self, initial_health: int, damage: int):
        """Damage should reduce health by exact amount, clamped to 0."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=50, height=50,
            barrier_type="destructible",
            health=initial_health,
        )
        
        result = manager.apply_damage("test_barrier", damage)
        
        assert result is not None
        expected_health = max(0, initial_health - damage)
        assert result.health == expected_health
        assert result.damage_applied == initial_health - expected_health
    
    @given(
        initial_health=st.integers(min_value=1, max_value=1000),
        negative_damage=st.integers(min_value=-1000, max_value=-1),
    )
    @settings(max_examples=100)
    def test_negative_damage_clamped_to_zero(self, initial_health: int, negative_damage: int):
        """Negative damage should be clamped to 0 (no healing)."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=50, height=50,
            barrier_type="destructible",
            health=initial_health,
        )
        
        result = manager.apply_damage("test_barrier", negative_damage)
        
        assert result is not None
        # Negative damage clamped to 0, so health unchanged
        assert result.health == initial_health
        assert result.damage_applied == 0
    
    def test_damage_to_non_destructible_returns_none(self):
        """Damage to non-destructible barriers should return None."""
        manager = BarrierManager()
        manager.add(
            id="solid_barrier",
            x=100, y=100,
            width=50, height=50,
            barrier_type="solid",
            health=100,
        )
        
        result = manager.apply_damage("solid_barrier", 50)
        assert result is None
    
    def test_damage_to_nonexistent_returns_none(self):
        """Damage to nonexistent barrier should return None."""
        manager = BarrierManager()
        result = manager.apply_damage("nonexistent", 50)
        assert result is None


# =============================================================================
# Property 2: Barrier destruction event generation
# **Feature: arena-server-authority-audit, Property 2: Barrier destruction event generation**
# =============================================================================

class TestBarrierDestructionEvent:
    """
    **Feature: arena-server-authority-audit, Property 2: Barrier destruction event generation**
    
    For any barrier whose health reaches zero after damage, the server SHALL
    generate exactly one destruction event containing the barrier ID.
    
    Validates: Requirements 1.2
    """
    
    @given(
        initial_health=st.integers(min_value=1, max_value=100),
    )
    @settings(max_examples=100)
    def test_destruction_generates_exactly_one_event(self, initial_health: int):
        """Destroying a barrier should generate exactly one destruction event."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=50, height=50,
            barrier_type="destructible",
            health=initial_health,
        )
        
        # Clear spawn event
        manager.get_and_clear_events()
        
        # Apply lethal damage
        result = manager.apply_damage("test_barrier", initial_health + 100)
        
        assert result is not None
        assert result.destroyed is True
        
        events = manager.get_and_clear_events()
        destruction_events = [e for e in events if e.event_type == "barrier_destroyed"]
        
        assert len(destruction_events) == 1
        assert destruction_events[0].data["id"] == "test_barrier"
    
    @given(
        initial_health=st.integers(min_value=50, max_value=100),
        damage=st.integers(min_value=1, max_value=40),
    )
    @settings(max_examples=100)
    def test_non_lethal_damage_no_destruction_event(self, initial_health: int, damage: int):
        """Non-lethal damage should not generate destruction event."""
        assume(damage < initial_health)
        
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=50, height=50,
            barrier_type="destructible",
            health=initial_health,
        )
        
        # Clear spawn event
        manager.get_and_clear_events()
        
        result = manager.apply_damage("test_barrier", damage)
        
        assert result is not None
        assert result.destroyed is False
        
        events = manager.get_and_clear_events()
        destruction_events = [e for e in events if e.event_type == "barrier_destroyed"]
        
        assert len(destruction_events) == 0


# =============================================================================
# Property 3: Barrier state consistency
# **Feature: arena-server-authority-audit, Property 3: Barrier state consistency**
# =============================================================================

class TestBarrierStateConsistency:
    """
    **Feature: arena-server-authority-audit, Property 3: Barrier state consistency**
    
    For any barrier in the system, get_state() SHALL return the current
    position, health, and active status matching the internal state.
    
    Validates: Requirements 1.3
    """
    
    @given(
        pos=barrier_position(),
        health=st.integers(min_value=1, max_value=1000),
        barrier_type=st.sampled_from(["solid", "destructible", "half_wall", "one_way"]),
    )
    @settings(max_examples=100)
    def test_get_state_matches_internal_state(self, pos: dict, health: int, barrier_type: str):
        """get_state() should return accurate representation of internal state."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=pos["x"],
            y=pos["y"],
            width=pos["width"],
            height=pos["height"],
            barrier_type=barrier_type,
            health=health,
        )
        
        state = manager.get_state()
        
        assert len(state) == 1
        barrier_state = state[0]
        
        assert barrier_state["id"] == "test_barrier"
        assert barrier_state["x"] == pos["x"]
        assert barrier_state["y"] == pos["y"]
        assert barrier_state["width"] == pos["width"]
        assert barrier_state["height"] == pos["height"]
        assert barrier_state["type"] == barrier_type
        assert barrier_state["health"] == health
        assert barrier_state["max_health"] == health
        assert barrier_state["is_active"] is True
    
    @given(
        initial_health=st.integers(min_value=50, max_value=100),
        damage=st.integers(min_value=1, max_value=40),
    )
    @settings(max_examples=100)
    def test_get_state_reflects_damage(self, initial_health: int, damage: int):
        """get_state() should reflect damage applied to barriers."""
        assume(damage < initial_health)
        
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=50, height=50,
            barrier_type="destructible",
            health=initial_health,
        )
        
        manager.apply_damage("test_barrier", damage)
        
        state = manager.get_state()
        assert state[0]["health"] == initial_health - damage
        assert state[0]["is_active"] is True


# =============================================================================
# Property 4: Barrier collision detection
# **Feature: arena-server-authority-audit, Property 4: Barrier collision detection**
# =============================================================================

class TestBarrierCollisionDetection:
    """
    **Feature: arena-server-authority-audit, Property 4: Barrier collision detection**
    
    For any position and radius, check_collision SHALL return a barrier ID
    if and only if the circle intersects an active barrier's bounds.
    
    Validates: Requirements 1.4
    """
    
    def test_collision_inside_barrier(self):
        """Position inside barrier should collide."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=100, height=100,
            barrier_type="solid",
            health=100,
        )
        
        # Center of barrier
        result = manager.check_collision(150, 150, 10)
        assert result == "test_barrier"
    
    def test_collision_outside_barrier(self):
        """Position far outside barrier should not collide."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=100, height=100,
            barrier_type="solid",
            health=100,
        )
        
        # Far from barrier
        result = manager.check_collision(500, 500, 10)
        assert result is None
    
    @given(
        radius=st.floats(min_value=1, max_value=50, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=100)
    def test_collision_at_edge(self, radius: float):
        """Position at edge should collide if circle overlaps."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=100, height=100,
            barrier_type="solid",
            health=100,
        )
        
        # Position just touching the right edge
        x = 200 + radius - 1  # Should collide (overlapping)
        result = manager.check_collision(x, 150, radius)
        assert result == "test_barrier"
        
        # Position just outside the right edge
        x = 200 + radius + 1  # Should not collide
        result = manager.check_collision(x, 150, radius)
        assert result is None
    
    def test_inactive_barrier_no_collision(self):
        """Inactive (destroyed) barriers should not collide."""
        manager = BarrierManager()
        manager.add(
            id="test_barrier",
            x=100, y=100,
            width=100, height=100,
            barrier_type="destructible",
            health=10,
        )
        
        # Destroy the barrier
        manager.apply_damage("test_barrier", 100)
        
        # Should not collide with destroyed barrier
        result = manager.check_collision(150, 150, 10)
        assert result is None
    
    def test_half_wall_blocks_movement(self):
        """Half walls should block movement collision."""
        manager = BarrierManager()
        manager.add(
            id="half_wall",
            x=100, y=100,
            width=100, height=100,
            barrier_type="half_wall",
            health=100,
        )
        
        result = manager.check_collision(150, 150, 10)
        assert result == "half_wall"
    
    def test_half_wall_allows_projectiles(self):
        """Half walls should not block projectiles."""
        manager = BarrierManager()
        manager.add(
            id="half_wall",
            x=100, y=100,
            width=100, height=100,
            barrier_type="half_wall",
            health=100,
        )
        
        result = manager.check_projectile_collision(150, 150)
        assert result is None
    
    def test_solid_blocks_projectiles(self):
        """Solid barriers should block projectiles."""
        manager = BarrierManager()
        manager.add(
            id="solid",
            x=100, y=100,
            width=100, height=100,
            barrier_type="solid",
            health=100,
        )
        
        result = manager.check_projectile_collision(150, 150)
        assert result == "solid"


from app.game.arena.powerups import PowerUpManager, PowerUpType, ServerPowerUp


# =============================================================================
# Property 5: Power-up collection radius
# **Feature: arena-server-authority-audit, Property 5: Power-up collection radius**
# =============================================================================

class TestPowerUpCollectionRadius:
    """
    **Feature: arena-server-authority-audit, Property 5: Power-up collection radius**
    
    For any player position within a power-up's collection radius,
    check_collection SHALL return the power-up for collection.
    
    Validates: Requirements 2.2
    """
    
    @given(
        radius=st.floats(min_value=10, max_value=100, allow_nan=False, allow_infinity=False),
        distance_factor=st.floats(min_value=0, max_value=0.9, allow_nan=False, allow_infinity=False),
        angle=st.floats(min_value=0, max_value=2 * math.pi, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=100)
    def test_collection_within_radius(self, radius: float, distance_factor: float, angle: float):
        """Player within radius should be able to collect power-up."""
        manager = PowerUpManager()
        powerup_x, powerup_y = 500.0, 500.0
        
        manager.spawn(
            id="test_powerup",
            x=powerup_x,
            y=powerup_y,
            powerup_type="shield",
            radius=radius,
        )
        
        # Position player within radius
        distance = radius * distance_factor
        player_x = powerup_x + distance * math.cos(angle)
        player_y = powerup_y + distance * math.sin(angle)
        
        result = manager.check_collection("player1", (player_x, player_y))
        
        assert result is not None
        assert result.powerup_id == "test_powerup"
        assert result.powerup_type == PowerUpType.SHIELD
        assert result.player_id == "player1"
    
    @given(
        radius=st.floats(min_value=10, max_value=100, allow_nan=False, allow_infinity=False),
        distance_factor=st.floats(min_value=1.1, max_value=5.0, allow_nan=False, allow_infinity=False),
        angle=st.floats(min_value=0, max_value=2 * math.pi, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=100)
    def test_no_collection_outside_radius(self, radius: float, distance_factor: float, angle: float):
        """Player outside radius should not collect power-up."""
        manager = PowerUpManager()
        powerup_x, powerup_y = 500.0, 500.0
        
        manager.spawn(
            id="test_powerup",
            x=powerup_x,
            y=powerup_y,
            powerup_type="shield",
            radius=radius,
        )
        
        # Position player outside radius
        distance = radius * distance_factor
        player_x = powerup_x + distance * math.cos(angle)
        player_y = powerup_y + distance * math.sin(angle)
        
        result = manager.check_collection("player1", (player_x, player_y))
        
        assert result is None
    
    def test_collection_at_exact_radius(self):
        """Player at exact radius boundary should collect."""
        manager = PowerUpManager()
        radius = 30.0
        
        manager.spawn(
            id="test_powerup",
            x=500,
            y=500,
            powerup_type="sos",
            radius=radius,
        )
        
        # Position at exact radius
        result = manager.check_collection("player1", (500 + radius, 500))
        assert result is not None


# =============================================================================
# Property 6: Power-up single collection
# **Feature: arena-server-authority-audit, Property 6: Power-up single collection**
# =============================================================================

class TestPowerUpSingleCollection:
    """
    **Feature: arena-server-authority-audit, Property 6: Power-up single collection**
    
    For any power-up that is collected, subsequent collection checks
    SHALL return None until the power-up respawns.
    
    Validates: Requirements 2.3
    """
    
    @given(
        num_attempts=st.integers(min_value=2, max_value=10),
    )
    @settings(max_examples=100)
    def test_cannot_collect_twice(self, num_attempts: int):
        """Power-up can only be collected once."""
        manager = PowerUpManager()
        
        manager.spawn(
            id="test_powerup",
            x=500,
            y=500,
            powerup_type="double_points",
            radius=30,
        )
        
        # First collection should succeed
        result1 = manager.check_collection("player1", (500, 500))
        assert result1 is not None
        
        # Subsequent attempts should fail
        for i in range(num_attempts):
            result = manager.check_collection(f"player{i+2}", (500, 500))
            assert result is None
    
    def test_different_players_cannot_collect_same_powerup(self):
        """Different players cannot collect the same power-up."""
        manager = PowerUpManager()
        
        manager.spawn(
            id="test_powerup",
            x=500,
            y=500,
            powerup_type="time_steal",
            radius=30,
        )
        
        # Player 1 collects
        result1 = manager.check_collection("player1", (500, 500))
        assert result1 is not None
        assert result1.player_id == "player1"
        
        # Player 2 cannot collect
        result2 = manager.check_collection("player2", (500, 500))
        assert result2 is None
    
    def test_collected_powerup_marked_inactive(self):
        """Collected power-up should be marked inactive."""
        manager = PowerUpManager()
        
        manager.spawn(
            id="test_powerup",
            x=500,
            y=500,
            powerup_type="shield",
            radius=30,
        )
        
        # Verify active before collection
        powerup = manager.get_powerup("test_powerup")
        assert powerup is not None
        assert powerup.is_active is True
        
        # Collect
        manager.check_collection("player1", (500, 500))
        
        # Verify inactive after collection
        powerup = manager.get_powerup("test_powerup")
        assert powerup is not None
        assert powerup.is_active is False
    
    def test_collection_generates_event(self):
        """Collection should generate exactly one collection event."""
        manager = PowerUpManager()
        
        manager.spawn(
            id="test_powerup",
            x=500,
            y=500,
            powerup_type="sos",
            radius=30,
        )
        
        # Clear spawn event
        manager.get_and_clear_events()
        
        # Collect
        manager.check_collection("player1", (500, 500))
        
        events = manager.get_and_clear_events()
        collection_events = [e for e in events if e.event_type == "powerup_collected"]
        
        assert len(collection_events) == 1
        assert collection_events[0].data["id"] == "test_powerup"
        assert collection_events[0].data["player_id"] == "player1"


from app.game.arena.systems import ServerArenaSystems


# =============================================================================
# Property 12: Arena state completeness
# **Feature: arena-server-authority-audit, Property 12: Arena state completeness**
# =============================================================================

class TestArenaStateCompleteness:
    """
    **Feature: arena-server-authority-audit, Property 12: Arena state completeness**
    
    For any call to get_arena_state(), the result SHALL include state from
    all arena managers (hazards, traps, doors, platforms, barriers, powerups).
    
    Validates: Requirements 5.4
    """
    
    def test_arena_state_includes_all_managers(self):
        """get_arena_state() should include all manager states."""
        systems = ServerArenaSystems()
        
        state = systems.get_arena_state()
        
        # Verify all required keys are present
        assert "hazards" in state
        assert "traps" in state
        assert "doors" in state
        assert "platforms" in state
        assert "barriers" in state
        assert "powerups" in state
    
    def test_arena_state_reflects_added_items(self):
        """get_arena_state() should reflect items added to each manager."""
        from app.game.arena.types import HazardType
        
        systems = ServerArenaSystems()
        
        # Add items to each manager
        systems.hazards.add("h1", HazardType.DAMAGE, 0, 0, 100, 100)
        systems.barriers.add("b1", 0, 0, 50, 50, "solid", 100)
        systems.powerups.spawn("p1", 100, 100, "shield", 30)
        
        state = systems.get_arena_state()
        
        # Verify hazards, barriers and powerups are included
        assert len(state["hazards"]) == 1
        assert state["hazards"][0]["id"] == "h1"
        
        assert len(state["barriers"]) == 1
        assert state["barriers"][0]["id"] == "b1"
        
        assert len(state["powerups"]) == 1
        assert state["powerups"][0]["id"] == "p1"
    
    @given(
        num_barriers=st.integers(min_value=0, max_value=5),
        num_powerups=st.integers(min_value=0, max_value=5),
    )
    @settings(max_examples=50)
    def test_arena_state_count_matches(self, num_barriers: int, num_powerups: int):
        """get_arena_state() should return correct count of items."""
        systems = ServerArenaSystems()
        
        # Add barriers
        for i in range(num_barriers):
            systems.barriers.add(f"barrier_{i}", i * 100, 0, 50, 50, "solid", 100)
        
        # Add powerups
        powerup_types = ["sos", "shield", "time_steal", "double_points"]
        for i in range(num_powerups):
            systems.powerups.spawn(
                f"powerup_{i}",
                i * 100,
                100,
                powerup_types[i % len(powerup_types)],
                30,
            )
        
        state = systems.get_arena_state()
        
        assert len(state["barriers"]) == num_barriers
        assert len(state["powerups"]) == num_powerups
    
    def test_arena_state_empty_by_default(self):
        """Fresh arena should have empty state for all managers."""
        systems = ServerArenaSystems()
        
        state = systems.get_arena_state()
        
        assert state["hazards"] == []
        assert state["traps"] == []
        assert state["doors"] == []
        assert state["platforms"] == []
        assert state["barriers"] == []
        assert state["powerups"] == []


from app.game.arena.doors import DoorManager, DoorState, DoorTrigger
from app.game.arena.platforms import PlatformManager, MovementType
from app.game.buffs import BuffManager, BuffType


# =============================================================================
# Property 10: Door state broadcast completeness
# **Feature: arena-server-authority-audit, Property 10: Door state broadcast completeness**
# =============================================================================

class TestDoorStateBroadcast:
    """
    **Feature: arena-server-authority-audit, Property 10: Door state broadcast completeness**
    
    For any door in the system, get_state() SHALL return id, state,
    progress, and is_blocking fields.
    
    Validates: Requirements 4.1
    """
    
    def test_door_state_has_required_fields(self):
        """Door state should include all required fields."""
        manager = DoorManager()
        manager.add(
            id="test_door",
            x=100, y=100,
            width=50, height=100,
            direction="horizontal",
            trigger="manual",
        )
        
        state = manager.get_state()
        
        assert len(state) == 1
        door_state = state[0]
        
        # Verify required fields
        assert "id" in door_state
        assert "state" in door_state
        assert "progress" in door_state
        assert "is_blocking" in door_state
        
        assert door_state["id"] == "test_door"
        assert door_state["state"] == "closed"
        assert door_state["progress"] == 0.0
        assert door_state["is_blocking"] is True
    
    @given(
        num_doors=st.integers(min_value=1, max_value=5),
    )
    @settings(max_examples=50)
    def test_all_doors_have_required_fields(self, num_doors: int):
        """All doors should have required fields in state."""
        manager = DoorManager()
        
        for i in range(num_doors):
            manager.add(
                id=f"door_{i}",
                x=i * 100, y=100,
                width=50, height=100,
            )
        
        state = manager.get_state()
        
        assert len(state) == num_doors
        
        for door_state in state:
            assert "id" in door_state
            assert "state" in door_state
            assert "progress" in door_state
            assert "is_blocking" in door_state


# =============================================================================
# Property 11: Platform state broadcast completeness
# **Feature: arena-server-authority-audit, Property 11: Platform state broadcast completeness**
# =============================================================================

class TestPlatformStateBroadcast:
    """
    **Feature: arena-server-authority-audit, Property 11: Platform state broadcast completeness**
    
    For any platform in the system, get_state() SHALL return id, x, y,
    and velocity fields.
    
    Validates: Requirements 4.2
    """
    
    def test_platform_state_has_required_fields(self):
        """Platform state should include all required fields."""
        manager = PlatformManager()
        manager.add(
            id="test_platform",
            width=100, height=20,
            waypoints=[{"x": 100, "y": 100}, {"x": 300, "y": 100}],
            speed=50,
        )
        
        state = manager.get_state()
        
        assert len(state) == 1
        platform_state = state[0]
        
        # Verify required fields
        assert "id" in platform_state
        assert "x" in platform_state
        assert "y" in platform_state
        assert "velocity_x" in platform_state
        assert "velocity_y" in platform_state
        
        assert platform_state["id"] == "test_platform"
    
    @given(
        num_platforms=st.integers(min_value=1, max_value=5),
    )
    @settings(max_examples=50)
    def test_all_platforms_have_required_fields(self, num_platforms: int):
        """All platforms should have required fields in state."""
        manager = PlatformManager()
        
        for i in range(num_platforms):
            manager.add(
                id=f"platform_{i}",
                width=100, height=20,
                waypoints=[{"x": i * 200, "y": 100}, {"x": i * 200 + 100, "y": 100}],
                speed=50,
            )
        
        state = manager.get_state()
        
        assert len(state) == num_platforms
        
        for platform_state in state:
            assert "id" in platform_state
            assert "x" in platform_state
            assert "y" in platform_state
            assert "velocity_x" in platform_state
            assert "velocity_y" in platform_state


# =============================================================================
# Property 13: Pressure plate door trigger
# **Feature: arena-server-authority-audit, Property 13: Pressure plate door trigger**
# =============================================================================

class TestPressurePlateDoorTrigger:
    """
    **Feature: arena-server-authority-audit, Property 13: Pressure plate door trigger**
    
    For any door linked to a pressure plate trigger, when trigger_door
    is called with the trigger ID, the linked door SHALL change state.
    
    Validates: Requirements 4.4
    """
    
    def test_trigger_opens_linked_door(self):
        """Triggering should open linked door."""
        import time
        
        manager = DoorManager()
        manager.add(
            id="linked_door",
            x=100, y=100,
            width=50, height=100,
            trigger="pressure_plate",
            linked_trigger_id="plate_1",
        )
        
        # Verify door starts closed
        assert manager.doors["linked_door"].state == DoorState.CLOSED
        
        # Trigger the door
        manager.trigger_by_link("plate_1", time.time())
        
        # Verify door is now opening
        assert manager.doors["linked_door"].state == DoorState.OPENING
    
    def test_trigger_toggles_open_door(self):
        """Triggering open door should close it."""
        import time
        
        manager = DoorManager()
        manager.add(
            id="linked_door",
            x=100, y=100,
            width=50, height=100,
            trigger="pressure_plate",
            linked_trigger_id="plate_1",
        )
        
        current_time = time.time()
        
        # Open the door
        manager.trigger_by_link("plate_1", current_time)
        
        # Simulate door fully opening
        manager.doors["linked_door"].state = DoorState.OPEN
        manager.doors["linked_door"].progress = 1.0
        
        # Trigger again to close
        manager.trigger_by_link("plate_1", current_time + 1)
        
        # Verify door is now closing
        assert manager.doors["linked_door"].state == DoorState.CLOSING
    
    @given(
        num_doors=st.integers(min_value=1, max_value=3),
    )
    @settings(max_examples=50)
    def test_trigger_affects_all_linked_doors(self, num_doors: int):
        """Trigger should affect all doors linked to it."""
        import time
        
        manager = DoorManager()
        
        for i in range(num_doors):
            manager.add(
                id=f"door_{i}",
                x=i * 100, y=100,
                width=50, height=100,
                trigger="pressure_plate",
                linked_trigger_id="shared_plate",
            )
        
        # Trigger all doors
        manager.trigger_by_link("shared_plate", time.time())
        
        # Verify all doors are opening
        for i in range(num_doors):
            assert manager.doors[f"door_{i}"].state == DoorState.OPENING


# =============================================================================
# Property 7: Buff application tracking
# **Feature: arena-server-authority-audit, Property 7: Buff application tracking**
# =============================================================================

class TestBuffApplicationTracking:
    """
    **Feature: arena-server-authority-audit, Property 7: Buff application tracking**
    
    For any buff applied to a player, the buff manager SHALL store the
    type, value, and expiration time, and get_active_buffs SHALL include it.
    
    Validates: Requirements 3.1
    """
    
    @given(
        value=st.floats(min_value=0.1, max_value=1.0, allow_nan=False, allow_infinity=False),
        duration=st.floats(min_value=1.0, max_value=60.0, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=100)
    def test_applied_buff_is_tracked(self, value: float, duration: float):
        """Applied buff should be tracked in active buffs."""
        manager = BuffManager()
        manager.init_player("player1")
        
        buff = manager.apply_buff(
            player_id="player1",
            buff_type=BuffType.DAMAGE_BOOST,
            value=value,
            duration_s=duration,
            source="test",
        )
        
        assert buff is not None
        assert buff.buff_type == BuffType.DAMAGE_BOOST
        assert buff.value == value
        
        active_buffs = manager.get_active_buffs("player1")
        assert len(active_buffs) == 1
        assert active_buffs[0].buff_type == BuffType.DAMAGE_BOOST
    
    def test_multiple_buff_types_tracked(self):
        """Multiple different buff types should all be tracked."""
        manager = BuffManager()
        manager.init_player("player1")
        
        manager.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.5, 10, "test")
        manager.apply_buff("player1", BuffType.SPEED_BOOST, 0.3, 10, "test")
        manager.apply_buff("player1", BuffType.SHIELD, 50, 10, "test")
        
        active_buffs = manager.get_active_buffs("player1")
        assert len(active_buffs) == 3
        
        buff_types = {b.buff_type for b in active_buffs}
        assert BuffType.DAMAGE_BOOST in buff_types
        assert BuffType.SPEED_BOOST in buff_types
        assert BuffType.SHIELD in buff_types


# =============================================================================
# Property 8: Buff expiration removal
# **Feature: arena-server-authority-audit, Property 8: Buff expiration removal**
# =============================================================================

class TestBuffExpirationRemoval:
    """
    **Feature: arena-server-authority-audit, Property 8: Buff expiration removal**
    
    For any buff whose expiration time has passed, update() SHALL remove
    it from active buffs and return it in the expired list.
    
    Validates: Requirements 3.2
    """
    
    def test_expired_buff_removed(self):
        """Expired buff should be removed from active buffs."""
        import time
        
        manager = BuffManager()
        manager.init_player("player1")
        
        # Apply buff with very short duration
        manager.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.5, 0.001, "test")
        
        # Wait for expiration
        time.sleep(0.01)
        
        # Update to process expirations
        expired = manager.update(time.time())
        
        # Verify buff was expired
        assert "player1" in expired
        assert len(expired["player1"]) == 1
        assert expired["player1"][0].buff_type == BuffType.DAMAGE_BOOST
        
        # Verify buff is no longer active
        active_buffs = manager.get_active_buffs("player1")
        assert len(active_buffs) == 0
    
    def test_non_expired_buff_remains(self):
        """Non-expired buff should remain active."""
        import time
        
        manager = BuffManager()
        manager.init_player("player1")
        
        # Apply buff with long duration
        manager.apply_buff("player1", BuffType.SPEED_BOOST, 0.3, 3600, "test")
        
        # Update immediately (buff should not expire)
        expired = manager.update(time.time())
        
        # Verify no buffs expired
        assert "player1" not in expired or len(expired.get("player1", [])) == 0
        
        # Verify buff is still active
        active_buffs = manager.get_active_buffs("player1")
        assert len(active_buffs) == 1


# =============================================================================
# Property 9: Damage multiplier calculation
# **Feature: arena-server-authority-audit, Property 9: Damage multiplier calculation**
# =============================================================================

class TestDamageMultiplierCalculation:
    """
    **Feature: arena-server-authority-audit, Property 9: Damage multiplier calculation**
    
    For any player with a damage_boost buff, get_damage_multiplier
    SHALL return 1.0 + buff_value.
    
    Validates: Requirements 3.3
    """
    
    @given(
        buff_value=st.floats(min_value=0.1, max_value=2.0, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=100)
    def test_damage_multiplier_with_buff(self, buff_value: float):
        """Damage multiplier should be 1.0 + buff value."""
        manager = BuffManager()
        manager.init_player("player1")
        
        manager.apply_buff("player1", BuffType.DAMAGE_BOOST, buff_value, 60, "test")
        
        multiplier = manager.get_damage_multiplier("player1")
        
        assert abs(multiplier - (1.0 + buff_value)) < 0.0001
    
    def test_damage_multiplier_without_buff(self):
        """Damage multiplier without buff should be 1.0."""
        manager = BuffManager()
        manager.init_player("player1")
        
        multiplier = manager.get_damage_multiplier("player1")
        
        assert multiplier == 1.0
    
    def test_damage_multiplier_unknown_player(self):
        """Damage multiplier for unknown player should be 1.0."""
        manager = BuffManager()
        
        multiplier = manager.get_damage_multiplier("unknown_player")
        
        assert multiplier == 1.0
