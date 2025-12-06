/**
 * Combat Effects Renderer
 * Renders hit markers, damage numbers, muzzle flash, and death effects
 */

import { BaseRenderer } from './BaseRenderer'
import { COLORS } from '../config/colors'
import type { Vector2 } from '../types'

// Effect types
interface HitMarker {
  id: string
  position: Vector2
  startTime: number
  duration: number
}

interface DamageNumber {
  id: string
  position: Vector2
  damage: number
  startTime: number
  duration: number
  velocity: Vector2
}

interface MuzzleFlash {
  id: string
  position: Vector2
  direction: Vector2
  startTime: number
  duration: number
}

interface DeathEffect {
  id: string
  position: Vector2
  startTime: number
  duration: number
  particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    alpha: number
    size: number
  }>
}

interface PlayerFlash {
  playerId: string
  startTime: number
  duration: number
}

interface RespawnEffect {
  id: string
  position: Vector2
  startTime: number
  duration: number
}

// Effect durations (ms)
const HIT_MARKER_DURATION = 200
const DAMAGE_NUMBER_DURATION = 800
const MUZZLE_FLASH_DURATION = 50
const DEATH_EFFECT_DURATION = 500
const PLAYER_FLASH_DURATION = 100
const RESPAWN_EFFECT_DURATION = 500

export class CombatEffectsRenderer extends BaseRenderer {
  private hitMarkers: Map<string, HitMarker> = new Map()
  private damageNumbers: Map<string, DamageNumber> = new Map()
  private muzzleFlashes: Map<string, MuzzleFlash> = new Map()
  private deathEffects: Map<string, DeathEffect> = new Map()
  private playerFlashes: Map<string, PlayerFlash> = new Map()
  private respawnEffects: Map<string, RespawnEffect> = new Map()

  private nextId = 0

  /**
   * Add a hit marker at impact point
   */
  addHitMarker(position: Vector2): void {
    const id = `hit_${this.nextId++}`
    this.hitMarkers.set(id, {
      id,
      position: { ...position },
      startTime: Date.now(),
      duration: HIT_MARKER_DURATION,
    })
  }

  /**
   * Add floating damage number
   */
  addDamageNumber(position: Vector2, damage: number): void {
    const id = `dmg_${this.nextId++}`
    this.damageNumbers.set(id, {
      id,
      position: { ...position },
      damage,
      startTime: Date.now(),
      duration: DAMAGE_NUMBER_DURATION,
      velocity: {
        x: (Math.random() - 0.5) * 30,
        y: -60, // Float upward
      },
    })
  }


  /**
   * Add muzzle flash at projectile spawn point
   */
  addMuzzleFlash(position: Vector2, direction: Vector2): void {
    const id = `muzzle_${this.nextId++}`
    this.muzzleFlashes.set(id, {
      id,
      position: { ...position },
      direction: { ...direction },
      startTime: Date.now(),
      duration: MUZZLE_FLASH_DURATION,
    })
  }

  /**
   * Add death explosion effect
   */
  addDeathEffect(position: Vector2): void {
    const id = `death_${this.nextId++}`
    const particles: DeathEffect['particles'] = []

    // Create explosion particles
    const particleCount = 12
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = 80 + Math.random() * 60
      particles.push({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 4 + Math.random() * 4,
      })
    }

    this.deathEffects.set(id, {
      id,
      position: { ...position },
      startTime: Date.now(),
      duration: DEATH_EFFECT_DURATION,
      particles,
    })
  }

  /**
   * Add player damage flash (red tint)
   */
  addPlayerFlash(playerId: string): void {
    this.playerFlashes.set(playerId, {
      playerId,
      startTime: Date.now(),
      duration: PLAYER_FLASH_DURATION,
    })
  }

  /**
   * Add respawn spawn-in effect
   */
  addRespawnEffect(position: Vector2): void {
    const id = `respawn_${this.nextId++}`
    this.respawnEffects.set(id, {
      id,
      position: { ...position },
      startTime: Date.now(),
      duration: RESPAWN_EFFECT_DURATION,
    })
  }

  /**
   * Check if player should show damage flash
   */
  isPlayerFlashing(playerId: string): boolean {
    const flash = this.playerFlashes.get(playerId)
    if (!flash) return false
    return Date.now() - flash.startTime < flash.duration
  }

  /**
   * Update and clean up expired effects
   */
  update(deltaTime: number): void {
    const now = Date.now()

    // Clean up expired hit markers
    for (const [id, marker] of this.hitMarkers) {
      if (now - marker.startTime >= marker.duration) {
        this.hitMarkers.delete(id)
      }
    }

    // Update and clean up damage numbers
    for (const [id, dmg] of this.damageNumbers) {
      if (now - dmg.startTime >= dmg.duration) {
        this.damageNumbers.delete(id)
      } else {
        // Update position
        dmg.position.x += dmg.velocity.x * deltaTime
        dmg.position.y += dmg.velocity.y * deltaTime
        // Slow down horizontal movement
        dmg.velocity.x *= 0.95
      }
    }

    // Clean up expired muzzle flashes
    for (const [id, flash] of this.muzzleFlashes) {
      if (now - flash.startTime >= flash.duration) {
        this.muzzleFlashes.delete(id)
      }
    }

    // Update and clean up death effects
    for (const [id, effect] of this.deathEffects) {
      if (now - effect.startTime >= effect.duration) {
        this.deathEffects.delete(id)
      } else {
        // Update particles
        for (const particle of effect.particles) {
          particle.x += particle.vx * deltaTime
          particle.y += particle.vy * deltaTime
          particle.vx *= 0.92
          particle.vy *= 0.92
          particle.alpha -= deltaTime * 2
        }
      }
    }

    // Clean up expired player flashes
    for (const [id, flash] of this.playerFlashes) {
      if (now - flash.startTime >= flash.duration) {
        this.playerFlashes.delete(id)
      }
    }

    // Clean up expired respawn effects
    for (const [id, effect] of this.respawnEffects) {
      if (now - effect.startTime >= effect.duration) {
        this.respawnEffects.delete(id)
      }
    }
  }

  render(): void {
    if (!this.ctx) return

    this.renderMuzzleFlashes()
    this.renderDeathEffects()
    this.renderHitMarkers()
    this.renderDamageNumbers()
    this.renderRespawnEffects()
  }

  private renderHitMarkers(): void {
    if (!this.ctx) return
    const now = Date.now()

    for (const marker of this.hitMarkers.values()) {
      const progress = (now - marker.startTime) / marker.duration
      const alpha = 1 - progress
      const scale = 1 + progress * 0.5

      // Draw X-shaped hit marker
      const size = 8 * scale
      const { x, y } = marker.position

      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.strokeStyle = COLORS.white
      this.ctx.lineWidth = 2
      this.ctx.shadowColor = COLORS.hitMarker
      this.ctx.shadowBlur = 8

      this.ctx.beginPath()
      this.ctx.moveTo(x - size, y - size)
      this.ctx.lineTo(x + size, y + size)
      this.ctx.moveTo(x + size, y - size)
      this.ctx.lineTo(x - size, y + size)
      this.ctx.stroke()

      this.ctx.restore()
    }
  }

  private renderDamageNumbers(): void {
    if (!this.ctx) return
    const now = Date.now()

    for (const dmg of this.damageNumbers.values()) {
      const progress = (now - dmg.startTime) / dmg.duration
      const alpha = 1 - progress * progress // Ease out
      const scale = 1 + progress * 0.3

      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.font = `bold ${Math.round(14 * scale)}px monospace`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'

      // Shadow/outline
      this.ctx.fillStyle = '#000'
      this.ctx.fillText(`-${dmg.damage}`, dmg.position.x + 1, dmg.position.y + 1)

      // Main text
      this.ctx.fillStyle = COLORS.damageNumber
      this.ctx.shadowColor = COLORS.damageNumber
      this.ctx.shadowBlur = 4
      this.ctx.fillText(`-${dmg.damage}`, dmg.position.x, dmg.position.y)

      this.ctx.restore()
    }
  }

  private renderMuzzleFlashes(): void {
    if (!this.ctx) return
    const now = Date.now()

    for (const flash of this.muzzleFlashes.values()) {
      const progress = (now - flash.startTime) / flash.duration
      const alpha = 1 - progress
      const { position, direction } = flash

      // Offset flash in firing direction
      const offsetX = position.x + direction.x * 15
      const offsetY = position.y + direction.y * 15

      // Draw flash as expanding circle
      const radius = 6 + progress * 8

      this.ctx.save()
      this.ctx.globalAlpha = alpha * 0.8

      // Outer glow
      this.ctx.beginPath()
      this.ctx.arc(offsetX, offsetY, radius * 1.5, 0, Math.PI * 2)
      this.ctx.fillStyle = COLORS.muzzleFlash
      this.ctx.shadowColor = COLORS.muzzleFlash
      this.ctx.shadowBlur = 16
      this.ctx.fill()

      // Inner bright core
      this.ctx.globalAlpha = alpha
      this.ctx.beginPath()
      this.ctx.arc(offsetX, offsetY, radius * 0.6, 0, Math.PI * 2)
      this.ctx.fillStyle = COLORS.white
      this.ctx.fill()

      this.ctx.restore()
    }
  }

  private renderDeathEffects(): void {
    if (!this.ctx) return

    for (const effect of this.deathEffects.values()) {
      for (const particle of effect.particles) {
        if (particle.alpha <= 0) continue

        this.ctx.save()
        this.ctx.globalAlpha = Math.max(0, particle.alpha)
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        this.ctx.fillStyle = COLORS.deathParticle
        this.ctx.shadowColor = COLORS.deathParticle
        this.ctx.shadowBlur = 8
        this.ctx.fill()
        this.ctx.restore()
      }
    }
  }

  private renderRespawnEffects(): void {
    if (!this.ctx) return
    const now = Date.now()

    for (const effect of this.respawnEffects.values()) {
      const progress = (now - effect.startTime) / effect.duration
      const { position } = effect

      // Expanding ring effect
      const maxRadius = 40
      const radius = maxRadius * progress
      const alpha = 1 - progress

      this.ctx.save()
      this.ctx.globalAlpha = alpha * 0.6
      this.ctx.strokeStyle = COLORS.respawnRing
      this.ctx.lineWidth = 3 * (1 - progress)
      this.ctx.shadowColor = COLORS.respawnRing
      this.ctx.shadowBlur = 12

      this.ctx.beginPath()
      this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
      this.ctx.stroke()

      // Inner glow
      if (progress < 0.5) {
        const innerAlpha = (0.5 - progress) * 2
        this.ctx.globalAlpha = innerAlpha * 0.4
        this.ctx.beginPath()
        this.ctx.arc(position.x, position.y, 20 * (1 - progress * 2), 0, Math.PI * 2)
        this.ctx.fillStyle = COLORS.respawnRing
        this.ctx.fill()
      }

      this.ctx.restore()
    }
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.hitMarkers.clear()
    this.damageNumbers.clear()
    this.muzzleFlashes.clear()
    this.deathEffects.clear()
    this.playerFlashes.clear()
    this.respawnEffects.clear()
  }
}
