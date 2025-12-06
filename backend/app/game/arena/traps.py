"""
Trap Manager - Handles pressure, timed, and projectile traps.
"""

import math
import time
from typing import Dict, List, Tuple

from .types import TrapType, TrapState, TrapEffect, ServerTrap, ArenaEvent


class TrapManager:
    """Manages server-side trap state and triggers."""

    WARNING_DURATION = 0.3
    TRIGGER_DURATION = 0.1
    CHAIN_DELAY = 0.3

    def __init__(self):
        self._traps: Dict[str, ServerTrap] = {}
        self._pending_events: List[ArenaEvent] = []
        self._pending_chains: List[Tuple[str, float]] = []

    def add(
        self,
        id: str,
        type: TrapType,
        x: float,
        y: float,
        radius: float,
        effect: TrapEffect,
        effect_value: float,
        cooldown: float,
        interval: float | None = None,
        chain_radius: float | None = None,
        despawn_time: float | None = None,
    ) -> ServerTrap:
        """Add a trap to the arena."""
        trap = ServerTrap(
            id=id,
            type=type,
            position=(x, y),
            radius=radius,
            effect=effect,
            effect_value=effect_value,
            cooldown=cooldown,
            interval=interval,
            chain_radius=chain_radius,
            despawn_time=despawn_time,
        )
        self._traps[id] = trap
        self._pending_events.append(
            ArenaEvent(
                "trap_spawn",
                {
                    "id": id,
                    "type": type.value,
                    "x": x,
                    "y": y,
                    "radius": radius,
                    "effect": effect.value,
                    "effectValue": effect_value,
                },
            )
        )
        return trap

    def remove(self, id: str) -> None:
        """Remove a trap from the arena."""
        if id in self._traps:
            del self._traps[id]
            self._pending_events.append(ArenaEvent("trap_despawn", {"id": id}))

    def update(
        self,
        delta_time: float,
        player_positions: Dict[str, Tuple[float, float]],
        current_time: float,
    ) -> None:
        """Update trap states."""
        for trap_id, trap in self._traps.items():
            if trap.state == TrapState.COOLDOWN:
                self._update_cooldown(trap_id, trap, delta_time)
            elif trap.state == TrapState.WARNING:
                self._update_warning(trap_id, trap, current_time, player_positions)
            elif trap.state == TrapState.TRIGGERED:
                self._update_triggered(trap, current_time)
            elif trap.state == TrapState.ARMED:
                self._check_trigger(trap_id, trap, current_time, player_positions)

    def _update_cooldown(self, trap_id: str, trap: ServerTrap, delta_time: float) -> None:
        trap.cooldown_remaining -= delta_time
        if trap.cooldown_remaining <= 0:
            trap.state = TrapState.ARMED
            trap.cooldown_remaining = 0
            self._pending_events.append(ArenaEvent("trap_armed", {"id": trap_id}))

    def _update_warning(
        self,
        trap_id: str,
        trap: ServerTrap,
        current_time: float,
        player_positions: Dict[str, Tuple[float, float]],
    ) -> None:
        if current_time - trap.last_trigger_time >= self.WARNING_DURATION:
            self._execute(trap_id, trap, current_time, player_positions)

    def _update_triggered(self, trap: ServerTrap, current_time: float) -> None:
        if current_time - trap.last_trigger_time >= self.TRIGGER_DURATION:
            trap.state = TrapState.COOLDOWN
            trap.cooldown_remaining = trap.cooldown

    def _check_trigger(
        self,
        trap_id: str,
        trap: ServerTrap,
        current_time: float,
        player_positions: Dict[str, Tuple[float, float]],
    ) -> None:
        should_trigger = False

        if trap.type == TrapType.PRESSURE:
            for px, py in player_positions.values():
                if self._distance(trap.position, (px, py)) <= trap.radius:
                    should_trigger = True
                    break
        elif trap.type == TrapType.TIMED:
            if trap.interval and current_time - trap.last_trigger_time >= trap.interval:
                should_trigger = True

        if should_trigger:
            self._start_warning(trap_id, trap, current_time)

    def _start_warning(self, trap_id: str, trap: ServerTrap, current_time: float) -> None:
        trap.state = TrapState.WARNING
        trap.last_trigger_time = current_time
        self._pending_events.append(ArenaEvent("trap_warning", {"id": trap_id}))

    def _execute(
        self,
        trap_id: str,
        trap: ServerTrap,
        current_time: float,
        player_positions: Dict[str, Tuple[float, float]],
    ) -> None:
        trap.state = TrapState.TRIGGERED
        trap.last_trigger_time = current_time

        # Find affected players
        affected = [
            pid for pid, (px, py) in player_positions.items()
            if self._distance(trap.position, (px, py)) <= trap.radius
        ]

        effect_data = {
            "id": trap_id,
            "effect": trap.effect.value,
            "value": trap.effect_value,
            "affected_players": affected,
            "x": trap.position[0],
            "y": trap.position[1],
        }

        if trap.effect == TrapEffect.KNOCKBACK:
            knockbacks = {}
            for player_id in affected:
                px, py = player_positions[player_id]
                dx = px - trap.position[0]
                dy = py - trap.position[1]
                dist = math.sqrt(dx * dx + dy * dy) or 1
                knockbacks[player_id] = {
                    "dx": dx / dist * trap.effect_value,
                    "dy": dy / dist * trap.effect_value,
                }
            effect_data["knockbacks"] = knockbacks

        self._pending_events.append(ArenaEvent("trap_triggered", effect_data))

        if trap.chain_radius:
            self._queue_chains(trap_id, trap.chain_radius, current_time)

    def _queue_chains(self, source_id: str, chain_radius: float, current_time: float) -> None:
        source = self._traps.get(source_id)
        if not source:
            return

        for trap_id, trap in self._traps.items():
            if trap_id == source_id or trap.state != TrapState.ARMED:
                continue
            if self._distance(source.position, trap.position) <= chain_radius:
                self._pending_chains.append((trap_id, current_time + self.CHAIN_DELAY))

    def process_chains(
        self, current_time: float, player_positions: Dict[str, Tuple[float, float]]
    ) -> None:
        """Process pending chain triggers."""
        to_process = [(tid, t) for tid, t in self._pending_chains if current_time >= t]
        self._pending_chains = [(tid, t) for tid, t in self._pending_chains if current_time < t]

        for trap_id, _ in to_process:
            trap = self._traps.get(trap_id)
            if trap and trap.state == TrapState.ARMED:
                self._start_warning(trap_id, trap, current_time)

    def on_projectile_hit(
        self, position: Tuple[float, float], player_positions: Dict[str, Tuple[float, float]]
    ) -> None:
        """Handle projectile hit for projectile-triggered traps."""
        current_time = time.time()
        for trap_id, trap in self._traps.items():
            if trap.type != TrapType.PROJECTILE or trap.state != TrapState.ARMED:
                continue
            if self._distance(trap.position, position) <= trap.radius:
                self._start_warning(trap_id, trap, current_time)

    def check_despawns(self, current_time: float) -> None:
        """Check for dynamic despawns."""
        to_remove = [
            t.id for t in self._traps.values()
            if t.despawn_time and current_time >= t.despawn_time
        ]
        for tid in to_remove:
            self.remove(tid)

    def get_state(self) -> List[dict]:
        """Get current trap state for broadcast."""
        return [
            {
                "id": t.id,
                "type": t.type.value,
                "x": t.position[0],
                "y": t.position[1],
                "radius": t.radius,
                "state": t.state.value,
                "effect": t.effect.value,
            }
            for t in self._traps.values()
        ]

    def get_and_clear_events(self) -> List[ArenaEvent]:
        """Get pending events and clear the queue."""
        events = self._pending_events
        self._pending_events = []
        return events

    def clear(self) -> None:
        """Clear all traps."""
        self._traps.clear()
        self._pending_events.clear()
        self._pending_chains.clear()

    @staticmethod
    def _distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        dx = p1[0] - p2[0]
        dy = p1[1] - p2[1]
        return math.sqrt(dx * dx + dy * dy)
