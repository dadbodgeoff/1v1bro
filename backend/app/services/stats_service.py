"""
Stats service.
Handles player statistics business logic and computed fields.
"""

from typing import Optional

from supabase import Client

from app.database.repositories.stats_repo import StatsRepository
from app.schemas.stats import (
    PlayerStats, TriviaStats, CombatStats, StreakStats,
    TriviaStatsDelta, GameCombatSummary,
)
from app.services.base import BaseService


class StatsService(BaseService):
    """Service for player statistics operations."""

    def __init__(self, client: Client):
        super().__init__(client)
        self.stats_repo = StatsRepository(client)

    async def get_user_stats(self, user_id: str) -> Optional[PlayerStats]:
        """
        Get complete stats for a user with computed fields.
        
        Args:
            user_id: User UUID
            
        Returns:
            PlayerStats with computed fields or None if not found
        """
        raw = await self.stats_repo.get_raw_stats(user_id)
        if not raw:
            return None
        return self._compute_derived_stats(raw)

    async def update_game_stats(
        self,
        user_id: str,
        game_won: bool,
        trivia_stats: TriviaStatsDelta,
        combat_stats: GameCombatSummary,
        score_delta: int = 0,
    ) -> None:
        """
        Update all stats after a game ends.
        
        Args:
            user_id: User UUID
            game_won: Whether the player won
            trivia_stats: Trivia stats from the game
            combat_stats: Combat stats from the game
            score_delta: Score earned in the game
        """
        # Increment all stats atomically
        await self.stats_repo.increment_stats(
            user_id=user_id,
            games_played_delta=1,
            games_won_delta=1 if game_won else 0,
            score_delta=score_delta,
            questions_delta=trivia_stats.questions_answered,
            correct_delta=trivia_stats.correct_answers,
            answer_time_delta=trivia_stats.answer_time_ms,
            kills_delta=combat_stats.kills,
            deaths_delta=combat_stats.deaths,
            damage_dealt_delta=combat_stats.damage_dealt,
            damage_taken_delta=combat_stats.damage_taken,
            shots_fired_delta=combat_stats.shots_fired,
            shots_hit_delta=combat_stats.shots_hit,
            powerups_delta=combat_stats.powerups_collected,
        )
        
        # Update win streak
        await self.stats_repo.update_win_streak(user_id, game_won)
        
        # Update fastest answer if applicable
        if trivia_stats.fastest_in_game:
            await self.stats_repo.update_fastest_answer(
                user_id, trivia_stats.fastest_in_game
            )

    def _compute_derived_stats(self, raw: dict) -> PlayerStats:
        """
        Compute derived statistics from raw database values.
        
        Args:
            raw: Raw stats dict from database
            
        Returns:
            PlayerStats with computed fields
        """
        games_played = raw.get("games_played", 0)
        games_won = raw.get("games_won", 0)
        
        # Win rate
        win_rate = (games_won / games_played * 100) if games_played > 0 else 0.0
        
        # K/D ratio
        kills = raw.get("total_kills", 0)
        deaths = raw.get("total_deaths", 0)
        kd_ratio = kills if deaths == 0 else (kills / deaths)
        
        # Accuracy
        shots_fired = raw.get("shots_fired", 0)
        shots_hit = raw.get("shots_hit", 0)
        accuracy = (shots_hit / shots_fired * 100) if shots_fired > 0 else 0.0
        
        # Answer stats
        correct = raw.get("total_correct_answers", 0)
        total_q = raw.get("total_questions_answered", 0)
        total_time = raw.get("total_answer_time_ms", 0)
        
        answer_rate = (correct / total_q * 100) if total_q > 0 else 0.0
        avg_time = (total_time / correct) if correct > 0 else 0.0
        
        return PlayerStats(
            user_id=raw["id"],
            display_name=raw.get("display_name"),
            avatar_url=raw.get("avatar_url"),
            games_played=games_played,
            games_won=games_won,
            total_score=raw.get("total_score", 0),
            win_rate=round(win_rate, 2),
            trivia=TriviaStats(
                total_questions_answered=total_q,
                total_correct_answers=correct,
                total_answer_time_ms=total_time,
                fastest_answer_ms=raw.get("fastest_answer_ms"),
                answer_rate=round(answer_rate, 2),
                avg_answer_time_ms=round(avg_time, 2),
            ),
            combat=CombatStats(
                total_kills=kills,
                total_deaths=deaths,
                total_damage_dealt=raw.get("total_damage_dealt", 0),
                total_damage_taken=raw.get("total_damage_taken", 0),
                shots_fired=shots_fired,
                shots_hit=shots_hit,
                kd_ratio=round(kd_ratio, 2),
                accuracy_pct=round(accuracy, 2),
            ),
            streaks=StreakStats(
                current_win_streak=raw.get("current_win_streak", 0),
                best_win_streak=raw.get("best_win_streak", 0),
            ),
            total_powerups_collected=raw.get("total_powerups_collected", 0),
        )
