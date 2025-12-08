/**
 * AchievementBadge - Achievement Display with Rarity Component
 * 
 * Features:
 * - Achievement icon (48px default, 64px for legendary)
 * - Rarity-colored background to icon container
 * - Achievement name below icon
 * - Rarity border and glow effects
 * - Shimmer animation for legendary achievements
 * - Size variants (sm, md, lg)
 * - Hover tooltip with description and earned date
 * - Hover scale effect (1.1x)
 * 
 * Props:
 * - achievement: Achievement data
 * - size: Size variant
 * - className: Additional CSS classes
 */

import { cn } from '@/utils/helpers'
import type { Rarity } from '@/types/cosmetic'

export interface Achievement {
  id: string
  name: string
  description: string
  icon_url: string
  rarity: Rarity
  earned_at: string
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Rarity styling configuration
 */
export const rarityStyles: Record<Rarity, {
  border: string
  glow: string
  bgGradient: string
  shimmer: boolean
}> = {
  common: {
    border: 'border-[#737373]',
    glow: '',
    bgGradient: 'from-gray-600 to-gray-700',
    shimmer: false,
  },
  uncommon: {
    border: 'border-[#10b981]',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    bgGradient: 'from-green-600 to-green-700',
    shimmer: false,
  },
  rare: {
    border: 'border-[#3b82f6]',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    bgGradient: 'from-blue-600 to-blue-700',
    shimmer: false,
  },
  epic: {
    border: 'border-[#a855f7]',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    bgGradient: 'from-purple-600 to-purple-700',
    shimmer: false,
  },
  legendary: {
    border: 'border-[#f59e0b]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    bgGradient: 'from-orange-500 to-yellow-600',
    shimmer: true,
  },
}

/**
 * Get rarity style for an achievement
 */
export function getRarityStyle(rarity: Rarity) {
  return rarityStyles[rarity]
}

/**
 * Sort achievements by rarity (legendary first) then by date (newest first)
 */
export function sortAchievements(achievements: Achievement[]): Achievement[] {
  const rarityOrder: Record<Rarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    uncommon: 3,
    common: 4,
  }

  return [...achievements].sort((a, b) => {
    // First sort by rarity
    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity]
    if (rarityDiff !== 0) return rarityDiff

    // Then sort by date (newest first)
    return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
  })
}

const sizeConfig = {
  sm: {
    container: 'w-14 h-14',
    icon: 'w-8 h-8',
    text: 'text-xs',
  },
  md: {
    container: 'w-16 h-16',
    icon: 'w-12 h-12',
    text: 'text-xs',
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'w-16 h-16',
    text: 'text-sm',
  },
}

export function AchievementBadge({
  achievement,
  size = 'md',
  className,
}: AchievementBadgeProps) {
  const style = getRarityStyle(achievement.rarity)
  const sizeStyles = achievement.rarity === 'legendary' ? sizeConfig.lg : sizeConfig[size]

  const formattedDate = new Date(achievement.earned_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 group cursor-pointer',
        className
      )}
      title={`${achievement.name}\n${achievement.description}\nEarned: ${formattedDate}`}
    >
      {/* Icon Container */}
      <div
        className={cn(
          'relative rounded-xl border-2 flex items-center justify-center',
          'bg-gradient-to-br',
          style.bgGradient,
          style.border,
          style.glow,
          sizeStyles.container,
          'transition-all duration-200',
          'group-hover:scale-110 group-hover:shadow-lg',
          style.shimmer && 'animate-shimmer'
        )}
      >
        {/* Achievement Icon */}
        <img
          src={achievement.icon_url}
          alt={achievement.name}
          className={cn(sizeStyles.icon, 'object-contain')}
        />

        {/* Legendary Star Overlay */}
        {achievement.rarity === 'legendary' && (
          <div className="absolute -top-1 -right-1 text-yellow-400">
            <StarIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Achievement Name */}
      <span className={cn(
        'font-medium text-white text-center truncate max-w-[80px]',
        sizeStyles.text
      )}>
        {achievement.name}
      </span>
    </div>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
