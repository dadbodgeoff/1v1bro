"""
Matchmaking repository.
Handles database operations for queue tickets and cooldowns.
"""

from datetime import datetime, timedelta
from typing import Optional, List

from supabase import Client

from app.core.logging import get_logger
from app.matchmaking.models import MatchTicket, CooldownInfo

logger = get_logger("matchmaking.repo")


class MatchmakingRepository:
    """Repository for matchmaking database operations."""
    
    def __init__(self, client: Client):
        self.client = client
    
    async def save_ticket(self, ticket: MatchTicket) -> None:
        """
        Persist a queue ticket to the database.
        
        Args:
            ticket: MatchTicket to save
        """
        try:
            self.client.table("matchmaking_queue").upsert({
                "id": ticket.id,
                "player_id": ticket.player_id,
                "player_name": ticket.player_name,
                "game_mode": ticket.game_mode,
                "queue_time": ticket.queue_time.isoformat(),
                "status": "waiting",
            }).execute()
            logger.debug(f"Saved ticket {ticket.id} for player {ticket.player_id}")
        except Exception as e:
            logger.error(f"Failed to save ticket: {e}")
            raise
    
    async def delete_ticket(self, player_id: str) -> None:
        """
        Remove a player's ticket from the database.
        
        Args:
            player_id: Player UUID
        """
        try:
            self.client.table("matchmaking_queue").delete().eq(
                "player_id", player_id
            ).execute()
            logger.debug(f"Deleted ticket for player {player_id}")
        except Exception as e:
            logger.error(f"Failed to delete ticket: {e}")
            raise
    
    async def update_ticket_status(self, player_id: str, status: str) -> None:
        """
        Update a ticket's status.
        
        Args:
            player_id: Player UUID
            status: New status (waiting, matched, expired, cancelled)
        """
        try:
            self.client.table("matchmaking_queue").update({
                "status": status
            }).eq("player_id", player_id).execute()
            logger.debug(f"Updated ticket status to {status} for player {player_id}")
        except Exception as e:
            logger.error(f"Failed to update ticket status: {e}")
            raise
    
    async def get_active_tickets(self) -> List[MatchTicket]:
        """
        Get all active (waiting) tickets for queue recovery.
        
        Returns:
            List of active MatchTickets
        """
        try:
            # Get tickets that are waiting and less than 10 minutes old
            cutoff = (datetime.utcnow() - timedelta(minutes=10)).isoformat()
            
            result = self.client.table("matchmaking_queue").select("*").eq(
                "status", "waiting"
            ).gte("queue_time", cutoff).order("queue_time").execute()
            
            tickets = [MatchTicket.from_dict(row) for row in result.data]
            logger.info(f"Recovered {len(tickets)} active tickets from database")
            return tickets
        except Exception as e:
            logger.error(f"Failed to get active tickets: {e}")
            return []
    
    async def get_ticket_by_player(self, player_id: str) -> Optional[MatchTicket]:
        """
        Get a player's active ticket.
        
        Args:
            player_id: Player UUID
            
        Returns:
            MatchTicket if found, None otherwise
        """
        try:
            result = self.client.table("matchmaking_queue").select("*").eq(
                "player_id", player_id
            ).eq("status", "waiting").single().execute()
            
            if result.data:
                return MatchTicket.from_dict(result.data)
            return None
        except Exception:
            return None
    
    async def get_cooldown(self, player_id: str) -> Optional[CooldownInfo]:
        """
        Get a player's active cooldown.
        
        Args:
            player_id: Player UUID
            
        Returns:
            CooldownInfo if active cooldown exists, None otherwise
        """
        try:
            result = self.client.table("queue_cooldowns").select("*").eq(
                "player_id", player_id
            ).gt("cooldown_until", datetime.utcnow().isoformat()).order(
                "cooldown_until", desc=True
            ).limit(1).execute()
            
            if result.data:
                row = result.data[0]
                cooldown_until = datetime.fromisoformat(
                    row["cooldown_until"].replace("Z", "+00:00")
                )
                remaining = max(0, int((cooldown_until - datetime.utcnow()).total_seconds()))
                
                return CooldownInfo(
                    cooldown_until=cooldown_until,
                    reason=row["reason"],
                    remaining_seconds=remaining,
                )
            return None
        except Exception as e:
            logger.error(f"Failed to get cooldown: {e}")
            return None
    
    async def set_cooldown(
        self,
        player_id: str,
        minutes: int,
        reason: str,
    ) -> None:
        """
        Set a queue cooldown for a player.
        
        Args:
            player_id: Player UUID
            minutes: Cooldown duration in minutes
            reason: Reason for cooldown (early_leave, abuse, manual)
        """
        try:
            cooldown_until = datetime.utcnow() + timedelta(minutes=minutes)
            
            self.client.table("queue_cooldowns").insert({
                "player_id": player_id,
                "cooldown_until": cooldown_until.isoformat(),
                "reason": reason,
            }).execute()
            
            logger.info(f"Set {minutes}min cooldown for player {player_id}: {reason}")
        except Exception as e:
            logger.error(f"Failed to set cooldown: {e}")
            raise
    
    async def get_player_mmr(self, player_id: str) -> int:
        """
        Get a player's current MMR.
        
        Args:
            player_id: Player UUID
            
        Returns:
            Player's MMR (default 1000)
        """
        try:
            result = self.client.table("user_profiles").select("mmr").eq(
                "id", player_id
            ).single().execute()
            
            if result.data and result.data.get("mmr"):
                return result.data["mmr"]
            return 1000
        except Exception:
            return 1000
    
    async def update_mmr(self, player_id: str, new_mmr: int) -> None:
        """
        Update a player's MMR.
        
        Args:
            player_id: Player UUID
            new_mmr: New MMR value (clamped to 100-3000)
        """
        try:
            clamped_mmr = max(100, min(3000, new_mmr))
            
            self.client.table("user_profiles").update({
                "mmr": clamped_mmr
            }).eq("id", player_id).execute()
            
            logger.debug(f"Updated MMR for player {player_id}: {clamped_mmr}")
        except Exception as e:
            logger.error(f"Failed to update MMR: {e}")
            raise
    
    async def increment_early_leave(self, player_id: str) -> int:
        """
        Increment a player's early leave count.
        
        Resets count if it's a new day.
        
        Args:
            player_id: Player UUID
            
        Returns:
            New early leave count
        """
        try:
            # Get current count and reset date
            result = self.client.table("user_profiles").select(
                "early_leave_count", "early_leave_reset_date"
            ).eq("id", player_id).single().execute()
            
            current_count = 0
            if result.data:
                reset_date = result.data.get("early_leave_reset_date")
                today = datetime.utcnow().date().isoformat()
                
                if reset_date == today:
                    current_count = result.data.get("early_leave_count", 0)
                # If different day, count resets to 0
            
            new_count = current_count + 1
            
            self.client.table("user_profiles").update({
                "early_leave_count": new_count,
                "early_leave_reset_date": datetime.utcnow().date().isoformat(),
            }).eq("id", player_id).execute()
            
            logger.info(f"Player {player_id} early leave count: {new_count}")
            return new_count
        except Exception as e:
            logger.error(f"Failed to increment early leave: {e}")
            return 1
    
    async def cleanup_expired_tickets(self) -> int:
        """
        Mark expired tickets (older than 10 minutes).
        
        Returns:
            Number of tickets expired
        """
        try:
            cutoff = (datetime.utcnow() - timedelta(minutes=10)).isoformat()
            
            result = self.client.table("matchmaking_queue").update({
                "status": "expired"
            }).eq("status", "waiting").lt("queue_time", cutoff).execute()
            
            count = len(result.data) if result.data else 0
            if count > 0:
                logger.info(f"Expired {count} old queue tickets")
            return count
        except Exception as e:
            logger.error(f"Failed to cleanup expired tickets: {e}")
            return 0
