"""
RecapBuilder Service - Builds comprehensive recap payloads from match data.

Requirements: 2.2, 4.2, 5.2 - Calculate XP breakdown, question accuracy, and combat stats.
"""

import logging
from typing import Dict, Optional, Any

from app.schemas.recap import (
    XPBreakdown,
    TierProgress,
    QuestionStats,
    CombatStats,
    OpponentData,
    RecapPayload,
)
from app.schemas.battlepass import XPAwardResult

logger = logging.getLogger(__name__)


class RecapBuilder:
    """Builds comprehensive recap payloads from match data."""
    
    def build_recap(
        self,
        player_id: str,
        session: Any,  # GameSession
        xp_result: Optional[XPAwardResult],
        combat_tracker_stats: Dict,
        opponent_id: str,
        opponent_name: str,
        opponent_avatar: Optional[str],
        opponent_score: int,
        opponent_combat_stats: Dict,
        winner_id: Optional[str],
        is_tie: bool,
        won_by_time: bool,
    ) -> RecapPayload:
        """
        Build complete recap for a single player.
        
        Args:
            player_id: The player this recap is for
            session: Game session with question/answer data
            xp_result: XP award result from BattlePassService
            combat_tracker_stats: Combat stats for this player
            opponent_id: Opponent's user ID
            opponent_name: Opponent's display name
            opponent_avatar: Opponent's avatar URL
            opponent_score: Opponent's final score
            opponent_combat_stats: Combat stats for opponent
            winner_id: Winner's user ID or None for tie
            is_tie: Whether match ended in tie
            won_by_time: Whether tie was broken by time
            
        Returns:
            Complete RecapPayload for the player
        """
        # Build XP breakdown
        xp_breakdown = self._build_xp_breakdown(xp_result)
        
        # Build tier progress
        tier_progress = self._build_tier_progress(xp_result)
        
        # Calculate question stats from session
        question_stats = self.calculate_question_stats(session, player_id)
        
        # Calculate combat stats
        combat_stats = self.calculate_combat_stats(combat_tracker_stats)
        
        # Build opponent data
        opponent_question_stats = self.calculate_question_stats(session, opponent_id)
        opponent_combat = self.calculate_combat_stats(opponent_combat_stats)
        
        opponent = OpponentData(
            id=opponent_id,
            display_name=opponent_name,
            avatar_url=opponent_avatar,
            final_score=opponent_score,
            accuracy_percent=opponent_question_stats.accuracy_percent,
            kd_ratio=opponent_combat.kd_ratio,
        )
        
        return RecapPayload(
            winner_id=winner_id,
            is_tie=is_tie,
            won_by_time=won_by_time,
            xp_breakdown=xp_breakdown,
            tier_progress=tier_progress,
            question_stats=question_stats,
            combat_stats=combat_stats,
            opponent=opponent,
        )
    
    def _build_xp_breakdown(self, xp_result: Optional[XPAwardResult]) -> XPBreakdown:
        """Build XP breakdown from XP award result."""
        if not xp_result:
            return XPBreakdown(
                total=0,
                base_xp=0,
                kill_bonus=0,
                streak_bonus=0,
                duration_bonus=0,
            )
        
        # Extract calculation details if available
        calc = xp_result.calculation if hasattr(xp_result, 'calculation') and xp_result.calculation else {}
        
        base_xp = calc.get('base_xp', 0)
        kill_bonus = calc.get('kill_bonus', 0)
        streak_bonus = calc.get('streak_bonus', 0)
        duration_bonus = calc.get('duration_bonus', 0)
        
        # If calculation not available, estimate from total
        if not calc:
            base_xp = 100 if xp_result.xp_awarded >= 100 else 50
            remaining = xp_result.xp_awarded - base_xp
            kill_bonus = min(remaining, 50)
            remaining -= kill_bonus
            streak_bonus = min(remaining, 30)
            duration_bonus = max(0, remaining - streak_bonus)
        
        total = base_xp + kill_bonus + streak_bonus + duration_bonus
        
        return XPBreakdown(
            total=total,
            base_xp=base_xp,
            kill_bonus=kill_bonus,
            streak_bonus=streak_bonus,
            duration_bonus=duration_bonus,
        )
    
    def _build_tier_progress(self, xp_result: Optional[XPAwardResult]) -> TierProgress:
        """Build tier progress from XP award result."""
        if not xp_result:
            return TierProgress(
                previous_tier=1,
                new_tier=1,
                tier_advanced=False,
                current_xp=0,
                xp_to_next_tier=1000,
                new_claimable_rewards=[],
            )
        
        return TierProgress(
            previous_tier=xp_result.previous_tier,
            new_tier=xp_result.new_tier,
            tier_advanced=xp_result.tier_advanced,
            current_xp=xp_result.new_total_xp % 1000,  # XP within current tier
            xp_to_next_tier=1000,  # Default XP per tier
            new_claimable_rewards=xp_result.new_claimable_rewards if hasattr(xp_result, 'new_claimable_rewards') else [],
        )
    
    def calculate_question_stats(
        self,
        session: Any,  # GameSession
        player_id: str,
    ) -> QuestionStats:
        """
        Calculate question accuracy and timing stats from session.
        
        Requirements: 4.2 - accuracy_percent = (correct_count / total_questions) * 100
        """
        if not session or not hasattr(session, 'player_states'):
            return QuestionStats(
                correct_count=0,
                total_questions=15,
                accuracy_percent=0.0,
                avg_answer_time_ms=0,
                fastest_answer_ms=0,
            )
        
        player_state = session.player_states.get(player_id)
        if not player_state:
            return QuestionStats(
                correct_count=0,
                total_questions=15,
                accuracy_percent=0.0,
                avg_answer_time_ms=0,
                fastest_answer_ms=0,
            )
        
        # Get answers list - these are PlayerAnswer objects with is_correct, time_ms, etc.
        answers = player_state.answers if hasattr(player_state, 'answers') else []
        questions = session.questions if hasattr(session, 'questions') else []
        
        # Count correct answers from PlayerAnswer.is_correct
        correct_count = sum(1 for a in answers if hasattr(a, 'is_correct') and a.is_correct)
        
        # Get answer times from PlayerAnswer.time_ms
        answer_times = [a.time_ms for a in answers if hasattr(a, 'time_ms') and a.time_ms and a.time_ms > 0]
        
        total_questions = len(questions) if questions else 15
        accuracy_percent = (correct_count / total_questions) * 100 if total_questions > 0 else 0.0
        avg_answer_time_ms = int(sum(answer_times) / len(answer_times)) if answer_times else 0
        fastest_answer_ms = min(answer_times) if answer_times else 0
        
        return QuestionStats(
            correct_count=correct_count,
            total_questions=total_questions,
            accuracy_percent=round(accuracy_percent, 1),
            avg_answer_time_ms=avg_answer_time_ms,
            fastest_answer_ms=fastest_answer_ms,
        )
    
    def calculate_combat_stats(
        self,
        combat_data: Dict,
    ) -> CombatStats:
        """
        Calculate K/D ratio and combat metrics from combat tracker data.
        
        Requirements: 5.2 - kd_ratio = kills / deaths (when deaths > 0)
        Requirements: 5.4 - shot_accuracy = (shots_hit / shots_fired) * 100
        """
        if not combat_data:
            return CombatStats(
                kills=0,
                deaths=0,
                kd_ratio=0.0,
                max_streak=0,
                shots_fired=0,
                shots_hit=0,
                shot_accuracy=0.0,
            )
        
        kills = combat_data.get('kills', 0)
        deaths = combat_data.get('deaths', 0)
        max_streak = combat_data.get('max_streak', 0)
        shots_fired = combat_data.get('shots_fired', 0)
        shots_hit = combat_data.get('shots_hit', 0)
        
        # Calculate K/D ratio (avoid division by zero)
        kd_ratio = kills / deaths if deaths > 0 else float(kills) if kills > 0 else 0.0
        
        # Calculate shot accuracy (avoid division by zero)
        shot_accuracy = (shots_hit / shots_fired) * 100 if shots_fired > 0 else 0.0
        
        return CombatStats(
            kills=kills,
            deaths=deaths,
            kd_ratio=round(kd_ratio, 2),
            max_streak=max_streak,
            shots_fired=shots_fired,
            shots_hit=shots_hit,
            shot_accuracy=round(shot_accuracy, 1),
        )
