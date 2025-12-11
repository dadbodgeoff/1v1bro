/**
 * useGameArenaCallbacks - Manages callback registration for GameArena
 * 
 * Handles registration of server callbacks with the game engine
 * 
 * @module hooks/useGameArenaCallbacks
 */

import { useEffect, useRef, useMemo, type MutableRefObject } from 'react'
import type { GameEngine, Vector2, FireEvent, HitEvent, DeathEvent, RespawnEvent, Projectile } from '@/game'

interface CallbackRefs {
  onPositionUpdate: MutableRefObject<((pos: Vector2) => void) | undefined>
  onPowerUpCollect: MutableRefObject<(id: number) => void>
  onCombatFire: MutableRefObject<((event: FireEvent) => void) | undefined>
  onCombatHit: MutableRefObject<((event: HitEvent) => void) | undefined>
  onCombatDeath: MutableRefObject<((event: DeathEvent) => void) | undefined>
  onCombatRespawn: MutableRefObject<((event: RespawnEvent) => void) | undefined>
}

interface ServerCallbacks {
  setOpponentPositionCallback?: (callback: (pos: Vector2) => void) => void
  setServerProjectilesCallback?: (callback: (projectiles: Projectile[]) => void) => void
  setServerHealthCallback?: (callback: (playerId: string, health: number, maxHealth: number) => void) => void
  setServerDeathCallback?: (callback: (playerId: string, killerId: string) => void) => void
  setServerRespawnCallback?: (callback: (playerId: string, x: number, y: number) => void) => void
  setBuffUpdateCallback?: (callback: (buffs: Record<string, Array<{ type: string; value: number; remaining: number; source: string }>>) => void) => void
}

interface ArenaCallbacks {
  setHazardDamageCallback?: (callback: (playerId: string, damage: number) => void) => void
  setTrapTriggeredCallback?: (callback: (data: { id: string; effect: string; value: number; affected_players: string[]; x: number; y: number; knockbacks?: Record<string, { dx: number; dy: number }> }) => void) => void
  setTeleportCallback?: (callback: (playerId: string, toX: number, toY: number) => void) => void
  setJumpPadCallback?: (callback: (playerId: string, vx: number, vy: number) => void) => void
  setHazardSpawnCallback?: (callback: (hazard: { id: string; type: string; bounds: { x: number; y: number; width: number; height: number }; intensity: number }) => void) => void
  setHazardDespawnCallback?: (callback: (id: string) => void) => void
  setTrapSpawnCallback?: (callback: (trap: { id: string; type: string; x: number; y: number; radius: number; effect: string; effectValue: number }) => void) => void
  setTrapDespawnCallback?: (callback: (id: string) => void) => void
}

export function useCallbackRefs(
  onPositionUpdate: (pos: Vector2) => void,
  onPowerUpCollect: (id: number) => void,
  onCombatFire?: (event: FireEvent) => void,
  onCombatHit?: (event: HitEvent) => void,
  onCombatDeath?: (event: DeathEvent) => void,
  onCombatRespawn?: (event: RespawnEvent) => void
): CallbackRefs {
  const onPositionUpdateRef = useRef(onPositionUpdate)
  const onPowerUpCollectRef = useRef(onPowerUpCollect)
  const onCombatFireRef = useRef(onCombatFire)
  const onCombatHitRef = useRef(onCombatHit)
  const onCombatDeathRef = useRef(onCombatDeath)
  const onCombatRespawnRef = useRef(onCombatRespawn)


  useEffect(() => {
    onPositionUpdateRef.current = onPositionUpdate
    onPowerUpCollectRef.current = onPowerUpCollect
    onCombatFireRef.current = onCombatFire
    onCombatHitRef.current = onCombatHit
    onCombatDeathRef.current = onCombatDeath
    onCombatRespawnRef.current = onCombatRespawn
  }, [onPositionUpdate, onPowerUpCollect, onCombatFire, onCombatHit, onCombatDeath, onCombatRespawn])

  // Memoize the return object to prevent unnecessary re-renders
  // The refs themselves are stable, but we need the container object to be stable too
  return useMemo(() => ({
    onPositionUpdate: onPositionUpdateRef,
    onPowerUpCollect: onPowerUpCollectRef,
    onCombatFire: onCombatFireRef,
    onCombatHit: onCombatHitRef,
    onCombatDeath: onCombatDeathRef,
    onCombatRespawn: onCombatRespawnRef,
  }), [])
}

export function useServerCallbacks(
  engineRef: MutableRefObject<GameEngine | null>,
  playerId: string,
  callbacks: ServerCallbacks
): void {
  const { setOpponentPositionCallback, setServerProjectilesCallback, setServerHealthCallback, setServerDeathCallback, setServerRespawnCallback, setBuffUpdateCallback } = callbacks

  useEffect(() => {
    if (setOpponentPositionCallback) {
      setOpponentPositionCallback((pos: Vector2) => {
        engineRef.current?.updateOpponentPosition(pos)
      })
    }
  }, [setOpponentPositionCallback, playerId])

  useEffect(() => {
    if (setServerProjectilesCallback) {
      setServerProjectilesCallback((projectiles) => {
        engineRef.current?.setServerProjectiles(projectiles)
      })
    }
  }, [setServerProjectilesCallback, playerId])

  useEffect(() => {
    if (setServerHealthCallback) {
      setServerHealthCallback((pid, health, maxHealth) => {
        engineRef.current?.setServerHealth(pid, health, maxHealth)
      })
    }
  }, [setServerHealthCallback, playerId])

  useEffect(() => {
    if (setServerDeathCallback) {
      setServerDeathCallback((pid, killerId) => {
        engineRef.current?.handleServerDeath(pid, killerId)
      })
    }
  }, [setServerDeathCallback, playerId])

  useEffect(() => {
    if (setServerRespawnCallback) {
      setServerRespawnCallback((pid, x, y) => {
        engineRef.current?.handleServerRespawn(pid, x, y)
      })
    }
  }, [setServerRespawnCallback, playerId])

  useEffect(() => {
    if (setBuffUpdateCallback) {
      setBuffUpdateCallback((buffs) => {
        engineRef.current?.setServerBuffs(buffs)
      })
    }
  }, [setBuffUpdateCallback, playerId])
}

export function useArenaCallbacks(
  engineRef: MutableRefObject<GameEngine | null>,
  playerId: string,
  callbacks: ArenaCallbacks
): void {
  const { setHazardDamageCallback, setTrapTriggeredCallback, setTeleportCallback, setJumpPadCallback, setHazardSpawnCallback, setHazardDespawnCallback, setTrapSpawnCallback, setTrapDespawnCallback } = callbacks

  useEffect(() => {
    if (setHazardDamageCallback) {
      setHazardDamageCallback((pid, damage) => {
        engineRef.current?.handleServerHazardDamage(pid, damage)
      })
    }
  }, [setHazardDamageCallback, playerId])

  useEffect(() => {
    if (setTrapTriggeredCallback) {
      setTrapTriggeredCallback((data) => {
        engineRef.current?.handleServerTrapTriggered(
          data.id,
          data.effect,
          data.value,
          data.affected_players,
          { x: data.x, y: data.y },
          data.knockbacks
        )
      })
    }
  }, [setTrapTriggeredCallback, playerId])

  useEffect(() => {
    if (setTeleportCallback) {
      setTeleportCallback((pid, toX, toY) => {
        engineRef.current?.handleServerTeleport(pid, toX, toY)
      })
    }
  }, [setTeleportCallback, playerId])

  useEffect(() => {
    if (setJumpPadCallback) {
      setJumpPadCallback((pid, vx, vy) => {
        engineRef.current?.handleServerJumpPad(pid, vx, vy)
      })
    }
  }, [setJumpPadCallback, playerId])

  useEffect(() => {
    if (setHazardSpawnCallback) {
      setHazardSpawnCallback((hazard) => {
        engineRef.current?.addServerHazard(hazard)
      })
    }
  }, [setHazardSpawnCallback])

  useEffect(() => {
    if (setHazardDespawnCallback) {
      setHazardDespawnCallback((id) => {
        engineRef.current?.removeServerHazard(id)
      })
    }
  }, [setHazardDespawnCallback])

  useEffect(() => {
    if (setTrapSpawnCallback) {
      setTrapSpawnCallback((trap) => {
        engineRef.current?.addServerTrap({
          id: trap.id,
          type: trap.type,
          position: { x: trap.x, y: trap.y },
          radius: trap.radius,
          effect: trap.effect,
          effectValue: trap.effectValue,
          cooldown: 3.0,
        })
      })
    }
  }, [setTrapSpawnCallback])

  useEffect(() => {
    if (setTrapDespawnCallback) {
      setTrapDespawnCallback((id) => {
        engineRef.current?.removeServerTrap(id)
      })
    }
  }, [setTrapDespawnCallback])
}
