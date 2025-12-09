/**
 * ArenaGame - Unified game page combining PvP arena with quiz system
 * Layout: Scoreboard → Canvas → Quiz Panel (stacked vertically)
 * Quiz panel is HTML/CSS outside canvas for crisp text and touch support
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard, type KillFeedEntry } from '@/components/game/ArenaScoreboard'
import { ArenaQuizPanel } from '@/components/game/ArenaQuizPanel'
import { RoundResultOverlay } from '@/components/game/RoundResultOverlay'
import { LatencyIndicator } from '@/components/game/LatencyIndicator'
import { useArenaGame } from '@/hooks/useArenaGame'
import { useGameStore } from '@/stores/gameStore'
import { wsService } from '@/services/websocket'
import type { Vector2, FireEvent, HitEvent, DeathEvent } from '@/game'
import type { StateUpdatePayload, CombatRespawnPayload } from '@/types/websocket'

export function ArenaGame() {
  const { code } = useParams<{ code: string }>()
  const [showRotateHint, setShowRotateHint] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Show landscape recommendation on mobile portrait (dismissible)
  // Also track if we're in mobile landscape mode for overlay quiz
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 1024
      const portrait = window.innerHeight > window.innerWidth
      const landscape = window.innerWidth > window.innerHeight
      
      // Show hint if mobile + portrait + not dismissed
      setShowRotateHint(isMobile && portrait && !hintDismissed)
      
      // Use overlay quiz mode on mobile landscape (especially fullscreen)
      setIsMobileLandscape(isMobile && landscape)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [hintDismissed])

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

  const { localPlayerId, localPlayerName, opponentName } = useGameStore()

  const [localHealth, setLocalHealth] = useState({ playerId: '', health: 100, maxHealth: 100 })
  const [opponentHealth, setOpponentHealth] = useState({ playerId: '', health: 100, maxHealth: 100 })
  
  // Kill feed state
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([])
  const killFeedIdRef = useRef(0)
  
  // Add entry to kill feed
  const addKillFeedEntry = useCallback((text: string, type: KillFeedEntry['type']) => {
    const entry: KillFeedEntry = {
      id: `kf_${killFeedIdRef.current++}`,
      text,
      type,
      timestamp: Date.now(),
    }
    setKillFeed(prev => [...prev.slice(-9), entry]) // Keep last 10
  }, [])
  
  // Clean up old kill feed entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setKillFeed(prev => prev.filter(e => now - e.timestamp < 4000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Position updates are now batched by the WebSocket service at 60fps
  // No manual throttling needed - just send every position change
  const handlePositionUpdate = useCallback(
    (position: Vector2) => {
      sendPosition?.(position)
    },
    [sendPosition]
  )

  const handlePowerUpCollect = useCallback((_powerUpId: number) => {
    // Power-up collected
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
      
      // Add to kill feed - determine who landed the hit
      const isLocalHit = event.targetId !== localPlayerId
      const attackerName = isLocalHit ? (localPlayerName || 'You') : (opponentName || 'Opponent')
      addKillFeedEntry(`${attackerName} landed a hit!`, 'hit')
    },
    [sendCombatEvent, localPlayerId, localPlayerName, opponentName, addKillFeedEntry]
  )

  const handleCombatDeath = useCallback(
    (event: DeathEvent) => {
      sendCombatEvent('kill', {
        victim_id: event.playerId,
        weapon: 'projectile',
      })
      
      // Add elimination to kill feed
      const isLocalDeath = event.playerId === localPlayerId
      const victimName = isLocalDeath ? (localPlayerName || 'You') : (opponentName || 'Opponent')
      const killerName = isLocalDeath ? (opponentName || 'Opponent') : (localPlayerName || 'You')
      addKillFeedEntry(`${killerName} eliminated ${victimName}!`, 'kill')
    },
    [sendCombatEvent, localPlayerId, localPlayerName, opponentName, addKillFeedEntry]
  )
  
  // Subscribe to WebSocket events for HUD updates
  useEffect(() => {
    if (!code) return
    
    // Listen for state updates to track health
    const unsubState = wsService.on('state_update', (payload) => {
      const data = payload as StateUpdatePayload
      if (data.combat) {
        for (const [pid, combat] of Object.entries(data.combat.players)) {
          if (pid === localPlayerId) {
            setLocalHealth({ playerId: pid, health: combat.health, maxHealth: combat.max_health })
          } else {
            setOpponentHealth({ playerId: pid, health: combat.health, maxHealth: combat.max_health })
          }
        }
      }
    })
    
    // Listen for respawn events
    const unsubRespawn = wsService.on('combat_respawn', (payload) => {
      const data = payload as CombatRespawnPayload
      const playerName = data.player_id === localPlayerId ? (localPlayerName || 'You') : (opponentName || 'Opponent')
      addKillFeedEntry(`${playerName} respawned`, 'respawn')
    })
    
    return () => {
      unsubState()
      unsubRespawn()
    }
  }, [code, localPlayerId, localPlayerName, opponentName, addKillFeedEntry])

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
    <>
      {/* Rotate device hint overlay - dismissible */}
      {showRotateHint && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center px-8">
          {/* Animated phone rotation icon */}
          <div className="w-20 h-20 mb-6 text-purple-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-[spin_3s_ease-in-out_infinite]" style={{ animationDirection: 'alternate' }}>
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M12 18h.01" />
            </svg>
          </div>
          <p className="text-white text-xl font-semibold text-center mb-2">Rotate Your Device</p>
          <p className="text-neutral-400 text-sm text-center mb-8 max-w-xs">
            Turn your phone sideways for the best arena experience with full controls
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={async () => {
                setHintDismissed(true)
                // Try to enter fullscreen and lock landscape
                try {
                  const docEl = document.documentElement
                  if (docEl.requestFullscreen) {
                    await docEl.requestFullscreen()
                  }
                  // Try to lock orientation (may not be supported)
                  const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }
                  if (orientation?.lock) {
                    try {
                      await orientation.lock('landscape')
                    } catch {
                      // Orientation lock not supported
                    }
                  }
                } catch {
                  // Ignore errors - user can still play
                }
              }}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Enter Fullscreen & Play
            </button>
            <button
              onClick={() => setHintDismissed(true)}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white/70 text-sm font-medium rounded-xl transition-colors"
            >
              Continue in Portrait
            </button>
          </div>
        </div>
      )}

      {/* Main game UI */}
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden safe-area-top">
      {/* Scoreboard header - health bars and activity feed */}
      <ArenaScoreboard
        localHealth={localHealth}
        opponentHealth={opponentHealth}
        showHealth={true}
        showQuestion={showQuestion}
        onAnswer={sendAnswer}
        killFeed={killFeed}
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

          {/* Mobile kill feed - top right of canvas (hidden on desktop where it's in scoreboard) */}
          {killFeed.length > 0 && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 sm:hidden">
              {killFeed.slice(-3).map((entry) => (
                <div
                  key={entry.id}
                  className={`px-2 py-1 rounded text-[10px] font-medium backdrop-blur-sm bg-black/60 border border-white/10 ${
                    entry.type === 'kill' ? 'text-red-400' :
                    entry.type === 'hit' ? 'text-orange-400' :
                    entry.type === 'quiz' ? 'text-green-400' :
                    'text-blue-400'
                  }`}
                >
                  {entry.text}
                </div>
              ))}
            </div>
          )}

          {/* Controls hint + Latency - bottom left corner of canvas */}
          <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 flex items-center gap-2 z-10 safe-area-bottom">
            <LatencyIndicator />
            {/* Desktop controls only - mobile controls are self-explanatory */}
            <div className="hidden lg:block px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
              <p className="text-[9px] text-neutral-500 font-mono">
                WASD move · Click shoot · 1-4 answer
              </p>
            </div>
          </div>

          {/* Leave button - bottom right corner of canvas (above mobile controls) */}
          <div className="absolute bottom-3 right-3 z-10 safe-area-bottom" style={{ bottom: isMobileLandscape ? '140px' : '12px' }}>
            <div className="flex gap-2">
              {/* Exit fullscreen button - only show when in fullscreen */}
              {isFullscreen && (
                <button
                  onClick={() => document.exitFullscreen?.()}
                  className="px-2 py-1.5 text-[10px] text-neutral-500 hover:text-white bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px]"
                >
                  Exit FS
                </button>
              )}
              <button
                onClick={leaveGame}
                className="px-2 py-1.5 text-[10px] text-neutral-600 hover:text-red-400 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px] min-w-[44px]"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz panel - overlay on mobile landscape, below canvas on desktop/portrait */}
      {isMobileLandscape ? (
        // Overlay mode for mobile landscape - renders as fixed position at top
        <ArenaQuizPanel
          onAnswer={sendAnswer}
          visible={showQuestion}
          overlayMode={true}
        />
      ) : (
        // Standard mode - below canvas
        <ArenaQuizPanel
          onAnswer={sendAnswer}
          visible={showQuestion}
        />
      )}
    </div>
    </>
  )
}
