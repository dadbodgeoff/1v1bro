/**
 * PlayerController - Handles local player movement, transport, and launch mechanics
 * Single responsibility: Player physics and collision
 */

import { ARENA_SIZE, PLAYER_CONFIG } from '../config'
import { InputSystem } from '../systems'
import { ArenaManager } from '../arena'
import type { PlayerState, Vector2, LaunchState } from './types'

export class PlayerController {
  private inputSystem: InputSystem
  private arenaManager: ArenaManager
  private launchState: LaunchState = {
    velocity: null,
    timeRemaining: 0,
    hitApplied: false,
  }

  private onPositionUpdate: ((position: Vector2) => void) | null = null
  private onLaunchCollision: ((opponentId: string, position: Vector2) => void) | null = null

  constructor(inputSystem: InputSystem, arenaManager: ArenaManager) {
    this.inputSystem = inputSystem
    this.arenaManager = arenaManager
  }

  setCallbacks(
    onPositionUpdate: (position: Vector2) => void,
    onLaunchCollision: (opponentId: string, position: Vector2) => void
  ): void {
    this.onPositionUpdate = onPositionUpdate
    this.onLaunchCollision = onLaunchCollision
  }

  setMobileVelocity(velocity: Vector2): void {
    this.inputSystem.setTouchVelocity(velocity)
  }

  setLaunch(velocity: Vector2, duration: number = 0.4): void {
    this.launchState = {
      velocity,
      timeRemaining: duration,
      hitApplied: false,
    }
  }

  setLaunchFromKnockback(velocity: Vector2): void {
    this.launchState = {
      velocity,
      timeRemaining: 0.2,
      hitApplied: true, // Don't deal damage from knockback
    }
  }

  isLaunching(): boolean {
    return this.launchState.velocity !== null && this.launchState.timeRemaining > 0
  }

  update(
    deltaTime: number,
    localPlayer: PlayerState | null,
    opponent: PlayerState | null
  ): void {
    if (!localPlayer) return

    // Handle jump pad launch
    if (this.launchState.velocity && this.launchState.timeRemaining > 0) {
      this.updateLaunch(deltaTime, localPlayer, opponent)
      return
    }

    // Normal movement
    this.updateMovement(deltaTime, localPlayer)
    this.checkTransport(localPlayer)
  }


  private updateLaunch(
    deltaTime: number,
    localPlayer: PlayerState,
    opponent: PlayerState | null
  ): void {
    this.launchState.timeRemaining -= deltaTime
    
    const newPosition: Vector2 = {
      x: localPlayer.position.x + this.launchState.velocity!.x * deltaTime,
      y: localPlayer.position.y + this.launchState.velocity!.y * deltaTime,
    }
    localPlayer.position = this.clampToBounds(newPosition)
    this.onPositionUpdate?.(localPlayer.position)

    // Check for collision with opponent during launch (knockback)
    if (!this.launchState.hitApplied && opponent) {
      const dx = localPlayer.position.x - opponent.position.x
      const dy = localPlayer.position.y - opponent.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const collisionRadius = PLAYER_CONFIG.radius * 2.5

      if (dist < collisionRadius) {
        // Push opponent away
        const knockbackForce = 200
        const knockbackDir: Vector2 =
          dist > 0
            ? { x: -dx / dist, y: -dy / dist }
            : { x: this.launchState.velocity!.x > 0 ? 1 : -1, y: 0 }

        opponent.position = this.clampToBounds({
          x: opponent.position.x + knockbackDir.x * knockbackForce * deltaTime * 3,
          y: opponent.position.y + knockbackDir.y * knockbackForce * deltaTime * 3,
        })

        this.onLaunchCollision?.(opponent.id, opponent.position)
        this.launchState.hitApplied = true
      }
    }

    if (this.launchState.timeRemaining <= 0) {
      this.launchState.velocity = null
      this.launchState.hitApplied = false
    }
  }

  private updateMovement(deltaTime: number, localPlayer: PlayerState): void {
    const velocity = this.inputSystem.getVelocity()
    if (velocity.x === 0 && velocity.y === 0) return

    // Apply speed modifier from hazards
    const effects = this.arenaManager.getPlayerEffects(localPlayer.id)
    const speedMultiplier = effects.speedMultiplier

    const speed = PLAYER_CONFIG.speed * deltaTime * speedMultiplier
    const newPosition: Vector2 = {
      x: localPlayer.position.x + velocity.x * speed,
      y: localPlayer.position.y + velocity.y * speed,
    }

    // Use ArenaManager for collision resolution
    let resolved = this.arenaManager.resolveCollision(newPosition, PLAYER_CONFIG.radius)
    resolved = this.clampToBounds(resolved)

    localPlayer.position = resolved
    this.onPositionUpdate?.(resolved)
  }

  private checkTransport(localPlayer: PlayerState): void {
    const teleportDest = this.arenaManager.checkTeleport(localPlayer.id, localPlayer.position)
    if (teleportDest) {
      localPlayer.position = teleportDest
      this.onPositionUpdate?.(teleportDest)
      return
    }

    const launchVel = this.arenaManager.checkJumpPad(localPlayer.id, localPlayer.position)
    if (launchVel) {
      this.setLaunch(launchVel)
    }
  }

  private clampToBounds(position: Vector2): Vector2 {
    return {
      x: Math.max(PLAYER_CONFIG.radius, Math.min(ARENA_SIZE.width - PLAYER_CONFIG.radius, position.x)),
      y: Math.max(PLAYER_CONFIG.radius, Math.min(ARENA_SIZE.height - PLAYER_CONFIG.radius, position.y)),
    }
  }

  destroy(): void {
    this.inputSystem.destroy()
  }
}
