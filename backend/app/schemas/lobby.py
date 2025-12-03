"""
Lobby schemas.
"""

from typing import Optional

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema, TimestampMixin
from app.schemas.player import PlayerInfo
from app.utils.constants import LobbyStatus, GameMode


class LobbyCreate(BaseSchema):
    """Request schema for creating a lobby."""

    game_mode: str = Field(
        default=GameMode.FORTNITE,
        description="Game mode/category",
    )

    @field_validator("game_mode")
    @classmethod
    def validate_game_mode(cls, v: str) -> str:
        valid_modes = [m.value for m in GameMode]
        if v not in valid_modes:
            raise ValueError(f"Invalid game mode. Must be one of: {valid_modes}")
        return v


class LobbyJoin(BaseSchema):
    """Request schema for joining a lobby."""

    code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description="6-character lobby code",
    )

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        return v.upper().strip()


class LobbyCodeResponse(BaseSchema):
    """Response schema with lobby code."""

    code: str = Field(..., description="6-character lobby code")
    lobby_id: str = Field(..., description="Lobby UUID")


class LobbyResponse(BaseSchema, TimestampMixin):
    """Response schema for lobby information."""

    id: str = Field(..., description="Lobby UUID")
    code: str = Field(..., description="6-character lobby code")
    host_id: str = Field(..., description="Host user UUID")
    opponent_id: Optional[str] = Field(None, description="Opponent user UUID")
    status: str = Field(..., description="Lobby status")
    game_mode: str = Field(..., description="Game mode")
    players: list[PlayerInfo] = Field(default_factory=list, description="Players in lobby")
    can_start: bool = Field(default=False, description="Whether game can be started")

    @property
    def is_full(self) -> bool:
        """Check if lobby has both players."""
        return self.opponent_id is not None

    @property
    def player_count(self) -> int:
        """Get number of players in lobby."""
        return 2 if self.opponent_id else 1


class LobbyStateUpdate(BaseSchema):
    """WebSocket message for lobby state updates."""

    lobby_id: str
    status: str
    players: list[PlayerInfo]
    can_start: bool
    host_id: str
