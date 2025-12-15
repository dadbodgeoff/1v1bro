/**
 * Property-based tests for EasterEggRegistry
 * 
 * Tests Properties 22-25 from the design document:
 * - Property 22: Easter egg sequence activates correctly
 * - Property 23: Easter egg discovery is recorded
 * - Property 24: Discovered eggs skip discovery animation
 * - Property 25: Sequence resets after timeout
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  EasterEggRegistry,
  EasterEgg,
  KONAMI_CODE,
  DEFAULT_SEQUENCE_TIMEOUT_MS,
  getSequenceForTrigger,
  getSequenceLength,
  isEasterEggAvailable,
} from '../EasterEggRegistry';

// ============================================
// Test Utilities
// ============================================

function createTestRegistry(options?: { sequenceTimeoutMs?: number }): EasterEggRegistry {
  const registry = new EasterEggRegistry({
    enabled: true,
    sequenceTimeoutMs: options?.sequenceTimeoutMs ?? DEFAULT_SEQUENCE_TIMEOUT_MS,
  });
  return registry;
}

function createKeySequenceEgg(id: string, keys: string[]): EasterEgg {
  return {
    id,
    name: `Test Egg ${id}`,
    hint: 'Test hint',
    trigger: { type: 'key-sequence', keys },
  };
}

function createClickSequenceEgg(id: string, target: string, count: number): EasterEgg {
  return {
    id,
    name: `Test Egg ${id}`,
    hint: 'Test hint',
    trigger: { type: 'click-sequence', target, count },
  };
}

// Arbitrary for valid key codes
const keyCodeArb = fc.constantFrom(
  'KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyI', 'KeyJ',
  'KeyK', 'KeyL', 'KeyM', 'KeyN', 'KeyO', 'KeyP', 'KeyQ', 'KeyR', 'KeyS', 'KeyT',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'
);

// Arbitrary for key sequences (2-10 keys)
const keySequenceArb = fc.array(keyCodeArb, { minLength: 2, maxLength: 10 });

// Arbitrary for click counts (2-10)
const clickCountArb = fc.integer({ min: 2, max: 10 });

// Arbitrary for target names
const targetNameArb = fc.constantFrom('logo', 'header', 'footer', 'avatar', 'button');

// ============================================
// Property 22: Easter egg sequence activates correctly
// ============================================

describe('Property 22: Easter egg sequence activates correctly', () => {
  it('should activate when exact key sequence is entered', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const registry = createTestRegistry();
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        // Enter the exact sequence
        let activation = null;
        for (const key of keys) {
          activation = registry.registerKeyInput(key);
        }
        
        // Should activate
        expect(activation).not.toBeNull();
        expect(activation?.egg.id).toBe('test-egg');
        
        registry.dispose();
      }),
      { numRuns: 100 }
    );
  });

  it('should activate when exact click count is reached', () => {
    fc.assert(
      fc.property(targetNameArb, clickCountArb, (target, count) => {
        const registry = createTestRegistry();
        const egg = createClickSequenceEgg('click-egg', target, count);
        registry.registerEasterEgg(egg);
        
        // Click the exact number of times
        let activation = null;
        for (let i = 0; i < count; i++) {
          activation = registry.registerClick(target);
        }
        
        // Should activate
        expect(activation).not.toBeNull();
        expect(activation?.egg.id).toBe('click-egg');
        
        registry.dispose();
      }),
      { numRuns: 100 }
    );
  });

  it('should not activate with incomplete sequence', () => {
    fc.assert(
      fc.property(
        keySequenceArb.filter(keys => keys.length >= 3),
        fc.integer({ min: 1, max: 100 }),
        (keys, seed) => {
          const registry = createTestRegistry();
          const egg = createKeySequenceEgg('test-egg', keys);
          registry.registerEasterEgg(egg);
          
          // Enter only part of the sequence (at least 1 less than full)
          const partialLength = Math.max(1, (seed % (keys.length - 1)));
          let activation = null;
          for (let i = 0; i < partialLength; i++) {
            activation = registry.registerKeyInput(keys[i]);
          }
          
          // Should not activate
          expect(activation).toBeNull();
          
          registry.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should activate Konami code correctly', () => {
    const registry = createTestRegistry();
    
    // Enter Konami code
    let activation = null;
    for (const key of KONAMI_CODE) {
      activation = registry.registerKeyInput(key);
    }
    
    // Should activate classic-gamer egg
    expect(activation).not.toBeNull();
    expect(activation?.egg.id).toBe('classic-gamer');
    
    registry.dispose();
  });

  it('should activate within 100ms of sequence completion', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const registry = createTestRegistry();
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        const startTime = Date.now();
        
        // Enter the sequence
        let activation = null;
        for (const key of keys) {
          activation = registry.registerKeyInput(key);
        }
        
        const endTime = Date.now();
        
        // Activation should be immediate (within 100ms)
        expect(activation).not.toBeNull();
        expect(endTime - startTime).toBeLessThan(100);
        
        registry.dispose();
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Property 23: Easter egg discovery is recorded
// ============================================

describe('Property 23: Easter egg discovery is recorded', () => {
  it('should record discovery after first activation', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const registry = createTestRegistry();
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        // Verify not discovered initially
        expect(registry.isDiscovered('test-egg')).toBe(false);
        
        // Activate
        for (const key of keys) {
          registry.registerKeyInput(key);
        }
        
        // Should be discovered
        expect(registry.isDiscovered('test-egg')).toBe(true);
        expect(registry.discovered).toContain('test-egg');
        
        registry.dispose();
      }),
      { numRuns: 100 }
    );
  });

  it('should include egg ID in discovered list after activation', () => {
    fc.assert(
      fc.property(
        fc.array(keySequenceArb, { minLength: 1, maxLength: 3 }),
        (keySequences) => {
          const registry = createTestRegistry();
          const eggIds: string[] = [];
          
          // Register multiple eggs
          keySequences.forEach((keys, index) => {
            const id = `egg-${index}`;
            eggIds.push(id);
            registry.registerEasterEgg(createKeySequenceEgg(id, keys));
          });
          
          // Activate first egg
          const firstKeys = keySequences[0];
          for (const key of firstKeys) {
            registry.registerKeyInput(key);
          }
          
          // First egg should be discovered
          expect(registry.discovered).toContain(eggIds[0]);
          
          registry.dispose();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should record discovery timestamp', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const registry = createTestRegistry();
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        const beforeTime = new Date().toISOString();
        
        // Activate
        for (const key of keys) {
          registry.registerKeyInput(key);
        }
        
        const afterTime = new Date().toISOString();
        
        // Check discovery record
        const discovery = registry.getDiscovery('test-egg');
        expect(discovery).toBeDefined();
        expect(discovery?.eggId).toBe('test-egg');
        expect(discovery?.discoveredAt).toBeDefined();
        expect(discovery?.discoveredAt >= beforeTime).toBe(true);
        expect(discovery?.discoveredAt <= afterTime).toBe(true);
        
        registry.dispose();
      }),
      { numRuns: 50 }
    );
  });

  it('should call discovery callback on first activation', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const discoveries: string[] = [];
        const registry = createTestRegistry();
        registry.onDiscovery((discovery) => {
          discoveries.push(discovery.eggId);
        });
        
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        // Activate
        for (const key of keys) {
          registry.registerKeyInput(key);
        }
        
        // Discovery callback should have been called
        expect(discoveries).toContain('test-egg');
        
        registry.dispose();
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Property 24: Discovered eggs skip discovery animation
// ============================================

describe('Property 24: Discovered eggs skip discovery animation', () => {
  it('should return discovery animation type on first activation', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const registry = createTestRegistry();
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        // First activation
        let activation = null;
        for (const key of keys) {
          activation = registry.registerKeyInput(key);
        }
        
        expect(activation?.animationType).toBe('discovery');
        expect(activation?.isFirstDiscovery).toBe(true);
        
        registry.dispose();
      }),
      { numRuns: 100 }
    );
  });

  it('should return repeat animation type on subsequent activations', () => {
    fc.assert(
      fc.property(keySequenceArb, (keys) => {
        const registry = createTestRegistry();
        const egg = createKeySequenceEgg('test-egg', keys);
        registry.registerEasterEgg(egg);
        
        // First activation
        for (const key of keys) {
          registry.registerKeyInput(key);
        }
        
        // Second activation
        let activation = null;
        for (const key of keys) {
          activation = registry.registerKeyInput(key);
        }
        
        expect(activation?.animationType).toBe('repeat');
        expect(activation?.isFirstDiscovery).toBe(false);
        
        registry.dispose();
      }),
      { numRuns: 100 }
    );
  });

  it('should consistently return repeat for already discovered eggs', () => {
    fc.assert(
      fc.property(
        keySequenceArb,
        fc.integer({ min: 2, max: 5 }),
        (keys, repeatCount) => {
          const registry = createTestRegistry();
          const egg = createKeySequenceEgg('test-egg', keys);
          registry.registerEasterEgg(egg);
          
          // First activation (discovery)
          for (const key of keys) {
            registry.registerKeyInput(key);
          }
          
          // Multiple subsequent activations
          for (let i = 0; i < repeatCount; i++) {
            let activation = null;
            for (const key of keys) {
              activation = registry.registerKeyInput(key);
            }
            
            expect(activation?.animationType).toBe('repeat');
            expect(activation?.isFirstDiscovery).toBe(false);
          }
          
          registry.dispose();
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Property 25: Sequence resets after timeout
// ============================================

describe('Property 25: Sequence resets after timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reset sequence progress after timeout', () => {
    fc.assert(
      fc.property(
        keySequenceArb.filter(keys => keys.length >= 3),
        (keys) => {
          const registry = createTestRegistry({ sequenceTimeoutMs: 3000 });
          const egg = createKeySequenceEgg('test-egg', keys);
          registry.registerEasterEgg(egg);
          
          // Enter partial sequence
          const partialLength = Math.floor(keys.length / 2);
          for (let i = 0; i < partialLength; i++) {
            registry.registerKeyInput(keys[i]);
          }
          
          // Verify progress exists
          expect(registry.getProgress('test-egg')).toBeGreaterThan(0);
          
          // Advance time past timeout
          vi.advanceTimersByTime(3001);
          
          // Progress should be reset to 0
          expect(registry.getProgress('test-egg')).toBe(0);
          
          registry.dispose();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reset click count after timeout', () => {
    fc.assert(
      fc.property(
        targetNameArb,
        clickCountArb.filter(count => count >= 3),
        (target, count) => {
          const registry = createTestRegistry({ sequenceTimeoutMs: 3000 });
          const egg = createClickSequenceEgg('click-egg', target, count);
          registry.registerEasterEgg(egg);
          
          // Click partial count
          const partialCount = Math.floor(count / 2);
          for (let i = 0; i < partialCount; i++) {
            registry.registerClick(target);
          }
          
          // Verify progress exists
          expect(registry.getProgress('click-egg')).toBeGreaterThan(0);
          
          // Advance time past timeout
          vi.advanceTimersByTime(3001);
          
          // Progress should be reset to 0
          expect(registry.getProgress('click-egg')).toBe(0);
          
          registry.dispose();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not reset if input received before timeout', () => {
    fc.assert(
      fc.property(
        keySequenceArb.filter(keys => keys.length >= 4),
        (keys) => {
          const registry = createTestRegistry({ sequenceTimeoutMs: 3000 });
          const egg = createKeySequenceEgg('test-egg', keys);
          registry.registerEasterEgg(egg);
          
          // Enter first key
          registry.registerKeyInput(keys[0]);
          
          // Wait less than timeout
          vi.advanceTimersByTime(2000);
          
          // Enter second key (resets timeout)
          registry.registerKeyInput(keys[1]);
          
          // Wait less than timeout again
          vi.advanceTimersByTime(2000);
          
          // Progress should still exist (2/n)
          expect(registry.getProgress('test-egg')).toBe(2 / keys.length);
          
          registry.dispose();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should require full sequence after timeout reset', () => {
    fc.assert(
      fc.property(
        keySequenceArb.filter(keys => keys.length >= 3),
        (keys) => {
          const registry = createTestRegistry({ sequenceTimeoutMs: 3000 });
          const egg = createKeySequenceEgg('test-egg', keys);
          registry.registerEasterEgg(egg);
          
          // Enter partial sequence
          const partialLength = Math.floor(keys.length / 2);
          for (let i = 0; i < partialLength; i++) {
            registry.registerKeyInput(keys[i]);
          }
          
          // Timeout
          vi.advanceTimersByTime(3001);
          
          // Now enter remaining keys (should not activate)
          let activation = null;
          for (let i = partialLength; i < keys.length; i++) {
            activation = registry.registerKeyInput(keys[i]);
          }
          
          // Should not activate (sequence was reset)
          expect(activation).toBeNull();
          
          // Enter full sequence now
          for (const key of keys) {
            activation = registry.registerKeyInput(key);
          }
          
          // Should activate
          expect(activation).not.toBeNull();
          
          registry.dispose();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should use 3000ms as default timeout', () => {
    const registry = createTestRegistry();
    const egg = createKeySequenceEgg('test-egg', ['KeyA', 'KeyB', 'KeyC']);
    registry.registerEasterEgg(egg);
    
    // Enter first key
    registry.registerKeyInput('KeyA');
    expect(registry.getProgress('test-egg')).toBeGreaterThan(0);
    
    // Wait less than 3000ms - should still have progress
    vi.advanceTimersByTime(2999);
    expect(registry.getProgress('test-egg')).toBeGreaterThan(0);
    
    // Wait to reach 3000ms - timeout fires and resets
    vi.advanceTimersByTime(1);
    expect(registry.getProgress('test-egg')).toBe(0);
    
    registry.dispose();
  });
});

// ============================================
// Additional Edge Case Tests
// ============================================

describe('EasterEggRegistry edge cases', () => {
  it('should handle disabled registry', () => {
    const registry = new EasterEggRegistry({ enabled: false });
    const egg = createKeySequenceEgg('test-egg', ['KeyA', 'KeyB']);
    registry.registerEasterEgg(egg);
    
    // Try to activate
    registry.registerKeyInput('KeyA');
    const activation = registry.registerKeyInput('KeyB');
    
    // Should not activate when disabled
    expect(activation).toBeNull();
    
    registry.dispose();
  });

  it('should handle time-limited eggs', () => {
    const registry = createTestRegistry();
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    
    const egg: EasterEgg = {
      id: 'expired-egg',
      name: 'Expired Egg',
      hint: 'Too late!',
      trigger: { type: 'key-sequence', keys: ['KeyA', 'KeyB'] },
      timeLimited: {
        startDate: pastDate.toISOString(),
        endDate: pastDate.toISOString(),
      },
    };
    registry.registerEasterEgg(egg);
    
    // Try to activate expired egg
    registry.registerKeyInput('KeyA');
    const activation = registry.registerKeyInput('KeyB');
    
    // Should not activate expired egg
    expect(activation).toBeNull();
    
    registry.dispose();
  });

  it('should handle wrong key in sequence', () => {
    const registry = createTestRegistry();
    const egg = createKeySequenceEgg('test-egg', ['KeyA', 'KeyB', 'KeyC']);
    registry.registerEasterEgg(egg);
    
    // Enter partial correct sequence
    registry.registerKeyInput('KeyA');
    expect(registry.getProgress('test-egg')).toBe(1/3);
    
    // Enter wrong key
    registry.registerKeyInput('KeyX');
    
    // Progress should reset (or restart if KeyX was first key)
    expect(registry.getProgress('test-egg')).toBe(0);
    
    registry.dispose();
  });

  it('should handle secret URL triggers', () => {
    const registry = createTestRegistry();
    const egg: EasterEgg = {
      id: 'secret-page',
      name: 'Secret Page',
      hint: 'Find the hidden path',
      trigger: { type: 'secret-url', path: '/secret' },
    };
    registry.registerEasterEgg(egg);
    
    // Check wrong URL
    let activation = registry.checkSecretUrl('/wrong');
    expect(activation).toBeNull();
    
    // Check correct URL
    activation = registry.checkSecretUrl('/secret');
    expect(activation).not.toBeNull();
    expect(activation?.egg.id).toBe('secret-page');
    
    registry.dispose();
  });
});

// ============================================
// Utility Function Tests
// ============================================

describe('Utility functions', () => {
  it('getSequenceForTrigger returns correct sequence for konami', () => {
    const sequence = getSequenceForTrigger({ type: 'konami' });
    expect(sequence).toEqual(KONAMI_CODE);
  });

  it('getSequenceForTrigger returns correct sequence for key-sequence', () => {
    const keys = ['KeyA', 'KeyB', 'KeyC'];
    const sequence = getSequenceForTrigger({ type: 'key-sequence', keys });
    expect(sequence).toEqual(keys);
  });

  it('getSequenceForTrigger returns null for click-sequence', () => {
    const sequence = getSequenceForTrigger({ type: 'click-sequence', target: 'logo', count: 5 });
    expect(sequence).toBeNull();
  });

  it('getSequenceLength returns correct length', () => {
    expect(getSequenceLength({ type: 'konami' })).toBe(KONAMI_CODE.length);
    expect(getSequenceLength({ type: 'key-sequence', keys: ['KeyA', 'KeyB'] })).toBe(2);
    expect(getSequenceLength({ type: 'click-sequence', target: 'logo', count: 7 })).toBe(7);
    expect(getSequenceLength({ type: 'secret-url', path: '/secret' })).toBe(1);
  });

  it('isEasterEggAvailable returns true for non-time-limited eggs', () => {
    const egg: EasterEgg = {
      id: 'test',
      name: 'Test',
      hint: 'Test',
      trigger: { type: 'konami' },
    };
    expect(isEasterEggAvailable(egg)).toBe(true);
  });

  it('isEasterEggAvailable returns correct value for time-limited eggs', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 86400000); // 1 day ago
    const future = new Date(now.getTime() + 86400000); // 1 day from now
    
    const activeEgg: EasterEgg = {
      id: 'active',
      name: 'Active',
      hint: 'Active',
      trigger: { type: 'konami' },
      timeLimited: {
        startDate: past.toISOString(),
        endDate: future.toISOString(),
      },
    };
    expect(isEasterEggAvailable(activeEgg)).toBe(true);
    
    const expiredEgg: EasterEgg = {
      id: 'expired',
      name: 'Expired',
      hint: 'Expired',
      trigger: { type: 'konami' },
      timeLimited: {
        startDate: past.toISOString(),
        endDate: past.toISOString(),
      },
    };
    expect(isEasterEggAvailable(expiredEgg)).toBe(false);
  });
});
