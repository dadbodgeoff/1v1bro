/**
 * LeaderboardHub - Enterprise-style leaderboard overview
 * Clean, minimal design matching the rest of the app
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leaderboardAPI } from '@/services/api'
import { ALL_CATEGORIES, CATEGORY_META } from '@/types/leaderboard'
import type { LeaderboardEntry, LeaderboardCategory, CategoryMeta } from '@/types/leaderboard'

type LeaderboardData = Record<LeaderboardCategory, LeaderboardEntry[]>

// Clean icon mapping (no emoji)
const CATEGORY_ICONS: Record<LeaderboardCategory, React.ReactNode> = {
  wins: <TrophyIcon />,
  win_rate: <ChartIcon />,
  total_score: <StarIcon />,
  kills: <TargetIcon />,
  kd_ratio: <SwordsIcon />,
  accuracy: <CrosshairIcon />,
  fastest_thinker: <BoltIcon />,
  answer_rate: <BrainIcon />,
  win_streak: <FlameIcon />,
}

function TrophyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a7.003 7.003 0 01-5.27 2.022 7.003 7.003 0 01-5.27-2.022" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  )
}

function SwordsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CrosshairIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
    </svg>
  )
}

interface LeaderboardCardProps {
  category: CategoryMeta
  entries: LeaderboardEntry[]
  isLoading: boolean
  onClick: () => void
}

function LeaderboardCard({ category, entries, isLoading, onClick }: LeaderboardCardProps) {
  const icon = CATEGORY_ICONS[category.id]
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-white/[0.1] transition-all">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{category.name}</h3>
          <p className="text-[11px] text-neutral-500">{category.description}</p>
        </div>
      </div>

      {/* Top entries */}
      <div className="space-y-2 mb-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-5 h-4 bg-white/[0.06] rounded" />
              <div className="flex-1 h-3 bg-white/[0.06] rounded" />
              <div className="w-12 h-3 bg-white/[0.06] rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <p className="text-center text-neutral-600 text-xs py-3">No data yet</p>
        ) : (
          entries.slice(0, 3).map((entry, i) => (
            <div key={entry.user_id} className="flex items-center gap-3">
              <span className={`w-5 text-xs font-mono tabular-nums ${
                i === 0 ? 'text-amber-400' : i === 1 ? 'text-neutral-400' : 'text-amber-700'
              }`}>
                #{entry.rank}
              </span>
              <span className="flex-1 text-xs text-neutral-300 truncate">
                {entry.display_name || 'Anonymous'}
              </span>
              <span className="text-xs font-mono text-white tabular-nums">
                {category.format(entry.stat_value)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-white/[0.06]">
        <span className="text-[11px] text-neutral-500 group-hover:text-neutral-400 transition-colors">
          View full leaderboard →
        </span>
      </div>
    </button>
  )
}

export function LeaderboardHub() {
  const navigate = useNavigate()
  const [data, setData] = useState<Partial<LeaderboardData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllLeaderboards()
  }, [])

  const loadAllLeaderboards = async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await Promise.all(
        ALL_CATEGORIES.map(async (category) => {
          try {
            const response = await leaderboardAPI.getLeaderboard(category, 10, 0)
            return { category, entries: response.entries }
          } catch {
            return { category, entries: [] }
          }
        })
      )

      const newData: Partial<LeaderboardData> = {}
      results.forEach(({ category, entries }) => {
        newData[category] = entries
      })
      setData(newData)
    } catch {
      setError('Failed to load leaderboards')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Leaderboards</h1>
            <p className="text-sm text-neutral-500 mt-1">See who's dominating the arena</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-neutral-500 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={loadAllLeaderboards}
              className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Leaderboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_CATEGORIES.map((category) => (
            <LeaderboardCard
              key={category}
              category={CATEGORY_META[category]}
              entries={data[category] || []}
              isLoading={loading}
              onClick={() => navigate(`/leaderboards/${category}`)}
            />
          ))}
        </div>

        {/* Your stats card */}
        <div className="mt-8 p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Your Rankings</h2>
              <p className="text-xs text-neutral-500 mt-0.5">See where you stand across all categories</p>
            </div>
            <button
              onClick={() => navigate('/leaderboards/my-stats')}
              className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              View My Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
