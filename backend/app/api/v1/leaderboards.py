"""
Leaderboards API endpoints.
Provides leaderboard queries and user rank lookups.
"""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.database.supabase_client import get_supabase_service_client
from app.schemas.leaderboard import (
    LeaderboardCategory, LeaderboardResponse, UserRankResponse,
)
from app.services.leaderboard_service import LeaderboardService


router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


def get_leaderboard_service() -> LeaderboardService:
    """Dependency to get leaderboard service."""
    client = get_supabase_service_client()
    return LeaderboardService(client)


@router.get("/{category}", response_model=LeaderboardResponse)
async def get_leaderboard(
    category: LeaderboardCategory,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
) -> LeaderboardResponse:
    """
    Get leaderboard for a category.
    
    Args:
        category: Leaderboard category (wins, win_rate, kills, etc.)
        limit: Max entries to return (1-100)
        offset: Pagination offset
        
    Returns:
        LeaderboardResponse with entries and metadata
    """
    return await leaderboard_service.get_leaderboard(
        category=category,
        limit=limit,
        offset=offset,
    )


@router.get("/{category}/rank/me", response_model=UserRankResponse)
async def get_my_rank(
    category: LeaderboardCategory,
    current_user: dict = Depends(get_current_user),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
) -> UserRankResponse:
    """
    Get current user's rank in a category.
    
    Args:
        category: Leaderboard category
        
    Returns:
        UserRankResponse with rank and eligibility info
    """
    return await leaderboard_service.get_user_rank(
        user_id=current_user["id"],
        category=category,
    )


@router.get("/{category}/rank/{user_id}", response_model=UserRankResponse)
async def get_user_rank(
    category: LeaderboardCategory,
    user_id: str,
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
) -> UserRankResponse:
    """
    Get a specific user's rank in a category.
    
    Args:
        category: Leaderboard category
        user_id: User UUID
        
    Returns:
        UserRankResponse with rank and eligibility info
    """
    return await leaderboard_service.get_user_rank(
        user_id=user_id,
        category=category,
    )
