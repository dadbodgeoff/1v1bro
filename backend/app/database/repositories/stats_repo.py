"""
Stats repository.
Handles player statistics data access operations.
"""

from typing import Optional

from supabase import Client

from app.database.repositories.base import BaseRepository


class StatsRepository(BaseRepository):
    """Repository for player statistics operations."""

    def __init__(self, client: Client):
        super().__init__(client, "user_profiles")

    async def get_raw_stats(self, user_id: str) -> Optional[dict]:
        """
        Get raw stats for a user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Raw stats dict or None if not found
        """
        result = self._table().select(
            "id, display_name, avatar_url, "
            "games_played, games_won, total_score, "
            "total_questions_answered, total_correct_answers, "
            "total_answer_time_ms, fastest_answer_ms, "
            "total_kills, total_deaths, total_damage_dealt, "
            "total_damage_taken, shots_fired, shots_hit, "
            "current_win_streak, best_win_streak, "
            "total_powerups_collected"
        ).eq("id", user_id).execute()
        return result.data[0] if result.data else None

    async def increment_stats(
        self,
        user_id: str,
        games_played_delta: int = 0,
        games_won_delta: int = 0,
        score_delta: int = 0,
        questions_delta: int = 0,
        correct_delta: int = 0,
        answer_time_delta: int = 0,
        kills_delta: int = 0,
        deaths_delta: int = 0,
        damage_dealt_delta: int = 0,
        damage_taken_delta: int = 0,
        shots_fired_delta: int = 0,
        shots_hit_delta: int = 0,
        powerups_delta: int = 0,
    ) -> None:
        """
        Atomically increment player stats using stored procedure.
        
        Args:
            user_id: User UUID
            *_delta: Amount to add to each stat
        """
        self.client.rpc(
            "increment_player_stats",
            {
                "p_user_id": user_id,
                "p_games_played_delta": games_played_delta,
                "p_games_won_delta": games_won_delta,
                "p_score_delta": score_delta,
                "p_questions_delta": questions_delta,
                "p_correct_delta": correct_delta,
                "p_answer_time_delta": answer_time_delta,
                "p_kills_delta": kills_delta,
                "p_deaths_delta": deaths_delta,
                "p_damage_dealt_delta": damage_dealt_delta,
                "p_damage_taken_delta": damage_taken_delta,
                "p_shots_fired_delta": shots_fired_delta,
                "p_shots_hit_delta": shots_hit_delta,
                "p_powerups_delta": powerups_delta,
            }
        ).execute()

    async def update_win_streak(self, user_id: str, won: bool) -> None:
        """
        Update win streak using stored procedure.
        
        Args:
            user_id: User UUID
            won: Whether the player won the game
        """
        self.client.rpc(
            "update_win_streak",
            {"p_user_id": user_id, "p_won": won}
        ).execute()

    async def update_fastest_answer(self, user_id: str, time_ms: int) -> None:
        """
        Update fastest answer time if new time is faster.
        
        Args:
            user_id: User UUID
            time_ms: Answer time in milliseconds
        """
        if time_ms is None or time_ms <= 0:
            return
        self.client.rpc(
            "update_fastest_answer",
            {"p_user_id": user_id, "p_time_ms": time_ms}
        ).execute()
