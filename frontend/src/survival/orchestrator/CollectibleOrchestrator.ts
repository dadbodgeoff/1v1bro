/**
 * CollectibleOrchestrator - Spawns collectibles in patterns that coordinate with obstacles
 * Ensures gems appear in safe lanes but require skill to collect
 */

import type { CollectibleSpawnRequest, CollectiblePattern, Lane } from '../types/survival'
import type { SpawnRequest } from './types'

// Collectible patterns - various formations
const PATTERNS: CollectiblePattern[] = [
  // Single line in center
  {
    id: 'line_center',
    name: 'Center Line',
    placements: [
      { lane: 0, offsetZ: 0 },
      { lane: 0, offsetZ: -3 },
      { lane: 0, offsetZ: -6 },
      { lane: 0, offsetZ: -9 },
      { lane: 0, offsetZ: -12 },
    ],
    length: 15,
  },
  // Diagonal left to right
  {
    id: 'diagonal_lr',
    name: 'Diagonal L-R',
    placements: [
      { lane: -1, offsetZ: 0 },
      { lane: 0, offsetZ: -3 },
      { lane: 1, offsetZ: -6 },
    ],
    length: 9,
  },
  // Diagonal right to left
  {
    id: 'diagonal_rl',
    name: 'Diagonal R-L',
    placements: [
      { lane: 1, offsetZ: 0 },
      { lane: 0, offsetZ: -3 },
      { lane: -1, offsetZ: -6 },
    ],
    length: 9,
  },
  // Arc pattern (jump arc)
  {
    id: 'arc_jump',
    name: 'Jump Arc',
    placements: [
      { lane: 0, offsetZ: 0, y: 1.0 },
      { lane: 0, offsetZ: -2, y: 2.0 },
      { lane: 0, offsetZ: -4, y: 2.5 },
      { lane: 0, offsetZ: -6, y: 2.0 },
      { lane: 0, offsetZ: -8, y: 1.0 },
    ],
    length: 10,
  },
  // Zigzag
  {
    id: 'zigzag',
    name: 'Zigzag',
    placements: [
      { lane: -1, offsetZ: 0 },
      { lane: 1, offsetZ: -4 },
      { lane: -1, offsetZ: -8 },
      { lane: 1, offsetZ: -12 },
    ],
    length: 15,
  },
  // All three lanes
  {
    id: 'triple_row',
    name: 'Triple Row',
    placements: [
      { lane: -1, offsetZ: 0 },
      { lane: 0, offsetZ: 0 },
      { lane: 1, offsetZ: 0 },
    ],
    length: 3,
  },
  // Left lane line
  {
    id: 'line_left',
    name: 'Left Line',
    placements: [
      { lane: -1, offsetZ: 0 },
      { lane: -1, offsetZ: -3 },
      { lane: -1, offsetZ: -6 },
    ],
    length: 9,
  },
  // Right lane line
  {
    id: 'line_right',
    name: 'Right Line',
    placements: [
      { lane: 1, offsetZ: 0 },
      { lane: 1, offsetZ: -3 },
      { lane: 1, offsetZ: -6 },
    ],
    length: 9,
  },
]

interface ObstacleZone {
  z: number
  lane: Lane
  type: string
}

export class CollectibleOrchestrator {
  private nextSpawnZ: number = -60
  private lastPatternId: string | null = null
  private spawnInterval: number = 25 // Base distance between patterns
  private minSpawnInterval: number = 15

  // Track recent obstacle positions to avoid
  private recentObstacles: ObstacleZone[] = []
  private readonly OBSTACLE_BUFFER = 8 // Min distance from obstacles

  constructor() {}

  /**
   * Update with current game state and recent obstacles
   * Returns spawn requests for collectibles
   */
  update(
    playerZ: number,
    _currentSpeed: number,
    recentObstacleSpawns: SpawnRequest[]
  ): CollectibleSpawnRequest[] {
    // Track obstacle positions
    this.updateObstacleZones(recentObstacleSpawns, playerZ)

    const spawnThreshold = playerZ - 80
    const requests: CollectibleSpawnRequest[] = []

    while (this.nextSpawnZ > spawnThreshold) {
      const pattern = this.selectPattern()
      if (!pattern) break

      // Find safe position for pattern
      const safeZ = this.findSafeSpawnZ(this.nextSpawnZ, pattern)
      
      // Create spawn requests
      for (const placement of pattern.placements) {
        // Check if this specific placement is safe
        if (this.isPlacementSafe(safeZ + placement.offsetZ, placement.lane)) {
          requests.push({
            type: 'gem',
            lane: placement.lane,
            z: safeZ + placement.offsetZ,
            y: placement.y,
            patternId: pattern.id,
          })
        }
      }

      // Calculate next spawn position with some randomness
      const interval = this.spawnInterval + (Math.random() - 0.5) * 10
      this.nextSpawnZ = safeZ - pattern.length - Math.max(this.minSpawnInterval, interval)
      this.lastPatternId = pattern.id
    }

    return requests
  }

  /**
   * Track obstacle positions to avoid spawning gems in kill zones
   */
  private updateObstacleZones(spawns: SpawnRequest[], playerZ: number): void {
    // Add new obstacles
    for (const spawn of spawns) {
      this.recentObstacles.push({
        z: spawn.z,
        lane: spawn.lane,
        type: spawn.type,
      })
    }

    // Remove old obstacles (behind player)
    this.recentObstacles = this.recentObstacles.filter(o => o.z < playerZ + 20)
  }

  /**
   * Find a safe Z position for spawning (away from obstacles)
   */
  private findSafeSpawnZ(targetZ: number, pattern: CollectiblePattern): number {
    let safeZ = targetZ

    // Check if any obstacle conflicts with pattern
    for (const obstacle of this.recentObstacles) {
      const patternStart = safeZ
      const patternEnd = safeZ - pattern.length

      // If obstacle is within pattern range, shift pattern
      if (obstacle.z <= patternStart + this.OBSTACLE_BUFFER && 
          obstacle.z >= patternEnd - this.OBSTACLE_BUFFER) {
        // Move pattern further ahead
        safeZ = obstacle.z - pattern.length - this.OBSTACLE_BUFFER
      }
    }

    return safeZ
  }

  /**
   * Check if a specific placement is safe from obstacles
   */
  private isPlacementSafe(z: number, lane: Lane): boolean {
    for (const obstacle of this.recentObstacles) {
      const zDistance = Math.abs(obstacle.z - z)
      const sameLane = obstacle.lane === lane

      // If same lane and too close, not safe
      if (sameLane && zDistance < this.OBSTACLE_BUFFER) {
        return false
      }

      // For wide obstacles (highBarrier, lowBarrier), check all lanes
      if ((obstacle.type === 'highBarrier' || obstacle.type === 'lowBarrier') && 
          zDistance < this.OBSTACLE_BUFFER) {
        return false
      }
    }
    return true
  }

  /**
   * Select a pattern (avoid repeating)
   */
  private selectPattern(): CollectiblePattern | null {
    const available = PATTERNS.filter(p => p.id !== this.lastPatternId)
    if (available.length === 0) return PATTERNS[0]
    
    const index = Math.floor(Math.random() * available.length)
    return available[index]
  }

  /**
   * Adjust spawn frequency based on difficulty
   */
  setSpawnFrequency(frequency: 'low' | 'medium' | 'high'): void {
    switch (frequency) {
      case 'low':
        this.spawnInterval = 35
        break
      case 'medium':
        this.spawnInterval = 25
        break
      case 'high':
        this.spawnInterval = 18
        break
    }
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.nextSpawnZ = -60
    this.lastPatternId = null
    this.recentObstacles = []
  }

  /**
   * Get debug info
   */
  getDebugInfo(): object {
    return {
      nextSpawnZ: this.nextSpawnZ,
      lastPattern: this.lastPatternId,
      trackedObstacles: this.recentObstacles.length,
      spawnInterval: this.spawnInterval,
    }
  }
}
