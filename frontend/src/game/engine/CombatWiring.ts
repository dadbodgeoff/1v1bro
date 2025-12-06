/**
 * CombatWiring - Wires up combat system callbacks
 * Single responsibility: Connect combat events to effects and telemetry
 */

import { CombatSystem } from '../combat'
import { CombatEffectsRenderer } from '../renderers'
import { ArenaManager } from '../arena'
import { TelemetryManager } from './TelemetryManager'
import type { GameEngineCallbacks, PlayerState, Vector2 } from './types'
import type { DeathReplay } from '../telemetry'

export interface CombatWiringDeps {
  combatSystem: CombatSystem
  effectsRenderer: CombatEffectsRenderer
  arenaManager: ArenaManager
  telemetryManager: TelemetryManager
  getLocalPlayer: () => PlayerState | null
  getOpponent: () => PlayerState | null
  getPlayerPositions: () => Map<string, Vector2>
}

export function wireCombatCallbacks(
  deps: CombatWiringDeps,
  callbacks: GameEngineCallbacks,
  onDeathReplayReady: (replay: DeathReplay) => void
): void {
  const {
    combatSystem,
    effectsRenderer,
    arenaManager,
    telemetryManager,
    getLocalPlayer,
    getOpponent,
    getPlayerPositions,
  } = deps

  combatSystem.setCallbacks({
    onFire: (event) => {
      effectsRenderer.addMuzzleFlash(event.position, event.direction)
      telemetryManager.recordEvent('fire', {
        playerId: event.playerId,
        position: event.position,
        direction: event.direction,
      })
      callbacks.onCombatFire?.(event)
    },
    onHit: (event) => {
      effectsRenderer.addHitMarker(event.position)
      effectsRenderer.addDamageNumber(event.position, event.damage)
      effectsRenderer.addPlayerFlash(event.targetId)
      arenaManager.onProjectileHit(event.position, getPlayerPositions())
      const targetPos = getPlayerPositions().get(event.targetId) ?? { x: 0, y: 0 }
      telemetryManager.recordEvent('hit', {
        projectileId: event.projectileId,
        shooterId: event.shooterId,
        targetId: event.targetId,
        hitPosition: event.position,
        targetPosition: targetPos,
        clientTargetPosition: targetPos,
        damage: event.damage,
        latencyMs: telemetryManager.getNetworkStats().rttMs,
      })
      callbacks.onCombatHit?.(event)
    },
    onDeath: (event) => {
      const localPlayer = getLocalPlayer()
      const opponent = getOpponent()
      const player = event.playerId === localPlayer?.id ? localPlayer : opponent
      if (player) {
        effectsRenderer.addDeathEffect(player.position)
        arenaManager.onPlayerDeath(event.playerId)
        const healthState = combatSystem.getHealthState(event.playerId)
        telemetryManager.recordEvent('death', {
          playerId: event.playerId,
          killerId: event.killerId,
          finalHitPosition: player.position,
          healthBeforeHit: healthState?.current ?? 0,
          damageDealt: 0,
        })
        const replay = telemetryManager.extractDeathReplay(event.playerId, event.killerId)
        onDeathReplayReady(replay)
      }
      callbacks.onCombatDeath?.(event)
    },
    onRespawn: (event) => {
      effectsRenderer.addRespawnEffect(event.position)
      telemetryManager.recordEvent('respawn', {
        playerId: event.playerId,
        position: event.position,
      })
      callbacks.onCombatRespawn?.(event)
    },
  })
}
