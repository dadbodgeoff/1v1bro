/**
 * LeaderboardRow - Enterprise-style leaderboard entry
 * Clean, minimal design
 */

import type { LeaderboardEntry, CategoryMeta } from '@/types/leaderboard'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  category: CategoryMeta
  compact?: boolean
  highlight?: boolean
}

export function LeaderboardRow({ entry, category, compact = false, highlight = false }: LeaderboardRowProps) {
  const isTopThree = entry.rank <= 3

  // Rank colors
  const rankColor = entry.rank === 1 
    ? 'text-amber-400' 
    : entry.rank === 2 
    ? 'text-neutral-400' 
    : entry.rank === 3 
    ? 'text-amber-700' 
    : 'text-neutral-600'

  if (compact) {
    return (
      <div className={`flex items-center gap-3 py-1.5 ${highlight ? 'bg-white/[0.04]' : ''}`}>
        <span className={`w-6 text-xs font-mono tabular-nums ${rankColor}`}>
          #{entry.rank}
        </span>
        <span className="flex-1 text-xs text-neutral-300 truncate">
          {entry.display_name || 'Anonymous'}
        </span>
        <span className="text-xs font-mono text-white tabular-nums">
          {category.format(entry.stat_value)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
      highlight 
        ? 'bg-white/[0.06] border border-white/[0.1]' 
        : isTopThree 
        ? 'bg-white/[0.03]' 
        : 'hover:bg-white/[0.02]'
    }`}>
      {/* Rank */}
      <div className="w-10 flex-shrink-0">
        <span className={`text-sm font-mono tabular-nums font-medium ${rankColor}`}>
          #{entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {entry.avatar_url ? (
          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-500 font-medium">
            {(entry.display_name || 'A')[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Name & secondary stat */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          {entry.display_name || 'Anonymous'}
        </p>
        {entry.secondary_stat !== null && entry.secondary_label && (
          <p className="text-[11px] text-neutral-500">
            {category.secondaryFormat?.(entry.secondary_stat) || entry.secondary_stat}
          </p>
        )}
      </div>

      {/* Stat value */}
      <div className="flex-shrink-0">
        <span className={`text-sm font-mono tabular-nums font-medium ${
          isTopThree ? 'text-white' : 'text-neutral-300'
        }`}>
          {category.format(entry.stat_value)}
        </span>
      </div>
    </div>
  )
}
