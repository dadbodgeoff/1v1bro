/**
 * ArenaFactory - Creates configured ArenaManager instances for E2E testing
 * 
 * @module __tests__/e2e/helpers/ArenaFactory
 */

import { ArenaManager } from '../../../arena/ArenaManager'
import { NEXUS_ARENA } from '../../../config/maps/nexus-arena'
import type { MapConfig, TileDefinition } from '../../../config/maps/map-schema'
import type { 
  BarrierConfig, 
  HazardConfig, 
  TrapConfig, 
  TeleporterConfig, 
  JumpPadConfig
} from '../../../arena/types'
import type { Vector2 } from '../../../types'

/**
 * Options for creating a minimal arena for focused tests
 */
export interface MinimalArenaOptions {
  barriers?: BarrierConfig[]
  hazards?: HazardConfig[]
  traps?: TrapConfig[]
  teleporters?: TeleporterConfig[]
  jumpPads?: JumpPadConfig[]
  spawnPoints?: Array<{ id: 'player1' | 'player2'; position: Vector2 }>
}

/**
 * Tile type shortcuts for building test configs
 */
const F: TileDefinition = { type: 'floor' }

/**
 * Generate a minimal valid 16x9 floor tile grid
 */
function generateFloorGrid(): TileDefinition[][] {
  return Array(9).fill(null).map(() => 
    Array(16).fill(null).map(() => ({ ...F }))
  )
}

/**
 * Generate minimal valid map metadata
 */
function generateMetadata(name: string = 'Test Arena'): MapConfig['metadata'] {
  return {
    name,
    author: 'Test Suite',
    version: '1.0.0',
    description: 'Auto-generated test arena configuration'
  }
}

/**
 * Create a minimal valid MapConfig with optional overrides
 */
export function createMinimalMapConfig(options: MinimalArenaOptions = {}): MapConfig {
  return {
    metadata: generateMetadata(),
    tiles: generateFloorGrid(),
    barriers: options.barriers ?? [],
    hazards: options.hazards ?? [],
    traps: options.traps ?? [],
    teleporters: options.teleporters ?? [],
    jumpPads: options.jumpPads ?? [],
    spawnPoints: options.spawnPoints ?? [
      { id: 'player1', position: { x: 160, y: 360 } },
      { id: 'player2', position: { x: 1120, y: 360 } }
    ],
    powerUpSpawns: [{ x: 640, y: 360 }]
  }
}

/**
 * ArenaFactory class for creating test arenas
 * Note: All test arenas use static spawning (useDynamicSpawning=false)
 * to ensure deterministic test behavior
 */
export class ArenaFactory {
  /**
   * Create ArenaManager with default NEXUS_ARENA config
   */
  static createDefault(): ArenaManager {
    const arena = new ArenaManager()
    arena.loadMap(NEXUS_ARENA, false) // Static spawning for tests
    return arena
  }
  
  /**
   * Create ArenaManager with custom config
   */
  static createWithConfig(config: MapConfig): ArenaManager {
    const arena = new ArenaManager()
    arena.loadMap(config, false) // Static spawning for tests
    return arena
  }
  
  /**
   * Create minimal arena for focused tests
   */
  static createMinimal(options: MinimalArenaOptions = {}): ArenaManager {
    const config = createMinimalMapConfig(options)
    return ArenaFactory.createWithConfig(config)
  }
  
  /**
   * Create arena with a single barrier for collision testing
   */
  static createWithBarrier(barrier: BarrierConfig): ArenaManager {
    return ArenaFactory.createMinimal({ barriers: [barrier] })
  }
  
  /**
   * Create arena with a single hazard zone for effect testing
   */
  static createWithHazard(hazard: HazardConfig): ArenaManager {
    return ArenaFactory.createMinimal({ hazards: [hazard] })
  }
  
  /**
   * Create arena with a single trap for trigger testing
   */
  static createWithTrap(trap: TrapConfig): ArenaManager {
    return ArenaFactory.createMinimal({ traps: [trap] })
  }
  
  /**
   * Create arena with a teleporter pair for transport testing
   */
  static createWithTeleporterPair(
    pairId: string,
    posA: Vector2,
    posB: Vector2
  ): ArenaManager {
    return ArenaFactory.createMinimal({
      teleporters: [
        { id: `${pairId}_a`, pairId, position: posA, radius: 30 },
        { id: `${pairId}_b`, pairId, position: posB, radius: 30 }
      ]
    })
  }
  
  /**
   * Create arena with a jump pad for launch testing
   */
  static createWithJumpPad(jumpPad: JumpPadConfig): ArenaManager {
    return ArenaFactory.createMinimal({ jumpPads: [jumpPad] })
  }
}

/**
 * Pre-built test configurations
 */
export const TestConfigs = {
  /** Full wall barrier at center */
  centerWall: (): BarrierConfig => ({
    id: 'test_wall',
    type: 'full',
    position: { x: 600, y: 320 },
    size: { x: 80, y: 80 }
  }),
  
  /** Destructible barrier with 100 HP */
  destructibleBarrier: (health: number = 100): BarrierConfig => ({
    id: 'test_destructible',
    type: 'destructible',
    position: { x: 600, y: 320 },
    size: { x: 80, y: 80 },
    health
  }),
  
  /** One-way barrier allowing passage from specified direction */
  oneWayBarrier: (direction: 'N' | 'S' | 'E' | 'W'): BarrierConfig => ({
    id: 'test_oneway',
    type: 'one_way',
    position: { x: 600, y: 320 },
    size: { x: 80, y: 80 },
    direction
  }),
  
  /** Damage zone at center */
  damageZone: (intensity: number = 10): HazardConfig => ({
    id: 'test_damage',
    type: 'damage',
    bounds: { x: 560, y: 280, width: 160, height: 160 },
    intensity
  }),
  
  /** Slow field at center */
  slowField: (intensity: number = 0.5): HazardConfig => ({
    id: 'test_slow',
    type: 'slow',
    bounds: { x: 560, y: 280, width: 160, height: 160 },
    intensity
  }),
  
  /** EMP zone at center */
  empZone: (): HazardConfig => ({
    id: 'test_emp',
    type: 'emp',
    bounds: { x: 560, y: 280, width: 160, height: 160 },
    intensity: 1
  }),
  
  /** Pressure trap at center */
  pressureTrap: (): TrapConfig => ({
    id: 'test_pressure',
    type: 'pressure',
    position: { x: 640, y: 360 },
    radius: 40,
    effect: 'damage_burst',
    effectValue: 50,
    cooldown: 10
  }),
  
  /** Timed trap at center */
  timedTrap: (interval: number = 5): TrapConfig => ({
    id: 'test_timed',
    type: 'timed',
    position: { x: 640, y: 360 },
    radius: 40,
    effect: 'damage_burst',
    effectValue: 50,
    cooldown: 10,
    interval
  }),
  
  /** Jump pad launching east */
  jumpPadEast: (): JumpPadConfig => ({
    id: 'test_jumppad',
    position: { x: 100, y: 360 },
    radius: 40,
    direction: 'E',
    force: 400
  })
}
