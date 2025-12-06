/**
 * Star Field Layer
 * Multi-layer parallax star field for depth
 */

import type { BackdropLayer, BackdropConfig } from '../types'

interface Star {
  x: number
  y: number
  z: number // Depth layer (0-1, closer = faster)
  size: number
  brightness: number
  twinklePhase: number
  twinkleSpeed: number
}

const STAR_COUNTS = {
  far: 120, // Tiny distant stars
  mid: 50, // Medium stars
  near: 15, // Bright close stars
}

export class StarFieldLayer implements BackdropLayer {
  private config: BackdropConfig
  private stars: Star[] = []
  private initialized = false
  private time = 0

  // Travel speed (pixels per second at z=1) - slowed down
  private baseSpeed = 20

  constructor(config: BackdropConfig) {
    this.config = config
  }

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const { width, height } = this.config

    // Far stars (tiny, slow)
    for (let i = 0; i < STAR_COUNTS.far; i++) {
      this.stars.push(this.createStar(width, height, 0.1 + Math.random() * 0.2))
    }

    // Mid stars
    for (let i = 0; i < STAR_COUNTS.mid; i++) {
      this.stars.push(this.createStar(width, height, 0.3 + Math.random() * 0.3))
    }

    // Near stars (bright, fast)
    for (let i = 0; i < STAR_COUNTS.near; i++) {
      this.stars.push(this.createStar(width, height, 0.7 + Math.random() * 0.3))
    }
  }

  private createStar(width: number, height: number, z: number): Star {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      z,
      size: 0.3 + z * 1.5, // Smaller stars overall
      brightness: 0.2 + z * 0.6, // Slightly dimmer
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 2, // Slower twinkle
    }
  }

  update(deltaTime: number, time: number): void {
    this.initialize()
    this.time = time

    const { width, height } = this.config

    // Move stars based on depth (parallax)
    for (const star of this.stars) {
      // Stars move left (we're traveling right through space)
      star.x -= this.baseSpeed * star.z * deltaTime

      // Wrap around
      if (star.x < -10) {
        star.x = width + 10
        star.y = Math.random() * height
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.initialize()

    ctx.save()

    for (const star of this.stars) {
      // Twinkle effect
      const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase)
      const alpha = star.brightness * (0.7 + twinkle * 0.3)

      // Star color (slight blue/white variation)
      const temp = 0.8 + star.z * 0.2 // Closer stars slightly warmer
      const r = Math.floor(200 + temp * 55)
      const g = Math.floor(200 + temp * 55)
      const b = 255

      ctx.globalAlpha = alpha
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

      // Draw star
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()

      // Add subtle glow for brighter stars only
      if (star.z > 0.8) {
        ctx.globalAlpha = alpha * 0.2
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }
}
