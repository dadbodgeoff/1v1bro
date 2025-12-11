/**
 * Industrial Theme Backdrop Layers
 * 
 * Gritty military/industrial aesthetic with:
 * - Dark concrete/metal background
 * - Subtle dust particles
 * - Dim overhead lighting
 * - Occasional sparks
 * 
 * @module backdrop/layers/IndustrialLayers
 */

import type { BackdropConfig, BackdropLayer } from '../types'

// ============================================================================
// Industrial Color Palette
// ============================================================================

const INDUSTRIAL_COLORS = {
  // Background
  darkConcrete: '#1a1a1a',
  mediumConcrete: '#2a2a2a',
  lightConcrete: '#3a3a3a',
  
  // Accents
  rust: '#8b4513',
  metal: '#4a4a4a',
  warning: '#ff6600',
  
  // Lighting
  dimLight: 'rgba(255, 200, 100, 0.1)',
  spotlight: 'rgba(255, 255, 200, 0.05)',
  
  // Particles
  dust: 'rgba(150, 140, 120, 0.3)',
  spark: '#ffaa00',
}

// ============================================================================
// Industrial Concrete Layer (Base)
// ============================================================================

/**
 * Dark concrete/metal base layer
 */
export class IndustrialConcreteLayer implements BackdropLayer {
  private config: BackdropConfig
  private pattern: CanvasPattern | null = null
  private patternCanvas: HTMLCanvasElement | null = null

  constructor(config: BackdropConfig) {
    this.config = config
    this.createPattern()
  }

  private createPattern(): void {
    // Create a small pattern tile
    const size = 64
    this.patternCanvas = document.createElement('canvas')
    this.patternCanvas.width = size
    this.patternCanvas.height = size
    const ctx = this.patternCanvas.getContext('2d')
    if (!ctx) return

    // Base color
    ctx.fillStyle = INDUSTRIAL_COLORS.darkConcrete
    ctx.fillRect(0, 0, size, size)

    // Add subtle noise/texture
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const brightness = Math.random() * 20 - 10
      const gray = 26 + brightness // Base is #1a1a1a = 26
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`
      ctx.fillRect(x, y, 2, 2)
    }

    // Add occasional darker spots (stains)
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = 3 + Math.random() * 5
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fill()
    }
  }

  update(_deltaTime: number, _time: number): void {
    // Static layer
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Fill with pattern or solid color
    if (this.patternCanvas) {
      if (!this.pattern) {
        this.pattern = ctx.createPattern(this.patternCanvas, 'repeat')
      }
      if (this.pattern) {
        ctx.fillStyle = this.pattern
        ctx.fillRect(0, 0, this.config.width, this.config.height)
        return
      }
    }

    // Fallback to solid color
    ctx.fillStyle = INDUSTRIAL_COLORS.darkConcrete
    ctx.fillRect(0, 0, this.config.width, this.config.height)
  }
}

// ============================================================================
// Industrial Lighting Layer
// ============================================================================

/**
 * Dim overhead lighting with spotlights
 */
export class IndustrialLightingLayer implements BackdropLayer {
  private config: BackdropConfig
  private lights: Array<{ x: number; y: number; radius: number; intensity: number }> = []

  constructor(config: BackdropConfig) {
    this.config = config
    this.generateLights()
  }

  private generateLights(): void {
    // Create a grid of dim overhead lights
    const spacing = 200
    for (let x = spacing / 2; x < this.config.width; x += spacing) {
      for (let y = spacing / 2; y < this.config.height; y += spacing) {
        this.lights.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
          radius: 80 + Math.random() * 40,
          intensity: 0.03 + Math.random() * 0.02,
        })
      }
    }
  }

  update(_deltaTime: number, _time: number): void {
    // Static layer
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const light of this.lights) {
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      )
      gradient.addColorStop(0, `rgba(255, 240, 200, ${light.intensity})`)
      gradient.addColorStop(1, 'rgba(255, 240, 200, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(
        light.x - light.radius,
        light.y - light.radius,
        light.radius * 2,
        light.radius * 2
      )
    }
  }
}

// ============================================================================
// Industrial Dust Layer
// ============================================================================

interface DustParticle {
  x: number
  y: number
  size: number
  alpha: number
  vx: number
  vy: number
}

/**
 * Floating dust particles
 */
export class IndustrialDustLayer implements BackdropLayer {
  private config: BackdropConfig
  private particles: DustParticle[] = []

  constructor(config: BackdropConfig) {
    this.config = config
    this.generateParticles()
  }

  private generateParticles(): void {
    // Reduced particle count for cleaner look
    const count = Math.floor((this.config.width * this.config.height) / 20000)
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.config.width,
        y: Math.random() * this.config.height,
        size: 0.5 + Math.random() * 1,
        alpha: 0.05 + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2 - 1, // Slight upward drift
      })
    }
  }

  update(deltaTime: number, _time: number): void {
    for (const p of this.particles) {
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime

      // Wrap around
      if (p.x < 0) p.x = this.config.width
      if (p.x > this.config.width) p.x = 0
      if (p.y < 0) p.y = this.config.height
      if (p.y > this.config.height) p.y = 0
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(150, 140, 120, ${p.alpha})`
      ctx.fill()
    }
  }
}

// ============================================================================
// Industrial Spark Layer
// ============================================================================

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

/**
 * Occasional sparks from machinery
 */
export class IndustrialSparkLayer implements BackdropLayer {
  private config: BackdropConfig
  private sparks: Spark[] = []
  private spawnTimer = 0
  private spawnInterval = 5 // Seconds between spark bursts (increased for cleaner look)

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(deltaTime: number, _time: number): void {
    // Spawn new sparks occasionally (less frequent for cleaner enterprise look)
    this.spawnTimer += deltaTime
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0
      this.spawnInterval = 4 + Math.random() * 4 // 4-8 seconds between bursts
      this.spawnSparkBurst()
    }

    // Update existing sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]
      s.x += s.vx * deltaTime
      s.y += s.vy * deltaTime
      s.vy += 200 * deltaTime // Gravity
      s.life -= deltaTime

      if (s.life <= 0) {
        this.sparks.splice(i, 1)
      }
    }
  }

  private spawnSparkBurst(): void {
    // Random position along edges (simulating machinery)
    const edge = Math.floor(Math.random() * 4)
    let x: number, y: number

    switch (edge) {
      case 0: // Top
        x = Math.random() * this.config.width
        y = 0
        break
      case 1: // Right
        x = this.config.width
        y = Math.random() * this.config.height
        break
      case 2: // Bottom
        x = Math.random() * this.config.width
        y = this.config.height
        break
      default: // Left
        x = 0
        y = Math.random() * this.config.height
    }

    // Create smaller burst of sparks (reduced for cleaner look)
    const count = 2 + Math.floor(Math.random() * 2) // 2-3 sparks instead of 3-7
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 150, // Slower movement
        vy: (Math.random() - 0.5) * 150 - 30,
        life: 0.3 + Math.random() * 0.3, // Shorter lifespan
        maxLife: 0.6,
      })
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const s of this.sparks) {
      const alpha = (s.life / s.maxLife) * 0.7 // Reduced overall opacity
      ctx.beginPath()
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2) // Smaller sparks
      ctx.fillStyle = `rgba(255, 180, 50, ${alpha})`
      ctx.fill()

      // Subtle glow (reduced)
      ctx.beginPath()
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 120, 20, ${alpha * 0.15})`
      ctx.fill()
    }
  }
}
