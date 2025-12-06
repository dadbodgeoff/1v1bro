"""
Telemetry-related WebSocket handlers.
"""

from datetime import datetime
from uuid import UUID
from app.core.logging import get_logger
from app.telemetry.replay_service import ReplayService
from app.telemetry.schemas import DeathReplayCreate
from app.database.supabase_client import get_supabase_service_client
from .base import BaseHandler

logger = get_logger("websocket.handlers.telemetry")


class TelemetryHandler(BaseHandler):
    """Handles telemetry events (replay upload, flagging)."""

    async def handle_upload_replay(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle death replay upload from client."""
        try:
            lobby = await self.get_lobby(lobby_code)
            lobby_id = lobby["id"]

            victim_id = payload.get("victimId")
            killer_id = payload.get("killerId")
            death_tick = payload.get("deathTick", 0)
            frames = payload.get("frames", [])

            if not victim_id or not killer_id or not frames:
                logger.warning(f"Invalid replay upload from {user_id}")
                return

            if victim_id != user_id:
                logger.warning(f"User {user_id} tried to upload replay for {victim_id}")
                return

            client = get_supabase_service_client()
            replay_service = ReplayService(client)

            replay_data = DeathReplayCreate(
                lobby_id=UUID(lobby_id),
                victim_id=UUID(victim_id),
                killer_id=UUID(killer_id),
                death_tick=death_tick,
                death_timestamp=datetime.utcnow(),
                frames=frames,
            )

            replay_id = await replay_service.store_replay(replay_data)

            await self.manager.send_to_user(
                user_id,
                {
                    "type": "telemetry_replay_stored",
                    "payload": {"replay_id": str(replay_id), "success": True}
                }
            )

            logger.info(f"Stored death replay {replay_id} for victim {victim_id}")

        except Exception as e:
            logger.error(f"Error storing replay: {e}")
            await self.manager.send_to_user(
                user_id,
                {"type": "telemetry_replay_stored", "payload": {"success": False, "error": str(e)}}
            )

    async def handle_flag_death(self, user_id: str, payload: dict) -> None:
        """Handle flagging a death as suspicious."""
        try:
            replay_id = payload.get("replayId")
            reason = payload.get("reason", "")

            if not replay_id:
                logger.warning(f"Invalid flag request from {user_id}")
                return

            client = get_supabase_service_client()
            replay_service = ReplayService(client)

            success = await replay_service.flag_replay(
                UUID(replay_id),
                reason,
                UUID(user_id),
            )

            await self.manager.send_to_user(
                user_id,
                {"type": "telemetry_death_flagged", "payload": {"replay_id": replay_id, "success": success}}
            )

            if success:
                logger.info(f"User {user_id} flagged replay {replay_id}: {reason}")

        except Exception as e:
            logger.error(f"Error flagging replay: {e}")
            await self.manager.send_to_user(
                user_id,
                {"type": "telemetry_death_flagged", "payload": {"success": False, "error": str(e)}}
            )
