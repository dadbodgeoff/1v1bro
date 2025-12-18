/**
 * DebugOverlay Unit Tests
 * 
 * Tests for draw command filtering by config and stats display.
 * 
 * @module debug/DebugOverlay.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DebugOverlay,
  DEFAULT_DEBUG_CONFIG,
  DEFAULT_NETWORK_STATS,
  colorWithAlpha,
  getThresholdColor,
  type NetworkStats
} from './DebugOverlay';
import { Vector3 } from '../math/Vector3';
import { AABB } from '../physics/AABB';
import { Capsule } from '../physics/Capsule';

describe('DebugOverlay', () => {
  let debugOverlay: DebugOverlay;

  beforeEach(() => {
    debugOverlay = new DebugOverlay({
      ...DEFAULT_DEBUG_CONFIG,
      enabled: true
    });
  });

  describe('initialization', () => {
    it('should create with default config', () => {
      const overlay = new DebugOverlay();
      expect(overlay.isEnabled()).toBe(false);
    });

    it('should create with custom config', () => {
      const overlay = new DebugOverlay({
        ...DEFAULT_DEBUG_CONFIG,
        enabled: true
      });
      expect(overlay.isEnabled()).toBe(true);
    });
  });

  describe('enable/disable', () => {
    it('should toggle enabled state', () => {
      expect(debugOverlay.isEnabled()).toBe(true);
      
      debugOverlay.setEnabled(false);
      expect(debugOverlay.isEnabled()).toBe(false);
      
      debugOverlay.setEnabled(true);
      expect(debugOverlay.isEnabled()).toBe(true);
    });

    it('should clear draw commands when disabled', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      debugOverlay.drawAABB(aabb, '#ff0000');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(1);
      
      debugOverlay.setEnabled(false);
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });
  });

  describe('draw command filtering by config', () => {
    it('should not add AABB when showColliders is false', () => {
      debugOverlay.updateConfig({ showColliders: false });
      
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      debugOverlay.drawAABB(aabb, '#ff0000');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });

    it('should add AABB when showColliders is true', () => {
      debugOverlay.updateConfig({ showColliders: true });
      
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      debugOverlay.drawAABB(aabb, '#ff0000');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(1);
      expect(debugOverlay.getDrawCommands()[0].type).toBe('aabb');
    });

    it('should not add capsule when showCapsules is false', () => {
      debugOverlay.updateConfig({ showCapsules: false });
      
      const capsule = new Capsule(new Vector3(0, 0, 0));
      debugOverlay.drawCapsule(capsule, '#00ff00');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });

    it('should add capsule when showCapsules is true', () => {
      debugOverlay.updateConfig({ showCapsules: true });
      
      const capsule = new Capsule(new Vector3(0, 0, 0));
      debugOverlay.drawCapsule(capsule, '#00ff00');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(1);
      expect(debugOverlay.getDrawCommands()[0].type).toBe('capsule');
    });

    it('should not add ray when showRaycasts is false', () => {
      debugOverlay.updateConfig({ showRaycasts: false });
      
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });

    it('should add ray when showRaycasts is true', () => {
      debugOverlay.updateConfig({ showRaycasts: true });
      
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(1);
      expect(debugOverlay.getDrawCommands()[0].type).toBe('ray');
    });

    it('should not add point when showSpawnPoints is false', () => {
      debugOverlay.updateConfig({ showSpawnPoints: false });
      
      debugOverlay.drawPoint(new Vector3(5, 0, 5), '#ffff00', 0.5);
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });

    it('should add point when showSpawnPoints is true', () => {
      debugOverlay.updateConfig({ showSpawnPoints: true });
      
      debugOverlay.drawPoint(new Vector3(5, 0, 5), '#ffff00', 0.5);
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(1);
      expect(debugOverlay.getDrawCommands()[0].type).toBe('point');
    });

    it('should not add any commands when disabled', () => {
      debugOverlay.setEnabled(false);
      
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const capsule = new Capsule(new Vector3(0, 0, 0));
      
      debugOverlay.drawAABB(aabb, '#ff0000');
      debugOverlay.drawCapsule(capsule, '#00ff00');
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      debugOverlay.drawPoint(new Vector3(5, 0, 5), '#ffff00', 0.5);
      debugOverlay.drawLine(new Vector3(0, 0, 0), new Vector3(1, 1, 1), '#ffffff');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });
  });

  describe('draw commands', () => {
    it('should store AABB draw command with correct data', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(1, 2, 3), new Vector3(4, 5, 6));
      debugOverlay.drawAABB(aabb, '#ff0000');
      
      const commands = debugOverlay.getDrawCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('aabb');
      if (commands[0].type === 'aabb') {
        expect(commands[0].aabb.id).toBe('test');
        expect(commands[0].color).toBe('#ff0000');
      }
    });

    it('should store capsule draw command with correct data', () => {
      const capsule = new Capsule(new Vector3(1, 2, 3), 0.5, 2.0);
      debugOverlay.drawCapsule(capsule, '#00ff00');
      
      const commands = debugOverlay.getDrawCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('capsule');
      if (commands[0].type === 'capsule') {
        expect(commands[0].capsule.position.x).toBe(1);
        expect(commands[0].capsule.radius).toBe(0.5);
        expect(commands[0].color).toBe('#00ff00');
      }
    });

    it('should store ray draw command with correct data', () => {
      const origin = new Vector3(0, 1, 0);
      const direction = new Vector3(0, 0, 1);
      debugOverlay.drawRay(origin, direction, 15, '#0000ff');
      
      const commands = debugOverlay.getDrawCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ray');
      if (commands[0].type === 'ray') {
        expect(commands[0].origin.y).toBe(1);
        expect(commands[0].direction.z).toBe(1);
        expect(commands[0].length).toBe(15);
        expect(commands[0].color).toBe('#0000ff');
      }
    });

    it('should store point draw command with correct data', () => {
      debugOverlay.drawPoint(new Vector3(5, 0, 5), '#ffff00', 0.3);
      
      const commands = debugOverlay.getDrawCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('point');
      if (commands[0].type === 'point') {
        expect(commands[0].position.x).toBe(5);
        expect(commands[0].size).toBe(0.3);
        expect(commands[0].color).toBe('#ffff00');
      }
    });

    it('should store line draw command with correct data', () => {
      debugOverlay.drawLine(new Vector3(0, 0, 0), new Vector3(10, 5, 10), '#ffffff');
      
      const commands = debugOverlay.getDrawCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('line');
      if (commands[0].type === 'line') {
        expect(commands[0].start.x).toBe(0);
        expect(commands[0].end.x).toBe(10);
        expect(commands[0].color).toBe('#ffffff');
      }
    });

    it('should accumulate multiple draw commands', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const capsule = new Capsule(new Vector3(0, 0, 0));
      
      debugOverlay.drawAABB(aabb, '#ff0000');
      debugOverlay.drawCapsule(capsule, '#00ff00');
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(3);
    });

    it('should clear all draw commands', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      debugOverlay.drawAABB(aabb, '#ff0000');
      debugOverlay.drawAABB(aabb, '#00ff00');
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(2);
      
      debugOverlay.clear();
      
      expect(debugOverlay.getDrawCommands()).toHaveLength(0);
    });
  });

  describe('network stats', () => {
    it('should store and retrieve stats', () => {
      const stats: NetworkStats = {
        fps: 60,
        tickRate: 60,
        rtt: 50,
        packetLoss: 0.01,
        predictionError: 0.05,
        interpolationDelay: 100,
        pendingInputs: 3
      };
      
      debugOverlay.updateStats(stats);
      
      const retrieved = debugOverlay.getStats();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.fps).toBe(60);
      expect(retrieved?.rtt).toBe(50);
      expect(retrieved?.packetLoss).toBe(0.01);
    });

    it('should return null stats before update', () => {
      const overlay = new DebugOverlay();
      expect(overlay.getStats()).toBeNull();
    });

    it('should format stats as string', () => {
      debugOverlay.updateStats({
        fps: 60,
        tickRate: 60,
        rtt: 45,
        packetLoss: 0.02,
        predictionError: 0.123,
        interpolationDelay: 80,
        pendingInputs: 5
      });
      
      const formatted = debugOverlay.getFormattedStats();
      
      expect(formatted).toContain('FPS: 60');
      expect(formatted).toContain('RTT: 45 ms');
      expect(formatted).toContain('Packet Loss: 2.0%');
      expect(formatted).toContain('Prediction Error: 0.123 units');
      expect(formatted).toContain('Pending Inputs: 5');
    });

    it('should return empty string when showNetworkStats is false', () => {
      debugOverlay.updateConfig({ showNetworkStats: false });
      debugOverlay.updateStats(DEFAULT_NETWORK_STATS);
      
      expect(debugOverlay.getFormattedStats()).toBe('');
    });
  });

  describe('draw command counts', () => {
    it('should count draw commands by type', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const capsule = new Capsule(new Vector3(0, 0, 0));
      
      debugOverlay.drawAABB(aabb, '#ff0000');
      debugOverlay.drawAABB(aabb, '#ff0000');
      debugOverlay.drawCapsule(capsule, '#00ff00');
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      debugOverlay.drawRay(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10, '#0000ff');
      debugOverlay.drawPoint(new Vector3(5, 0, 5), '#ffff00', 0.5);
      
      const counts = debugOverlay.getDrawCommandCounts();
      
      expect(counts.aabb).toBe(2);
      expect(counts.capsule).toBe(1);
      expect(counts.ray).toBe(3);
      expect(counts.point).toBe(1);
      expect(counts.line).toBe(0);
    });
  });

  describe('config management', () => {
    it('should update config partially', () => {
      debugOverlay.updateConfig({ showColliders: false });
      
      const config = debugOverlay.getConfig();
      expect(config.showColliders).toBe(false);
      expect(config.showCapsules).toBe(true); // Unchanged
    });

    it('should return copy of config', () => {
      const config1 = debugOverlay.getConfig();
      const config2 = debugOverlay.getConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});

describe('utility functions', () => {
  describe('colorWithAlpha', () => {
    it('should convert hex color to rgba', () => {
      const result = colorWithAlpha('#ff0000', 0.5);
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle different hex colors', () => {
      expect(colorWithAlpha('#00ff00', 0.8)).toBe('rgba(0, 255, 0, 0.8)');
      expect(colorWithAlpha('#0000ff', 0.3)).toBe('rgba(0, 0, 255, 0.3)');
      expect(colorWithAlpha('#ffffff', 1.0)).toBe('rgba(255, 255, 255, 1)');
    });

    it('should convert rgb to rgba', () => {
      const result = colorWithAlpha('rgb(128, 64, 32)', 0.7);
      expect(result).toBe('rgba(128, 64, 32, 0.7)');
    });

    it('should return unchanged for other formats', () => {
      expect(colorWithAlpha('red', 0.5)).toBe('red');
    });
  });

  describe('getThresholdColor', () => {
    it('should return green for values below good threshold', () => {
      expect(getThresholdColor(30, 50, 100)).toBe('#00ff88');
      expect(getThresholdColor(50, 50, 100)).toBe('#00ff88');
    });

    it('should return yellow for values between thresholds', () => {
      expect(getThresholdColor(75, 50, 100)).toBe('#ffaa00');
      expect(getThresholdColor(100, 50, 100)).toBe('#ffaa00');
    });

    it('should return red for values above warn threshold', () => {
      expect(getThresholdColor(150, 50, 100)).toBe('#ff4444');
      expect(getThresholdColor(101, 50, 100)).toBe('#ff4444');
    });
  });
});
