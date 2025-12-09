"""
Quiz-related WebSocket handlers.
"""

import asyncio
from app.core.config import get_settings
from app.core.logging import get_logger
from app.websocket.events import build_question, build_round_result, build_game_end
from app.utils.helpers import get_timestamp_ms
from app.game import tick_system
from app.game.quiz_rewards import QuizRewardDispatcher
from .base import BaseHandler

settings = get_settings()
logger = get_logger("websocket.handlers.quiz")


class QuizHandler(BaseHandler):
    """Handles quiz question/answer flow."""

    async def handle_answer(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """Handle answer submission from player."""
        try:
            lobby = await self.get_lobby(lobby_code)
            lobby_id = lobby["id"]

            q_num = payload.get("q_num")
            answer = payload.get("answer")
            time_ms = payload.get("time_ms", settings.QUESTION_TIME_MS)

            self.game_service.submit_answer(
                lobby_id=lobby_id,
                player_id=user_id,
                q_num=q_num,
                answer=answer,
                time_ms=time_ms,
            )

            if self.game_service.both_players_answered(lobby_id):
                await self.process_round_end(lobby_code, lobby_id)

        except Exception as e:
            logger.error(f"Error handling answer: {e}")
            await self.send_error(user_id, "ANSWER_FAILED", str(e))

    async def send_question(self, lobby_code: str, lobby_id: str) -> None:
        """Send current question to all players in lobby."""
        try:
            question, q_num = self.game_service.get_current_question(lobby_id)

            from app.services.question_service import QuestionService
            qs = QuestionService()

            seed = hash(lobby_id + str(q_num))
            public_q = qs.get_public_question(question, q_num, seed=seed)

            start_time = get_timestamp_ms()

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_question(
                    q_num=public_q.q_num,
                    text=public_q.text,
                    options=public_q.options,
                    start_time=start_time,
                )
            )

            asyncio.create_task(
                self.check_timeout(lobby_code, lobby_id, q_num, start_time)
            )

        except Exception as e:
            logger.error(f"Error sending question: {e}")

    async def check_timeout(self, lobby_code: str, lobby_id: str, q_num: int, start_time: int) -> None:
        """Check for answer timeout and process if needed."""
        await asyncio.sleep(settings.QUESTION_TIME_SECONDS + 1)

        session = self.game_service.get_session(lobby_id)
        if not session or session.current_question != q_num:
            return

        for player_id, state in session.player_states.items():
            if len(state.answers) < q_num:
                logger.info(f"Timeout: auto-submitting empty answer for {player_id} on Q{q_num}")
                self.game_service.submit_answer(
                    lobby_id=lobby_id,
                    player_id=player_id,
                    q_num=q_num,
                    answer=None,
                    time_ms=settings.QUESTION_TIME_MS,
                )

        if self.game_service.both_players_answered(lobby_id):
            await self.process_round_end(lobby_code, lobby_id)
        else:
            # Safety net: schedule another check in case something went wrong
            logger.warning(f"Both players still haven't answered Q{q_num} after timeout, scheduling retry")
            asyncio.create_task(self.check_timeout_retry(lobby_code, lobby_id, q_num))

    async def check_timeout_retry(self, lobby_code: str, lobby_id: str, q_num: int) -> None:
        """Retry timeout check after a delay - safety net for stuck games."""
        await asyncio.sleep(5)  # Wait 5 more seconds
        
        session = self.game_service.get_session(lobby_id)
        if not session or session.current_question != q_num:
            return  # Already moved on
        
        logger.warning(f"Retry: forcing round end for Q{q_num} in lobby {lobby_id}")
        
        # Force-submit for anyone who still hasn't answered
        for player_id, state in session.player_states.items():
            if len(state.answers) < q_num:
                try:
                    self.game_service.submit_answer(
                        lobby_id=lobby_id,
                        player_id=player_id,
                        q_num=q_num,
                        answer=None,
                        time_ms=settings.QUESTION_TIME_MS,
                    )
                except Exception as e:
                    logger.error(f"Error force-submitting answer: {e}")
        
        # Force process round end
        try:
            await self.process_round_end(lobby_code, lobby_id)
        except Exception as e:
            logger.error(f"Error in retry round end: {e}")

    async def process_round_end(self, lobby_code: str, lobby_id: str) -> None:
        """Process end of round, dispatch rewards, and send results."""
        try:
            result = self.game_service.get_round_result(lobby_id)
            
            # Dispatch quiz rewards (combat buffs)
            # Note: tick_system uses lobby_code as key, not lobby_id
            rewards = {}
            game = tick_system._games.get(lobby_code)
            if game and game.buff_manager:
                dispatcher = QuizRewardDispatcher(game.buff_manager)
                rewards = dispatcher.dispatch_for_round(result, settings.QUESTION_TIME_MS)
                logger.info(f"Quiz rewards dispatched: {rewards}")

            # Detect if this is the final question (Q15)
            # Requirements: 1.5 - Include is_final_question flag
            session = self.game_service.get_session(lobby_id)
            total_questions = len(session.questions) if session else 15
            is_final_question = result["q_num"] >= total_questions

            await self.manager.broadcast_to_lobby(
                lobby_code,
                build_round_result(
                    q_num=result["q_num"],
                    correct_answer=result["correct_answer"],
                    scores=result["scores"],
                    answers=result["answers"],
                    total_scores=result["total_scores"],
                    rewards=rewards,  # Include rewards in broadcast
                    is_final_question=is_final_question,  # Signal imminent game end
                )
            )

            delay = getattr(settings, 'TRANSITION_DELAY_SECONDS', 3)
            await asyncio.sleep(delay)

            if self.game_service.advance_question(lobby_id):
                await self.send_question(lobby_code, lobby_id)
            else:
                logger.info(f"[QUIZ] Q{result['q_num']} was final question, triggering game end for {lobby_code}")
                await self.process_game_end(lobby_code, lobby_id)

        except Exception as e:
            logger.error(f"Error processing round end: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

    async def process_game_end(self, lobby_code: str, lobby_id: str) -> None:
        """Process end of game and send final results with XP awards and recaps."""
        logger.info(f"[GAME_END] Starting process_game_end for lobby_code={lobby_code}, lobby_id={lobby_id}")
        try:
            # Stop the arena tick system first
            tick_system.stop_game(lobby_code)
            logger.info(f"[GAME_END] Stopped tick system for: {lobby_code}")
            
            logger.info(f"[GAME_END] Calling game_service.end_game for lobby_id={lobby_id}")
            result = await self.game_service.end_game(lobby_id)
            logger.info(f"[GAME_END] end_game completed. Winner: {result.winner_id}, XP results: {result.xp_results is not None}")
            
            await self.lobby_service.complete_game(lobby_id)
            logger.info(f"[GAME_END] Lobby marked as complete")

            # Build game_end message with XP results and recaps
            # Requirements: 1.2 - Transition players to recap screen
            game_end_msg = build_game_end(
                winner_id=result.winner_id,
                final_scores={
                    result.player1_id: result.player1_score,
                    result.player2_id: result.player2_score,
                },
                is_tie=result.is_tie,
                total_times={
                    result.player1_id: result.player1_total_time_ms,
                    result.player2_id: result.player2_total_time_ms,
                },
                won_by_time=result.won_by_time,
                recaps=result.recaps if hasattr(result, 'recaps') else None,
            )
            
            # Add XP results if available from game result
            if hasattr(result, 'xp_results') and result.xp_results:
                game_end_msg["payload"]["xp_results"] = result.xp_results
                logger.info(f"[GAME_END] XP results attached to game_end message")

            await self.manager.broadcast_to_lobby(lobby_code, game_end_msg)
            logger.info(f"[GAME_END] Broadcast game_end message to lobby {lobby_code}")

        except Exception as e:
            logger.error(f"[GAME_END] Error processing game end: {e}")
            import traceback
            logger.error(f"[GAME_END] Traceback: {traceback.format_exc()}")

    async def handle_resync_request(self, lobby_code: str, user_id: str, payload: dict) -> None:
        """
        Handle client request to resync game state.
        Called when client detects a stuck question.
        """
        try:
            lobby = await self.get_lobby(lobby_code)
            lobby_id = lobby["id"]
            
            q_num = payload.get("q_num")
            reason = payload.get("reason", "unknown")
            
            logger.warning(f"Resync requested by {user_id} for Q{q_num}, reason: {reason}")
            
            session = self.game_service.get_session(lobby_id)
            if not session:
                logger.error(f"No session found for lobby {lobby_id}")
                return
            
            # Check if we're stuck on the same question
            if session.current_question == q_num:
                # Force-submit empty answers for any player who hasn't answered
                for player_id, state in session.player_states.items():
                    if len(state.answers) < q_num:
                        logger.info(f"Force-submitting empty answer for {player_id} on Q{q_num}")
                        self.game_service.submit_answer(
                            lobby_id=lobby_id,
                            player_id=player_id,
                            q_num=q_num,
                            answer=None,
                            time_ms=settings.QUESTION_TIME_MS,
                        )
                
                # Process round end if both have now answered
                if self.game_service.both_players_answered(lobby_id):
                    await self.process_round_end(lobby_code, lobby_id)
            else:
                # We've already moved on - resend current question
                logger.info(f"Resending current question {session.current_question} to {user_id}")
                await self.send_question(lobby_code, lobby_id)
                
        except Exception as e:
            logger.error(f"Error handling resync request: {e}")
