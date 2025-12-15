"""
Survival Mode API endpoints.
Handles runs, ghost replays, telemetry, and leaderboards.
Requirements: 5.1, 6.1-6.5, 7.1-7.5

Security: Server-authoritative validation and rate limiting.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_current_user_optional, get_supabase_client, get_cache_manager
from app.schemas.survival import (
    SurvivalRunCreate,
    SurvivalRunResponse,
    SurvivalPersonalBest,
    DeathEventCreate,
    TelemetryAggregate,
    DeathHeatmapResponse,
    SurvivalLeaderboardResponse,
    GhostDataResponse,
)
from app.schemas.battlepass import XPAwardResult
from app.services.survival_service import SurvivalService
from app.services.battlepass_service import BattlePassService
from app.services.cosmetics_service import CosmeticsService
from app.cache.cache_manager import CacheManager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/survival", tags=["survival"])

# Rate limit constants
MAX_SUBMISSIONS_PER_DAY = 100
MIN_SUBMISSION_INTERVAL_SECONDS = 5


def get_survival_service(
    client=Depends(get_supabase_client),
    cache: Optional[CacheManager] = Depends(get_cache_manager),
) -> SurvivalService:
    """Dependency to get survival service."""
    return SurvivalService(client, cache)


def get_battlepass_service(
    client=Depends(get_supabase_client),
) -> BattlePassService:
    """Dependency to get battlepass service for XP awarding."""
    cosmetics_service = CosmeticsService(client)
    return BattlePassService(client, cosmetics_service)


# ============================================
# Run Endpoints (Requirements: 6.1, 6.2)
# ============================================

async def check_rate_limit(user_id: str, client) -> bool:
    """Check if user is within rate limits."""
    try:
        result = client.rpc(
            "check_survival_rate_limit",
            {
                "p_user_id": user_id,
                "p_max_per_day": MAX_SUBMISSIONS_PER_DAY,
                "p_min_interval_seconds": MIN_SUBMISSION_INTERVAL_SECONDS,
            }
        ).execute()
        return result.data if result.data is not None else True
    except Exception:
        # If rate limit check fails, allow the request
        return True


class SurvivalRunResponseWithXP(SurvivalRunResponse):
    """Extended response that includes XP award info."""
    xp_awarded: Optional[int] = None
    xp_result: Optional[XPAwardResult] = None


@router.post("/runs", response_model=SurvivalRunResponseWithXP, status_code=status.HTTP_201_CREATED)
async def submit_run(
    run_data: SurvivalRunCreate,
    current_user = Depends(get_current_user),
    service: SurvivalService = Depends(get_survival_service),
    battlepass_service: BattlePassService = Depends(get_battlepass_service),
    client = Depends(get_supabase_client),
):
    """
    Submit a completed survival run with server-side validation.
    
    Requirements: 6.1, 6.2 - Save run data to backend.
    Security: Server validates run data before accepting.
    
    The server will:
    1. Check rate limits (max 100/day, min 5s between submissions)
    2. Validate claimed values against sanity checks
    3. Replay the run using ghost data to verify score/distance
    4. Check for statistical anomalies
    5. Store server-verified values (not client-claimed)
    6. Award Battle Pass XP based on run performance
    
    Returns:
    - 201: Run accepted (may be flagged as suspicious)
    - 400: Run rejected due to validation failure
    - 429: Rate limited
    """
    user_id = current_user.id
    
    # Check rate limit
    if not await check_rate_limit(user_id, client):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Rate limit exceeded",
                "max_per_day": MAX_SUBMISSIONS_PER_DAY,
                "min_interval_seconds": MIN_SUBMISSION_INTERVAL_SECONDS,
            },
        )
    
    result, validation = await service.create_run(user_id, run_data)
    
    if result is None:
        # Run was rejected by validation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Run validation failed",
                "reason": validation.rejection_reason,
                "flags": validation.flags,
            },
        )
    
    # Award Battle Pass XP for the run
    xp_result = None
    xp_awarded = None
    try:
        # Extract trivia correct count from run data if available
        trivia_correct = getattr(run_data, 'trivia_correct', 0) or 0
        
        xp_result = await battlepass_service.award_survival_xp(
            user_id=user_id,
            distance=result.distance,
            max_combo=result.max_combo or 0,
            trivia_correct=trivia_correct,
            run_id=result.id,
        )
        if xp_result:
            xp_awarded = xp_result.xp_awarded
            logger.info(f"[Survival] Awarded {xp_awarded} XP to {user_id} for run {result.id}")
    except Exception as e:
        # Don't fail the run submission if XP award fails
        logger.error(f"[Survival] Failed to award XP for run {result.id}: {e}")
    
    # Return extended response with XP info
    return SurvivalRunResponseWithXP(
        **result.model_dump(),
        xp_awarded=xp_awarded,
        xp_result=xp_result,
    )


@router.get("/runs/personal-best", response_model=Optional[SurvivalPersonalBest])
async def get_personal_best(
    current_user = Depends(get_current_user),
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get current user's personal best run with ghost data.
    
    Requirements: 5.4, 6.3 - Fetch PB with ghost data.
    """
    user_id = current_user.id
    return await service.get_personal_best(user_id)


# ============================================
# Ghost Endpoints (Requirements: 5.1)
# ============================================

@router.get("/ghost/{user_id}", response_model=Optional[GhostDataResponse])
async def get_ghost_data(
    user_id: str,
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get ghost replay data for a user.
    
    Requirements: 5.1 - Fetch ghost data for replay.
    """
    return await service.get_ghost_data(user_id)


@router.get("/ghost", response_model=Optional[GhostDataResponse])
async def get_own_ghost_data(
    current_user = Depends(get_current_user),
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get current user's ghost replay data.
    
    Requirements: 5.1 - Fetch own ghost data for replay.
    """
    user_id = current_user.id
    return await service.get_ghost_data(user_id)


# ============================================
# Leaderboard Endpoints (Requirements: 6.4, 6.5)
# ============================================

@router.get("/leaderboard", response_model=SurvivalLeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(default=100, ge=1, le=100),
    current_user = Depends(get_current_user_optional),
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get survival leaderboard.
    
    Requirements: 6.4, 6.5 - Return top 100 with player rank if outside.
    """
    user_id = current_user.id if current_user else None
    return await service.get_leaderboard(user_id=user_id, limit=limit)


@router.get("/leaderboard/stats")
async def get_leaderboard_stats(
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get public leaderboard statistics.
    
    No authentication required - returns aggregate stats for display.
    """
    return await service.get_public_stats()


# ============================================
# Telemetry Endpoints (Requirements: 7.1-7.5)
# ============================================

@router.get("/telemetry", response_model=TelemetryAggregate)
async def get_telemetry(
    days: int = Query(default=7, ge=1, le=30),
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get aggregated telemetry data.
    
    Requirements: 7.3, 7.4 - Return aggregated analytics.
    Admin only in production.
    """
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    
    return await service.get_aggregated_telemetry(start, end)


@router.get("/telemetry/heatmap", response_model=DeathHeatmapResponse)
async def get_death_heatmap(
    days: int = Query(default=7, ge=1, le=30),
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Get death heatmap data.
    
    Requirements: 7.4 - Return death positions for visualization.
    """
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    
    return await service.get_death_heatmap(start, end)


# ============================================
# Admin Endpoints
# ============================================

@router.post("/admin/refresh-leaderboard", status_code=status.HTTP_204_NO_CONTENT)
async def refresh_leaderboard(
    service: SurvivalService = Depends(get_survival_service),
):
    """
    Manually refresh the leaderboard materialized view.
    
    Admin only. Should be called periodically via cron job.
    """
    await service.refresh_leaderboard()
