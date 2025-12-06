/**
 * Barrier Type Constants and Utilities
 * Defines barrier type constants and damage state thresholds
 * 
 * @module barriers/BarrierTypes
 */

import type { BarrierType, DamageState } from '../arena/types'

// ============================================================================
// Damage State Thresholds
// ============================================================================

/**
 * Health percentage thresholds for damage states
 * Requirements: 2.4
 * - intact: 100-67% HP
 * - cracked: 66-34% HP
 * - damaged: 33-1% HP
 * - destroyed: 0 HP
 */
export const DAMAGE_THRESHOLDS = {
  INTACT_MIN: 0.67,      // 67% and above
  CRACKED_MIN: 0.34,     // 34% to 66%
  DAMAGED_MIN: 0.01,     // 1% to 33%
  DESTROYED: 0           // 0%
} as const

// ============================================================================
// Barrier Health Limits
// ============================================================================

/**
 * Health limits for destructible barriers
 * Requirements: 2.3
 */
export const BARRIER_HEALTH = {
  DEFAULT: 100,
  MIN: 50,
  MAX: 200
} as const

// ============================================================================
// Collision Behavior
// ============================================================================

/**
 * Collision behavior per barrier type
 * Requirements: 2.1, 2.2
 */
export const BARRIER_COLLISION = {
  full: {
    blocksMovement: true,
    blocksProjectiles: true
  },
  half: {
    blocksMovement: true,
    blocksProjectiles: false  // Projectiles pass over
  },
  destructible: {
    blocksMovement: true,
    blocksProjectiles: true
  },
  one_way: {
    blocksMovement: true,     // Conditional based on direction
    blocksProjectiles: true
  }
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get damage state based on health percentage
 * Requirements: 2.4
 * 
 * @param health - Current health
 * @param maxHealth - Maximum health
 * @returns DamageState
 */
export function getDamageState(health: number, maxHealth: number): DamageState {
  if (health <= 0) return 'destroyed'
  
  const percentage = health / maxHealth
  
  if (percentage >= DAMAGE_THRESHOLDS.INTACT_MIN) return 'intact'
  if (percentage >= DAMAGE_THRESHOLDS.CRACKED_MIN) return 'cracked'
  if (percentage >= DAMAGE_THRESHOLDS.DAMAGED_MIN) return 'damaged'
  
  return 'destroyed'
}

/**
 * Check if a barrier type blocks movement
 * 
 * @param type - Barrier type
 * @returns true if barrier blocks movement
 */
export function blocksMovement(type: BarrierType): boolean {
  return BARRIER_COLLISION[type].blocksMovement
}

/**
 * Check if a barrier type blocks projectiles
 * 
 * @param type - Barrier type
 * @returns true if barrier blocks projectiles
 */
export function blocksProjectiles(type: BarrierType): boolean {
  return BARRIER_COLLISION[type].blocksProjectiles
}

/**
 * Clamp health value to valid range
 * 
 * @param health - Health value to clamp
 * @returns Clamped health value
 */
export function clampHealth(health: number): number {
  return Math.max(0, Math.min(health, BARRIER_HEALTH.MAX))
}

/**
 * Validate health value for destructible barrier
 * 
 * @param health - Health value to validate
 * @returns true if health is within valid range
 */
export function isValidHealth(health: number): boolean {
  return health >= BARRIER_HEALTH.MIN && health <= BARRIER_HEALTH.MAX
}
