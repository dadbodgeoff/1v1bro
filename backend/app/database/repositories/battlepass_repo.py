"""
Battle Pass repository - Database operations for seasons, progress, and XP.
Requirements: 4.1, 4.2, 4.6, 4.10
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class BattlePassRepository:
    """Repository for battle pass database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _seasons(self):
        return self._client.table("seasons")

    def _tiers(self):
        return self._client.table("battlepass_tiers")

    def _progress(self):
        return self._client.table("player_battlepass")

    def _xp_logs(self):
        return self._client.table("xp_logs")

    # ============================================
    # Season Operations
    # ============================================

    async def get_current_season(self) -> Optional[dict]:
        """
        Get the currently active season.
        
        Returns:
            Active season data or None if no active season
        """
        result = (
            self._seasons()
            .select("*")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_season(self, season_id: str) -> Optional[dict]:
        """Get a season by ID."""
        result = (
            self._seasons()
            .select("*")
            .eq("id", season_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_season_by_number(self, season_number: int) -> Optional[dict]:
        """Get a season by its number."""
        result = (
            self._seasons()
            .select("*")
            .eq("season_number", season_number)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_all_seasons(self) -> List[dict]:
        """Get all seasons ordered by number."""
        result = (
            self._seasons()
            .select("*")
            .order("season_number", desc=True)
            .execute()
        )
        return result.data or []

    async def create_season(self, season_data: dict) -> dict:
        """Create a new season."""
        result = (
            self._seasons()
            .insert(season_data)
            .execute()
        )
        return result.data[0] if result.data else {}

    async def set_season_active(self, season_id: str, is_active: bool) -> Optional[dict]:
        """Set a season's active status."""
        # If activating, deactivate all other seasons first
        if is_active:
            self._seasons().update({"is_active": False}).neq("id", season_id).execute()
        
        result = (
            self._seasons()
            .update({"is_active": is_active})
            .eq("id", season_id)
            .execute()
        )
        return result.data[0] if result.data else None

    # ============================================
    # Tier Operations
    # ============================================

    async def get_tier_rewards(self, season_id: str) -> List[dict]:
        """
        Get all tier rewards for a season.
        
        Returns:
            List of tiers ordered by tier_number
        """
        result = (
            self._tiers()
            .select("*")
            .eq("season_id", season_id)
            .order("tier_number")
            .execute()
        )
        return result.data or []

    async def get_tier(self, season_id: str, tier_number: int) -> Optional[dict]:
        """Get a specific tier's rewards."""
        result = (
            self._tiers()
            .select("*")
            .eq("season_id", season_id)
            .eq("tier_number", tier_number)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def create_tier(self, tier_data: dict) -> dict:
        """Create a new tier."""
        result = (
            self._tiers()
            .insert(tier_data)
            .execute()
        )
        return result.data[0] if result.data else {}

    async def create_tiers_bulk(self, tiers: List[dict]) -> List[dict]:
        """Create multiple tiers at once."""
        result = (
            self._tiers()
            .insert(tiers)
            .execute()
        )
        return result.data or []

    # ============================================
    # Player Progress Operations
    # ============================================

    async def get_player_progress(
        self, user_id: str, season_id: str
    ) -> Optional[dict]:
        """
        Get player's battle pass progress for a season.
        
        Args:
            user_id: User UUID
            season_id: Season UUID
            
        Returns:
            Player progress data or None if not found
        """
        result = (
            self._progress()
            .select("*")
            .eq("user_id", user_id)
            .eq("season_id", season_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_player_current_progress(self, user_id: str) -> Optional[dict]:
        """Get player's progress for the current active season."""
        season = await self.get_current_season()
        if not season:
            return None
        return await self.get_player_progress(user_id, season["id"])

    async def create_player_progress(
        self, user_id: str, season_id: str, is_premium: bool = False
    ) -> dict:
        """
        Create initial progress for a player in a season.
        
        UNIFIED PROGRESSION: Initializes at tier 1 with tier 1 auto-claimed.
        This ensures all new players start with the tier 1 skin available.
        
        Args:
            user_id: User UUID
            season_id: Season UUID
            is_premium: Whether player has premium pass
            
        Returns:
            New progress record with tier=1, claimed_rewards=[1]
        """
        result = (
            self._progress()
            .insert({
                "user_id": user_id,
                "season_id": season_id,
                "current_tier": 1,  # UNIFIED PROGRESSION: Start at tier 1 (was 0)
                "current_xp": 0,
                "is_premium": is_premium,
                "claimed_rewards": [1],  # UNIFIED PROGRESSION: Auto-claim tier 1 (was [])
                "purchased_tiers": 0,
                "last_updated": datetime.utcnow().isoformat(),
            })
            .execute()
        )
        return result.data[0] if result.data else {}

    async def update_progress(
        self,
        user_id: str,
        season_id: str,
        current_tier: int,
        current_xp: int,
    ) -> Optional[dict]:
        """
        Update player's tier and XP progress.
        
        Args:
            user_id: User UUID
            season_id: Season UUID
            current_tier: New tier value
            current_xp: New XP value (within current tier)
            
        Returns:
            Updated progress or None if not found
        """
        result = (
            self._progress()
            .update({
                "current_tier": current_tier,
                "current_xp": current_xp,
                "last_updated": datetime.utcnow().isoformat(),
            })
            .eq("user_id", user_id)
            .eq("season_id", season_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def mark_reward_claimed(
        self, user_id: str, season_id: str, tier_number: int
    ) -> Optional[dict]:
        """
        Mark a tier's reward as claimed.
        
        Appends the tier number to the claimed_rewards array.
        """
        # Get current claimed rewards
        progress = await self.get_player_progress(user_id, season_id)
        if not progress:
            return None
        
        claimed = progress.get("claimed_rewards", []) or []
        if tier_number not in claimed:
            claimed.append(tier_number)
        
        result = (
            self._progress()
            .update({
                "claimed_rewards": claimed,
                "last_updated": datetime.utcnow().isoformat(),
            })
            .eq("user_id", user_id)
            .eq("season_id", season_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def set_premium(
        self, user_id: str, season_id: str, is_premium: bool = True
    ) -> Optional[dict]:
        """Set player's premium status for a season."""
        result = (
            self._progress()
            .update({
                "is_premium": is_premium,
                "last_updated": datetime.utcnow().isoformat(),
            })
            .eq("user_id", user_id)
            .eq("season_id", season_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_or_create_progress(
        self, user_id: str, season_id: str
    ) -> dict:
        """Get player progress, creating it if it doesn't exist."""
        progress = await self.get_player_progress(user_id, season_id)
        if not progress:
            progress = await self.create_player_progress(user_id, season_id)
        return progress

    # ============================================
    # XP Log Operations
    # ============================================

    async def log_xp_gain(
        self,
        user_id: str,
        source: str,
        amount: int,
        match_id: Optional[str] = None,
        challenge_id: Optional[str] = None,
    ) -> dict:
        """
        Log an XP gain for analytics.
        
        Args:
            user_id: User UUID
            source: XP source (match_win, match_loss, etc.)
            amount: XP amount
            match_id: Optional associated match
            challenge_id: Optional associated challenge
            
        Returns:
            Created log entry
        """
        result = (
            self._xp_logs()
            .insert({
                "user_id": user_id,
                "source": source,
                "amount": amount,
                "match_id": match_id,
                "challenge_id": challenge_id,
                "created_at": datetime.utcnow().isoformat(),
            })
            .execute()
        )
        return result.data[0] if result.data else {}

    async def get_xp_logs(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[dict]:
        """Get recent XP logs for a user."""
        result = (
            self._xp_logs()
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    async def get_xp_logs_by_source(
        self, user_id: str, source: str, limit: int = 50
    ) -> List[dict]:
        """Get XP logs filtered by source."""
        result = (
            self._xp_logs()
            .select("*")
            .eq("user_id", user_id)
            .eq("source", source)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def get_total_xp_by_source(self, user_id: str) -> dict:
        """
        Get total XP earned by source for analytics.
        
        Returns dict like: {"match_win": 5000, "match_loss": 2000, ...}
        """
        result = (
            self._xp_logs()
            .select("source, amount")
            .eq("user_id", user_id)
            .execute()
        )
        
        totals = {}
        for entry in (result.data or []):
            source = entry["source"]
            totals[source] = totals.get(source, 0) + entry["amount"]
        
        return totals

    # ============================================
    # Leaderboard Operations
    # ============================================

    async def get_season_leaderboard(
        self, season_id: str, limit: int = 100
    ) -> List[dict]:
        """Get top players by tier/XP for a season."""
        result = (
            self._progress()
            .select("*, user_profiles(display_name, avatar_url)")
            .eq("season_id", season_id)
            .order("current_tier", desc=True)
            .order("current_xp", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
