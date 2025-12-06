/**
 * Cosmic Dust Layer
 * Subtle floating particles for depth
 */

import type { BackdropLayer, BackdropConfig } from '../types'

interface DustParticle {
  x: number
  y: number
  size: number
  alpha: number
  speed: number
}

const PARTICLE_COUNT = 40

export class CosmicDustLayer implements BackdropLayer {
  private config: BackdropConfig
  private particles: DustParticle[] = []
  private initialized = false

  constructor(config: BackdropConfig) {
    this.config = config
  }

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const { width, height } = this.config

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.2,
        speed: 10 + Math.random() * 30,
      })
    }
  }

  update(deltaTime: number, _time: number): void {
    this.initialize()

    const { width, height } = this.config

    for (const particle of this.particles) {
      particle.x -= particle.speed * deltaTime

      if (particle.x < -10) {
        particle.x = width + 10
        particle.y = Math.random() * height
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.initialize()

    ctx.save()

    for (const particle of this.particles) {
      ctx.globalAlpha = particle.alpha
      ctx.fillStyle = '#8888aa'

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
