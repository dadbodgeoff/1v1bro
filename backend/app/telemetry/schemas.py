"""
Telemetry Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, Field


class DeathReplayCreate(BaseModel):
    """Schema for creating a new death replay."""
    lobby_id: UUID
    victim_id: UUID
    killer_id: UUID
    death_tick: int = Field(ge=0)
    death_timestamp: datetime
    frames: List[Any]  # TelemetryFrame[] - will be compressed


class DeathReplayResponse(BaseModel):
    """Schema for death replay response."""
    id: UUID
    lobby_id: UUID
    victim_id: UUID
    killer_id: UUID
    death_tick: int
    death_timestamp: datetime
    frames: List[Any]
    flagged: bool
    flag_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DeathReplayFlag(BaseModel):
    """Schema for flagging a death replay."""
    reason: str = Field(min_length=1, max_length=500)


class DeathReplaySummary(BaseModel):
    """Summary of a death replay (without frames)."""
    id: UUID
    lobby_id: UUID
    victim_id: UUID
    killer_id: UUID
    death_tick: int
    death_timestamp: datetime
    flagged: bool
    created_at: datetime

    class Config:
        from_attributes = True
