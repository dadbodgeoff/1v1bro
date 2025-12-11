/**
 * Property tests for SessionTransferFlow
 * 
 * Tests transfer data calculation, reward estimation, and welcome messages.
 * 
 * @module game/guest/__tests__/SessionTransferFlow.properties.test
 * Feature: guest-experience-enhancement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import {
  SessionTransferFlow,
  getSessionTransferFlow,
  calculateTransferRewards,
  type SessionTransferData,
} from '../SessionTransferFlow'
import { GuestSessionManager, type GuestSessionStats } from '../GuestSessionManager'
import { calculateMilestoneXpBonus } from '../MilestoneSystem'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

/**
 * Generate valid GuestSessionStats
 */
const guestSessionStatsArb = fc.record({
  sessionId: fc.uuid(),
  startedAt: fc.integer({ min: 0, max: Date.now() }),
  matchesPlayed: fc.integer({ min: 0, max: 100 }),
  matchesWon: fc.integer({ min: 0, max: 100 }),
  totalKills: fc.integer({ min: 0, max: 1000 }),
  totalDeaths: fc.integer({ min: 0, max: 1000 }),
  questionsAnswered: fc.integer({ min: 0, max: 1500 }),
  questionsCorrect: fc.integer({ min: 0, max: 1500 }),
  previewXpEarned: fc.integer({ min: 0, max: 50000 }),
  milestonesAchieved: fc.array(
    fc.constantFrom('first-win', 'triple-kill', 'quiz-master', 'veteran', 'sharpshooter'),
    { maxLength: 5 }
  ),
  categoriesPlayed: fc.array(fc.string(), { maxLength: 10 }),
}).filter(stats => 
  stats.matchesWon <= stats.matchesPlayed &&
  stats.questionsCorrect <= stats.questionsAnswered
)

describe('SessionTransferFlow', () => {
  beforeEach(() => {
    SessionTransferFlow.resetInstance()
    GuestSessionManager.resetInstance()
    localStorageMock.clear()
  })

  describe('Transfer reward calculation', () => {
    /**
     * Property: Transfer rewards should always include welcome bonus
     */
    it('should always include welcome bonus in rewards', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (session) => {
            const rewards = calculateTransferRewards(session)
            
            // Welcome bonus is 500 XP and 100 coins
            const WELCOME_XP = 500
            const WELCOME_COINS = 100
            
            // XP should be at least welcome bonus
            expect(rewards.xp).toBeGreaterThanOrEqual(WELCOME_XP)
            
            // Coins should be at least welcome bonus
            expect(rewards.coins).toBeGreaterThanOrEqual(WELCOME_COINS)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: XP should equal preview XP + milestone bonus + welcome bonus
     */
    it('should calculate XP correctly', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (session) => {
            const rewards = calculateTransferRewards(session)
            const milestoneBonus = calculateMilestoneXpBonus(session.milestonesAchieved)
            const WELCOME_XP = 500
            
            const expectedXp = session.previewXpEarned + milestoneBonus + WELCOME_XP
            expect(rewards.xp).toBe(expectedXp)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Coins should equal (preview XP * 0.1) + welcome bonus
     */
    it('should calculate coins correctly', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (session) => {
            const rewards = calculateTransferRewards(session)
            const WELCOME_COINS = 100
            const XP_TO_COINS_RATE = 0.1
            
            const earnedCoins = Math.floor(session.previewXpEarned * XP_TO_COINS_RATE)
            const expectedCoins = earnedCoins + WELCOME_COINS
            
            expect(rewards.coins).toBe(expectedCoins)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Unlocked items should correspond to milestones
     */
    it('should unlock correct items based on milestones', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (session) => {
            const rewards = calculateTransferRewards(session)
            
            // Check each milestone -> item mapping
            if (session.milestonesAchieved.includes('first-win')) {
              expect(rewards.unlockedItems).toContain('Victory Banner')
            }
            if (session.milestonesAchieved.includes('triple-kill')) {
              expect(rewards.unlockedItems).toContain('Eliminator Title')
            }
            if (session.milestonesAchieved.includes('quiz-master')) {
              expect(rewards.unlockedItems).toContain('Brain Icon')
            }
            if (session.milestonesAchieved.includes('veteran')) {
              expect(rewards.unlockedItems).toContain('Veteran Badge')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Rewards should be non-negative
     */
    it('should always return non-negative rewards', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (session) => {
            const rewards = calculateTransferRewards(session)
            
            expect(rewards.xp).toBeGreaterThanOrEqual(0)
            expect(rewards.coins).toBeGreaterThanOrEqual(0)
            expect(rewards.unlockedItems.length).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Transfer data calculation', () => {
    /**
     * Property: Transfer data calculation should preserve session stats
     * Tests the pure calculateTransferData method directly
     */
    it('should preserve session stats in calculated transfer data', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb.filter(s => s.matchesPlayed > 0),
          (session) => {
            // Add lastPlayedAt if missing
            const fullSession: GuestSessionStats = { 
              ...session, 
              lastPlayedAt: session.startedAt 
            }
            
            const flow = getSessionTransferFlow()
            const transferData = flow.calculateTransferData(fullSession)
            
            expect(transferData.matchesPlayed).toBe(session.matchesPlayed)
            expect(transferData.matchesWon).toBe(session.matchesWon)
            expect(transferData.previewXp).toBe(session.previewXpEarned)
            expect(transferData.milestonesAchieved).toEqual(session.milestonesAchieved)
            
            SessionTransferFlow.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Transferable session detection', () => {
    /**
     * Property: hasTransferableSession should return false when no session
     */
    it('should return false when no session exists', () => {
      localStorageMock.clear()
      const flow = getSessionTransferFlow()
      expect(flow.hasTransferableSession()).toBe(false)
      SessionTransferFlow.resetInstance()
    })

    /**
     * Property: No session should not be transferable
     */
    it('should return false when no session exists', () => {
      const flow = getSessionTransferFlow()
      expect(flow.hasTransferableSession()).toBe(false)
    })
  })

  describe('Welcome message generation', () => {
    /**
     * Property: Welcome message should mention wins if any
     */
    it('should mention wins in welcome message when applicable', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb.filter(s => s.matchesWon > 0),
          (session) => {
            const flow = getSessionTransferFlow()
            const transferData: SessionTransferData = {
              previewXp: session.previewXpEarned,
              matchesPlayed: session.matchesPlayed,
              matchesWon: session.matchesWon,
              milestonesAchieved: session.milestonesAchieved,
              estimatedRewards: calculateTransferRewards(session),
            }
            
            const message = flow.generateWelcomeMessage(transferData)
            
            // Should mention wins
            expect(message.toLowerCase()).toContain('win')
            
            SessionTransferFlow.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Welcome message should mention XP
     */
    it('should mention XP in welcome message', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb.filter(s => s.matchesPlayed > 0),
          (session) => {
            const flow = getSessionTransferFlow()
            const transferData: SessionTransferData = {
              previewXp: session.previewXpEarned,
              matchesPlayed: session.matchesPlayed,
              matchesWon: session.matchesWon,
              milestonesAchieved: session.milestonesAchieved,
              estimatedRewards: calculateTransferRewards(session),
            }
            
            const message = flow.generateWelcomeMessage(transferData)
            
            // Should mention XP
            expect(message.toLowerCase()).toContain('xp')
            
            SessionTransferFlow.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Transfer state management', () => {
    /**
     * Property: Transfer state should be clearable
     */
    it('should clear transfer state correctly', () => {
      const flow = getSessionTransferFlow()
      
      // Simulate having a result
      // @ts-expect-error - accessing private for testing
      flow.lastTransferResult = {
        success: true,
        xpCredited: 1000,
        coinsCredited: 100,
        achievementsUnlocked: [],
        welcomeMessage: 'Test',
      }
      
      expect(flow.getLastTransferResult()).not.toBeNull()
      
      flow.clearTransferState()
      
      expect(flow.getLastTransferResult()).toBeNull()
    })

    /**
     * Property: Transfer in progress flag should be accurate
     */
    it('should track transfer in progress state', () => {
      const flow = getSessionTransferFlow()
      
      expect(flow.isTransferInProgress()).toBe(false)
    })
  })
})
