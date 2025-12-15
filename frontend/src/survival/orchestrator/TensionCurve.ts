/**
 * TensionCurve - Mathematical wave function for difficulty
 * Creates natural peaks and valleys that feel musical, not random
 * 
 * The tension value (0-1) influences:
 * - Pattern complexity selection
 * - Gap spacing (tighter at high tension)
 * - Phrase intensity
 */

export interface TensionConfig {
  // Base tension that increases with distance
  baseGrowthRate: number
  
  // Primary wave (slow, major peaks)
  primaryFrequency: number
  primaryAmplitude: number
  
  // Secondary wave (faster, minor variations)
  secondaryFrequency: number
  secondaryAmplitude: number
  
  // Micro variations (quick fluctuations)
  microFrequency: number
  microAmplitude: number
  
  // Clamp bounds
  minTension: number
  maxTension: number
}

const DEFAULT_CONFIG: TensionConfig = {
  baseGrowthRate: 0.0001,      // Slow overall increase
  
  primaryFrequency: 0.003,     // Major peak every ~330m
  primaryAmplitude: 0.25,
  
  secondaryFrequency: 0.008,   // Minor peak every ~125m
  secondaryAmplitude: 0.15,
  
  microFrequency: 0.02,        // Quick variations every ~50m
  microAmplitude: 0.08,
  
  minTension: 0.1,
  maxTension: 0.95,
}

/**
 * Tension state for tracking peaks and valleys
 */
export interface TensionState {
  currentTension: number
  trend: 'rising' | 'falling' | 'peak' | 'valley'
  distanceToNextPeak: number
  distanceToNextValley: number
  inClimax: boolean
}

export class TensionCurve {
  private config: TensionConfig
  private peakThreshold: number = 0.75
  private valleyThreshold: number = 0.35
  
  // Track recent tension for trend detection
  private tensionHistory: number[] = []
  private historySize: number = 10

  constructor(config: Partial<TensionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Calculate tension at a given distance
   * Returns value between minTension and maxTension
   */
  calculate(distance: number): number {
    const {
      baseGrowthRate,
      primaryFrequency,
      primaryAmplitude,
      secondaryFrequency,
      secondaryAmplitude,
      microFrequency,
      microAmplitude,
      minTension,
      maxTension,
    } = this.config

    // Base tension grows slowly with distance
    const baseTension = Math.min(0.5, distance * baseGrowthRate)

    // Primary wave - major peaks and valleys
    const primaryWave = Math.sin(distance * primaryFrequency) * primaryAmplitude

    // Secondary wave - adds variation
    const secondaryWave = Math.sin(distance * secondaryFrequency + 1.5) * secondaryAmplitude

    // Micro wave - quick fluctuations for unpredictability
    const microWave = Math.sin(distance * microFrequency + 0.7) * microAmplitude

    // Combine all waves
    let tension = baseTension + primaryWave + secondaryWave + microWave

    // Normalize to 0-1 range then clamp
    tension = (tension + 0.5) // Shift to positive range
    tension = Math.max(minTension, Math.min(maxTension, tension))

    // Track for trend detection
    this.updateHistory(tension)
    return tension
  }

  /**
   * Get full tension state with trend analysis
   */
  getState(distance: number): TensionState {
    const currentTension = this.calculate(distance)
    const trend = this.detectTrend()
    
    return {
      currentTension,
      trend,
      distanceToNextPeak: this.estimateDistanceToNextPeak(distance),
      distanceToNextValley: this.estimateDistanceToNextValley(distance),
      inClimax: currentTension >= this.peakThreshold,
    }
  }

  /**
   * Check if we're at a peak (good for climax phases)
   */
  isAtPeak(distance: number): boolean {
    const tension = this.calculate(distance)
    return tension >= this.peakThreshold
  }

  /**
   * Check if we're at a valley (good for breathers)
   */
  isAtValley(distance: number): boolean {
    const tension = this.calculate(distance)
    return tension <= this.valleyThreshold
  }

  /**
   * Get tension category for pattern selection
   */
  getTensionCategory(distance: number): 'low' | 'medium' | 'high' | 'extreme' {
    const tension = this.calculate(distance)
    
    if (tension < 0.3) return 'low'
    if (tension < 0.55) return 'medium'
    if (tension < 0.8) return 'high'
    return 'extreme'
  }

  /**
   * Detect current trend from history
   */
  private detectTrend(): 'rising' | 'falling' | 'peak' | 'valley' {
    if (this.tensionHistory.length < 3) return 'rising'

    const recent = this.tensionHistory.slice(-3)
    const [a, b, c] = recent

    // Peak: was rising, now falling
    if (a < b && b > c) return 'peak'
    
    // Valley: was falling, now rising
    if (a > b && b < c) return 'valley'
    
    // Rising: consistent increase
    if (a < b && b < c) return 'rising'
    
    // Falling: consistent decrease
    return 'falling'
  }

  /**
   * Estimate distance to next peak using primary wave
   */
  private estimateDistanceToNextPeak(currentDistance: number): number {
    const { primaryFrequency } = this.config
    const period = (2 * Math.PI) / primaryFrequency
    const phase = (currentDistance * primaryFrequency) % (2 * Math.PI)
    
    // Peak is at phase = π/2
    const peakPhase = Math.PI / 2
    let distanceToPhase = (peakPhase - phase) / primaryFrequency
    
    if (distanceToPhase < 0) {
      distanceToPhase += period
    }
    
    return distanceToPhase
  }

  /**
   * Estimate distance to next valley using primary wave
   */
  private estimateDistanceToNextValley(currentDistance: number): number {
    const { primaryFrequency } = this.config
    const period = (2 * Math.PI) / primaryFrequency
    const phase = (currentDistance * primaryFrequency) % (2 * Math.PI)
    
    // Valley is at phase = 3π/2
    const valleyPhase = (3 * Math.PI) / 2
    let distanceToPhase = (valleyPhase - phase) / primaryFrequency
    
    if (distanceToPhase < 0) {
      distanceToPhase += period
    }
    
    return distanceToPhase
  }

  /**
   * Update tension history for trend detection
   */
  private updateHistory(tension: number): void {
    this.tensionHistory.push(tension)
    while (this.tensionHistory.length > this.historySize) {
      this.tensionHistory.shift()
    }
  }

  /**
   * Apply a temporary tension modifier (for events)
   */
  getModifiedTension(distance: number, modifier: number): number {
    const base = this.calculate(distance)
    return Math.max(this.config.minTension, Math.min(this.config.maxTension, base * modifier))
  }

  /**
   * Reset state
   */
  reset(): void {
    this.tensionHistory = []
  }
}
