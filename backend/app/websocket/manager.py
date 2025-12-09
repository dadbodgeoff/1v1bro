"""
WebSocket connection manager.
Handles connection lifecycle and message broadcasting.
"""

import asyncio
import json
import time
from typing import Dict, Optional, Set, Tuple

from fastapi import WebSocket

from app.core.logging import get_logger
from app.services.presence_service import presence_service

logger = get_logger("websocket")


class ConnectionManager:
    """
    Manages WebSocket connections for game lobbies.
    
    Tracks connections by lobby code and provides broadcast capabilities.
    Includes connection limits for graceful degradation under load.
    """

    def __init__(
        self,
        max_connections: int = 500,
        max_per_lobby: int = 10,
    ):
        """
        Initialize connection manager.
        
        Args:
            max_connections: Maximum total WebSocket connections
            max_per_lobby: Maximum connections per lobby
        """
        # Connection limits
        self.max_connections = max_connections
        self.max_per_lobby = max_per_lobby
        
        # lobby_code -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> (lobby_code, user_id)
        self.connection_info: Dict[WebSocket, tuple] = {}
        # user_id -> websocket (for reconnection)
        self.user_connections: Dict[str, WebSocket] = {}
        # Pending health check pings: user_id -> asyncio.Event
        self._pending_pings: Dict[str, asyncio.Event] = {}
        # Track connection timestamps for health monitoring
        self._connection_times: Dict[str, float] = {}
        self._last_message_times: Dict[str, float] = {}
    
    def can_accept_connection(self, lobby_code: str) -> Tuple[bool, str]:
        """
        Check if we can accept a new connection.
        
        Args:
            lobby_code: Target lobby code
            
        Returns:
            Tuple of (can_accept, reason_if_rejected)
        """
        # Check total connections
        total = sum(len(conns) for conns in self.active_connections.values())
        if total >= self.max_connections:
            logger.warning(f"Server full: {total}/{self.max_connections} connections")
            return False, "server_full"
        
        # Check per-lobby limit
        lobby_count = len(self.active_connections.get(lobby_code, set()))
        if lobby_count >= self.max_per_lobby:
            logger.warning(f"Lobby {lobby_code} full: {lobby_count}/{self.max_per_lobby}")
            return False, "lobby_full"
        
        return True, ""
    
    def get_stats(self) -> dict:
        """
        Get connection statistics for monitoring.
        
        Returns:
            Dict with connection metrics
        """
        total = sum(len(conns) for conns in self.active_connections.values())
        return {
            "total_connections": total,
            "max_connections": self.max_connections,
            "capacity_percent": round(total / self.max_connections * 100, 1) if self.max_connections > 0 else 0,
            "active_lobbies": len(self.active_connections),
            "max_per_lobby": self.max_per_lobby,
            "connections_by_lobby": {
                code: len(conns) 
                for code, conns in self.active_connections.items()
            }
        }

    async def connect(
        self,
        websocket: WebSocket,
        lobby_code: str,
        user_id: str,
        subprotocol: Optional[str] = None,
    ) -> None:
        """
        Accept and register a WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            lobby_code: Lobby code to join
            user_id: User UUID
            subprotocol: Optional subprotocol to accept (for auth token handshake)
        """
        await websocket.accept(subprotocol=subprotocol)
        
        # Add to lobby connections
        if lobby_code not in self.active_connections:
            self.active_connections[lobby_code] = set()
        self.active_connections[lobby_code].add(websocket)
        
        # Track connection info
        self.connection_info[websocket] = (lobby_code, user_id)
        self.user_connections[user_id] = websocket
        
        # Track connection time for health monitoring
        self._connection_times[user_id] = time.time()
        self._last_message_times[user_id] = time.time()
        
        # Update presence service
        presence_service.user_connected(user_id, lobby_code)
        
        logger.info(f"User {user_id} connected to lobby {lobby_code}")

    def disconnect(self, websocket: WebSocket) -> Optional[tuple]:
        """
        Remove a WebSocket connection.
        
        Args:
            websocket: WebSocket to disconnect
            
        Returns:
            Tuple of (lobby_code, user_id) or None
        """
        info = self.connection_info.get(websocket)
        if info:
            lobby_code, user_id = info
            
            # Remove from lobby connections
            if lobby_code in self.active_connections:
                self.active_connections[lobby_code].discard(websocket)
                if not self.active_connections[lobby_code]:
                    del self.active_connections[lobby_code]
            
            # Remove from tracking
            del self.connection_info[websocket]
            if user_id in self.user_connections:
                del self.user_connections[user_id]
            
            # Clean up health monitoring data
            self._connection_times.pop(user_id, None)
            self._last_message_times.pop(user_id, None)
            self._pending_pings.pop(user_id, None)
            
            # Update presence service
            presence_service.user_disconnected(user_id)
            
            logger.info(f"User {user_id} disconnected from lobby {lobby_code}")
            return info
        
        return None

    async def broadcast_to_lobby(
        self,
        lobby_code: str,
        message: dict,
        exclude: Optional[WebSocket] = None,
        exclude_user_id: Optional[str] = None,
    ) -> None:
        """
        Broadcast a message to all connections in a lobby.
        
        Args:
            lobby_code: Target lobby code
            message: Message dict to send
            exclude: Optional WebSocket to exclude from broadcast
            exclude_user_id: Optional user ID to exclude from broadcast
        """
        if lobby_code not in self.active_connections:
            logger.warning(f"No connections for lobby {lobby_code}")
            return
        
        data = json.dumps(message)
        disconnected = []
        sent_count = 0
        
        for connection in self.active_connections[lobby_code]:
            if exclude and connection == exclude:
                continue
            if exclude_user_id and self.get_user_id(connection) == exclude_user_id:
                continue
            try:
                await connection.send_text(data)
                sent_count += 1
            except Exception as e:
                logger.warning(f"Failed to send to connection: {e}")
                disconnected.append(connection)
        
        # Log for position updates to debug
        msg_type = message.get("type", "unknown")
        if msg_type == "position_update":
            total_conns = len(self.active_connections[lobby_code])
            logger.debug(f"Broadcast {msg_type} to {sent_count}/{total_conns} connections in {lobby_code} (excluded: {exclude_user_id})")
        
        # Clean up failed connections
        for conn in disconnected:
            self.disconnect(conn)

    async def send_personal(self, websocket: WebSocket, message: dict) -> bool:
        """
        Send a message to a specific connection.
        
        Args:
            websocket: Target WebSocket
            message: Message dict to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            await websocket.send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.warning(f"Failed to send personal message: {e}")
            return False

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        """
        Send a message to a specific user by ID.
        
        Args:
            user_id: Target user UUID
            message: Message dict to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        websocket = self.user_connections.get(user_id)
        if websocket:
            return await self.send_personal(websocket, message)
        return False

    def get_lobby_connections(self, lobby_code: str) -> int:
        """Get number of connections in a lobby."""
        return len(self.active_connections.get(lobby_code, set()))

    def get_user_id(self, websocket: WebSocket) -> Optional[str]:
        """Get user ID for a WebSocket connection."""
        info = self.connection_info.get(websocket)
        return info[1] if info else None

    def get_lobby_code(self, websocket: WebSocket) -> Optional[str]:
        """Get lobby code for a WebSocket connection."""
        info = self.connection_info.get(websocket)
        return info[0] if info else None

    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user is currently connected."""
        return user_id in self.user_connections

    def get_lobby_users(self, lobby_code: str) -> Set[str]:
        """Get all user IDs connected to a lobby."""
        users = set()
        if lobby_code in self.active_connections:
            for ws in self.active_connections[lobby_code]:
                info = self.connection_info.get(ws)
                if info:
                    users.add(info[1])
        return users

    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return sum(len(conns) for conns in self.active_connections.values())

    async def ping_user(self, user_id: str, timeout: float = 2.0) -> Tuple[bool, Optional[float]]:
        """
        Send a health check ping and wait for pong response.
        
        Args:
            user_id: Target user UUID
            timeout: Maximum seconds to wait for pong response
            
        Returns:
            Tuple of (success, latency_ms) where success is True if pong received
        """
        websocket = self.user_connections.get(user_id)
        if not websocket:
            logger.debug(f"ping_user: User {user_id} not connected")
            return False, None
        
        # Create event for this ping
        ping_event = asyncio.Event()
        self._pending_pings[user_id] = ping_event
        
        start_time = time.time()
        
        try:
            # Send health check ping
            sent = await self.send_personal(websocket, {
                "type": "health_ping",
                "payload": {"timestamp": start_time}
            })
            
            if not sent:
                logger.debug(f"ping_user: Failed to send ping to {user_id}")
                return False, None
            
            # Wait for pong with timeout
            try:
                await asyncio.wait_for(ping_event.wait(), timeout=timeout)
                latency_ms = (time.time() - start_time) * 1000
                logger.debug(f"ping_user: User {user_id} responded in {latency_ms:.1f}ms")
                return True, latency_ms
            except asyncio.TimeoutError:
                logger.debug(f"ping_user: User {user_id} timed out after {timeout}s")
                return False, None
                
        finally:
            # Clean up pending ping
            self._pending_pings.pop(user_id, None)

    def record_pong(self, user_id: str) -> None:
        """
        Record a pong response from a user.
        
        Called when a health_pong message is received.
        
        Args:
            user_id: User who sent the pong
        """
        # Update last message time
        self._last_message_times[user_id] = time.time()
        
        # Signal the pending ping event if exists
        ping_event = self._pending_pings.get(user_id)
        if ping_event:
            ping_event.set()

    def get_connection_state(self, user_id: str) -> dict:
        """
        Get detailed connection state for a user.
        
        Args:
            user_id: Target user UUID
            
        Returns:
            Dict with connection state details
        """
        connected = user_id in self.user_connections
        websocket = self.user_connections.get(user_id)
        lobby_code = None
        
        if websocket:
            info = self.connection_info.get(websocket)
            if info:
                lobby_code = info[0]
        
        return {
            "user_id": user_id,
            "connected": connected,
            "lobby_code": lobby_code,
            "connected_at": self._connection_times.get(user_id),
            "last_message_at": self._last_message_times.get(user_id),
        }

    def update_last_message_time(self, user_id: str) -> None:
        """
        Update the last message timestamp for a user.
        
        Called when any message is received from the user.
        
        Args:
            user_id: User who sent a message
        """
        self._last_message_times[user_id] = time.time()


# Global connection manager instance
manager = ConnectionManager()
