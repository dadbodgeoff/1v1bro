"""
WebSocket message router.
Routes incoming messages to domain-specific handlers.
"""

from typing import Optional
from fastapi import WebSocket

from app.core.logging import get_logger
from app.services.game_service import GameService
from app.services.lobby_service import LobbyService
from app.websocket.manager import manager
from app.websocket.events import WSEventType, build_error
from app.game import tick_system

from .quiz import QuizHandler
from .combat import CombatHandler
from .arena import ArenaHandler
from .powerup import PowerUpHandler
from .telemetry import TelemetryHandler
from .lobby import LobbyHandler
from .matchmaking import MatchmakingHandler

logger = get_logger("websocket.handlers")


# Wire up tick system broadcast callback
async def _broadcast_tick_state(lobby_code: str, message: dict) -> None:
    """Broadcast tick state update to all players in lobby."""
    await manager.broadcast_to_lobby(lobby_code, message)

tick_system.set_broadcast_callback(_broadcast_tick_state)


class GameHandler:
    """
    Main WebSocket message router.
    
    Routes messages to domain-specific handlers:
    - QuizHandler: Questions, answers, rounds
    - CombatHandler: Fire, damage, kills
    - ArenaHandler: Position, hazards, traps
    - PowerUpHandler: Collection, usage
    - TelemetryHandler: Replay upload/flagging
    - LobbyHandler: Join, leave, ready, start
    - MatchmakingHandler: Queue join/leave
    """

    def __init__(self, lobby_service: LobbyService, game_service: GameService):
        self.lobby_service = lobby_service
        self.game_service = game_service

        # Initialize domain handlers
        self.quiz = QuizHandler(lobby_service, game_service)
        self.combat = CombatHandler(lobby_service, game_service)
        self.arena = ArenaHandler(lobby_service, game_service)
        self.powerup = PowerUpHandler(lobby_service, game_service)
        self.telemetry = TelemetryHandler(lobby_service, game_service)
        self.matchmaking = MatchmakingHandler(lobby_service, game_service)
        self.lobby = LobbyHandler(lobby_service, game_service, self.quiz)

    async def handle_message(
        self,
        websocket: WebSocket,
        message: dict,
        lobby_code: str,
        user_id: str,
    ) -> None:
        """Route incoming message to appropriate handler."""
        msg_type = message.get("type")
        payload = message.get("payload", {})

        if msg_type != "ping":
            logger.info(f"[WS] Received message type={msg_type} from user={user_id}")

        try:
            # Ping/pong for latency
            if msg_type == "ping":
                await manager.send_personal(websocket, {"type": "pong", "payload": {}})
                return

            # Route to appropriate handler
            if msg_type == WSEventType.START_GAME.value:
                await self.lobby.handle_start_game(lobby_code, user_id)

            elif msg_type == WSEventType.ANSWER.value:
                await self.quiz.handle_answer(lobby_code, user_id, payload)

            elif msg_type == "request_resync":
                await self.quiz.handle_resync_request(lobby_code, user_id, payload)

            elif msg_type == WSEventType.READY.value:
                await self.lobby.handle_ready(lobby_code, user_id)

            elif msg_type == WSEventType.POSITION_UPDATE.value:
                await self.arena.handle_position_update(lobby_code, user_id, payload)

            elif msg_type == "arena_init":
                await self.arena.handle_arena_init(lobby_code, user_id, payload)

            elif msg_type == "combat_fire":
                await self.combat.handle_fire(lobby_code, user_id, payload)

            elif msg_type == WSEventType.COMBAT_KILL.value:
                await self.combat.handle_kill(lobby_code, user_id, payload)

            elif msg_type == WSEventType.COMBAT_DAMAGE.value:
                await self.combat.handle_damage(lobby_code, user_id, payload)

            elif msg_type == WSEventType.COMBAT_SHOT.value:
                await self.combat.handle_shot(lobby_code, user_id, payload)

            elif msg_type == WSEventType.POWERUP_COLLECTED.value:
                await self.powerup.handle_collect(lobby_code, user_id, payload)

            elif msg_type == WSEventType.POWERUP_USE.value:
                await self.powerup.handle_use(lobby_code, user_id, payload)

            elif msg_type == "telemetry_upload_replay":
                await self.telemetry.handle_upload_replay(lobby_code, user_id, payload)

            elif msg_type == "telemetry_flag_death":
                await self.telemetry.handle_flag_death(user_id, payload)

            elif msg_type == WSEventType.QUEUE_JOIN.value:
                await self.matchmaking.handle_queue_join(user_id, payload)

            elif msg_type == WSEventType.QUEUE_LEAVE.value:
                await self.matchmaking.handle_queue_leave(user_id)

            else:
                await manager.send_personal(
                    websocket,
                    build_error("UNKNOWN_MESSAGE", f"Unknown message type: {msg_type}")
                )

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await manager.send_personal(websocket, build_error("HANDLER_ERROR", str(e)))

    async def handle_connect(
        self,
        lobby_code: str,
        user_id: str,
        display_name: Optional[str],
    ) -> None:
        """Handle new player connection."""
        await self.lobby.handle_connect(lobby_code, user_id, display_name)

    async def handle_disconnect(self, lobby_code: str, user_id: str) -> None:
        """Handle player disconnection."""
        await self.lobby.handle_disconnect(lobby_code, user_id)
