/**
 * EventWiring - Centralized event wiring for survival game
 * 
 * This module contains ALL cross-system event subscriptions in one place.
 * When debugging "why didn't X happen when Y occurred", look here.
 * 
 * Event Flow Documentation:
 * 
 * NEAR-MISS FLOW:
 *   CollisionSystem detects near-miss
 *   → emits 'player:nearMiss'
 *   → FeedbackSystem plays sound/haptic
 *   → AchievementSystem records close call or perfect dodge
 *   → ComboSystem updates combo
 * 
 * COLLISION FLOW:
 *   CollisionSystem detects collision
 *   → emits 'player:collision'
 *   → ComboSystem resets
 *   → AchievementSystem records hit
 *   → StateManager loses life
 *   → emits 'player:lifeLost'
 *   → FeedbackSystem plays collision effects
 *   → TransitionSystem triggers death animation
 * 
 * MILESTONE FLOW:
 *   MilestoneSystem detects milestone
 *   → emits 'milestone:reached'
 *   → FeedbackSystem plays milestone sound
 * 
 * COMBO MILESTONE FLOW:
 *   ComboSystem reaches milestone (5, 10, 15...)
 *   → emits 'combo:milestone'
 *   → FeedbackSystem shows visual indicator
 * 
 * ACHIEVEMENT FLOW:
 *   AchievementSystem unlocks achievement
 *   → emits 'achievement:unlocked'
 *   → FeedbackSystem plays achievement sound/haptic
 */

import * as THREE from 'three'
import type { GameEventBus } from './GameEventBus'
import type { FeedbackSystem } from '../effects/FeedbackSystem'
import type { AchievementSystem } from '../systems/AchievementSystem'
import type { MilestoneSystem } from '../systems/MilestoneSystem'
import type { ComboSystem } from '../systems/ComboSystem'
import type { CollisionSystem } from '../engine/CollisionSystem'
import type { GameStateManager } from '../engine/GameStateManager'
import type { TransitionSystem } from '../effects/TransitionSystem'
import type { ParticleSystem } from '../effects/ParticleSystem'
import type { CameraController } from '../engine/CameraController'
import type { GameLoop } from '../engine/GameLoop'
import type { ObstacleManager } from '../engine/ObstacleManager'

export interface EventWiringDeps {
  eventBus: GameEventBus
  feedbackSystem: FeedbackSystem
  achievementSystem: AchievementSystem
  milestoneSystem: MilestoneSystem
  comboSystem: ComboSystem
  collisionSystem: CollisionSystem
  stateManager: GameStateManager
  transitionSystem: TransitionSystem
  particleSystem: ParticleSystem
  cameraController: CameraController
  gameLoop: GameLoop
  obstacleManager: ObstacleManager
}

/**
 * Wire up all event subscriptions
 * Returns cleanup function to unsubscribe all
 */
export function wireEvents(deps: EventWiringDeps): () => void {
  const {
    eventBus,
    feedbackSystem,
    achievementSystem,
    milestoneSystem,
    comboSystem,
    collisionSystem,
    stateManager,
    transitionSystem,
    particleSystem,
    cameraController,
    gameLoop,
    obstacleManager,
  } = deps

  const unsubscribers: (() => void)[] = []

  // ============================================
  // NEAR-MISS EVENTS
  // ============================================

  // Near-miss → Feedback (sound, haptic, visual)
  unsubscribers.push(
    eventBus.on('player:nearMiss', (data) => {
      const pos = new THREE.Vector3(data.position.x, data.position.y, data.position.z)
      const dodgeDir = new THREE.Vector3(0, 0.5, -1).normalize()
      
      if (data.isPerfect) {
        feedbackSystem.onPerfectDodge({ x: data.position.x, z: data.position.z })
        particleSystem.emitPerfectDodgeBurst(pos, dodgeDir)
        gameLoop.triggerHitstop(3, 0.05)
      } else {
        feedbackSystem.onNearMiss(data.distance, { x: data.position.x, z: data.position.z })
        particleSystem.emitDodgeParticles(pos, dodgeDir, 1 - data.distance / 0.5)
      }
    })
  )

  // Near-miss → Achievement tracking
  unsubscribers.push(
    eventBus.on('player:nearMiss', (data) => {
      if (data.isPerfect) {
        achievementSystem.recordPerfectDodge()
      } else {
        achievementSystem.recordCloseCall()
      }
    })
  )

  // Near-miss → Score
  unsubscribers.push(
    eventBus.on('player:nearMiss', (data) => {
      const baseScore = data.isPerfect ? 100 : 25
      const score = Math.round(baseScore * comboSystem.getMultiplier())
      stateManager.addScore(score)
    })
  )

  // Near-miss → Obstacle cleared tracking
  unsubscribers.push(
    eventBus.on('player:nearMiss', () => {
      stateManager.incrementObstaclesCleared()
    })
  )

  // Near-miss → Combo system update
  unsubscribers.push(
    eventBus.on('player:nearMiss', (data) => {
      // Update combo system with the near-miss/perfect dodge
      const obstacleBounds = {
        position: { x: data.position.x, y: data.position.y, z: data.position.z - data.distance },
        size: { x: 0.5, y: 1, z: 0.5 },
      }
      comboSystem.checkProximity(data.position, obstacleBounds)
    })
  )

  // Near-miss → ObstacleManager analytics
  unsubscribers.push(
    eventBus.on('player:nearMiss', (data) => {
      obstacleManager.recordNearMiss(data.distance, data.obstacleType)
    })
  )

  // ============================================
  // COLLISION EVENTS
  // ============================================

  // Collision → Combo reset
  unsubscribers.push(
    eventBus.on('player:collision', () => {
      comboSystem.onCollision()
    })
  )

  // Collision → Achievement tracking
  unsubscribers.push(
    eventBus.on('player:collision', () => {
      achievementSystem.recordHit()
    })
  )

  // Collision → Death recording
  unsubscribers.push(
    eventBus.on('player:collision', (data) => {
      stateManager.recordDeath(data.obstacleType, data.position)
    })
  )

  // Collision → Effects
  unsubscribers.push(
    eventBus.on('player:collision', () => {
      cameraController.addShakeTrauma(0.6)
      cameraController.triggerImpactZoom(0.8)
      gameLoop.triggerHitstop(4, 0.05)
      feedbackSystem.onCollision()
    })
  )

  // ============================================
  // LIFE LOST EVENTS
  // ============================================

  // Life lost → Invincibility
  unsubscribers.push(
    eventBus.on('player:lifeLost', () => {
      collisionSystem.triggerInvincibility()
    })
  )

  // Life lost → Death effects (when lives > 0)
  unsubscribers.push(
    eventBus.on('player:lifeLost', (data) => {
      if (data.livesRemaining > 0) {
        // Will respawn - trigger death animation
        transitionSystem.triggerDeath(new THREE.Vector3(0, 0, 0))
      }
    })
  )

  // ============================================
  // MILESTONE EVENTS
  // ============================================

  // Distance milestone → Feedback
  unsubscribers.push(
    eventBus.on('milestone:reached', (data) => {
      feedbackSystem.emitSound('milestone', { intensity: data.isMajor ? 1 : 0.7 })
      feedbackSystem.emitHaptic(data.isMajor ? 'success' : 'medium', data.isMajor ? 1 : 0.6)
    })
  )

  // ============================================
  // COMBO EVENTS
  // ============================================

  // Combo milestone → Visual feedback
  unsubscribers.push(
    eventBus.on('combo:milestone', (data) => {
      if (data.position) {
        feedbackSystem.onComboMilestone(data.milestone, data.position)
      }
    })
  )

  // ============================================
  // ACHIEVEMENT EVENTS
  // ============================================

  // Achievement unlocked → Feedback
  unsubscribers.push(
    eventBus.on('achievement:unlocked', () => {
      feedbackSystem.emitSound('milestone', { intensity: 1, pitch: 1.2 })
      feedbackSystem.emitHaptic('success', 0.8)
    })
  )

  // ============================================
  // GAME STATE EVENTS
  // ============================================

  // Game over → Feedback
  unsubscribers.push(
    eventBus.on('game:over', () => {
      feedbackSystem.onGameOver()
    })
  )

  // Countdown → Feedback
  unsubscribers.push(
    eventBus.on('game:countdown', (data) => {
      if (data.value !== null && data.value !== 'GO') {
        feedbackSystem.emitSound('countdown', { intensity: 0.8 })
      } else if (data.value === 'GO') {
        feedbackSystem.emitSound('boost', { intensity: 1 })
      }
    })
  )

  // ============================================
  // VISUAL INDICATOR → ACHIEVEMENT (bridge for FeedbackSystem)
  // ============================================
  
  // This bridges the old FeedbackSystem visual indicator pattern
  // to the new achievement tracking
  const visualUnsubscribe = feedbackSystem.onVisualIndicator((data) => {
    if (data.type === 'close') {
      eventBus.emit('achievement:closeCall', { count: achievementSystem.getRunStats().closeCalls })
    } else if (data.type === 'perfect') {
      eventBus.emit('achievement:perfectDodge', { count: achievementSystem.getRunStats().perfectDodges })
    }
  })
  unsubscribers.push(visualUnsubscribe)

  // ============================================
  // SYSTEM CALLBACKS → EVENT BUS BRIDGES
  // ============================================

  // Bridge MilestoneSystem callback to event bus
  const milestoneUnsubscribe = milestoneSystem.onMilestone((event) => {
    eventBus.emit('milestone:reached', {
      distance: event.distance,
      isMajor: event.isMajor,
    })
  })
  unsubscribers.push(milestoneUnsubscribe)

  // Bridge AchievementSystem callback to event bus
  const achievementUnsubscribe = achievementSystem.onAchievement((unlocked) => {
    eventBus.emit('achievement:unlocked', {
      id: unlocked.achievement.id,
      name: unlocked.achievement.name,
      category: unlocked.achievement.category,
      value: unlocked.value,
    })
  })
  unsubscribers.push(achievementUnsubscribe)

  // Bridge ComboSystem milestone callback to event bus
  comboSystem.onComboChange((event) => {
    if (event.type === 'milestone' && event.milestone) {
      eventBus.emit('combo:milestone', {
        milestone: event.milestone,
        combo: event.combo,
        multiplier: event.multiplier,
        position: event.position,
      })
    }
  })

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

/**
 * Wire CollisionSystem near-miss callback to event bus
 * This is separate because CollisionSystem is created before full wiring
 */
export function wireCollisionSystem(
  collisionSystem: CollisionSystem,
  eventBus: GameEventBus,
  getPlayerPosition: () => { x: number; y: number; z: number }
): void {
  collisionSystem.setNearMissCallback((distance, obstacleType) => {
    const position = getPlayerPosition()
    const isPerfect = distance <= 0.2 // ComboSystem.PERFECT_DODGE_THRESHOLD
    
    eventBus.emit('player:nearMiss', {
      distance,
      obstacleType,
      position,
      isPerfect,
    })
  })
}
