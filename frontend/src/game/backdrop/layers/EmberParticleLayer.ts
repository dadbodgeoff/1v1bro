/**
 * EmberParticleLayer - Floating ember particles
 * Creates glowing ember particles that float upward and fade
 * 
 * @module backdrop/layers/EmberParticleLayer
 */

import type { BackdropConfig, BackdropLayer } from '../types'

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}

export class EmberParticleLayer implements BackdropLayer {
  private config: BackdropConfig
  private embers: Ember[] = []
  private readonly maxEmbers = 50

  constructor(config: BackdropConfig) {
    this.config = config
    this.initializeEmbers()
  }

  private initializeEmbers(): void {
    const { width, height } = this.config

    for (let i = 0; i < this.maxEmbers; i++) {
      this.embers.push(this.createEmber(
        Math.random() * width,
        Math.random() * height
      ))
    }
  }

  private createEmber(x: number, y: number): Ember {
    const maxLife = 3 + Math.random() * 4 // 3-7 seconds
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 15, // Slight horizontal drift
      vy: -20 - Math.random() * 30,    // Upward movement
      size: 2 + Math.random() * 4,     // 2-6 pixels
      alpha: 0.6 + Math.random() * 0.4,
      life: Math.random() * maxLife,   // Start at random point in lifecycle
      maxLife,
    }
  }

  update(deltaTime: number, _time: number): void {
    const { width, height } = this.config

    for (let i = 0; i < this.embers.length; i++) {
      const ember = this.embers[i]

      // Move ember
      ember.x += ember.vx * deltaTime
      ember.y += ember.vy * deltaTime

      // Add slight wave motion
      ember.x += Math.sin(ember.life * 2) * 0.5

      // Update life and fade
      ember.life += deltaTime
      const lifeRatio = ember.life / ember.maxLife
      ember.alpha = Math.max(0, 0.8 * (1 - lifeRatio))

      // Respawn if dead or off screen
      if (ember.life >= ember.maxLife || ember.y < -20) {
        // Respawn at bottom
        this.embers[i] = this.createEmber(
          Math.random() * width,
          height + 10
        )
        this.embers[i].life = 0
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    for (const ember of this.embers) {
      if (ember.alpha <= 0) continue

      // Draw glowing ember
      const gradient = ctx.createRadialGradient(
        ember.x, ember.y, 0,
        ember.x, ember.y, ember.size * 2
      )
      gradient.addColorStop(0, `rgba(255, 136, 68, ${ember.alpha})`)
      gradient.addColorStop(0.5, `rgba(255, 68, 0, ${ember.alpha * 0.5})`)
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(ember.x, ember.y, ember.size * 2, 0, Math.PI * 2)
      ctx.fill()

      // Bright core
      ctx.fillStyle = `rgba(255, 200, 100, ${ember.alpha})`
      ctx.beginPath()
      ctx.arc(ember.x, ember.y, ember.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  /** Get current ember count for testing */
  getEmberCount(): number {
    return this.embers.length
  }
}
