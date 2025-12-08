/**
 * Progression Events Hook - Handles XP and tier WebSocket events
 * UNIFIED PROGRESSION: Real-time progression feedback
 */

import { useState, useEffect, useCallback } from 'react'
import { wsService } from '@/services/websocket'
import { useAuthStore } from '@/stores/authStore'
import type {
  GameEndPayload,
  XPAwardedPayload,
  TierAdvancedPayload,
  XPAwardResultPayload,
} from '@/types/websocket'

interface ProgressionState {
  xpNotification: {
    visible: boolean
    xpAwarded: number
    previousTier: number
    newTier: number
    tierAdvanced: boolean
    calculation?: {
      base_xp: number
      kill_bonus: number
      streak_bonus: number
      duration_bonus: number
    }
  } | null
  tierUpCelebration: {
    visible: boolean
    previousTier: number
    newTier: number
    tiersGained: number
    newClaimableRewards: number[]
  } | null
}

export function useProgressionEvents() {
  const userId = useAuthStore((s) => s.user?.id)
  const [state, setState] = useState<ProgressionState>({
    xpNotification: null,
    tierUpCelebration: null,
  })

  // Handle XP result from game_end payload
  const handleXPResult = useCallback((xpResult: XPAwardResultPayload) => {
    // Show XP notification
    setState((prev) => ({
      ...prev,
      xpNotification: {
        visible: true,
        xpAwarded: xpResult.xp_awarded,
        previousTier: xpResult.previous_tier,
        newTier: xpResult.new_tier,
        tierAdvanced: xpResult.tier_advanced,
        calculation: xpResult.calculation,
      },
    }))

    // If tier advanced, show celebration after a delay
    if (xpResult.tier_advanced) {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          tierUpCelebration: {
            visible: true,
            previousTier: xpResult.previous_tier,
            newTier: xpResult.new_tier,
            tiersGained: xpResult.tiers_gained,
            newClaimableRewards: xpResult.new_claimable_rewards,
          },
        }))
      }, 2000) // Show tier up after XP notification
    }
  }, [])

  // Subscribe to WebSocket events
  useEffect(() => {
    // Handle game_end with XP results
    const unsubGameEnd = wsService.on('game_end', (payload) => {
      const data = payload as GameEndPayload
      
      // Get XP result for current user
      if (data.xp_results && userId && data.xp_results[userId]) {
        handleXPResult(data.xp_results[userId])
      }
    })

    // Handle standalone xp_awarded event
    const unsubXPAwarded = wsService.on('xp_awarded', (payload) => {
      const data = payload as XPAwardedPayload
      setState((prev) => ({
        ...prev,
        xpNotification: {
          visible: true,
          xpAwarded: data.xp_amount,
          previousTier: data.previous_tier,
          newTier: data.new_tier,
          tierAdvanced: data.tier_advanced,
          calculation: data.calculation,
        },
      }))
    })

    // Handle standalone tier_advanced event
    const unsubTierAdvanced = wsService.on('tier_advanced', (payload) => {
      const data = payload as TierAdvancedPayload
      setState((prev) => ({
        ...prev,
        tierUpCelebration: {
          visible: true,
          previousTier: data.previous_tier,
          newTier: data.new_tier,
          tiersGained: data.tiers_gained,
          newClaimableRewards: data.new_claimable_rewards,
        },
      }))
    })

    return () => {
      unsubGameEnd()
      unsubXPAwarded()
      unsubTierAdvanced()
    }
  }, [userId, handleXPResult])

  // Dismiss handlers
  const dismissXPNotification = useCallback(() => {
    setState((prev) => ({
      ...prev,
      xpNotification: null,
    }))
  }, [])

  const dismissTierUpCelebration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tierUpCelebration: null,
    }))
  }, [])

  return {
    xpNotification: state.xpNotification,
    tierUpCelebration: state.tierUpCelebration,
    dismissXPNotification,
    dismissTierUpCelebration,
  }
}

export default useProgressionEvents
