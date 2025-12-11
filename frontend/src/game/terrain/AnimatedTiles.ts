/**
 * AnimatedTiles - Frame-based tile animations
 * Water, lava, fire, electricity with sprite-like animation
 * 
 * @module terrain/AnimatedTiles
 */

// ============================================================================
// Types
// ============================================================================

export type AnimatedTileType = 'water' | 'lava' | 'fire' | 'electric' | 'portal'

export interface AnimationConfig {
  frames: number
  frameDuration: number  // ms per frame
  colors: string[]       // Color per frame for procedural animation
  glowColor: string
  glowIntensity: number
}

// ============================================================================
// Animation Configs
// ============================================================================

export const TILE_ANIMATIONS: Record<AnimatedTileType, AnimationConfig> = {
  water: {
    frames: 4,
    frameDuration: 200,
    colors: ['#1a3366', '#1f3d77', '#244788', '#1f3d77'],
    glowColor: '#3366aa',
    glowIntensity: 0.15,
  },
  lava: {
    frames: 4,
    frameDuration: 200,
    colors: ['#8b2500', '#a63000', '#c23800', '#a63000'],
    glowColor: '#ff4400',
    glowIntensity: 0.25,
  },
  fire: {
    frames: 6,
    frameDuration: 120,
    colors: ['#8b2500', '#a63000', '#c24400', '#b33800', '#9c2d00', '#8b2500'],
    glowColor: '#cc4400',
    glowIntensity: 0.2,
  },
  electric: {
    frames: 3,
    frameDuration: 100,
    colors: ['#cccc00', '#dddd44', '#aacc88'],
    glowColor: '#cccc44',
    glowIntensity: 0.3,
  },
  portal: {
    frames: 8,
    frameDuration: 120,
    colors: ['#5533aa', '#6644bb', '#7755cc', '#6644bb', '#5533aa', '#4422aa', '#330099', '#4422aa'],
    glowColor: '#7755cc',
    glowIntensity: 0.25,
  },
}


// ============================================================================
// AnimatedTileRenderer Class
// ============================================================================

/**
 * Renders animated tiles with frame-based color cycling and effects
 */
export class AnimatedTileRenderer {
  private time = 0

  /**
   * Update animation time
   */
  update(deltaTime: number): void {
    this.time += deltaTime * 1000 // Convert to ms
  }

  /**
   * Get current frame index for an animation type
   */
  getFrame(type: AnimatedTileType): number {
    const config = TILE_ANIMATIONS[type]
    const totalDuration = config.frames * config.frameDuration
    const elapsed = this.time % totalDuration
    return Math.floor(elapsed / config.frameDuration)
  }

  /**
   * Get current color for an animation type
   */
  getColor(type: AnimatedTileType): string {
    const config = TILE_ANIMATIONS[type]
    const frame = this.getFrame(type)
    return config.colors[frame]
  }

  /**
   * Render an animated tile at position
   */
  render(
    ctx: CanvasRenderingContext2D,
    type: AnimatedTileType,
    x: number,
    y: number,
    size: number
  ): void {
    const config = TILE_ANIMATIONS[type]
    const color = this.getColor(type)
    const frame = this.getFrame(type)

    ctx.save()

    // Base tile color
    ctx.fillStyle = color
    ctx.fillRect(x, y, size, size)

    // Add animated effects based on type
    switch (type) {
      case 'water':
        this.renderWaterEffect(ctx, x, y, size, frame)
        break
      case 'lava':
        this.renderLavaEffect(ctx, x, y, size, frame, config)
        break
      case 'fire':
        this.renderFireEffect(ctx, x, y, size, frame)
        break
      case 'electric':
        this.renderElectricEffect(ctx, x, y, size, frame)
        break
      case 'portal':
        this.renderPortalEffect(ctx, x, y, size, frame, config)
        break
    }

    // Glow overlay
    ctx.globalAlpha = config.glowIntensity * (0.8 + Math.sin(this.time / 200) * 0.2)
    const gradient = ctx.createRadialGradient(
      x + size / 2, y + size / 2, 0,
      x + size / 2, y + size / 2, size * 0.7
    )
    gradient.addColorStop(0, config.glowColor)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, size, size)

    ctx.restore()
  }


  /**
   * Water ripple effect
   */
  private renderWaterEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    frame: number
  ): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1

    // Animated ripple lines
    const offset = (frame / 4) * size
    for (let i = 0; i < 3; i++) {
      const lineY = y + ((offset + i * (size / 3)) % size)
      ctx.beginPath()
      ctx.moveTo(x, lineY)
      ctx.bezierCurveTo(
        x + size * 0.25, lineY - 3,
        x + size * 0.75, lineY + 3,
        x + size, lineY
      )
      ctx.stroke()
    }
  }

  /**
   * Lava bubble effect
   */
  private renderLavaEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    frame: number,
    config: AnimationConfig
  ): void {
    // Bubbles
    ctx.fillStyle = 'rgba(255, 200, 0, 0.6)'
    const bubbleCount = 3
    for (let i = 0; i < bubbleCount; i++) {
      const bx = x + ((i * 27 + frame * 10) % size)
      const by = y + size - ((frame * 8 + i * 20) % size)
      const br = 3 + (i % 2) * 2
      ctx.beginPath()
      ctx.arc(bx, by, br, 0, Math.PI * 2)
      ctx.fill()
    }

    // Hot cracks
    ctx.strokeStyle = config.colors[(frame + 2) % config.frames]
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + size * 0.2, y + size * 0.3)
    ctx.lineTo(x + size * 0.5, y + size * 0.5)
    ctx.lineTo(x + size * 0.8, y + size * 0.4)
    ctx.stroke()
  }

  /**
   * Fire flicker effect
   */
  private renderFireEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    frame: number
  ): void {
    // Flame tongues
    const flameCount = 4
    for (let i = 0; i < flameCount; i++) {
      const fx = x + (i + 0.5) * (size / flameCount)
      const fh = (size * 0.3) + Math.sin((frame + i) * 0.8) * (size * 0.2)
      const fy = y + size - fh

      ctx.fillStyle = `rgba(255, ${150 + i * 20}, 0, ${0.6 - i * 0.1})`
      ctx.beginPath()
      ctx.moveTo(fx - 6, y + size)
      ctx.quadraticCurveTo(fx, fy, fx + 6, y + size)
      ctx.fill()
    }
  }

  /**
   * Electric arc effect
   */
  private renderElectricEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    frame: number
  ): void {
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)'
    ctx.lineWidth = 2

    // Random-ish lightning bolts
    const seed = frame * 17
    ctx.beginPath()
    ctx.moveTo(x + (seed % size), y)
    for (let i = 1; i <= 3; i++) {
      const px = x + ((seed * i * 7) % size)
      const py = y + (i / 3) * size
      ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  /**
   * Portal swirl effect
   */
  private renderPortalEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    frame: number,
    config: AnimationConfig
  ): void {
    const cx = x + size / 2
    const cy = y + size / 2
    const rotation = (this.time / 500) % (Math.PI * 2)

    // Swirl rings
    for (let i = 0; i < 3; i++) {
      const radius = (size * 0.15) + i * (size * 0.12)
      ctx.strokeStyle = config.colors[(frame + i) % config.frames]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, rotation + i, rotation + i + Math.PI * 1.5)
      ctx.stroke()
    }
  }
}

// Singleton instance
export const animatedTileRenderer = new AnimatedTileRenderer()
