/**
 * ScreenEffects - Full-screen visual effects
 * Damage vignette, stun flash, correct answer flash, etc.
 * Based on Arena Assets Cheatsheet recommendations
 * 
 * @module terrain/ScreenEffects
 */

// ============================================================================
// Types
// ============================================================================

export type ScreenEffectType = 
  | 'damage_vignette'
  | 'stun_flash'
  | 'correct_answer'
  | 'wrong_answer'
  | 'heal_pulse'
  | 'speed_boost'
  | 'emp_static'

interface ActiveEffect {
  type: ScreenEffectType
  startTime: number
  duration: number
  intensity: number
}

// ============================================================================
// Effect Configurations
// ============================================================================

const EFFECT_CONFIGS: Record<ScreenEffectType, { color: string; defaultDuration: number; defaultIntensity: number }> = {
  damage_vignette: {
    color: 'rgba(255, 0, 0, INTENSITY)',
    defaultDuration: 200,
    defaultIntensity: 0.4,
  },
  stun_flash: {
    color: 'rgba(255, 255, 255, INTENSITY)',
    defaultDuration: 100,
    defaultIntensity: 0.8,
  },
  correct_answer: {
    color: 'rgba(0, 255, 100, INTENSITY)',
    defaultDuration: 300,
    defaultIntensity: 0.3,
  },
  wrong_answer: {
    color: 'rgba(255, 50, 50, INTENSITY)',
    defaultDuration: 300,
    defaultIntensity: 0.3,
  },
  heal_pulse: {
    color: 'rgba(100, 255, 100, INTENSITY)',
    defaultDuration: 400,
    defaultIntensity: 0.25,
  },
  speed_boost: {
    color: 'rgba(100, 200, 255, INTENSITY)',
    defaultDuration: 300,
    defaultIntensity: 0.2,
  },
  emp_static: {
    color: 'rgba(255, 255, 0, INTENSITY)',
    defaultDuration: 500,
    defaultIntensity: 0.15,
  },
}

// ============================================================================
// ScreenEffects Class
// ============================================================================

/**
 * ScreenEffects manages full-screen visual effects
 * Renders as an overlay on top of the game canvas
 */
export class ScreenEffects {
  private ctx: CanvasRenderingContext2D | null = null
  private width: number = 0
  private height: number = 0
  private activeEffects: ActiveEffect[] = []

  /**
   * Initialize with canvas context
   */
  initialize(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.ctx = ctx
    this.width = width
    this.height = height
  }

  /**
   * Trigger a screen effect
   */
  trigger(type: ScreenEffectType, intensity?: number, duration?: number): void {
    const config = EFFECT_CONFIGS[type]
    this.activeEffects.push({
      type,
      startTime: Date.now(),
      duration: duration ?? config.defaultDuration,
      intensity: intensity ?? config.defaultIntensity,
    })
  }

  /**
   * Trigger damage vignette (red edge darkening)
   */
  triggerDamage(intensity: number = 0.4): void {
    this.trigger('damage_vignette', intensity)
  }

  /**
   * Trigger stun flash (white flash)
   */
  triggerStun(intensity: number = 0.8): void {
    this.trigger('stun_flash', intensity)
  }

  /**
   * Trigger correct answer flash (green)
   */
  triggerCorrectAnswer(): void {
    this.trigger('correct_answer')
  }

  /**
   * Trigger wrong answer flash (red)
   */
  triggerWrongAnswer(): void {
    this.trigger('wrong_answer')
  }

  /**
   * Trigger heal pulse (green glow)
   */
  triggerHeal(): void {
    this.trigger('heal_pulse')
  }

  /**
   * Trigger speed boost effect (blue tint)
   */
  triggerSpeedBoost(): void {
    this.trigger('speed_boost')
  }

  /**
   * Trigger EMP static effect (yellow noise)
   */
  triggerEMP(): void {
    this.trigger('emp_static')
  }

  /**
   * Update and clean up expired effects
   */
  update(): void {
    const now = Date.now()
    this.activeEffects = this.activeEffects.filter(
      effect => now - effect.startTime < effect.duration
    )
  }

  /**
   * Render all active screen effects
   */
  render(): void {
    if (!this.ctx || this.activeEffects.length === 0) return

    const now = Date.now()

    for (const effect of this.activeEffects) {
      const progress = (now - effect.startTime) / effect.duration
      const alpha = effect.intensity * (1 - progress) // Fade out

      this.renderEffect(effect.type, alpha)
    }
  }

  /**
   * Render a specific effect type
   */
  private renderEffect(type: ScreenEffectType, alpha: number): void {
    if (!this.ctx) return

    this.ctx.save()

    switch (type) {
      case 'damage_vignette':
        this.renderVignette(`rgba(255, 0, 0, ${alpha})`)
        break

      case 'stun_flash':
        this.renderFlash(`rgba(255, 255, 255, ${alpha})`)
        break

      case 'correct_answer':
        this.renderFlash(`rgba(0, 255, 100, ${alpha})`)
        break

      case 'wrong_answer':
        this.renderFlash(`rgba(255, 50, 50, ${alpha})`)
        break

      case 'heal_pulse':
        this.renderPulse(`rgba(100, 255, 100, ${alpha})`)
        break

      case 'speed_boost':
        this.renderEdgeGlow(`rgba(100, 200, 255, ${alpha})`)
        break

      case 'emp_static':
        this.renderStatic(alpha)
        break
    }

    this.ctx.restore()
  }

  /**
   * Render vignette effect (darkened edges)
   */
  private renderVignette(color: string): void {
    if (!this.ctx) return

    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.8
    )
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, color)

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  /**
   * Render full-screen flash
   */
  private renderFlash(color: string): void {
    if (!this.ctx) return

    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  /**
   * Render pulsing effect from center
   */
  private renderPulse(color: string): void {
    if (!this.ctx) return

    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.height * 0.6
    )
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, '0.1)'))
    gradient.addColorStop(1, 'transparent')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  /**
   * Render edge glow effect
   */
  private renderEdgeGlow(color: string): void {
    if (!this.ctx) return

    // Top edge
    const topGradient = this.ctx.createLinearGradient(0, 0, 0, 60)
    topGradient.addColorStop(0, color)
    topGradient.addColorStop(1, 'transparent')
    this.ctx.fillStyle = topGradient
    this.ctx.fillRect(0, 0, this.width, 60)

    // Bottom edge
    const bottomGradient = this.ctx.createLinearGradient(0, this.height, 0, this.height - 60)
    bottomGradient.addColorStop(0, color)
    bottomGradient.addColorStop(1, 'transparent')
    this.ctx.fillStyle = bottomGradient
    this.ctx.fillRect(0, this.height - 60, this.width, 60)

    // Left edge
    const leftGradient = this.ctx.createLinearGradient(0, 0, 60, 0)
    leftGradient.addColorStop(0, color)
    leftGradient.addColorStop(1, 'transparent')
    this.ctx.fillStyle = leftGradient
    this.ctx.fillRect(0, 0, 60, this.height)

    // Right edge
    const rightGradient = this.ctx.createLinearGradient(this.width, 0, this.width - 60, 0)
    rightGradient.addColorStop(0, color)
    rightGradient.addColorStop(1, 'transparent')
    this.ctx.fillStyle = rightGradient
    this.ctx.fillRect(this.width - 60, 0, 60, this.height)
  }

  /**
   * Render static/noise effect for EMP
   */
  private renderStatic(alpha: number): void {
    if (!this.ctx) return

    // Draw random noise lines
    this.ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`
    this.ctx.lineWidth = 1

    const lineCount = 20
    for (let i = 0; i < lineCount; i++) {
      const y = Math.random() * this.height
      const startX = Math.random() * this.width * 0.3
      const endX = startX + Math.random() * 100 + 50

      this.ctx.beginPath()
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
      this.ctx.stroke()
    }
  }

  /**
   * Check if any effects are active
   */
  hasActiveEffects(): boolean {
    return this.activeEffects.length > 0
  }

  /**
   * Clear all active effects
   */
  clear(): void {
    this.activeEffects = []
  }
}

// Singleton instance for easy access
export const screenEffects = new ScreenEffects()
