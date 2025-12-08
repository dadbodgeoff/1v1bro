"""
Game service - Facade for game operations.
Coordinates session, scoring, and persistence services.
Requirements: 8.2 - Publish match.completed event on game end.
"""

import logging
from typing import List, Optional, Tuple

from supabase import Client

from app.core.exceptions import GameStateError
from app.services.base import BaseService
from app.services.question_service import QuestionService
from app.schemas.game import Question, PlayerAnswer, GameResult
from app.utils.helpers import get_timestamp_ms
from app.utils.combat_tracker import CombatTracker
from app.events.publisher import EventPublisher, MatchCompletedEvent

from .session import SessionManager, GameSession
from .scoring import ScoringService
from .persistence import GamePersistenceService

logger = logging.getLogger(__name__)


class GameService(BaseService):
    """
    Facade service for game operations.
    
    Delegates to:
    - SessionManager: In-memory session state
    - ScoringService: Score calculation
    - GamePersistenceService: Database operations
    """

    def __init__(self, client: Client, event_publisher: Optional[EventPublisher] = None):
        super().__init__(client)
        self.question_service = QuestionService(client)  # Pass client for database access
        self.scoring = ScoringService()
        self.persistence = GamePersistenceService(client)
        self.event_publisher = event_publisher or EventPublisher()

    async def create_session(
        self,
        lobby_id: str,
        player1_id: str,
        player2_id: str,
        game_mode: str = "fortnite",
    ) -> GameSession:
        """Create a new game session with questions from database."""
        from app.services.powerup_service import powerup_service
        
        # Load questions from database (async), avoiding repeats for both players
        questions = await self.question_service.load_questions_async(
            category=game_mode,
            user_ids=[player1_id, player2_id],
        )
        
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
        """
        End game and persist results.
        
        Requirements: 8.2 - Publish match.completed event on game end.
        Requirements: 8.5 - Award XP to both players.
        """
        from app.services.powerup_service import powerup_service
        from app.services.battlepass_service import BattlePassService
        
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        session.status = "completed"
        
        # Save game and get result
        result = await self.persistence.save_game(session)
        
        # Update player stats
        await self.persistence.update_player_stats(session, result.winner_id)
        
        # Get player info
        player_ids = list(session.player_states.keys())
        player1_id = player_ids[0] if len(player_ids) > 0 else ""
        player2_id = player_ids[1] if len(player_ids) > 1 else ""
        
        player1_state = session.player_states.get(player1_id)
        player2_state = session.player_states.get(player2_id)
        
        player1_score = player1_state.score if player1_state and hasattr(player1_state, 'score') else 0
        player2_score = player2_state.score if player2_state and hasattr(player2_state, 'score') else 0
        
        # Get combat stats for XP calculation
        combat_stats = CombatTracker.get_stats(lobby_id)
        player1_kills = combat_stats.get(player1_id, {}).get("kills", 0) if combat_stats else 0
        player2_kills = combat_stats.get(player2_id, {}).get("kills", 0) if combat_stats else 0
        player1_streak = combat_stats.get(player1_id, {}).get("max_streak", 0) if combat_stats else 0
        player2_streak = combat_stats.get(player2_id, {}).get("max_streak", 0) if combat_stats else 0
        
        # Award XP to both players (Requirements: 8.5)
        xp_results = {}
        try:
            battlepass_service = BattlePassService(self._client)
            
            # Player 1 XP
            if player1_id:
                player1_won = result.winner_id == player1_id
                xp_result1 = await battlepass_service.award_match_xp(
                    user_id=player1_id,
                    won=player1_won,
                    kills=player1_kills,
                    streak=player1_streak,
                    duration_seconds=result.duration_seconds,
                    match_id=result.game_id,
                )
                if xp_result1:
                    logger.info(
                        f"Player {player1_id} earned {xp_result1.xp_awarded} XP "
                        f"(Tier {xp_result1.previous_tier} -> {xp_result1.new_tier})"
                    )
                    xp_results[player1_id] = xp_result1.model_dump()
            
            # Player 2 XP
            if player2_id:
                player2_won = result.winner_id == player2_id
                xp_result2 = await battlepass_service.award_match_xp(
                    user_id=player2_id,
                    won=player2_won,
                    kills=player2_kills,
                    streak=player2_streak,
                    duration_seconds=result.duration_seconds,
                    match_id=result.game_id,
                )
                if xp_result2:
                    logger.info(
                        f"Player {player2_id} earned {xp_result2.xp_awarded} XP "
                        f"(Tier {xp_result2.previous_tier} -> {xp_result2.new_tier})"
                    )
                    xp_results[player2_id] = xp_result2.model_dump()
            
            # Attach XP results to game result for WebSocket broadcast
            result.xp_results = xp_results if xp_results else None
                    
        except Exception as e:
            logger.error(f"Failed to award XP for game {result.game_id}: {e}")
            # Don't fail the game end if XP awarding fails
        
        # Publish match.completed event (Requirements: 8.2)
        event = MatchCompletedEvent(
            match_id=result.game_id,
            player1_id=player1_id,
            player2_id=player2_id,
            winner_id=result.winner_id,
            duration_seconds=result.duration_seconds,
            player1_score=player1_score,
            player2_score=player2_score,
        )
        
        try:
            await self.event_publisher.publish_match_completed(event)
            logger.info(f"Published match.completed event for game {result.game_id}")
        except Exception as e:
            logger.error(f"Failed to publish match.completed event: {e}")
            # Don't fail the game end if event publishing fails
        
        # Cleanup
        powerup_service.cleanup_lobby(lobby_id)
        CombatTracker.cleanup(lobby_id)
        SessionManager.remove(lobby_id)
        
        return result

    async def get_user_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Get game history for a user."""
        return await self.persistence.get_user_history(user_id, limit)
