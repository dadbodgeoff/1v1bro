"""
Survival Mode schemas.
Defines data models for survival runs, ghost replays, telemetry, and leaderboards.
Requirements: 1.1-8.4
"""

from datetime import datetime
from typing import List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema


# ============================================
# Run Schemas
# ============================================

class SurvivalRunCreate(BaseSchema):
    """
    Data for creating a new survival run.
    Requirements: 6.2
    """
    # Core metrics
    distance: int = Field(..., ge=0, description="Total distance traveled in meters")
    score: int = Field(..., ge=0, description="Total score accumulated")
    duration_seconds: int = Field(..., ge=0, description="Run duration in seconds")
    max_speed: float = Field(..., ge=0, description="Maximum speed achieved")
    
    # Combo/performance stats
    max_combo: int = Field(default=0, ge=0, description="Highest combo achieved")
    total_near_misses: int = Field(default=0, ge=0, description="Total near-miss events")
    perfect_dodges: int = Field(default=0, ge=0, description="Total perfect dodge events")
    obstacles_cleared: int = Field(default=0, ge=0, description="Total obstacles cleared")
    
    # Death info
    death_obstacle_type: Optional[str] = Field(None, description="Type of obstacle that killed player")
    death_position_x: Optional[float] = Field(None, description="X position at death")
    death_position_z: Optional[float] = Field(None, description="Z position at death")
    death_distance: Optional[int] = Field(None, description="Distance at death")
    
    # Run configuration
    seed: Optional[int] = Field(None, description="Random seed for obstacle generation")
    difficulty_tier: str = Field(default="rookie", description="Difficulty tier")
    
    # Ghost data
    ghost_data: Optional[str] = Field(None, description="Compressed input recording JSON")


class RunValidationStatus(BaseSchema):
    """
    Server-side validation result for a run.
    """
    status: str = Field(..., description="valid, suspicious, or rejected")
    flags: List[str] = Field(default_factory=list, description="Validation flags")
    confidence: float = Field(default=1.0, ge=0, le=1, description="Validation confidence")
    server_distance: Optional[int] = Field(None, description="Server-verified distance")
    server_score: Optional[int] = Field(None, description="Server-verified score")


class SurvivalRunResponse(BaseSchema):
    """
    Response for a survival run.
    Requirements: 6.2
    """
    id: str = Field(..., description="Run UUID")
    user_id: str = Field(..., description="User UUID")
    
    # Core metrics (server-verified values)
    distance: int
    score: int
    duration_seconds: int
    max_speed: float
    
    # Combo stats
    max_combo: int
    total_near_misses: int
    perfect_dodges: int
    obstacles_cleared: int
    
    # Death info
    death_obstacle_type: Optional[str] = None
    death_position_x: Optional[float] = None
    death_position_z: Optional[float] = None
    death_distance: Optional[int] = None
    
    # Configuration
    seed: Optional[int] = None
    difficulty_tier: str = "rookie"
    has_ghost: bool = False
    
    # Validation (server-authoritative)
    validation_status: Optional[str] = Field(None, description="valid, suspicious, or rejected")
    validation_confidence: Optional[float] = Field(None, description="Server confidence in run validity")
    
    # Timestamps
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime


# ============================================
# Personal Best Schemas
# ============================================

class SurvivalPersonalBest(BaseSchema):
    """
    User's personal best run with ghost data.
    Requirements: 5.4, 6.3
    """
    user_id: str = Field(..., description="User UUID")
    run_id: str = Field(..., description="Best run UUID")
    
    best_distance: int = Field(..., description="Best distance achieved")
    best_score: int = Field(..., description="Best score achieved")
    best_combo: int = Field(..., description="Best combo achieved")
    
    ghost_data: Optional[str] = Field(None, description="Ghost replay data")
    
    achieved_at: datetime = Field(..., description="When PB was achieved")


# ============================================
# Death Event Schemas
# ============================================

class DeathEventCreate(BaseSchema):
    """
    Data for recording a death event.
    Requirements: 7.1
    """
    obstacle_type: str = Field(..., description="Type of obstacle that killed player")
    position_x: float = Field(..., description="X position at death")
    position_z: float = Field(..., description="Z position at death")
    distance: int = Field(..., ge=0, description="Distance at death")
    speed: float = Field(..., ge=0, description="Speed at death")
    
    # Player state at death
    was_jumping: bool = Field(default=False, description="Was player jumping")
    was_sliding: bool = Field(default=False, description="Was player sliding")
    current_lane: int = Field(default=0, ge=-1, le=1, description="Lane at death (-1, 0, 1)")
    combo_at_death: int = Field(default=0, ge=0, description="Combo at death")
    
    # Context
    difficulty_tier: Optional[str] = Field(None, description="Difficulty tier")
    pattern_id: Optional[str] = Field(None, description="Obstacle pattern ID")


class DeathEventResponse(BaseSchema):
    """Response for a death event."""
    id: str
    run_id: Optional[str]
    user_id: str
    obstacle_type: str
    position_x: float
    position_z: float
    distance: int
    speed: float
    was_jumping: bool
    was_sliding: bool
    current_lane: int
    combo_at_death: int
    created_at: datetime


# ============================================
# Telemetry Schemas
# ============================================

class DeathPosition(BaseSchema):
    """Single death position for heatmap."""
    x: float
    z: float
    count: int = 1


class TelemetryAggregate(BaseSchema):
    """
    Aggregated telemetry data.
    Requirements: 7.3, 7.4
    """
    period_start: datetime
    period_end: datetime
    
    # Death statistics
    total_runs: int = 0
    total_deaths: int = 0
    avg_distance: float = 0.0
    avg_score: float = 0.0
    avg_combo: float = 0.0
    
    # Deaths by obstacle type
    deaths_by_obstacle: dict = Field(default_factory=dict)
    
    # Distance distribution (buckets)
    distance_distribution: dict = Field(default_factory=dict)
    
    # Death positions for heatmap
    death_positions: List[DeathPosition] = Field(default_factory=list)


class DeathHeatmapResponse(BaseSchema):
    """Response for death heatmap data."""
    positions: List[DeathPosition]
    total_deaths: int
    period_start: datetime
    period_end: datetime


# ============================================
# Leaderboard Schemas
# ============================================

class SurvivalLeaderboardEntry(BaseSchema):
    """
    Single entry in survival leaderboard.
    Requirements: 6.4
    """
    rank: int = Field(..., description="Leaderboard rank")
    user_id: str = Field(..., description="User UUID")
    display_name: Optional[str] = Field(None, description="Player display name")
    avatar_url: Optional[str] = Field(None, description="Player avatar URL")
    
    best_distance: int = Field(..., description="Best distance achieved")
    best_score: int = Field(..., description="Best score achieved")
    best_combo: int = Field(..., description="Best combo achieved")
    total_runs: int = Field(default=0, description="Total runs played")
    avg_distance: float = Field(default=0.0, description="Average distance")


class SurvivalLeaderboardResponse(BaseSchema):
    """
    Survival leaderboard response.
    Requirements: 6.4, 6.5
    """
    entries: List[SurvivalLeaderboardEntry] = Field(default_factory=list)
    total_players: int = Field(default=0, description="Total players on leaderboard")
    
    # Player's own rank if outside top 100
    player_rank: Optional[int] = Field(None, description="Requesting player's rank")
    player_entry: Optional[SurvivalLeaderboardEntry] = Field(None, description="Requesting player's entry")


# ============================================
# Ghost Data Schemas
# ============================================

class GhostDataResponse(BaseSchema):
    """
    Response for ghost replay data.
    Requirements: 5.1
    """
    user_id: str
    ghost_data: str = Field(..., description="Compressed input recording JSON")
    distance: int = Field(..., description="Distance of the ghost run")
    seed: Optional[int] = Field(None, description="Random seed for obstacle generation")
