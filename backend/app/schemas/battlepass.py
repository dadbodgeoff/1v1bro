"""
Battle Pass schemas for seasonal progression and rewards.
Requirements: 4.1, 4.2, 4.6
"""

from datetime import datetime
from typing import Optional, List, Union
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema
from app.schemas.cosmetic import Cosmetic


# ============================================
# Enums
# ============================================

class XPSource(str, Enum):
    """Sources of XP gain. Requirements: 4.10"""
    MATCH_WIN = "match_win"
    MATCH_LOSS = "match_loss"
    SEASON_CHALLENGE = "season_challenge"
    DAILY_BONUS = "daily_bonus"


class RewardType(str, Enum):
    """Types of battle pass rewards."""
    COSMETIC = "cosmetic"
    COINS = "coins"
    XP = "xp"
    XP_BOOST = "xp_boost"
    TITLE = "title"


# ============================================
# Season Schemas
# ============================================

class Season(BaseSchema):
    """Season definition. Requirements: 4.1"""
    
    id: str = Field(..., description="Season UUID")
    season_number: int = Field(..., description="Season number (1, 2, 3...)")
    name: str = Field(..., description="Season name")
    theme: Optional[str] = Field(None, description="Season theme")
    banner_url: Optional[str] = Field(None, description="Season banner image URL")
    start_date: datetime = Field(..., description="Season start date")
    end_date: datetime = Field(..., description="Season end date")
    is_active: bool = Field(default=False, description="Whether season is currently active")
    xp_per_tier: int = Field(default=400, description="XP required per tier")
    created_at: Optional[datetime] = None


class SeasonCreate(BaseSchema):
    """Schema for creating a new season (admin only)."""
    
    season_number: int = Field(..., ge=1)
    name: str = Field(..., min_length=1, max_length=100)
    theme: Optional[str] = Field(None, max_length=100)
    start_date: datetime
    end_date: datetime
    xp_per_tier: int = Field(default=400, ge=100)


# ============================================
# Reward Schemas
# ============================================

class Reward(BaseSchema):
    """Reward definition for a battle pass tier. Requirements: 4.6"""
    
    type: RewardType = Field(..., description="Type of reward")
    value: Union[str, int] = Field(..., description="Cosmetic ID or amount")
    cosmetic: Optional[Cosmetic] = Field(None, description="Populated if type is cosmetic")
    # Legacy fields for frontend compatibility
    cosmetic_preview_url: Optional[str] = Field(None, description="Direct URL to cosmetic preview image")


class BattlePassTier(BaseSchema):
    """Single tier rewards. Requirements: 4.2, 4.8"""
    
    tier_number: int = Field(..., ge=0, le=100, description="Tier number (0-100)")
    free_reward: Optional[Reward] = Field(None, description="Free track reward")
    premium_reward: Optional[Reward] = Field(None, description="Premium track reward")


class BattlePassTierCreate(BaseSchema):
    """Schema for creating a tier (admin only)."""
    
    season_id: str
    tier_number: int = Field(..., ge=0, le=100)
    free_reward: Optional[dict] = None
    premium_reward: Optional[dict] = None


# ============================================
# Player Progress Schemas
# ============================================

class PlayerBattlePass(BaseSchema):
    """Player's battle pass progress. Requirements: 4.2"""
    
    user_id: str = Field(..., description="User UUID")
    season: Season = Field(..., description="Current season info")
    current_tier: int = Field(default=0, ge=0, le=100, description="Current tier (0-100)")
    current_xp: int = Field(default=0, ge=0, description="XP in current tier")
    xp_to_next_tier: int = Field(..., description="XP needed for next tier")
    total_xp: int = Field(default=0, ge=0, description="Total XP earned this season")
    is_premium: bool = Field(default=False, description="Has premium pass")
    claimed_rewards: List[int] = Field(default_factory=list, description="Claimed tier numbers")
    claimable_rewards: List[int] = Field(default_factory=list, description="Tiers with unclaimed rewards")
    last_updated: Optional[datetime] = None


class PlayerBattlePassSimple(BaseSchema):
    """Simplified player progress (database row)."""
    
    id: str
    user_id: str
    season_id: str
    current_tier: int = 0
    current_xp: int = 0
    is_premium: bool = False
    claimed_rewards: List[int] = Field(default_factory=list)
    purchased_tiers: int = 0
    last_updated: Optional[datetime] = None


# ============================================
# XP Award Schemas
# ============================================

class XPAwardRequest(BaseSchema):
    """Request to award XP to a player."""
    
    amount: int = Field(..., ge=1, description="XP amount to award")
    source: XPSource = Field(..., description="Source of XP")
    match_id: Optional[str] = Field(None, description="Associated match ID")
    challenge_id: Optional[str] = Field(None, description="Associated challenge ID")


class XPAwardResult(BaseSchema):
    """Result of XP award. Requirements: 4.5"""
    
    xp_awarded: int = Field(..., description="Actual XP awarded")
    new_total_xp: int = Field(..., description="New total XP for season")
    previous_tier: int = Field(..., description="Tier before award")
    new_tier: int = Field(..., description="Tier after award")
    tier_advanced: bool = Field(..., description="Whether tier increased")
    tiers_gained: int = Field(default=0, description="Number of tiers gained")
    new_claimable_rewards: List[int] = Field(default_factory=list, description="New claimable tier numbers")


class MatchXPCalculation(BaseSchema):
    """XP calculation from a match. Requirements: 4.3, 4.4"""
    
    base_xp: int = Field(..., description="Base XP (win=100, loss=50)")
    kill_bonus: int = Field(default=0, description="+5 per kill")
    streak_bonus: int = Field(default=0, description="+10 per streak count")
    duration_bonus: int = Field(default=0, description="+0.1 per second")
    total_xp: int = Field(..., description="Total XP (clamped 50-300)")
    was_clamped: bool = Field(default=False, description="Whether XP was clamped")


# ============================================
# Claim Reward Schemas
# ============================================

class ClaimRewardRequest(BaseSchema):
    """Request to claim a tier reward."""
    
    tier: int = Field(..., ge=0, le=100, description="Tier number to claim")


class ClaimResult(BaseSchema):
    """Result of claiming a reward. Requirements: 4.6, 4.7"""
    
    success: bool = True
    tier: int = Field(..., description="Tier that was claimed")
    reward: Reward = Field(..., description="The reward received")
    is_premium_reward: bool = Field(default=False, description="Whether premium reward was claimed")
    inventory_item_id: Optional[str] = Field(None, description="ID if cosmetic was added to inventory")


# ============================================
# Premium Purchase Schemas
# ============================================

class PurchasePremiumRequest(BaseSchema):
    """Request to purchase premium battle pass."""
    
    season_id: Optional[str] = Field(None, description="Season ID (defaults to current)")


class PurchasePremiumResult(BaseSchema):
    """Result of premium purchase. Requirements: 4.9"""
    
    success: bool = True
    is_premium: bool = True
    unlocked_rewards: List[int] = Field(default_factory=list, description="Tiers with newly unlocked premium rewards")
    player_progress: Optional[PlayerBattlePass] = None


# ============================================
# XP Log Schema
# ============================================

class XPLogEntry(BaseSchema):
    """XP log entry for analytics. Requirements: 4.10"""
    
    id: str
    user_id: str
    source: XPSource
    amount: int
    match_id: Optional[str] = None
    challenge_id: Optional[str] = None
    created_at: datetime


# ============================================
# Response Schemas
# ============================================

class SeasonResponse(BaseSchema):
    """Response with season info and tiers."""
    
    season: Season
    tiers: List[BattlePassTier] = Field(default_factory=list)
    total_tiers: int = Field(default=100)


class BattlePassProgressResponse(BaseSchema):
    """Full battle pass progress response."""
    
    progress: PlayerBattlePass
    tiers: List[BattlePassTier] = Field(default_factory=list)
    recent_xp_gains: List[XPLogEntry] = Field(default_factory=list)
