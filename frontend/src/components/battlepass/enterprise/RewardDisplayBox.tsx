/**
 * RewardDisplayBox - Configurable Size Display Component
 * 
 * Enterprise Standard Box Sizes:
 * - XL (Featured): 420px min-height, 240px image, full details
 * - LG (Spotlight): 200px min-height, 160px image, with description
 * - MD (Standard): 280px min-height, 120px image, essential info
 * - SM (Compact): 180px min-height, 80px image, name + type only
 * 
 * Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2
 */

import { cn } from '@/utils/helpers'
import { RewardIcon } from './RewardIcon'
import { RarityBadge } from './RarityBadge'
import { CrownIcon, LockIcon, CheckIcon } from './RewardIcons'
import {
  sizeConfig,
  rarityBorders,
  rarityGlows,
  rarityBgGradients,
  premiumStyles,
  getRarityBorder,
  getRarityGlow,
  getSizeConfig,
} from './rewardConfig'
import type { DisplaySize, RewardType, ClaimState, Rarity, Reward } from './types'

// Re-export types and config for backward compatibility
export type { DisplaySize, RewardType, ClaimState, Rarity, Reward }
export { sizeConfig, rarityBorders, rarityGlows, getRarityBorder, getRarityGlow, getSizeConfig }

interface RewardDisplayBoxProps {
  reward: Reward | null
  size?: DisplaySize
  isPremium?: boolean
  claimState: ClaimState
  onClaim?: () => void
  className?: string
}

// Helper functions
function getRewardName(reward: Reward): string {
  if (reward.cosmetic_name) return reward.cosmetic_name
  if (reward.type === 'coins') return `${reward.value} Coins`
  if (reward.type === 'xp_boost') return `${reward.value}x XP Boost`
  if (reward.type === 'title') return String(reward.value)
  return String(reward.value)
}

function getRewardTypeLabel(type: RewardType): string {
  switch (type) {
    case 'coins':
      return 'COINS'
    case 'xp_boost':
      return 'XP BOOST'
    case 'cosmetic':
      return 'COSMETIC'
    case 'title':
      return 'TITLE'
    default:
      return 'REWARD'
  }
}

export function RewardDisplayBox({
  reward,
  size = 'md',
  isPremium = false,
  claimState,
  onClaim,
  className,
}: RewardDisplayBoxProps) {
  const config = sizeConfig[size]
  const rarity = reward?.rarity || 'common'
  const isClaimable = claimState === 'claimable'
  const isClaimed = claimState === 'claimed'
  const isLocked = claimState === 'locked'

  // Empty state
  if (!reward) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl',
          'bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]',
          config.minHeight,
          className
        )}
      >
        <span className="text-sm text-[var(--color-text-muted)]">—</span>
      </div>
    )
  }

  return (
    <div
      role={onClaim && isClaimable ? 'button' : undefined}
      tabIndex={onClaim && isClaimable ? 0 : undefined}
      aria-label={`${getRewardName(reward)}, ${rarity} ${getRewardTypeLabel(reward.type)}${isPremium ? ', premium' : ''}${isClaimed ? ', claimed' : ''}${isClaimable ? ', claimable' : ''}`}
      onKeyDown={(e) => {
        if (onClaim && isClaimable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClaim()
        }
      }}
      className={cn(
        'group relative rounded-xl border-2 overflow-hidden',
        'transition-all duration-300 ease-out',
        // Accessibility utilities
        'focus-ring press-feedback touch-target',
        // Base styling
        isPremium
          ? cn('bg-gradient-to-br', premiumStyles.background, premiumStyles.border)
          : cn('bg-[var(--color-bg-card)]', rarityBorders[rarity]),
        // Hover effects
        !isClaimed && !isLocked && (isPremium ? premiumStyles.glow : rarityGlows[rarity]),
        // Claimable glow
        isClaimable && !isPremium && 'animate-pulse-glow-success',
        isClaimable && isPremium && 'animate-pulse-glow-premium',
        // Claimed state
        isClaimed && 'opacity-85',
        config.minHeight,
        className
      )}
    >
      {/* Rarity Background Gradient */}
      {!isPremium && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br pointer-events-none',
            rarityBgGradients[rarity]
          )}
        />
      )}

      <div className={cn('relative h-full flex flex-col', config.padding)}>
        {/* Top Badges Row */}
        <div className={cn('flex items-start justify-between', config.badgeGap)}>
          {/* Premium Crown Badge */}
          {isPremium && (
            <div
              className={cn(
                'flex items-center bg-[#f59e0b]/90 rounded-full',
                size === 'sm' ? 'gap-1 px-1.5 py-0.5' : 'gap-1.5 px-2 py-1'
              )}
            >
              <CrownIcon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
              <span
                className={cn(
                  'font-bold text-black uppercase tracking-wide',
                  size === 'sm' ? 'text-[9px]' : 'text-[10px]'
                )}
              >
                Premium
              </span>
            </div>
          )}
          {!isPremium && <div />}

          {/* Rarity Badge */}
          {reward.rarity && (
            <RarityBadge rarity={reward.rarity} size={config.badgeSize} />
          )}
        </div>

        {/* Image/Preview Area */}
        <div className={cn('flex-1 flex items-center justify-center', config.imageWrapper)}>
          <div className="relative">
            <RewardIcon reward={reward} size={config.imageSize} />

            {/* Lock Overlay for Premium */}
            {isLocked && isPremium && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <LockIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
            )}

            {/* Claimed Overlay */}
            {isClaimed && (
              <div className="absolute inset-0 bg-[#10b981]/20 rounded-lg flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reward Info */}
        <div className={cn('flex flex-col', config.gap)}>
          {/* Reward Name */}
          <h3
            className={cn(
              'text-white truncate leading-tight',
              config.titleSize,
              config.titleWeight,
              config.titleTracking
            )}
          >
            {getRewardName(reward)}
          </h3>

          {/* Reward Type Label */}
          {config.showType && config.typeSize && (
            <p
              className={cn(
                'text-[var(--color-text-muted)] font-semibold uppercase tracking-wider',
                config.typeSize
              )}
            >
              {getRewardTypeLabel(reward.type)}
            </p>
          )}
        </div>

        {/* Claim Button Overlay */}
        {isClaimable && onClaim && (
          <button
            onClick={onClaim}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity'
            )}
          >
            <span
              className={cn(
                'px-3 py-1.5 rounded font-bold text-sm',
                isPremium
                  ? 'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] text-black'
                  : 'bg-white text-black'
              )}
            >
              Claim
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default RewardDisplayBox
