# Design Document: Unified Stats & Leaderboard System

## Overview

This design consolidates player statistics and ELO ratings into a single source of truth (`user_profiles` table), eliminating data inconsistencies between the current dual-table architecture. The refactor involves database migration, service layer updates, and frontend type synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Profile.tsx │  │ Leaderboard │  │ Dashboard (ELO Badge)   │ │
│  └──────┬──────┘  │   Hub.tsx   │  └───────────┬─────────────┘ │
│         │         └──────┬──────┘              │               │
│         └────────────────┼─────────────────────┘               │
│                          │                                      │
│                    useProfile()                                 │
│                    leaderboardAPI                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    REST API Calls
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     FastAPI Backend                              │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                    API Layer                               │  │
│  │  /api/v1/leaderboards/*  │  /api/v1/profile/*             │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                  Service Layer                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                 │  │
│  │  │ LeaderboardSvc  │  │   StatsSvc      │                 │  │
│  │  │ (queries only)  │  │ (updates stats) │                 │  │
│  │  └────────┬────────┘  └────────┬────────┘                 │  │
│  │           │                    │                           │  │
│  │           └────────┬───────────┘                           │  │
│  │                    │                                       │  │
│  │  ┌─────────────────┴─────────────────┐                    │  │
│  │  │         UnifiedStatsRepo          │                    │  │
│  │  │   (single source of truth)        │                    │  │
│  │  └─────────────────┬─────────────────┘                    │  │
│  └────────────────────┼──────────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                   Supabase
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                  PostgreSQL                                      │
│                       │                                          │
│  ┌────────────────────┴────────────────────────────────────┐    │
│  │                  user_profiles                           │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │ id, display_name, avatar_url, country               ││    │
│  │  │ games_played, games_won, total_score                ││    │
│  │  │ total_kills, total_deaths, shots_fired, shots_hit   ││    │
│  │  │ total_questions_answered, total_correct_answers     ││    │
│  │  │ current_win_streak, best_win_streak                 ││    │
│  │  │ current_elo, peak_elo, current_tier  ← NEW          ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  player_ratings_deprecated (to be removed)              │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Migration (020_unified_stats.sql)

```sql
-- Add ELO columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_elo INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS peak_elo INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS current_tier VARCHAR(20) DEFAULT 'Gold';

-- Migrate existing data from player_ratings
UPDATE user_profiles up
SET 
    current_elo = COALESCE(pr.current_elo, 1200),
    peak_elo = COALESCE(pr.peak_elo, 1200),
    current_tier = COALESCE(pr.current_tier, 'Gold')
FROM player_ratings pr
WHERE up.id = pr.user_id;

-- Create index for ELO leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_elo 
ON user_profiles(current_elo DESC);

-- Rename legacy table
ALTER TABLE player_ratings RENAME TO player_ratings_deprecated;
COMMENT ON TABLE player_ratings_deprecated IS 
    'Deprecated: Data migrated to user_profiles. Remove after 2025-03-01';
```

### Updated Stored Procedure

```sql
CREATE OR REPLACE FUNCTION update_player_stats_with_elo(
    p_user_id UUID,
    p_games_played_delta INTEGER DEFAULT 0,
    p_games_won_delta INTEGER DEFAULT 0,
    p_score_delta INTEGER DEFAULT 0,
    -- ... existing params ...
    p_elo_delta INTEGER DEFAULT 0,
    p_new_tier VARCHAR DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_elo INTEGER;
    v_current_peak INTEGER;
BEGIN
    -- Get current values
    SELECT current_elo, peak_elo INTO v_new_elo, v_current_peak
    FROM user_profiles WHERE id = p_user_id;
    
    -- Calculate new ELO with clamping
    v_new_elo := GREATEST(100, LEAST(3000, COALESCE(v_new_elo, 1200) + p_elo_delta));
    
    -- Update all stats atomically
    UPDATE user_profiles SET
        games_played = games_played + p_games_played_delta,
        games_won = games_won + p_games_won_delta,
        total_score = total_score + p_score_delta,
        -- ... existing updates ...
        current_elo = v_new_elo,
        peak_elo = GREATEST(COALESCE(peak_elo, v_new_elo), v_new_elo),
        current_tier = COALESCE(p_new_tier, current_tier),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### UnifiedStatsRepository

```python
class UnifiedStatsRepository(BaseRepository):
    """Repository for unified player stats including ELO."""
    
    def __init__(self, client: Client):
        super().__init__(client, "user_profiles")
    
    async def get_player_stats(self, user_id: str) -> Optional[dict]:
        """Get all stats including ELO for a player."""
        result = self._table().select(
            "id, display_name, avatar_url, country, "
            "games_played, games_won, total_score, "
            "total_kills, total_deaths, shots_fired, shots_hit, "
            "total_questions_answered, total_correct_answers, "
            "total_answer_time_ms, fastest_answer_ms, "
            "current_win_streak, best_win_streak, "
            "current_elo, peak_elo, current_tier"
        ).eq("id", user_id).execute()
        return result.data[0] if result.data else None
    
    async def update_stats_with_elo(
        self,
        user_id: str,
        stats_delta: dict,
        elo_delta: int,
        new_tier: str,
    ) -> None:
        """Atomically update stats and ELO."""
        self.client.rpc(
            "update_player_stats_with_elo",
            {
                "p_user_id": user_id,
                **{f"p_{k}": v for k, v in stats_delta.items()},
                "p_elo_delta": elo_delta,
                "p_new_tier": new_tier,
            }
        ).execute()
    
    async def get_elo_leaderboard(
        self, limit: int = 100, offset: int = 0
    ) -> List[dict]:
        """Get ELO leaderboard from unified table."""
        result = self._table().select(
            "id, display_name, avatar_url, "
            "current_elo, peak_elo, current_tier, "
            "games_played, games_won"
        ).order("current_elo", desc=True).range(offset, offset + limit - 1).execute()
        return result.data or []
```

### Updated LeaderboardService

```python
class LeaderboardService(BaseService):
    """Service for all leaderboard queries - unified source."""
    
    def __init__(self, client: Client, cache: Optional[CacheManager] = None):
        super().__init__(client)
        self.stats_repo = UnifiedStatsRepository(client)
        self.cache = cache
    
    async def get_elo_leaderboard(
        self, limit: int = 100, offset: int = 0
    ) -> ELOLeaderboardResponse:
        """Get ELO leaderboard from user_profiles."""
        # Check cache
        if self.cache and offset == 0:
            cached = await self.cache.get_json(
                CacheManager.key("leaderboard", "elo", "global")
            )
            if cached:
                return ELOLeaderboardResponse(**cached)
        
        # Query unified table
        data = await self.stats_repo.get_elo_leaderboard(limit, offset)
        total = await self.stats_repo.count_with_elo()
        
        entries = []
        for i, row in enumerate(data):
            games_played = row.get("games_played", 0)
            games_won = row.get("games_won", 0)
            win_rate = (games_won / games_played * 100) if games_played > 0 else 0.0
            
            entries.append(ELOLeaderboardEntry(
                rank=offset + i + 1,
                user_id=row["id"],
                display_name=row.get("display_name"),
                avatar_url=row.get("avatar_url"),
                elo=row.get("current_elo", 1200),
                tier=RankTier(row.get("current_tier", "Gold")),
                win_rate=round(win_rate, 2),
                games_played=games_played,  # Now populated!
            ))
        
        response = ELOLeaderboardResponse(
            entries=entries,
            total_players=total,
            page=(offset // limit) + 1,
            page_size=limit,
        )
        
        # Cache result
        if self.cache and offset == 0:
            await self.cache.set_json(
                CacheManager.key("leaderboard", "elo", "global"),
                response.model_dump(),
                LEADERBOARD_CACHE_TTL,
            )
        
        return response
```

### Updated StatsService

```python
class StatsService(BaseService):
    """Service for updating player stats - single update point."""
    
    def __init__(self, client: Client, cache: Optional[CacheManager] = None):
        super().__init__(client)
        self.stats_repo = UnifiedStatsRepository(client)
        self.cache = cache
    
    async def update_match_stats(
        self,
        player1_id: str,
        player2_id: str,
        winner_id: Optional[str],
        p1_stats: GameStats,
        p2_stats: GameStats,
    ) -> Tuple[int, int]:
        """Update all stats for both players after a match."""
        # Get current ELOs
        p1_data = await self.stats_repo.get_player_stats(player1_id)
        p2_data = await self.stats_repo.get_player_stats(player2_id)
        
        p1_elo = p1_data.get("current_elo", 1200) if p1_data else 1200
        p2_elo = p2_data.get("current_elo", 1200) if p2_data else 1200
        
        # Calculate ELO changes
        p1_won = winner_id == player1_id
        delta1, delta2 = self._calculate_elo_change(p1_elo, p2_elo, p1_won)
        
        # Get new tiers
        new_tier1 = self._get_tier(p1_elo + delta1)
        new_tier2 = self._get_tier(p2_elo + delta2)
        
        # Update player 1 stats + ELO atomically
        await self.stats_repo.update_stats_with_elo(
            user_id=player1_id,
            stats_delta={
                "games_played_delta": 1,
                "games_won_delta": 1 if p1_won else 0,
                "score_delta": p1_stats.score,
                "kills_delta": p1_stats.kills,
                "deaths_delta": p1_stats.deaths,
                # ... other stats
            },
            elo_delta=delta1,
            new_tier=new_tier1.value,
        )
        
        # Update player 2 stats + ELO atomically
        await self.stats_repo.update_stats_with_elo(
            user_id=player2_id,
            stats_delta={
                "games_played_delta": 1,
                "games_won_delta": 0 if p1_won else 1,
                "score_delta": p2_stats.score,
                "kills_delta": p2_stats.kills,
                "deaths_delta": p2_stats.deaths,
                # ... other stats
            },
            elo_delta=delta2,
            new_tier=new_tier2.value,
        )
        
        # Invalidate caches
        await self._invalidate_leaderboard_caches()
        
        return delta1, delta2
    
    async def _invalidate_leaderboard_caches(self) -> None:
        """Invalidate all leaderboard caches after stats update."""
        if self.cache:
            # Invalidate ELO leaderboard
            await self.cache.delete(CacheManager.key("leaderboard", "elo", "global"))
            # Invalidate legacy leaderboards
            for category in LeaderboardCategory:
                await self.cache.delete(
                    CacheManager.key("leaderboard", category.value, "global")
                )
```

## Data Models

### Updated Profile Schema

```python
class Profile(BaseSchema, TimestampMixin):
    """Complete profile with unified stats."""
    
    user_id: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None
    
    # Game stats
    games_played: int = 0
    games_won: int = 0
    total_score: int = 0
    best_win_streak: int = 0
    
    # ELO stats (NEW - from unified table)
    current_elo: int = 1200
    peak_elo: int = 1200
    current_tier: str = "Gold"
    
    # Computed
    @property
    def win_rate(self) -> float:
        if self.games_played == 0:
            return 0.0
        return round(self.games_won / self.games_played * 100, 2)
```

### Updated TypeScript Types

```typescript
// frontend/src/types/profile.ts
export interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  
  // Game stats
  games_played: number;
  games_won: number;
  total_score: number;
  best_win_streak: number;
  
  // ELO stats (NEW)
  current_elo: number;
  peak_elo: number;
  current_tier: BackendRankTier;
  
  // Computed on frontend
  win_rate?: number;
}

// frontend/src/types/leaderboard.ts
export interface ELOLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  elo: number;
  tier: BackendRankTier;
  win_rate: number;
  games_played: number;  // Now populated correctly!
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties have been identified:

### Property 1: ELO Migration Data Integrity
*For any* user with existing ELO data in `player_ratings`, after migration their `user_profiles.current_elo` should equal their original `player_ratings.current_elo`
**Validates: Requirements 1.2**

### Property 2: Default ELO Initialization
*For any* newly created user, their ELO fields should be initialized to default values (current_elo=1200, peak_elo=1200, current_tier='Gold')
**Validates: Requirements 1.3**

### Property 3: ELO Formula Correctness
*For any* match result with two players, the ELO changes should follow the formula: delta = K * (actual_score - expected_score) where expected_score = 1 / (1 + 10^((opponent_elo - player_elo) / 400))
**Validates: Requirements 2.1**

### Property 4: K-Factor Selection
*For any* ELO rating, the K-factor should be 32 if rating < 2000, 24 if 2000 <= rating < 2400, and 16 if rating >= 2400
**Validates: Requirements 2.2**

### Property 5: Peak ELO Invariant
*For any* player, their peak_elo should always be greater than or equal to their current_elo
**Validates: Requirements 2.3**

### Property 6: ELO Bounds Clamping
*For any* ELO update, the resulting current_elo should be clamped between 100 and 3000 inclusive
**Validates: Requirements 2.4**

### Property 7: Tier-ELO Consistency
*For any* player, their current_tier should match the tier range for their current_elo (Bronze: 100-799, Silver: 800-1199, Gold: 1200-1599, Platinum: 1600-1999, Diamond: 2000-2399, Master: 2400-2799, Grandmaster: 2800-3000)
**Validates: Requirements 2.5**

### Property 8: Games Played in ELO Leaderboard
*For any* entry in the ELO leaderboard, games_played should equal the actual games_played value from user_profiles (not hardcoded to 0)
**Validates: Requirements 4.1**

### Property 9: Win Rate Calculation
*For any* player with games_played > 0, their displayed win_rate should equal (games_won / games_played * 100) rounded to 2 decimal places
**Validates: Requirements 4.3**

### Property 10: Regional Leaderboard Filtering
*For any* regional leaderboard query with country code X, all returned entries should have country = X
**Validates: Requirements 5.3**

### Property 11: Profile Contains ELO Fields
*For any* profile API response, the response should contain current_elo, peak_elo, and current_tier fields
**Validates: Requirements 8.1**

### Property 12: Games Played Invariant
*For any* player, games_played should equal games_won + games_lost (where games_lost = games_played - games_won)
**Validates: Requirements 10.1**

### Property 13: Leaderboard Sort Order
*For any* leaderboard query, entries should be sorted in descending order by the category metric (e.g., ELO leaderboard sorted by current_elo DESC)
**Validates: Requirements 10.4**

## Error Handling

| Error Case | HTTP Status | Error Code | Handling |
|------------|-------------|------------|----------|
| User not found | 404 | USER_NOT_FOUND | Return error, don't create |
| Invalid ELO range | 400 | INVALID_ELO | Clamp to valid range |
| Migration failure | 500 | MIGRATION_ERROR | Rollback, log, alert |
| Cache failure | - | - | Proceed without cache, log warning |
| Transaction failure | 500 | TRANSACTION_ERROR | Rollback all changes |

## Testing Strategy

### Property-Based Testing Library
- **Backend:** Hypothesis (Python)
- **Frontend:** fast-check (TypeScript)

### Unit Tests
- ELO calculation formula verification
- K-factor selection logic
- Tier assignment from ELO
- Win rate calculation

### Property-Based Tests
Each correctness property above will be implemented as a property-based test:

1. **Property 1-2:** Migration tests (run once after migration)
2. **Property 3-7:** ELO calculation tests (generate random match outcomes)
3. **Property 8-9:** Leaderboard response tests (generate random player data)
4. **Property 10:** Regional filter tests (generate random countries)
5. **Property 11:** Profile response tests (verify schema)
6. **Property 12-13:** Data invariant tests (generate random stats)

### Test Configuration
- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: unified-stats-leaderboard, Property {number}: {property_text}**`

### Integration Tests
- End-to-end match flow: game end → stats update → leaderboard refresh
- Migration verification: data integrity after migration
- Cache invalidation: verify cache cleared after updates
