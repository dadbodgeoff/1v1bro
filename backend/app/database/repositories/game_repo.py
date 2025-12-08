"""
Game repository.
Handles completed game records and history.
"""

from typing import Any, Optional

from supabase import Client

from app.database.repositories.base import BaseRepository


class GameRepository(BaseRepository):
    """Repository for games table operations."""

    def __init__(self, client: Client):
        super().__init__(client, "games")

    async def create_game(
        self,
        lobby_id: str,
        player1_id: str,
        player1_score: int,
        player2_id: str,
        player2_score: int,
        questions_data: list[dict],
        answers_data: Optional[dict[str, list]] = None,
        winner_id: Optional[str] = None,
        player1_combat_stats: Optional[dict] = None,
        player2_combat_stats: Optional[dict] = None,
    ) -> dict:
        """
        Create a completed game record.
        
        Args:
            lobby_id: Associated lobby UUID
            player1_id: First player UUID
            player1_score: First player's final score
            player2_id: Second player UUID
            player2_score: Second player's final score
            questions_data: List of questions used in the game
            answers_data: Dict mapping player_id to their answers
            winner_id: Winner UUID (None for tie)
            player1_combat_stats: Combat stats for player 1
            player2_combat_stats: Combat stats for player 2
            
        Returns:
            Created game record
        """
        data = {
            "lobby_id": lobby_id,
            "player1_id": player1_id,
            "player1_score": player1_score,
            "player2_id": player2_id,
            "player2_score": player2_score,
            "questions_data": questions_data,
            "answers_data": answers_data,
            "winner_id": winner_id,
            "player1_combat_stats": player1_combat_stats or {},
            "player2_combat_stats": player2_combat_stats or {},
        }
        result = self._table().insert(data).execute()
        return result.data[0]

    async def get_by_id(self, game_id: str) -> Optional[dict]:
        """Get game by ID with full details."""
        result = self._table().select("*").eq("id", game_id).execute()
        return result.data[0] if result.data else None

    async def get_by_lobby_id(self, lobby_id: str) -> Optional[dict]:
        """Get game associated with a lobby."""
        result = self._table().select("*").eq("lobby_id", lobby_id).execute()
        return result.data[0] if result.data else None

    async def get_user_history(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        """
        Get game history for a user.
        
        Args:
            user_id: User UUID
            limit: Max results
            offset: Pagination offset
            
        Returns:
            List of games where user was a player
        """
        result = (
            self._table()
            .select("*")
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")
            .order("completed_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data

    async def get_user_history_enhanced(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        """
        Get enhanced game history for a user with opponent details and ELO changes.
        
        Joins with user_profiles for opponent info and match_results for ELO data.
        
        Args:
            user_id: User UUID
            limit: Max results
            offset: Pagination offset
            
        Returns:
            List of games with opponent_name, opponent_avatar_url, and elo_change
        """
        # Get base game history
        games = await self.get_user_history(user_id, limit, offset)
        
        if not games:
            return []
        
        # Collect opponent IDs
        opponent_ids = set()
        game_ids = []
        for game in games:
            is_player1 = game["player1_id"] == user_id
            opponent_id = game["player2_id"] if is_player1 else game["player1_id"]
            opponent_ids.add(opponent_id)
            game_ids.append(game["id"])
        
        # Fetch opponent profiles
        profiles_result = (
            self.client.table("user_profiles")
            .select("id, display_name, avatar_url")
            .in_("id", list(opponent_ids))
            .execute()
        )
        profiles_map = {p["id"]: p for p in (profiles_result.data or [])}
        
        # Fetch ELO changes from match_results
        # Note: match_results uses match_id which corresponds to game.id
        elo_map = {}
        if game_ids:
            elo_result = (
                self.client.table("match_results")
                .select("match_id, player1_id, player2_id, elo_delta_p1, elo_delta_p2")
                .in_("match_id", game_ids)
                .execute()
            )
            for row in (elo_result.data or []):
                match_id = row["match_id"]
                if row["player1_id"] == user_id:
                    elo_map[match_id] = row.get("elo_delta_p1", 0)
                elif row["player2_id"] == user_id:
                    elo_map[match_id] = row.get("elo_delta_p2", 0)
        
        # Enhance games with opponent info and ELO
        enhanced_games = []
        for game in games:
            is_player1 = game["player1_id"] == user_id
            opponent_id = game["player2_id"] if is_player1 else game["player1_id"]
            opponent_profile = profiles_map.get(opponent_id, {})
            
            enhanced_game = {
                **game,
                "opponent_name": opponent_profile.get("display_name"),
                "opponent_avatar_url": opponent_profile.get("avatar_url"),
                "elo_change": elo_map.get(game["id"], 0),
            }
            enhanced_games.append(enhanced_game)
        
        return enhanced_games

    async def get_user_stats(self, user_id: str) -> dict:
        """
        Calculate user statistics from game history.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dict with games_played, games_won, total_score
        """
        games = await self.get_user_history(user_id, limit=1000)
        
        games_played = len(games)
        games_won = sum(1 for g in games if g.get("winner_id") == user_id)
        total_score = sum(
            g.get("player1_score", 0) if g.get("player1_id") == user_id 
            else g.get("player2_score", 0)
            for g in games
        )
        
        return {
            "games_played": games_played,
            "games_won": games_won,
            "total_score": total_score,
            "win_rate": games_won / games_played if games_played > 0 else 0,
        }

    async def get_recent_games(self, limit: int = 10) -> list[dict]:
        """
        Get most recent completed games.
        
        Args:
            limit: Max results
            
        Returns:
            List of recent games
        """
        result = (
            self._table()
            .select("*")
            .order("completed_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

    async def get_games_between_users(
        self,
        user1_id: str,
        user2_id: str,
        limit: int = 10,
    ) -> list[dict]:
        """
        Get games between two specific users.
        
        Args:
            user1_id: First user UUID
            user2_id: Second user UUID
            limit: Max results
            
        Returns:
            List of games between the two users
        """
        # Games where user1 is player1 and user2 is player2, or vice versa
        result = (
            self._table()
            .select("*")
            .or_(
                f"and(player1_id.eq.{user1_id},player2_id.eq.{user2_id}),"
                f"and(player1_id.eq.{user2_id},player2_id.eq.{user1_id})"
            )
            .order("completed_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data
