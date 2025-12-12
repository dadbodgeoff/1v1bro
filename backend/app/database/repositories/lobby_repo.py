"""
Lobby repository.
Handles lobby CRUD and status management.
"""

from typing import Optional

from supabase import Client

from app.database.repositories.base import BaseRepository


class LobbyRepository(BaseRepository):
    """Repository for lobbies table operations."""

    def __init__(self, client: Client):
        super().__init__(client, "lobbies")

    async def get_by_code(self, code: str) -> Optional[dict]:
        """
        Get a waiting lobby by its code.
        
        Args:
            code: 6-character lobby code
            
        Returns:
            Lobby dict or None if not found/not waiting
        """
        result = (
            self._table()
            .select("*")
            .eq("code", code.upper())
            .eq("status", "waiting")
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_active_by_code(self, code: str) -> Optional[dict]:
        """
        Get an active lobby (waiting or in_progress) by code.
        
        Args:
            code: 6-character lobby code
            
        Returns:
            Lobby dict or None if not found/not active
        """
        result = (
            self._table()
            .select("*")
            .eq("code", code.upper())
            .in_("status", ["waiting", "in_progress"])
            .execute()
        )
        return result.data[0] if result.data else None

    async def code_exists(self, code: str) -> bool:
        """
        Check if a lobby code is in use by an active lobby.
        
        Args:
            code: 6-character lobby code
            
        Returns:
            True if code is in use, False otherwise
        """
        result = (
            self._table()
            .select("id")
            .eq("code", code.upper())
            .in_("status", ["waiting", "in_progress"])
            .execute()
        )
        return len(result.data) > 0

    async def create_lobby(
        self,
        code: str,
        host_id: str,
        game_mode: str = "fortnite",
        map_slug: str = "simple-arena",
    ) -> dict:
        """
        Create a new lobby.
        
        Args:
            code: Unique 6-character code
            host_id: Host user ID
            game_mode: Game mode/category
            map_slug: Arena map slug (simple-arena, vortex-arena)
            
        Returns:
            Created lobby dict
        """
        data = {
            "code": code.upper(),
            "host_id": host_id,
            "status": "waiting",
            "game_mode": game_mode,  # Stores category for trivia question filtering
            "map_slug": map_slug,  # Store map for arena selection
        }
        result = self._table().insert(data).execute()
        return result.data[0]

    async def add_opponent(self, lobby_id: str, opponent_id: str) -> Optional[dict]:
        """
        Add an opponent to a lobby.
        
        Args:
            lobby_id: Lobby UUID
            opponent_id: Opponent user ID
            
        Returns:
            Updated lobby or None if not found
        """
        result = (
            self._table()
            .update({"opponent_id": opponent_id})
            .eq("id", lobby_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def update_status(self, lobby_id: str, status: str) -> Optional[dict]:
        """
        Update lobby status.
        
        Args:
            lobby_id: Lobby UUID
            status: New status (waiting, in_progress, completed, abandoned)
            
        Returns:
            Updated lobby or None if not found
        """
        result = (
            self._table()
            .update({"status": status})
            .eq("id", lobby_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_user_lobbies(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict]:
        """
        Get lobbies where user is host or opponent.
        
        Args:
            user_id: User ID
            status: Optional status filter
            limit: Max results
            
        Returns:
            List of lobby dicts
        """
        query = (
            self._table()
            .select("*")
            .or_(f"host_id.eq.{user_id},opponent_id.eq.{user_id}")
            .order("created_at", desc=True)
            .limit(limit)
        )
        
        if status:
            query = query.eq("status", status)
        
        result = query.execute()
        return result.data

    async def get_waiting_lobbies(self, limit: int = 20) -> list[dict]:
        """
        Get all waiting lobbies (for potential matchmaking).
        
        Args:
            limit: Max results
            
        Returns:
            List of waiting lobby dicts
        """
        result = (
            self._table()
            .select("*")
            .eq("status", "waiting")
            .is_("opponent_id", "null")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

    async def remove_opponent(self, lobby_id: str) -> Optional[dict]:
        """
        Remove opponent from lobby (when they leave).
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            Updated lobby or None
        """
        result = (
            self._table()
            .update({"opponent_id": None})
            .eq("id", lobby_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def mark_abandoned(self, lobby_id: str) -> Optional[dict]:
        """
        Mark a lobby as abandoned.
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            Updated lobby or None
        """
        return await self.update_status(lobby_id, "abandoned")
