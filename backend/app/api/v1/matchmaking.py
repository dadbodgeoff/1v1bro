"""
Matchmaking API endpoints.
Handles queue join, leave, and status operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.core.logging import get_logger
from app.api.deps import get_current_user
from app.services.matchmaking_service import get_matchmaking_service

logger = get_logger("api.matchmaking")
router = APIRouter(prefix="/matchmaking", tags=["matchmaking"])


class QueueJoinRequest(BaseModel):
    """Request to join matchmaking queue."""
    game_mode: str = "fortnite"


class QueueJoinResponse(BaseModel):
    """Response after joining queue."""
    ticket_id: str
    position: int
    queue_size: int


class QueueStatusResponse(BaseModel):
    """Current queue status."""
    in_queue: bool
    position: Optional[int] = None
    wait_seconds: int = 0
    estimated_wait: Optional[int] = None
    queue_size: int = 0


class CooldownResponse(BaseModel):
    """Cooldown status."""
    has_cooldown: bool
    remaining_seconds: int = 0


@router.post("/queue", response_model=QueueJoinResponse)
async def join_queue(
    request: QueueJoinRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Join the matchmaking queue.
    
    Returns ticket info if successful.
    Raises 409 if already in queue, 403 if on cooldown.
    """
    try:
        service = get_matchmaking_service()
        
        ticket = await service.join_queue(
            player_id=current_user["id"],
            player_name=current_user.get("display_name", "Unknown"),
        )
        
        status = await service.get_queue_status(current_user["id"])
        
        return QueueJoinResponse(
            ticket_id=ticket.id,
            position=status.position or 1,
            queue_size=status.queue_size,
        )
        
    except ValueError as e:
        error_msg = str(e)
        
        if error_msg == "ALREADY_IN_QUEUE":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already in matchmaking queue",
            )
        
        if error_msg.startswith("QUEUE_COOLDOWN:"):
            remaining = int(error_msg.split(":")[1])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Queue cooldown active. {remaining} seconds remaining.",
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error joining queue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join queue",
        )


@router.delete("/queue")
async def leave_queue(
    current_user: dict = Depends(get_current_user),
):
    """
    Leave the matchmaking queue.
    
    Returns success status.
    """
    try:
        service = get_matchmaking_service()
        
        removed = await service.leave_queue(
            player_id=current_user["id"],
            reason="user_cancelled",
        )
        
        if not removed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not in matchmaking queue",
            )
        
        return {"success": True, "message": "Left matchmaking queue"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving queue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave queue",
        )


@router.get("/status", response_model=QueueStatusResponse)
async def get_queue_status(
    current_user: dict = Depends(get_current_user),
):
    """
    Get current queue status.
    
    Returns position, wait time, and queue size.
    """
    try:
        service = get_matchmaking_service()
        
        queue_status = await service.get_queue_status(current_user["id"])
        
        return QueueStatusResponse(
            in_queue=queue_status.in_queue,
            position=queue_status.position,
            wait_seconds=queue_status.wait_seconds,
            estimated_wait=queue_status.estimated_wait,
            queue_size=queue_status.queue_size,
        )
        
    except Exception as e:
        logger.error(f"Error getting queue status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get queue status",
        )


@router.get("/cooldown", response_model=CooldownResponse)
async def get_cooldown_status(
    current_user: dict = Depends(get_current_user),
):
    """
    Check if player has active queue cooldown.
    """
    try:
        service = get_matchmaking_service()
        
        remaining = await service.check_cooldown(current_user["id"])
        
        return CooldownResponse(
            has_cooldown=remaining is not None,
            remaining_seconds=remaining or 0,
        )
        
    except Exception as e:
        logger.error(f"Error checking cooldown: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check cooldown",
        )
