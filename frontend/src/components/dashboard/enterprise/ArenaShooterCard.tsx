/**
 * ArenaShooterCard - 2D Arena Shooter Game Mode Card
 * 
 * Clean, enterprise-grade card for queuing into 2D Arena Shooter matches.
 * Features category and map selection with Find Match functionality.
 * 
 * Uses brand orange (#F97316) for all accent colors.
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLobby } from '@/hooks/useLobby'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useCategories } from '@/hooks/useCategories'
import { QueueStatus, MatchFoundModal, CategorySelector, MapSelector } from '@/components/matchmaking'

export interface ArenaShooterCardProps {
  className?: string
}

export function ArenaShooterCard({ className = '' }: ArenaShooterCardProps) {
  const navigate = useNavigate()
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
  const [selectedMap, setSelectedMap] = useState('vortex-arena')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

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

  const handlePracticeVsBot = () => {
    navigate('/bot-game')
  }

  const isButtonDisabled = isFindingMatch || cooldownSeconds !== null || isInQueue

  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden ${className}`}>
      {/* Header with gradient accent */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/20">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">2D Arena Shooter</h3>
            <p className="text-xs text-neutral-400">1v1 Trivia Combat</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Options Toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full flex items-center justify-between py-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <span>Match Options</span>
          <motion.span
            animate={{ rotate: showOptions ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </button>

        {/* Collapsible Options */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 pb-4">
                <CategorySelector
                  selectedCategory={selectedCategory}
                  onSelect={setSelectedCategory}
                  categories={categories}
                  disabled={isInQueue}
                  isLoading={categoriesLoading}
                />
                <MapSelector
                  selectedMap={selectedMap}
                  onSelect={setSelectedMap}
                  disabled={isInQueue}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Find Match Button */}
        <button
          onClick={handleFindMatch}
          disabled={isButtonDisabled}
          className="w-full h-12 bg-[var(--color-brand)] text-white font-semibold rounded-xl hover:bg-[var(--color-brand-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          {cooldownSeconds !== null ? (
            <span className="flex items-center justify-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Cooldown: {formatCooldown(cooldownSeconds)}
            </span>
          ) : isFindingMatch || isInQueue ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner className="w-5 h-5" />
              Finding Match...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <PlayIcon className="w-5 h-5" />
              Find Match
            </span>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-50"
          >
            {isCreating ? '...' : 'Create'}
          </button>
          <button
            onClick={() => setShowJoinInput(!showJoinInput)}
            className="py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all"
          >
            Join
          </button>
          <button
            onClick={handlePracticeVsBot}
            className="py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all"
          >
            Practice
          </button>
        </div>

        {/* Join Lobby Input */}
        {showJoinInput && (
          <form onSubmit={handleJoin} className="space-y-2">
            <input
              type="text"
              placeholder="Enter lobby code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-center text-sm font-mono tracking-[0.2em] text-white placeholder:text-neutral-600 focus:outline-none focus:border-[var(--color-brand)]/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="w-full py-2.5 bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/30 text-[var(--color-brand)] text-sm font-medium rounded-lg hover:bg-[var(--color-brand)]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Join Lobby'}
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

// Icon Components
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default ArenaShooterCard
