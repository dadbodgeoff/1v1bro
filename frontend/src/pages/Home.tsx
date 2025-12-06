/**
 * Home - Main landing page with enterprise design
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useLobby } from '@/hooks/useLobby'
import { useFriends } from '@/hooks/useFriends'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { FriendsPanel, FriendsButton, FriendsNotifications } from '@/components/friends'
import { QueueStatus, MatchFoundModal } from '@/components/matchmaking'

export function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { createLobby, joinLobby } = useLobby()
  const { fetchFriends, isPanelOpen, openPanel, closePanel } = useFriends()
  const {
    isInQueue,
    queueTime,
    queuePosition,
    queueSize,
    isMatchFound,
    matchData,
    cooldownSeconds,
    joinQueue,
    leaveQueue,
  } = useMatchmaking()

  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const handleCreate = async () => {
    setError('')
    setIsCreating(true)
    try {
      await createLobby()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lobby')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setError('')
    setIsJoining(true)
    try {
      await joinLobby(joinCode.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join lobby')
    } finally {
      setIsJoining(false)
    }
  }

  const handleFindMatch = async () => {
    setError('')
    setIsFindingMatch(true)
    try {
      await joinQueue()
    } catch (err) {
      if (err instanceof Error && !err.message.includes('cooldown')) {
        setError(err.message)
      }
    } finally {
      setIsFindingMatch(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-white">1v1 Bro</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500">
              {user?.display_name || user?.email}
            </span>
            <button
              onClick={logout}
              className="text-xs text-neutral-600 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Welcome */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
              Ready to play?
            </h1>
            <p className="text-neutral-500 text-sm">
              Create a lobby or join an existing match
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            {/* Find Match */}
            <button
              onClick={handleFindMatch}
              disabled={isFindingMatch || cooldownSeconds !== null}
              className="w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {cooldownSeconds !== null
                ? `Cooldown: ${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')}`
                : isFindingMatch
                ? 'Finding...'
                : 'Find Match'}
            </button>

            {/* Create */}
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Lobby'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-xs text-neutral-600">or join</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Join */}
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                placeholder="Enter code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-center text-lg font-mono tracking-[0.3em] text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || isJoining}
                className="w-full py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join Lobby'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-xs text-neutral-600">more</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/bot-game')}
                className="py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
              >
                Practice
              </button>
              <button
                onClick={() => navigate('/fortnite-quiz')}
                className="py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
              >
                Quiz
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/leaderboards')}
                className="py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
              >
                Leaderboards
              </button>
              <FriendsButton onClick={openPanel} />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{user?.games_played || 0}</div>
                <div className="text-xs text-neutral-600">Played</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{user?.games_won || 0}</div>
                <div className="text-xs text-neutral-600">Won</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {user?.games_played ? Math.round((user.games_won / user.games_played) * 100) : 0}%
                </div>
                <div className="text-xs text-neutral-600">Win Rate</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Friends Panel */}
      <FriendsPanel isOpen={isPanelOpen} onClose={closePanel} />
      <FriendsNotifications />

      {/* Matchmaking Modals */}
      <AnimatePresence>
        {isInQueue && (
          <QueueStatus
            queueTime={queueTime}
            queuePosition={queuePosition}
            queueSize={queueSize}
            onCancel={leaveQueue}
          />
        )}
        {isMatchFound && matchData && (
          <MatchFoundModal opponentName={matchData.opponentName} />
        )}
      </AnimatePresence>
    </div>
  )
}
