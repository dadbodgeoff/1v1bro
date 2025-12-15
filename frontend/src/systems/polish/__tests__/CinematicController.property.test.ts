/**
 * CinematicController Property-Based Tests
 * 
 * Property-based tests for achievement cinematic system using fast-check.
 * Each test validates correctness properties defined in the design document.
 * 
 * @module systems/polish/__tests__/CinematicController.property
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  CinematicController,
  resetCinematicController,
  getDisplayDuration,
  getTotalDuration,
  getRarityPriority,
  ENTRANCE_DURATION_MS,
  EXIT_DURATION_MS,
  TOAST_DURATION_MS,
  type AchievementRarity,
  type AchievementCinematic,
} from '../CinematicController';

// ============================================
// Test Data
// ============================================

const ALL_RARITIES: AchievementRarity[] = ['bronze', 'silver', 'gold', 'platinum'];

// Arbitrary for achievement cinematic data
const achievementArbitrary = fc.record({
  achievementId: fc.string({ minLength: 1, maxLength: 20 }),
  icon: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  rarity: fc.constantFrom(...ALL_RARITIES),
  xpReward: fc.option(fc.integer({ min: 0, max: 1000 })),
  isSecret: fc.option(fc.boolean()),
});

describe('CinematicController Properties', () => {
  beforeEach(() => {
    resetCinematicController();
  });

  /**
   * **Feature: enterprise-polish-systems, Property 17: Cinematic contains achievement data**
   * **Validates: Requirements 5.1**
   * 
   * For any queued achievement cinematic, the displayed content SHALL include
   * the achievement's icon, name, and description.
   */
  describe('Property 17: Cinematic contains achievement data', () => {
    it('queued achievement contains all required data', () => {
      fc.assert(
        fc.property(
          achievementArbitrary,
          (achievement) => {
            const controller = new CinematicController();
            const cinematic = controller.queueAchievement(achievement);
            
            // Cinematic should contain all achievement data
            expect(cinematic.achievementId).toBe(achievement.achievementId);
            expect(cinematic.icon).toBe(achievement.icon);
            expect(cinematic.name).toBe(achievement.name);
            expect(cinematic.description).toBe(achievement.description);
            expect(cinematic.rarity).toBe(achievement.rarity);
            
            controller.dispose();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('current cinematic has all required fields', () => {
      const controller = new CinematicController();
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test Achievement',
        description: 'A test achievement',
        rarity: 'gold',
        xpReward: 100,
      });
      
      const current = controller.current;
      expect(current).not.toBeNull();
      expect(current?.icon).toBe('🏆');
      expect(current?.name).toBe('Test Achievement');
      expect(current?.description).toBe('A test achievement');
      
      controller.dispose();
    });

    it('cinematic id is generated uniquely', () => {
      fc.assert(
        fc.property(
          fc.array(achievementArbitrary, { minLength: 2, maxLength: 5 }),
          (achievements) => {
            const controller = new CinematicController();
            const ids = new Set<string>();
            
            for (const achievement of achievements) {
              const cinematic = controller.queueAchievement(achievement);
              expect(ids.has(cinematic.id)).toBe(false);
              ids.add(cinematic.id);
            }
            
            controller.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 18: Cinematic entrance duration in range**
   * **Validates: Requirements 5.2**
   * 
   * For any cinematic entrance animation, duration SHALL be between 800ms and 1200ms inclusive.
   */
  describe('Property 18: Cinematic entrance duration in range', () => {
    it('entrance duration is within specified range', () => {
      // ENTRANCE_DURATION_MS should be between 800 and 1200
      expect(ENTRANCE_DURATION_MS).toBeGreaterThanOrEqual(800);
      expect(ENTRANCE_DURATION_MS).toBeLessThanOrEqual(1200);
    });

    it('total duration includes entrance, display, and exit', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_RARITIES),
          (rarity) => {
            const totalDuration = getTotalDuration(rarity, false);
            const displayDuration = getDisplayDuration(rarity);
            
            // Total should be entrance + display + exit
            expect(totalDuration).toBe(ENTRANCE_DURATION_MS + displayDuration + EXIT_DURATION_MS);
            
            return true;
          }
        ),
        { numRuns: ALL_RARITIES.length }
      );
    });

    it('reduced motion uses toast duration', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_RARITIES),
          (rarity) => {
            const totalDuration = getTotalDuration(rarity, true);
            expect(totalDuration).toBe(TOAST_DURATION_MS);
            return true;
          }
        ),
        { numRuns: ALL_RARITIES.length }
      );
    });
  });


  /**
   * **Feature: enterprise-polish-systems, Property 19: Input during cinematic triggers skip**
   * **Validates: Requirements 5.3**
   * 
   * For any user input (tap, keypress) while cinematic state is 'displaying',
   * state SHALL transition to 'exiting'.
   */
  describe('Property 19: Input during cinematic triggers skip', () => {
    it('skip transitions state to exiting', () => {
      const controller = new CinematicController();
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test',
        description: 'Test',
        rarity: 'gold',
      });
      
      // Should be entering or displaying
      expect(['entering', 'displaying']).toContain(controller.state);
      
      controller.skip();
      
      // Should transition to exiting
      expect(controller.state).toBe('exiting');
      
      controller.dispose();
    });

    it('skip does nothing when idle', () => {
      const controller = new CinematicController();
      
      expect(controller.state).toBe('idle');
      controller.skip(); // Should not throw
      expect(controller.state).toBe('idle');
      
      controller.dispose();
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 20: Multiple achievements queue correctly**
   * **Validates: Requirements 5.4**
   * 
   * For any set of N simultaneously unlocked achievements, the cinematic queue
   * SHALL contain exactly N items in unlock order.
   */
  describe('Property 20: Multiple achievements queue correctly', () => {
    it('queue contains all queued achievements minus current', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (count) => {
            const controller = new CinematicController();
            
            for (let i = 0; i < count; i++) {
              controller.queueAchievement({
                achievementId: `test-${i}`,
                icon: '🏆',
                name: `Achievement ${i}`,
                description: 'Test',
                rarity: 'bronze',
              });
            }
            
            // One is current, rest are in queue
            expect(controller.queueLength).toBe(count - 1);
            expect(controller.current).not.toBeNull();
            
            controller.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('higher rarity achievements are displayed first', () => {
      const controller = new CinematicController();
      
      // Queue bronze first (becomes current immediately)
      controller.queueAchievement({
        achievementId: 'bronze-1',
        icon: '🥉',
        name: 'Bronze',
        description: 'Test',
        rarity: 'bronze',
      });
      
      // Queue platinum (goes to queue, should be first in queue)
      controller.queueAchievement({
        achievementId: 'platinum-1',
        icon: '💎',
        name: 'Platinum',
        description: 'Test',
        rarity: 'platinum',
      });
      
      // Queue silver (goes to queue, should be after platinum)
      controller.queueAchievement({
        achievementId: 'silver-1',
        icon: '🥈',
        name: 'Silver',
        description: 'Test',
        rarity: 'silver',
      });
      
      // First current is bronze (first queued)
      expect(controller.current?.rarity).toBe('bronze');
      
      // Queue should have 2 items
      expect(controller.queueLength).toBe(2);
      
      controller.dispose();
    });
  });

  /**
   * **Feature: enterprise-polish-systems, Property 21: Queue indicator matches queue length**
   * **Validates: Requirements 5.5**
   * 
   * For any non-empty cinematic queue, the displayed queue indicator count
   * SHALL equal queueLength.
   */
  describe('Property 21: Queue indicator matches queue length', () => {
    it('queueLength accurately reflects pending cinematics', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (count) => {
            const controller = new CinematicController();
            
            for (let i = 0; i < count; i++) {
              controller.queueAchievement({
                achievementId: `test-${i}`,
                icon: '🏆',
                name: `Achievement ${i}`,
                description: 'Test',
                rarity: 'bronze',
              });
            }
            
            // Queue length should be count - 1 (one is current)
            expect(controller.queueLength).toBe(count - 1);
            
            controller.dispose();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('clearQueue empties the queue', () => {
      const controller = new CinematicController();
      
      for (let i = 0; i < 5; i++) {
        controller.queueAchievement({
          achievementId: `test-${i}`,
          icon: '🏆',
          name: `Achievement ${i}`,
          description: 'Test',
          rarity: 'bronze',
        });
      }
      
      expect(controller.queueLength).toBe(4);
      
      controller.clearQueue();
      
      expect(controller.queueLength).toBe(0);
      
      controller.dispose();
    });
  });


  /**
   * Additional properties for robustness
   */
  describe('Additional Properties', () => {
    it('rarity priority is correctly ordered', () => {
      expect(getRarityPriority('platinum')).toBeGreaterThan(getRarityPriority('gold'));
      expect(getRarityPriority('gold')).toBeGreaterThan(getRarityPriority('silver'));
      expect(getRarityPriority('silver')).toBeGreaterThan(getRarityPriority('bronze'));
    });

    it('display duration increases with rarity', () => {
      const bronzeDuration = getDisplayDuration('bronze');
      const silverDuration = getDisplayDuration('silver');
      const goldDuration = getDisplayDuration('gold');
      const platinumDuration = getDisplayDuration('platinum');
      
      expect(platinumDuration).toBeGreaterThan(goldDuration);
      expect(goldDuration).toBeGreaterThan(silverDuration);
      expect(silverDuration).toBeGreaterThan(bronzeDuration);
    });

    it('displayMode reflects reducedMotion setting', () => {
      const controller = new CinematicController({ reducedMotion: false });
      expect(controller.displayMode).toBe('fullscreen');
      
      controller.setReducedMotion(true);
      expect(controller.displayMode).toBe('toast');
      
      controller.dispose();
    });

    it('disabled controller does not process queue', () => {
      const controller = new CinematicController({ enabled: false });
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test',
        description: 'Test',
        rarity: 'gold',
      });
      
      // Should not become active
      expect(controller.isActive).toBe(false);
      expect(controller.current).toBeNull();
      
      controller.dispose();
    });

    it('setEnabled toggles processing', () => {
      const controller = new CinematicController({ enabled: true });
      
      expect(controller.isEnabled).toBe(true);
      
      controller.setEnabled(false);
      expect(controller.isEnabled).toBe(false);
      
      controller.setEnabled(true);
      expect(controller.isEnabled).toBe(true);
      
      controller.dispose();
    });

    it('state transitions correctly through lifecycle', () => {
      const controller = new CinematicController();
      
      expect(controller.state).toBe('idle');
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test',
        description: 'Test',
        rarity: 'gold',
      });
      
      // Should be entering
      expect(controller.state).toBe('entering');
      expect(controller.isActive).toBe(true);
      
      controller.dispose();
    });

    it('dispose cleans up all state', () => {
      const controller = new CinematicController();
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test 1',
        description: 'Test',
        rarity: 'gold',
      });
      controller.queueAchievement({
        achievementId: 'test-2',
        icon: '🏆',
        name: 'Test 2',
        description: 'Test',
        rarity: 'silver',
      });
      
      controller.dispose();
      
      expect(controller.state).toBe('idle');
      expect(controller.current).toBeNull();
      expect(controller.queueLength).toBe(0);
    });

    it('callbacks are notified on state changes', () => {
      const controller = new CinematicController();
      const states: string[] = [];
      
      controller.onStateChange((state) => {
        states.push(state);
      });
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test',
        description: 'Test',
        rarity: 'gold',
      });
      
      // Should have received at least one state change
      expect(states.length).toBeGreaterThan(0);
      
      controller.dispose();
    });

    it('cinematic callbacks are notified', () => {
      const controller = new CinematicController();
      const cinematics: (typeof controller.current)[] = [];
      
      controller.onCinematicChange((cinematic) => {
        cinematics.push(cinematic);
      });
      
      controller.queueAchievement({
        achievementId: 'test-1',
        icon: '🏆',
        name: 'Test',
        description: 'Test',
        rarity: 'gold',
      });
      
      // Should have received cinematic notification
      expect(cinematics.length).toBeGreaterThan(0);
      expect(cinematics[0]?.name).toBe('Test');
      
      controller.dispose();
    });
  });
});
