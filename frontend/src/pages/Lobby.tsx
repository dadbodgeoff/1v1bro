/**
 * Lobby - Waiting room with head-to-head playercard display
 * 
 * Requirements: 1.4, 3.2, 3.4
 * 
 * Enterprise features:
 * - Preloads playercard images when players join
 * - Optimized image loading with caching
 */

import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LobbyCode, HeadToHeadDisplay } from '@/components/lobby'
import { useLobby } from '@/hooks/useLobby'
import { useFriends } from '@/hooks/useFriends'
import { lobbyAPI } from '@/services/api'
import { useLobbyStore } from '@/stores/lobbyStore'
import { FriendsPanel, FriendsButtonCompact, FriendsNotifications } from '@/components/friends'
import { preloadImages } from '@/components/ui/OptimizedImage'

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
    category,
    leaveLobby,
    setReady,
    startGame,
  } = useLobby(urlCode)
  const { fetchFriends, isPanelOpen, openPanel, closePanel } = useFriends()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  // Preload playercard images when players change
  useEffect(() => {
    const playercardUrls = players
      .map((p) => p.playercard?.image_url)
      .filter((url): url is string => !!url)
    
    if (playercardUrls.length > 0) {
      preloadImages(playercardUrls).catch(() => {
        // Silently fail - OptimizedImage will handle individual failures
      })
    }
  }, [players])

  // Find current player and opponent
  const currentPlayer = useMemo(
    () => players.find((p) => p.id === userId) ?? null,
    [players, userId]
  )
  const opponent = useMemo(
    () => players.find((p) => p.id !== userId) ?? null,
    [players, userId]
  )
  const isReady = currentPlayer?.is_ready ?? false

  useEffect(() => {
    if (!urlCode) {
      navigate('/dashboard')
      return
    }

    const fetchLobby = async () => {
      try {
        const lobby = await lobbyAPI.get(urlCode)
        setLobby(lobby.id, lobby.code, lobby.players, lobby.can_start)
        setIsHost(lobby.host_id === userId)
      } catch {
        navigate('/dashboard')
      }
    }

    fetchLobby()
  }, [urlCode, userId, navigate, setLobby, setIsHost])

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={leaveLobby}
            className="text-sm text-neutral-500 hover:text-white transition-colors"
          >
            ← Leave
          </button>
          <span className="text-xs text-neutral-600">Lobby</span>
          <FriendsButtonCompact onClick={openPanel} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Lobby Code */}
        <div className="text-center mb-8">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
            Share this code
          </p>
          <LobbyCode code={code} />
        </div>

        {/* Head-to-Head Player Cards */}
        <div className="mb-8">
          <HeadToHeadDisplay
            currentPlayer={currentPlayer}
            opponent={opponent}
            isWaitingForOpponent={players.length < 2}
            category={category}
          />
        </div>

        {/* Actions */}
        <div className="w-full max-w-xs space-y-3">
          {!isHost && !isReady && (
            <button
              onClick={setReady}
              className="w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Ready Up
            </button>
          )}

          {!isHost && isReady && (
            <div className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-lg text-center">
              Ready
            </div>
          )}

          {isHost && canStart && (
            <button
              onClick={startGame}
              className="w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Start Game
            </button>
          )}

          {isHost && !canStart && players.length === 2 && (
            <div className="w-full py-3.5 bg-white/[0.02] border border-white/[0.06] text-neutral-500 font-medium rounded-lg text-center">
              Waiting for opponent to ready...
            </div>
          )}

          {isHost && players.length < 2 && (
            <div className="w-full py-3.5 bg-white/[0.02] border border-white/[0.06] text-neutral-500 font-medium rounded-lg text-center">
              Invite a friend to play
            </div>
          )}
        </div>
      </main>

      <FriendsPanel isOpen={isPanelOpen} onClose={closePanel} lobbyCode={code} />
      <FriendsNotifications />
    </div>
  )
}
