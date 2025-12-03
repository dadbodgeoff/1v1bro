"""
WebSocket connection manager.
Handles connection lifecycle and message broadcasting.
"""

import json
from typing import Dict, Optional, Set

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger("websocket")


class ConnectionManager:
    """
    Manages WebSocket connections for game lobbies.
    
    Tracks connections by lobby code and provides broadcast capabilities.
    """

    def __init__(self):
        # lobby_code -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> (lobby_code, user_id)
        self.connection_info: Dict[WebSocket, tuple] = {}
        # user_id -> websocket (for reconnection)
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(
        self,
        websocket: WebSocket,
        lobby_code: str,
        user_id: str,
    ) -> None:
        """
        Accept and register a WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            lobby_code: Lobby code to join
            user_id: User UUID
        """
        await websocket.accept()
        
        # Add to lobby connections
        if lobby_code not in self.active_connections:
            self.active_connections[lobby_code] = set()
        self.active_connections[lobby_code].add(websocket)
        
        # Track connection info
        self.connection_info[websocket] = (lobby_code, user_id)
        self.user_connections[user_id] = websocket
        
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
            return
        
        data = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections[lobby_code]:
            if exclude and connection == exclude:
                continue
            if exclude_user_id and self.get_user_id(connection) == exclude_user_id:
                continue
            try:
                await connection.send_text(data)
            except Exception as e:
                logger.warning(f"Failed to send to connection: {e}")
                disconnected.append(connection)
        
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


# Global connection manager instance
manager = ConnectionManager()
