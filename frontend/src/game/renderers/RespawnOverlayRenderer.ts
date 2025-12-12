/**
 * RespawnOverlayRenderer - Shows death/respawn state with countdown
 * 
 * Features:
 * - Full-screen red vignette when dead
 * - "YOU DIED" text with skull icon
 * - Respawn countdown timer
 * - "INVULNERABLE" indicator after respawn
 * - "WEAPON READY" flash when can shoot again
 * 
 * Requirements: Clear visual feedback for death/respawn states
 */

import { BaseRenderer } from './BaseRenderer'
import { ARENA_SIZE } from '../config'

interface RespawnState {
  isDead: boolean
  isRespawning: boolean
  isInvulnerable: boolean
  respawnTimeRemaining: number  // ms
  invulnerabilityRemaining: number  // ms
  canShoot: boolean
}

export class RespawnOverlayRenderer extends BaseRenderer {
  private state: RespawnState = {
    isDead: false,
    isRespawning: false,
    isInvulnerable: false,
    respawnTimeRemaining: 0,
    invulnerabilityRemaining: 0,
    canShoot: true,
  }
  
  private lastCanShoot = true
  private weaponReadyFlashTime = 0
  private readonly WEAPON_READY_FLASH_DURATION = 800  // ms

  setState(state: RespawnState): void {
    // Detect transition from can't shoot to can shoot
    if (!this.lastCanShoot && state.canShoot) {
      this.weaponReadyFlashTime = this.WEAPON_READY_FLASH_DURATION
    }
    this.lastCanShoot = state.canShoot
    this.state = state
  }

  update(deltaTime: number): void {
    if (this.weaponReadyFlashTime > 0) {
      this.weaponReadyFlashTime -= deltaTime * 1000
    }
  }

  render(): void {
    if (!this.ctx) return

    const { isDead, isRespawning, isInvulnerable, respawnTimeRemaining, invulnerabilityRemaining, canShoot } = this.state

    // Death vignette and overlay
    if (isDead || isRespawning) {
      this.renderDeathOverlay(respawnTimeRemaining)
    }

    // Invulnerability indicator (after respawn)
    if (isInvulnerable && !isRespawning) {
      this.renderInvulnerabilityIndicator(invulnerabilityRemaining)
    }

    // Can't shoot indicator
    if (!canShoot && !isDead && !isRespawning) {
      this.renderCantShootIndicator()
    }

    // Weapon ready flash
    if (this.weaponReadyFlashTime > 0) {
      this.renderWeaponReadyFlash()
    }
  }

  private renderDeathOverlay(respawnTimeRemaining: number): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // Red vignette overlay
    const gradient = ctx.createRadialGradient(
      ARENA_SIZE.width / 2, ARENA_SIZE.height / 2, 0,
      ARENA_SIZE.width / 2, ARENA_SIZE.height / 2, ARENA_SIZE.width * 0.7
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.3)')
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.7)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)

    // Pulsing effect
    const pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2

    // "YOU DIED" text
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Skull icon (simple text representation)
    ctx.font = 'bold 48px sans-serif'
    ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 20
    ctx.fillText('💀', ARENA_SIZE.width / 2, ARENA_SIZE.height / 2 - 60)

    // Main text
    ctx.font = 'bold 42px sans-serif'
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 15
    ctx.fillText('YOU DIED', ARENA_SIZE.width / 2, ARENA_SIZE.height / 2)

    // Countdown
    const seconds = Math.ceil(respawnTimeRemaining / 1000)
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = 10
    ctx.fillText(`Respawning in ${seconds}...`, ARENA_SIZE.width / 2, ARENA_SIZE.height / 2 + 50)

    // Progress bar for respawn
    const barWidth = 200
    const barHeight = 8
    const barX = ARENA_SIZE.width / 2 - barWidth / 2
    const barY = ARENA_SIZE.height / 2 + 80

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(barX, barY, barWidth, barHeight)

    // Fill (inverse - fills up as time passes)
    const maxRespawnTime = 3000  // 3 seconds
    const progress = 1 - (respawnTimeRemaining / maxRespawnTime)
    ctx.fillStyle = '#22c55e'  // Green
    ctx.fillRect(barX, barY, barWidth * Math.max(0, Math.min(1, progress)), barHeight)

    ctx.restore()
  }

  private renderInvulnerabilityIndicator(remaining: number): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const pulse = 0.7 + Math.sin(Date.now() / 100) * 0.3
    const seconds = (remaining / 1000).toFixed(1)

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Shield icon and text at top of screen
    ctx.font = 'bold 20px sans-serif'
    ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`
    ctx.shadowColor = '#64c8ff'
    ctx.shadowBlur = 10
    ctx.fillText(`🛡️ INVULNERABLE (${seconds}s)`, ARENA_SIZE.width / 2, 40)

    // Subtle screen border glow
    ctx.strokeStyle = `rgba(100, 200, 255, ${pulse * 0.3})`
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, ARENA_SIZE.width - 4, ARENA_SIZE.height - 4)

    ctx.restore()
  }

  private renderCantShootIndicator(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const pulse = 0.6 + Math.sin(Date.now() / 150) * 0.4

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // "CAN'T SHOOT" indicator at bottom center
    ctx.font = 'bold 18px sans-serif'
    ctx.fillStyle = `rgba(255, 100, 100, ${pulse})`
    ctx.shadowColor = '#ff6464'
    ctx.shadowBlur = 8
    ctx.fillText('⚠️ WEAPON DISABLED', ARENA_SIZE.width / 2, ARENA_SIZE.height - 50)

    ctx.restore()
  }

  private renderWeaponReadyFlash(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const alpha = this.weaponReadyFlashTime / this.WEAPON_READY_FLASH_DURATION

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // "WEAPON READY" flash
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`  // Green
    ctx.shadowColor = '#22c55e'
    ctx.shadowBlur = 15
    ctx.fillText('✓ WEAPON READY', ARENA_SIZE.width / 2, ARENA_SIZE.height - 80)

    ctx.restore()
  }
}
