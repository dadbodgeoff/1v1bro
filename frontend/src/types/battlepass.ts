/**
 * Battle Pass types for season progression.
 * Requirements: 4.1, 4.2
 */

/**
 * Season information.
 */
export interface Season {
  id: string;
  name: string;
  season_number: number;
  theme?: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  xp_per_tier: number;
  max_tier: number;  // Total tiers in this season (e.g., 35)
  // Legacy fields for backwards compatibility
  number?: number;
}

/**
 * Reward types.
 */
export type RewardType = 'coins' | 'xp_boost' | 'cosmetic' | 'title';

/**
 * Cosmetic info embedded in reward.
 */
export interface RewardCosmetic {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description?: string;
  image_url: string;
  sprite_sheet_url?: string;
  preview_video_url?: string;
  price_coins?: number;
}

/**
 * Battle pass reward.
 */
export interface Reward {
  type: RewardType;
  value: string | number;
  cosmetic?: RewardCosmetic | null;
  // Legacy fields for backwards compatibility
  cosmetic_id?: string;
  cosmetic_preview_url?: string;
}

/**
 * Battle pass tier with rewards.
 */
export interface BattlePassTier {
  tier_number: number;
  free_reward?: Reward | null;
  premium_reward?: Reward | null;
  // Legacy field for backwards compatibility
  tier?: number;
  xp_required?: number;
}

/**
 * Player's battle pass progress.
 * Matches backend PlayerBattlePass schema from app/schemas/battlepass.py
 */
export interface PlayerBattlePass {
  user_id: string;
  season: Season;
  current_tier: number;
  current_xp: number;
  xp_to_next_tier: number;
  total_xp: number;
  is_premium: boolean;
  // Fixed: Backend uses single arrays, not separate free/premium arrays
  claimed_rewards: number[];    // Tier numbers that have been claimed
  claimable_rewards: number[];  // Tier numbers with unclaimed rewards
  last_updated?: string;
}

/**
 * Legacy interface for backwards compatibility during migration.
 * @deprecated Use PlayerBattlePass instead
 */
export interface PlayerBattlePassLegacy {
  season_id: string;
  current_tier: number;
  current_xp: number;
  xp_to_next_tier: number;
  is_premium: boolean;
  claimed_free_tiers: number[];
  claimed_premium_tiers: number[];
  claimable_free_tiers: number[];
  claimable_premium_tiers: number[];
}

/**
 * XP award result.
 */
export interface XPAwardResult {
  xp_awarded: number;
  new_total_xp: number;
  new_tier: number;
  tiers_gained: number;
  new_rewards_available: boolean;
}

/**
 * XP sources for tracking.
 */
export type XPSource = 'match_win' | 'match_loss' | 'kill' | 'streak' | 'daily_bonus' | 'challenge';

/**
 * Calculate XP progress percentage to next tier.
 * 
 * Formula: current_xp / xp_per_tier * 100
 * Where xp_per_tier = current_xp + xp_to_next_tier
 * 
 * Example: If current_xp=360 and xp_to_next_tier=40, then xp_per_tier=400
 * Progress = 360/400 * 100 = 90%
 */
export function getXPProgress(progress: PlayerBattlePass): number {
  // xp_per_tier = current_xp + xp_to_next_tier (total XP needed for this tier)
  const xpPerTier = progress.current_xp + progress.xp_to_next_tier;
  if (xpPerTier === 0) return 100;
  // Calculate percentage of tier completed
  return Math.min(100, Math.round((progress.current_xp / xpPerTier) * 100));
}

/**
 * Get count of claimable rewards.
 */
export function getClaimableCount(progress: PlayerBattlePass): number {
  return progress.claimable_rewards?.length ?? 0;
}

/**
 * Get days remaining in season.
 */
export function getDaysRemaining(season: Season): number {
  const end = new Date(season.end_date);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
