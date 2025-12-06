"""
Transport Manager - Handles teleporters and jump pads.
"""

import math
import time
from typing import Dict, List, Tuple, Optional

from .types import ServerTeleporter, ServerJumpPad, ArenaEvent


class TransportManager:
    """Manages server-side transport systems."""

    TELEPORTER_COOLDOWN = 2.0
    JUMP_PAD_COOLDOWN = 1.0

    def __init__(self):
        self._teleporters: Dict[str, ServerTeleporter] = {}
        self._jump_pads: Dict[str, ServerJumpPad] = {}
        self._pending_events: List[ArenaEvent] = []

    def add_teleporter(
        self, id: str, pair_id: str, x: float, y: float, radius: float
    ) -> ServerTeleporter:
        """Add a teleporter to the arena."""
        tp = ServerTeleporter(id=id, pair_id=pair_id, position=(x, y), radius=radius)
        self._teleporters[id] = tp
        return tp

    def add_jump_pad(
        self, id: str, x: float, y: float, radius: float, direction: str | tuple, force: float
    ) -> ServerJumpPad:
        """Add a jump pad to the arena."""
        if isinstance(direction, str):
            direction = self._direction_to_vector(direction)
        jp = ServerJumpPad(id=id, position=(x, y), radius=radius, direction=direction, force=force)
        self._jump_pads[id] = jp
        return jp

    def link_teleporters(self) -> None:
        """Link teleporter pairs."""
        pairs: Dict[str, List[str]] = {}
        for tp in self._teleporters.values():
            if tp.pair_id not in pairs:
                pairs[tp.pair_id] = []
            pairs[tp.pair_id].append(tp.id)

        for pair_ids in pairs.values():
            if len(pair_ids) == 2:
                self._teleporters[pair_ids[0]].linked_id = pair_ids[1]
                self._teleporters[pair_ids[1]].linked_id = pair_ids[0]

    def check_teleport(
        self, player_id: str, position: Tuple[float, float]
    ) -> Optional[Tuple[float, float]]:
        """Check if player should teleport. Returns destination or None."""
        current_time = time.time()

        for tp in self._teleporters.values():
            if self._distance(tp.position, position) > tp.radius:
                continue

            if tp.player_cooldowns.get(player_id, 0) > current_time:
                continue

            if not tp.linked_id:
                continue

            dest_tp = self._teleporters.get(tp.linked_id)
            if not dest_tp:
                continue

            cooldown_until = current_time + self.TELEPORTER_COOLDOWN
            tp.player_cooldowns[player_id] = cooldown_until
            dest_tp.player_cooldowns[player_id] = cooldown_until

            self._pending_events.append(
                ArenaEvent(
                    "teleport",
                    {
                        "player_id": player_id,
                        "from_x": tp.position[0],
                        "from_y": tp.position[1],
                        "to_x": dest_tp.position[0],
                        "to_y": dest_tp.position[1],
                    },
                )
            )

            return dest_tp.position

        return None

    def check_jump_pad(
        self, player_id: str, position: Tuple[float, float]
    ) -> Optional[Tuple[float, float]]:
        """Check if player should be launched. Returns velocity or None."""
        current_time = time.time()

        for jp in self._jump_pads.values():
            if self._distance(jp.position, position) > jp.radius:
                continue

            if jp.player_cooldowns.get(player_id, 0) > current_time:
                continue

            jp.player_cooldowns[player_id] = current_time + self.JUMP_PAD_COOLDOWN

            dx, dy = jp.direction
            length = math.sqrt(dx * dx + dy * dy) or 1
            vx = (dx / length) * jp.force
            vy = (dy / length) * jp.force

            self._pending_events.append(
                ArenaEvent("jump_pad", {"player_id": player_id, "vx": vx, "vy": vy})
            )

            return (vx, vy)

        return None

    def cleanup_cooldowns(self, current_time: float) -> None:
        """Clean up expired cooldowns."""
        for tp in self._teleporters.values():
            tp.player_cooldowns = {
                k: v for k, v in tp.player_cooldowns.items() if v > current_time
            }
        for jp in self._jump_pads.values():
            jp.player_cooldowns = {
                k: v for k, v in jp.player_cooldowns.items() if v > current_time
            }

    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get pending events and clear the queue."""
        events = self._pending_events
        self._pending_events = []
        return events

    def clear(self) -> None:
        """Clear all transport systems."""
        self._teleporters.clear()
        self._jump_pads.clear()
        self._pending_events.clear()

    @staticmethod
    def _direction_to_vector(direction: str) -> Tuple[float, float]:
        """Convert string direction to normalized vector."""
        directions = {
            "N": (0, -1),
            "S": (0, 1),
            "E": (1, 0),
            "W": (-1, 0),
            "NE": (0.707, -0.707),
            "NW": (-0.707, -0.707),
            "SE": (0.707, 0.707),
            "SW": (-0.707, 0.707),
        }
        return directions.get(direction, (0, 0))

    @staticmethod
    def _distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        dx = p1[0] - p2[0]
        dy = p1[1] - p2[1]
        return math.sqrt(dx * dx + dy * dy)
