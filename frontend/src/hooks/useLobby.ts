import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { lobbyAPI } from '@/services/api'
import { wsService } from '@/services/websocket'
import type { PlayerJoinedPayload, LobbyStatePayload, GameStartPayload } from '@/types/websocket'

export function useLobby(lobbyCode?: string) {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const {
    lobbyId,
    code,
    players,
    canStart,
    isHost,
    status,
    category,
    mapSlug,
    setLobby,
    setPlayers,
    setCanStart,
    setIsHost,
    setStatus,
    setCategory,
    setMapSlug,
    setPlayerAssignment,
    setPlayerSkins,
    reset,
  } = useLobbyStore()

  // Connect to WebSocket when lobby code is provided
  useEffect(() => {
    if (!lobbyCode) return

    let unsubLobbyState: (() => void) | null = null
    let unsubPlayerJoined: (() => void) | null = null
    let unsubPlayerLeft: (() => void) | null = null
    let unsubGameStart: (() => void) | null = null
    let unsubPlayerReady: (() => void) | null = null

    const connectAndSubscribe = async () => {
      // Always try to connect - wsService.connect() handles:
      // - Returning early if already connected to same lobby
      // - Disconnecting from different lobby before connecting to new one
      try {
        await wsService.connect(lobbyCode)
      } catch (err) {
        console.error('Failed to connect to lobby:', err)
        navigate('/')
        return
      }

      // Subscribe to lobby state (sent on connect)
      unsubLobbyState = wsService.on('lobby_state', (payload) => {
        const data = payload as LobbyStatePayload
        setPlayers(data.players)
        setCanStart(data.can_start)
        // Set trivia category from lobby state
        if (data.category) {
          setCategory(data.category)
        }
        // Set arena map from lobby state
        if (data.map_slug) {
          setMapSlug(data.map_slug)
        }
        // Get userId from store at time of event
        const currentUserId = useAuthStore.getState().user?.id
        if (currentUserId) {
          setIsHost(data.host_id === currentUserId)
        }
      })

      // Subscribe to lobby events
      unsubPlayerJoined = wsService.on('player_joined', (payload) => {
        const data = payload as PlayerJoinedPayload
        setPlayers(data.players)
        setCanStart(data.can_start)
      })

      unsubPlayerLeft = wsService.on('player_left', (payload) => {
        const data = payload as PlayerJoinedPayload
        setPlayers(data.players)
        setCanStart(data.can_start)
      })

      unsubPlayerReady = wsService.on('player_ready', (payload) => {
        const data = payload as { player_id: string; players: PlayerJoinedPayload['players']; can_start: boolean }
        setPlayers(data.players)
        setCanStart(data.can_start)
      })

      unsubGameStart = wsService.on('game_start', (payload) => {
        const data = payload as GameStartPayload
        // Store player assignment so ArenaGame knows who is player1/player2
        if (data.player1_id && data.player2_id) {
          setPlayerAssignment(data.player1_id, data.player2_id)
        }
        // Store player skins so both players can see each other's skins
        if (data.player_skins) {
          setPlayerSkins(data.player_skins)
        }
        // Set arena map from game_start
        if (data.map_slug) {
          setMapSlug(data.map_slug)
        }
        // Set total questions from server
        if (data.total_questions) {
          useGameStore.getState().setTotalQuestions(data.total_questions)
        }
        setStatus('in_progress')
        navigate(`/game/${lobbyCode}`)
      })
    }

    connectAndSubscribe()

    return () => {
      // Only unsubscribe handlers, don't disconnect WebSocket
      // The WebSocket will be disconnected when leaving the lobby
      unsubLobbyState?.()
      unsubPlayerJoined?.()
      unsubPlayerLeft?.()
      unsubPlayerReady?.()
      unsubGameStart?.()
    }
  }, [lobbyCode, navigate, setPlayers, setCanStart, setIsHost, setStatus, setCategory, setMapSlug, setPlayerAssignment, setPlayerSkins])

  const createLobby = useCallback(async () => {
    try {
      const lobby = await lobbyAPI.create()
      setLobby(lobby.id, lobby.code, lobby.players, lobby.can_start)
      setIsHost(true)
      navigate(`/lobby/${lobby.code}`)
      return lobby
    } catch (err) {
      console.error('Failed to create lobby:', err)
      throw err
    }
  }, [navigate, setLobby, setIsHost])

  const joinLobby = useCallback(
    async (joinCode: string) => {
      try {
        const lobby = await lobbyAPI.join(joinCode.toUpperCase())
        setLobby(lobby.id, lobby.code, lobby.players, lobby.can_start)
        setIsHost(false)
        navigate(`/lobby/${lobby.code}`)
        return lobby
      } catch (err) {
        console.error('Failed to join lobby:', err)
        throw err
      }
    },
    [navigate, setLobby, setIsHost]
  )

  const leaveLobby = useCallback(async () => {
    if (code) {
      try {
        await lobbyAPI.leave(code)
      } catch {
        // Ignore errors when leaving
      }
    }
    wsService.disconnect()
    reset()
    navigate('/')
  }, [code, reset, navigate])

  const setReady = useCallback(() => {
    wsService.send('ready')
  }, [])

  const startGame = useCallback(() => {
    wsService.send('start_game')
  }, [])

  return {
    lobbyId,
    code,
    players,
    canStart,
    isHost,
    status,
    category,
    mapSlug,
    userId,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,
  }
}
