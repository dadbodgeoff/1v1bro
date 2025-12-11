/**
 * AimAssist - Handles aim assist logic for combat
 * 
 * Provides aim assist for both desktop and mobile players
 * Mobile users get stronger aim assist since touch controls are less precise
 * 
 * @module combat/AimAssist
 */

import type { Vector2 } from '../types'

export interface AimAssistConfig {
  enabled: boolean
  strength: number // How much to pull toward target (0-1)
  angle: number // Degrees - cone within which aim assist activates
  range: number // Max distance for aim assist
}

export interface AimAssistTarget {
  playerId: string
  position: Vector2
  isAlive: boolean
  isRespawning: boolean
}

const DESKTOP_CONFIG: AimAssistConfig = {
  enabled: true,
  strength: 0.4,
  angle: 25,
  range: 500,
}

const MOBILE_CONFIG: AimAssistConfig = {
  enabled: true,
  strength: 0.65,
  angle: 40,
  range: 500,
}

export class AimAssist {
  private config: AimAssistConfig = { ...DESKTOP_CONFIG }
  private isMobileMode = false
  private localPlayerId: string | null = null

  setLocalPlayer(playerId: string): void {
    this.localPlayerId = playerId
  }

  /**
   * Enable mobile mode with boosted aim assist
   */
  setMobileMode(isMobile: boolean): void {
    this.isMobileMode = isMobile
    this.config = isMobile ? { ...MOBILE_CONFIG } : { ...DESKTOP_CONFIG }
  }

  isMobile(): boolean {
    return this.isMobileMode
  }

  /**
   * Enable or disable aim assist
   */
  setEnabled(enabled: boolean, strength?: number): void {
    this.config.enabled = enabled
    if (strength !== undefined) {
      this.config.strength = Math.max(0, Math.min(1, strength))
    }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Apply aim assist to raw aim direction
   */
  applyAimAssist(
    rawAim: Vector2,
    playerPosition: Vector2,
    targets: AimAssistTarget[]
  ): Vector2 {
    if (!this.config.enabled || targets.length === 0) {
      return rawAim
    }

    let bestTarget: Vector2 | null = null
    let bestScore = Infinity

    const aimAngleRad = (this.config.angle * Math.PI) / 180

    for (const target of targets) {
      // Skip self
      if (target.playerId === this.localPlayerId) continue
      // Skip dead or respawning players
      if (!target.isAlive || target.isRespawning) continue

      const toTarget = {
        x: target.position.x - playerPosition.x,
        y: target.position.y - playerPosition.y,
      }
      const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y)

      // Skip if too far or too close
      if (distance > this.config.range || distance < 1) continue

      // Normalize direction to target
      const targetDir = { x: toTarget.x / distance, y: toTarget.y / distance }

      // Calculate angle between aim and target
      const dot = rawAim.x * targetDir.x + rawAim.y * targetDir.y
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)))

      // Skip if outside aim assist cone
      if (angle > aimAngleRad) continue

      // Score based on angle (smaller is better) and distance
      const score = angle + distance / this.config.range

      if (score < bestScore) {
        bestScore = score
        bestTarget = targetDir
      }
    }

    // If we found a valid target, blend toward it
    if (bestTarget) {
      return {
        x: rawAim.x + (bestTarget.x - rawAim.x) * this.config.strength,
        y: rawAim.y + (bestTarget.y - rawAim.y) * this.config.strength,
      }
    }

    return rawAim
  }

  /**
   * Mobile auto-aim: Find direction to nearest enemy
   * Returns null if no valid target found
   */
  getMobileAutoAimDirection(
    playerPosition: Vector2,
    targets: AimAssistTarget[]
  ): Vector2 | null {
    if (!this.isMobileMode) return null
    
    let nearestTarget: Vector2 | null = null
    let nearestDistance = Infinity

    for (const target of targets) {
      // Skip self
      if (target.playerId === this.localPlayerId) continue
      // Skip dead or respawning players
      if (!target.isAlive || target.isRespawning) continue

      const dx = target.position.x - playerPosition.x
      const dy = target.position.y - playerPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < nearestDistance && distance > 10) {
        nearestDistance = distance
        nearestTarget = { x: dx / distance, y: dy / distance }
      }
    }

    return nearestTarget
  }

  /**
   * Apply mobile auto-aim to fire direction
   * Near lock-on (95%) - mobile needs strong assist since touch is imprecise
   */
  applyMobileAutoAim(aimDirection: Vector2, autoAimDir: Vector2): Vector2 {
    const fireDirection = {
      x: aimDirection.x * 0.05 + autoAimDir.x * 0.95,
      y: aimDirection.y * 0.05 + autoAimDir.y * 0.95,
    }
    // Normalize
    const len = Math.sqrt(fireDirection.x * fireDirection.x + fireDirection.y * fireDirection.y)
    if (len > 0) {
      return { x: fireDirection.x / len, y: fireDirection.y / len }
    }
    return aimDirection
  }
}
