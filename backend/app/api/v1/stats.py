"""
Stats API endpoints.
Provides player statistics retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentUser
from app.database.supabase_client import get_supabase_service_client
from app.schemas.stats import PlayerStats
from app.services.stats_service import StatsService


router = APIRouter(prefix="/stats", tags=["stats"])


def get_stats_service() -> StatsService:
    """Dependency to get stats service."""
    client = get_supabase_service_client()
    return StatsService(client)


@router.get("/me", response_model=PlayerStats)
async def get_my_stats(
    current_user: CurrentUser,
    stats_service: StatsService = Depends(get_stats_service),
) -> PlayerStats:
    """
    Get current user's complete statistics.
    
    Returns all trivia, combat, and streak stats with computed fields.
    """
    stats = await stats_service.get_user_stats(current_user.id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User stats not found",
        )
    return stats


@router.get("/{user_id}", response_model=PlayerStats)
async def get_user_stats(
    user_id: str,
    stats_service: StatsService = Depends(get_stats_service),
) -> PlayerStats:
    """
    Get statistics for a specific user.
    
    Args:
        user_id: User UUID
        
    Returns:
        Complete player statistics
    """
    stats = await stats_service.get_user_stats(user_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return stats
