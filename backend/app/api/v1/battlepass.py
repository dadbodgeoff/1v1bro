"""
Battle Pass API endpoints.
Requirements: 4.1-4.9, 5.5 (coin balance integration)
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, status, Query

from app.api.deps import CurrentUser, BattlePassServiceDep, BalanceServiceDep
from app.core.responses import APIResponse
from app.schemas.battlepass import (
    Season,
    BattlePassTier,
    PlayerBattlePass,
    XPAwardResult,
    ClaimResult,
    ClaimRewardRequest,
    SeasonResponse,
    BattlePassProgressResponse,
    XPLogEntry,
)
from app.schemas.coin import InsufficientFundsError

# Premium battle pass price in coins
PREMIUM_BATTLEPASS_PRICE = 650


router = APIRouter(prefix="/battlepass", tags=["Battle Pass"])


# ============================================
# Public Season Endpoints (no auth required)
# ============================================

@router.get(
    "/public/current",
    response_model=APIResponse[Season],
)
async def get_current_season_public(
    battlepass_service: BattlePassServiceDep,
):
    """
    Get the currently active season (public endpoint).
    
    Returns season info including name, theme, dates, and XP per tier.
    No authentication required.
    """
    season = await battlepass_service.get_current_season()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active season",
        )
    
    return APIResponse.ok(season)


@router.get(
    "/public/season/{season_id}",
    response_model=APIResponse[SeasonResponse],
)
async def get_season_with_tiers_public(
    season_id: str,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get season info with all tier rewards (public endpoint).
    
    Returns the season details and all 100 tiers with their rewards.
    No authentication required.
    """
    response = await battlepass_service.get_season_with_tiers(season_id)
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Season not found",
        )
    
    return APIResponse.ok(response)


@router.get(
    "/public/tiers/{season_id}",
    response_model=APIResponse[list[BattlePassTier]],
)
async def get_tier_rewards_public(
    season_id: str,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get all tier rewards for a season (public endpoint).
    
    Returns list of tiers with free and premium rewards.
    No authentication required.
    """
    tiers = await battlepass_service.get_tier_rewards(season_id)
    return APIResponse.ok(tiers)


# ============================================
# Authenticated Season Endpoints
# ============================================

@router.get(
    "/current",
    response_model=APIResponse[Season],
)
async def get_current_season(
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get the currently active season.
    
    Returns season info including name, theme, dates, and XP per tier.
    """
    season = await battlepass_service.get_current_season()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active season",
        )
    
    return APIResponse.ok(season)


@router.get(
    "/season/{season_id}",
    response_model=APIResponse[SeasonResponse],
)
async def get_season_with_tiers(
    season_id: str,
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get season info with all tier rewards.
    
    Returns the season details and all 100 tiers with their rewards.
    """
    response = await battlepass_service.get_season_with_tiers(season_id)
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Season not found",
        )
    
    return APIResponse.ok(response)


@router.get(
    "/tiers/{season_id}",
    response_model=APIResponse[list[BattlePassTier]],
)
async def get_tier_rewards(
    season_id: str,
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get all tier rewards for a season.
    
    Returns list of tiers with free and premium rewards.
    """
    tiers = await battlepass_service.get_tier_rewards(season_id)
    return APIResponse.ok(tiers)


# ============================================
# Player Progress Endpoints
# ============================================

@router.get(
    "/me",
    response_model=APIResponse[PlayerBattlePass],
)
async def get_my_progress(
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get the current user's battle pass progress.
    
    Returns current tier, XP, premium status, and claimable rewards.
    """
    progress = await battlepass_service.get_player_progress(current_user.id)
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active season or progress not found",
        )
    
    return APIResponse.ok(progress)


@router.get(
    "/me/xp-progress",
    response_model=APIResponse[PlayerBattlePass],
)
async def get_xp_progress(
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Get detailed XP progress for the current season.
    
    Alias for /me endpoint, returns same data.
    """
    progress = await battlepass_service.get_player_progress(current_user.id)
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active season",
        )
    
    return APIResponse.ok(progress)


# ============================================
# Reward Claiming Endpoints
# ============================================

@router.post(
    "/me/claim-reward",
    response_model=APIResponse[ClaimResult],
)
async def claim_reward(
    request: ClaimRewardRequest,
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Claim a reward for a completed tier.
    
    The tier must be reached and not already claimed.
    Premium rewards require premium pass.
    """
    result = await battlepass_service.claim_reward(
        user_id=current_user.id,
        tier=request.tier,
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot claim reward: tier not reached, already claimed, or no active season",
        )
    
    return APIResponse.ok(result)


@router.post(
    "/me/claim-reward/{tier}",
    response_model=APIResponse[ClaimResult],
)
async def claim_reward_by_tier(
    tier: int,
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
):
    """
    Claim a reward for a specific tier (path parameter version).
    
    Alternative to POST /me/claim-reward with body.
    """
    if tier < 0 or tier > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier must be between 0 and 100",
        )
    
    result = await battlepass_service.claim_reward(
        user_id=current_user.id,
        tier=tier,
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot claim reward: tier not reached, already claimed, or no active season",
        )
    
    return APIResponse.ok(result)


# ============================================
# Premium Purchase Endpoints
# ============================================

@router.post(
    "/me/purchase-premium",
    response_model=APIResponse[PlayerBattlePass],
)
async def purchase_premium(
    current_user: CurrentUser,
    battlepass_service: BattlePassServiceDep,
    balance_service: BalanceServiceDep,
):
    """
    Upgrade to premium battle pass.
    
    Costs 950 coins. Checks balance and debits before upgrading.
    Unlocks premium rewards for all reached tiers.
    
    Requirements: 4.9, 5.5
    """
    # Check if already premium
    current_progress = await battlepass_service.get_player_progress(current_user.id)
    if current_progress and current_progress.is_premium:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already have premium battle pass",
        )
    
    # Check and debit balance (Requirements: 5.5)
    try:
        await balance_service.debit_coins(
            user_id=current_user.id,
            amount=PREMIUM_BATTLEPASS_PRICE,
            source="battlepass",
        )
    except InsufficientFundsError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Insufficient coin balance",
                "current_balance": e.current_balance,
                "required": e.required,
                "shortfall": e.required - e.current_balance,
            },
        )
    
    # Upgrade to premium
    progress = await battlepass_service.purchase_premium(current_user.id)
    
    if not progress:
        # Refund if upgrade failed
        await balance_service.credit_coins(
            user_id=current_user.id,
            amount=PREMIUM_BATTLEPASS_PRICE,
            transaction_id=f"refund_premium_{current_user.id}",
            source="refund",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active season",
        )
    
    return APIResponse.ok(progress)
