/**
 * Polish Store Property-Based Tests
 * 
 * Property-based tests for polish settings store using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module systems/polish/__tests__/polishStore.property
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { usePolishStore, DEFAULT_POLISH_SETTINGS, type PolishSettings } from '@/stores/polishStore'

describe('Polish Store Properties', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePolishStore.getState().reset()
  })

  /**
   * **Feature: enterprise-polish-systems, Property 26: Settings changes apply immediately**
   * **Validates: Requirements 7.2**
   * 
   * For any polish setting change, the corresponding system's behavior 
   * SHALL reflect the new value without page refresh.
   */
  describe('Property 26: Settings changes apply immediately', () => {
    it('applies setting changes immediately for any valid settings combination', () => {
      fc.assert(
        fc.property(
          fc.record({
            hapticFeedback: fc.boolean(),
            ambientEffects: fc.boolean(),
            celebrationAnimations: fc.boolean(),
            pageTransitions: fc.boolean(),
          }),
          (newSettings: PolishSettings) => {
            const store = usePolishStore.getState()
            
            // Apply the settings
            store.updateSettings(newSettings)
            
            // Get the updated state
            const updatedState = usePolishStore.getState()
            
            // Verify all settings were applied immediately
            expect(updatedState.settings.hapticFeedback).toBe(newSettings.hapticFeedback)
            expect(updatedState.settings.ambientEffects).toBe(newSettings.ambientEffects)
            expect(updatedState.settings.celebrationAnimations).toBe(newSettings.celebrationAnimations)
            expect(updatedState.settings.pageTransitions).toBe(newSettings.pageTransitions)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('applies partial setting updates immediately', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hapticFeedback',
            'ambientEffects', 
            'celebrationAnimations',
            'pageTransitions'
          ) as fc.Arbitrary<keyof PolishSettings>,
          fc.boolean(),
          (settingKey, value) => {
            const store = usePolishStore.getState()
            const previousSettings = { ...store.settings }
            
            // Apply partial update
            store.updateSettings({ [settingKey]: value })
            
            // Get updated state
            const updatedState = usePolishStore.getState()
            
            // The changed setting should reflect the new value
            expect(updatedState.settings[settingKey]).toBe(value)
            
            // Other settings should remain unchanged
            const otherKeys = Object.keys(previousSettings).filter(k => k !== settingKey) as (keyof PolishSettings)[]
            for (const key of otherKeys) {
              expect(updatedState.settings[key]).toBe(previousSettings[key])
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('maintains settings consistency after multiple rapid updates', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hapticFeedback: fc.boolean(),
              ambientEffects: fc.boolean(),
              celebrationAnimations: fc.boolean(),
              pageTransitions: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (settingsSequence: PolishSettings[]) => {
            const store = usePolishStore.getState()
            
            // Apply all settings in sequence
            for (const settings of settingsSequence) {
              store.updateSettings(settings)
            }
            
            // Final state should match the last settings applied
            const finalState = usePolishStore.getState()
            const lastSettings = settingsSequence[settingsSequence.length - 1]
            
            expect(finalState.settings.hapticFeedback).toBe(lastSettings.hapticFeedback)
            expect(finalState.settings.ambientEffects).toBe(lastSettings.ambientEffects)
            expect(finalState.settings.celebrationAnimations).toBe(lastSettings.celebrationAnimations)
            expect(finalState.settings.pageTransitions).toBe(lastSettings.pageTransitions)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('defaults to enabled settings for new users', () => {
      // Reset to simulate new user
      usePolishStore.getState().reset()
      
      const state = usePolishStore.getState()
      
      // All settings should default to true (enabled)
      expect(state.settings.hapticFeedback).toBe(DEFAULT_POLISH_SETTINGS.hapticFeedback)
      expect(state.settings.ambientEffects).toBe(DEFAULT_POLISH_SETTINGS.ambientEffects)
      expect(state.settings.celebrationAnimations).toBe(DEFAULT_POLISH_SETTINGS.celebrationAnimations)
      expect(state.settings.pageTransitions).toBe(DEFAULT_POLISH_SETTINGS.pageTransitions)
      
      // Verify defaults are all true
      expect(DEFAULT_POLISH_SETTINGS.hapticFeedback).toBe(true)
      expect(DEFAULT_POLISH_SETTINGS.ambientEffects).toBe(true)
      expect(DEFAULT_POLISH_SETTINGS.celebrationAnimations).toBe(true)
      expect(DEFAULT_POLISH_SETTINGS.pageTransitions).toBe(true)
    })

    it('performance score is clamped between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          (score) => {
            const store = usePolishStore.getState()
            store.setPerformanceScore(score)
            
            const updatedState = usePolishStore.getState()
            
            // Score should be clamped to 0-100 range
            expect(updatedState.performanceScore).toBeGreaterThanOrEqual(0)
            expect(updatedState.performanceScore).toBeLessThanOrEqual(100)
            
            // Verify clamping logic
            if (score < 0) {
              expect(updatedState.performanceScore).toBe(0)
            } else if (score > 100) {
              expect(updatedState.performanceScore).toBe(100)
            } else {
              expect(updatedState.performanceScore).toBe(score)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
