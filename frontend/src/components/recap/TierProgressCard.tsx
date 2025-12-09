/**
 * TierProgressCard - Displays tier progress with celebration animation.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import type { TierProgress } from '@/types/recap'

interface TierProgressCardProps {
  progress: TierProgress
}

export function TierProgressCard({ progress }: TierProgressCardProps) {
  const progressPercent = progress.xp_to_next_tier > 0 
    ? (progress.current_xp / progress.xp_to_next_tier) * 100 
    : 0

  // Display tier is 1-indexed for user-friendly display (tier 0 in DB = "Tier 1" for users)
  const displayPreviousTier = progress.previous_tier + 1
  const displayNewTier = progress.new_tier + 1

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tier Progress</h3>

      {progress.tier_advanced && (
        <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/50 animate-pulse">
          <span className="text-yellow-400 font-bold">
            🎉 Tier Up! {displayPreviousTier} → {displayNewTier}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-indigo-400">
          Tier {displayNewTier}
        </div>
      </div>

      <div className="mb-2">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-1000"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="text-sm text-slate-400">
        {progress.current_xp} / {progress.xp_to_next_tier} XP to next tier
      </div>

      {progress.new_claimable_rewards.length > 0 && (
        <div className="mt-4 text-sm text-green-400">
          🎁 {progress.new_claimable_rewards.length} new reward{progress.new_claimable_rewards.length > 1 ? 's' : ''} to claim!
        </div>
      )}
    </div>
  )
}
