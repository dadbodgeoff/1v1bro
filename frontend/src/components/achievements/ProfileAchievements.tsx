/**
 * Profile Achievements Component
 * Requirements: 10.1, 10.2, 10.3, 10.4
 * 
 * Displays achievement statistics on user profile.
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { RARITY_CONFIG, formatEarnedDate } from '@/types/achievements';

interface ProfileAchievementsProps {
  userId?: string; // If provided, shows another user's achievements
  compact?: boolean; // Compact mode for sidebar/widget
}

export const ProfileAchievements = memo(function ProfileAchievements({
  userId,
  compact = false,
}: ProfileAchievementsProps) {
  // Use appropriate hook based on whether viewing own or other's profile
  const ownAchievements = useAchievements();
  const otherAchievements = useUserAchievements(userId || '');

  const { stats, isLoading, error } = userId
    ? otherAchievements
    : { stats: ownAchievements.stats, isLoading: ownAchievements.isLoading, error: ownAchievements.error };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-800/50 rounded-xl p-4">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-8 bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  if (error || !stats) {
    return null; // Silently fail for profile widget
  }

  if (compact) {
    return (
      <Link
        to="/achievements"
        className="block bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>🏆</span> Achievements
          </h3>
          <span className="text-yellow-400 font-bold">
            {stats.completion_percentage}%
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{stats.total_earned}/{stats.total_possible}</span>
          <span className="text-yellow-400">+{stats.total_coins_earned} coins</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🏆</span> Achievements
        </h3>
        <Link
          to="/achievements"
          className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {stats.total_earned}/{stats.total_possible}
          </p>
          <p className="text-sm text-gray-400">Earned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {stats.completion_percentage}%
          </p>
          <p className="text-sm text-gray-400">Complete</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {stats.total_coins_earned}
          </p>
          <p className="text-sm text-gray-400">Coins Earned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {stats.by_rarity.legendary}
          </p>
          <p className="text-sm text-gray-400">Legendary</p>
        </div>
      </div>

      {/* Rarity breakdown */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(stats.by_rarity).map(([rarity, count]) => {
          const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
          return (
            <span
              key={rarity}
              className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${config.bgColor} ${config.color}
              `}
            >
              {count} {config.label}
            </span>
          );
        })}
      </div>

      {/* Recent achievements */}
      {stats.recent_achievements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-3">
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {stats.recent_achievements.map((ua) => {
              const achievement = ua.achievements;
              if (!achievement) return null;
              
              const config = RARITY_CONFIG[achievement.rarity];
              return (
                <div
                  key={ua.id}
                  className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-lg"
                >
                  <div
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${config.bgColor}
                    `}
                  >
                    {achievement.icon_url ? (
                      <img
                        src={achievement.icon_url}
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <span>🏆</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatEarnedDate(ua.earned_at)}
                    </p>
                  </div>
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${config.bgColor} ${config.color}
                    `}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileAchievements;
