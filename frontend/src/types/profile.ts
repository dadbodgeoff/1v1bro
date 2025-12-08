/**
 * Profile types for user profile management.
 * Requirements: 2.1
 */

/**
 * Social links for user profile.
 */
export interface SocialLinks {
  twitter?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
}

/**
 * Privacy settings for user profile.
 */
export interface PrivacySettings {
  is_public: boolean;
  accept_friend_requests: boolean;
  allow_messages: boolean;
}

/**
 * Rank tier for ELO ratings.
 * Matches backend RankTier enum.
 */
export type BackendRankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

/**
 * Full user profile.
 * Matches backend Profile schema from app/schemas/profile.py
 */
export interface Profile {
  user_id: string;  // Backend returns user_id, not id
  display_name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  banner_color?: string;
  level: number;
  total_xp: number;
  title?: string;
  country?: string;
  social_links?: SocialLinks;
  // Privacy settings are flat fields, not nested object
  is_public: boolean;
  accept_friend_requests: boolean;
  allow_messages: boolean;
  // Game statistics
  games_played: number;
  games_won: number;
  best_win_streak: number;
  // ELO statistics (unified source of truth)
  current_elo: number;
  peak_elo: number;
  current_tier: BackendRankTier;
  // Security
  two_factor_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calculate win rate from profile stats.
 */
export function getWinRate(profile: Profile): number {
  if (profile.games_played === 0) return 0;
  return Math.round((profile.games_won / profile.games_played) * 10000) / 100;
}

/**
 * Profile update request.
 * Matches backend ProfileUpdate schema from app/schemas/profile.py
 */
export interface ProfileUpdate {
  display_name?: string;
  bio?: string;
  title?: string;
  country?: string;
  banner_color?: string;
  social_links?: SocialLinks;
}

/**
 * Privacy settings update request.
 */
export interface PrivacySettingsUpdate {
  is_public?: boolean;
  accept_friend_requests?: boolean;
  allow_messages?: boolean;
}

/**
 * Signed upload URL response.
 * Matches backend SignedUploadUrl schema from app/schemas/profile.py
 */
export interface SignedUploadUrl {
  upload_url: string;
  storage_path: string;  // Fixed: was file_path, backend returns storage_path
  bucket?: string;  // Supabase storage bucket name
  expires_at: string;
  max_size_bytes: number;
  allowed_types: string[];
}

/**
 * Avatar sizes available.
 */
export type AvatarSize = 'small' | 'medium' | 'large';

/**
 * Get avatar URL with size suffix.
 * For Supabase storage URLs, returns the URL as-is.
 * For processed uploads with size variants, appends the size suffix.
 */
export function getAvatarUrl(baseUrl: string | undefined, size: AvatarSize = 'medium'): string {
  if (!baseUrl) return '/default-avatar.png';
  
  // If URL is from Supabase storage, return as-is
  if (baseUrl.includes('supabase') || baseUrl.includes('/storage/') || baseUrl.includes('/avatars/')) {
    return baseUrl;
  }
  
  const sizeMap: Record<AvatarSize, string> = {
    small: '_128',
    medium: '_256',
    large: '_512',
  };
  
  // Insert size suffix before extension
  const lastDot = baseUrl.lastIndexOf('.');
  if (lastDot === -1) return baseUrl;
  
  return baseUrl.slice(0, lastDot) + sizeMap[size] + baseUrl.slice(lastDot);
}

/**
 * Banner sizes available.
 */
export type BannerSize = 'small' | 'large';

/**
 * Get banner URL with size suffix.
 * For Supabase storage URLs (cosmetics), returns the URL as-is.
 * For processed uploads with size variants, appends the size suffix.
 */
export function getBannerUrl(baseUrl: string | undefined, size: BannerSize = 'large'): string {
  if (!baseUrl) return '';
  
  // If URL is from Supabase storage (cosmetics bucket), return as-is
  // These URLs contain 'supabase' or are already full CDN URLs
  if (baseUrl.includes('supabase') || baseUrl.includes('/storage/') || baseUrl.includes('/cosmetics/')) {
    return baseUrl;
  }
  
  // For processed uploads with size variants
  const sizeMap: Record<BannerSize, string> = {
    small: '_960x270',
    large: '_1920x540',
  };
  
  const lastDot = baseUrl.lastIndexOf('.');
  if (lastDot === -1) return baseUrl;
  
  return baseUrl.slice(0, lastDot) + sizeMap[size] + baseUrl.slice(lastDot);
}
