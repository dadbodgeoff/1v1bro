"""
User profile repository.
Handles user profile CRUD and stats operations.
"""

from typing import Optional

from supabase import Client

from app.database.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    """Repository for user_profiles table operations."""

    def __init__(self, client: Client):
        super().__init__(client, "user_profiles")

    async def get_by_id(self, user_id: str) -> Optional[dict]:
        """Get user profile by ID."""
        result = self._table().select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None

    async def create_profile(
        self,
        user_id: str,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> dict:
        """
        Create a new user profile.
        
        Args:
            user_id: Supabase auth user ID
            display_name: Optional display name
            avatar_url: Optional avatar URL
            
        Returns:
            Created profile dict
        """
        data = {"id": user_id}
        if display_name:
            data["display_name"] = display_name
        if avatar_url:
            data["avatar_url"] = avatar_url
        
        result = self._table().insert(data).execute()
        return result.data[0]

    async def update_profile(
        self,
        user_id: str,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Update user profile fields.
        
        Args:
            user_id: User ID
            display_name: New display name (if provided)
            avatar_url: New avatar URL (if provided)
            
        Returns:
            Updated profile or None if not found
        """
        data = {}
        if display_name is not None:
            data["display_name"] = display_name
        if avatar_url is not None:
            data["avatar_url"] = avatar_url
        
        if not data:
            return await self.get_by_id(user_id)
        
        result = self._table().update(data).eq("id", user_id).execute()
        return result.data[0] if result.data else None

    async def update_stats(
        self,
        user_id: str,
        games_played_delta: int = 0,
        games_won_delta: int = 0,
        score_delta: int = 0,
    ) -> Optional[dict]:
        """
        Update user game statistics.
        Uses RPC for atomic increment operations.
        
        Args:
            user_id: User ID
            games_played_delta: Amount to add to games_played
            games_won_delta: Amount to add to games_won
            score_delta: Amount to add to total_score
            
        Returns:
            Updated profile or None if not found
        """
        # Get current stats
        current = await self.get_by_id(user_id)
        if not current:
            return None
        
        # Calculate new values
        new_data = {
            "games_played": current.get("games_played", 0) + games_played_delta,
            "games_won": current.get("games_won", 0) + games_won_delta,
            "total_score": current.get("total_score", 0) + score_delta,
        }
        
        result = self._table().update(new_data).eq("id", user_id).execute()
        return result.data[0] if result.data else None

    async def get_leaderboard(self, limit: int = 10) -> list[dict]:
        """
        Get top players by total score.
        
        Args:
            limit: Number of players to return
            
        Returns:
            List of user profiles ordered by total_score desc
        """
        result = (
            self._table()
            .select("id, display_name, games_played, games_won, total_score")
            .order("total_score", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

    async def get_by_display_name(self, display_name: str) -> Optional[dict]:
        """
        Find user by display name.
        
        Args:
            display_name: Display name to search
            
        Returns:
            User profile or None if not found
        """
        result = self._table().select("*").eq("display_name", display_name).execute()
        return result.data[0] if result.data else None
