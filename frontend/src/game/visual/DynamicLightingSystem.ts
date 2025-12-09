/**
 * DynamicLightingSystem - Real-time lighting with rim effects and player underglow
 * @module visual/DynamicLightingSystem
 */

import type {
  LightSource,
  LightingConfig,
  HazardZone,
  Vector2,
  Rect,
  EdgeFlags,
} from './types'

export class DynamicLightingSystem {
  private lights: Map<string, LightSource> = new Map()
  private config: LightingConfig
  private time: number = 0

  constructor(config: LightingConfig) {
    this.config = config
  }

  /**
   * Create light sources from hazard zones
   */
  createLightsFromHazards(hazards: HazardZone[]): void {
    for (const hazard of hazards) {
      if (hazard.type !== 'damage') continue

      const light: LightSource = {
        id: `hazard_${hazard.id}`,
        position: {
          x: hazard.bounds.x + hazard.bounds.width / 2,
          y: hazard.bounds.y + hazard.bounds.height / 2,
        },
        color: '#ff6600',
        intensity: hazard.intensity * 0.8,
        radius: Math.max(hazard.bounds.width, hazard.bounds.height) * 1.5,
        falloff: 'quadratic',
        animation: {
          type: 'pulse',
          speed: 2,
          amplitude: 0.2,
        },
      }
      this.lights.set(light.id, light)
    }
  }

  /**
   * Add a custom light source
   */
  addLight(light: LightSource): void {
    this.lights.set(light.id, light)
  }

  /**
   * Remove a light source
   */
  removeLight(id: string): void {
    this.lights.delete(id)
  }

  update(deltaTime: number): void {
    this.time += deltaTime

    // Update animated lights
    for (const light of this.lights.values()) {
      if (!light.animation) continue

      if (light.animation.type === 'pulse') {
        const pulse = Math.sin(this.time * light.animation.speed * Math.PI * 2)
        light.intensity = 0.8 + pulse * light.animation.amplitude
      } else if (light.animation.type === 'flicker') {
        const flicker = Math.random() * light.animation.amplitude
        light.intensity = 0.8 + flicker
      }
    }
  }

  /**
   * Get light intensity at a position (for rim lighting)
   */
  getLightIntensityAt(position: Vector2): number {
    let totalIntensity = this.config.ambientIntensity

    for (const light of this.lights.values()) {
      const dx = position.x - light.position.x
      const dy = position.y - light.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < light.radius) {
        const falloff =
          light.falloff === 'linear'
            ? 1 - distance / light.radius
            : 1 - (distance / light.radius) ** 2
        totalIntensity += light.intensity * falloff
      }
    }

    return Math.min(1, totalIntensity)
  }

  /**
   * Apply rim lighting to platform edges
   */
  applyRimLighting(
    ctx: CanvasRenderingContext2D,
    platformBounds: Rect,
    edges: EdgeFlags
  ): void {
    if (!this.config.rimLightingEnabled) return

    const intensity = this.getLightIntensityAt({
      x: platformBounds.x + platformBounds.width / 2,
      y: platformBounds.y + platformBounds.height / 2,
    })

    if (intensity < 0.1) return

    ctx.save()
    ctx.strokeStyle = this.config.rimLightColor
    ctx.lineWidth = this.config.rimLightWidth
    ctx.globalAlpha = intensity * 0.4

    // Draw rim on edges facing light sources
    if (edges.top) {
      ctx.beginPath()
      ctx.moveTo(platformBounds.x, platformBounds.y)
      ctx.lineTo(platformBounds.x + platformBounds.width, platformBounds.y)
      ctx.stroke()
    }
    if (edges.bottom) {
      ctx.beginPath()
      ctx.moveTo(platformBounds.x, platformBounds.y + platformBounds.height)
      ctx.lineTo(platformBounds.x + platformBounds.width, platformBounds.y + platformBounds.height)
      ctx.stroke()
    }
    if (edges.left) {
      ctx.beginPath()
      ctx.moveTo(platformBounds.x, platformBounds.y)
      ctx.lineTo(platformBounds.x, platformBounds.y + platformBounds.height)
      ctx.stroke()
    }
    if (edges.right) {
      ctx.beginPath()
      ctx.moveTo(platformBounds.x + platformBounds.width, platformBounds.y)
      ctx.lineTo(platformBounds.x + platformBounds.width, platformBounds.y + platformBounds.height)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Apply underglow effect to player near lava
   */
  applyPlayerUnderglow(
    ctx: CanvasRenderingContext2D,
    playerPosition: Vector2,
    playerRadius: number
  ): void {
    let closestDistance = Infinity
    let closestLight: LightSource | null = null

    for (const light of this.lights.values()) {
      const dx = playerPosition.x - light.position.x
      const dy = playerPosition.y - light.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 100 && distance < closestDistance) {
        closestDistance = distance
        closestLight = light
      }
    }

    if (!closestLight) return

    const intensity = 1 - closestDistance / 100
    const gradient = ctx.createRadialGradient(
      playerPosition.x,
      playerPosition.y + playerRadius * 0.5,
      0,
      playerPosition.x,
      playerPosition.y + playerRadius * 0.5,
      playerRadius * 1.5
    )
    gradient.addColorStop(0, `rgba(255, 102, 0, ${intensity * 0.5})`)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(
      playerPosition.x,
      playerPosition.y + playerRadius * 0.5,
      playerRadius * 1.5,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  /**
   * Apply ambient lighting overlay
   */
  applyAmbientLighting(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = this.config.ambientColor
    ctx.globalAlpha = this.config.ambientIntensity
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.restore()
  }

  /**
   * Get all light sources
   */
  getLights(): LightSource[] {
    return Array.from(this.lights.values())
  }

  /**
   * Check if player is within underglow distance of any light
   */
  isPlayerInUnderglowRange(playerPosition: Vector2): boolean {
    for (const light of this.lights.values()) {
      const dx = playerPosition.x - light.position.x
      const dy = playerPosition.y - light.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < 100) return true
    }
    return false
  }
}
