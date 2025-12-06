/**
 * BuffRenderer - Visual effects for active buffs
 * Renders glow effects, auras, and indicators around players
 */

import { BaseRenderer } from './BaseRenderer'
import type { BuffType, ActiveBuff } from '../combat/BuffManager'
import type { Vector2 } from '../types'

interface PlayerBuffRenderData {
  position: Vector2
  buffs: ActiveBuff[]
  isLocal: boolean
}

// Buff visual config
const BUFF_COLORS: Record<BuffType, { glow: string; particle: string }> = {
  damage_boost: { glow: 'rgba(255, 180, 50, 0.6)', particle: '#ffb432' },
  speed_boost: { glow: 'rgba(50, 180, 255, 0.5)', particle: '#32b4ff' },
  vulnerability: { glow: 'rgba(255, 50, 50, 0.4)', particle: '#ff3232' },
  shield: { glow: 'rgba(100, 200, 255, 0.5)', particle: '#64c8ff' },
  invulnerable: { glow: 'rgba(255, 255, 255, 0.6)', particle: '#ffffff' },
}

export class BuffRenderer extends BaseRenderer {
  private players: PlayerBuffRenderData[] = []
  private animTime = 0

  setPlayers(players: PlayerBuffRenderData[]): void {
    this.players = players
  }

  update(deltaTime: number): void {
    this.animTime += deltaTime
  }

  render(): void {
    if (!this.ctx) return

    for (const player of this.players) {
      this.renderPlayerBuffs(player)
    }
  }

  private renderPlayerBuffs(player: PlayerBuffRenderData): void {
    if (!this.ctx || player.buffs.length === 0) return
    const ctx = this.ctx
    const { position, buffs } = player

    ctx.save()

    // Render each buff effect
    for (const buff of buffs) {
      this.renderBuffEffect(position, buff)
    }

    ctx.restore()
  }

  private renderBuffEffect(position: Vector2, buff: ActiveBuff): void {
    if (!this.ctx) return
    const colors = BUFF_COLORS[buff.type]
    if (!colors) return

    const pulsePhase = (this.animTime * 3) % (Math.PI * 2)
    const pulse = 0.7 + Math.sin(pulsePhase) * 0.3

    switch (buff.type) {
      case 'damage_boost':
        this.renderDamageBoostAura(position, colors, pulse)
        break
      case 'speed_boost':
        this.renderSpeedBoostTrail(position, colors, pulse)
        break
      case 'vulnerability':
        this.renderVulnerabilityWarning(position, colors, pulse)
        break
      case 'shield':
      case 'invulnerable':
        this.renderShieldBubble(position, colors, pulse)
        break
    }
  }

  private renderDamageBoostAura(position: Vector2, colors: { glow: string }, pulse: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const radius = 28 + pulse * 8

    // Outer glow
    const gradient = ctx.createRadialGradient(
      position.x, position.y, radius * 0.5,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, 'rgba(255, 180, 50, 0)')
    gradient.addColorStop(0.5, `rgba(255, 180, 50, ${0.3 * pulse})`)
    gradient.addColorStop(1, 'rgba(255, 180, 50, 0)')

    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Inner ring
    ctx.beginPath()
    ctx.arc(position.x, position.y, 22, 0, Math.PI * 2)
    ctx.strokeStyle = colors.glow
    ctx.lineWidth = 2
    ctx.stroke()
  }

  private renderSpeedBoostTrail(position: Vector2, colors: { glow: string }, pulse: number): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // Speed lines emanating outward
    const lineCount = 6
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 + this.animTime * 2
      const innerR = 20
      const outerR = 30 + pulse * 10

      ctx.beginPath()
      ctx.moveTo(
        position.x + Math.cos(angle) * innerR,
        position.y + Math.sin(angle) * innerR
      )
      ctx.lineTo(
        position.x + Math.cos(angle) * outerR,
        position.y + Math.sin(angle) * outerR
      )
      ctx.strokeStyle = colors.glow
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  private renderVulnerabilityWarning(position: Vector2, colors: { glow: string }, pulse: number): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // Pulsing red outline
    ctx.beginPath()
    ctx.arc(position.x, position.y, 24 + pulse * 4, 0, Math.PI * 2)
    ctx.strokeStyle = colors.glow
    ctx.lineWidth = 3
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  private renderShieldBubble(position: Vector2, colors: { glow: string }, pulse: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const radius = 26 + pulse * 4

    // Shield bubble
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = colors.glow
    ctx.lineWidth = 2
    ctx.stroke()

    // Inner glow
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(100, 200, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fill()
  }
}
