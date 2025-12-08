/**
 * MovingPlatform - Platforms that follow waypoint paths
 * Players standing on them move with the platform
 * 
 * @module interactive/MovingPlatform
 */

import type { Vector2 } from '../types'

// ============================================================================
// Types
// ============================================================================

export type MovementType = 'linear' | 'sine_wave' | 'circular' | 'pingpong'

export interface PlatformConfig {
  id: string
  position: Vector2
  size: Vector2
  waypoints: Vector2[]     // Path points to follow
  speed: number            // Units per second
  movementType: MovementType
  loop: boolean            // Return to start after reaching end
  pauseAtWaypoints: number // ms to pause at each waypoint
}

export interface PlatformInstance {
  id: string
  config: PlatformConfig
  position: Vector2
  currentWaypoint: number
  progress: number         // 0-1 between waypoints
  direction: 1 | -1        // For pingpong
  pauseTimer: number
  velocity: Vector2        // Current movement velocity
}

export interface PlatformCallbacks {
  onWaypointReached?: (platformId: string, waypointIndex: number) => void
  onLoopComplete?: (platformId: string) => void
}

// ============================================================================
// MovingPlatformSystem Class
// ============================================================================

export class MovingPlatformSystem {
  private platforms: Map<string, PlatformInstance> = new Map()
  private callbacks: PlatformCallbacks = {}

  constructor(callbacks?: PlatformCallbacks) {
    if (callbacks) this.callbacks = callbacks
  }


  /**
   * Add a platform
   */
  addPlatform(config: PlatformConfig): void {
    const platform: PlatformInstance = {
      id: config.id,
      config,
      position: { ...config.position },
      currentWaypoint: 0,
      progress: 0,
      direction: 1,
      pauseTimer: 0,
      velocity: { x: 0, y: 0 },
    }
    this.platforms.set(config.id, platform)
  }

  /**
   * Remove a platform
   */
  removePlatform(platformId: string): void {
    this.platforms.delete(platformId)
  }

  /**
   * Update all platforms
   */
  update(deltaTime: number): void {
    for (const platform of this.platforms.values()) {
      this.updatePlatform(platform, deltaTime)
    }
  }

  /**
   * Update a single platform
   */
  private updatePlatform(platform: PlatformInstance, deltaTime: number): void {
    const { config } = platform

    // Handle pause at waypoints
    if (platform.pauseTimer > 0) {
      platform.pauseTimer -= deltaTime * 1000
      platform.velocity = { x: 0, y: 0 }
      return
    }

    const waypoints = config.waypoints
    if (waypoints.length < 2) return

    // Get current and next waypoint
    const currentIdx = platform.currentWaypoint
    let nextIdx: number

    if (config.movementType === 'pingpong') {
      nextIdx = currentIdx + platform.direction
      if (nextIdx < 0 || nextIdx >= waypoints.length) {
        platform.direction *= -1
        nextIdx = currentIdx + platform.direction
      }
    } else {
      nextIdx = (currentIdx + 1) % waypoints.length
    }

    const start = waypoints[currentIdx]
    const end = waypoints[nextIdx]

    // Calculate distance and movement
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const travelTime = distance / config.speed

    // Update progress
    platform.progress += deltaTime / travelTime

    // Apply movement type modifiers
    let easedProgress = platform.progress
    if (config.movementType === 'sine_wave') {
      easedProgress = (1 - Math.cos(platform.progress * Math.PI)) / 2
    }

    // Calculate new position
    const prevPos = { ...platform.position }
    platform.position = {
      x: start.x + dx * easedProgress,
      y: start.y + dy * easedProgress,
    }

    // Calculate velocity for player movement
    platform.velocity = {
      x: (platform.position.x - prevPos.x) / deltaTime,
      y: (platform.position.y - prevPos.y) / deltaTime,
    }

    // Check if reached waypoint
    if (platform.progress >= 1) {
      platform.progress = 0
      platform.currentWaypoint = nextIdx
      platform.pauseTimer = config.pauseAtWaypoints

      this.callbacks.onWaypointReached?.(platform.id, nextIdx)

      // Check for loop completion
      if (nextIdx === 0 && config.loop) {
        this.callbacks.onLoopComplete?.(platform.id)
      }
    }
  }

  /**
   * Check if a player is standing on any platform
   */
  checkPlayerOnPlatform(
    playerX: number,
    playerY: number,
    playerRadius: number
  ): PlatformInstance | null {
    for (const platform of this.platforms.values()) {
      const { config, position } = platform
      
      // Check if player's feet are on the platform
      const feetY = playerY + playerRadius
      const platformTop = position.y
      const platformLeft = position.x
      const platformRight = position.x + config.size.x
      
      // Check horizontal bounds
      if (playerX < platformLeft || playerX > platformRight) continue
      
      // Check if feet are near platform top
      const tolerance = 5
      if (Math.abs(feetY - platformTop) < tolerance) {
        return platform
      }
    }
    return null
  }

  /**
   * Get a platform by ID
   */
  getPlatform(platformId: string): PlatformInstance | undefined {
    return this.platforms.get(platformId)
  }

  /**
   * Get all platforms
   */
  getAllPlatforms(): PlatformInstance[] {
    return Array.from(this.platforms.values())
  }

  /**
   * Clear all platforms
   */
  clear(): void {
    this.platforms.clear()
  }
}


// ============================================================================
// Server Sync Methods
// ============================================================================

/**
 * Apply server state to sync platforms
 * Called when receiving platform state from server
 */
export function applyServerPlatformState(
  platformSystem: MovingPlatformSystem,
  serverState: Array<{
    id: string
    x: number
    y: number
    current_waypoint: number
    progress: number
    velocity_x: number
    velocity_y: number
  }>
): void {
  for (const serverPlatform of serverState) {
    const platform = platformSystem.getPlatform(serverPlatform.id)
    if (platform) {
      // Interpolate position for smooth movement
      const lerpFactor = 0.3
      platform.position.x += (serverPlatform.x - platform.position.x) * lerpFactor
      platform.position.y += (serverPlatform.y - platform.position.y) * lerpFactor
      platform.currentWaypoint = serverPlatform.current_waypoint
      platform.progress = serverPlatform.progress
      platform.velocity.x = serverPlatform.velocity_x
      platform.velocity.y = serverPlatform.velocity_y
    }
  }
}
