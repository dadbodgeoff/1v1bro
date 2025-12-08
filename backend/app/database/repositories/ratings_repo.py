"""
Ratings repository - Database operations for ELO ratings and leaderboards.
Requirements: 5.6, 5.7, 5.8
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class RatingsRepository:
    """Repository for ELO ratings database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _ratings(self):
        return self._client.table("player_ratings")

    def _profiles(self):
        return self._client.table("user_profiles")

    # ============================================
    # Rating Operations
    # ============================================

    async def get_rating(self, user_id: str) -> Optional[dict]:
        """
        Get a player's rating by user_id.
        
        Returns:
            Rating data with profile info or None if not found
        """
        result = (
            self._ratings()
            .select("*, user_profiles(display_name, avatar_url)")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def create_rating(self, user_id: str, initial_elo: int = 1200) -> dict:
        """
        Create initial rating for a new player.
        
        Args:
            user_id: User UUID
            initial_elo: Starting ELO (default 1200)
            
        Returns:
            Created rating record
        """
        result = (
            self._ratings()
            .insert({
                "user_id": user_id,
                "current_elo": initial_elo,
                "peak_elo": initial_elo,
                "current_tier": "Gold",  # 1200 = Gold
                "win_rate": 0.0,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .execute()
        )
        return result.data[0] if result.data else {}

    async def get_or_create_rating(self, user_id: str) -> dict:
        """Get rating, creating it if it doesn't exist."""
        rating = await self.get_rating(user_id)
        if not rating:
            rating = await self.create_rating(user_id)
        return rating

    async def update_rating(
        self,
        user_id: str,
        new_elo: int,
        new_tier: str,
        win_rate: Optional[float] = None,
    ) -> Optional[dict]:
        """
        Update a player's ELO rating and tier.
        
        Args:
            user_id: User UUID
            new_elo: New ELO value
            new_tier: New tier name
            win_rate: Optional updated win rate
            
        Returns:
            Updated rating or None if not found
        """
        # Get current rating to check peak
        current = await self.get_rating(user_id)
        if not current:
            return None
        
        update_data = {
            "current_elo": new_elo,
            "current_tier": new_tier,
            "last_match_date": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        # Update peak if new ELO is higher
        if new_elo > (current.get("peak_elo", 0) or 0):
            update_data["peak_elo"] = new_elo
        
        if win_rate is not None:
            update_data["win_rate"] = win_rate
        
        result = (
            self._ratings()
            .update(update_data)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    # ============================================
    # Leaderboard Operations
    # ============================================

    async def get_leaderboard(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get global leaderboard sorted by ELO.
        
        Requirements: 5.6 - Return top 100 players sorted by ELO descending.
        """
        result = (
            self._ratings()
            .select("*, user_profiles(display_name, avatar_url)")
            .order("current_elo", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    async def get_leaderboard_count(self) -> int:
        """Get total count of ranked players."""
        result = (
            self._ratings()
            .select("id", count="exact")
            .execute()
        )
        return result.count or 0

    async def get_regional_leaderboard(
        self,
        country: str,
        limit: int = 100,
    ) -> List[dict]:
        """
        Get regional leaderboard filtered by country.
        
        Requirements: 5.7 - Filter by player country and return top 100.
        """
        # Join with profiles to filter by country
        result = (
            self._ratings()
            .select("*, user_profiles!inner(display_name, avatar_url, country)")
            .eq("user_profiles.country", country.upper())
            .order("current_elo", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def get_user_rank(self, user_id: str) -> Optional[int]:
        """
        Get user's global rank position.
        
        Returns:
            Rank (1-indexed) or None if not ranked
        """
        # Get user's ELO
        rating = await self.get_rating(user_id)
        if not rating:
            return None
        
        user_elo = rating.get("current_elo", 0)
        
        # Count players with higher ELO
        result = (
            self._ratings()
            .select("id", count="exact")
            .gt("current_elo", user_elo)
            .execute()
        )
        
        higher_count = result.count or 0
        return higher_count + 1  # 1-indexed rank

    async def get_nearby_players(
        self, user_id: str, range_size: int = 5
    ) -> List[dict]:
        """
        Get players near the user's rank (±range_size positions).
        
        Requirements: 5.8 - Return nearby players (±5 positions).
        """
        # Get user's rank
        rank = await self.get_user_rank(user_id)
        if not rank:
            return []
        
        # Calculate offset to get players around user
        start_rank = max(1, rank - range_size)
        offset = start_rank - 1
        limit = (range_size * 2) + 1
        
        # Get players in that range
        result = (
            self._ratings()
            .select("*, user_profiles(display_name, avatar_url)")
            .order("current_elo", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    # ============================================
    # Tier Operations
    # ============================================

    async def get_players_by_tier(self, tier: str, limit: int = 50) -> List[dict]:
        """Get players in a specific tier."""
        result = (
            self._ratings()
            .select("*, user_profiles(display_name, avatar_url)")
            .eq("current_tier", tier)
            .order("current_elo", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def get_tier_counts(self) -> dict:
        """Get count of players in each tier."""
        tiers = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"]
        counts = {}
        
        for tier in tiers:
            result = (
                self._ratings()
                .select("id", count="exact")
                .eq("current_tier", tier)
                .execute()
            )
            counts[tier] = result.count or 0
        
        return counts
