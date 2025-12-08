/**
 * MatchHistory page - Full match history with pagination
 * Requirements: Profile Enterprise - Match History Section
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchHistory } from '../hooks/useMatchHistory'
import { MatchHistoryItem, MatchHistoryItemSkeleton } from '../components/profile/enterprise'

export function MatchHistory() {
  const navigate = useNavigate()
  const {
    matches,
    total,
    hasMore,
    loading,
    error,
    fetchMatches,
    loadMore,
    retry,
  } = useMatchHistory()

  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    fetchMatches(20, 0).then(() => setInitialLoad(false))
  }, [fetchMatches])

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--color-text-muted)] hover:text-white flex items-center gap-2 transition-colors mb-6"
        >
          <span>←</span> Back to Profile
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Match History</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {total} total matches
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={retry}
              className="text-sm font-medium hover:text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {initialLoad && loading && (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchHistoryItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-bg-card)] rounded-xl border border-white/5">
            <div className="text-5xl mb-4">🎮</div>
            <div className="text-xl font-medium text-white mb-2">No matches yet</div>
            <div className="text-sm text-[var(--color-text-muted)] mb-6">
              Play some games to see your match history here
            </div>
            <button
              onClick={() => navigate('/play')}
              className="px-6 py-3 bg-[#6366f1] hover:bg-[#818cf8] text-white font-semibold rounded-lg transition-colors"
            >
              Find a Match
            </button>
          </div>
        )}

        {/* Match List */}
        {matches.length > 0 && (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchHistoryItem key={match.id} match={match} />
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-4 text-sm font-semibold text-[#6366f1] hover:text-[#818cf8] transition-colors text-center rounded-lg hover:bg-white/5 disabled:opacity-50"
              >
                {loading ? 'Loading...' : `Load More (${matches.length} of ${total})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchHistory
