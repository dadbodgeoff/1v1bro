/**
 * Achievement Card Component
 * Requirements: 4.2, 4.3, 6.2
 */

import { memo } from 'react';
import type {
  Achievement,
  AchievementProgress,
  AchievementRarity,
} from '@/types/achievements';
import { RARITY_CONFIG, formatEarnedDate } from '@/types/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  earnedAt?: string;
  progress?: AchievementProgress;
  onClick?: () => void;
}

// Rarity-specific styles
const rarityStyles: Record<AchievementRarity, string> = {
  common: 'border-gray-500/50 hover:border-gray-400',
  uncommon: 'border-green-500/50 hover:border-green-400',
  rare: 'border-blue-500/50 hover:border-blue-400',
  epic: 'border-purple-500/50 hover:border-purple-400',
  legendary: 'border-yellow-500/50 hover:border-yellow-400 shadow-lg shadow-yellow-500/20',
};

const rarityGlow: Record<AchievementRarity, string> = {
  common: '',
  uncommon: 'hover:shadow-green-500/20',
  rare: 'hover:shadow-blue-500/20',
  epic: 'hover:shadow-purple-500/30',
  legendary: 'hover:shadow-yellow-500/40',
};

export const AchievementCard = memo(function AchievementCard({
  achievement,
  isUnlocked,
  earnedAt,
  progress,
  onClick,
}: AchievementCardProps) {
  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const progressPercent = progress?.percentage ?? (isUnlocked ? 100 : 0);

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full min-h-[120px] p-4 rounded-xl border-2 transition-all duration-200
        bg-gray-800/50 backdrop-blur-sm
        ${rarityStyles[achievement.rarity]}
        ${rarityGlow[achievement.rarity]}
        hover:shadow-lg hover:scale-[1.02]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        ${isUnlocked ? 'focus:ring-green-500' : 'focus:ring-gray-500'}
        touch-manipulation
      `}
      style={{ minWidth: '44px', minHeight: '44px' }} // Touch target compliance
      aria-label={`${achievement.name} - ${isUnlocked ? 'Unlocked' : 'Locked'}`}
    >
      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-gray-900/60 rounded-xl flex items-center justify-center z-10">
          <span className="text-3xl opacity-50">🔒</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`
            w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0
            ${rarityConfig.bgColor} ${isUnlocked ? '' : 'grayscale opacity-50'}
          `}
        >
          {achievement.icon_url ? (
            <img
              src={achievement.icon_url}
              alt=""
              className="w-10 h-10 object-contain"
            />
          ) : (
            <span className="text-2xl">🏆</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 text-left min-w-0">
          {/* Name and rarity badge */}
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold truncate ${
                isUnlocked ? 'text-white' : 'text-gray-400'
              }`}
            >
              {achievement.name}
            </h3>
            <span
              className={`
                text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                ${rarityConfig.bgColor} ${rarityConfig.color}
              `}
            >
              {rarityConfig.label}
            </span>
          </div>

          {/* Description */}
          <p
            className={`text-sm mb-2 line-clamp-2 ${
              isUnlocked ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            {achievement.description}
          </p>

          {/* Progress bar or earned date */}
          {isUnlocked && earnedAt ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400 flex items-center gap-1">
                <span>✓</span> Earned {formatEarnedDate(earnedAt)}
              </span>
              <span className="text-yellow-400 font-medium">
                +{achievement.coin_reward} coins
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Progress bar */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    progressPercent >= 100
                      ? 'bg-green-500'
                      : progressPercent >= 50
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Progress text */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {progress?.current_value ?? 0} / {achievement.criteria_value}
                </span>
                <span className="text-yellow-400/70">
                  +{achievement.coin_reward} coins
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
});

export default AchievementCard;
