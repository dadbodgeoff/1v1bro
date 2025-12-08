/**
 * LavaVortexRenderer - Central lava vortex whirlpool effect
 * Creates a dramatic swirling lava whirlpool at the center of Vortex Arena
 * 
 * @module renderers/LavaVortexRenderer
 */

import { VOLCANIC_COLORS } from '../backdrop/types'

interface VortexDebris {
  angle: number
  radius: number
  size: number
  speed: number
  alpha: number
}

interface LavaSplash {
  x: number
  y: number
  size: number
  alpha: number
  life: number
}

export class LavaVortexRenderer {
  private time = 0
  private debris: VortexDebris[] = []
  private splashes: LavaSplash[] = []
  private readonly maxDebris = 20
  private readonly maxSplashes = 5

  constructor() {
    this.initializeDebris()
  }

  private initializeDebris(): void {
    for (let i = 0; i < this.maxDebris; i++) {
      this.debris.push(this.createDebris())
    }
  }

  private createDebris(): VortexDebris {
    return {
      angle: Math.random() * Math.PI * 2,
      radius: 50 + Math.random() * 100,
      size: 3 + Math.random() * 5,
      speed: 0.5 + Math.random() * 1.5,
      alpha: 0.5 + Math.random() * 0.5,
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime

    // Update debris - spiral inward
    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i]
      d.angle += d.speed * deltaTime
      d.radius -= 15 * deltaTime // Spiral inward

      // Respawn if too close to center
      if (d.radius < 20) {
        this.debris[i] = this.createDebris()
      }
    }

    // Update splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const splash = this.splashes[i]
      splash.life -= deltaTime
      splash.alpha = Math.max(0, splash.life / 0.5)
      splash.size += deltaTime * 20

      if (splash.life <= 0) {
        this.splashes.splice(i, 1)
      }
    }

    // Occasionally add new splash
    if (Math.random() < deltaTime * 2 && this.splashes.length < this.maxSplashes) {
      const angle = Math.random() * Math.PI * 2
      const dist = 60 + Math.random() * 40
      this.splashes.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 5,
        alpha: 1,
        life: 0.5,
      })
    }
  }

  render(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number): void {
    ctx.save()
    ctx.translate(centerX, centerY)

    // Outer glow
    this.renderOuterGlow(ctx, radius)

    // Swirling lava rings
    this.renderSwirlRings(ctx, radius)

    // Intense center
    this.renderCenter(ctx, radius)

    // Debris particles
    this.renderDebris(ctx)

    // Splash effects
    this.renderSplashes(ctx)

    ctx.restore()
  }

  private renderOuterGlow(ctx: CanvasRenderingContext2D, radius: number): void {
    const pulse = 0.7 + 0.3 * Math.sin(this.time * 2)

    const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 1.5)
    glowGradient.addColorStop(0, `rgba(255, 68, 0, ${0.4 * pulse})`)
    glowGradient.addColorStop(0.5, `rgba(255, 102, 0, ${0.2 * pulse})`)
    glowGradient.addColorStop(1, 'transparent')

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderSwirlRings(ctx: CanvasRenderingContext2D, radius: number): void {
    // Multiple concentric swirl rings rotating at different speeds
    const ringCount = 5
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = radius * (0.2 + i * 0.15)
      const rotation = this.time * (2 - i * 0.3) // Inner rings faster
      const alpha = 0.6 - i * 0.08

      ctx.strokeStyle = `rgba(255, 68, 0, ${alpha})`
      ctx.lineWidth = 4 - i * 0.5
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.arc(0, 0, ringRadius, rotation, rotation + Math.PI * 1.6)
      ctx.stroke()

      // Secondary ring offset
      ctx.strokeStyle = `rgba(255, 102, 0, ${alpha * 0.7})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, ringRadius + 3, rotation + Math.PI, rotation + Math.PI * 2.4)
      ctx.stroke()
    }
    ctx.lineCap = 'butt'
  }

  private renderCenter(ctx: CanvasRenderingContext2D, radius: number): void {
    const pulse = 0.8 + 0.2 * Math.sin(this.time * 4)

    // Bright center core
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.4)
    centerGradient.addColorStop(0, `rgba(255, 255, 200, ${0.9 * pulse})`)
    centerGradient.addColorStop(0.3, VOLCANIC_COLORS.fire)
    centerGradient.addColorStop(0.6, VOLCANIC_COLORS.lavaCore)
    centerGradient.addColorStop(1, 'transparent')

    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // Inner swirl
    ctx.strokeStyle = `rgba(255, 200, 100, ${0.5 * pulse})`
    ctx.lineWidth = 3
    const innerRotation = this.time * 3
    ctx.beginPath()
    ctx.arc(0, 0, radius * 0.15, innerRotation, innerRotation + Math.PI * 1.2)
    ctx.stroke()
  }

  private renderDebris(ctx: CanvasRenderingContext2D): void {
    for (const d of this.debris) {
      const x = Math.cos(d.angle) * d.radius
      const y = Math.sin(d.angle) * d.radius

      // Rock debris with lava glow
      ctx.fillStyle = `rgba(60, 40, 30, ${d.alpha})`
      ctx.beginPath()
      ctx.arc(x, y, d.size, 0, Math.PI * 2)
      ctx.fill()

      // Glow on debris
      ctx.fillStyle = `rgba(255, 100, 50, ${d.alpha * 0.5})`
      ctx.beginPath()
      ctx.arc(x, y, d.size * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private renderSplashes(ctx: CanvasRenderingContext2D): void {
    for (const splash of this.splashes) {
      ctx.strokeStyle = `rgba(255, 136, 68, ${splash.alpha})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2)
      ctx.stroke()

      // Inner splash
      ctx.fillStyle = `rgba(255, 200, 100, ${splash.alpha * 0.5})`
      ctx.beginPath()
      ctx.arc(splash.x, splash.y, splash.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
