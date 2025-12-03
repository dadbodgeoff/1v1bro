"""
Player schemas.
"""

from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class PlayerInfo(BaseSchema):
    """Basic player information for lobby display."""

    id: str = Field(..., description="Player UUID")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    is_host: bool = Field(default=False, description="Whether player is the host")
    is_ready: bool = Field(default=False, description="Whether player is ready")


class PlayerState(BaseSchema):
    """Player state during a game."""

    id: str = Field(..., description="Player UUID")
    display_name: Optional[str] = Field(None, description="Display name")
    score: int = Field(default=0, description="Current score")
    correct_count: int = Field(default=0, description="Number of correct answers")
    is_connected: bool = Field(default=True, description="WebSocket connection status")
    current_answer: Optional[str] = Field(None, description="Answer for current question")
    answer_time_ms: Optional[int] = Field(None, description="Time taken for current answer")


class PlayerStats(BaseSchema):
    """Player statistics."""

    games_played: int = Field(default=0, description="Total games played")
    games_won: int = Field(default=0, description="Total games won")
    total_score: int = Field(default=0, description="Cumulative score")
    win_rate: float = Field(default=0.0, description="Win percentage")
    average_score: float = Field(default=0.0, description="Average score per game")
