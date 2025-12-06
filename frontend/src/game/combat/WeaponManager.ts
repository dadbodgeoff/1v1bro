/**
 * Weapon Manager
 * Handles fire rate limiting, cooldowns, and spread calculation
 */

import { WEAPON_CONFIG, FIRE_COOLDOWN_MS } from '../config'
import type { Vector2 } from '../types'

export class WeaponManager {
  private lastFireTime = 0

  /**
   * Check if weapon can fire (cooldown elapsed)
   */
  canFire(): boolean {
    const now = Date.now()
    return now - this.lastFireTime >= FIRE_COOLDOWN_MS
  }

  /**
   * Record that a shot was fired
   */
  recordFire(): void {
    this.lastFireTime = Date.now()
  }

  /**
   * Get cooldown progress (0 = just fired, 1 = ready)
   */
  getCooldownProgress(): number {
    const now = Date.now()
    const elapsed = now - this.lastFireTime
    return Math.min(1, elapsed / FIRE_COOLDOWN_MS)
  }

  /**
   * Get time remaining until can fire (ms)
   */
  getCooldownRemaining(): number {
    const now = Date.now()
    const elapsed = now - this.lastFireTime
    return Math.max(0, FIRE_COOLDOWN_MS - elapsed)
  }

  /**
   * Apply random spread to aim direction
   */
  applySpread(direction: Vector2): Vector2 {
    const spreadRad = (WEAPON_CONFIG.spread * Math.PI) / 180
    const randomAngle = (Math.random() - 0.5) * 2 * spreadRad
    const cos = Math.cos(randomAngle)
    const sin = Math.sin(randomAngle)
    return {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos,
    }
  }

  /**
   * Reset weapon state
   */
  reset(): void {
    this.lastFireTime = 0
  }
}
