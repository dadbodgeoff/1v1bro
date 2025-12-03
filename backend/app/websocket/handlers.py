"""
WebSocket message handlers.
Processes incoming messages and orchestrates game flow.
"""

import asyncio
import json
from typing import Optional

from fastapi import WebSocket

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.game_service import GameService
from app.services.lobby_service import LobbyService
from app.websocket.manager import manager
from app.websocket.events import (
    WSEventType,
    build_error,
    build_game_start,
    build_question,
    build_round_result,
    build_game_end,
    build_player_joined,
    build_player_left,
    build_lobby_state,
    build_player_ready,
)
from app.utils.helpers import get_timestamp_ms
from app.services.powerup_service import powerup_service
from app.schemas.ws_messages import PowerUpType

settings = get_settings()
logger = get_logger("websocket.handlers")


class GameHandler:
    """Handles WebSocket messages for game operations."""

    def __init__(self, lobby_service: LobbyService, game_service: GameService):
        self.lobby_service = lobby_service
        self.game_service = game_service

    async def handle_message(
        self,
        websocket: WebSocket,
        message: dict,
        lobby_code: str,
        user_id: str,
    ) -> None:
        """
        Route incoming message to appropriate handler.
        
        Args:
            websocket: Source WebSocket
            message: Parsed message dict
            lobby_code: Current lobby code
            user_id: Sender user ID
        """
        msg_type = message.get("type")
        payload = message.get("payload", {})

        try:
            if msg_type == WSEventType.START_GAME.value:
                await self.handle_start_game(lobby_code, user_id)
            elif msg_type == WSEventType.ANSWER.value:
                await self.handle_answer(lobby_code, user_id, payload)
            elif msg_type == WSEventType.READY.value:
                await self.handle_ready(lobby_code, user_id)
            elif msg_type == WSEventType.POSITION_UPDATE.value:
                await self.handle_position_update(lobby_code, user_id, payload)
            elif msg_type == WSEventType.POWERUP_COLLECTED.value:
                await self.handle_powerup_collect(lobby_code, user_id, payload)
            elif msg_type == WSEventType.POWERUP_USE.value:
                await self.handle_powerup_use(lobby_code, user_id, payload)
            else:
                await manager.send_personal(
                    websocket,
                    build_error("UNKNOWN_MESSAGE", f"Unknown message type: {msg_type}")
                )
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await manager.send_personal(
                websocket,
                build_error("HANDLER_ERROR", str(e))
            )

    async def handle_start_game(self, lobby_code: str, user_id: str) -> None:
        """Handle start_game message from host."""
        try:
            # Get lobby and verify host
            lobby = await self.lobby_service.get_lobby(lobby_code)
            
            if lobby["host_id"] != user_id:
                await manager.send_to_user(
                    user_id,
                    build_error("NOT_HOST", "Only the host can start the game")
                )
                return
            
            if not lobby.get("opponent_id"):
                await manager.send_to_user(
                    user_id,
                    build_error("NO_OPPONENT", "Cannot start without an opponent")
                )
                return
            
            # Start game in lobby service
            await self.lobby_service.start_game(lobby["id"], user_id)
            
            # Create game session
            session = self.game_service.create_session(
                lobby_id=lobby["id"],
                player1_id=lobby["host_id"],
                player2_id=lobby["opponent_id"],
                game_mode=lobby.get("game_mode", "fortnite"),
            )
            
            # Start the game
            self.game_service.start_game(lobby["id"])
            
            # Broadcast game start
            await manager.broadcast_to_lobby(
                lobby_code,
                build_game_start(
                    total_questions=len(session.questions),
                    players=lobby["players"],
                )
            )
            
            # Send first question after short delay
            await asyncio.sleep(1)
            await self.send_question(lobby_code, lobby["id"])
            
        except Exception as e:
            logger.error(f"Error starting game: {e}")
            await manager.broadcast_to_lobby(
                lobby_code,
                build_error("START_FAILED", str(e))
            )

    async def handle_answer(
        self,
        lobby_code: str,
        user_id: str,
        payload: dict,
    ) -> None:
        """Handle answer submission from player."""
        try:
            # Get lobby ID from code
            lobby = await self.lobby_service.get_lobby(lobby_code)
            lobby_id = lobby["id"]
            
            q_num = payload.get("q_num")
            answer = payload.get("answer")
            time_ms = payload.get("time_ms", settings.QUESTION_TIME_MS)
            
            # Submit answer
            self.game_service.submit_answer(
                lobby_id=lobby_id,
                player_id=user_id,
                q_num=q_num,
                answer=answer,
                time_ms=time_ms,
            )
            
            # Check if both players answered
            if self.game_service.both_players_answered(lobby_id):
                await self.process_round_end(lobby_code, lobby_id)
                
        except Exception as e:
            logger.error(f"Error handling answer: {e}")
            await manager.send_to_user(
                user_id,
                build_error("ANSWER_FAILED", str(e))
            )

    async def handle_ready(self, lobby_code: str, user_id: str) -> None:
        """Handle ready message from player."""
        try:
            # Mark player as ready in lobby service
            lobby = await self.lobby_service.set_player_ready(lobby_code, user_id)
            
            logger.info(f"Player {user_id} ready in lobby {lobby_code}")
            
            # Broadcast ready state to all players
            await manager.broadcast_to_lobby(
                lobby_code,
                build_player_ready(
                    player_id=user_id,
                    players=lobby["players"],
                    can_start=lobby.get("can_start", False),
                )
            )
        except Exception as e:
            logger.error(f"Error handling ready: {e}")
            await manager.send_to_user(
                user_id,
                build_error("READY_FAILED", str(e))
            )

    async def handle_position_update(
        self,
        lobby_code: str,
        user_id: str,
        payload: dict,
    ) -> None:
        """Handle player position update and broadcast to opponent."""
        x = payload.get("x", 0)
        y = payload.get("y", 0)
        
        # Get lobby ID from code
        lobby = await self.lobby_service.get_lobby(lobby_code)
        lobby_id = lobby["id"]
        
        # Update player state
        session = self.game_service.get_session(lobby_id)
        if session and user_id in session.player_states:
            session.player_states[user_id].position_x = x
            session.player_states[user_id].position_y = y
        
        # Broadcast to other players in lobby
        await manager.broadcast_to_lobby(
            lobby_code,
            {
                "type": WSEventType.POSITION_UPDATE.value,
                "payload": {
                    "player_id": user_id,
                    "x": x,
                    "y": y,
                }
            },
            exclude_user_id=user_id,  # Don't send back to sender
        )

    async def handle_powerup_collect(
        self,
        lobby_code: str,
        user_id: str,
        payload: dict,
    ) -> None:
        """Handle power-up collection."""
        powerup_id = payload.get("powerup_id")
        
        # Get lobby ID from code
        lobby = await self.lobby_service.get_lobby(lobby_code)
        lobby_id = lobby["id"]
        
        session = self.game_service.get_session(lobby_id)
        if not session or user_id not in session.player_states:
            return
        
        player_state = session.player_states[user_id]
        
        # Attempt collection
        powerup = powerup_service.collect_powerup(
            lobby_id,
            powerup_id,
            player_state.inventory,
        )
        
        if powerup:
            # Add to inventory
            player_state.inventory.append(powerup.type.value)
            
            # Broadcast to all players
            await manager.broadcast_to_lobby(
                lobby_code,
                {
                    "type": WSEventType.POWERUP_COLLECTED.value,
                    "payload": {
                        "powerup_id": powerup_id,
                        "player_id": user_id,
                        "type": powerup.type.value,
                    }
                }
            )

    async def handle_powerup_use(
        self,
        lobby_code: str,
        user_id: str,
        payload: dict,
    ) -> None:
        """Handle power-up usage."""
        powerup_type = payload.get("type")
        
        # Get lobby ID from code
        lobby = await self.lobby_service.get_lobby(lobby_code)
        lobby_id = lobby["id"]
        
        session = self.game_service.get_session(lobby_id)
        if not session or user_id not in session.player_states:
            return
        
        player_state = session.player_states[user_id]
        
        # Check if player has this power-up
        if powerup_type not in player_state.inventory:
            return
        
        # Remove from inventory
        player_state.inventory.remove(powerup_type)
        
        # Apply effect based on type
        if powerup_type == PowerUpType.SOS.value:
            await self._handle_sos_use(lobby_code, lobby_id, user_id, session)
        elif powerup_type == PowerUpType.TIME_STEAL.value:
            await self._handle_time_steal_use(lobby_code, lobby_id, user_id, session)
        elif powerup_type == PowerUpType.SHIELD.value:
            player_state.has_shield = True
            await manager.broadcast_to_lobby(
                lobby_code,
                {
                    "type": WSEventType.SHIELD_ACTIVATED.value,
                    "payload": {"player_id": user_id}
                }
            )
        elif powerup_type == PowerUpType.DOUBLE_POINTS.value:
            player_state.has_double_points = True
            await manager.broadcast_to_lobby(
                lobby_code,
                {
                    "type": WSEventType.DOUBLE_POINTS_ACTIVATED.value,
                    "payload": {"player_id": user_id}
                }
            )

    async def _handle_sos_use(self, lobby_code: str, lobby_id: str, user_id: str, session) -> None:
        """Apply SOS power-up effect."""
        if not session.current_question or session.current_question < 1:
            return
        
        question = session.questions[session.current_question - 1]
        eliminated = powerup_service.apply_sos(
            question.correct_answer,
            question.options,
        )
        
        # Send only to the player who used it
        await manager.send_to_user(
            user_id,
            {
                "type": WSEventType.SOS_USED.value,
                "payload": {
                    "player_id": user_id,
                    "eliminated_options": eliminated,
                }
            }
        )

    async def _handle_time_steal_use(self, lobby_code: str, lobby_id: str, user_id: str, session) -> None:
        """Apply Time Steal power-up effect."""
        # Find opponent
        opponent_id = None
        for pid in session.player_states:
            if pid != user_id:
                opponent_id = pid
                break
        
        if not opponent_id:
            return
        
        # Add time penalty to opponent (5 seconds = 5000ms)
        session.player_states[opponent_id].time_penalty_ms += 5000
        
        # Notify both players
        await manager.broadcast_to_lobby(
            lobby_code,
            {
                "type": WSEventType.TIME_STOLEN.value,
                "payload": {
                    "stealer_id": user_id,
                    "victim_id": opponent_id,
                    "seconds_stolen": 5,
                }
            }
        )

    async def send_question(self, lobby_code: str, lobby_id: str) -> None:
        """Send current question to all players in lobby."""
        try:
            question, q_num = self.game_service.get_current_question(lobby_id)
            
            # Get public question (without answer)
            from app.services.question_service import QuestionService
            qs = QuestionService()
            
            # Use lobby_id as seed for consistent option ordering
            seed = hash(lobby_id + str(q_num))
            public_q = qs.get_public_question(question, q_num, seed=seed)
            
            start_time = get_timestamp_ms()
            
            await manager.broadcast_to_lobby(
                lobby_code,
                build_question(
                    q_num=public_q.q_num,
                    text=public_q.text,
                    options=public_q.options,
                    start_time=start_time,
                )
            )
            
            # Schedule timeout check
            asyncio.create_task(
                self.check_timeout(lobby_code, lobby_id, q_num, start_time)
            )
            
        except Exception as e:
            logger.error(f"Error sending question: {e}")

    async def check_timeout(
        self,
        lobby_code: str,
        lobby_id: str,
        q_num: int,
        start_time: int,
    ) -> None:
        """Check for answer timeout and process if needed."""
        await asyncio.sleep(settings.QUESTION_TIME_SECONDS + 1)
        
        session = self.game_service.get_session(lobby_id)
        if not session or session.current_question != q_num:
            return  # Question already processed
        
        # Submit timeout for players who haven't answered
        for player_id, state in session.player_states.items():
            if len(state.answers) < q_num:
                self.game_service.submit_answer(
                    lobby_id=lobby_id,
                    player_id=player_id,
                    q_num=q_num,
                    answer=None,
                    time_ms=settings.QUESTION_TIME_MS,
                )
        
        # Process round end
        if self.game_service.both_players_answered(lobby_id):
            await self.process_round_end(lobby_code, lobby_id)

    async def process_round_end(self, lobby_code: str, lobby_id: str) -> None:
        """Process end of round and send results."""
        try:
            # Get round result
            result = self.game_service.get_round_result(lobby_id)
            
            # Broadcast result
            await manager.broadcast_to_lobby(
                lobby_code,
                build_round_result(
                    q_num=result["q_num"],
                    correct_answer=result["correct_answer"],
                    scores=result["scores"],
                    answers=result["answers"],
                    total_scores=result["total_scores"],
                )
            )
            
            # Wait before next question
            await asyncio.sleep(settings.TRANSITION_DELAY_SECONDS if hasattr(settings, 'TRANSITION_DELAY_SECONDS') else 3)
            
            # Check if more questions
            if self.game_service.advance_question(lobby_id):
                await self.send_question(lobby_code, lobby_id)
            else:
                await self.process_game_end(lobby_code, lobby_id)
                
        except Exception as e:
            logger.error(f"Error processing round end: {e}")

    async def process_game_end(self, lobby_code: str, lobby_id: str) -> None:
        """Process end of game and send final results."""
        try:
            # End game and persist
            result = await self.game_service.end_game(lobby_id)
            
            # Complete lobby
            await self.lobby_service.complete_game(lobby_id)
            
            # Broadcast game end with time information for tiebreaker display
            await manager.broadcast_to_lobby(
                lobby_code,
                build_game_end(
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
                )
            )
            
        except Exception as e:
            logger.error(f"Error processing game end: {e}")

    async def handle_disconnect(self, lobby_code: str, user_id: str) -> None:
        """Handle player disconnection."""
        try:
            lobby = await self.lobby_service.get_lobby(lobby_code)
            
            # Notify other players
            await manager.broadcast_to_lobby(
                lobby_code,
                build_player_left(user_id, lobby.get("players", []))
            )
            
        except Exception as e:
            logger.error(f"Error handling disconnect: {e}")

    async def handle_connect(
        self,
        lobby_code: str,
        user_id: str,
        display_name: Optional[str],
    ) -> None:
        """Handle new player connection."""
        try:
            lobby = await self.lobby_service.get_lobby(lobby_code)
            
            # Send current lobby state to new connection
            await manager.send_to_user(
                user_id,
                build_lobby_state(
                    lobby_id=lobby["id"],
                    status=lobby["status"],
                    players=lobby["players"],
                    can_start=lobby.get("can_start", False),
                    host_id=lobby["host_id"],
                )
            )
            
            # Notify others of join
            await manager.broadcast_to_lobby(
                lobby_code,
                build_player_joined(
                    player_id=user_id,
                    display_name=display_name,
                    players=lobby["players"],
                    can_start=lobby.get("can_start", False),
                )
            )
            
        except Exception as e:
            logger.error(f"Error handling connect: {e}")
