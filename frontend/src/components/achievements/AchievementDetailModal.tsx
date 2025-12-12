/**
 * Achievement Detail Modal Component
 * Requirements: 6.3, 4.2, 4.3
 * 
 * Uses BottomSheetModal on mobile, centered modal on desktop.
 */

import { memo } from 'react';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import type { Achievement, AchievementProgress } from '@/types/achievements';
import { RARITY_CONFIG, formatEarnedDate } from '@/types/achievements';

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  isUnlocked: boolean;
  earnedAt?: string;
  progress?: AchievementProgress;
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementDetailModal = memo(function AchievementDetailModal({
  achievement,
  isUnlocked,
  earnedAt,
  progress,
  isOpen,
  onClose,
}: AchievementDetailModalProps) {
  if (!achievement) return null;

  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const progressPercent = progress?.percentage ?? (isUnlocked ? 100 : 0);

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title={achievement.name}
    >
      <div className="p-4 space-y-6">
        {/* Icon and rarity */}
        <div className="flex flex-col items-center">
          <div
            className={`
              w-24 h-24 rounded-2xl flex items-center justify-center mb-4
              ${rarityConfig.bgColor} ${isUnlocked ? '' : 'grayscale opacity-50'}
              border-2 ${rarityConfig.borderColor}
            `}
          >
            {achievement.icon_url ? (
              <img
                src={achievement.icon_url}
                alt={achievement.name}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <span className="text-5xl">🏆</span>
            )}
          </div>

          {/* Rarity badge */}
          <span
            className={`
              text-sm px-4 py-1 rounded-full font-semibold
              ${rarityConfig.bgColor} ${rarityConfig.color}
            `}
          >
            {rarityConfig.label}
          </span>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-gray-300 text-lg">{achievement.description}</p>
        </div>

        {/* Status */}
        {isUnlocked && earnedAt ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
              <span className="text-2xl">✓</span>
              <span className="font-bold text-lg">Unlocked!</span>
            </div>
            <p className="text-gray-400">Earned on {formatEarnedDate(earnedAt)}</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>
                {progress?.current_value ?? 0} / {achievement.criteria_value}
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  progressPercent >= 100
                    ? 'bg-green-500'
                    : progressPercent >= 75
                    ? 'bg-yellow-500'
                    : progressPercent >= 50
                    ? 'bg-orange-500'
                    : 'bg-gray-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-center text-gray-500 mt-2 text-sm">
              {progressPercent}% complete
            </p>
          </div>
        )}

        {/* Reward */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🪙</span>
            <div>
              <p className="text-yellow-400 font-bold text-xl">
                +{achievement.coin_reward} Coins
              </p>
              <p className="text-gray-400 text-sm">
                {isUnlocked ? 'Reward claimed' : 'Reward on unlock'}
              </p>
            </div>
          </div>
        </div>

        {/* Category info */}
        <div className="text-center text-gray-500 text-sm">
          <p>Category: {achievement.category}</p>
        </div>
      </div>
    </BottomSheetModal>
  );
});

export default AchievementDetailModal;
