/**
 * TierCard Component - 2025 Enterprise Design System
 * Requirements: 4.2, 4.3, 4.9, 7.2, 7.3, 7.4
 *
 * Individual tier card using enterprise components:
 * - TierIndicator for tier number display
 * - RewardDisplayBox for free and premium rewards
 * - ClaimCTA for claim buttons
 * - Claimable glow effects (emerald free, amber premium)
 * - Claimed checkmark overlay
 * - Locked state with reduced opacity
 */

import { cn } from '@/utils/helpers'
import { TierIndicator } from './enterprise/TierIndicator'
import { RewardDisplayBox, type Reward, type ClaimState } from './enterprise/RewardDisplayBox'
import { ClaimCTA } from './enterprise/ClaimCTA'

interface TierCardReward {
  type: 'coins' | 'xp_boost' | 'cosmetic' | 'title'
  value: string | number
  preview_url?: string
  sprite_sheet_url?: string
  rarity?: string
  cosmetic_name?: string
}

interface TierCardProps {
  tier: number
  freeReward: TierCardReward | null
  premiumReward: TierCardReward | null
  currentTier: number
  isPremiumUser: boolean
  isFreeClaimed: boolean
  isPremiumClaimed: boolean
  onClaimFree?: () => void
  onClaimPremium?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function TierCard({
  tier,
  freeReward,
  premiumReward,
  currentTier,
  isPremiumUser,
  isFreeClaimed,
  isPremiumClaimed,
  onClaimFree,
  onClaimPremium,
  size = 'sm',
}: TierCardProps) {
  const isUnlocked = currentTier >= tier

  const getClaimState = (isClaimed: boolean, isPremium: boolean): ClaimState => {
    if (isClaimed) return 'claimed'
    if (!isUnlocked) return 'locked'
    if (isPremium && !isPremiumUser) return 'locked'
    return 'claimable'
  }

  const mapToReward = (reward: TierCardReward | null): Reward | null => {
    if (!reward) return null
    return {
      type: reward.type,
      value: reward.value,
      preview_url: reward.preview_url,
      sprite_sheet_url: reward.sprite_sheet_url,
      rarity: (reward.rarity as Reward['rarity']) || 'common',
      cosmetic_name: reward.cosmetic_name,
    }
  }

  const freeClaimState = getClaimState(isFreeClaimed, false)
  const premiumClaimState = getClaimState(isPremiumClaimed, true)

  // Size-based dimensions - increased min-height to accommodate playercard portrait aspect ratio
  const containerWidth = size === 'sm' ? 'w-28' : size === 'md' ? 'w-36' : 'w-44'
  const rewardSize = size === 'sm' ? 'w-24 min-h-[110px]' : size === 'md' ? 'w-32 min-h-[130px]' : 'w-40 min-h-[150px]'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-200',
        containerWidth,
        !isUnlocked && 'opacity-60'
      )}
    >
      {/* Premium Reward */}
      <div className="relative">
        <RewardDisplayBox
          reward={mapToReward(premiumReward)}
          size={size}
          isPremium
          claimState={premiumClaimState}
          onClaim={premiumClaimState === 'claimable' ? onClaimPremium : undefined}
          className={rewardSize}
        />
        {/* Inline Claim CTA for claimable premium */}
        {premiumClaimState === 'claimable' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
            <ClaimCTA
              variant="premium"
              size="sm"
              onClick={onClaimPremium}
            />
          </div>
        )}
      </div>

      {/* Tier Indicator */}
      <TierIndicator
        tier={tier}
        currentTier={currentTier}
        size={size === 'sm' ? 'sm' : 'md'}
      />

      {/* Free Reward */}
      <div className="relative">
        <RewardDisplayBox
          reward={mapToReward(freeReward)}
          size={size}
          isPremium={false}
          claimState={freeClaimState}
          onClaim={freeClaimState === 'claimable' ? onClaimFree : undefined}
          className={rewardSize}
        />
        {/* Inline Claim CTA for claimable free */}
        {freeClaimState === 'claimable' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
            <ClaimCTA
              variant="default"
              size="sm"
              onClick={onClaimFree}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Determine if a tier is claimable.
 * Exported for property testing.
 * 
 * Property 2: Tier Claimable State Determination
 * For any battle pass tier where currentTier >= tier.tier_number AND the reward
 * is not in claimed_rewards array, the tier SHALL be marked as claimable.
 * 
 * Validates: Requirements 7.2
 */
export function isTierClaimable(
  tier: number,
  currentTier: number,
  isClaimed: boolean
): boolean {
  return currentTier >= tier && !isClaimed
}

export default TierCard
