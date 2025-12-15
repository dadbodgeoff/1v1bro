/**
 * CollisionHandler - Handles collision detection and response
 * Extracted from SurvivalEngine for modularity
 */

import * as THREE from 'three'
import type { SurvivalGameState, SurvivalCallbacks, ObstacleType, ComboEvent } from '../types/survival'
import { CollisionSystem, type Collidable } from './CollisionSystem'
import { ObstacleManager } from './ObstacleManager'
import { PlayerController } from './PlayerController'
import { CameraController } from './CameraController'
import { GameLoop } from './GameLoop'
import { ParticleSystem } from '../effects/ParticleSystem'
import { FeedbackSystem } from '../effects/FeedbackSystem'
import { TransitionSystem } from '../effects/TransitionSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { SurvivalRenderer } from '../renderer/SurvivalRenderer'

export interface CollisionHandlerDeps {
  collisionSystem: CollisionSystem
  obstacleManager: ObstacleManager
  playerController: PlayerController
  cameraController: CameraController
  gameLoop: GameLoop
  particleSystem: ParticleSystem
  feedbackSystem: FeedbackSystem
  transitionSystem: TransitionSystem
  comboSystem: ComboSystem
  renderer: SurvivalRenderer
}

export class CollisionHandler {
  private deps: CollisionHandlerDeps
  private callbacks: SurvivalCallbacks
  
  // Callbacks for state updates
  private onLifeLost: (() => void) | null = null
  private onObstacleCleared: (() => void) | null = null
  private onScoreUpdate: ((score: number) => void) | null = null
  private onDeathRecord: ((type: string, pos: { x: number; z: number }) => void) | null = null

  constructor(deps: CollisionHandlerDeps, callbacks: SurvivalCallbacks) {
    this.deps = deps
    this.callbacks = callbacks
    this.setupNearMissCallback()
    this.setupComboCallbacks()
  }

  /**
   * Setup near-miss detection callback
   */
  private setupNearMissCallback(): void {
    this.deps.collisionSystem.setNearMissCallback((distance, obstacleType) => {
      
      this.deps.obstacleManager.recordNearMiss(distance, obstacleType)
      
      const playerPos = this.deps.playerController.getPosition()
      const dodgeDirection = new THREE.Vector3(
        Math.random() - 0.5,
        0.5,
        Math.random() - 0.5
      ).normalize()
      
      const obstacleBounds = {
        position: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
        size: { x: 0.5, y: 1, z: 0.5 }
      }
      obstacleBounds.position.z -= distance
      
      const comboEvent = this.deps.comboSystem.checkProximity(playerPos, obstacleBounds)
      const isPerfect = distance <= ComboSystem.PERFECT_DODGE_THRESHOLD
      
      if (isPerfect) {
        this.deps.particleSystem.emitPerfectDodgeBurst(playerPos, dodgeDirection)
        this.deps.gameLoop.triggerHitstop(3, 0.05)
        this.deps.feedbackSystem.onPerfectDodge(playerPos)
      } else {
        this.deps.particleSystem.emitDodgeParticles(playerPos, dodgeDirection, 1 - distance / 0.5)
        this.deps.feedbackSystem.onNearMiss(distance, playerPos)
      }
      
      this.onObstacleCleared?.()
      
      if (comboEvent) {
        const baseScore = isPerfect ? 100 : 25
        const score = Math.round(baseScore * this.deps.comboSystem.getMultiplier())
        this.onScoreUpdate?.(score)
      }
    })
  }

  /**
   * Setup combo system callbacks
   */
  private setupComboCallbacks(): void {
    this.deps.comboSystem.onComboChange((event: ComboEvent) => {
      if (event.type === 'milestone' && event.milestone) {
        this.deps.feedbackSystem.onComboMilestone(event.milestone, event.position)
      }
    })
    
    this.deps.comboSystem.onPerfectDodge((_position) => {
    })
  }

  /**
   * Set callback handlers
   */
  setHandlers(handlers: {
    onLifeLost?: () => void
    onObstacleCleared?: () => void
    onScoreUpdate?: (score: number) => void
    onDeathRecord?: (type: string, pos: { x: number; z: number }) => void
  }): void {
    this.onLifeLost = handlers.onLifeLost ?? null
    this.onObstacleCleared = handlers.onObstacleCleared ?? null
    this.onScoreUpdate = handlers.onScoreUpdate ?? null
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
   */
  private handleDamageCollision(state: SurvivalGameState, obstacleType: ObstacleType): void {
    const playerPos = this.deps.playerController.getPosition()
    
    this.onDeathRecord?.(obstacleType, { x: state.player.x, z: state.player.z })
    
    this.deps.comboSystem.onCollision()
    this.onLifeLost?.()
    this.deps.collisionSystem.triggerInvincibility()
    
    // AAA effects
    this.deps.cameraController.addShakeTrauma(0.6)
    this.deps.cameraController.triggerImpactZoom(0.8)
    this.deps.gameLoop.triggerHitstop(4, 0.05)
    this.deps.particleSystem.emitCollisionSparks(playerPos)
    this.deps.feedbackSystem.onCollision()
    this.deps.obstacleManager.recordCollision(obstacleType)
    this.deps.renderer.triggerDamageEffect()
    this.deps.transitionSystem.triggerDeath(playerPos)
    this.deps.particleSystem.emitDeathBurst(playerPos)
    this.deps.feedbackSystem.onGameOver()
    
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
