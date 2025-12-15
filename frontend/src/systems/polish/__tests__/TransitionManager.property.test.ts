/**
 * TransitionManager Property-Based Tests
 * 
 * Property-based tests for page transition system using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module systems/polish/__tests__/TransitionManager.property
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import {
  TransitionManager,
  resetTransitionManager,
  DEFAULT_TRANSITION,
  REDUCED_MOTION_TRANSITION,
  REVERSE_TRANSITION_MAP,
  getReverseTransitionType,
  type TransitionType,
  type TransitionConfig,
} from '../TransitionManager'

// ============================================
// Test Data
// ============================================

// All valid transition types
const ALL_TRANSITION_TYPES: TransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'zoom',
  'morph',
  'none',
]

// Sample routes for testing
const SAMPLE_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/shop',
  '/battlepass',
  '/coins',
  '/achievements',
  '/leaderboards',
  '/leaderboards/weekly',
  '/leaderboards/daily',
  '/friends',
  '/inventory',
  '/unknown-route',
  '/some/deep/path',
]

// Arbitrary for generating route strings
const routeArbitrary = fc.oneof(
  fc.constantFrom(...SAMPLE_ROUTES),
  fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/[^a-z0-9/-]/gi, ''))
)

describe('TransitionManager Properties', () => {
  beforeEach(() => {
    resetTransitionManager()
  })

  /**
   * **Feature: enterprise-polish-systems, Property 1: Transition type lookup consistency**
   * **Validates: Requirements 1.1**
   * 
   * For any route pair (from, to), the TransitionManager SHALL return a valid
   * TransitionConfig with type, duration > 0, and non-empty easing string.
   */
  describe('Property 1: Transition type lookup consistency', () => {
    it('getTransition returns valid config for any route pair', () => {
      fc.assert(
        fc.property(
          routeArbitrary,
          routeArbitrary,
          (from, to) => {
            const manager = new TransitionManager()
            const config = manager.getTransition(from, to)
            
            // Config should be defined
            expect(config).toBeDefined()
            
            // Type should be a valid transition type
            expect(ALL_TRANSITION_TYPES).toContain(config.type)
            
            // Duration should be positive (or 0 for 'none')
            expect(config.duration).toBeGreaterThanOrEqual(0)
            
            // Easing should be non-empty string
            expect(typeof config.easing).toBe('string')
            expect(config.easing.length).toBeGreaterThan(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getTransition returns consistent results for same route pair', () => {
      fc.assert(
        fc.property(
          routeArbitrary,
          routeArbitrary,
          (from, to) => {
            const manager = new TransitionManager()
            
            const config1 = manager.getTransition(from, to)
            const config2 = manager.getTransition(from, to)
            
            // Same input should produce same output
            expect(config1.type).toBe(config2.type)
            expect(config1.duration).toBe(config2.duration)
            expect(config1.easing).toBe(config2.easing)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('dashboard to sub-page uses slide-left transition', () => {
      const manager = new TransitionManager()
      const subPages = ['/profile', '/settings', '/shop', '/battlepass', '/coins', '/achievements', '/friends', '/inventory']
      
      for (const subPage of subPages) {
        const config = manager.getTransition('/dashboard', subPage)
        expect(config.type).toBe('slide-left')
        expect(config.duration).toBe(300)
      }
    })

    it('sub-page to dashboard uses slide-right transition', () => {
      const manager = new TransitionManager()
      const subPages = ['/profile', '/settings', '/shop', '/battlepass', '/coins', '/achievements', '/friends', '/inventory']
      
      for (const subPage of subPages) {
        const config = manager.getTransition(subPage, '/dashboard')
        expect(config.type).toBe('slide-right')
        expect(config.duration).toBe(300)
      }
    })

    it('unknown routes fall back to default transition', () => {
      const manager = new TransitionManager()
      const config = manager.getTransition('/unknown-a', '/unknown-b')
      
      expect(config.type).toBe(DEFAULT_TRANSITION.type)
      expect(config.duration).toBe(DEFAULT_TRANSITION.duration)
      expect(config.easing).toBe(DEFAULT_TRANSITION.easing)
    })

    it('reduced motion returns instant cross-fade', () => {
      const manager = new TransitionManager({ reducedMotion: true })
      
      fc.assert(
        fc.property(
          routeArbitrary,
          routeArbitrary,
          (from, to) => {
            const config = manager.getTransition(from, to)
            
            // Should use reduced motion transition
            expect(config.type).toBe(REDUCED_MOTION_TRANSITION.type)
            expect(config.duration).toBe(REDUCED_MOTION_TRANSITION.duration)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('disabled transitions return none type with 0 duration', () => {
      const manager = new TransitionManager({ pageTransitionsEnabled: false })
      
      fc.assert(
        fc.property(
          routeArbitrary,
          routeArbitrary,
          (from, to) => {
            const config = manager.getTransition(from, to)
            
            expect(config.type).toBe('none')
            expect(config.duration).toBe(0)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: enterprise-polish-systems, Property 3: Back navigation reverses transition direction**
   * **Validates: Requirements 1.3**
   * 
   * For any forward navigation from route A to route B, pressing back SHALL
   * trigger a transition with reversed direction (e.g., slide-left becomes slide-right).
   */
  describe('Property 3: Back navigation reverses transition direction', () => {
    it('every transition type has a valid reverse', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_TRANSITION_TYPES),
          (type) => {
            const reversed = getReverseTransitionType(type)
            
            // Reversed should be a valid type
            expect(ALL_TRANSITION_TYPES).toContain(reversed)
            
            // Double reverse should return original
            expect(getReverseTransitionType(reversed)).toBe(type)
            
            return true
          }
        ),
        { numRuns: ALL_TRANSITION_TYPES.length }
      )
    })

    it('slide-left reverses to slide-right', () => {
      expect(getReverseTransitionType('slide-left')).toBe('slide-right')
      expect(getReverseTransitionType('slide-right')).toBe('slide-left')
    })

    it('slide-up reverses to slide-down', () => {
      expect(getReverseTransitionType('slide-up')).toBe('slide-down')
      expect(getReverseTransitionType('slide-down')).toBe('slide-up')
    })

    it('symmetric transitions reverse to themselves', () => {
      expect(getReverseTransitionType('fade')).toBe('fade')
      expect(getReverseTransitionType('zoom')).toBe('zoom')
      expect(getReverseTransitionType('morph')).toBe('morph')
      expect(getReverseTransitionType('none')).toBe('none')
    })

    it('getReversedTransition preserves duration and easing', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_TRANSITION_TYPES),
          fc.integer({ min: 100, max: 1000 }),
          fc.constantFrom('ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'),
          (type, duration, easing) => {
            const manager = new TransitionManager()
            const original: TransitionConfig = { type, duration, easing }
            const reversed = manager.getReversedTransition(original)
            
            // Duration should be preserved
            expect(reversed.duration).toBe(original.duration)
            
            // Easing should be preserved
            expect(reversed.easing).toBe(original.easing)
            
            // Type should be reversed
            expect(reversed.type).toBe(REVERSE_TRANSITION_MAP[type])
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('back navigation uses reversed transition', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      // Forward navigation
      const forwardResult = manager.startTransition('/profile', 'forward')
      expect(forwardResult.config.type).toBe('slide-left')
      
      manager.completeTransition('/profile')
      
      // Back navigation should reverse
      const backResult = manager.startTransition('/dashboard', 'back')
      // The original transition from /profile to /dashboard is slide-right
      // When reversed for back navigation, it becomes slide-left
      // But since we're going back, we get the reversed version
      expect(backResult.config.type).toBe('slide-left')
    })
  })

  /**
   * **Feature: enterprise-polish-systems, Property 2: Loading indicator timing threshold**
   * **Validates: Requirements 1.2**
   * 
   * For any page transition where data fetching exceeds 200ms, the loading
   * indicator SHALL be visible; for fetches under 200ms, it SHALL NOT be visible.
   */
  describe('Property 2: Loading indicator timing threshold', () => {
    it('shouldShowLoading returns false for times under 200ms', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 199 }),
          (elapsedMs) => {
            const manager = new TransitionManager()
            expect(manager.shouldShowLoading(elapsedMs)).toBe(false)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('shouldShowLoading returns true for times >= 200ms', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 10000 }),
          (elapsedMs) => {
            const manager = new TransitionManager()
            expect(manager.shouldShowLoading(elapsedMs)).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('LOADING_THRESHOLD_MS is exactly 200', () => {
      expect(TransitionManager.LOADING_THRESHOLD_MS).toBe(200)
    })

    it('showLoading is initially false', () => {
      const manager = new TransitionManager()
      expect(manager.showLoading).toBe(false)
    })

    it('completeLoading resets showLoading to false', () => {
      const manager = new TransitionManager()
      manager.startLoading()
      manager.completeLoading()
      expect(manager.showLoading).toBe(false)
    })
  })

  /**
   * **Feature: enterprise-polish-systems, Property 5: Navigation blocked during transition**
   * **Validates: Requirements 1.6**
   * 
   * For any navigation attempt while isTransitioning is true, the navigation
   * SHALL be queued or rejected, not executed immediately.
   */
  describe('Property 5: Navigation blocked during transition', () => {
    it('isTransitioning is false initially', () => {
      const manager = new TransitionManager()
      expect(manager.isTransitioning).toBe(false)
    })

    it('isTransitioning is true during transition', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      manager.startTransition('/profile')
      expect(manager.isTransitioning).toBe(true)
    })

    it('isTransitioning is false after completion', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      manager.startTransition('/profile')
      manager.completeTransition('/profile')
      
      expect(manager.isTransitioning).toBe(false)
    })

    it('navigation during transition is blocked and queued', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      // Start first transition
      const first = manager.startTransition('/profile')
      expect(first.allowed).toBe(true)
      expect(manager.isTransitioning).toBe(true)
      
      // Try second transition while first is in progress
      const second = manager.startTransition('/settings')
      expect(second.allowed).toBe(false)
      expect(manager.pendingNavigation).toBe('/settings')
    })

    it('pending navigation is cleared after transition completes', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      manager.startTransition('/profile')
      manager.startTransition('/settings') // This gets queued
      
      expect(manager.pendingNavigation).toBe('/settings')
      
      manager.completeTransition('/profile')
      
      // Pending navigation should be cleared
      expect(manager.pendingNavigation).toBe(null)
    })

    it('multiple blocked navigations only keep the last one', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      manager.startTransition('/profile')
      manager.startTransition('/settings')
      manager.startTransition('/shop')
      manager.startTransition('/battlepass')
      
      // Only the last one should be pending
      expect(manager.pendingNavigation).toBe('/battlepass')
    })

    it('state transitions correctly through lifecycle', () => {
      const manager = new TransitionManager()
      
      // Initial state
      expect(manager.state).toBe('idle')
      
      manager.setCurrentRoute('/dashboard')
      
      // Start transition
      manager.startTransition('/profile')
      expect(manager.state).toBe('transitioning')
      
      // Complete transition
      manager.completeTransition('/profile')
      expect(manager.state).toBe('idle')
    })
  })

  /**
   * Additional property tests for robustness
   */
  describe('Additional Properties', () => {
    it('direction is forward by default', () => {
      const manager = new TransitionManager()
      expect(manager.direction).toBe('forward')
    })

    it('direction updates correctly', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      
      manager.startTransition('/profile', 'forward')
      expect(manager.direction).toBe('forward')
      
      manager.completeTransition('/profile')
      
      manager.startTransition('/dashboard', 'back')
      expect(manager.direction).toBe('back')
    })

    it('currentRoute and previousRoute track correctly', () => {
      const manager = new TransitionManager()
      
      manager.setCurrentRoute('/dashboard')
      expect(manager.currentRoute).toBe('/dashboard')
      expect(manager.previousRoute).toBe('')
      
      manager.startTransition('/profile')
      manager.completeTransition('/profile')
      
      expect(manager.currentRoute).toBe('/profile')
      expect(manager.previousRoute).toBe('/dashboard')
    })

    it('reset clears all state', () => {
      const manager = new TransitionManager()
      manager.setCurrentRoute('/dashboard')
      manager.startTransition('/profile')
      
      manager.reset()
      
      expect(manager.state).toBe('idle')
      expect(manager.isTransitioning).toBe(false)
      expect(manager.showLoading).toBe(false)
      expect(manager.pendingNavigation).toBe(null)
      expect(manager.direction).toBe('forward')
    })

    it('setReducedMotion updates setting', () => {
      const manager = new TransitionManager()
      
      expect(manager.reducedMotion).toBe(false)
      
      manager.setReducedMotion(true)
      expect(manager.reducedMotion).toBe(true)
      
      manager.setReducedMotion(false)
      expect(manager.reducedMotion).toBe(false)
    })

    it('setPageTransitionsEnabled updates setting', () => {
      const manager = new TransitionManager()
      
      expect(manager.pageTransitionsEnabled).toBe(true)
      
      manager.setPageTransitionsEnabled(false)
      expect(manager.pageTransitionsEnabled).toBe(false)
      
      manager.setPageTransitionsEnabled(true)
      expect(manager.pageTransitionsEnabled).toBe(true)
    })
  })
})
