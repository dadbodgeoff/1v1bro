/**
 * HapticEngine Property-Based Tests
 * 
 * Property-based tests for haptic feedback system using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module systems/polish/__tests__/HapticEngine.property
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import {
  HapticEngine,
  ACTION_TO_PATTERN,
  type UIAction,
  type UIHapticPattern,
  resetHapticEngine,
} from '../HapticEngine'

// All valid UI actions
const ALL_ACTIONS: UIAction[] = [
  'button-primary',
  'button-secondary',
  'toggle',
  'success',
  'error',
  'navigation',
  'purchase',
  'unlock',
  'scroll-boundary',
  'long-press',
  'drag',
  'drag-complete',
]

// All valid haptic patterns
const ALL_PATTERNS: UIHapticPattern[] = [
  'light',
  'medium',
  'success',
  'warning',
  'tick',
]

describe('HapticEngine Properties', () => {
  beforeEach(() => {
    resetHapticEngine()
  })

  /**
   * **Feature: enterprise-polish-systems, Property 10: Action type maps to haptic pattern**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**
   * 
   * For any UI action (button tap, toggle, success, error, navigation),
   * the HapticEngine SHALL trigger the pattern defined in ACTION_TO_PATTERN.
   */
  describe('Property 10: Action type maps to haptic pattern', () => {
    it('every action maps to a valid haptic pattern', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ACTIONS),
          (action) => {
            const pattern = ACTION_TO_PATTERN[action]
            
            // Pattern should be defined
            expect(pattern).toBeDefined()
            
            // Pattern should be one of the valid patterns
            expect(ALL_PATTERNS).toContain(pattern)
            
            return true
          }
        ),
        { numRuns: ALL_ACTIONS.length }
      )
    })

    it('getPatternForAction returns the correct pattern for any action', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ACTIONS),
          (action) => {
            const engine = new HapticEngine(true)
            const pattern = engine.getPatternForAction(action)
            
            // Should match the mapping
            expect(pattern).toBe(ACTION_TO_PATTERN[action])
            
            return true
          }
        ),
        { numRuns: ALL_ACTIONS.length }
      )
    })

    it('primary button maps to medium pattern (Req 3.1)', () => {
      expect(ACTION_TO_PATTERN['button-primary']).toBe('medium')
    })

    it('secondary button maps to light pattern (Req 3.4)', () => {
      expect(ACTION_TO_PATTERN['button-secondary']).toBe('light')
    })

    it('toggle maps to light pattern (Req 3.3)', () => {
      expect(ACTION_TO_PATTERN['toggle']).toBe('light')
    })

    it('success actions map to success pattern (Req 3.2)', () => {
      expect(ACTION_TO_PATTERN['success']).toBe('success')
      expect(ACTION_TO_PATTERN['purchase']).toBe('success')
      expect(ACTION_TO_PATTERN['unlock']).toBe('success')
    })

    it('error maps to warning pattern (Req 3.2)', () => {
      expect(ACTION_TO_PATTERN['error']).toBe('warning')
    })

    it('navigation maps to light pattern (Req 3.7)', () => {
      expect(ACTION_TO_PATTERN['navigation']).toBe('light')
    })

    it('all patterns have positive duration', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_PATTERNS),
          (pattern) => {
            const engine = new HapticEngine(true)
            const duration = engine.getPatternDuration(pattern)
            
            expect(duration).toBeGreaterThan(0)
            
            return true
          }
        ),
        { numRuns: ALL_PATTERNS.length }
      )
    })
  })

  /**
   * **Feature: enterprise-polish-systems, Property 11: Disabled haptics trigger nothing**
   * **Validates: Requirements 3.5**
   * 
   * For any haptic trigger call, WHEN haptic_feedback setting is false,
   * no vibration API call SHALL be made.
   */
  describe('Property 11: Disabled haptics trigger nothing', () => {
    it('isEnabled is false when constructed with false', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_PATTERNS),
          (pattern) => {
            // Create disabled engine
            const engine = new HapticEngine(false)
            
            // isEnabled should be false
            expect(engine.isEnabled).toBe(false)
            
            // Trigger should not throw (graceful handling)
            expect(() => engine.trigger(pattern)).not.toThrow()
            
            return true
          }
        ),
        { numRuns: ALL_PATTERNS.length }
      )
    })

    it('triggerAction respects disabled state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ACTIONS),
          (action) => {
            // Create disabled engine
            const engine = new HapticEngine(false)
            
            // isEnabled should be false
            expect(engine.isEnabled).toBe(false)
            
            // Trigger should not throw (graceful handling)
            expect(() => engine.triggerAction(action)).not.toThrow()
            
            return true
          }
        ),
        { numRuns: ALL_ACTIONS.length }
      )
    })

    it('setEnabled(false) disables haptics', () => {
      const engine = new HapticEngine(true)
      
      // Initially enabled
      expect(engine.isEnabled).toBe(true)
      
      // Disable
      engine.setEnabled(false)
      expect(engine.isEnabled).toBe(false)
    })

    it('setEnabled(true) enables haptics', () => {
      const engine = new HapticEngine(false)
      
      // Initially disabled
      expect(engine.isEnabled).toBe(false)
      
      // Enable
      engine.setEnabled(true)
      expect(engine.isEnabled).toBe(true)
    })

    it('enabled state can be toggled multiple times', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (enabledStates) => {
            const engine = new HapticEngine(true)
            
            for (const enabled of enabledStates) {
              engine.setEnabled(enabled)
              expect(engine.isEnabled).toBe(enabled)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: enterprise-polish-systems, Property 12: Unsupported haptics fail gracefully**
   * **Validates: Requirements 3.6**
   * 
   * For any haptic trigger call on a device without vibration support,
   * no exception SHALL be thrown and the call SHALL return silently.
   */
  describe('Property 12: Unsupported haptics fail gracefully', () => {
    it('trigger does not throw for any pattern and intensity', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_PATTERNS),
          fc.float({ min: 0, max: 1 }),
          (pattern, intensity) => {
            const engine = new HapticEngine(true)
            
            // Should not throw regardless of support
            expect(() => {
              engine.trigger(pattern, { intensity })
            }).not.toThrow()
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('triggerAction does not throw for any action', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ACTIONS),
          (action) => {
            const engine = new HapticEngine(true)
            
            // Should not throw regardless of support
            expect(() => {
              engine.triggerAction(action)
            }).not.toThrow()
            
            return true
          }
        ),
        { numRuns: ALL_ACTIONS.length }
      )
    })

    it('isSupported returns a boolean', () => {
      const engine = new HapticEngine(true)
      expect(typeof engine.isSupported).toBe('boolean')
    })

    it('dispose cleans up without errors', () => {
      const engine = new HapticEngine(true)
      
      // Should not throw
      expect(() => {
        engine.dispose()
      }).not.toThrow()
    })

    it('multiple triggers in sequence do not throw', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...ALL_ACTIONS), { minLength: 1, maxLength: 20 }),
          (actions) => {
            const engine = new HapticEngine(true)
            
            // Should not throw for any sequence
            expect(() => {
              for (const action of actions) {
                engine.triggerAction(action)
              }
            }).not.toThrow()
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
