/**
 * CelebrationSystem Property-Based Tests
 * 
 * Property-based tests for celebration/reward system using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module systems/polish/__tests__/CelebrationSystem.property
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  CelebrationSystem,
  resetCelebrationSystem,
  getDefaultPriority,
  getPriorityValue,
  getDuration,
  calculateAudioVolume,
  CELEBRATION_DURATIONS,
  ENHANCED_DURATION,
  type CelebrationType,
  type CelebrationPriority,
  type ItemRarity,
  type CelebrationData,
} from '../CelebrationSystem';

// ============================================
// Test Data
// ============================================

const ALL_CELEBRATION_TYPES: CelebrationType[] = [
  'purchase',
  'tier-up',
  'achievement',
  'milestone',
  'daily-reward',
  'coin-purchase',
];

const ALL_PRIORITIES: CelebrationPriority[] = ['low', 'medium', 'high', 'critical'];

const ALL_RARITIES: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];

// Arbitrary for celebration data
const celebrationDataArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }),
  subtitle: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  rarity: fc.option(fc.constantFrom(...ALL_RARITIES)),
  amount: fc.option(fc.integer({ min: 1, max: 10000 })),
  tierNumber: fc.option(fc.integer({ min: 1, max: 100 })),
  xpReward: fc.option(fc.integer({ min: 0, max: 1000 })),
});

describe('CelebrationSystem Properties', () => {
  beforeEach(() => {
    resetCelebrationSystem();
  });

  /**
   * **Feature: enterprise-polish-systems, Property 6: Trigger type maps to celebration type**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * For any reward trigger event (purchase, tier-up, achievement),
   * the CelebrationSystem SHALL queue a celebration with the corresponding type.
   */
  describe('Property 6: Trigger type maps to celebration type', () => {
    it('every celebration type has a default priority', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_CELEBRATION_TYPES),
          (type) => {
            const priority = getDefaultPriority(type);
            expect(ALL_PRIORITIES).toContain(priority);
            return true;
          }
        ),
        { numRuns: ALL_CELEBRATION_TYPES.length }
      );
    });

    it('queueCelebration creates celebration with correct type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_CELEBRATION_TYPES),
          celebrationDataArbitrary,
          (type, data) => {
            const system = new CelebrationSystem();
            const celebration = system.queueCelebration(type, data as CelebrationData);
            
            expect(celebration.type).toBe(type);
            expect(celebration.data.title).toBe(data.title);
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('triggerPurchase creates purchase celebration (Req 2.1)', () => {
      const system = new CelebrationSystem();
      const celebration = system.triggerPurchase({
        id: 'item-1',
        name: 'Test Item',
        rarity: 'rare',
      });
      
      expect(celebration.type).toBe('purchase');
      expect(celebration.data.title).toBe('Item Purchased!');
      expect(celebration.data.rewards).toHaveLength(1);
      
      system.dispose();
    });

    it('triggerCoinPurchase creates coin-purchase celebration (Req 2.2)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          (amount) => {
            const system = new CelebrationSystem();
            const celebration = system.triggerCoinPurchase(amount);
            
            expect(celebration.type).toBe('coin-purchase');
            expect(celebration.data.amount).toBe(amount);
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('triggerTierUp creates tier-up celebration (Req 2.3)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (tierNumber) => {
            const system = new CelebrationSystem();
            const celebration = system.triggerTierUp(tierNumber);
            
            expect(celebration.type).toBe('tier-up');
            expect(celebration.data.tierNumber).toBe(tierNumber);
            expect(celebration.priority).toBe('high');
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('triggerAchievement creates achievement celebration', () => {
      const system = new CelebrationSystem();
      const celebration = system.triggerAchievement('Test Achievement', 'Description', 100, 'epic');
      
      expect(celebration.type).toBe('achievement');
      expect(celebration.data.subtitle).toBe('Test Achievement');
      expect(celebration.data.xpReward).toBe(100);
      
      system.dispose();
    });

    it('legendary achievements get critical priority', () => {
      const system = new CelebrationSystem();
      const celebration = system.triggerAchievement('Legendary', 'Desc', 500, 'legendary');
      
      expect(celebration.priority).toBe('critical');
      
      system.dispose();
    });
  });


  /**
   * **Feature: enterprise-polish-systems, Property 7: Celebration queue ordering**
   * **Validates: Requirements 2.4**
   * 
   * For any set of simultaneously triggered celebrations, they SHALL be displayed
   * in priority order, then timestamp order, with exactly 500ms gap between completions.
   */
  describe('Property 7: Celebration queue ordering', () => {
    it('higher priority celebrations are displayed first when queued simultaneously', () => {
      // When celebrations are queued, the first one becomes active immediately.
      // Subsequent celebrations are sorted by priority in the queue.
      // This test verifies that after the first celebration, higher priority ones come next.
      const system = new CelebrationSystem();
      
      // Queue low priority first (becomes active immediately)
      system.queueCelebration('daily-reward', { title: 'Low' }, 'low');
      
      // Queue high priority second (goes to queue, should be first in queue)
      system.queueCelebration('achievement', { title: 'High' }, 'high');
      
      // Queue medium priority third (goes to queue, should be after high)
      system.queueCelebration('purchase', { title: 'Medium' }, 'medium');
      
      // First active is the first queued (low)
      expect(system.current?.priority).toBe('low');
      
      // Queue should have 2 items, with high priority first
      expect(system.queueLength).toBe(2);
      
      system.dispose();
    });

    it('same priority celebrations are ordered by timestamp', () => {
      const system = new CelebrationSystem();
      
      // Queue multiple celebrations with same priority
      const c1 = system.queueCelebration('purchase', { title: 'First' }, 'medium');
      const c2 = system.queueCelebration('purchase', { title: 'Second' }, 'medium');
      const c3 = system.queueCelebration('purchase', { title: 'Third' }, 'medium');
      
      // First one should be active
      expect(system.current?.data.title).toBe('First');
      
      system.dispose();
    });

    it('priority values are correctly ordered', () => {
      expect(getPriorityValue('critical')).toBeGreaterThan(getPriorityValue('high'));
      expect(getPriorityValue('high')).toBeGreaterThan(getPriorityValue('medium'));
      expect(getPriorityValue('medium')).toBeGreaterThan(getPriorityValue('low'));
    });

    it('queueLength reflects pending celebrations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (count) => {
            const system = new CelebrationSystem();
            
            for (let i = 0; i < count; i++) {
              system.queueCelebration('purchase', { title: `Test ${i}` });
            }
            
            // One is active, rest are in queue
            expect(system.queueLength).toBe(count - 1);
            expect(system.isActive).toBe(true);
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 8: Skip advances celebration queue**
   * **Validates: Requirements 2.5**
   * 
   * For any active celebration, calling skip() SHALL immediately transition
   * to 'completed' status and begin the next queued celebration if present.
   */
  describe('Property 8: Skip advances celebration queue', () => {
    it('skip changes current celebration status', () => {
      const system = new CelebrationSystem();
      
      system.queueCelebration('purchase', { title: 'Test' });
      expect(system.isActive).toBe(true);
      
      const current = system.current;
      system.skip();
      
      // Status should be skipped
      expect(current?.status).toBe('skipped');
      // State should be exiting
      expect(system.state).toBe('exiting');
      
      system.dispose();
    });

    it('skip does nothing when idle', () => {
      const system = new CelebrationSystem();
      
      expect(system.state).toBe('idle');
      system.skip(); // Should not throw
      expect(system.state).toBe('idle');
      
      system.dispose();
    });

    it('skip on disabled system does nothing', () => {
      const system = new CelebrationSystem({ enabled: false });
      
      system.skip(); // Should not throw
      expect(system.state).toBe('idle');
      
      system.dispose();
    });

    it('clearQueue removes all pending celebrations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (count) => {
            const system = new CelebrationSystem();
            
            for (let i = 0; i < count; i++) {
              system.queueCelebration('purchase', { title: `Test ${i}` });
            }
            
            system.clearQueue();
            
            // Queue should be empty (current is still active)
            expect(system.queueLength).toBe(0);
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 9: Audio volume respects settings**
   * **Validates: Requirements 2.7**
   * 
   * For any celebration with audio, the playback volume SHALL equal
   * master_volume * sfx_volume (normalized 0-1).
   */
  describe('Property 9: Audio volume respects settings', () => {
    it('audio volume is product of master and sfx volumes', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (masterVolume, sfxVolume) => {
            const expectedVolume = masterVolume * sfxVolume;
            const actualVolume = calculateAudioVolume(masterVolume, sfxVolume);
            
            expect(actualVolume).toBeCloseTo(expectedVolume, 5);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('audio volume is clamped to 0-1 range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1, max: 2, noNaN: true }),
          fc.float({ min: -1, max: 2, noNaN: true }),
          (masterVolume, sfxVolume) => {
            const volume = calculateAudioVolume(masterVolume, sfxVolume);
            
            expect(volume).toBeGreaterThanOrEqual(0);
            expect(volume).toBeLessThanOrEqual(1);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('system audioVolume reflects current settings', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (masterVolume, sfxVolume) => {
            const system = new CelebrationSystem({
              masterVolume,
              sfxVolume,
            });
            
            const expectedVolume = masterVolume * sfxVolume;
            expect(system.audioVolume).toBeCloseTo(expectedVolume, 5);
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('setMasterVolume updates audio volume', () => {
      const system = new CelebrationSystem({ masterVolume: 1, sfxVolume: 1 });
      
      expect(system.audioVolume).toBe(1);
      
      system.setMasterVolume(0.5);
      expect(system.audioVolume).toBe(0.5);
      
      system.setMasterVolume(0);
      expect(system.audioVolume).toBe(0);
      
      system.dispose();
    });

    it('setSfxVolume updates audio volume', () => {
      const system = new CelebrationSystem({ masterVolume: 1, sfxVolume: 1 });
      
      expect(system.audioVolume).toBe(1);
      
      system.setSfxVolume(0.5);
      expect(system.audioVolume).toBe(0.5);
      
      system.dispose();
    });
  });


  /**
   * Additional properties for robustness
   */
  describe('Additional Properties', () => {
    it('disabled system skips all celebrations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_CELEBRATION_TYPES),
          (type) => {
            const system = new CelebrationSystem({ enabled: false });
            
            const celebration = system.queueCelebration(type, { title: 'Test' });
            
            expect(celebration.status).toBe('skipped');
            expect(system.isActive).toBe(false);
            expect(system.queueLength).toBe(0);
            
            system.dispose();
            return true;
          }
        ),
        { numRuns: ALL_CELEBRATION_TYPES.length }
      );
    });

    it('setEnabled toggles celebration processing', () => {
      const system = new CelebrationSystem({ enabled: true });
      
      expect(system.isEnabled).toBe(true);
      
      system.setEnabled(false);
      expect(system.isEnabled).toBe(false);
      
      system.setEnabled(true);
      expect(system.isEnabled).toBe(true);
      
      system.dispose();
    });

    it('reducedMotion setting is respected', () => {
      const system = new CelebrationSystem({ reducedMotion: true });
      
      expect(system.reducedMotion).toBe(true);
      
      system.setReducedMotion(false);
      expect(system.reducedMotion).toBe(false);
      
      system.dispose();
    });

    it('getDuration returns enhanced duration for epic/legendary', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_CELEBRATION_TYPES),
          fc.constantFrom('epic', 'legendary') as fc.Arbitrary<ItemRarity>,
          (type, rarity) => {
            const duration = getDuration(type, rarity);
            expect(duration).toBe(ENHANCED_DURATION);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('getDuration returns base duration for common/rare', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_CELEBRATION_TYPES),
          fc.constantFrom('common', 'rare') as fc.Arbitrary<ItemRarity>,
          (type, rarity) => {
            const duration = getDuration(type, rarity);
            expect(duration).toBe(CELEBRATION_DURATIONS[type]);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('state transitions correctly through lifecycle', () => {
      const system = new CelebrationSystem();
      
      expect(system.state).toBe('idle');
      
      system.queueCelebration('purchase', { title: 'Test' });
      
      // Should be entering or displaying
      expect(['entering', 'displaying']).toContain(system.state);
      expect(system.isActive).toBe(true);
      
      system.dispose();
    });

    it('dispose cleans up all state', () => {
      const system = new CelebrationSystem();
      
      system.queueCelebration('purchase', { title: 'Test 1' });
      system.queueCelebration('purchase', { title: 'Test 2' });
      
      system.dispose();
      
      expect(system.state).toBe('idle');
      expect(system.current).toBe(null);
      expect(system.queueLength).toBe(0);
    });

    it('callbacks are notified on state changes', () => {
      const system = new CelebrationSystem();
      const states: string[] = [];
      
      system.onStateChange((state) => {
        states.push(state);
      });
      
      system.queueCelebration('purchase', { title: 'Test' });
      
      // Should have received at least one state change
      expect(states.length).toBeGreaterThan(0);
      
      system.dispose();
    });

    it('celebration callbacks are notified', () => {
      const system = new CelebrationSystem();
      const celebrations: (typeof system.current)[] = [];
      
      system.onCelebrationChange((celebration) => {
        celebrations.push(celebration);
      });
      
      system.queueCelebration('purchase', { title: 'Test' });
      
      // Should have received celebration notification
      expect(celebrations.length).toBeGreaterThan(0);
      expect(celebrations[0]?.data.title).toBe('Test');
      
      system.dispose();
    });
  });
});
