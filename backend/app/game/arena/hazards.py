"""
Hazard Manager - Handles damage zones, slow fields, EMP zones.
"""

import time
from typing import Dict, List, Tuple

from .types import HazardType, ServerHazard, Bounds, ArenaEvent


class HazardManager:
    """Manages server-side hazard state and effects."""

    DAMAGE_TICK_INTERVAL = 0.5  # seconds

    def __init__(self):
        self._hazards: Dict[str, ServerHazard] = {}
        self._player_damage_ticks: Dict[str, Dict[str, float]] = {}
        self._pending_events: List[ArenaEvent] = []

    def add(
        self,
        id: str,
        type: HazardType,
        x: float,
        y: float,
        width: float,
        height: float,
        intensity: float = 1.0,
        despawn_time: float | None = None,
    ) -> ServerHazard:
        """Add a hazard to the arena."""
        hazard = ServerHazard(
            id=id,
            type=type,
            bounds=Bounds(x, y, width, height),
            intensity=intensity,
            despawn_time=despawn_time,
        )
        self._hazards[id] = hazard
        self._pending_events.append(
            ArenaEvent(
                "hazard_spawn",
                {
                    "id": id,
                    "type": type.value,
                    "bounds": {"x": x, "y": y, "width": width, "height": height},
                    "intensity": intensity,
                },
            )
        )
        return hazard

    def remove(self, id: str) -> None:
        """Remove a hazard from the arena."""
        if id in self._hazards:
            del self._hazards[id]
            self._pending_events.append(ArenaEvent("hazard_despawn", {"id": id}))

    def update(
        self, player_positions: Dict[str, Tuple[float, float]], current_time: float
    ) -> None:
        """Update hazard effects on players."""
        for hazard_id, hazard in self._hazards.items():
            if not hazard.is_active:
                continue

            for player_id, (px, py) in player_positions.items():
                was_inside = player_id in hazard.players_inside
                is_inside = hazard.bounds.contains(px, py)

                if is_inside and not was_inside:
                    hazard.players_inside.add(player_id)
                    self._pending_events.append(
                        ArenaEvent(
                            "hazard_enter",
                            {
                                "hazard_id": hazard_id,
                                "player_id": player_id,
                                "type": hazard.type.value,
                            },
                        )
                    )
                elif not is_inside and was_inside:
                    hazard.players_inside.discard(player_id)
                    self._pending_events.append(
                        ArenaEvent(
                            "hazard_exit",
                            {"hazard_id": hazard_id, "player_id": player_id},
                        )
                    )

                # Apply damage ticks
                if is_inside and hazard.type == HazardType.DAMAGE:
                    self._apply_damage(player_id, hazard_id, hazard.intensity, current_time)

    def _apply_damage(
        self, player_id: str, hazard_id: str, intensity: float, current_time: float
    ) -> None:
        """Apply damage tick from hazard."""
        if player_id not in self._player_damage_ticks:
            self._player_damage_ticks[player_id] = {}

        last_tick = self._player_damage_ticks[player_id].get(hazard_id, 0)
        if current_time - last_tick >= self.DAMAGE_TICK_INTERVAL:
            damage = int(intensity * 5)
            self._player_damage_ticks[player_id][hazard_id] = current_time
            self._pending_events.append(
                ArenaEvent(
                    "hazard_damage",
                    {"player_id": player_id, "hazard_id": hazard_id, "damage": damage},
                )
            )

    def check_despawns(self, current_time: float) -> None:
        """Check for dynamic despawns."""
        to_remove = [
            h.id for h in self._hazards.values()
            if h.despawn_time and current_time >= h.despawn_time
        ]
        for hid in to_remove:
            self.remove(hid)

    def get_speed_multiplier(self, player_id: str) -> float:
        """Get speed multiplier for player (from slow fields)."""
        multiplier = 1.0
        for hazard in self._hazards.values():
            if hazard.type == HazardType.SLOW and player_id in hazard.players_inside:
                multiplier = min(multiplier, 1.0 - hazard.intensity * 0.5)
        return multiplier

    def are_powerups_disabled(self, player_id: str) -> bool:
        """Check if powerups are disabled for player (EMP zone)."""
        for hazard in self._hazards.values():
            if hazard.type == HazardType.EMP and player_id in hazard.players_inside:
                return True
        return False

    def get_state(self) -> List[dict]:
        """Get current hazard state for broadcast."""
        return [
            {
                "id": h.id,
                "type": h.type.value,
                "bounds": {
                    "x": h.bounds.x,
                    "y": h.bounds.y,
                    "width": h.bounds.width,
                    "height": h.bounds.height,
                },
                "intensity": h.intensity,
                "active": h.is_active,
            }
            for h in self._hazards.values()
        ]

    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get pending events and clear the queue."""
        events = self._pending_events
        self._pending_events = []
        return events

    def clear(self) -> None:
        """Clear all hazards."""
        self._hazards.clear()
        self._player_damage_ticks.clear()
        self._pending_events.clear()
