"""
Scoring service.
Handles score calculation and answer processing.
"""

from typing import Optional, List

from app.core.config import get_settings
from app.schemas.game import Question, PlayerAnswer
from app.schemas.stats import TriviaStatsDelta
from app.services.question_service import QuestionService
from .session import GameSession, PlayerGameState

settings = get_settings()


class ScoringService:
    """Handles score calculation and answer processing."""
    
    def __init__(self):
        self.question_service = QuestionService()
    
    def calculate_score(
        self,
        is_correct: bool,
        time_ms: int,
        has_double_points: bool = False,
        time_penalty_ms: int = 0,
    ) -> int:
        """
        Calculate score for an answer.
        
        Formula: 1000 - (time_ms / 30) for correct, 0 for incorrect
        """
        if not is_correct:
            return 0
        
        effective_time = time_ms + time_penalty_ms
        score = settings.MAX_SCORE_PER_QUESTION - (effective_time // settings.SCORE_TIME_DIVISOR)
        score = max(0, min(settings.MAX_SCORE_PER_QUESTION, score))
        
        if has_double_points:
            score *= 2
        
        return score
    
    def process_answer(
        self,
        session: GameSession,
        player_id: str,
        q_num: int,
        answer: Optional[str],
        time_ms: int,
    ) -> PlayerAnswer:
        """Process a player's answer and update state."""
        player_state = session.player_states[player_id]
        question = session.questions[q_num - 1]
        
        is_correct = bool(answer and self.question_service.check_answer(question, answer))
        
        score = self.calculate_score(
            is_correct,
            time_ms,
            has_double_points=player_state.has_double_points,
            time_penalty_ms=player_state.time_penalty_ms,
        )
        
        # Reset power-up effects
        player_state.has_double_points = False
        player_state.time_penalty_ms = 0
        
        player_answer = PlayerAnswer(
            q_num=q_num,
            answer=answer,
            time_ms=time_ms,
            is_correct=is_correct,
            score=score,
        )
        
        # Update player state
        player_state.answers.append(player_answer)
        player_state.score += score
        player_state.total_time_ms += time_ms
        if is_correct:
            player_state.correct_count += 1
        player_state.current_answer = answer
        player_state.current_time_ms = time_ms
        
        return player_answer
    
    def both_answered(self, session: GameSession) -> bool:
        """Check if both players have answered current question."""
        q_num = session.current_question
        for player_state in session.player_states.values():
            if len(player_state.answers) < q_num:
                return False
        return True
    
    def get_round_result(self, session: GameSession) -> dict:
        """Get results for current round."""
        q_num = session.current_question
        question = session.questions[q_num - 1]
        
        scores = {}
        answers = {}
        total_scores = {}
        
        for player_id, state in session.player_states.items():
            if state.answers and len(state.answers) >= q_num:
                answer = state.answers[q_num - 1]
                scores[player_id] = answer.score
                answers[player_id] = answer.answer
            else:
                scores[player_id] = 0
                answers[player_id] = None
            total_scores[player_id] = state.score
        
        return {
            "q_num": q_num,
            "correct_answer": question.correct_answer,
            "scores": scores,
            "answers": answers,
            "total_scores": total_scores,
        }
    
    def aggregate_trivia_stats(self, answers: List[PlayerAnswer]) -> TriviaStatsDelta:
        """Aggregate trivia stats from game answers."""
        total_questions = len(answers)
        correct_answers = sum(1 for a in answers if a.is_correct)
        correct_time = sum(a.time_ms for a in answers if a.is_correct)
        
        fastest = None
        correct_times = [a.time_ms for a in answers if a.is_correct and a.time_ms > 0]
        if correct_times:
            fastest = min(correct_times)
        
        return TriviaStatsDelta(
            questions_answered=total_questions,
            correct_answers=correct_answers,
            answer_time_ms=correct_time,
            fastest_in_game=fastest,
        )
