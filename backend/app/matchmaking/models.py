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
    game_mode: str = "fortnite"  # trivia category
    map_slug: str = "simple-arena"  # arena map (Runtime Ruins)
    
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
            "map_slug": self.map_slug,
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
            map_slug=data.get("map_slug", "simple-arena"),
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
    map_slug: str = "simple-arena"
    
    def to_dict(self) -> dict:
        """Convert to WebSocket payload."""
        return {
            "lobby_code": self.lobby_code,
            "opponent_id": self.opponent_id,
            "opponent_name": self.opponent_name,
            "map_slug": self.map_slug,
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


@dataclass
class HealthCheckResult:
    """
    Result of a connection health check.
    
    Used to verify a player's WebSocket connection is responsive
    before creating a match.
    """
    user_id: str
    healthy: bool
    latency_ms: Optional[float] = None
    failure_reason: Optional[str] = None  # "not_connected", "ping_timeout", "send_failed"
    checked_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for logging."""
        return {
            "user_id": self.user_id,
            "healthy": self.healthy,
            "latency_ms": self.latency_ms,
            "failure_reason": self.failure_reason,
            "checked_at": self.checked_at.isoformat(),
        }


@dataclass
class ConnectionState:
    """
    Detailed connection state for logging and debugging.
    
    Captures the full state of a user's WebSocket connection
    at a point in time.
    """
    user_id: str
    connected: bool
    lobby_code: Optional[str] = None
    connected_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    missed_heartbeats: int = 0
    
    def to_dict(self) -> dict:
        """Convert to dictionary for logging."""
        return {
            "user_id": self.user_id,
            "connected": self.connected,
            "lobby_code": self.lobby_code,
            "connected_at": self.connected_at.isoformat() if self.connected_at else None,
            "last_message_at": self.last_message_at.isoformat() if self.last_message_at else None,
            "missed_heartbeats": self.missed_heartbeats,
        }


@dataclass
class MatchResult:
    """
    Result of atomic match creation.
    
    Captures the outcome of a match creation attempt,
    including rollback information if the match failed.
    """
    success: bool
    lobby_code: Optional[str] = None
    player1_notified: bool = False
    player2_notified: bool = False
    failure_reason: Optional[str] = None
    rollback_performed: bool = False
    requeued_player_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for logging."""
        return {
            "success": self.success,
            "lobby_code": self.lobby_code,
            "player1_notified": self.player1_notified,
            "player2_notified": self.player2_notified,
            "failure_reason": self.failure_reason,
            "rollback_performed": self.rollback_performed,
            "requeued_player_id": self.requeued_player_id,
        }


@dataclass
class HeartbeatStatus:
    """
    Tracks heartbeat state for a queued player.
    
    Used by HeartbeatMonitor to detect stale connections.
    """
    user_id: str
    last_ping_sent: Optional[datetime] = None
    last_pong_received: Optional[datetime] = None
    missed_count: int = 0
    is_stale: bool = False
    
    def record_ping_sent(self) -> None:
        """Record that a ping was sent."""
        self.last_ping_sent = datetime.utcnow()
    
    def record_pong_received(self) -> None:
        """Record that a pong was received, resetting missed count."""
        self.last_pong_received = datetime.utcnow()
        self.missed_count = 0
        self.is_stale = False
    
    def record_missed_heartbeat(self, max_missed: int = 2) -> bool:
        """
        Record a missed heartbeat.
        
        Args:
            max_missed: Number of missed heartbeats before marking stale
            
        Returns:
            True if player is now marked stale
        """
        self.missed_count += 1
        if self.missed_count >= max_missed:
            self.is_stale = True
        return self.is_stale
    
    def to_dict(self) -> dict:
        """Convert to dictionary for logging."""
        return {
            "user_id": self.user_id,
            "last_ping_sent": self.last_ping_sent.isoformat() if self.last_ping_sent else None,
            "last_pong_received": self.last_pong_received.isoformat() if self.last_pong_received else None,
            "missed_count": self.missed_count,
            "is_stale": self.is_stale,
        }
