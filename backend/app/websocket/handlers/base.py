"""
Base handler with shared dependencies.
"""

from fastapi import WebSocket
from app.core.logging import get_logger
from app.services.lobby_service import LobbyService
from app.services.game_service import GameService
from app.websocket.manager import manager
from app.websocket.events import build_error

logger = get_logger("websocket.handlers")


class BaseHandler:
    """Base class for domain-specific handlers."""

    def __init__(self, lobby_service: LobbyService, game_service: GameService):
        self.lobby_service = lobby_service
        self.game_service = game_service
        self.manager = manager

    async def send_error(self, user_id: str, code: str, message: str) -> None:
        """Send error to user."""
        await self.manager.send_to_user(user_id, build_error(code, message))

    async def get_lobby(self, lobby_code: str) -> dict:
        """Get lobby by code."""
        return await self.lobby_service.get_lobby(lobby_code)
