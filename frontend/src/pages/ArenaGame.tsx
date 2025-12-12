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
import { PWAInstallPrompt } from '@/components/game/PWAInstallPrompt'
import { ArenaGameSetup, RotateDeviceHint } from '@/components/game/ArenaGameSetup'
import { 
  MobileLandscapeHUD, 
  MobileKillFeed, 
  ControlsHint, 
  LeaveButton 
} from '@/components/game/ArenaGameHUD'
import { useArenaGame } from '@/hooks/useArenaGame'
import { useGameStore } from '@/stores/gameStore'
import { wsService } from '@/services/websocket'
import { BREAKPOINTS } from '@/utils/breakpoints'
import type { Vector2, FireEvent, HitEvent, DeathEvent } from '@/game'
import type { StateUpdatePayload, CombatRespawnPayload } from '@/types/websocket'

export function ArenaGame() {
  const { code } = useParams<{ code: string }>()
  const [showRotateHint, setShowRotateHint] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

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

  // Orientation and viewport tracking
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < BREAKPOINTS.tablet
      const portrait = window.innerHeight > window.innerWidth
      const landscape = window.innerWidth > window.innerHeight
      
      setShowRotateHint(isMobile && portrait && !hintDismissed)
      setIsMobileLandscape(isMobile && landscape)
      
      if (window.visualViewport) {
        setViewportSize({ width: window.visualViewport.width, height: window.visualViewport.height })
      } else {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight })
      }
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    window.visualViewport?.addEventListener('resize', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
      window.visualViewport?.removeEventListener('resize', checkOrientation)
    }
  }, [hintDismissed])

  const handleFullscreenRequest = useCallback(async () => {
    setHintDismissed(true)
    try {
      await document.documentElement.requestFullscreen?.()
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
      await orientation?.lock?.('landscape').catch(() => {})
    } catch { /* ignore */ }
  }, [])

  const {
    status, isPlayer1, opponentId, opponentPosition, powerUps,
    sendAnswer, sendPosition, sendFire, sendCombatEvent, sendArenaConfig, leaveGame,
    setOpponentPositionCallback, setServerProjectilesCallback, setServerHealthCallback,
    setServerDeathCallback, setServerRespawnCallback, setBuffUpdateCallback,
    setHazardDamageCallback, setTrapTriggeredCallback, setTeleportCallback, setJumpPadCallback,
    setHazardSpawnCallback, setHazardDespawnCallback, setTrapSpawnCallback, setTrapDespawnCallback,
    sendEmote, setRemoteEmoteCallback, equippedSkin, opponentSkin, mapConfig,
  } = useArenaGame(code)

  const { localPlayerId, localPlayerName, opponentName } = useGameStore()

  const [localHealth, setLocalHealth] = useState({ playerId: '', health: 100, maxHealth: 100 })
  const [opponentHealth, setOpponentHealth] = useState({ playerId: '', health: 100, maxHealth: 100 })
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([])
  const killFeedIdRef = useRef(0)
  
  const addKillFeedEntry = useCallback((text: string, type: KillFeedEntry['type']) => {
    const entry: KillFeedEntry = {
      id: `kf_${killFeedIdRef.current++}`,
      text,
      type,
      timestamp: Date.now(),
    }
    setKillFeed(prev => [...prev.slice(-9), entry])
  }, [])
  
  // Clean up old kill feed entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setKillFeed(prev => prev.filter(e => now - e.timestamp < 4000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handlePositionUpdate = useCallback((position: Vector2) => sendPosition?.(position), [sendPosition])
  const handlePowerUpCollect = useCallback((_powerUpId: number) => {}, [])

  const handleCombatFire = useCallback((event: FireEvent) => {
    sendFire(event.direction)
    sendCombatEvent('shot', { hit: false })
  }, [sendFire, sendCombatEvent])

  const handleCombatHit = useCallback((event: HitEvent) => {
    sendCombatEvent('damage', { target_id: event.targetId, amount: event.damage, source: 'projectile' })
    sendCombatEvent('shot', { hit: true })
    const isLocalHit = event.targetId !== localPlayerId
    const attackerName = isLocalHit ? (localPlayerName || 'You') : (opponentName || 'Opponent')
    addKillFeedEntry(`${attackerName} landed a hit!`, 'hit')
  }, [sendCombatEvent, localPlayerId, localPlayerName, opponentName, addKillFeedEntry])

  const handleCombatDeath = useCallback((event: DeathEvent) => {
    sendCombatEvent('kill', { victim_id: event.playerId, weapon: 'projectile' })
    const isLocalDeath = event.playerId === localPlayerId
    const victimName = isLocalDeath ? (localPlayerName || 'You') : (opponentName || 'Opponent')
    const killerName = isLocalDeath ? (opponentName || 'Opponent') : (localPlayerName || 'You')
    addKillFeedEntry(`${killerName} eliminated ${victimName}!`, 'kill')
  }, [sendCombatEvent, localPlayerId, localPlayerName, opponentName, addKillFeedEntry])
  
  // Subscribe to WebSocket events for HUD updates
  useEffect(() => {
    if (!code) return
    
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
    
    const unsubRespawn = wsService.on('combat_respawn', (payload) => {
      const data = payload as CombatRespawnPayload
      const playerName = data.player_id === localPlayerId ? (localPlayerName || 'You') : (opponentName || 'Opponent')
      addKillFeedEntry(`${playerName} respawned`, 'respawn')
    })
    
    return () => { unsubState(); unsubRespawn() }
  }, [code, localPlayerId, localPlayerName, opponentName, addKillFeedEntry])

  // Loading/countdown states
  if (status === 'idle' || status === 'waiting' || status === 'countdown') {
    return <ArenaGameSetup status={status} />
  }

  const showQuestion = status === 'playing'
  const showRoundResult = status === 'round_result'

  return (
    <>
      <PWAInstallPrompt />
      <RotateDeviceHint 
        visible={showRotateHint} 
        onDismiss={() => setHintDismissed(true)} 
        onFullscreen={handleFullscreenRequest} 
      />

      <div 
        className={`flex flex-col bg-[#0a0a0a] overflow-hidden ${isMobileLandscape ? 'fixed' : 'h-dvh w-dvw'}`}
        style={isMobileLandscape && viewportSize.height > 0 ? {
          position: 'fixed', top: 0, left: 0,
          width: `${viewportSize.width}px`, height: `${viewportSize.height}px`,
        } : {}}
      >
        {/* Scoreboard header - hidden on mobile landscape */}
        <div className={isMobileLandscape ? 'hidden' : ''}>
          <ArenaScoreboard
            localHealth={localHealth}
            opponentHealth={opponentHealth}
            showHealth={true}
            showQuestion={showQuestion}
            onAnswer={sendAnswer}
            killFeed={killFeed}
          />
        </div>

        {/* Main game area */}
        <div className="flex-1 relative min-h-0">
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
              setHazardSpawnCallback={setHazardSpawnCallback}
              setHazardDespawnCallback={setHazardDespawnCallback}
              setTrapSpawnCallback={setTrapSpawnCallback}
              setTrapDespawnCallback={setTrapDespawnCallback}
              sendArenaConfig={sendArenaConfig}
              sendEmote={sendEmote}
              setRemoteEmoteCallback={setRemoteEmoteCallback}
              equippedSkin={equippedSkin}
              opponentSkin={opponentSkin}
              mapConfig={mapConfig}
            />

            <RoundResultOverlay visible={showRoundResult} />

            <MobileLandscapeHUD 
              visible={isMobileLandscape} 
              localHealth={localHealth} 
              opponentHealth={opponentHealth} 
            />
            <MobileKillFeed killFeed={killFeed} />
            <ControlsHint isMobileLandscape={isMobileLandscape} />
            <LeaveButton 
              isMobileLandscape={isMobileLandscape} 
              isFullscreen={isFullscreen} 
              onLeave={leaveGame} 
            />
          </div>
        </div>

        {/* Quiz panel */}
        {isMobileLandscape ? (
          <ArenaQuizPanel onAnswer={sendAnswer} visible={showQuestion} overlayMode={true} />
        ) : (
          <ArenaQuizPanel onAnswer={sendAnswer} visible={showQuestion} />
        )}
      </div>
    </>
  )
}
