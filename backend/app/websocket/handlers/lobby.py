"""
Lobby-related WebSocket handlers.
"""

import asyncio
from app.core.logging import get_logger
from app.game import tick_system
from app.websocket.events import (
    build_error,
    build_game_start,
    build_player_ready,
    build_player_joined,
    build_player_left,
    build_lobby_state,
)
from .base import BaseHandler

logger = get_logger("websocket.handlers.lobby")


class LobbyHandler(BaseHandler):
    """Handles lobby events (join, leave, ready, start)."""

    def __init__(self, lobby_service, game_service, quiz_handler):
        super().__init__(lobby_service, game_service)
        self.quiz_handler = quiz_handler

    async def handle_start_game(self, lobby_code: str, user_id: str) -> None:
        """Handle start_game message from host."""
        try:
            lobby = await self.get_lobby(lobby_code)

            if lobby["host_id"] != user_id:
                await self.send_error(user_id, "NOT_HOST", "Only the host can start the game")
                return

            if not lobby.get("opponent_id"):
                await self.send_error(user_id, "NO_OPPONENT", "Cannot start without an opponent")
                return

            await self.lobby_service.start_game(lobby["id"], user_id)

            session = self.game_service.create_session(
                lobby_id=lobby["id"],
                player1_id=lobby["host_id"],
                player2_id=lobby["opponent_id"],
                game_mode=lobby.get("game_mode", "fortnite"),
            )

            tick_system.create_game(
                lobby_id=lobby_code,
                player1_id=lobby["host_id"],
                player2_id=lobby["opponent_id"],
                spawn1=(160, 360),
                spawn2=(1120, 360),
            )
            tick_system.start_game(lobby_code)
            logger.info(f"Started tick system for game {lobby_code}")

            self.game_service.start_game(lobby["id"])

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_game_start(
                    total_questions=len(session.questions),
                    players=lobby["players"],
                    player1_id=lobby["host_id"],
                    player2_id=lobby["opponent_id"],
                )
            )

            await asyncio.sleep(1)
            await self.quiz_handler.send_question(lobby_code, lobby["id"])

        except Exception as e:
            logger.error(f"Error starting game: {e}")
            await self.manager.broadcast_to_lobby(lobby_code, build_error("START_FAILED", str(e)))

    async def handle_ready(self, lobby_code: str, user_id: str) -> None:
        """Handle ready message from player."""
        try:
            lobby = await self.lobby_service.set_player_ready(lobby_code, user_id)
            logger.info(f"Player {user_id} ready in lobby {lobby_code}")

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_player_ready(
                    player_id=user_id,
                    players=lobby["players"],
                    can_start=lobby.get("can_start", False),
                )
            )
        except Exception as e:
            logger.error(f"Error handling ready: {e}")
            await self.send_error(user_id, "READY_FAILED", str(e))

    async def handle_connect(self, lobby_code: str, user_id: str, display_name: str | None) -> None:
        """Handle new player connection."""
        try:
            lobby = await self.get_lobby(lobby_code)

            await self.manager.send_to_user(
                user_id,
                build_lobby_state(
                    lobby_id=lobby["id"],
                    status=lobby["status"],
                    players=lobby["players"],
                    can_start=lobby.get("can_start", False),
                    host_id=lobby["host_id"],
                )
            )

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_player_joined(
                    player_id=user_id,
                    display_name=display_name,
                    players=lobby["players"],
                    can_start=lobby.get("can_start", False),
                )
            )

        except Exception as e:
            logger.error(f"Error handling connect: {e}")

    async def handle_disconnect(self, lobby_code: str, user_id: str) -> None:
        """Handle player disconnection."""
        try:
            lobby = await self.get_lobby(lobby_code)

            connected_users = self.manager.get_lobby_users(lobby_code)
            if len(connected_users) == 0:
                tick_system.stop_game(lobby_code)
                logger.info(f"Stopped tick system for {lobby_code} - all players disconnected")

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_player_left(user_id, lobby.get("players", []))
            )

        except Exception as e:
            logger.error(f"Error handling disconnect: {e}")
