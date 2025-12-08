"""
Leaderboard service.
Handles leaderboard queries, user rank calculations, and ELO ratings.
Requirements: 5.1-5.10

Updated to use UnifiedStatsRepository for single source of truth.
"""

import math
from typing import Dict, List, Optional, Tuple

from supabase import Client

from app.database.repositories.leaderboard_repo import LeaderboardRepository
from app.database.repositories.unified_stats_repo import UnifiedStatsRepository
from app.database.repositories.match_results_repo import MatchResultsRepository
from app.cache.cache_manager import CacheManager
from app.schemas.leaderboard import (
    LeaderboardCategory, LeaderboardResponse, UserRankResponse,
    RankTier, PlayerRating, ELOLeaderboardEntry, ELOLeaderboardResponse,
    UserELORankResponse, MatchResult, ELOCalculationResult,
)
from app.services.base import BaseService


# Minimum requirements for eligibility (category -> (field, min_value, description))
REQUIREMENTS: Dict[LeaderboardCategory, Tuple[str, int, str]] = {
    LeaderboardCategory.WIN_RATE: ("games_played", 10, "10+ games played"),
    LeaderboardCategory.KD_RATIO: ("total_deaths", 10, "10+ deaths"),
    LeaderboardCategory.ACCURACY: ("shots_fired", 100, "100+ shots fired"),
    LeaderboardCategory.FASTEST_THINKER: ("total_correct_answers", 50, "50+ correct answers"),
    LeaderboardCategory.ANSWER_RATE: ("total_questions_answered", 100, "100+ questions answered"),
}


# ELO Constants (Requirements: 5.1)
K_FACTORS = {
    (0, 2000): 32,
    (2000, 2400): 24,
    (2400, 3001): 16,
}

# Rank Tiers (Requirements: 5.5)
TIER_RANGES = {
    (100, 800): RankTier.BRONZE,
    (800, 1200): RankTier.SILVER,
    (1200, 1600): RankTier.GOLD,
    (1600, 2000): RankTier.PLATINUM,
    (2000, 2400): RankTier.DIAMOND,
    (2400, 2800): RankTier.MASTER,
    (2800, 3001): RankTier.GRANDMASTER,
}

# ELO Bounds (Requirements: 5.4)
ELO_MIN = 100
ELO_MAX = 3000

# Default starting ELO (Requirements: 5.2)
DEFAULT_ELO = 1200

# Cache TTL
LEADERBOARD_CACHE_TTL = 300  # 5 minutes


class LeaderboardService(BaseService):
    """Service for leaderboard operations and ELO ratings."""

    def __init__(self, client: Client, cache: Optional[CacheManager] = None):
        super().__init__(client)
        self.leaderboard_repo = LeaderboardRepository(client)
        self.unified_stats_repo = UnifiedStatsRepository(client)
        self.results_repo = MatchResultsRepository(client)
        self.cache = cache

    async def get_leaderboard(
        self,
        category: LeaderboardCategory,
        limit: int = 10,
        offset: int = 0,
    ) -> LeaderboardResponse:
        """
        Get leaderboard for a category.
        
        Args:
            category: Leaderboard category
            limit: Max entries (1-100)
            offset: Pagination offset
            
        Returns:
            LeaderboardResponse with entries and metadata
        """
        # Clamp limit
        limit = max(1, min(100, limit))
        offset = max(0, offset)
        
        entries = await self.leaderboard_repo.query_leaderboard(
            category=category,
            limit=limit,
            offset=offset,
        )
        
        total = await self.leaderboard_repo.count_eligible(category)
        
        requirement = REQUIREMENTS.get(category)
        min_req_str = requirement[2] if requirement else None
        
        return LeaderboardResponse(
            category=category,
            entries=entries,
            total_eligible=total,
            page=(offset // limit) + 1,
            page_size=limit,
            minimum_requirement=min_req_str,
        )

    async def get_user_rank(
        self,
        user_id: str,
        category: LeaderboardCategory,
    ) -> UserRankResponse:
        """
        Get a user's rank in a specific category.
        
        Args:
            user_id: User UUID
            category: Leaderboard category
            
        Returns:
            UserRankResponse with rank and eligibility info
        """
        stat_value, eligible = await self.leaderboard_repo.get_user_stat_value(
            user_id, category
        )
        
        rank = None
        if eligible:
            rank = await self._calculate_rank(user_id, category, stat_value)
        
        requirement = REQUIREMENTS.get(category)
        
        return UserRankResponse(
            category=category,
            rank=rank,
            stat_value=stat_value,
            eligible=eligible,
            requirement_met=eligible,
            requirement=requirement[2] if requirement else None,
        )

    async def get_all_user_ranks(
        self,
        user_id: str,
    ) -> Dict[str, Optional[int]]:
        """
        Get user's rank in all categories.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dict mapping category name to rank (None if not eligible)
        """
        ranks = {}
        for category in LeaderboardCategory:
            response = await self.get_user_rank(user_id, category)
            ranks[category.value] = response.rank
        return ranks

    async def _calculate_rank(
        self,
        user_id: str,
        category: LeaderboardCategory,
        stat_value: float,
    ) -> Optional[int]:
        """
        Calculate user's rank by counting players with better stats.
        
        For most categories, higher is better.
        For FASTEST_THINKER, lower is better.
        """
        # Get all entries and find position
        # For efficiency, we query a reasonable chunk
        entries = await self.leaderboard_repo.query_leaderboard(
            category=category,
            limit=1000,
            offset=0,
        )
        
        for entry in entries:
            if entry.user_id == user_id:
                return entry.rank
        
        # User not in top 1000, estimate rank
        total = await self.leaderboard_repo.count_eligible(category)
        return total if total > 0 else None

    # ============================================
    # ELO Rating Methods (Requirements: 5.1-5.10)
    # ============================================

    def get_k_factor(self, elo: int) -> int:
        """
        Get K-factor based on ELO rating.
        
        Requirements: 5.1 - K=32 for <2000, K=24 for 2000-2400, K=16 for 2400+
        """
        for (low, high), k in K_FACTORS.items():
            if low <= elo < high:
                return k
        return 16  # Default for very high ratings

    def get_tier(self, elo: int) -> RankTier:
        """
        Get rank tier for an ELO value.
        
        Requirements: 5.5 - Assign rank tiers based on ELO ranges.
        """
        for (low, high), tier in TIER_RANGES.items():
            if low <= elo < high:
                return tier
        return RankTier.GRANDMASTER if elo >= 2800 else RankTier.BRONZE

    def _clamp_elo(self, elo: int) -> int:
        """
        Clamp ELO to valid range [100, 3000].
        
        Requirements: 5.4 - Clamp ELO to prevent extreme outliers.
        """
        return max(ELO_MIN, min(ELO_MAX, elo))

    def calculate_elo_change(
        self,
        player1_elo: int,
        player2_elo: int,
        player1_won: bool,
    ) -> Tuple[int, int]:
        """
        Calculate ELO changes using standard formula.
        
        Requirements: 5.3 - new_elo = old_elo + K * (score - expected_score)
        
        Args:
            player1_elo: Player 1's current ELO
            player2_elo: Player 2's current ELO
            player1_won: True if player 1 won
            
        Returns:
            Tuple of (player1_delta, player2_delta)
        """
        # Calculate expected scores
        exp1 = 1 / (1 + 10 ** ((player2_elo - player1_elo) / 400))
        exp2 = 1 - exp1
        
        # Actual scores
        score1 = 1.0 if player1_won else 0.0
        score2 = 1.0 - score1
        
        # Get K-factors
        k1 = self.get_k_factor(player1_elo)
        k2 = self.get_k_factor(player2_elo)
        
        # Calculate deltas
        delta1 = round(k1 * (score1 - exp1))
        delta2 = round(k2 * (score2 - exp2))
        
        return delta1, delta2

    async def update_ratings(
        self,
        match_id: str,
        player1_id: str,
        player2_id: str,
        winner_id: Optional[str],
        duration_seconds: Optional[int] = None,
    ) -> Optional[MatchResult]:
        """
        Update both players' ELO ratings after a match in user_profiles.
        
        Requirements: 5.3 - Calculate and update ELO after match.
        Updated to use UnifiedStatsRepository for single source of truth.
        
        Args:
            match_id: Match UUID
            player1_id: Player 1 UUID
            player2_id: Player 2 UUID
            winner_id: Winner UUID (None for draw)
            duration_seconds: Match duration
            
        Returns:
            MatchResult with ELO changes
        """
        # Get current ELO from user_profiles (unified source)
        stats1 = await self.unified_stats_repo.get_player_stats(player1_id)
        stats2 = await self.unified_stats_repo.get_player_stats(player2_id)
        
        p1_elo = stats1.get("current_elo", DEFAULT_ELO) if stats1 else DEFAULT_ELO
        p2_elo = stats2.get("current_elo", DEFAULT_ELO) if stats2 else DEFAULT_ELO
        
        # Calculate ELO changes
        player1_won = winner_id == player1_id
        delta1, delta2 = self.calculate_elo_change(p1_elo, p2_elo, player1_won)
        
        # Calculate new ELOs with clamping
        new_p1_elo = self._clamp_elo(p1_elo + delta1)
        new_p2_elo = self._clamp_elo(p2_elo + delta2)
        
        # Get new tiers
        new_tier1 = self.get_tier(new_p1_elo)
        new_tier2 = self.get_tier(new_p2_elo)
        
        # Update ELO in user_profiles using unified repo (atomic with stats)
        # Note: This only updates ELO, not game stats - those are updated separately
        await self.unified_stats_repo.update_stats_with_elo(
            user_id=player1_id,
            elo_delta=delta1,
            new_tier=new_tier1.value,
        )
        await self.unified_stats_repo.update_stats_with_elo(
            user_id=player2_id,
            elo_delta=delta2,
            new_tier=new_tier2.value,
        )
        
        # Record match result
        result_data = await self.results_repo.create_result(
            match_id=match_id,
            player1_id=player1_id,
            player2_id=player2_id,
            winner_id=winner_id,
            duration_seconds=duration_seconds,
            player1_pre_elo=p1_elo,
            player2_pre_elo=p2_elo,
            player1_post_elo=new_p1_elo,
            player2_post_elo=new_p2_elo,
            elo_delta_p1=delta1,
            elo_delta_p2=delta2,
        )
        
        # Invalidate leaderboard caches
        await self._invalidate_leaderboard_caches()
        
        return MatchResult(**result_data) if result_data else None

    async def _invalidate_leaderboard_caches(self) -> None:
        """Invalidate all leaderboard caches after stats/ELO update."""
        if self.cache:
            # Invalidate ELO leaderboard
            await self.cache.delete(CacheManager.key("leaderboard", "global", "elo"))
            # Invalidate legacy leaderboards
            for category in LeaderboardCategory:
                await self.cache.delete(
                    CacheManager.key("leaderboard", category.value, "global")
                )

    # ============================================
    # ELO Leaderboard Methods
    # ============================================

    async def get_global_leaderboard(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> ELOLeaderboardResponse:
        """
        Get global leaderboard sorted by ELO from user_profiles.
        
        Requirements: 5.6 - Return top 100 players sorted by ELO descending.
        Updated to use UnifiedStatsRepository for single source of truth.
        """
        # Check cache
        if self.cache and offset == 0 and limit == 100:
            cache_key = CacheManager.key("leaderboard", "global", "elo")
            cached = await self.cache.get_json(cache_key)
            if cached:
                return ELOLeaderboardResponse(**cached)
        
        # Fetch from unified user_profiles table
        data = await self.unified_stats_repo.get_elo_leaderboard(limit=limit, offset=offset)
        total = await self.unified_stats_repo.count_with_elo()
        
        # Convert to entries - now games_played comes from user_profiles!
        entries = []
        for i, row in enumerate(data):
            games_played = row.get("secondary_stat", 0) or 0
            games_won = 0  # Would need separate query if needed
            
            # Calculate win rate from user_profiles data
            # Note: For RPC results, we get stat_value (elo) and secondary_stat (games_played)
            win_rate = 0.0
            
            entries.append(ELOLeaderboardEntry(
                rank=row.get("rank", offset + i + 1),
                user_id=str(row.get("user_id", "")),
                display_name=row.get("display_name"),
                avatar_url=row.get("avatar_url"),
                elo=int(row.get("stat_value", DEFAULT_ELO)),
                tier=RankTier(row.get("tier", "Gold")),
                win_rate=win_rate,
                games_played=int(games_played),  # Now populated from user_profiles!
            ))
        
        response = ELOLeaderboardResponse(
            entries=entries,
            total_players=total,
            page=(offset // limit) + 1 if limit > 0 else 1,
            page_size=limit,
        )
        
        # Cache result
        if self.cache and offset == 0 and limit == 100:
            cache_key = CacheManager.key("leaderboard", "global", "elo")
            await self.cache.set_json(cache_key, response.model_dump(), LEADERBOARD_CACHE_TTL)
        
        return response

    async def get_regional_leaderboard(
        self,
        region: str,
        limit: int = 100,
    ) -> ELOLeaderboardResponse:
        """
        Get regional leaderboard filtered by country from user_profiles.
        
        Requirements: 5.7 - Filter by player country and return top 100.
        Updated to use UnifiedStatsRepository for single source of truth.
        """
        data = await self.unified_stats_repo.get_regional_elo_leaderboard(region, limit=limit)
        
        entries = []
        for i, row in enumerate(data):
            games_played = row.get("secondary_stat", 0) or 0
            
            entries.append(ELOLeaderboardEntry(
                rank=row.get("rank", i + 1),
                user_id=str(row.get("user_id", "")),
                display_name=row.get("display_name"),
                avatar_url=row.get("avatar_url"),
                elo=int(row.get("stat_value", DEFAULT_ELO)),
                tier=RankTier(row.get("tier", "Gold")),
                win_rate=0.0,
                games_played=int(games_played),  # Now populated from user_profiles!
            ))
        
        return ELOLeaderboardResponse(
            entries=entries,
            total_players=len(entries),
            page=1,
            page_size=limit,
            region=region.upper(),
        )

    async def get_user_elo_rank(self, user_id: str) -> Optional[UserELORankResponse]:
        """
        Get user's ELO rank with nearby players from user_profiles.
        
        Requirements: 5.8 - Return rank position, ELO, tier, and nearby players.
        Updated to use UnifiedStatsRepository for single source of truth.
        """
        # Get user's stats from unified table
        stats_data = await self.unified_stats_repo.get_player_stats(user_id)
        if not stats_data:
            return None
        
        # Calculate win rate from user_profiles data
        games_played = stats_data.get("games_played", 0)
        games_won = stats_data.get("games_won", 0)
        win_rate = (games_won / games_played * 100) if games_played > 0 else 0.0
        
        rating = PlayerRating(
            user_id=user_id,
            display_name=stats_data.get("display_name"),
            avatar_url=stats_data.get("avatar_url"),
            current_elo=stats_data.get("current_elo", DEFAULT_ELO),
            peak_elo=stats_data.get("peak_elo", DEFAULT_ELO),
            current_tier=RankTier(stats_data.get("current_tier", "Gold")),
            win_rate=round(win_rate, 2),
            last_match_date=None,  # Not tracked in user_profiles
        )
        
        # Get rank from unified repo
        rank = await self.unified_stats_repo.get_user_elo_rank(user_id)
        if not rank:
            rank = 0
        
        # Get total players
        total = await self.unified_stats_repo.count_with_elo()
        
        # Get nearby players from unified repo
        nearby_data = await self.unified_stats_repo.get_nearby_players(user_id, range_size=5)
        nearby = []
        for i, row in enumerate(nearby_data):
            nearby_games_played = row.get("games_played", 0)
            nearby_games_won = row.get("games_won", 0)
            nearby_win_rate = (nearby_games_won / nearby_games_played * 100) if nearby_games_played > 0 else 0.0
            
            nearby_rank = max(1, rank - 5) + i
            nearby.append(ELOLeaderboardEntry(
                rank=nearby_rank,
                user_id=row.get("id", ""),
                display_name=row.get("display_name"),
                avatar_url=row.get("avatar_url"),
                elo=row.get("current_elo", DEFAULT_ELO),
                tier=RankTier(row.get("current_tier", "Gold")),
                win_rate=round(nearby_win_rate, 2),
                games_played=nearby_games_played,  # Now populated!
            ))
        
        return UserELORankResponse(
            rank=rank,
            total_players=total,
            rating=rating,
            nearby_players=nearby,
        )
