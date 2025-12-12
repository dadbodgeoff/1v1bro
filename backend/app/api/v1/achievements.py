"""
Achievement API endpoints.
Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
"""

from typing import Optional, List
from dataclasses import asdict

from fastapi import APIRouter, HTTPException, status, Query

from app.api.deps import CurrentUser, AchievementServiceDep
from app.core.responses import APIResponse


router = APIRouter(prefix="/achievements", tags=["Achievements"])


# ============================================
# Public Endpoints
# ============================================

@router.get(
    "",
    response_model=APIResponse[List[dict]],
)
async def get_all_achievements(
    achievement_service: AchievementServiceDep,
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=500, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get all achievement definitions.
    
    Requirements: 7.1, 7.5
    
    Returns list of all active achievements with optional category filter
    and pagination support.
    """
    achievements = await achievement_service.get_all_achievements(
        category=category,
        limit=limit,
        offset=offset,
    )
    
    return APIResponse.ok(achievements)


@router.get(
    "/categories",
    response_model=APIResponse[List[str]],
)
async def get_achievement_categories(
    achievement_service: AchievementServiceDep,
):
    """
    Get list of all achievement categories.
    
    Returns distinct category names.
    """
    achievements = await achievement_service.get_all_achievements(limit=500)
    categories = list(set(a["category"] for a in achievements))
    categories.sort()
    
    return APIResponse.ok(categories)


# ============================================
# Authenticated Endpoints
# ============================================

@router.get(
    "/me",
    response_model=APIResponse[List[dict]],
)
async def get_my_achievements(
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
    limit: int = Query(100, ge=1, le=500, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get current user's earned achievements.
    
    Requirements: 7.2, 7.5
    
    Returns list of achievements earned by the authenticated user
    with full achievement details and earned timestamps.
    """
    achievements = await achievement_service.get_user_achievements(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    
    return APIResponse.ok(achievements)


@router.get(
    "/progress",
    response_model=APIResponse[List[dict]],
)
async def get_achievement_progress(
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
):
    """
    Get progress toward all achievements.
    
    Requirements: 7.3
    
    Returns progress for all achievements including:
    - current_value: User's current stat value
    - target_value: Required value to unlock
    - percentage: Progress percentage (0-100)
    - is_unlocked: Whether already earned
    """
    progress_list = await achievement_service.get_achievement_progress(
        user_id=current_user.id
    )
    
    # Convert dataclasses to dicts
    progress_dicts = [asdict(p) for p in progress_list]
    
    return APIResponse.ok(progress_dicts)


@router.get(
    "/stats",
    response_model=APIResponse[dict],
)
async def get_achievement_stats(
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
):
    """
    Get achievement statistics for profile display.
    
    Requirements: 10.1, 10.2, 10.3, 10.4
    
    Returns:
    - total_earned: Number of achievements earned
    - total_possible: Total achievements available
    - completion_percentage: Percentage complete
    - by_rarity: Breakdown by rarity tier
    - recent_achievements: Last 3 earned
    - total_coins_earned: Total coins from achievements
    """
    stats = await achievement_service.get_achievement_stats(
        user_id=current_user.id
    )
    
    return APIResponse.ok(asdict(stats))


@router.post(
    "/check",
    response_model=APIResponse[List[dict]],
)
async def check_achievements(
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
):
    """
    Manually trigger achievement evaluation.
    
    Requirements: 7.4
    
    Checks all achievements against current user stats and awards
    any newly qualified achievements. Returns list of newly unlocked
    achievements.
    
    Note: Achievements are also automatically checked after each match.
    This endpoint allows manual checking for non-match stat changes
    (e.g., adding friends).
    """
    unlocks = await achievement_service.check_and_award_achievements(
        user_id=current_user.id
    )
    
    # Convert dataclasses to dicts
    unlock_dicts = [asdict(u) for u in unlocks]
    
    return APIResponse.ok(unlock_dicts)


# ============================================
# User Profile Achievements (for viewing other users)
# ============================================

@router.get(
    "/user/{user_id}",
    response_model=APIResponse[List[dict]],
)
async def get_user_achievements(
    user_id: str,
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
    limit: int = Query(100, ge=1, le=500, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get achievements for a specific user.
    
    Used for viewing other players' achievements on their profile.
    """
    achievements = await achievement_service.get_user_achievements(
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    
    return APIResponse.ok(achievements)


@router.get(
    "/user/{user_id}/stats",
    response_model=APIResponse[dict],
)
async def get_user_achievement_stats(
    user_id: str,
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
):
    """
    Get achievement statistics for a specific user.
    
    Used for displaying achievement stats on other players' profiles.
    """
    stats = await achievement_service.get_achievement_stats(
        user_id=user_id
    )
    
    return APIResponse.ok(asdict(stats))
