/**
 * SmokeHazeLayer - Drifting smoke/haze effect
 * Creates semi-transparent smoke wisps that drift upward
 * 
 * @module backdrop/layers/SmokeHazeLayer
 */

import type { BackdropConfig, BackdropLayer } from '../types'

interface SmokeWisp {
  x: number
  y: number
  width: number
  height: number
  alpha: number
  drift: number
  speed: number
  phase: number
}

export class SmokeHazeLayer implements BackdropLayer {
  private config: BackdropConfig
  private wisps: SmokeWisp[] = []
  private readonly maxWisps = 30
  private time = 0

  constructor(config: BackdropConfig) {
    this.config = config
    this.initializeWisps()
  }

  private initializeWisps(): void {
    const { width, height } = this.config

    for (let i = 0; i < this.maxWisps; i++) {
      this.wisps.push(this.createWisp(
        Math.random() * width,
        Math.random() * height
      ))
    }
  }

  private createWisp(x: number, y: number): SmokeWisp {
    return {
      x,
      y,
      width: 60 + Math.random() * 100,
      height: 30 + Math.random() * 50,
      alpha: 0.05 + Math.random() * 0.1,
      drift: (Math.random() - 0.5) * 10,
      speed: 8 + Math.random() * 15,
      phase: Math.random() * Math.PI * 2,
    }
  }

  update(deltaTime: number, _time: number): void {
    const { width, height } = this.config
    this.time += deltaTime

    for (let i = 0; i < this.wisps.length; i++) {
      const wisp = this.wisps[i]

      // Move upward with drift
      wisp.y -= wisp.speed * deltaTime
      wisp.x += wisp.drift * deltaTime

      // Add wave motion
      wisp.x += Math.sin(this.time + wisp.phase) * 0.3

      // Respawn if off screen
      if (wisp.y < -wisp.height) {
        this.wisps[i] = this.createWisp(
          Math.random() * width,
          height + wisp.height
        )
      }

      // Wrap horizontally
      if (wisp.x < -wisp.width) wisp.x = width
      if (wisp.x > width + wisp.width) wisp.x = -wisp.width
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    for (const wisp of this.wisps) {
      // Draw smoke wisp as soft ellipse
      const gradient = ctx.createRadialGradient(
        wisp.x, wisp.y, 0,
        wisp.x, wisp.y, wisp.width / 2
      )
      gradient.addColorStop(0, `rgba(74, 74, 74, ${wisp.alpha})`)
      gradient.addColorStop(0.6, `rgba(74, 74, 74, ${wisp.alpha * 0.5})`)
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(wisp.x, wisp.y, wisp.width / 2, wisp.height / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  /** Get current wisp count for testing */
  getWispCount(): number {
    return this.wisps.length
  }
}
