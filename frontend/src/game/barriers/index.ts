/**
 * Barriers Module Exports
 * @module barriers
 */

export { BarrierManager } from './BarrierManager'
export { DestructibleBarrier } from './DestructibleBarrier'
export type { DamageResult } from './DestructibleBarrier'
export { OneWayBarrier } from './OneWayBarrier'
export {
  DAMAGE_THRESHOLDS,
  BARRIER_HEALTH,
  BARRIER_COLLISION,
  getDamageState,
  blocksMovement,
  blocksProjectiles,
  clampHealth,
  isValidHealth
} from './BarrierTypes'
