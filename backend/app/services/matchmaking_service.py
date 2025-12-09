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
        
        # Clean up any stale tickets from previous server runs
        # This prevents duplicate key errors when users try to rejoin
        await self.repo.cleanup_all_waiting_tickets()
        print("[Matchmaking] Cleaned up stale tickets from previous session")
        
        # Start background tasks
        self._processor_task = asyncio.create_task(self._queue_processor())
        self._status_task = asyncio.create_task(self._status_broadcaster())
        
        print("[Matchmaking] Service started with background tasks")
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
    
    async def join_queue(
        self,
        player_id: str,
        player_name: str,
        category: str = "fortnite",
        map_slug: str = "nexus-arena",
    ) -> MatchTicket:
        """
        Add player to matchmaking queue.
        
        Args:
            player_id: Player UUID
            player_name: Display name
            category: Trivia category (fortnite, nfl, etc.)
            map_slug: Arena map slug (nexus-arena, vortex-arena)
            
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
        
        # Create ticket with category and map
        ticket = MatchTicket(
            player_id=player_id,
            player_name=player_name,
            queue_time=datetime.utcnow(),
            game_mode=category,  # Use game_mode field for category
            map_slug=map_slug,  # Arena map selection
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
        # Remove from in-memory queue
        ticket = await queue_manager.remove(player_id)
        
        # Always clean up database (handles stale tickets from server restarts)
        await self.repo.delete_ticket(player_id)
        
        # Send queue_cancelled event
        await manager.send_to_user(player_id, {
            "type": "queue_cancelled",
            "payload": {"reason": reason}
        })
        
        logger.info(f"Player {player_id} left queue: {reason}")
        # Return true even if not in memory queue - we cleaned up DB
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
        print("[Matchmaking] Queue processor started")
        while self._running:
            try:
                queue_size = queue_manager.get_queue_size()
                if queue_size > 0:
                    print(f"[Matchmaking] Queue has {queue_size} players")
                
                if queue_size >= 2:
                    print(f"[Matchmaking] Attempting to find match...")
                    match = await queue_manager.find_match()
                    if match:
                        player1, player2 = match
                        print(f"[Matchmaking] Match found! {player1.player_name} vs {player2.player_name}")
                        await self._create_match(player1, player2)
                    else:
                        print(f"[Matchmaking] find_match returned None despite {queue_size} players")
            except Exception as e:
                print(f"[Matchmaking] Queue processor error: {e}")
                import traceback
                traceback.print_exc()
            
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
            print(f"[Matchmaking] Creating match - updating ticket status...")
            # Remove tickets from database
            await self.repo.update_ticket_status(player1.player_id, "matched")
            await self.repo.update_ticket_status(player2.player_id, "matched")
            
            print(f"[Matchmaking] Creating lobby with category: {player1.game_mode}, map: {player1.map_slug}")
            # Create lobby with player1 as host, matched category, and map
            lobby = await self.lobby_service.create_lobby(
                host_id=player1.player_id,
                game_mode=player1.game_mode,
                category=player1.game_mode,  # Pass category for trivia questions
                map_slug=player1.map_slug,  # Pass map for arena selection
            )
            print(f"[Matchmaking] Lobby created: {lobby.get('code')}")
            
            # Add player2 to lobby
            lobby = await self.lobby_service.join_lobby(
                code=lobby["code"],
                player_id=player2.player_id,
            )
            print(f"[Matchmaking] Player2 joined lobby")
            
            # Send match_found events with map_slug
            match_event_p1 = MatchFoundEvent(
                lobby_code=lobby["code"],
                opponent_id=player2.player_id,
                opponent_name=player2.player_name,
                map_slug=player1.map_slug,
            )
            
            match_event_p2 = MatchFoundEvent(
                lobby_code=lobby["code"],
                opponent_id=player1.player_id,
                opponent_name=player1.player_name,
                map_slug=player1.map_slug,
            )
            
            # Send match_found events with retry for players not yet connected
            async def send_match_found(player_id: str, event: MatchFoundEvent, player_name: str):
                for attempt in range(5):  # Retry up to 5 times over 2.5 seconds
                    sent = await manager.send_to_user(player_id, {
                        "type": "match_found",
                        "payload": event.to_dict(),
                    })
                    if sent:
                        print(f"[Matchmaking] Sent match_found to {player_name} (attempt {attempt + 1})")
                        return True
                    await asyncio.sleep(0.5)  # Wait 500ms before retry
                print(f"[Matchmaking] Failed to send match_found to {player_name} after 5 attempts")
                return False
            
            # Send to both players (with retries)
            await asyncio.gather(
                send_match_found(player1.player_id, match_event_p1, player1.player_name),
                send_match_found(player2.player_id, match_event_p2, player2.player_name),
            )
            
            print(f"[Matchmaking] Match created successfully! Lobby: {lobby['code']}")
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
