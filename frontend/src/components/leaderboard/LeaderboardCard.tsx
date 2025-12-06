import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui'
import { LeaderboardRow } from './LeaderboardRow'
import type { LeaderboardEntry, CategoryMeta } from '@/types/leaderboard'

interface LeaderboardCardProps {
  category: CategoryMeta
  entries: LeaderboardEntry[]
  isLoading?: boolean
}

export function LeaderboardCard({ category, entries, isLoading }: LeaderboardCardProps) {
  const navigate = useNavigate()

  return (
    <GlassCard
      variant="elevated"
      gradient={category.gradient}
      hover
      onClick={() => navigate(`/leaderboards/${category.id}`)}
      className="group"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{category.icon}</span>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-slate-400">{category.description}</p>
        </div>
      </div>

      {/* Top 3 entries */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-8 h-6 bg-slate-700/50 rounded" />
              <div className="w-8 h-8 bg-slate-700/50 rounded-full" />
              <div className="flex-1 h-4 bg-slate-700/50 rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <p className="text-center text-slate-500 py-4">No data yet</p>
        ) : (
          entries.slice(0, 3).map((entry) => (
            <LeaderboardRow key={entry.user_id} entry={entry} category={category} compact />
          ))
        )}
      </div>

      {/* View all link */}
      <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
        <span className="text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
          View full leaderboard →
        </span>
      </div>
    </GlassCard>
  )
}
