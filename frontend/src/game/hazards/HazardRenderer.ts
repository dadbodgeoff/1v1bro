/**
 * HazardRenderer - Renders hazard zones with theme-specific visuals
 * 
 * @module hazards/HazardRenderer
 */

import type { HazardState } from '../arena/types'
import type { MapTheme } from '../config/maps/map-schema'
import { arenaAssets } from '../assets/ArenaAssetLoader'
import { animatedTileRenderer } from '../terrain/AnimatedTiles'
import { VOLCANIC_COLORS } from '../backdrop/types'

export class HazardRenderer {
  private theme: MapTheme = 'space'

  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  /**
   * Render all hazard zones
   */
  render(ctx: CanvasRenderingContext2D, hazards: HazardState[]): void {
    for (const hazard of hazards) {
      if (!hazard.isActive) continue
      this.renderHazard(ctx, hazard)
    }
  }

  private renderHazard(ctx: CanvasRenderingContext2D, hazard: HazardState): void {
    const { bounds, type } = hazard
    const time = Date.now() / 1000

    ctx.save()

    switch (type) {
      case 'damage':
        this.renderDamageZone(ctx, bounds, time)
        break
      case 'slow':
        this.renderSlowField(ctx, bounds, time)
        break
      case 'emp':
        this.renderEMPZone(ctx, bounds, time)
        break
    }

    ctx.restore()
  }

  private renderDamageZone(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    if (this.theme === 'volcanic') {
      this.renderVolcanicDamageZone(ctx, bounds)
      return
    }

    // Reduced pulse intensity for cleaner look
    const pulse = 0.6 + 0.15 * Math.sin(time * 2.5)
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    
    // Subtle gradient fill (reduced opacity)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bounds.width / 2)
    gradient.addColorStop(0, `rgba(200, 50, 50, ${0.2 * pulse})`)
    gradient.addColorStop(1, `rgba(150, 30, 30, ${0.1 * pulse})`)
    
    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Simplified danger stripes (fewer, more subtle)
    ctx.save()
    ctx.beginPath()
    ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.clip()
    
    ctx.strokeStyle = `rgba(200, 80, 40, ${0.15 + pulse * 0.1})`
    ctx.lineWidth = 4
    const stripeSpacing = 30 // Wider spacing
    const offset = (time * 15) % stripeSpacing // Slower animation
    
    for (let i = -bounds.height; i < bounds.width + bounds.height; i += stripeSpacing) {
      ctx.beginPath()
      ctx.moveTo(bounds.x + i + offset, bounds.y)
      ctx.lineTo(bounds.x + i + offset - bounds.height, bounds.y + bounds.height)
      ctx.stroke()
    }
    ctx.restore()

    // Draw skull icon in center (reduced opacity)
    const iconSize = Math.min(bounds.width, bounds.height) * 0.5
    ctx.globalAlpha = 0.5 + pulse * 0.2
    arenaAssets.drawCentered(ctx, 'damage-zone', centerX, centerY, iconSize, iconSize)
    ctx.globalAlpha = 1

    // Cleaner border (solid, subtle)
    ctx.strokeStyle = 'rgba(200, 60, 60, 0.6)'
    ctx.lineWidth = 2
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private renderVolcanicDamageZone(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }): void {
    const tileSize = 40
    
    for (let x = bounds.x; x < bounds.x + bounds.width; x += tileSize) {
      for (let y = bounds.y; y < bounds.y + bounds.height; y += tileSize) {
        const w = Math.min(tileSize, bounds.x + bounds.width - x)
        const h = Math.min(tileSize, bounds.y + bounds.height - y)
        animatedTileRenderer.render(ctx, 'lava', x, y, Math.min(w, h))
      }
    }

    ctx.save()
    ctx.shadowColor = VOLCANIC_COLORS.lavaGlow
    ctx.shadowBlur = 15
    ctx.strokeStyle = VOLCANIC_COLORS.lavaCore
    ctx.lineWidth = 2
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.restore()
  }

  private renderSlowField(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    if (this.theme === 'volcanic') {
      this.renderVolcanicSteamVent(ctx, bounds, time)
      return
    }

    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const pulse = 0.8 + 0.15 * Math.sin(time * 1.5) // Reduced pulse
    
    // More subtle gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bounds.width / 2)
    gradient.addColorStop(0, 'rgba(80, 160, 220, 0.12)')
    gradient.addColorStop(0.5, 'rgba(50, 130, 200, 0.08)')
    gradient.addColorStop(1, 'rgba(30, 80, 150, 0.04)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Smaller, more subtle icon
    const iconSize = Math.min(bounds.width, bounds.height) * 0.5
    ctx.globalAlpha = 0.5 + pulse * 0.2
    arenaAssets.drawCentered(ctx, 'slow-field', centerX, centerY, iconSize, iconSize)
    ctx.globalAlpha = 1
    
    // Subtle border
    ctx.strokeStyle = 'rgba(80, 160, 220, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private renderVolcanicSteamVent(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const pulse = 0.6 + 0.4 * Math.sin(time * 3)

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bounds.width / 2)
    gradient.addColorStop(0, `rgba(136, 136, 136, ${0.3 * pulse})`)
    gradient.addColorStop(0.5, `rgba(74, 74, 74, ${0.2 * pulse})`)
    gradient.addColorStop(1, 'rgba(74, 74, 74, 0.05)')

    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Animated steam particles
    ctx.save()
    ctx.beginPath()
    ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.clip()

    const particleCount = 8
    for (let i = 0; i < particleCount; i++) {
      const px = bounds.x + (i / particleCount) * bounds.width + bounds.width / (particleCount * 2)
      const pyOffset = ((time * 40 + i * 30) % bounds.height)
      const py = bounds.y + bounds.height - pyOffset
      const size = 10 + Math.sin(time * 2 + i) * 5

      ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * (1 - pyOffset / bounds.height)})`
      ctx.beginPath()
      ctx.arc(px + Math.sin(time + i) * 5, py, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    ctx.strokeStyle = `rgba(136, 136, 136, ${0.3 * pulse})`
    ctx.lineWidth = 1
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private renderEMPZone(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    if (this.theme === 'volcanic') {
      this.renderVolcanicEMPZone(ctx, bounds)
      return
    }

    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const pulse = 0.8 + 0.15 * Math.sin(time * 2) // Reduced pulse
    
    // More subtle gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bounds.width / 2)
    gradient.addColorStop(0, 'rgba(220, 200, 80, 0.12)')
    gradient.addColorStop(0.5, 'rgba(200, 180, 50, 0.08)')
    gradient.addColorStop(1, 'rgba(160, 140, 30, 0.04)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Smaller, more subtle icon
    const iconSize = Math.min(bounds.width, bounds.height) * 0.5
    ctx.globalAlpha = 0.5 + pulse * 0.2
    arenaAssets.drawCentered(ctx, 'emp-zone', centerX, centerY, iconSize, iconSize)
    ctx.globalAlpha = 1
    
    // Subtle border
    ctx.strokeStyle = 'rgba(200, 180, 60, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private renderVolcanicEMPZone(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }): void {
    const tileSize = 40
    
    for (let x = bounds.x; x < bounds.x + bounds.width; x += tileSize) {
      for (let y = bounds.y; y < bounds.y + bounds.height; y += tileSize) {
        const w = Math.min(tileSize, bounds.x + bounds.width - x)
        const h = Math.min(tileSize, bounds.y + bounds.height - y)
        animatedTileRenderer.render(ctx, 'electric', x, y, Math.min(w, h))
      }
    }

    ctx.fillStyle = 'rgba(255, 68, 0, 0.1)'
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}
