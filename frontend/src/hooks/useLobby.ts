import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useAuthStore } from '@/stores/authStore'
import { lobbyAPI } from '@/services/api'
import { wsService } from '@/services/websocket'
import type { PlayerJoinedPayload, LobbyStatePayload } from '@/types/websocket'

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
    setLobby,
    setPlayers,
    setCanStart,
    setIsHost,
    setStatus,
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
      // Don't connect if already connected to this lobby
      if (wsService.isConnected) {
        console.log('[Lobby] Already connected, skipping')
        return
      }

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
        console.log('[Lobby] Received lobby_state:', data)
        setPlayers(data.players)
        setCanStart(data.can_start)
        // Get userId from store at time of event
        const currentUserId = useAuthStore.getState().user?.id
        if (currentUserId) {
          setIsHost(data.host_id === currentUserId)
        }
      })

      // Subscribe to lobby events
      unsubPlayerJoined = wsService.on('player_joined', (payload) => {
        const data = payload as PlayerJoinedPayload
        console.log('[Lobby] Player joined:', data)
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
        console.log('[Lobby] Player ready:', data)
        setPlayers(data.players)
        setCanStart(data.can_start)
      })

      unsubGameStart = wsService.on('game_start', () => {
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
  }, [lobbyCode, navigate, setPlayers, setCanStart, setIsHost, setStatus]) // Include all used functions

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
    userId,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,
  }
}
