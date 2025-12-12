/**
 * Achievement System Types
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

// Achievement rarity tiers
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Achievement categories
export type AchievementCategory = 'games' | 'wins' | 'streaks' | 'combat' | 'accuracy' | 'social';

// Criteria types for achievement unlock conditions
export type CriteriaType = 
  | 'games_played' 
  | 'games_won' 
  | 'win_streak' 
  | 'total_kills' 
  | 'accuracy' 
  | 'friends_count';

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  criteria_type: CriteriaType;
  criteria_value: number;
  is_active: boolean;
  sort_order: number;
  coin_reward: number; // Always 3
}

/**
 * User's earned achievement with timestamp
 */
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievements?: Achievement; // Joined data from API
}

/**
 * Progress toward an achievement
 */
export interface AchievementProgress {
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_rarity: AchievementRarity;
  achievement_category: AchievementCategory;
  achievement_icon_url: string;
  criteria_type: CriteriaType;
  current_value: number;
  target_value: number;
  percentage: number; // 0-100
  is_unlocked: boolean;
  coin_reward: number;
}

/**
 * Achievement statistics for profile display
 */
export interface AchievementStats {
  total_earned: number;
  total_possible: number;
  completion_percentage: number;
  by_rarity: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  recent_achievements: UserAchievement[];
  total_coins_earned: number;
}

/**
 * Achievement unlock event (returned when achievement is awarded)
 */
export interface AchievementUnlock {
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_rarity: AchievementRarity;
  achievement_icon_url: string;
  coins_awarded: number;
  earned_at: string;
  notification_id?: string;
}

/**
 * Achievement toast notification data
 */
export interface AchievementToastData {
  id: string;
  achievement: Achievement;
  earnedAt: string;
  coinsAwarded: number;
}

/**
 * Filter options for achievement panel
 */
export type AchievementFilter = 'all' | 'locked' | 'unlocked';

/**
 * Grouped achievements by category
 */
export interface AchievementsByCategory {
  [category: string]: Achievement[];
}

/**
 * Rarity configuration for styling
 */
export const RARITY_CONFIG: Record<AchievementRarity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}> = {
  common: {
    label: 'Common',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500',
    glowColor: 'shadow-gray-500/30',
  },
  uncommon: {
    label: 'Uncommon',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    glowColor: 'shadow-green-500/30',
  },
  rare: {
    label: 'Rare',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/30',
  },
  epic: {
    label: 'Epic',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/30',
  },
  legendary: {
    label: 'Legendary',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/30',
  },
};

/**
 * Category configuration for display
 */
export const CATEGORY_CONFIG: Record<AchievementCategory, {
  label: string;
  icon: string;
  description: string;
}> = {
  games: {
    label: 'Games',
    icon: '🎮',
    description: 'Play games to earn these achievements',
  },
  wins: {
    label: 'Wins',
    icon: '🏆',
    description: 'Win games to earn these achievements',
  },
  streaks: {
    label: 'Streaks',
    icon: '🔥',
    description: 'Build win streaks to earn these achievements',
  },
  combat: {
    label: 'Combat',
    icon: '⚔️',
    description: 'Get kills to earn these achievements',
  },
  accuracy: {
    label: 'Accuracy',
    icon: '🎯',
    description: 'Improve your accuracy to earn these achievements',
  },
  social: {
    label: 'Social',
    icon: '👥',
    description: 'Make friends to earn these achievements',
  },
};

/**
 * Helper to get rarity order for sorting
 */
export const RARITY_ORDER: Record<AchievementRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/**
 * Helper to format earned date
 */
export function formatEarnedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Helper to calculate progress percentage
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.floor((current / target) * 100));
}
