/**
 * Power-Up Manager
 * Handles power-up spawning logic for fair, balanced gameplay
 * 
 * Rules:
 * - 4 power-ups per game (SOS, Time Steal, Shield, Double Points)
 * - Each power-up appears exactly once per 15-round match
 * - Only 1 power-up active at a time
 * - Spawns at fair, equidistant locations
 * - Random rounds selected at game start
 */

import { POWERUP_SPAWN_POSITIONS } from '../config'
import type { PowerUpState, PowerUpType, Vector2 } from '../types'

const POWER_UP_TYPES: PowerUpType[] = ['sos', 'time_steal', 'shield', 'double_points']

export interface PowerUpSchedule {
  round: number
  type: PowerUpType
  position: Vector2
}

export class PowerUpManager {
  private schedule: PowerUpSchedule[] = []
  private activePowerUp: PowerUpState | null = null
  private collectedTypes: Set<PowerUpType> = new Set()

  constructor() {
    this.generateSchedule()
  }

  /**
   * Generate random schedule for power-up spawns
   * Spreads 4 power-ups across 15 rounds fairly
   */
  private generateSchedule(): void {
    // Select 4 random rounds from 1-15, spread across the game
    // Divide game into 4 segments and pick one round from each
    const segments = [
      [2, 3, 4],      // Early game (rounds 2-4)
      [5, 6, 7],      // Early-mid (rounds 5-7)
      [8, 9, 10],     // Mid-late (rounds 8-10)
      [11, 12, 13],   // Late game (rounds 11-13)
    ]

    const selectedRounds: number[] = segments.map(
      (segment) => segment[Math.floor(Math.random() * segment.length)]
    )

    // Shuffle power-up types
    const shuffledTypes = [...POWER_UP_TYPES].sort(() => Math.random() - 0.5)

    // Shuffle spawn positions
    const shuffledPositions = [...POWERUP_SPAWN_POSITIONS].sort(() => Math.random() - 0.5)

    // Create schedule
    this.schedule = selectedRounds.map((round, index) => ({
      round,
      type: shuffledTypes[index],
      position: shuffledPositions[index % shuffledPositions.length],
    }))

    // Sort by round
    this.schedule.sort((a, b) => a.round - b.round)
  }

  /**
   * Reset for a new game
   */
  reset(): void {
    this.activePowerUp = null
    this.collectedTypes.clear()
    this.generateSchedule()
  }

  /**
   * Called when a new round starts
   * Returns the power-up to spawn (if any)
   */
  onRoundStart(roundNumber: number): PowerUpState | null {
    this.activePowerUp = null

    // Check if this round has a scheduled power-up
    const scheduled = this.schedule.find((s) => s.round === roundNumber)

    if (scheduled && !this.collectedTypes.has(scheduled.type)) {
      this.activePowerUp = {
        id: roundNumber,
        position: { ...scheduled.position },
        type: scheduled.type,
        active: true,
        collected: false,
      }
      return this.activePowerUp
    }

    return null
  }

  /**
   * Called when a power-up is collected
   */
  onCollect(type: PowerUpType): void {
    this.collectedTypes.add(type)
    this.activePowerUp = null
  }

  /**
   * Get current active power-up (if any)
   */
  getActivePowerUp(): PowerUpState | null {
    return this.activePowerUp
  }

  /**
   * Get all power-ups as array for rendering
   * Returns empty array or single-item array
   */
  getPowerUpsForRender(): PowerUpState[] {
    return this.activePowerUp ? [this.activePowerUp] : []
  }

  /**
   * Check if a specific power-up type has been used
   */
  isTypeUsed(type: PowerUpType): boolean {
    return this.collectedTypes.has(type)
  }

  /**
   * Get remaining power-ups count
   */
  getRemainingCount(): number {
    return POWER_UP_TYPES.length - this.collectedTypes.size
  }

  /**
   * Get the schedule (for debugging/UI)
   */
  getSchedule(): PowerUpSchedule[] {
    return [...this.schedule]
  }

  /**
   * Apply server-authoritative power-up state
   * SERVER AUTHORITY: Sync client state with server
   * Requirements: 6.2
   * 
   * @param serverState - Array of power-up states from server
   */
  applyServerState(serverState: Array<{
    id: string
    x: number
    y: number
    type: string
    radius: number
    is_active: boolean
  }>): void {
    // Find active power-ups from server
    const activeServerPowerups = serverState.filter(p => p.is_active)
    
    if (activeServerPowerups.length > 0) {
      const serverPowerup = activeServerPowerups[0]
      
      // Update or create active power-up
      if (this.activePowerUp) {
        // Update existing
        this.activePowerUp.position = { x: serverPowerup.x, y: serverPowerup.y }
        this.activePowerUp.type = serverPowerup.type as PowerUpType
        this.activePowerUp.active = true
        this.activePowerUp.collected = false
      } else {
        // Create new from server state
        this.activePowerUp = {
          id: parseInt(serverPowerup.id.replace(/\D/g, '')) || Date.now(),
          position: { x: serverPowerup.x, y: serverPowerup.y },
          type: serverPowerup.type as PowerUpType,
          active: true,
          collected: false,
        }
      }
    } else {
      // No active power-ups on server
      this.activePowerUp = null
    }
  }

  /**
   * Handle server power-up spawn event
   * SERVER AUTHORITY: Spawn power-up from server
   * 
   * @param id - Power-up ID
   * @param x - X position
   * @param y - Y position
   * @param type - Power-up type
   */
  applyServerSpawn(id: string, x: number, y: number, type: string): void {
    this.activePowerUp = {
      id: parseInt(id.replace(/\D/g, '')) || Date.now(),
      position: { x, y },
      type: type as PowerUpType,
      active: true,
      collected: false,
    }
  }

  /**
   * Handle server power-up collection event
   * SERVER AUTHORITY: Mark power-up as collected
   * 
   * @param _id - Power-up ID (unused, for API consistency)
   * @param type - Power-up type
   * @param _playerId - Player who collected (unused, for API consistency)
   */
  applyServerCollection(_id: string, type: string, _playerId: string): void {
    this.collectedTypes.add(type as PowerUpType)
    this.activePowerUp = null
  }
}

// Singleton instance for easy access
export const powerUpManager = new PowerUpManager()
