/**
 * CollisionHandler - Handles collision detection and response
 * Extracted from SurvivalEngine for modularity
 * 
 * NOTE: Near-miss and combo callbacks are now handled by the centralized
 * EventWiring system. This class focuses on collision detection and
 * damage handling only.
 */

import type { SurvivalGameState, SurvivalCallbacks, ObstacleType } from '../types/survival'
import { CollisionSystem, type Collidable } from './CollisionSystem'
import type { ObstacleManager } from './ObstacleManager'
import type { PlayerController } from './PlayerController'
import type { ParticleSystem } from '../effects/ParticleSystem'
import type { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import { collisionDebugOverlay } from './CollisionDebugOverlay'
import { WorldConfig } from '../config/WorldConfig'

/**
 * Dependencies for CollisionHandler
 * NOTE: Many deps removed - effects now handled by EventWiring
 */
export interface CollisionHandlerDeps {
  collisionSystem: CollisionSystem
  obstacleManager: ObstacleManager
  playerController: PlayerController
  particleSystem: ParticleSystem
  renderer: SurvivalRenderer
}

export class CollisionHandler {
  private deps: CollisionHandlerDeps
  private callbacks: SurvivalCallbacks
  
  // Callbacks for state updates (called by SurvivalEngine, which emits to event bus)
  private onLifeLost: (() => void) | null = null
  private onDeathRecord: ((type: string, pos: { x: number; z: number }) => void) | null = null

  constructor(deps: CollisionHandlerDeps, callbacks: SurvivalCallbacks) {
    this.deps = deps
    this.callbacks = callbacks
    // NOTE: Near-miss, combo, and most collision effects are now wired via EventWiring.ts
    // This class only handles collision detection and triggers the callbacks
  }

  /**
   * Set callback handlers
   * NOTE: onObstacleCleared and onScoreUpdate are now handled by EventWiring
   * via the 'player:nearMiss' event
   */
  setHandlers(handlers: {
    onLifeLost?: () => void
    onDeathRecord?: (type: string, pos: { x: number; z: number }) => void
  }): void {
    this.onLifeLost = handlers.onLifeLost ?? null
    this.onDeathRecord = handlers.onDeathRecord ?? null
  }

  // Debug: throttle logging
  private lastDebugLog = 0
  
  // Track geometry offset (must match ObstacleManager)
  private readonly TRACK_GEOMETRY_OFFSET = 2.05

  /**
   * Check collisions and handle results
   */
  checkCollisions(state: SurvivalGameState, playerY: number): void {
    // Don't check collisions if game is over (no lives left)
    if (state.player.lives <= 0) return
    // Don't check collisions during invincibility
    if (this.deps.collisionSystem.isInvincible()) return

    const nearbyObstacles = this.deps.obstacleManager.getObstaclesInRange(state.player.z)
    
    // Get player collision box for debug
    const playerBox = this.deps.collisionSystem.createPlayerBox(
      state.player.x,
      playerY,
      state.player.z,
      state.player.isJumping,
      state.player.isSliding
    )
    
    // Calculate effective ground Y for jump height calculation
    const trackSurfaceHeight = WorldConfig.getInstance().getTrackSurfaceHeight()
    const effectiveGroundY = trackSurfaceHeight + this.TRACK_GEOMETRY_OFFSET
    const jumpHeight = playerY - effectiveGroundY
    
    // Update debug overlay with player data
    collisionDebugOverlay.updatePlayer(
      state.player.x,
      playerY,
      state.player.z,
      state.player.targetLane,
      state.player.isJumping,
      state.player.isSliding,
      playerBox
    )
    
    // Update debug overlay with obstacle data
    collisionDebugOverlay.updateObstacles(
      nearbyObstacles as Array<{
        id: string
        type: string
        lane: number
        z: number
        getCollisionBox: () => { minY: number; maxY: number; minX: number; maxX: number; minZ: number; maxZ: number }
      }>,
      state.player.z,
      playerY
    )
    
    // Debug: Log collision check info every 500ms
    const now = Date.now()
    if (nearbyObstacles.length > 0 && now - this.lastDebugLog > 500) {
      this.lastDebugLog = now
      for (const o of nearbyObstacles) {
        const box = o.getCollisionBox()
        const zDist = Math.abs(o.z - state.player.z)
        if (zDist < 3) { // Only log when very close
          console.log(`[Collision Debug] type=${o.type} lane=${o.lane}`)
          console.log(`  Player: X=${state.player.x.toFixed(2)} Y=${playerY.toFixed(2)} Z=${state.player.z.toFixed(2)}`)
          console.log(`  Obstacle Z=${o.z.toFixed(2)} (dist=${zDist.toFixed(2)})`)
          console.log(`  Box: minY=${box.minY.toFixed(2)} maxY=${box.maxY.toFixed(2)}`)
          console.log(`  Player feet (${playerY.toFixed(2)}) >= obstacle top (${box.maxY.toFixed(2)})? ${playerY >= box.maxY}`)
          console.log(`  Jump height: ${jumpHeight.toFixed(2)} (ground at ${effectiveGroundY.toFixed(2)})`)
        }
      }
    }
    
    const collisions = this.deps.collisionSystem.checkAllCollisions(
      state.player.x,
      playerY,
      state.player.z,
      state.player.isJumping,
      state.player.isSliding,
      nearbyObstacles as Collidable[]
    )

    for (const collision of collisions) {
      if (collision.collided && collision.obstacleType) {
        console.log('[Collision DETECTED]', collision.obstacleType, collision.obstacleId)
        
        // Find the obstacle to get its collision box for debug
        const obstacle = nearbyObstacles.find(o => o.id === collision.obstacleId)
        if (obstacle) {
          const obstacleBox = obstacle.getCollisionBox()
          collisionDebugOverlay.recordCollision(
            collision.obstacleType,
            collision.obstacleId || 'unknown',
            playerY,
            obstacleBox.maxY,
            state.player.x,
            (obstacleBox.minX + obstacleBox.maxX) / 2,
            jumpHeight
          )
        }
        
        if (collision.obstacleType === 'knowledgeGate') {
          if (collision.obstacleId) {
            this.deps.obstacleManager.markTriggered(collision.obstacleId)
            this.callbacks.onKnowledgeGate?.(collision.obstacleId)
          }
        } else {
          this.handleDamageCollision(state, collision.obstacleType)
          break
        }
      } else if (collision.nearMiss && collision.obstacleType) {
        // Record near-miss for debug
        const obstacle = nearbyObstacles.find(o => o.id === collision.obstacleId)
        if (obstacle) {
          const obstacleBox = obstacle.getCollisionBox()
          collisionDebugOverlay.recordNearMiss(
            collision.obstacleType,
            collision.obstacleId || 'unknown',
            playerY,
            obstacleBox.maxY,
            state.player.x,
            (obstacleBox.minX + obstacleBox.maxX) / 2,
            jumpHeight
          )
        }
      }
    }
    
    // Render debug overlay
    collisionDebugOverlay.render()
  }

  /**
   * Handle damage collision
   * NOTE: Most effects (combo reset, camera shake, feedback sounds) are now
   * handled by EventWiring via 'player:collision' and 'player:lifeLost' events.
   * This method triggers the callbacks and handles collision-specific visuals.
   */
  private handleDamageCollision(state: SurvivalGameState, obstacleType: ObstacleType): void {
    console.log('[CollisionHandler] handleDamageCollision called for', obstacleType)
    const playerPos = this.deps.playerController.getPosition()
    
    // Trigger callbacks - these emit to event bus which handles:
    // - combo reset, achievement tracking, camera effects, feedback sounds
    console.log('[CollisionHandler] Calling onDeathRecord and onLifeLost callbacks')
    this.onDeathRecord?.(obstacleType, { x: state.player.x, z: state.player.z })
    this.onLifeLost?.()
    
    // Collision-specific visual effects (not handled by event bus)
    this.deps.particleSystem.emitCollisionSparks(playerPos)
    this.deps.obstacleManager.recordCollision(obstacleType)
    this.deps.renderer.triggerDamageEffect()
    this.deps.particleSystem.emitDeathBurst(playerPos)
    
    // Notify external callbacks (e.g., React components)
    this.callbacks.onLifeLost?.(state.player.lives)
  }

  /**
   * Update collision system
   */
  update(delta: number): void {
    this.deps.collisionSystem.update(delta)
  }

  /**
   * Store previous Z for swept collision
   */
  storePreviousZ(z: number): void {
    this.deps.collisionSystem.storePreviousZ(z)
  }

  /**
   * Check if player is invincible
   */
  isInvincible(): boolean {
    return this.deps.collisionSystem.isInvincible()
  }
}
