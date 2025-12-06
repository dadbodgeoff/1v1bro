"""
Leaderboard service.
Handles leaderboard queries and user rank calculations.
"""

from typing import Dict, Optional, Tuple

from supabase import Client

from app.database.repositories.leaderboard_repo import LeaderboardRepository
from app.schemas.leaderboard import (
    LeaderboardCategory, LeaderboardResponse, UserRankResponse,
)
from app.services.base import BaseService


# Minimum requirements for eligibility (category -> (field, min_value, description))
REQUIREMENTS: Dict[LeaderboardCategory, Tuple[str, int, str]] = {
    LeaderboardCategory.WIN_RATE: ("games_played", 10, "10+ games played"),
    LeaderboardCategory.KD_RATIO: ("total_deaths", 10, "10+ deaths"),
    LeaderboardCategory.ACCURACY: ("shots_fired", 100, "100+ shots fired"),
    LeaderboardCategory.FASTEST_THINKER: ("total_correct_answers", 50, "50+ correct answers"),
    LeaderboardCategory.ANSWER_RATE: ("total_questions_answered", 100, "100+ questions answered"),
}


class LeaderboardService(BaseService):
    """Service for leaderboard operations."""

    def __init__(self, client: Client):
        super().__init__(client)
        self.leaderboard_repo = LeaderboardRepository(client)

    async def get_leaderboard(
        self,
        category: LeaderboardCategory,
        limit: int = 10,
        offset: int = 0,
    ) -> LeaderboardResponse:
        """
        Get leaderboard for a category.
        
        Args:
            category: Leaderboard category
            limit: Max entries (1-100)
            offset: Pagination offset
            
        Returns:
            LeaderboardResponse with entries and metadata
        """
        # Clamp limit
        limit = max(1, min(100, limit))
        offset = max(0, offset)
        
        entries = await self.leaderboard_repo.query_leaderboard(
            category=category,
            limit=limit,
            offset=offset,
        )
        
        total = await self.leaderboard_repo.count_eligible(category)
        
        requirement = REQUIREMENTS.get(category)
        min_req_str = requirement[2] if requirement else None
        
        return LeaderboardResponse(
            category=category,
            entries=entries,
            total_eligible=total,
            page=(offset // limit) + 1,
            page_size=limit,
            minimum_requirement=min_req_str,
        )

    async def get_user_rank(
        self,
        user_id: str,
        category: LeaderboardCategory,
    ) -> UserRankResponse:
        """
        Get a user's rank in a specific category.
        
        Args:
            user_id: User UUID
            category: Leaderboard category
            
        Returns:
            UserRankResponse with rank and eligibility info
        """
        stat_value, eligible = await self.leaderboard_repo.get_user_stat_value(
            user_id, category
        )
        
        rank = None
        if eligible:
            rank = await self._calculate_rank(user_id, category, stat_value)
        
        requirement = REQUIREMENTS.get(category)
        
        return UserRankResponse(
            category=category,
            rank=rank,
            stat_value=stat_value,
            eligible=eligible,
            requirement_met=eligible,
            requirement=requirement[2] if requirement else None,
        )

    async def get_all_user_ranks(
        self,
        user_id: str,
    ) -> Dict[str, Optional[int]]:
        """
        Get user's rank in all categories.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dict mapping category name to rank (None if not eligible)
        """
        ranks = {}
        for category in LeaderboardCategory:
            response = await self.get_user_rank(user_id, category)
            ranks[category.value] = response.rank
        return ranks

    async def _calculate_rank(
        self,
        user_id: str,
        category: LeaderboardCategory,
        stat_value: float,
    ) -> Optional[int]:
        """
        Calculate user's rank by counting players with better stats.
        
        For most categories, higher is better.
        For FASTEST_THINKER, lower is better.
        """
        # Get all entries and find position
        # For efficiency, we query a reasonable chunk
        entries = await self.leaderboard_repo.query_leaderboard(
            category=category,
            limit=1000,
            offset=0,
        )
        
        for entry in entries:
            if entry.user_id == user_id:
                return entry.rank
        
        # User not in top 1000, estimate rank
        total = await self.leaderboard_repo.count_eligible(category)
        return total if total > 0 else None
