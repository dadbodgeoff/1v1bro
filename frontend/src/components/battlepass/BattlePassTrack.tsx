/**
 * BattlePassTrack Component - 2025 Enterprise Design System
 * Requirements: 4.1, 4.2, 4.3, 4.8, 6.4, 8.1, 8.2, 8.3
 *
 * Unified horizontal scrollable track with:
 * - Single reward per tier (shows premium if available, otherwise free)
 * - Clear FREE/PREMIUM badges on each reward
 * - Lock icon for premium rewards if user doesn't have premium pass
 * - Snap-scroll behavior
 * - Auto-scroll to current tier on load
 * - Visual connector line between tiers (filled up to current)
 * - Keyboard navigation (left/right arrows)
 * - Responsive size variants (SM mobile, MD tablet, LG desktop)
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { cn } from '@/utils/helpers'
import { SkinPreview } from '@/components/shop/SkinPreview'
import type { BattlePassTier, PlayerBattlePass } from '@/types/battlepass'

interface BattlePassTrackProps {
  tiers: BattlePassTier[]
  progress: PlayerBattlePass | null
  onClaimReward: (tier: number, isPremium: boolean) => Promise<boolean>
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface UnifiedReward {
  type: 'coins' | 'xp_boost' | 'cosmetic' | 'title'
  value: string | number
  isPremium: boolean
  preview_url?: string
  sprite_sheet_url?: string
  rarity: Rarity
  cosmetic_name?: string
}

export function BattlePassTrack({
  tiers,
  progress,
  onClaimReward,
}: BattlePassTrackProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentTier = progress?.current_tier || 0
  const isPremiumUser = progress?.is_premium || false
  const [viewportSize, setViewportSize] = useState<'sm' | 'md' | 'lg'>('md')

  // Responsive size detection
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      if (width < 640) setViewportSize('sm')
      else if (width < 1024) setViewportSize('md')
      else setViewportSize('lg')
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Auto-scroll to current tier on mount
  useEffect(() => {
    if (scrollRef.current && currentTier > 0) {
      const tierIndex = Math.max(0, currentTier - 1)
      const tierWidth = viewportSize === 'sm' ? 100 : viewportSize === 'md' ? 130 : 160
      const scrollPosition = tierIndex * tierWidth - scrollRef.current.clientWidth / 2 + tierWidth / 2

      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      })
    }
  }, [currentTier, viewportSize])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!scrollRef.current) return

    const scrollAmount = viewportSize === 'sm' ? 100 : viewportSize === 'md' ? 130 : 160
    if (e.key === 'ArrowLeft') {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else if (e.key === 'ArrowRight') {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }, [viewportSize])

  const scrollLeft = () => {
    const scrollAmount = viewportSize === 'sm' ? 200 : viewportSize === 'md' ? 260 : 320
    scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  const scrollRight = () => {
    const scrollAmount = viewportSize === 'sm' ? 200 : viewportSize === 'md' ? 260 : 320
    scrollRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const isClaimed = (tier: number): boolean => {
    if (!progress) return false
    return progress.claimed_rewards?.includes(tier) ?? false
  }

  // Get the primary reward for a tier (free first since all users get it, premium as fallback)
  const getUnifiedReward = (tier: BattlePassTier): UnifiedReward | null => {
    const premiumReward = tier.premium_reward
    const freeReward = tier.free_reward

    // Prefer free reward first (all users can claim it)
    if (freeReward) {
      const spriteUrl = freeReward.cosmetic?.sprite_sheet_url || freeReward.cosmetic?.image_url
      return {
        type: freeReward.type as UnifiedReward['type'],
        value: freeReward.value,
        isPremium: false,
        preview_url: freeReward.cosmetic?.image_url || freeReward.cosmetic_preview_url,
        sprite_sheet_url: spriteUrl,
        rarity: (freeReward.cosmetic?.rarity as Rarity) || 'common',
        cosmetic_name: freeReward.cosmetic?.name,
      }
    }

    // Fall back to premium reward if no free reward exists
    if (premiumReward) {
      const spriteUrl = premiumReward.cosmetic?.sprite_sheet_url || premiumReward.cosmetic?.image_url
      return {
        type: premiumReward.type as UnifiedReward['type'],
        value: premiumReward.value,
        isPremium: true,
        preview_url: premiumReward.cosmetic?.image_url || premiumReward.cosmetic_preview_url,
        sprite_sheet_url: spriteUrl,
        rarity: (premiumReward.cosmetic?.rarity as Rarity) || 'common',
        cosmetic_name: premiumReward.cosmetic?.name,
      }
    }

    return null
  }

  const getClaimState = (tierNum: number, isPremium: boolean): 'locked' | 'claimable' | 'claimed' => {
    const isUnlocked = currentTier >= tierNum
    const claimed = isClaimed(tierNum)
    
    if (claimed) return 'claimed'
    if (!isUnlocked) return 'locked'
    if (isPremium && !isPremiumUser) return 'locked'
    return 'claimable'
  }

  // Size configurations
  const sizeConfig = {
    sm: { cardWidth: 'w-[88px]', cardHeight: 'min-h-[120px]', imageSize: 56, tierSize: 'text-xs' },
    md: { cardWidth: 'w-[120px]', cardHeight: 'min-h-[150px]', imageSize: 72, tierSize: 'text-sm' },
    lg: { cardWidth: 'w-[150px]', cardHeight: 'min-h-[180px]', imageSize: 96, tierSize: 'text-base' },
  }

  const config = sizeConfig[viewportSize]

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-lg"
        aria-label="Scroll left"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-lg"
        aria-label="Scroll right"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Track Container */}
      <div
        ref={scrollRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={cn(
          'flex gap-3 overflow-x-auto py-4 px-12',
          'scroll-smooth snap-x snap-mandatory',
          'scrollbar-hide focus:outline-none'
        )}
        role="list"
        aria-label="Battle Pass Tiers"
      >
        {tiers.map((tier) => {
          const tierNum = tier.tier_number ?? tier.tier ?? 0
          const reward = getUnifiedReward(tier)
          const claimState = reward ? getClaimState(tierNum, reward.isPremium) : 'locked'
          const isUnlocked = currentTier >= tierNum
          const canClaim = claimState === 'claimable'
          
          return (
            <div 
              key={tierNum} 
              className={cn(
                'snap-center flex flex-col items-center flex-shrink-0',
                config.cardWidth
              )}
            >
              {/* Reward Card */}
              <div
                className={cn(
                  'relative rounded-xl border-2 overflow-hidden w-full transition-all duration-300',
                  config.cardHeight,
                  // Border color based on state
                  claimState === 'claimed' && 'border-[#10b981]/50 bg-[#10b981]/10',
                  claimState === 'claimable' && reward?.isPremium && 'border-[#f59e0b]/60 bg-gradient-to-b from-[#f59e0b]/20 to-transparent animate-pulse-subtle',
                  claimState === 'claimable' && !reward?.isPremium && 'border-[#6366f1]/60 bg-gradient-to-b from-[#6366f1]/20 to-transparent animate-pulse-subtle',
                  claimState === 'locked' && 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] opacity-60',
                  // Hover effect for claimable
                  canClaim && 'hover:scale-105 cursor-pointer'
                )}
                onClick={() => canClaim && reward && onClaimReward(tierNum, reward.isPremium)}
              >
                {/* FREE / PREMIUM Badge */}
                {reward && (
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
                        reward.isPremium 
                          ? 'bg-[#f59e0b] text-black' 
                          : 'bg-[#6366f1] text-white'
                      )}
                    >
                      {reward.isPremium ? '★' : 'FREE'}
                    </span>
                  </div>
                )}

                {/* Rarity Badge */}
                {reward?.rarity && reward.rarity !== 'common' && (
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <RarityBadge rarity={reward.rarity} />
                  </div>
                )}

                {/* Reward Content */}
                <div className="flex flex-col items-center justify-center h-full p-2 pt-6">
                  {reward ? (
                    <>
                      <RewardPreview reward={reward} size={config.imageSize} />
                      <p className="text-[10px] text-white font-medium mt-1.5 text-center truncate w-full px-1">
                        {getRewardName(reward)}
                      </p>
                    </>
                  ) : (
                    <span className="text-[var(--color-text-muted)] text-xs">—</span>
                  )}
                </div>

                {/* Lock Overlay for Premium */}
                {claimState === 'locked' && reward?.isPremium && !isPremiumUser && isUnlocked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <LockIcon className="w-6 h-6 text-[#f59e0b]" />
                      <span className="text-[9px] text-[#f59e0b] font-bold">PREMIUM</span>
                    </div>
                  </div>
                )}

                {/* Claimed Checkmark */}
                {claimState === 'claimed' && (
                  <div className="absolute inset-0 bg-[#10b981]/30 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center">
                      <CheckIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Tier Number */}
              <div
                className={cn(
                  'mt-2 w-8 h-8 rounded-full flex items-center justify-center font-bold',
                  config.tierSize,
                  isUnlocked 
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white' 
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]'
                )}
              >
                {tierNum}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Line (behind cards) */}
      <div className="absolute bottom-[26px] left-12 right-12 h-1 bg-[var(--color-border-subtle)] pointer-events-none rounded-full -z-10">
        <div
          className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] transition-all duration-500 rounded-full"
          style={{
            width: `${Math.min((currentTier / tiers.length) * 100, 100)}%`,
          }}
        />
      </div>
    </div>
  )
}

// Helper Components
function RewardPreview({ reward, size }: { reward: UnifiedReward; size: number }) {
  // For cosmetics, use SkinPreview which handles sprite sheets and background removal
  if (reward.type === 'cosmetic') {
    const spriteUrl = reward.sprite_sheet_url || reward.preview_url
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

  // For non-cosmetic rewards, show icons
  const iconSize = Math.min(size * 0.6, 48)
  
  switch (reward.type) {
    case 'coins':
      return (
        <div className="flex flex-col items-center">
          <CoinIcon style={{ width: iconSize, height: iconSize }} />
        </div>
      )
    case 'xp_boost':
      return (
        <div className="flex flex-col items-center">
          <XPBoostIcon style={{ width: iconSize, height: iconSize }} />
        </div>
      )
    default:
      return (
        <div 
          className="rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-[var(--color-text-muted)]">?</span>
        </div>
      )
  }
}

function getRewardName(reward: UnifiedReward): string {
  if (reward.cosmetic_name) return reward.cosmetic_name
  if (reward.type === 'coins') return `${reward.value} Coins`
  if (reward.type === 'xp_boost') return `${reward.value}`
  if (reward.type === 'title') return String(reward.value)
  return String(reward.value)
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const colors: Record<Rarity, string> = {
    common: 'bg-[#737373]',
    uncommon: 'bg-[#10b981]',
    rare: 'bg-[#3b82f6]',
    epic: 'bg-[#a855f7]',
    legendary: 'bg-[#f59e0b]',
  }
  
  return (
    <span className={cn(
      'px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase',
      colors[rarity],
      rarity === 'legendary' && 'animate-shimmer'
    )}>
      {rarity.charAt(0).toUpperCase()}
    </span>
  )
}

// Icons
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

// Coin image URL from Supabase storage (same as CoinShop)
const COIN_IMAGE_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/playercard/coins.jpg'

function CoinIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <img
      src={COIN_IMAGE_URL}
      alt="Coins"
      style={style}
      className="rounded-full object-cover shadow-lg"
    />
  )
}

function XPBoostIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

/**
 * Determine if a tier is claimable.
 * Exported for property testing.
 */
export function isTierClaimable(
  tier: number,
  currentTier: number,
  isClaimed: boolean,
  isPremium: boolean = false,
  userIsPremium: boolean = true
): boolean {
  if (isClaimed) return false
  if (tier > currentTier) return false
  if (isPremium && !userIsPremium) return false
  return true
}

/**
 * Get responsive size variant based on viewport width.
 * Exported for property testing.
 */
export function getResponsiveSize(viewportWidth: number): 'sm' | 'md' | 'lg' {
  if (viewportWidth < 640) return 'sm'
  if (viewportWidth < 1024) return 'md'
  return 'lg'
}

export default BattlePassTrack
