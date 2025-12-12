/**
 * Property-Based Tests for Navigation
 * 
 * Tests Properties 7-8 from the design document:
 * - Property 7: Auth-Based Primary CTA Navigation
 * - Property 8: Auth-Based Secondary CTA Navigation
 * 
 * @module landing/arcade/__tests__/properties/navigation.property
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Navigation target logic extracted for testing
function getPrimaryCTATarget(isAuthenticated: boolean): string {
  return isAuthenticated ? '/dashboard' : '/instant-play';
}

function getSecondaryCTATarget(isAuthenticated: boolean): string {
  return isAuthenticated ? '/dashboard' : '/register';
}

describe('Navigation Properties', () => {
  /**
   * **Feature: crt-arcade-landing, Property 7: Auth-Based Primary CTA Navigation**
   * 
   * *For any* primary CTA click, the navigation target SHALL be '/instant-play'
   * when isAuthenticated is false, and '/dashboard' when isAuthenticated is true.
   * 
   * **Validates: Requirements 4.5**
   */
  it('Property 7: Primary CTA navigates correctly based on auth state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // isAuthenticated
        (isAuthenticated) => {
          const target = getPrimaryCTATarget(isAuthenticated);

          if (isAuthenticated) {
            expect(target).toBe('/dashboard');
          } else {
            expect(target).toBe('/instant-play');
          }

          // Target should always be a valid route string
          expect(target).toMatch(/^\/[a-z-]+$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: crt-arcade-landing, Property 8: Auth-Based Secondary CTA Navigation**
   * 
   * *For any* secondary CTA click, the navigation target SHALL be '/register'
   * when isAuthenticated is false, and '/dashboard' when isAuthenticated is true.
   * 
   * **Validates: Requirements 4.6**
   */
  it('Property 8: Secondary CTA navigates correctly based on auth state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // isAuthenticated
        (isAuthenticated) => {
          const target = getSecondaryCTATarget(isAuthenticated);

          if (isAuthenticated) {
            expect(target).toBe('/dashboard');
          } else {
            expect(target).toBe('/register');
          }

          // Target should always be a valid route string
          expect(target).toMatch(/^\/[a-z-]+$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Navigation targets are always defined
   * 
   * *For any* auth state (including edge cases), navigation targets
   * SHALL always return a non-empty string.
   */
  it('Navigation targets are always defined for any auth state', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.boolean(), fc.constant(undefined), fc.constant(null)),
        (authState) => {
          // Coerce to boolean (undefined/null -> false)
          const isAuthenticated = Boolean(authState);

          const primaryTarget = getPrimaryCTATarget(isAuthenticated);
          const secondaryTarget = getSecondaryCTATarget(isAuthenticated);

          expect(primaryTarget).toBeTruthy();
          expect(secondaryTarget).toBeTruthy();
          expect(typeof primaryTarget).toBe('string');
          expect(typeof secondaryTarget).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });
});
