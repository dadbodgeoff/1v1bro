import { describe, it, expect, beforeEach } from 'vitest';
import { MercySystem } from './MercySystem';
import { BotPersonalityConfig, CombatEvent, DifficultyPreset } from './types';

describe('MercySystem', () => {
  let mercy: MercySystem;

  beforeEach(() => {
    mercy = new MercySystem();
  });

  describe('domination calculation', () => {
    it('should start with low domination score when no combat', () => {
      const state = mercy.update();
      // No damage dealt = low domination (bot not dominating)
      expect(state.dominationScore).toBeLessThanOrEqual(0.5);
    });

    it('should increase domination when dealing damage', () => {
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 25 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 25 });

      const state = mercy.update();
      expect(state.dominationScore).toBeGreaterThan(0.5);
    });

    it('should decrease domination when taking damage', () => {
      mercy.recordCombatEvent({ type: 'player_hit_bot', timestamp: Date.now(), damage: 50 });

      const state = mercy.update();
      expect(state.dominationScore).toBeLessThan(0.5);
    });

    it('should factor in consecutive hits', () => {
      // Deal same damage but with consecutive hits
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });

      const state = mercy.update();
      // 5 consecutive hits = max hit streak factor
      expect(state.dominationScore).toBeGreaterThanOrEqual(0.7);
    });

    it('should reset consecutive hits when player hits bot', () => {
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'player_hit_bot', timestamp: Date.now(), damage: 10 });

      const metrics = mercy.getMetrics();
      expect(metrics.consecutiveHits).toBe(0);
    });

    it('should factor in kill streak', () => {
      // Add some damage to have non-zero damage ratio
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });

      const state = mercy.update();
      // 3 kills + damage = high domination
      expect(state.dominationScore).toBeGreaterThan(0.5);
    });

    it('should reset kill streak when bot dies', () => {
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'player_killed_bot', timestamp: Date.now() });

      const metrics = mercy.getMetrics();
      expect(metrics.killsWithoutDying).toBe(0);
    });
  });

  describe('mercy activation', () => {
    it('should activate mercy when domination exceeds threshold', () => {
      // Create high domination
      for (let i = 0; i < 5; i++) {
        mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });
      }
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });

      const state = mercy.update();
      expect(state.isActive).toBe(true);
    });

    it('should not activate mercy below threshold', () => {
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 10 });

      const state = mercy.update();
      expect(state.isActive).toBe(false);
    });

    it('should deactivate mercy after duration', () => {
      // Activate mercy
      for (let i = 0; i < 5; i++) {
        mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });
      }
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });

      const startTime = Date.now();
      mercy.update(startTime);
      expect(mercy.isMercyActive()).toBe(true);

      // After duration (default 4000ms)
      const state = mercy.update(startTime + 5000);
      expect(state.isActive).toBe(false);
    });

    it('should report remaining duration', () => {
      // Activate mercy
      for (let i = 0; i < 5; i++) {
        mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });
      }
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });

      const startTime = Date.now();
      mercy.update(startTime);

      const state = mercy.update(startTime + 1000);
      expect(state.remainingDuration).toBeGreaterThan(2000);
      expect(state.remainingDuration).toBeLessThanOrEqual(3000);
    });
  });

  describe('aggression multiplier', () => {
    it('should return 1.0 when mercy inactive', () => {
      expect(mercy.getAggressionMultiplier()).toBe(1.0);
    });

    it('should return reduced value when mercy active', () => {
      // Activate mercy
      for (let i = 0; i < 5; i++) {
        mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });
      }
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.update();

      const multiplier = mercy.getAggressionMultiplier();
      expect(multiplier).toBeLessThan(1.0);
      expect(multiplier).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should respect difficulty mercy enabled setting', () => {
      const difficulty: DifficultyPreset = {
        name: 'hard',
        aggressionMultiplier: 1.2,
        reactionTimeMultiplier: 0.8,
        accuracyMultiplier: 1.1,
        mercyEnabled: false,
        mercyThresholdMultiplier: 1.0,
        useSignatures: true,
        patternComplexity: 0.8,
      };

      const hardMercy = new MercySystem(difficulty);

      // Try to trigger mercy
      for (let i = 0; i < 10; i++) {
        hardMercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });
      }
      hardMercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });

      const state = hardMercy.update();
      expect(state.isActive).toBe(false); // Mercy disabled
    });

    it('should use personality mercy threshold', () => {
      const personality: BotPersonalityConfig = {
        type: 'rusher',
        displayName: 'Test',
        baseAggression: 0.7,
        aggressionVolatility: 0.3,
        tacticWeights: {
          STRAFE: 1,
          PEEK: 1,
          PUSH: 1,
          RETREAT: 1,
          HOLD: 1,
          FLANK: 1,
        },
        reactionTimeMs: 200,
        accuracyBase: 0.7,
        trackingSkill: 0.8,
        signatures: [],
        mercyThreshold: 0.9, // Very high threshold
        mercyDuration: 3000,
      };

      const rusherMercy = new MercySystem(undefined, personality);

      // Moderate domination
      for (let i = 0; i < 3; i++) {
        rusherMercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 20 });
      }

      const state = rusherMercy.update();
      expect(state.isActive).toBe(false); // High threshold not reached
    });
  });

  describe('damage tracking', () => {
    it('should track recent damage dealt', () => {
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 25 });
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });

      expect(mercy.getRecentDamageDealt()).toBe(55);
    });

    it('should track recent damage taken', () => {
      mercy.recordCombatEvent({ type: 'player_hit_bot', timestamp: Date.now(), damage: 20 });
      mercy.recordCombatEvent({ type: 'player_hit_bot', timestamp: Date.now(), damage: 15 });

      expect(mercy.getRecentDamageTaken()).toBe(35);
    });
  });

  describe('reset', () => {
    it('should clear all metrics on reset', () => {
      mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 50 });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });

      mercy.reset();

      const metrics = mercy.getMetrics();
      expect(metrics.recentDamageDealt).toBe(0);
      expect(metrics.killsWithoutDying).toBe(0);
      expect(metrics.consecutiveHits).toBe(0);
    });

    it('should deactivate mercy on reset', () => {
      // Activate mercy
      for (let i = 0; i < 5; i++) {
        mercy.recordCombatEvent({ type: 'bot_hit_player', timestamp: Date.now(), damage: 30 });
      }
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.recordCombatEvent({ type: 'bot_killed_player', timestamp: Date.now() });
      mercy.update();

      mercy.reset();

      expect(mercy.isMercyActive()).toBe(false);
    });
  });
});
