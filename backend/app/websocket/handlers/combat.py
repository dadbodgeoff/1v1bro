"""
Combat-related WebSocket handlers.
"""

import time
from app.core.logging import get_logger
from app.game import tick_system
from app.game.models import FireInput
from app.utils.combat_tracker import CombatTracker
from .base import BaseHandler

logger = get_logger("websocket.handlers.combat")


class CombatHandler(BaseHandler):
    """Handles combat events (fire, damage, kills)."""

    async def handle_fire(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle fire event - queue for server-authoritative processing."""
        direction_x = payload.get("dx", 0)
        direction_y = payload.get("dy", 0)
        sequence = payload.get("seq", 0)

        fire_input = FireInput(
            player_id=user_id,
            direction_x=direction_x,
            direction_y=direction_y,
            sequence=sequence,
            client_timestamp=time.time(),
        )
        tick_system.queue_fire(lobby_code, fire_input)

    async def handle_kill(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle kill event for stats tracking."""
        victim_id = payload.get("victim_id")
        weapon = payload.get("weapon", "projectile")

        if not victim_id:
            return

        lobby = await self.get_lobby(lobby_code)
        CombatTracker.record_kill(lobby["id"], user_id, victim_id, weapon)

    async def handle_damage(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle damage event for stats tracking."""
        target_id = payload.get("target_id")
        amount = payload.get("amount", 0)
        source = payload.get("source", "projectile")

        if not target_id or amount <= 0:
            return

        lobby = await self.get_lobby(lobby_code)
        CombatTracker.record_damage(lobby["id"], user_id, target_id, amount, source)

    async def handle_shot(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle shot event for stats tracking."""
        hit = payload.get("hit", False)

        lobby = await self.get_lobby(lobby_code)
        CombatTracker.record_shot(lobby["id"], user_id, hit)
