"""
Leaderboard repository.
Handles leaderboard query operations using stored procedures.
"""

from typing import List, Optional, Tuple

from supabase import Client

from app.database.repositories.base import BaseRepository
from app.schemas.leaderboard import LeaderboardCategory, LeaderboardEntry


# Map category to RPC function name and secondary label
CATEGORY_CONFIG = {
    LeaderboardCategory.WINS: ("get_leaderboard_wins", "games played"),
    LeaderboardCategory.WIN_RATE: ("get_leaderboard_win_rate", "games played"),
    LeaderboardCategory.TOTAL_SCORE: ("get_leaderboard_total_score", "games played"),
    LeaderboardCategory.KILLS: ("get_leaderboard_kills", "deaths"),
    LeaderboardCategory.KD_RATIO: ("get_leaderboard_kd_ratio", "total kills"),
    LeaderboardCategory.ACCURACY: ("get_leaderboard_accuracy", "shots fired"),
    LeaderboardCategory.FASTEST_THINKER: ("get_leaderboard_fastest_thinker", "correct answers"),
    LeaderboardCategory.ANSWER_RATE: ("get_leaderboard_answer_rate", "questions answered"),
    LeaderboardCategory.WIN_STREAK: ("get_leaderboard_win_streak", "current streak"),
}


class LeaderboardRepository(BaseRepository):
    """Repository for leaderboard queries."""

    def __init__(self, client: Client):
        super().__init__(client, "user_profiles")

    async def query_leaderboard(
        self,
        category: LeaderboardCategory,
        limit: int = 10,
        offset: int = 0,
    ) -> List[LeaderboardEntry]:
        """
        Query leaderboard for a category using stored procedure.
        
        Args:
            category: Leaderboard category
            limit: Max entries to return
            offset: Pagination offset
            
        Returns:
            List of LeaderboardEntry
        """
        rpc_name, secondary_label = CATEGORY_CONFIG[category]
        
        result = self.client.rpc(
            rpc_name,
            {"p_limit": limit, "p_offset": offset}
        ).execute()
        
        entries = []
        for row in result.data or []:
            entries.append(LeaderboardEntry(
                rank=row["rank"],
                user_id=str(row["user_id"]),
                display_name=row.get("display_name"),
                avatar_url=row.get("avatar_url"),
                stat_value=float(row["stat_value"]),
                secondary_stat=float(row["secondary_stat"]) if row.get("secondary_stat") else None,
                secondary_label=secondary_label,
            ))
        return entries

    async def count_eligible(self, category: LeaderboardCategory) -> int:
        """
        Count eligible players for a leaderboard category.
        
        Args:
            category: Leaderboard category
            
        Returns:
            Count of eligible players
        """
        # Use category-specific WHERE clauses
        query = self._table().select("id", count="exact")
        
        if category == LeaderboardCategory.WINS:
            query = query.gt("games_played", 0)
        elif category == LeaderboardCategory.WIN_RATE:
            query = query.gte("games_played", 10)
        elif category == LeaderboardCategory.TOTAL_SCORE:
            query = query.gt("total_score", 0)
        elif category == LeaderboardCategory.KILLS:
            query = query.gt("total_kills", 0)
        elif category == LeaderboardCategory.KD_RATIO:
            query = query.gte("total_deaths", 10)
        elif category == LeaderboardCategory.ACCURACY:
            query = query.gte("shots_fired", 100)
        elif category == LeaderboardCategory.FASTEST_THINKER:
            query = query.gte("total_correct_answers", 50)
        elif category == LeaderboardCategory.ANSWER_RATE:
            query = query.gte("total_questions_answered", 100)
        elif category == LeaderboardCategory.WIN_STREAK:
            query = query.gt("best_win_streak", 0)
        
        result = query.execute()
        return result.count or 0

    async def get_user_stat_value(
        self,
        user_id: str,
        category: LeaderboardCategory,
    ) -> Tuple[float, bool]:
        """
        Get a user's stat value for a category.
        
        Args:
            user_id: User UUID
            category: Leaderboard category
            
        Returns:
            Tuple of (stat_value, is_eligible)
        """
        raw = await self.get_raw_stats_for_rank(user_id)
        if not raw:
            return 0.0, False
        
        return self._compute_stat_and_eligibility(raw, category)

    async def get_raw_stats_for_rank(self, user_id: str) -> Optional[dict]:
        """Get raw stats needed for rank calculation."""
        result = self._table().select(
            "games_played, games_won, total_score, "
            "total_kills, total_deaths, shots_fired, shots_hit, "
            "total_correct_answers, total_questions_answered, "
            "total_answer_time_ms, best_win_streak"
        ).eq("id", user_id).execute()
        return result.data[0] if result.data else None

    def _compute_stat_and_eligibility(
        self,
        raw: dict,
        category: LeaderboardCategory,
    ) -> Tuple[float, bool]:
        """Compute stat value and eligibility from raw data."""
        games_played = raw.get("games_played", 0)
        games_won = raw.get("games_won", 0)
        total_score = raw.get("total_score", 0)
        kills = raw.get("total_kills", 0)
        deaths = raw.get("total_deaths", 0)
        shots_fired = raw.get("shots_fired", 0)
        shots_hit = raw.get("shots_hit", 0)
        correct = raw.get("total_correct_answers", 0)
        questions = raw.get("total_questions_answered", 0)
        answer_time = raw.get("total_answer_time_ms", 0)
        best_streak = raw.get("best_win_streak", 0)
        
        if category == LeaderboardCategory.WINS:
            return float(games_won), games_played > 0
        elif category == LeaderboardCategory.WIN_RATE:
            rate = (games_won / games_played * 100) if games_played > 0 else 0
            return round(rate, 2), games_played >= 10
        elif category == LeaderboardCategory.TOTAL_SCORE:
            return float(total_score), total_score > 0
        elif category == LeaderboardCategory.KILLS:
            return float(kills), kills > 0
        elif category == LeaderboardCategory.KD_RATIO:
            kd = kills if deaths == 0 else (kills / deaths)
            return round(kd, 2), deaths >= 10
        elif category == LeaderboardCategory.ACCURACY:
            acc = (shots_hit / shots_fired * 100) if shots_fired > 0 else 0
            return round(acc, 2), shots_fired >= 100
        elif category == LeaderboardCategory.FASTEST_THINKER:
            avg = (answer_time / correct) if correct > 0 else 0
            return round(avg, 0), correct >= 50
        elif category == LeaderboardCategory.ANSWER_RATE:
            rate = (correct / questions * 100) if questions > 0 else 0
            return round(rate, 2), questions >= 100
        elif category == LeaderboardCategory.WIN_STREAK:
            return float(best_streak), best_streak > 0
        
        return 0.0, False
