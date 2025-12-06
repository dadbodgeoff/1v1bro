"""
Server Arena Systems - Main coordinator for all arena mechanics.
"""

import time
from typing import Dict, List, Tuple, Optional

from .types import HazardType, TrapType, TrapEffect, ArenaEvent
from .hazards import HazardManager
from .traps import TrapManager
from .transport import TransportManager


class ServerArenaSystems:
    """
    Server-authoritative arena systems coordinator.

    Delegates to:
    - HazardManager: Damage zones, slow fields, EMP
    - TrapManager: Pressure, timed, projectile traps
    - TransportManager: Teleporters, jump pads
    """

    def __init__(self):
        self.hazards = HazardManager()
        self.traps = TrapManager()
        self.transport = TransportManager()

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

    def update(
        self, delta_time: float, player_positions: Dict[str, Tuple[float, float]]
    ) -> None:
        """Update all arena systems for one tick."""
        current_time = time.time()

        self.hazards.update(player_positions, current_time)
        self.traps.update(delta_time, player_positions, current_time)
        self.traps.process_chains(current_time, player_positions)
        self.transport.cleanup_cooldowns(current_time)

        # Check despawns
        self.hazards.check_despawns(current_time)
        self.traps.check_despawns(current_time)

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

    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get all pending events from all managers."""
        events = []
        events.extend(self.hazards.get_and_clear_events())
        events.extend(self.traps.get_and_clear_events())
        events.extend(self.transport.get_and_clear_events())
        return events

    def get_arena_state(self) -> dict:
        """Get current arena state for broadcast."""
        return {
            "hazards": self.hazards.get_state(),
            "traps": self.traps.get_state(),
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

    def reset(self) -> None:
        """Reset all arena state."""
        self.hazards.clear()
        self.traps.clear()
        self.transport.clear()
