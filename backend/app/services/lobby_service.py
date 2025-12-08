"""
Lobby service.
Handles lobby creation, joining, and management.
"""

from typing import Optional

from supabase import Client

from app.core.exceptions import (
    NotFoundError,
    LobbyFullError,
    ValidationError,
    GameStateError,
)
from app.database.repositories.lobby_repo import LobbyRepository
from app.database.repositories.user_repo import UserRepository
from app.services.base import BaseService
from app.utils.helpers import generate_lobby_code
from app.utils.constants import LobbyStatus
from app.utils.lobby_cache import lobby_cache


class LobbyService(BaseService):
    """Service for lobby operations."""
    
    # Track ready state in memory (lobby_code -> set of ready user_ids)
    _ready_states: dict[str, set[str]] = {}
    
    # Use shared cache instance
    _cache = lobby_cache

    def __init__(self, client: Client):
        super().__init__(client)
        # Use service client to bypass RLS for lobby operations
        from app.database.supabase_client import get_supabase_service_client
        service_client = get_supabase_service_client()
        self.lobby_repo = LobbyRepository(service_client)
        self.user_repo = UserRepository(service_client)

    async def create_lobby(
        self,
        host_id: str,
        game_mode: str = "fortnite",
        category: str | None = None,
    ) -> dict:
        """
        Create a new lobby with a unique code.
        
        Args:
            host_id: Host user UUID
            game_mode: Game mode/category
            category: Trivia category (overrides game_mode if provided)
            
        Returns:
            Created lobby dict with code
        """
        # Use category if provided, otherwise fall back to game_mode
        effective_category = category or game_mode
        
        # Generate unique code
        code = generate_lobby_code()
        while await self.lobby_repo.code_exists(code):
            code = generate_lobby_code()
        
        # Create lobby
        lobby = await self.lobby_repo.create_lobby(
            code=code,
            host_id=host_id,
            game_mode=effective_category,
        )
        
        # Get host info
        host_profile = await self.user_repo.get_by_id(host_id)
        
        return {
            **lobby,
            "players": [{
                "id": host_id,
                "display_name": host_profile.get("display_name") if host_profile else None,
                "is_host": True,
                "is_ready": False,
            }],
            "can_start": False,
        }

    async def join_lobby(self, code: str, player_id: str) -> dict:
        """
        Join an existing lobby.
        
        Args:
            code: 6-character lobby code
            player_id: Joining player UUID
            
        Returns:
            Updated lobby dict
            
        Raises:
            NotFoundError: If lobby not found
            LobbyFullError: If lobby already has 2 players
            ValidationError: If trying to join own lobby
        """
        code = code.upper()
        lobby = await self.lobby_repo.get_by_code(code)
        if not lobby:
            raise NotFoundError("Lobby", code)
        
        if lobby["host_id"] == player_id:
            raise ValidationError("Cannot join your own lobby")
        
        if lobby.get("opponent_id"):
            raise LobbyFullError(code)
        
        # Add opponent
        updated = await self.lobby_repo.add_opponent(lobby["id"], player_id)
        
        # Invalidate cache - lobby state changed
        self._cache.invalidate(code)
        
        # Get player profiles
        host_profile = await self.user_repo.get_by_id(lobby["host_id"])
        opponent_profile = await self.user_repo.get_by_id(player_id)
        
        result = {
            **updated,
            "players": [
                {
                    "id": lobby["host_id"],
                    "display_name": host_profile.get("display_name") if host_profile else None,
                    "is_host": True,
                    "is_ready": False,
                },
                {
                    "id": player_id,
                    "display_name": opponent_profile.get("display_name") if opponent_profile else None,
                    "is_host": False,
                    "is_ready": False,
                },
            ],
            "can_start": True,
        }
        
        # Cache the new state
        self._cache.set(code, result)
        
        return result

    async def get_lobby(self, code: str, use_cache: bool = True) -> dict:
        """
        Get lobby by code.
        
        Args:
            code: 6-character lobby code
            use_cache: Whether to use cached data (default True)
            
        Returns:
            Lobby dict with player info
            
        Raises:
            NotFoundError: If lobby not found
        """
        code = code.upper()
        
        # Check cache first (for high-frequency calls like position updates)
        if use_cache:
            cached = self._cache.get(code)
            if cached is not None:
                return cached
        
        # Cache miss - fetch from database
        lobby = await self.lobby_repo.get_active_by_code(code)
        if not lobby:
            raise NotFoundError("Lobby", code)
        
        # Get ready states for this lobby
        ready_users = self._ready_states.get(code, set())
        
        # Build player list
        players = []
        host_profile = await self.user_repo.get_by_id(lobby["host_id"])
        players.append({
            "id": lobby["host_id"],
            "display_name": host_profile.get("display_name") if host_profile else None,
            "is_host": True,
            "is_ready": lobby["host_id"] in ready_users,
        })
        
        if lobby.get("opponent_id"):
            opponent_profile = await self.user_repo.get_by_id(lobby["opponent_id"])
            players.append({
                "id": lobby["opponent_id"],
                "display_name": opponent_profile.get("display_name") if opponent_profile else None,
                "is_host": False,
                "is_ready": lobby["opponent_id"] in ready_users,
            })
        
        # Can start only if both players are present and opponent is ready
        can_start = (
            lobby.get("opponent_id") is not None and
            lobby["opponent_id"] in ready_users
        )
        
        result = {
            **lobby,
            "players": players,
            "can_start": can_start,
        }
        
        # Cache the result
        self._cache.set(code, result)
        
        return result
    
    async def set_player_ready(self, code: str, user_id: str) -> dict:
        """
        Mark a player as ready.
        
        Args:
            code: 6-character lobby code
            user_id: User UUID
            
        Returns:
            Updated lobby dict
        """
        code = code.upper()
        
        # Initialize ready set for this lobby if needed
        if code not in self._ready_states:
            self._ready_states[code] = set()
        
        # Add user to ready set
        self._ready_states[code].add(user_id)
        
        # Invalidate cache - ready state changed
        self._cache.invalidate(code)
        
        # Return updated lobby (will re-cache)
        return await self.get_lobby(code)

    async def start_game(self, lobby_id: str, host_id: str) -> dict:
        """
        Start the game (host only).
        
        Args:
            lobby_id: Lobby UUID
            host_id: Requesting user UUID (must be host)
            
        Returns:
            Updated lobby dict
            
        Raises:
            NotFoundError: If lobby not found
            ValidationError: If not host or no opponent
            GameStateError: If game already started
        """
        lobby = await self.lobby_repo.get_by_id(lobby_id)
        if not lobby:
            raise NotFoundError("Lobby", lobby_id)
        
        if lobby["host_id"] != host_id:
            raise ValidationError("Only the host can start the game")
        
        if not lobby.get("opponent_id"):
            raise ValidationError("Cannot start game without an opponent")
        
        if lobby["status"] != LobbyStatus.WAITING.value:
            raise GameStateError("Game has already started")
        
        # Update status
        updated = await self.lobby_repo.update_status(lobby_id, LobbyStatus.IN_PROGRESS.value)
        
        # Invalidate cache - game started
        if lobby.get("code"):
            self._cache.invalidate(lobby["code"])
        
        return updated

    async def leave_lobby(self, lobby_id: str, player_id: str) -> Optional[dict]:
        """
        Leave a lobby.
        
        Args:
            lobby_id: Lobby UUID
            player_id: Leaving player UUID
            
        Returns:
            Updated lobby or None if lobby was closed
        """
        lobby = await self.lobby_repo.get_by_id(lobby_id)
        if not lobby:
            return None
        
        # Invalidate cache - lobby state changing
        if lobby.get("code"):
            self._cache.invalidate(lobby["code"])
        
        if lobby["host_id"] == player_id:
            # Host leaving - abandon lobby
            await self.lobby_repo.mark_abandoned(lobby_id)
            return None
        elif lobby.get("opponent_id") == player_id:
            # Opponent leaving - remove from lobby
            return await self.lobby_repo.remove_opponent(lobby_id)
        
        return lobby

    async def complete_game(self, lobby_id: str) -> Optional[dict]:
        """
        Mark lobby as completed after game ends.
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            Updated lobby
        """
        # Get lobby to find code for cache invalidation
        lobby = await self.lobby_repo.get_by_id(lobby_id)
        if lobby and lobby.get("code"):
            self._cache.invalidate(lobby["code"])
        
        return await self.lobby_repo.update_status(lobby_id, LobbyStatus.COMPLETED.value)
