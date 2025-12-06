# Arena Redesign - Implementation Plan

## Overview

This is a minimal implementation - we're updating configuration values, not building new systems. The existing arena infrastructure handles everything.

**Estimated Time:** 1-2 hours  
**Files to Modify:** 1 (arena.ts)  
**Files to Test:** Existing collision and rendering systems

---

## Phase 1: Update Arena Configuration

### Task 1: Update Barrier Positions
- [x] 1.1 Open `frontend/src/game/config/arena.ts`
- [x] 1.2 Replace `BARRIERS` array with new 4-barrier layout
- [x] 1.3 Verify barriers are tile-aligned (80px grid)

**New BARRIERS configuration:**
```typescript
export const BARRIERS: Rectangle[] = [
  // Left side barriers (column 4 = x:320)
  { x: 320, y: 80, width: 80, height: 240 },   // Top-left (rows 1-3)
  { x: 320, y: 400, width: 80, height: 240 },  // Bottom-left (rows 5-7)
  
  // Right side barriers (column 10 = x:800)
  { x: 800, y: 80, width: 80, height: 240 },   // Top-right (rows 1-3)
  { x: 800, y: 400, width: 80, height: 240 },  // Bottom-right (rows 5-7)
]
```

### Task 2: Update Power-Up Spawn Positions
- [x] 2.1 Update `POWERUP_SPAWN_POSITIONS` array
- [x] 2.2 Ensure all positions are in accessible areas (not inside barriers)
- [x] 2.3 Maintain 8 positions for fair distribution

**New POWERUP_SPAWN_POSITIONS configuration:**
```typescript
export const POWERUP_SPAWN_POSITIONS: Vector2[] = [
  { x: 640, y: 40 },    // Top lane center
  { x: 640, y: 680 },   // Bottom lane center
  { x: 480, y: 160 },   // Upper-left quadrant
  { x: 800, y: 160 },   // Upper-right quadrant
  { x: 480, y: 360 },   // Mid-left (hub area)
  { x: 800, y: 360 },   // Mid-right (hub area)
  { x: 480, y: 560 },   // Lower-left quadrant
  { x: 800, y: 560 },   // Lower-right quadrant
]
```

### Task 3: Update Legacy POWERUP_SPAWNS (if still used)
- [x] 3.1 Check if `POWERUP_SPAWNS` is still referenced anywhere
- [x] 3.2 Update or remove if deprecated (updated to match new positions)

---

## Phase 2: Visual Verification

### Task 4: Test Barrier Rendering
- [ ] 4.1 Run the game locally
- [ ] 4.2 Verify 4 barriers render correctly
- [ ] 4.3 Verify barrier texture applies to all barriers
- [ ] 4.4 Check visual alignment with grid

### Task 5: Test Lane Navigation
- [ ] 5.1 Move player through top lane (y ≈ 40)
- [ ] 5.2 Move player through mid lane (y ≈ 360)
- [ ] 5.3 Move player through bottom lane (y ≈ 680)
- [ ] 5.4 Verify player cannot pass through barriers

### Task 6: Test Power-Up Spawns
- [ ] 6.1 Trigger power-up spawns
- [ ] 6.2 Verify all 8 positions are accessible
- [ ] 6.3 Verify no power-ups spawn inside barriers

---

## Phase 3: Collision Testing

### Task 7: Manual Collision Tests
- [ ] 7.1 Walk into each barrier from all 4 directions
- [ ] 7.2 Verify collision stops movement
- [ ] 7.3 Verify sliding along barrier edges works
- [ ] 7.4 Test corner collision behavior

### Task 8: Symmetry Verification
- [ ] 8.1 Measure distance from P1 spawn to hub center
- [ ] 8.2 Measure distance from P2 spawn to hub center
- [ ] 8.3 Verify distances are equal (±5%)
- [ ] 8.4 Verify both players have same lane access

---

## Phase 4: Checkpoint - Arena Redesign Complete

### Acceptance Checklist
- [ ] 4 barriers render correctly with texture
- [ ] 3 distinct lanes are navigable
- [ ] Player collision works on all barriers
- [ ] Power-ups spawn in accessible locations
- [ ] Layout is symmetrical (left-right mirror)
- [ ] No performance degradation
- [ ] Build passes without errors
- [ ] All existing tests still pass

---

## Quick Reference

### Tile Grid (80px per tile)

| Column | X Position |
|--------|------------|
| 0 | 0-80 |
| 1 | 80-160 |
| 2 | 160-240 |
| 3 | 240-320 |
| 4 | 320-400 ← Left barriers |
| 5 | 400-480 |
| 6 | 480-560 |
| 7 | 560-640 |
| 8 | 640-720 ← Hub center |
| 9 | 720-800 |
| 10 | 800-880 ← Right barriers |
| 11 | 880-960 |
| 12 | 960-1040 |
| 13 | 1040-1120 |
| 14 | 1120-1200 |
| 15 | 1200-1280 |

| Row | Y Position |
|-----|------------|
| 0 | 0-80 ← Top lane |
| 1 | 80-160 |
| 2 | 160-240 ← Player spawns |
| 3 | 240-320 |
| 4 | 320-400 ← Mid lane gap |
| 5 | 400-480 |
| 6 | 480-560 |
| 7 | 560-640 |
| 8 | 640-720 ← Bottom lane |

### Key Coordinates

| Element | Position |
|---------|----------|
| Player 1 spawn | (160, 360) |
| Player 2 spawn | (1120, 360) |
| Hub center | (640, 360) |
| Top lane | y = 40 (center of row 0) |
| Mid lane | y = 360 (center of row 4) |
| Bottom lane | y = 680 (center of row 8) |

---

## Rollback Plan

If issues arise, revert `arena.ts` to previous barrier configuration:

```typescript
// Original 2-barrier layout
export const BARRIERS: Rectangle[] = [
  { x: 220, y: 80, width: 100, height: 560 },
  { x: 960, y: 80, width: 100, height: 560 },
]
```

---

*Total Tasks: 8*  
*Estimated Time: 1-2 hours*
