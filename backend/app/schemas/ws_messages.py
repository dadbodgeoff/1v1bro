"""
WebSocket message schemas.
"""

from enum import Enum
from typing import Any, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class WSEventType(str, Enum):
    """WebSocket event types."""
    
    # Server -> Client
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"
    GAME_START = "game_start"
    QUESTION = "question"
    ROUND_RESULT = "round_result"
    GAME_END = "game_end"
    ERROR = "error"
    PLAYER_DISCONNECTED = "player_disconnected"
    PLAYER_RECONNECTED = "player_reconnected"
    LOBBY_STATE = "lobby_state"
    
    # Client -> Server
    READY = "ready"
    ANSWER = "answer"
    START_GAME = "start_game"
    
    # Position sync
    POSITION_UPDATE = "position_update"
    
    # Power-up system
    POWERUP_SPAWN = "powerup_spawn"
    POWERUP_COLLECTED = "powerup_collected"
    POWERUP_USE = "powerup_use"
    SOS_USED = "sos_used"
    TIME_STOLEN = "time_stolen"
    SHIELD_ACTIVATED = "shield_activated"
    DOUBLE_POINTS_ACTIVATED = "double_points_activated"


class PowerUpType(str, Enum):
    """Power-up types available in the game."""
    SOS = "sos"
    TIME_STEAL = "time_steal"
    SHIELD = "shield"
    DOUBLE_POINTS = "double_points"


class WSMessage(BaseSchema):
    """Base WebSocket message structure."""

    type: WSEventType = Field(..., description="Event type")
    payload: Optional[Any] = Field(None, description="Event payload")


class QuestionPayload(BaseSchema):
    """Payload for question event."""

    q_num: int = Field(..., ge=1, le=15, description="Question number")
    text: str = Field(..., description="Question text")
    options: list[str] = Field(..., min_length=4, max_length=4, description="Answer options")
    start_time: int = Field(..., description="Server timestamp when question started (ms)")


class AnswerPayload(BaseSchema):
    """Payload for answer event (client -> server)."""

    q_num: int = Field(..., ge=1, le=15, description="Question number")
    answer: str = Field(..., description="Selected answer (A, B, C, or D)")
    time_ms: int = Field(..., ge=0, le=30000, description="Time taken in milliseconds")


class RoundResultPayload(BaseSchema):
    """Payload for round result event."""

    q_num: int = Field(..., description="Question number")
    correct_answer: str = Field(..., description="The correct answer")
    scores: dict[str, int] = Field(..., description="Player ID to points earned this round")
    answers: dict[str, Optional[str]] = Field(..., description="Player ID to their answer")
    total_scores: dict[str, int] = Field(..., description="Running total scores")


class GameEndPayload(BaseSchema):
    """Payload for game end event."""

    winner_id: Optional[str] = Field(None, description="Winner UUID (None for tie)")
    final_scores: dict[str, int] = Field(..., description="Final scores")
    is_tie: bool = Field(default=False, description="Whether game ended in tie")
    total_times: dict[str, int] = Field(
        default_factory=dict, description="Player ID to total answer time in ms"
    )
    won_by_time: bool = Field(
        default=False, description="Whether winner was decided by faster total time"
    )


class ErrorPayload(BaseSchema):
    """Payload for error event."""

    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")


class PlayerJoinedPayload(BaseSchema):
    """Payload for player joined event."""

    player_id: str = Field(..., description="Joined player UUID")
    display_name: Optional[str] = Field(None, description="Player display name")
    players: list[dict] = Field(..., description="All players in lobby")
    can_start: bool = Field(default=False, description="Whether game can start")


class GameStartPayload(BaseSchema):
    """Payload for game start event."""

    total_questions: int = Field(default=15, description="Total questions in game")
    players: list[dict] = Field(..., description="Players in the game")


# Position update payload
class PositionUpdatePayload(BaseSchema):
    """Payload for position update event."""
    
    player_id: str = Field(..., description="Player UUID")
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")


# Power-up payloads
class PowerUpSpawnPayload(BaseSchema):
    """Payload for power-up spawn event."""
    
    id: str = Field(..., description="Power-up UUID")
    type: PowerUpType = Field(..., description="Power-up type")
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")


class PowerUpCollectedPayload(BaseSchema):
    """Payload for power-up collected event."""
    
    powerup_id: str = Field(..., description="Power-up UUID")
    player_id: str = Field(..., description="Player who collected")
    type: PowerUpType = Field(..., description="Power-up type")


class PowerUpUsePayload(BaseSchema):
    """Payload for power-up use event (client -> server)."""
    
    type: PowerUpType = Field(..., description="Power-up type to use")


class SosUsedPayload(BaseSchema):
    """Payload for SOS used event."""
    
    player_id: str = Field(..., description="Player who used SOS")
    eliminated_options: List[str] = Field(..., description="Eliminated option letters (e.g., ['A', 'C'])")


class TimeStolenPayload(BaseSchema):
    """Payload for time stolen event."""
    
    stealer_id: str = Field(..., description="Player who stole time")
    victim_id: str = Field(..., description="Player who lost time")
    seconds_stolen: int = Field(default=5, description="Seconds stolen (always 5)")
