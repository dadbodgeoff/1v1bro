"""
Player statistics schemas.
Defines data models for trivia, combat, and streak statistics.
"""

from typing import Optional

from app.schemas.base import BaseSchema


class TriviaStats(BaseSchema):
    """Trivia-related statistics."""
    total_questions_answered: int = 0
    total_correct_answers: int = 0
    total_answer_time_ms: int = 0
    fastest_answer_ms: Optional[int] = None
    # Computed fields
    answer_rate: float = 0.0
    avg_answer_time_ms: float = 0.0


class CombatStats(BaseSchema):
    """Combat-related statistics."""
    total_kills: int = 0
    total_deaths: int = 0
    total_damage_dealt: int = 0
    total_damage_taken: int = 0
    shots_fired: int = 0
    shots_hit: int = 0
    # Computed fields
    kd_ratio: float = 0.0
    accuracy_pct: float = 0.0


class StreakStats(BaseSchema):
    """Win streak statistics."""
    current_win_streak: int = 0
    best_win_streak: int = 0


class PlayerStats(BaseSchema):
    """Complete player statistics."""
    user_id: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Core stats
    games_played: int = 0
    games_won: int = 0
    total_score: int = 0
    win_rate: float = 0.0
    
    # Extended stats
    trivia: TriviaStats
    combat: CombatStats
    streaks: StreakStats
    total_powerups_collected: int = 0


class GameCombatSummary(BaseSchema):
    """Combat stats for a single game."""
    kills: int = 0
    deaths: int = 0
    damage_dealt: int = 0
    damage_taken: int = 0
    shots_fired: int = 0
    shots_hit: int = 0
    powerups_collected: int = 0


class TriviaStatsDelta(BaseSchema):
    """Delta values for trivia stats update."""
    questions_answered: int = 0
    correct_answers: int = 0
    answer_time_ms: int = 0
    fastest_in_game: Optional[int] = None


class StatsUpdateRequest(BaseSchema):
    """Request to update player stats after a game."""
    trivia_delta: Optional[TriviaStatsDelta] = None
    combat_delta: Optional[GameCombatSummary] = None
    game_won: bool = False
    score_delta: int = 0
