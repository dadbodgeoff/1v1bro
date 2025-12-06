"""
Replay Service for storing and retrieving death replays.
"""

import base64
import json
import zlib
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from supabase import Client

from .schemas import DeathReplayCreate, DeathReplayResponse, DeathReplaySummary


class ReplayService:
    """Service for storing and retrieving death replays."""

    RETENTION_HOURS = 24
    FLAGGED_RETENTION_DAYS = 7
    COMPRESSION_LEVEL = 6

    def __init__(self, client: Client):
        self.client = client

    async def store_replay(self, replay: DeathReplayCreate) -> UUID:
        """
        Store a death replay with compression.
        
        Args:
            replay: Death replay data to store
            
        Returns:
            UUID of the stored replay
        """
        # Compress frames to reduce storage
        frames_json = json.dumps(replay.frames)
        compressed = zlib.compress(frames_json.encode(), level=self.COMPRESSION_LEVEL)
        frames_b64 = base64.b64encode(compressed).decode()

        expires_at = datetime.utcnow() + timedelta(hours=self.RETENTION_HOURS)

        result = self.client.table("death_replays").insert({
            "lobby_id": str(replay.lobby_id),
            "victim_id": str(replay.victim_id),
            "killer_id": str(replay.killer_id),
            "death_tick": replay.death_tick,
            "death_timestamp": replay.death_timestamp.isoformat(),
            "frames": {"compressed": frames_b64},
            "expires_at": expires_at.isoformat(),
        }).execute()

        return UUID(result.data[0]["id"])

    async def get_replay(self, replay_id: UUID) -> Optional[DeathReplayResponse]:
        """
        Retrieve and decompress a replay.
        
        Args:
            replay_id: UUID of the replay to retrieve
            
        Returns:
            DeathReplayResponse or None if not found
        """
        result = self.client.table("death_replays")\
            .select("*")\
            .eq("id", str(replay_id))\
            .single()\
            .execute()

        if not result.data:
            return None

        return self._decompress_replay(result.data)

    async def flag_replay(
        self,
        replay_id: UUID,
        reason: str,
        user_id: UUID
    ) -> bool:
        """
        Flag a replay for extended retention.
        Only the victim can flag their own death.
        
        Args:
            replay_id: UUID of the replay to flag
            reason: Reason for flagging
            user_id: UUID of the user flagging (must be victim)
            
        Returns:
            True if flagged successfully, False otherwise
        """
        # Extend expiry to 7 days
        new_expiry = datetime.utcnow() + timedelta(days=self.FLAGGED_RETENTION_DAYS)

        result = self.client.table("death_replays")\
            .update({
                "flagged": True,
                "flag_reason": reason,
                "flagged_at": datetime.utcnow().isoformat(),
                "expires_at": new_expiry.isoformat(),
            })\
            .eq("id", str(replay_id))\
            .eq("victim_id", str(user_id))\
            .execute()

        return len(result.data) > 0

    async def get_player_replays(
        self,
        player_id: UUID,
        limit: int = 10
    ) -> List[DeathReplaySummary]:
        """
        Get recent replay summaries for a player (as victim or killer).
        Does not include frame data for efficiency.
        
        Args:
            player_id: UUID of the player
            limit: Maximum number of replays to return
            
        Returns:
            List of DeathReplaySummary
        """
        result = self.client.table("death_replays")\
            .select("id, lobby_id, victim_id, killer_id, death_tick, death_timestamp, flagged, created_at")\
            .or_(f"victim_id.eq.{player_id},killer_id.eq.{player_id}")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        return [
            DeathReplaySummary(
                id=row["id"],
                lobby_id=row["lobby_id"],
                victim_id=row["victim_id"],
                killer_id=row["killer_id"],
                death_tick=row["death_tick"],
                death_timestamp=row["death_timestamp"],
                flagged=row["flagged"],
                created_at=row["created_at"],
            )
            for row in result.data
        ]

    async def get_flagged_replays(self, limit: int = 50) -> List[DeathReplaySummary]:
        """
        Get flagged replays for admin review.
        
        Args:
            limit: Maximum number of replays to return
            
        Returns:
            List of DeathReplaySummary
        """
        result = self.client.table("death_replays")\
            .select("id, lobby_id, victim_id, killer_id, death_tick, death_timestamp, flagged, created_at")\
            .eq("flagged", True)\
            .order("flagged_at", desc=True)\
            .limit(limit)\
            .execute()

        return [
            DeathReplaySummary(
                id=row["id"],
                lobby_id=row["lobby_id"],
                victim_id=row["victim_id"],
                killer_id=row["killer_id"],
                death_tick=row["death_tick"],
                death_timestamp=row["death_timestamp"],
                flagged=row["flagged"],
                created_at=row["created_at"],
            )
            for row in result.data
        ]

    async def cleanup_expired(self) -> int:
        """
        Delete expired replays (called by cron job).
        Only deletes non-flagged replays past their expiry.
        
        Returns:
            Count of deleted replays
        """
        result = self.client.table("death_replays")\
            .delete()\
            .lt("expires_at", datetime.utcnow().isoformat())\
            .eq("flagged", False)\
            .execute()

        return len(result.data)

    def _decompress_replay(self, row: dict) -> DeathReplayResponse:
        """Decompress replay frames from database row."""
        frames_b64 = row["frames"]["compressed"]
        compressed = base64.b64decode(frames_b64)
        frames_json = zlib.decompress(compressed).decode()
        frames = json.loads(frames_json)

        return DeathReplayResponse(
            id=row["id"],
            lobby_id=row["lobby_id"],
            victim_id=row["victim_id"],
            killer_id=row["killer_id"],
            death_tick=row["death_tick"],
            death_timestamp=row["death_timestamp"],
            frames=frames,
            flagged=row["flagged"],
            flag_reason=row.get("flag_reason"),
            created_at=row["created_at"],
        )
