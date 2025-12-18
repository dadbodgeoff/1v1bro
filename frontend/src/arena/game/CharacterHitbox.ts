/**
 * CharacterHitbox - Defines hitbox dimensions for player and bot characters
 * 
 * Uses capsule collision shape (cylinder with hemispherical caps).
 * Dimensions are based on realistic human proportions scaled for gameplay.
 */

import { Capsule } from '../physics/Capsule'
import { Vector3 } from '../math/Vector3'

/**
 * Hitbox configuration for a character type
 */
export interface HitboxConfig {
  /** Capsule radius (horizontal size) */
  radius: number
  /** Total height from feet to top of head */
  height: number
  /** Eye height from feet (for first-person camera) */
  eyeHeight: number
  /** Center of mass height from feet */
  centerHeight: number
}

/**
 * Standard player hitbox - average human proportions
 * - Height: 1.8m (about 5'11")
 * - Shoulder width: ~0.45m radius gives ~0.9m diameter
 * - Eye height: 1.6m (typical for standing adult)
 */
export const PLAYER_HITBOX: HitboxConfig = {
  radius: 0.6,
  height: 1.8,
  eyeHeight: 1.6,
  centerHeight: 0.9,
}

/**
 * Bot hitbox - same as player for fair gameplay
 * Could be adjusted for different bot types (e.g., smaller/larger enemies)
 */
export const BOT_HITBOX: HitboxConfig = {
  radius: 0.6,
  height: 1.8,
  eyeHeight: 1.6,
  centerHeight: 0.9,
}

/**
 * Create a capsule hitbox at a given position
 */
export function createHitboxCapsule(
  position: Vector3,
  config: HitboxConfig = PLAYER_HITBOX
): Capsule {
  return new Capsule(position, config.radius, config.height)
}

/**
 * Get eye position from feet position
 */
export function getEyePosition(feetPosition: Vector3, config: HitboxConfig = PLAYER_HITBOX): Vector3 {
  return new Vector3(feetPosition.x, feetPosition.y + config.eyeHeight, feetPosition.z)
}

/**
 * Get center position from feet position
 */
export function getCenterPosition(feetPosition: Vector3, config: HitboxConfig = PLAYER_HITBOX): Vector3 {
  return new Vector3(feetPosition.x, feetPosition.y + config.centerHeight, feetPosition.z)
}

/**
 * Check if a point is inside a character's hitbox
 */
export function isPointInHitbox(
  point: Vector3,
  characterPosition: Vector3,
  config: HitboxConfig = PLAYER_HITBOX
): boolean {
  // Check horizontal distance
  const dx = point.x - characterPosition.x
  const dz = point.z - characterPosition.z
  const horizontalDist = Math.sqrt(dx * dx + dz * dz)
  
  if (horizontalDist > config.radius) return false
  
  // Check vertical bounds
  if (point.y < characterPosition.y || point.y > characterPosition.y + config.height) {
    return false
  }
  
  return true
}

/**
 * Raycast against a character hitbox
 * Returns hit info or null if no hit
 */
export function raycastHitbox(
  origin: Vector3,
  direction: Vector3,
  characterPosition: Vector3,
  config: HitboxConfig = PLAYER_HITBOX,
  maxDistance: number = 100
): { point: Vector3; distance: number } | null {
  // Simplified: treat as sphere at center for now
  // Full capsule raycast is in CombatSystem
  const center = getCenterPosition(characterPosition, config)
  const radius = config.radius + 0.2 // Slightly larger for hit detection
  
  const oc = origin.subtract(center)
  const dir = direction.normalize()
  const a = dir.dot(dir)
  const b = 2 * oc.dot(dir)
  const c = oc.dot(oc) - radius * radius
  const discriminant = b * b - 4 * a * c
  
  if (discriminant < 0) return null
  
  const t = (-b - Math.sqrt(discriminant)) / (2 * a)
  if (t < 0 || t > maxDistance) return null
  
  return {
    point: origin.add(dir.scale(t)),
    distance: t,
  }
}
