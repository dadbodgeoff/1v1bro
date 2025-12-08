"""
Server Arena Systems - Main coordinator for all arena mechanics.
"""

import time
from typing import Dict, List, Tuple, Optional

from .types import HazardType, TrapType, TrapEffect, ArenaEvent
from .hazards import HazardManager
from .traps import TrapManager
from .transport import TransportManager
from .doors import DoorManager
from .platforms import PlatformManager
from .barriers import BarrierManager, BarrierType
from .powerups import PowerUpManager, PowerUpType


class ServerArenaSystems:
    """
    Server-authoritative arena systems coordinator.

    Delegates to:
    - HazardManager: Damage zones, slow fields, EMP
    - TrapManager: Pressure, timed, projectile traps
    - TransportManager: Teleporters, jump pads
    - DoorManager: Dynamic doors/gates
    - PlatformManager: Moving platforms
    - BarrierManager: Barriers and destructibles
    - PowerUpManager: Power-up spawning and collection
    """

    def __init__(self):
        self.hazards = HazardManager()
        self.traps = TrapManager()
        self.transport = TransportManager()
        self.doors = DoorManager()
        self.platforms = PlatformManager()
        self.barriers = BarrierManager()
        self.powerups = PowerUpManager()

    def initialize_from_config(self, config: dict) -> None:
        """Initialize arena systems from map config."""
        self.reset()

        # Load hazards
        for h in config.get("hazards", []):
            self.hazards.add(
                h["id"],
                HazardType(h["type"]),
                h["bounds"]["x"],
                h["bounds"]["y"],
                h["bounds"]["width"],
                h["bounds"]["height"],
                h.get("intensity", 1.0),
            )

        # Load traps
        for t in config.get("traps", []):
            effect_str = t["effect"]
            if effect_str == "damage_burst":
                effect_str = "damage"
            self.traps.add(
                t["id"],
                TrapType(t["type"]),
                t["position"]["x"],
                t["position"]["y"],
                t["radius"],
                TrapEffect(effect_str),
                t.get("effectValue", 10),
                t.get("cooldown", 5.0),
                t.get("interval"),
                t.get("chainRadius"),
            )

        # Load teleporters
        for tp in config.get("teleporters", []):
            self.transport.add_teleporter(
                tp["id"],
                tp["pairId"],
                tp["position"]["x"],
                tp["position"]["y"],
                tp["radius"],
            )
        self.transport.link_teleporters()

        # Load jump pads
        for jp in config.get("jumpPads", []):
            self.transport.add_jump_pad(
                jp["id"],
                jp["position"]["x"],
                jp["position"]["y"],
                jp["radius"],
                jp["direction"],
                jp["force"],
            )

        # Load doors
        for door in config.get("doors", []):
            self.doors.add(
                door["id"],
                door["position"]["x"],
                door["position"]["y"],
                door["size"]["width"],
                door["size"]["height"],
                door.get("direction", "horizontal"),
                door.get("trigger", "manual"),
                door.get("linkedTriggerId"),
                door.get("autoCloseDelay", 0),
                door.get("openDuration", 0.5),
            )

        # Load moving platforms
        for plat in config.get("platforms", []):
            self.platforms.add(
                plat["id"],
                plat["size"]["width"],
                plat["size"]["height"],
                plat["waypoints"],
                plat["speed"],
                plat.get("movementType", "linear"),
                plat.get("loop", True),
                plat.get("pauseAtWaypoints", 0),
            )

        # Load barriers
        for barrier in config.get("barriers", []):
            self.barriers.add(
                barrier["id"],
                barrier["position"]["x"],
                barrier["position"]["y"],
                barrier["size"]["width"],
                barrier["size"]["height"],
                barrier.get("type", "solid"),
                barrier.get("health", 100),
                barrier.get("direction"),
            )

        # Load power-ups (if pre-configured)
        for powerup in config.get("powerups", []):
            self.powerups.spawn(
                powerup["id"],
                powerup["position"]["x"],
                powerup["position"]["y"],
                powerup["type"],
                powerup.get("radius", 30),
            )

    def update(
        self, delta_time: float, player_positions: Dict[str, Tuple[float, float]]
    ) -> None:
        """Update all arena systems for one tick."""
        current_time = time.time()

        self.hazards.update(player_positions, current_time)
        self.traps.update(delta_time, player_positions, current_time)
        self.traps.process_chains(current_time, player_positions)
        self.transport.cleanup_cooldowns(current_time)
        self.doors.update(delta_time, current_time)
        self.platforms.update(delta_time)

        # Check despawns
        self.hazards.check_despawns(current_time)
        self.traps.check_despawns(current_time)

        # Check power-up collections
        for player_id, position in player_positions.items():
            self.powerups.check_collection(player_id, position)

    def check_teleport(
        self, player_id: str, position: Tuple[float, float]
    ) -> Optional[Tuple[float, float]]:
        """Check if player should teleport."""
        return self.transport.check_teleport(player_id, position)

    def check_jump_pad(
        self, player_id: str, position: Tuple[float, float]
    ) -> Optional[Tuple[float, float]]:
        """Check if player should be launched."""
        return self.transport.check_jump_pad(player_id, position)

    def on_projectile_hit(
        self, position: Tuple[float, float], player_positions: Dict[str, Tuple[float, float]]
    ) -> None:
        """Handle projectile hit for projectile-triggered traps."""
        self.traps.on_projectile_hit(position, player_positions)

    def get_speed_multiplier(self, player_id: str) -> float:
        """Get speed multiplier for player."""
        return self.hazards.get_speed_multiplier(player_id)

    def are_powerups_disabled(self, player_id: str) -> bool:
        """Check if powerups are disabled for player."""
        return self.hazards.are_powerups_disabled(player_id)

    def check_door_collision(
        self, x: float, y: float, radius: float
    ) -> Optional[str]:
        """Check if position collides with any blocking door."""
        return self.doors.check_collision(x, y, radius)

    def check_barrier_collision(
        self, x: float, y: float, radius: float
    ) -> Optional[str]:
        """Check if position collides with any barrier."""
        return self.barriers.check_collision(x, y, radius)

    def check_projectile_barrier_collision(
        self, x: float, y: float
    ) -> Optional[str]:
        """Check if projectile collides with any barrier."""
        return self.barriers.check_projectile_collision(x, y)

    def apply_barrier_damage(
        self, barrier_id: str, damage: int, source_player_id: Optional[str] = None
    ):
        """Apply damage to a barrier."""
        return self.barriers.apply_damage(barrier_id, damage, source_player_id)

    def check_platform(
        self, player_x: float, player_y: float, player_radius: float
    ) -> Optional[Tuple[str, float, float]]:
        """Check if player is on a moving platform."""
        return self.platforms.check_player_on_platform(player_x, player_y, player_radius)

    def trigger_door(self, trigger_id: str) -> None:
        """Trigger doors linked to a trigger ID (e.g., from pressure plate)."""
        self.doors.trigger_by_link(trigger_id, time.time())

    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get all pending events from all managers."""
        events = []
        events.extend(self.hazards.get_and_clear_events())
        events.extend(self.traps.get_and_clear_events())
        events.extend(self.transport.get_and_clear_events())
        events.extend(self.doors.get_and_clear_events())
        events.extend(self.platforms.get_and_clear_events())
        events.extend(self.barriers.get_and_clear_events())
        events.extend(self.powerups.get_and_clear_events())
        return events

    def get_arena_state(self) -> dict:
        """Get current arena state for broadcast."""
        return {
            "hazards": self.hazards.get_state(),
            "traps": self.traps.get_state(),
            "doors": self.doors.get_state(),
            "platforms": self.platforms.get_state(),
            "barriers": self.barriers.get_state(),
            "powerups": self.powerups.get_state(),
        }

    # Convenience methods for dynamic spawning
    def add_hazard(self, *args, **kwargs):
        return self.hazards.add(*args, **kwargs)

    def remove_hazard(self, id: str):
        return self.hazards.remove(id)

    def add_trap(self, *args, **kwargs):
        return self.traps.add(*args, **kwargs)

    def remove_trap(self, id: str):
        return self.traps.remove(id)

    def add_door(self, *args, **kwargs):
        return self.doors.add(*args, **kwargs)

    def remove_door(self, id: str):
        return self.doors.remove(id)

    def add_platform(self, *args, **kwargs):
        return self.platforms.add(*args, **kwargs)

    def remove_platform(self, id: str):
        return self.platforms.remove(id)

    def add_barrier(self, *args, **kwargs):
        return self.barriers.add(*args, **kwargs)

    def remove_barrier(self, id: str):
        return self.barriers.remove(id)

    def spawn_powerup(self, *args, **kwargs):
        return self.powerups.spawn(*args, **kwargs)

    def remove_powerup(self, id: str):
        return self.powerups.remove(id)

    def reset(self) -> None:
        """Reset all arena state."""
        self.hazards.clear()
        self.traps.clear()
        self.transport.clear()
        self.doors.clear()
        self.platforms.clear()
        self.barriers.clear()
        self.powerups.clear()
