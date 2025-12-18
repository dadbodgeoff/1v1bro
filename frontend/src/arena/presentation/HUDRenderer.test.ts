/**
 * HUDRenderer Unit Tests
 * 
 * Tests for damage indicator angle calculation, kill feed entry expiration,
 * and HUD state management.
 * 
 * @module presentation/HUDRenderer.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HUDRenderer,
  DEFAULT_HUD_CONFIG,
  HUDState,
  calculateDamageDirection
} from './HUDRenderer';
import { EventBus } from '../core/EventBus';
import { Vector3 } from '../math/Vector3';

describe('HUDRenderer', () => {
  let eventBus: EventBus;
  let hudRenderer: HUDRenderer;

  beforeEach(() => {
    eventBus = new EventBus();
    hudRenderer = new HUDRenderer(DEFAULT_HUD_CONFIG, eventBus);
  });

  describe('initialization', () => {
    it('should create with default initial state', () => {
      const state = hudRenderer.getState();
      
      expect(state.health).toBe(100);
      expect(state.maxHealth).toBe(100);
      expect(state.ammo).toBe(30);
      expect(state.maxAmmo).toBe(30);
      expect(state.score).toBe(0);
      expect(state.opponentScore).toBe(0);
      expect(state.damageIndicators).toHaveLength(0);
      expect(state.killFeed).toHaveLength(0);
      expect(state.hitMarkerActive).toBe(false);
    });
  });

  describe('damage indicator angle calculation', () => {
    it('should calculate correct angle when attacker is directly in front', () => {
      const attackerPos = new Vector3(0, 0, 10);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = 0; // Facing +Z
      
      const angle = calculateDamageDirection(attackerPos, playerPos, playerYaw);
      
      // Attacker directly in front should be ~0 radians
      expect(Math.abs(angle)).toBeLessThan(0.01);
    });

    it('should calculate correct angle when attacker is directly behind', () => {
      const attackerPos = new Vector3(0, 0, -10);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = 0; // Facing +Z
      
      const angle = calculateDamageDirection(attackerPos, playerPos, playerYaw);
      
      // Attacker behind should be ~PI radians (or -PI)
      expect(Math.abs(Math.abs(angle) - Math.PI)).toBeLessThan(0.01);
    });

    it('should calculate correct angle when attacker is to the right', () => {
      const attackerPos = new Vector3(10, 0, 0);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = 0; // Facing +Z
      
      const angle = calculateDamageDirection(attackerPos, playerPos, playerYaw);
      
      // Attacker to the right should be ~PI/2 radians
      expect(Math.abs(angle - Math.PI / 2)).toBeLessThan(0.01);
    });

    it('should calculate correct angle when attacker is to the left', () => {
      const attackerPos = new Vector3(-10, 0, 0);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = 0; // Facing +Z
      
      const angle = calculateDamageDirection(attackerPos, playerPos, playerYaw);
      
      // Attacker to the left should be ~-PI/2 radians
      expect(Math.abs(angle + Math.PI / 2)).toBeLessThan(0.01);
    });

    it('should account for player yaw rotation', () => {
      const attackerPos = new Vector3(10, 0, 0);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = Math.PI / 2; // Facing +X (rotated 90 degrees)
      
      const angle = calculateDamageDirection(attackerPos, playerPos, playerYaw);
      
      // Attacker at +X, player facing +X, should be ~0 (in front)
      expect(Math.abs(angle)).toBeLessThan(0.01);
    });

    it('should handle diagonal attacker positions', () => {
      const attackerPos = new Vector3(10, 0, 10);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = 0;
      
      const angle = calculateDamageDirection(attackerPos, playerPos, playerYaw);
      
      // Attacker at 45 degrees should be ~PI/4
      expect(Math.abs(angle - Math.PI / 4)).toBeLessThan(0.01);
    });
  });

  describe('showDamageIndicator', () => {
    it('should add damage indicator with correct direction', () => {
      const attackerPos = new Vector3(10, 0, 0);
      const playerPos = new Vector3(0, 0, 0);
      const playerYaw = 0;
      
      hudRenderer.showDamageIndicator(attackerPos, playerPos, playerYaw);
      
      const state = hudRenderer.getState();
      expect(state.damageIndicators).toHaveLength(1);
      expect(Math.abs(state.damageIndicators[0].direction - Math.PI / 2)).toBeLessThan(0.01);
    });

    it('should set correct end time based on config', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.showDamageIndicator(
        new Vector3(10, 0, 0),
        new Vector3(0, 0, 0),
        0
      );
      
      const state = hudRenderer.getState();
      expect(state.damageIndicators[0].endTime).toBe(now + DEFAULT_HUD_CONFIG.damageIndicatorDurationMs);
      
      vi.useRealTimers();
    });

    it('should allow multiple damage indicators', () => {
      hudRenderer.showDamageIndicator(new Vector3(10, 0, 0), new Vector3(0, 0, 0), 0);
      hudRenderer.showDamageIndicator(new Vector3(-10, 0, 0), new Vector3(0, 0, 0), 0);
      hudRenderer.showDamageIndicator(new Vector3(0, 0, 10), new Vector3(0, 0, 0), 0);
      
      const state = hudRenderer.getState();
      expect(state.damageIndicators).toHaveLength(3);
    });
  });

  describe('showHitMarker', () => {
    it('should activate hit marker', () => {
      hudRenderer.showHitMarker();
      
      const state = hudRenderer.getState();
      expect(state.hitMarkerActive).toBe(true);
    });

    it('should set correct end time', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.showHitMarker();
      
      const state = hudRenderer.getState();
      expect(state.hitMarkerEndTime).toBe(now + DEFAULT_HUD_CONFIG.hitMarkerDurationMs);
      
      vi.useRealTimers();
    });
  });

  describe('kill feed', () => {
    it('should add kill feed entry', () => {
      hudRenderer.addKillFeedEntry('Player1', 'Player2');
      
      const state = hudRenderer.getState();
      expect(state.killFeed).toHaveLength(1);
      expect(state.killFeed[0].killerName).toBe('Player1');
      expect(state.killFeed[0].victimName).toBe('Player2');
    });

    it('should set correct end time for kill feed entry', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.addKillFeedEntry('Player1', 'Player2');
      
      const state = hudRenderer.getState();
      expect(state.killFeed[0].endTime).toBe(now + DEFAULT_HUD_CONFIG.killFeedDurationMs);
      
      vi.useRealTimers();
    });

    it('should limit kill feed to 5 entries', () => {
      for (let i = 0; i < 7; i++) {
        hudRenderer.addKillFeedEntry(`Killer${i}`, `Victim${i}`);
      }
      
      const state = hudRenderer.getState();
      expect(state.killFeed).toHaveLength(5);
      // Should have removed the oldest entries
      expect(state.killFeed[0].killerName).toBe('Killer2');
      expect(state.killFeed[4].killerName).toBe('Killer6');
    });
  });

  describe('update and expiration', () => {
    it('should prune expired damage indicators', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.showDamageIndicator(new Vector3(10, 0, 0), new Vector3(0, 0, 0), 0);
      
      // Advance time past expiration
      const futureTime = now + DEFAULT_HUD_CONFIG.damageIndicatorDurationMs + 100;
      
      hudRenderer.update(hudRenderer.getState(), futureTime);
      
      const state = hudRenderer.getState();
      expect(state.damageIndicators).toHaveLength(0);
      
      vi.useRealTimers();
    });

    it('should prune expired kill feed entries', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.addKillFeedEntry('Player1', 'Player2');
      
      // Advance time past expiration
      const futureTime = now + DEFAULT_HUD_CONFIG.killFeedDurationMs + 100;
      
      hudRenderer.update(hudRenderer.getState(), futureTime);
      
      const state = hudRenderer.getState();
      expect(state.killFeed).toHaveLength(0);
      
      vi.useRealTimers();
    });

    it('should deactivate hit marker after expiration', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.showHitMarker();
      
      // Advance time past expiration
      const futureTime = now + DEFAULT_HUD_CONFIG.hitMarkerDurationMs + 100;
      
      hudRenderer.update(hudRenderer.getState(), futureTime);
      
      const state = hudRenderer.getState();
      expect(state.hitMarkerActive).toBe(false);
      
      vi.useRealTimers();
    });

    it('should keep non-expired indicators', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      hudRenderer.showDamageIndicator(new Vector3(10, 0, 0), new Vector3(0, 0, 0), 0);
      
      // Advance time but not past expiration
      const futureTime = now + DEFAULT_HUD_CONFIG.damageIndicatorDurationMs - 100;
      
      hudRenderer.update(hudRenderer.getState(), futureTime);
      
      const state = hudRenderer.getState();
      expect(state.damageIndicators).toHaveLength(1);
      
      vi.useRealTimers();
    });
  });

  describe('low health vignette', () => {
    it('should calculate vignette intensity when health is low', () => {
      const state: HUDState = {
        ...hudRenderer.getState(),
        health: 10,
        maxHealth: 100
      };
      
      hudRenderer.update(state, Date.now());
      
      const updatedState = hudRenderer.getState();
      // At 10 health with threshold 25, intensity should be (25-10)/25 = 0.6
      expect(updatedState.lowHealthVignetteIntensity).toBeCloseTo(0.6, 1);
    });

    it('should have zero vignette intensity when health is above threshold', () => {
      const state: HUDState = {
        ...hudRenderer.getState(),
        health: 50,
        maxHealth: 100
      };
      
      hudRenderer.update(state, Date.now());
      
      const updatedState = hudRenderer.getState();
      expect(updatedState.lowHealthVignetteIntensity).toBe(0);
    });

    it('should have maximum vignette intensity at zero health', () => {
      const state: HUDState = {
        ...hudRenderer.getState(),
        health: 0,
        maxHealth: 100
      };
      
      hudRenderer.update(state, Date.now());
      
      const updatedState = hudRenderer.getState();
      expect(updatedState.lowHealthVignetteIntensity).toBe(1);
    });
  });
});
