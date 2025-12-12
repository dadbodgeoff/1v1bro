// Leaderboard types
// Requirements: 5.5, 5.6

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
  | 'elo'

/**
 * Rank tiers based on ELO rating.
 * Requirements: 5.5
 * Note: Backend uses PascalCase ('Bronze'), frontend uses lowercase ('bronze')
 */
export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

// Backend tier names (PascalCase)
export type BackendRankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export const RANK_TIERS: Record<RankTier, { min: number; max: number; icon: string; color: string }> = {
  bronze: { min: 100, max: 799, icon: '🥉', color: '#cd7f32' },
  silver: { min: 800, max: 1199, icon: '🥈', color: '#c0c0c0' },
  gold: { min: 1200, max: 1599, icon: '🥇', color: '#ffd700' },
  platinum: { min: 1600, max: 1999, icon: '💎', color: '#60A5FA' },
  diamond: { min: 2000, max: 2399, icon: '💠', color: '#b9f2ff' },
  master: { min: 2400, max: 2799, icon: '👑', color: '#ff6b6b' },
  grandmaster: { min: 2800, max: 3000, icon: '🏆', color: '#ffd700' },
};

/**
 * Normalize backend tier name to frontend format.
 * Backend returns PascalCase ('Bronze'), frontend uses lowercase ('bronze')
 */
export function normalizeRankTier(tier: string | BackendRankTier): RankTier {
  return tier.toLowerCase() as RankTier;
}

/**
 * Get rank tier from ELO rating.
 */
export function getRankTier(elo: number): RankTier {
  if (elo >= 2800) return 'grandmaster';
  if (elo >= 2400) return 'master';
  if (elo >= 2000) return 'diamond';
  if (elo >= 1600) return 'platinum';
  if (elo >= 1200) return 'gold';
  if (elo >= 800) return 'silver';
  return 'bronze';
}

/**
 * Get rank tier info with safe normalization from backend response.
 */
export function getRankTierInfo(tierOrElo: string | number): { tier: RankTier; info: typeof RANK_TIERS[RankTier] } {
  const tier = typeof tierOrElo === 'number' 
    ? getRankTier(tierOrElo) 
    : normalizeRankTier(tierOrElo);
  return { tier, info: RANK_TIERS[tier] };
}

/**
 * Player rating with ELO and tier.
 */
export interface PlayerRating {
  user_id: string;
  elo: number;
  tier: RankTier;
  peak_elo: number;
  wins: number;
  losses: number;
}

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

// ELO-specific types
export interface ELOLeaderboardEntry {
  rank: number
  user_id: string
  display_name: string | null
  avatar_url: string | null
  elo: number
  tier: BackendRankTier
  win_rate: number
  games_played: number
}

export interface ELOLeaderboardResponse {
  entries: ELOLeaderboardEntry[]
  total_players: number
  page: number
  page_size: number
  region?: string
}

export interface ELOPlayerRating {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  current_elo: number
  peak_elo: number
  current_tier: BackendRankTier
  win_rate: number
  last_match_date: string | null
}

export interface UserELORankResponse {
  rank: number
  total_players: number
  rating: ELOPlayerRating
  nearby_players: ELOLeaderboardEntry[]
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
    gradient: 'from-emerald-500 to-emerald-600',
  },
  total_score: {
    id: 'total_score',
    name: 'Total Score',
    icon: '⭐',
    description: 'Cumulative points earned',
    format: (v) => v.toLocaleString(),
    secondaryFormat: (v) => `${v} games`,
    gradient: 'from-indigo-500 to-indigo-600',
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
    gradient: 'from-blue-500 to-indigo-600',
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
  elo: {
    id: 'elo',
    name: 'ELO Rating',
    icon: '🏅',
    description: 'Competitive ranking',
    format: (v) => v.toLocaleString(),
    secondaryFormat: (v) => `Peak: ${v}`,
    gradient: 'from-indigo-500 to-indigo-600',
  },
}

export const ALL_CATEGORIES: LeaderboardCategory[] = [
  'elo',
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
