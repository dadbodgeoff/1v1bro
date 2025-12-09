"""
Match history schemas for profile match history display.
Requirements: Profile Enterprise - Match History Section, 7.5 - Return recap_data
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class MatchOpponent(BaseSchema):
    """Opponent information for match history display."""
    
    id: str = Field(..., description="Opponent user ID")
    display_name: str = Field(..., description="Opponent display name")
    avatar_url: Optional[str] = Field(None, description="Opponent avatar URL")


class MatchHistoryItem(BaseSchema):
    """Single match result for history display."""
    
    id: str = Field(..., description="Match result ID")
    opponent: MatchOpponent = Field(..., description="Opponent information")
    won: bool = Field(..., description="Whether the current user won")
    xp_earned: int = Field(default=0, description="XP earned from this match")
    played_at: datetime = Field(..., description="When the match was played")
    recap_data: Optional[Dict[str, Any]] = Field(
        None, 
        description="Recap data for this match (Requirements: 7.5)"
    )


class MatchHistoryResponse(BaseSchema):
    """Paginated match history response."""
    
    matches: List[MatchHistoryItem] = Field(default_factory=list, description="List of matches")
    total: int = Field(default=0, description="Total number of matches")
    has_more: bool = Field(default=False, description="Whether there are more matches to load")
