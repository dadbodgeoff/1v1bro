/**
 * useBattlePassAnalytics - Track battle pass progression and purchases
 * 
 * Usage:
 *   const bpAnalytics = useBattlePassAnalytics()
 *   bpAnalytics.trackBattlePassView(currentLevel, currentXp)
 *   bpAnalytics.trackLevelUp(newLevel, xpEarned)
 */

import { useCallback } from 'react'
import { analytics } from '@/services/analytics'

export function useBattlePassAnalytics() {
  const trackBattlePassView = useCallback((currentLevel: number, currentXp: number) => {
    analytics.trackEvent('battlepass_view', { current_level: currentLevel, current_xp: currentXp })
  }, [])

  const trackLevelUp = useCallback((newLevel: number, xpEarned: number) => {
    analytics.trackEvent('battlepass_level_up', { new_level: newLevel, xp_earned: xpEarned })
  }, [])

  const trackRewardClaim = useCallback((level: number, rewardType: string, rewardId: string) => {
    analytics.trackEvent('battlepass_reward_claim', { 
      level, 
      reward_type: rewardType, 
      reward_id: rewardId 
    })
  }, [])

  const trackPremiumPurchase = useCallback((price: number, currency: string) => {
    analytics.trackEvent('battlepass_purchase', { price, currency })
  }, [])

  const trackTierSkip = useCallback((tiersSkipped: number, cost: number, currency: string) => {
    analytics.trackEvent('battlepass_tier_skip', { 
      tiers_skipped: tiersSkipped, 
      cost, 
      currency 
    })
  }, [])

  const trackXpGain = useCallback((xpAmount: number, source: string) => {
    analytics.trackEvent('battlepass_xp_gain', { xp_amount: xpAmount, source })
  }, [])

  return {
    trackBattlePassView,
    trackLevelUp,
    trackRewardClaim,
    trackPremiumPurchase,
    trackTierSkip,
    trackXpGain,
  }
}
