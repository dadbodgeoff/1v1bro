/**
 * Combat System Tests
 *
 * Property-based and unit tests for combat mechanics.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CombatSystem, DEFAULT_COMBAT_CONFIG, CombatConfig, FireCommand } from './CombatSystem';
import { Vector3 } from '../math/Vector3';
import { Capsule } from '../physics/Capsule';
import { EventBus } from '../core/EventBus';
import { isOk, isErr } from '../core/Result';

describe('CombatSystem', () => {
  describe('Player Initialization', () => {
    it('initializes player with full health', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);

      const state = system.getPlayerState(1);
      expect(state).toBeDefined();
      expect(state!.health).toBe(DEFAULT_COMBAT_CONFIG.maxHealth);
      expect(state!.isDead).toBe(false);
    });

    it('removes player state', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);
      system.removePlayer(1);

      expect(system.getPlayerState(1)).toBeUndefined();
    });

    it('returns undefined for unknown player', () => {
      const system = new CombatSystem();
      expect(system.getPlayerState(999)).toBeUndefined();
    });
  });

  describe('Damage Application', () => {
    // Property 22: Damage Application - health = max(0, health - damage)
    it('Property 22: health equals max(0, health - damage)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          fc.integer({ min: 1, max: 200 }),
          (initialHealth, damage) => {
            const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, maxHealth: initialHealth };
            const system = new CombatSystem(config);
            system.initializePlayer(1);
            system.initializePlayer(2);

            system.applyDamage(1, 2, damage, Vector3.ZERO, 0);

            const state = system.getPlayerState(1);
            expect(state!.health).toBe(Math.max(0, initialHealth - damage));
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 23: Death Trigger - health 0 sets isDead true
    it('Property 23: health reaching 0 sets isDead to true', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (health) => {
          const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, maxHealth: health };
          const system = new CombatSystem(config);
          system.initializePlayer(1);
          system.initializePlayer(2);

          // Apply exactly enough damage to kill
          system.applyDamage(1, 2, health, Vector3.ZERO, 0);

          const state = system.getPlayerState(1);
          expect(state!.health).toBe(0);
          expect(state!.isDead).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it('does not apply damage to dead players', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);
      system.initializePlayer(2);

      // Kill player 1
      system.applyDamage(1, 2, 100, Vector3.ZERO, 0);
      expect(system.getPlayerState(1)!.isDead).toBe(true);

      // Try to apply more damage
      system.applyDamage(1, 2, 50, Vector3.ZERO, 100);

      // Health should still be 0
      expect(system.getPlayerState(1)!.health).toBe(0);
    });

    it('sets respawn time on death', () => {
      const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, respawnTimeMs: 3000 };
      const system = new CombatSystem(config);
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.applyDamage(1, 2, 100, Vector3.ZERO, 1000);

      const state = system.getPlayerState(1);
      expect(state!.deathTime).toBe(1000);
      expect(state!.respawnTime).toBe(4000);
    });
  });


  describe('Fire Rate', () => {
    // Property 24: Fire Rate Enforcement - rapid fire is rejected
    it('Property 24: rapid fire within cooldown is rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 1, max: 99 }),
          (cooldown, timeBetweenShots) => {
            const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, fireRateCooldownMs: cooldown };
            const system = new CombatSystem(config);
            system.initializePlayer(1);

            const command: FireCommand = {
              playerId: 1,
              origin: Vector3.ZERO,
              direction: Vector3.FORWARD,
              clientTimestamp: 0,
            };

            // First shot should succeed
            const result1 = system.processFire(command, new Map(), 0);
            expect(isOk(result1)).toBe(true);

            // Second shot within cooldown should fail
            const result2 = system.processFire(command, new Map(), timeBetweenShots);
            expect(isErr(result2)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('allows fire after cooldown expires', () => {
      const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, fireRateCooldownMs: 200 };
      const system = new CombatSystem(config);
      system.initializePlayer(1);

      const command: FireCommand = {
        playerId: 1,
        origin: Vector3.ZERO,
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      const result1 = system.processFire(command, new Map(), 0);
      expect(isOk(result1)).toBe(true);

      const result2 = system.processFire(command, new Map(), 200);
      expect(isOk(result2)).toBe(true);
    });
  });

  describe('Hit Detection', () => {
    it('detects hit on player capsule', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);
      system.initializePlayer(2);

      const playerCapsules = new Map<number, Capsule>();
      // Capsule at (0, 0, 5) has center at (0, 0.9, 5)
      playerCapsules.set(2, new Capsule(new Vector3(0, 0, 5)));

      const command: FireCommand = {
        playerId: 1,
        origin: new Vector3(0, 0.9, 0), // Shoot from same height as capsule center
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      const result = system.processFire(command, playerCapsules, 0);
      expect(isOk(result)).toBe(true);
      if (isOk(result) && result.value) {
        expect(result.value.targetId).toBe(2);
        expect(result.value.damage).toBe(DEFAULT_COMBAT_CONFIG.weaponDamage);
      }
    });

    it('does not hit self', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);

      const playerCapsules = new Map<number, Capsule>();
      playerCapsules.set(1, new Capsule(new Vector3(0, 0, 1)));

      const command: FireCommand = {
        playerId: 1,
        origin: Vector3.ZERO,
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      const result = system.processFire(command, playerCapsules, 0);
      expect(isOk(result)).toBe(true);
      expect(result.value).toBeNull();
    });

    it('does not hit dead players', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);
      system.initializePlayer(2);

      // Kill player 2
      system.applyDamage(2, 1, 100, Vector3.ZERO, 0);

      const playerCapsules = new Map<number, Capsule>();
      playerCapsules.set(2, new Capsule(new Vector3(0, 0, 5)));

      const command: FireCommand = {
        playerId: 1,
        origin: Vector3.ZERO,
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      const result = system.processFire(command, playerCapsules, 100);
      expect(isOk(result)).toBe(true);
      expect(result.value).toBeNull();
    });

    it('does not hit invulnerable players', () => {
      const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, invulnerabilityDurationMs: 2000 };
      const system = new CombatSystem(config);
      system.initializePlayer(1);
      system.initializePlayer(2);

      // Respawn player 2 with invulnerability
      system.respawnPlayer(2, 0);

      const playerCapsules = new Map<number, Capsule>();
      playerCapsules.set(2, new Capsule(new Vector3(0, 0, 5)));

      const command: FireCommand = {
        playerId: 1,
        origin: Vector3.ZERO,
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      // Fire during invulnerability
      const result = system.processFire(command, playerCapsules, 1000);
      expect(isOk(result)).toBe(true);
      expect(result.value).toBeNull();
    });

    it('hits player after invulnerability expires', () => {
      const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, invulnerabilityDurationMs: 2000 };
      const system = new CombatSystem(config);
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.respawnPlayer(2, 0);

      const playerCapsules = new Map<number, Capsule>();
      playerCapsules.set(2, new Capsule(new Vector3(0, 0, 5)));

      const command: FireCommand = {
        playerId: 1,
        origin: new Vector3(0, 0.9, 0), // Shoot from same height as capsule center
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      // Fire after invulnerability (at exactly 2000, invulnerableUntil is 2000, so 2000 < 2000 is false)
      const result = system.processFire(command, playerCapsules, 2000);
      expect(isOk(result)).toBe(true);
      expect(result.value).not.toBeNull();
    });

    it('returns error for unknown player', () => {
      const system = new CombatSystem();

      const command: FireCommand = {
        playerId: 999,
        origin: Vector3.ZERO,
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      const result = system.processFire(command, new Map(), 0);
      expect(isErr(result)).toBe(true);
    });

    it('returns error when dead player tries to fire', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.applyDamage(1, 2, 100, Vector3.ZERO, 0);

      const command: FireCommand = {
        playerId: 1,
        origin: Vector3.ZERO,
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      const result = system.processFire(command, new Map(), 100);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('Respawn', () => {
    it('returns players ready to respawn', () => {
      const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, respawnTimeMs: 3000 };
      const system = new CombatSystem(config);
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.applyDamage(1, 2, 100, Vector3.ZERO, 0);

      expect(system.update(2000)).toEqual([]);
      expect(system.update(3000)).toEqual([1]);
    });

    it('respawns player with full health', () => {
      const system = new CombatSystem();
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.applyDamage(1, 2, 100, Vector3.ZERO, 0);
      system.respawnPlayer(1, 3000);

      const state = system.getPlayerState(1);
      expect(state!.health).toBe(DEFAULT_COMBAT_CONFIG.maxHealth);
      expect(state!.isDead).toBe(false);
      expect(state!.deathTime).toBeNull();
      expect(state!.respawnTime).toBeNull();
    });

    it('grants invulnerability on respawn', () => {
      const config: CombatConfig = { ...DEFAULT_COMBAT_CONFIG, invulnerabilityDurationMs: 2000 };
      const system = new CombatSystem(config);
      system.initializePlayer(1);

      system.respawnPlayer(1, 1000);

      const state = system.getPlayerState(1);
      expect(state!.invulnerableUntil).toBe(3000);
    });
  });

  describe('Event Emission', () => {
    it('emits weapon_fired event', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('weapon_fired', handler);

      const system = new CombatSystem(DEFAULT_COMBAT_CONFIG, undefined, eventBus);
      system.initializePlayer(1);

      const command: FireCommand = {
        playerId: 1,
        origin: new Vector3(1, 2, 3),
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      system.processFire(command, new Map(), 0);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'weapon_fired',
          playerId: 1,
        })
      );
    });

    it('emits hit_confirmed event on hit', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('hit_confirmed', handler);

      const system = new CombatSystem(DEFAULT_COMBAT_CONFIG, undefined, eventBus);
      system.initializePlayer(1);
      system.initializePlayer(2);

      const playerCapsules = new Map<number, Capsule>();
      playerCapsules.set(2, new Capsule(new Vector3(0, 0, 5)));

      const command: FireCommand = {
        playerId: 1,
        origin: new Vector3(0, 0.9, 0), // Shoot from same height as capsule center
        direction: Vector3.FORWARD,
        clientTimestamp: 0,
      };

      system.processFire(command, playerCapsules, 0);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hit_confirmed',
          shooterId: 1,
          targetId: 2,
        })
      );
    });

    it('emits player_damaged event', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('player_damaged', handler);

      const system = new CombatSystem(DEFAULT_COMBAT_CONFIG, undefined, eventBus);
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.applyDamage(1, 2, 25, new Vector3(1, 2, 3), 0);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'player_damaged',
          victimId: 1,
          attackerId: 2,
          damage: 25,
        })
      );
    });

    it('emits player_death event', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('player_death', handler);

      const system = new CombatSystem(DEFAULT_COMBAT_CONFIG, undefined, eventBus);
      system.initializePlayer(1);
      system.initializePlayer(2);

      system.applyDamage(1, 2, 100, Vector3.ZERO, 0);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'player_death',
          victimId: 1,
          killerId: 2,
        })
      );
    });
  });
});
