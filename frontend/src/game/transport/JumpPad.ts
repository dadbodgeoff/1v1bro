/**
 * JumpPad - Launch pad logic
 * 
 * @module transport/JumpPad
 */

import type { JumpPadState, JumpDirection } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COOLDOWN_MS = 1000  // 1 second
const DEFAULT_FORCE = 400
const LAUNCH_DURATION_MS = 400   // 0.4 seconds
const LANDING_RECOVERY_MS = 200  // 0.2 seconds

// Direction vectors (normalized)
const DIRECTION_VECTORS: Record<JumpDirection, Vector2> = {
  'N':  { x: 0, y: -1 },
  'S':  { x: 0, y: 1 },
  'E':  { x: 1, y: 0 },
  'W':  { x: -1, y: 0 },
  'NE': { x: 0.707, y: -0.707 },
  'NW': { x: -0.707, y: -0.707 },
  'SE': { x: 0.707, y: 0.707 },
  'SW': { x: -0.707, y: 0.707 }
}

// ============================================================================
// JumpPad Class
// ============================================================================

/**
 * JumpPad launches players in a configured direction
 * Requirements: 6.1, 6.2, 6.7, 6.9
 */
export class JumpPad {
  private id: string
  private position: Vector2
  private radius: number
  private direction: JumpDirection
  private force: number
  private playerCooldowns: Map<string, number> = new Map()

  /**
   * Create a new jump pad
   * 
   * @param state - Jump pad state
   */
  constructor(state: JumpPadState) {
    this.id = state.id
    this.position = { ...state.position }
    this.radius = state.radius
    this.direction = state.direction
    this.force = state.force || DEFAULT_FORCE
  }

  /**
   * Get jump pad ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get jump pad position
   */
  getPosition(): Vector2 {
    return this.position
  }

  /**
   * Get trigger radius
   */
  getRadius(): number {
    return this.radius
  }

  /**
   * Get launch direction
   */
  getDirection(): JumpDirection {
    return this.direction
  }

  /**
   * Get launch force
   */
  getForce(): number {
    return this.force
  }

  /**
   * Check if a player can be launched (not on cooldown)
   * Requirements: 6.9
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns true if player can be launched
   */
  canLaunch(playerId: string, currentTime: number): boolean {
    const cooldownEnd = this.playerCooldowns.get(playerId)
    if (cooldownEnd && currentTime < cooldownEnd) {
      return false
    }
    return true
  }

  /**
   * Check if a player is within jump pad radius
   * 
   * @param position - Player position
   * @returns true if within radius
   */
  isInRange(position: Vector2): boolean {
    const dx = position.x - this.position.x
    const dy = position.y - this.position.y
    const distSq = dx * dx + dy * dy
    return distSq <= this.radius * this.radius
  }

  /**
   * Launch a player and return velocity vector
   * Requirements: 6.1, 6.2
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns Velocity vector
   */
  launch(playerId: string, currentTime: number): Vector2 {
    this.applyCooldown(playerId, currentTime)
    return this.directionToVelocity()
  }

  /**
   * Convert direction to velocity vector
   * Requirements: 6.7
   * 
   * @returns Velocity vector with force applied
   */
  directionToVelocity(): Vector2 {
    const dir = DIRECTION_VECTORS[this.direction]
    return {
      x: dir.x * this.force,
      y: dir.y * this.force
    }
  }

  /**
   * Get direction vector (normalized)
   * 
   * @returns Normalized direction vector
   */
  getDirectionVector(): Vector2 {
    return { ...DIRECTION_VECTORS[this.direction] }
  }

  /**
   * Apply cooldown to a player
   * Requirements: 6.9
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   */
  applyCooldown(playerId: string, currentTime: number): void {
    this.playerCooldowns.set(playerId, currentTime + DEFAULT_COOLDOWN_MS)
  }

  /**
   * Get launch duration in milliseconds
   * Requirements: 6.3
   * 
   * @returns Launch duration
   */
  getLaunchDuration(): number {
    return LAUNCH_DURATION_MS
  }

  /**
   * Get landing recovery duration in milliseconds
   * Requirements: 6.6
   * 
   * @returns Landing recovery duration
   */
  getLandingRecoveryDuration(): number {
    return LANDING_RECOVERY_MS
  }

  /**
   * Estimate landing position
   * 
   * @param startPosition - Starting position
   * @returns Estimated landing position
   */
  estimateLandingPosition(startPosition: Vector2): Vector2 {
    const velocity = this.directionToVelocity()
    const duration = LAUNCH_DURATION_MS / 1000  // Convert to seconds
    
    return {
      x: startPosition.x + velocity.x * duration,
      y: startPosition.y + velocity.y * duration
    }
  }

  /**
   * Check if jump pad is on cooldown for a player
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns true if on cooldown
   */
  isOnCooldown(playerId: string, currentTime: number): boolean {
    return !this.canLaunch(playerId, currentTime)
  }

  /**
   * Clean up expired cooldowns
   * 
   * @param currentTime - Current timestamp
   */
  cleanupCooldowns(currentTime: number): void {
    for (const [playerId, cooldownEnd] of this.playerCooldowns) {
      if (currentTime >= cooldownEnd) {
        this.playerCooldowns.delete(playerId)
      }
    }
  }
}
