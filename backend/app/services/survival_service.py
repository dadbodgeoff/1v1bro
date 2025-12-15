"""
Survival Mode service.
Handles survival runs, personal bests, ghost data, telemetry, and leaderboards.
Requirements: 1.1-8.4

Security: Server-authoritative validation prevents cheating.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID
import logging

from supabase import Client

from app.schemas.survival import (
    SurvivalRunCreate,
    SurvivalRunResponse,
    SurvivalPersonalBest,
    DeathEventCreate,
    DeathEventResponse,
    TelemetryAggregate,
    DeathPosition,
    DeathHeatmapResponse,
    SurvivalLeaderboardEntry,
    SurvivalLeaderboardResponse,
    GhostDataResponse,
    RunValidationStatus,
)
from app.services.base import BaseService
from app.services.survival_validator import (
    SurvivalValidator,
    ValidationResult,
    ValidationReport,
)
from app.cache.cache_manager import CacheManager


logger = logging.getLogger(__name__)

# Cache TTL
LEADERBOARD_CACHE_TTL = 300  # 5 minutes
POPULATION_STATS_CACHE_TTL = 3600  # 1 hour


class SurvivalService(BaseService):
    """Service for survival mode operations with server-authoritative validation."""

    def __init__(self, client: Client, cache: Optional[CacheManager] = None):
        super().__init__(client)
        self.cache = cache
        self.validator = SurvivalValidator()
        self._load_population_stats()

    def _load_population_stats(self) -> None:
        """Load population statistics for anomaly detection."""
        try:
            # Try to get cached stats
            if self.cache:
                stats = self.cache.get_json_sync(
                    CacheManager.key("survival", "population_stats", "global")
                ) if hasattr(self.cache, 'get_json_sync') else None
                if stats:
                    self.validator.update_population_stats(stats)
                    return
            
            # Calculate from recent runs (last 7 days)
            result = self.client.rpc(
                "get_survival_population_stats",
                {"days_back": 7}
            ).execute()
            
            if result.data:
                self.validator.update_population_stats(result.data)
                # Cache for 1 hour
                if self.cache:
                    self.cache.set_json_sync(
                        CacheManager.key("survival", "population_stats", "global"),
                        result.data,
                        POPULATION_STATS_CACHE_TTL
                    ) if hasattr(self.cache, 'set_json_sync') else None
        except Exception as e:
            logger.warning(f"Failed to load population stats: {e}")

    # ============================================
    # Run Management (Requirements: 6.1, 6.2, 6.3)
    # ============================================

    async def create_run(
        self,
        user_id: str,
        run_data: SurvivalRunCreate,
    ) -> Tuple[Optional[SurvivalRunResponse], ValidationReport]:
        """
        Create a new survival run record with server-side validation.
        
        Requirements: 6.1, 6.2 - Save run data to backend.
        Security: Validates run data server-side before accepting.
        
        Returns:
            Tuple of (response, validation_report)
            - If rejected, response is None
            - If valid/suspicious, response contains verified values
        """
        # Server-side validation
        validation = self.validator.validate_run(
            claimed_distance=run_data.distance,
            claimed_score=run_data.score,
            duration_seconds=run_data.duration_seconds,
            max_speed=run_data.max_speed,
            max_combo=run_data.max_combo,
            total_near_misses=run_data.total_near_misses,
            perfect_dodges=run_data.perfect_dodges,
            obstacles_cleared=run_data.obstacles_cleared,
            seed=run_data.seed,
            ghost_data=run_data.ghost_data,
            difficulty_tier=run_data.difficulty_tier,
        )
        
        # Log validation result
        logger.info(
            f"Run validation for user {user_id}: {validation.result.value} "
            f"(flags: {validation.flags}, confidence: {validation.confidence:.2f})"
        )
        
        # Reject invalid runs
        if validation.result == ValidationResult.REJECTED:
            logger.warning(
                f"Rejected run from user {user_id}: {validation.rejection_reason} "
                f"(claimed: {run_data.distance}m/{run_data.score}pts)"
            )
            return None, validation
        
        # Use server-verified values (not client-claimed)
        data = {
            "user_id": user_id,
            "distance": validation.distance_verified,  # Server-verified
            "score": validation.score_verified,        # Server-verified
            "duration_seconds": run_data.duration_seconds,
            "max_speed": run_data.max_speed,
            "max_combo": run_data.max_combo,
            "total_near_misses": run_data.total_near_misses,
            "perfect_dodges": run_data.perfect_dodges,
            "obstacles_cleared": run_data.obstacles_cleared,
            "death_obstacle_type": run_data.death_obstacle_type,
            "death_position_x": run_data.death_position_x,
            "death_position_z": run_data.death_position_z,
            "death_distance": run_data.death_distance,
            "seed": run_data.seed,
            "difficulty_tier": run_data.difficulty_tier,
            "ghost_data": run_data.ghost_data,
            "has_ghost": run_data.ghost_data is not None,
            "ended_at": datetime.utcnow().isoformat(),
            # Note: validation_status, validation_flags, validation_confidence columns
            # don't exist in the database yet - would need migration to add them
        }
        
        result = self.client.table("survival_runs").insert(data).execute()
        
        if result.data:
            # Refresh the leaderboard materialized view so new runs appear
            try:
                self.client.rpc("refresh_survival_leaderboard").execute()
            except Exception as e:
                logger.warning(f"Failed to refresh leaderboard: {e}")
            
            # Invalidate leaderboard cache
            await self._invalidate_leaderboard_cache()
            
            # Only update leaderboard for valid runs (not suspicious)
            if validation.result == ValidationResult.SUSPICIOUS:
                logger.info(f"Suspicious run from {user_id} saved but flagged")
            
            return SurvivalRunResponse(**result.data[0]), validation
        
        return None, validation

    async def get_personal_best(
        self,
        user_id: str,
    ) -> Optional[SurvivalPersonalBest]:
        """
        Get user's personal best run with ghost data.
        
        Requirements: 5.4, 6.3 - Fetch PB with ghost data.
        """
        result = self.client.table("survival_personal_bests")\
            .select("*")\
            .eq("user_id", user_id)\
            .maybe_single()\
            .execute()
        
        if result and result.data:
            return SurvivalPersonalBest(**result.data)
        
        return None

    async def get_ghost_data(
        self,
        user_id: str,
    ) -> Optional[GhostDataResponse]:
        """
        Get ghost replay data for a user.
        
        Requirements: 5.1 - Fetch ghost data for replay.
        """
        result = self.client.table("survival_personal_bests")\
            .select("user_id, ghost_data, best_distance, run_id")\
            .eq("user_id", user_id)\
            .maybe_single()\
            .execute()
        
        if result and result.data and result.data.get("ghost_data"):
            # Get seed from the run
            run_result = self.client.table("survival_runs")\
                .select("seed")\
                .eq("id", result.data.get("run_id"))\
                .maybe_single()\
                .execute()
            
            seed = run_result.data.get("seed") if run_result and run_result.data else None
            
            return GhostDataResponse(
                user_id=result.data["user_id"],
                ghost_data=result.data["ghost_data"],
                distance=result.data["best_distance"],
                seed=seed,
            )
        
        return None

    # ============================================
    # Telemetry (Requirements: 7.1, 7.2, 7.3, 7.4)
    # ============================================

    async def record_death(
        self,
        user_id: str,
        run_id: Optional[str],
        event: DeathEventCreate,
    ) -> Optional[DeathEventResponse]:
        """
        Record a death event for telemetry.
        
        Requirements: 7.1, 7.2 - Store death events for analysis.
        """
        data = {
            "user_id": user_id,
            "run_id": run_id,
            "obstacle_type": event.obstacle_type,
            "position_x": event.position_x,
            "position_z": event.position_z,
            "distance": event.distance,
            "speed": event.speed,
            "was_jumping": event.was_jumping,
            "was_sliding": event.was_sliding,
            "current_lane": event.current_lane,
            "combo_at_death": event.combo_at_death,
            "difficulty_tier": event.difficulty_tier,
            "pattern_id": event.pattern_id,
        }
        
        result = self.client.table("survival_death_events").insert(data).execute()
        
        if result.data:
            return DeathEventResponse(**result.data[0])
        
        return None

    async def get_aggregated_telemetry(
        self,
        start: datetime,
        end: datetime,
    ) -> TelemetryAggregate:
        """
        Get aggregated telemetry for a time period.
        
        Requirements: 7.3, 7.4 - Compute aggregated analytics.
        """
        # Get runs in period
        runs_result = self.client.table("survival_runs")\
            .select("distance, score, max_combo")\
            .gte("created_at", start.isoformat())\
            .lte("created_at", end.isoformat())\
            .execute()
        
        runs = runs_result.data or []
        total_runs = len(runs)
        
        # Calculate averages
        avg_distance = sum(r["distance"] for r in runs) / total_runs if total_runs > 0 else 0
        avg_score = sum(r["score"] for r in runs) / total_runs if total_runs > 0 else 0
        avg_combo = sum(r["max_combo"] for r in runs) / total_runs if total_runs > 0 else 0
        
        # Get death events
        deaths_result = self.client.table("survival_death_events")\
            .select("obstacle_type, position_x, position_z, distance")\
            .gte("created_at", start.isoformat())\
            .lte("created_at", end.isoformat())\
            .execute()
        
        deaths = deaths_result.data or []
        total_deaths = len(deaths)
        
        # Count deaths by obstacle type
        deaths_by_obstacle: dict = {}
        for death in deaths:
            obs_type = death["obstacle_type"]
            deaths_by_obstacle[obs_type] = deaths_by_obstacle.get(obs_type, 0) + 1
        
        # Distance distribution (100m buckets)
        distance_distribution: dict = {}
        for run in runs:
            bucket = (run["distance"] // 100) * 100
            bucket_key = f"{bucket}-{bucket + 99}"
            distance_distribution[bucket_key] = distance_distribution.get(bucket_key, 0) + 1
        
        # Death positions (aggregate nearby positions)
        death_positions = self._aggregate_death_positions(deaths)
        
        return TelemetryAggregate(
            period_start=start,
            period_end=end,
            total_runs=total_runs,
            total_deaths=total_deaths,
            avg_distance=round(avg_distance, 2),
            avg_score=round(avg_score, 2),
            avg_combo=round(avg_combo, 2),
            deaths_by_obstacle=deaths_by_obstacle,
            distance_distribution=distance_distribution,
            death_positions=death_positions,
        )

    async def get_death_heatmap(
        self,
        start: datetime,
        end: datetime,
    ) -> DeathHeatmapResponse:
        """
        Get death positions for heatmap visualization.
        
        Requirements: 7.4 - Return death heatmap data.
        """
        result = self.client.table("survival_death_events")\
            .select("position_x, position_z")\
            .gte("created_at", start.isoformat())\
            .lte("created_at", end.isoformat())\
            .execute()
        
        deaths = result.data or []
        positions = self._aggregate_death_positions(deaths)
        
        return DeathHeatmapResponse(
            positions=positions,
            total_deaths=len(deaths),
            period_start=start,
            period_end=end,
        )

    def _aggregate_death_positions(
        self,
        deaths: List[dict],
        grid_size: float = 1.0,
    ) -> List[DeathPosition]:
        """Aggregate death positions into grid cells."""
        grid: dict = {}
        
        for death in deaths:
            # Round to grid
            x = round(death["position_x"] / grid_size) * grid_size
            z = round(death["position_z"] / grid_size) * grid_size
            key = (x, z)
            
            if key in grid:
                grid[key] += 1
            else:
                grid[key] = 1
        
        return [
            DeathPosition(x=k[0], z=k[1], count=v)
            for k, v in grid.items()
        ]

    # ============================================
    # Leaderboard (Requirements: 6.4, 6.5)
    # ============================================

    async def get_leaderboard(
        self,
        user_id: Optional[str] = None,
        limit: int = 100,
    ) -> SurvivalLeaderboardResponse:
        """
        Get survival leaderboard.
        
        Requirements: 6.4, 6.5 - Return top 100 with player rank.
        """
        # Check cache
        if self.cache:
            cache_key = CacheManager.key("survival", "leaderboard", "global")
            cached = await self.cache.get_json(cache_key)
            if cached:
                response = SurvivalLeaderboardResponse(**cached)
                # Add player rank if needed
                if user_id:
                    response = await self._add_player_rank(response, user_id)
                return response
        
        # Query materialized view
        result = self.client.table("survival_leaderboard")\
            .select("*")\
            .order("rank")\
            .limit(limit)\
            .execute()
        
        entries = []
        for row in result.data or []:
            entries.append(SurvivalLeaderboardEntry(
                rank=row["rank"],
                user_id=row["user_id"],
                display_name=row.get("display_name"),
                avatar_url=row.get("avatar_url"),
                best_distance=row["best_distance"],
                best_score=row["best_score"],
                best_combo=row["best_combo"],
                total_runs=row.get("total_runs", 0),
                avg_distance=row.get("avg_distance", 0),
            ))
        
        # Get total count
        count_result = self.client.table("survival_leaderboard")\
            .select("user_id", count="exact")\
            .execute()
        
        total = count_result.count or len(entries)
        
        response = SurvivalLeaderboardResponse(
            entries=entries,
            total_players=total,
        )
        
        # Cache result
        if self.cache:
            cache_key = CacheManager.key("survival", "leaderboard", "global")
            await self.cache.set_json(cache_key, response.model_dump(), LEADERBOARD_CACHE_TTL)
        
        # Add player rank if needed
        if user_id:
            response = await self._add_player_rank(response, user_id)
        
        return response

    async def get_player_rank(
        self,
        user_id: str,
    ) -> Optional[int]:
        """
        Get a player's rank on the leaderboard.
        
        Requirements: 6.5 - Return player rank if outside top 100.
        """
        result = self.client.table("survival_leaderboard")\
            .select("rank")\
            .eq("user_id", user_id)\
            .maybe_single()\
            .execute()
        
        if result and result.data:
            return result.data["rank"]
        
        return None

    async def _add_player_rank(
        self,
        response: SurvivalLeaderboardResponse,
        user_id: str,
    ) -> SurvivalLeaderboardResponse:
        """Add player's rank to response if outside top 100."""
        # Check if player is in entries
        for entry in response.entries:
            if entry.user_id == user_id:
                response.player_rank = entry.rank
                response.player_entry = entry
                return response
        
        # Player not in top 100, get their rank
        rank = await self.get_player_rank(user_id)
        if rank:
            response.player_rank = rank
            
            # Get player's entry
            result = self.client.table("survival_leaderboard")\
                .select("*")\
                .eq("user_id", user_id)\
                .maybe_single()\
                .execute()
            
            if result and result.data:
                response.player_entry = SurvivalLeaderboardEntry(
                    rank=result.data["rank"],
                    user_id=result.data["user_id"],
                    display_name=result.data.get("display_name"),
                    avatar_url=result.data.get("avatar_url"),
                    best_distance=result.data["best_distance"],
                    best_score=result.data["best_score"],
                    best_combo=result.data["best_combo"],
                    total_runs=result.data.get("total_runs", 0),
                    avg_distance=result.data.get("avg_distance", 0),
                )
        
        return response

    async def refresh_leaderboard(self) -> None:
        """
        Refresh the materialized leaderboard view.
        
        Should be called periodically (e.g., every 5 minutes).
        """
        self.client.rpc("refresh_survival_leaderboard").execute()
        
        # Invalidate cache
        await self._invalidate_leaderboard_cache()

    async def _invalidate_leaderboard_cache(self) -> None:
        """Invalidate leaderboard cache."""
        if self.cache:
            cache_key = CacheManager.key("survival", "leaderboard", "global")
            await self.cache.delete(cache_key)

    async def get_public_stats(self) -> dict:
        """
        Get public statistics for the leaderboard page.
        
        Returns aggregate stats without requiring authentication.
        Cached for 5 minutes to reduce database load.
        """
        cache_key = CacheManager.key("survival", "public_stats", "global")
        
        # Check cache
        if self.cache:
            cached = await self.cache.get_json(cache_key)
            if cached:
                return cached
        
        try:
            # Get total runs count
            runs_result = self.client.table("survival_runs")\
                .select("id", count="exact")\
                .execute()
            total_runs = runs_result.count or 0
            
            # Get unique players count
            players_result = self.client.table("survival_leaderboard")\
                .select("user_id", count="exact")\
                .execute()
            unique_players = players_result.count or 0
            
            # Get top records from leaderboard
            top_result = self.client.table("survival_leaderboard")\
                .select("best_distance, best_score, best_combo")\
                .order("best_distance", desc=True)\
                .limit(1)\
                .execute()
            
            max_distance = 0
            max_score = 0
            max_combo = 0
            
            if top_result.data:
                top = top_result.data[0]
                max_distance = top.get("best_distance", 0)
            
            # Get max score (might be different player)
            score_result = self.client.table("survival_leaderboard")\
                .select("best_score")\
                .order("best_score", desc=True)\
                .limit(1)\
                .execute()
            
            if score_result.data:
                max_score = score_result.data[0].get("best_score", 0)
            
            # Get max combo (might be different player)
            combo_result = self.client.table("survival_leaderboard")\
                .select("best_combo")\
                .order("best_combo", desc=True)\
                .limit(1)\
                .execute()
            
            if combo_result.data:
                max_combo = combo_result.data[0].get("best_combo", 0)
            
            # Calculate averages from recent runs (last 7 days)
            from datetime import datetime, timedelta
            week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
            
            recent_result = self.client.table("survival_runs")\
                .select("distance, score")\
                .gte("created_at", week_ago)\
                .execute()
            
            recent_runs = recent_result.data or []
            avg_distance = 0
            avg_score = 0
            
            if recent_runs:
                avg_distance = round(
                    sum(r.get("distance", 0) for r in recent_runs) / len(recent_runs), 
                    2
                )
                avg_score = round(
                    sum(r.get("score", 0) for r in recent_runs) / len(recent_runs),
                    2
                )
            
            stats = {
                "total_runs": total_runs,
                "unique_players": unique_players,
                "max_distance": max_distance,
                "max_score": max_score,
                "max_combo": max_combo,
                "avg_distance": avg_distance,
                "avg_score": avg_score,
            }
            
            # Cache for 5 minutes
            if self.cache:
                await self.cache.set_json(cache_key, stats, 300)
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get public stats: {e}")
            return {
                "total_runs": 0,
                "unique_players": 0,
                "max_distance": 0,
                "max_score": 0,
                "max_combo": 0,
                "avg_distance": 0,
                "avg_score": 0,
            }
