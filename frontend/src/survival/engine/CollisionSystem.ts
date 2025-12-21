/**
 * CollisionSystem - Enterprise-grade collision detection for Survival Mode
 * Handles player-obstacle collisions with AABB and spatial partitioning
 * 
 * Mobile-optimized: Uses dynamic config for lane width calculations
 */

import * as THREE from 'three'
import type { Lane, ObstacleType } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { getMobileConfig } from '../config/mobile'
import { WorldConfig } from '../config/WorldConfig'

// Collision box definition
export interface CollisionBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

// Collision result
export interface CollisionResult {
  collided: boolean
  obstacleId: string | null
  obstacleType: ObstacleType | null
  penetrationDepth: number
  normal: THREE.Vector3 | null
  nearMiss: boolean // AAA Feature: Near-miss detection
  nearMissDistance: number // How close the near-miss was
}

// Collidable object interface
export interface Collidable {
  id: string
  type: ObstacleType
  getCollisionBox(): CollisionBox
  lane: Lane
  z: number
}

// Player collision state
export interface PlayerCollisionState {
  box: CollisionBox
  lane: Lane
  isJumping: boolean
  isSliding: boolean
  jumpHeight: number
  slideHeight: number
}

export class CollisionSystem {
  // Collision tuning - uses mobile config for device-specific tolerance
  private collisionTolerance: number = 0.2
  private readonly SLIDE_HEIGHT_RATIO: number = 0.4 // Slide reduces height to 40%

  // AAA Feature: Near-miss detection
  private readonly NEAR_MISS_THRESHOLD: number = 0.8 // Distance to count as near-miss
  private nearMissCallback: ((distance: number, obstacleType: ObstacleType) => void) | null = null

  // AAA Feature: Swept collision for high-speed tunneling prevention
  private previousPlayerZ: number = 0
  private readonly SWEPT_COLLISION_THRESHOLD: number = 2.0 // Speed threshold to enable swept collision

  // Invincibility
  private invincibilityTimer: number = 0
  private readonly INVINCIBILITY_DURATION: number = 1.5 // seconds

  // Config (from dynamic config)
  private laneWidth: number

  constructor() {
    const config = getSurvivalConfig()
    const mobileConfig = getMobileConfig()
    this.laneWidth = config.laneWidth
    // Use device-specific hitbox tolerance (mobile is more forgiving)
    this.collisionTolerance = mobileConfig.balance.hitboxTolerance
  }

  /**
   * Update invincibility timer
   */
  update(delta: number): void {
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= delta
    }
  }

  /**
   * Check if player is currently invincible
   */
  isInvincible(): boolean {
    return this.invincibilityTimer > 0
  }

  /**
   * Trigger invincibility (after taking damage)
   */
  triggerInvincibility(): void {
    this.invincibilityTimer = this.INVINCIBILITY_DURATION
  }

  /**
   * Get invincibility progress (0-1, for visual feedback)
   */
  getInvincibilityProgress(): number {
    return Math.max(0, this.invincibilityTimer / this.INVINCIBILITY_DURATION)
  }

  /**
   * Create player collision box based on current state
   * Uses actual Y position from physics (includes jump height)
   * Reads player dimensions from WorldConfig
   */
  createPlayerBox(
    x: number,
    y: number,
    z: number,
    _isJumping: boolean,
    isSliding: boolean
  ): CollisionBox {
    // Read player dimensions from WorldConfig
    const playerDimensions = WorldConfig.getInstance().getPlayerDimensions()
    const halfWidth = playerDimensions.width / 2
    const halfDepth = playerDimensions.depth / 2

    // Adjust height based on state
    let height = playerDimensions.height

    if (isSliding) {
      // Sliding reduces collision height significantly
      // CRITICAL: Cap at 0.7m to ensure player fits under highBarrier
      // The barrier minY is 1.0 above track, but player feet are ~0.3 above track
      // So player maxY when sliding must be < 1.0 + trackSurface
      // With feet at ~0.3, height of 0.7 gives maxY of ~1.0 which just clears
      height = Math.min(playerDimensions.height * this.SLIDE_HEIGHT_RATIO, 0.7)
    }

    // Y position already includes jump height from physics
    // No need to add offset here - physics handles vertical position
    return {
      minX: x - halfWidth,
      maxX: x + halfWidth,
      minY: y, // Feet position
      maxY: y + height, // Top of head
      minZ: z - halfDepth,
      maxZ: z + halfDepth,
    }
  }

  /**
   * AABB intersection test
   */
  private boxesIntersect(a: CollisionBox, b: CollisionBox): boolean {
    return (
      a.minX <= b.maxX + this.collisionTolerance &&
      a.maxX >= b.minX - this.collisionTolerance &&
      a.minY <= b.maxY + this.collisionTolerance &&
      a.maxY >= b.minY - this.collisionTolerance &&
      a.minZ <= b.maxZ + this.collisionTolerance &&
      a.maxZ >= b.minZ - this.collisionTolerance
    )
  }

  /**
   * Calculate penetration depth for collision response
   */
  private calculatePenetration(a: CollisionBox, b: CollisionBox): number {
    const overlapX = Math.min(a.maxX - b.minX, b.maxX - a.minX)
    const overlapY = Math.min(a.maxY - b.minY, b.maxY - a.minY)
    const overlapZ = Math.min(a.maxZ - b.minZ, b.maxZ - a.minZ)
    return Math.min(overlapX, overlapY, overlapZ)
  }

  /**
   * Check collision between player and a single obstacle
   * Includes AAA near-miss detection
   */
  checkObstacleCollision(
    playerX: number,
    playerY: number,
    playerZ: number,
    isJumping: boolean,
    isSliding: boolean,
    obstacle: Collidable
  ): CollisionResult {
    // Skip if invincible
    if (this.isInvincible()) {
      return { collided: false, obstacleId: null, obstacleType: null, penetrationDepth: 0, normal: null, nearMiss: false, nearMissDistance: 0 }
    }

    const playerBox = this.createPlayerBox(playerX, playerY, playerZ, isJumping, isSliding)
    // Use obstacle's actual collision box (which accounts for Y offset)
    const obstacleBox = obstacle.getCollisionBox()

    if (this.boxesIntersect(playerBox, obstacleBox)) {
      // Special handling for different obstacle types
      switch (obstacle.type) {
        case 'highBarrier':
          // High barrier - must slide under (obstacle starts above ground)
          // When sliding, player height is reduced so they fit under
          if (isSliding) {
            // Player is sliding - check if they fit under
            if (playerBox.maxY < obstacleBox.minY) {
              // AAA: Near-miss detection - barely ducked
              const headroom = obstacleBox.minY - playerBox.maxY
              if (headroom < this.NEAR_MISS_THRESHOLD) {
                this.triggerNearMiss(headroom, obstacle.type)
                return { ...this.noCollisionResult, nearMiss: true, nearMissDistance: headroom }
              }
              return this.noCollisionResult
            }
          }
          // Not sliding or didn't fit under - collision!
          break

        case 'lowBarrier':
          // Low barrier - MUST jump over (spans all lanes, no dodging allowed)
          // Player Y is feet position, check if feet clear the obstacle top
          // Must be clearly above the obstacle (no tolerance - strict check)
          if (playerBox.minY >= obstacleBox.maxY) {
            // Player cleared the obstacle (feet at or above obstacle top)
            // AAA: Near-miss detection - barely cleared
            const clearance = playerBox.minY - obstacleBox.maxY
            if (clearance < this.NEAR_MISS_THRESHOLD && clearance >= 0) {
              this.triggerNearMiss(clearance, obstacle.type)
              return { ...this.noCollisionResult, nearMiss: true, nearMissDistance: clearance }
            }
            return this.noCollisionResult
          }
          // Player didn't clear - collision! (no X check - spans all lanes)
          break
          
        case 'spikes':
          // Spikes - can dodge left/right OR jump over
          // Check X dodge first (player to the side of spikes)
          if (playerBox.maxX < obstacleBox.minX || playerBox.minX > obstacleBox.maxX) {
            // Player is to the side of the spikes - safe!
            const dodgeMargin = Math.min(
              Math.abs(playerBox.maxX - obstacleBox.minX),
              Math.abs(playerBox.minX - obstacleBox.maxX)
            )
            if (dodgeMargin < this.NEAR_MISS_THRESHOLD) {
              this.triggerNearMiss(dodgeMargin, obstacle.type)
              return { ...this.noCollisionResult, nearMiss: true, nearMissDistance: dodgeMargin }
            }
            return this.noCollisionResult
          }
          // Check Y jump (player jumped over spikes)
          if (playerBox.minY >= obstacleBox.maxY) {
            // Player jumped over the spikes - safe!
            const clearance = playerBox.minY - obstacleBox.maxY
            if (clearance < this.NEAR_MISS_THRESHOLD && clearance >= 0) {
              this.triggerNearMiss(clearance, obstacle.type)
              return { ...this.noCollisionResult, nearMiss: true, nearMissDistance: clearance }
            }
            return this.noCollisionResult
          }
          // Player is in the spike zone and not high enough - collision!
          break

        case 'laneBarrier':
          // Must be in different lane - check X position more strictly
          const playerLaneX = playerX
          const obstacleLaneX = obstacle.lane * this.laneWidth
          const xDistance = Math.abs(playerLaneX - obstacleLaneX)
          if (xDistance > this.laneWidth * 0.6) {
            // Player dodged to different lane
            // AAA: Near-miss detection - barely dodged
            const dodgeMargin = xDistance - this.laneWidth * 0.5
            if (dodgeMargin < this.NEAR_MISS_THRESHOLD) {
              this.triggerNearMiss(dodgeMargin, obstacle.type)
              return { ...this.noCollisionResult, nearMiss: true, nearMissDistance: dodgeMargin }
            }
            return this.noCollisionResult
          }
          // Player in same lane - collision!
          break

        case 'knowledgeGate':
          // Always triggers (not a damaging collision)
          return {
            collided: true,
            obstacleId: obstacle.id,
            obstacleType: 'knowledgeGate',
            penetrationDepth: 0,
            normal: null,
            nearMiss: false,
            nearMissDistance: 0,
          }
      }

      return {
        collided: true,
        obstacleId: obstacle.id,
        obstacleType: obstacle.type,
        penetrationDepth: this.calculatePenetration(playerBox, obstacleBox),
        normal: this.reusableNormal, // Reuse vector
        nearMiss: false,
        nearMissDistance: 0,
      }
    }

    // AAA: Check for near-miss even when no collision (passed close by)
    const nearMissResult = this.checkNearMiss(playerBox, obstacleBox, obstacle.type, playerZ, obstacle.z)
    if (nearMissResult.nearMiss) {
      return nearMissResult
    }

    return this.noCollisionResult
  }

  /**
   * AAA Feature: Check for near-miss (close call without collision)
   */
  private checkNearMiss(
    playerBox: CollisionBox,
    obstacleBox: CollisionBox,
    obstacleType: ObstacleType,
    playerZ: number,
    obstacleZ: number
  ): CollisionResult {
    // Only check if we just passed the obstacle (Z-wise)
    const justPassed = this.previousPlayerZ > obstacleZ && playerZ <= obstacleZ
    if (!justPassed) {
      return this.noCollisionResult
    }

    // Calculate closest distance in X and Y
    const xOverlap = Math.min(playerBox.maxX, obstacleBox.maxX) - Math.max(playerBox.minX, obstacleBox.minX)
    const yOverlap = Math.min(playerBox.maxY, obstacleBox.maxY) - Math.max(playerBox.minY, obstacleBox.minY)

    // If there was X and Y overlap but no Z collision, it was a near-miss
    if (xOverlap > -this.NEAR_MISS_THRESHOLD && yOverlap > -this.NEAR_MISS_THRESHOLD) {
      const closestDistance = Math.min(
        Math.abs(xOverlap) < 0 ? -xOverlap : 0,
        Math.abs(yOverlap) < 0 ? -yOverlap : 0
      )
      
      if (closestDistance < this.NEAR_MISS_THRESHOLD) {
        this.triggerNearMiss(closestDistance, obstacleType)
        return {
          ...this.noCollisionResult,
          nearMiss: true,
          nearMissDistance: closestDistance,
        }
      }
    }

    return this.noCollisionResult
  }

  /**
   * AAA Feature: Trigger near-miss callback
   */
  private triggerNearMiss(distance: number, obstacleType: ObstacleType): void {
    if (this.nearMissCallback) {
      this.nearMissCallback(distance, obstacleType)
    }
  }

  // Reusable no-collision result
  private noCollisionResult: CollisionResult = {
    collided: false,
    obstacleId: null,
    obstacleType: null,
    penetrationDepth: 0,
    normal: null,
    nearMiss: false,
    nearMissDistance: 0,
  }

  // Reusable arrays and objects to avoid GC pressure
  private collisionResults: CollisionResult[] = []
  private reusableNormal: THREE.Vector3 = new THREE.Vector3(0, 0, 1)

  /**
   * Check collisions against multiple obstacles (spatial query)
   * AAA Feature: Includes swept collision for high-speed tunneling prevention
   * Reuses internal array to avoid allocations
   */
  checkAllCollisions(
    playerX: number,
    playerY: number,
    playerZ: number,
    isJumping: boolean,
    isSliding: boolean,
    obstacles: Collidable[]
  ): CollisionResult[] {
    this.collisionResults.length = 0
    
    // Calculate movement delta for swept collision
    const movementDelta = Math.abs(playerZ - this.previousPlayerZ)
    const useSweptCollision = movementDelta > this.SWEPT_COLLISION_THRESHOLD
    
    // Only check obstacles within range (spatial culling)
    const checkRange = useSweptCollision ? movementDelta + 5 : 10
    
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i]
      // Quick Z-distance check first (cheap)
      if (Math.abs(obstacle.z - playerZ) > checkRange) {
        continue
      }
      
      // AAA Feature: Swept collision - check intermediate positions at high speed
      if (useSweptCollision) {
        const steps = Math.ceil(movementDelta / this.SWEPT_COLLISION_THRESHOLD)
        for (let step = 0; step <= steps; step++) {
          const t = step / steps
          const interpZ = this.previousPlayerZ + (playerZ - this.previousPlayerZ) * t
          
          const result = this.checkObstacleCollision(
            playerX, playerY, interpZ,
            isJumping, isSliding,
            obstacle
          )
          
          if (result.collided) {
            this.collisionResults.push(result)
            break // Found collision, no need to check more steps
          }
        }
      } else {
        // Normal collision check
        const result = this.checkObstacleCollision(
          playerX, playerY, playerZ,
          isJumping, isSliding,
          obstacle
        )
        
        if (result.collided || result.nearMiss) {
          this.collisionResults.push(result)
        }
      }
    }
    
    return this.collisionResults
  }

  /**
   * Set near-miss callback for DynamicBreather integration
   */
  setNearMissCallback(callback: (distance: number, obstacleType: ObstacleType) => void): void {
    this.nearMissCallback = callback
  }

  /**
   * Store previous Z for swept collision
   */
  storePreviousZ(z: number): void {
    this.previousPlayerZ = z
  }

  /**
   * Reset collision system state
   */
  reset(): void {
    this.invincibilityTimer = 0
    this.previousPlayerZ = 0
  }

  /**
   * Debug: Draw collision boxes (for development)
   */
  createDebugBox(box: CollisionBox, color: number = 0xff0000): THREE.LineSegments {
    const geometry = new THREE.BoxGeometry(
      box.maxX - box.minX,
      box.maxY - box.minY,
      box.maxZ - box.minZ
    )
    const edges = new THREE.EdgesGeometry(geometry)
    const material = new THREE.LineBasicMaterial({ color })
    const wireframe = new THREE.LineSegments(edges, material)
    
    wireframe.position.set(
      (box.minX + box.maxX) / 2,
      (box.minY + box.maxY) / 2,
      (box.minZ + box.maxZ) / 2
    )
    
    return wireframe
  }
}
