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
  // Local hazard/trap damage callbacks for offline/bot modes
  onLocalHazardDamage?: (playerId: string, damage: number) => void
  onLocalTrapTriggered?: (playerId: string, damage: number) => void
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
  onLocalHazardDamage,
  onLocalTrapTriggered,
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
    onCombatRespawn,
    onLocalHazardDamage,
    onLocalTrapTriggered
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

  // Check if using simple theme for special styling
  const isSimpleTheme = mapConfig?.metadata?.theme === 'simple'
  const hexBgUrl = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2012,%202025%20-%2012_04AM.jpeg'

  // Show loading indicator until engine is ready (assets loaded)
  const showLoadingOverlay = !engineReady

  return (
    <div 
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={isSimpleTheme ? {
        backgroundColor: 'var(--color-bg-base)',
        backgroundImage: `url(${hexBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {
        backgroundColor: 'var(--color-bg-base)',
      }}
    >
      {/* Loading overlay - shows while assets are loading */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-white/80 rounded-full animate-spin" />
            </div>
            <span className="text-xs text-white/60 font-mono tracking-wide">Loading arena...</span>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}
      {/* Canvas container - needs w-full h-full for resize calculations */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Inner wrapper for simple theme floating island effect */}
        <div
          className="relative"
          style={isSimpleTheme ? {
            boxShadow: '0 0 40px 20px rgba(0, 0, 0, 0.4), 0 0 80px 40px rgba(0, 0, 0, 0.2)',
            border: '2px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
          } : undefined}
        >
          <canvas
            ref={canvasRef}
            className="touch-none block"
            style={isSimpleTheme ? {
              filter: 'saturate(95%) contrast(102%)',
            } : undefined}
            onMouseMove={combatEnabled ? handleMouseMove : undefined}
            onMouseDown={combatEnabled ? handleMouseDown : undefined}
            onTouchMove={combatEnabled ? handleTouchMove : undefined}
          />
          
          {/* Subtle vignette overlay for simple theme - reduced intensity */}
          {isSimpleTheme && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, transparent 60%, rgba(0, 10, 20, 0.25) 100%)',
                boxShadow: 'inset 0 0 60px 20px rgba(0, 0, 0, 0.15)',
                borderRadius: '4px',
              }}
            />
          )}
        </div>
      </div>

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
