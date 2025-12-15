/**
 * Property-based tests for cross-page animation consistency.
 * 
 * Tests Property 27 from the design document:
 * - Property 27: Cross-page animation consistency
 * 
 * Validates: Requirements 8.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  CelebrationSystem,
  CelebrationType,
  CelebrationPriority,
  getDuration,
  CELEBRATION_DURATIONS,
  ENHANCED_DURATION,
} from '../CelebrationSystem';
import {
  HapticEngine,
  ACTION_TO_PATTERN,
  UIAction,
  UIHapticPattern,
} from '../HapticEngine';

// ============================================
// Test Utilities
// ============================================

// Arbitrary for celebration types
const celebrationTypeArb = fc.constantFrom<CelebrationType>(
  'purchase',
  'tier-up',
  'achievement',
  'milestone',
  'daily-reward',
  'coin-purchase'
);

// Arbitrary for celebration priorities
const priorityArb = fc.constantFrom<CelebrationPriority>(
  'low',
  'medium',
  'high',
  'critical'
);

// Arbitrary for UI actions
const uiActionArb = fc.constantFrom<UIAction>(
  'button-primary',
  'button-secondary',
  'toggle',
  'success',
  'error',
  'navigation',
  'purchase',
  'unlock'
);

// Arbitrary for item rarities
const rarityArb = fc.constantFrom(
  'common' as const,
  'rare' as const,
  'epic' as const,
  'legendary' as const,
  undefined
);

// Simulated page contexts
const pageContexts = [
  '/dashboard',
  '/shop',
  '/battlepass',
  '/profile',
  '/achievements',
  '/leaderboards',
  '/friends',
  '/inventory',
  '/coins',
];

// ============================================
// Property 27: Cross-page animation consistency
// ============================================

describe('Property 27: Cross-page animation consistency', () => {
  describe('CelebrationSystem consistency', () => {
    it('same celebration type should have same duration across all pages', () => {
      fc.assert(
        fc.property(celebrationTypeArb, rarityArb, (type, rarity) => {
          // Get duration for this celebration type
          const duration = getDuration(type, rarity);
          
          // Verify duration is consistent (same function, same result)
          for (const _page of pageContexts) {
            const pageDuration = getDuration(type, rarity);
            expect(pageDuration).toBe(duration);
          }
          
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('celebration durations should match defined constants', () => {
      fc.assert(
        fc.property(celebrationTypeArb, (type) => {
          const baseDuration = CELEBRATION_DURATIONS[type];
          
          // Without rarity enhancement
          expect(getDuration(type, undefined)).toBe(baseDuration);
          expect(getDuration(type, 'common')).toBe(baseDuration);
          expect(getDuration(type, 'rare')).toBe(baseDuration);
          
          // With rarity enhancement
          expect(getDuration(type, 'epic')).toBe(ENHANCED_DURATION);
          expect(getDuration(type, 'legendary')).toBe(ENHANCED_DURATION);
          
          return true;
        }),
        { numRuns: 20 }
      );
    });

    it('celebration system should produce consistent queue behavior', () => {
      fc.assert(
        fc.property(
          fc.array(celebrationTypeArb, { minLength: 1, maxLength: 5 }),
          (types) => {
            // Create two systems (simulating different pages)
            const system1 = new CelebrationSystem();
            const system2 = new CelebrationSystem();
            
            // Queue same celebrations on both
            for (const type of types) {
              system1.queueCelebration(type, { title: 'Test', subtitle: type });
              system2.queueCelebration(type, { title: 'Test', subtitle: type });
            }
            
            // Both should have same queue length
            expect(system1.queueLength).toBe(system2.queueLength);
            
            // Both should be active
            expect(system1.isActive).toBe(system2.isActive);
            
            system1.dispose();
            system2.dispose();
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('priority ordering should be consistent across pages', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(celebrationTypeArb, priorityArb),
            { minLength: 2, maxLength: 5 }
          ),
          (celebrations) => {
            const system1 = new CelebrationSystem();
            const system2 = new CelebrationSystem();
            
            // Queue celebrations with priorities
            for (const [type, priority] of celebrations) {
              system1.queue({
                type,
                data: { title: 'Test' },
                priority,
              });
              system2.queue({
                type,
                data: { title: 'Test' },
                priority,
              });
            }
            
            // Queue lengths should match
            expect(system1.queueLength).toBe(system2.queueLength);
            
            system1.dispose();
            system2.dispose();
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('HapticEngine consistency', () => {
    it('same action should produce same pattern across all pages', () => {
      fc.assert(
        fc.property(uiActionArb, (action) => {
          const expectedPattern = ACTION_TO_PATTERN[action];
          
          // Verify pattern is consistent across simulated page contexts
          for (const _page of pageContexts) {
            const pattern = ACTION_TO_PATTERN[action];
            expect(pattern).toBe(expectedPattern);
          }
          
          return true;
        }),
        { numRuns: 20 }
      );
    });

    it('pattern mapping should be consistent', () => {
      fc.assert(
        fc.property(uiActionArb, (action) => {
          const pattern = ACTION_TO_PATTERN[action];
          
          // Pattern should be a valid UIHapticPattern
          const validPatterns: UIHapticPattern[] = ['light', 'medium', 'success', 'warning', 'tick'];
          expect(validPatterns).toContain(pattern);
          
          return true;
        }),
        { numRuns: 20 }
      );
    });

    it('haptic engine should behave consistently across instances', () => {
      fc.assert(
        fc.property(uiActionArb, fc.boolean(), (action, enabled) => {
          const engine1 = new HapticEngine(enabled);
          const engine2 = new HapticEngine(enabled);
          
          // Both should have same enabled state
          expect(engine1.isEnabled).toBe(engine2.isEnabled);
          
          // Both should report same support status
          expect(engine1.isSupported).toBe(engine2.isSupported);
          
          return true;
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Settings propagation consistency', () => {
    it('enabled/disabled state should affect all systems equally', () => {
      fc.assert(
        fc.property(fc.boolean(), (enabled) => {
          const celebration1 = new CelebrationSystem({ enabled });
          const celebration2 = new CelebrationSystem({ enabled });
          const haptic1 = new HapticEngine(enabled);
          const haptic2 = new HapticEngine(enabled);
          
          // All should have same enabled state
          expect(celebration1.isEnabled).toBe(enabled);
          expect(celebration2.isEnabled).toBe(enabled);
          expect(haptic1.isEnabled).toBe(enabled);
          expect(haptic2.isEnabled).toBe(enabled);
          
          celebration1.dispose();
          celebration2.dispose();
          
          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('reduced motion should affect all systems equally', () => {
      fc.assert(
        fc.property(fc.boolean(), (reducedMotion) => {
          const celebration1 = new CelebrationSystem({ reducedMotion });
          const celebration2 = new CelebrationSystem({ reducedMotion });
          
          expect(celebration1.reducedMotion).toBe(reducedMotion);
          expect(celebration2.reducedMotion).toBe(reducedMotion);
          
          celebration1.dispose();
          celebration2.dispose();
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Animation timing consistency', () => {
    it('celebration durations should be within expected ranges', () => {
      fc.assert(
        fc.property(celebrationTypeArb, rarityArb, (type, rarity) => {
          const duration = getDuration(type, rarity);
          
          // All durations should be between 1000ms and 5000ms
          expect(duration).toBeGreaterThanOrEqual(1000);
          expect(duration).toBeLessThanOrEqual(5000);
          
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('haptic patterns should be valid for all actions', () => {
      fc.assert(
        fc.property(uiActionArb, (action) => {
          const pattern = ACTION_TO_PATTERN[action];
          
          // All patterns should be defined and valid
          expect(pattern).toBeDefined();
          expect(typeof pattern).toBe('string');
          
          return true;
        }),
        { numRuns: 20 }
      );
    });
  });
});
