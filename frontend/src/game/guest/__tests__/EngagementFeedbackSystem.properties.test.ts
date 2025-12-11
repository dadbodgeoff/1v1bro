/**
 * Property tests for EngagementFeedbackSystem
 * 
 * Tests feedback event emission, XP popup management, and streak tracking.
 * 
 * @module game/guest/__tests__/EngagementFeedbackSystem.properties.test
 * Feature: guest-experience-enhancement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import {
  EngagementFeedbackSystem,
  getEngagementFeedbackSystem,
  XP_AMOUNTS,
  type FeedbackEvent,
  type FeedbackConfig,
} from '../EngagementFeedbackSystem'
import { type GuestMilestone } from '../MilestoneSystem'

describe('EngagementFeedbackSystem', () => {
  beforeEach(() => {
    EngagementFeedbackSystem.resetInstance()
  })

  describe('Property 6: Play again initialization timing', () => {
    /**
     * Property 6: Play again initialization timing
     * For any "Play Again" action, the feedback system reset should complete
     * in constant time (< 10ms) to not block the 2000ms total budget.
     * 
     * Validates: Requirements 5.2
     */
    it('should reset state in constant time for play again', () => {
      fc.assert(
        fc.property(
          // Generate random number of popups and streaks to accumulate
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 20 }),
          (popupCount, answerStreak, killStreak) => {
            const system = getEngagementFeedbackSystem()
            
            // Accumulate state
            for (let i = 0; i < popupCount; i++) {
              system.showXpPreview(50, 'Test')
            }
            for (let i = 0; i < answerStreak; i++) {
              system.onCorrectAnswer(2000, i + 1)
            }
            for (let i = 0; i < killStreak; i++) {
              system.onKillConfirmed(i + 1)
            }
            
            // Measure reset time
            const startTime = performance.now()
            system.resetStreaks()
            system.clearXpPopupQueue()
            const endTime = performance.now()
            
            const resetTimeMs = endTime - startTime
            
            // Reset should be < 10ms (constant time operation)
            expect(resetTimeMs).toBeLessThan(10)
            
            // State should be cleared
            expect(system.getCurrentStreak()).toBe(0)
            expect(system.getCurrentKillStreak()).toBe(0)
            expect(system.getXpPopupQueue()).toHaveLength(0)
            
            // Reset for next iteration
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('XP popup queue management', () => {
    /**
     * Property: XP popup queue should never exceed max size
     */
    it('should maintain bounded popup queue size', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              amount: fc.integer({ min: 1, max: 1000 }),
              reason: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (popups) => {
            const system = getEngagementFeedbackSystem()
            
            // Add all popups
            for (const popup of popups) {
              system.showXpPreview(popup.amount, popup.reason)
            }
            
            // Queue should never exceed 5 (internal limit)
            const queue = system.getXpPopupQueue()
            expect(queue.length).toBeLessThanOrEqual(5)
            
            // If we added more than 5, only the last 5 should remain
            if (popups.length > 5) {
              expect(queue.length).toBe(5)
            }
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Total preview XP should equal sum of queue
     */
    it('should correctly calculate total preview XP', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 500 }),
            { minLength: 1, maxLength: 5 } // Keep within queue limit
          ),
          (amounts) => {
            const system = getEngagementFeedbackSystem()
            
            // Add popups
            for (const amount of amounts) {
              system.showXpPreview(amount, 'Test')
            }
            
            const queue = system.getXpPopupQueue()
            const expectedTotal = queue.reduce((sum, p) => sum + p.amount, 0)
            const actualTotal = system.getTotalPreviewXp()
            
            expect(actualTotal).toBe(expectedTotal)
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Event emission', () => {
    /**
     * Property: All feedback events should be emitted to all subscribers
     */
    it('should emit events to all subscribers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Number of subscribers
          fc.integer({ min: 1, max: 20 }), // Number of events
          (subscriberCount, eventCount) => {
            const system = getEngagementFeedbackSystem()
            const receivedEvents: FeedbackEvent[][] = []
            
            // Add subscribers
            const unsubscribers: (() => void)[] = []
            for (let i = 0; i < subscriberCount; i++) {
              const events: FeedbackEvent[] = []
              receivedEvents.push(events)
              unsubscribers.push(system.subscribe(event => events.push(event)))
            }
            
            // Emit events
            for (let i = 0; i < eventCount; i++) {
              system.showXpPreview(50, `Event ${i}`)
            }
            
            // All subscribers should receive all events
            for (const events of receivedEvents) {
              expect(events.length).toBe(eventCount)
            }
            
            // Cleanup
            unsubscribers.forEach(unsub => unsub())
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Unsubscribed listeners should not receive events
     */
    it('should not emit to unsubscribed listeners', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (eventCount) => {
            const system = getEngagementFeedbackSystem()
            const events: FeedbackEvent[] = []
            
            // Subscribe then unsubscribe
            const unsubscribe = system.subscribe(event => events.push(event))
            unsubscribe()
            
            // Emit events
            for (let i = 0; i < eventCount; i++) {
              system.showXpPreview(50, `Event ${i}`)
            }
            
            // Should not have received any events
            expect(events.length).toBe(0)
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Streak tracking', () => {
    /**
     * Property: Answer streak should update correctly
     */
    it('should track answer streaks correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timeMs: fc.integer({ min: 500, max: 10000 }),
              streak: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (answers) => {
            const system = getEngagementFeedbackSystem()
            
            for (const answer of answers) {
              system.onCorrectAnswer(answer.timeMs, answer.streak)
            }
            
            // Current streak should be the last one set
            const lastStreak = answers[answers.length - 1].streak
            expect(system.getCurrentStreak()).toBe(lastStreak)
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Kill streak should update correctly
     */
    it('should track kill streaks correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 20 }),
            { minLength: 1, maxLength: 30 }
          ),
          (killStreaks) => {
            const system = getEngagementFeedbackSystem()
            
            for (const streak of killStreaks) {
              system.onKillConfirmed(streak)
            }
            
            // Current kill streak should be the last one set
            const lastStreak = killStreaks[killStreaks.length - 1]
            expect(system.getCurrentKillStreak()).toBe(lastStreak)
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Configuration', () => {
    /**
     * Property: Configuration changes should be reflected
     */
    it('should apply configuration changes', () => {
      fc.assert(
        fc.property(
          fc.record({
            correctAnswerParticles: fc.boolean(),
            killConfirmationEffect: fc.boolean(),
            streakAnnouncements: fc.boolean(),
            previewXpPopups: fc.boolean(),
          }),
          (config: FeedbackConfig) => {
            const system = getEngagementFeedbackSystem()
            
            system.configure(config)
            const appliedConfig = system.getConfig()
            
            expect(appliedConfig.correctAnswerParticles).toBe(config.correctAnswerParticles)
            expect(appliedConfig.killConfirmationEffect).toBe(config.killConfirmationEffect)
            expect(appliedConfig.streakAnnouncements).toBe(config.streakAnnouncements)
            expect(appliedConfig.previewXpPopups).toBe(config.previewXpPopups)
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Disabled popups should not be added to queue
     */
    it('should respect previewXpPopups config', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.integer({ min: 1, max: 20 }),
          (popupsEnabled, eventCount) => {
            const system = getEngagementFeedbackSystem()
            system.configure({ previewXpPopups: popupsEnabled })
            
            for (let i = 0; i < eventCount; i++) {
              system.showXpPreview(50, `Event ${i}`)
            }
            
            const queue = system.getXpPopupQueue()
            
            if (popupsEnabled) {
              expect(queue.length).toBeGreaterThan(0)
            } else {
              expect(queue.length).toBe(0)
            }
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Milestone handling', () => {
    /**
     * Property: Milestone events should include XP bonus popup
     */
    it('should show XP popup for milestone with bonus', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            xpBonus: fc.integer({ min: 0, max: 500 }),
          }),
          (milestoneData) => {
            const system = getEngagementFeedbackSystem()
            system.configure({ previewXpPopups: true })
            
            const milestone: GuestMilestone = {
              ...milestoneData,
              condition: () => true,
            }
            
            const events: FeedbackEvent[] = []
            system.subscribe(event => events.push(event))
            
            system.showMilestoneUnlocked(milestone)
            
            // Should emit milestone event
            const milestoneEvent = events.find(e => e.type === 'milestone_unlocked')
            expect(milestoneEvent).toBeDefined()
            
            // If xpBonus > 0, should also emit XP preview
            if (milestone.xpBonus > 0) {
              const xpEvent = events.find(e => e.type === 'xp_preview')
              expect(xpEvent).toBeDefined()
            }
            
            EngagementFeedbackSystem.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
