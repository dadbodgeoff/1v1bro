/**
 * GameArena - React component wrapping the game engine
 * Handles lifecycle and bridges React state with game engine
 * Supports both desktop (keyboard/mouse) and mobile (touch) controls
 */

import { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import { GameEngine } from '@/game'
import { RespawnOverlay } from './RespawnOverlay'
import { MobileControls } from './MobileControls'
import { DeathReplayModal } from '@/components/replay'
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

interface GameArenaProps {
  playerId: string
  isPlayer1: boolean
  opponentId?: string
  opponentPosition?: Vector2 | null
  powerUps: PowerUpState[]
  onPositionUpdate: (position: Vector2) => void
  onPowerUpCollect: (powerUpId: number) => void
  // Map configuration (defaults to NEXUS_ARENA if not provided)
  mapConfig?: MapConfig
  // Combat props
  combatEnabled?: boolean
  onCombatFire?: (event: FireEvent) => void
  onCombatHit?: (event: HitEvent) => void
  onCombatDeath?: (event: DeathEvent) => void
  onCombatRespawn?: (event: RespawnEvent) => void
  // Direct position update callback for bypassing React state
  setOpponentPositionCallback?: (callback: (pos: Vector2) => void) => void
  // Server combat callbacks
  setServerProjectilesCallback?: (callback: (projectiles: import('@/game').Projectile[]) => void) => void
  setServerHealthCallback?: (callback: (playerId: string, health: number, maxHealth: number) => void) => void
  setServerDeathCallback?: (callback: (playerId: string, killerId: string) => void) => void
  setServerRespawnCallback?: (callback: (playerId: string, x: number, y: number) => void) => void
  // Server arena callbacks
  setHazardDamageCallback?: (callback: (playerId: string, damage: number) => void) => void
  setTrapTriggeredCallback?: (callback: (data: { id: string; effect: string; value: number; affected_players: string[]; x: number; y: number; knockbacks?: Record<string, { dx: number; dy: number }> }) => void) => void
  setTeleportCallback?: (callback: (playerId: string, toX: number, toY: number) => void) => void
  setJumpPadCallback?: (callback: (playerId: string, vx: number, vy: number) => void) => void
  // Send arena config to server
  sendArenaConfig?: (config: unknown) => void
  // Question broadcast (in-arena display)
  questionBroadcast?: {
    question: QuestionBroadcastData | null
    selectedAnswer: string | null
    answerSubmitted: boolean
    visible: boolean
  }
  // Buff update callback
  setBuffUpdateCallback?: (callback: (buffs: Record<string, Array<{ type: string; value: number; remaining: number; source: string }>>) => void) => void
  // Emote callbacks (Requirement 5.3)
  setRemoteEmoteCallback?: (callback: (playerId: string, emoteId: string) => void) => void
  sendEmote?: (emoteId: string) => void
  // Emote initialization data
  inventoryEmotes?: Array<{ id: string; name: string; image_url: string }>
  equippedEmoteId?: string | null
  // Skin initialization data
  equippedSkin?: {
    skinId?: string  // Static bundled skin ID
    spriteSheetUrl?: string  // Dynamic skin URL
    metadataUrl?: string  // Dynamic skin metadata URL
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const mobileVelocityRef = useRef<Vector2>({ x: 0, y: 0 })

  // Respawn UI state
  const [isRespawning, setIsRespawning] = useState(false)
  const [respawnTime, setRespawnTime] = useState(0)

  // Death replay state
  const [lastDeathReplay, setLastDeathReplay] = useState<DeathReplay | null>(null)
  const [showReplayModal, setShowReplayModal] = useState(false)

  // Store callbacks in refs to avoid re-creating engine on callback changes
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

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current, mapConfig)
    engine.initLocalPlayer(playerId, isPlayer1)
    engine.setCallbacks({
      onPositionUpdate: (pos) => onPositionUpdateRef.current?.(pos),
      onPowerUpCollect: (id) => onPowerUpCollectRef.current(id),
      onCombatFire: (event) => onCombatFireRef.current?.(event),
      onCombatHit: (event) => onCombatHitRef.current?.(event),
      onCombatDeath: (event) => onCombatDeathRef.current?.(event),
      onCombatRespawn: (event) => onCombatRespawnRef.current?.(event),
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

    return () => {
      engine.destroy()
      engineRef.current = null
    }
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

  // Handle mouse move for aiming
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    engineRef.current?.handleMouseMove(e.clientX, e.clientY)
  }, [])

  // Handle fire input
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left click
      engineRef.current?.handleFire()
    }
  }, [])

  // Set up opponent as soon as we have their ID
  // Use spawn position based on player assignment (opponent spawns opposite side)
  useEffect(() => {
    if (opponentId && engineRef.current) {
      // Opponent is player1 if local player is NOT player1
      const isOpponentPlayer1 = !isPlayer1
      // Default spawn positions: player1 spawns left (160, 360), player2 spawns right (1120, 360)
      const defaultSpawn = isOpponentPlayer1 
        ? { x: 160, y: 360 }  // Player 1 spawn
        : { x: 1120, y: 360 } // Player 2 spawn
      
      engineRef.current.setOpponent({
        id: opponentId,
        position: defaultSpawn,
        trail: [],
        isLocal: false,
        isPlayer1: isOpponentPlayer1,
      }, isOpponentPlayer1)
    }
  }, [opponentId, isPlayer1])

  // Update opponent position when we receive updates (via React state)
  useEffect(() => {
    if (opponentPosition && engineRef.current) {
      engineRef.current.updateOpponentPosition(opponentPosition)
    }
  }, [opponentPosition])

  // Register direct position update callback for bypassing React state batching
  // This runs after engine initialization to ensure engineRef.current exists
  useEffect(() => {
    if (setOpponentPositionCallback) {
      setOpponentPositionCallback((pos: Vector2) => {
        engineRef.current?.updateOpponentPosition(pos)
      })
    }
  }, [setOpponentPositionCallback, playerId]) // playerId changes trigger engine recreation

  // Register server combat callbacks
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

  // Register buff update callback
  useEffect(() => {
    if (setBuffUpdateCallback) {
      setBuffUpdateCallback((buffs) => {
        engineRef.current?.setServerBuffs(buffs)
      })
    }
  }, [setBuffUpdateCallback, playerId])

  // Register emote callbacks (Requirement 5.3)
  useEffect(() => {
    if (setRemoteEmoteCallback) {
      setRemoteEmoteCallback((pid, emoteId) => {
        engineRef.current?.handleRemoteEmote(pid, emoteId)
      })
    }
  }, [setRemoteEmoteCallback, playerId])

  // Wire emote trigger to WebSocket send
  useEffect(() => {
    if (sendEmote && engineRef.current) {
      const emoteManager = engineRef.current.getEmoteManager()
      emoteManager.setOnEmoteTrigger((event) => {
        sendEmote(event.emoteId)
      })
    }
  }, [sendEmote, playerId])

  // Initialize emotes with inventory and equipped emote
  useEffect(() => {
    if (engineRef.current && inventoryEmotes) {
      engineRef.current.initializeEmotes(inventoryEmotes, equippedEmoteId ?? null)
    }
  }, [inventoryEmotes, equippedEmoteId, playerId])

  // Initialize player skin - with retry to handle timing issues
  useEffect(() => {
    const applySkin = () => {
      if (!engineRef.current) {
        return false
      }
      
      if (equippedSkin) {
        if (equippedSkin.spriteSheetUrl) {
          // Dynamic skin from CMS
          engineRef.current.setDynamicSkin(playerId, equippedSkin.spriteSheetUrl, equippedSkin.metadataUrl)
        } else if (equippedSkin.skinId) {
          // Static bundled skin
          engineRef.current.setPlayerSkin(playerId, equippedSkin.skinId)
        }
      }
      return true
    }
    
    // Try immediately
    if (applySkin()) return
    
    // Retry after a short delay if engine wasn't ready
    const retryTimer = setTimeout(() => {
      applySkin()
    }, 100)
    
    return () => clearTimeout(retryTimer)
  }, [equippedSkin, playerId])

  // Initialize opponent skin
  useEffect(() => {
    if (!engineRef.current || !opponentId) return
    
    if (opponentSkin) {
      if (opponentSkin.spriteSheetUrl) {
        engineRef.current.setDynamicSkin(opponentId, opponentSkin.spriteSheetUrl, opponentSkin.metadataUrl)
      } else if (opponentSkin.skinId) {
        engineRef.current.setPlayerSkin(opponentId, opponentSkin.skinId)
      }
    }
  }, [opponentSkin, opponentId])

  // Register server arena callbacks
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

  // Send arena config to server when engine is ready (host only)
  useEffect(() => {
    if (sendArenaConfig && engineRef.current && isPlayer1) {
      // Small delay to ensure server is ready
      const timer = setTimeout(() => {
        const config = engineRef.current?.getMapConfig()
        if (config) {
          sendArenaConfig(config)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [sendArenaConfig, isPlayer1, playerId])

  // Update power-ups
  useEffect(() => {
    engineRef.current?.setPowerUps(powerUps)
  }, [powerUps])

  // Update question broadcast
  useEffect(() => {
    if (questionBroadcast) {
      engineRef.current?.setQuestionBroadcast(
        questionBroadcast.question,
        questionBroadcast.selectedAnswer,
        questionBroadcast.answerSubmitted,
        questionBroadcast.visible
      )
    }
  }, [questionBroadcast])

  // Handle resize
  useEffect(() => {
    const handleResize = () => engineRef.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mobile controls handlers
  const handleMobileMove = useCallback((velocity: Vector2) => {
    mobileVelocityRef.current = velocity
    // The InputSystem in GameEngine will pick this up
    engineRef.current?.setMobileVelocity?.(velocity)
  }, [])

  const handleMobileFire = useCallback(() => {
    engineRef.current?.handleFire()
  }, [])

  // Fire in a specific direction (for mobile joystick)
  const handleMobileFireDirection = useCallback((direction: Vector2) => {
    engineRef.current?.handleFireDirection(direction)
  }, [])

  // Expose methods via ref for external control
  useImperativeHandle(ref, () => ({
    fire: () => engineRef.current?.handleFire(),
    setMobileVelocity: (velocity: Vector2) => {
      mobileVelocityRef.current = velocity
      engineRef.current?.setMobileVelocity?.(velocity)
    },
  }), [])

  // Handle touch for aiming (tap to aim at position)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!combatEnabled) return
    const touch = e.touches[0]
    if (touch) {
      engineRef.current?.handleMouseMove(touch.clientX, touch.clientY)
    }
  }, [combatEnabled])

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
