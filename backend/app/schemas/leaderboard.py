"""
Leaderboard schemas.
Defines data models for leaderboard queries and responses.
Requirements: 5.5, 5.6, 5.8
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import Field

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
    ELO = "elo"  # New ELO-based category


class RankTier(str, Enum):
    """
    Rank tiers based on ELO rating.
    Requirements: 5.5
    """
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"
    DIAMOND = "Diamond"
    MASTER = "Master"
    GRANDMASTER = "Grandmaster"


# ============================================
# Legacy Leaderboard Schemas
# ============================================

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


# ============================================
# ELO Rating Schemas (Requirements: 5.5, 5.6, 5.8)
# ============================================

class PlayerRating(BaseSchema):
    """
    Player's ELO rating.
    Requirements: 5.5, 5.6
    """
    user_id: str = Field(..., description="User UUID")
    display_name: Optional[str] = Field(None, description="Player display name")
    avatar_url: Optional[str] = Field(None, description="Player avatar URL")
    current_elo: int = Field(default=1200, description="Current ELO rating")
    peak_elo: int = Field(default=1200, description="Highest ELO achieved")
    current_tier: RankTier = Field(default=RankTier.GOLD, description="Current rank tier")
    tier_rank: Optional[int] = Field(None, description="Rank within tier")
    win_rate: float = Field(default=0.0, description="Win rate percentage")
    games_played: int = Field(default=0, description="Total ranked games played")
    last_match_date: Optional[datetime] = Field(None, description="Last match timestamp")


class ELOLeaderboardEntry(BaseSchema):
    """
    Single entry in ELO leaderboard.
    Requirements: 5.6
    """
    rank: int = Field(..., description="Global rank position")
    user_id: str = Field(..., description="User UUID")
    display_name: Optional[str] = Field(None, description="Player display name")
    avatar_url: Optional[str] = Field(None, description="Player avatar URL")
    elo: int = Field(..., description="Current ELO rating")
    tier: RankTier = Field(..., description="Rank tier")
    win_rate: float = Field(default=0.0, description="Win rate percentage")
    games_played: int = Field(default=0, description="Total games played")


class ELOLeaderboardResponse(BaseSchema):
    """
    ELO leaderboard API response.
    Requirements: 5.6
    """
    entries: List[ELOLeaderboardEntry] = Field(default_factory=list)
    total_players: int = Field(default=0, description="Total ranked players")
    page: int = Field(default=1)
    page_size: int = Field(default=100)
    region: Optional[str] = Field(None, description="Region filter if applied")


class UserELORankResponse(BaseSchema):
    """
    User's ELO rank with nearby players.
    Requirements: 5.8
    """
    rank: int = Field(..., description="User's global rank")
    total_players: int = Field(..., description="Total ranked players")
    rating: PlayerRating = Field(..., description="User's full rating info")
    nearby_players: List[ELOLeaderboardEntry] = Field(
        default_factory=list, 
        description="Players ±5 positions"
    )


# ============================================
# Match Result Schemas (for ELO calculation)
# ============================================

class MatchResult(BaseSchema):
    """
    Match result for ELO calculation.
    Requirements: 5.3
    """
    match_id: str = Field(..., description="Match UUID")
    player1_id: str = Field(..., description="Player 1 UUID")
    player2_id: str = Field(..., description="Player 2 UUID")
    winner_id: Optional[str] = Field(None, description="Winner UUID (None for draw)")
    duration_seconds: Optional[int] = Field(None, description="Match duration")
    player1_pre_elo: int = Field(..., description="Player 1 ELO before match")
    player2_pre_elo: int = Field(..., description="Player 2 ELO before match")
    player1_post_elo: int = Field(..., description="Player 1 ELO after match")
    player2_post_elo: int = Field(..., description="Player 2 ELO after match")
    elo_delta_p1: int = Field(..., description="ELO change for player 1")
    elo_delta_p2: int = Field(..., description="ELO change for player 2")
    played_at: datetime = Field(default_factory=datetime.utcnow)


class ELOCalculationResult(BaseSchema):
    """Result of ELO calculation for a match."""
    player1_new_elo: int
    player2_new_elo: int
    player1_delta: int
    player2_delta: int
    player1_new_tier: RankTier
    player2_new_tier: RankTier


# ============================================
# Seasonal Leaderboard Schemas
# ============================================

class SeasonalLeaderboardEntry(BaseSchema):
    """Entry in a seasonal leaderboard."""
    rank: int
    user_id: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    season_elo: int
    peak_season_elo: int
    tier: RankTier
    games_played: int
    win_rate: float


class SeasonalLeaderboardResponse(BaseSchema):
    """Seasonal leaderboard response."""
    season_id: str
    season_number: int
    season_name: str
    entries: List[SeasonalLeaderboardEntry] = Field(default_factory=list)
    total_players: int = 0
    is_active: bool = True
