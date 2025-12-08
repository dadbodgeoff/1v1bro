/**
 * ServerSync - Handles server-authoritative state updates
 * Single responsibility: Apply server state to local game
 */

import { CombatSystem } from '../combat'
import { CombatEffectsRenderer } from '../renderers'
import { ArenaManager } from '../arena'
import type { PlayerState, Vector2, Projectile } from './types'

export interface ServerSyncCallbacks {
  onCombatDeath?: (event: { playerId: string; killerId: string; timestamp: number }) => void
  onCombatRespawn?: (event: { playerId: string; position: Vector2; timestamp: number }) => void
}

export class ServerSync {
  private combatSystem: CombatSystem
  private combatEffectsRenderer: CombatEffectsRenderer
  private arenaManager: ArenaManager
  private callbacks: ServerSyncCallbacks = {}

  private getLocalPlayer: () => PlayerState | null
  private getOpponent: () => PlayerState | null
  private setLaunch: (velocity: Vector2, duration?: number) => void
  private setLaunchFromKnockback: (velocity: Vector2) => void
  private setPositionOverride: (position: Vector2) => void

  constructor(
    combatSystem: CombatSystem,
    combatEffectsRenderer: CombatEffectsRenderer,
    arenaManager: ArenaManager,
    getLocalPlayer: () => PlayerState | null,
    getOpponent: () => PlayerState | null,
    setLaunch: (velocity: Vector2, duration?: number) => void,
    setLaunchFromKnockback: (velocity: Vector2) => void,
    setPositionOverride: (position: Vector2) => void
  ) {
    this.combatSystem = combatSystem
    this.combatEffectsRenderer = combatEffectsRenderer
    this.arenaManager = arenaManager
    this.getLocalPlayer = getLocalPlayer
    this.getOpponent = getOpponent
    this.setLaunch = setLaunch
    this.setLaunchFromKnockback = setLaunchFromKnockback
    this.setPositionOverride = setPositionOverride
  }

  setCallbacks(callbacks: ServerSyncCallbacks): void {
    this.callbacks = callbacks
  }


  // Combat sync methods
  setServerProjectiles(projectiles: Projectile[]): void {
    this.combatSystem.setServerProjectiles(projectiles)
  }

  setServerHealth(playerId: string, health: number, maxHealth: number): void {
    this.combatSystem.setServerHealth(playerId, health, maxHealth)
  }

  handleServerDeath(playerId: string, killerId: string): void {
    const localPlayer = this.getLocalPlayer()
    const opponent = this.getOpponent()
    const player = playerId === localPlayer?.id ? localPlayer : opponent
    
    if (player) {
      this.combatEffectsRenderer.addDeathEffect(player.position)
      this.arenaManager.onPlayerDeath(playerId)
      this.callbacks.onCombatDeath?.({
        playerId,
        killerId,
        timestamp: Date.now(),
      })
    }
  }

  handleServerRespawn(playerId: string, x: number, y: number): void {
    const position = { x, y }
    const localPlayer = this.getLocalPlayer()
    const opponent = this.getOpponent()

    // Update player position
    if (playerId === localPlayer?.id && localPlayer) {
      // For local player, use position override to ensure movement system respects it
      this.setPositionOverride(position)
      // Also update directly for immediate visual feedback
      localPlayer.position.x = position.x
      localPlayer.position.y = position.y
      // Clear trails to avoid visual artifacts
      localPlayer.trail = []
    } else if (playerId === opponent?.id && opponent) {
      opponent.position.x = position.x
      opponent.position.y = position.y
      opponent.trail = []
    }

    // Reset health in combat system
    this.combatSystem.handleServerRespawn(playerId)

    // Visual effect
    this.combatEffectsRenderer.addRespawnEffect(position)

    this.callbacks.onCombatRespawn?.({
      playerId,
      position,
      timestamp: Date.now(),
    })
  }

  // Arena sync methods
  handleServerTeleport(playerId: string, toX: number, toY: number): void {
    const position = { x: toX, y: toY }
    const localPlayer = this.getLocalPlayer()
    const opponent = this.getOpponent()

    if (playerId === localPlayer?.id && localPlayer) {
      // For local player, use position override to ensure movement system respects it
      this.setPositionOverride(position)
      localPlayer.position.x = position.x
      localPlayer.position.y = position.y
    } else if (playerId === opponent?.id && opponent) {
      opponent.position.x = position.x
      opponent.position.y = position.y
    }

    this.combatEffectsRenderer.addRespawnEffect(position)
  }

  handleServerJumpPad(playerId: string, vx: number, vy: number): void {
    const localPlayer = this.getLocalPlayer()
    if (playerId === localPlayer?.id) {
      this.setLaunch({ x: vx, y: vy }, 0.4)
    }
  }

  handleServerHazardDamage(playerId: string, damage: number): void {
    this.combatSystem.applyDamage(playerId, damage, 'hazard')
    
    const localPlayer = this.getLocalPlayer()
    const opponent = this.getOpponent()
    const player = playerId === localPlayer?.id ? localPlayer : opponent
    
    if (player) {
      this.combatEffectsRenderer.addDamageNumber(player.position, damage)
    }
  }

  handleServerTrapTriggered(
    _trapId: string,
    effect: string,
    value: number,
    affectedPlayers: string[],
    position: { x: number; y: number },
    knockbacks?: Record<string, { dx: number; dy: number }>
  ): void {
    this.combatEffectsRenderer.addHitMarker(position)
    const localPlayer = this.getLocalPlayer()
    const opponent = this.getOpponent()

    for (const playerId of affectedPlayers) {
      if (effect === 'damage') {
        this.combatSystem.applyDamage(playerId, value, 'trap')
        const player = playerId === localPlayer?.id ? localPlayer : opponent
        if (player) {
          this.combatEffectsRenderer.addDamageNumber(player.position, value)
        }
      } else if (effect === 'knockback' && knockbacks) {
        const kb = knockbacks[playerId]
        if (kb && playerId === localPlayer?.id) {
          this.setLaunchFromKnockback({ x: kb.dx, y: kb.dy })
        }
      }
    }
  }
}
