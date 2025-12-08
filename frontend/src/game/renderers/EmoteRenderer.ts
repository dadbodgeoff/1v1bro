/**
 * EmoteRenderer - Renders active emotes above player positions
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { BaseRenderer } from './BaseRenderer'
import { EMOTE_CONFIG } from '../config/emotes'
import type { ActiveEmote, EmoteAsset } from '../emotes/types'

export class EmoteRenderer extends BaseRenderer {
  private emotes: ActiveEmote[] = []
  private assets: Map<string, EmoteAsset> = new Map()
  private fallbackCanvas: HTMLCanvasElement | null = null

  constructor() {
    super()
    this.createFallbackIcon()
  }

  /**
   * Create a fallback icon for failed emote loads
   */
  private createFallbackIcon(): void {
    // Create a simple fallback icon using canvas
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Draw a simple question mark icon
      ctx.fillStyle = '#333333'
      ctx.beginPath()
      ctx.arc(24, 24, 22, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', 24, 24)
      
      this.fallbackCanvas = canvas
    }
  }

  /**
   * Set emotes to render
   * Requirements: 4.1
   */
  setEmotes(emotes: ActiveEmote[]): void {
    this.emotes = emotes
  }

  /**
   * Set asset map for image lookup
   */
  setAssets(assets: Map<string, EmoteAsset>): void {
    this.assets = assets
  }

  /**
   * Render all active emotes
   * Requirements: 4.5
   */
  render(): void {
    if (!this.ctx) return

    for (const emote of this.emotes) {
      this.renderEmote(emote)
    }
  }

  /**
   * Render a single emote
   * Requirements: 4.2, 4.3, 4.4, 4.7
   */
  private renderEmote(emote: ActiveEmote): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const asset = this.assets.get(emote.emoteId)
    const image = asset?.image
    
    // Calculate size with scale animation (Requirement 4.3)
    const size = EMOTE_CONFIG.size * emote.scale
    
    // Position centered above player (Requirement 4.2)
    const x = emote.position.x - size / 2
    const y = emote.position.y - size / 2

    ctx.save()

    // Apply opacity for fade-out (Requirement 4.4)
    ctx.globalAlpha = emote.opacity

    // Add subtle glow effect during pop-in and display phases
    if (emote.phase === 'pop-in' || emote.phase === 'display') {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'
      ctx.shadowBlur = 12
    }

    // Draw emote image or fallback (Requirement 4.7 - consistent size)
    if (image) {
      ctx.drawImage(image, x, y, size, size)
    } else if (this.fallbackCanvas) {
      ctx.drawImage(this.fallbackCanvas, x, y, size, size)
    } else {
      // Ultimate fallback - draw a circle
      this.drawFallbackCircle(emote.position.x, emote.position.y, size / 2)
    }

    ctx.restore()
  }

  /**
   * Draw a simple fallback circle if no image available
   */
  private drawFallbackCircle(x: number, y: number, radius: number): void {
    if (!this.ctx) return
    
    this.drawCircle(x, y, radius, '#666666', {
      strokeColor: '#ffffff',
      strokeWidth: 2,
      glowColor: '#ffffff',
      glowBlur: 8,
    })
  }
}
