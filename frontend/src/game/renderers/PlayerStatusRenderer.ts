/**
 * PlayerStatusRenderer - Visual feedback for player status effects and cooldowns
 * 
 * Renders:
 * - Weapon cooldown arc around player
 * - Status effect indicators (slow, EMP, damage)
 * - Invulnerability glow
 */

import { BaseRenderer } from './BaseRenderer'
import { COLORS } from '../config/colors'

export interface PlayerStatus {
  // Weapon cooldown (0 = just fired, 1 = ready)
  cooldownProgress: number
  // Status effects
  isSlowed: boolean
  isEMPed: boolean
  isInDamageZone: boolean
  isInvulnerable: boolean
  // Recently took damage
  recentlyDamaged: boolean
}

export class PlayerStatusRenderer extends BaseRenderer {
  private playerPosition: { x: number; y: number } | null = null
  private status: PlayerStatus = {
    cooldownProgress: 1,
    isSlowed: false,
    isEMPed: false,
    isInDamageZone: false,
    isInvulnerable: false,
    recentlyDamaged: false,
  }

  setPlayerPosition(position: { x: number; y: number } | null): void {
    this.playerPosition = position
  }

  setStatus(status: Partial<PlayerStatus>): void {
    this.status = { ...this.status, ...status }
  }

  setAnimationTime(time: number): void {
    // animationTime is inherited from BaseRenderer, but we allow explicit setting
    // for cases where we need to override the context's animation time
    this.animationTime = time
  }

  render(): void {
    if (!this.ctx || !this.playerPosition) return

    const { x, y } = this.playerPosition
    const playerRadius = 15

    // Render cooldown arc (only when on cooldown)
    if (this.status.cooldownProgress < 1) {
      this.renderCooldownArc(x, y, playerRadius)
    }

    // Render status effect indicators
    if (this.status.isSlowed) {
      this.renderSlowEffect(x, y, playerRadius)
    }

    if (this.status.isEMPed) {
      this.renderEMPEffect(x, y, playerRadius)
    }

    if (this.status.isInDamageZone) {
      this.renderDamageZoneEffect(x, y, playerRadius)
    }

    if (this.status.isInvulnerable) {
      this.renderInvulnerabilityEffect(x, y, playerRadius)
    }
  }

  /**
   * Render weapon cooldown arc around player
   */
  private renderCooldownArc(x: number, y: number, radius: number): void {
    if (!this.ctx) return

    const arcRadius = radius + 8
    const progress = this.status.cooldownProgress
    const startAngle = -Math.PI / 2 // Start from top
    const endAngle = startAngle + (Math.PI * 2 * progress)

    // Background arc (dark)
    this.ctx.beginPath()
    this.ctx.arc(x, y, arcRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.lineWidth = 3
    this.ctx.stroke()

    // Progress arc (bright)
    if (progress > 0) {
      this.ctx.beginPath()
      this.ctx.arc(x, y, arcRadius, startAngle, endAngle)
      
      // Color based on progress - red when empty, green when ready
      const r = Math.floor(255 * (1 - progress))
      const g = Math.floor(255 * progress)
      this.ctx.strokeStyle = `rgba(${r}, ${g}, 100, 0.8)`
      this.ctx.lineWidth = 3
      this.ctx.lineCap = 'round'
      this.ctx.stroke()
    }

    // Glow effect when almost ready
    if (progress > 0.8) {
      this.ctx.save()
      this.ctx.shadowColor = COLORS.projectile
      this.ctx.shadowBlur = 8 * progress
      this.ctx.beginPath()
      this.ctx.arc(x, y, arcRadius, startAngle, endAngle)
      this.ctx.strokeStyle = `rgba(100, 255, 100, ${progress * 0.5})`
      this.ctx.lineWidth = 2
      this.ctx.stroke()
      this.ctx.restore()
    }
  }

  /**
   * Render slow effect - blue swirling particles
   */
  private renderSlowEffect(x: number, y: number, radius: number): void {
    if (!this.ctx) return

    const effectRadius = radius + 12
    const numParticles = 6
    const rotationSpeed = 2

    this.ctx.save()
    this.ctx.shadowColor = '#4fc3f7'
    this.ctx.shadowBlur = 10

    for (let i = 0; i < numParticles; i++) {
      const angle = (this.animationTime * rotationSpeed) + (i * Math.PI * 2 / numParticles)
      const px = x + Math.cos(angle) * effectRadius
      const py = y + Math.sin(angle) * effectRadius
      const alpha = 0.5 + Math.sin(this.animationTime * 3 + i) * 0.3

      this.ctx.beginPath()
      this.ctx.arc(px, py, 3, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(79, 195, 247, ${alpha})`
      this.ctx.fill()
    }

    // Slow icon indicator
    this.ctx.fillStyle = 'rgba(79, 195, 247, 0.9)'
    this.ctx.font = 'bold 10px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('❄', x, y - radius - 18)

    this.ctx.restore()
  }

  /**
   * Render EMP effect - purple electric sparks
   */
  private renderEMPEffect(x: number, y: number, radius: number): void {
    if (!this.ctx) return

    const effectRadius = radius + 10

    this.ctx.save()
    this.ctx.shadowColor = '#9c27b0'
    this.ctx.shadowBlur = 12

    // Electric arc effect
    const numArcs = 4
    for (let i = 0; i < numArcs; i++) {
      const baseAngle = (this.animationTime * 3) + (i * Math.PI * 2 / numArcs)
      const jitter = Math.sin(this.animationTime * 10 + i * 2) * 0.3

      this.ctx.beginPath()
      this.ctx.moveTo(
        x + Math.cos(baseAngle) * radius,
        y + Math.sin(baseAngle) * radius
      )
      this.ctx.lineTo(
        x + Math.cos(baseAngle + jitter) * effectRadius,
        y + Math.sin(baseAngle + jitter) * effectRadius
      )
      this.ctx.strokeStyle = `rgba(156, 39, 176, ${0.6 + Math.random() * 0.4})`
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }

    // EMP icon indicator
    this.ctx.fillStyle = 'rgba(156, 39, 176, 0.9)'
    this.ctx.font = 'bold 10px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('⚡', x, y - radius - 18)

    this.ctx.restore()
  }

  /**
   * Render damage zone effect - red pulsing ring
   */
  private renderDamageZoneEffect(x: number, y: number, radius: number): void {
    if (!this.ctx) return

    const pulse = Math.sin(this.animationTime * 6) * 0.3 + 0.7
    const effectRadius = radius + 6 + pulse * 4

    this.ctx.save()
    this.ctx.shadowColor = '#f44336'
    this.ctx.shadowBlur = 15 * pulse

    // Pulsing danger ring
    this.ctx.beginPath()
    this.ctx.arc(x, y, effectRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = `rgba(244, 67, 54, ${pulse * 0.6})`
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    // Damage icon indicator
    this.ctx.fillStyle = 'rgba(244, 67, 54, 0.9)'
    this.ctx.font = 'bold 10px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🔥', x, y - radius - 18)

    this.ctx.restore()
  }

  /**
   * Render invulnerability effect - golden shield glow
   */
  private renderInvulnerabilityEffect(x: number, y: number, radius: number): void {
    if (!this.ctx) return

    const pulse = Math.sin(this.animationTime * 4) * 0.2 + 0.8
    const effectRadius = radius + 4

    this.ctx.save()
    this.ctx.shadowColor = '#ffd700'
    this.ctx.shadowBlur = 20 * pulse

    // Golden shield ring
    this.ctx.beginPath()
    this.ctx.arc(x, y, effectRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = `rgba(255, 215, 0, ${pulse * 0.7})`
    this.ctx.lineWidth = 3
    this.ctx.stroke()

    // Inner glow
    this.ctx.beginPath()
    this.ctx.arc(x, y, effectRadius - 2, 0, Math.PI * 2)
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.4})`
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    this.ctx.restore()
  }
}
