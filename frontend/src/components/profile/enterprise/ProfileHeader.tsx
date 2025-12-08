/**
 * ProfileHeader - Enterprise Profile Header Component
 * 
 * Features:
 * - Full-width banner with gradient overlay (256px desktop, 160px mobile)
 * - Avatar (120px) with circular tier progress ring (unified with Battle Pass)
 * - Player identity section (name H1 3xl-4xl extrabold, title sm accent, tier badge)
 * - Country flag emoji with tooltip
 * - Edit button for own profile (top-right)
 * - Banner image vs solid color display
 * - No active season state handling
 * 
 * UNIFIED PROGRESSION: Uses Battle Pass tier as player level
 * 
 * Props:
 * - profile: Profile data
 * - battlePassProgress: PlayerBattlePass for unified progression display
 * - isOwnProfile: Show edit controls
 * - onEdit: Edit button callback
 * - onAvatarClick: Avatar click callback (for upload)
 * - className: Additional CSS classes
 */

import { useEffect, useState } from 'react'
import type { Profile } from '@/types/profile'
import type { PlayerBattlePass } from '@/types/battlepass'
import { getAvatarUrl, getBannerUrl } from '@/types/profile'
import { cn } from '@/utils/helpers'

interface ProfileHeaderProps {
  profile: Profile
  battlePassProgress?: PlayerBattlePass | null
  isOwnProfile?: boolean
  onEdit?: () => void
  onAvatarClick?: () => void
  className?: string
}

// Tier ring configuration
const TIER_RING_CONFIG = {
  size: 120,
  strokeWidth: 4,
  progressColor: '#6366f1', // indigo-500
  trackColor: '#374151',    // gray-700
}

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪',
  FR: '🇫🇷', JP: '🇯🇵', KR: '🇰🇷', BR: '🇧🇷', MX: '🇲🇽',
  ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱', SE: '🇸🇪', NO: '🇳🇴',
  DK: '🇩🇰', FI: '🇫🇮', PL: '🇵🇱', RU: '🇷🇺', CN: '🇨🇳',
  IN: '🇮🇳', ID: '🇮🇩', TH: '🇹🇭', VN: '🇻🇳', PH: '🇵🇭',
}

// Country name mapping
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia', DE: 'Germany',
  FR: 'France', JP: 'Japan', KR: 'South Korea', BR: 'Brazil', MX: 'Mexico',
  ES: 'Spain', IT: 'Italy', NL: 'Netherlands', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', FI: 'Finland', PL: 'Poland', RU: 'Russia', CN: 'China',
  IN: 'India', ID: 'Indonesia', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines',
}

/**
 * Calculate tier ring progress percentage
 */
export function calculateTierProgress(battlePassProgress: PlayerBattlePass | null | undefined): number {
  if (!battlePassProgress) return 0
  if (battlePassProgress.xp_to_next_tier === 0) return 100
  return Math.min(100, Math.round((battlePassProgress.current_xp / battlePassProgress.xp_to_next_tier) * 100))
}

export function ProfileHeader({
  profile,
  battlePassProgress,
  isOwnProfile = false,
  onEdit,
  onAvatarClick,
  className,
}: ProfileHeaderProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [showTierOnAvatar, setShowTierOnAvatar] = useState(false)

  const tierProgress = calculateTierProgress(battlePassProgress)
  const currentTier = battlePassProgress?.current_tier ?? 0
  const hasActiveSeason = battlePassProgress?.season?.is_active ?? false

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(tierProgress)
    }, 100)
    return () => clearTimeout(timer)
  }, [tierProgress])

  // Calculate SVG circle properties
  const radius = (TIER_RING_CONFIG.size - TIER_RING_CONFIG.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  return (
    <div className={cn('relative', className)}>
      {/* Banner */}
      <div 
        className="relative h-40 md:h-64 w-full overflow-hidden rounded-t-xl"
        style={{ backgroundColor: profile.banner_color || '#1a1a2e' }}
      >
        {/* Banner Image */}
        {profile.banner_url && (
          <img 
            src={getBannerUrl(profile.banner_url, 'large')}
            alt="Profile banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Edit Button */}
        {isOwnProfile && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white text-sm font-medium rounded-lg backdrop-blur-sm transition-colors border border-white/10"
          >
            <EditIcon className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar and Identity Section */}
      <div className="relative px-6 pb-6 bg-[var(--color-bg-card)]">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar with Tier Ring */}
          <div 
            className="-mt-16 relative cursor-pointer group"
            onClick={onAvatarClick}
            onMouseEnter={() => setShowTierOnAvatar(true)}
            onMouseLeave={() => setShowTierOnAvatar(false)}
          >
            {/* Tier Ring SVG */}
            <svg
              width={TIER_RING_CONFIG.size}
              height={TIER_RING_CONFIG.size}
              className="absolute top-0 left-0 -rotate-90"
            >
              {/* Background Track */}
              <circle
                cx={TIER_RING_CONFIG.size / 2}
                cy={TIER_RING_CONFIG.size / 2}
                r={radius}
                fill="none"
                stroke={TIER_RING_CONFIG.trackColor}
                strokeWidth={TIER_RING_CONFIG.strokeWidth}
              />
              {/* Progress Arc */}
              <circle
                cx={TIER_RING_CONFIG.size / 2}
                cy={TIER_RING_CONFIG.size / 2}
                r={radius}
                fill="none"
                stroke={TIER_RING_CONFIG.progressColor}
                strokeWidth={TIER_RING_CONFIG.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-800 ease-out"
              />
            </svg>

            {/* Avatar Image */}
            <img
              src={getAvatarUrl(profile.avatar_url, 'large')}
              alt={profile.display_name}
              className={cn(
                'w-[120px] h-[120px] rounded-full border-4 border-[var(--color-bg-card)] bg-[var(--color-bg-elevated)] object-cover',
                'transition-transform duration-200 group-hover:scale-105'
              )}
            />

            {/* Tier Number Overlay on Hover */}
            {showTierOnAvatar && hasActiveSeason && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <span className="text-2xl font-bold text-white">{currentTier}</span>
              </div>
            )}

            {/* Camera Icon for Own Profile */}
            {isOwnProfile && (
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Player Identity */}
          <div className="flex-1 pb-2">
            {/* Display Name - H1 */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {profile.display_name}
              {profile.country && (
                <span 
                  className="text-2xl cursor-help"
                  title={COUNTRY_NAMES[profile.country] || profile.country}
                >
                  {COUNTRY_FLAGS[profile.country] || profile.country}
                </span>
              )}
            </h1>

            {/* Title and Tier Badge Row */}
            <div className="flex items-center gap-3 mt-2">
              {/* Player Title */}
              {profile.title && (
                <span className="text-sm font-medium text-[#818cf8]">
                  {profile.title}
                </span>
              )}

              {/* Tier Badge */}
              {hasActiveSeason ? (
                <span className="px-3 py-1 text-sm font-bold text-white bg-[#6366f1] rounded-full">
                  Tier {currentTier}
                </span>
              ) : (
                <span className="px-3 py-1 text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] rounded-full border border-white/10">
                  No Active Season
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 text-base text-gray-300 line-clamp-3">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
