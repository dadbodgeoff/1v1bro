/**
 * useArenaEvents - Subscribes to arena system WebSocket events
 * Single responsibility: Hazards, traps, teleporters, jump pads
 */

import { useEffect, useCallback, useRef } from 'react'
import { wsService } from '@/services/websocket'
import type {
  HazardSpawnPayload,
  HazardDespawnPayload,
  HazardEnterPayload,
  HazardExitPayload,
  HazardDamagePayload,
  TrapSpawnPayload,
  TrapDespawnPayload,
  TrapWarningPayload,
  TrapTriggeredPayload,
  TrapArmedPayload,
  TeleportPayload,
  JumpPadPayload,
} from '@/types/websocket'
import type { ArenaCallbacks } from './types'

export function useArenaEvents(lobbyCode: string | undefined) {
  const callbacksRef = useRef<ArenaCallbacks>({
    onHazardSpawn: null,
    onHazardDespawn: null,
    onHazardEnter: null,
    onHazardExit: null,
    onHazardDamage: null,
    onTrapSpawn: null,
    onTrapDespawn: null,
    onTrapWarning: null,
    onTrapTriggered: null,
    onTrapArmed: null,
    onTeleport: null,
    onJumpPad: null,
  })

  useEffect(() => {
    if (!lobbyCode) return

    const unsubHazardSpawn = wsService.on('arena_hazard_spawn', (payload) => {
      callbacksRef.current.onHazardSpawn?.(payload as HazardSpawnPayload)
    })

    const unsubHazardDespawn = wsService.on('arena_hazard_despawn', (payload) => {
      callbacksRef.current.onHazardDespawn?.((payload as HazardDespawnPayload).id)
    })

    const unsubHazardEnter = wsService.on('arena_hazard_enter', (payload) => {
      const data = payload as HazardEnterPayload
      callbacksRef.current.onHazardEnter?.(data.hazard_id, data.player_id, data.type)
    })

    const unsubHazardExit = wsService.on('arena_hazard_exit', (payload) => {
      const data = payload as HazardExitPayload
      callbacksRef.current.onHazardExit?.(data.hazard_id, data.player_id)
    })

    const unsubHazardDamage = wsService.on('arena_hazard_damage', (payload) => {
      const data = payload as HazardDamagePayload
      callbacksRef.current.onHazardDamage?.(data.player_id, data.damage)
    })

    const unsubTrapSpawn = wsService.on('arena_trap_spawn', (payload) => {
      callbacksRef.current.onTrapSpawn?.(payload as TrapSpawnPayload)
    })

    const unsubTrapDespawn = wsService.on('arena_trap_despawn', (payload) => {
      callbacksRef.current.onTrapDespawn?.((payload as TrapDespawnPayload).id)
    })

    const unsubTrapWarning = wsService.on('arena_trap_warning', (payload) => {
      callbacksRef.current.onTrapWarning?.((payload as TrapWarningPayload).id)
    })

    const unsubTrapTriggered = wsService.on('arena_trap_triggered', (payload) => {
      callbacksRef.current.onTrapTriggered?.(payload as TrapTriggeredPayload)
    })

    const unsubTrapArmed = wsService.on('arena_trap_armed', (payload) => {
      callbacksRef.current.onTrapArmed?.((payload as TrapArmedPayload).id)
    })

    const unsubTeleport = wsService.on('arena_teleport', (payload) => {
      const data = payload as TeleportPayload
      callbacksRef.current.onTeleport?.(data.player_id, data.to_x, data.to_y)
    })

    const unsubJumpPad = wsService.on('arena_jump_pad', (payload) => {
      const data = payload as JumpPadPayload
      callbacksRef.current.onJumpPad?.(data.player_id, data.vx, data.vy)
    })

    return () => {
      unsubHazardSpawn()
      unsubHazardDespawn()
      unsubHazardEnter()
      unsubHazardExit()
      unsubHazardDamage()
      unsubTrapSpawn()
      unsubTrapDespawn()
      unsubTrapWarning()
      unsubTrapTriggered()
      unsubTrapArmed()
      unsubTeleport()
      unsubJumpPad()
    }
  }, [lobbyCode])

  // Send arena config
  const sendArenaConfig = useCallback((config: unknown) => {
    wsService.sendArenaConfig(config)
  }, [])

  // Callback setters
  const setHazardSpawnCallback = useCallback((cb: (hazard: HazardSpawnPayload) => void) => {
    callbacksRef.current.onHazardSpawn = cb
  }, [])

  const setHazardDespawnCallback = useCallback((cb: (id: string) => void) => {
    callbacksRef.current.onHazardDespawn = cb
  }, [])

  const setHazardEnterCallback = useCallback(
    (cb: (hazardId: string, playerId: string, type: string) => void) => {
      callbacksRef.current.onHazardEnter = cb
    },
    []
  )

  const setHazardExitCallback = useCallback((cb: (hazardId: string, playerId: string) => void) => {
    callbacksRef.current.onHazardExit = cb
  }, [])

  const setHazardDamageCallback = useCallback((cb: (playerId: string, damage: number) => void) => {
    callbacksRef.current.onHazardDamage = cb
  }, [])

  const setTrapSpawnCallback = useCallback((cb: (trap: TrapSpawnPayload) => void) => {
    callbacksRef.current.onTrapSpawn = cb
  }, [])

  const setTrapDespawnCallback = useCallback((cb: (id: string) => void) => {
    callbacksRef.current.onTrapDespawn = cb
  }, [])

  const setTrapWarningCallback = useCallback((cb: (id: string) => void) => {
    callbacksRef.current.onTrapWarning = cb
  }, [])

  const setTrapTriggeredCallback = useCallback((cb: (data: TrapTriggeredPayload) => void) => {
    callbacksRef.current.onTrapTriggered = cb
  }, [])

  const setTrapArmedCallback = useCallback((cb: (id: string) => void) => {
    callbacksRef.current.onTrapArmed = cb
  }, [])

  const setTeleportCallback = useCallback(
    (cb: (playerId: string, toX: number, toY: number) => void) => {
      callbacksRef.current.onTeleport = cb
    },
    []
  )

  const setJumpPadCallback = useCallback((cb: (playerId: string, vx: number, vy: number) => void) => {
    callbacksRef.current.onJumpPad = cb
  }, [])

  return {
    sendArenaConfig,
    setHazardSpawnCallback,
    setHazardDespawnCallback,
    setHazardEnterCallback,
    setHazardExitCallback,
    setHazardDamageCallback,
    setTrapSpawnCallback,
    setTrapDespawnCallback,
    setTrapWarningCallback,
    setTrapTriggeredCallback,
    setTrapArmedCallback,
    setTeleportCallback,
    setJumpPadCallback,
  }
}
