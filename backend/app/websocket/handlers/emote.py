"""
Emote WebSocket handlers.
Requirements: 5.2, 5.4
"""

import time
from app.core.logging import get_logger
from app.websocket.events import WSEventType
from .base import BaseHandler

logger = get_logger("websocket.handlers.emote")


class EmoteHandler(BaseHandler):
    """Handles emote triggering and broadcasting."""

    # Server-side cooldown enforcement (ms)
    COOLDOWN_MS = 3000

    # Track last emote time per player
    _last_emote_time: dict[str, float] = {}

    async def handle_trigger(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """
        Handle emote trigger from client.
        Requirements: 5.2, 5.4
        
        Validates cooldown and broadcasts to opponent.
        """
        emote_id = payload.get("emote_id")
        timestamp = payload.get("timestamp", time.time() * 1000)

        if not emote_id:
            logger.warning(f"Emote trigger missing emote_id from {user_id}")
            return

        # Check cooldown
        now_ms = time.time() * 1000
        last_time = self._last_emote_time.get(user_id, 0)
        
        if now_ms - last_time < self.COOLDOWN_MS:
            logger.debug(f"Emote cooldown active for {user_id}")
            return

        # Record emote time
        self._last_emote_time[user_id] = now_ms

        # Broadcast to all players in lobby (including sender for confirmation)
        await self.manager.broadcast_to_lobby(
            lobby_code,
            {
                "type": "emote_triggered",
                "payload": {
                    "player_id": user_id,
                    "emote_id": emote_id,
                    "timestamp": timestamp,
                }
            }
        )

        logger.debug(f"Emote {emote_id} triggered by {user_id} in {lobby_code}")

    def reset_player(self, user_id: str) -> None:
        """Reset cooldown for a player (on match end)."""
        self._last_emote_time.pop(user_id, None)

    def reset_lobby(self, lobby_code: str, player_ids: list[str]) -> None:
        """Reset cooldowns for all players in a lobby."""
        for player_id in player_ids:
            self.reset_player(player_id)
