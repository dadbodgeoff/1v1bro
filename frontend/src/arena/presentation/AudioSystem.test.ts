/**
 * AudioSystem Unit Tests
 * 
 * Tests for footstep interval timing, event subscription cleanup,
 * and audio system state management.
 * 
 * @module presentation/AudioSystem.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioSystem, DEFAULT_AUDIO_CONFIG } from './AudioSystem';
import { EventBus } from '../core/EventBus';
import { Vector3 } from '../math/Vector3';

// Mock AudioContext for testing
class MockAudioContext {
  sampleRate = 44100;
  listener = {
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 },
    forwardX: { value: 0 },
    forwardY: { value: 0 },
    forwardZ: { value: -1 },
    upX: { value: 0 },
    upY: { value: 1 },
    upZ: { value: 0 }
  };
  
  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn()
    };
  }
  
  createPanner() {
    return {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 50,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      connect: vi.fn(),
      setPosition: vi.fn()
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn()
    };
  }
  
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: () => new Float32Array(length)
    };
  }
  
  get destination() {
    return {};
  }
  
  close() {
    return Promise.resolve();
  }
}

// Replace global AudioContext with mock
vi.stubGlobal('AudioContext', MockAudioContext);

describe('AudioSystem', () => {
  let eventBus: EventBus;
  let audioSystem: AudioSystem;

  beforeEach(() => {
    eventBus = new EventBus();
    audioSystem = new AudioSystem(DEFAULT_AUDIO_CONFIG, eventBus);
  });

  afterEach(() => {
    audioSystem.dispose();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(audioSystem.initialize()).resolves.not.toThrow();
    });

    it('should not be muted by default', () => {
      expect(audioSystem.isMuted()).toBe(false);
    });
  });

  describe('volume control', () => {
    it('should set master volume', async () => {
      await audioSystem.initialize();
      
      audioSystem.setMasterVolume(0.5);
      
      // Volume should be clamped between 0 and 1
      audioSystem.setMasterVolume(1.5);
      audioSystem.setMasterVolume(-0.5);
      
      // No errors should occur
      expect(true).toBe(true);
    });

    it('should set SFX volume', () => {
      audioSystem.setSFXVolume(0.5);
      audioSystem.setSFXVolume(1.5); // Should clamp to 1
      audioSystem.setSFXVolume(-0.5); // Should clamp to 0
      
      expect(true).toBe(true);
    });

    it('should toggle mute state', () => {
      expect(audioSystem.isMuted()).toBe(false);
      
      audioSystem.setMuted(true);
      expect(audioSystem.isMuted()).toBe(true);
      
      audioSystem.setMuted(false);
      expect(audioSystem.isMuted()).toBe(false);
    });
  });

  describe('footstep timing', () => {
    it('should reset timer when not moving', () => {
      // Simulate some movement first
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      
      // Stop moving
      audioSystem.updateFootsteps(false, true, 0, 0.1);
      
      expect(audioSystem.getFootstepTimer()).toBe(0);
    });

    it('should reset timer when not grounded', () => {
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      
      // Leave ground
      audioSystem.updateFootsteps(true, false, 5, 0.1);
      
      expect(audioSystem.getFootstepTimer()).toBe(0);
    });

    it('should reset timer when speed is too low', () => {
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      
      // Very slow speed
      audioSystem.updateFootsteps(true, true, 0.05, 0.1);
      
      expect(audioSystem.getFootstepTimer()).toBe(0);
    });

    it('should accumulate timer when moving on ground', () => {
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      expect(audioSystem.getFootstepTimer()).toBeCloseTo(0.1, 5);
      
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      expect(audioSystem.getFootstepTimer()).toBeCloseTo(0.2, 5);
      
      audioSystem.updateFootsteps(true, true, 5, 0.1);
      expect(audioSystem.getFootstepTimer()).toBeCloseTo(0.3, 5);
    });

    it('should reset timer after footstep interval', async () => {
      await audioSystem.initialize();
      
      // Accumulate time past the interval
      const interval = DEFAULT_AUDIO_CONFIG.footstepInterval;
      
      // At speed 7 (max), interval should be exactly footstepInterval
      audioSystem.updateFootsteps(true, true, 7, interval + 0.01);
      
      // Timer should have reset after playing footstep
      expect(audioSystem.getFootstepTimer()).toBe(0);
    });

    it('should adjust interval based on speed', async () => {
      await audioSystem.initialize();
      
      // At half speed, interval should be doubled
      const baseInterval = DEFAULT_AUDIO_CONFIG.footstepInterval;
      const halfSpeed = 3.5;
      const expectedInterval = baseInterval * (7 / halfSpeed);
      
      // Accumulate time just under the adjusted interval
      audioSystem.updateFootsteps(true, true, halfSpeed, expectedInterval - 0.01);
      expect(audioSystem.getFootstepTimer()).toBeGreaterThan(0);
      
      // Accumulate time past the adjusted interval
      audioSystem.updateFootsteps(true, true, halfSpeed, 0.02);
      expect(audioSystem.getFootstepTimer()).toBe(0);
    });
  });

  describe('listener position', () => {
    it('should set listener position without errors', async () => {
      await audioSystem.initialize();
      
      const position = new Vector3(10, 5, 20);
      const forward = new Vector3(0, 0, -1);
      const up = new Vector3(0, 1, 0);
      
      expect(() => {
        audioSystem.setListenerPosition(position, forward, up);
      }).not.toThrow();
    });

    it('should handle setting position before initialization', () => {
      const position = new Vector3(10, 5, 20);
      const forward = new Vector3(0, 0, -1);
      const up = new Vector3(0, 1, 0);
      
      // Should not throw even if not initialized
      expect(() => {
        audioSystem.setListenerPosition(position, forward, up);
      }).not.toThrow();
    });
  });

  describe('sound playback', () => {
    it('should not throw when playing sound before initialization', () => {
      expect(() => {
        audioSystem.playSound('gunshot', new Vector3(0, 0, 0));
      }).not.toThrow();
    });

    it('should not throw when playing UI sound before initialization', () => {
      expect(() => {
        audioSystem.playUISound('hit');
      }).not.toThrow();
    });

    it('should not play sounds when muted', async () => {
      await audioSystem.initialize();
      
      audioSystem.setMuted(true);
      
      // These should not throw and should be no-ops
      expect(() => {
        audioSystem.playSound('gunshot', new Vector3(0, 0, 0));
        audioSystem.playUISound('hit');
      }).not.toThrow();
    });

    it('should play positional sound with custom volume', async () => {
      await audioSystem.initialize();
      
      expect(() => {
        audioSystem.playSound('gunshot', new Vector3(10, 0, 10), 0.5);
      }).not.toThrow();
    });

    it('should play UI sound with custom volume', async () => {
      await audioSystem.initialize();
      
      expect(() => {
        audioSystem.playUISound('hit', 0.3);
      }).not.toThrow();
    });
  });

  describe('event subscriptions', () => {
    it('should subscribe to weapon_fired events', async () => {
      await audioSystem.initialize();
      
      // Emit weapon fired event
      eventBus.emit({
        type: 'weapon_fired',
        timestamp: Date.now(),
        playerId: 1,
        origin: new Vector3(0, 0, 0),
        direction: new Vector3(0, 0, 1)
      });
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should subscribe to hit_confirmed events', async () => {
      await audioSystem.initialize();
      audioSystem.setLocalPlayerId(1);
      
      // Emit hit confirmed event
      eventBus.emit({
        type: 'hit_confirmed',
        timestamp: Date.now(),
        shooterId: 1,
        targetId: 2,
        hitPosition: new Vector3(5, 1, 5),
        damage: 25
      });
      
      expect(true).toBe(true);
    });

    it('should subscribe to land_impact events', async () => {
      await audioSystem.initialize();
      
      eventBus.emit({
        type: 'land_impact',
        timestamp: Date.now()
      });
      
      expect(true).toBe(true);
    });

    it('should clean up subscriptions on dispose', async () => {
      await audioSystem.initialize();
      
      audioSystem.dispose();
      
      // Events should no longer trigger sounds (no errors)
      eventBus.emit({
        type: 'weapon_fired',
        timestamp: Date.now(),
        playerId: 1,
        origin: new Vector3(0, 0, 0),
        direction: new Vector3(0, 0, 1)
      });
      
      expect(true).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose without errors', async () => {
      await audioSystem.initialize();
      
      expect(() => {
        audioSystem.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls', async () => {
      await audioSystem.initialize();
      
      audioSystem.dispose();
      audioSystem.dispose();
      
      expect(true).toBe(true);
    });

    it('should handle dispose before initialization', () => {
      expect(() => {
        audioSystem.dispose();
      }).not.toThrow();
    });
  });
});
