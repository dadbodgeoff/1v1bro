/**
 * Property-based tests for CameraController tilt functionality
 * Feature: enterprise-juice-feedback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import * as THREE from 'three'
import { CameraController } from './CameraController'

describe('CameraController Tilt', () => {
  let camera: THREE.PerspectiveCamera
  let controller: CameraController

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    controller = new CameraController(camera)
    controller.initialize(0)
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 7: Camera tilt is bounded**
   * For any lane change, the camera tilt shall not exceed 3 degrees (0.052 radians).
   */
  it('Property 7: Camera tilt is bounded', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(-1, 0, 1) as fc.Arbitrary<-1 | 0 | 1>,  // Lane direction
        fc.integer({ min: 1, max: 100 }),  // Number of updates
        fc.integer({ min: 1, max: 10 }).map(n => n / 100),  // Delta time 0.01-0.1
        (direction, updates, delta) => {
          controller.reset()
          controller.setTiltTarget(direction)
          
          // Run multiple updates
          for (let i = 0; i < updates; i++) {
            controller.fixedUpdate(delta, true, 0, false)
          }
          
          const tilt = controller.getTilt()
          const maxTilt = 0.052  // 3 degrees
          
          expect(Math.abs(tilt)).toBeLessThanOrEqual(maxTilt + 0.001)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 8: Airborne tilt is reduced**
   * For any lane change while airborne, the applied tilt shall be 50% of normal.
   */
  it('Property 8: Airborne tilt is reduced', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(-1, 1) as fc.Arbitrary<-1 | 1>,  // Non-zero direction
        fc.integer({ min: 50, max: 100 }),  // Updates to reach steady state
        (direction) => {
          // Test grounded tilt
          controller.reset()
          controller.setTiltTarget(direction)
          for (let i = 0; i < 100; i++) {
            controller.fixedUpdate(0.016, true, 0, false)  // Grounded
          }
          const groundedTilt = Math.abs(controller.getTilt())
          
          // Test airborne tilt
          controller.reset()
          controller.setTiltTarget(direction)
          for (let i = 0; i < 100; i++) {
            controller.fixedUpdate(0.016, true, 0, true)  // Airborne
          }
          const airborneTilt = Math.abs(controller.getTilt())
          
          // Airborne tilt should be approximately 50% of grounded
          // Allow some tolerance due to spring physics
          if (groundedTilt > 0.01) {
            const ratio = airborneTilt / groundedTilt
            expect(ratio).toBeGreaterThan(0.4)
            expect(ratio).toBeLessThan(0.6)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit tests
  describe('Unit Tests', () => {
    it('should start with zero tilt', () => {
      expect(controller.getTilt()).toBe(0)
    })

    it('should tilt when lane change is initiated', () => {
      controller.setTiltTarget(1)
      controller.fixedUpdate(0.1, true, 0, false)
      expect(controller.getTilt()).not.toBe(0)
    })

    it('should tilt in opposite direction of movement', () => {
      controller.setTiltTarget(1)  // Moving right
      for (let i = 0; i < 20; i++) {
        controller.fixedUpdate(0.016, true, 0, false)
      }
      // Should tilt left (negative) when moving right
      expect(controller.getTilt()).toBeLessThan(0)
    })

    it('should return to neutral when target is 0', () => {
      controller.setTiltTarget(1)
      for (let i = 0; i < 20; i++) {
        controller.fixedUpdate(0.016, true, 0, false)
      }
      
      controller.setTiltTarget(0)
      for (let i = 0; i < 50; i++) {
        controller.fixedUpdate(0.016, true, 0, false)
      }
      
      expect(Math.abs(controller.getTilt())).toBeLessThan(0.01)
    })

    it('should reset correctly', () => {
      controller.setTiltTarget(1)
      controller.fixedUpdate(0.1, true, 0, false)
      controller.reset()
      expect(controller.getTilt()).toBe(0)
    })
  })
})
