"""
Atomic match creator for matchmaking.

Creates matches with two-phase commit semantics to ensure
both players are successfully notified or the match is rolled back.
"""

import asyncio
import time
from datetime import datetime
from typing import Optional, Tuple

from app.core.logging import get_logger
from app.matchmaking.models import MatchTicket, MatchResult, MatchFoundEvent
from app.matchmaking.health_checker import ConnectionHealthChecker
from app.matchmaking.queue_manager import queue_manager
from app.websocket.manager import manager

logger = get_logger("matchmaking.atomic")


class AtomicMatchCreator:
    """
    Creates matches with two-phase commit semantics.
    
    Phase 1: Verify both connections are healthy
    Phase 2: Create lobby, send notifications, confirm delivery
    
    On failure: Rollback lobby, re-queue healthy player
    """
    
    # Notification timeout
    NOTIFICATION_TIMEOUT = 2.0  # seconds
    NOTIFICATION_RETRIES = 3
    
    def __init__(
        self,
        health_checker: Optional[ConnectionHealthChecker] = None,
        connection_manager=None,
    ):
        """
        Initialize atomic match creator.
        
        Args:
            health_checker: Optional health checker (defaults to global)
            connection_manager: Optional connection manager (defaults to global)
        """
        self._health_checker = health_checker or ConnectionHealthChecker()
        self._manager = connection_manager or manager
    
    async def create_match(
        self,
        player1: MatchTicket,
        player2: MatchTicket,
        lobby_service,
        repo,
    ) -> MatchResult:
        """
        Create a match atomically.
        
        Phase 1: Verify both connections healthy
        Phase 2: Create lobby, send notifications, confirm delivery
        
        On failure: Rollback lobby, re-queue healthy player
        
        Args:
            player1: First player's ticket
            player2: Second player's ticket
            lobby_service: LobbyService for creating lobbies
            repo: MatchmakingRepository for database operations
            
        Returns:
            MatchResult with success/failure details
        """
        start_time = time.time()
        
        # Phase 1: Verify both connections are healthy
        logger.info(f"Phase 1: Verifying connections for {player1.player_id} and {player2.player_id}")
        
        both_healthy, health1, health2 = await self._health_checker.verify_both_healthy(
            player1.player_id,
            player2.player_id,
        )
        
        if not both_healthy:
            return await self._handle_health_check_failure(
                player1, player2, health1, health2
            )
        
        logger.info(f"Phase 1 complete: Both players healthy")
        
        # Phase 2: Create lobby and notify players
        logger.info(f"Phase 2: Creating lobby and notifying players")
        
        try:
            # Update ticket status in database
            await repo.update_ticket_status(player1.player_id, "matched")
            await repo.update_ticket_status(player2.player_id, "matched")
            
            # Create lobby
            lobby = await lobby_service.create_lobby(
                host_id=player1.player_id,
                game_mode=player1.game_mode,
                category=player1.game_mode,
                map_slug=player1.map_slug,
            )
            lobby_code = lobby.get("code")
            
            # Add player2 to lobby
            lobby = await lobby_service.join_lobby(
                code=lobby_code,
                player_id=player2.player_id,
            )
            
            logger.info(f"Lobby {lobby_code} created, notifying players")
            
            # Send notifications to both players
            p1_notified, p2_notified = await self._notify_players(
                player1, player2, lobby_code
            )
            
            # Check if both were notified
            if p1_notified and p2_notified:
                elapsed = time.time() - start_time
                logger.info(
                    f"Match created successfully: {player1.player_name} vs {player2.player_name} "
                    f"in lobby {lobby_code} ({elapsed:.2f}s)"
                )
                return MatchResult(
                    success=True,
                    lobby_code=lobby_code,
                    player1_notified=True,
                    player2_notified=True,
                )
            
            # Rollback: one or both notifications failed
            return await self._handle_notification_failure(
                player1, player2, lobby_code, lobby_service,
                p1_notified, p2_notified
            )
            
        except Exception as e:
            logger.error(f"Match creation failed: {e}")
            # Re-queue both players on unexpected error
            await self._requeue_player(player1)
            await self._requeue_player(player2)
            
            return MatchResult(
                success=False,
                failure_reason=f"lobby_creation_failed: {str(e)}",
                rollback_performed=True,
            )
    
    async def _handle_health_check_failure(
        self,
        player1: MatchTicket,
        player2: MatchTicket,
        health1,
        health2,
    ) -> MatchResult:
        """Handle health check failure by re-queuing healthy player."""
        
        if not health1.healthy and not health2.healthy:
            # Both unhealthy - don't re-queue either
            logger.warning(
                f"Both players failed health check: "
                f"{player1.player_id} ({health1.failure_reason}), "
                f"{player2.player_id} ({health2.failure_reason})"
            )
            return MatchResult(
                success=False,
                failure_reason="both_players_unhealthy",
            )
        
        if not health1.healthy:
            # Player 1 unhealthy - re-queue player 2
            logger.warning(
                f"Player {player1.player_id} failed health check ({health1.failure_reason}), "
                f"re-queuing {player2.player_id}"
            )
            await self._requeue_player(player2)
            await self._notify_match_cancelled(player2.player_id, "opponent_disconnected")
            
            return MatchResult(
                success=False,
                failure_reason=f"player1_unhealthy: {health1.failure_reason}",
                rollback_performed=True,
                requeued_player_id=player2.player_id,
            )
        
        # Player 2 unhealthy - re-queue player 1
        logger.warning(
            f"Player {player2.player_id} failed health check ({health2.failure_reason}), "
            f"re-queuing {player1.player_id}"
        )
        await self._requeue_player(player1)
        await self._notify_match_cancelled(player1.player_id, "opponent_disconnected")
        
        return MatchResult(
            success=False,
            failure_reason=f"player2_unhealthy: {health2.failure_reason}",
            rollback_performed=True,
            requeued_player_id=player1.player_id,
        )
    
    async def _notify_players(
        self,
        player1: MatchTicket,
        player2: MatchTicket,
        lobby_code: str,
    ) -> Tuple[bool, bool]:
        """
        Send match_found notifications to both players.
        
        Returns:
            Tuple of (player1_notified, player2_notified)
        """
        match_event_p1 = MatchFoundEvent(
            lobby_code=lobby_code,
            opponent_id=player2.player_id,
            opponent_name=player2.player_name,
            map_slug=player1.map_slug,
        )
        
        match_event_p2 = MatchFoundEvent(
            lobby_code=lobby_code,
            opponent_id=player1.player_id,
            opponent_name=player1.player_name,
            map_slug=player1.map_slug,
        )
        
        # Send notifications in parallel with retries
        p1_task = self._send_with_retry(
            player1.player_id, "match_found", match_event_p1.to_dict()
        )
        p2_task = self._send_with_retry(
            player2.player_id, "match_found", match_event_p2.to_dict()
        )
        
        results = await asyncio.gather(p1_task, p2_task)
        return results[0], results[1]
    
    async def _send_with_retry(
        self,
        user_id: str,
        msg_type: str,
        payload: dict,
    ) -> bool:
        """Send a message with retries."""
        for attempt in range(self.NOTIFICATION_RETRIES):
            sent = await self._manager.send_to_user(user_id, {
                "type": msg_type,
                "payload": payload,
            })
            if sent:
                logger.debug(f"Sent {msg_type} to {user_id} (attempt {attempt + 1})")
                return True
            await asyncio.sleep(0.3)  # Brief delay between retries
        
        logger.warning(f"Failed to send {msg_type} to {user_id} after {self.NOTIFICATION_RETRIES} attempts")
        return False
    
    async def _handle_notification_failure(
        self,
        player1: MatchTicket,
        player2: MatchTicket,
        lobby_code: str,
        lobby_service,
        p1_notified: bool,
        p2_notified: bool,
    ) -> MatchResult:
        """Handle notification failure by rolling back and re-queuing."""
        
        logger.warning(
            f"Notification failure for lobby {lobby_code}: "
            f"p1_notified={p1_notified}, p2_notified={p2_notified}"
        )
        
        # Cancel the lobby
        try:
            await lobby_service.leave_lobby(lobby_code, player1.player_id)
            await lobby_service.leave_lobby(lobby_code, player2.player_id)
        except Exception as e:
            logger.error(f"Failed to cancel lobby {lobby_code}: {e}")
        
        # Re-queue the player who was notified (they need to know match was cancelled)
        # Don't re-queue the player who wasn't notified (they're likely disconnected)
        
        requeued_player_id = None
        
        if p1_notified and not p2_notified:
            # Player 1 was notified but player 2 wasn't
            await self._requeue_player(player1)
            await self._notify_match_cancelled(player1.player_id, "opponent_disconnected")
            requeued_player_id = player1.player_id
            
        elif p2_notified and not p1_notified:
            # Player 2 was notified but player 1 wasn't
            await self._requeue_player(player2)
            await self._notify_match_cancelled(player2.player_id, "opponent_disconnected")
            requeued_player_id = player2.player_id
        
        # If neither was notified, don't re-queue either (both likely disconnected)
        
        return MatchResult(
            success=False,
            lobby_code=lobby_code,
            player1_notified=p1_notified,
            player2_notified=p2_notified,
            failure_reason="notification_failed",
            rollback_performed=True,
            requeued_player_id=requeued_player_id,
        )
    
    async def _requeue_player(self, ticket: MatchTicket) -> bool:
        """Re-queue a player at their original position."""
        position = await queue_manager.get_position(ticket.player_id)
        if position is None:
            position = 1  # Default to front if not found
        
        return await queue_manager.add_with_position(ticket, position)
    
    async def _notify_match_cancelled(self, user_id: str, reason: str) -> bool:
        """Send match_cancelled notification to a player."""
        return await self._manager.send_to_user(user_id, {
            "type": "match_cancelled",
            "payload": {
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat(),
            }
        })
