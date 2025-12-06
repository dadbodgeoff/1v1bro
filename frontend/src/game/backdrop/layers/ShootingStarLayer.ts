/**
 * Shooting Star Layer
 * Occasional meteors streaking across the sky
 */

import type { BackdropLayer, BackdropConfig } from '../types'

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  life: number
  maxLife: number
}

const SPAWN_CHANCE = 0.3 // Per second

export class ShootingStarLayer implements BackdropLayer {
  private config: BackdropConfig
  private shootingStars: ShootingStar[] = []
  private spawnTimer = 0

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(deltaTime: number, _time: number): void {
    const { width, height } = this.config

    // Maybe spawn a new shooting star
    this.spawnTimer += deltaTime
    if (this.spawnTimer > 1) {
      this.spawnTimer = 0
      if (Math.random() < SPAWN_CHANCE) {
        this.spawnShootingStar(width, height)
      }
    }

    // Update existing
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const star = this.shootingStars[i]
      star.x += star.vx * deltaTime
      star.y += star.vy * deltaTime
      star.life -= deltaTime

      if (star.life <= 0 || star.x > width + 100 || star.y > height + 100) {
        this.shootingStars.splice(i, 1)
      }
    }
  }

  private spawnShootingStar(width: number, height: number): void {
    // Start from top or left edge
    const fromTop = Math.random() > 0.5
    const speed = 400 + Math.random() * 300

    this.shootingStars.push({
      x: fromTop ? Math.random() * width : -50,
      y: fromTop ? -50 : Math.random() * height * 0.5,
      vx: speed * (0.7 + Math.random() * 0.3),
      vy: speed * (0.3 + Math.random() * 0.4),
      length: 50 + Math.random() * 100,
      life: 1.5,
      maxLife: 1.5,
    })
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    for (const star of this.shootingStars) {
      const alpha = star.life / star.maxLife

      // Calculate tail position
      const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy)
      const tailX = star.x - (star.vx / speed) * star.length
      const tailY = star.y - (star.vy / speed) * star.length

      // Draw gradient trail
      const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      gradient.addColorStop(0.7, `rgba(200, 220, 255, ${alpha * 0.5})`)
      gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`)

      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(star.x, star.y)
      ctx.stroke()

      // Bright head
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
