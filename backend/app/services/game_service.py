"""
Game service.
Handles game state, scoring, and orchestration.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

from supabase import Client

from app.core.config import get_settings
from app.core.exceptions import GameStateError
from app.database.repositories.game_repo import GameRepository
from app.database.repositories.user_repo import UserRepository
from app.services.base import BaseService
from app.services.question_service import QuestionService
from app.schemas.game import Question, PlayerAnswer, GameResult
from app.utils.helpers import get_timestamp_ms


settings = get_settings()


@dataclass
class PlayerGameState:
    """State for a single player in a game."""
    player_id: str
    score: int = 0
    correct_count: int = 0
    total_time_ms: int = 0  # Total time taken across all answers (for tiebreaker)
    answers: List[PlayerAnswer] = field(default_factory=list)
    current_answer: Optional[str] = None
    current_time_ms: Optional[int] = None
    is_connected: bool = True
    
    # Position tracking
    position_x: float = 0.0
    position_y: float = 0.0
    
    # Power-up inventory (max 3)
    inventory: List[str] = field(default_factory=list)
    
    # Active effects
    has_shield: bool = False
    has_double_points: bool = False
    time_penalty_ms: int = 0  # Added by opponent's time steal


@dataclass
class GameSession:
    """Active game session state (in-memory)."""
    lobby_id: str
    player1_id: str
    player2_id: str
    questions: List[Question]
    current_question: int = 0
    question_start_time: int = 0
    player_states: Dict[str, PlayerGameState] = field(default_factory=dict)
    status: str = "waiting"  # waiting, in_progress, completed
    
    def __post_init__(self):
        if not self.player_states:
            self.player_states = {
                self.player1_id: PlayerGameState(player_id=self.player1_id),
                self.player2_id: PlayerGameState(player_id=self.player2_id),
            }


class GameService(BaseService):
    """Service for game operations."""
    
    # In-memory game sessions (lobby_id -> GameSession)
    _sessions: Dict[str, GameSession] = {}

    def __init__(self, client: Client):
        super().__init__(client)
        # Use service client to bypass RLS
        from app.database.supabase_client import get_supabase_service_client
        service_client = get_supabase_service_client()
        self.game_repo = GameRepository(service_client)
        self.user_repo = UserRepository(service_client)
        self.question_service = QuestionService()

    def create_session(
        self,
        lobby_id: str,
        player1_id: str,
        player2_id: str,
        game_mode: str = "fortnite",
    ) -> GameSession:
        """
        Create a new game session.
        
        Args:
            lobby_id: Associated lobby UUID
            player1_id: First player (host) UUID
            player2_id: Second player UUID
            game_mode: Game mode for questions
            
        Returns:
            New GameSession
        """
        from app.services.powerup_service import powerup_service
        
        questions = self.question_service.load_questions(game_mode=game_mode)
        
        session = GameSession(
            lobby_id=lobby_id,
            player1_id=player1_id,
            player2_id=player2_id,
            questions=questions,
        )
        
        # Set initial spawn positions
        session.player_states[player1_id].position_x = 200.0
        session.player_states[player1_id].position_y = 300.0
        session.player_states[player2_id].position_x = 1000.0
        session.player_states[player2_id].position_y = 300.0
        
        self._sessions[lobby_id] = session
        
        # Initialize power-ups for this game
        powerup_service.initialize_for_lobby(lobby_id)
        
        return session

    def get_session(self, lobby_id: str) -> Optional[GameSession]:
        """Get active game session by lobby ID."""
        return self._sessions.get(lobby_id)

    def start_game(self, lobby_id: str) -> GameSession:
        """
        Start the game and prepare first question.
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            Updated GameSession
            
        Raises:
            GameStateError: If session not found or already started
        """
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        if session.status != "waiting":
            raise GameStateError("Game has already started")
        
        session.status = "in_progress"
        session.current_question = 1
        session.question_start_time = get_timestamp_ms()
        
        return session

    def get_current_question(self, lobby_id: str) -> Tuple[Question, int]:
        """
        Get current question for a game.
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            Tuple of (Question, question_number)
        """
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        q_index = session.current_question - 1
        if q_index < 0 or q_index >= len(session.questions):
            raise GameStateError("No more questions")
        
        return session.questions[q_index], session.current_question

    def submit_answer(
        self,
        lobby_id: str,
        player_id: str,
        q_num: int,
        answer: Optional[str],
        time_ms: int,
    ) -> PlayerAnswer:
        """
        Submit a player's answer with power-up effects.
        
        Args:
            lobby_id: Lobby UUID
            player_id: Player UUID
            q_num: Question number
            answer: Selected answer (A, B, C, D) or None for timeout
            time_ms: Time taken in milliseconds
            
        Returns:
            PlayerAnswer with score
        """
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        if player_id not in session.player_states:
            raise GameStateError("Player not in game")
        
        if q_num != session.current_question:
            raise GameStateError(f"Wrong question number. Expected {session.current_question}")
        
        player_state = session.player_states[player_id]
        
        # Get question and check answer
        question = session.questions[q_num - 1]
        is_correct = answer and self.question_service.check_answer(question, answer)
        
        # Calculate score with power-up effects
        score = self.calculate_score(
            is_correct,
            time_ms,
            has_double_points=player_state.has_double_points,
            time_penalty_ms=player_state.time_penalty_ms,
        )
        
        # Reset power-up effects after use
        player_state.has_double_points = False
        player_state.time_penalty_ms = 0
        
        # Record answer
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
        player_state.total_time_ms += time_ms  # Track total time for tiebreaker
        if is_correct:
            player_state.correct_count += 1
        player_state.current_answer = answer
        player_state.current_time_ms = time_ms
        
        return player_answer

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
        
        Args:
            is_correct: Whether answer was correct
            time_ms: Time taken in milliseconds
            has_double_points: Whether double points power-up is active
            time_penalty_ms: Time penalty from opponent's time steal
            
        Returns:
            Score (0-2000 with double points, 0-1000 otherwise)
        """
        if not is_correct:
            return 0
        
        # Adjust time for penalty
        effective_time = time_ms + time_penalty_ms
        
        # Score decreases with time: 1000 - (time_ms / 30)
        score = settings.MAX_SCORE_PER_QUESTION - (effective_time // settings.SCORE_TIME_DIVISOR)
        score = max(0, min(settings.MAX_SCORE_PER_QUESTION, score))
        
        # Apply double points
        if has_double_points:
            score *= 2
        
        return score

    def both_players_answered(self, lobby_id: str) -> bool:
        """Check if both players have answered current question."""
        session = self.get_session(lobby_id)
        if not session:
            return False
        
        q_num = session.current_question
        for player_state in session.player_states.values():
            if len(player_state.answers) < q_num:
                return False
        return True

    def advance_question(self, lobby_id: str) -> bool:
        """
        Advance to next question.
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            True if more questions, False if game over
        """
        session = self.get_session(lobby_id)
        if not session:
            return False
        
        # Clear current answers
        for player_state in session.player_states.values():
            player_state.current_answer = None
            player_state.current_time_ms = None
        
        session.current_question += 1
        session.question_start_time = get_timestamp_ms()
        
        return session.current_question <= len(session.questions)

    def get_round_result(self, lobby_id: str) -> dict:
        """Get results for current round."""
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
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

    def get_final_scores(self, lobby_id: str) -> dict:
        """Get final scores for all players."""
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        return {
            player_id: state.score
            for player_id, state in session.player_states.items()
        }

    async def end_game(self, lobby_id: str) -> GameResult:
        """
        End game and persist results.
        
        Args:
            lobby_id: Lobby UUID
            
        Returns:
            GameResult with final scores
        """
        from app.services.powerup_service import powerup_service
        
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        session.status = "completed"
        
        # Get scores and total times
        p1_state = session.player_states[session.player1_id]
        p2_state = session.player_states[session.player2_id]
        p1_score = p1_state.score
        p2_score = p2_state.score
        p1_total_time = p1_state.total_time_ms
        p2_total_time = p2_state.total_time_ms
        
        # Determine winner (tiebreaker: lower total time wins)
        if p1_score > p2_score:
            winner_id = session.player1_id
            is_tie = False
        elif p2_score > p1_score:
            winner_id = session.player2_id
            is_tie = False
        elif p1_total_time < p2_total_time:
            # Same score, but player 1 was faster
            winner_id = session.player1_id
            is_tie = False
        elif p2_total_time < p1_total_time:
            # Same score, but player 2 was faster
            winner_id = session.player2_id
            is_tie = False
        else:
            # Exact same score AND same total time (very rare)
            winner_id = None
            is_tie = True
        
        # Prepare data for persistence
        questions_data = [q.model_dump() for q in session.questions]
        answers_data = {
            player_id: [a.model_dump() for a in state.answers]
            for player_id, state in session.player_states.items()
        }
        
        # Save to database
        game_record = await self.game_repo.create_game(
            lobby_id=lobby_id,
            player1_id=session.player1_id,
            player1_score=p1_score,
            player2_id=session.player2_id,
            player2_score=p2_score,
            questions_data=questions_data,
            answers_data=answers_data,
            winner_id=winner_id,
        )
        
        # Update user stats
        await self.user_repo.update_stats(session.player1_id, games_played_delta=1, 
                                          games_won_delta=1 if winner_id == session.player1_id else 0,
                                          score_delta=p1_score)
        await self.user_repo.update_stats(session.player2_id, games_played_delta=1,
                                          games_won_delta=1 if winner_id == session.player2_id else 0,
                                          score_delta=p2_score)
        
        # Clean up power-ups
        powerup_service.cleanup_lobby(lobby_id)
        
        # Clean up session
        del self._sessions[lobby_id]
        
        # Check if winner was decided by time (scores were equal)
        won_by_time = (p1_score == p2_score) and (winner_id is not None)
        
        return GameResult(
            id=game_record["id"],
            lobby_id=lobby_id,
            winner_id=winner_id,
            player1_id=session.player1_id,
            player1_score=p1_score,
            player1_total_time_ms=p1_total_time,
            player2_id=session.player2_id,
            player2_score=p2_score,
            player2_total_time_ms=p2_total_time,
            is_tie=is_tie,
            won_by_time=won_by_time,
        )

    async def get_user_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Get game history for a user."""
        return await self.game_repo.get_user_history(user_id, limit)
