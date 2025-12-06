/**
 * E2E Test Helpers - Exports all test utilities
 * 
 * @module __tests__/e2e/helpers
 */

// Player simulation
export {
  createPlayerSimulator,
  createPlayerMap,
  createPlayer1,
  createPlayer2,
  type PlayerSimulator
} from './PlayerSimulator'

// Arena factory
export {
  ArenaFactory,
  createMinimalMapConfig,
  TestConfigs,
  type MinimalArenaOptions
} from './ArenaFactory'

// Event recording
export {
  EventRecorder,
  createEventRecorder,
  type BarrierDestroyedEvent,
  type TrapTriggeredEvent,
  type PlayerTeleportedEvent,
  type PlayerLaunchedEvent,
  type HazardDamageEvent,
  type RecordedEvent
} from './EventRecorder'

// Canvas mocking
export {
  createCanvasMock,
  verifyRenderOrder,
  type CanvasMock,
  type RenderOperation,
  type RenderOperationType
} from './CanvasMock'

// Re-export commonly used types
export type { Vector2, Rectangle } from '../../../types'
export type { 
  MapConfig, 
  TileDefinition 
} from '../../../config/maps/map-schema'
export type {
  BarrierConfig,
  HazardConfig,
  TrapConfig,
  TeleporterConfig,
  JumpPadConfig,
  EffectState,
  ArenaCallbacks
} from '../../../arena/types'

// Common test arbitraries for fast-check
import * as fc from 'fast-check'
import type { Vector2 } from '../../../types'
import type { TileType, Direction, JumpDirection, HazardType, TrapType, TrapEffect } from '../../../arena/types'

/** Generate valid arena position (within 1280x720 bounds) */
export const positionArb: fc.Arbitrary<Vector2> = fc.record({
  x: fc.integer({ min: 0, max: 1279 }),
  y: fc.integer({ min: 0, max: 719 })
})

/** Generate position inside a specific rectangle */
export function positionInBoundsArb(
  x: number, 
  y: number, 
  width: number, 
  height: number
): fc.Arbitrary<Vector2> {
  return fc.record({
    x: fc.integer({ min: Math.floor(x), max: Math.floor(x + width - 1) }),
    y: fc.integer({ min: Math.floor(y), max: Math.floor(y + height - 1) })
  })
}

/** Generate position outside a specific rectangle */
export function positionOutsideBoundsArb(
  x: number, 
  y: number, 
  width: number, 
  height: number,
  margin: number = 10
): fc.Arbitrary<Vector2> {
  return fc.oneof(
    // Left of bounds
    fc.record({
      x: fc.integer({ min: 0, max: Math.max(0, x - margin) }),
      y: fc.integer({ min: 0, max: 719 })
    }),
    // Right of bounds
    fc.record({
      x: fc.integer({ min: Math.min(1279, x + width + margin), max: 1279 }),
      y: fc.integer({ min: 0, max: 719 })
    }),
    // Above bounds
    fc.record({
      x: fc.integer({ min: 0, max: 1279 }),
      y: fc.integer({ min: 0, max: Math.max(0, y - margin) })
    }),
    // Below bounds
    fc.record({
      x: fc.integer({ min: 0, max: 1279 }),
      y: fc.integer({ min: Math.min(719, y + height + margin), max: 719 })
    })
  )
}

/** Generate valid grid coordinates */
export const gridCoordsArb = fc.record({
  gridX: fc.integer({ min: 0, max: 15 }),
  gridY: fc.integer({ min: 0, max: 8 })
})

/** Generate valid tile types */
export const tileTypeArb: fc.Arbitrary<TileType> = fc.constantFrom(
  'floor', 'wall', 'half_wall', 'hazard_damage', 'hazard_slow',
  'hazard_emp', 'trap_pressure', 'trap_timed', 'teleporter', 'jump_pad'
)

/** Generate valid directions */
export const directionArb: fc.Arbitrary<Direction> = fc.constantFrom('N', 'S', 'E', 'W')

/** Generate valid jump directions */
export const jumpDirectionArb: fc.Arbitrary<JumpDirection> = fc.constantFrom(
  'N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'
)

/** Generate valid hazard types */
export const hazardTypeArb: fc.Arbitrary<HazardType> = fc.constantFrom('damage', 'slow', 'emp')

/** Generate valid trap types */
export const trapTypeArb: fc.Arbitrary<TrapType> = fc.constantFrom('pressure', 'timed', 'projectile')

/** Generate valid trap effects */
export const trapEffectArb: fc.Arbitrary<TrapEffect> = fc.constantFrom('damage_burst', 'knockback', 'stun')

/** Generate valid player ID */
export const playerIdArb = fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/)

/** Generate small positive delta time (in seconds) */
export const deltaTimeArb = fc.float({ min: Math.fround(0.001), max: Math.fround(0.1) })

/** Generate barrier size */
export const barrierSizeArb: fc.Arbitrary<Vector2> = fc.record({
  x: fc.integer({ min: 40, max: 160 }),
  y: fc.integer({ min: 40, max: 160 })
})

/** Generate hazard intensity based on type */
export function hazardIntensityArb(type: HazardType): fc.Arbitrary<number> {
  switch (type) {
    case 'damage': return fc.integer({ min: 5, max: 25 })
    case 'slow': return fc.float({ min: Math.fround(0.25), max: Math.fround(0.75) })
    case 'emp': return fc.constant(1)
  }
}
