/**
 * SessionTransferPreview - Shows XP and rewards to be credited during registration
 * 
 * Displays a preview of what the guest will receive when they create an account,
 * encouraging them to complete registration.
 * 
 * @module components/auth/SessionTransferPreview
 * Requirements: 8.2
 */

import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { type SessionTransferData } from '@/game/guest/SessionTransferFlow'

export interface SessionTransferPreviewProps {
  /** Transfer data to display */
  transferData: SessionTransferData
  /** Whether to show compact version */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Reward item display
 */
function RewardItem({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <span className="text-neutral-400 text-xs">{label}</span>
      </div>
      <span className="text-white font-semibold tabular-nums">{value}</span>
    </div>
  )
}

/**
 * SessionTransferPreview component
 */
export function SessionTransferPreview({
  transferData,
  compact = false,
  className,
}: SessionTransferPreviewProps) {
  const { matchesPlayed, matchesWon, estimatedRewards, milestonesAchieved } = transferData

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-3 rounded-lg',
          'bg-gradient-to-r from-purple-500/10 to-orange-500/10',
          'border border-purple-500/20',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-sm">Your progress:</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-purple-400 font-semibold">{estimatedRewards.xp} XP</span>
            <span className="text-amber-400 font-semibold">{estimatedRewards.coins} coins</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl',
        'bg-gradient-to-br from-purple-500/10 via-transparent to-orange-500/10',
        'border border-purple-500/20',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎁</span>
        <h3 className="text-white font-semibold">Your Progress Will Be Saved</h3>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-black/20 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold text-white tabular-nums">{matchesPlayed}</div>
          <div className="text-xs text-neutral-500">Matches</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-emerald-400 tabular-nums">{matchesWon}</div>
          <div className="text-xs text-neutral-500">Wins</div>
        </div>
      </div>

      {/* Rewards */}
      <div className="space-y-2 mb-4">
        <RewardItem icon="✨" label="XP" value={`+${estimatedRewards.xp}`} />
        <RewardItem icon="💰" label="Coins" value={`+${estimatedRewards.coins}`} />
      </div>

      {/* Unlocked items */}
      {estimatedRewards.unlockedItems.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-neutral-500 mb-2">Unlocks:</p>
          <div className="flex flex-wrap gap-2">
            {estimatedRewards.unlockedItems.map((item, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {milestonesAchieved.length > 0 && (
        <div className="pt-3 border-t border-white/10 mt-3">
          <p className="text-xs text-neutral-500 mb-1">
            {milestonesAchieved.length} achievement{milestonesAchieved.length > 1 ? 's' : ''} earned
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default SessionTransferPreview
