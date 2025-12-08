# Implementation Plan

## Task 1: Create Vortex Arena Map Configuration

- [ ] 1.1 Create `frontend/src/game/config/maps/vortex-arena.ts`
  - Define tile type shortcuts (F, W, H, D, S, E, P, T, X, J)
  - Create 16×9 tile grid with vortex pattern layout
  - Define metadata: name "Vortex Arena", author, version "1.0.0", description
  - _Requirements: 1.1, 1.3, 1.4, 9.1-9.4_

- [ ] 1.2 Add barrier configurations to vortex-arena.ts
  - Add 4 full-wall barriers creating structure
  - Add 4 half-wall barriers for spawn protection
  - Add 4 destructible barriers with health: 100
  - Ensure horizontal symmetry in positions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [ ] 1.3 Add hazard configurations to vortex-arena.ts
  - Add 4 damage hazard zones (intensity: 15) forming vortex arms
  - Add 4 slow field hazard zones (intensity: 0.5) for approach control
  - Add 2 EMP hazard zones at center for power-up denial
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 1.4 Add trap configurations to vortex-arena.ts
  - Add 4 pressure traps at chokepoints (damage: 35, cooldown: 10)
  - Add 2 timed traps at vortex center (damage: 35, interval: 8, cooldown: 8)
  - Set trigger radius to 40 pixels for all traps
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 1.5 Add teleporter configurations to vortex-arena.ts
  - Add teleporter pair 'alpha' at top corners
  - Add teleporter pair 'beta' at mid flanks
  - Add teleporter pair 'gamma' at bottom corners
  - Set radius to 30 pixels for all teleporters
  - _Requirements: 6.1, 6.3_

- [ ] 1.6 Add jump pad configurations to vortex-arena.ts
  - Add 4 orbital jump pads with diagonal directions (SE, SW, NE, NW)
  - Add 2 center approach jump pads with E/W directions
  - Set force to 400 and radius to 40 for all jump pads
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 1.7 Add spawn points and power-up spawns to vortex-arena.ts
  - Add player1 spawn at (160, 360)
  - Add player2 spawn at (1120, 360)
  - Add 10 power-up spawn positions with balanced distribution
  - _Requirements: 2.1, 2.2, 8.1_

- [ ] 1.8 Write property test for spawn point equidistance
  - **Property 2: Spawn Point Equidistance**
  - Calculate distance from each spawn to center (640, 360)
  - Verify distances are equal within 1 pixel tolerance
  - **Validates: Requirements 2.3**

---

## Task 2: Update Maps Index Export

- [ ] 2.1 Update `frontend/src/game/config/maps/index.ts`
  - Import VORTEX_ARENA from './vortex-arena'
  - Add VORTEX_ARENA to exports alongside NEXUS_ARENA
  - _Requirements: 10.1, 10.2, 10.3_

---

## Task 3: Validate Map Configuration

- [ ] 3.1 Run validateMapConfig on VORTEX_ARENA
  - Import validateMapConfig and VORTEX_ARENA
  - Call validateMapConfig(VORTEX_ARENA)
  - Verify returns { valid: true, errors: [] }
  - _Requirements: 1.2, 10.4_

- [ ] 3.2 Write property test for spatial safety - hazard clearance
  - **Property 3: Spatial Safety - Hazard Clearance**
  - For all spawn points, teleporters, power-up spawns
  - Verify none are contained within hazard zone bounds
  - Verify spawn points have 160px clearance from hazard boundaries
  - **Validates: Requirements 2.4, 4.4, 6.5, 8.4**

- [ ] 3.3 Write property test for spatial safety - trap clearance
  - **Property 4: Spatial Safety - Trap Clearance**
  - For all spawn points and power-up spawns
  - Verify distance to trap center >= trap radius + clearance
  - **Validates: Requirements 2.5, 8.5**

- [ ] 3.4 Write property test for barrier non-overlap
  - **Property 5: Barrier Non-Overlap**
  - For all pairs of barriers
  - Verify bounding rectangles do not overlap
  - **Validates: Requirements 3.5**

- [ ] 3.5 Write property test for horizontal symmetry
  - **Property 6: Horizontal Symmetry**
  - For all barriers, traps, teleporters, jump pads, power-up spawns
  - Verify each left-side element has mirrored right-side element
  - **Validates: Requirements 3.6, 5.6, 6.6, 7.6, 8.3**

- [ ] 3.6 Write property test for teleporter pair validity
  - **Property 7: Teleporter Pair Validity**
  - For all teleporters, verify exactly one pair exists
  - Verify paired teleporters are on opposite horizontal halves
  - **Validates: Requirements 6.2, 6.4**

- [ ] 3.7 Write property test for hazard coverage limit
  - **Property 8: Hazard Coverage Limit**
  - Calculate total hazard zone area
  - Verify total <= 25% of arena area (230,400 sq px)
  - **Validates: Requirements 4.5**

- [ ] 3.8 Write property test for power-up access balance
  - **Property 9: Power-Up Access Balance**
  - Calculate distance set from each spawn to all power-ups
  - Verify both players have equal distance sets (sorted)
  - **Validates: Requirements 8.6**

---

## Task 4: Integration Test with ArenaManager

- [ ] 4.1 Test ArenaManager.loadMap with VORTEX_ARENA
  - Create ArenaManager instance
  - Call loadMap(VORTEX_ARENA)
  - Verify no errors thrown
  - Verify all subsystems initialized
  - _Requirements: 1.5, 10.5_

- [ ] 4.2 Write unit tests for map configuration structure
  - Verify metadata values (name, version, description length)
  - Verify tile grid dimensions (9 rows × 16 columns)
  - Verify component counts meet minimums
  - _Requirements: 1.1, 1.3, 1.4, 3.1-3.4, 4.1-4.3, 5.1-5.4, 6.1, 7.1-7.4, 8.1_

---

## Task 5: Checkpoint - Ensure All Tests Pass

- [ ] 5.1 Ensure all tests pass, ask the user if questions arise.

---

## Task 6: Update GameEngine for Map Selection (Optional Enhancement)

- [ ] 6.1 Add map parameter to GameEngine constructor
  - Modify GameEngine to accept optional mapConfig parameter
  - Default to NEXUS_ARENA if not provided
  - Update loadMap() to use provided config
  - _Requirements: Future map selection support_

---

## Task 7: Final Checkpoint

- [ ] 7.1 Ensure all tests pass, ask the user if questions arise.
