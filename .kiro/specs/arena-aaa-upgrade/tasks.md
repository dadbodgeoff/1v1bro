# AAA Arena Upgrade - Implementation Plan

## Overview

This implementation plan follows a **layered approach** building from foundational systems to integrated features:

1. Core data structures and types
2. Individual system managers (barriers, hazards, traps, transport)
3. Coordination systems (zone manager, spatial hash, layer manager)
4. Arena manager integration
5. GameEngine integration
6. Polish and optimization

**Key Principles:**
- Each file stays under 400 lines
- Test each system in isolation before integration
- Property-based tests validate correctness properties from design
- Build incrementally with checkpoints

**Estimated Time:** 3-4 weeks
**Total New Files:** ~30 files
**Lines of Code:** ~6,000 lines

---

## Phase 1: Core Types and Configuration

### Task 1: Create Arena Type Definitions
- [x] 1.1 Create `frontend/src/game/arena/types.ts`
  - Define TileType union type with all tile variants
  - Define TileData, TileMap interfaces
  - Define BarrierType, BarrierConfig, BarrierState interfaces
  - Define HazardType, HazardConfig, HazardState interfaces
  - Define TrapType, TrapEffect, TrapConfig, TrapState interfaces
  - Define TeleporterConfig, TeleporterState interfaces
  - Define JumpDirection, JumpPadConfig, JumpPadState interfaces
  - Define ZoneEffect, EffectState interfaces
  - Define RenderLayer enum (0-6)
  - Define Renderable interface
  - _Requirements: 1.3, 2.1-2.6, 3.1-3.3, 4.1-4.5, 5.1, 6.1, 7.1, 8.1_

- [ ] 1.2 Write property test for type definitions
  - **Property 1: Tile Map Consistency**
  - Verify TileType union covers all expected types
  - **Validates: Requirements 1.3**

### Task 2: Create Map Schema and Validation
- [x] 2.1 Create `frontend/src/game/config/maps/map-schema.ts`
  - Define MapConfig interface with all required fields
  - Define MapMetadata interface with validation constraints
  - Define TileDefinition interface
  - Define SpawnPointConfig interface
  - Implement validateMapConfig() function
  - Implement rectanglesOverlap() helper
  - Implement teleporter pair validation
  - Implement spawn point floor tile validation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7_

- [ ] 2.2 Write property test for map validation
  - **Property 10: Map Configuration Validation**
  - Generate invalid configs (overlapping barriers, unpaired teleporters)
  - Verify validation catches all violations
  - **Validates: Requirements 9.2, 9.3, 9.7**

### Task 3: Create Default Map Configuration
- [x] 3.1 Create `frontend/src/game/config/maps/nexus-arena.ts`
  - Define tile type shortcuts (F, W, H, S, P, T, J)
  - Define 16x9 tile grid for Nexus Arena
  - Define barrier configurations (4 walls, 8 half covers)
  - Define hazard configurations (4 slow fields)
  - Define trap configurations (2 pressure traps)
  - Define teleporter configurations (4 pads, 2 pairs)
  - Define jump pad configurations (2 pads)
  - Define spawn points and power-up spawns
  - _Requirements: 9.5, 9.6_

- [x] 3.2 Create `frontend/src/game/config/maps/index.ts`
  - Export map schema types
  - Export NEXUS_ARENA configuration
  - Export validateMapConfig function
  - _Requirements: 9.5_

---

## Phase 2: Tile Map System

### Task 4: Implement TileMap
- [x] 4.1 Create `frontend/src/game/arena/TileMap.ts`
  - Implement TileMap class with width, height, tileSize properties
  - Implement load(tiles: TileDefinition[][]) method
  - Implement getTileAt(gridX, gridY) method
  - Implement getTileAtPixel(pixelX, pixelY) method
  - Implement setTile(gridX, gridY, type) method
  - Implement cache invalidation on tile change
  - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7_

- [ ] 4.2 Write property tests for TileMap
  - **Property 1: Tile Map Consistency**
  - For any loaded config, getTileAt returns correct type
  - getTileAtPixel correctly converts coordinates
  - **Validates: Requirements 1.2, 1.5, 1.6**

### Task 5: Implement MapLoader
- [x] 5.1 Create `frontend/src/game/arena/MapLoader.ts`
  - Implement MapLoader class
  - Implement validate(config) static method
  - Implement load(config) method returning initialized systems
  - Implement event emission for 'map_loaded'
  - _Requirements: 1.2, 1.8, 1.9_

- [x] 5.2 Create `frontend/src/game/arena/index.ts`
  - Export TileMap class
  - Export MapLoader class
  - Export arena types
  - _Requirements: 1.1_

---

## Phase 3: Barrier System

### Task 6: Implement Barrier Types
- [x] 6.1 Create `frontend/src/game/barriers/BarrierTypes.ts`
  - Define barrier type constants
  - Define damage state thresholds (intact: 100-67%, cracked: 66-34%, damaged: 33-1%)
  - Define collision behavior per barrier type
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 6.2 Create `frontend/src/game/barriers/DestructibleBarrier.ts`
  - Implement DestructibleBarrier class
  - Implement applyDamage(amount) method returning {health, damageState, destroyed}
  - Implement getDamageState() based on health percentage
  - Implement isDestroyed() check
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 6.3 Write property test for destructible barriers
  - **Property 3: Destructible Barrier Health Progression**
  - Verify damage decreases health
  - Verify damage state transitions at correct thresholds
  - Verify destroyed state at 0 HP
  - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 6.4 Create `frontend/src/game/barriers/OneWayBarrier.ts`
  - Implement OneWayBarrier class with direction
  - Implement shouldBlock(position) based on approach direction
  - Implement getPassDirection() method
  - _Requirements: 2.6, 2.7, 2.8_

- [ ] 6.5 Write property test for one-way barriers
  - **Property 2: Barrier Collision Integrity (one-way variant)**
  - Verify blocking from wrong direction
  - Verify passage from correct direction
  - **Validates: Requirements 2.6, 2.7**

### Task 7: Implement BarrierManager
- [x] 7.1 Create `frontend/src/game/barriers/BarrierManager.ts`
  - Implement BarrierManager class
  - Implement initialize(configs) method
  - Implement setCallbacks(callbacks) method
  - Implement checkCollision(position, radius, nearbyIds) method
  - Implement resolveCollision(position, radius, nearbyIds) method
  - Implement applyDamage(barrierId, damage) method
  - Implement getActiveBarriers() method
  - Implement getBarrierAt(position) method
  - Implement render(ctx) method
  - Implement renderBarrier() with type-specific visuals
  - Implement renderCracks() for damaged barriers
  - Implement circleRectCollision() helper
  - Implement pushOutOfRect() helper
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.9, 2.10, 2.11_

- [ ] 7.2 Write property test for barrier collision
  - **Property 2: Barrier Collision Integrity**
  - For any position inside barrier bounds, collision returns true
  - For any position outside barrier bounds, collision returns false
  - **Validates: Requirements 2.1, 10.1**

- [x] 7.3 Create `frontend/src/game/barriers/index.ts`
  - Export BarrierManager
  - Export DestructibleBarrier
  - Export OneWayBarrier
  - Export BarrierTypes
  - _Requirements: 2.1_

---

## Phase 4: Hazard System

### Task 8: Implement Hazard Zone Types
- [x] 8.1 Create `frontend/src/game/hazards/DamageZone.ts`
  - Implement DamageZone class
  - Implement getDamagePerTick() method (intensity / 4)
  - Implement getTickInterval() returning 250ms
  - _Requirements: 3.1, 3.6_

- [x] 8.2 Create `frontend/src/game/hazards/SlowField.ts`
  - Implement SlowField class
  - Implement getSpeedMultiplier() method
  - _Requirements: 3.2_

- [x] 8.3 Create `frontend/src/game/hazards/EMPZone.ts`
  - Implement EMPZone class
  - Implement isPowerUpDisabled() returning true
  - _Requirements: 3.3_

### Task 9: Implement HazardManager
- [x] 9.1 Create `frontend/src/game/hazards/HazardManager.ts`
  - Implement HazardManager class
  - Implement initialize(configs) method
  - Implement setCallbacks(callbacks) method
  - Implement update(deltaTime, players) method
  - Implement applyDamageTick() with 250ms interval
  - Implement getHazardsAtPosition(position) method
  - Implement render(ctx) method
  - Implement renderHazard() with type-specific colors
  - Implement renderWarningParticles() for zone edges
  - Implement isPointInBounds() helper
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 3.10_

- [ ] 9.2 Write property test for hazard zone effects
  - **Property 4: Hazard Zone Entry/Exit**
  - Verify effect applied on entry
  - Verify effect removed on exit
  - Verify damage tick timing
  - **Validates: Requirements 3.4, 3.5, 3.6**

- [ ] 9.3 Write property test for hazard stacking
  - **Property 5: Effect Stack Aggregation (hazard variant)**
  - Verify same-type hazards use strongest only
  - Verify different-type hazards stack
  - **Validates: Requirements 3.7, 3.8**

- [x] 9.4 Create `frontend/src/game/hazards/index.ts`
  - Export HazardManager
  - Export DamageZone, SlowField, EMPZone
  - _Requirements: 3.1_

---

## Phase 5: Trap System

### Task 10: Implement Trap Types
- [x] 10.1 Create `frontend/src/game/traps/PressureTrap.ts`
  - Implement PressureTrap class
  - Implement checkTrigger(playerPositions) method
  - _Requirements: 4.1_

- [x] 10.2 Create `frontend/src/game/traps/TimedTrap.ts`
  - Implement TimedTrap class with interval
  - Implement shouldTrigger(currentTime) method
  - Implement getNextTriggerTime() method
  - _Requirements: 4.2_

- [x] 10.3 Create `frontend/src/game/traps/ProjectileTrap.ts`
  - Implement ProjectileTrap class
  - Implement checkProjectileHit(position) method
  - _Requirements: 4.3_

- [x] 10.4 Create `frontend/src/game/traps/TrapEffects.ts`
  - Implement TrapEffects class
  - Implement apply(effect, value, playerId, position) method
  - Implement applyDamageBurst() with radius
  - Implement applyKnockback() with direction from trap
  - Implement applyStun() with duration
  - Implement getAndClearResults() method
  - _Requirements: 4.4, 4.5_

### Task 11: Implement TrapManager
- [x] 11.1 Create `frontend/src/game/traps/TrapManager.ts`
  - Implement TrapManager class
  - Implement initialize(configs) method
  - Implement setCallbacks(callbacks) method
  - Implement update(deltaTime, players) method
  - Implement onProjectileHit(position) method
  - Implement triggerTrap(trap, affectedPlayers) method
  - Implement getTrapEffectResults() method
  - Implement render(ctx) method
  - Implement renderTrap() with state-based visuals
  - Implement cooldown progress indicator
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 11.2 Write property test for trap state machine
  - **Property 6: Trap State Machine**
  - Verify state transitions: armed → triggered → cooldown → armed
  - Verify no state skipping
  - **Validates: Requirements 4.5, 4.6**

- [x] 11.3 Create `frontend/src/game/traps/index.ts`
  - Export TrapManager
  - Export PressureTrap, TimedTrap, ProjectileTrap
  - Export TrapEffects
  - _Requirements: 4.1_

---

## Phase 6: Checkpoint - Core Systems
- [ ] 12. Ensure all tests pass, ask the user if questions arise.
  - Verify TileMap loads and queries correctly
  - Verify BarrierManager collision detection works
  - Verify HazardManager applies effects correctly
  - Verify TrapManager state transitions work
  - All property tests pass

---

## Phase 7: Transport System

### Task 13: Implement Teleporter
- [x] 13.1 Create `frontend/src/game/transport/Teleporter.ts`
  - Implement Teleporter class
  - Implement linkTo(otherTeleporter) method
  - Implement canTeleport(playerId) checking cooldown
  - Implement teleport(playerId) returning destination
  - Implement applyCooldown(playerId) method
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 13.2 Write property test for teleporter pairs
  - **Property 7: Teleporter Pair Symmetry**
  - Verify A→B then B→A returns to original position
  - Verify cooldown prevents immediate re-teleport
  - **Validates: Requirements 5.1, 5.2, 5.5**

### Task 14: Implement JumpPad
- [x] 14.1 Create `frontend/src/game/transport/JumpPad.ts`
  - Implement JumpPad class with direction and force
  - Implement canLaunch(playerId) checking cooldown
  - Implement launch(playerId) returning velocity vector
  - Implement directionToVelocity() helper
  - Implement applyCooldown(playerId) method
  - _Requirements: 6.1, 6.2, 6.7, 6.9_

- [ ] 14.2 Write property test for jump pad launch
  - Verify launch velocity matches configured direction and force
  - Verify cooldown prevents immediate re-launch
  - **Validates: Requirements 6.1, 6.2**

### Task 15: Implement TransportManager
- [x] 15.1 Create `frontend/src/game/transport/TransportManager.ts`
  - Implement TransportManager class
  - Implement initialize(teleporterConfigs, jumpPadConfigs) method
  - Implement setCallbacks(callbacks) method
  - Implement update(deltaTime) for cooldown cleanup
  - Implement checkTeleport(playerId, position) method
  - Implement checkJumpPad(playerId, position) method
  - Implement isTeleporterOnCooldown(teleporterId, playerId) method
  - Implement render(ctx) method
  - Implement renderTeleporter() with swirling vortex
  - Implement renderJumpPad() with directional arrow
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.4, 6.8_

- [x] 15.2 Create `frontend/src/game/transport/index.ts`
  - Export TransportManager
  - Export Teleporter
  - Export JumpPad
  - _Requirements: 5.1, 6.1_

---

## Phase 8: Zone Effect Management

### Task 16: Implement EffectStack
- [x] 16.1 Create `frontend/src/game/zones/EffectStack.ts`
  - Implement EffectStack class
  - Implement addEffect(effect) returning isNew boolean
  - Implement removeEffect(sourceId) returning success
  - Implement getSourceIds() method
  - Implement getEffects() method
  - Implement hasEffectType(type) method
  - Implement clear() method
  - Implement getAggregatedState() with correct aggregation logic
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 16.2 Write property test for effect aggregation
  - **Property 5: Effect Stack Aggregation**
  - Verify speed multipliers are multiplicative
  - Verify damage is additive
  - Verify power-up disable is boolean OR
  - **Validates: Requirements 8.4, 8.5**

### Task 17: Implement ZoneManager
- [x] 17.1 Create `frontend/src/game/zones/ZoneManager.ts`
  - Implement ZoneManager class
  - Implement setCallbacks(callbacks) method
  - Implement addEffect(playerId, effect) method
  - Implement removeEffect(playerId, sourceId) method
  - Implement cleanupStaleEffects(playerId, activeSourceIds) method
  - Implement getEffectState(playerId) method
  - Implement getActiveEffects(playerId) method
  - Implement clearPlayerEffects(playerId) method
  - Implement hasEffect(playerId, effectType) method
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

- [x] 17.2 Create `frontend/src/game/zones/ZoneTypes.ts`
  - Define zone effect type constants
  - Define effect aggregation rules
  - _Requirements: 8.1_

- [x] 17.3 Create `frontend/src/game/zones/index.ts`
  - Export ZoneManager
  - Export EffectStack
  - Export ZoneTypes
  - _Requirements: 8.1_

---

## Phase 9: Collision System Upgrade

### Task 18: Implement SpatialHash
- [x] 18.1 Create `frontend/src/game/collision/SpatialHash.ts`
  - Implement SpatialHash class with cellSize, gridWidth, gridHeight
  - Implement insert(id, position, size) method
  - Implement remove(id) method
  - Implement update(id, position, size) method
  - Implement query(position, radius) method
  - Implement clear() method
  - Implement getCellsForRect() helper
  - _Requirements: 10.5, 10.6_

- [ ] 18.2 Write property test for spatial hash queries
  - **Property 8: Spatial Hash Query Completeness**
  - For any query, all intersecting objects are returned
  - No false negatives in query results
  - **Validates: Requirements 10.5, 10.8**

- [x] 18.3 Create `frontend/src/game/collision/CollisionLayers.ts`
  - Define collision layer constants (PLAYER, PROJECTILE, ZONE)
  - Define collision interaction matrix
  - Implement shouldCollide(layerA, layerB) method
  - _Requirements: 10.7_

- [x] 18.4 Create `frontend/src/game/collision/index.ts`
  - Export SpatialHash
  - Export CollisionLayers
  - _Requirements: 10.1_

---

## Phase 10: Layered Rendering

### Task 19: Implement RenderLayer
- [x] 19.1 Create `frontend/src/game/rendering/RenderLayer.ts`
  - Implement RenderLayer class with layer enum
  - Implement register(subLayer, renderFn) returning id
  - Implement unregister(id) method
  - Implement updateSubLayer(id, subLayer) method
  - Implement setVisible(visible) method
  - Implement render(ctx) method with sorted sub-layers
  - _Requirements: 7.2, 7.3, 7.4_

### Task 20: Implement LayerManager
- [x] 20.1 Create `frontend/src/game/rendering/LayerManager.ts`
  - Implement LayerManager class
  - Initialize all 7 layers in constructor
  - Implement register(layer, subLayer, renderFn) method
  - Implement unregister(layer, id) method
  - Implement updateSubLayer(layer, id, subLayer) method
  - Implement setLayerVisible(layer, visible) method
  - Implement render(ctx) method iterating layers 0-6
  - _Requirements: 7.1, 7.2, 7.3, 7.10_

- [ ] 20.2 Write property test for render layer ordering
  - **Property 9: Render Layer Ordering**
  - Verify layers render in ascending order (0-6)
  - Verify sub-layers render in ascending order within layer
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 20.3 Create `frontend/src/game/rendering/LayerEffects.ts`
  - Implement layer-specific post-processing
  - Implement hazard layer transparency (alpha: 0.6)
  - Implement effects layer additive blending
  - _Requirements: 7.5, 7.6_

- [x] 20.4 Create `frontend/src/game/rendering/index.ts`
  - Export LayerManager
  - Export RenderLayer
  - Export LayerEffects
  - _Requirements: 7.1_

---

## Phase 11: Checkpoint - Support Systems
- [ ] 21. Ensure all tests pass, ask the user if questions arise.
  - Verify TransportManager teleport and launch work
  - Verify ZoneManager effect aggregation is correct
  - Verify SpatialHash queries are complete
  - Verify LayerManager renders in correct order
  - All property tests pass

---

## Phase 12: Arena Manager Integration

### Task 22: Implement ArenaManager
- [x] 22.1 Create `frontend/src/game/arena/ArenaManager.ts`
  - Implement ArenaManager class
  - Initialize all subsystems in constructor
  - Implement loadMap(config) method
  - Implement setCallbacks(callbacks) method
  - Implement update(deltaTime, players) method
  - Implement updatePlayerZoneEffects() helper
  - Implement getPlayerEffects(playerId) method
  - Implement checkBarrierCollision(position, radius) method
  - Implement resolveCollision(position, radius) method
  - Implement damageBarrier(barrierId, damage) method
  - Implement checkTeleport(playerId, position) method
  - Implement checkJumpPad(playerId, position) method
  - Implement render(ctx) method
  - Implement rebuildSpatialHash() helper
  - Implement registerRenderers() helper
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.6, 10.1_

- [x] 22.2 Update `frontend/src/game/arena/index.ts`
  - Export ArenaManager
  - Export all arena types
  - _Requirements: 1.1_

---

## Phase 13: GameEngine Integration

### Task 23: Integrate Arena with GameEngine
- [x] 23.1 Update `frontend/src/game/GameEngine.ts`
  - Import ArenaManager
  - Add arenaManager property
  - Initialize ArenaManager in constructor
  - Implement loadMap(mapConfig) method
  - Wire arena callbacks to combat effects
  - Update updateLocalPlayer() to use arena collision
  - Update updateLocalPlayer() to apply speed modifiers
  - Update updateLocalPlayer() to check teleport/jump pad
  - Update update() to call arenaManager.update()
  - Update render() to call arenaManager.render()
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 23.2 Update collision resolution in GameEngine
  - Replace direct BARRIERS reference with arenaManager.resolveCollision()
  - Add spatial hash query for nearby barriers
  - _Requirements: 10.1, 10.4_

- [x] 23.3 Update combat integration
  - Wire trap damage to combat system
  - Wire hazard damage to combat system
  - Add barrier damage from projectiles
  - _Requirements: 2.3, 3.1, 4.4_

---

## Phase 14: Visual Feedback Integration

### Task 24: Implement Arena Visual Effects
- [ ] 24.1 Update `frontend/src/game/renderers/CombatEffectsRenderer.ts`
  - Add addDestructionEffect(position) method
  - Add addTeleportEffect(from, to) method
  - Add addLaunchEffect(position, direction) method
  - Add addTrapTriggerEffect(position, effect) method
  - _Requirements: 11.4, 11.5, 11.6_

- [ ] 24.2 Implement player effect overlays
  - Add screen edge vignette for damage zones
  - Add blue tint for slow field
  - Add static effect for EMP zone
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 24.3 Implement status effect icons
  - Add effect icon rendering above health bar
  - Stack multiple effect icons
  - _Requirements: 11.8_

---

## Phase 15: Checkpoint - Full Integration
- [ ] 25. Ensure all tests pass, ask the user if questions arise.
  - Verify map loads and renders correctly
  - Verify player collision with all barrier types
  - Verify hazard effects apply and remove correctly
  - Verify traps trigger and apply effects
  - Verify teleporters and jump pads work
  - Verify visual effects display correctly
  - All property tests pass

---

## Phase 16: Performance Optimization

### Task 26: Implement Object Pooling
- [ ] 26.1 Create `frontend/src/game/utils/ObjectPool.ts`
  - Implement generic ObjectPool<T> class
  - Implement acquire() method
  - Implement release(obj) method
  - Implement clear() method
  - _Requirements: 12.3_

- [ ] 26.2 Apply pooling to particle systems
  - Pool particles in hazard renderers
  - Pool particles in trap effects
  - Pool particles in transport effects
  - Limit pool size to 500 particles
  - _Requirements: 12.3, 12.6_

### Task 27: Implement Render Batching
- [ ] 27.1 Update barrier rendering for batching
  - Group barriers by type before rendering
  - Minimize context state changes
  - _Requirements: 1.4, 12.7_

- [ ] 27.2 Update hazard rendering for batching
  - Cache hazard zone patterns
  - Reuse patterns across frames
  - _Requirements: 12.2_

### Task 28: Add Performance Monitoring
- [ ] 28.1 Add frame time logging
  - Log warning when frame time exceeds 20ms
  - Track consecutive slow frames
  - _Requirements: 12.5_

- [ ] 28.2 Add draw call counting (debug mode)
  - Count draw calls per frame
  - Log warning when exceeding 50 calls
  - _Requirements: 12.7_

---

## Phase 17: Final Checkpoint
- [ ] 29. Ensure all tests pass, ask the user if questions arise.
  - Verify 60fps performance with all systems active
  - Verify all property tests pass
  - Verify no console errors or warnings
  - Build passes without errors
  - All acceptance criteria met

---

## Quick Reference

### File Size Targets

| File | Target Lines |
|------|--------------|
| ArenaManager.ts | <400 |
| BarrierManager.ts | <300 |
| HazardManager.ts | <250 |
| TrapManager.ts | <300 |
| TransportManager.ts | <300 |
| ZoneManager.ts | <200 |
| SpatialHash.ts | <200 |
| LayerManager.ts | <200 |
| Individual type files | <150 |

### Property Test Summary

| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Tile Map Consistency | test_tilemap.ts | 1.2, 1.5 |
| 2. Barrier Collision Integrity | test_barriers.ts | 2.1, 10.1 |
| 3. Destructible Barrier Health | test_barriers.ts | 2.3, 2.4, 2.5 |
| 4. Hazard Zone Entry/Exit | test_hazards.ts | 3.4, 3.5 |
| 5. Effect Stack Aggregation | test_zones.ts | 8.4, 8.5 |
| 6. Trap State Machine | test_traps.ts | 4.5, 4.6 |
| 7. Teleporter Pair Symmetry | test_transport.ts | 5.1, 5.2 |
| 8. Spatial Hash Query | test_collision.ts | 10.5, 10.8 |
| 9. Render Layer Ordering | test_rendering.ts | 7.1, 7.2, 7.3 |
| 10. Map Config Validation | test_maploader.ts | 9.2, 9.3, 9.7 |

### Render Layer Order

| Layer | Enum Value | Contents |
|-------|------------|----------|
| BACKGROUND | 0 | Backdrop system (already implemented) |
| FLOOR | 1 | Tile textures |
| HAZARDS | 2 | Hazard zones with transparency |
| BARRIERS | 3 | Walls, covers, destructibles |
| ENTITIES | 4 | Players, traps, teleporters, power-ups |
| EFFECTS | 5 | Particles, hit markers, damage numbers |
| UI | 6 | Health bars, status icons, HUD |

---

*Total Tasks: 29 (with sub-tasks)*
*Estimated Time: 3-4 weeks*
*Property Tests: 10*
