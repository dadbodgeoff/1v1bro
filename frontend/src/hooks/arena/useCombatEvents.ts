/**
 * useCombatEvents - Subscribes to combat-related WebSocket events
 * Single responsibility: Combat state sync (projectiles, health, death, respawn)
 */

import { useEffect, useCallback, useRef } from 'react'
import { wsService } from '@/services/websocket'
import type {
  StateUpdatePayload,
  CombatHitPayload,
  CombatDeathPayload,
  CombatRespawnPayload,
} from '@/types/websocket'
import type { Projectile, Vector2 } from './types'

export interface BuffUpdate {
  type: string
  value: number
  remaining: number
  source: string
}

export interface CombatEventCallbacks {
  onServerProjectiles?: (projectiles: Projectile[]) => void
  onServerHealth?: (playerId: string, health: number, maxHealth: number) => void
  onServerDeath?: (playerId: string, killerId: string) => void
  onServerRespawn?: (playerId: string, x: number, y: number) => void
  onOpponentPosition?: (position: Vector2) => void
  onBuffUpdate?: (buffs: Record<string, BuffUpdate[]>) => void
}

export function useCombatEvents(
  lobbyCode: string | undefined,
  localUserId: string | undefined
) {
  const callbacksRef = useRef<CombatEventCallbacks>({})
  const fireSequenceRef = useRef(0)

  // Subscribe to combat events
  useEffect(() => {
    if (!lobbyCode) return

    // State updates (authoritative tick)
    const unsubStateUpdate = wsService.on('state_update', (payload) => {
      const data = payload as StateUpdatePayload

      // Update opponent position
      for (const [playerId, state] of Object.entries(data.players)) {
        if (playerId !== localUserId) {
          callbacksRef.current.onOpponentPosition?.({ x: state.x, y: state.y })
        }
      }

      // Update combat state
      if (data.combat) {
        const projectiles: Projectile[] = data.combat.projectiles.map((p) => ({
          id: p.id,
          ownerId: p.owner_id,
          position: { x: p.x, y: p.y },
          velocity: { x: p.vx, y: p.vy },
          spawnTime: Date.now(),
          spawnPosition: { x: p.x, y: p.y },
          damage: 10,
          isPredicted: false,
        }))

        callbacksRef.current.onServerProjectiles?.(projectiles)

        for (const [playerId, combat] of Object.entries(data.combat.players)) {
          callbacksRef.current.onServerHealth?.(playerId, combat.health, combat.max_health)
        }
      }

      // Update buff state
      if (data.buffs) {
        callbacksRef.current.onBuffUpdate?.(data.buffs as Record<string, BuffUpdate[]>)
      }
    })

    const unsubCombatFire = wsService.on('combat_fire', () => {
      // Fire events handled via state_update
    })

    const unsubCombatHit = wsService.on('combat_hit', (payload) => {
      const data = payload as CombatHitPayload
      callbacksRef.current.onServerHealth?.(data.target_id, data.health_remaining, 100)
    })

    const unsubCombatDeath = wsService.on('combat_death', (payload) => {
      const data = payload as CombatDeathPayload
      callbacksRef.current.onServerDeath?.(data.victim_id, data.killer_id)
    })

    const unsubCombatRespawn = wsService.on('combat_respawn', (payload) => {
      const data = payload as CombatRespawnPayload
      callbacksRef.current.onServerRespawn?.(data.player_id, data.x, data.y)
    })

    return () => {
      unsubStateUpdate()
      unsubCombatFire()
      unsubCombatHit()
      unsubCombatDeath()
      unsubCombatRespawn()
    }
  }, [lobbyCode, localUserId])

  // Send fire event
  const sendFire = useCallback((direction: Vector2) => {
    fireSequenceRef.current++
    wsService.sendFire(direction.x, direction.y, fireSequenceRef.current)
  }, [])

  // Send combat event for stats
  const sendCombatEvent = useCallback(
    (type: 'kill' | 'damage' | 'shot', data: Record<string, unknown>) => {
      const eventType = `combat_${type}` as const
      wsService.send(eventType, data)
    },
    []
  )

  // Callback setters
  const setServerProjectilesCallback = useCallback((cb: (projectiles: Projectile[]) => void) => {
    callbacksRef.current.onServerProjectiles = cb
  }, [])

  const setServerHealthCallback = useCallback(
    (cb: (playerId: string, health: number, maxHealth: number) => void) => {
      callbacksRef.current.onServerHealth = cb
    },
    []
  )

  const setServerDeathCallback = useCallback((cb: (playerId: string, killerId: string) => void) => {
    callbacksRef.current.onServerDeath = cb
  }, [])

  const setServerRespawnCallback = useCallback(
    (cb: (playerId: string, x: number, y: number) => void) => {
      callbacksRef.current.onServerRespawn = cb
    },
    []
  )

  const setOpponentPositionCallback = useCallback((cb: (position: Vector2) => void) => {
    callbacksRef.current.onOpponentPosition = cb
  }, [])

  const setBuffUpdateCallback = useCallback(
    (cb: (buffs: Record<string, BuffUpdate[]>) => void) => {
      callbacksRef.current.onBuffUpdate = cb
    },
    []
  )

  return {
    sendFire,
    sendCombatEvent,
    setServerProjectilesCallback,
    setServerHealthCallback,
    setServerDeathCallback,
    setServerRespawnCallback,
    setOpponentPositionCallback,
    setBuffUpdateCallback,
  }
}
