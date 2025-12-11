/**
 * useGameLoop - Manages game engine lifecycle and game loop
 * 
 * Handles engine initialization, destruction, and state polling
 * 
 * @module hooks/useGameLoop
 */

import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { GameEngine } from '@/game'
import { wsService } from '@/services/websocket'
import type { Vector2, PowerUpState, FireEvent, HitEvent, DeathEvent, RespawnEvent } from '@/game'
import type { DeathReplay } from '@/game/telemetry'
import type { MapConfig } from '@/game/config/maps'

interface QuestionBroadcastData {
  qNum: number
  text: string
  options: string[]
  startTime: number
  totalTime: number
}

interface CallbackRefs {
  onPositionUpdate: MutableRefObject<((pos: Vector2) => void) | undefined>
  onPowerUpCollect: MutableRefObject<(id: number) => void>
  onCombatFire: MutableRefObject<((event: FireEvent) => void) | undefined>
  onCombatHit: MutableRefObject<((event: HitEvent) => void) | undefined>
  onCombatDeath: MutableRefObject<((event: DeathEvent) => void) | undefined>
  onCombatRespawn: MutableRefObject<((event: RespawnEvent) => void) | undefined>
}

interface UseGameLoopOptions {
  playerId: string
  isPlayer1: boolean
  mapConfig?: MapConfig
  combatEnabled: boolean
  callbackRefs: CallbackRefs
}

interface UseGameLoopResult {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>
  engineRef: MutableRefObject<GameEngine | null>
  engineReady: boolean
  isRespawning: boolean
  respawnTime: number
  lastDeathReplay: DeathReplay | null
  setLastDeathReplay: (replay: DeathReplay | null) => void
}

export function useGameLoop({
  playerId,
  isPlayer1,
  mapConfig,
  combatEnabled,
  callbackRefs,
}: UseGameLoopOptions): UseGameLoopResult {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  // Respawn UI state
  const [isRespawning, setIsRespawning] = useState(false)
  const [respawnTime, setRespawnTime] = useState(0)

  // Death replay state
  const [lastDeathReplay, setLastDeathReplay] = useState<DeathReplay | null>(null)
  
  // Engine ready state - triggers re-render for dependent hooks
  const [engineReady, setEngineReady] = useState(false)

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current, mapConfig)
    engine.initLocalPlayer(playerId, isPlayer1)
    engine.setCallbacks({
      onPositionUpdate: (pos) => callbackRefs.onPositionUpdate.current?.(pos),
      onPowerUpCollect: (id) => callbackRefs.onPowerUpCollect.current(id),
      onCombatFire: (event) => callbackRefs.onCombatFire.current?.(event),
      onCombatHit: (event) => callbackRefs.onCombatHit.current?.(event),
      onCombatDeath: (event) => callbackRefs.onCombatDeath.current?.(event),
      onCombatRespawn: (event) => callbackRefs.onCombatRespawn.current?.(event),
      onDeathReplayReady: (replay) => {
        setLastDeathReplay(replay)
        // Upload replay to server
        wsService.sendDeathReplay({
          victimId: replay.victimId,
          killerId: replay.killerId,
          deathTick: replay.deathTick,
          frames: replay.frames,
        })
      },
    })
    engine.start()
    engineRef.current = engine
    setEngineReady(true)

    return () => {
      engine.destroy()
      engineRef.current = null
      setEngineReady(false)
    }
    // Note: callbackRefs intentionally excluded - refs are stable, including the object
    // would cause engine recreation on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, isPlayer1, mapConfig])

  // Enable/disable combat
  useEffect(() => {
    engineRef.current?.setCombatEnabled(combatEnabled)
  }, [combatEnabled])

  // Detect mobile and enable boosted aim assist
  useEffect(() => {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    engineRef.current?.setMobileMode(isMobile)
  }, [playerId]) // Re-check when engine is recreated

  // Poll respawn state for UI
  useEffect(() => {
    if (!combatEnabled) {
      setIsRespawning(false)
      return
    }

    const interval = setInterval(() => {
      const engine = engineRef.current
      if (!engine) return

      const respawning = engine.isLocalPlayerRespawning()
      setIsRespawning(respawning)

      if (respawning) {
        setRespawnTime(engine.getLocalPlayerRespawnTime())
      }
    }, 50) // Update at 20fps for smooth countdown

    return () => clearInterval(interval)
  }, [combatEnabled])

  // Handle resize - including visualViewport for mobile browser chrome changes
  useEffect(() => {
    const handleResize = () => engineRef.current?.resize()
    window.addEventListener('resize', handleResize)
    
    // On mobile, visualViewport resize fires when browser chrome appears/disappears
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return {
    canvasRef,
    engineRef,
    engineReady,
    isRespawning,
    respawnTime,
    lastDeathReplay,
    setLastDeathReplay,
  }
}

/**
 * useOpponentSync - Manages opponent state synchronization
 */
export function useOpponentSync(
  engineRef: MutableRefObject<GameEngine | null>,
  opponentId: string | undefined,
  opponentPosition: Vector2 | null | undefined,
  isPlayer1: boolean,
  engineReady: boolean = true
): void {
  // Set up opponent as soon as we have their ID and engine is ready
  useEffect(() => {
    console.log('[useOpponentSync] Effect triggered:', { opponentId, engineReady, hasEngine: !!engineRef.current })
    if (opponentId && engineRef.current && engineReady) {
      const isOpponentPlayer1 = !isPlayer1
      const defaultSpawn = isOpponentPlayer1 
        ? { x: 160, y: 360 }
        : { x: 1120, y: 360 }
      
      console.log('[useOpponentSync] Setting opponent:', { opponentId, defaultSpawn, isOpponentPlayer1 })
      engineRef.current.setOpponent({
        id: opponentId,
        position: defaultSpawn,
        trail: [],
        isLocal: false,
        isPlayer1: isOpponentPlayer1,
      }, isOpponentPlayer1)
    }
    // Note: engineRef is a stable ref, excluding from deps to prevent unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentId, isPlayer1, engineReady])

  // Update opponent position when we receive updates
  useEffect(() => {
    if (opponentPosition && engineRef.current) {
      engineRef.current.updateOpponentPosition(opponentPosition)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentPosition])
}

/**
 * usePowerUpSync - Manages power-up state synchronization
 */
export function usePowerUpSync(
  engineRef: MutableRefObject<GameEngine | null>,
  powerUps: PowerUpState[]
): void {
  useEffect(() => {
    engineRef.current?.setPowerUps(powerUps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [powerUps])
}

/**
 * useQuestionBroadcast - Manages question broadcast display
 */
export function useQuestionBroadcast(
  engineRef: MutableRefObject<GameEngine | null>,
  questionBroadcast?: {
    question: QuestionBroadcastData | null
    selectedAnswer: string | null
    answerSubmitted: boolean
    visible: boolean
  }
): void {
  useEffect(() => {
    if (questionBroadcast) {
      engineRef.current?.setQuestionBroadcast(
        questionBroadcast.question,
        questionBroadcast.selectedAnswer,
        questionBroadcast.answerSubmitted,
        questionBroadcast.visible
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionBroadcast])
}
