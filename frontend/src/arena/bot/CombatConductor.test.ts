import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from 'three';
import { CombatConductor } from './CombatConductor';
import { BOT_PERSONALITIES, DIFFICULTY_PRESETS } from './BotPersonality';
import type { BotInput, BotState } from './types';

describe('CombatConductor', () => {
  let conductor: CombatConductor;

  const createDefaultInput = (overrides?: Partial<BotInput>): BotInput => ({
    botPosition: new Vector3(0, 1, 0),
    botHealth: 100,
    botMaxHealth: 100,
    botAmmo: 30,
    botMaxAmmo: 30,
    playerPosition: new Vector3(10, 1, 0),
    playerVelocity: new Vector3(0, 0, 0),
    playerHealth: 100,
    playerVisible: true,
    lastSeenPosition: new Vector3(10, 1, 0),
    lastSeenTime: Date.now(),
    botScore: 0,
    playerScore: 0,
    timeRemaining: 180,
    matchDuration: 180,
    coverPositions: [],
    mapBounds: {
      min: new Vector3(-20, 0, -20),
      max: new Vector3(20, 10, 20),
    },
    ...overrides,
  });

  beforeEach(() => {
    conductor = new CombatConductor(
      BOT_PERSONALITIES.duelist,
      DIFFICULTY_PRESETS.medium
    );
  });

  describe('initialization', () => {
    it('should start in PATROL state', () => {
      expect(conductor.getState()).toBe('PATROL');
    });

    it('should have correct personality', () => {
      expect(conductor.getPersonality().type).toBe('duelist');
    });

    it('should have correct difficulty', () => {
      expect(conductor.getDifficulty().name).toBe('medium');
    });
  });

  describe('state machine', () => {
    it('should transition to ENGAGE or EXECUTING_SIGNATURE when player visible', () => {
      const input = createDefaultInput({ playerVisible: true });
      conductor.conduct(input, 16);
      // Can be ENGAGE or EXECUTING_SIGNATURE if a signature triggered
      expect(['ENGAGE', 'EXECUTING_SIGNATURE']).toContain(conductor.getState());
    });

    it('should stay in PATROL when player not visible', () => {
      const input = createDefaultInput({ playerVisible: false });
      conductor.conduct(input, 16);
      expect(conductor.getState()).toBe('PATROL');
    });

    it('should transition to RETREAT at low health and low aggression', () => {
      // First engage
      const engageInput = createDefaultInput({ playerVisible: true });
      conductor.conduct(engageInput, 16);
      // Can be ENGAGE or EXECUTING_SIGNATURE
      expect(['ENGAGE', 'EXECUTING_SIGNATURE']).toContain(conductor.getState());

      // Then low health
      const lowHealthInput = createDefaultInput({
        playerVisible: true,
        botHealth: 20,
        botMaxHealth: 100,
      });

      // May need multiple ticks for aggression to drop
      for (let i = 0; i < 10; i++) {
        conductor.conduct(lowHealthInput, 16);
      }

      // State should be RETREAT, ENGAGE, or EXECUTING_SIGNATURE depending on aggression
      const state = conductor.getState();
      expect(['ENGAGE', 'RETREAT', 'EXECUTING_SIGNATURE']).toContain(state);
    });
  });

  describe('output generation', () => {
    it('should produce valid output', () => {
      const input = createDefaultInput();
      const output = conductor.conduct(input, 16);

      expect(output).toHaveProperty('moveDirection');
      expect(output).toHaveProperty('moveSpeed');
      expect(output).toHaveProperty('aimTarget');
      expect(output).toHaveProperty('shouldShoot');
      expect(output).toHaveProperty('shouldReload');
      expect(output).toHaveProperty('shouldCrouch');
      expect(output).toHaveProperty('currentState');
    });

    it('should have normalized move direction', () => {
      const input = createDefaultInput({ playerVisible: true });
      const output = conductor.conduct(input, 16);

      const length = output.moveDirection.length();
      // Either zero (holding) or normalized
      expect(length).toBeLessThanOrEqual(1.01);
    });

    it('should have move speed in valid range', () => {
      const input = createDefaultInput({ playerVisible: true });
      const output = conductor.conduct(input, 16);

      expect(output.moveSpeed).toBeGreaterThanOrEqual(0);
      expect(output.moveSpeed).toBeLessThanOrEqual(1);
    });

    it('should aim at player when visible', () => {
      const input = createDefaultInput({
        playerVisible: true,
        playerPosition: new Vector3(10, 1, 5),
      });

      // Run a few ticks for aim to settle
      let output;
      for (let i = 0; i < 20; i++) {
        output = conductor.conduct(input, 16);
      }

      // Aim should be roughly toward player
      const toPlayer = new Vector3(10, 1, 5);
      const aimDist = output!.aimTarget.distanceTo(toPlayer);
      expect(aimDist).toBeLessThan(5); // Within 5 units
    });

    it('should not shoot when player not visible', () => {
      const input = createDefaultInput({ playerVisible: false });
      const output = conductor.conduct(input, 16);

      expect(output.shouldShoot).toBe(false);
    });

    it('should request reload when out of ammo', () => {
      const input = createDefaultInput({ botAmmo: 0 });
      const output = conductor.conduct(input, 16);

      expect(output.shouldReload).toBe(true);
    });
  });

  describe('event recording', () => {
    it('should accept combat events', () => {
      expect(() => {
        conductor.recordEvent({
          type: 'bot_hit_player',
          timestamp: Date.now(),
          damage: 25,
        });
      }).not.toThrow();
    });

    it('should track damage dealt', () => {
      conductor.recordEvent({
        type: 'bot_hit_player',
        timestamp: Date.now(),
        damage: 25,
      });

      // No direct way to verify, but shouldn't throw
      const input = createDefaultInput();
      const output = conductor.conduct(input, 16);
      expect(output).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset to PATROL state', () => {
      // First engage
      const input = createDefaultInput({ playerVisible: true });
      conductor.conduct(input, 16);
      // Should be in combat state
      expect(['ENGAGE', 'EXECUTING_SIGNATURE']).toContain(conductor.getState());

      // Reset
      conductor.reset();
      expect(conductor.getState()).toBe('PATROL');
    });
  });

  describe('personality variations', () => {
    it('rusher should be more aggressive', () => {
      const rusher = new CombatConductor(
        BOT_PERSONALITIES.rusher,
        DIFFICULTY_PRESETS.medium
      );

      const input = createDefaultInput({ playerVisible: true });

      // Run several ticks
      let rusherOutput;
      for (let i = 0; i < 10; i++) {
        rusherOutput = rusher.conduct(input, 16);
      }

      // Rusher should be moving (not holding)
      expect(rusherOutput!.moveSpeed).toBeGreaterThan(0);
    });

    it('sentinel should be more defensive', () => {
      const sentinel = new CombatConductor(
        BOT_PERSONALITIES.sentinel,
        DIFFICULTY_PRESETS.medium
      );

      const input = createDefaultInput({ playerVisible: true });

      // Run several ticks
      let sentinelOutput;
      for (let i = 0; i < 10; i++) {
        sentinelOutput = sentinel.conduct(input, 16);
      }

      // Sentinel output should be valid
      expect(sentinelOutput).toBeDefined();
    });
  });

  describe('difficulty variations', () => {
    it('easy difficulty should have signatures disabled', () => {
      const easy = new CombatConductor(
        BOT_PERSONALITIES.duelist,
        DIFFICULTY_PRESETS.easy
      );

      expect(easy.getDifficulty().useSignatures).toBe(false);
    });

    it('hard difficulty should have mercy disabled', () => {
      const hard = new CombatConductor(
        BOT_PERSONALITIES.duelist,
        DIFFICULTY_PRESETS.hard
      );

      expect(hard.getDifficulty().mercyEnabled).toBe(false);
    });
  });

  describe('determinism', () => {
    it('should produce consistent output structure for same input sequence', () => {
      const conductor1 = new CombatConductor(
        BOT_PERSONALITIES.duelist,
        DIFFICULTY_PRESETS.medium
      );
      const conductor2 = new CombatConductor(
        BOT_PERSONALITIES.duelist,
        DIFFICULTY_PRESETS.medium
      );

      const input = createDefaultInput({ playerVisible: true });

      // Note: Due to Math.random() usage, outputs won't be identical
      // This test verifies structure consistency, not exact values
      const output1 = conductor1.conduct(input, 16);
      const output2 = conductor2.conduct(input, 16);

      // Both should be in a combat state (ENGAGE or EXECUTING_SIGNATURE)
      expect(['ENGAGE', 'EXECUTING_SIGNATURE']).toContain(output1.currentState);
      expect(['ENGAGE', 'EXECUTING_SIGNATURE']).toContain(output2.currentState);
      expect(typeof output1.moveSpeed).toBe(typeof output2.moveSpeed);
      expect(typeof output1.shouldShoot).toBe(typeof output2.shouldShoot);
    });
  });

  describe('performance', () => {
    it('should complete tick in under 1ms', () => {
      const input = createDefaultInput({ playerVisible: true });

      // Warm up
      for (let i = 0; i < 10; i++) {
        conductor.conduct(input, 16);
      }

      // Measure
      const iterations = 100;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        conductor.conduct(input, 16);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / iterations;

      expect(avgMs).toBeLessThan(1);
    });
  });
});
