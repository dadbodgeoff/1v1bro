/**
 * RewardDisplayBox - Configurable Size Display Component
 * 
 * Enterprise Standard Box Sizes:
 * - XL (Featured): 420px min-height, 240px image, full details
 * - LG (Spotlight): 200px min-height, 160px image, with description
 * - MD (Standard): 280px min-height, 120px image, essential info
 * - SM (Compact): 180px min-height, 80px image, name + type only
 * 
 * Typography Hierarchy per size:
 * - XL: 28px extrabold title, 12px uppercase type label, 14px description
 * - LG: 22px bold title, 11px uppercase type label, 13px description
 * - MD: 16px bold title, 10px uppercase type label, no description
 * - SM: 14px semibold title, no type label, no description
 * 
 * Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2
 */

import { cn } from '@/utils/helpers'
import { SkinPreview } from '@/components/shop/SkinPreview'

export type DisplaySize = 'xl' | 'lg' | 'md' | 'sm'
export type RewardType = 'coins' | 'xp_boost' | 'cosmetic' | 'title'
export type ClaimState = 'locked' | 'claimable' | 'claimed'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Reward {
  type: RewardType
  value: string | number
  preview_url?: string
  sprite_sheet_url?: string
  rarity?: Rarity
  cosmetic_name?: string
}

// Supabase storage URL for coin reward image
const COINS_IMAGE_URL = '/api/v1/storage/cosmetics/playercard/coins.jpg'

interface RewardDisplayBoxProps {
  reward: Reward | null
  size?: DisplaySize
  isPremium?: boolean
  claimState: ClaimState
  onClaim?: () => void
  className?: string
}

/**
 * Enterprise Standard Size Configuration
 * Each size has uniform, purpose-driven specifications
 */
export const sizeConfig = {
  xl: {
    container: 'col-span-2 row-span-2',
    minHeight: 'min-h-[420px]',
    imageSize: 240,
    imageWrapper: 'p-4',
    padding: 'p-6',
    gap: 'gap-4',
    badgeGap: 'mb-4',
    titleSize: 'text-2xl md:text-[28px]',
    titleWeight: 'font-extrabold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-xs',
    descSize: 'text-sm',
    showDescription: true,
    showType: true,
    badgeSize: 'md' as const,
    ctaSize: 'md' as const,
  },
  lg: {
    container: 'col-span-2 row-span-1',
    minHeight: 'min-h-[200px]',
    imageSize: 160,
    imageWrapper: 'p-3',
    padding: 'p-5',
    gap: 'gap-3',
    badgeGap: 'mb-3',
    titleSize: 'text-xl md:text-[22px]',
    titleWeight: 'font-bold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-[11px]',
    descSize: 'text-[13px]',
    showDescription: true,
    showType: true,
    badgeSize: 'md' as const,
    ctaSize: 'md' as const,
  },
  md: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[280px]',
    imageSize: 120,
    imageWrapper: 'p-2',
    padding: 'p-4',
    gap: 'gap-2',
    badgeGap: 'mb-2',
    titleSize: 'text-base',
    titleWeight: 'font-bold',
    titleTracking: '',
    typeSize: 'text-[10px]',
    descSize: '',
    showDescription: false,
    showType: true,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
  sm: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[180px]',
    imageSize: 64,
    imageWrapper: 'p-1',
    padding: 'p-2',
    gap: 'gap-1',
    badgeGap: 'mb-1',
    titleSize: 'text-xs',
    titleWeight: 'font-semibold',
    titleTracking: '',
    typeSize: '',
    descSize: '',
    showDescription: false,
    showType: false,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
}

export const rarityBorders: Record<Rarity, string> = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
}

export const rarityGlows: Record<Rarity, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
}

export const rarityBgGradients: Record<Rarity, string> = {
  common: 'from-[#737373]/5 to-transparent',
  uncommon: 'from-[#10b981]/10 to-transparent',
  rare: 'from-[#3b82f6]/10 to-transparent',
  epic: 'from-[#a855f7]/10 to-transparent',
  legendary: 'from-[#f59e0b]/15 to-transparent',
}

const premiumStyles = {
  background: 'from-[#f59e0b]/20 to-[#ea580c]/20',
  border: 'border-[#f59e0b]/30',
  glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
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
      className={cn(
        'group relative rounded-xl border-2 overflow-hidden',
        'transition-all duration-300 ease-out',
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

// Sub-components
interface RewardIconProps {
  reward: Reward
  size: number
}

/**
 * Check if a cosmetic is a playercard based on name or URL
 * Handles various naming conventions: "playercard", "player card", "Player Card"
 */
function isPlayercard(reward: Reward): boolean {
  const name = (reward.cosmetic_name || '').toLowerCase()
  const url = decodeURIComponent(reward.preview_url || reward.sprite_sheet_url || '').toLowerCase()
  return (
    name.includes('card') || 
    url.includes('playercard') || 
    url.includes('player card') ||
    url.includes('player%20card')
  )
}

function RewardIcon({ reward, size }: RewardIconProps) {
  // For cosmetics, check if it's a playercard (portrait aspect ratio)
  if (reward.type === 'cosmetic') {
    const spriteUrl = reward.sprite_sheet_url || reward.preview_url
    
    // Playercards need portrait aspect ratio display
    if (spriteUrl && isPlayercard(reward)) {
      return (
        <div 
          className="relative rounded-lg overflow-hidden border border-white/10"
          style={{ 
            width: size, 
            height: size * 1.4, // Portrait aspect ratio
          }}
        >
          <img
            src={spriteUrl}
            alt={reward.cosmetic_name || 'Player Card'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Subtle gradient overlay for polish */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>
      )
    }
    
    // Regular cosmetics use SkinPreview (sprite sheets)
    if (spriteUrl) {
      return (
        <SkinPreview
          spriteSheetUrl={spriteUrl}
          size={size}
          animate={false}
          frameIndex={0}
        />
      )
    }
  }

  // For non-cosmetic rewards with preview images (shouldn't happen often)
  if (reward.preview_url) {
    return (
      <SkinPreview
        spriteSheetUrl={reward.preview_url}
        size={size}
        animate={false}
        frameIndex={0}
      />
    )
  }

  const iconSize = Math.min(size * 0.6, 64)

  switch (reward.type) {
    case 'coins':
      // Use the coins.jpg image from Supabase storage
      return (
        <div 
          className="relative rounded-lg overflow-hidden"
          style={{ width: size, height: size }}
        >
          <img
            src={COINS_IMAGE_URL}
            alt={`${reward.value} Coins`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to SVG icon if image fails to load
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement?.classList.add('coins-fallback')
            }}
          />
          {/* Subtle gold glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b]/20 via-transparent to-transparent pointer-events-none" />
        </div>
      )
    case 'xp_boost':
      return <XPBoostIcon className="text-[#a855f7]" style={{ width: iconSize, height: iconSize }} />
    case 'title':
      return <TitleIcon className="text-white" style={{ width: iconSize, height: iconSize }} />
    default:
      return <GiftIcon className="text-[var(--color-text-muted)]" style={{ width: iconSize, height: iconSize }} />
  }
}

interface RarityBadgeProps {
  rarity: Rarity
  size: 'sm' | 'md'
}

const rarityColors: Record<Rarity, string> = {
  common: 'bg-[#737373]',
  uncommon: 'bg-[#10b981]',
  rare: 'bg-[#3b82f6]',
  epic: 'bg-[#a855f7]',
  legendary: 'bg-[#f59e0b]',
}

function RarityBadge({ rarity, size }: RarityBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full font-bold text-white uppercase tracking-wide',
        rarityColors[rarity],
        rarity === 'legendary' && 'animate-shimmer',
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      )}
    >
      {rarity}
    </span>
  )
}

// Icons
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XPBoostIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function TitleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function GiftIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

/**
 * Get rarity border class for a given rarity.
 * Exported for property testing.
 */
export function getRarityBorder(rarity: Rarity): string {
  return rarityBorders[rarity]
}

/**
 * Get rarity glow class for a given rarity.
 * Exported for property testing.
 */
export function getRarityGlow(rarity: Rarity): string {
  return rarityGlows[rarity]
}

/**
 * Get size config for a given size.
 * Exported for property testing.
 */
export function getSizeConfig(size: DisplaySize) {
  return sizeConfig[size]
}

export default RewardDisplayBox
