"""
Unified Stats Repository - Single source of truth for player stats and ELO.
Requirements: 4.1, 5.1, 5.2, 5.3
"""

from typing import Optional, List
from datetime import datetime

from supabase import Client


class UnifiedStatsRepository:
    """Repository for unified player stats including ELO from user_profiles."""

    def __init__(self, client: Client):
        self._client = client

    def _profiles(self):
        return self._client.table("user_profiles")

    # ============================================
    # Player Stats Operations
    # ============================================

    async def get_player_stats(self, user_id: str) -> Optional[dict]:
        """
        Get all stats including ELO for a player.
        
        Returns:
            Complete stats dict or None if not found
        """
        result = (
            self._profiles()
            .select(
                "id, display_name, avatar_url, country, "
                "games_played, games_won, total_score, "
                "total_kills, total_deaths, shots_fired, shots_hit, "
                "total_questions_answered, total_correct_answers, "
                "total_answer_time_ms, fastest_answer_ms, "
                "current_win_streak, best_win_streak, "
                "current_elo, peak_elo, current_tier"
            )
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def update_stats_with_elo(
        self,
        user_id: str,
        games_played_delta: int = 0,
        games_won_delta: int = 0,
        score_delta: int = 0,
        questions_delta: int = 0,
        correct_delta: int = 0,
        answer_time_delta: int = 0,
        kills_delta: int = 0,
        deaths_delta: int = 0,
        damage_dealt_delta: int = 0,
        damage_taken_delta: int = 0,
        shots_fired_delta: int = 0,
        shots_hit_delta: int = 0,
        powerups_delta: int = 0,
        elo_delta: int = 0,
        new_tier: Optional[str] = None,
    ) -> None:
        """
        Atomically update stats and ELO using stored procedure.
        
        Requirements: 3.1 - Single transaction for all updates
        """
        self._client.rpc(
            "increment_player_stats",
            {
                "p_user_id": user_id,
                "p_games_played_delta": games_played_delta,
                "p_games_won_delta": games_won_delta,
                "p_score_delta": score_delta,
                "p_questions_delta": questions_delta,
                "p_correct_delta": correct_delta,
                "p_answer_time_delta": answer_time_delta,
                "p_kills_delta": kills_delta,
                "p_deaths_delta": deaths_delta,
                "p_damage_dealt_delta": damage_dealt_delta,
                "p_damage_taken_delta": damage_taken_delta,
                "p_shots_fired_delta": shots_fired_delta,
                "p_shots_hit_delta": shots_hit_delta,
                "p_powerups_delta": powerups_delta,
                "p_elo_delta": elo_delta,
                "p_new_tier": new_tier,
            }
        ).execute()

    # ============================================
    # ELO Leaderboard Operations
    # ============================================

    async def get_elo_leaderboard(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get ELO leaderboard from user_profiles.
        
        Requirements: 4.1 - games_played from user_profiles (not hardcoded)
        """
        result = self._client.rpc(
            "get_leaderboard_elo",
            {"p_limit": limit, "p_offset": offset}
        ).execute()
        return result.data or []

    async def get_elo_leaderboard_direct(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get ELO leaderboard directly from table (fallback if RPC unavailable).
        """
        result = (
            self._profiles()
            .select(
                "id, display_name, avatar_url, "
                "current_elo, peak_elo, current_tier, "
                "games_played, games_won"
            )
            .not_.is_("current_elo", "null")
            .order("current_elo", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    async def get_regional_elo_leaderboard(
        self,
        country: str,
        limit: int = 100,
    ) -> List[dict]:
        """
        Get regional ELO leaderboard filtered by country.
        
        Requirements: 5.3 - Filter by country column in user_profiles
        """
        result = self._client.rpc(
            "get_leaderboard_elo_regional",
            {"p_country": country.upper(), "p_limit": limit}
        ).execute()
        return result.data or []

    async def get_regional_elo_leaderboard_direct(
        self,
        country: str,
        limit: int = 100,
    ) -> List[dict]:
        """
        Get regional ELO leaderboard directly (fallback).
        """
        result = (
            self._profiles()
            .select(
                "id, display_name, avatar_url, "
                "current_elo, peak_elo, current_tier, "
                "games_played, games_won, country"
            )
            .eq("country", country.upper())
            .not_.is_("current_elo", "null")
            .order("current_elo", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def count_with_elo(self) -> int:
        """Get total count of players with ELO ratings."""
        result = (
            self._profiles()
            .select("id", count="exact")
            .not_.is_("current_elo", "null")
            .execute()
        )
        return result.count or 0

    async def get_user_elo_rank(self, user_id: str) -> Optional[int]:
        """
        Get user's global ELO rank position.
        
        Returns:
            Rank (1-indexed) or None if not ranked
        """
        stats = await self.get_player_stats(user_id)
        if not stats or stats.get("current_elo") is None:
            return None
        
        user_elo = stats.get("current_elo", 1200)
        
        # Count players with higher ELO
        result = (
            self._profiles()
            .select("id", count="exact")
            .gt("current_elo", user_elo)
            .execute()
        )
        
        higher_count = result.count or 0
        return higher_count + 1

    async def get_nearby_players(
        self,
        user_id: str,
        range_size: int = 5,
    ) -> List[dict]:
        """
        Get players near the user's ELO rank (±range_size positions).
        """
        rank = await self.get_user_elo_rank(user_id)
        if not rank:
            return []
        
        start_rank = max(1, rank - range_size)
        offset = start_rank - 1
        limit = (range_size * 2) + 1
        
        result = (
            self._profiles()
            .select(
                "id, display_name, avatar_url, "
                "current_elo, peak_elo, current_tier, "
                "games_played, games_won"
            )
            .not_.is_("current_elo", "null")
            .order("current_elo", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    # ============================================
    # Tier Operations
    # ============================================

    async def get_players_by_tier(self, tier: str, limit: int = 50) -> List[dict]:
        """Get players in a specific tier."""
        result = (
            self._profiles()
            .select(
                "id, display_name, avatar_url, "
                "current_elo, peak_elo, current_tier, "
                "games_played, games_won"
            )
            .eq("current_tier", tier)
            .order("current_elo", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def get_tier_counts(self) -> dict:
        """Get count of players in each tier."""
        tiers = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"]
        counts = {}
        
        for tier in tiers:
            result = (
                self._profiles()
                .select("id", count="exact")
                .eq("current_tier", tier)
                .execute()
            )
            counts[tier] = result.count or 0
        
        return counts
