"""
Queue manager for matchmaking.
Handles in-memory queue operations with FIFO matching.
"""

import asyncio
from datetime import datetime
from typing import Dict, Optional, Tuple, List

from app.core.logging import get_logger
from app.matchmaking.models import MatchTicket

logger = get_logger("matchmaking.queue")


class QueueManager:
    """
    In-memory queue manager with FIFO matching.
    
    Thread-safe via asyncio.Lock for concurrent access.
    Database persistence handled separately by MatchmakingRepository.
    """
    
    def __init__(self):
        self._queue: Dict[str, MatchTicket] = {}  # player_id -> ticket
        self._lock: asyncio.Lock = asyncio.Lock()
    
    async def add(self, ticket: MatchTicket) -> bool:
        """
        Add a ticket to the queue.
        
        Args:
            ticket: MatchTicket to add
            
        Returns:
            True if added, False if player already in queue
        """
        async with self._lock:
            if ticket.player_id in self._queue:
                logger.warning(f"Player {ticket.player_id} already in queue")
                return False
            
            self._queue[ticket.player_id] = ticket
            logger.info(f"Added player {ticket.player_id} to queue (size: {len(self._queue)})")
            return True
    
    async def remove(self, player_id: str) -> Optional[MatchTicket]:
        """
        Remove a player from the queue.
        
        Args:
            player_id: Player UUID to remove
            
        Returns:
            Removed MatchTicket if found, None otherwise
        """
        async with self._lock:
            ticket = self._queue.pop(player_id, None)
            if ticket:
                logger.info(f"Removed player {player_id} from queue (size: {len(self._queue)})")
            return ticket
    
    async def get(self, player_id: str) -> Optional[MatchTicket]:
        """
        Get a player's ticket without removing.
        
        Args:
            player_id: Player UUID
            
        Returns:
            MatchTicket if found, None otherwise
        """
        async with self._lock:
            return self._queue.get(player_id)
    
    async def contains(self, player_id: str) -> bool:
        """
        Check if a player is in the queue.
        
        Args:
            player_id: Player UUID
            
        Returns:
            True if player is in queue
        """
        async with self._lock:
            return player_id in self._queue
    
    async def find_match(self) -> Optional[Tuple[MatchTicket, MatchTicket]]:
        """
        Find two players to match using FIFO ordering.
        
        Returns the two longest-waiting players.
        
        Returns:
            Tuple of (player1, player2) tickets if match found, None otherwise
        """
        async with self._lock:
            if len(self._queue) < 2:
                return None
            
            # Sort by queue time (oldest first) - FIFO
            sorted_tickets = sorted(
                self._queue.values(),
                key=lambda t: t.queue_time
            )
            
            # Match the two longest-waiting players
            player1 = sorted_tickets[0]
            player2 = sorted_tickets[1]
            
            # Remove both from queue atomically
            del self._queue[player1.player_id]
            del self._queue[player2.player_id]
            
            logger.info(
                f"Matched players {player1.player_id} (waited {player1.wait_seconds:.1f}s) "
                f"and {player2.player_id} (waited {player2.wait_seconds:.1f}s)"
            )
            
            return (player1, player2)
    
    async def get_position(self, player_id: str) -> Optional[int]:
        """
        Get a player's position in the queue (1-indexed).
        
        Args:
            player_id: Player UUID
            
        Returns:
            Position (1 = first in line) or None if not in queue
        """
        async with self._lock:
            if player_id not in self._queue:
                return None
            
            # Sort by queue time and find position
            sorted_ids = sorted(
                self._queue.keys(),
                key=lambda pid: self._queue[pid].queue_time
            )
            
            try:
                return sorted_ids.index(player_id) + 1
            except ValueError:
                return None
    
    def get_queue_size(self) -> int:
        """
        Get current queue size.
        
        Returns:
            Number of players in queue
        """
        return len(self._queue)
    
    async def get_all_tickets(self) -> List[MatchTicket]:
        """
        Get all tickets in the queue.
        
        Returns:
            List of all MatchTickets, sorted by queue time
        """
        async with self._lock:
            return sorted(
                self._queue.values(),
                key=lambda t: t.queue_time
            )
    
    async def restore_tickets(self, tickets: List[MatchTicket]) -> int:
        """
        Restore tickets from database (for crash recovery).
        
        Args:
            tickets: List of tickets to restore
            
        Returns:
            Number of tickets restored
        """
        async with self._lock:
            count = 0
            for ticket in tickets:
                if ticket.player_id not in self._queue:
                    self._queue[ticket.player_id] = ticket
                    count += 1
            
            logger.info(f"Restored {count} tickets to queue")
            return count
    
    async def clear(self) -> int:
        """
        Clear all tickets from the queue.
        
        Returns:
            Number of tickets cleared
        """
        async with self._lock:
            count = len(self._queue)
            self._queue.clear()
            logger.info(f"Cleared {count} tickets from queue")
            return count


# Global queue manager instance
queue_manager = QueueManager()
