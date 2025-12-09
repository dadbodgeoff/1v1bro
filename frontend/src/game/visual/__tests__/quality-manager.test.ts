/**
 * Property-based tests for QualityManager
 *
 * **Feature: aaa-arena-visual-system**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { QualityManager } from '../QualityManager'
import type { QualityPreset } from '../types'

describe('QualityManager', () => {
  let manager: QualityManager

  beforeEach(() => {
    manager = new QualityManager()
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 14: Quality Preset Settings**
   * **Validates: Requirements 7.2**
   *
   * *For any* quality preset selection, the applied settings SHALL exactly match
   * the preset definition.
   */
  describe('Property 14: Quality Preset Settings', () => {
    it('should apply correct settings for each preset', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<QualityPreset>('low', 'medium', 'high', 'ultra'),
          (preset) => {
            manager.setPreset(preset)
            const settings = manager.getSettings()
            const expectedSettings = QualityManager.getPresetSettings(preset)

            expect(settings.parallaxLayers).toBe(expectedSettings.parallaxLayers)
            expect(settings.particleMultiplier).toBe(expectedSettings.particleMultiplier)
            expect(settings.animatedTilesEnabled).toBe(expectedSettings.animatedTilesEnabled)
            expect(settings.dynamicLightingEnabled).toBe(expectedSettings.dynamicLightingEnabled)
            expect(settings.blurEffectsEnabled).toBe(expectedSettings.blurEffectsEnabled)
            expect(settings.maxDrawCalls).toBe(expectedSettings.maxDrawCalls)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should have correct values for low preset', () => {
      manager.setPreset('low')
      const settings = manager.getSettings()

      expect(settings.parallaxLayers).toBe(2)
      expect(settings.particleMultiplier).toBe(0.25)
      expect(settings.animatedTilesEnabled).toBe(false)
      expect(settings.dynamicLightingEnabled).toBe(false)
      expect(settings.blurEffectsEnabled).toBe(false)
    })

    it('should have correct values for ultra preset', () => {
      manager.setPreset('ultra')
      const settings = manager.getSettings()

      expect(settings.parallaxLayers).toBe(4)
      expect(settings.particleMultiplier).toBe(1.0)
      expect(settings.animatedTilesEnabled).toBe(true)
      expect(settings.dynamicLightingEnabled).toBe(true)
      expect(settings.blurEffectsEnabled).toBe(true)
    })

    it('should track current preset', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<QualityPreset>('low', 'medium', 'high', 'ultra'),
          (preset) => {
            manager.setPreset(preset)
            expect(manager.getPreset()).toBe(preset)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 15: Quality Config Round-Trip**
   * **Validates: Requirements 7.6**
   *
   * *For any* QualitySettings object, serializing to JSON and deserializing back
   * SHALL produce an equivalent settings object.
   */
  describe('Property 15: Quality Config Round-Trip', () => {
    it('should serialize and deserialize settings correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<QualityPreset>('low', 'medium', 'high', 'ultra'),
          (preset) => {
            manager.setPreset(preset)
            const originalSettings = manager.getSettings()
            const originalPreset = manager.getPreset()

            // Serialize
            const json = manager.serialize()

            // Create new manager and deserialize
            const newManager = new QualityManager()
            newManager.deserialize(json)

            const restoredSettings = newManager.getSettings()
            const restoredPreset = newManager.getPreset()

            // Verify round-trip
            expect(restoredPreset).toBe(originalPreset)
            expect(restoredSettings.parallaxLayers).toBe(originalSettings.parallaxLayers)
            expect(restoredSettings.particleMultiplier).toBe(originalSettings.particleMultiplier)
            expect(restoredSettings.animatedTilesEnabled).toBe(originalSettings.animatedTilesEnabled)
            expect(restoredSettings.dynamicLightingEnabled).toBe(originalSettings.dynamicLightingEnabled)
            expect(restoredSettings.blurEffectsEnabled).toBe(originalSettings.blurEffectsEnabled)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should produce valid JSON', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<QualityPreset>('low', 'medium', 'high', 'ultra'),
          (preset) => {
            manager.setPreset(preset)
            const json = manager.serialize()

            // Should be valid JSON
            expect(() => JSON.parse(json)).not.toThrow()

            const parsed = JSON.parse(json)
            expect(parsed.preset).toBe(preset)
            expect(parsed.settings).toBeDefined()
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 16: Auto Quality Reduction**
   * **Validates: Requirements 7.5**
   *
   * *For any* frame time history where average exceeds 18ms, the QualityManager
   * SHALL reduce particle multiplier by 25% or disable blur effects.
   */
  describe('Property 16: Auto Quality Reduction', () => {
    it('should detect when quality reduction is needed', () => {
      manager.setPreset('ultra')
      manager.resetFrameTimeHistory()

      // Record 30+ frame times above 18ms
      for (let i = 0; i < 35; i++) {
        manager.recordFrameTime(25) // 25ms = ~40fps, below target
      }

      expect(manager.shouldReduceQuality()).toBe(true)
    })

    it('should not reduce quality when frame times are good', () => {
      manager.setPreset('ultra')
      manager.resetFrameTimeHistory()

      // Record 30+ frame times below 18ms
      for (let i = 0; i < 35; i++) {
        manager.recordFrameTime(10) // 10ms = 100fps, good
      }

      expect(manager.shouldReduceQuality()).toBe(false)
    })

    it('should reduce particle multiplier first', () => {
      manager.setPreset('ultra')
      manager.resetFrameTimeHistory()

      const originalMultiplier = manager.getSettings().particleMultiplier

      // Simulate poor performance
      for (let i = 0; i < 35; i++) {
        manager.recordFrameTime(25)
      }

      manager.autoAdjustQuality()

      const newMultiplier = manager.getSettings().particleMultiplier
      expect(newMultiplier).toBeLessThan(originalMultiplier)
      expect(newMultiplier).toBeCloseTo(originalMultiplier * 0.75, 2)
    })

    it('should disable blur after particles are minimized', () => {
      manager.setPreset('high')
      manager.resetFrameTimeHistory()

      // Manually set particle multiplier to minimum
      const settings = manager.getSettings()
      settings.particleMultiplier = 0.25

      // Simulate poor performance
      for (let i = 0; i < 35; i++) {
        manager.recordFrameTime(25)
      }

      manager.autoAdjustQuality()

      // Blur should be disabled
      expect(manager.getSettings().blurEffectsEnabled).toBe(false)
    })

    it('should calculate average frame time correctly', () => {
      manager.resetFrameTimeHistory()

      const frameTimes = [10, 15, 20, 15, 10]
      for (const time of frameTimes) {
        manager.recordFrameTime(time)
      }

      const avg = manager.getAverageFrameTime()
      const expectedAvg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length

      expect(avg).toBeCloseTo(expectedAvg, 2)
    })
  })

  describe('Frame time history', () => {
    it('should limit history size', () => {
      manager.resetFrameTimeHistory()

      // Record more than history size
      for (let i = 0; i < 100; i++) {
        manager.recordFrameTime(16)
      }

      // Average should still be calculable (history is capped)
      const avg = manager.getAverageFrameTime()
      expect(avg).toBeCloseTo(16, 1)
    })

    it('should reset frame time history', () => {
      for (let i = 0; i < 10; i++) {
        manager.recordFrameTime(20)
      }

      manager.resetFrameTimeHistory()

      expect(manager.getAverageFrameTime()).toBe(0)
    })
  })
})
