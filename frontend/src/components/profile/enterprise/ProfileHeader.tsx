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
import { useViewport } from '@/hooks/useViewport'

interface ProfileHeaderProps {
  profile: Profile
  battlePassProgress?: PlayerBattlePass | null
  isOwnProfile?: boolean
  onEdit?: () => void
  onAvatarClick?: () => void
  className?: string
}

// Tier ring configuration - responsive sizes
// Uses CSS variables for colors to maintain design system consistency
const TIER_RING_CONFIG = {
  mobile: {
    size: 96,  // Smaller on mobile
    strokeWidth: 3,
  },
  desktop: {
    size: 120,
    strokeWidth: 4,
  },
  // CSS variable names - resolved at render time
  progressColorVar: '--color-accent-primary',
  trackColorVar: '--color-border-subtle',
}

// Get CSS variable value at runtime
function getCSSVar(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback
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
  const { isMobile } = useViewport()

  const tierProgress = calculateTierProgress(battlePassProgress)
  // Treat tier 0 as tier 1 for display (legacy users before unified progression)
  const rawTier = battlePassProgress?.current_tier ?? 0
  const currentTier = rawTier === 0 ? 1 : rawTier
  const hasActiveSeason = battlePassProgress?.season?.is_active ?? false

  // Responsive ring config
  const ringConfig = isMobile ? TIER_RING_CONFIG.mobile : TIER_RING_CONFIG.desktop

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(tierProgress)
    }, 100)
    return () => clearTimeout(timer)
  }, [tierProgress])

  // Calculate SVG circle properties
  const radius = (ringConfig.size - ringConfig.strokeWidth) / 2
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

        {/* Edit Button - Touch optimized (min 44px) */}
        {isOwnProfile && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-center gap-2 min-h-[44px] px-3 sm:px-4 py-2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-sm font-medium rounded-lg backdrop-blur-sm transition-colors border border-white/10 touch-manipulation"
          >
            <EditIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>
        )}
      </div>

      {/* Avatar and Identity Section */}
      <div className="relative px-4 sm:px-6 pb-4 sm:pb-6 bg-[var(--color-bg-card)]">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          {/* Avatar with Tier Ring - Responsive sizing */}
          <div 
            className="-mt-12 sm:-mt-16 relative cursor-pointer group mx-auto sm:mx-0"
            onClick={onAvatarClick}
            onMouseEnter={() => setShowTierOnAvatar(true)}
            onMouseLeave={() => setShowTierOnAvatar(false)}
          >
            {/* Tier Ring SVG */}
            <svg
              width={ringConfig.size}
              height={ringConfig.size}
              className="absolute top-0 left-0 -rotate-90"
            >
              {/* Background Track */}
              <circle
                cx={ringConfig.size / 2}
                cy={ringConfig.size / 2}
                r={radius}
                fill="none"
                stroke={getCSSVar(TIER_RING_CONFIG.trackColorVar, '#374151')}
                strokeWidth={ringConfig.strokeWidth}
              />
              {/* Progress Arc */}
              <circle
                cx={ringConfig.size / 2}
                cy={ringConfig.size / 2}
                r={radius}
                fill="none"
                stroke={getCSSVar(TIER_RING_CONFIG.progressColorVar, '#6366f1')}
                strokeWidth={ringConfig.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-800 ease-out"
              />
            </svg>

            {/* Avatar Image - Responsive sizing */}
            <img
              src={getAvatarUrl(profile.avatar_url, 'large')}
              alt={profile.display_name}
              className={cn(
                'rounded-full border-4 border-[var(--color-bg-card)] bg-[var(--color-bg-elevated)] object-cover',
                'transition-transform duration-200 group-hover:scale-105',
                isMobile ? 'w-[96px] h-[96px]' : 'w-[120px] h-[120px]'
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

          {/* Player Identity - Centered on mobile */}
          <div className="flex-1 pb-2 text-center sm:text-left">
            {/* Display Name - Fluid typography */}
            <h1 className="text-fluid-2xl sm:text-fluid-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
              <span className="break-words">{profile.display_name}</span>
              {profile.country && (
                <span 
                  className="text-xl sm:text-2xl cursor-help"
                  title={COUNTRY_NAMES[profile.country] || profile.country}
                >
                  {COUNTRY_FLAGS[profile.country] || profile.country}
                </span>
              )}
            </h1>

            {/* Title and Tier Badge Row - Wrap on mobile */}
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2 flex-wrap">
              {/* Player Title */}
              {profile.title && (
                <span className="text-sm font-medium text-[#818cf8]">
                  {profile.title}
                </span>
              )}

              {/* Tier Badge - Touch friendly */}
              {hasActiveSeason ? (
                <span className="px-3 py-1.5 text-sm font-bold text-white bg-[#6366f1] rounded-full min-h-[32px] flex items-center">
                  Tier {currentTier}
                </span>
              ) : (
                <span className="px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] rounded-full border border-white/10 min-h-[32px] flex items-center">
                  No Active Season
                </span>
              )}
            </div>

            {/* Bio - Better mobile readability */}
            {profile.bio && (
              <p className="mt-3 text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed">
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
