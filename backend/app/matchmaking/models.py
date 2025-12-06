"""
Matchmaking data models.
Defines structures for queue tickets, status, and match events.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import uuid4


@dataclass
class MatchTicket:
    """
    Represents a player's position in the matchmaking queue.
    
    Stored in-memory for fast access, persisted to database for crash recovery.
    """
    player_id: str
    player_name: str
    queue_time: datetime
    id: str = field(default_factory=lambda: str(uuid4()))
    game_mode: str = "fortnite"
    
    @property
    def wait_seconds(self) -> float:
        """Get seconds elapsed since joining queue."""
        return (datetime.utcnow() - self.queue_time).total_seconds()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for database persistence."""
        return {
            "id": self.id,
            "player_id": self.player_id,
            "player_name": self.player_name,
            "game_mode": self.game_mode,
            "queue_time": self.queue_time.isoformat(),
            "status": "waiting",
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "MatchTicket":
        """Create from database row."""
        queue_time = data.get("queue_time")
        if isinstance(queue_time, str):
            queue_time = datetime.fromisoformat(queue_time.replace("Z", "+00:00"))
        
        return cls(
            id=data["id"],
            player_id=data["player_id"],
            player_name=data.get("player_name", "Unknown"),
            game_mode=data.get("game_mode", "fortnite"),
            queue_time=queue_time,
        )


@dataclass
class QueueStatus:
    """
    Current queue status for a player.
    
    Sent to clients via WebSocket every 5 seconds.
    """
    in_queue: bool
    position: Optional[int] = None  # 1-indexed position in queue
    wait_seconds: int = 0
    estimated_wait: Optional[int] = None  # Estimated seconds until match
    queue_size: int = 0
    
    def to_dict(self) -> dict:
        """Convert to WebSocket payload."""
        return {
            "in_queue": self.in_queue,
            "position": self.position,
            "wait_seconds": self.wait_seconds,
            "estimated_wait": self.estimated_wait,
            "queue_size": self.queue_size,
        }


@dataclass
class MatchFoundEvent:
    """
    Event sent when two players are matched.
    
    Contains lobby info for both players to join.
    """
    lobby_code: str
    opponent_id: str
    opponent_name: str
    
    def to_dict(self) -> dict:
        """Convert to WebSocket payload."""
        return {
            "lobby_code": self.lobby_code,
            "opponent_id": self.opponent_id,
            "opponent_name": self.opponent_name,
        }


@dataclass
class CooldownInfo:
    """
    Information about a player's queue cooldown.
    """
    cooldown_until: datetime
    reason: str  # early_leave, abuse, manual
    remaining_seconds: int
    
    @property
    def is_active(self) -> bool:
        """Check if cooldown is still active."""
        return self.remaining_seconds > 0
    
    def to_dict(self) -> dict:
        """Convert to API response."""
        return {
            "cooldown_until": self.cooldown_until.isoformat(),
            "reason": self.reason,
            "remaining_seconds": self.remaining_seconds,
        }
