/**
 * Property-based tests for ImpactFlashOverlay
 * Feature: enterprise-juice-feedback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import * as THREE from 'three'
import { ImpactFlashOverlay } from './ImpactFlashOverlay'

describe('ImpactFlashOverlay', () => {
  let flash: ImpactFlashOverlay
  let camera: THREE.PerspectiveCamera

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera()
    flash = new ImpactFlashOverlay(camera)
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 9: Impact flash duration is consistent**
   * For any collision, the flash fades from 30% to 0% over exactly 150ms.
   */
  it('Property 9: Impact flash duration is consistent', () => {
    fc.assert(
      fc.property(
        fc.boolean(),  // isLethal
        fc.integer({ min: 5, max: 20 }),  // Number of update steps (min 5 for precision)
        (isLethal, steps) => {
          flash.reset()
          flash.trigger(isLethal)
          
          // Initial opacity should be 0.3 (30%)
          expect(flash.getOpacity()).toBeCloseTo(0.3, 2)
          
          // Simulate updates over 150ms + a tiny bit more to ensure completion
          const totalTime = 0.151  // Slightly over 150ms to ensure completion
          const deltaPerStep = totalTime / steps
          
          for (let i = 0; i < steps; i++) {
            flash.update(deltaPerStep)
          }
          
          // After 150ms+, opacity should be 0 and flash should be inactive
          expect(flash.getOpacity()).toBe(0)
          expect(flash.isActive()).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Flash opacity decreases linearly over time
   */
  it('Flash opacity decreases linearly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 14 }).map(n => n / 100),  // Time within flash duration 0.01-0.14
        (time) => {
          flash.reset()
          flash.trigger(false)
          
          flash.update(time)
          
          // Expected opacity: 0.3 * (1 - time/0.15)
          const expectedOpacity = 0.3 * (1 - time / 0.15)
          expect(flash.getOpacity()).toBeCloseTo(expectedOpacity, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit tests
  describe('Unit Tests', () => {
    it('should start inactive', () => {
      expect(flash.isActive()).toBe(false)
      expect(flash.getOpacity()).toBe(0)
    })

    it('should activate on trigger', () => {
      flash.trigger()
      expect(flash.isActive()).toBe(true)
      expect(flash.getOpacity()).toBe(0.3)
    })

    it('should fade over time', () => {
      flash.trigger()
      flash.update(0.075)  // Half duration
      expect(flash.getOpacity()).toBeCloseTo(0.15, 2)
    })

    it('should complete after duration', () => {
      flash.trigger()
      flash.update(0.15)
      expect(flash.isActive()).toBe(false)
      expect(flash.getOpacity()).toBe(0)
    })

    it('should reset correctly', () => {
      flash.trigger()
      flash.update(0.05)
      flash.reset()
      expect(flash.isActive()).toBe(false)
      expect(flash.getOpacity()).toBe(0)
    })

    it('should track progress correctly', () => {
      flash.trigger()
      expect(flash.getProgress()).toBe(0)
      flash.update(0.075)
      expect(flash.getProgress()).toBeCloseTo(0.5, 2)
    })
  })
})
