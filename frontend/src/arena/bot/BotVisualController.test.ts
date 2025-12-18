/**
 * BotVisualController Tests
 *
 * Property-based tests for bot visual interpolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { BotVisualController, DEFAULT_BOT_VISUAL_CONFIG } from './BotVisualController';
import { Vector3 } from '../math/Vector3';

// Mock AnimationLOD
vi.mock('../rendering/PerformanceOptimizer', () => ({
  AnimationLOD: class {
    shouldUpdate() { return true; }
    getTimeMultiplier() { return 1; }
  },
}));

describe('BotVisualController', () => {
  let controller: BotVisualController;
  let mockMesh: THREE.Object3D;

  beforeEach(() => {
    controller = new BotVisualController();
    mockMesh = new THREE.Object3D();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(controller.isReady()).toBe(false);
      
      controller.initialize(mockMesh, new Vector3(5, 1, 10));
      
      expect(controller.isReady()).toBe(true);
      const pos = controller.getVisualPosition();
      expect(pos.x).toBe(5);
      expect(pos.y).toBe(1);
      expect(pos.z).toBe(10);
    });

    it('should apply initial position to mesh', () => {
      controller.initialize(mockMesh, new Vector3(3, 2, 7));
      
      expect(mockMesh.position.x).toBe(3);
      expect(mockMesh.position.y).toBe(2);
      expect(mockMesh.position.z).toBe(7);
    });

    it('should reset velocity on initialize', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      const vel = controller.getVisualVelocity();
      expect(vel.x).toBe(0);
      expect(vel.y).toBe(0);
      expect(vel.z).toBe(0);
    });
  });

  describe('Property 1: Bot visual position lerps toward logical position', () => {
    it('should move closer to target after update (unless already at target)', () => {
      fc.assert(
        fc.property(
          // Generate random current position
          fc.record({
            x: fc.integer({ min: -50, max: 50 }).map(n => n + Math.random() * 0.5),
            y: fc.integer({ min: 0, max: 10 }).map(n => n + Math.random() * 0.5),
            z: fc.integer({ min: -50, max: 50 }).map(n => n + Math.random() * 0.5),
          }),
          // Generate random target position
          fc.record({
            x: fc.integer({ min: -50, max: 50 }).map(n => n + Math.random() * 0.5),
            y: fc.integer({ min: 0, max: 10 }).map(n => n + Math.random() * 0.5),
            z: fc.integer({ min: -50, max: 50 }).map(n => n + Math.random() * 0.5),
          }),
          // Generate delta time (use integer and scale)
          fc.integer({ min: 1, max: 100 }).map(n => n / 1000),
          (currentPos, targetPos, deltaTime) => {
            const ctrl = new BotVisualController();
            const mesh = new THREE.Object3D();
            
            ctrl.initialize(mesh, new Vector3(currentPos.x, currentPos.y, currentPos.z));
            
            const initialPos = ctrl.getVisualPosition();
            const initialDist = initialPos.distanceTo(
              new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
            );
            
            // Skip if already at target (within threshold)
            if (initialDist < 0.1) return true;
            
            // Update toward target
            ctrl.update(
              new Vector3(targetPos.x, targetPos.y, targetPos.z),
              null,
              deltaTime
            );
            
            const newPos = ctrl.getVisualPosition();
            const newDist = newPos.distanceTo(
              new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
            );
            
            // Should be closer (or at least not further) after update
            // Allow small tolerance for floating point
            return newDist <= initialDist + 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should converge to target over multiple updates', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      const target = new Vector3(10, 5, 10);
      
      // Run many updates (300 frames at 60fps = 5 seconds)
      for (let i = 0; i < 300; i++) {
        controller.update(target, null, 0.016); // ~60fps
      }
      
      const finalPos = controller.getVisualPosition();
      const dist = finalPos.distanceTo(new THREE.Vector3(10, 5, 10));
      
      // Should be very close to target after 5 seconds of updates
      expect(dist).toBeLessThan(1.0);
    });
  });

  describe('Property 2: Bot visual position resets instantly on spawn', () => {
    it('should reset position exactly to spawn position with zero velocity', () => {
      fc.assert(
        fc.property(
          // Generate random initial position
          fc.record({
            x: fc.float({ min: -50, max: 50, noNaN: true }),
            y: fc.float({ min: 0, max: 10, noNaN: true }),
            z: fc.float({ min: -50, max: 50, noNaN: true }),
          }),
          // Generate random spawn position
          fc.record({
            x: fc.float({ min: -50, max: 50, noNaN: true }),
            y: fc.float({ min: 0, max: 10, noNaN: true }),
            z: fc.float({ min: -50, max: 50, noNaN: true }),
          }),
          (initialPos, spawnPos) => {
            const ctrl = new BotVisualController();
            const mesh = new THREE.Object3D();
            
            // Initialize at some position
            ctrl.initialize(mesh, new Vector3(initialPos.x, initialPos.y, initialPos.z));
            
            // Do some updates to build up velocity
            for (let i = 0; i < 10; i++) {
              ctrl.update(new Vector3(100, 100, 100), null, 0.016);
            }
            
            // Reset to spawn position
            ctrl.resetPosition(new Vector3(spawnPos.x, spawnPos.y, spawnPos.z));
            
            // Position should exactly equal spawn position
            const pos = ctrl.getVisualPosition();
            expect(pos.x).toBeCloseTo(spawnPos.x, 5);
            expect(pos.y).toBeCloseTo(spawnPos.y, 5);
            expect(pos.z).toBeCloseTo(spawnPos.z, 5);
            
            // Velocity should be zero
            const vel = ctrl.getVisualVelocity();
            expect(vel.x).toBe(0);
            expect(vel.y).toBe(0);
            expect(vel.z).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should update mesh position on reset', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      // Move somewhere
      for (let i = 0; i < 10; i++) {
        controller.update(new Vector3(50, 5, 50), null, 0.016);
      }
      
      // Reset
      controller.resetPosition(new Vector3(-10, 2, -10));
      
      // Mesh should be at reset position
      expect(mockMesh.position.x).toBe(-10);
      expect(mockMesh.position.y).toBe(2);
      expect(mockMesh.position.z).toBe(-10);
    });
  });

  describe('rotation interpolation', () => {
    it('should smoothly interpolate rotation', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      // Update with target rotation
      controller.update(new Vector3(0, 0, 0), Math.PI / 2, 0.1);
      
      const rot = controller.getVisualRotation();
      // Should have moved toward target but not reached it instantly
      expect(rot).toBeGreaterThan(0);
      expect(rot).toBeLessThan(Math.PI / 2);
    });

    it('should take shortest path for rotation', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      // Set initial rotation near PI
      for (let i = 0; i < 50; i++) {
        controller.update(new Vector3(0, 0, 0), Math.PI - 0.1, 0.016);
      }
      
      const initialRot = controller.getVisualRotation();
      
      // Now rotate to -PI + 0.1 (should go through PI, not through 0)
      controller.update(new Vector3(0, 0, 0), -Math.PI + 0.1, 0.1);
      
      const newRot = controller.getVisualRotation();
      
      // Should have moved through PI (increased or wrapped)
      // The key is it shouldn't have gone all the way around through 0
      const diff = Math.abs(newRot - initialRot);
      expect(diff).toBeLessThan(Math.PI); // Took short path
    });
  });

  describe('visibility', () => {
    it('should set mesh visibility', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      controller.setVisible(false);
      expect(mockMesh.visible).toBe(false);
      
      controller.setVisible(true);
      expect(mockMesh.visible).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should allow config updates', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      
      controller.setConfig({ maxSpeed: 10 });
      
      // Update with high speed - should respect new max
      for (let i = 0; i < 50; i++) {
        controller.update(new Vector3(100, 0, 0), null, 0.016);
      }
      
      const vel = controller.getVisualVelocity();
      const speed = Math.sqrt(vel.x ** 2 + vel.z ** 2);
      
      // Speed should be capped at new max
      expect(speed).toBeLessThanOrEqual(10.1); // Small tolerance
    });

    it('should use custom config from constructor', () => {
      const customConfig = {
        ...DEFAULT_BOT_VISUAL_CONFIG,
        maxSpeed: 2.0,
      };
      
      const ctrl = new BotVisualController(customConfig);
      ctrl.initialize(mockMesh, new Vector3(0, 0, 0));
      
      // Update many times
      for (let i = 0; i < 100; i++) {
        ctrl.update(new Vector3(100, 0, 0), null, 0.016);
      }
      
      const vel = ctrl.getVisualVelocity();
      const speed = Math.sqrt(vel.x ** 2 + vel.z ** 2);
      
      expect(speed).toBeLessThanOrEqual(2.1);
    });
  });

  describe('dispose', () => {
    it('should cleanup on dispose', () => {
      controller.initialize(mockMesh, new Vector3(0, 0, 0));
      expect(controller.isReady()).toBe(true);
      
      controller.dispose();
      
      expect(controller.isReady()).toBe(false);
    });
  });
});
