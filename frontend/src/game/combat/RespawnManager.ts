/**
 * Respawn Manager
 * Handles death timers and safe spawn point selection
 */

import { RESPAWN_CONFIG } from '../config'
import type { Vector2 } from '../types'

interface RespawnTimer {
  playerId: string
  respawnTime: number
  spawnPosition: Vector2
}

export class RespawnManager {
  private timers: Map<string, RespawnTimer> = new Map()

  /**
   * Start respawn timer for a player
   * Returns the selected spawn position
   */
  startRespawn(playerId: string, enemyPosition: Vector2 | null): Vector2 {
    const spawnPosition = this.selectSpawnPoint(enemyPosition)

    this.timers.set(playerId, {
      playerId,
      respawnTime: Date.now() + RESPAWN_CONFIG.respawnDelay,
      spawnPosition,
    })

    return spawnPosition
  }

  /**
   * Select safest spawn point (furthest from enemy)
   */
  private selectSpawnPoint(enemyPosition: Vector2 | null): Vector2 {
    if (!enemyPosition) {
      // Random spawn if no enemy
      const index = Math.floor(Math.random() * RESPAWN_CONFIG.spawnPoints.length)
      return { ...RESPAWN_CONFIG.spawnPoints[index] }
    }

    // Find spawn point furthest from enemy
    let bestSpawn = RESPAWN_CONFIG.spawnPoints[0]
    let bestDistance = 0

    for (const spawn of RESPAWN_CONFIG.spawnPoints) {
      const dx = spawn.x - enemyPosition.x
      const dy = spawn.y - enemyPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > bestDistance && distance >= RESPAWN_CONFIG.minSpawnDistance) {
        bestDistance = distance
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
