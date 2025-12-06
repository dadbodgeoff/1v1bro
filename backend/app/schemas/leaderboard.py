"""
Leaderboard schemas.
Defines data models for leaderboard queries and responses.
"""

from enum import Enum
from typing import List, Optional

from app.schemas.base import BaseSchema


class LeaderboardCategory(str, Enum):
    """Available leaderboard categories."""
    WINS = "wins"
    WIN_RATE = "win_rate"
    TOTAL_SCORE = "total_score"
    KILLS = "kills"
    KD_RATIO = "kd_ratio"
    ACCURACY = "accuracy"
    FASTEST_THINKER = "fastest_thinker"
    ANSWER_RATE = "answer_rate"
    WIN_STREAK = "win_streak"


class LeaderboardEntry(BaseSchema):
    """Single entry in a leaderboard."""
    rank: int
    user_id: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    stat_value: float
    secondary_stat: Optional[float] = None
    secondary_label: Optional[str] = None


class LeaderboardResponse(BaseSchema):
    """Leaderboard API response."""
    category: LeaderboardCategory
    entries: List[LeaderboardEntry]
    total_eligible: int
    page: int
    page_size: int
    minimum_requirement: Optional[str] = None


class UserRankResponse(BaseSchema):
    """User's rank in a specific category."""
    category: LeaderboardCategory
    rank: Optional[int] = None  # None if not eligible
    stat_value: float
    eligible: bool
    requirement_met: bool
    requirement: Optional[str] = None


class LeaderboardQueryParams(BaseSchema):
    """Query parameters for leaderboard requests."""
    limit: int = 10
    offset: int = 0
