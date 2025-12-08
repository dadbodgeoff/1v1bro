/**
 * Rank badge component displaying ELO tier.
 * Requirements: 5.5
 */

import React from 'react';
import type { RankTier } from '../../types/leaderboard';
import { RANK_TIERS, getRankTier } from '../../types/leaderboard';

interface RankBadgeProps {
  elo: number;
  size?: 'sm' | 'md' | 'lg';
  showElo?: boolean;
}

const SIZE_CLASSES = {
  sm: 'text-sm px-2 py-0.5',
  md: 'text-base px-3 py-1',
  lg: 'text-lg px-4 py-2',
};

const ICON_SIZES = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export const RankBadge: React.FC<RankBadgeProps> = ({
  elo,
  size = 'md',
  showElo = true,
}) => {
  const tier = getRankTier(elo);
  const tierInfo = RANK_TIERS[tier];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${SIZE_CLASSES[size]}`}
      style={{
        backgroundColor: `${tierInfo.color}20`,
        color: tierInfo.color,
        border: `1px solid ${tierInfo.color}40`,
      }}
    >
      <span className={ICON_SIZES[size]}>{tierInfo.icon}</span>
      <span className="capitalize">{tier}</span>
      {showElo && (
        <span className="opacity-70 font-normal">({elo})</span>
      )}
    </div>
  );
};

/**
 * Compact rank icon only.
 */
export const RankIcon: React.FC<{ elo: number; size?: 'sm' | 'md' | 'lg' }> = ({
  elo,
  size = 'md',
}) => {
  const tier = getRankTier(elo);
  const tierInfo = RANK_TIERS[tier];

  return (
    <span
      className={ICON_SIZES[size]}
      title={`${tier.charAt(0).toUpperCase() + tier.slice(1)} (${elo} ELO)`}
    >
      {tierInfo.icon}
    </span>
  );
};

/**
 * Full rank display with progress to next tier.
 */
export const RankProgress: React.FC<{ elo: number }> = ({ elo }) => {
  const tier = getRankTier(elo);
  const tierInfo = RANK_TIERS[tier];
  
  // Calculate progress to next tier
  const tierProgress = ((elo - tierInfo.min) / (tierInfo.max - tierInfo.min + 1)) * 100;
  
  // Get next tier info
  const tiers: RankTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'];
  const currentIndex = tiers.indexOf(tier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  const nextTierInfo = nextTier ? RANK_TIERS[nextTier] : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <RankBadge elo={elo} size="lg" />
        {nextTierInfo && (
          <div className="text-right">
            <div className="text-gray-400 text-sm">Next: {nextTier}</div>
            <div className="text-gray-500 text-xs">
              {nextTierInfo.min - elo} ELO to go
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(100, tierProgress)}%`,
            backgroundColor: tierInfo.color,
          }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{tierInfo.min}</span>
        <span>{tierInfo.max}</span>
      </div>
    </div>
  );
};

export default RankBadge;
