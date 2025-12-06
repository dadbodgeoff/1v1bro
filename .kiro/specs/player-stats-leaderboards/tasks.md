# Player Stats & Leaderboards - Implementation Plan

## Overview

This implementation follows a **bottom-up approach** building from database schema to API endpoints:

1. Database migration (schema changes)
2. Pydantic schemas (data models)
3. Repository layer (data access)
4. Service layer (business logic)
5. API layer (endpoints)
6. Integration with existing GameService

**Key Principles:**
- Each file stays under 250 lines
- Atomic database operations via stored procedures
- Computed stats calculated on read, not stored
- Minimum requirements for ratio-based leaderboards

**Estimated Time:** 2-3 days
**Total New Files:** ~10 files
**Lines of Code:** ~1,500 lines

---

## Phase 1: Database Migration

### Task 1: Create Stats Migration
- [x] 1.1 Create `backend/app/database/migrations/002_player_stats.sql`
  - Add trivia stats columns to user_profiles
  - Add combat stats columns to user_profiles
  - Add streak stats columns to user_profiles
  - Add powerups collected column
  - Add combat stats JSONB columns to games table
  - Create leaderboard indexes
  - Create increment_player_stats() stored procedure
  - Create update_win_streak() stored procedure
  - Create update_fastest_answer() stored procedure
  - _Requirements: 1.1-1.5, 7.1-7.5_

- [x] 1.2 Test migration locally
  - Run migration against test database
  - Verify existing data preserved
  - Verify new columns have defaults
  - _Requirements: 7.1, 7.2_


---

## Phase 2: Pydantic Schemas

### Task 2: Create Stats Schemas
- [x] 2.1 Create `backend/app/schemas/stats.py`
  - Define TriviaStats model
  - Define CombatStats model
  - Define StreakStats model
  - Define PlayerStats model (complete stats)
  - Define GameCombatSummary model
  - Define TriviaStatsDelta model
  - Define StatsUpdateRequest model
  - _Requirements: 1.1-1.4, 5.1-5.2_

### Task 3: Create Leaderboard Schemas
- [x] 3.1 Create `backend/app/schemas/leaderboard.py`
  - Define LeaderboardCategory enum
  - Define LeaderboardEntry model
  - Define LeaderboardResponse model
  - Define UserRankResponse model
  - Define LeaderboardQueryParams model
  - _Requirements: 4.1-4.5_

- [x] 3.2 Update `backend/app/schemas/__init__.py`
  - Export new schema classes
  - _Requirements: N/A_

---

## Phase 3: Repository Layer

### Task 4: Create Stats Repository
- [x] 4.1 Create `backend/app/database/repositories/stats_repo.py`
  - Implement StatsRepository class
  - Implement get_raw_stats(user_id) method
  - Implement increment_stats() using stored procedure
  - Implement increment_streak() method
  - Implement reset_streak() method
  - Implement update_fastest_answer() method
  - Implement batch_update() for atomic operations
  - _Requirements: 2.1-2.6, 3.4_

### Task 5: Create Leaderboard Repository
- [x] 5.1 Create `backend/app/database/repositories/leaderboard_repo.py`
  - Implement LeaderboardRepository class
  - Implement query_leaderboard(category, limit, offset, min_req) method
  - Implement count_eligible(category, min_req) method
  - Implement get_user_stat(user_id, category) method
  - Implement get_rank(user_id, category, min_req) method
  - Define SQL queries for each leaderboard category
  - _Requirements: 4.1-4.5_

- [x] 5.2 Update `backend/app/database/repositories/__init__.py`
  - Export new repository classes
  - _Requirements: N/A_

---

## Phase 4: Service Layer

### Task 6: Create Stats Service
- [x] 6.1 Create `backend/app/services/stats_service.py`
  - Implement StatsService class
  - Implement get_user_stats(user_id) method
  - Implement update_game_stats() method
  - Implement _compute_derived_stats() helper
  - Implement _aggregate_trivia_stats() helper
  - Implement _update_streak() helper
  - _Requirements: 1.6, 2.1-2.6, 3.1-3.3_

### Task 7: Create Leaderboard Service
- [x] 7.1 Create `backend/app/services/leaderboard_service.py`
  - Implement LeaderboardService class
  - Define REQUIREMENTS dict for minimum thresholds
  - Implement get_leaderboard(category, limit, offset) method
  - Implement get_user_rank(user_id, category) method
  - Implement get_all_user_ranks(user_id) method
  - Implement _check_eligibility() helper
  - Implement _format_requirement() helper
  - _Requirements: 4.1-4.5_

- [x] 7.2 Update `backend/app/services/__init__.py`
  - Export new service classes
  - _Requirements: N/A_

---

## Phase 5: Combat Tracker

### Task 8: Create Combat Tracker
- [x] 8.1 Create `backend/app/utils/combat_tracker.py`
  - Define CombatEvent dataclass
  - Define KillEvent dataclass
  - Define DamageEvent dataclass
  - Define ShotEvent dataclass
  - Implement CombatTracker class
  - Implement initialize(lobby_id, player_ids) method
  - Implement record_kill() method
  - Implement record_damage() method
  - Implement record_shot() method
  - Implement get_summary(lobby_id, player_id) method
  - Implement cleanup(lobby_id) method
  - _Requirements: 6.1-6.4_

---

## Phase 6: API Endpoints

### Task 9: Create Stats API
- [x] 9.1 Create `backend/app/api/v1/stats.py`
  - Create stats router
  - Implement GET /stats/me endpoint
  - Implement GET /stats/{user_id} endpoint
  - Implement GET /stats/me/history endpoint
  - Add authentication dependency
  - _Requirements: 5.1-5.6_

### Task 10: Create Leaderboards API
- [x] 10.1 Create `backend/app/api/v1/leaderboards.py`
  - Create leaderboards router
  - Implement GET /leaderboards/{category} endpoint
  - Implement GET /leaderboards/{category}/rank/{user_id} endpoint
  - Add pagination validation
  - _Requirements: 4.1-4.5_

- [x] 10.2 Update `backend/app/api/v1/__init__.py`
  - Register new routers
  - _Requirements: N/A_

- [x] 10.3 Update `backend/app/main.py`
  - Include new API routers (via router.py)
  - _Requirements: N/A_

---

## Phase 7: Integration

### Task 11: Integrate with GameService
- [x] 11.1 Update `backend/app/services/game_service.py`
  - Import StatsService and CombatTracker
  - Initialize CombatTracker in create_session()
  - Update end_game() to aggregate trivia stats
  - Update end_game() to get combat summaries
  - Update end_game() to call stats_service.update_game_stats()
  - Store combat summaries in game record
  - Cleanup CombatTracker on game end
  - _Requirements: 3.1-3.4_

### Task 12: Integrate Combat Events
- [x] 12.1 Update `backend/app/websocket/handlers.py`
  - Import CombatTracker
  - Call record_kill() on kill events
  - Call record_damage() on damage events
  - Call record_shot() on fire events
  - _Requirements: 6.1-6.4_
  - **NOTE: Frontend needs to emit combat events for full tracking**

---

## Phase 8: Testing

### Task 13: Unit Tests
- [x] 13.1 Create `backend/tests/property/test_stats.py`
  - Test computed stats formulas
  - Test schema validation
  - Test delta aggregation
  - Test combat summary
  - _Requirements: 1.6, 2.1-2.6_

- [x] 13.2 Create `backend/tests/property/test_leaderboards.py`
  - Test eligibility requirements
  - Test rank ordering
  - Test schema validation
  - Test category coverage
  - _Requirements: 4.1-4.5_

- [x] 13.3 Create `backend/tests/property/test_combat_tracker.py`
  - Test event recording
  - Test summary aggregation
  - Test cleanup
  - _Requirements: 6.1-6.4_

---

## Phase 9: Final Checkpoint

### Task 14: Verification
- [ ] 14.1 Run full test suite
  - All unit tests pass
  - All integration tests pass
  - _Requirements: All_

- [ ] 14.2 Manual API testing
  - Test stats endpoints
  - Test leaderboard endpoints
  - Verify data accuracy
  - _Requirements: All_

- [ ] 14.3 Performance verification
  - Leaderboard queries < 100ms
  - Stats updates < 50ms
  - _Requirements: Success Metrics_

---

## Quick Reference

### File Size Targets

| File | Target Lines |
|------|--------------|
| 002_player_stats.sql | <150 |
| schemas/stats.py | <150 |
| schemas/leaderboard.py | <100 |
| stats_repo.py | <200 |
| leaderboard_repo.py | <250 |
| stats_service.py | <250 |
| leaderboard_service.py | <200 |
| combat_tracker.py | <150 |
| api/v1/stats.py | <100 |
| api/v1/leaderboards.py | <100 |

### Leaderboard Categories

| Category | Sort | Minimum Requirement |
|----------|------|---------------------|
| wins | games_won DESC | None |
| win_rate | win% DESC | 10 games |
| total_score | total_score DESC | None |
| kills | total_kills DESC | None |
| kd_ratio | K/D DESC | 10 deaths |
| accuracy | accuracy% DESC | 100 shots |
| fastest_thinker | avg_time ASC | 50 correct |
| answer_rate | answer% DESC | 100 questions |
| win_streak | best_streak DESC | None |

### Computed Stats Formulas

| Stat | Formula |
|------|---------|
| win_rate | games_won / games_played * 100 |
| kd_ratio | total_kills / total_deaths (or kills if 0 deaths) |
| accuracy_pct | shots_hit / shots_fired * 100 |
| avg_answer_time_ms | total_answer_time_ms / total_correct_answers |
| answer_rate | total_correct_answers / total_questions_answered * 100 |

---

## Phase 10: Frontend UI

### Task 15: Create Leaderboard Frontend
- [x] 15.1 Create leaderboard types `frontend/src/types/leaderboard.ts`
  - Define LeaderboardCategory type
  - Define LeaderboardEntry, LeaderboardResponse interfaces
  - Define CATEGORY_META with icons, gradients, formatters

- [x] 15.2 Create UI components
  - GlassCard - Modern glassmorphism card
  - Badge/RankBadge - Rank badges with gold/silver/bronze
  - SearchInput - Search with clear button and glow effect
  - Pagination - Modern pagination with ellipsis
  - Avatar - Avatar with gradient fallback
  - Skeleton - Loading skeletons

- [x] 15.3 Create leaderboard components
  - LeaderboardCard - Category preview card
  - LeaderboardRow - Individual entry row

- [x] 15.4 Create pages
  - LeaderboardHub - Shows top 10 for all 9 categories
  - LeaderboardDetail - Full leaderboard with search/pagination

- [x] 15.5 Update routing
  - Add /leaderboards route
  - Add /leaderboards/:category route
  - Add leaderboard link to Home page

---

*Total Tasks: 15 (with sub-tasks)*
*Estimated Time: 2-3 days*
*New Files: ~20*
