"""
Quiz Rewards - Dispatches combat buffs based on quiz performance.

Integrates quiz answers with the buff system for combat advantages.
All values tuned for fair gameplay - buffs are short and modest.
"""

from dataclasses import dataclass
from typing import Optional, Tuple
from .buffs import BuffManager, BuffType


@dataclass(frozen=True)
class QuizRewardConfig:
    """
    Tunable reward values.
    
    Balance notes:
    - Base TTK is ~1.3s (4 shots at 3/sec)
    - Damage boost reduces to ~1.1s (3.3 shots) - noticeable but not oppressive
    - Vulnerability increases to ~1.2s against you - less punishing than boost is rewarding
    - Speed boost helps positioning, doesn't affect TTK directly
    - All durations SHORT to prevent snowballing
    """
    # Fast correct answer (top 33% response time)
    fast_correct_buff: BuffType = BuffType.DAMAGE_BOOST
    fast_correct_value: float = 0.20  # +20% damage
    fast_correct_duration: float = 4.0  # seconds
    fast_threshold_percent: float = 0.33  # Top 33% of time = "fast"
    
    # Normal correct answer
    correct_buff: BuffType = BuffType.SPEED_BOOST
    correct_value: float = 0.15  # +15% speed
    correct_duration: float = 3.0  # seconds
    
    # Wrong/timeout answer
    wrong_buff: BuffType = BuffType.VULNERABILITY
    wrong_value: float = 0.15  # +15% damage taken
    wrong_duration: float = 2.0  # seconds (shorter - less punishing)


# Default config - can be overridden for testing/balancing
DEFAULT_REWARD_CONFIG = QuizRewardConfig()


class QuizRewardDispatcher:
    """
    Dispatches combat buffs based on quiz answer results.
    
    Called by quiz handler after each round result.
    """
    
    def __init__(
        self,
        buff_manager: BuffManager,
        config: QuizRewardConfig = DEFAULT_REWARD_CONFIG,
    ):
        self.buff_manager = buff_manager
        self.config = config
    
    def dispatch_reward(
        self,
        player_id: str,
        is_correct: bool,
        time_ms: int,
        question_time_ms: int,
    ) -> Optional[Tuple[BuffType, float, float]]:
        """
        Dispatch appropriate buff based on answer.
        
        Args:
            player_id: Player to reward/punish
            is_correct: Whether answer was correct
            time_ms: Time taken to answer
            question_time_ms: Total time allowed
            
        Returns:
            Tuple of (buff_type, value, duration) if buff applied, None otherwise
        """
        if is_correct:
            # Check if "fast" answer
            time_percent = time_ms / question_time_ms
            if time_percent <= self.config.fast_threshold_percent:
                # Fast correct - damage boost
                self.buff_manager.apply_buff(
                    player_id=player_id,
                    buff_type=self.config.fast_correct_buff,
                    value=self.config.fast_correct_value,
                    duration_s=self.config.fast_correct_duration,
                    source="quiz_fast_correct",
                )
                return (
                    self.config.fast_correct_buff,
                    self.config.fast_correct_value,
                    self.config.fast_correct_duration,
                )
            else:
                # Normal correct - speed boost
                self.buff_manager.apply_buff(
                    player_id=player_id,
                    buff_type=self.config.correct_buff,
                    value=self.config.correct_value,
                    duration_s=self.config.correct_duration,
                    source="quiz_correct",
                )
                return (
                    self.config.correct_buff,
                    self.config.correct_value,
                    self.config.correct_duration,
                )
        else:
            # Wrong or timeout - vulnerability
            self.buff_manager.apply_buff(
                player_id=player_id,
                buff_type=self.config.wrong_buff,
                value=self.config.wrong_value,
                duration_s=self.config.wrong_duration,
                source="quiz_wrong",
            )
            return (
                self.config.wrong_buff,
                self.config.wrong_value,
                self.config.wrong_duration,
            )
    
    def dispatch_for_round(
        self,
        round_result: dict,
        question_time_ms: int,
    ) -> dict:
        """
        Dispatch rewards for all players in a round.
        
        Args:
            round_result: Dict with 'answers', 'scores' by player_id
            question_time_ms: Total time allowed per question
            
        Returns:
            Dict of player_id -> reward info for broadcast
        """
        rewards = {}
        
        answers = round_result.get("answers", {})
        scores = round_result.get("scores", {})
        
        for player_id in answers.keys():
            answer = answers.get(player_id)
            score = scores.get(player_id, 0)
            
            # Score > 0 means correct
            is_correct = score > 0
            
            # Estimate time from score (score = 1000 - time_ms/30)
            # So time_ms = (1000 - score) * 30
            if is_correct and score > 0:
                time_ms = (1000 - score) * 30
            else:
                time_ms = question_time_ms  # Timeout or wrong
            
            result = self.dispatch_reward(
                player_id=player_id,
                is_correct=is_correct,
                time_ms=time_ms,
                question_time_ms=question_time_ms,
            )
            
            if result:
                buff_type, value, duration = result
                rewards[player_id] = {
                    "buff_type": buff_type.value,
                    "value": value,
                    "duration": duration,
                    "is_correct": is_correct,
                }
        
        return rewards
