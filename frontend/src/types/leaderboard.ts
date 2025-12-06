// Leaderboard types

export type LeaderboardCategory =
  | 'wins'
  | 'win_rate'
  | 'total_score'
  | 'kills'
  | 'kd_ratio'
  | 'accuracy'
  | 'fastest_thinker'
  | 'answer_rate'
  | 'win_streak'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string | null
  avatar_url: string | null
  stat_value: number
  secondary_stat: number | null
  secondary_label: string | null
}

export interface LeaderboardResponse {
  category: LeaderboardCategory
  entries: LeaderboardEntry[]
  total_eligible: number
  page: number
  page_size: number
  minimum_requirement: string | null
}

export interface UserRankResponse {
  category: LeaderboardCategory
  rank: number | null
  stat_value: number
  eligible: boolean
  requirement_met: boolean
  requirement: string | null
}

// Category metadata for display
export interface CategoryMeta {
  id: LeaderboardCategory
  name: string
  icon: string
  description: string
  format: (value: number) => string
  secondaryFormat?: (value: number) => string
  gradient: string
}

export const CATEGORY_META: Record<LeaderboardCategory, CategoryMeta> = {
  wins: {
    id: 'wins',
    name: 'Most Wins',
    icon: '🏆',
    description: 'Total games won',
    format: (v) => v.toLocaleString(),
    secondaryFormat: (v) => `${v} games`,
    gradient: 'from-amber-500 to-orange-600',
  },
  win_rate: {
    id: 'win_rate',
    name: 'Win Rate',
    icon: '📈',
    description: 'Highest win percentage (10+ games)',
    format: (v) => `${v.toFixed(1)}%`,
    secondaryFormat: (v) => `${v} games`,
    gradient: 'from-emerald-500 to-teal-600',
  },
  total_score: {
    id: 'total_score',
    name: 'Total Score',
    icon: '⭐',
    description: 'Cumulative points earned',
    format: (v) => v.toLocaleString(),
    secondaryFormat: (v) => `${v} games`,
    gradient: 'from-violet-500 to-purple-600',
  },
  kills: {
    id: 'kills',
    name: 'Most Kills',
    icon: '💀',
    description: 'Total eliminations',
    format: (v) => v.toLocaleString(),
    secondaryFormat: (v) => `${v} deaths`,
    gradient: 'from-red-500 to-rose-600',
  },
  kd_ratio: {
    id: 'kd_ratio',
    name: 'K/D Ratio',
    icon: '⚔️',
    description: 'Kill/Death ratio (10+ deaths)',
    format: (v) => v.toFixed(2),
    secondaryFormat: (v) => `${v} kills`,
    gradient: 'from-orange-500 to-red-600',
  },
  accuracy: {
    id: 'accuracy',
    name: 'Accuracy',
    icon: '🎯',
    description: 'Shot accuracy (100+ shots)',
    format: (v) => `${v.toFixed(1)}%`,
    secondaryFormat: (v) => `${v} shots`,
    gradient: 'from-cyan-500 to-blue-600',
  },
  fastest_thinker: {
    id: 'fastest_thinker',
    name: 'Fastest Thinker',
    icon: '⚡',
    description: 'Quickest avg answer time (50+ correct)',
    format: (v) => `${(v / 1000).toFixed(2)}s`,
    secondaryFormat: (v) => `${v} correct`,
    gradient: 'from-yellow-500 to-amber-600',
  },
  answer_rate: {
    id: 'answer_rate',
    name: 'Answer Rate',
    icon: '🧠',
    description: 'Correct answer percentage (100+ questions)',
    format: (v) => `${v.toFixed(1)}%`,
    secondaryFormat: (v) => `${v} questions`,
    gradient: 'from-pink-500 to-rose-600',
  },
  win_streak: {
    id: 'win_streak',
    name: 'Win Streak',
    icon: '🔥',
    description: 'Best consecutive wins',
    format: (v) => v.toLocaleString(),
    secondaryFormat: (v) => `${v} current`,
    gradient: 'from-orange-500 to-yellow-500',
  },
}

export const ALL_CATEGORIES: LeaderboardCategory[] = [
  'wins',
  'win_rate',
  'total_score',
  'kills',
  'kd_ratio',
  'accuracy',
  'fastest_thinker',
  'answer_rate',
  'win_streak',
]
