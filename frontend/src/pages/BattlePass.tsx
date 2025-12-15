/**
 * BattlePass Page - 2025 Enterprise Design System
 * Requirements: 4.1-4.10, 6.2
 *
 * Full battle pass redesign with enterprise components:
 * - BattlePassHeader (enterprise) with gradient title, XP display, countdown
 * - ProgressSection (enterprise) with tier badge, XP bar, statistics
 * - TrackSection (enterprise) wrapping BattlePassTrack
 * - PremiumUpsell for non-premium users
 * - Skeleton loading states
 * - Confetti on successful claims
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBattlePass } from '@/hooks/useBattlePass'
import { useToast } from '@/hooks/useToast'
import { useConfetti } from '@/hooks/useConfetti'
import { useBalance } from '@/hooks/useBalance'
import { useBattlePassAnalytics } from '@/hooks/useBattlePassAnalytics'
import {
  BattlePassHeader,
  ProgressSection,
  TrackSection,
} from '@/components/battlepass/enterprise'
import { BattlePassTrack } from '@/components/battlepass/BattlePassTrack'
import { PremiumUpsell } from '@/components/battlepass/PremiumUpsell'
import { BattlePassWelcomeModal, useBattlePassWelcome } from '@/components/battlepass/BattlePassWelcomeModal'
import { Confetti } from '@/components/ui/Confetti'
import { TierCardSkeleton, XPProgressSkeleton } from '@/components/ui/Skeleton'

export function BattlePass() {
  const navigate = useNavigate()
  const toast = useToast()
  const confetti = useConfetti()
  const { refreshBalance } = useBalance()
  const { showWelcome, closeWelcome } = useBattlePassWelcome()
  const bpAnalytics = useBattlePassAnalytics()

  const {
    season,
    tiers,
    progress,
    loading,
    error,
    fetchSeason,
    fetchProgress,
    fetchTiers,
    claimReward,
    purchasePremium,
  } = useBattlePass()

  useEffect(() => {
    fetchSeason()
    fetchProgress()
  }, [fetchSeason, fetchProgress])

  // Track battle pass view when progress loads
  useEffect(() => {
    if (progress) {
      bpAnalytics.trackBattlePassView(progress.current_tier, progress.current_xp)
    }
  }, [progress?.current_tier]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (season?.id) {
      fetchTiers(season.id)
    }
  }, [season?.id, fetchTiers])

  const handleClaimReward = async (tier: number, isPremium: boolean): Promise<boolean> => {
    const success = await claimReward(tier, isPremium)
    if (success) {
      confetti.fire({ rarity: isPremium ? 'epic' : 'uncommon' })
      toast.success('Reward Claimed!', `Tier ${tier} reward unlocked`)
      bpAnalytics.trackRewardClaim(tier, isPremium ? 'premium' : 'free', `tier_${tier}`)
    }
    return success
  }

  const handlePurchasePremium = async () => {
    const success = await purchasePremium()
    if (success) {
      // Refresh balance after successful purchase
      refreshBalance()
      confetti.fire({ rarity: 'legendary' })
      toast.success('Premium Unlocked!', 'Enjoy your exclusive rewards')
      bpAnalytics.trackPremiumPurchase(650, 'coins')
    } else if (error?.includes('Insufficient')) {
      // Handle insufficient funds - redirect to coin shop
      toast.error('Insufficient Coins', 'Get more coins to unlock premium')
      navigate('/coins')
    }
  }

  // Get premium rewards for upsell preview
  const premiumRewards = tiers
    .filter((t) => t.premium_reward)
    .slice(0, 5)
    .map((t) => ({
      preview_url: t.premium_reward?.cosmetic_preview_url,
      type: t.premium_reward?.type || 'cosmetic',
      name: String(t.premium_reward?.value || ''),
    }))

  // Determine season theme color based on theme name
  const getThemeColor = (theme?: string): 'default' | 'winter' | 'summer' | 'halloween' | 'neon' => {
    if (!theme) return 'default'
    const lower = theme.toLowerCase()
    if (lower.includes('winter') || lower.includes('frost') || lower.includes('ice')) return 'winter'
    if (lower.includes('summer') || lower.includes('beach') || lower.includes('sun')) return 'summer'
    if (lower.includes('halloween') || lower.includes('spooky') || lower.includes('horror')) return 'halloween'
    if (lower.includes('neon') || lower.includes('cyber') || lower.includes('future')) return 'neon'
    return 'default'
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--color-text-secondary)] hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Enterprise Season Header */}
        {loading && !season ? (
          <div className="mb-8 h-32 bg-[var(--color-bg-card)] rounded-2xl skeleton-shimmer" />
        ) : season ? (
          <div className="mb-8">
            <BattlePassHeader
              seasonName={season.name}
              seasonTheme={season.theme}
              seasonThemeColor={getThemeColor(season.theme)}
              currentTier={Math.max(1, progress?.current_tier || 1)}
              currentXP={progress?.current_xp || 0}
              xpToNextTier={progress?.xp_to_next_tier || 2000}
              seasonEndDate={season.end_date ? new Date(season.end_date) : null}
              bannerUrl={season.banner_url}
            />
          </div>
        ) : null}

        {/* Enterprise Progress Section */}
        <div className="mb-8">
          {loading && !progress ? (
            <XPProgressSkeleton />
          ) : progress ? (
            <ProgressSection
              currentTier={Math.max(1, progress.current_tier)}
              currentXP={progress.current_xp}
              xpToNextTier={progress.xp_to_next_tier || 400}
              totalTiers={progress.season?.max_tier || tiers.length || 35}
            />
          ) : null}
        </div>

        {/* Enterprise Track Section with Battle Pass Track */}
        <TrackSection
          title="Rewards Track"
          subtitle="Unlock rewards as you progress through the season"
          icon={
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          }
          badge={progress && progress.claimable_rewards?.length > 0 ? `${progress.claimable_rewards.length} Claimable` : undefined}
          badgeVariant={progress && progress.claimable_rewards?.length > 0 ? 'hot' : 'default'}
        >
          {loading && tiers.length === 0 ? (
            <div className="flex gap-4 overflow-hidden py-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <TierCardSkeleton key={i} />
              ))}
            </div>
          ) : tiers.length > 0 ? (
            <BattlePassTrack
              tiers={tiers}
              progress={progress}
              onClaimReward={handleClaimReward}
            />
          ) : (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-8 text-center">
              <p className="text-[var(--color-text-muted)]">No tiers available</p>
            </div>
          )}
        </TrackSection>

        {/* Premium Upsell Section */}
        {progress && !progress.is_premium && premiumRewards.length > 0 && (
          <TrackSection
            title="Premium Upgrade"
            subtitle="Unlock exclusive premium rewards"
            icon={
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            }
            badge="Premium"
            badgeVariant="premium"
          >
            <PremiumUpsell
              price={650}
              rewards={premiumRewards}
              onUpgrade={handlePurchasePremium}
            />
          </TrackSection>
        )}

        {/* Confetti */}
        <Confetti
          active={confetti.isActive}
          rarity={confetti.rarity}
          originX={confetti.originX}
          originY={confetti.originY}
          onComplete={confetti.onComplete}
        />

        {/* Welcome Modal */}
        {showWelcome && <BattlePassWelcomeModal onClose={closeWelcome} />}
      </div>
    </div>
  )
}

export default BattlePass
