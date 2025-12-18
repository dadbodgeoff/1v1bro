/**
 * CameraController Unit and Property Tests
 *
 * Tests for first-person camera control with view bob.
 * _Requirements: 14.3, 14.4, 15.5_
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  CameraController,
  DEFAULT_CAMERA_CONFIG,
  CameraConfig,
} from './CameraController';
import { Vector3 } from '../math/Vector3';

describe('CameraController', () => {
  let camera: CameraController;

  beforeEach(() => {
    camera = new CameraController(DEFAULT_CAMERA_CONFIG);
  });

  describe('initialization', () => {
    it('starts with zero pitch and yaw', () => {
      const state = camera.getState();
      expect(state.pitch).toBe(0);
      expect(state.yaw).toBe(0);
    });

    it('starts with zero view bob offset', () => {
      const state = camera.getState();
      expect(state.viewBobOffset).toBe(0);
    });
  });

  describe('applyLookDelta', () => {
    it('applies horizontal mouse movement to yaw', () => {
      camera.applyLookDelta(100, 0);
      const state = camera.getState();
      expect(state.yaw).toBeCloseTo(-100 * DEFAULT_CAMERA_CONFIG.sensitivity, 5);
    });

    it('applies vertical mouse movement to pitch', () => {
      camera.applyLookDelta(0, 100);
      const state = camera.getState();
      expect(state.pitch).toBeCloseTo(-100 * DEFAULT_CAMERA_CONFIG.sensitivity, 5);
    });

    it('accumulates multiple look deltas', () => {
      camera.applyLookDelta(50, 0);
      camera.applyLookDelta(50, 0);
      const state = camera.getState();
      expect(state.yaw).toBeCloseTo(-100 * DEFAULT_CAMERA_CONFIG.sensitivity, 5);
    });
  });

  describe('pitch clamping', () => {
    it('clamps pitch to positive limit', () => {
      // Apply large negative delta to push pitch up
      camera.applyLookDelta(0, -100000);
      const state = camera.getState();
      expect(state.pitch).toBe(DEFAULT_CAMERA_CONFIG.pitchLimit);
    });

    it('clamps pitch to negative limit', () => {
      // Apply large positive delta to push pitch down
      camera.applyLookDelta(0, 100000);
      const state = camera.getState();
      expect(state.pitch).toBe(-DEFAULT_CAMERA_CONFIG.pitchLimit);
    });

    it('pitch limit is 89 degrees', () => {
      const expectedLimit = (89 * Math.PI) / 180;
      expect(DEFAULT_CAMERA_CONFIG.pitchLimit).toBeCloseTo(expectedLimit, 5);
    });
  });

  describe('yaw normalization', () => {
    it('normalizes yaw to [-PI, PI] range', () => {
      // Apply enough delta to wrap around
      const largeYaw = 4 * Math.PI / DEFAULT_CAMERA_CONFIG.sensitivity;
      camera.applyLookDelta(largeYaw, 0);
      const state = camera.getState();
      expect(state.yaw).toBeGreaterThanOrEqual(-Math.PI);
      expect(state.yaw).toBeLessThanOrEqual(Math.PI);
    });
  });

  describe('view bob', () => {
    it('applies view bob when moving', () => {
      camera.updateViewBob(true, 7, 0.1);
      const state = camera.getState();
      expect(state.viewBobOffset).not.toBe(0);
    });

    it('view bob amplitude is within configured limit', () => {
      // Run several updates to get maximum bob
      for (let i = 0; i < 100; i++) {
        camera.updateViewBob(true, 7, 0.01);
      }
      const state = camera.getState();
      expect(Math.abs(state.viewBobOffset)).toBeLessThanOrEqual(
        DEFAULT_CAMERA_CONFIG.viewBobAmplitude * 1.01 // Small tolerance
      );
    });

    it('view bob returns to zero when stopped', () => {
      // First move to create bob
      for (let i = 0; i < 10; i++) {
        camera.updateViewBob(true, 7, 0.1);
      }

      // Then stop and let it settle
      for (let i = 0; i < 100; i++) {
        camera.updateViewBob(false, 0, 0.1);
      }

      const state = camera.getState();
      expect(state.viewBobOffset).toBe(0);
    });

    it('no view bob when speed is very low', () => {
      camera.updateViewBob(true, 0.05, 0.1);
      const state = camera.getState();
      expect(state.viewBobOffset).toBe(0);
    });
  });

  describe('getForwardVector', () => {
    it('returns forward vector pointing along -Z when yaw is 0', () => {
      const forward = camera.getForwardVector();
      expect(forward.x).toBeCloseTo(0, 5);
      expect(forward.y).toBeCloseTo(0, 5);
      expect(forward.z).toBeCloseTo(-1, 5);
    });

    it('forward vector has unit length', () => {
      camera.applyLookDelta(500, 200);
      const forward = camera.getForwardVector();
      expect(forward.magnitude()).toBeCloseTo(1, 5);
    });

    it('forward vector changes with yaw', () => {
      // Rotate 90 degrees (PI/2)
      const delta = (Math.PI / 2) / DEFAULT_CAMERA_CONFIG.sensitivity;
      camera.applyLookDelta(delta, 0);
      const forward = camera.getForwardVector();
      // Should now point along +X
      expect(forward.x).toBeCloseTo(1, 4);
      expect(forward.z).toBeCloseTo(0, 4);
    });

    it('forward vector changes with pitch', () => {
      // Look up 45 degrees
      const delta = (Math.PI / 4) / DEFAULT_CAMERA_CONFIG.sensitivity;
      camera.applyLookDelta(0, -delta);
      const forward = camera.getForwardVector();
      expect(forward.y).toBeGreaterThan(0);
    });
  });

  describe('getRightVector', () => {
    it('returns right vector pointing along +X when yaw is 0', () => {
      const right = camera.getRightVector();
      expect(right.x).toBeCloseTo(1, 5);
      expect(right.y).toBeCloseTo(0, 5);
      expect(right.z).toBeCloseTo(0, 5);
    });

    it('right vector has unit length', () => {
      camera.applyLookDelta(500, 200);
      const right = camera.getRightVector();
      expect(right.magnitude()).toBeCloseTo(1, 5);
    });

    it('right vector is perpendicular to forward', () => {
      camera.applyLookDelta(300, 150);
      const forward = camera.getForwardVector();
      const right = camera.getRightVector();
      // Dot product should be ~0 for perpendicular vectors
      // Note: right vector doesn't include pitch, so we check horizontal component
      const forwardHorizontal = new Vector3(forward.x, 0, forward.z).normalize();
      expect(forwardHorizontal.dot(right)).toBeCloseTo(0, 4);
    });
  });

  describe('getViewMatrix', () => {
    it('returns 16-element Float32Array', () => {
      const matrix = camera.getViewMatrix(Vector3.ZERO);
      expect(matrix).toBeInstanceOf(Float32Array);
      expect(matrix.length).toBe(16);
    });

    it('view matrix changes with position', () => {
      const matrix1 = camera.getViewMatrix(Vector3.ZERO);
      const matrix2 = camera.getViewMatrix(new Vector3(10, 0, 0));
      // Translation components should differ
      expect(matrix1[12]).not.toBe(matrix2[12]);
    });
  });

  describe('reset', () => {
    it('resets pitch and yaw to zero', () => {
      camera.applyLookDelta(500, 300);
      camera.reset();
      const state = camera.getState();
      expect(state.pitch).toBe(0);
      expect(state.yaw).toBe(0);
    });

    it('resets view bob to zero', () => {
      for (let i = 0; i < 10; i++) {
        camera.updateViewBob(true, 7, 0.1);
      }
      camera.reset();
      const state = camera.getState();
      expect(state.viewBobOffset).toBe(0);
    });
  });

  /**
   * Property Tests
   */
  describe('property tests', () => {
    /**
     * **Feature: arena-3d-physics-multiplayer, Property 30: Pitch Clamping**
     * *For any* sequence of look delta inputs, the CameraController pitch
     * SHALL remain within [-89°, +89°] (in radians: [-1.553, +1.553]).
     * **Validates: Requirements 14.4**
     */
    it('Property 30: pitch stays within ±89 degrees for any input sequence', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              deltaX: fc.float({ min: -10000, max: 10000, noNaN: true }),
              deltaY: fc.float({ min: -10000, max: 10000, noNaN: true }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (deltas) => {
            const testCamera = new CameraController(DEFAULT_CAMERA_CONFIG);
            const pitchLimit = DEFAULT_CAMERA_CONFIG.pitchLimit;

            for (const { deltaX, deltaY } of deltas) {
              testCamera.applyLookDelta(deltaX, deltaY);
              const state = testCamera.getState();

              // Pitch must always be within limits
              expect(state.pitch).toBeGreaterThanOrEqual(-pitchLimit);
              expect(state.pitch).toBeLessThanOrEqual(pitchLimit);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('yaw stays normalized to [-PI, PI] for any input sequence', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.float({ min: -100000, max: 100000, noNaN: true }),
            { minLength: 1, maxLength: 50 }
          ),
          (deltaXs) => {
            const testCamera = new CameraController(DEFAULT_CAMERA_CONFIG);

            for (const deltaX of deltaXs) {
              testCamera.applyLookDelta(deltaX, 0);
              const state = testCamera.getState();

              // Yaw must always be normalized
              expect(state.yaw).toBeGreaterThanOrEqual(-Math.PI);
              expect(state.yaw).toBeLessThanOrEqual(Math.PI);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('forward vector always has unit length', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10000, max: 10000, noNaN: true }),
          fc.float({ min: -10000, max: 10000, noNaN: true }),
          (deltaX, deltaY) => {
            const testCamera = new CameraController(DEFAULT_CAMERA_CONFIG);
            testCamera.applyLookDelta(deltaX, deltaY);
            const forward = testCamera.getForwardVector();
            expect(forward.magnitude()).toBeCloseTo(1, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('view bob amplitude never exceeds configured maximum', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              isMoving: fc.boolean(),
              speed: fc.integer({ min: 0, max: 20 }).map((n) => n),
              deltaTime: fc.integer({ min: 1, max: 100 }).map((n) => n / 1000),
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (updates) => {
            const testCamera = new CameraController(DEFAULT_CAMERA_CONFIG);

            for (const { isMoving, speed, deltaTime } of updates) {
              testCamera.updateViewBob(isMoving, speed, deltaTime);
              const state = testCamera.getState();

              // View bob should never exceed amplitude (with small tolerance for floating point)
              expect(Math.abs(state.viewBobOffset)).toBeLessThanOrEqual(
                DEFAULT_CAMERA_CONFIG.viewBobAmplitude * 1.01
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
