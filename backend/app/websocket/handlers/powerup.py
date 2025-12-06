"""
Power-up related WebSocket handlers.
"""

from app.core.logging import get_logger
from app.services.powerup_service import powerup_service
from app.schemas.ws_messages import PowerUpType
from app.utils.combat_tracker import CombatTracker
from app.websocket.events import WSEventType
from .base import BaseHandler

logger = get_logger("websocket.handlers.powerup")


class PowerUpHandler(BaseHandler):
    """Handles power-up collection and usage."""

    async def handle_collect(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle power-up collection."""
        powerup_id = payload.get("powerup_id")

        lobby = await self.get_lobby(lobby_code)
        lobby_id = lobby["id"]

        session = self.game_service.get_session(lobby_id)
        if not session or user_id not in session.player_states:
            return

        player_state = session.player_states[user_id]

        powerup = powerup_service.collect_powerup(
            lobby_id,
            powerup_id,
            player_state.inventory,
        )

        if powerup:
            player_state.inventory.append(powerup.type.value)
            CombatTracker.record_powerup(lobby_id, user_id, powerup.type.value)

            await self.manager.broadcast_to_lobby(
                lobby_code,
                {
                    "type": WSEventType.POWERUP_COLLECTED.value,
                    "payload": {
                        "powerup_id": powerup_id,
                        "player_id": user_id,
                        "type": powerup.type.value,
                    }
                }
            )

    async def handle_use(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle power-up usage."""
        powerup_type = payload.get("type")

        lobby = await self.get_lobby(lobby_code)
        lobby_id = lobby["id"]

        session = self.game_service.get_session(lobby_id)
        if not session or user_id not in session.player_states:
            return

        player_state = session.player_states[user_id]

        if powerup_type not in player_state.inventory:
            return

        player_state.inventory.remove(powerup_type)

        if powerup_type == PowerUpType.SOS.value:
            await self._handle_sos(lobby_code, lobby_id, user_id, session)
        elif powerup_type == PowerUpType.TIME_STEAL.value:
            await self._handle_time_steal(lobby_code, user_id, session)
        elif powerup_type == PowerUpType.SHIELD.value:
            player_state.has_shield = True
            await self.manager.broadcast_to_lobby(
                lobby_code,
                {"type": WSEventType.SHIELD_ACTIVATED.value, "payload": {"player_id": user_id}}
            )
        elif powerup_type == PowerUpType.DOUBLE_POINTS.value:
            player_state.has_double_points = True
            await self.manager.broadcast_to_lobby(
                lobby_code,
                {"type": WSEventType.DOUBLE_POINTS_ACTIVATED.value, "payload": {"player_id": user_id}}
            )

    async def _handle_sos(self, lobby_code: str, lobby_id: str, user_id: str, session) -> None:
        """Apply SOS power-up effect."""
        if not session.current_question or session.current_question < 1:
            return

        question = session.questions[session.current_question - 1]
        eliminated = powerup_service.apply_sos(
            question.correct_answer,
            question.options,
        )

        await self.manager.send_to_user(
            user_id,
            {
                "type": WSEventType.SOS_USED.value,
                "payload": {"player_id": user_id, "eliminated_options": eliminated}
            }
        )

    async def _handle_time_steal(self, lobby_code: str, user_id: str, session) -> None:
        """Apply Time Steal power-up effect."""
        opponent_id = None
        for pid in session.player_states:
            if pid != user_id:
                opponent_id = pid
                break

        if not opponent_id:
            return

        session.player_states[opponent_id].time_penalty_ms += 5000

        await self.manager.broadcast_to_lobby(
            lobby_code,
            {
                "type": WSEventType.TIME_STOLEN.value,
                "payload": {"stealer_id": user_id, "victim_id": opponent_id, "seconds_stolen": 5}
            }
        )
