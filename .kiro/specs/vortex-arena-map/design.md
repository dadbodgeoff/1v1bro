# Vortex Arena - Design Document

## Overview

Vortex Arena is a premium esports-ready 2D arena map that introduces rotational gameplay mechanics centered around a dynamic "vortex core" - a contested central area surrounded by hazard zones creating a spiral visual pattern. The map emphasizes risk-reward positioning, teleporter-based flanking, and environmental mastery through strategic use of jump pads, destructible cover, and trap awareness.

### Design Philosophy

Unlike Nexus Arena's three-lane structure, Vortex Arena uses a **radial design** with:
- **Central Vortex**: High-risk, high-reward contested zone
- **Orbital Paths**: Safer routes circling the vortex
- **Flanking Corridors**: Teleporter-connected side routes
- **Defensive Alcoves**: Spawn-adjacent safe zones with destructible cover

### Key Differentiators from Nexus Arena

| Aspect | Nexus Arena | Vortex Arena |
|--------|-------------|--------------|
| Layout | 3-lane horizontal | Radial/orbital |
| Center | Open hub | Hazard vortex |
| Cover | Static half-walls | Destructible + static |
| Hazards | Flanking slow fields | Central damage spiral |
| Teleporters | Corner pairs | Cross-map flanking |
| Jump Pads | Side launchers | Orbital rotation |

## Architecture

### File Structure

```
frontend/src/game/config/maps/
├── index.ts              # Updated to export VORTEX_ARENA
├── map-schema.ts         # Existing validation (no changes)
├── nexus-arena.ts        # Existing map (no changes)
└── vortex-arena.ts       # NEW: Vortex Arena configuration
```

### Integration Points

1. **ArenaManager.loadMap()** - Accepts MapConfig, no changes needed
2. **validateMapConfig()** - Validates against existing schema
3. **GameEngine.loadMap()** - Currently hardcoded to NEXUS_ARENA, needs map parameter
4. **Lobby/Matchmaking** - Future: map selection UI (out of scope for this spec)

## Components and Interfaces

### Map Configuration (vortex-arena.ts)

The map uses the existing `MapConfig` interface from `map-schema.ts`:

```typescript
import type { MapConfig, TileDefinition } from './map-schema'

export const VORTEX_ARENA: MapConfig = {
  metadata: MapMetadata,
  tiles: TileDefinition[][],      // 9 rows × 16 columns
  barriers: BarrierConfig[],      // 12 barriers
  hazards: HazardConfig[],        // 6 hazard zones
  traps: TrapConfig[],            // 4 traps
  teleporters: TeleporterConfig[], // 6 teleporters (3 pairs)
  jumpPads: JumpPadConfig[],      // 6 jump pads
  spawnPoints: SpawnPointConfig[], // 2 spawn points
  powerUpSpawns: Vector2[]        // 10 power-up locations
}
```

## Data Models

### Visual Map Layout (16×9 Grid)

```
Legend:
F = Floor          W = Wall           H = Half Wall
D = Damage Hazard  S = Slow Field     E = EMP Zone
P = Pressure Trap  T = Timed Trap     
X = Teleporter     J = Jump Pad       * = Destructible

     0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
   ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
 0 │ F │ F │ X │ F │ W │ F │ F │ D │ D │ F │ F │ W │ F │ X │ F │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 1 │ F │ H │ F │ F │ W │ F │ S │ F │ F │ S │ F │ W │ F │ F │ H │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 2 │ F │ * │ F │ J │ F │ F │ F │ E │ E │ F │ F │ F │ J │ F │ * │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 3 │ F │ F │ F │ F │ F │ P │ F │ F │ F │ F │ P │ F │ F │ F │ F │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 4 │ F │ F │ X │ F │ F │ F │ D │ T │ T │ D │ F │ F │ F │ X │ F │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 5 │ F │ F │ F │ F │ F │ P │ F │ F │ F │ F │ P │ F │ F │ F │ F │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 6 │ F │ * │ F │ J │ F │ F │ F │ E │ E │ F │ F │ F │ J │ F │ * │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 7 │ F │ H │ F │ F │ W │ F │ S │ F │ F │ S │ F │ W │ F │ F │ H │ F │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 8 │ F │ F │ X │ F │ W │ F │ F │ D │ D │ F │ F │ W │ F │ X │ F │ F │
   └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘

Spawn Points: P1 @ (160, 360) [row 4, col 2 area]
              P2 @ (1120, 360) [row 4, col 13 area]
```

### Vortex Core Design

The central "vortex" is created by:
1. **Damage hazards** at top-center (7,0), (8,0) and bottom-center (7,8), (8,8)
2. **Damage hazards** at mid-center (6,4), (9,4) creating the spiral arms
3. **EMP zones** at center (7,2), (8,2), (7,6), (8,6) disabling power-ups
4. **Timed traps** at dead center (7,4), (8,4) for maximum risk

This creates a visual "X" or spiral pattern that players must navigate around or through.

### Barrier Configuration

```typescript
barriers: [
  // Full walls creating structure (4 total)
  { id: 'wall_tl', type: 'full', position: { x: 320, y: 0 }, size: { x: 80, y: 160 } },
  { id: 'wall_tr', type: 'full', position: { x: 880, y: 0 }, size: { x: 80, y: 160 } },
  { id: 'wall_bl', type: 'full', position: { x: 320, y: 560 }, size: { x: 80, y: 160 } },
  { id: 'wall_br', type: 'full', position: { x: 880, y: 560 }, size: { x: 80, y: 160 } },

  // Half walls for spawn protection (4 total)
  { id: 'cover_l1', type: 'half', position: { x: 80, y: 80 }, size: { x: 80, y: 80 } },
  { id: 'cover_l2', type: 'half', position: { x: 80, y: 560 }, size: { x: 80, y: 80 } },
  { id: 'cover_r1', type: 'half', position: { x: 1120, y: 80 }, size: { x: 80, y: 80 } },
  { id: 'cover_r2', type: 'half', position: { x: 1120, y: 560 }, size: { x: 80, y: 80 } },

  // Destructible barriers for dynamic gameplay (4 total)
  { id: 'destruct_l1', type: 'destructible', position: { x: 80, y: 160 }, size: { x: 80, y: 80 }, health: 100 },
  { id: 'destruct_l2', type: 'destructible', position: { x: 80, y: 480 }, size: { x: 80, y: 80 }, health: 100 },
  { id: 'destruct_r1', type: 'destructible', position: { x: 1120, y: 160 }, size: { x: 80, y: 80 }, health: 100 },
  { id: 'destruct_r2', type: 'destructible', position: { x: 1120, y: 480 }, size: { x: 80, y: 80 }, health: 100 },
]
```

### Hazard Configuration

```typescript
hazards: [
  // Damage zones - Vortex arms (4 zones, 15 DPS)
  { id: 'dmg_top', type: 'damage', bounds: { x: 560, y: 0, width: 160, height: 80 }, intensity: 15 },
  { id: 'dmg_bot', type: 'damage', bounds: { x: 560, y: 640, width: 160, height: 80 }, intensity: 15 },
  { id: 'dmg_mid_l', type: 'damage', bounds: { x: 480, y: 320, width: 80, height: 80 }, intensity: 15 },
  { id: 'dmg_mid_r', type: 'damage', bounds: { x: 720, y: 320, width: 80, height: 80 }, intensity: 15 },

  // Slow fields - Approach control (4 zones, 0.5 speed)
  { id: 'slow_tl', type: 'slow', bounds: { x: 480, y: 80, width: 80, height: 80 }, intensity: 0.5 },
  { id: 'slow_tr', type: 'slow', bounds: { x: 720, y: 80, width: 80, height: 80 }, intensity: 0.5 },
  { id: 'slow_bl', type: 'slow', bounds: { x: 480, y: 560, width: 80, height: 80 }, intensity: 0.5 },
  { id: 'slow_br', type: 'slow', bounds: { x: 720, y: 560, width: 80, height: 80 }, intensity: 0.5 },

  // EMP zones - Power-up denial at center (2 zones)
  { id: 'emp_top', type: 'emp', bounds: { x: 560, y: 160, width: 160, height: 80 }, intensity: 1 },
  { id: 'emp_bot', type: 'emp', bounds: { x: 560, y: 480, width: 160, height: 80 }, intensity: 1 },
]
```

### Trap Configuration

```typescript
traps: [
  // Pressure traps - Chokepoint control (4 traps)
  { id: 'trap_tl', type: 'pressure', position: { x: 400, y: 240 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },
  { id: 'trap_tr', type: 'pressure', position: { x: 880, y: 240 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },
  { id: 'trap_bl', type: 'pressure', position: { x: 400, y: 480 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },
  { id: 'trap_br', type: 'pressure', position: { x: 880, y: 480 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },

  // Timed traps - Vortex center danger (2 traps)
  { id: 'trap_center_l', type: 'timed', position: { x: 560, y: 360 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 8, interval: 8 },
  { id: 'trap_center_r', type: 'timed', position: { x: 720, y: 360 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 8, interval: 8 },
]
```

### Teleporter Configuration

```typescript
teleporters: [
  // Pair A: Top corners - Quick lane swap
  { id: 'tp_a1', pairId: 'alpha', position: { x: 200, y: 40 }, radius: 30 },
  { id: 'tp_a2', pairId: 'alpha', position: { x: 1080, y: 40 }, radius: 30 },

  // Pair B: Mid flanks - Aggressive rotation
  { id: 'tp_b1', pairId: 'beta', position: { x: 200, y: 360 }, radius: 30 },
  { id: 'tp_b2', pairId: 'beta', position: { x: 1080, y: 360 }, radius: 30 },

  // Pair C: Bottom corners - Escape routes
  { id: 'tp_c1', pairId: 'gamma', position: { x: 200, y: 680 }, radius: 30 },
  { id: 'tp_c2', pairId: 'gamma', position: { x: 1080, y: 680 }, radius: 30 },
]
```

### Jump Pad Configuration

```typescript
jumpPads: [
  // Orbital rotation pads - Circle the vortex
  { id: 'jp_tl', position: { x: 280, y: 160 }, radius: 40, direction: 'SE', force: 400 },
  { id: 'jp_tr', position: { x: 1000, y: 160 }, radius: 40, direction: 'SW', force: 400 },
  { id: 'jp_bl', position: { x: 280, y: 560 }, radius: 40, direction: 'NE', force: 400 },
  { id: 'jp_br', position: { x: 1000, y: 560 }, radius: 40, direction: 'NW', force: 400 },

  // Center approach pads - Into the vortex
  { id: 'jp_ml', position: { x: 320, y: 360 }, radius: 40, direction: 'E', force: 400 },
  { id: 'jp_mr', position: { x: 960, y: 360 }, radius: 40, direction: 'W', force: 400 },
]
```

### Power-Up Spawn Configuration

```typescript
powerUpSpawns: [
  // Vortex core - High risk, high reward (2)
  { x: 640, y: 200 },   // Top center approach
  { x: 640, y: 520 },   // Bottom center approach

  // Orbital positions - Medium risk (4)
  { x: 400, y: 120 },   // Upper left orbital
  { x: 880, y: 120 },   // Upper right orbital
  { x: 400, y: 600 },   // Lower left orbital
  { x: 880, y: 600 },   // Lower right orbital

  // Spawn adjacent - Safe access (4)
  { x: 160, y: 200 },   // P1 upper safe
  { x: 160, y: 520 },   // P1 lower safe
  { x: 1120, y: 200 },  // P2 upper safe
  { x: 1120, y: 520 },  // P2 lower safe
]
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified. Redundant properties have been consolidated for efficiency.

### Property 1: Map Configuration Completeness

*For any* valid MapConfig interface, the VORTEX_ARENA export SHALL contain all required fields (metadata, tiles, barriers, hazards, traps, teleporters, jumpPads, spawnPoints, powerUpSpawns) with correct types.

**Validates: Requirements 1.1**

### Property 2: Spawn Point Equidistance

*For any* pair of spawn points in the map, the Euclidean distance from each spawn to the arena center (640, 360) SHALL be equal within 1 pixel tolerance.

**Validates: Requirements 2.3**

### Property 3: Spatial Safety - Hazard Clearance

*For any* spawn point, teleporter, or power-up spawn position, and *for any* hazard zone in the map, the position SHALL NOT be contained within the hazard zone bounds. Additionally, spawn points SHALL have minimum 160 pixels clearance from hazard boundaries.

**Validates: Requirements 2.4, 4.4, 6.5, 8.4**

### Property 4: Spatial Safety - Trap Clearance

*For any* spawn point or power-up spawn position, and *for any* trap in the map, the distance from the position to the trap center SHALL be greater than or equal to the trap radius plus the required clearance (80px for spawns, 40px for power-ups).

**Validates: Requirements 2.5, 8.5**

### Property 5: Barrier Non-Overlap

*For any* pair of barriers in the map, their bounding rectangles (position + size) SHALL NOT overlap.

**Validates: Requirements 3.5**

### Property 6: Horizontal Symmetry

*For any* positioned element (barrier, trap, teleporter, jump pad, power-up spawn) on the left half of the map (x < 640), there SHALL exist a corresponding mirrored element on the right half with position.x mirrored around x=640.

**Validates: Requirements 3.6, 5.6, 6.6, 7.6, 8.3**

### Property 7: Teleporter Pair Validity

*For any* teleporter in the map, there SHALL exist exactly one other teleporter with the same pairId, and the paired teleporters SHALL be positioned on opposite horizontal halves of the map (one with x < 640, one with x > 640).

**Validates: Requirements 6.2, 6.4**

### Property 8: Hazard Coverage Limit

*For any* map configuration, the total area covered by hazard zones SHALL NOT exceed 25% of the total walkable floor area (1280 × 720 × 0.25 = 230,400 square pixels).

**Validates: Requirements 4.5**

### Property 9: Power-Up Access Balance

*For any* player spawn point, the set of distances to all power-up spawns SHALL be equal to the mirrored player's set of distances (ensuring neither player has closer access to more power-ups).

**Validates: Requirements 8.6**

## Error Handling

### Map Validation Errors

The existing `validateMapConfig()` function handles:
- Invalid metadata (name length, version format)
- Incorrect tile grid dimensions
- Unpaired teleporters
- Spawn points not on floor tiles
- Overlapping barriers
- Invalid hazard intensity values
- Invalid trap cooldown values

### Runtime Errors

- **Invalid map load**: ArenaManager throws descriptive error if validation fails
- **Missing subsystem**: Each manager (Barrier, Hazard, Trap, Transport) initializes empty if no config provided

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required for comprehensive coverage.

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **VORTEX_ARENA exports correctly** - Import and verify object structure
2. **Validation passes** - Call validateMapConfig(VORTEX_ARENA) and assert valid
3. **Metadata values** - Check name, version, description length
4. **Tile grid dimensions** - Verify 9 rows × 16 columns
5. **Component counts** - Verify minimum barriers, hazards, traps, teleporters, jump pads
6. **ArenaManager loads** - Call loadMap(VORTEX_ARENA) without errors

### Property-Based Tests

Property-based tests use **fast-check** library to verify universal properties:

1. **Property 1**: Generate MapConfig variations, verify all fields present
2. **Property 2**: Calculate spawn distances, verify equality
3. **Property 3**: For all position/hazard pairs, verify no containment
4. **Property 4**: For all position/trap pairs, verify clearance
5. **Property 5**: For all barrier pairs, verify no overlap
6. **Property 6**: For all left-side elements, verify mirrored right-side element exists
7. **Property 7**: For all teleporters, verify pair exists on opposite side
8. **Property 8**: Calculate total hazard area, verify under 25%
9. **Property 9**: Calculate distance sets for both spawns, verify equality

### Test Configuration

- Property tests: minimum 100 iterations per property
- Test file location: `frontend/src/game/config/maps/__tests__/vortex-arena.test.ts`
- Each property test tagged with: `**Feature: vortex-arena-map, Property {N}: {description}**`
