"""
Telemetry API endpoints for death replay management.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import get_current_user
from app.database.supabase_client import get_supabase_service_client
from app.telemetry import ReplayService, DeathReplayResponse
from app.telemetry.schemas import DeathReplaySummary, DeathReplayFlag

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


def get_replay_service() -> ReplayService:
    """Get replay service with service client."""
    client = get_supabase_service_client()
    return ReplayService(client)


@router.get("/replays", response_model=List[DeathReplaySummary])
async def get_my_replays(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    service: ReplayService = Depends(get_replay_service),
):
    """
    Get recent death replays for the current user.
    Returns summaries without frame data for efficiency.
    """
    user_id = UUID(current_user["id"])
    return await service.get_player_replays(user_id, limit)


@router.get("/replays/{replay_id}", response_model=DeathReplayResponse)
async def get_replay(
    replay_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ReplayService = Depends(get_replay_service),
):
    """
    Get a specific death replay with full frame data.
    Only accessible to players involved in the replay.
    """
    replay = await service.get_replay(replay_id)
    if not replay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Replay not found",
        )

    # Verify user is involved in the replay
    user_id = UUID(current_user["id"])
    if user_id != replay.victim_id and user_id != replay.killer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this replay",
        )

    return replay


@router.post("/replays/{replay_id}/flag")
async def flag_replay(
    replay_id: UUID,
    flag_data: DeathReplayFlag,
    current_user: dict = Depends(get_current_user),
    service: ReplayService = Depends(get_replay_service),
):
    """
    Flag a death replay as suspicious.
    Only the victim can flag their own death.
    Extends retention to 7 days.
    """
    user_id = UUID(current_user["id"])
    success = await service.flag_replay(replay_id, flag_data.reason, user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not flag replay. You may only flag your own deaths.",
        )

    return {"status": "flagged", "replay_id": str(replay_id)}


@router.delete("/replays/cleanup")
async def cleanup_expired_replays(
    current_user: dict = Depends(get_current_user),
    service: ReplayService = Depends(get_replay_service),
):
    """
    Clean up expired replays.
    This endpoint is intended for admin/cron use.
    In production, this would be restricted to admin users.
    """
    # TODO: Add admin check in production
    count = await service.cleanup_expired()
    return {"status": "cleaned", "deleted_count": count}
