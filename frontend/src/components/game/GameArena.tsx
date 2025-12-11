/**
 * GameArena - React component wrapping the game engine
 * Handles lifecycle and bridges React state with game engine
 * Supports both desktop (keyboard/mouse) and mobile (touch) controls
 */

import { useState, useImperativeHandle, forwardRef } from 'react'
import { RespawnOverlay } from './RespawnOverlay'
import { MobileControls } from './MobileControls'
import { DeathReplayModal } from '@/components/replay'
import { wsService } from '@/services/websocket'
import { useCallbackRefs, useServerCallbacks, useArenaCallbacks } from '@/hooks/useGameArenaCallbacks'
import { useGameLoop, useOpponentSync, usePowerUpSync, useQuestionBroadcast } from '@/hooks/useGameLoop'
import { useArenaInput } from '@/hooks/useArenaInput'
import { useArenaCosmetics } from '@/hooks/useArenaCosmetics'
import { useArenaConfig } from '@/hooks/useArenaConfig'
import type { Vector2, PowerUpState, FireEvent, HitEvent, DeathEvent, RespawnEvent } from '@/game'
import type { MapConfig } from '@/game/config/maps'

interface QuestionBroadcastData {
  qNum: number
  text: string
  options: string[]
  startTime: number
  totalTime: number
}

interface GameArenaProps {
  playerId: string
  isPlayer1: boolean
  opponentId?: string
  opponentPosition?: Vector2 | null
  powerUps: PowerUpState[]
  onPositionUpdate: (position: Vector2) => void
  onPowerUpCollect: (powerUpId: number) => void
  mapConfig?: MapConfig
  combatEnabled?: boolean
  onCombatFire?: (event: FireEvent) => void
  onCombatHit?: (event: HitEvent) => void
  onCombatDeath?: (event: DeathEvent) => void
  onCombatRespawn?: (event: RespawnEvent) => void
  setOpponentPositionCallback?: (callback: (pos: Vector2) => void) => void
  setServerProjectilesCallback?: (callback: (projectiles: import('@/game').Projectile[]) => void) => void
  setServerHealthCallback?: (callback: (playerId: string, health: number, maxHealth: number) => void) => void
  setServerDeathCallback?: (callback: (playerId: string, killerId: string) => void) => void
  setServerRespawnCallback?: (callback: (playerId: string, x: number, y: number) => void) => void
  setHazardDamageCallback?: (callback: (playerId: string, damage: number) => void) => void
  setTrapTriggeredCallback?: (callback: (data: { id: string; effect: string; value: number; affected_players: string[]; x: number; y: number; knockbacks?: Record<string, { dx: number; dy: number }> }) => void) => void
  setTeleportCallback?: (callback: (playerId: string, toX: number, toY: number) => void) => void
  setJumpPadCallback?: (callback: (playerId: string, vx: number, vy: number) => void) => void
  setHazardSpawnCallback?: (callback: (hazard: { id: string; type: string; bounds: { x: number; y: number; width: number; height: number }; intensity: number }) => void) => void
  setHazardDespawnCallback?: (callback: (id: string) => void) => void
  setTrapSpawnCallback?: (callback: (trap: { id: string; type: string; x: number; y: number; radius: number; effect: string; effectValue: number }) => void) => void
  setTrapDespawnCallback?: (callback: (id: string) => void) => void
  sendArenaConfig?: (config: unknown) => void
  questionBroadcast?: {
    question: QuestionBroadcastData | null
    selectedAnswer: string | null
    answerSubmitted: boolean
    visible: boolean
  }
  setBuffUpdateCallback?: (callback: (buffs: Record<string, Array<{ type: string; value: number; remaining: number; source: string }>>) => void) => void
  setRemoteEmoteCallback?: (callback: (playerId: string, emoteId: string) => void) => void
  sendEmote?: (emoteId: string) => void
  inventoryEmotes?: Array<{ id: string; name: string; image_url: string }>
  equippedEmoteId?: string | null
  equippedSkin?: {
    skinId?: string
    spriteSheetUrl?: string
    metadataUrl?: string
  } | null
  opponentSkin?: {
    skinId?: string
    spriteSheetUrl?: string
    metadataUrl?: string
  } | null
}

export interface GameArenaRef {
  fire: () => void
  setMobileVelocity: (velocity: Vector2) => void
}

export const GameArena = forwardRef<GameArenaRef, GameArenaProps>(function GameArena({
  playerId,
  isPlayer1,
  opponentId,
  opponentPosition,
  powerUps,
  onPositionUpdate,
  onPowerUpCollect,
  mapConfig,
  combatEnabled = false,
  onCombatFire,
  onCombatHit,
  onCombatDeath,
  onCombatRespawn,
  setOpponentPositionCallback,
  setServerProjectilesCallback,
  setServerHealthCallback,
  setServerDeathCallback,
  setServerRespawnCallback,
  setHazardDamageCallback,
  setTrapTriggeredCallback,
  setTeleportCallback,
  setJumpPadCallback,
  setHazardSpawnCallback,
  setHazardDespawnCallback,
  setTrapSpawnCallback,
  setTrapDespawnCallback,
  sendArenaConfig,
  questionBroadcast,
  setBuffUpdateCallback,
  setRemoteEmoteCallback,
  sendEmote,
  inventoryEmotes,
  equippedEmoteId,
  equippedSkin,
  opponentSkin,
}, ref) {
  // Death replay modal state
  const [showReplayModal, setShowReplayModal] = useState(false)

  // Callback refs for stable references
  const callbackRefs = useCallbackRefs(
    onPositionUpdate,
    onPowerUpCollect,
    onCombatFire,
    onCombatHit,
    onCombatDeath,
    onCombatRespawn
  )

  // Game loop and engine lifecycle
  const {
    canvasRef,
    engineRef,
    engineReady,
    isRespawning,
    respawnTime,
    lastDeathReplay,
  } = useGameLoop({
    playerId,
    isPlayer1,
    mapConfig,
    combatEnabled,
    callbackRefs,
  })

  // Input handling
  const {
    mobileVelocityRef,
    handleMouseMove,
    handleMouseDown,
    handleTouchMove,
    handleMobileMove,
    handleMobileFire,
    handleMobileFireDirection,
  } = useArenaInput({ engineRef, combatEnabled })

  // Server callbacks
  useServerCallbacks(engineRef, playerId, {
    setOpponentPositionCallback,
    setServerProjectilesCallback,
    setServerHealthCallback,
    setServerDeathCallback,
    setServerRespawnCallback,
    setBuffUpdateCallback,
  })

  // Arena callbacks
  useArenaCallbacks(engineRef, playerId, {
    setHazardDamageCallback,
    setTrapTriggeredCallback,
    setTeleportCallback,
    setJumpPadCallback,
    setHazardSpawnCallback,
    setHazardDespawnCallback,
    setTrapSpawnCallback,
    setTrapDespawnCallback,
  })

  // Opponent synchronization
  useOpponentSync(engineRef, opponentId, opponentPosition, isPlayer1, engineReady)

  // Power-up synchronization
  usePowerUpSync(engineRef, powerUps)

  // Question broadcast
  useQuestionBroadcast(engineRef, questionBroadcast)

  // Cosmetics (emotes and skins)
  useArenaCosmetics({
    engineRef,
    playerId,
    opponentId,
    setRemoteEmoteCallback,
    sendEmote,
    inventoryEmotes,
    equippedEmoteId,
    equippedSkin,
    opponentSkin,
  })

  // Arena config
  useArenaConfig({
    engineRef,
    playerId,
    isPlayer1,
    sendArenaConfig,
  })

  // Expose methods via ref for external control
  useImperativeHandle(ref, () => ({
    fire: () => engineRef.current?.handleFire(),
    setMobileVelocity: (velocity: Vector2) => {
      mobileVelocityRef.current = velocity
      engineRef.current?.setMobileVelocity?.(velocity)
    },
  }), [mobileVelocityRef])

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 relative">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full touch-none"
        onMouseMove={combatEnabled ? handleMouseMove : undefined}
        onMouseDown={combatEnabled ? handleMouseDown : undefined}
        onTouchMove={combatEnabled ? handleTouchMove : undefined}
      />
      {/* Respawn overlay */}
      <RespawnOverlay
        visible={isRespawning}
        timeRemaining={respawnTime}
        hasReplay={!!lastDeathReplay}
        onWatchReplay={() => setShowReplayModal(true)}
      />

      {/* Death replay modal */}
      {showReplayModal && lastDeathReplay && (
        <DeathReplayModal
          replay={lastDeathReplay}
          onClose={() => setShowReplayModal(false)}
          onReport={(reason) => {
            wsService.flagDeath(lastDeathReplay.id, reason)
            setShowReplayModal(false)
          }}
        />
      )}

      {/* Mobile controls */}
      {combatEnabled && (
        <MobileControls
          onMove={handleMobileMove}
          onFire={handleMobileFire}
          onFireDirection={handleMobileFireDirection}
          enabled={!isRespawning}
        />
      )}
    </div>
  )
})
