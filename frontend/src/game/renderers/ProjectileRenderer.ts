/**
 * Projectile Renderer - AAA Enterprise Grade
 * Renders projectiles with glowing trails and interpolation support
 *
 * Features:
 * - Smooth interpolation between physics ticks
 * - Trail rendering with fade
 * - Glow effects
 */

import { BaseRenderer } from './BaseRenderer'
import { PROJECTILE_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import type { Projectile } from '../types'
import type { InterpolatedProjectile } from '../combat'

interface TrailPoint {
  x: number
  y: number
  alpha: number
}

export class ProjectileRenderer extends BaseRenderer {
  private projectiles: Projectile[] = []
  private trails: Map<string, TrailPoint[]> = new Map()
  private interpolationAlpha = 1.0 // For smooth rendering between physics ticks

  setProjectiles(projectiles: Projectile[]): void {
    this.projectiles = projectiles
  }

  /**
   * Set interpolation alpha for smooth rendering
   * @param alpha - Value between 0-1, where 1 = current position, 0 = previous position
   */
  setInterpolationAlpha(alpha: number): void {
    this.interpolationAlpha = Math.max(0, Math.min(1, alpha))
  }

  /**
   * Get interpolated position for a projectile
   */
  private getInterpolatedPosition(projectile: Projectile): { x: number; y: number } {
    // Check if projectile has interpolation data
    const interpolated = projectile as InterpolatedProjectile
    if (interpolated.prevPosition && this.interpolationAlpha < 1) {
      return {
        x:
          interpolated.prevPosition.x +
          (projectile.position.x - interpolated.prevPosition.x) * this.interpolationAlpha,
        y:
          interpolated.prevPosition.y +
          (projectile.position.y - interpolated.prevPosition.y) * this.interpolationAlpha,
      }
    }
    return { x: projectile.position.x, y: projectile.position.y }
  }

  /**
   * Update trails - call each frame before render
   * Uses interpolated positions for smoother trails
   */
  updateTrails(): void {
    // Update existing trails
    for (const projectile of this.projectiles) {
      let trail = this.trails.get(projectile.id)
      if (!trail) {
        trail = []
        this.trails.set(projectile.id, trail)
      }

      // Add interpolated position to trail for smoother visuals
      const pos = this.getInterpolatedPosition(projectile)
      trail.unshift({
        x: pos.x,
        y: pos.y,
        alpha: 1,
      })

      // Fade trail points
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].alpha -= PROJECTILE_CONFIG.trailFadeSpeed
        if (trail[i].alpha <= 0) {
          trail.splice(i, 1)
        }
      }

      // Limit trail length
      if (trail.length > PROJECTILE_CONFIG.trailLength) {
        trail.length = PROJECTILE_CONFIG.trailLength
      }
    }


    // Clean up trails for destroyed projectiles
    const activeIds = new Set(this.projectiles.map((p) => p.id))
    for (const id of this.trails.keys()) {
      if (!activeIds.has(id)) {
        this.trails.delete(id)
      }
    }
  }

  render(): void {
    if (!this.ctx) return

    // Render trails first (behind projectiles)
    for (const trail of this.trails.values()) {
      this.renderTrail(trail)
    }

    // Render projectiles
    for (const projectile of this.projectiles) {
      this.renderProjectile(projectile)
    }
  }

  private renderTrail(trail: TrailPoint[]): void {
    if (!this.ctx || trail.length < 2) return

    for (let i = 1; i < trail.length; i++) {
      const point = trail[i]
      const size = 2 * (1 - i / trail.length) // Smaller towards end

      this.drawCircle(point.x, point.y, size, COLORS.projectile, {
        alpha: point.alpha * 0.5,
        glowColor: COLORS.projectile,
        glowBlur: 4,
      })
    }
  }

  private renderProjectile(projectile: Projectile): void {
    if (!this.ctx) return

    // Use interpolated position for smooth rendering
    const pos = this.getInterpolatedPosition(projectile)

    // Outer glow
    this.drawCircle(pos.x, pos.y, PROJECTILE_CONFIG.hitboxRadius + 6, COLORS.projectile, {
      alpha: 0.2,
      glowColor: COLORS.projectile,
      glowBlur: 16,
    })

    // Inner glow
    this.drawCircle(pos.x, pos.y, PROJECTILE_CONFIG.hitboxRadius + 2, COLORS.projectile, {
      alpha: 0.5,
      glowColor: COLORS.projectile,
      glowBlur: 8,
    })

    // Core (bright white center)
    this.drawCircle(pos.x, pos.y, PROJECTILE_CONFIG.hitboxRadius, COLORS.white, {
      glowColor: COLORS.projectile,
      glowBlur: 4,
    })
  }

  /**
   * Clear all trails
   */
  clearTrails(): void {
    this.trails.clear()
  }
}
