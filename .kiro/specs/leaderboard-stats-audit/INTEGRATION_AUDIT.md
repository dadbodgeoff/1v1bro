# Leaderboard & Stats System - Full-Stack Integration Audit

**Feature:** Leaderboard System with Stats Tracking
**Date:** December 8, 2025
**Status:** 🟡 NEEDS REFACTORING - Multiple Sources of Truth

---

## 🔴 CRITICAL ISSUES (blocks deployment)

### 1. Dual Source of Truth for Stats
- **Location:** `user_profiles` table vs `player_ratings` table
- **Issue:** Stats are tracked in TWO separate places:
  - `user_profiles`: games_played, games_won, total_score, kills, deaths, etc.
  - `player_ratings`: current_elo, peak_elo, win_rate, last_match_date
- **Risk:** Data inconsistency - `win_rate` in `player_ratings` may not match calculated win_rate from `user_profiles.games_won / games_played`
- **Impact:** Leaderboards may show different values than profile stats

### 2. ELO Leaderboard Missing games_played
- **Location:** `backend/app/services/leaderboard_service.py:get_global_leaderboard()`
- **Issue:** `games_played` is hardcoded to `0` in ELO leaderboard entries
```python
entries.append(ELOLeaderboardEntry(
    # ...
    games_played=0,  # Would need to calculate from match_results
))
```
- **Risk:** Frontend displays incorrect games_played count for ELO rankings

### 3. Stats Not Updated After ELO Match
- **Location:** `backend/app/services/leaderboard_service.py:update_ratings()`
- **Issue:** When ELO is updated after a match, `user_profiles` stats are NOT updated
- **Flow Gap:**
  - `GamePersistenceService.update_player_stats()` → updates `user_profiles`
  - `LeaderboardService.update_ratings()` → updates `player_ratings` ONLY
- **Risk:** If ELO update is called separately, profile stats become stale

---

## 🟡 WARNINGS (fix before production)

### 1. win_rate Stored in Two Places
- **Location:** 
  - `player_ratings.win_rate` (stored directly)
  - `user_profiles.games_won / games_played` (calculated)
- **Issue:** `player_ratings.win_rate` is never updated after initial creation
- **Code in `ratings_repo.py`:**
```python
async def update_rating(self, user_id, new_elo, new_tier, win_rate=None):
    # win_rate is optional and rarely passed
```
- **Fix:** Either remove `win_rate` from `player_ratings` or calculate it on read

### 2. Missing Stats in Profile Schema
- **Location:** `backend/app/schemas/profile.py:Profile`
- **Issue:** Profile schema only includes basic stats:
```python
games_played: int
games_won: int
best_win_streak: int
```
- **Missing:** total_kills, total_deaths, accuracy, answer_rate, etc.
- **Risk:** Profile page can't show full stats without additional API call

### 3. Leaderboard Categories Don't Include All Tracked Stats
- **Location:** `backend/app/schemas/leaderboard.py:LeaderboardCategory`
- **Issue:** Some tracked stats have no leaderboard:
  - `total_damage_dealt` - tracked but no leaderboard
  - `total_damage_taken` - tracked but no leaderboard
  - `total_powerups_collected` - tracked but no leaderboard
- **Risk:** Players can't compete on these metrics

### 4. ELO Category Uses Different Data Source
- **Location:** `backend/app/api/v1/leaderboards.py`
- **Issue:** ELO leaderboard uses `/leaderboards/elo/global` (from `player_ratings`)
  while other categories use `/leaderboards/{category}` (from `user_profiles`)
- **Risk:** Inconsistent API patterns, potential confusion

### 5. No Cache Invalidation on Stats Update
- **Location:** `backend/app/services/game/persistence.py:update_player_stats()`
- **Issue:** When stats are updated, leaderboard cache is NOT invalidated
- **Risk:** Leaderboards show stale data for up to 5 minutes

### 6. Frontend Type Mismatch for RankTier
- **Location:** `frontend/src/types/leaderboard.ts`
- **Issue:** Backend uses PascalCase (`'Bronze'`), frontend uses lowercase (`'bronze'`)
- **Mitigation:** `normalizeRankTier()` function exists but must be called manually
- **Risk:** Type errors if backend tier is used directly

---

## ✅ VERIFIED CONTRACTS

### Flow 1: Game End → Stats Update
```
[Game End] GamePersistenceService.update_player_stats()
    ↓ stats_repo.increment_stats() via RPC
[Supabase] increment_player_stats(p_user_id, p_games_played_delta, ...)
    ↓ Atomic UPDATE on user_profiles
[Database] user_profiles.games_played++, games_won++, total_kills++, etc.
    ✅ All stats updated atomically
    ✅ Win streak updated separately
    ✅ Fastest answer tracked
```

### Flow 2: Legacy Leaderboard Query
```
[Frontend] leaderboardAPI.getLeaderboard('wins', 10, 0)
    ↓ GET /api/v1/leaderboards/wins?limit=10&offset=0
[FastAPI] LeaderboardService.get_leaderboard(category='wins')
    ↓ leaderboard_repo.query_leaderboard()
[Supabase] RPC get_leaderboard_wins(p_limit, p_offset)
    ↓ SELECT from user_profiles ORDER BY games_won DESC
[Response] LeaderboardResponse { entries, total_eligible, page, page_size }
    ✅ Field names match exactly
    ✅ Stored procedures handle eligibility
```

### Flow 3: ELO Leaderboard Query
```
[Frontend] leaderboardAPI.getGlobalELOLeaderboard(100, 0)
    ↓ GET /api/v1/leaderboards/elo/global?limit=100&offset=0
[FastAPI] LeaderboardService.get_global_leaderboard()
    ↓ ratings_repo.get_leaderboard()
[Supabase] SELECT from player_ratings JOIN user_profiles ORDER BY current_elo DESC
[Response] ELOLeaderboardResponse { entries, total_players, page, page_size }
    ✅ Includes display_name, avatar_url from profile join
    ⚠️ games_played hardcoded to 0
```

### Flow 4: User Rank Query
```
[Frontend] leaderboardAPI.getMyRank('win_rate')
    ↓ GET /api/v1/leaderboards/win_rate/rank/me
[FastAPI] LeaderboardService.get_user_rank(user_id, category)
    ↓ leaderboard_repo.get_user_stat_value()
    ↓ _calculate_rank() - counts players with better stats
[Response] UserRankResponse { rank, stat_value, eligible, requirement }
    ✅ Eligibility checked against minimum requirements
    ✅ Requirement string returned for UI
```

---

## 📋 DATABASE SCHEMA VERIFICATION

### user_profiles table (Stats Source) ✅
```sql
-- Core stats
games_played INTEGER DEFAULT 0
games_won INTEGER DEFAULT 0
total_score INTEGER DEFAULT 0

-- Trivia stats
total_questions_answered INTEGER DEFAULT 0
total_correct_answers INTEGER DEFAULT 0
total_answer_time_ms BIGINT DEFAULT 0
fastest_answer_ms INTEGER

-- Combat stats
total_kills INTEGER DEFAULT 0
total_deaths INTEGER DEFAULT 0
total_damage_dealt INTEGER DEFAULT 0
total_damage_taken INTEGER DEFAULT 0
shots_fired INTEGER DEFAULT 0
shots_hit INTEGER DEFAULT 0

-- Streak stats
current_win_streak INTEGER DEFAULT 0
best_win_streak INTEGER DEFAULT 0

-- Collection stats
total_powerups_collected INTEGER DEFAULT 0
```

### player_ratings table (ELO Source) ✅
```sql
user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id)
current_elo INTEGER DEFAULT 1200
peak_elo INTEGER DEFAULT 1200
current_tier VARCHAR DEFAULT 'Gold'
win_rate FLOAT DEFAULT 0.0  -- ⚠️ Duplicate of calculated value
last_match_date TIMESTAMPTZ
```

### match_results table ✅
```sql
match_id UUID NOT NULL
player1_id UUID NOT NULL REFERENCES user_profiles(id)
player2_id UUID NOT NULL REFERENCES user_profiles(id)
winner_id UUID REFERENCES user_profiles(id)
duration_seconds INTEGER
player1_pre_elo INTEGER
player2_pre_elo INTEGER
player1_post_elo INTEGER
player2_post_elo INTEGER
elo_delta_p1 INTEGER
elo_delta_p2 INTEGER
played_at TIMESTAMPTZ
```

---

## 📋 API ENDPOINT VERIFICATION

### Legacy Leaderboard Endpoints ✅
| Endpoint | Method | Response Model | Source |
|----------|--------|----------------|--------|
| `/leaderboards/{category}` | GET | LeaderboardResponse | user_profiles |
| `/leaderboards/{category}/rank/me` | GET | UserRankResponse | user_profiles |
| `/leaderboards/{category}/rank/{user_id}` | GET | UserRankResponse | user_profiles |

### ELO Leaderboard Endpoints ✅
| Endpoint | Method | Response Model | Source |
|----------|--------|----------------|--------|
| `/leaderboards/elo/global` | GET | ELOLeaderboardResponse | player_ratings |
| `/leaderboards/elo/regional/{region}` | GET | ELOLeaderboardResponse | player_ratings |
| `/leaderboards/elo/me` | GET | UserELORankResponse | player_ratings |
| `/leaderboards/elo/user/{user_id}` | GET | UserELORankResponse | player_ratings |

---

## 📋 LEADERBOARD CATEGORIES

### Currently Implemented ✅
| Category | Source Field | Eligibility | Stored Procedure |
|----------|--------------|-------------|------------------|
| wins | games_won | games_played > 0 | get_leaderboard_wins |
| win_rate | games_won/games_played | games_played >= 10 | get_leaderboard_win_rate |
| total_score | total_score | total_score > 0 | get_leaderboard_total_score |
| kills | total_kills | total_kills > 0 | get_leaderboard_kills |
| kd_ratio | total_kills/total_deaths | total_deaths >= 10 | get_leaderboard_kd_ratio |
| accuracy | shots_hit/shots_fired | shots_fired >= 100 | get_leaderboard_accuracy |
| fastest_thinker | total_answer_time_ms/total_correct_answers | total_correct_answers >= 50 | get_leaderboard_fastest_thinker |
| answer_rate | total_correct_answers/total_questions_answered | total_questions_answered >= 100 | get_leaderboard_answer_rate |
| win_streak | best_win_streak | best_win_streak > 0 | get_leaderboard_win_streak |
| elo | current_elo | Has rating | Direct query |

### Missing Leaderboards (Tracked but No Board)
| Stat | Source Field | Potential Category |
|------|--------------|-------------------|
| Damage Dealt | total_damage_dealt | "Most Damage" |
| Damage Taken | total_damage_taken | "Tank" |
| Powerups | total_powerups_collected | "Collector" |

---

## 📋 TYPE SAFETY VERIFICATION

### Backend (Python) ✅
- `LeaderboardCategory`: Enum with 10 values
- `RankTier`: Enum with 7 values (Bronze → Grandmaster)
- `LeaderboardEntry`: Pydantic BaseModel
- `ELOLeaderboardEntry`: Pydantic BaseModel with tier
- `PlayerRating`: Pydantic BaseModel with ELO fields

### Frontend (TypeScript) ✅
- `LeaderboardCategory`: Union type with 10 values
- `RankTier`: Union type (lowercase)
- `BackendRankTier`: Union type (PascalCase)
- `LeaderboardEntry`: Interface matching backend
- `ELOLeaderboardEntry`: Interface with tier as BackendRankTier
- `normalizeRankTier()`: Converts backend → frontend tier format

---

## 📋 STATS UPDATE FLOW ANALYSIS

### Current Flow (Working)
```
Game Ends
    ↓
GamePersistenceService.save_game()
    ↓
GamePersistenceService.update_player_stats()
    ↓
stats_repo.increment_stats() → user_profiles updated
stats_repo.update_win_streak() → user_profiles updated
    ↓
LeaderboardService.update_ratings() → player_ratings updated
```

### Problem: Disconnected Updates
- `user_profiles` stats updated by `GamePersistenceService`
- `player_ratings` ELO updated by `LeaderboardService`
- No single service owns "player stats"
- `win_rate` in `player_ratings` never recalculated

---

## 🚀 RECOMMENDED REFACTORING

### Option A: Profile as Single Source of Truth (Recommended)
1. **Remove `win_rate` from `player_ratings`** - calculate on read
2. **Add ELO fields to `user_profiles`** - consolidate all stats
3. **Update leaderboard queries** - all from `user_profiles`
4. **Deprecate `player_ratings` table** - migrate data

### Option B: Keep Dual Tables, Sync on Update
1. **Create unified `StatsService`** - owns all stat updates
2. **Update both tables atomically** - in single transaction
3. **Add `games_played` to `player_ratings`** - for ELO leaderboard
4. **Recalculate `win_rate` on each update**

### Option C: Materialized View (Performance)
1. **Create `leaderboard_stats` materialized view** - joins both tables
2. **Refresh on game end** - or on schedule
3. **Query view for all leaderboards** - single source

---

## 📋 MISSING ELEMENTS

### Not Implemented
- [ ] Cache invalidation on stats update
- [ ] `games_played` in ELO leaderboard entries
- [ ] Damage/Powerup leaderboards
- [ ] Seasonal leaderboard reset
- [ ] Leaderboard history/trends

### Partially Implemented
- [x] ELO system (working but disconnected from profile stats)
- [x] Legacy leaderboards (working from user_profiles)
- [x] Frontend leaderboard pages (working)

---

## 🚀 DEPLOYMENT STATUS

**NOT SAFE TO DEPLOY** without addressing:

1. 🔴 **CRITICAL:** `games_played=0` in ELO leaderboard - shows wrong data
2. 🔴 **CRITICAL:** Dual source of truth - potential data inconsistency
3. 🟡 **WARNING:** `win_rate` in `player_ratings` never updated

### Recommended Pre-Deploy Checklist
- [ ] Fix `games_played` in ELO leaderboard (query from user_profiles or match_results)
- [ ] Remove or sync `win_rate` in `player_ratings`
- [ ] Add cache invalidation to stats update flow
- [ ] Create spec for unified stats system if full refactor needed

---

## 📋 SPEC RECOMMENDATION

Given the scope of issues, **a new spec is recommended** for:

**"Unified Stats & Leaderboard System"**

Goals:
1. Single source of truth for all player stats
2. Consistent leaderboard data across all categories
3. Proper cache invalidation
4. Add missing leaderboard categories
5. Seasonal reset capability

This would be a medium-sized refactor (~1 week) but would eliminate ongoing data consistency issues.
