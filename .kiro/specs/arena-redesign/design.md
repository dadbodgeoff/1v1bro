# Arena Redesign - Design Document

## Overview

This document outlines the technical design for the arena redesign. The implementation modifies the existing arena configuration and renderers to support a multi-lane layout with strategic cover objects.

The approach is minimal and incremental - we modify existing systems rather than building new ones.

## Architecture

The arena system already has the right structure:

```
frontend/src/game/
├── config/
│   └── arena.ts          # Arena dimensions, barriers, spawn points
├── renderers/
│   ├── GridRenderer.ts   # Floor tiles
│   ├── BarrierRenderer.ts # Obstacle rendering
│   ├── PlayerRenderer.ts  # Player sprites
│   └── PowerUpRenderer.ts # Power-up icons
└── systems/
    └── CollisionSystem.ts # Rectangle collision detection
```

**No new files needed** - we update existing configuration and renderers.

## Data Structures

### Current Barrier Format (arena.ts)

```typescript
export const BARRIERS: Rectangle[] = [
  { x: 220, y: 80, width: 100, height: 560 },   // Left
  { x: 960, y: 80, width: 100, height: 560 },   // Right
]
```

### New Barrier Format

```typescript
// Tile-aligned barriers creating 3-lane layout
// Each barrier is 1 tile wide (80px) x 3 tiles tall (240px)
export const BARRIERS: Rectangle[] = [
  // Left side barriers (column 4 = x:320)
  { x: 320, y: 80, width: 80, height: 240 },   // Top-left (rows 1-3)
  { x: 320, y: 400, width: 80, height: 240 },  // Bottom-left (rows 5-7)
  
  // Right side barriers (column 10 = x:800)
  { x: 800, y: 80, width: 80, height: 240 },   // Top-right (rows 1-3)
  { x: 800, y: 400, width: 80, height: 240 },  // Bottom-right (rows 5-7)
]
```

### Power-Up Spawn Positions (Updated)

```typescript
// 8 positions in the central playable area
export const POWERUP_SPAWN_POSITIONS: Vector2[] = [
  { x: 640, y: 40 },    // Top center (row 0)
  { x: 640, y: 680 },   // Bottom center (row 8)
  { x: 480, y: 160 },   // Upper-left of hub
  { x: 800, y: 160 },   // Upper-right of hub
  { x: 480, y: 360 },   // Left of hub (mid lane)
  { x: 800, y: 360 },   // Right of hub (mid lane)
  { x: 480, y: 560 },   // Lower-left of hub
  { x: 800, y: 560 },   // Lower-right of hub
]
```

## Visual Layout

```
1280px x 720px arena (16 x 9 tiles at 80px each)

Pixel coordinates:
┌────────────────────────────────────────────────────────────────┐
│ (0,0)                        (640,40)                  (1280,0)│
│                                 P                              │
│         ┌────┐                                    ┌────┐       │
│         │    │ (320,80)              (800,80)     │    │       │
│  P1     │WALL│     P              P               │WALL│    P2 │
│(160,360)│    │ (480,160)      (800,160)           │    │(1120) │
│         └────┘ (320,320)              (800,320)   └────┘       │
│                                                                │
│              P    ◆ HUB ◆    P                                 │
│           (480,360) (640,360) (800,360)                        │
│                                                                │
│         ┌────┐                                    ┌────┐       │
│         │    │ (320,400)              (800,400)   │    │       │
│         │WALL│     P              P               │WALL│       │
│         │    │ (480,560)      (800,560)           │    │       │
│         └────┘ (320,640)              (800,640)   └────┘       │
│                                 P                              │
│                              (640,680)                         │
└────────────────────────────────────────────────────────────────┘

Lane structure:
- Top lane: y = 0-80 (row 0) - open passage
- Mid lane: y = 320-400 (row 4) - gap between barrier pairs
- Bottom lane: y = 640-720 (row 8) - open passage
```

## Components to Modify

### 1. arena.ts - Configuration

Update `BARRIERS` array with new positions:
- 4 barriers instead of 2
- Each 80x240px (1x3 tiles)
- Positioned to create 3 lanes

Update `POWERUP_SPAWN_POSITIONS`:
- Reposition to be accessible from lanes
- Keep 8 positions for fair distribution

### 2. BarrierRenderer.ts - No Changes Needed

The existing renderer iterates over `BARRIERS` array and renders each one. Adding more barriers to the array automatically renders them.

### 3. CollisionSystem.ts - No Changes Needed

The existing collision system checks against all barriers in the array. Adding more barriers automatically includes them in collision detection.

### 4. GridRenderer.ts - Optional Enhancement

Could add visual distinction for lanes vs. blocked areas, but not required for MVP.

## Collision Detection

Existing system in `CollisionSystem.ts`:

```typescript
checkBarrierCollision(position: Vector2, radius: number): boolean {
  for (const barrier of BARRIERS) {
    if (this.circleRectCollision(position, radius, barrier)) {
      return true
    }
  }
  return false
}
```

This already works with any number of barriers - no changes needed.

## Migration Path

1. Update `BARRIERS` array in `arena.ts`
2. Update `POWERUP_SPAWN_POSITIONS` in `arena.ts`
3. Test collision detection
4. Test power-up spawning
5. Verify visual appearance

## Testing Strategy

### Manual Testing
- [ ] Player cannot walk through any barrier
- [ ] Player can navigate all three lanes
- [ ] Power-ups spawn in accessible locations
- [ ] Both players have equal access to all areas

### Automated Testing
- [ ] Collision tests with new barrier positions
- [ ] Spawn position accessibility tests

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Barriers too close together | Use tile-aligned positions (80px grid) |
| Power-ups spawn inside barriers | Validate positions against barrier rectangles |
| Performance impact | Minimal - only 2 extra collision checks |

## Future Considerations

This design supports future enhancements:
- Additional barrier types (different textures)
- Dynamic barriers (moving, destructible)
- More complex layouts (additional obstacles)

These are out of scope for this phase.
