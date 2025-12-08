"""
Leaderboards API endpoints.
Provides leaderboard queries, user rank lookups, and ELO rankings.
Requirements: 5.6, 5.7, 5.8, 5.10
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import get_current_user
from app.database.supabase_client import get_supabase_service_client
from app.core.responses import APIResponse
from app.schemas.leaderboard import (
    LeaderboardCategory, LeaderboardResponse, UserRankResponse,
    ELOLeaderboardResponse, UserELORankResponse,
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


# ============================================
# ELO Leaderboard Endpoints (Requirements: 5.6, 5.7, 5.8, 5.10)
# ============================================

@router.get(
    "/elo/global",
    response_model=APIResponse[ELOLeaderboardResponse],
)
async def get_global_elo_leaderboard(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
):
    """
    Get global ELO leaderboard sorted by rating.
    
    Requirements: 5.6 - Return top 100 players sorted by ELO descending.
    
    Args:
        limit: Max entries (1-100, default 100)
        offset: Pagination offset
        
    Returns:
        ELOLeaderboardResponse with ranked players
    """
    response = await leaderboard_service.get_global_leaderboard(
        limit=limit,
        offset=offset,
    )
    return APIResponse.ok(response)


@router.get(
    "/elo/regional/{region}",
    response_model=APIResponse[ELOLeaderboardResponse],
)
async def get_regional_elo_leaderboard(
    region: str,
    limit: int = Query(default=100, ge=1, le=100),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
):
    """
    Get regional ELO leaderboard filtered by country.
    
    Requirements: 5.7 - Filter by player country and return top 100.
    
    Args:
        region: 2-letter country code (e.g., US, GB, DE)
        limit: Max entries (1-100)
        
    Returns:
        ELOLeaderboardResponse with regional rankings
    """
    if len(region) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Region must be a 2-letter country code",
        )
    
    response = await leaderboard_service.get_regional_leaderboard(
        region=region.upper(),
        limit=limit,
    )
    return APIResponse.ok(response)


@router.get(
    "/elo/me",
    response_model=APIResponse[UserELORankResponse],
)
async def get_my_elo_rank(
    current_user: dict = Depends(get_current_user),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
):
    """
    Get current user's ELO rank with nearby players.
    
    Requirements: 5.8 - Return rank position, ELO, tier, and nearby players (±5).
    
    Returns:
        UserELORankResponse with rank, rating, and nearby players.
        Returns 404 if user has no ELO rating yet (hasn't played ranked).
    """
    try:
        response = await leaderboard_service.get_user_elo_rank(current_user["id"])
    except Exception:
        # Database query failed - user likely has no rating yet
        response = None
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ELO rating found. Play a ranked match to get rated.",
        )
    
    return APIResponse.ok(response)


@router.get(
    "/elo/user/{user_id}",
    response_model=APIResponse[UserELORankResponse],
)
async def get_user_elo_rank(
    user_id: str,
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
):
    """
    Get a specific user's ELO rank with nearby players.
    
    Args:
        user_id: User UUID
        
    Returns:
        UserELORankResponse with rank, rating, and nearby players
    """
    response = await leaderboard_service.get_user_elo_rank(user_id)
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or has no ELO rating",
        )
    
    return APIResponse.ok(response)
