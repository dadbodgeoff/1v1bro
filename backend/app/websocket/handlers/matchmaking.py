"""
Matchmaking-related WebSocket handlers.
"""

from app.core.logging import get_logger
from app.websocket.events import build_error
from app.database.supabase_client import get_supabase_service_client
from .base import BaseHandler

logger = get_logger("websocket.handlers.matchmaking")


class MatchmakingHandler(BaseHandler):
    """Handles matchmaking queue events."""

    async def handle_queue_join(self, user_id: str, payload: dict) -> None:
        """Handle queue join request via WebSocket."""
        try:
            from app.services.matchmaking_service import get_matchmaking_service
            from app.database.repositories.user_repo import UserRepository

            service = get_matchmaking_service()

            client = get_supabase_service_client()
            user_repo = UserRepository(client)
            profile = await user_repo.get_by_id(user_id)
            player_name = profile.get("display_name", "Unknown") if profile else "Unknown"

            await service.join_queue(user_id, player_name)

        except ValueError as e:
            error_msg = str(e)
            if error_msg == "ALREADY_IN_QUEUE":
                await self.manager.send_to_user(user_id, build_error("ALREADY_IN_QUEUE", "Already in queue"))
            elif error_msg.startswith("QUEUE_COOLDOWN:"):
                remaining = error_msg.split(":")[1]
                await self.manager.send_to_user(user_id, build_error("QUEUE_COOLDOWN", f"Cooldown: {remaining}s"))
            else:
                await self.manager.send_to_user(user_id, build_error("QUEUE_ERROR", str(e)))
        except Exception as e:
            logger.error(f"Error joining queue: {e}")
            await self.manager.send_to_user(user_id, build_error("QUEUE_ERROR", str(e)))

    async def handle_queue_leave(self, user_id: str) -> None:
        """Handle queue leave request via WebSocket."""
        try:
            from app.services.matchmaking_service import get_matchmaking_service

            service = get_matchmaking_service()
            await service.leave_queue(user_id, "user_cancelled")

        except Exception as e:
            logger.error(f"Error leaving queue: {e}")
            await self.manager.send_to_user(user_id, build_error("QUEUE_ERROR", str(e)))
