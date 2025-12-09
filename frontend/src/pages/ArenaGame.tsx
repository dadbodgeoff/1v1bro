/**
 * ArenaGame - Unified game page combining PvP arena with quiz system
 * Layout: Scoreboard → Canvas → Quiz Panel (stacked vertically)
 * Quiz panel is HTML/CSS outside canvas for crisp text and touch support
 */

import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard } from '@/components/game/ArenaScoreboard'
import { ArenaQuizPanel } from '@/components/game/ArenaQuizPanel'
import { RoundResultOverlay } from '@/components/game/RoundResultOverlay'
import { LatencyIndicator } from '@/components/game/LatencyIndicator'
import { useArenaGame } from '@/hooks/useArenaGame'
import { useGameStore } from '@/stores/gameStore'
import type { Vector2, FireEvent, HitEvent, DeathEvent } from '@/game'

export function ArenaGame() {
  const { code } = useParams<{ code: string }>()

  const {
    status,
    isPlayer1,
    opponentId,
    opponentPosition,
    powerUps,
    sendAnswer,
    sendPosition,
    sendFire,
    sendCombatEvent,
    sendArenaConfig,
    leaveGame,
    setOpponentPositionCallback,
    setServerProjectilesCallback,
    setServerHealthCallback,
    setServerDeathCallback,
    setServerRespawnCallback,
    setBuffUpdateCallback,
    // Arena callbacks
    setHazardDamageCallback,
    setTrapTriggeredCallback,
    setTeleportCallback,
    setJumpPadCallback,
    // Emote callbacks (Requirement 5.3)
    sendEmote,
    setRemoteEmoteCallback,
    // Cosmetics
    equippedSkin,
    opponentSkin,
    // Map
    mapConfig,
  } = useArenaGame(code)

  const { localPlayerId } = useGameStore()

  const [localHealth] = useState({ playerId: '', health: 100, maxHealth: 100 })
  const [opponentHealth] = useState({ playerId: '', health: 100, maxHealth: 100 })

  // Position updates are now batched by the WebSocket service at 60fps
  // No manual throttling needed - just send every position change
  const handlePositionUpdate = useCallback(
    (position: Vector2) => {
      sendPosition?.(position)
    },
    [sendPosition]
  )

  const handlePowerUpCollect = useCallback((powerUpId: number) => {
    console.log('Collected powerup:', powerUpId)
  }, [])

  const handleCombatFire = useCallback(
    (event: FireEvent) => {
      // Send fire to server for authoritative combat
      sendFire(event.direction)
      // Also track for stats
      sendCombatEvent('shot', { hit: false })
    },
    [sendFire, sendCombatEvent]
  )

  const handleCombatHit = useCallback(
    (event: HitEvent) => {
      sendCombatEvent('damage', {
        target_id: event.targetId,
        amount: event.damage,
        source: 'projectile',
      })
      sendCombatEvent('shot', { hit: true })
    },
    [sendCombatEvent]
  )

  const handleCombatDeath = useCallback(
    (event: DeathEvent) => {
      sendCombatEvent('kill', {
        victim_id: event.playerId,
        weapon: 'projectile',
      })
    },
    [sendCombatEvent]
  )

  // Loading state
  if (status === 'idle' || status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-4" />
        <p className="text-neutral-500 text-sm">Waiting for opponent...</p>
      </div>
    )
  }

  // Countdown state
  if (status === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <p className="text-4xl font-semibold text-white tracking-tight">Ready</p>
        <p className="text-neutral-500 text-sm mt-2">Match starting...</p>
      </div>
    )
  }

  const showQuestion = status === 'playing'
  const showRoundResult = status === 'round_result'

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden safe-area-top">
      {/* Scoreboard header - scores only, no question */}
      <ArenaScoreboard
        localHealth={localHealth}
        opponentHealth={opponentHealth}
        showHealth={true}
        showQuestion={false}
        onAnswer={sendAnswer}
      />

      {/* Main game area - canvas fills available space */}
      <div className="flex-1 relative min-h-0">
        {/* Arena container - no padding, full bleed */}
        <div className="h-full relative">
          <GameArena
            playerId={localPlayerId || 'player'}
            isPlayer1={isPlayer1}
            opponentId={opponentId || undefined}
            opponentPosition={opponentPosition}
            powerUps={powerUps}
            onPositionUpdate={handlePositionUpdate}
            onPowerUpCollect={handlePowerUpCollect}
            combatEnabled={true}
            onCombatFire={handleCombatFire}
            onCombatHit={handleCombatHit}
            onCombatDeath={handleCombatDeath}
            setOpponentPositionCallback={setOpponentPositionCallback}
            setServerProjectilesCallback={setServerProjectilesCallback}
            setServerHealthCallback={setServerHealthCallback}
            setServerDeathCallback={setServerDeathCallback}
            setServerRespawnCallback={setServerRespawnCallback}
            setBuffUpdateCallback={setBuffUpdateCallback}
            setHazardDamageCallback={setHazardDamageCallback}
            setTrapTriggeredCallback={setTrapTriggeredCallback}
            setTeleportCallback={setTeleportCallback}
            setJumpPadCallback={setJumpPadCallback}
            sendArenaConfig={sendArenaConfig}
            sendEmote={sendEmote}
            setRemoteEmoteCallback={setRemoteEmoteCallback}
            equippedSkin={equippedSkin}
            opponentSkin={opponentSkin}
            mapConfig={mapConfig}
          />

          {/* Round result toast - overlaid on canvas */}
          <RoundResultOverlay visible={showRoundResult} />

          {/* Controls hint + Latency - bottom left corner of canvas */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10 safe-area-bottom">
            <LatencyIndicator />
            {/* Desktop controls */}
            <div className="hidden lg:block px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
              <p className="text-[9px] text-neutral-500 font-mono">
                WASD move · Click shoot · 1-4 answer
              </p>
            </div>
            {/* Mobile controls */}
            <div className="lg:hidden px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
              <p className="text-[9px] text-neutral-500 font-mono">
                Tap to shoot · Drag to move
              </p>
            </div>
          </div>

          {/* Leave button - bottom right corner of canvas */}
          <div className="absolute bottom-3 right-3 z-10 safe-area-bottom">
            <button
              onClick={leaveGame}
              className="px-2 py-1.5 text-[10px] text-neutral-600 hover:text-red-400 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px] min-w-[44px]"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Quiz panel - BELOW canvas, HTML/CSS for crisp text */}
      <ArenaQuizPanel
        onAnswer={sendAnswer}
        visible={showQuestion}
      />
    </div>
  )
}
