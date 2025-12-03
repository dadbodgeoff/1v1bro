import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { LobbyCode, PlayerCard } from '@/components/lobby'
import { useLobby } from '@/hooks/useLobby'
import { lobbyAPI } from '@/services/api'
import { useLobbyStore } from '@/stores/lobbyStore'

export function Lobby() {
  const { code: urlCode } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { setLobby, setIsHost } = useLobbyStore()
  const {
    code,
    players,
    canStart,
    isHost,
    userId,
    leaveLobby,
    setReady,
    startGame,
  } = useLobby(urlCode)
  
  // Check if current user is ready
  const currentPlayer = useMemo(
    () => players.find(p => p.id === userId),
    [players, userId]
  )
  const isReady = currentPlayer?.is_ready ?? false

  // Fetch lobby data on mount
  useEffect(() => {
    if (!urlCode) {
      navigate('/')
      return
    }

    const fetchLobby = async () => {
      try {
        const lobby = await lobbyAPI.get(urlCode)
        setLobby(lobby.id, lobby.code, lobby.players, lobby.can_start)
        setIsHost(lobby.host_id === userId)
      } catch {
        navigate('/')
      }
    }

    fetchLobby()
  }, [urlCode, userId, navigate, setLobby, setIsHost])

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-white mb-8">Waiting Room</h1>

      <LobbyCode code={code} />

      <div className="w-full max-w-md mt-8 space-y-3">
        <h2 className="text-slate-400 text-sm mb-2">Players</h2>
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentUser={player.id === userId}
          />
        ))}

        {players.length < 2 && (
          <div className="p-4 rounded-lg border-2 border-dashed border-slate-700 text-center text-slate-500">
            Waiting for opponent...
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        {/* Non-host players see Ready button */}
        {!isHost && !isReady && (
          <Button size="lg" onClick={setReady}>
            Ready Up
          </Button>
        )}
        {!isHost && isReady && (
          <Button size="lg" disabled className="bg-green-600 cursor-default">
            Ready!
          </Button>
        )}
        {/* Host sees Start button when opponent is ready */}
        {isHost && canStart && (
          <Button size="lg" onClick={startGame}>
            Start Game
          </Button>
        )}
        {isHost && !canStart && players.length === 2 && (
          <Button size="lg" disabled className="opacity-50 cursor-not-allowed">
            Waiting for opponent to ready...
          </Button>
        )}
        <Button variant="secondary" onClick={leaveLobby}>
          Leave Lobby
        </Button>
      </div>
    </div>
  )
}
