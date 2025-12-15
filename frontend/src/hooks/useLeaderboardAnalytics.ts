/**
 * useLeaderboardAnalytics - Track leaderboard engagement
 * 
 * Usage:
 *   const lbAnalytics = useLeaderboardAnalytics()
 *   lbAnalytics.trackLeaderboardView(userRank)
 *   lbAnalytics.trackPlayerClick(targetRank, targetUserId)
 */

import { useCallback, useRef } from 'react'
import { analytics } from '@/services/analytics'

export function useLeaderboardAnalytics() {
  const maxRankViewedRef = useRef(0)

  const trackLeaderboardView = useCallback((userRank?: number) => {
    maxRankViewedRef.current = 0 // Reset on new view
    analytics.trackEvent('leaderboard_view', { user_rank: userRank })
  }, [])

  const trackLeaderboardScroll = useCallback((maxRankViewed: number) => {
    // Only track if we've scrolled further than before
    if (maxRankViewed > maxRankViewedRef.current) {
      maxRankViewedRef.current = maxRankViewed
      analytics.trackEvent('leaderboard_scroll', { max_rank_viewed: maxRankViewed })
    }
  }, [])

  const trackPlayerClick = useCallback((targetRank: number, targetUserId: string) => {
    analytics.trackEvent('leaderboard_player_click', { 
      target_rank: targetRank, 
      target_user_id: targetUserId 
    })
  }, [])

  const trackFilterChange = useCallback((filterType: string, filterValue: string) => {
    analytics.trackEvent('leaderboard_filter_change', { 
      filter_type: filterType, 
      filter_value: filterValue 
    })
  }, [])

  const trackRefresh = useCallback(() => {
    analytics.trackEvent('leaderboard_refresh')
  }, [])

  return {
    trackLeaderboardView,
    trackLeaderboardScroll,
    trackPlayerClick,
    trackFilterChange,
    trackRefresh,
  }
}
