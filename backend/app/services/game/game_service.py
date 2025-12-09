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
        """Get final scores for all players including kill breakdown."""
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        return {
            player_id: {
                "total": state.score,
                "quiz_score": state.score - state.kill_score,
                "kill_score": state.kill_score,
                "kill_count": state.kill_count,
            }
            for player_id, state in session.player_states.items()
        }

    async def end_game(self, lobby_id: str) -> GameResult:
        """
        End game and persist results with full recap data.
        
        Requirements: 8.2 - Publish match.completed event on game end.
        Requirements: 8.5 - Award XP to both players.
        Requirements: 1.4, 2.5, 3.5, 4.5, 5.5, 6.6 - Build and include recap in game end.
        """
        from app.services.powerup_service import powerup_service
        from app.services.battlepass_service import BattlePassService
        from app.services.recap_builder import RecapBuilder
        
        session = SessionManager.get(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        session.status = "completed"
        
        # Save game and get result
        result = await self.persistence.save_game(session)
        
        # Update player stats
        await self.persistence.update_player_stats(session, result.winner_id)
        
        # Update ELO ratings and record match result (Requirements: 5.3)
        # This populates match_results table and updates ELO in user_profiles
        try:
            from app.services.leaderboard_service import LeaderboardService
            leaderboard_service = LeaderboardService(self.client)
            
            player_ids = list(session.player_states.keys())
            p1_id = player_ids[0] if len(player_ids) > 0 else ""
            p2_id = player_ids[1] if len(player_ids) > 1 else ""
            
            elo_result = await leaderboard_service.update_ratings(
                match_id=result.game_id,
                player1_id=p1_id,
                player2_id=p2_id,
                winner_id=result.winner_id,
                duration_seconds=result.duration_seconds,
            )
            if elo_result:
                logger.info(
                    f"ELO updated for game {result.game_id}: "
                    f"P1 {elo_result.player1_pre_elo}->{elo_result.player1_post_elo}, "
                    f"P2 {elo_result.player2_pre_elo}->{elo_result.player2_post_elo}"
                )
                # Attach ELO result to game result for potential use
                result.elo_result = elo_result
        except Exception as e:
            logger.error(f"Failed to update ELO for game {result.game_id}: {e}")
            # Don't fail the game end if ELO update fails
        
        # Get player info
        player_ids = list(session.player_states.keys())
        player1_id = player_ids[0] if len(player_ids) > 0 else ""
        player2_id = player_ids[1] if len(player_ids) > 1 else ""
        
        player1_state = session.player_states.get(player1_id)
        player2_state = session.player_states.get(player2_id)
        
        player1_score = player1_state.score if player1_state and hasattr(player1_state, 'score') else 0
        player2_score = player2_state.score if player2_state and hasattr(player2_state, 'score') else 0
        
        # Get combat stats for XP calculation and recap
        combat_stats = CombatTracker.get_stats(lobby_id)
        player1_combat = combat_stats.get(player1_id, {}) if combat_stats else {}
        player2_combat = combat_stats.get(player2_id, {}) if combat_stats else {}
        player1_kills = player1_combat.get("kills", 0)
        player2_kills = player2_combat.get("kills", 0)
        player1_streak = player1_combat.get("max_streak", 0)
        player2_streak = player2_combat.get("max_streak", 0)
        
        # Award XP to both players (Requirements: 8.5)
        xp_results = {}
        xp_result1 = None
        xp_result2 = None
        logger.info(f"[XP] Starting XP award for game {result.game_id}")
        logger.info(f"[XP] Player1: {player1_id}, kills={player1_kills}, streak={player1_streak}")
        logger.info(f"[XP] Player2: {player2_id}, kills={player2_kills}, streak={player2_streak}")
        logger.info(f"[XP] Duration: {result.duration_seconds}s, Winner: {result.winner_id}")
        try:
            battlepass_service = BattlePassService(self.client)
            
            # Player 1 XP
            if player1_id:
                player1_won = result.winner_id == player1_id
                logger.info(f"[XP] Awarding XP to player1 {player1_id}, won={player1_won}")
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
        
        # Build recap payloads for both players (Requirements: 1.4, 2.5, 3.5, 4.5, 5.5, 6.6)
        recaps = {}
        try:
            recap_builder = RecapBuilder()
            
            # Get player names (use IDs as fallback)
            player1_name = player1_id[:8] if player1_id else "Player 1"
            player2_name = player2_id[:8] if player2_id else "Player 2"
            
            # Build recap for player 1
            if player1_id:
                player1_recap = recap_builder.build_recap(
                    player_id=player1_id,
                    session=session,
                    xp_result=xp_result1,
                    combat_tracker_stats=player1_combat,
                    opponent_id=player2_id,
                    opponent_name=player2_name,
                    opponent_avatar=None,
                    opponent_score=player2_score,
                    opponent_combat_stats=player2_combat,
                    winner_id=result.winner_id,
                    is_tie=result.is_tie,
                    won_by_time=result.won_by_time,
                )
                recaps[player1_id] = player1_recap.model_dump()
            
            # Build recap for player 2
            if player2_id:
                player2_recap = recap_builder.build_recap(
                    player_id=player2_id,
                    session=session,
                    xp_result=xp_result2,
                    combat_tracker_stats=player2_combat,
                    opponent_id=player1_id,
                    opponent_name=player1_name,
                    opponent_avatar=None,
                    opponent_score=player1_score,
                    opponent_combat_stats=player1_combat,
                    winner_id=result.winner_id,
                    is_tie=result.is_tie,
                    won_by_time=result.won_by_time,
                )
                recaps[player2_id] = player2_recap.model_dump()
            
            # Persist recap data to database (Requirements: 7.3)
            if recaps and result.game_id:
                await self.persistence.save_recap_data(
                    game_id=result.game_id,
                    player1_id=player1_id,
                    player1_recap=recaps.get(player1_id, {}),
                    player2_id=player2_id,
                    player2_recap=recaps.get(player2_id, {}),
                )
            
            # Attach recaps to result for WebSocket broadcast
            result.recaps = recaps if recaps else None
            
            logger.info(f"Built recap payloads for game {result.game_id}")
            
        except Exception as e:
            logger.error(f"Failed to build recap for game {result.game_id}: {e}")
            # Don't fail the game end if recap building fails
            result.recaps = None
        
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
        
        # Record question history for freshness tracking (Requirements: 1.3, 1.4)
        try:
            # Build answer data from player states
            answers = []
            for player_id in player_ids:
                player_state = session.player_states.get(player_id)
                player_answers = []
                if player_state and hasattr(player_state, 'answers'):
                    for answer in player_state.answers:
                        player_answers.append({
                            'was_correct': answer.is_correct if hasattr(answer, 'is_correct') else None,
                            'time_ms': answer.time_ms if hasattr(answer, 'time_ms') else None,
                        })
                answers.append(player_answers)
            
            # Record questions shown to both players
            await self.question_service.record_match_questions(
                user_ids=player_ids,
                questions=session.questions,
                answers=answers if any(answers) else None,
                match_id=result.game_id,
            )
            logger.info(f"Recorded question history for game {result.game_id}")
        except Exception as e:
            logger.error(f"Failed to record question history for game {result.game_id}: {e}")
            # Don't fail the game end if history recording fails
        
        # Cleanup
        powerup_service.cleanup_lobby(lobby_id)
        CombatTracker.cleanup(lobby_id)
        SessionManager.remove(lobby_id)
        
        return result

    async def get_user_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Get game history for a user."""
        return await self.persistence.get_user_history(user_id, limit)
