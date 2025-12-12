"""
Achievement repository for database operations.
Handles achievement definitions and user earned achievements.
Requirements: 1.3, 7.1, 7.2
"""

from typing import Optional, Set, List
from supabase import Client
from .base import BaseRepository


class AchievementRepository(BaseRepository):
    """Repository for achievement database operations."""

    def __init__(self, client: Client):
        """Initialize with achievements table."""
        super().__init__(client, "achievements")
        self.user_achievements_table = "user_achievements"

    async def get_active_achievements(
        self,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """
        Get all active achievement definitions.
        
        Args:
            category: Optional category filter
            limit: Maximum records to return
            offset: Number of records to skip
            
        Returns:
            List of active achievement definitions
        """
        query = self._table().select("*").eq("is_active", True)
        
        if category:
            query = query.eq("category", category)
        
        query = query.order("sort_order").range(offset, offset + limit - 1)
        result = query.execute()
        return result.data

    async def get_user_earned_achievement_ids(self, user_id: str) -> Set[str]:
        """
        Get set of achievement IDs already earned by user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Set of earned achievement IDs
        """
        result = (
            self.client.table(self.user_achievements_table)
            .select("achievement_id")
            .eq("user_id", user_id)
            .execute()
        )
        return {row["achievement_id"] for row in result.data}

    async def award_achievement(
        self,
        user_id: str,
        achievement_id: str
    ) -> Optional[dict]:
        """
        Create user_achievement record with duplicate prevention.
        
        Args:
            user_id: User UUID
            achievement_id: Achievement UUID
            
        Returns:
            Created record or None if duplicate
            
        Note:
            Uses upsert with on_conflict to handle duplicates gracefully.
            The UNIQUE(user_id, achievement_id) constraint prevents duplicates.
        """
        try:
            result = (
                self.client.table(self.user_achievements_table)
                .insert({
                    "user_id": user_id,
                    "achievement_id": achievement_id
                })
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            # Handle duplicate key violation
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                return None
            raise

    async def get_user_achievements_with_details(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """
        Get user achievements joined with achievement definitions.
        
        Args:
            user_id: User UUID
            limit: Maximum records to return
            offset: Number of records to skip
            
        Returns:
            List of user achievements with full achievement details
        """
        result = (
            self.client.table(self.user_achievements_table)
            .select("*, achievements(*)")
            .eq("user_id", user_id)
            .order("earned_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data

    async def get_achievement_by_id(self, achievement_id: str) -> Optional[dict]:
        """
        Get a single achievement by ID.
        
        Args:
            achievement_id: Achievement UUID
            
        Returns:
            Achievement dict or None
        """
        result = self._table().select("*").eq("id", achievement_id).execute()
        return result.data[0] if result.data else None

    async def get_achievements_by_category(self, category: str) -> List[dict]:
        """
        Get all achievements in a category ordered by criteria_value.
        
        Args:
            category: Achievement category
            
        Returns:
            List of achievements in the category
        """
        result = (
            self._table()
            .select("*")
            .eq("category", category)
            .eq("is_active", True)
            .order("criteria_value")
            .execute()
        )
        return result.data

    async def get_total_achievement_count(self, active_only: bool = True) -> int:
        """
        Get total count of achievements.
        
        Args:
            active_only: Only count active achievements
            
        Returns:
            Total achievement count
        """
        query = self._table().select("*", count="exact")
        if active_only:
            query = query.eq("is_active", True)
        result = query.execute()
        return result.count or 0

    async def get_user_achievement_count(self, user_id: str) -> int:
        """
        Get count of achievements earned by user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Count of earned achievements
        """
        result = (
            self.client.table(self.user_achievements_table)
            .select("*", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0

    async def get_user_achievements_by_rarity(self, user_id: str) -> dict:
        """
        Get breakdown of user achievements by rarity.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dict with rarity counts
        """
        result = (
            self.client.table(self.user_achievements_table)
            .select("achievements(rarity)")
            .eq("user_id", user_id)
            .execute()
        )
        
        counts = {
            "common": 0,
            "uncommon": 0,
            "rare": 0,
            "epic": 0,
            "legendary": 0
        }
        
        for row in result.data:
            if row.get("achievements") and row["achievements"].get("rarity"):
                rarity = row["achievements"]["rarity"]
                if rarity in counts:
                    counts[rarity] += 1
        
        return counts

    async def get_recent_user_achievements(
        self,
        user_id: str,
        limit: int = 3
    ) -> List[dict]:
        """
        Get most recent achievements earned by user.
        
        Args:
            user_id: User UUID
            limit: Number of recent achievements
            
        Returns:
            List of recent achievements with details
        """
        result = (
            self.client.table(self.user_achievements_table)
            .select("*, achievements(*)")
            .eq("user_id", user_id)
            .order("earned_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

    async def check_user_has_achievement(
        self,
        user_id: str,
        achievement_id: str
    ) -> bool:
        """
        Check if user has already earned an achievement.
        
        Args:
            user_id: User UUID
            achievement_id: Achievement UUID
            
        Returns:
            True if already earned
        """
        result = (
            self.client.table(self.user_achievements_table)
            .select("id")
            .eq("user_id", user_id)
            .eq("achievement_id", achievement_id)
            .execute()
        )
        return len(result.data) > 0
