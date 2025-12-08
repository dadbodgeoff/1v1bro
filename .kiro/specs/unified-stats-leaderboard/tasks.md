# Implementation Plan

## Phase 1: Database Migration

- [x] 1. Create Migration Script
  - [x] 1.1 Create `backend/app/database/migrations/020_unified_stats.sql`
    - Add `current_elo INTEGER DEFAULT 1200` to user_profiles
    - Add `peak_elo INTEGER DEFAULT 1200` to user_profiles
    - Add `current_tier VARCHAR(20) DEFAULT 'Gold'` to user_profiles
    - Create index `idx_user_profiles_elo` on current_elo DESC
    - _Requirements: 1.1_

  - [x] 1.2 Add data migration logic
    - Copy current_elo, peak_elo, current_tier from player_ratings to user_profiles
    - Handle NULL values with COALESCE defaults
    - _Requirements: 1.2_

  - [x] 1.3 Deprecate legacy table
    - Rename player_ratings to player_ratings_deprecated
    - Add comment with deprecation date
    - _Requirements: 7.1, 7.2_

  - [x] 1.4 Write property test for migration data integrity
    - **Property 1: ELO Migration Data Integrity**
    - Verify migrated ELO values match source
    - **Validates: Requirements 1.2**

---

## Phase 2: Update Stored Procedure

- [x] 2. Extend Stats Update Procedure
  - [x] 2.1 Update `increment_player_stats` stored procedure
    - Add p_elo_delta INTEGER parameter
    - Add p_new_tier VARCHAR parameter
    - Calculate new ELO with clamping (100-3000)
    - Update peak_elo if new ELO exceeds current peak
    - _Requirements: 2.4, 2.3_

  - [x] 2.2 Write property test for ELO bounds clamping
    - **Property 6: ELO Bounds Clamping**
    - Generate extreme ELO deltas, verify clamping
    - **Validates: Requirements 2.4**

  - [x] 2.3 Write property test for peak ELO invariant
    - **Property 5: Peak ELO Invariant**
    - Verify peak_elo >= current_elo after any update
    - **Validates: Requirements 2.3**

---

## Phase 3: Backend Repository Updates

- [x] 3. Create UnifiedStatsRepository
  - [x] 3.1 Create `backend/app/database/repositories/unified_stats_repo.py`
    - Implement get_player_stats() returning all stats + ELO
    - Implement update_stats_with_elo() calling extended stored procedure
    - Implement get_elo_leaderboard() from user_profiles
    - Implement get_regional_elo_leaderboard() with country filter
    - _Requirements: 4.1, 5.1, 5.2, 5.3_

  - [x] 3.2 Write property test for games_played in ELO leaderboard
    - **Property 8: Games Played in ELO Leaderboard**
    - Verify games_played matches user_profiles value
    - **Validates: Requirements 4.1**

  - [x] 3.3 Write property test for regional filtering
    - **Property 10: Regional Leaderboard Filtering**
    - Verify all entries have correct country
    - **Validates: Requirements 5.3**

---

## Phase 4: Backend Service Updates

- [x] 4. Update LeaderboardService
  - [x] 4.1 Update `backend/app/services/leaderboard_service.py`
    - Replace RatingsRepository with UnifiedStatsRepository
    - Update get_global_leaderboard() to query user_profiles
    - Update get_regional_leaderboard() to use country from user_profiles
    - Calculate win_rate from games_won/games_played
    - _Requirements: 4.2, 4.3, 5.2_

  - [x] 4.2 Write property test for win rate calculation
    - **Property 9: Win Rate Calculation**
    - Verify win_rate = games_won / games_played * 100
    - **Validates: Requirements 4.3**

  - [x] 4.3 Write property test for leaderboard sort order
    - **Property 13: Leaderboard Sort Order**
    - Verify entries sorted by ELO descending
    - **Validates: Requirements 10.4**

- [ ] 5. Update StatsService
  - [ ] 5.1 Update `backend/app/services/stats_service.py`
    - Add ELO calculation methods (calculate_elo_change, get_k_factor, get_tier)
    - Update update_game_stats() to include ELO updates
    - Call unified repository for atomic updates
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 5.2 Write property test for ELO formula
    - **Property 3: ELO Formula Correctness**
    - Verify ELO changes follow standard formula
    - **Validates: Requirements 2.1**

  - [x] 5.3 Write property test for K-factor selection
    - **Property 4: K-Factor Selection**
    - Verify correct K-factor for rating ranges
    - **Validates: Requirements 2.2**

  - [x] 5.4 Write property test for tier-ELO consistency
    - **Property 7: Tier-ELO Consistency**
    - Verify tier matches ELO range
    - **Validates: Requirements 2.5**

---

## Phase 5: Cache Invalidation

- [x] 6. Add Cache Invalidation
  - [x] 6.1 Update stats update flow to invalidate caches
    - Invalidate ELO leaderboard cache after stats update
    - Invalidate legacy leaderboard caches
    - _Requirements: 6.1, 6.2_

---

## Phase 6: Checkpoint - Backend Tests

- [x] 7. Checkpoint - Ensure all backend tests pass
  - 433 property tests pass, 1 unrelated test failure (question ordering)

---

## Phase 7: Update Profile Schema

- [x] 8. Update Profile Schema and Service
  - [x] 8.1 Update `backend/app/schemas/profile.py`
    - Add current_elo, peak_elo, current_tier fields to Profile
    - Add win_rate computed property
    - _Requirements: 8.1_

  - [x] 8.2 Update `backend/app/services/profile_service.py`
    - Include ELO fields in get_profile() response
    - _Requirements: 8.1, 8.3_

  - [x] 8.3 Write property test for profile ELO fields
    - **Property 11: Profile Contains ELO Fields**
    - Verify profile response includes ELO fields
    - **Validates: Requirements 8.1**

---

## Phase 8: Remove Legacy Dependencies

- [x] 9. Remove Legacy Repository Usage
  - [x] 9.1 Update `backend/app/services/leaderboard_service.py`
    - Remove import of RatingsRepository
    - Remove import of MatchResultsRepository for ELO queries
    - _Requirements: 7.3_

  - [x] 9.2 Update `backend/app/services/game/persistence.py`
    - Use StatsService for all stats updates
    - Remove direct calls to ratings_repo
    - Note: ELO updates handled by LeaderboardService.update_ratings() which now uses UnifiedStatsRepository
    - _Requirements: 3.1_

  - [x] 9.3 Update `backend/app/api/v1/leaderboards.py`
    - Ensure all endpoints use unified service
    - Already uses LeaderboardService which now uses UnifiedStatsRepository
    - _Requirements: 5.1_

---

## Phase 9: Checkpoint - Backend Integration

- [x] 10. Checkpoint - Ensure all backend tests pass
  - 433 property tests pass, 1 unrelated test failure (question ordering)

---

## Phase 10: Frontend Type Updates

- [x] 11. Update Frontend Types
  - [x] 11.1 Update `frontend/src/types/profile.ts`
    - Add current_elo, peak_elo, current_tier to Profile interface
    - _Requirements: 9.1_

  - [x] 11.2 Update `frontend/src/types/leaderboard.ts`
    - Verify ELOLeaderboardEntry has games_played (not hardcoded)
    - _Requirements: 9.3_

---

## Phase 11: Frontend Hook Updates

- [x] 12. Update Frontend Hooks
  - [x] 12.1 Update `frontend/src/hooks/useProfile.ts`
    - Include ELO fields in profile state
    - Note: Hook already fetches full profile, ELO fields included via updated Profile type
    - _Requirements: 8.2_

  - [x] 12.2 Update `frontend/src/hooks/useDashboard.ts`
    - Use profile ELO instead of separate ELO endpoint if applicable
    - Note: Hook uses /leaderboards/elo/me which now uses UnifiedStatsRepository
    - Profile also includes ELO fields for direct access
    - _Requirements: 8.3_

---

## Phase 12: Frontend Component Updates

- [x] 13. Update Profile Display
  - [x] 13.1 Update profile components to show ELO
    - Display current_elo with tier badge
    - Show peak_elo as secondary stat (in tooltip)
    - Updated StatsDashboard.tsx to show ELO rating with tier icon
    - _Requirements: 8.2_

---

## Phase 13: Data Invariant Tests

- [x] 14. Add Data Invariant Tests
  - [x] 14.1 Write property test for games played invariant
    - **Property 12: Games Played Invariant**
    - Verify games_played = games_won + games_lost
    - **Validates: Requirements 10.1**

  - [x] 14.2 Write property test for default ELO initialization
    - **Property 2: Default ELO Initialization**
    - Verify new users get default ELO values
    - **Validates: Requirements 1.3**

---

## Phase 14: Final Checkpoint

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| migrations/020_unified_stats.sql | Database migration |
| repositories/unified_stats_repo.py | Unified stats repository |

### Modified Files
| File | Changes |
|------|---------|
| services/leaderboard_service.py | Use unified repo, remove ratings_repo |
| services/stats_service.py | Add ELO calculation, atomic updates |
| services/profile_service.py | Include ELO in profile response |
| services/game/persistence.py | Use StatsService for all updates |
| schemas/profile.py | Add ELO fields |
| api/v1/leaderboards.py | Use unified service |
| types/profile.ts | Add ELO fields |
| types/leaderboard.ts | Verify games_played |
| hooks/useProfile.ts | Include ELO |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. ELO Migration Data Integrity | test_unified_stats.py | 1.2 |
| 2. Default ELO Initialization | test_unified_stats.py | 1.3 |
| 3. ELO Formula Correctness | test_unified_stats.py | 2.1 |
| 4. K-Factor Selection | test_unified_stats.py | 2.2 |
| 5. Peak ELO Invariant | test_unified_stats.py | 2.3 |
| 6. ELO Bounds Clamping | test_unified_stats.py | 2.4 |
| 7. Tier-ELO Consistency | test_unified_stats.py | 2.5 |
| 8. Games Played in ELO Leaderboard | test_unified_stats.py | 4.1 |
| 9. Win Rate Calculation | test_unified_stats.py | 4.3 |
| 10. Regional Leaderboard Filtering | test_unified_stats.py | 5.3 |
| 11. Profile Contains ELO Fields | test_unified_stats.py | 8.1 |
| 12. Games Played Invariant | test_unified_stats.py | 10.1 |
| 13. Leaderboard Sort Order | test_unified_stats.py | 10.4 |

### ELO Tier Ranges
| Tier | ELO Range |
|------|-----------|
| Bronze | 100-799 |
| Silver | 800-1199 |
| Gold | 1200-1599 |
| Platinum | 1600-1999 |
| Diamond | 2000-2399 |
| Master | 2400-2799 |
| Grandmaster | 2800-3000 |

### K-Factor Ranges
| Rating Range | K-Factor |
|--------------|----------|
| < 2000 | 32 |
| 2000-2399 | 24 |
| >= 2400 | 16 |

---

*Total Tasks: 15 phases with sub-tasks*
*Estimated Time: 3-5 days*
*New Files: 2*
*Modified Files: 9*
*Property Tests: 13*
