/**
 * Arena Quality Settings System
 * Adaptive quality configuration ported from survival runner
 * 
 * Features:
 * - Performance tier-based presets
 * - Runtime quality adjustment based on FPS
 * - Per-system granular control
 * - Device-specific optimizations
 */

export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Renderer quality settings
 */
export interface RendererQuality {
  pixelRatio: number
  antialias: boolean
  shadows: boolean
  shadowMapSize: number
  toneMapping: boolean
  postProcessing: boolean
  maxLights: number
}

/**
 * Bot/Character quality settings
 */
export interface CharacterQuality {
  animationLODEnabled: boolean
  shadowCasting: boolean
  skinnedMeshOptimization: boolean
}

/**
 * Effects quality settings
 */
export interface EffectsQuality {
  particlesEnabled: boolean
  maxParticles: number
  muzzleFlash: boolean
  bulletTrails: boolean
  impactEffects: boolean
  bloomEnabled: boolean
  bloomStrength: number
}

/**
 * Physics quality settings
 */
export interface PhysicsQuality {
  fixedTimestep: number
  maxSubsteps: number
  spatialHashCellSize: number
}

/**
 * Complete quality profile
 */
export interface ArenaQualityProfile {
  name: string
  tier: PerformanceTier
  renderer: RendererQuality
  character: CharacterQuality
  effects: EffectsQuality
  physics: PhysicsQuality
  textureMemoryBudget: number
  geometryMemoryBudget: number
}

/**
 * Quality presets for each performance tier
 */
export const ARENA_QUALITY_PRESETS: Record<PerformanceTier, ArenaQualityProfile> = {
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
    character: {
      animationLODEnabled: true,
      shadowCasting: false,
      skinnedMeshOptimization: true,
    },
    effects: {
      particlesEnabled: true,
      maxParticles: 100,
      muzzleFlash: true,
      bulletTrails: false,
      impactEffects: false,
      bloomEnabled: false,
      bloomStrength: 0,
    },
    physics: {
      fixedTimestep: 1 / 30,
      maxSubsteps: 2,
      spatialHashCellSize: 6,
    },
    textureMemoryBudget: 64,
    geometryMemoryBudget: 32,
  },

  medium: {
    name: 'Medium',
    tier: 'medium',
    renderer: {
      pixelRatio: 1.5,
      antialias: true,
      shadows: true,
      shadowMapSize: 1024,
      toneMapping: true,
      postProcessing: false,
      maxLights: 4,
    },
    character: {
      animationLODEnabled: true,
      shadowCasting: true,
      skinnedMeshOptimization: true,
    },
    effects: {
      particlesEnabled: true,
      maxParticles: 200,
      muzzleFlash: true,
      bulletTrails: true,
      impactEffects: true,
      bloomEnabled: false,
      bloomStrength: 0,
    },
    physics: {
      fixedTimestep: 1 / 60,
      maxSubsteps: 3,
      spatialHashCellSize: 4,
    },
    textureMemoryBudget: 128,
    geometryMemoryBudget: 64,
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
    character: {
      animationLODEnabled: true,
      shadowCasting: true,
      skinnedMeshOptimization: false,
    },
    effects: {
      particlesEnabled: true,
      maxParticles: 500,
      muzzleFlash: true,
      bulletTrails: true,
      impactEffects: true,
      bloomEnabled: true,
      bloomStrength: 0.25, // Subtle bloom - avoids cheap glow
    },
    physics: {
      fixedTimestep: 1 / 60,
      maxSubsteps: 4,
      spatialHashCellSize: 4,
    },
    textureMemoryBudget: 256,
    geometryMemoryBudget: 128,
  },

  ultra: {
    name: 'Ultra',
    tier: 'ultra',
    renderer: {
      pixelRatio: 2,
      antialias: true,
      shadows: true,
      shadowMapSize: 2048, // Kept at 2048 - 4096 is overkill for this scene size
      toneMapping: true,
      postProcessing: true,
      maxLights: 8,
    },
    character: {
      animationLODEnabled: false,
      shadowCasting: true,
      skinnedMeshOptimization: false,
    },
    effects: {
      particlesEnabled: true,
      maxParticles: 1000,
      muzzleFlash: true,
      bulletTrails: true,
      impactEffects: true,
      bloomEnabled: true,
      bloomStrength: 0.3, // Controlled bloom - enterprise quality
    },
    physics: {
      fixedTimestep: 1 / 60,
      maxSubsteps: 5,
      spatialHashCellSize: 4,
    },
    textureMemoryBudget: 512,
    geometryMemoryBudget: 256,
  },
}

/**
 * Device capability detection
 */
export interface DeviceCapabilities {
  isMobile: boolean
  isIOS: boolean
  isSafari: boolean
  isLowMemory: boolean
  gpuTier: 'low' | 'medium' | 'high'
  maxTextureSize: number
  prefersReducedMotion: boolean
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  
  // Check for low memory (< 4GB)
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory
  const isLowMemory = deviceMemory !== undefined && deviceMemory < 4
  
  // Estimate GPU tier based on device
  let gpuTier: 'low' | 'medium' | 'high' = 'high'
  if (isMobile) {
    gpuTier = isIOS ? 'medium' : 'low'
  }
  
  // Get max texture size
  let maxTextureSize = 4096
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (gl) {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    }
  } catch {
    // Fallback
  }
  
  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  
  return {
    isMobile,
    isIOS,
    isSafari,
    isLowMemory,
    gpuTier,
    maxTextureSize,
    prefersReducedMotion,
  }
}

/**
 * Quality Manager - Runtime quality control with auto-adjustment
 */
class ArenaQualityManager {
  private static instance: ArenaQualityManager | null = null
  private currentProfile: ArenaQualityProfile
  private listeners: Set<(profile: ArenaQualityProfile) => void> = new Set()
  private autoAdjustEnabled = true
  private fpsHistory: number[] = []
  private readonly FPS_SAMPLE_SIZE = 60
  private readonly LOW_FPS_THRESHOLD = 25
  private readonly HIGH_FPS_THRESHOLD = 55
  private deviceCaps: DeviceCapabilities

  private constructor() {
    this.deviceCaps = detectDeviceCapabilities()
    this.currentProfile = this.selectProfileForDevice()
  }

  static getInstance(): ArenaQualityManager {
    if (!ArenaQualityManager.instance) {
      ArenaQualityManager.instance = new ArenaQualityManager()
    }
    return ArenaQualityManager.instance
  }

  getProfile(): ArenaQualityProfile {
    return this.currentProfile
  }

  getDeviceCapabilities(): DeviceCapabilities {
    return this.deviceCaps
  }

  setTier(tier: PerformanceTier): void {
    this.currentProfile = ARENA_QUALITY_PRESETS[tier]
    this.applyDeviceOverrides()
    this.notifyListeners()
  }

  setAutoAdjust(enabled: boolean): void {
    this.autoAdjustEnabled = enabled
  }

  recordFPS(fps: number): void {
    if (!this.autoAdjustEnabled) return

    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.FPS_SAMPLE_SIZE) {
      this.fpsHistory.shift()
    }

    if (this.fpsHistory.length === this.FPS_SAMPLE_SIZE) {
      this.checkAutoAdjust()
    }
  }

  onChange(callback: (profile: ArenaQualityProfile) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private selectProfileForDevice(): ArenaQualityProfile {
    const { isMobile, isIOS, isSafari, isLowMemory, gpuTier } = this.deviceCaps
    
    // Select base tier
    let tier: PerformanceTier = 'high'
    if (isMobile) {
      tier = gpuTier === 'low' ? 'low' : 'medium'
    } else if (isLowMemory) {
      tier = 'medium'
    }
    
    let profile = { ...ARENA_QUALITY_PRESETS[tier] }
    
    // iOS Safari specific overrides
    if (isIOS && isSafari) {
      profile = {
        ...profile,
        renderer: {
          ...profile.renderer,
          pixelRatio: Math.min(profile.renderer.pixelRatio, 1.5),
          antialias: false,
          postProcessing: false,
          shadows: false,
        },
        character: {
          ...profile.character,
          shadowCasting: false,
        },
        effects: {
          ...profile.effects,
          maxParticles: Math.floor(profile.effects.maxParticles * 0.5),
          bloomEnabled: false,
        },
      }
    }
    
    this.currentProfile = profile
    return profile
  }

  private applyDeviceOverrides(): void {
    const { isIOS, isSafari, prefersReducedMotion } = this.deviceCaps
    
    if (isIOS && isSafari) {
      this.currentProfile.renderer.pixelRatio = Math.min(this.currentProfile.renderer.pixelRatio, 1.5)
      this.currentProfile.renderer.antialias = false
      this.currentProfile.character.shadowCasting = false
    }
    
    if (prefersReducedMotion) {
      this.currentProfile.effects.bloomEnabled = false
    }
  }

  private checkAutoAdjust(): void {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    const currentTier = this.currentProfile.tier
    const tiers: PerformanceTier[] = ['low', 'medium', 'high', 'ultra']
    const currentIndex = tiers.indexOf(currentTier)

    if (avgFPS < this.LOW_FPS_THRESHOLD && currentIndex > 0) {
      console.log(`[ArenaQuality] FPS low (${avgFPS.toFixed(1)}), downgrading to ${tiers[currentIndex - 1]}`)
      this.setTier(tiers[currentIndex - 1])
      this.fpsHistory = []
    } else if (avgFPS > this.HIGH_FPS_THRESHOLD && currentIndex < tiers.length - 1) {
      const minFPS = Math.min(...this.fpsHistory)
      if (minFPS > 45) {
        console.log(`[ArenaQuality] FPS stable (${avgFPS.toFixed(1)}), upgrading to ${tiers[currentIndex + 1]}`)
        this.setTier(tiers[currentIndex + 1])
        this.fpsHistory = []
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentProfile))
  }
}

// Export singleton accessors
export function getArenaQualityProfile(): ArenaQualityProfile {
  return ArenaQualityManager.getInstance().getProfile()
}

export function setArenaQualityTier(tier: PerformanceTier): void {
  ArenaQualityManager.getInstance().setTier(tier)
}

export function recordArenaFPS(fps: number): void {
  ArenaQualityManager.getInstance().recordFPS(fps)
}

export function onArenaQualityChange(callback: (profile: ArenaQualityProfile) => void): () => void {
  return ArenaQualityManager.getInstance().onChange(callback)
}

export function setArenaAutoQualityAdjust(enabled: boolean): void {
  ArenaQualityManager.getInstance().setAutoAdjust(enabled)
}

export function getArenaDeviceCapabilities(): DeviceCapabilities {
  return ArenaQualityManager.getInstance().getDeviceCapabilities()
}
