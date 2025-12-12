/**
 * Respawn Manager
 * Handles death timers and safe spawn point selection
 * 
 * Anti-camping: Player is immediately teleported to spawn point on death
 * to prevent spawn camping. They remain in "ghost" state until respawn completes.
 */

import { RESPAWN_CONFIG } from '../config'
import type { Vector2 } from '../types'

interface RespawnTimer {
  playerId: string
  respawnTime: number
  spawnPosition: Vector2
  /** Position where player died (for death effects) */
  deathPosition: Vector2
}

export class RespawnManager {
  private timers: Map<string, RespawnTimer> = new Map()
  /** Callback to immediately move player to spawn (anti-camping) */
  private onImmediateRespawnPosition: ((playerId: string, position: Vector2) => void) | null = null

  /**
   * Set callback for immediate position update on death
   * This teleports the player to spawn immediately to prevent camping
   */
  setImmediateRespawnCallback(callback: (playerId: string, position: Vector2) => void): void {
    this.onImmediateRespawnPosition = callback
  }

  /**
   * Start respawn timer for a player
   * Returns the selected spawn position
   * 
   * Anti-camping: Player is immediately teleported to spawn position
   */
  startRespawn(playerId: string, enemyPosition: Vector2 | null, deathPosition?: Vector2): Vector2 {
    const spawnPosition = this.selectSpawnPoint(enemyPosition, deathPosition ?? null)

    this.timers.set(playerId, {
      playerId,
      respawnTime: Date.now() + RESPAWN_CONFIG.respawnDelay,
      spawnPosition,
      deathPosition: deathPosition ?? { x: 0, y: 0 },
    })

    // Immediately teleport player to spawn position (anti-camping)
    // They'll be in ghost/invulnerable state until respawn completes
    if (this.onImmediateRespawnPosition) {
      this.onImmediateRespawnPosition(playerId, spawnPosition)
    }

    return spawnPosition
  }

  /**
   * Select safest spawn point
   * Prioritizes distance from both enemy AND death position to prevent:
   * 1. Spawn camping (enemy waiting at spawn)
   * 2. Dying near spawn and respawning in same dangerous spot
   */
  private selectSpawnPoint(enemyPosition: Vector2 | null, deathPosition: Vector2 | null): Vector2 {
    // If no positions to avoid, pick random spawn
    if (!enemyPosition && !deathPosition) {
      const index = Math.floor(Math.random() * RESPAWN_CONFIG.spawnPoints.length)
      return { ...RESPAWN_CONFIG.spawnPoints[index] }
    }

    // Score each spawn point - higher is better
    let bestSpawn = RESPAWN_CONFIG.spawnPoints[0]
    let bestScore = -Infinity

    for (const spawn of RESPAWN_CONFIG.spawnPoints) {
      let score = 0

      // Distance from enemy (most important - weight 2x)
      if (enemyPosition) {
        const dx = spawn.x - enemyPosition.x
        const dy = spawn.y - enemyPosition.y
        const enemyDist = Math.sqrt(dx * dx + dy * dy)
        
        // Penalize spawns too close to enemy
        if (enemyDist < RESPAWN_CONFIG.minSpawnDistance) {
          score -= 1000  // Heavy penalty
        } else {
          score += enemyDist * 2  // Weight enemy distance 2x
        }
      }

      // Distance from death position (avoid respawning where you died)
      if (deathPosition) {
        const dx = spawn.x - deathPosition.x
        const dy = spawn.y - deathPosition.y
        const deathDist = Math.sqrt(dx * dx + dy * dy)
        
        // Penalize spawns very close to death location
        const minDeathDistance = 200  // Don't spawn within 200px of death
        if (deathDist < minDeathDistance) {
          score -= 500  // Moderate penalty
        } else {
          score += deathDist  // Prefer spawns far from death
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestSpawn = spawn
      }
    }

    return { ...bestSpawn }
  }

  /**
   * Check if player is currently respawning
   */
  isRespawning(playerId: string): boolean {
    return this.timers.has(playerId)
  }

  /**
   * Get time remaining until respawn (ms)
   */
  getRespawnTimeRemaining(playerId: string): number {
    const timer = this.timers.get(playerId)
    if (!timer) return 0
    return Math.max(0, timer.respawnTime - Date.now())
  }

  /**
   * Get spawn position for respawning player
   */
  getSpawnPosition(playerId: string): Vector2 | null {
    return this.timers.get(playerId)?.spawnPosition ?? null
  }

  /**
   * Get death position for effects
   */
  getDeathPosition(playerId: string): Vector2 | null {
    return this.timers.get(playerId)?.deathPosition ?? null
  }

  /**
   * Check if respawn timer has completed
   */
  isRespawnReady(playerId: string): boolean {
    const timer = this.timers.get(playerId)
    if (!timer) return false
    return Date.now() >= timer.respawnTime
  }

  /**
   * Complete respawn and remove timer
   */
  completeRespawn(playerId: string): Vector2 | null {
    const timer = this.timers.get(playerId)
    if (!timer) return null

    const position = timer.spawnPosition
    this.timers.delete(playerId)
    return position
  }

  /**
   * Cancel respawn timer
   */
  cancelRespawn(playerId: string): void {
    this.timers.delete(playerId)
  }

  /**
   * Clear respawn state (for server-authoritative respawn)
   */
  clearRespawn(playerId: string): void {
    this.timers.delete(playerId)
  }

  /**
   * Reset all timers
   */
  reset(): void {
    this.timers.clear()
  }

  /**
   * Get set of all respawning player IDs (for telemetry)
   */
  getRespawningPlayers(): Set<string> {
    return new Set(this.timers.keys())
  }
}
