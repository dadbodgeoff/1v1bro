# Arena E2E Testing - Implementation Plan

## Overview

This implementation plan creates a comprehensive end-to-end test suite for the AAA Arena system. The tests validate that all arena subsystems work correctly when integrated together.

**Testing Framework**: Vitest + fast-check (existing project setup)
**Estimated Time**: 1-2 days
**Total New Files**: 5 files
**Lines of Code**: ~1,500 lines

---

## Phase 1: Test Utilities

### Task 1: Create Test Helper Utilities
- [x] 1.1 Create `frontend/src/game/__tests__/e2e/helpers/PlayerSimulator.ts`
  - Implement PlayerSimulator class with id, position, velocity
  - Implement moveTo(position) method
  - Implement moveBy(delta) method
  - Implement getPosition() and setPosition() methods
  - Implement toPlayerMap() returning Map<string, Vector2>
  - Export createPlayerSimulator factory function
  - _Requirements: 11.1, 11.5_

- [x] 1.2 Create `frontend/src/game/__tests__/e2e/helpers/ArenaFactory.ts`
  - Implement ArenaFactory class
  - Implement createDefault() returning ArenaManager with NEXUS_ARENA
  - Implement createWithConfig(config) for custom configs
  - Implement createMinimal(options) for focused tests
  - Create helper to generate minimal valid MapConfig
  - _Requirements: 1.1, 1.5_

- [x] 1.3 Create `frontend/src/game/__tests__/e2e/helpers/EventRecorder.ts`
  - Implement EventRecorder class
  - Track barrierDestroyed, trapTriggered, playerTeleported, playerLaunched, hazardDamage events
  - Implement clear() method
  - Implement getCallbacks() returning ArenaCallbacks
  - Implement hasEvent(type, predicate) for assertions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.4 Create `frontend/src/game/__tests__/e2e/helpers/CanvasMock.ts`
  - Implement createCanvasMock() factory
  - Track render operations with timestamps
  - Implement hasDrawnInLayer(layer) assertion helper
  - Implement getOperationsInOrder() for order verification
  - Implement clear() method
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 1.5 Create `frontend/src/game/__tests__/e2e/helpers/index.ts`
  - Export all helper utilities
  - Export common test arbitraries (position, config generators)
  - _Requirements: 1.1_

---

## Phase 2: Arena Initialization Tests

### Task 2: Implement Arena Initialization Property Tests
- [x] 2.1 Create `frontend/src/game/__tests__/e2e/arena-e2e.test.ts` with initialization tests
  - Set up test file with Vitest imports
  - Import fast-check and arena modules
  - Import test helpers
  - _Requirements: 1.1_

- [x] 2.2 Write property test for arena initialization completeness
  - **Property 1: Arena Initialization Completeness**
  - Generate valid map configurations
  - Verify all subsystems initialize without errors
  - Verify barriers registered in spatial hash
  - Verify teleporter pairs linked correctly
  - **Validates: Requirements 1.1, 1.3, 1.4**

- [x] 2.3 Write property test for map validation error handling
  - **Property 2: Map Validation Error Handling**
  - Generate invalid configs (wrong dimensions, unpaired teleporters)
  - Verify descriptive errors thrown
  - Verify no partial initialization
  - **Validates: Requirements 1.5**

---

## Phase 3: Barrier Collision Tests

### Task 3: Implement Barrier Collision Property Tests
- [x] 3.1 Write property test for barrier collision resolution
  - **Property 3: Barrier Collision Resolution**
  - Generate positions inside barrier bounds
  - Verify resolveCollision returns position outside bounds
  - Test with full walls and half covers
  - Test destroyed barriers allow passage
  - **Validates: Requirements 2.1, 2.2, 2.5**

- [x] 3.2 Write property test for one-way barrier directionality
  - **Property 4: One-Way Barrier Directionality**
  - Generate one-way barriers with all directions (N, S, E, W)
  - Verify blocking from opposite direction
  - Verify passage from configured direction
  - **Validates: Requirements 2.3, 2.4**

---

## Phase 4: Hazard Zone Tests

### Task 4: Implement Hazard Zone Property Tests
- [x] 4.1 Write property test for hazard effect application
  - **Property 5: Hazard Effect Application**
  - Generate player positions inside damage zones
  - Verify EffectState includes damage_over_time
  - Test slow fields reduce speedMultiplier
  - Test EMP zones set powerUpsDisabled true
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 4.2 Write property test for hazard effect removal
  - **Property 6: Hazard Effect Removal**
  - Move player from inside to outside hazard
  - Verify effect removed from EffectState
  - Verify other effects remain
  - **Validates: Requirements 3.4**

- [x] 4.3 Write property test for multi-hazard effect aggregation
  - **Property 7: Multi-Hazard Effect Aggregation**
  - Place player in multiple same-type hazards
  - Verify only strongest effect applies
  - Place player in different-type hazards
  - Verify all effects apply simultaneously
  - **Validates: Requirements 3.5, 8.1, 8.2, 8.3**

---

## Phase 5: Trap System Tests

### Task 5: Implement Trap Property Tests
- [x] 5.1 Write property test for trap state machine
  - **Property 8: Trap State Machine**
  - Trigger pressure trap with player position
  - Verify state transitions: armed → triggered → cooldown → armed
  - Verify cooldown duration respected
  - Test timed trap interval triggering
  - **Validates: Requirements 4.1, 4.5, 4.6**

---

## Phase 6: Checkpoint - Core Property Tests
- [x] 6. Ensure all tests pass, ask the user if questions arise.
  - Run `npm test` in frontend directory
  - Verify Properties 1-8 pass
  - Fix any failing tests

---

## Phase 7: Transport System Tests

### Task 7: Implement Teleporter Property Tests
- [x] 7.1 Write property test for teleporter round-trip
  - **Property 9: Teleporter Round-Trip**
  - Generate teleporter pairs
  - Verify A→B returns B's position
  - Verify B→A returns A's position (bidirectional)
  - **Validates: Requirements 5.1, 5.5**

- [x] 7.2 Write property test for teleporter cooldown
  - **Property 10: Teleporter Cooldown**
  - Teleport player
  - Verify immediate re-teleport returns null
  - Advance time past cooldown
  - Verify teleport succeeds
  - **Validates: Requirements 5.2, 5.3**

### Task 8: Implement Jump Pad Property Tests
- [x] 8.1 Write property test for jump pad launch vector
  - **Property 11: Jump Pad Launch Vector**
  - Generate jump pads with all 8 directions
  - Verify launch returns correct velocity vector
  - Verify magnitude matches configured force
  - **Validates: Requirements 6.1**

- [x] 8.2 Write property test for jump pad cooldown
  - **Property 12: Jump Pad Cooldown**
  - Launch player
  - Verify immediate re-launch returns null
  - Advance time past cooldown
  - Verify launch succeeds
  - **Validates: Requirements 6.2, 6.3**

---

## Phase 8: Event and Query Tests

### Task 9: Implement Event Propagation Tests
- [x] 9.1 Write property test for event callback propagation
  - **Property 13: Event Callback Propagation**
  - Register callbacks with EventRecorder
  - Trigger barrier destruction, verify callback
  - Trigger trap, verify callback
  - Teleport player, verify callback
  - Apply hazard damage, verify callback
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Task 10: Implement Spatial Hash Tests
- [x] 10.1 Write property test for spatial hash query completeness
  - **Property 14: Spatial Hash Query Completeness**
  - Generate barriers at various positions
  - Query with position and radius
  - Verify all intersecting barriers returned
  - Destroy barrier, verify not returned
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

---

## Phase 9: Render and State Tests

### Task 11: Implement Render Layer Tests
- [x] 11.1 Write property test for render layer ordering
  - **Property 15: Render Layer Ordering**
  - Create arena with elements on multiple layers
  - Render with mock canvas
  - Verify layers render in ascending order (0-6)
  - Toggle layer visibility, verify elements don't render
  - **Validates: Requirements 10.5**

### Task 12: Implement State Consistency Tests
- [x] 12.1 Write property test for state consistency invariant
  - **Property 16: State Consistency Invariant**
  - Perform random sequence of operations
  - Verify no dangling references after barrier destruction
  - Verify effect stack consistent after rapid add/remove
  - Verify all subsystems in valid state
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

---

## Phase 10: Gameplay Scenario Tests

### Task 13: Implement Complete Gameplay Scenarios
- [x] 13.1 Create `frontend/src/game/__tests__/e2e/scenarios/gameplay-scenarios.test.ts`
  - Set up scenario test file
  - Import helpers and arena modules
  - _Requirements: 11.1_

- [x] 13.2 Write scenario: Player navigates through hazards and teleports
  - Create arena with hazards and teleporters
  - Move player through slow field
  - Verify speed effect applied
  - Teleport player
  - Verify teleport callback and position
  - Move to damage zone
  - Verify damage effect applied
  - _Requirements: 11.1, 11.3_

- [x] 13.3 Write scenario: Player destroys barrier and passes through
  - Create arena with destructible barrier
  - Verify collision blocks passage
  - Apply damage to destroy barrier
  - Verify destruction callback
  - Move through destroyed barrier location
  - Verify no collision
  - _Requirements: 11.4_

- [x] 13.4 Write scenario: Trap triggers while in hazard zone
  - Create arena with overlapping trap and hazard
  - Move player into hazard zone
  - Verify hazard effect applied
  - Trigger trap
  - Verify both trap effect and hazard effect active
  - _Requirements: 11.2_

- [x] 13.5 Write scenario: Multiple players interact simultaneously
  - Create arena with multiple interactive elements
  - Simulate two players
  - Player 1 teleports while Player 2 triggers trap
  - Verify both interactions processed correctly
  - Verify no interference between players
  - _Requirements: 11.5_

---

## Phase 11: Final Checkpoint
- [x] 14. Ensure all tests pass, ask the user if questions arise.
  - Run full test suite: `npm test`
  - Verify all 16 property tests pass
  - Verify all 4 scenario tests pass
  - Verify test execution < 30 seconds
  - No console errors or warnings

---

## Quick Reference

### File Structure

| File | Purpose | Lines |
|------|---------|-------|
| helpers/PlayerSimulator.ts | Player movement simulation | ~80 |
| helpers/ArenaFactory.ts | Test arena creation | ~120 |
| helpers/EventRecorder.ts | Event capture | ~80 |
| helpers/CanvasMock.ts | Canvas mock | ~100 |
| helpers/index.ts | Exports | ~30 |
| arena-e2e.test.ts | Property tests | ~800 |
| scenarios/gameplay-scenarios.test.ts | Scenario tests | ~300 |

### Property Test Summary

| # | Property | Validates |
|---|----------|-----------|
| 1 | Arena Initialization Completeness | 1.1, 1.3, 1.4 |
| 2 | Map Validation Error Handling | 1.5 |
| 3 | Barrier Collision Resolution | 2.1, 2.2, 2.5 |
| 4 | One-Way Barrier Directionality | 2.3, 2.4 |
| 5 | Hazard Effect Application | 3.1, 3.2, 3.3 |
| 6 | Hazard Effect Removal | 3.4 |
| 7 | Multi-Hazard Effect Aggregation | 3.5, 8.1, 8.2, 8.3 |
| 8 | Trap State Machine | 4.1, 4.5, 4.6 |
| 9 | Teleporter Round-Trip | 5.1, 5.5 |
| 10 | Teleporter Cooldown | 5.2, 5.3 |
| 11 | Jump Pad Launch Vector | 6.1 |
| 12 | Jump Pad Cooldown | 6.2, 6.3 |
| 13 | Event Callback Propagation | 7.1-7.5 |
| 14 | Spatial Hash Query Completeness | 9.1-9.4 |
| 15 | Render Layer Ordering | 10.5 |
| 16 | State Consistency Invariant | 12.1-12.4 |

### Test Commands

```bash
# Run all tests
cd frontend && npm test

# Run only E2E tests
cd frontend && npm test -- --grep "E2E"

# Run with coverage
cd frontend && npm test -- --coverage
```

---

*Total Tasks: 14 (with sub-tasks)*
*Property Tests: 16*
*Scenario Tests: 4*
*Estimated Time: 1-2 days*

