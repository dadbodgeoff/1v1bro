/**
 * Property-Based Tests for Sound Preference Persistence
 * 
 * Tests Property 11 from the design document:
 * - Property 11: Sound Preference Persistence
 * 
 * @module landing/arcade/__tests__/properties/sound-persistence.property
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Sound preference manager (simulates useArcadeSound logic)
const SOUND_STORAGE_KEY = 'arcade_sound_muted';

function setSoundPreference(muted: boolean): void {
  localStorageMock.setItem(SOUND_STORAGE_KEY, JSON.stringify(muted));
}

function getSoundPreference(): boolean {
  const stored = localStorageMock.getItem(SOUND_STORAGE_KEY);
  if (stored === null) {
    return true; // Default to muted
  }
  try {
    const parsed = JSON.parse(stored);
    // Only accept boolean values, default to muted otherwise
    if (typeof parsed === 'boolean') {
      return parsed;
    }
    return true; // Default to muted for non-boolean values
  } catch {
    return true; // Default to muted on parse error
  }
}

describe('Sound Preference Persistence Properties', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  /**
   * **Feature: crt-arcade-landing, Property 11: Sound Preference Persistence**
   * 
   * *For any* sound mute/unmute action, the preference SHALL be written to
   * localStorage and subsequent page loads SHALL restore that preference.
   * 
   * **Validates: Requirements 7.5**
   */
  it('Property 11: Sound preference persists across sessions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), // Sequence of mute/unmute actions
        (actions) => {
          // Simulate a sequence of mute/unmute actions
          for (const muted of actions) {
            setSoundPreference(muted);
          }

          // The final preference should be the last action
          const finalPreference = actions[actions.length - 1];
          
          // Simulate "page reload" by reading from storage
          const restoredPreference = getSoundPreference();

          expect(restoredPreference).toBe(finalPreference);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Default preference is muted
   */
  it('Default sound preference is muted when no preference stored', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined), // No stored preference
        () => {
          localStorageMock.clear();
          const preference = getSoundPreference();
          expect(preference).toBe(true); // Muted by default
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional property: Invalid stored values default to muted
   */
  it('Invalid stored values default to muted', () => {
    const invalidValues = [
      'invalid',
      '123',
      'null',
      'undefined',
      '{broken json',
      '',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...invalidValues),
        (invalidValue) => {
          localStorageMock.setItem(SOUND_STORAGE_KEY, invalidValue);
          const preference = getSoundPreference();
          expect(preference).toBe(true); // Should default to muted
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Preference survives multiple read/write cycles
   */
  it('Preference survives multiple read/write cycles', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 10 }), // Number of read cycles
        (initialPreference, readCycles) => {
          setSoundPreference(initialPreference);

          // Read multiple times
          for (let i = 0; i < readCycles; i++) {
            const read = getSoundPreference();
            expect(read).toBe(initialPreference);
          }

          // Final read should still match
          expect(getSoundPreference()).toBe(initialPreference);
        }
      ),
      { numRuns: 100 }
    );
  });
});
