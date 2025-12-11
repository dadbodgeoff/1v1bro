/**
 * Property tests for SoftConversionPrompts
 * 
 * Tests prompt triggering logic, interaction tracking, and category suggestions.
 * 
 * @module game/guest/__tests__/SoftConversionPrompts.properties.test
 * Feature: guest-experience-enhancement
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import {
  SoftConversionPrompts,
  getSoftConversionPrompts,
  type ConversionPrompt,
  type PromptInteraction,
} from '../SoftConversionPrompts'
import { type GuestSessionStats } from '../GuestSessionManager'

/**
 * Generate valid GuestSessionStats
 */
const guestSessionStatsArb = fc.record({
  sessionId: fc.string({ minLength: 1, maxLength: 36 }),
  startedAt: fc.integer({ min: 0, max: Date.now() }),
  matchesPlayed: fc.integer({ min: 0, max: 100 }),
  matchesWon: fc.integer({ min: 0, max: 100 }),
  totalKills: fc.integer({ min: 0, max: 1000 }),
  totalDeaths: fc.integer({ min: 0, max: 1000 }),
  questionsAnswered: fc.integer({ min: 0, max: 1500 }),
  questionsCorrect: fc.integer({ min: 0, max: 1500 }),
  previewXpEarned: fc.integer({ min: 0, max: 50000 }),
  milestonesAchieved: fc.array(fc.string(), { maxLength: 12 }),
  categoriesPlayed: fc.array(fc.string(), { maxLength: 10 }),
}).filter(stats => 
  stats.matchesWon <= stats.matchesPlayed &&
  stats.questionsCorrect <= stats.questionsAnswered
)

describe('SoftConversionPrompts', () => {
  beforeEach(() => {
    SoftConversionPrompts.resetInstance()
  })

  describe('Property 7: Category suggestion probability', () => {
    /**
     * Property 7: Category suggestion probability
     * For any "Play Again" prompt after 3+ matches in the same category,
     * there SHALL be a non-zero probability (≥20%) of suggesting a different category.
     * 
     * Validates: Requirements 5.3
     */
    it('should suggest different category with ≥20% probability after 3+ matches', () => {
      // Run statistical test
      const iterations = 1000
      const categories = ['fortnite', 'nfl', 'sports', 'movies', 'music', 'general']
      
      for (const currentCategory of categories) {
        let suggestionCount = 0
        
        for (let i = 0; i < iterations; i++) {
          const prompts = getSoftConversionPrompts()
          const suggestion = prompts.suggestCategory(currentCategory, 3)
          
          if (suggestion !== null && suggestion !== currentCategory) {
            suggestionCount++
          }
          
          SoftConversionPrompts.resetInstance()
        }
        
        const suggestionRate = suggestionCount / iterations
        
        // Should suggest different category at least 20% of the time
        expect(suggestionRate).toBeGreaterThanOrEqual(0.2)
        
        // Should not suggest more than 50% (we set it to 30%)
        expect(suggestionRate).toBeLessThanOrEqual(0.5)
      }
    })

    /**
     * Property: Suggested category should never be the current category
     */
    it('should never suggest the same category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music', 'general'),
          fc.integer({ min: 3, max: 20 }),
          (currentCategory, matchesInCategory) => {
            const prompts = getSoftConversionPrompts()
            
            // Run multiple times since it's probabilistic
            for (let i = 0; i < 50; i++) {
              const suggestion = prompts.suggestCategory(currentCategory, matchesInCategory)
              
              // If a suggestion is made, it should be different
              if (suggestion !== null) {
                expect(suggestion).not.toBe(currentCategory)
              }
            }
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Should not suggest category before 3 matches
     */
    it('should not suggest category before 3 matches in same category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music', 'general'),
          fc.integer({ min: 0, max: 2 }),
          (currentCategory, matchesInCategory) => {
            const prompts = getSoftConversionPrompts()
            
            // Run multiple times
            for (let i = 0; i < 20; i++) {
              const suggestion = prompts.suggestCategory(currentCategory, matchesInCategory)
              expect(suggestion).toBeNull()
            }
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Prompt triggering', () => {
    /**
     * Property: First match prompt should trigger exactly at match 1
     */
    it('should trigger first match prompt at exactly 1 match', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (baseStats) => {
            const prompts = getSoftConversionPrompts()
            
            // Test with exactly 1 match
            const stats1: GuestSessionStats = { ...baseStats, matchesPlayed: 1 }
            const prompt1 = prompts.shouldShowPrompt(stats1)
            expect(prompt1?.id).toBe('first-match')
            
            // Mark as shown
            prompts.recordPromptInteraction('first-match', 'shown')
            
            // Should not show again
            const prompt1Again = prompts.shouldShowPrompt(stats1)
            expect(prompt1Again).toBeNull()
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Third match prompt should trigger exactly at match 3
     */
    it('should trigger third match prompt at exactly 3 matches', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (baseStats) => {
            const prompts = getSoftConversionPrompts()
            
            // Mark first match prompt as shown
            prompts.recordPromptInteraction('first-match', 'shown')
            
            // Test with exactly 3 matches
            const stats3: GuestSessionStats = { ...baseStats, matchesPlayed: 3 }
            const prompt3 = prompts.shouldShowPrompt(stats3)
            expect(prompt3?.id).toBe('third-match')
            
            // Should include stats in features
            expect(prompt3?.features).toBeDefined()
            expect(prompt3?.features?.length).toBeGreaterThan(0)
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Fifth match prompt should trigger exactly at match 5
     */
    it('should trigger fifth match prompt at exactly 5 matches', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (baseStats) => {
            const prompts = getSoftConversionPrompts()
            
            // Mark previous prompts as shown
            prompts.recordPromptInteraction('first-match', 'shown')
            prompts.recordPromptInteraction('third-match', 'shown')
            
            // Test with exactly 5 matches
            const stats5: GuestSessionStats = { ...baseStats, matchesPlayed: 5 }
            const prompt5 = prompts.shouldShowPrompt(stats5)
            expect(prompt5?.id).toBe('fifth-match')
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: No prompt should trigger at non-milestone match counts
     */
    it('should not trigger prompts at non-milestone match counts', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          fc.integer({ min: 6, max: 100 }),
          (baseStats, matchCount) => {
            const prompts = getSoftConversionPrompts()
            
            // Mark all prompts as shown
            prompts.recordPromptInteraction('first-match', 'shown')
            prompts.recordPromptInteraction('third-match', 'shown')
            prompts.recordPromptInteraction('fifth-match', 'shown')
            
            const stats: GuestSessionStats = { ...baseStats, matchesPlayed: matchCount }
            const prompt = prompts.shouldShowPrompt(stats)
            
            expect(prompt).toBeNull()
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Interaction tracking', () => {
    /**
     * Property: All interactions should be recorded
     */
    it('should record all prompt interactions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              promptId: fc.constantFrom('first-match', 'third-match', 'fifth-match', 'leaving'),
              action: fc.constantFrom('shown', 'clicked', 'dismissed') as fc.Arbitrary<PromptInteraction>,
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (interactions) => {
            const prompts = getSoftConversionPrompts()
            
            for (const { promptId, action } of interactions) {
              prompts.recordPromptInteraction(promptId, action)
            }
            
            const recorded = prompts.getInteractions()
            expect(recorded.length).toBe(interactions.length)
            
            // Verify each interaction was recorded
            for (let i = 0; i < interactions.length; i++) {
              expect(recorded[i].promptId).toBe(interactions[i].promptId)
              expect(recorded[i].action).toBe(interactions[i].action)
            }
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Shown prompts should be tracked
     */
    it('should track shown prompts correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('first-match', 'third-match', 'fifth-match', 'leaving'),
            { minLength: 1, maxLength: 10 }
          ),
          (promptIds) => {
            const prompts = getSoftConversionPrompts()
            const uniqueIds = [...new Set(promptIds)]
            
            for (const promptId of uniqueIds) {
              prompts.recordPromptInteraction(promptId, 'shown')
            }
            
            for (const promptId of uniqueIds) {
              expect(prompts.wasPromptShown(promptId)).toBe(true)
            }
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Dismissed prompts should be tracked
     */
    it('should track dismissed prompts correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('first-match', 'third-match', 'fifth-match', 'leaving'),
            { minLength: 1, maxLength: 10 }
          ),
          (promptIds) => {
            const prompts = getSoftConversionPrompts()
            const uniqueIds = [...new Set(promptIds)]
            
            for (const promptId of uniqueIds) {
              prompts.recordPromptInteraction(promptId, 'dismissed')
            }
            
            for (const promptId of uniqueIds) {
              expect(prompts.wasPromptDismissed(promptId)).toBe(true)
            }
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Guest indicator config', () => {
    /**
     * Property: Indicator urgency should increase with matches played
     */
    it('should increase urgency with more matches', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (baseStats) => {
            const prompts = getSoftConversionPrompts()
            
            // Low matches - no signup button
            const lowStats: GuestSessionStats = { ...baseStats, matchesPlayed: 1 }
            const lowConfig = prompts.getGuestIndicatorConfig(lowStats)
            expect(lowConfig.showSignupButton).toBe(false)
            
            // Medium matches - show signup button
            const medStats: GuestSessionStats = { ...baseStats, matchesPlayed: 3 }
            const medConfig = prompts.getGuestIndicatorConfig(medStats)
            expect(medConfig.showSignupButton).toBe(true)
            
            // High matches - show XP at risk
            const highStats: GuestSessionStats = { ...baseStats, matchesPlayed: 5, previewXpEarned: 500 }
            const highConfig = prompts.getGuestIndicatorConfig(highStats)
            expect(highConfig.showSignupButton).toBe(true)
            expect(highConfig.message).toContain('XP')
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Leaving prompt', () => {
    /**
     * Property: Leaving prompt should only show with meaningful progress
     */
    it('should only show leaving prompt with meaningful progress', () => {
      fc.assert(
        fc.property(
          guestSessionStatsArb,
          (baseStats) => {
            const prompts = getSoftConversionPrompts()
            
            // No progress - no prompt
            const noProgress: GuestSessionStats = { ...baseStats, matchesPlayed: 0, previewXpEarned: 0 }
            expect(prompts.getLeavingPrompt(noProgress)).toBeNull()
            
            // Low XP - no prompt
            const lowXp: GuestSessionStats = { ...baseStats, matchesPlayed: 1, previewXpEarned: 50 }
            expect(prompts.getLeavingPrompt(lowXp)).toBeNull()
            
            // Meaningful progress - show prompt
            const goodProgress: GuestSessionStats = { ...baseStats, matchesPlayed: 2, previewXpEarned: 200 }
            const prompt = prompts.getLeavingPrompt(goodProgress)
            expect(prompt).not.toBeNull()
            expect(prompt?.id).toBe('leaving')
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Reset functionality', () => {
    /**
     * Property: Reset should clear all state
     */
    it('should clear all state on reset', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('first-match', 'third-match', 'fifth-match'),
            { minLength: 1, maxLength: 5 }
          ),
          (promptIds) => {
            const prompts = getSoftConversionPrompts()
            
            // Add some state
            for (const promptId of promptIds) {
              prompts.recordPromptInteraction(promptId, 'shown')
              prompts.recordPromptInteraction(promptId, 'dismissed')
            }
            
            // Reset
            prompts.reset()
            
            // All state should be cleared
            expect(prompts.getInteractions()).toHaveLength(0)
            for (const promptId of promptIds) {
              expect(prompts.wasPromptShown(promptId)).toBe(false)
              expect(prompts.wasPromptDismissed(promptId)).toBe(false)
            }
            
            SoftConversionPrompts.resetInstance()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
