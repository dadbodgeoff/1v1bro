/**
 * Property-based tests for DynamicLightingSystem
 *
 * **Feature: aaa-arena-visual-system**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { DynamicLightingSystem } from '../DynamicLightingSystem'
import type { LightingConfig, HazardZone, Vector2 } from '../types'

const defaultConfig: LightingConfig = {
  ambientColor: '#1a0505',
  ambientIntensity: 0.3,
  rimLightingEnabled: true,
  rimLightColor: '#ff6600',
  rimLightWidth: 3,
}

describe('DynamicLightingSystem', () => {
  let system: DynamicLightingSystem

  beforeEach(() => {
    system = new DynamicLightingSystem(defaultConfig)
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 11: Light Source from Hazard**
   * **Validates: Requirements 4.1**
   *
   * *For any* lava hazard zone, the created light source SHALL have position at
   * hazard center, radius = 1.5x hazard width, and intensity = hazard.intensity * 0.8.
   */
  describe('Property 11: Light Source from Hazard', () => {
    it('should create lights with correct properties from hazards', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // x
          fc.integer({ min: 0, max: 1000 }), // y
          fc.integer({ min: 50, max: 300 }), // width
          fc.integer({ min: 50, max: 300 }), // height
          fc.integer({ min: 10, max: 100 }), // intensity * 100
          (x, y, width, height, intensityPct) => {
            const intensity = intensityPct / 100
            const hazard: HazardZone = {
              id: 'test_hazard',
              type: 'damage',
              bounds: { x, y, width, height },
              intensity,
            }

            system.createLightsFromHazards([hazard])

            const lights = system.getLights()
            const light = lights.find((l) => l.id === 'hazard_test_hazard')

            expect(light).toBeDefined()
            if (light) {
              // Position should be center of hazard
              expect(light.position.x).toBeCloseTo(x + width / 2, 1)
              expect(light.position.y).toBeCloseTo(y + height / 2, 1)

              // Radius should be 1.5x max dimension
              const expectedRadius = Math.max(width, height) * 1.5
              expect(light.radius).toBeCloseTo(expectedRadius, 1)

              // Intensity should be hazard.intensity * 0.8
              expect(light.intensity).toBeCloseTo(intensity * 0.8, 2)
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should only create lights for damage hazards', () => {
      const hazards: HazardZone[] = [
        { id: 'damage', type: 'damage', bounds: { x: 0, y: 0, width: 100, height: 100 }, intensity: 1 },
        { id: 'slow', type: 'slow', bounds: { x: 200, y: 0, width: 100, height: 100 }, intensity: 1 },
        { id: 'bounce', type: 'bounce', bounds: { x: 400, y: 0, width: 100, height: 100 }, intensity: 1 },
      ]

      system.createLightsFromHazards(hazards)

      const lights = system.getLights()
      expect(lights.length).toBe(1)
      expect(lights[0].id).toBe('hazard_damage')
    })
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 12: Underglow Distance Threshold**
   * **Validates: Requirements 4.4**
   *
   * *For any* player position, underglow SHALL be applied if and only if
   * the player is within 100px of a lava light source.
   */
  describe('Property 12: Underglow Distance Threshold', () => {
    beforeEach(() => {
      // Create a light at position (500, 500)
      system.addLight({
        id: 'test_light',
        position: { x: 500, y: 500 },
        color: '#ff6600',
        intensity: 1,
        radius: 200,
        falloff: 'quadratic',
      })
    })

    it('should detect player within 100px of light', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }), // distance from light
          fc.integer({ min: 0, max: 360 }), // angle in degrees
          (distance, angleDeg) => {
            const angle = (angleDeg * Math.PI) / 180
            const playerPos: Vector2 = {
              x: 500 + Math.cos(angle) * distance,
              y: 500 + Math.sin(angle) * distance,
            }

            expect(system.isPlayerInUnderglowRange(playerPos)).toBe(true)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should not detect player beyond 100px of light', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 500 }), // distance from light
          fc.integer({ min: 0, max: 360 }), // angle in degrees
          (distance, angleDeg) => {
            const angle = (angleDeg * Math.PI) / 180
            const playerPos: Vector2 = {
              x: 500 + Math.cos(angle) * distance,
              y: 500 + Math.sin(angle) * distance,
            }

            expect(system.isPlayerInUnderglowRange(playerPos)).toBe(false)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('Light intensity calculation', () => {
    it('should calculate intensity based on distance', () => {
      system.addLight({
        id: 'test',
        position: { x: 0, y: 0 },
        color: '#ff6600',
        intensity: 1,
        radius: 100,
        falloff: 'linear',
      })

      // At center, intensity should be high
      const centerIntensity = system.getLightIntensityAt({ x: 0, y: 0 })
      expect(centerIntensity).toBeGreaterThan(defaultConfig.ambientIntensity)

      // At edge, intensity should be lower
      const edgeIntensity = system.getLightIntensityAt({ x: 100, y: 0 })
      expect(edgeIntensity).toBeLessThan(centerIntensity)

      // Beyond radius, only ambient
      const farIntensity = system.getLightIntensityAt({ x: 200, y: 0 })
      expect(farIntensity).toBeCloseTo(defaultConfig.ambientIntensity, 2)
    })
  })

  describe('Light management', () => {
    it('should add and remove lights', () => {
      expect(system.getLights().length).toBe(0)

      system.addLight({
        id: 'light1',
        position: { x: 0, y: 0 },
        color: '#ff0000',
        intensity: 1,
        radius: 100,
        falloff: 'linear',
      })

      expect(system.getLights().length).toBe(1)

      system.removeLight('light1')
      expect(system.getLights().length).toBe(0)
    })
  })
})
