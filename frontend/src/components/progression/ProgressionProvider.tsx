/**
 * Progression Provider - Wraps app to show XP/tier notifications
 * UNIFIED PROGRESSION: Global progression feedback
 */

import type { ReactNode } from 'react'
import { useProgressionEvents } from '@/hooks/useProgressionEvents'
import { XPNotification } from './XPNotification'
import { TierUpCelebration } from './TierUpCelebration'

interface ProgressionProviderProps {
  children: ReactNode
}

export function ProgressionProvider({ children }: ProgressionProviderProps) {
  const {
    xpNotification,
    tierUpCelebration,
    dismissXPNotification,
    dismissTierUpCelebration,
  } = useProgressionEvents()

  return (
    <>
      {children}

      {/* XP Notification */}
      {xpNotification?.visible && (
        <XPNotification
          xpAwarded={xpNotification.xpAwarded}
          previousTier={xpNotification.previousTier}
          newTier={xpNotification.newTier}
          tierAdvanced={xpNotification.tierAdvanced}
          calculation={xpNotification.calculation}
          onClose={dismissXPNotification}
        />
      )}

      {/* Tier Up Celebration */}
      {tierUpCelebration?.visible && (
        <TierUpCelebration
          previousTier={tierUpCelebration.previousTier}
          newTier={tierUpCelebration.newTier}
          tiersGained={tierUpCelebration.tiersGained}
          newClaimableRewards={tierUpCelebration.newClaimableRewards}
          onClose={dismissTierUpCelebration}
        />
      )}
    </>
  )
}

export default ProgressionProvider
