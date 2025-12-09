"""
Heartbeat monitor for matchmaking queue.

Monitors queued players' connections via periodic heartbeats
and detects stale connections.
"""

import asyncio
from datetime import datetime
from typing import Callable, Dict, List, Optional

from app.core.logging import get_logger
from app.matchmaking.models import HeartbeatStatus
from app.websocket.manager import manager

logger = get_logger("matchmaking.heartbeat")


class HeartbeatMonitor:
    """
    Monitors queue player connections via periodic heartbeats.
    
    Sends heartbeat pings to all registered players and tracks responses.
    Players who miss consecutive heartbeats are marked as stale.
    """
    
    # Heartbeat configuration
    HEARTBEAT_INTERVAL = 15.0  # seconds between heartbeats
    MAX_MISSED_HEARTBEATS = 2  # missed heartbeats before marking stale
    STALE_CHECK_INTERVAL = 5.0  # seconds between stale checks
    
    def __init__(self, connection_manager=None):
        """
        Initialize heartbeat monitor.
        
        Args:
            connection_manager: Optional ConnectionManager instance (defaults to global)
        """
        self._manager = connection_manager or manager
        self._players: Dict[str, HeartbeatStatus] = {}
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._stale_check_task: Optional[asyncio.Task] = None
        self._running = False
        
        # Lock to prevent race conditions between heartbeat checks and pong recording
        self._lock = asyncio.Lock()
        
        # Callback for when a player is marked stale
        self._on_stale_callback: Optional[Callable[[str, HeartbeatStatus], None]] = None
    
    def set_on_stale_callback(self, callback: Callable[[str, HeartbeatStatus], None]) -> None:
        """
        Set callback to be called when a player is marked stale.
        
        Args:
            callback: Function taking (user_id, HeartbeatStatus)
        """
        self._on_stale_callback = callback
    
    async def start(self) -> None:
        """Start heartbeat monitoring."""
        if self._running:
            return
        
        self._running = True
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        self._stale_check_task = asyncio.create_task(self._stale_check_loop())
        
        logger.info("Heartbeat monitor started")
    
    async def stop(self) -> None:
        """Stop heartbeat monitoring."""
        self._running = False
        
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
        
        if self._stale_check_task:
            self._stale_check_task.cancel()
            try:
                await self._stale_check_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Heartbeat monitor stopped")
    
    def register_player(self, user_id: str) -> None:
        """
        Register a player for heartbeat monitoring.
        
        Called when a player joins the queue.
        
        Args:
            user_id: Player UUID
        """
        if user_id not in self._players:
            self._players[user_id] = HeartbeatStatus(user_id=user_id)
            logger.debug(f"Registered player {user_id} for heartbeat monitoring")
    
    def unregister_player(self, user_id: str) -> Optional[HeartbeatStatus]:
        """
        Unregister a player from heartbeat monitoring.
        
        Called when a player leaves the queue or is matched.
        
        Args:
            user_id: Player UUID
            
        Returns:
            HeartbeatStatus if player was registered, None otherwise
        """
        status = self._players.pop(user_id, None)
        if status:
            logger.debug(f"Unregistered player {user_id} from heartbeat monitoring")
        return status
    
    async def record_pong(self, user_id: str) -> None:
        """
        Record a pong response from a player.
        
        Called when a heartbeat_pong message is received.
        Uses lock to prevent race condition with heartbeat checks.
        
        Args:
            user_id: Player who sent the pong
        """
        async with self._lock:
            status = self._players.get(user_id)
            if status:
                status.record_pong_received()
                logger.debug(f"Recorded pong from player {user_id}")
    
    def get_stale_players(self) -> List[str]:
        """
        Get list of players marked as stale.
        
        Returns:
            List of stale player UUIDs
        """
        return [
            user_id
            for user_id, status in self._players.items()
            if status.is_stale
        ]
    
    def get_player_status(self, user_id: str) -> Optional[HeartbeatStatus]:
        """
        Get heartbeat status for a player.
        
        Args:
            user_id: Player UUID
            
        Returns:
            HeartbeatStatus if registered, None otherwise
        """
        return self._players.get(user_id)
    
    def get_registered_count(self) -> int:
        """Get number of registered players."""
        return len(self._players)
    
    async def _heartbeat_loop(self) -> None:
        """Background task that sends heartbeat pings."""
        while self._running:
            try:
                await self._send_heartbeats()
            except Exception as e:
                logger.error(f"Heartbeat loop error: {e}")
            
            await asyncio.sleep(self.HEARTBEAT_INTERVAL)
    
    async def _send_heartbeats(self) -> None:
        """Send heartbeat pings to all registered players."""
        if not self._players:
            return
        
        timestamp = datetime.utcnow().isoformat()
        
        for user_id, status in list(self._players.items()):
            # Use lock to prevent race condition with record_pong
            async with self._lock:
                # Check if player responded to last ping
                if status.last_ping_sent and not status.last_pong_received:
                    # No response to previous ping
                    was_stale = status.is_stale
                    now_stale = status.record_missed_heartbeat(self.MAX_MISSED_HEARTBEATS)
                    
                    if now_stale and not was_stale:
                        logger.warning(
                            f"Player {user_id} marked stale after {status.missed_count} missed heartbeats"
                        )
                elif status.last_pong_received and status.last_ping_sent:
                    # Got response, check if it was after the ping
                    if status.last_pong_received < status.last_ping_sent:
                        # Pong was for an older ping, count as missed
                        status.record_missed_heartbeat(self.MAX_MISSED_HEARTBEATS)
                
                # Send new heartbeat ping
                status.record_ping_sent()
            
            # Send outside lock to avoid holding it during I/O
            sent = await self._manager.send_to_user(user_id, {
                "type": "heartbeat_ping",
                "payload": {"timestamp": timestamp}
            })
            
            if not sent:
                # Failed to send - connection likely dead
                logger.debug(f"Failed to send heartbeat to {user_id}")
                async with self._lock:
                    status.record_missed_heartbeat(self.MAX_MISSED_HEARTBEATS)
    
    async def _stale_check_loop(self) -> None:
        """Background task that checks for and handles stale players."""
        while self._running:
            try:
                await self._handle_stale_players()
            except Exception as e:
                logger.error(f"Stale check loop error: {e}")
            
            await asyncio.sleep(self.STALE_CHECK_INTERVAL)
    
    async def _handle_stale_players(self) -> None:
        """Handle players marked as stale."""
        stale_players = self.get_stale_players()
        
        for user_id in stale_players:
            status = self._players.get(user_id)
            if status and self._on_stale_callback:
                try:
                    # Call the stale callback (async or sync)
                    result = self._on_stale_callback(user_id, status)
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as e:
                    logger.error(f"Error in stale callback for {user_id}: {e}")


# Global heartbeat monitor instance
heartbeat_monitor = HeartbeatMonitor()
