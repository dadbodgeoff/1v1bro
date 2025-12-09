/**
 * QuickActionsWidget - Primary gameplay actions section.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, type FormEvent } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLobby } from '@/hooks/useLobby'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useCategories } from '@/hooks/useCategories'
import { QueueStatus, MatchFoundModal, CategorySelector, MapSelector } from '@/components/matchmaking'

interface QuickActionsWidgetProps {
  className?: string
}

export function QuickActionsWidget({ className = '' }: QuickActionsWidgetProps) {
  const { createLobby, joinLobby } = useLobby()
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

  const { categories, isLoading: categoriesLoading } = useCategories()
  
  const [selectedCategory, setSelectedCategory] = useState('fortnite')
  const [selectedMap, setSelectedMap] = useState('nexus-arena')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)

  const handleFindMatch = async () => {
    setError('')
    setIsFindingMatch(true)
    try {
      await joinQueue(selectedCategory, selectedMap)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('cooldown')) {
        setError(err.message)
      }
    } finally {
      setIsFindingMatch(false)
    }
  }

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

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Quick Play</h3>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Category Selection */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          categories={categories}
          disabled={isInQueue}
          isLoading={categoriesLoading}
        />

        {/* Map Selection */}
        <MapSelector
          selectedMap={selectedMap}
          onSelect={setSelectedMap}
          disabled={isInQueue}
        />

        {/* Find Match - Primary Action */}
        <button
          onClick={handleFindMatch}
          disabled={isFindingMatch || cooldownSeconds !== null || isInQueue}
          className="w-full py-3.5 bg-[var(--color-accent-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-accent-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldownSeconds !== null ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cooldown: {formatCooldown(cooldownSeconds)}
            </span>
          ) : isFindingMatch ? (
            'Finding Match...'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Find Match
            </span>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Lobby'}
          </button>
          <button
            onClick={() => setShowJoinInput(!showJoinInput)}
            className="py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all"
          >
            Join Lobby
          </button>
        </div>

        {/* Join Lobby Input */}
        {showJoinInput && (
          <form onSubmit={handleJoin} className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-center text-sm font-mono tracking-[0.2em] text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="w-full py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>
        )}
      </div>

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
