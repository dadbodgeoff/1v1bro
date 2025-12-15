/**
 * Quality Settings Tests
 * Verifies quality profile management and auto-adjustment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getQualityProfile,
  setQualityTier,
  setQualityOverrides,
  recordFPSForQuality,
  setAutoQualityAdjust,
  QUALITY_PRESETS,
} from './quality'

describe('Quality Settings', () => {
  beforeEach(() => {
    // Reset to default state
    setAutoQualityAdjust(false)
    vi.restoreAllMocks()
  })

  describe('QUALITY_PRESETS', () => {
    it('should have all four quality tiers', () => {
      expect(QUALITY_PRESETS.low).toBeDefined()
      expect(QUALITY_PRESETS.medium).toBeDefined()
      expect(QUALITY_PRESETS.high).toBeDefined()
      expect(QUALITY_PRESETS.ultra).toBeDefined()
    })

    it('should have increasing quality values', () => {
      expect(QUALITY_PRESETS.low.renderer.pixelRatio)
        .toBeLessThanOrEqual(QUALITY_PRESETS.medium.renderer.pixelRatio)
      expect(QUALITY_PRESETS.medium.renderer.pixelRatio)
        .toBeLessThanOrEqual(QUALITY_PRESETS.high.renderer.pixelRatio)
      expect(QUALITY_PRESETS.high.renderer.pixelRatio)
        .toBeLessThanOrEqual(QUALITY_PRESETS.ultra.renderer.pixelRatio)
    })

    it('should have increasing particle counts', () => {
      expect(QUALITY_PRESETS.low.particles.maxParticles)
        .toBeLessThan(QUALITY_PRESETS.medium.particles.maxParticles)
      expect(QUALITY_PRESETS.medium.particles.maxParticles)
        .toBeLessThan(QUALITY_PRESETS.high.particles.maxParticles)
      expect(QUALITY_PRESETS.high.particles.maxParticles)
        .toBeLessThan(QUALITY_PRESETS.ultra.particles.maxParticles)
    })

    it('should have increasing star counts', () => {
      expect(QUALITY_PRESETS.low.space.starCount)
        .toBeLessThan(QUALITY_PRESETS.medium.space.starCount)
      expect(QUALITY_PRESETS.medium.space.starCount)
        .toBeLessThan(QUALITY_PRESETS.high.space.starCount)
      expect(QUALITY_PRESETS.high.space.starCount)
        .toBeLessThan(QUALITY_PRESETS.ultra.space.starCount)
    })
  })

  describe('getQualityProfile', () => {
    it('should return a valid quality profile', () => {
      const profile = getQualityProfile()
      
      expect(profile).toBeDefined()
      expect(profile.name).toBeDefined()
      expect(profile.tier).toBeDefined()
      expect(profile.renderer).toBeDefined()
      expect(profile.particles).toBeDefined()
      expect(profile.space).toBeDefined()
      expect(profile.physics).toBeDefined()
      expect(profile.animation).toBeDefined()
      expect(profile.audio).toBeDefined()
    })

    it('should have valid renderer settings', () => {
      const profile = getQualityProfile()
      
      expect(profile.renderer.pixelRatio).toBeGreaterThan(0)
      expect(typeof profile.renderer.antialias).toBe('boolean')
      expect(typeof profile.renderer.shadows).toBe('boolean')
      expect(profile.renderer.maxLights).toBeGreaterThan(0)
    })

    it('should have valid particle settings', () => {
      const profile = getQualityProfile()
      
      expect(typeof profile.particles.enabled).toBe('boolean')
      expect(profile.particles.maxParticles).toBeGreaterThan(0)
    })

    it('should have valid physics settings', () => {
      const profile = getQualityProfile()
      
      expect(profile.physics.fixedTimestep).toBeGreaterThan(0)
      expect(profile.physics.fixedTimestep).toBeLessThanOrEqual(1 / 30)
      expect(profile.physics.maxSubsteps).toBeGreaterThan(0)
    })
  })

  describe('setQualityTier', () => {
    it('should change quality tier to low', () => {
      setQualityTier('low')
      const profile = getQualityProfile()
      
      expect(profile.tier).toBe('low')
      expect(profile.name).toBe('Low')
    })

    it('should change quality tier to medium', () => {
      setQualityTier('medium')
      const profile = getQualityProfile()
      
      expect(profile.tier).toBe('medium')
      expect(profile.name).toBe('Medium')
    })

    it('should change quality tier to high', () => {
      setQualityTier('high')
      const profile = getQualityProfile()
      
      expect(profile.tier).toBe('high')
      expect(profile.name).toBe('High')
    })

    it('should change quality tier to ultra', () => {
      setQualityTier('ultra')
      const profile = getQualityProfile()
      
      expect(profile.tier).toBe('ultra')
      expect(profile.name).toBe('Ultra')
    })
  })

  describe('setQualityOverrides', () => {
    it('should apply custom overrides', () => {
      setQualityTier('medium')
      setQualityOverrides({
        renderer: {
          ...QUALITY_PRESETS.medium.renderer,
          antialias: false,
        },
      })
      
      const profile = getQualityProfile()
      expect(profile.renderer.antialias).toBe(false)
    })
  })

  describe('recordFPSForQuality', () => {
    it('should accept FPS values without error', () => {
      expect(() => {
        recordFPSForQuality(60)
        recordFPSForQuality(30)
        recordFPSForQuality(45)
      }).not.toThrow()
    })
  })

  describe('setAutoQualityAdjust', () => {
    it('should enable/disable auto adjustment', () => {
      expect(() => {
        setAutoQualityAdjust(true)
        setAutoQualityAdjust(false)
      }).not.toThrow()
    })
  })
})

describe('Quality Profile Structure', () => {
  it('should have memory budgets', () => {
    const profile = getQualityProfile()
    
    expect(profile.textureMemoryBudget).toBeGreaterThan(0)
    expect(profile.geometryMemoryBudget).toBeGreaterThan(0)
    expect(profile.totalMemoryBudget).toBeGreaterThan(0)
  })

  it('should have audio settings', () => {
    const profile = getQualityProfile()
    
    expect(typeof profile.audio.enabled).toBe('boolean')
    expect(typeof profile.audio.spatialAudio).toBe('boolean')
    expect(profile.audio.maxConcurrentSounds).toBeGreaterThan(0)
  })

  it('should have animation settings', () => {
    const profile = getQualityProfile()
    
    expect(typeof profile.animation.characterAnimations).toBe('boolean')
    expect(typeof profile.animation.cameraShake).toBe('boolean')
    expect(typeof profile.animation.dynamicFOV).toBe('boolean')
    expect(typeof profile.animation.speedLines).toBe('boolean')
  })
})
