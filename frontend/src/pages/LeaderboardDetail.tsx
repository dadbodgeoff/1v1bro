/**
 * LeaderboardDetail - Full leaderboard view for a category
 * Enterprise-style design
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LeaderboardRow } from '@/components/leaderboard'
import { leaderboardAPI } from '@/services/api'
import { CATEGORY_META, ALL_CATEGORIES } from '@/types/leaderboard'
import type { LeaderboardEntry, LeaderboardCategory, LeaderboardResponse, UserRankResponse } from '@/types/leaderboard'
import { useAuthStore } from '@/stores/authStore'

const PAGE_SIZE = 20

export function LeaderboardDetail() {
  const { category } = useParams<{ category: LeaderboardCategory }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [myRank, setMyRank] = useState<UserRankResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchResults, setSearchResults] = useState<LeaderboardEntry[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const categoryMeta = category ? CATEGORY_META[category] : null

  const loadLeaderboard = useCallback(async (page: number) => {
    if (!category) return
    setLoading(true)
    try {
      const offset = (page - 1) * PAGE_SIZE
      const response = await leaderboardAPI.getLeaderboard(category, PAGE_SIZE, offset)
      setData(response)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [category])

  const loadMyRank = useCallback(async () => {
    if (!category) return
    try {
      const response = await leaderboardAPI.getMyRank(category)
      setMyRank(response)
    } catch (err) {
      console.error('Failed to load my rank:', err)
    }
  }, [category])

  useEffect(() => {
    if (category && ALL_CATEGORIES.includes(category)) {
      loadLeaderboard(currentPage)
      loadMyRank()
    }
  }, [category, currentPage, loadLeaderboard, loadMyRank])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const query = searchQuery.toLowerCase()
    const filtered = data?.entries.filter(
      (entry) => entry.display_name?.toLowerCase().includes(query)
    ) || []
    setSearchResults(filtered)
  }, [searchQuery, data])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const jumpToMyRank = () => {
    if (myRank?.rank) {
      const page = Math.ceil(myRank.rank / PAGE_SIZE)
      setCurrentPage(page)
    }
  }

  if (!category || !categoryMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Invalid category</p>
          <button
            onClick={() => navigate('/leaderboards')}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Back to Leaderboards
          </button>
        </div>
      </div>
    )
  }

  const totalPages = data ? Math.ceil(data.total_eligible / PAGE_SIZE) : 0
  const displayEntries = isSearching ? searchResults : data?.entries || []

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/leaderboards')}
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">{categoryMeta.name}</h1>
              <p className="text-xs text-neutral-500">{categoryMeta.description}</p>
            </div>
          </div>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <div className="mb-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Your Rank</p>
                {myRank.eligible ? (
                  <p className="text-2xl font-semibold text-white tabular-nums">
                    #{myRank.rank?.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-sm text-neutral-400">Not eligible yet</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  {categoryMeta.format(myRank.stat_value)}
                  {myRank.requirement && !myRank.eligible && (
                    <span className="ml-2 text-amber-500">• Requires {myRank.requirement}</span>
                  )}
                </p>
              </div>
              {myRank.eligible && myRank.rank && (
                <button
                  onClick={jumpToMyRank}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  Jump to Position
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Requirement notice */}
        {data?.minimum_requirement && (
          <div className="mb-4 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400">
              Minimum requirement: {data.minimum_requirement}
            </p>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="w-10 h-4 bg-white/[0.06] rounded" />
                  <div className="w-8 h-8 bg-white/[0.06] rounded-full" />
                  <div className="flex-1 h-4 bg-white/[0.06] rounded" />
                  <div className="w-16 h-4 bg-white/[0.06] rounded" />
                </div>
              ))
            ) : displayEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm">
                  {isSearching ? 'No players found' : 'No data available'}
                </p>
              </div>
            ) : (
              displayEntries.map((entry) => (
                <LeaderboardRow
                  key={entry.user_id}
                  entry={entry}
                  category={categoryMeta}
                  highlight={entry.user_id === user?.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {!isSearching && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs text-neutral-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-neutral-500 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs text-neutral-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {!isSearching && data && (
          <p className="text-center text-neutral-600 text-xs mt-3">
            {data.total_eligible.toLocaleString()} eligible players
          </p>
        )}

        {/* Other categories */}
        <div className="mt-8 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-neutral-500 mb-3">Other Leaderboards</p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.filter((c) => c !== category).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCurrentPage(1)
                  setSearchQuery('')
                  navigate(`/leaderboards/${cat}`)
                }}
                className="px-3 py-1.5 text-xs text-neutral-400 bg-white/[0.04] border border-white/[0.06] rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                {CATEGORY_META[cat].name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
