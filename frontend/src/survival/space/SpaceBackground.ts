/**
 * SpaceBackground - Main coordinator for the space environment
 * Combines stars, nebula, shooting stars, and celestial objects
 * Enterprise-grade with quality presets and performance monitoring
 */

import * as THREE from 'three'
import { StarField } from './StarField'
import { NebulaBackground } from './NebulaBackground'
import { ShootingStars } from './ShootingStars'
import { CelestialManager } from './CelestialManager'
import { CityScape } from './CityScape'
import { SpaceParticles } from './SpaceParticles'
import type { QualityPreset, QualitySettings, CelestialType } from './types'
import { QUALITY_PRESETS } from './types'
import { COLORS } from '../config/constants'

/**
 * Space background configuration
 */
export interface SpaceBackgroundConfig {
  quality: QualityPreset
  nebulaColors?: [number, number, number]
  shootingStarRate?: number
  celestialSpawnInterval?: number
}

const DEFAULT_CONFIG: SpaceBackgroundConfig = {
  quality: 'medium',
  nebulaColors: [0x1a0a2e, COLORS.brandIndigo, 0x0d1b2a],
  shootingStarRate: 0.3,
  celestialSpawnInterval: 400,
}

/**
 * Events emitted by space background
 */
export interface SpaceBackgroundEvents {
  onCelestialPassed?: (type: CelestialType) => void
  onMilestone?: (distance: number) => void
}

export class SpaceBackground {
  private scene: THREE.Scene
  private config: SpaceBackgroundConfig
  private qualitySettings: QualitySettings
  private events: SpaceBackgroundEvents

  // Components
  private starField: StarField | null = null
  private nebula: NebulaBackground | null = null
  private shootingStars: ShootingStars | null = null
  private celestialManager: CelestialManager | null = null
  private cityScape: CityScape | null = null
  private spaceParticles: SpaceParticles | null = null

  // State
  private enabled: boolean = true
  private lastMilestone: number = 0
  private milestoneInterval: number = 500

  constructor(
    scene: THREE.Scene,
    config: Partial<SpaceBackgroundConfig> = {},
    events: SpaceBackgroundEvents = {}
  ) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.qualitySettings = QUALITY_PRESETS[this.config.quality]
    this.events = events

    this.initialize()
  }

  /**
   * Initialize all space components based on quality settings
   */
  private initialize(): void {
    const settings = this.qualitySettings

    // Always create star field
    this.starField = new StarField()
    this.scene.add(this.starField.getObject())

    // Nebula (if enabled)
    if (settings.nebulaEnabled && this.config.nebulaColors) {
      this.nebula = new NebulaBackground({
        color1: this.config.nebulaColors[0],
        color2: this.config.nebulaColors[1],
        color3: this.config.nebulaColors[2],
      })
      this.scene.add(this.nebula.getObject())
    }

    // Shooting stars (if enabled)
    if (settings.shootingStarsEnabled) {
      this.shootingStars = new ShootingStars({
        spawnRate: this.config.shootingStarRate,
      })
      this.scene.add(this.shootingStars.getObject())
    }

    // Celestial manager
    this.celestialManager = new CelestialManager(this.scene)
    this.celestialManager.setMaxActive(settings.celestialCount)
    if (this.config.celestialSpawnInterval) {
      this.celestialManager.setSpawnInterval(this.config.celestialSpawnInterval)
    }

    // City skyline below track
    this.cityScape = new CityScape(this.scene)

    // Ambient space particles (cosmic dust, aurora, plasma orbs, etc.)
    // Optimized counts for better FPS while maintaining visual quality
    this.spaceParticles = new SpaceParticles(this.scene, {
      cosmicDustCount: settings.starCount > 1500 ? 300 : 200,
      warpStreakCount: 30,
      auroraCount: settings.starCount > 1500 ? 60 : 35,
      plasmaOrbCount: 10,
      explosionPoolSize: 2,
      cometTailParticles: 40,
    })
    
    // Wire up comet tail particles to celestial manager
    if (this.celestialManager) {
      this.spaceParticles.setCometPositionCallback(() => 
        this.celestialManager?.getCometPositions() ?? []
      )
    }
  }

  /**
   * Register a loaded celestial model
   */
  registerCelestialModel(type: CelestialType, model: THREE.Group): void {
    this.celestialManager?.registerModel(type, model)
  }

  /**
   * Register the city model for the skyline
   */
  registerCityModel(model: THREE.Group): void {
    this.cityScape?.registerModel(model)
  }

  /**
   * Update all space components
   */
  update(delta: number, playerZ: number, speed: number): void {
    if (!this.enabled) return

    // Update components
    this.starField?.update(delta, playerZ)
    this.nebula?.update(delta, playerZ)
    this.shootingStars?.update(delta, playerZ)
    this.celestialManager?.update(delta, playerZ)
    this.cityScape?.update(playerZ)
    this.spaceParticles?.update(delta, playerZ, speed)

    // Check milestones
    const distance = Math.abs(playerZ)
    if (distance - this.lastMilestone >= this.milestoneInterval) {
      this.lastMilestone = Math.floor(distance / this.milestoneInterval) * this.milestoneInterval
      this.onMilestone(this.lastMilestone)
    }

    // Adjust shooting star rate based on speed (more at higher speeds)
    if (this.shootingStars && speed > 25) {
      const rateMultiplier = 1 + (speed - 25) / 50
      this.shootingStars.setSpawnRate((this.config.shootingStarRate || 0.3) * rateMultiplier)
    }
  }

  /**
   * Handle milestone events
   */
  private onMilestone(distance: number): void {
    // Trigger shooting star burst at milestones
    if (this.shootingStars) {
      this.shootingStars.triggerBurst(3, -distance)
    }

    // Occasional distant explosion on major milestones
    if (distance % 1000 === 0 && this.spaceParticles) {
      this.spaceParticles.triggerExplosion(-distance)
    }

    this.events.onMilestone?.(distance)
  }

  /**
   * Set quality preset
   */
  setQuality(quality: QualityPreset): void {
    if (quality === this.config.quality) return

    this.config.quality = quality
    this.qualitySettings = QUALITY_PRESETS[quality]

    // Rebuild components with new quality
    this.dispose()
    this.initialize()
  }

  /**
   * Set nebula colors (for game state changes)
   */
  setNebulaColors(color1: number, color2: number, color3: number): void {
    this.nebula?.setColors(color1, color2, color3)
  }

  /**
   * Trigger damage effect (subtle nebula shift)
   */
  triggerDamageEffect(): void {
    // Briefly shift nebula to red tones
    if (this.nebula) {
      this.nebula.setColors(0x2a0a0a, 0x4a1010, 0x1a0505)
      
      // Reset after delay
      setTimeout(() => {
        if (this.config.nebulaColors) {
          this.nebula?.setColors(
            this.config.nebulaColors[0],
            this.config.nebulaColors[1],
            this.config.nebulaColors[2]
          )
        }
      }, 500)
    }
  }

  /**
   * Trigger boost effect (energize colors)
   */
  triggerBoostEffect(): void {
    // Shift nebula to energetic colors
    if (this.nebula) {
      this.nebula.setColors(0x1a1a3a, COLORS.brandOrange, 0x2a1a0a)
      
      // Burst of shooting stars
      this.shootingStars?.triggerBurst(5, this.lastMilestone)
      
      // Reset after delay
      setTimeout(() => {
        if (this.config.nebulaColors) {
          this.nebula?.setColors(
            this.config.nebulaColors[0],
            this.config.nebulaColors[1],
            this.config.nebulaColors[2]
          )
        }
      }, 2000)
    }
  }

  /**
   * Trigger a distant explosion (for milestone events)
   */
  triggerDistantExplosion(): void {
    this.spaceParticles?.triggerExplosion(this.lastMilestone)
  }

  /**
   * Get space particles for direct access
   */
  getSpaceParticles(): SpaceParticles | null {
    return this.spaceParticles
  }

  /**
   * Enable/disable space background
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    
    // Toggle visibility
    if (this.starField) {
      this.starField.getObject().visible = enabled
    }
    if (this.nebula) {
      this.nebula.getObject().visible = enabled
    }
    if (this.shootingStars) {
      this.shootingStars.getObject().visible = enabled
    }
    this.spaceParticles?.setEnabled(enabled)
  }

  /**
   * Get current quality preset
   */
  getQuality(): QualityPreset {
    return this.config.quality
  }

  /**
   * Get debug info
   */
  getDebugInfo(): object {
    return {
      quality: this.config.quality,
      enabled: this.enabled,
      celestialsActive: this.celestialManager?.getActiveCount() || 0,
      lastMilestone: this.lastMilestone,
      particleQuality: this.spaceParticles?.getQualityMultiplier() || 0,
    }
  }

  /**
   * Reset state (for new game)
   */
  reset(): void {
    this.lastMilestone = 0
    this.celestialManager?.reset()
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.starField) {
      this.scene.remove(this.starField.getObject())
      this.starField.dispose()
      this.starField = null
    }

    if (this.nebula) {
      this.scene.remove(this.nebula.getObject())
      this.nebula.dispose()
      this.nebula = null
    }

    if (this.shootingStars) {
      this.scene.remove(this.shootingStars.getObject())
      this.shootingStars.dispose()
      this.shootingStars = null
    }

    if (this.celestialManager) {
      this.celestialManager.dispose()
      this.celestialManager = null
    }

    if (this.cityScape) {
      this.cityScape.dispose()
      this.cityScape = null
    }

    if (this.spaceParticles) {
      this.spaceParticles.dispose()
      this.spaceParticles = null
    }
  }
}
