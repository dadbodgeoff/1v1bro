# Implementation Plan

- [x] 1. Fix Backend Lobby Handler Playercard Enrichment
  - [x] 1.1 Update `handle_ready` method in `backend/app/websocket/handlers/lobby.py`
    - Add playercard enrichment before broadcasting player_ready event
    - Call `_get_player_playercards` with player IDs
    - Call `_enrich_players_with_playercards` to add playercard data
    - Use enriched players in `build_player_ready` call
    - _Requirements: 1.1_

  - [x] 1.2 Update `handle_disconnect` method in `backend/app/websocket/handlers/lobby.py`
    - Add playercard enrichment before broadcasting player_left event
    - Call `_get_player_playercards` for remaining players
    - Call `_enrich_players_with_playercards` to add playercard data
    - Use enriched players in `build_player_left` call
    - _Requirements: 1.3_

  - [x] 1.3 Write property test for player enrichment consistency
    - **Property 1: Player Enrichment Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 2. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Verify Frontend LoadoutPanel Playercard Support
  - [x] 3.1 Verify LoadoutPanel displays playercard slot correctly
    - Confirm SLOTS array includes 'playercard' in correct position
    - Confirm SLOT_ICONS has playercard icon ('🎴')
    - Confirm grid layout accommodates 7 slots
    - Test empty playercard slot shows placeholder
    - Test equipped playercard shows image with rarity border
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Write property test for LoadoutPanel slot completeness
    - **Property 2: LoadoutPanel Slot Completeness**
    - **Validates: Requirements 2.1**

  - [x] 3.3 Write property test for equipped playercard styling
    - **Property 3: Equipped Playercard Styling**
    - **Validates: Requirements 2.2**

  - [x] 3.4 Write property test for playercard slot click handler
    - **Property 4: Playercard Slot Click Handler**
    - **Validates: Requirements 2.4**

- [x] 4. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add Integration Test for Playercard Persistence
  - [x] 5.1 Write property test for playercard persistence through events
    - **Property 5: Playercard Persistence Through Events**
    - Test that playercard data persists through ready events
    - Test that playercard data persists through join events
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### Files to Modify
| File | Changes |
|------|---------|
| `backend/app/websocket/handlers/lobby.py` | Add playercard enrichment to handle_ready and handle_disconnect |

### Files to Verify (No Changes Expected)
| File | Verification |
|------|--------------|
| `frontend/src/components/inventory/enterprise/LoadoutPanel.tsx` | Confirm playercard in SLOTS array |
| `frontend/src/types/api.ts` | Confirm Player type has playercard field |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Player Enrichment Consistency | test_lobby.py | 1.1, 1.2, 1.3, 1.4 |
| 2. LoadoutPanel Slot Completeness | inventory.test.tsx | 2.1 |
| 3. Equipped Playercard Styling | inventory.test.tsx | 2.2 |
| 4. Playercard Slot Click Handler | inventory.test.tsx | 2.4 |
| 5. Playercard Persistence | test_lobby.py | 3.1, 3.2, 3.3 |

---

*Total Tasks: 6 phases*
*Estimated Time: 1-2 hours*
*Files Modified: 1*
*Property Tests: 5*
