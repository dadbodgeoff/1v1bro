"""
Achievement schemas for profile achievements display.
Requirements: Profile Enterprise - Achievements Section
"""

from datetime import datetime
from typing import List, Optional
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class AchievementRarity(str, Enum):
    """Achievement rarity levels."""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class Achievement(BaseSchema):
    """Achievement definition."""
    
    id: str = Field(..., description="Achievement ID")
    name: str = Field(..., description="Achievement name")
    description: str = Field(..., description="Achievement description")
    icon_url: Optional[str] = Field(None, description="Achievement icon URL")
    rarity: AchievementRarity = Field(default=AchievementRarity.COMMON, description="Achievement rarity")
    category: str = Field(default="general", description="Achievement category")


class UserAchievement(BaseSchema):
    """User's earned achievement with earned date."""
    
    id: str = Field(..., description="Achievement ID")
    name: str = Field(..., description="Achievement name")
    description: str = Field(..., description="Achievement description")
    icon_url: Optional[str] = Field(None, description="Achievement icon URL")
    rarity: AchievementRarity = Field(default=AchievementRarity.COMMON, description="Achievement rarity")
    earned_at: datetime = Field(..., description="When the achievement was earned")


class AchievementsResponse(BaseSchema):
    """Response containing user's achievements."""
    
    achievements: List[UserAchievement] = Field(default_factory=list, description="List of earned achievements")
    total: int = Field(default=0, description="Total number of achievements earned")


class AwardedAchievement(BaseSchema):
    """Achievement that was just awarded."""
    
    id: str = Field(..., description="Achievement ID")
    name: str = Field(..., description="Achievement name")
    description: str = Field(..., description="Achievement description")
    icon_url: Optional[str] = Field(None, description="Achievement icon URL")
    rarity: str = Field(default="common", description="Achievement rarity")


class AchievementCheckResponse(BaseSchema):
    """Response from achievement check endpoint."""
    
    newly_awarded: List[AwardedAchievement] = Field(default_factory=list, description="List of newly awarded achievements")
    count: int = Field(default=0, description="Number of achievements awarded")
