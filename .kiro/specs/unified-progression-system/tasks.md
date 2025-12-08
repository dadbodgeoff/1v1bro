# Unified Progression System - Implementation Plan

## Overview

This implementation plan establishes the Battle Pass as the single source of truth for all player progression. The plan ensures:

1. All new users start at tier 1 with tier 1 skin auto-claimed and equipped
2. XP is automatically awarded after every match completion
3. Tier advancement happens automatically when XP thresholds are met
4. All UI surfaces display consistent tier/XP data

**Estimated Time:** 3-5 days
**New Files:** 3 files
**Modified Files:** 4 files

---

## Phase 1: Progress Initialization Fix

- [x] 1. Modify Progress Creation to Start at Tier 1
  - [x] 1.1 Update `backend/app/database/repositories/battlepass_repo.py`
    - Change `create_player_progress()` to initialize `current_tier` to 1 (was 0)
    - Change `create_player_progress()` to initialize `claimed_rewards` to [1] (was [])
    - Add docstring noting UNIFIED PROGRESSION behavior
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Write property test for progress initialization
    - **Property 3: Progress Initialization**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Auto-Claim Tier 1 with Inventory Integration

- [x] 3. Create ProgressionService
  - [x] 3.1 Create `backend/app/services/progression_service.py`
    - Create ProgressionService class with dependencies: BattlePassService, CosmeticsService
    - Implement `initialize_progress()` method that:
      - Calls `battlepass_service.get_player_progress()`
      - If progress is newly created (tier 1, claimed=[1]), triggers auto-claim flow
      - Gets tier 1 cosmetic from season tiers
      - Adds cosmetic to inventory via `cosmetics_service.add_to_inventory()`
      - Returns progress
    - Add error handling for missing tier 1 cosmetic
    - Add logging for initialization events
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 3.2 Add auto-equip logic for tier 1 skin
    - Check if user has any skin equipped
    - If no skin equipped, equip the tier 1 skin
    - Use existing inventory/loadout service
    - _Requirements: 1.4_

- [x] 4. Integrate ProgressionService into BattlePassService
  - [x] 4.1 Update `backend/app/services/battlepass_service.py`
    - Modify `get_player_progress()` to use ProgressionService for initialization
    - Add dependency injection for CosmeticsService
    - Ensure backward compatibility with existing callers
    - _Requirements: 1.3, 1.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: XP Award Integration

- [x] 6. Verify XP Calculation Logic
  - [x] 6.1 Review existing `calculate_match_xp()` in battlepass_service.py
    - Verify formula: base (100/50) + kills*5 + streak*10 + duration*0.1
    - Verify clamping to [50, 300]
    - Add any missing edge case handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 6.2 Write property test for XP calculation bounds
    - **Property 1: XP Calculation Bounds**
    - **Validates: Requirements 2.6**

  - [x] 6.3 Write property test for XP calculation formula
    - **Property 2: XP Calculation Formula**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

- [x] 7. Integrate XP Award into Game End Handler
  - [x] 7.1 Update `backend/app/websocket/handlers/game.py` (or equivalent game end handler)
    - Import BattlePassService/ProgressionService
    - After game_end is determined, call `award_match_xp()` for winner
    - Call `award_match_xp()` for loser
    - Extract match data: won, kills, streak, duration_seconds
    - Include XP results in game_end WebSocket payload
    - Handle errors gracefully (log and continue)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 7.2 Update game_end WebSocket payload schema
    - Add `winner_xp` field with XPAwardResult
    - Add `loser_xp` field with XPAwardResult
    - Update frontend types if needed
    - _Requirements: 5.3_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Tier Advancement Logic

- [x] 9. Verify Tier Advancement Logic
  - [x] 9.1 Review existing `award_xp()` in battlepass_service.py
    - Verify tier advancement when XP >= xp_per_tier
    - Verify overflow XP calculation
    - Verify multiple tier advancement in single award
    - Verify tier cap at 100
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 9.2 Write property test for tier advancement correctness
    - **Property 4: Tier Advancement Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 9.3 Write property test for tier cap enforcement
    - **Property 5: Tier Cap Enforcement**
    - **Validates: Requirements 3.5**

- [x] 10. Add Claimable Rewards Tracking
  - [x] 10.1 Verify claimable_rewards calculation in get_player_progress()
    - Ensure claimable = [t for t in range(1, current_tier+1) if t not in claimed]
    - Verify tier 1 is NOT in claimable (already auto-claimed)
    - _Requirements: 3.4_

  - [x] 10.2 Write property test for claimable rewards calculation
    - **Property 8: Claimable Rewards Calculation**
    - **Validates: Requirements 4.1, 4.2**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: WebSocket Events

- [x] 12. Add XP Award WebSocket Event
  - [x] 12.1 Create xp_awarded event in game end handler
    - Send event with: xp_amount, new_total_xp, previous_tier, new_tier, tier_advanced
    - Send to the player who earned XP
    - Include calculation breakdown for UI display
    - _Requirements: 2.8_

- [x] 13. Add Tier Advanced WebSocket Event
  - [x] 13.1 Create tier_advanced event
    - Send when tier_advanced is true in XP result
    - Include: previous_tier, new_tier, tiers_gained, new_claimable_rewards
    - Send immediately after xp_awarded event
    - _Requirements: 3.6_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Reward Claiming Verification

- [x] 15. Verify Claim Reward Logic
  - [x] 15.1 Review existing `claim_reward()` in battlepass_service.py
    - Verify tier validation (tier <= current_tier)
    - Verify not-already-claimed validation
    - Verify inventory integration for cosmetic rewards
    - Verify claimed_rewards array update
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 15.2 Write property test for claim validation
    - **Property 6: Claim Validation**
    - **Validates: Requirements 4.1, 4.2**

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Legacy User Migration

- [x] 17. Add On-Access Migration for Tier 0 Users
  - [x] 17.1 Update `get_player_progress()` to detect and migrate tier 0 users
    - Check if current_tier == 0
    - If so, update to tier 1
    - Add 1 to claimed_rewards if not present
    - Add tier 1 cosmetic to inventory
    - Equip if no skin equipped
    - Log migration event
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 17.2 Create migration script for batch processing
    - Create `scripts/migrate_tier_zero_users.py`
    - Query all tier 0 users for current season
    - Process each user with migration logic
    - Log results and any failures
    - _Requirements: 8.1, 8.4_

- [x] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: API Endpoint Verification

- [x] 19. Verify Battle Pass API Endpoints
  - [x] 19.1 Review `backend/app/api/v1/battlepass.py`
    - Verify GET /me returns correct progress with tier 1 for new users
    - Verify POST /me/claim-reward works correctly
    - Verify error responses are appropriate
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 19.2 Add XP result to game_end response
    - Ensure game_end WebSocket includes xp_result
    - Update any API documentation
    - _Requirements: 7.3_

- [x] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 9: Integration Tests

- [x] 21. Create Integration Test Suite
  - [x] 21.1 Create `backend/tests/integration/test_unified_progression.py`
    - Test: New user registration creates tier 1 progress
    - Test: Tier 1 cosmetic is added to inventory on init
    - Test: Tier 1 skin is equipped if no skin equipped
    - Test: Match completion awards XP correctly
    - Test: Tier advances when XP threshold met
    - Test: Claim reward adds cosmetic to inventory
    - Test: Tier 0 user is migrated on access
    - _Requirements: 1.1-1.7, 2.1-2.8, 3.1-3.6, 4.1-4.8, 5.1-5.6_

  - [x] 21.2 Write property test for XP serialization round-trip
    - **Property 7: XP Award Result Serialization Round-Trip**
    - **Validates: Requirements 2.7**

- [x] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 10: End-to-End Verification

- [x] 23. Run End-to-End Tests with Test Account
  - [x] 23.1 Verify test account (dadbodgeoff@gmail.com) progression
    - Login and check current tier/XP
    - If tier 0, verify migration to tier 1
    - Verify tier 1 skin in inventory
    - Check Profile shows correct tier
    - Check Dashboard shows correct tier
    - Check Battle Pass page shows correct progress
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 23.2 Test match XP flow (if possible)
    - Complete a match (or simulate)
    - Verify XP is awarded
    - Verify tier advances if threshold met
    - Verify WebSocket events received
    - _Requirements: 5.1-5.6_

- [x] 24. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| backend/app/services/progression_service.py | Orchestrates unified progression logic |
| backend/tests/integration/test_unified_progression.py | End-to-end progression tests |
| backend/tests/property/test_progression.py | Property-based tests for XP and tier logic |

### Modified Files
| File | Changes |
|------|---------|
| backend/app/database/repositories/battlepass_repo.py | Initialize at tier 1 with claimed=[1] |
| backend/app/services/battlepass_service.py | Add auto-claim and inventory integration |
| backend/app/websocket/handlers/game.py | Call award_match_xp on game_end |
| backend/app/api/v1/battlepass.py | Ensure migration on access |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. XP Calculation Bounds | test_progression.py | 2.6 |
| 2. XP Calculation Formula | test_progression.py | 2.1-2.6 |
| 3. Progress Initialization | test_progression.py | 1.1, 1.2 |
| 4. Tier Advancement Correctness | test_progression.py | 3.1, 3.2, 3.3 |
| 5. Tier Cap Enforcement | test_progression.py | 3.5 |
| 6. Claim Validation | test_progression.py | 4.1, 4.2 |
| 7. XP Serialization Round-Trip | test_progression.py | 2.7 |
| 8. Claimable Rewards Calculation | test_progression.py | 4.1, 4.2 |

### XP Calculation Reference
| Component | Formula |
|-----------|---------|
| Base XP (Win) | 100 |
| Base XP (Loss) | 50 |
| Kill Bonus | kills * 5 |
| Streak Bonus | streak * 10 |
| Duration Bonus | int(duration_seconds * 0.1) |
| Total | Clamped to [50, 300] |

### Tier Advancement Reference
| Scenario | Result |
|----------|--------|
| current_xp + awarded < xp_per_tier | No tier change, XP added |
| current_xp + awarded >= xp_per_tier | Tier +1, XP = overflow |
| Multiple thresholds crossed | Multiple tier advances |
| Tier reaches 100 | Cap at 100, XP = 0 |

### WebSocket Events Reference
| Event | Trigger | Payload |
|-------|---------|---------|
| xp_awarded | After match XP calculated | xp_amount, new_total_xp, tier_advanced |
| tier_advanced | When tier increases | previous_tier, new_tier, new_claimable |
| reward_claimed | After successful claim | tier, reward_type, inventory_item_id |

### Migration Reference
| User State | Action |
|------------|--------|
| tier = 0, claimed = [] | Migrate to tier 1, add 1 to claimed, add cosmetic |
| tier = 0, claimed = [1] | Migrate to tier 1 only |
| tier >= 1 | No migration needed |

---

*Total Tasks: 24 phases with sub-tasks*
*Estimated Time: 3-5 days*
*New Files: 3*
*Property Tests: 8*
