/**
 * XP Progress component showing current tier and XP.
 * Requirements: 4.2, 4.5
 */

import React from 'react';
import type { Season, PlayerBattlePass } from '../../types/battlepass';
import { getXPProgress, getDaysRemaining } from '../../types/battlepass';

interface XPProgressProps {
  season: Season | null;
  progress: PlayerBattlePass | null;
  onPurchasePremium?: () => void;
}

export const XPProgress: React.FC<XPProgressProps> = ({
  season,
  progress,
  onPurchasePremium,
}) => {
  if (!progress || !season) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        Loading battle pass...
      </div>
    );
  }

  const xpProgress = getXPProgress(progress);
  const daysRemaining = getDaysRemaining(season);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Season Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{season.name}</h2>
          <p className="text-gray-400 text-sm">Season {season.season_number ?? season.number}</p>
        </div>
        <div className="text-right">
          <div className="text-orange-400 font-bold">{daysRemaining} days left</div>
          {!progress.is_premium && onPurchasePremium && (
            <button
              onClick={onPurchasePremium}
              className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-1 rounded font-bold text-sm hover:from-yellow-400 hover:to-orange-400"
            >
              Get Premium
            </button>
          )}
        </div>
      </div>

      {/* Current Tier */}
      <div className="flex items-center gap-6 mb-6">
        <div className="bg-indigo-600 rounded-lg p-4 text-center min-w-[100px]">
          <div className="text-4xl font-bold text-white">{progress.current_tier}</div>
          <div className="text-indigo-200 text-sm">Current Tier</div>
        </div>

        <div className="flex-1">
          {/* XP Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">
              {progress.current_xp.toLocaleString()} XP
            </span>
            <span className="text-gray-400 text-sm">
              {progress.xp_to_next_tier.toLocaleString()} XP to next tier
            </span>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="text-center text-gray-500 text-xs mt-1">
            {xpProgress}% to Tier {progress.current_tier + 1}
          </div>
        </div>
      </div>

      {/* Premium Status */}
      <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          {progress.is_premium ? (
            <>
              <span className="text-yellow-400 text-xl">⭐</span>
              <span className="text-yellow-400 font-bold">Premium Active</span>
            </>
          ) : (
            <>
              <span className="text-gray-500 text-xl">⭐</span>
              <span className="text-gray-400">Free Track</span>
            </>
          )}
        </div>
        
        {/* Claimable Rewards Count */}
        {(progress.claimable_rewards?.length ?? 0) > 0 && (
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            {progress.claimable_rewards.length} rewards to claim!
          </div>
        )}
      </div>
    </div>
  );
};

export default XPProgress;
