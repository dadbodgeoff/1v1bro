"""
Matchmaking service.
Orchestrates queue operations, matching, and lobby creation.
"""

import asyncio
from datetime import datetime
from typing import Optional

from supabase import Client

from app.core.logging import get_logger
from app.matchmaking.models import MatchTicket, QueueStatus, MatchFoundEvent
from app.matchmaking.queue_manager import queue_manager
from app.database.repositories.matchmaking_repo import MatchmakingRepository
from app.services.lobby_service import LobbyService
from app.websocket.manager import manager

logger = get_logger("matchmaking.service")


class MatchmakingService:
    """Service for matchmaking queue operations."""
    
    # Cooldown durations in minutes
    COOLDOWN_FIRST = 5      # First early leave: 5 minutes
    COOLDOWN_THREE = 30     # 3 early leaves in 24h: 30 minutes
    COOLDOWN_FIVE = 120     # 5 early leaves in 24h: 2 hours
    
    # Queue status broadcast interval
    STATUS_INTERVAL = 5.0   # seconds
    
    def __init__(self, client: Client):
        self.repo = MatchmakingRepository(client)
        self.lobby_service = LobbyService(client)
        self._processor_task: Optional[asyncio.Task] = None
        self._status_task: Optional[asyncio.Task] = None
        self._running = False
    
    async def start(self) -> None:
        """Start background queue processing."""
        if self._running:
            return
        
        self._running = True
        
        # Restore tickets from database
        tickets = await self.repo.get_active_tickets()
        if tickets:
            await queue_manager.restore_tickets(tickets)
        
        # Start background tasks
        self._processor_task = asyncio.create_task(self._queue_processor())
        self._status_task = asyncio.create_task(self._status_broadcaster())
        
        logger.info("Matchmaking service started")
    
    async def stop(self) -> None:
        """Stop background queue processing."""
        self._running = False
        
        if self._processor_task:
            self._processor_task.cancel()
            try:
                await self._processor_task
            except asyncio.CancelledError:
                pass
        
        if self._status_task:
            self._status_task.cancel()
            try:
                await self._status_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Matchmaking service stopped")
    
    async def join_queue(self, player_id: str, player_name: str) -> MatchTicket:
        """
        Add player to matchmaking queue.
        
        Args:
            player_id: Player UUID
            player_name: Display name
            
        Returns:
            Created MatchTicket
            
        Raises:
            ValueError: If player already in queue or has cooldown
        """
        # Check for active cooldown
        cooldown = await self.repo.get_cooldown(player_id)
        if cooldown and cooldown.is_active:
            raise ValueError(f"QUEUE_COOLDOWN:{cooldown.remaining_seconds}")
        
        # Check if already in queue
        if await queue_manager.contains(player_id):
            raise ValueError("ALREADY_IN_QUEUE")
        
        # Create ticket
        ticket = MatchTicket(
            player_id=player_id,
            player_name=player_name,
            queue_time=datetime.utcnow(),
        )
        
        # Add to queue
        success = await queue_manager.add(ticket)
        if not success:
            raise ValueError("ALREADY_IN_QUEUE")
        
        # Persist to database
        await self.repo.save_ticket(ticket)
        
        # Send queue_joined event
        position = await queue_manager.get_position(player_id)
        await manager.send_to_user(player_id, {
            "type": "queue_joined",
            "payload": {
                "ticket_id": ticket.id,
                "position": position,
                "queue_size": queue_manager.get_queue_size(),
            }
        })
        
        logger.info(f"Player {player_id} joined queue at position {position}")
        return ticket
    
    async def leave_queue(self, player_id: str, reason: str = "user_cancelled") -> bool:
        """
        Remove player from matchmaking queue.
        
        Args:
            player_id: Player UUID
            reason: Cancellation reason
            
        Returns:
            True if removed, False if not in queue
        """
        ticket = await queue_manager.remove(player_id)
        if not ticket:
            return False
        
        # Remove from database
        await self.repo.delete_ticket(player_id)
        
        # Send queue_cancelled event
        await manager.send_to_user(player_id, {
            "type": "queue_cancelled",
            "payload": {"reason": reason}
        })
        
        logger.info(f"Player {player_id} left queue: {reason}")
        return True
    
    async def get_queue_status(self, player_id: str) -> QueueStatus:
        """
        Get player's current queue status.
        
        Args:
            player_id: Player UUID
            
        Returns:
            QueueStatus with current state
        """
        ticket = await queue_manager.get(player_id)
        
        if not ticket:
            return QueueStatus(in_queue=False)
        
        position = await queue_manager.get_position(player_id)
        queue_size = queue_manager.get_queue_size()
        
        # Estimate wait time based on queue position
        # Simple estimate: ~10 seconds per position ahead
        estimated_wait = (position - 1) * 10 if position else None
        
        return QueueStatus(
            in_queue=True,
            position=position,
            wait_seconds=int(ticket.wait_seconds),
            estimated_wait=estimated_wait,
            queue_size=queue_size,
        )
    
    async def check_cooldown(self, player_id: str) -> Optional[int]:
        """
        Check if player has active cooldown.
        
        Args:
            player_id: Player UUID
            
        Returns:
            Remaining seconds if cooldown active, None otherwise
        """
        cooldown = await self.repo.get_cooldown(player_id)
        if cooldown and cooldown.is_active:
            return cooldown.remaining_seconds
        return None
    
    async def apply_early_leave_cooldown(self, player_id: str) -> None:
        """
        Apply cooldown for early game leave.
        
        Escalates based on number of early leaves in 24h.
        """
        # Increment early leave count
        count = await self.repo.increment_early_leave(player_id)
        
        # Determine cooldown duration
        if count >= 5:
            minutes = self.COOLDOWN_FIVE
        elif count >= 3:
            minutes = self.COOLDOWN_THREE
        else:
            minutes = self.COOLDOWN_FIRST
        
        # Apply cooldown
        await self.repo.set_cooldown(player_id, minutes, "early_leave")
        
        logger.info(f"Applied {minutes}min cooldown to {player_id} (early leaves: {count})")
    
    async def _queue_processor(self) -> None:
        """Background task that processes queue every second."""
        while self._running:
            try:
                match = await queue_manager.find_match()
                if match:
                    player1, player2 = match
                    await self._create_match(player1, player2)
            except Exception as e:
                logger.error(f"Queue processor error: {e}")
            
            await asyncio.sleep(1.0)  # 1Hz tick rate
    
    async def _status_broadcaster(self) -> None:
        """Background task that broadcasts queue status every 5 seconds."""
        while self._running:
            try:
                tickets = await queue_manager.get_all_tickets()
                queue_size = len(tickets)
                
                for i, ticket in enumerate(tickets):
                    position = i + 1
                    estimated_wait = (position - 1) * 10
                    
                    await manager.send_to_user(ticket.player_id, {
                        "type": "queue_status",
                        "payload": {
                            "elapsed": int(ticket.wait_seconds),
                            "position": position,
                            "estimated_wait": estimated_wait,
                            "queue_size": queue_size,
                        }
                    })
            except Exception as e:
                logger.error(f"Status broadcaster error: {e}")
            
            await asyncio.sleep(self.STATUS_INTERVAL)
    
    async def _create_match(self, player1: MatchTicket, player2: MatchTicket) -> None:
        """Create a match between two players."""
        try:
            # Remove tickets from database
            await self.repo.update_ticket_status(player1.player_id, "matched")
            await self.repo.update_ticket_status(player2.player_id, "matched")
            
            # Create lobby with player1 as host
            lobby = await self.lobby_service.create_lobby(
                host_id=player1.player_id,
                game_mode=player1.game_mode,
            )
            
            # Add player2 to lobby
            lobby = await self.lobby_service.join_lobby(
                code=lobby["code"],
                player_id=player2.player_id,
            )
            
            # Send match_found events
            match_event_p1 = MatchFoundEvent(
                lobby_code=lobby["code"],
                opponent_id=player2.player_id,
                opponent_name=player2.player_name,
            )
            
            match_event_p2 = MatchFoundEvent(
                lobby_code=lobby["code"],
                opponent_id=player1.player_id,
                opponent_name=player1.player_name,
            )
            
            await manager.send_to_user(player1.player_id, {
                "type": "match_found",
                "payload": match_event_p1.to_dict(),
            })
            
            await manager.send_to_user(player2.player_id, {
                "type": "match_found",
                "payload": match_event_p2.to_dict(),
            })
            
            logger.info(
                f"Match created: {player1.player_name} vs {player2.player_name} "
                f"in lobby {lobby['code']}"
            )
            
        except Exception as e:
            logger.error(f"Failed to create match: {e}")
            # Re-add players to queue on failure
            await queue_manager.add(player1)
            await queue_manager.add(player2)


# Global service instance (initialized on startup)
matchmaking_service: Optional[MatchmakingService] = None


def get_matchmaking_service() -> MatchmakingService:
    """Get the global matchmaking service instance."""
    if matchmaking_service is None:
        raise RuntimeError("Matchmaking service not initialized")
    return matchmaking_service


def init_matchmaking_service(client: Client) -> MatchmakingService:
    """Initialize the global matchmaking service."""
    global matchmaking_service
    matchmaking_service = MatchmakingService(client)
    return matchmaking_service
