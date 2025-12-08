/**
 * useArenaGame - Main hook composing all arena game functionality
 * Single responsibility: Coordinate sub-hooks and manage player state
 * 
 * Delegates to:
 * - useQuizEvents: Quiz question/answer flow
 * - useCombatEvents: Combat state sync
 * - useArenaEvents: Hazards, traps, transport
 * - useInterpolation: Smooth opponent movement
 * - usePowerUpEvents: Power-up spawn/collection
 */

import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { wsService } from '@/services/websocket'
import type { PositionUpdatePayload } from '@/types/websocket'

import { useQuizEvents } from './useQuizEvents'
import { useCombatEvents } from './useCombatEvents'
import { useArenaEvents } from './useArenaEvents'
import { useInterpolation } from './useInterpolation'
import { usePowerUpEvents } from './usePowerUpEvents'
import { useEmoteEvents } from './useEmoteEvents'
import type { Vector2 } from './types'

export function useArenaGame(lobbyCode?: string) {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const userName = useAuthStore((s) => s.user?.display_name)
  const { players, player1Id, player2Id, playerSkins } = useLobbyStore()
  const { setLocalPlayer, setOpponent, reset } = useGameStore()

  // Player state
  const [isPlayer1, setIsPlayer1] = useState(true)
  const [opponentId, setOpponentId] = useState<string | null>(null)
  
  // Compute skins from playerSkins (received in game_start) for consistency
  // Both local player and opponent skins come from the same verified source
  const equippedSkin = userId && playerSkins[userId] ? {
    skinId: playerSkins[userId]?.skin_id,
    spriteSheetUrl: playerSkins[userId]?.sprite_sheet_url,
    metadataUrl: playerSkins[userId]?.sprite_meta_url,
  } : null
  
  const opponentSkin = opponentId && playerSkins[opponentId] ? {
    skinId: playerSkins[opponentId]?.skin_id,
    spriteSheetUrl: playerSkins[opponentId]?.sprite_sheet_url,
    metadataUrl: playerSkins[opponentId]?.sprite_meta_url,
  } : null

  // Compose sub-hooks
  const quiz = useQuizEvents(lobbyCode)
  const combat = useCombatEvents(lobbyCode, userId)
  const arena = useArenaEvents(lobbyCode)
  const interpolation = useInterpolation(lobbyCode)
  const { powerUps } = usePowerUpEvents(lobbyCode)
  const emote = useEmoteEvents(lobbyCode, userId)

  // Initialize players from lobby
  useEffect(() => {
    if (userId && players.length > 0) {
      setLocalPlayer(userId, userName || null)

      const opponent = players.find((p) => p.id !== userId)
      if (opponent) {
        setOpponent(opponent.id, opponent.display_name)
        setOpponentId(opponent.id)
      }

      // Use explicit player assignment from game_start if available
      if (player1Id && player2Id) {
        setIsPlayer1(userId === player1Id)
      } else {
        const playerIndex = players.findIndex((p) => p.id === userId)
        setIsPlayer1(playerIndex === 0)
      }
    }
  }, [userId, userName, players, player1Id, player2Id, setLocalPlayer, setOpponent])

  // Debug: Log whenever skin state changes
  useEffect(() => {
    console.log('[useArenaGame] Skins from game_start:', { equippedSkin, opponentSkin, playerSkins })
  }, [equippedSkin, opponentSkin, playerSkins])


  // Connect to WebSocket and subscribe to position updates
  useEffect(() => {
    if (!lobbyCode) return

    const connectAndSubscribe = async () => {
      if (!wsService.isConnected) {
        try {
          await wsService.connect(lobbyCode)
        } catch (err) {
          console.error('Failed to connect:', err)
          navigate('/')
          return
        }
      }

      // Position updates feed into interpolation
      const unsubPosition = wsService.on('position_update', (payload) => {
        const data = payload as PositionUpdatePayload
        const localId = useAuthStore.getState().user?.id
        if (data.player_id !== localId) {
          interpolation.addPositionSnapshot({ x: data.x, y: data.y })
        }
      })

      return () => {
        unsubPosition()
      }
    }

    const cleanup = connectAndSubscribe()
    return () => {
      cleanup.then((fn) => fn?.())
    }
  }, [lobbyCode, navigate, interpolation])

  // Wire combat position updates to interpolation
  useEffect(() => {
    combat.setOpponentPositionCallback((pos) => {
      interpolation.addPositionSnapshot(pos)
    })
  }, [combat, interpolation])

  // Send position update
  const sendPosition = useCallback((position: Vector2) => {
    wsService.sendPosition(position.x, position.y)
  }, [])

  // Leave game
  const leaveGame = useCallback(() => {
    wsService.disconnect()
    reset()
    navigate('/')
  }, [reset, navigate])

  return {
    // Quiz state
    status: quiz.status,
    currentQuestion: quiz.currentQuestion,
    localScore: quiz.localScore,
    opponentScore: quiz.opponentScore,
    roundResult: quiz.roundResult,
    finalResult: quiz.finalResult,
    sendAnswer: quiz.sendAnswer,

    // Player state
    isPlayer1,
    opponentId,
    opponentPosition: interpolation.opponentPosition,
    powerUps,

    // Position
    sendPosition,
    setOpponentPositionCallback: interpolation.setOpponentPositionCallback,

    // Combat
    sendFire: combat.sendFire,
    sendCombatEvent: combat.sendCombatEvent,
    setServerProjectilesCallback: combat.setServerProjectilesCallback,
    setServerHealthCallback: combat.setServerHealthCallback,
    setServerDeathCallback: combat.setServerDeathCallback,
    setServerRespawnCallback: combat.setServerRespawnCallback,
    setBuffUpdateCallback: combat.setBuffUpdateCallback,

    // Arena
    sendArenaConfig: arena.sendArenaConfig,
    setHazardSpawnCallback: arena.setHazardSpawnCallback,
    setHazardDespawnCallback: arena.setHazardDespawnCallback,
    setHazardEnterCallback: arena.setHazardEnterCallback,
    setHazardExitCallback: arena.setHazardExitCallback,
    setHazardDamageCallback: arena.setHazardDamageCallback,
    setTrapSpawnCallback: arena.setTrapSpawnCallback,
    setTrapDespawnCallback: arena.setTrapDespawnCallback,
    setTrapWarningCallback: arena.setTrapWarningCallback,
    setTrapTriggeredCallback: arena.setTrapTriggeredCallback,
    setTrapArmedCallback: arena.setTrapArmedCallback,
    setTeleportCallback: arena.setTeleportCallback,
    setJumpPadCallback: arena.setJumpPadCallback,
    // Server authority callbacks
    setArenaStateCallback: arena.setArenaStateCallback,
    setBarrierDamagedCallback: arena.setBarrierDamagedCallback,
    setBarrierDestroyedCallback: arena.setBarrierDestroyedCallback,
    setBuffAppliedCallback: arena.setBuffAppliedCallback,
    setBuffExpiredCallback: arena.setBuffExpiredCallback,

    // Lifecycle
    leaveGame,

    // Emotes (Requirement 5.3)
    sendEmote: emote.sendEmote,
    setRemoteEmoteCallback: emote.setRemoteEmoteCallback,

    // Cosmetics
    equippedSkin,
    opponentSkin,
  }
}

// Debug: Log when equippedSkin changes
if (typeof window !== 'undefined') {
  (window as unknown as { __debugEquippedSkin?: unknown }).__debugEquippedSkin = undefined
}
