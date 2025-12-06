/**
 * ArenaGame - Unified game page combining PvP arena with quiz system
 * Clean, minimal UI - questions integrated into top scoreboard bar
 */

import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard } from '@/components/game/ArenaScoreboard'
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
  } = useArenaGame(code)

  const { localPlayerId, currentQuestion, selectedAnswer, answerSubmitted } = useGameStore()

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

  // Build question broadcast state for in-arena display
  const questionBroadcast = {
    question: currentQuestion ? {
      qNum: currentQuestion.qNum,
      text: currentQuestion.text,
      options: currentQuestion.options,
      startTime: currentQuestion.startTime,
      totalTime: 30000, // 30 seconds
    } : null,
    selectedAnswer,
    answerSubmitted,
    visible: showQuestion && !!currentQuestion,
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Scoreboard header with integrated question */}
      <ArenaScoreboard
        localHealth={localHealth}
        opponentHealth={opponentHealth}
        showHealth={true}
        showQuestion={showQuestion}
        onAnswer={sendAnswer}
      />

      {/* Main game area */}
      <div className="flex-1 relative p-3 min-h-0">
        {/* Arena container */}
        <div className="h-full relative rounded-lg overflow-hidden border border-white/[0.06]">
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
            questionBroadcast={questionBroadcast}
          />

          {/* Round result toast */}
          <RoundResultOverlay visible={showRoundResult} />
        </div>

        {/* Controls hint + Latency - bottom left corner */}
        <div className="absolute bottom-6 left-6 hidden lg:flex items-center gap-2">
          <LatencyIndicator />
          <div className="px-3 py-2 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/[0.08] rounded-lg">
            <p className="text-[10px] text-neutral-500 font-mono">
              WASD move · Click shoot · 1-4 answer
            </p>
          </div>
        </div>

        {/* Leave button - bottom right corner */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={leaveGame}
            className="px-3 py-2 text-xs text-neutral-600 hover:text-red-400 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/[0.08] rounded-lg transition-colors"
          >
            Leave Match
          </button>
        </div>
      </div>
    </div>
  )
}
