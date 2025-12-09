/**
 * QualityManager - Performance-based quality scaling
 * @module visual/QualityManager
 */

import type { QualityPreset, QualitySettings } from './types'

const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  low: {
    parallaxLayers: 2,
    particleMultiplier: 0.25,
    animatedTilesEnabled: false,
    dynamicLightingEnabled: false,
    blurEffectsEnabled: false,
    maxDrawCalls: 30,
  },
  medium: {
    parallaxLayers: 3,
    particleMultiplier: 0.5,
    animatedTilesEnabled: true,
    dynamicLightingEnabled: false,
    blurEffectsEnabled: false,
    maxDrawCalls: 40,
  },
  high: {
    parallaxLayers: 4,
    particleMultiplier: 0.75,
    animatedTilesEnabled: true,
    dynamicLightingEnabled: true,
    blurEffectsEnabled: true,
    maxDrawCalls: 50,
  },
  ultra: {
    parallaxLayers: 4,
    particleMultiplier: 1.0,
    animatedTilesEnabled: true,
    dynamicLightingEnabled: true,
    blurEffectsEnabled: true,
    maxDrawCalls: 60,
  },
}

export class QualityManager {
  private currentPreset: QualityPreset = 'high'
  private settings: QualitySettings
  private frameTimeHistory: number[] = []
  private readonly historySize = 60

  constructor() {
    this.currentPreset = this.detectDeviceCapabilities()
    this.settings = { ...QUALITY_PRESETS[this.currentPreset] }
  }

  detectDeviceCapabilities(): QualityPreset {
    // Check device memory (if available)
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory

    // Check for mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    // Check GPU (rough heuristic via canvas performance)
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1000
    const ctx = canvas.getContext('2d')

    if (!ctx) return 'low'

    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      ctx.fillRect(0, 0, 1000, 1000)
    }
    const elapsed = performance.now() - start

    if (isMobile || (memory && memory < 4) || elapsed > 50) return 'low'
    if ((memory && memory < 8) || elapsed > 20) return 'medium'
    if ((memory && memory < 16) || elapsed > 10) return 'high'
    return 'ultra'
  }

  setPreset(preset: QualityPreset): void {
    this.currentPreset = preset
    this.settings = { ...QUALITY_PRESETS[preset] }
  }

  getPreset(): QualityPreset {
    return this.currentPreset
  }

  getSettings(): QualitySettings {
    return this.settings
  }

  recordFrameTime(ms: number): void {
    this.frameTimeHistory.push(ms)
    if (this.frameTimeHistory.length > this.historySize) {
      this.frameTimeHistory.shift()
    }
  }

  shouldReduceQuality(): boolean {
    if (this.frameTimeHistory.length < 30) return false

    const avgFrameTime =
      this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
    return avgFrameTime > 18 // Below 55fps
  }

  autoAdjustQuality(): void {
    if (!this.shouldReduceQuality()) return

    // First try reducing particles
    if (this.settings.particleMultiplier > 0.25) {
      this.settings.particleMultiplier *= 0.75
      console.warn(`Reduced particle multiplier to ${this.settings.particleMultiplier}`)
      return
    }

    // Then disable blur
    if (this.settings.blurEffectsEnabled) {
      this.settings.blurEffectsEnabled = false
      console.warn('Disabled blur effects for performance')
      return
    }

    // Finally reduce parallax layers
    if (this.settings.parallaxLayers > 2) {
      this.settings.parallaxLayers--
      console.warn(`Reduced parallax layers to ${this.settings.parallaxLayers}`)
    }
  }

  /**
   * Serialize settings for persistence
   */
  serialize(): string {
    return JSON.stringify({
      preset: this.currentPreset,
      settings: this.settings,
    })
  }

  /**
   * Deserialize settings
   */
  deserialize(json: string): void {
    const data = JSON.parse(json)
    this.currentPreset = data.preset
    this.settings = data.settings
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0
    return this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
  }

  /**
   * Reset frame time history
   */
  resetFrameTimeHistory(): void {
    this.frameTimeHistory = []
  }

  /**
   * Get preset settings for a specific preset
   */
  static getPresetSettings(preset: QualityPreset): QualitySettings {
    return { ...QUALITY_PRESETS[preset] }
  }
}
