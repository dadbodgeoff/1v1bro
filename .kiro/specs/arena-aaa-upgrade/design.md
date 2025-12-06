# AAA Arena Upgrade - Design Document

## Overview

This document outlines the technical design for transforming the basic arena into an enterprise-grade, AAA-quality competitive map system. The implementation introduces advanced barrier systems, environmental hazards, dynamic traps, layered rendering, and strategic mechanics while maintaining strict separation of concerns.

The design follows established patterns from the existing codebase:
- **Manager Pattern**: Each system has a dedicated manager class (like CombatSystem)
- **Renderer Pattern**: Visual components extend BaseRenderer (like ProjectileRenderer)
- **Configuration Pattern**: Settings defined in config files (like combat.ts)
- **Type Safety**: Full TypeScript interfaces for all data structures

All files remain under 400 lines through careful decomposition into focused, single-responsibility modules.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Arena System                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Barrier   │  │   Hazard    │  │    Trap     │  │  Transport  │            │
│  │   Manager   │  │   Manager   │  │   Manager   │  │   Manager   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                │                │                │                    │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐            │
│  │                        ArenaManager                             │            │
│  │  (Coordinates all arena systems, interfaces with GameEngine)    │            │
│  └────────────────────────────────────────────────────────────────┘            │
│                                    │                                            │
│         ┌──────────────────────────┼──────────────────────────┐                │
│         │                          │                          │                │
│         ▼                          ▼                          ▼                │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐          │
│  │    Zone     │           │   Spatial   │           │   Layer     │          │
│  │   Manager   │           │    Hash     │           │   Manager   │          │
│  └─────────────┘           └─────────────┘           └─────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│         Rendering Pipeline           │   │           Game Integration          │
│  ┌───────────┐  ┌───────────┐       │   │  ┌───────────┐  ┌───────────┐      │
│  │  Barrier  │  │  Hazard   │       │   │  │  Combat   │  │  Player   │      │
│  │ Renderer  │  │ Renderer  │       │   │  │  System   │  │  Movement │      │
│  └───────────┘  └───────────┘       │   │  └───────────┘  └───────────┘      │
│  ┌───────────┐  ┌───────────┐       │   │  ┌───────────┐  ┌───────────┐      │
│  │   Trap    │  │ Transport │       │   │  │  Power-Up │  │   Input   │      │
│  │ Renderer  │  │ Renderer  │       │   │  │  System   │  │  System   │      │
│  └───────────┘  └───────────┘       │   │  └───────────┘  └───────────┘      │
└─────────────────────────────────────┘   └─────────────────────────────────────┘
```



## Project Structure (New Files)

```
frontend/src/game/
├── arena/
│   ├── index.ts                    # Arena module exports
│   ├── ArenaManager.ts             # Main arena coordinator
│   ├── TileMap.ts                  # Tile-based map data structure
│   └── MapLoader.ts                # Map configuration parser
│
├── barriers/
│   ├── index.ts                    # Barrier module exports
│   ├── BarrierManager.ts           # Barrier lifecycle management
│   ├── BarrierTypes.ts             # Barrier type definitions
│   ├── DestructibleBarrier.ts      # Destructible barrier logic
│   └── OneWayBarrier.ts            # One-way barrier logic
│
├── hazards/
│   ├── index.ts                    # Hazard module exports
│   ├── HazardManager.ts            # Hazard zone coordination
│   ├── DamageZone.ts               # Damage zone implementation
│   ├── SlowField.ts                # Slow field implementation
│   └── EMPZone.ts                  # EMP zone implementation
│
├── traps/
│   ├── index.ts                    # Trap module exports
│   ├── TrapManager.ts              # Trap coordination
│   ├── PressureTrap.ts             # Pressure plate implementation
│   ├── TimedTrap.ts                # Timed trap implementation
│   ├── ProjectileTrap.ts           # Projectile-triggered trap
│   └── TrapEffects.ts              # Trap effect implementations
│
├── transport/
│   ├── index.ts                    # Transport module exports
│   ├── TransportManager.ts         # Transport coordination
│   ├── Teleporter.ts               # Teleporter pair logic
│   └── JumpPad.ts                  # Jump pad logic
│
├── zones/
│   ├── index.ts                    # Zone module exports
│   ├── ZoneManager.ts              # Zone effect coordination
│   ├── EffectStack.ts              # Player effect management
│   └── ZoneTypes.ts                # Zone type definitions
│
├── collision/
│   ├── index.ts                    # Collision module exports
│   ├── SpatialHash.ts              # Spatial partitioning
│   └── CollisionLayers.ts          # Collision layer definitions
│
├── rendering/
│   ├── index.ts                    # Rendering module exports
│   ├── LayerManager.ts             # Render layer orchestration
│   ├── RenderLayer.ts              # Individual layer implementation
│   └── LayerEffects.ts             # Post-processing effects
│
├── renderers/
│   ├── HazardRenderer.ts           # Hazard zone rendering
│   ├── TrapRenderer.ts             # Trap rendering
│   └── TransportRenderer.ts        # Teleporter/jump pad rendering
│
└── config/
    └── maps/
        ├── index.ts                # Map exports
        ├── map-schema.ts           # Map validation schema
        └── nexus-arena.ts          # Default AAA map config
```

## Data Structures

### Core Types (arena/types.ts)

```typescript
// Tile system types
export type TileType = 
  | 'floor' 
  | 'wall' 
  | 'half_wall'
  | 'hazard_damage'
  | 'hazard_slow'
  | 'hazard_emp'
  | 'trap_pressure'
  | 'trap_timed'
  | 'teleporter'
  | 'jump_pad'

export interface TileData {
  type: TileType
  gridX: number
  gridY: number
  pixelX: number
  pixelY: number
  metadata?: Record<string, unknown>
}

export interface TileMap {
  width: number      // Grid width (16)
  height: number     // Grid height (9)
  tileSize: number   // Pixels per tile (80)
  tiles: TileData[][]
}

// Barrier types
export type BarrierType = 'full' | 'half' | 'destructible' | 'one_way'

export interface BarrierConfig {
  id: string
  type: BarrierType
  position: Vector2
  size: Vector2
  health?: number           // For destructible
  direction?: Direction     // For one-way (N, S, E, W)
}

export interface BarrierState {
  id: string
  type: BarrierType
  position: Vector2
  size: Vector2
  health: number
  maxHealth: number
  damageState: 'intact' | 'cracked' | 'damaged' | 'destroyed'
  isActive: boolean
}

// Hazard types
export type HazardType = 'damage' | 'slow' | 'emp'

export interface HazardConfig {
  id: string
  type: HazardType
  bounds: Rectangle
  intensity: number         // Damage per sec, speed multiplier, etc.
}

export interface HazardState {
  id: string
  type: HazardType
  bounds: Rectangle
  intensity: number
  isActive: boolean
  playersInside: Set<string>
}

// Trap types
export type TrapType = 'pressure' | 'timed' | 'projectile'
export type TrapEffect = 'damage_burst' | 'knockback' | 'stun'

export interface TrapConfig {
  id: string
  type: TrapType
  position: Vector2
  radius: number
  effect: TrapEffect
  effectValue: number       // Damage amount, knockback force, stun duration
  cooldown: number          // Seconds
  interval?: number         // For timed traps
  chainRadius?: number      // For trap chains
}

export interface TrapState {
  id: string
  type: TrapType
  position: Vector2
  radius: number
  effect: TrapEffect
  effectValue: number
  cooldown: number
  cooldownRemaining: number
  state: 'armed' | 'triggered' | 'cooldown'
  lastTriggerTime: number
}

// Transport types
export interface TeleporterConfig {
  id: string
  pairId: string            // Matching pair identifier
  position: Vector2
  radius: number
}

export interface TeleporterState {
  id: string
  pairId: string
  position: Vector2
  radius: number
  linkedTeleporter: string | null
  playerCooldowns: Map<string, number>
}

export type JumpDirection = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW'

export interface JumpPadConfig {
  id: string
  position: Vector2
  radius: number
  direction: JumpDirection
  force: number             // Launch velocity
}

export interface JumpPadState {
  id: string
  position: Vector2
  radius: number
  direction: JumpDirection
  force: number
  playerCooldowns: Map<string, number>
}

// Zone effect types
export interface ZoneEffect {
  sourceId: string
  type: 'speed_modifier' | 'damage_over_time' | 'power_up_disable'
  value: number
  startTime: number
}

export interface EffectState {
  speedMultiplier: number   // 1.0 = normal, 0.5 = 50% speed
  damagePerSecond: number   // Total DOT from all sources
  powerUpsDisabled: boolean
  activeEffects: ZoneEffect[]
}

// Render layer types
export enum RenderLayer {
  BACKGROUND = 0,
  FLOOR = 1,
  HAZARDS = 2,
  BARRIERS = 3,
  ENTITIES = 4,
  EFFECTS = 5,
  UI = 6
}

export interface Renderable {
  layer: RenderLayer
  subLayer: number          // 0-99 for Y-sorting within layer
  render: (ctx: CanvasRenderingContext2D) => void
}
```



### Map Configuration (config/maps/map-schema.ts)

```typescript
export interface MapConfig {
  metadata: MapMetadata
  tiles: TileDefinition[][]
  barriers: BarrierConfig[]
  hazards: HazardConfig[]
  traps: TrapConfig[]
  teleporters: TeleporterConfig[]
  jumpPads: JumpPadConfig[]
  spawnPoints: SpawnPointConfig[]
  powerUpSpawns: Vector2[]
}

export interface MapMetadata {
  name: string              // 3-50 characters
  author: string
  version: string           // Semver format
  description: string       // Max 200 characters
  thumbnail?: string        // Optional preview image path
}

export interface TileDefinition {
  type: TileType
  metadata?: Record<string, unknown>
}

export interface SpawnPointConfig {
  id: 'player1' | 'player2'
  position: Vector2
}

// Validation function
export function validateMapConfig(config: MapConfig): ValidationResult {
  const errors: string[] = []
  
  // Validate metadata
  if (config.metadata.name.length < 3 || config.metadata.name.length > 50) {
    errors.push('Map name must be 3-50 characters')
  }
  
  // Validate tile grid dimensions
  if (config.tiles.length !== 9) {
    errors.push('Tile grid must have 9 rows')
  }
  if (config.tiles[0]?.length !== 16) {
    errors.push('Tile grid must have 16 columns')
  }
  
  // Validate teleporter pairs
  const teleporterPairs = new Map<string, number>()
  for (const tp of config.teleporters) {
    teleporterPairs.set(tp.pairId, (teleporterPairs.get(tp.pairId) || 0) + 1)
  }
  for (const [pairId, count] of teleporterPairs) {
    if (count !== 2) {
      errors.push(`Teleporter pair ${pairId} must have exactly 2 pads, found ${count}`)
    }
  }
  
  // Validate spawn points on floor tiles
  for (const spawn of config.spawnPoints) {
    const gridX = Math.floor(spawn.position.x / 80)
    const gridY = Math.floor(spawn.position.y / 80)
    const tile = config.tiles[gridY]?.[gridX]
    if (tile?.type !== 'floor') {
      errors.push(`Spawn point ${spawn.id} must be on a floor tile`)
    }
  }
  
  // Validate no overlapping barriers
  for (let i = 0; i < config.barriers.length; i++) {
    for (let j = i + 1; j < config.barriers.length; j++) {
      if (rectanglesOverlap(config.barriers[i], config.barriers[j])) {
        errors.push(`Barriers ${config.barriers[i].id} and ${config.barriers[j].id} overlap`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

### Arena Configuration (config/maps/nexus-arena.ts)

```typescript
import type { MapConfig } from './map-schema'

export const NEXUS_ARENA: MapConfig = {
  metadata: {
    name: 'Nexus Arena',
    author: 'Arena Systems Team',
    version: '1.0.0',
    description: 'The default competitive arena with teleporters, jump pads, and hazard zones.'
  },
  
  tiles: [
    // Row 0: Top lane with teleporters
    [F, T, F, F, W, F, F, F, F, F, W, F, F, T, F, F],
    // Row 1: Upper area
    [F, F, F, F, W, F, F, F, F, F, W, F, F, F, F, F],
    // Row 2: Player spawns with half cover
    [F, F, F, H, H, F, F, F, F, F, H, H, F, F, F, F],
    // Row 3: Slow fields and pressure trap
    [F, F, F, F, F, S, F, P, F, S, F, F, F, F, F, F],
    // Row 4: Mid lane with jump pads
    [J, F, F, F, F, F, F, F, F, F, F, F, F, F, F, J],
    // Row 5: Slow fields and pressure trap
    [F, F, F, F, F, S, F, P, F, S, F, F, F, F, F, F],
    // Row 6: Lower half cover
    [F, F, F, H, H, F, F, F, F, F, H, H, F, F, F, F],
    // Row 7: Lower area
    [F, F, F, F, W, F, F, F, F, F, W, F, F, F, F, F],
    // Row 8: Bottom lane with teleporters
    [F, T, F, F, W, F, F, F, F, F, W, F, F, T, F, F],
  ],
  
  barriers: [
    // Full walls creating lane structure
    { id: 'wall_tl', type: 'full', position: { x: 320, y: 0 }, size: { x: 80, y: 160 } },
    { id: 'wall_tr', type: 'full', position: { x: 800, y: 0 }, size: { x: 80, y: 160 } },
    { id: 'wall_bl', type: 'full', position: { x: 320, y: 560 }, size: { x: 80, y: 160 } },
    { id: 'wall_br', type: 'full', position: { x: 800, y: 560 }, size: { x: 80, y: 160 } },
    
    // Half covers near spawns
    { id: 'cover_l1', type: 'half', position: { x: 240, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_l2', type: 'half', position: { x: 320, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_r1', type: 'half', position: { x: 800, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_r2', type: 'half', position: { x: 880, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_l3', type: 'half', position: { x: 240, y: 480 }, size: { x: 80, y: 80 } },
    { id: 'cover_l4', type: 'half', position: { x: 320, y: 480 }, size: { x: 80, y: 80 } },
    { id: 'cover_r3', type: 'half', position: { x: 800, y: 480 }, size: { x: 80, y: 80 } },
    { id: 'cover_r4', type: 'half', position: { x: 880, y: 480 }, size: { x: 80, y: 80 } },
  ],
  
  hazards: [
    // Slow fields flanking mid approaches
    { id: 'slow_tl', type: 'slow', bounds: { x: 400, y: 240, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_tr', type: 'slow', bounds: { x: 720, y: 240, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_bl', type: 'slow', bounds: { x: 400, y: 400, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_br', type: 'slow', bounds: { x: 720, y: 400, width: 80, height: 80 }, intensity: 0.5 },
  ],
  
  traps: [
    // Pressure traps guarding hub
    { 
      id: 'trap_top', 
      type: 'pressure', 
      position: { x: 560, y: 280 }, 
      radius: 40,
      effect: 'damage_burst',
      effectValue: 50,
      cooldown: 10
    },
    { 
      id: 'trap_bot', 
      type: 'pressure', 
      position: { x: 560, y: 440 }, 
      radius: 40,
      effect: 'damage_burst',
      effectValue: 50,
      cooldown: 10
    },
  ],
  
  teleporters: [
    // Top teleporter pair
    { id: 'tp_tl', pairId: 'top', position: { x: 80, y: 40 }, radius: 30 },
    { id: 'tp_tr', pairId: 'top', position: { x: 1040, y: 40 }, radius: 30 },
    // Bottom teleporter pair
    { id: 'tp_bl', pairId: 'bottom', position: { x: 80, y: 680 }, radius: 30 },
    { id: 'tp_br', pairId: 'bottom', position: { x: 1040, y: 680 }, radius: 30 },
  ],
  
  jumpPads: [
    // Side jump pads launching toward center
    { id: 'jp_left', position: { x: 40, y: 360 }, radius: 40, direction: 'E', force: 400 },
    { id: 'jp_right', position: { x: 1240, y: 360 }, radius: 40, direction: 'W', force: 400 },
  ],
  
  spawnPoints: [
    { id: 'player1', position: { x: 160, y: 360 } },
    { id: 'player2', position: { x: 1120, y: 360 } },
  ],
  
  powerUpSpawns: [
    { x: 640, y: 40 },    // Top center
    { x: 640, y: 680 },   // Bottom center
    { x: 480, y: 120 },   // Upper left
    { x: 800, y: 120 },   // Upper right
    { x: 480, y: 360 },   // Mid left (hub)
    { x: 800, y: 360 },   // Mid right (hub)
    { x: 480, y: 600 },   // Lower left
    { x: 800, y: 600 },   // Lower right
  ]
}

// Tile type shortcuts for readability
const F: TileDefinition = { type: 'floor' }
const W: TileDefinition = { type: 'wall' }
const H: TileDefinition = { type: 'half_wall' }
const S: TileDefinition = { type: 'hazard_slow' }
const P: TileDefinition = { type: 'trap_pressure' }
const T: TileDefinition = { type: 'teleporter' }
const J: TileDefinition = { type: 'jump_pad' }
```



## Core Components

### ArenaManager (arena/ArenaManager.ts)

```typescript
/**
 * ArenaManager - Main coordinator for all arena systems
 * Single responsibility: orchestrate subsystems and provide unified interface
 */

import { TileMap } from './TileMap'
import { MapLoader } from './MapLoader'
import { BarrierManager } from '../barriers'
import { HazardManager } from '../hazards'
import { TrapManager } from '../traps'
import { TransportManager } from '../transport'
import { ZoneManager } from '../zones'
import { SpatialHash } from '../collision'
import { LayerManager } from '../rendering'
import type { MapConfig, Vector2, EffectState } from '../types'

export interface ArenaCallbacks {
  onBarrierDestroyed?: (barrierId: string, position: Vector2) => void
  onTrapTriggered?: (trapId: string, affectedPlayers: string[]) => void
  onPlayerTeleported?: (playerId: string, from: Vector2, to: Vector2) => void
  onPlayerLaunched?: (playerId: string, direction: Vector2) => void
  onHazardDamage?: (playerId: string, damage: number, sourceId: string) => void
}

export class ArenaManager {
  // Subsystems
  private tileMap: TileMap
  private barrierManager: BarrierManager
  private hazardManager: HazardManager
  private trapManager: TrapManager
  private transportManager: TransportManager
  private zoneManager: ZoneManager
  private spatialHash: SpatialHash
  private layerManager: LayerManager
  
  // State
  private mapConfig: MapConfig | null = null
  private isInitialized = false
  private callbacks: ArenaCallbacks = {}
  
  constructor() {
    this.tileMap = new TileMap()
    this.barrierManager = new BarrierManager()
    this.hazardManager = new HazardManager()
    this.trapManager = new TrapManager()
    this.transportManager = new TransportManager()
    this.zoneManager = new ZoneManager()
    this.spatialHash = new SpatialHash(80, 16, 9) // 80px cells, 16x9 grid
    this.layerManager = new LayerManager()
  }
  
  /**
   * Load and initialize a map configuration
   */
  loadMap(config: MapConfig): void {
    // Validate configuration
    const validation = MapLoader.validate(config)
    if (!validation.valid) {
      throw new Error(`Invalid map config: ${validation.errors.join(', ')}`)
    }
    
    this.mapConfig = config
    
    // Initialize tile map
    this.tileMap.load(config.tiles)
    
    // Initialize barriers
    this.barrierManager.initialize(config.barriers)
    this.barrierManager.setCallbacks({
      onDestroyed: (id, pos) => {
        this.spatialHash.remove(id)
        this.callbacks.onBarrierDestroyed?.(id, pos)
      }
    })
    
    // Initialize hazards
    this.hazardManager.initialize(config.hazards)
    this.hazardManager.setCallbacks({
      onDamage: (playerId, damage, sourceId) => {
        this.callbacks.onHazardDamage?.(playerId, damage, sourceId)
      }
    })
    
    // Initialize traps
    this.trapManager.initialize(config.traps)
    this.trapManager.setCallbacks({
      onTriggered: (id, players) => {
        this.callbacks.onTrapTriggered?.(id, players)
      }
    })
    
    // Initialize transport
    this.transportManager.initialize(config.teleporters, config.jumpPads)
    this.transportManager.setCallbacks({
      onTeleport: (playerId, from, to) => {
        this.callbacks.onPlayerTeleported?.(playerId, from, to)
      },
      onLaunch: (playerId, dir) => {
        this.callbacks.onPlayerLaunched?.(playerId, dir)
      }
    })
    
    // Build spatial hash
    this.rebuildSpatialHash()
    
    // Register renderers with layer manager
    this.registerRenderers()
    
    this.isInitialized = true
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: ArenaCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Main update loop - call every frame
   */
  update(deltaTime: number, players: Map<string, Vector2>): void {
    if (!this.isInitialized) return
    
    // Update hazard effects on players
    this.hazardManager.update(deltaTime, players)
    
    // Update trap states and check triggers
    this.trapManager.update(deltaTime, players)
    
    // Update transport cooldowns
    this.transportManager.update(deltaTime)
    
    // Update zone effects
    for (const [playerId, position] of players) {
      this.updatePlayerZoneEffects(playerId, position)
    }
  }
  
  /**
   * Update zone effects for a single player
   */
  private updatePlayerZoneEffects(playerId: string, position: Vector2): void {
    // Check hazard zones
    const hazards = this.hazardManager.getHazardsAtPosition(position)
    for (const hazard of hazards) {
      this.zoneManager.addEffect(playerId, {
        sourceId: hazard.id,
        type: this.hazardTypeToEffectType(hazard.type),
        value: hazard.intensity,
        startTime: Date.now()
      })
    }
    
    // Remove effects from zones player has left
    this.zoneManager.cleanupStaleEffects(playerId, hazards.map(h => h.id))
  }
  
  /**
   * Get aggregated effect state for a player
   */
  getPlayerEffects(playerId: string): EffectState {
    return this.zoneManager.getEffectState(playerId)
  }
  
  /**
   * Check if a position collides with any barrier
   */
  checkBarrierCollision(position: Vector2, radius: number): boolean {
    const nearby = this.spatialHash.query(position, radius + 80)
    return this.barrierManager.checkCollision(position, radius, nearby)
  }
  
  /**
   * Resolve collision by pushing position out of barriers
   */
  resolveCollision(position: Vector2, radius: number): Vector2 {
    const nearby = this.spatialHash.query(position, radius + 80)
    return this.barrierManager.resolveCollision(position, radius, nearby)
  }
  
  /**
   * Apply damage to a barrier (from projectile)
   */
  damageBarrier(barrierId: string, damage: number): void {
    this.barrierManager.applyDamage(barrierId, damage)
  }
  
  /**
   * Check if player should teleport
   */
  checkTeleport(playerId: string, position: Vector2): Vector2 | null {
    return this.transportManager.checkTeleport(playerId, position)
  }
  
  /**
   * Check if player should be launched by jump pad
   */
  checkJumpPad(playerId: string, position: Vector2): Vector2 | null {
    return this.transportManager.checkJumpPad(playerId, position)
  }
  
  /**
   * Render all arena elements
   */
  render(ctx: CanvasRenderingContext2D): void {
    this.layerManager.render(ctx)
  }
  
  /**
   * Rebuild spatial hash after barrier changes
   */
  private rebuildSpatialHash(): void {
    this.spatialHash.clear()
    
    for (const barrier of this.barrierManager.getActiveBarriers()) {
      this.spatialHash.insert(barrier.id, barrier.position, barrier.size)
    }
  }
  
  /**
   * Register all renderers with layer manager
   */
  private registerRenderers(): void {
    this.layerManager.register(RenderLayer.HAZARDS, 0, 
      (ctx) => this.hazardManager.render(ctx))
    this.layerManager.register(RenderLayer.BARRIERS, 0, 
      (ctx) => this.barrierManager.render(ctx))
    this.layerManager.register(RenderLayer.ENTITIES, 10, 
      (ctx) => this.trapManager.render(ctx))
    this.layerManager.register(RenderLayer.ENTITIES, 20, 
      (ctx) => this.transportManager.render(ctx))
  }
  
  private hazardTypeToEffectType(type: HazardType): ZoneEffect['type'] {
    switch (type) {
      case 'damage': return 'damage_over_time'
      case 'slow': return 'speed_modifier'
      case 'emp': return 'power_up_disable'
    }
  }
}
```



### BarrierManager (barriers/BarrierManager.ts)

```typescript
/**
 * BarrierManager - Manages all barrier instances and their lifecycle
 * Handles collision detection, damage, and destruction
 */

import { DestructibleBarrier } from './DestructibleBarrier'
import { OneWayBarrier } from './OneWayBarrier'
import type { BarrierConfig, BarrierState, Vector2, Rectangle } from '../types'

interface BarrierCallbacks {
  onDestroyed?: (barrierId: string, position: Vector2) => void
  onDamaged?: (barrierId: string, health: number, maxHealth: number) => void
}

export class BarrierManager {
  private barriers: Map<string, BarrierState> = new Map()
  private destructibles: Map<string, DestructibleBarrier> = new Map()
  private oneWays: Map<string, OneWayBarrier> = new Map()
  private callbacks: BarrierCallbacks = {}
  
  /**
   * Initialize barriers from map configuration
   */
  initialize(configs: BarrierConfig[]): void {
    this.barriers.clear()
    this.destructibles.clear()
    this.oneWays.clear()
    
    for (const config of configs) {
      const state: BarrierState = {
        id: config.id,
        type: config.type,
        position: { ...config.position },
        size: { ...config.size },
        health: config.health ?? 100,
        maxHealth: config.health ?? 100,
        damageState: 'intact',
        isActive: true
      }
      
      this.barriers.set(config.id, state)
      
      if (config.type === 'destructible') {
        this.destructibles.set(config.id, new DestructibleBarrier(state))
      } else if (config.type === 'one_way') {
        this.oneWays.set(config.id, new OneWayBarrier(state, config.direction!))
      }
    }
  }
  
  setCallbacks(callbacks: BarrierCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Check collision against barriers
   */
  checkCollision(position: Vector2, radius: number, nearbyIds: string[]): boolean {
    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue
      
      // One-way barriers have special collision logic
      if (barrier.type === 'one_way') {
        const oneWay = this.oneWays.get(id)
        if (oneWay && !oneWay.shouldBlock(position)) continue
      }
      
      // Half walls don't block (for projectiles - movement handled separately)
      if (barrier.type === 'half') continue
      
      if (this.circleRectCollision(position, radius, barrier)) {
        return true
      }
    }
    return false
  }
  
  /**
   * Resolve collision by pushing out of barriers
   */
  resolveCollision(position: Vector2, radius: number, nearbyIds: string[]): Vector2 {
    let resolved = { ...position }
    
    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue
      
      // One-way barriers
      if (barrier.type === 'one_way') {
        const oneWay = this.oneWays.get(id)
        if (oneWay && !oneWay.shouldBlock(resolved)) continue
      }
      
      // Half walls block movement
      if (this.circleRectCollision(resolved, radius, barrier)) {
        resolved = this.pushOutOfRect(resolved, radius, barrier)
      }
    }
    
    return resolved
  }
  
  /**
   * Apply damage to a destructible barrier
   */
  applyDamage(barrierId: string, damage: number): void {
    const destructible = this.destructibles.get(barrierId)
    if (!destructible) return
    
    const result = destructible.applyDamage(damage)
    const barrier = this.barriers.get(barrierId)!
    
    barrier.health = result.health
    barrier.damageState = result.damageState
    
    this.callbacks.onDamaged?.(barrierId, result.health, barrier.maxHealth)
    
    if (result.destroyed) {
      barrier.isActive = false
      this.callbacks.onDestroyed?.(barrierId, barrier.position)
    }
  }
  
  /**
   * Get all active barriers for spatial hash
   */
  getActiveBarriers(): BarrierState[] {
    return Array.from(this.barriers.values()).filter(b => b.isActive)
  }
  
  /**
   * Get barrier at position (for projectile collision)
   */
  getBarrierAt(position: Vector2): BarrierState | null {
    for (const barrier of this.barriers.values()) {
      if (!barrier.isActive) continue
      if (this.pointInRect(position, barrier)) {
        return barrier
      }
    }
    return null
  }
  
  /**
   * Render all barriers
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const barrier of this.barriers.values()) {
      if (!barrier.isActive) continue
      this.renderBarrier(ctx, barrier)
    }
  }
  
  private renderBarrier(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const { position, size, type, damageState } = barrier
    
    ctx.save()
    
    // Base color based on type
    let color = '#4a4a6a'
    if (type === 'half') color = '#3a3a5a'
    if (type === 'destructible') {
      color = damageState === 'intact' ? '#5a5a7a' :
              damageState === 'cracked' ? '#6a5a5a' :
              damageState === 'damaged' ? '#7a4a4a' : '#2a2a2a'
    }
    
    // Glow effect
    ctx.shadowColor = type === 'one_way' ? '#00ffff' : '#ff00ff'
    ctx.shadowBlur = 8
    
    ctx.fillStyle = color
    ctx.fillRect(position.x, position.y, size.x, size.y)
    
    // Border
    ctx.strokeStyle = type === 'one_way' ? '#00ffff' : '#8a8aaa'
    ctx.lineWidth = 2
    ctx.strokeRect(position.x, position.y, size.x, size.y)
    
    // Damage cracks overlay for destructibles
    if (type === 'destructible' && damageState !== 'intact') {
      this.renderCracks(ctx, barrier)
    }
    
    ctx.restore()
  }
  
  private renderCracks(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const { position, size, damageState } = barrier
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    
    const crackCount = damageState === 'cracked' ? 2 : 5
    for (let i = 0; i < crackCount; i++) {
      ctx.beginPath()
      ctx.moveTo(
        position.x + Math.random() * size.x,
        position.y + Math.random() * size.y
      )
      ctx.lineTo(
        position.x + Math.random() * size.x,
        position.y + Math.random() * size.y
      )
      ctx.stroke()
    }
  }
  
  private circleRectCollision(circle: Vector2, radius: number, rect: BarrierState): boolean {
    const closestX = Math.max(rect.position.x, Math.min(circle.x, rect.position.x + rect.size.x))
    const closestY = Math.max(rect.position.y, Math.min(circle.y, rect.position.y + rect.size.y))
    const dx = circle.x - closestX
    const dy = circle.y - closestY
    return (dx * dx + dy * dy) < (radius * radius)
  }
  
  private pointInRect(point: Vector2, rect: BarrierState): boolean {
    return point.x >= rect.position.x && 
           point.x <= rect.position.x + rect.size.x &&
           point.y >= rect.position.y && 
           point.y <= rect.position.y + rect.size.y
  }
  
  private pushOutOfRect(circle: Vector2, radius: number, rect: BarrierState): Vector2 {
    const centerX = rect.position.x + rect.size.x / 2
    const centerY = rect.position.y + rect.size.y / 2
    const dx = circle.x - centerX
    const dy = circle.y - centerY
    
    if (Math.abs(dx) / rect.size.x > Math.abs(dy) / rect.size.y) {
      return {
        x: dx > 0 ? rect.position.x + rect.size.x + radius : rect.position.x - radius,
        y: circle.y
      }
    } else {
      return {
        x: circle.x,
        y: dy > 0 ? rect.position.y + rect.size.y + radius : rect.position.y - radius
      }
    }
  }
}
```



### HazardManager (hazards/HazardManager.ts)

```typescript
/**
 * HazardManager - Manages all hazard zones and their effects on players
 */

import { DamageZone } from './DamageZone'
import { SlowField } from './SlowField'
import { EMPZone } from './EMPZone'
import type { HazardConfig, HazardState, Vector2, Rectangle } from '../types'

interface HazardCallbacks {
  onDamage?: (playerId: string, damage: number, sourceId: string) => void
  onEffectApplied?: (playerId: string, hazardId: string, type: string) => void
  onEffectRemoved?: (playerId: string, hazardId: string) => void
}

export class HazardManager {
  private hazards: Map<string, HazardState> = new Map()
  private damageZones: Map<string, DamageZone> = new Map()
  private slowFields: Map<string, SlowField> = new Map()
  private empZones: Map<string, EMPZone> = new Map()
  private callbacks: HazardCallbacks = {}
  
  // Track damage tick timing per player per zone
  private lastDamageTick: Map<string, Map<string, number>> = new Map()
  
  initialize(configs: HazardConfig[]): void {
    this.hazards.clear()
    this.damageZones.clear()
    this.slowFields.clear()
    this.empZones.clear()
    
    for (const config of configs) {
      const state: HazardState = {
        id: config.id,
        type: config.type,
        bounds: { ...config.bounds },
        intensity: config.intensity,
        isActive: true,
        playersInside: new Set()
      }
      
      this.hazards.set(config.id, state)
      
      switch (config.type) {
        case 'damage':
          this.damageZones.set(config.id, new DamageZone(state))
          break
        case 'slow':
          this.slowFields.set(config.id, new SlowField(state))
          break
        case 'emp':
          this.empZones.set(config.id, new EMPZone(state))
          break
      }
    }
  }
  
  setCallbacks(callbacks: HazardCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Update hazard effects - call every frame
   */
  update(deltaTime: number, players: Map<string, Vector2>): void {
    const now = Date.now()
    
    for (const [playerId, position] of players) {
      for (const hazard of this.hazards.values()) {
        if (!hazard.isActive) continue
        
        const wasInside = hazard.playersInside.has(playerId)
        const isInside = this.isPointInBounds(position, hazard.bounds)
        
        if (isInside && !wasInside) {
          // Player entered zone
          hazard.playersInside.add(playerId)
          this.callbacks.onEffectApplied?.(playerId, hazard.id, hazard.type)
        } else if (!isInside && wasInside) {
          // Player exited zone
          hazard.playersInside.delete(playerId)
          this.callbacks.onEffectRemoved?.(playerId, hazard.id)
        }
        
        // Apply damage ticks for damage zones
        if (isInside && hazard.type === 'damage') {
          this.applyDamageTick(playerId, hazard, now)
        }
      }
    }
  }
  
  /**
   * Apply damage tick (4 ticks per second = 250ms interval)
   */
  private applyDamageTick(playerId: string, hazard: HazardState, now: number): void {
    const TICK_INTERVAL = 250 // ms
    
    if (!this.lastDamageTick.has(playerId)) {
      this.lastDamageTick.set(playerId, new Map())
    }
    
    const playerTicks = this.lastDamageTick.get(playerId)!
    const lastTick = playerTicks.get(hazard.id) ?? 0
    
    if (now - lastTick >= TICK_INTERVAL) {
      const damagePerTick = hazard.intensity / 4 // intensity is per second
      this.callbacks.onDamage?.(playerId, damagePerTick, hazard.id)
      playerTicks.set(hazard.id, now)
    }
  }
  
  /**
   * Get all hazards affecting a position
   */
  getHazardsAtPosition(position: Vector2): HazardState[] {
    const result: HazardState[] = []
    for (const hazard of this.hazards.values()) {
      if (hazard.isActive && this.isPointInBounds(position, hazard.bounds)) {
        result.push(hazard)
      }
    }
    return result
  }
  
  /**
   * Render all hazard zones
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const hazard of this.hazards.values()) {
      if (!hazard.isActive) continue
      this.renderHazard(ctx, hazard)
    }
  }
  
  private renderHazard(ctx: CanvasRenderingContext2D, hazard: HazardState): void {
    const { bounds, type } = hazard
    const time = Date.now() / 1000
    
    ctx.save()
    
    // Base fill with transparency
    ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.1 // Pulsing
    
    switch (type) {
      case 'damage':
        ctx.fillStyle = 'rgba(255, 50, 50, 0.4)'
        ctx.strokeStyle = '#ff3333'
        break
      case 'slow':
        ctx.fillStyle = 'rgba(50, 100, 255, 0.4)'
        ctx.strokeStyle = '#3366ff'
        break
      case 'emp':
        ctx.fillStyle = 'rgba(255, 255, 50, 0.4)'
        ctx.strokeStyle = '#ffff33'
        break
    }
    
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    
    // Animated dashed border
    ctx.globalAlpha = 0.8
    ctx.lineWidth = 2
    ctx.setLineDash([10, 5])
    ctx.lineDashOffset = -time * 50 // Animated
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    
    // Warning particles at edges
    this.renderWarningParticles(ctx, hazard, time)
    
    ctx.restore()
  }
  
  private renderWarningParticles(ctx: CanvasRenderingContext2D, hazard: HazardState, time: number): void {
    const { bounds, type } = hazard
    const particleCount = 4
    
    ctx.globalAlpha = 0.6
    
    for (let i = 0; i < particleCount; i++) {
      const t = (time + i / particleCount) % 1
      const x = bounds.x + t * bounds.width
      const y = bounds.y + Math.sin(t * Math.PI * 2) * 5
      
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  private isPointInBounds(point: Vector2, bounds: Rectangle): boolean {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height
  }
}
```



### TrapManager (traps/TrapManager.ts)

```typescript
/**
 * TrapManager - Manages all trap instances and their activation logic
 */

import { PressureTrap } from './PressureTrap'
import { TimedTrap } from './TimedTrap'
import { ProjectileTrap } from './ProjectileTrap'
import { TrapEffects } from './TrapEffects'
import type { TrapConfig, TrapState, Vector2 } from '../types'

interface TrapCallbacks {
  onTriggered?: (trapId: string, affectedPlayers: string[]) => void
  onCooldownComplete?: (trapId: string) => void
}

export class TrapManager {
  private traps: Map<string, TrapState> = new Map()
  private pressureTraps: Map<string, PressureTrap> = new Map()
  private timedTraps: Map<string, TimedTrap> = new Map()
  private projectileTraps: Map<string, ProjectileTrap> = new Map()
  private trapEffects: TrapEffects
  private callbacks: TrapCallbacks = {}
  
  constructor() {
    this.trapEffects = new TrapEffects()
  }
  
  initialize(configs: TrapConfig[]): void {
    this.traps.clear()
    this.pressureTraps.clear()
    this.timedTraps.clear()
    this.projectileTraps.clear()
    
    for (const config of configs) {
      const state: TrapState = {
        id: config.id,
        type: config.type,
        position: { ...config.position },
        radius: config.radius,
        effect: config.effect,
        effectValue: config.effectValue,
        cooldown: config.cooldown,
        cooldownRemaining: 0,
        state: 'armed',
        lastTriggerTime: 0
      }
      
      this.traps.set(config.id, state)
      
      switch (config.type) {
        case 'pressure':
          this.pressureTraps.set(config.id, new PressureTrap(state))
          break
        case 'timed':
          this.timedTraps.set(config.id, new TimedTrap(state, config.interval!))
          break
        case 'projectile':
          this.projectileTraps.set(config.id, new ProjectileTrap(state))
          break
      }
    }
  }
  
  setCallbacks(callbacks: TrapCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Update trap states - call every frame
   */
  update(deltaTime: number, players: Map<string, Vector2>): void {
    const now = Date.now()
    
    for (const trap of this.traps.values()) {
      // Update cooldowns
      if (trap.state === 'cooldown') {
        trap.cooldownRemaining -= deltaTime
        if (trap.cooldownRemaining <= 0) {
          trap.state = 'armed'
          trap.cooldownRemaining = 0
          this.callbacks.onCooldownComplete?.(trap.id)
        }
        continue
      }
      
      // Check triggers based on trap type
      if (trap.state === 'armed') {
        let shouldTrigger = false
        const affectedPlayers: string[] = []
        
        switch (trap.type) {
          case 'pressure':
            for (const [playerId, position] of players) {
              if (this.isInTriggerRadius(position, trap)) {
                shouldTrigger = true
                affectedPlayers.push(playerId)
              }
            }
            break
            
          case 'timed':
            const timedTrap = this.timedTraps.get(trap.id)!
            if (timedTrap.shouldTrigger(now)) {
              shouldTrigger = true
              // Timed traps affect all players in radius
              for (const [playerId, position] of players) {
                if (this.isInEffectRadius(position, trap)) {
                  affectedPlayers.push(playerId)
                }
              }
            }
            break
        }
        
        if (shouldTrigger) {
          this.triggerTrap(trap, affectedPlayers)
        }
      }
    }
  }
  
  /**
   * Check if a projectile hit a projectile-triggered trap
   */
  onProjectileHit(position: Vector2): void {
    for (const [id, trap] of this.projectileTraps) {
      const state = this.traps.get(id)!
      if (state.state !== 'armed') continue
      
      if (this.isInTriggerRadius(position, state)) {
        // Get all players in effect radius (we don't have player positions here)
        // This will be called with player positions from the combat system
        this.triggerTrap(state, [])
      }
    }
  }
  
  /**
   * Trigger a trap and apply its effect
   */
  private triggerTrap(trap: TrapState, affectedPlayers: string[]): void {
    trap.state = 'triggered'
    trap.lastTriggerTime = Date.now()
    
    // Apply effect to affected players
    for (const playerId of affectedPlayers) {
      this.trapEffects.apply(trap.effect, trap.effectValue, playerId, trap.position)
    }
    
    this.callbacks.onTriggered?.(trap.id, affectedPlayers)
    
    // Start cooldown after brief trigger animation
    setTimeout(() => {
      trap.state = 'cooldown'
      trap.cooldownRemaining = trap.cooldown
    }, 200)
  }
  
  /**
   * Get trap effect results for external systems
   */
  getTrapEffectResults(): TrapEffectResult[] {
    return this.trapEffects.getAndClearResults()
  }
  
  /**
   * Render all traps
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const trap of this.traps.values()) {
      this.renderTrap(ctx, trap)
    }
  }
  
  private renderTrap(ctx: CanvasRenderingContext2D, trap: TrapState): void {
    const { position, radius, state } = trap
    const time = Date.now() / 1000
    
    ctx.save()
    
    // State-based appearance
    switch (state) {
      case 'armed':
        ctx.globalAlpha = 0.6 + Math.sin(time * 4) * 0.2 // Pulsing glow
        ctx.fillStyle = '#ff6600'
        ctx.strokeStyle = '#ffaa00'
        break
      case 'triggered':
        ctx.globalAlpha = 1.0
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#ffff00'
        break
      case 'cooldown':
        ctx.globalAlpha = 0.3
        ctx.fillStyle = '#666666'
        ctx.strokeStyle = '#888888'
        break
    }
    
    // Draw trap base
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw trigger radius indicator when armed
    if (state === 'armed') {
      ctx.globalAlpha = 0.2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    // Draw cooldown progress
    if (state === 'cooldown') {
      const progress = 1 - (trap.cooldownRemaining / trap.cooldown)
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(position.x, position.y, radius + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
      ctx.stroke()
    }
    
    ctx.restore()
  }
  
  private isInTriggerRadius(position: Vector2, trap: TrapState): boolean {
    const dx = position.x - trap.position.x
    const dy = position.y - trap.position.y
    return Math.sqrt(dx * dx + dy * dy) <= trap.radius
  }
  
  private isInEffectRadius(position: Vector2, trap: TrapState): boolean {
    const effectRadius = trap.radius * 2 // Effect radius is larger than trigger
    const dx = position.x - trap.position.x
    const dy = position.y - trap.position.y
    return Math.sqrt(dx * dx + dy * dy) <= effectRadius
  }
}
```



### TransportManager (transport/TransportManager.ts)

```typescript
/**
 * TransportManager - Manages teleporters and jump pads
 */

import { Teleporter } from './Teleporter'
import { JumpPad } from './JumpPad'
import type { TeleporterConfig, JumpPadConfig, TeleporterState, JumpPadState, Vector2 } from '../types'

interface TransportCallbacks {
  onTeleport?: (playerId: string, from: Vector2, to: Vector2) => void
  onLaunch?: (playerId: string, velocity: Vector2) => void
}

export class TransportManager {
  private teleporters: Map<string, TeleporterState> = new Map()
  private jumpPads: Map<string, JumpPadState> = new Map()
  private teleporterPairs: Map<string, [string, string]> = new Map()
  private callbacks: TransportCallbacks = {}
  
  // Cooldown constants
  private readonly TELEPORTER_COOLDOWN = 3000 // 3 seconds
  private readonly JUMP_PAD_COOLDOWN = 1000   // 1 second
  
  initialize(teleporterConfigs: TeleporterConfig[], jumpPadConfigs: JumpPadConfig[]): void {
    this.teleporters.clear()
    this.jumpPads.clear()
    this.teleporterPairs.clear()
    
    // Initialize teleporters
    for (const config of teleporterConfigs) {
      const state: TeleporterState = {
        id: config.id,
        pairId: config.pairId,
        position: { ...config.position },
        radius: config.radius,
        linkedTeleporter: null,
        playerCooldowns: new Map()
      }
      this.teleporters.set(config.id, state)
    }
    
    // Link teleporter pairs
    for (const [id, state] of this.teleporters) {
      for (const [otherId, otherState] of this.teleporters) {
        if (id !== otherId && state.pairId === otherState.pairId) {
          state.linkedTeleporter = otherId
          break
        }
      }
    }
    
    // Initialize jump pads
    for (const config of jumpPadConfigs) {
      const state: JumpPadState = {
        id: config.id,
        position: { ...config.position },
        radius: config.radius,
        direction: config.direction,
        force: config.force,
        playerCooldowns: new Map()
      }
      this.jumpPads.set(config.id, state)
    }
  }
  
  setCallbacks(callbacks: TransportCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Update cooldowns - call every frame
   */
  update(deltaTime: number): void {
    const now = Date.now()
    
    // Clean up expired cooldowns
    for (const teleporter of this.teleporters.values()) {
      for (const [playerId, cooldownEnd] of teleporter.playerCooldowns) {
        if (now >= cooldownEnd) {
          teleporter.playerCooldowns.delete(playerId)
        }
      }
    }
    
    for (const jumpPad of this.jumpPads.values()) {
      for (const [playerId, cooldownEnd] of jumpPad.playerCooldowns) {
        if (now >= cooldownEnd) {
          jumpPad.playerCooldowns.delete(playerId)
        }
      }
    }
  }
  
  /**
   * Check if player should teleport, returns destination or null
   */
  checkTeleport(playerId: string, position: Vector2): Vector2 | null {
    const now = Date.now()
    
    for (const teleporter of this.teleporters.values()) {
      // Check if player is in teleporter
      if (!this.isInRadius(position, teleporter.position, teleporter.radius)) {
        continue
      }
      
      // Check cooldown
      const cooldownEnd = teleporter.playerCooldowns.get(playerId)
      if (cooldownEnd && now < cooldownEnd) {
        continue
      }
      
      // Get linked teleporter
      if (!teleporter.linkedTeleporter) continue
      const destination = this.teleporters.get(teleporter.linkedTeleporter)
      if (!destination) continue
      
      // Apply cooldown to both teleporters
      teleporter.playerCooldowns.set(playerId, now + this.TELEPORTER_COOLDOWN)
      destination.playerCooldowns.set(playerId, now + this.TELEPORTER_COOLDOWN)
      
      this.callbacks.onTeleport?.(playerId, position, destination.position)
      
      return { ...destination.position }
    }
    
    return null
  }
  
  /**
   * Check if player should be launched, returns velocity or null
   */
  checkJumpPad(playerId: string, position: Vector2): Vector2 | null {
    const now = Date.now()
    
    for (const jumpPad of this.jumpPads.values()) {
      // Check if player is on jump pad
      if (!this.isInRadius(position, jumpPad.position, jumpPad.radius)) {
        continue
      }
      
      // Check cooldown
      const cooldownEnd = jumpPad.playerCooldowns.get(playerId)
      if (cooldownEnd && now < cooldownEnd) {
        continue
      }
      
      // Apply cooldown
      jumpPad.playerCooldowns.set(playerId, now + this.JUMP_PAD_COOLDOWN)
      
      // Calculate launch velocity
      const velocity = this.directionToVelocity(jumpPad.direction, jumpPad.force)
      
      this.callbacks.onLaunch?.(playerId, velocity)
      
      return velocity
    }
    
    return null
  }
  
  /**
   * Check if teleporter is on cooldown for a player
   */
  isTeleporterOnCooldown(teleporterId: string, playerId: string): boolean {
    const teleporter = this.teleporters.get(teleporterId)
    if (!teleporter) return false
    const cooldownEnd = teleporter.playerCooldowns.get(playerId)
    return cooldownEnd ? Date.now() < cooldownEnd : false
  }
  
  /**
   * Render all transport elements
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render teleporters
    for (const teleporter of this.teleporters.values()) {
      this.renderTeleporter(ctx, teleporter)
    }
    
    // Render jump pads
    for (const jumpPad of this.jumpPads.values()) {
      this.renderJumpPad(ctx, jumpPad)
    }
  }
  
  private renderTeleporter(ctx: CanvasRenderingContext2D, teleporter: TeleporterState): void {
    const { position, radius } = teleporter
    const time = Date.now() / 1000
    
    ctx.save()
    
    // Swirling vortex effect
    ctx.globalAlpha = 0.6
    
    // Outer glow
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius * 1.5
    )
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)')
    gradient.addColorStop(0.5, 'rgba(128, 0, 255, 0.4)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
    ctx.fill()
    
    // Rotating particles
    ctx.fillStyle = '#00ffff'
    for (let i = 0; i < 8; i++) {
      const angle = (time * 2 + i / 8 * Math.PI * 2) % (Math.PI * 2)
      const dist = radius * 0.7
      const px = position.x + Math.cos(angle) * dist
      const py = position.y + Math.sin(angle) * dist
      
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Center
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(position.x, position.y, 5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }
  
  private renderJumpPad(ctx: CanvasRenderingContext2D, jumpPad: JumpPadState): void {
    const { position, radius, direction } = jumpPad
    const time = Date.now() / 1000
    
    ctx.save()
    
    // Base pad
    ctx.globalAlpha = 0.7
    ctx.fillStyle = '#00ff88'
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Direction arrow
    const dirVec = this.directionToVelocity(direction, 1)
    const arrowLength = radius * 0.8
    const arrowOffset = Math.sin(time * 4) * 5 // Pulsing animation
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(position.x, position.y)
    ctx.lineTo(
      position.x + dirVec.x * (arrowLength + arrowOffset),
      position.y + dirVec.y * (arrowLength + arrowOffset)
    )
    ctx.stroke()
    
    // Arrow head
    const headSize = 10
    const angle = Math.atan2(dirVec.y, dirVec.x)
    const tipX = position.x + dirVec.x * (arrowLength + arrowOffset)
    const tipY = position.y + dirVec.y * (arrowLength + arrowOffset)
    
    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(
      tipX - Math.cos(angle - 0.5) * headSize,
      tipY - Math.sin(angle - 0.5) * headSize
    )
    ctx.lineTo(
      tipX - Math.cos(angle + 0.5) * headSize,
      tipY - Math.sin(angle + 0.5) * headSize
    )
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    
    ctx.restore()
  }
  
  private isInRadius(point: Vector2, center: Vector2, radius: number): boolean {
    const dx = point.x - center.x
    const dy = point.y - center.y
    return Math.sqrt(dx * dx + dy * dy) <= radius
  }
  
  private directionToVelocity(direction: JumpDirection, force: number): Vector2 {
    const directions: Record<JumpDirection, Vector2> = {
      'N':  { x: 0, y: -1 },
      'S':  { x: 0, y: 1 },
      'E':  { x: 1, y: 0 },
      'W':  { x: -1, y: 0 },
      'NE': { x: 0.707, y: -0.707 },
      'NW': { x: -0.707, y: -0.707 },
      'SE': { x: 0.707, y: 0.707 },
      'SW': { x: -0.707, y: 0.707 }
    }
    
    const dir = directions[direction]
    return { x: dir.x * force, y: dir.y * force }
  }
}
```



### ZoneManager (zones/ZoneManager.ts)

```typescript
/**
 * ZoneManager - Centralized zone effect coordination
 * Manages effect stacks for all players
 */

import { EffectStack } from './EffectStack'
import type { ZoneEffect, EffectState } from '../types'

interface ZoneManagerCallbacks {
  onEffectAdded?: (playerId: string, effect: ZoneEffect) => void
  onEffectRemoved?: (playerId: string, sourceId: string) => void
  onEffectModified?: (playerId: string, effect: ZoneEffect) => void
}

export class ZoneManager {
  private playerEffects: Map<string, EffectStack> = new Map()
  private callbacks: ZoneManagerCallbacks = {}
  
  setCallbacks(callbacks: ZoneManagerCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Add an effect to a player's stack
   */
  addEffect(playerId: string, effect: ZoneEffect): void {
    if (!this.playerEffects.has(playerId)) {
      this.playerEffects.set(playerId, new EffectStack())
    }
    
    const stack = this.playerEffects.get(playerId)!
    const isNew = stack.addEffect(effect)
    
    if (isNew) {
      this.callbacks.onEffectAdded?.(playerId, effect)
    } else {
      this.callbacks.onEffectModified?.(playerId, effect)
    }
  }
  
  /**
   * Remove an effect by source ID
   */
  removeEffect(playerId: string, sourceId: string): void {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return
    
    if (stack.removeEffect(sourceId)) {
      this.callbacks.onEffectRemoved?.(playerId, sourceId)
    }
  }
  
  /**
   * Clean up effects from zones player has left
   */
  cleanupStaleEffects(playerId: string, activeSourceIds: string[]): void {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return
    
    const activeSet = new Set(activeSourceIds)
    const staleIds = stack.getSourceIds().filter(id => !activeSet.has(id))
    
    for (const sourceId of staleIds) {
      this.removeEffect(playerId, sourceId)
    }
  }
  
  /**
   * Get aggregated effect state for a player
   */
  getEffectState(playerId: string): EffectState {
    const stack = this.playerEffects.get(playerId)
    if (!stack) {
      return {
        speedMultiplier: 1.0,
        damagePerSecond: 0,
        powerUpsDisabled: false,
        activeEffects: []
      }
    }
    
    return stack.getAggregatedState()
  }
  
  /**
   * Get active effects for UI display
   */
  getActiveEffects(playerId: string): ZoneEffect[] {
    const stack = this.playerEffects.get(playerId)
    return stack ? stack.getEffects() : []
  }
  
  /**
   * Clear all effects for a player (on death)
   */
  clearPlayerEffects(playerId: string): void {
    const stack = this.playerEffects.get(playerId)
    if (stack) {
      const sourceIds = stack.getSourceIds()
      stack.clear()
      for (const sourceId of sourceIds) {
        this.callbacks.onEffectRemoved?.(playerId, sourceId)
      }
    }
  }
  
  /**
   * Check if player has a specific effect type
   */
  hasEffect(playerId: string, effectType: ZoneEffect['type']): boolean {
    const stack = this.playerEffects.get(playerId)
    return stack ? stack.hasEffectType(effectType) : false
  }
}
```

### EffectStack (zones/EffectStack.ts)

```typescript
/**
 * EffectStack - Manages effect stack for a single player
 */

import type { ZoneEffect, EffectState } from '../types'

export class EffectStack {
  private effects: Map<string, ZoneEffect> = new Map()
  
  /**
   * Add or update an effect
   * Returns true if new, false if updated
   */
  addEffect(effect: ZoneEffect): boolean {
    const isNew = !this.effects.has(effect.sourceId)
    this.effects.set(effect.sourceId, effect)
    return isNew
  }
  
  /**
   * Remove an effect by source ID
   * Returns true if removed
   */
  removeEffect(sourceId: string): boolean {
    return this.effects.delete(sourceId)
  }
  
  /**
   * Get all source IDs
   */
  getSourceIds(): string[] {
    return Array.from(this.effects.keys())
  }
  
  /**
   * Get all effects
   */
  getEffects(): ZoneEffect[] {
    return Array.from(this.effects.values())
  }
  
  /**
   * Check if has effect type
   */
  hasEffectType(type: ZoneEffect['type']): boolean {
    for (const effect of this.effects.values()) {
      if (effect.type === type) return true
    }
    return false
  }
  
  /**
   * Clear all effects
   */
  clear(): void {
    this.effects.clear()
  }
  
  /**
   * Calculate aggregated effect state
   */
  getAggregatedState(): EffectState {
    let speedMultiplier = 1.0
    let damagePerSecond = 0
    let powerUpsDisabled = false
    
    for (const effect of this.effects.values()) {
      switch (effect.type) {
        case 'speed_modifier':
          // Take the strongest slow (lowest multiplier)
          speedMultiplier = Math.min(speedMultiplier, effect.value)
          break
        case 'damage_over_time':
          // Additive damage
          damagePerSecond += effect.value
          break
        case 'power_up_disable':
          // Boolean OR
          powerUpsDisabled = true
          break
      }
    }
    
    return {
      speedMultiplier,
      damagePerSecond,
      powerUpsDisabled,
      activeEffects: this.getEffects()
    }
  }
}
```

### SpatialHash (collision/SpatialHash.ts)

```typescript
/**
 * SpatialHash - Spatial partitioning for efficient collision queries
 */

import type { Vector2 } from '../types'

interface SpatialEntry {
  id: string
  position: Vector2
  size: Vector2
  cells: Set<string>
}

export class SpatialHash {
  private cellSize: number
  private gridWidth: number
  private gridHeight: number
  private cells: Map<string, Set<string>> = new Map()
  private entries: Map<string, SpatialEntry> = new Map()
  
  constructor(cellSize: number, gridWidth: number, gridHeight: number) {
    this.cellSize = cellSize
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight
  }
  
  /**
   * Insert an object into the spatial hash
   */
  insert(id: string, position: Vector2, size: Vector2): void {
    const cells = this.getCellsForRect(position, size)
    
    const entry: SpatialEntry = {
      id,
      position: { ...position },
      size: { ...size },
      cells
    }
    
    this.entries.set(id, entry)
    
    for (const cellKey of cells) {
      if (!this.cells.has(cellKey)) {
        this.cells.set(cellKey, new Set())
      }
      this.cells.get(cellKey)!.add(id)
    }
  }
  
  /**
   * Remove an object from the spatial hash
   */
  remove(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    
    for (const cellKey of entry.cells) {
      const cell = this.cells.get(cellKey)
      if (cell) {
        cell.delete(id)
        if (cell.size === 0) {
          this.cells.delete(cellKey)
        }
      }
    }
    
    this.entries.delete(id)
  }
  
  /**
   * Update an object's position
   */
  update(id: string, position: Vector2, size: Vector2): void {
    this.remove(id)
    this.insert(id, position, size)
  }
  
  /**
   * Query for objects near a position
   */
  query(position: Vector2, radius: number): string[] {
    const result = new Set<string>()
    
    const minX = Math.floor((position.x - radius) / this.cellSize)
    const maxX = Math.floor((position.x + radius) / this.cellSize)
    const minY = Math.floor((position.y - radius) / this.cellSize)
    const maxY = Math.floor((position.y + radius) / this.cellSize)
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const cellKey = `${x},${y}`
        const cell = this.cells.get(cellKey)
        if (cell) {
          for (const id of cell) {
            result.add(id)
          }
        }
      }
    }
    
    return Array.from(result)
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.cells.clear()
    this.entries.clear()
  }
  
  /**
   * Get cells that a rectangle occupies
   */
  private getCellsForRect(position: Vector2, size: Vector2): Set<string> {
    const cells = new Set<string>()
    
    const minX = Math.floor(position.x / this.cellSize)
    const maxX = Math.floor((position.x + size.x) / this.cellSize)
    const minY = Math.floor(position.y / this.cellSize)
    const maxY = Math.floor((position.y + size.y) / this.cellSize)
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.add(`${x},${y}`)
      }
    }
    
    return cells
  }
}
```



### LayerManager (rendering/LayerManager.ts)

```typescript
/**
 * LayerManager - Orchestrates layered rendering
 */

import { RenderLayer } from './RenderLayer'
import type { RenderLayer as RenderLayerEnum, Renderable } from '../types'

export class LayerManager {
  private layers: Map<RenderLayerEnum, RenderLayer> = new Map()
  
  constructor() {
    // Initialize all layers
    for (let i = 0; i <= 6; i++) {
      this.layers.set(i as RenderLayerEnum, new RenderLayer(i as RenderLayerEnum))
    }
  }
  
  /**
   * Register a renderable with a layer
   */
  register(
    layer: RenderLayerEnum, 
    subLayer: number, 
    renderFn: (ctx: CanvasRenderingContext2D) => void
  ): string {
    const renderLayer = this.layers.get(layer)
    if (!renderLayer) {
      throw new Error(`Invalid layer: ${layer}`)
    }
    
    return renderLayer.register(subLayer, renderFn)
  }
  
  /**
   * Unregister a renderable
   */
  unregister(layer: RenderLayerEnum, id: string): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.unregister(id)
    }
  }
  
  /**
   * Update sub-layer for Y-sorting
   */
  updateSubLayer(layer: RenderLayerEnum, id: string, subLayer: number): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.updateSubLayer(id, subLayer)
    }
  }
  
  /**
   * Set layer visibility (for debugging)
   */
  setLayerVisible(layer: RenderLayerEnum, visible: boolean): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.setVisible(visible)
    }
  }
  
  /**
   * Render all layers in order
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render layers in order (0 to 6)
    for (let i = 0; i <= 6; i++) {
      const layer = this.layers.get(i as RenderLayerEnum)
      if (layer) {
        layer.render(ctx)
      }
    }
  }
}
```

## Integration with GameEngine

```typescript
// In GameEngine.ts - add arena system integration

import { ArenaManager } from './arena'
import type { EffectState } from './types'

export class GameEngine {
  // ... existing code ...
  
  // Add arena manager
  private arenaManager: ArenaManager
  
  constructor(canvas: HTMLCanvasElement) {
    // ... existing init ...
    
    this.arenaManager = new ArenaManager()
  }
  
  /**
   * Load a map configuration
   */
  loadMap(mapConfig: MapConfig): void {
    this.arenaManager.loadMap(mapConfig)
    
    this.arenaManager.setCallbacks({
      onBarrierDestroyed: (id, pos) => {
        // Spawn destruction particles
        this.combatEffectsRenderer.addDestructionEffect(pos)
      },
      onTrapTriggered: (id, players) => {
        // Apply trap effects through combat system
        const results = this.arenaManager.getTrapEffectResults()
        for (const result of results) {
          if (result.type === 'damage') {
            this.combatSystem.applyDamage(result.playerId, result.value)
          }
        }
      },
      onPlayerTeleported: (playerId, from, to) => {
        // Update player position
        if (playerId === this.localPlayer?.id) {
          this.localPlayer.position = to
          this.callbacks.onPositionUpdate?.(to)
        }
        // Spawn teleport effects
        this.combatEffectsRenderer.addTeleportEffect(from, to)
      },
      onPlayerLaunched: (playerId, velocity) => {
        // Apply launch velocity to player
        if (playerId === this.localPlayer?.id) {
          this.applyLaunchVelocity(velocity)
        }
      },
      onHazardDamage: (playerId, damage, sourceId) => {
        // Apply hazard damage through combat system
        this.combatSystem.applyEnvironmentalDamage(playerId, damage)
      }
    })
  }
  
  /**
   * Get player effect state for movement calculations
   */
  getPlayerEffects(playerId: string): EffectState {
    return this.arenaManager.getPlayerEffects(playerId)
  }
  
  private updateLocalPlayer(deltaTime: number): void {
    if (!this.localPlayer) return
    
    // Get effect state for speed modification
    const effects = this.arenaManager.getPlayerEffects(this.localPlayer.id)
    
    const velocity = this.inputSystem.getVelocity()
    if (velocity.x === 0 && velocity.y === 0) return
    
    // Apply speed modifier from zone effects
    const speed = PLAYER_CONFIG.speed * deltaTime * effects.speedMultiplier
    
    const newPosition: Vector2 = {
      x: this.localPlayer.position.x + velocity.x * speed,
      y: this.localPlayer.position.y + velocity.y * speed,
    }
    
    // Check for teleport
    const teleportDest = this.arenaManager.checkTeleport(this.localPlayer.id, newPosition)
    if (teleportDest) {
      this.localPlayer.position = teleportDest
      this.callbacks.onPositionUpdate?.(teleportDest)
      return
    }
    
    // Check for jump pad
    const launchVelocity = this.arenaManager.checkJumpPad(this.localPlayer.id, newPosition)
    if (launchVelocity) {
      this.applyLaunchVelocity(launchVelocity)
      return
    }
    
    // Resolve collisions using arena manager
    const resolved = this.arenaManager.resolveCollision(newPosition, PLAYER_CONFIG.radius)
    
    if (resolved.x !== this.localPlayer.position.x || resolved.y !== this.localPlayer.position.y) {
      this.localPlayer.position = resolved
      this.callbacks.onPositionUpdate?.(resolved)
    }
  }
  
  private update(deltaTime: number): void {
    // ... existing update code ...
    
    // Update arena systems
    const playerPositions = new Map<string, Vector2>()
    if (this.localPlayer) {
      playerPositions.set(this.localPlayer.id, this.localPlayer.position)
    }
    if (this.opponent) {
      playerPositions.set(this.opponent.id, this.opponent.position)
    }
    
    this.arenaManager.update(deltaTime, playerPositions)
  }
  
  private render(): void {
    // ... existing render setup ...
    
    // Render arena (handles its own layering)
    this.arenaManager.render(this.ctx)
    
    // ... rest of rendering ...
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tile Map Consistency
*For any* valid map configuration, loading the map and querying any tile position SHALL return the same tile type as defined in the configuration.
**Validates: Requirements 1.2, 1.5**

### Property 2: Barrier Collision Integrity
*For any* player position and any active barrier, if the player position overlaps the barrier bounds, checkCollision SHALL return true.
**Validates: Requirements 2.1, 10.1**

### Property 3: Destructible Barrier Health Progression
*For any* destructible barrier, applying damage SHALL decrease health, and when health reaches zero, the barrier SHALL be marked as destroyed and removed from collision.
**Validates: Requirements 2.3, 2.4, 2.5**

### Property 4: Hazard Zone Entry/Exit
*For any* player entering a hazard zone, the effect SHALL be applied within one frame, and upon exiting, the effect SHALL be removed within 0.1 seconds.
**Validates: Requirements 3.4, 3.5**

### Property 5: Effect Stack Aggregation
*For any* player with multiple zone effects, the aggregated effect state SHALL correctly combine: speed multipliers (multiplicative), damage (additive), and power-up disable (boolean OR).
**Validates: Requirements 8.4, 8.5**

### Property 6: Trap State Machine
*For any* trap, the state SHALL transition: armed → triggered → cooldown → armed, and SHALL NOT skip states.
**Validates: Requirements 4.5, 4.6**

### Property 7: Teleporter Pair Symmetry
*For any* teleporter pair, teleporting from A to B and then from B to A (after cooldown) SHALL return the player to the original position.
**Validates: Requirements 5.1, 5.2**

### Property 8: Spatial Hash Query Completeness
*For any* query position and radius, the spatial hash SHALL return all objects whose bounds intersect the query circle.
**Validates: Requirements 10.5, 10.8**

### Property 9: Render Layer Ordering
*For any* frame render, layers SHALL be drawn in strictly ascending order (0 through 6), and within each layer, sub-layers SHALL be drawn in ascending order.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 10: Map Configuration Validation
*For any* map configuration, validation SHALL detect and report all constraint violations (overlapping barriers, unpaired teleporters, invalid spawn positions).
**Validates: Requirements 9.2, 9.3, 9.7**

## Error Handling

| Error Condition | Handling Strategy |
|-----------------|-------------------|
| Invalid map configuration | Throw descriptive error at load time, prevent game start |
| Missing teleporter pair | Log warning, disable orphaned teleporter |
| Barrier health below zero | Clamp to zero, trigger destruction |
| Effect stack overflow | Limit to 10 effects per player, drop oldest |
| Spatial hash cell overflow | Expand cell capacity dynamically |
| Render callback throws | Catch, log error, continue rendering other layers |
| Invalid tile query | Return 'floor' as safe default |

## Testing Strategy

### Unit Tests
- TileMap: load, query by grid, query by pixel
- BarrierManager: collision detection, damage application, destruction
- HazardManager: zone entry/exit, damage ticks, effect application
- TrapManager: trigger detection, state transitions, cooldowns
- TransportManager: teleport logic, jump pad velocity, cooldowns
- ZoneManager: effect stacking, aggregation, cleanup
- SpatialHash: insert, remove, query accuracy
- LayerManager: registration, ordering, visibility

### Property-Based Tests
- Map validation catches all invalid configurations
- Collision detection is consistent with barrier bounds
- Effect aggregation produces correct combined values
- Spatial hash queries return complete results

### Integration Tests
- Full arena load and render cycle
- Player movement through hazards and traps
- Teleporter and jump pad interactions
- Combat system integration with arena damage

### Performance Tests
- 60fps with all systems active
- Spatial hash query performance with 100+ objects
- Particle system under load (500 particles)

