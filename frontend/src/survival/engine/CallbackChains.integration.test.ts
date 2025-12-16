/**
 * Integration tests for callback chains across survival systems
 * 
 * These tests verify that events flow correctly through the callback wiring:
 * - Near-miss → Achievement tracking
 * - Collision → Life lost → Respawn flow
 * - Combo milestone → Feedback emission
 * - Milestone system → Sound/haptic feedback
 * 
 * Uses real system instances (not mocks) to verify actual wiring.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { FeedbackSystem, type VisualIndicatorData, type SoundEventData } from '../effects/FeedbackSystem'
import { AchievementSystem } from '../systems/AchievementSystem'
import { MilestoneSystem } from '../systems/MilestoneSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { CollisionSystem } from './CollisionSystem'

describe('Callback Chain Integration Tests', () => {
  
  describe('Near-miss → Achievement tracking chain', () => {
    let feedbackSystem: FeedbackSystem
    let achievementSystem: AchievementSystem
    
    beforeEach(() => {
      feedbackSystem = new FeedbackSystem()
      achievementSystem = new AchievementSystem()
    })
    
    it('should record close call when feedbackSystem emits "close" visual indicator', () => {
      // Wire up the callback chain (mirrors SurvivalEngine.initializeModularSystems)
      feedbackSystem.onVisualIndicator((data: VisualIndicatorData) => {
        if (data.type === 'close') {
          achievementSystem.recordCloseCall()
        }
      })
      
      // Trigger a near-miss via feedbackSystem
      feedbackSystem.onNearMiss(0.3, { x: 0, z: -10 })
      
      // Verify achievement system recorded it
      const stats = achievementSystem.getRunStats()
      expect(stats.closeCalls).toBe(1)
    })
    
    it('should record perfect dodge when feedbackSystem emits "perfect" visual indicator', () => {
      // Wire up the callback chain
      feedbackSystem.onVisualIndicator((data: VisualIndicatorData) => {
        if (data.type === 'perfect') {
          achievementSystem.recordPerfectDodge()
        }
      })
      
      // Trigger a perfect dodge
      feedbackSystem.onPerfectDodge({ x: 0, z: -10 })
      
      // Verify achievement system recorded it
      const stats = achievementSystem.getRunStats()
      expect(stats.perfectDodges).toBe(1)
    })
    
    it('should unlock "Risk Taker" achievement after 10 close calls', () => {
      let achievementUnlocked = false
      let unlockedId = ''
      
      // Wire up callbacks
      feedbackSystem.onVisualIndicator((data: VisualIndicatorData) => {
        if (data.type === 'close') {
          achievementSystem.recordCloseCall()
        }
      })
      
      achievementSystem.onAchievement((unlocked) => {
        achievementUnlocked = true
        unlockedId = unlocked.achievement.id
      })
      
      // Trigger 10 near-misses
      for (let i = 0; i < 10; i++) {
        feedbackSystem.onNearMiss(0.3, { x: 0, z: -10 - i })
      }
      
      expect(achievementUnlocked).toBe(true)
      expect(unlockedId).toBe('close_calls_10')
    })
    
    it('should unlock "Precision" achievement after 5 perfect dodges', () => {
      let achievementUnlocked = false
      let unlockedId = ''
      
      feedbackSystem.onVisualIndicator((data: VisualIndicatorData) => {
        if (data.type === 'perfect') {
          achievementSystem.recordPerfectDodge()
        }
      })
      
      achievementSystem.onAchievement((unlocked) => {
        achievementUnlocked = true
        unlockedId = unlocked.achievement.id
      })
      
      // Trigger 5 perfect dodges
      for (let i = 0; i < 5; i++) {
        feedbackSystem.onPerfectDodge({ x: 0, z: -10 - i })
      }
      
      expect(achievementUnlocked).toBe(true)
      expect(unlockedId).toBe('perfect_dodges_5')
    })
  })
  
  describe('Milestone → Feedback chain', () => {
    let milestoneSystem: MilestoneSystem
    let feedbackSystem: FeedbackSystem
    
    beforeEach(() => {
      milestoneSystem = new MilestoneSystem({ interval: 500, majorInterval: 1000 })
      feedbackSystem = new FeedbackSystem()
    })
    
    it('should emit milestone sound when milestone is reached', () => {
      const soundEvents: SoundEventData[] = []
      
      // Wire up the callback chain (mirrors SurvivalEngine constructor)
      milestoneSystem.onMilestone((event) => {
        feedbackSystem.emitSound('milestone', { intensity: event.isMajor ? 1 : 0.7 })
      })
      
      feedbackSystem.onSound((data) => {
        soundEvents.push(data)
      })
      
      // Simulate running to 500m
      milestoneSystem.update(500)
      
      expect(soundEvents.length).toBe(1)
      expect(soundEvents[0].event).toBe('milestone')
      expect(soundEvents[0].intensity).toBe(0.7) // Not major
    })
    
    it('should emit higher intensity sound for major milestones', () => {
      const soundEvents: SoundEventData[] = []
      
      milestoneSystem.onMilestone((event) => {
        feedbackSystem.emitSound('milestone', { intensity: event.isMajor ? 1 : 0.7 })
      })
      
      feedbackSystem.onSound((data) => {
        soundEvents.push(data)
      })
      
      // Simulate running to 1000m (major milestone)
      milestoneSystem.update(500)  // First milestone
      milestoneSystem.update(1000) // Major milestone
      
      expect(soundEvents.length).toBe(2)
      expect(soundEvents[1].intensity).toBe(1) // Major milestone = full intensity
    })
  })
  
  describe('Combo milestone → Feedback chain', () => {
    let comboSystem: ComboSystem
    let feedbackSystem: FeedbackSystem
    
    beforeEach(() => {
      comboSystem = new ComboSystem()
      feedbackSystem = new FeedbackSystem()
    })
    
    it('should emit combo milestone visual indicator at combo multiples of 5', () => {
      const visualIndicators: VisualIndicatorData[] = []
      
      // Wire up the callback chain (milestone event may not have position, use default)
      comboSystem.onComboChange((event) => {
        if (event.type === 'milestone' && event.milestone) {
          // In real code, position comes from the obstacle that triggered the combo
          const position = event.position ?? { x: 0, z: 0 }
          feedbackSystem.onComboMilestone(event.milestone, position)
        }
      })
      
      feedbackSystem.onVisualIndicator((data) => {
        visualIndicators.push(data)
      })
      
      // Build up combo to 5 using perfect dodges (+3 each)
      // Player at z=0, obstacle at z=0.15 (within perfect dodge range of 0.2)
      const playerPos = { x: 0, y: 0, z: 0 }
      const createObstacle = () => ({
        position: { x: 0, y: 0, z: 0.15 },
        size: { x: 0.1, y: 1, z: 0.1 },
      })
      
      // 2 perfect dodges = 6 combo (passes 5 milestone)
      comboSystem.checkProximity(playerPos, createObstacle())
      comboSystem.checkProximity(playerPos, createObstacle())
      
      expect(visualIndicators.length).toBe(1)
      expect(visualIndicators[0].type).toBe('combo-milestone')
      expect(visualIndicators[0].text).toBe('5x Combo!')
    })
  })
  
  describe('CollisionSystem → Near-miss callback chain', () => {
    let collisionSystem: CollisionSystem
    let feedbackSystem: FeedbackSystem
    let comboSystem: ComboSystem
    
    beforeEach(() => {
      collisionSystem = new CollisionSystem()
      feedbackSystem = new FeedbackSystem()
      comboSystem = new ComboSystem()
    })
    
    it('should trigger near-miss callback when player barely clears obstacle', () => {
      let nearMissTriggered = false
      let nearMissDistance = 0
      
      // Wire up near-miss callback (mirrors CollisionHandler.setupNearMissCallback)
      collisionSystem.setNearMissCallback((distance, _obstacleType) => {
        nearMissTriggered = true
        nearMissDistance = distance
      })
      
      // Create a collidable obstacle - lowBarrier that player jumps over
      const obstacle = {
        id: 'test-obstacle',
        type: 'lowBarrier' as const,
        lane: 0 as const,
        z: 0,
        getCollisionBox: () => ({
          minX: -2, maxX: 2,
          minY: 0, maxY: 1.2,
          minZ: -0.4, maxZ: 0.4,
        }),
      }
      
      // Store previous Z (player was behind obstacle)
      collisionSystem.storePreviousZ(1)
      
      // Player jumps and barely clears (Y = 1.3, obstacle maxY = 1.2)
      // Clearance = 1.3 - 1.2 = 0.1, which is < NEAR_MISS_THRESHOLD (0.8)
      const result = collisionSystem.checkObstacleCollision(
        0,    // x
        1.3,  // y (just above obstacle)
        0,    // z (at obstacle)
        true, // isJumping
        false, // isSliding
        obstacle
      )
      
      // The collision system returns nearMiss=true when clearance < threshold
      expect(result.collided).toBe(false)
      expect(result.nearMiss).toBe(true)
      expect(nearMissTriggered).toBe(true)
      // The actual distance depends on internal calculation
      expect(nearMissDistance).toBeLessThan(0.8) // Within near-miss threshold
    })
  })
  
  describe('Achievement → Feedback chain', () => {
    let achievementSystem: AchievementSystem
    let feedbackSystem: FeedbackSystem
    
    beforeEach(() => {
      achievementSystem = new AchievementSystem()
      feedbackSystem = new FeedbackSystem()
    })
    
    it('should emit sound and haptic when achievement unlocks', () => {
      const soundEvents: SoundEventData[] = []
      let hapticCount = 0
      
      // Wire up the callback chain (mirrors SurvivalEngine constructor)
      achievementSystem.onAchievement(() => {
        feedbackSystem.emitSound('milestone', { intensity: 1, pitch: 1.2 })
        feedbackSystem.emitHaptic('success', 0.8)
      })
      
      feedbackSystem.onSound((data) => {
        soundEvents.push(data)
      })
      
      feedbackSystem.onHaptic(() => {
        hapticCount++
      })
      
      // Trigger a distance achievement (500m unlocks both dist_500 AND no_hit_500)
      achievementSystem.updateDistance(500)
      
      // At 500m with no hits, both dist_500 and no_hit_500 unlock
      expect(soundEvents.length).toBeGreaterThanOrEqual(1)
      expect(soundEvents[0].event).toBe('milestone')
      expect(soundEvents[0].pitch).toBe(1.2)
      expect(hapticCount).toBeGreaterThanOrEqual(1)
    })
  })
  
  describe('Collision → Hit recording chain', () => {
    let achievementSystem: AchievementSystem
    let comboSystem: ComboSystem
    
    beforeEach(() => {
      achievementSystem = new AchievementSystem()
      comboSystem = new ComboSystem()
    })
    
    it('should record hit and reset combo on collision', () => {
      // Build up some combo first
      const playerPos = { x: 0, y: 0, z: 0 }
      const createObstacle = (distance: number) => ({
        position: { x: 0, y: 0, z: distance + 0.1 },
        size: { x: 0.1, y: 1, z: 0.1 },
      })
      
      comboSystem.checkProximity(playerPos, createObstacle(0.15))
      comboSystem.checkProximity(playerPos, createObstacle(0.15))
      expect(comboSystem.getCombo()).toBe(6) // 2 perfect dodges
      
      // Simulate collision (mirrors CollisionHandler.handleDamageCollision)
      comboSystem.onCollision()
      achievementSystem.recordHit()
      
      expect(comboSystem.getCombo()).toBe(0)
      expect(achievementSystem.getRunStats().hitsTaken).toBe(1)
    })
    
    it('should prevent no-hit achievements after taking damage', () => {
      let achievementUnlocked = false
      
      achievementSystem.onAchievement((unlocked) => {
        if (unlocked.achievement.id === 'no_hit_500') {
          achievementUnlocked = true
        }
      })
      
      // Take a hit
      achievementSystem.recordHit()
      
      // Run 500m
      achievementSystem.updateDistance(500)
      
      // Should NOT unlock no-hit achievement
      expect(achievementUnlocked).toBe(false)
    })
    
    it('should unlock no-hit achievement when reaching distance without hits', () => {
      let achievementUnlocked = false
      
      achievementSystem.onAchievement((unlocked) => {
        if (unlocked.achievement.id === 'no_hit_500') {
          achievementUnlocked = true
        }
      })
      
      // Run 500m without taking hits
      achievementSystem.updateDistance(500)
      
      expect(achievementUnlocked).toBe(true)
    })
  })
  
  describe('Quiz → Feedback chain', () => {
    let feedbackSystem: FeedbackSystem
    let soundEvents: SoundEventData[]
    
    beforeEach(() => {
      feedbackSystem = new FeedbackSystem()
      soundEvents = []
      feedbackSystem.onSound((data) => {
        soundEvents.push(data)
      })
    })
    
    it('should emit quiz-popup sound when onQuizPopup is called', () => {
      feedbackSystem.onQuizPopup()
      
      expect(soundEvents.length).toBe(1)
      expect(soundEvents[0].event).toBe('quiz-popup')
      expect(soundEvents[0].intensity).toBe(1)
    })
    
    it('should emit quiz-correct sound when onQuizCorrect is called', () => {
      feedbackSystem.onQuizCorrect()
      
      expect(soundEvents.length).toBe(1)
      expect(soundEvents[0].event).toBe('quiz-correct')
      expect(soundEvents[0].intensity).toBe(1)
    })
    
    it('should emit quiz-wrong sound when onQuizWrong is called', () => {
      feedbackSystem.onQuizWrong()
      
      expect(soundEvents.length).toBe(1)
      expect(soundEvents[0].event).toBe('quiz-wrong')
      expect(soundEvents[0].intensity).toBe(0.8)
    })
    
    it('should emit quiz-tick sound when onQuizTick is called', () => {
      feedbackSystem.onQuizTick()
      
      expect(soundEvents.length).toBe(1)
      expect(soundEvents[0].event).toBe('quiz-tick')
      expect(soundEvents[0].intensity).toBe(0.8)
    })
    
    it('should emit quiz-tick-urgent sound when onQuizTickUrgent is called', () => {
      feedbackSystem.onQuizTickUrgent()
      
      expect(soundEvents.length).toBe(1)
      expect(soundEvents[0].event).toBe('quiz-tick-urgent')
      expect(soundEvents[0].intensity).toBe(1)
    })
  })

  describe('Full callback chain: Near-miss → Combo → Achievement → Feedback', () => {
    it('should flow through entire chain from near-miss to feedback', () => {
      // Setup all systems
      const collisionSystem = new CollisionSystem()
      const comboSystem = new ComboSystem()
      const feedbackSystem = new FeedbackSystem()
      const achievementSystem = new AchievementSystem()
      
      // Track all events
      const events: string[] = []
      
      // Wire up the full chain (mirrors SurvivalEngine wiring)
      collisionSystem.setNearMissCallback((distance, obstacleType) => {
        events.push(`nearMiss:${distance.toFixed(2)}:${obstacleType}`)
        
        const playerPos = { x: 0, y: 0, z: 0 }
        const isPerfect = distance <= 0.2
        
        if (isPerfect) {
          feedbackSystem.onPerfectDodge(playerPos)
        } else {
          feedbackSystem.onNearMiss(distance, playerPos)
        }
      })
      
      feedbackSystem.onVisualIndicator((data) => {
        events.push(`visual:${data.type}`)
        if (data.type === 'close') {
          achievementSystem.recordCloseCall()
        } else if (data.type === 'perfect') {
          achievementSystem.recordPerfectDodge()
        }
      })
      
      achievementSystem.onAchievement((unlocked) => {
        events.push(`achievement:${unlocked.achievement.id}`)
      })
      
      // Create obstacle and trigger near-miss
      // Player barely clears a lowBarrier (clearance = 0.3 which is > 0.2 so it's "close" not "perfect")
      const obstacle = {
        id: 'test',
        type: 'lowBarrier' as const,
        lane: 0 as const,
        z: 0,
        getCollisionBox: () => ({
          minX: -2, maxX: 2,
          minY: 0, maxY: 1.2,
          minZ: -0.4, maxZ: 0.4,
        }),
      }
      
      collisionSystem.storePreviousZ(1)
      const result = collisionSystem.checkObstacleCollision(0, 1.5, 0, true, false, obstacle)
      
      // Verify near-miss was detected
      expect(result.nearMiss).toBe(true)
      
      // Verify the chain fired - nearMiss callback should have been called
      expect(events.some(e => e.startsWith('nearMiss:'))).toBe(true)
      
      // The visual indicator depends on whether distance <= 0.2 (perfect) or > 0.2 (close)
      // With clearance of 0.3, it should be "close"
      const hasVisualEvent = events.some(e => e === 'visual:close' || e === 'visual:perfect')
      expect(hasVisualEvent).toBe(true)
      
      // Achievement tracking should have recorded the event
      const stats = achievementSystem.getRunStats()
      expect(stats.closeCalls + stats.perfectDodges).toBeGreaterThanOrEqual(1)
    })
  })
})
