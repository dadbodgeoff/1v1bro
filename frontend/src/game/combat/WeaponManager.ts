/**
 * Weapon Manager - AAA Enterprise Grade
 * Handles fire rate limiting, cooldowns, and spread calculation
 *
 * Features:
 * - Seeded random spread for server reconciliation
 * - Fire rate validation with tolerance
 * - Fire history for anti-cheat validation
 */

import { WEAPON_CONFIG, FIRE_COOLDOWN_MS, SERVER_VALIDATION_CONFIG } from '../config'
import type { Vector2 } from '../types'

/** Fire event for history tracking */
interface FireRecord {
  timestamp: number
  sequence: number
  spreadSeed: number
}

export class WeaponManager {
  private lastFireTime = 0
  private fireSequence = 0
  private fireHistory: FireRecord[] = []
  private readonly MAX_FIRE_HISTORY = 30

  // Seeded random for deterministic spread (server can verify)
  private spreadSeed = 0

  /**
   * Check if weapon can fire (cooldown elapsed)
   */
  canFire(): boolean {
    const now = Date.now()
    return now - this.lastFireTime >= FIRE_COOLDOWN_MS
  }

  /**
   * Validate fire rate (for server-side anti-cheat)
   * Returns true if fire rate is within acceptable bounds
   */
  validateFireRate(timestamp: number): boolean {
    if (this.fireHistory.length === 0) return true

    const lastFire = this.fireHistory[this.fireHistory.length - 1]
    const elapsed = timestamp - lastFire.timestamp
    const minAllowed = FIRE_COOLDOWN_MS - SERVER_VALIDATION_CONFIG.fireRateTolerance

    return elapsed >= minAllowed
  }

  /**
   * Record that a shot was fired
   * Returns the fire record for server validation
   */
  recordFire(): FireRecord {
    const now = Date.now()
    this.lastFireTime = now
    this.fireSequence++
    this.spreadSeed = Math.floor(Math.random() * 1000000)

    const record: FireRecord = {
      timestamp: now,
      sequence: this.fireSequence,
      spreadSeed: this.spreadSeed,
    }

    this.fireHistory.push(record)

    // Trim old history
    while (this.fireHistory.length > this.MAX_FIRE_HISTORY) {
      this.fireHistory.shift()
    }

    return record
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
   * Apply random spread to aim direction (client-side)
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
   * Apply deterministic spread using seed (for server reconciliation)
   * Server can use same seed to verify client's spread calculation
   */
  applySeededSpread(direction: Vector2, seed: number): Vector2 {
    // Simple seeded random using seed
    const seededRandom = this.seededRandom(seed)
    const spreadRad = (WEAPON_CONFIG.spread * Math.PI) / 180
    const randomAngle = (seededRandom - 0.5) * 2 * spreadRad
    const cos = Math.cos(randomAngle)
    const sin = Math.sin(randomAngle)
    return {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos,
    }
  }

  /**
   * Simple seeded random number generator (0-1)
   * Uses mulberry32 algorithm for deterministic results
   */
  private seededRandom(seed: number): number {
    let t = (seed + 0x6d2b79f5) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Get current spread seed (for sending to server)
   */
  getSpreadSeed(): number {
    return this.spreadSeed
  }

  /**
   * Get current fire sequence
   */
  getFireSequence(): number {
    return this.fireSequence
  }

  /**
   * Get fire history for validation
   */
  getFireHistory(): readonly FireRecord[] {
    return this.fireHistory
  }

  /**
   * Reset weapon state
   */
  reset(): void {
    this.lastFireTime = 0
    this.fireSequence = 0
    this.fireHistory = []
    this.spreadSeed = 0
  }
}
