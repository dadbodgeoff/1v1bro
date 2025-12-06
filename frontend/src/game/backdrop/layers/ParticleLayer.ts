/**
 * Particle Layer
 * Renders floating energy particles
 */

import type { BackdropLayer, BackdropConfig, EnergyParticle } from '../types'

const MAX_PARTICLES = 50
const SPAWN_RATE = 2 // particles per second

export class ParticleLayer implements BackdropLayer {
  private config: BackdropConfig
  private particles: EnergyParticle[] = []
  private spawnAccumulator = 0

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(deltaTime: number, _time: number): void {
    // Spawn new particles
    this.spawnAccumulator += deltaTime * SPAWN_RATE
    while (this.spawnAccumulator >= 1 && this.particles.length < MAX_PARTICLES) {
      this.spawnParticle()
      this.spawnAccumulator -= 1
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.life -= deltaTime

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private spawnParticle(): void {
    const { width, height } = this.config

    this.particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      life: 3 + Math.random() * 3,
      maxLife: 6,
      size: 1 + Math.random() * 2,
      hue: Math.random() > 0.5 ? 180 : 300,
    })
  }

  /**
   * Spawn burst of particles at position (for effects)
   */
  spawnBurst(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 100,
        vy: Math.sin(angle) * 100,
        life: 0.5,
        maxLife: 0.5,
        size: 3,
        hue: 180,
      })
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    for (const p of this.particles) {
      const lifeRatio = p.life / p.maxLife
      const alpha = lifeRatio * 0.8

      // Glow
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.3})`
      ctx.fill()

      // Core
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${alpha})`
      ctx.fill()
    }

    ctx.restore()
  }
}
