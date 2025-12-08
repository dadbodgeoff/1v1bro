"""
Game schemas.
"""

from typing import Any, Optional

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampMixin


class Question(BaseSchema):
    """Full question schema (server-side, includes correct answer)."""

    id: int = Field(..., description="Question ID")
    text: str = Field(..., description="Question text")
    options: list[str] = Field(..., min_length=4, max_length=4, description="Answer options")
    correct_answer: str = Field(..., description="Correct answer (A, B, C, or D)")
    category: Optional[str] = Field(None, description="Question category")
    difficulty: Optional[str] = Field(None, description="Question difficulty")


class QuestionPublic(BaseSchema):
    """Public question schema (sent to clients, no correct answer)."""

    q_num: int = Field(..., ge=1, le=15, description="Question number (1-15)")
    text: str = Field(..., description="Question text")
    options: list[str] = Field(..., min_length=4, max_length=4, description="Answer options")


class PlayerAnswer(BaseSchema):
    """Schema for a player's answer to a question."""

    q_num: int = Field(..., ge=1, le=15, description="Question number")
    answer: Optional[str] = Field(None, description="Selected answer (A, B, C, D, or None for timeout)")
    time_ms: int = Field(..., ge=0, le=30000, description="Time taken in milliseconds")
    is_correct: bool = Field(default=False, description="Whether answer was correct")
    score: int = Field(default=0, ge=0, le=1000, description="Points earned")


class PlayerScore(BaseSchema):
    """Schema for player score information."""

    player_id: str = Field(..., description="Player UUID")
    score: int = Field(default=0, description="Current total score")
    correct_count: int = Field(default=0, description="Number of correct answers")
    answers: list[PlayerAnswer] = Field(default_factory=list, description="All answers")


class GameState(BaseSchema):
    """Schema for current game state."""

    lobby_id: str = Field(..., description="Associated lobby UUID")
    current_question: int = Field(default=0, ge=0, le=15, description="Current question number")
    total_questions: int = Field(default=15, description="Total questions in game")
    scores: dict[str, int] = Field(default_factory=dict, description="Player ID to score mapping")
    status: str = Field(..., description="Game status")
    time_remaining_ms: Optional[int] = Field(None, description="Time remaining for current question")


class RoundResult(BaseSchema):
    """Schema for round result after both players answer."""

    q_num: int = Field(..., description="Question number")
    correct_answer: str = Field(..., description="The correct answer")
    player_answers: dict[str, Optional[str]] = Field(..., description="Player ID to answer mapping")
    player_scores: dict[str, int] = Field(..., description="Points earned this round")
    total_scores: dict[str, int] = Field(..., description="Running total scores")


class GameResult(BaseSchema, TimestampMixin):
    """Schema for completed game result."""

    id: str = Field(..., description="Game UUID")
    lobby_id: str = Field(..., description="Associated lobby UUID")
    winner_id: Optional[str] = Field(None, description="Winner UUID (None for tie)")
    player1_id: str = Field(..., description="Player 1 UUID")
    player1_score: int = Field(..., description="Player 1 final score")
    player1_total_time_ms: int = Field(default=0, description="Player 1 total answer time in ms")
    player2_id: str = Field(..., description="Player 2 UUID")
    player2_score: int = Field(..., description="Player 2 final score")
    player2_total_time_ms: int = Field(default=0, description="Player 2 total answer time in ms")
    is_tie: bool = Field(default=False, description="Whether game ended in tie")
    won_by_time: bool = Field(default=False, description="Whether winner was decided by faster time")
    questions_data: Optional[list[dict]] = Field(None, description="Questions used")
    answers_data: Optional[dict[str, list]] = Field(None, description="Player answers")
    # XP results for both players (UNIFIED PROGRESSION)
    xp_results: Optional[dict[str, dict]] = Field(None, description="XP award results keyed by player_id")


class GameHistoryItem(BaseSchema, TimestampMixin):
    """Schema for game history list item."""

    id: str
    opponent_id: str
    opponent_name: Optional[str] = None
    opponent_avatar_url: Optional[str] = None  # NEW: Opponent's avatar from user_profiles
    my_score: int
    opponent_score: int
    won: bool
    is_tie: bool = False
    elo_change: int = 0  # NEW: ELO change from match_results table
