/**
 * Analytics Hooks - Centralized exports for all analytics tracking hooks
 * 
 * Usage:
 *   import { useShopAnalytics, useAuthAnalytics } from '@/hooks/analytics'
 */

export { useShopAnalytics } from '../useShopAnalytics'
export { useLeaderboardAnalytics } from '../useLeaderboardAnalytics'
export { useAuthAnalytics } from '../useAuthAnalytics'
export { useBattlePassAnalytics } from '../useBattlePassAnalytics'
export { 
  useSectionViewTracking, 
  useVideoTracking, 
  trackSocialClick, 
  trackCTAClick 
} from '../useSectionViewTracking'

// Re-export survival analytics from survival module
export { 
  useSurvivalAnalytics,
  useSurvivalGameWithAnalytics,
} from '@/survival'

export type {
  RunAnalytics,
  InputAnalytics,
  ComboAnalytics,
  FunnelEvent,
  TriviaAnalytics,
  MilestoneAnalytics,
  ShopAnalytics,
  LeaderboardAnalytics,
  BattlePassAnalytics,
  AuthAnalytics,
} from '@/survival'
