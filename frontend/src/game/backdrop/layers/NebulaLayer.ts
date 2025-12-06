/**
 * Nebula Layer
 * Distant colorful gas clouds for atmosphere
 */

import type { BackdropLayer, BackdropConfig } from '../types'

interface NebulaCloud {
  x: number
  y: number
  radius: number
  color: string
  alpha: number
  drift: number
}

export class NebulaLayer implements BackdropLayer {
  private config: BackdropConfig
  private clouds: NebulaCloud[] = []
  private initialized = false

  constructor(config: BackdropConfig) {
    this.config = config
  }

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const { width, height } = this.config

    // Create a few large nebula clouds
    const colors = [
      'rgba(100, 0, 150, 0.15)', // Purple
      'rgba(0, 100, 150, 0.12)', // Teal
      'rgba(150, 50, 100, 0.1)', // Pink
      'rgba(50, 0, 100, 0.12)', // Deep purple
    ]

    // Scattered clouds
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 150 + Math.random() * 250,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.08 + Math.random() * 0.1,
        drift: (Math.random() - 0.5) * 0.3,
      })
    }
  }

  update(deltaTime: number, _time: number): void {
    this.initialize()

    const { width } = this.config

    // Very slow drift
    for (const cloud of this.clouds) {
      cloud.x -= 5 * deltaTime // Slow parallax
      if (cloud.x < -cloud.radius * 2) {
        cloud.x = width + cloud.radius
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.initialize()

    ctx.save()

    for (const cloud of this.clouds) {
      // Soft radial gradient for each cloud
      const gradient = ctx.createRadialGradient(
        cloud.x,
        cloud.y,
        0,
        cloud.x,
        cloud.y,
        cloud.radius
      )

      gradient.addColorStop(0, cloud.color)
      gradient.addColorStop(0.5, cloud.color.replace(/[\d.]+\)$/, '0.05)'))
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(
        cloud.x - cloud.radius,
        cloud.y - cloud.radius,
        cloud.radius * 2,
        cloud.radius * 2
      )
    }

    ctx.restore()
  }
}
