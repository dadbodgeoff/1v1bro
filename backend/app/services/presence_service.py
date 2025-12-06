"""
Presence Service - Tracks user online status independently of game lobbies.

Users are considered online when:
1. They have an active WebSocket connection (lobby or global)
2. They've had recent API activity (heartbeat)
"""

import time
from typing import Dict, Set, Optional
from dataclasses import dataclass, field

from app.core.logging import get_logger

logger = get_logger("presence")


@dataclass
class UserPresence:
    """Tracks a user's online presence."""
    user_id: str
    last_seen: float = field(default_factory=time.time)
    is_in_game: bool = False
    current_lobby: Optional[str] = None


class PresenceService:
    """
    Manages user online presence.
    
    Tracks users via:
    - WebSocket connections (real-time)
    - Heartbeat pings (for users browsing without WS)
    """

    # Consider user offline after this many seconds without activity
    OFFLINE_THRESHOLD = 60.0
    # Heartbeat interval expected from clients
    HEARTBEAT_INTERVAL = 30.0

    def __init__(self):
        self._presence: Dict[str, UserPresence] = {}
        self._ws_connected: Set[str] = set()  # Users with active WS

    def user_connected(self, user_id: str, lobby_code: Optional[str] = None) -> None:
        """Mark user as connected via WebSocket."""
        self._ws_connected.add(user_id)
        
        if user_id in self._presence:
            self._presence[user_id].last_seen = time.time()
            self._presence[user_id].current_lobby = lobby_code
            self._presence[user_id].is_in_game = lobby_code is not None
        else:
            self._presence[user_id] = UserPresence(
                user_id=user_id,
                current_lobby=lobby_code,
                is_in_game=lobby_code is not None,
            )
        
        logger.debug(f"User {user_id} connected (lobby={lobby_code})")

    def user_disconnected(self, user_id: str) -> None:
        """Mark user as disconnected from WebSocket."""
        self._ws_connected.discard(user_id)
        
        if user_id in self._presence:
            self._presence[user_id].is_in_game = False
            self._presence[user_id].current_lobby = None
            # Keep last_seen for heartbeat-based presence
        
        logger.debug(f"User {user_id} disconnected")

    def heartbeat(self, user_id: str) -> None:
        """Update user's last seen time (called from API endpoints)."""
        if user_id in self._presence:
            self._presence[user_id].last_seen = time.time()
        else:
            self._presence[user_id] = UserPresence(user_id=user_id)

    def is_online(self, user_id: str) -> bool:
        """Check if user is currently online."""
        # If they have an active WebSocket, they're definitely online
        if user_id in self._ws_connected:
            return True
        
        # Otherwise check heartbeat
        presence = self._presence.get(user_id)
        if not presence:
            return False
        
        return (time.time() - presence.last_seen) < self.OFFLINE_THRESHOLD

    def is_in_game(self, user_id: str) -> bool:
        """Check if user is currently in a game."""
        presence = self._presence.get(user_id)
        return presence.is_in_game if presence else False

    def get_current_lobby(self, user_id: str) -> Optional[str]:
        """Get user's current lobby code if in game."""
        presence = self._presence.get(user_id)
        return presence.current_lobby if presence else None

    def get_online_users(self, user_ids: list[str]) -> Set[str]:
        """Get which users from a list are currently online."""
        return {uid for uid in user_ids if self.is_online(uid)}

    def cleanup_stale(self) -> int:
        """Remove stale presence entries. Returns count removed."""
        current_time = time.time()
        stale_threshold = self.OFFLINE_THRESHOLD * 2  # Keep entries a bit longer
        
        stale = [
            uid for uid, p in self._presence.items()
            if uid not in self._ws_connected and 
               (current_time - p.last_seen) > stale_threshold
        ]
        
        for uid in stale:
            del self._presence[uid]
        
        return len(stale)

    def get_stats(self) -> dict:
        """Get presence statistics."""
        online_count = sum(1 for uid in self._presence if self.is_online(uid))
        return {
            "total_tracked": len(self._presence),
            "ws_connected": len(self._ws_connected),
            "online": online_count,
            "in_game": sum(1 for p in self._presence.values() if p.is_in_game),
        }


# Global presence service instance
presence_service = PresenceService()
