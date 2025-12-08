"""
Match Results repository - Database operations for match history and ELO tracking.
Requirements: 6.2, 6.8
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class MatchResultsRepository:
    """Repository for match results database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _results(self):
        return self._client.table("match_results")

    # ============================================
    # Match Result Operations
    # ============================================

    async def create_result(
        self,
        match_id: str,
        player1_id: str,
        player2_id: str,
        winner_id: Optional[str],
        duration_seconds: Optional[int],
        player1_pre_elo: int,
        player2_pre_elo: int,
        player1_post_elo: int,
        player2_post_elo: int,
        elo_delta_p1: int,
        elo_delta_p2: int,
    ) -> dict:
        """
        Create a match result record with ELO deltas.
        
        Requirements: 6.2 - Record match_history with all game details.
        """
        result = (
            self._results()
            .insert({
                "match_id": match_id,
                "player1_id": player1_id,
                "player2_id": player2_id,
                "winner_id": winner_id,
                "duration_seconds": duration_seconds,
                "player1_pre_elo": player1_pre_elo,
                "player2_pre_elo": player2_pre_elo,
                "player1_post_elo": player1_post_elo,
                "player2_post_elo": player2_post_elo,
                "elo_delta_p1": elo_delta_p1,
                "elo_delta_p2": elo_delta_p2,
                "played_at": datetime.utcnow().isoformat(),
            })
            .execute()
        )
        return result.data[0] if result.data else {}

    async def get_result(self, match_id: str) -> Optional[dict]:
        """Get a match result by match_id."""
        result = (
            self._results()
            .select("*")
            .eq("match_id", match_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_results_for_player(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get match results for a player with pagination.
        
        Returns matches where user was either player1 or player2.
        """
        # Get matches where user is player1
        result1 = (
            self._results()
            .select("*")
            .eq("player1_id", user_id)
            .order("played_at", desc=True)
            .execute()
        )
        
        # Get matches where user is player2
        result2 = (
            self._results()
            .select("*")
            .eq("player2_id", user_id)
            .order("played_at", desc=True)
            .execute()
        )
        
        # Combine and sort
        all_matches = (result1.data or []) + (result2.data or [])
        all_matches.sort(key=lambda x: x.get("played_at", ""), reverse=True)
        
        # Apply pagination
        return all_matches[offset:offset + limit]

    async def get_results_count_for_player(self, user_id: str) -> int:
        """Get total match count for a player."""
        result1 = (
            self._results()
            .select("id", count="exact")
            .eq("player1_id", user_id)
            .execute()
        )
        
        result2 = (
            self._results()
            .select("id", count="exact")
            .eq("player2_id", user_id)
            .execute()
        )
        
        return (result1.count or 0) + (result2.count or 0)

    async def get_head_to_head(
        self,
        user_id: str,
        opponent_id: str,
    ) -> dict:
        """
        Get win/loss record against a specific opponent.
        
        Requirements: 6.8 - Return win/loss record against specific opponents.
        
        Returns:
            Dict with wins, losses, draws, and total games
        """
        # Get all matches between these two players
        result1 = (
            self._results()
            .select("*")
            .eq("player1_id", user_id)
            .eq("player2_id", opponent_id)
            .execute()
        )
        
        result2 = (
            self._results()
            .select("*")
            .eq("player1_id", opponent_id)
            .eq("player2_id", user_id)
            .execute()
        )
        
        all_matches = (result1.data or []) + (result2.data or [])
        
        wins = 0
        losses = 0
        draws = 0
        
        for match in all_matches:
            winner = match.get("winner_id")
            if winner is None:
                draws += 1
            elif winner == user_id:
                wins += 1
            else:
                losses += 1
        
        return {
            "user_id": user_id,
            "opponent_id": opponent_id,
            "wins": wins,
            "losses": losses,
            "draws": draws,
            "total_games": len(all_matches),
            "win_rate": wins / len(all_matches) if all_matches else 0.0,
        }

    async def get_recent_results(
        self,
        user_id: str,
        limit: int = 10,
    ) -> List[dict]:
        """Get most recent match results for a player."""
        return await self.get_results_for_player(user_id, limit=limit, offset=0)

    async def get_player_stats_from_results(self, user_id: str) -> dict:
        """
        Calculate player stats from match results.
        
        Returns:
            Dict with wins, losses, win_rate, avg_elo_change
        """
        matches = await self.get_results_for_player(user_id, limit=1000, offset=0)
        
        wins = 0
        losses = 0
        total_elo_change = 0
        
        for match in matches:
            winner = match.get("winner_id")
            
            # Determine if user was player1 or player2
            if match.get("player1_id") == user_id:
                elo_delta = match.get("elo_delta_p1", 0)
            else:
                elo_delta = match.get("elo_delta_p2", 0)
            
            total_elo_change += elo_delta
            
            if winner == user_id:
                wins += 1
            elif winner is not None:
                losses += 1
        
        total_games = wins + losses
        
        return {
            "wins": wins,
            "losses": losses,
            "total_games": total_games,
            "win_rate": wins / total_games if total_games > 0 else 0.0,
            "total_elo_change": total_elo_change,
            "avg_elo_change": total_elo_change / total_games if total_games > 0 else 0.0,
        }
