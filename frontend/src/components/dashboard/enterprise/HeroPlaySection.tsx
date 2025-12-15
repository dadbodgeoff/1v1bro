/**
 * HeroPlaySection - Enterprise Hero Play Action Component
 * 
 * Primary play action component with Find Match CTA and secondary actions.
 * Replaces QuickActionsWidget with enhanced enterprise styling.
 * 
 * Features:
 * - "Quick Play" title in 2xl bold with tight tracking
 * - Category selector dropdown for trivia categories
 * - Map selector dropdown for arena maps
 * - Primary "Find Match" button in accent color (indigo-500)
 * - Secondary actions row (Create Lobby, Join Lobby, Practice vs Bot)
 * - Cooldown display with "Cooldown: X:XX" format
 * - Queue status modal with time elapsed and cancel option
 * - Match found modal with opponent name
 * - Mobile responsive with stacked selectors and 44px tap targets
 * 
 * Props:
 * @param className - Additional CSS classes
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLobby } from '@/hooks/useLobby'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useCategories } from '@/hooks/useCategories'
import { QueueStatus, MatchFoundModal, CategorySelector, MapSelector } from '@/components/matchmaking'
import { DashboardSection } from './DashboardSection'

export interface HeroPlaySectionProps {
  className?: string
}

/**
 * Formats cooldown seconds to "M:SS" format
 * @param seconds - Cooldown time in seconds
 * @returns Formatted string like "2:30" or "0:00"
 */
export function formatCooldown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function HeroPlaySection({ className }: HeroPlaySectionProps) {
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

  return (
    <DashboardSection className={className}>
      {/* Title - H2: Fluid typography (20-24px) bold with tight tracking - Requirements 2.1, 2.2 */}
      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-5">
        Quick Play
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Category and Map Selectors - Stack vertically on mobile - Requirements 2.1, 2.6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Primary Find Match Button - Requirements 2.2, 2.4 */}
        <button
          onClick={handleFindMatch}
          disabled={isButtonDisabled}
          className="w-full h-14 bg-[var(--color-brand)] text-white font-semibold rounded-xl hover:bg-[var(--color-brand-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
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

        {/* Secondary Actions Row - Requirements 2.5, 2.6 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-xl hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-50 min-h-[44px]"
          >
            {isCreating ? 'Creating...' : 'Create Lobby'}
          </button>
          <button
            onClick={() => setShowJoinInput(!showJoinInput)}
            className="py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-xl hover:bg-white/[0.1] hover:text-white transition-all min-h-[44px]"
          >
            Join Lobby
          </button>
          <button
            onClick={handlePracticeVsBot}
            className="py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-xl hover:bg-white/[0.1] hover:text-white transition-all min-h-[44px]"
          >
            <span className="flex items-center justify-center gap-1.5">
              <BotIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Practice</span>
              <span className="sm:hidden">Bot</span>
            </span>
          </button>
        </div>

        {/* Join Lobby Input */}
        {showJoinInput && (
          <form onSubmit={handleJoin} className="space-y-3 pt-2">
            <input
              type="text"
              placeholder="Enter lobby code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center text-sm font-mono tracking-[0.2em] text-white placeholder:text-neutral-600 focus:outline-none focus:border-[var(--color-brand)]/50 transition-colors min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="w-full py-3 bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/30 text-[var(--color-brand)] text-sm font-medium rounded-xl hover:bg-[var(--color-brand)]/30 hover:text-[var(--color-brand-light)] transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>
        )}
      </div>

      {/* Matchmaking Modals - Requirements 2.2, 2.3 */}
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
    </DashboardSection>
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

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
