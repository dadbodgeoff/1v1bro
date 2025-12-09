"""
Recap Schemas - Data models for post-match recap system.

Requirements: 7.1, 7.2 - Serialize all recap data to JSON format with
xp_breakdown, tier_progress, question_stats, combat_stats, and opponent_comparison.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, computed_field


class XPBreakdown(BaseModel):
    """XP earned breakdown showing all components."""
    
    total: int = Field(..., ge=0, description="Total XP earned")
    base_xp: int = Field(..., ge=0, description="Base XP (win=100, loss=50)")
    kill_bonus: int = Field(..., ge=0, description="Kill bonus (5 per kill)")
    streak_bonus: int = Field(..., ge=0, description="Streak bonus (10 per streak)")
    duration_bonus: int = Field(..., ge=0, description="Duration bonus")
    
    def validate_sum(self) -> bool:
        """Validate that total equals sum of components."""
        return self.total == self.base_xp + self.kill_bonus + self.streak_bonus + self.duration_bonus


class TierProgress(BaseModel):
    """Battle pass tier progress information."""
    
    previous_tier: int = Field(..., ge=0, description="Tier before match")
    new_tier: int = Field(..., ge=0, description="Tier after match")
    tier_advanced: bool = Field(..., description="Whether tier increased")
    current_xp: int = Field(..., ge=0, description="Current XP in tier")
    xp_to_next_tier: int = Field(..., ge=0, description="XP required for next tier")
    new_claimable_rewards: List[int] = Field(default_factory=list, description="New tiers with claimable rewards")


class QuestionStats(BaseModel):
    """Question/trivia performance statistics."""
    
    correct_count: int = Field(..., ge=0, description="Number of correct answers")
    total_questions: int = Field(..., ge=1, description="Total questions in match")
    accuracy_percent: float = Field(..., ge=0, le=100, description="Accuracy percentage")
    avg_answer_time_ms: int = Field(..., ge=0, description="Average answer time in ms")
    fastest_answer_ms: int = Field(..., ge=0, description="Fastest answer time in ms")
    
    @computed_field
    @property
    def is_perfect(self) -> bool:
        """Check if player achieved perfect accuracy."""
        return self.correct_count == self.total_questions


class CombatStats(BaseModel):
    """Combat/arena performance statistics."""
    
    kills: int = Field(..., ge=0, description="Total kills")
    deaths: int = Field(..., ge=0, description="Total deaths")
    kd_ratio: float = Field(..., ge=0, description="Kill/death ratio")
    max_streak: int = Field(..., ge=0, description="Maximum kill streak")
    shots_fired: int = Field(..., ge=0, description="Total shots fired")
    shots_hit: int = Field(..., ge=0, description="Total shots that hit")
    shot_accuracy: float = Field(..., ge=0, le=100, description="Shot accuracy percentage")


class OpponentData(BaseModel):
    """Opponent information for comparison display."""
    
    id: str = Field(..., description="Opponent user ID")
    display_name: str = Field(..., description="Opponent display name")
    avatar_url: Optional[str] = Field(None, description="Opponent avatar URL")
    final_score: int = Field(..., ge=0, description="Opponent final score")
    accuracy_percent: float = Field(..., ge=0, le=100, description="Opponent accuracy")
    kd_ratio: float = Field(..., ge=0, description="Opponent K/D ratio")


class RecapPayload(BaseModel):
    """
    Complete recap payload for a single player.
    
    Contains all match statistics for display on the results screen
    and persistence in match history.
    """
    
    # Match result
    winner_id: Optional[str] = Field(None, description="Winner user ID or None for tie")
    is_tie: bool = Field(..., description="Whether match ended in tie")
    won_by_time: bool = Field(False, description="Whether tie was broken by time")
    
    # Player statistics
    xp_breakdown: XPBreakdown = Field(..., description="XP earned breakdown")
    tier_progress: TierProgress = Field(..., description="Battle pass tier progress")
    question_stats: QuestionStats = Field(..., description="Trivia performance stats")
    combat_stats: CombatStats = Field(..., description="Combat performance stats")
    
    # Opponent data for comparison
    opponent: OpponentData = Field(..., description="Opponent data for comparison")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "winner_id": "user-123",
                "is_tie": False,
                "won_by_time": False,
                "xp_breakdown": {
                    "total": 150,
                    "base_xp": 100,
                    "kill_bonus": 25,
                    "streak_bonus": 20,
                    "duration_bonus": 5
                },
                "tier_progress": {
                    "previous_tier": 5,
                    "new_tier": 5,
                    "tier_advanced": False,
                    "current_xp": 750,
                    "xp_to_next_tier": 1000,
                    "new_claimable_rewards": []
                },
                "question_stats": {
                    "correct_count": 11,
                    "total_questions": 15,
                    "accuracy_percent": 73.3,
                    "avg_answer_time_ms": 4200,
                    "fastest_answer_ms": 1500
                },
                "combat_stats": {
                    "kills": 5,
                    "deaths": 3,
                    "kd_ratio": 1.67,
                    "max_streak": 3,
                    "shots_fired": 45,
                    "shots_hit": 28,
                    "shot_accuracy": 62.2
                },
                "opponent": {
                    "id": "user-456",
                    "display_name": "Player2",
                    "avatar_url": None,
                    "final_score": 8,
                    "accuracy_percent": 53.3,
                    "kd_ratio": 0.6
                }
            }
        }
