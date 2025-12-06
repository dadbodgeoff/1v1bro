# AAA Arena Upgrade - Requirements Document

## Introduction

This document defines the comprehensive requirements for transforming the current basic arena into an enterprise-grade, AAA-quality competitive map system. The upgrade introduces advanced barrier systems, environmental hazards, dynamic traps, layered rendering architecture, and strategic mechanics that elevate the gameplay from a junior developer prototype to a polished, professional multiplayer arena.

The current arena implementation consists of a simple 4-barrier layout creating 3 lanes with basic collision detection. While functional, it lacks the depth, visual polish, and strategic complexity expected of a competitive multiplayer game. This upgrade addresses these deficiencies through a systematic, modular approach that maintains strict separation of concerns and follows enterprise architectural patterns established throughout the codebase.

All implementations adhere to the 400-line maximum per file constraint, ensuring maintainability and testability. The system integrates seamlessly with the existing combat system, backdrop layers, and game engine architecture.

## Glossary

- **Arena**: The playable game space (1280x720 pixels, 16x9 tiles at 80px each)
- **Tile**: A grid unit (80x80 pixels) used for map layout and collision detection
- **Tile Map**: A 2D array data structure defining the arena layout by tile type
- **Lane**: A primary movement path between spawn areas (top, mid, bottom)
- **Barrier**: A static obstacle that blocks player and projectile movement
- **Full Wall**: A barrier that completely blocks movement and projectiles
- **Half Cover**: A partial-height obstacle that blocks movement but allows projectiles to pass over
- **Destructible Barrier**: A barrier with a health pool that can be destroyed by projectile damage
- **One-Way Barrier**: A barrier that allows passage in one direction only
- **Hazard Zone**: An area that applies negative effects to players within it
- **Damage Zone**: A hazard that deals periodic damage to players inside
- **Slow Field**: A hazard that reduces player movement speed while inside
- **EMP Zone**: A hazard that disables active power-ups while inside
- **Trap**: An interactive element that triggers effects when activated
- **Pressure Trap**: A trap that activates when a player steps on it
- **Timed Trap**: A trap that activates on a fixed interval
- **Projectile Trap**: A trap that activates when hit by a projectile
- **Trap Chain**: A sequence where one trap activation triggers adjacent traps
- **Teleporter**: A pair of linked points that transport players instantly
- **Jump Pad**: A zone that launches players in a predetermined direction
- **Zone Manager**: System coordinating all interactive arena zones and player effects
- **Effect Stack**: Multiple zone effects applied to a single player simultaneously
- **Layer**: A rendering depth level for visual organization (background to UI)
- **Spatial Hash**: A data structure for efficient broad-phase collision detection
- **Collision Mask**: A bitmap defining collidable areas at pixel precision
- **Hub**: The central contested zone where power-ups spawn and players fight

---

## Current State Analysis

| Component | Current Implementation | Limitation |
|-----------|----------------------|------------|
| Arena Size | 1280x720 (16x9 tiles) | Fixed, no map variants |
| Barriers | 4 static rectangles | No variety, no interaction |
| Collision | Simple rectangle checks | No spatial optimization |
| Rendering | Single pass, no layers | No depth sorting, no effects |
| Hazards | None | No environmental strategy |
| Traps | None | No dynamic elements |
| Transport | None | Limited map traversal options |
| Configuration | Hardcoded arrays | No map loading system |

### Problems to Solve

1. **Limited Strategic Depth**: Only barriers exist; no hazards, traps, or interactive elements
2. **No Visual Layering**: All elements render at same depth with no post-processing
3. **Hardcoded Layout**: Map cannot be changed without code modifications
4. **No Environmental Interaction**: Players cannot interact with the arena beyond collision
5. **Performance Concerns**: No spatial optimization for collision detection
6. **No Effect System**: No way to apply status effects from arena elements
7. **Monotonous Gameplay**: Every match plays identically with no dynamic elements

---

## Requirements

### Requirement 1: Tile-Based Map System

**User Story:** As a developer, I want a robust tile-based map system, so that arena layouts can be defined declaratively and rendered efficiently without code changes.

#### Acceptance Criteria

1. THE Map_System SHALL define arena layouts using a 16x9 tile grid where each tile is 80x80 pixels
2. WHEN loading a map THEN the Map_System SHALL parse tile definitions from a TypeScript configuration object
3. THE Map_System SHALL support the following tile types: floor, wall, half_wall, hazard_damage, hazard_slow, hazard_emp, trap_pressure, trap_timed, teleporter_a, teleporter_b, jump_pad_n, jump_pad_s, jump_pad_e, jump_pad_w
4. WHEN rendering tiles THEN the Map_System SHALL batch draw calls by tile type to minimize context switches
5. THE Map_System SHALL expose a getTileAt(gridX, gridY) method returning the tile type at any grid coordinate
6. THE Map_System SHALL expose a getTileAtPixel(pixelX, pixelY) method converting pixel coordinates to tile lookups
7. WHEN a tile type changes at runtime THEN the Map_System SHALL invalidate and rebuild affected collision and rendering caches within the same frame
8. THE Map_System SHALL validate map configurations at load time and throw descriptive errors for invalid configurations
9. WHEN a map is loaded THEN the Map_System SHALL emit a 'map_loaded' event with map metadata for other systems to initialize

---

### Requirement 2: Advanced Barrier System

**User Story:** As a player, I want varied barrier types with different properties, so that the arena offers strategic depth and tactical decision-making.

#### Acceptance Criteria

1. THE Barrier_System SHALL support full-height wall barriers that block all player movement and all projectile travel
2. THE Barrier_System SHALL support half-height cover barriers that block player movement but allow projectiles to pass over them
3. THE Barrier_System SHALL support destructible barriers with configurable health pools (default: 100 HP, min: 50 HP, max: 200 HP)
4. WHEN a destructible barrier takes damage THEN the Barrier_System SHALL update its visual state through three stages: intact (100-67% HP), cracked (66-34% HP), damaged (33-1% HP), destroyed (0 HP)
5. WHEN a destructible barrier reaches 0 HP THEN the Barrier_System SHALL remove it from collision detection within 0.1 seconds and play a destruction particle effect
6. THE Barrier_System SHALL support one-way barriers that allow player passage in one configured direction (N, S, E, W) while blocking passage from other directions
7. WHEN a player approaches a one-way barrier from the blocked side THEN the Barrier_System SHALL treat it as a solid wall for collision
8. WHEN a player approaches a one-way barrier from the allowed side THEN the Barrier_System SHALL allow passage with a visual "phase through" effect
9. WHEN rendering barriers THEN the Barrier_System SHALL apply appropriate textures based on barrier type and current damage state
10. THE Barrier_System SHALL expose a getBarrierAt(position) method returning barrier data or null for collision queries
11. WHEN a barrier is destroyed THEN the Barrier_System SHALL emit a 'barrier_destroyed' event with barrier ID and position for other systems

---

### Requirement 3: Hazard Zone System

**User Story:** As a player, I want environmental hazards on the map, so that positioning becomes more strategic and I must consider terrain when fighting.

#### Acceptance Criteria

1. THE Hazard_System SHALL support damage zones that deal periodic damage to players inside (default: 10 HP per second, configurable: 5-25 HP/s)
2. THE Hazard_System SHALL support slow fields that reduce player movement speed while inside (default: 50% reduction, configurable: 25-75%)
3. THE Hazard_System SHALL support EMP zones that disable all active power-up effects while the player remains inside
4. WHEN a player enters a hazard zone THEN the Hazard_System SHALL apply the zone effect within 0.05 seconds (one physics frame)
5. WHEN a player exits a hazard zone THEN the Hazard_System SHALL remove the zone effect within 0.1 seconds
6. WHEN a player is inside a damage zone THEN the Hazard_System SHALL apply damage in 0.25 second intervals (4 ticks per second)
7. WHEN multiple hazard effects of the same type overlap THEN the Hazard_System SHALL apply only the strongest effect (no stacking same-type)
8. WHEN multiple hazard effects of different types overlap THEN the Hazard_System SHALL apply all effects simultaneously
9. THE Hazard_System SHALL render visual indicators for each hazard type: damage zones with red pulsing borders, slow fields with blue swirling particles, EMP zones with yellow static interference
10. WHEN a hazard zone is active THEN the Hazard_System SHALL emit warning particles at zone boundaries visible from 100 pixels away
11. THE Hazard_System SHALL expose an isInHazard(playerId, hazardType) method for other systems to query player hazard state
12. WHEN a player takes hazard damage THEN the Hazard_System SHALL emit a 'hazard_damage' event distinct from combat damage for UI feedback

---

### Requirement 4: Trap System

**User Story:** As a player, I want interactive traps that add dynamic elements to combat, so that matches feel varied and I can use the environment tactically.

#### Acceptance Criteria

1. THE Trap_System SHALL support pressure plate traps that activate when any player steps on them (trigger radius: 40 pixels)
2. THE Trap_System SHALL support timed traps that activate on a fixed interval (configurable: 5-30 seconds, default: 15 seconds)
3. THE Trap_System SHALL support projectile-triggered traps that activate when hit by any projectile
4. WHEN a trap activates THEN the Trap_System SHALL execute its configured effect within 0.1 seconds of trigger
5. THE Trap_System SHALL support the following trap effects: damage_burst (50 HP instant damage in 80px radius), knockback (200 unit impulse away from trap center), stun (0.5 second movement disable)
6. WHEN a trap activates THEN the Trap_System SHALL enter cooldown state (default: 10 seconds, configurable: 5-30 seconds)
7. THE Trap_System SHALL render trap states with distinct visuals: armed (glowing pulse animation), triggered (bright flash for 0.2 seconds), cooldown (dim with progress indicator)
8. WHEN a trap is in cooldown THEN the Trap_System SHALL display remaining cooldown time as a circular progress indicator
9. THE Trap_System SHALL support trap chains where one trap activation triggers all adjacent traps (within 160 pixels) after a 0.3 second delay
10. WHEN a trap chain activates THEN the Trap_System SHALL process triggers in order of distance from the initial trap
11. THE Trap_System SHALL expose a getTrapState(trapId) method returning armed/triggered/cooldown status
12. WHEN a trap activates THEN the Trap_System SHALL emit a 'trap_triggered' event with trap ID, effect type, and affected player IDs

---

### Requirement 5: Teleporter System

**User Story:** As a player, I want teleporters for quick map traversal, so that I can outmaneuver my opponent and create strategic plays.

#### Acceptance Criteria

1. THE Teleporter_System SHALL support paired teleporter pads identified by matching pair IDs (A↔A, B↔B, etc.)
2. WHEN a player enters a teleporter pad (within 30 pixel radius of center) THEN the Teleporter_System SHALL transport them to the linked pad within 0.1 seconds
3. WHEN teleporting THEN the Teleporter_System SHALL preserve player velocity direction but reset magnitude to zero
4. WHEN teleporting THEN the Teleporter_System SHALL apply a brief invulnerability window of 0.5 seconds to prevent spawn camping
5. THE Teleporter_System SHALL enforce a per-player cooldown of 3 seconds to prevent teleporter spam
6. WHEN a teleporter is on cooldown for a specific player THEN the Teleporter_System SHALL render it with reduced opacity (50%) for that player only
7. THE Teleporter_System SHALL render entry particle effects (swirling vortex) at the departure pad and exit particle effects (expanding rings) at the arrival pad
8. WHEN a projectile enters a teleporter THEN the Teleporter_System SHALL NOT transport the projectile (projectiles pass through)
9. THE Teleporter_System SHALL support up to 4 teleporter pairs per map (8 total pads)
10. WHEN a player teleports THEN the Teleporter_System SHALL emit a 'player_teleported' event with player ID, source pad, and destination pad

---

### Requirement 6: Jump Pad System

**User Story:** As a player, I want jump pads for dynamic movement options, so that combat has more dimensions and I can make exciting plays.

#### Acceptance Criteria

1. THE Jump_Pad_System SHALL launch players in a configured direction when they step on the pad (trigger radius: 40 pixels)
2. WHEN a player is launched THEN the Jump_Pad_System SHALL apply a velocity impulse of 400 units/second in the configured direction
3. WHEN a player is mid-launch THEN the Jump_Pad_System SHALL disable player movement input for 0.4 seconds (launch duration)
4. WHEN a player is mid-launch THEN the Jump_Pad_System SHALL allow the player to fire projectiles but not change direction
5. THE Jump_Pad_System SHALL render a trajectory preview arc when a player is within 100 pixels of a jump pad
6. WHEN a player lands from a launch THEN the Jump_Pad_System SHALL apply a brief landing recovery of 0.2 seconds (reduced movement speed by 50%)
7. THE Jump_Pad_System SHALL support 8 directional configurations: N, S, E, W, NE, NW, SE, SW
8. WHEN rendering a jump pad THEN the Jump_Pad_System SHALL animate directional arrows pulsing in the launch direction
9. THE Jump_Pad_System SHALL enforce a 1 second cooldown per player to prevent rapid re-triggering
10. WHEN a player is launched THEN the Jump_Pad_System SHALL emit a 'player_launched' event with player ID, direction, and landing position estimate

---

### Requirement 7: Layered Rendering Architecture

**User Story:** As a developer, I want a proper layered rendering system, so that visual elements display at correct depths and post-processing effects can be applied per layer.

#### Acceptance Criteria

1. THE Render_System SHALL define exactly 7 render layers in this order: BACKGROUND (0), FLOOR (1), HAZARDS (2), BARRIERS (3), ENTITIES (4), EFFECTS (5), UI (6)
2. WHEN rendering a frame THEN the Render_System SHALL draw layers in strict ascending order (0 through 6)
3. THE Render_System SHALL support sub-layer ordering within each major layer using a secondary sort key (0-99)
4. WHEN an entity moves THEN the Render_System SHALL update its sub-layer order based on Y-position (higher Y = rendered later = appears in front)
5. THE Render_System SHALL support layer-specific post-processing: HAZARDS layer gets 20% opacity blend, EFFECTS layer gets additive blending
6. WHEN rendering hazard zones THEN the Render_System SHALL apply transparency (alpha: 0.6) and screen blend mode
7. THE Render_System SHALL batch render calls within each layer, grouping by texture to minimize draw calls
8. THE Render_System SHALL expose a registerRenderable(layer, subLayer, renderCallback) method for systems to register their render functions
9. WHEN a renderable is registered THEN the Render_System SHALL maintain sorted render order without re-sorting every frame
10. THE Render_System SHALL provide layer visibility toggles for debugging (setLayerVisible(layer, visible))

---

### Requirement 8: Zone Effect Manager

**User Story:** As a developer, I want a centralized zone effect system, so that player status effects from arena elements are managed consistently and don't conflict.

#### Acceptance Criteria

1. THE Zone_Manager SHALL maintain an effect registry tracking all active effects on each player by effect source ID
2. WHEN a player enters a zone THEN the Zone_Manager SHALL add the effect to the player's effect stack with the zone ID as the source
3. WHEN a player exits a zone THEN the Zone_Manager SHALL remove only the effect from that specific zone (not other effects of the same type)
4. THE Zone_Manager SHALL calculate combined effect values: speed_multiplier (multiplicative), damage_per_second (additive), power_ups_disabled (boolean OR)
5. WHEN querying player status THEN the Zone_Manager SHALL return an aggregated EffectState object with all computed values
6. THE Zone_Manager SHALL emit events: 'effect_added', 'effect_removed', 'effect_modified' with player ID and effect details
7. WHEN rendering player status THEN the Zone_Manager SHALL provide a list of active effect icons for the UI to display
8. THE Zone_Manager SHALL expose a getActiveEffects(playerId) method returning an array of {effectType, sourceId, value} objects
9. THE Zone_Manager SHALL automatically clean up effects when their source zone is destroyed or disabled
10. WHEN a player dies THEN the Zone_Manager SHALL clear all effects for that player immediately

---

### Requirement 9: Map Configuration System

**User Story:** As a developer, I want maps defined in configuration files, so that new maps can be added without code changes and map data is validated at load time.

#### Acceptance Criteria

1. THE Config_System SHALL define maps using TypeScript configuration objects with full type safety
2. THE Config_System SHALL validate map configurations against a MapSchema type at compile time and runtime
3. WHEN a map configuration is invalid THEN the Config_System SHALL throw a descriptive error listing all validation failures
4. THE Config_System SHALL require map metadata: name (string, 3-50 chars), author (string), version (semver string), description (string, max 200 chars)
5. THE Config_System SHALL support multiple map definitions exported from a maps index file
6. WHEN loading a map THEN the Config_System SHALL initialize all arena systems (barriers, hazards, traps, teleporters, jump pads) with map-specific parameters
7. THE Config_System SHALL validate spatial constraints: no overlapping barriers, teleporter pairs must both exist, spawn points must be on floor tiles
8. THE Config_System SHALL provide a validateMap(config) function that returns {valid: boolean, errors: string[]}
9. WHEN a map passes validation THEN the Config_System SHALL generate optimized lookup structures (tile grid, spatial hash) for runtime queries

---

### Requirement 10: Collision System Upgrade

**User Story:** As a developer, I want an upgraded collision system, so that all new barrier and zone types are handled correctly with optimal performance.

#### Acceptance Criteria

1. THE Collision_System SHALL support circle-rectangle collision for standard barriers (existing functionality, maintained)
2. THE Collision_System SHALL support circle-polygon collision for irregular barrier shapes (new capability)
3. THE Collision_System SHALL support point-in-polygon tests for zone containment checks
4. WHEN checking projectile collision THEN the Collision_System SHALL use swept collision (raycast) for projectiles moving faster than 400 units/second to prevent tunneling
5. THE Collision_System SHALL maintain a spatial hash grid with 80x80 pixel cells for broad-phase collision detection
6. WHEN a barrier is destroyed THEN the Collision_System SHALL update the spatial hash within the same frame
7. THE Collision_System SHALL support collision layers with a configurable interaction matrix: PLAYER collides with BARRIER and ZONE, PROJECTILE collides with BARRIER only
8. THE Collision_System SHALL expose a queryRadius(position, radius, layers) method returning all collidables within radius on specified layers
9. THE Collision_System SHALL expose a raycast(start, end, layers) method returning the first collision point and collidable hit
10. WHEN performing collision checks THEN the Collision_System SHALL first query the spatial hash (broad phase) then perform precise checks (narrow phase)

---

### Requirement 11: Visual Feedback System

**User Story:** As a player, I want clear visual feedback for all arena elements, so that I understand the game state at a glance and can react appropriately.

#### Acceptance Criteria

1. WHEN a player enters a damage zone THEN the Visual_System SHALL apply a red vignette effect to the screen edges (intensity: 20%)
2. WHEN a player enters a slow field THEN the Visual_System SHALL apply a blue tint overlay to the player sprite (intensity: 30%)
3. WHEN a player enters an EMP zone THEN the Visual_System SHALL apply a static/interference effect to the player sprite (flickering at 10Hz)
4. WHEN a trap is within 2 seconds of activating (timed traps) THEN the Visual_System SHALL display pulsing warning indicators
5. WHEN a teleporter is available THEN the Visual_System SHALL render swirling particle effects (8 particles orbiting at 2 rotations/second)
6. WHEN a destructible barrier takes damage THEN the Visual_System SHALL spawn 5-10 debris particles flying outward from impact point
7. THE Visual_System SHALL render zone boundaries with animated dashed lines (dash length: 10px, gap: 5px, animation speed: 50px/second)
8. WHEN a player is affected by multiple zone effects THEN the Visual_System SHALL display stacked status icons above the health bar
9. WHEN a jump pad trajectory preview is shown THEN the Visual_System SHALL render a dotted arc with landing zone indicator
10. THE Visual_System SHALL support effect intensity scaling based on effect strength (stronger slow = more intense blue tint)

---

### Requirement 12: Performance Optimization

**User Story:** As a player, I want smooth 60fps gameplay, so that combat feels responsive and the game runs well on mid-range hardware.

#### Acceptance Criteria

1. THE Arena_System SHALL maintain 60fps (16.67ms frame budget) with all systems active on hardware with integrated graphics (Intel UHD 620 or equivalent)
2. WHEN rendering zones THEN the Arena_System SHALL use pre-rendered canvas patterns cached at map load time
3. THE Arena_System SHALL implement object pooling for: particles (pool size: 500), projectiles (pool size: 50), damage numbers (pool size: 20)
4. WHEN updating collision THEN the Arena_System SHALL use spatial hash queries limiting checks to nearby cells only
5. THE Arena_System SHALL profile frame time and log warnings to console when frame time exceeds 20ms for 3 consecutive frames
6. WHEN particle count exceeds 500 THEN the Arena_System SHALL cull oldest particles to maintain the limit
7. THE Arena_System SHALL batch texture draw calls, targeting fewer than 50 draw calls per frame for arena elements
8. WHEN a zone effect is applied THEN the Arena_System SHALL cache the computed effect values until the effect changes
9. THE Arena_System SHALL use requestAnimationFrame for the render loop and separate fixed-timestep updates for physics (60Hz)
10. WHEN the browser tab loses focus THEN the Arena_System SHALL pause non-essential animations to reduce CPU usage

---

## Proposed Map Layout: "Nexus Arena"

```
Grid: 16 columns x 9 rows (1280x720 at 80px/tile)

Legend: 
  .  = floor (passable)
  #  = full wall (blocks all)
  ~  = half cover (blocks movement, not projectiles)
  X  = damage zone (10 HP/sec)
  S  = slow field (50% speed reduction)
  E  = EMP zone (disables power-ups)
  T1 = teleporter pair 1 (top corners)
  T2 = teleporter pair 2 (bottom corners)
  J→ = jump pad (direction indicated)
  P  = pressure trap
  *  = power-up spawn point
  1  = player 1 spawn
  2  = player 2 spawn
  H  = hub center

     0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
   ┌────────────────────────────────────────────────────────────────┐
 0 │  .  T1  .   .   #   .   .   *   .   .   #   .   .  T1   .   .  │
 1 │  .   .   .   .   #   .   *   .   *   .   #   .   .   .   .   .  │
 2 │  .   1   .   ~   ~   .   .   .   .   .   ~   ~   .   2   .   .  │
 3 │  .   .   .   .   .   S   .   P   .   S   .   .   .   .   .   .  │
 4 │ J→   .   .   .   .   .   *   H   *   .   .   .   .   .   . ←J  │
 5 │  .   .   .   .   .   S   .   P   .   S   .   .   .   .   .   .  │
 6 │  .   .   .   ~   ~   .   .   .   .   .   ~   ~   .   .   .   .  │
 7 │  .   .   .   .   #   .   *   .   *   .   #   .   .   .   .   .  │
 8 │  .  T2   .   .   #   .   .   *   .   .   #   .   .  T2   .   .  │
   └────────────────────────────────────────────────────────────────┘

Element Summary:
- 4 Full Walls: (4,0-1), (10,0-1), (4,7-8), (10,7-8) - creating lane structure
- 8 Half Covers: (3-4,2), (10-11,2), (3-4,6), (10-11,6) - flanking spawn areas  
- 4 Slow Fields: (5,3), (9,3), (5,5), (9,5) - controlling mid approaches
- 2 Pressure Traps: (7,3), (7,5) - guarding hub approaches
- 2 Teleporter Pairs: T1 at (1,0)↔(13,0), T2 at (1,8)↔(13,8)
- 2 Jump Pads: (0,4) launches East, (15,4) launches West
- 8 Power-up Spawns: distributed around hub and lanes
- Hub Center: (7,4) - main contest point
```

---

## System Architecture

```
frontend/src/game/
├── arena/                          # Arena orchestration
│   ├── ArenaManager.ts             # Main coordinator (<400 lines)
│   ├── TileMap.ts                  # Tile data structure (<200 lines)
│   ├── MapLoader.ts                # Config parsing (<150 lines)
│   └── index.ts                    # Exports
│
├── barriers/                       # Barrier systems
│   ├── BarrierManager.ts           # Barrier lifecycle (<300 lines)
│   ├── BarrierTypes.ts             # Type definitions (<100 lines)
│   ├── DestructibleBarrier.ts      # Destructible logic (<200 lines)
│   ├── OneWayBarrier.ts            # One-way logic (<150 lines)
│   └── index.ts
│
├── hazards/                        # Hazard systems
│   ├── HazardManager.ts            # Hazard coordination (<250 lines)
│   ├── DamageZone.ts               # Damage implementation (<150 lines)
│   ├── SlowField.ts                # Slow implementation (<150 lines)
│   ├── EMPZone.ts                  # EMP implementation (<150 lines)
│   └── index.ts
│
├── traps/                          # Trap systems
│   ├── TrapManager.ts              # Trap coordination (<300 lines)
│   ├── PressureTrap.ts             # Pressure plate (<200 lines)
│   ├── TimedTrap.ts                # Interval trap (<200 lines)
│   ├── ProjectileTrap.ts           # Projectile trigger (<200 lines)
│   ├── TrapEffects.ts              # Effect implementations (<250 lines)
│   └── index.ts
│
├── transport/                      # Transport systems
│   ├── TransportManager.ts         # Transport coordination (<200 lines)
│   ├── Teleporter.ts               # Teleporter logic (<250 lines)
│   ├── JumpPad.ts                  # Jump pad logic (<250 lines)
│   └── index.ts
│
├── zones/                          # Zone effect management
│   ├── ZoneManager.ts              # Effect coordination (<300 lines)
│   ├── EffectStack.ts              # Player effects (<200 lines)
│   ├── ZoneTypes.ts                # Type definitions (<100 lines)
│   └── index.ts
│
├── rendering/                      # Layered rendering
│   ├── LayerManager.ts             # Layer orchestration (<250 lines)
│   ├── RenderLayer.ts              # Layer implementation (<200 lines)
│   ├── LayerEffects.ts             # Post-processing (<200 lines)
│   └── index.ts
│
├── collision/                      # Upgraded collision
│   ├── SpatialHash.ts              # Spatial partitioning (<250 lines)
│   ├── CollisionLayers.ts          # Layer definitions (<100 lines)
│   └── index.ts
│
└── config/
    └── maps/                       # Map configurations
        ├── nexus-arena.ts          # Default map (<200 lines)
        ├── map-schema.ts           # Validation (<150 lines)
        └── index.ts
```

---

## Integration Points

### With Existing Systems

| System | Integration |
|--------|-------------|
| GameEngine | ArenaManager registered as subsystem, updated in game loop |
| CombatSystem | Projectiles query collision system, traps can deal damage |
| BackdropSystem | Renders on BACKGROUND layer, arena on FLOOR+ layers |
| CollisionSystem | Extended with spatial hash, new collision types |
| PowerUpRenderer | Renders on ENTITIES layer with Y-sorting |
| PlayerRenderer | Receives effect state for visual modifications |

### Event Flow

```
Player enters zone → ZoneManager.addEffect() → EffectStack updated
                  → Visual_System notified → Player tint applied
                  → UI updated with status icon

Trap triggered → TrapManager.trigger() → Effect applied to nearby players
             → Visual_System.playEffect() → Particles spawned
             → Sound system notified (future)

Barrier destroyed → BarrierManager.destroy() → CollisionSystem.update()
                 → Visual_System.playEffect() → Debris particles
                 → SpatialHash rebuilt
```

---

## Out of Scope (Future Phases)

These features are explicitly NOT part of this upgrade:

- Moving/rotating barriers (dynamic obstacles)
- Weather effects (rain, fog affecting visibility)
- Day/night cycle with lighting changes
- AI-controlled hazards or enemies
- Map editor tool for custom maps
- Loading maps from external JSON files
- Multiplayer map voting/selection
- Asymmetric map layouts
- Vertical gameplay (multiple floors)
- Water/lava with swimming mechanics

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60fps sustained | Performance profiler |
| Frame Budget | <16ms average | Console timing logs |
| Draw Calls | <50 per frame | Render profiler |
| Code Quality | <400 lines/file | Static analysis |
| Test Coverage | >80% on arena systems | Jest coverage report |
| Strategic Usage | Players use 3+ arena features per match | Analytics (future) |
| Visual Clarity | Players understand effects in <3 matches | User testing |

---

## Dependencies

### Required Before Implementation

1. Existing combat system functional (projectile collision)
2. Existing backdrop system complete (layer 0 rendering)
3. Existing player renderer functional (for effect overlays)

### External Dependencies

- None (all implementations use native Canvas API)

---

*Document Version: 1.0*
*Created: December 2024*
*Author: Arena Systems Team*
