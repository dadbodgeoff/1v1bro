/**
 * Anti-Cheat Tests
 *
 * Property-based and unit tests for input validation and violation tracking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { AntiCheat, DEFAULT_ANTI_CHEAT_CONFIG, AntiCheatConfig, InputValidationData } from './AntiCheat';
import { DEFAULT_PHYSICS_CONFIG, PhysicsConfig } from '../physics/Physics3D';
import { Vector3 } from '../math/Vector3';
import { EventBus } from '../core/EventBus';
import { isOk, isErr } from '../core/Result';

describe('AntiCheat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Speed Validation', () => {
    // Property 28: Speed Validation - excessive speed returns Err
    it('Property 28: excessive speed returns Err', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(2), max: Math.fround(10), noNaN: true }),
          (deltaTime, speedMultiplier) => {
            const antiCheat = new AntiCheat();
            const maxSpeed = DEFAULT_PHYSICS_CONFIG.maxSpeed;
            const tolerance = DEFAULT_ANTI_CHEAT_CONFIG.speedToleranceFactor;

            // Move faster than allowed
            const excessiveDistance = maxSpeed * deltaTime * tolerance * speedMultiplier;
            const previousPos = Vector3.ZERO;
            const newPos = new Vector3(excessiveDistance, 0, 0);

            const input: InputValidationData = {
              buttons: 0,
              clientTimestamp: 1000000,
            };

            const result = antiCheat.validateInput(1, input, previousPos, newPos, true, 1000000, deltaTime);

            expect(isErr(result)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('allows movement within speed limit', () => {
      const antiCheat = new AntiCheat();
      const deltaTime = 0.016; // 16ms
      const maxSpeed = DEFAULT_PHYSICS_CONFIG.maxSpeed;

      // Move at exactly max speed
      const distance = maxSpeed * deltaTime;
      const previousPos = Vector3.ZERO;
      const newPos = new Vector3(distance, 0, 0);

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000,
      };

      const result = antiCheat.validateInput(1, input, previousPos, newPos, true, 1000000, deltaTime);

      expect(isOk(result)).toBe(true);
    });

    it('allows movement within tolerance factor', () => {
      const antiCheat = new AntiCheat();
      const deltaTime = 0.016;
      const maxSpeed = DEFAULT_PHYSICS_CONFIG.maxSpeed;
      const tolerance = DEFAULT_ANTI_CHEAT_CONFIG.speedToleranceFactor;

      // Move at max speed * tolerance (just under limit)
      const distance = maxSpeed * deltaTime * tolerance * 0.99;
      const previousPos = Vector3.ZERO;
      const newPos = new Vector3(distance, 0, 0);

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000,
      };

      const result = antiCheat.validateInput(1, input, previousPos, newPos, true, 1000000, deltaTime);

      expect(isOk(result)).toBe(true);
    });
  });

  describe('Timestamp Validation', () => {
    it('rejects timestamps too far from server time', () => {
      const config: AntiCheatConfig = { ...DEFAULT_ANTI_CHEAT_CONFIG, timestampToleranceMs: 500 };
      const antiCheat = new AntiCheat(config);

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 600, // 600ms ahead
      };

      const result = antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(isErr(result)).toBe(true);
    });

    it('accepts timestamps within tolerance', () => {
      const config: AntiCheatConfig = { ...DEFAULT_ANTI_CHEAT_CONFIG, timestampToleranceMs: 500 };
      const antiCheat = new AntiCheat(config);

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 400, // 400ms ahead (within 500ms tolerance)
      };

      const result = antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(isOk(result)).toBe(true);
    });
  });


  describe('Violation Tracking', () => {
    // Property 29: Violation Accumulation - 10 violations triggers kick
    it('Property 29: maxViolations triggers kick', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), (maxViolations) => {
          const config: AntiCheatConfig = { ...DEFAULT_ANTI_CHEAT_CONFIG, maxViolations };
          const eventBus = new EventBus();
          const kickHandler = vi.fn();
          eventBus.on('player_kicked', kickHandler);

          const antiCheat = new AntiCheat(config, DEFAULT_PHYSICS_CONFIG, eventBus);

          // Generate violations
          for (let i = 0; i < maxViolations; i++) {
            const input: InputValidationData = {
              buttons: 0,
              clientTimestamp: 1000000 + 10000, // Way off
            };
            antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);
          }

          expect(kickHandler).toHaveBeenCalled();
          expect(antiCheat.shouldKick(1)).toBe(true);
        }),
        { numRuns: 20 }
      );
    });

    it('tracks violations per player', () => {
      const antiCheat = new AntiCheat();

      // Generate violation for player 1
      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 10000,
      };
      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(antiCheat.getViolationCount(1)).toBe(1);
      expect(antiCheat.getViolationCount(2)).toBe(0);
    });

    it('clears violations for player', () => {
      const antiCheat = new AntiCheat();

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 10000,
      };
      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(antiCheat.getViolationCount(1)).toBe(1);

      antiCheat.clearViolations(1);

      expect(antiCheat.getViolationCount(1)).toBe(0);
    });

    it('removes player from tracking', () => {
      const antiCheat = new AntiCheat();

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 10000,
      };
      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      antiCheat.removePlayer(1);

      expect(antiCheat.getViolationCount(1)).toBe(0);
    });
  });

  describe('Violation Window', () => {
    it('expires old violations', () => {
      const config: AntiCheatConfig = { ...DEFAULT_ANTI_CHEAT_CONFIG, violationWindowMs: 1000 };
      const antiCheat = new AntiCheat(config);

      // Generate violation at time 1000000
      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 10000,
      };
      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(antiCheat.getViolationCount(1)).toBe(1);

      // Advance time past window
      vi.setSystemTime(1002000);

      expect(antiCheat.getViolationCount(1)).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('emits violation_detected event', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('violation_detected', handler);

      const antiCheat = new AntiCheat(DEFAULT_ANTI_CHEAT_CONFIG, DEFAULT_PHYSICS_CONFIG, eventBus);

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 10000,
      };
      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'violation_detected',
          playerId: 1,
          violationType: 'timestamp_mismatch',
        })
      );
    });

    it('emits player_kicked event when max violations reached', () => {
      const config: AntiCheatConfig = { ...DEFAULT_ANTI_CHEAT_CONFIG, maxViolations: 2 };
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('player_kicked', handler);

      const antiCheat = new AntiCheat(config, DEFAULT_PHYSICS_CONFIG, eventBus);

      const input: InputValidationData = {
        buttons: 0,
        clientTimestamp: 1000000 + 10000,
      };

      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);
      antiCheat.validateInput(1, input, Vector3.ZERO, Vector3.ZERO, true, 1000000, 0.016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'player_kicked',
          playerId: 1,
          violationCount: 2,
        })
      );
    });
  });
});
