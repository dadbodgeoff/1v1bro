"""
User API endpoints for guest session transfer.
Requirements: 8.1, 8.2
"""

from typing import Optional, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, ProfileServiceDep, BalanceServiceDep
from app.core.responses import APIResponse


router = APIRouter(prefix="/users", tags=["Users"])


# ============================================
# Schemas
# ============================================

class GuestSessionTransferRequest(BaseModel):
    """Request body for guest session transfer."""
    # Accept both camelCase (from frontend) and snake_case
    session_id: Optional[str] = Field(None, alias="sessionId", description="Guest session ID")
    preview_xp: int = Field(0, alias="previewXp", ge=0, description="Preview XP earned during guest session")
    matches_played: int = Field(0, alias="matchesPlayed", ge=0, description="Number of matches played")
    matches_won: int = Field(0, alias="matchesWon", ge=0, description="Number of matches won")
    total_kills: int = Field(0, alias="totalKills", ge=0, description="Total kills during session")
    questions_correct: int = Field(0, alias="questionsCorrect", ge=0, description="Questions answered correctly")
    milestones_achieved: List[str] = Field(default_factory=list, alias="milestonesAchieved", description="Milestone IDs achieved")
    estimated_rewards: Optional[dict] = Field(None, alias="estimatedRewards", description="Frontend-calculated rewards")
    user_id: Optional[str] = Field(None, alias="userId", description="User ID (ignored, uses auth token)")
    
    class Config:
        populate_by_name = True  # Allow both alias and field name


class GuestSessionTransferResponse(BaseModel):
    """Response for guest session transfer."""
    xp_credited: int = Field(..., description="Total XP credited to account")
    coins_credited: int = Field(..., description="Total coins credited to account")
    achievements_unlocked: List[str] = Field(default_factory=list, description="Achievements unlocked")
    welcome_message: str = Field(..., description="Welcome message for the user")
    new_level: int = Field(..., description="User's new level after XP credit")


# ============================================
# Constants
# ============================================

# XP to coins conversion rate (10 XP = 1 coin)
XP_TO_COINS_RATE = 0.1

# Welcome bonus for new accounts with transferred progress
WELCOME_BONUS_XP = 500
WELCOME_BONUS_COINS = 100

# Milestone XP bonuses
MILESTONE_XP_BONUSES = {
    "first-win": 100,
    "triple-kill": 150,
    "quiz-master": 200,
    "veteran": 250,
    "streak-3": 75,
    "streak-5": 125,
}

# Milestone to achievement mapping
MILESTONE_ACHIEVEMENTS = {
    "first-win": "Victory Banner",
    "triple-kill": "Eliminator Title",
    "quiz-master": "Brain Icon",
    "veteran": "Veteran Badge",
}


# ============================================
# Endpoints
# ============================================

@router.post(
    "/transfer-guest-session",
    response_model=APIResponse[GuestSessionTransferResponse],
)
async def transfer_guest_session(
    request: GuestSessionTransferRequest,
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
    balance_service: BalanceServiceDep,
):
    """
    Transfer guest session progress to authenticated account.
    
    Credits XP and coins based on guest session performance.
    Should be called after account creation/login.
    
    Requirements: 8.1, 8.2
    """
    # Calculate milestone XP bonus
    milestone_xp_bonus = sum(
        MILESTONE_XP_BONUSES.get(m, 0) 
        for m in request.milestones_achieved
    )
    
    # Calculate total XP to credit
    total_xp = request.preview_xp + milestone_xp_bonus + WELCOME_BONUS_XP
    
    # Calculate coins to credit
    earned_coins = int(request.preview_xp * XP_TO_COINS_RATE)
    total_coins = earned_coins + WELCOME_BONUS_COINS
    
    # Determine achievements to unlock
    achievements_unlocked = [
        MILESTONE_ACHIEVEMENTS[m]
        for m in request.milestones_achieved
        if m in MILESTONE_ACHIEVEMENTS
    ]
    
    # Credit XP to profile
    try:
        updated_profile = await profile_service.add_xp(current_user.id, total_xp)
        new_level = updated_profile.level if updated_profile else 1
    except Exception as e:
        # Log error but continue - XP credit is best effort
        import logging
        logging.error(f"Failed to credit XP for user {current_user.id}: {e}")
        new_level = 1
    
    # Credit coins to balance
    try:
        transaction_id = f"guest_transfer_{request.session_id}_{current_user.id}"
        await balance_service.credit_coins(
            user_id=current_user.id,
            amount=total_coins,
            transaction_id=transaction_id,
            source="guest_session_transfer",
        )
    except Exception as e:
        # Log error but continue - coin credit is best effort
        import logging
        logging.error(f"Failed to credit coins for user {current_user.id}: {e}")
    
    # Generate welcome message
    if request.matches_won > 0:
        welcome_message = (
            f"Welcome! Your {request.matches_won} win{'s' if request.matches_won > 1 else ''} "
            f"and {total_xp} XP have been credited to your account!"
        )
    elif request.matches_played > 0:
        welcome_message = (
            f"Welcome! Your progress from {request.matches_played} "
            f"match{'es' if request.matches_played > 1 else ''} has been saved. "
            f"You earned {total_xp} XP!"
        )
    else:
        welcome_message = (
            f"Welcome! You've received {WELCOME_BONUS_XP} XP and "
            f"{WELCOME_BONUS_COINS} coins as a welcome bonus!"
        )
    
    return APIResponse.ok(GuestSessionTransferResponse(
        xp_credited=total_xp,
        coins_credited=total_coins,
        achievements_unlocked=achievements_unlocked,
        welcome_message=welcome_message,
        new_level=new_level,
    ))
