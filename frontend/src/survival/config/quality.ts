/**
 * Quality Settings System
 * Enterprise-grade adaptive quality configuration
 * 
 * Features:
 * - Performance tier-based presets
 * - Runtime quality adjustment
 * - Per-system granular control
 * - Memory budget management
 */

import type { PerformanceTier, DeviceCapabilities } from './device'
import { getDeviceCapabilities } from './device'

/**
 * Renderer quality settings
 */
export interface RendererQuality {
  pixelRatio: number           // Device pixel ratio cap
  antialias: boolean           // MSAA enabled
  shadows: boolean             // Shadow mapping
  shadowMapSize: number        // Shadow map resolution
  toneMapping: boolean         // HDR tone mapping
  postProcessing: boolean      // Post-process effects
  maxLights: number            // Maximum active lights
}

/**
 * Particle system quality settings
 */
export interface ParticleQuality {
  enabled: boolean
  maxParticles: number         // Total particle budget
  dustEnabled: boolean         // Running/landing dust
  sparksEnabled: boolean       // Near-miss sparks
  trailsEnabled: boolean       // Speed/combo trails
  engineTrailEnabled: boolean  // Thruster exhaust
  deathEffectsEnabled: boolean // Death/respawn particles
}

/**
 * Space background quality settings
 */
export interface SpaceQuality {
  starCount: number            // Number of stars
  nebulaEnabled: boolean       // Nebula shader
  nebulaResolution: number     // Nebula texture size
  shootingStarsEnabled: boolean
  shootingStarRate: number     // Spawn rate multiplier
  celestialCount: number       // Max celestial objects
  celestialLOD: number         // Level of detail (0-2)
  cityEnabled: boolean         // City skyline
  spaceParticlesEnabled: boolean
  cosmicDustCount: number
  auroraCount: number
}

/**
 * Physics quality settings
 */
export interface PhysicsQuality {
  fixedTimestep: number        // Physics update rate (1/60 = 60Hz)
  maxSubsteps: number          // Max physics iterations per frame
  collisionPrecision: number   // Collision check frequency
}

/**
 * Animation quality settings
 */
export interface AnimationQuality {
  characterAnimations: boolean // Animated character poses
  obstacleAnimations: boolean  // Obstacle idle animations
  collectibleAnimations: boolean // Gem spin/bob
  cameraShake: boolean         // Screen shake effects
  dynamicFOV: boolean          // Speed-based FOV
  speedLines: boolean          // High-speed visual effect
}

/**
 * Audio quality settings
 */
export interface AudioQuality {
  enabled: boolean
  spatialAudio: boolean        // 3D positional audio
  maxConcurrentSounds: number  // Sound channel limit
  musicEnabled: boolean
  sfxEnabled: boolean
}

/**
 * Complete quality profile
 */
export interface QualityProfile {
  name: string
  tier: PerformanceTier
  renderer: RendererQuality
  particles: ParticleQuality
  space: SpaceQuality
  physics: PhysicsQuality
  animation: AnimationQuality
  audio: AudioQuality
  
  // Memory budgets (MB)
  textureMemoryBudget: number
  geometryMemoryBudget: number
  totalMemoryBudget: number
}

/**
 * Quality presets for each performance tier
 */
export const QUALITY_PRESETS: Record<PerformanceTier, QualityProfile> = {
  low: {
    name: 'Low',
    tier: 'low',
    renderer: {
      pixelRatio: 1,
      antialias: false,
      shadows: false,
      shadowMapSize: 512,
      toneMapping: false,
      postProcessing: false,
      maxLights: 2,
    },
    particles: {
      enabled: true,
      maxParticles: 200,
      dustEnabled: false,
      sparksEnabled: true,
      trailsEnabled: false,
      engineTrailEnabled: false,
      deathEffectsEnabled: true,
    },
    space: {
      starCount: 500,
      nebulaEnabled: false,
      nebulaResolution: 256,
      shootingStarsEnabled: false,
      shootingStarRate: 0,
      celestialCount: 2,
      celestialLOD: 0,
      cityEnabled: false,
      spaceParticlesEnabled: false,
      cosmicDustCount: 0,
      auroraCount: 0,
    },
    physics: {
      fixedTimestep: 1 / 30,  // 30Hz physics for low-end
      maxSubsteps: 2,
      collisionPrecision: 0.5,
    },
    animation: {
      characterAnimations: true,
      obstacleAnimations: false,
      collectibleAnimations: false,
      cameraShake: false,
      dynamicFOV: false,
      speedLines: false,
    },
    audio: {
      enabled: true,
      spatialAudio: false,
      maxConcurrentSounds: 4,
      musicEnabled: true,
      sfxEnabled: true,
    },
    textureMemoryBudget: 64,
    geometryMemoryBudget: 32,
    totalMemoryBudget: 128,
  },

  medium: {
    name: 'Medium',
    tier: 'medium',
    renderer: {
      pixelRatio: 1.5,
      antialias: true,
      shadows: false,
      shadowMapSize: 1024,
      toneMapping: true,
      postProcessing: false,
      maxLights: 4,
    },
    particles: {
      enabled: true,
      maxParticles: 500,
      dustEnabled: true,
      sparksEnabled: true,
      trailsEnabled: true,
      engineTrailEnabled: false,
      deathEffectsEnabled: true,
    },
    space: {
      starCount: 1000,
      nebulaEnabled: true,
      nebulaResolution: 512,
      shootingStarsEnabled: true,
      shootingStarRate: 0.3,
      celestialCount: 4,
      celestialLOD: 1,
      cityEnabled: true,
      spaceParticlesEnabled: true,
      cosmicDustCount: 150,
      auroraCount: 30,
    },
    physics: {
      fixedTimestep: 1 / 60,
      maxSubsteps: 3,
      collisionPrecision: 1,
    },
    animation: {
      characterAnimations: true,
      obstacleAnimations: true,
      collectibleAnimations: true,
      cameraShake: true,
      dynamicFOV: true,
      speedLines: false,
    },
    audio: {
      enabled: true,
      spatialAudio: false,
      maxConcurrentSounds: 8,
      musicEnabled: true,
      sfxEnabled: true,
    },
    textureMemoryBudget: 128,
    geometryMemoryBudget: 64,
    totalMemoryBudget: 256,
  },

  high: {
    name: 'High',
    tier: 'high',
    renderer: {
      pixelRatio: 2,
      antialias: true,
      shadows: true,
      shadowMapSize: 2048,
      toneMapping: true,
      postProcessing: true,
      maxLights: 6,
    },
    particles: {
      enabled: true,
      maxParticles: 1000,
      dustEnabled: true,
      sparksEnabled: true,
      trailsEnabled: true,
      engineTrailEnabled: true,
      deathEffectsEnabled: true,
    },
    space: {
      starCount: 2000,
      nebulaEnabled: true,
      nebulaResolution: 1024,
      shootingStarsEnabled: true,
      shootingStarRate: 0.5,
      celestialCount: 6,
      celestialLOD: 2,
      cityEnabled: true,
      spaceParticlesEnabled: true,
      cosmicDustCount: 300,
      auroraCount: 60,
    },
    physics: {
      fixedTimestep: 1 / 60,
      maxSubsteps: 4,
      collisionPrecision: 1,
    },
    animation: {
      characterAnimations: true,
      obstacleAnimations: true,
      collectibleAnimations: true,
      cameraShake: true,
      dynamicFOV: true,
      speedLines: true,
    },
    audio: {
      enabled: true,
      spatialAudio: true,
      maxConcurrentSounds: 12,
      musicEnabled: true,
      sfxEnabled: true,
    },
    textureMemoryBudget: 256,
    geometryMemoryBudget: 128,
    totalMemoryBudget: 512,
  },

  ultra: {
    name: 'Ultra',
    tier: 'ultra',
    renderer: {
      pixelRatio: 3,
      antialias: true,
      shadows: true,
      shadowMapSize: 4096,
      toneMapping: true,
      postProcessing: true,
      maxLights: 8,
    },
    particles: {
      enabled: true,
      maxParticles: 2000,
      dustEnabled: true,
      sparksEnabled: true,
      trailsEnabled: true,
      engineTrailEnabled: true,
      deathEffectsEnabled: true,
    },
    space: {
      starCount: 3000,
      nebulaEnabled: true,
      nebulaResolution: 2048,
      shootingStarsEnabled: true,
      shootingStarRate: 0.7,
      celestialCount: 8,
      celestialLOD: 2,
      cityEnabled: true,
      spaceParticlesEnabled: true,
      cosmicDustCount: 500,
      auroraCount: 100,
    },
    physics: {
      fixedTimestep: 1 / 60,
      maxSubsteps: 5,
      collisionPrecision: 1,
    },
    animation: {
      characterAnimations: true,
      obstacleAnimations: true,
      collectibleAnimations: true,
      cameraShake: true,
      dynamicFOV: true,
      speedLines: true,
    },
    audio: {
      enabled: true,
      spatialAudio: true,
      maxConcurrentSounds: 16,
      musicEnabled: true,
      sfxEnabled: true,
    },
    textureMemoryBudget: 512,
    geometryMemoryBudget: 256,
    totalMemoryBudget: 1024,
  },
}

/**
 * Quality Manager - Runtime quality control
 */
class QualityManager {
  private static instance: QualityManager | null = null
  private currentProfile: QualityProfile
  private customOverrides: Partial<QualityProfile> = {}
  private listeners: Set<(profile: QualityProfile) => void> = new Set()
  private autoAdjustEnabled: boolean = true
  private fpsHistory: number[] = []
  private readonly FPS_SAMPLE_SIZE = 60
  private readonly LOW_FPS_THRESHOLD = 25
  private readonly HIGH_FPS_THRESHOLD = 55

  private constructor() {
    const caps = getDeviceCapabilities()
    this.currentProfile = this.selectProfileForDevice(caps)
  }

  static getInstance(): QualityManager {
    if (!QualityManager.instance) {
      QualityManager.instance = new QualityManager()
    }
    return QualityManager.instance
  }

  /**
   * Get current quality profile
   */
  getProfile(): QualityProfile {
    return { ...this.currentProfile, ...this.customOverrides }
  }

  /**
   * Set quality tier manually
   */
  setTier(tier: PerformanceTier): void {
    this.currentProfile = QUALITY_PRESETS[tier]
    this.notifyListeners()
  }

  /**
   * Apply custom overrides to current profile
   */
  setOverrides(overrides: Partial<QualityProfile>): void {
    this.customOverrides = overrides
    this.notifyListeners()
  }

  /**
   * Enable/disable automatic quality adjustment
   */
  setAutoAdjust(enabled: boolean): void {
    this.autoAdjustEnabled = enabled
  }

  /**
   * Record FPS for auto-adjustment
   */
  recordFPS(fps: number): void {
    if (!this.autoAdjustEnabled) return

    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.FPS_SAMPLE_SIZE) {
      this.fpsHistory.shift()
    }

    // Check for quality adjustment every 60 frames
    if (this.fpsHistory.length === this.FPS_SAMPLE_SIZE) {
      this.checkAutoAdjust()
    }
  }

  /**
   * Subscribe to quality changes
   */
  onChange(callback: (profile: QualityProfile) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private selectProfileForDevice(caps: DeviceCapabilities): QualityProfile {
    // Start with tier-based preset
    let profile = QUALITY_PRESETS[caps.performanceTier]

    // Apply device-specific adjustments
    if (caps.isIOS && caps.isSafari) {
      // iOS Safari has WebGL limitations
      profile = {
        ...profile,
        renderer: {
          ...profile.renderer,
          pixelRatio: Math.min(profile.renderer.pixelRatio, 2),
          postProcessing: false,
        },
      }
    }

    if (caps.isLowMemory) {
      // Reduce memory-intensive features
      profile = {
        ...profile,
        space: {
          ...profile.space,
          starCount: Math.floor(profile.space.starCount * 0.5),
          celestialCount: Math.min(profile.space.celestialCount, 3),
        },
        particles: {
          ...profile.particles,
          maxParticles: Math.floor(profile.particles.maxParticles * 0.5),
        },
      }
    }

    if (caps.prefersReducedMotion) {
      // Respect accessibility preference
      profile = {
        ...profile,
        animation: {
          ...profile.animation,
          cameraShake: false,
          speedLines: false,
        },
        particles: {
          ...profile.particles,
          trailsEnabled: false,
        },
      }
    }

    if (caps.connectionType === 'slow-2g' || caps.connectionType === '2g') {
      // Reduce asset quality for slow connections
      profile = {
        ...profile,
        space: {
          ...profile.space,
          celestialCount: Math.min(profile.space.celestialCount, 2),
          cityEnabled: false,
        },
      }
    }

    return profile
  }

  private checkAutoAdjust(): void {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    const currentTier = this.currentProfile.tier
    const tiers: PerformanceTier[] = ['low', 'medium', 'high', 'ultra']
    const currentIndex = tiers.indexOf(currentTier)

    if (avgFPS < this.LOW_FPS_THRESHOLD && currentIndex > 0) {
      // Downgrade quality
      this.setTier(tiers[currentIndex - 1])
      this.fpsHistory = []
    } else if (avgFPS > this.HIGH_FPS_THRESHOLD && currentIndex < tiers.length - 1) {
      // Upgrade quality (more conservative)
      const minFPS = Math.min(...this.fpsHistory)
      if (minFPS > 45) {
        this.setTier(tiers[currentIndex + 1])
        this.fpsHistory = []
      }
    }
  }

  private notifyListeners(): void {
    const profile = this.getProfile()
    this.listeners.forEach(cb => cb(profile))
  }
}

// Export singleton accessor
export function getQualityProfile(): QualityProfile {
  return QualityManager.getInstance().getProfile()
}

export function setQualityTier(tier: PerformanceTier): void {
  QualityManager.getInstance().setTier(tier)
}

export function setQualityOverrides(overrides: Partial<QualityProfile>): void {
  QualityManager.getInstance().setOverrides(overrides)
}

export function recordFPSForQuality(fps: number): void {
  QualityManager.getInstance().recordFPS(fps)
}

export function onQualityChange(
  callback: (profile: QualityProfile) => void
): () => void {
  return QualityManager.getInstance().onChange(callback)
}

export function setAutoQualityAdjust(enabled: boolean): void {
  QualityManager.getInstance().setAutoAdjust(enabled)
}
