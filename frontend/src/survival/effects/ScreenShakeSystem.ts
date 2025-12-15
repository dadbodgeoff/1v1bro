/**
 * ScreenShakeSystem - Trauma-based screen shake with Perlin noise
 * Creates organic, AAA-quality camera shake on impacts
 */

// Simple 2D noise implementation (faster than importing a library)
function noise2D(x: number, y: number): number {
  // Simple hash-based noise
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

// Smoothed noise for organic movement
function smoothNoise(x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  
  // Smoothstep interpolation
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  
  const n00 = noise2D(x0, y0)
  const n10 = noise2D(x0 + 1, y0)
  const n01 = noise2D(x0, y0 + 1)
  const n11 = noise2D(x0 + 1, y0 + 1)
  
  const nx0 = n00 + sx * (n10 - n00)
  const nx1 = n01 + sx * (n11 - n01)
  
  return nx0 + sy * (nx1 - nx0)
}

export interface ShakeConfig {
  maxOffset: number       // Maximum positional displacement
  maxRotation: number     // Maximum rotational shake (radians)
  traumaDecay: number     // Decay rate per second
  frequency: number       // Noise frequency
}

export interface ShakeOffset {
  x: number
  y: number
  rotation: number
}

const DEFAULT_CONFIG: ShakeConfig = {
  maxOffset: 0.5,
  maxRotation: 0.03,
  traumaDecay: 2.0,       // Faster decay for snappier feel
  frequency: 20,
}

export class ScreenShakeSystem {
  private config: ShakeConfig
  private trauma: number = 0
  private seed: number
  private time: number = 0
  
  constructor(config: Partial<ShakeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.seed = Math.random() * 1000
  }
  
  /**
   * Add trauma to the shake system
   * Trauma is capped at 1.0
   * @param amount Trauma to add (0-1)
   */
  addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount)
  }
  
  /**
   * Get current trauma value
   */
  getTrauma(): number {
    return this.trauma
  }
  
  /**
   * Update shake state
   * @param delta Time since last update in seconds
   */
  update(delta: number): void {
    // Accumulate time for noise sampling
    this.time += delta * this.config.frequency
    
    // Exponential decay: trauma = trauma * e^(-decay * delta)
    // Approximated as: trauma -= trauma * decay * delta
    if (this.trauma > 0) {
      this.trauma *= Math.exp(-this.config.traumaDecay * delta)
      
      // Snap to zero when very small
      if (this.trauma < 0.001) {
        this.trauma = 0
      }
    }
  }
  
  /**
   * Get current shake offset
   * Uses trauma² for quadratic falloff (more intense at high trauma)
   */
  getOffset(): ShakeOffset {
    if (this.trauma <= 0) {
      return { x: 0, y: 0, rotation: 0 }
    }
    
    // Quadratic falloff - shake intensity = trauma²
    const intensity = this.trauma * this.trauma
    
    // Sample noise at different offsets for each axis
    const noiseX = smoothNoise(this.time, this.seed)
    const noiseY = smoothNoise(this.time + 100, this.seed + 100)
    const noiseRot = smoothNoise(this.time + 200, this.seed + 200)
    
    return {
      x: noiseX * this.config.maxOffset * intensity,
      y: noiseY * this.config.maxOffset * intensity,
      rotation: noiseRot * this.config.maxRotation * intensity,
    }
  }
  
  /**
   * Check if shake is currently active
   */
  isActive(): boolean {
    return this.trauma > 0.001
  }
  
  /**
   * Reset all shake
   */
  reset(): void {
    this.trauma = 0
    this.time = 0
    this.seed = Math.random() * 1000
  }
  
  /**
   * Set trauma directly (for testing)
   */
  setTrauma(value: number): void {
    this.trauma = Math.min(1.0, Math.max(0, value))
  }
}
