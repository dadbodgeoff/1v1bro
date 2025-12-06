"""
Game service - Facade for game operations.
Coordinates session, scoring, and persistence services.
"""

from typing import List, Optional, Tuple

from supabase import Client

from app.core.exceptions import GameStateError
from app.services.base import BaseService
from app.services.question_service import QuestionService
from app.schemas.game import Question, PlayerAnswer, GameResult
from app.utils.helpers import get_timestamp_ms
from app.utils.combat_tracker import CombatTracker

from .session import SessionManager, GameSession
from .scoring import ScoringService
from .persistence import GamePersistenceService


class GameService(BaseService):
    """
    Facade service for game operations.
    
    Delegates to:
    - SessionManager: In-memory session state
    - ScoringService: Score calculation
    - GamePersistenceService: Database operations
    """

    def __init__(self, client: Client):
        super().__init__(client)
        self.question_service = QuestionService()
        self.scoring = ScoringService()
        self.persistence = GamePersistenceService(client)

    def create_session(
        self,
        lobby_id: str,
        player1_id: str,
        player2_id: str,
        game_mode: str = "fortnite",
    ) -> GameSession:
        """Create a new game session."""
        from app.services.powerup_service import powerup_service
        
        questions = self.question_service.load_questions(game_mode=game_mode)
        
        session = SessionManager.create(
            lobby_id=lobby_id,
            player1_id=player1_id,
            player2_id=player2_id,
            questions=questions,
        )
        
        powerup_service.initialize_for_lobby(lobby_id)
        CombatTracker.initialize(lobby_id, [player1_id, player2_id])
        
        return session

    def get_session(self, lobby_id: str) -> Optional[GameSession]:
        """Get active game session by lobby ID."""
        return SessionManager.get(lobby_id)

    def start_game(self, lobby_id: str) -> GameSession:
        """Start the game and prepare first question."""
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        if session.status != "waiting":
            raise GameStateError("Game has already started")
        
        session.status = "in_progress"
        session.current_question = 1
        session.question_start_time = get_timestamp_ms()
        
        return session

    def get_current_question(self, lobby_id: str) -> Tuple[Question, int]:
        """Get current question for a game."""
        session = SessionManager.get(lobby_id)
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
        """Submit a player's answer."""
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        if player_id not in session.player_states:
            raise GameStateError("Player not in game")
        
        if q_num != session.current_question:
            raise GameStateError(f"Wrong question number. Expected {session.current_question}")
        
        return self.scoring.process_answer(session, player_id, q_num, answer, time_ms)

    def both_players_answered(self, lobby_id: str) -> bool:
        """Check if both players have answered current question."""
        session = SessionManager.get(lobby_id)
        if not session:
            return False
        return self.scoring.both_answered(session)

    def advance_question(self, lobby_id: str) -> bool:
        """Advance to next question. Returns True if more questions."""
        session = SessionManager.get(lobby_id)
        if not session:
            return False
        
        for player_state in session.player_states.values():
            player_state.current_answer = None
            player_state.current_time_ms = None
        
        session.current_question += 1
        session.question_start_time = get_timestamp_ms()
        
        return session.current_question <= len(session.questions)

    def get_round_result(self, lobby_id: str) -> dict:
        """Get results for current round."""
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        return self.scoring.get_round_result(session)

    def get_final_scores(self, lobby_id: str) -> dict:
        """Get final scores for all players."""
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        return {
            player_id: state.score
            for player_id, state in session.player_states.items()
        }

    async def end_game(self, lobby_id: str) -> GameResult:
        """End game and persist results."""
        from app.services.powerup_service import powerup_service
        
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        session.status = "completed"
        
        # Save game and get result
        result = await self.persistence.save_game(session)
        
        # Update player stats
        await self.persistence.update_player_stats(session, result.winner_id)
        
        # Cleanup
        powerup_service.cleanup_lobby(lobby_id)
        CombatTracker.cleanup(lobby_id)
        SessionManager.remove(lobby_id)
        
        return result

    async def get_user_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Get game history for a user."""
        return await self.persistence.get_user_history(user_id, limit)
