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

  /**
   * Check collisions and handle results
   */
  checkCollisions(state: SurvivalGameState, playerY: number): void {
    if (this.deps.collisionSystem.isInvincible()) return

    const nearbyObstacles = this.deps.obstacleManager.getObstaclesInRange(state.player.z)
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
        if (collision.obstacleType === 'knowledgeGate') {
          if (collision.obstacleId) {
            this.deps.obstacleManager.markTriggered(collision.obstacleId)
            this.callbacks.onKnowledgeGate?.(collision.obstacleId)
          }
        } else {
          this.handleDamageCollision(state, collision.obstacleType)
          break
        }
      }
    }
  }

  /**
   * Handle damage collision
   * NOTE: Most effects (combo reset, camera shake, feedback sounds) are now
   * handled by EventWiring via 'player:collision' and 'player:lifeLost' events.
   * This method triggers the callbacks and handles collision-specific visuals.
   */
  private handleDamageCollision(state: SurvivalGameState, obstacleType: ObstacleType): void {
    const playerPos = this.deps.playerController.getPosition()
    
    // Trigger callbacks - these emit to event bus which handles:
    // - combo reset, achievement tracking, camera effects, feedback sounds
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
