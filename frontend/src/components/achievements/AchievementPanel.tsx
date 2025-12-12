/**
 * Achievement Panel Component
 * Requirements: 4.1, 4.4, 4.5, 6.1, 6.4, 6.5
 */

import { useState, useMemo, useCallback } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementCard } from './AchievementCard';
import { AchievementDetailModal } from './AchievementDetailModal';
import type {
  Achievement,
  AchievementCategory,
  AchievementFilter,
} from '@/types/achievements';
import { CATEGORY_CONFIG } from '@/types/achievements';

interface AchievementPanelProps {
  initialCategory?: AchievementCategory;
}

export function AchievementPanel({ initialCategory }: AchievementPanelProps) {
  const {
    achievements,
    stats,
    categories,
    isLoading,
    error,
    refetch,
    isAchievementUnlocked,
    getProgressForAchievement,
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>(
    initialCategory || 'all'
  );
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    // Filter by unlock status
    if (filter === 'unlocked') {
      filtered = filtered.filter((a) => isAchievementUnlocked(a.id));
    } else if (filter === 'locked') {
      filtered = filtered.filter((a) => !isAchievementUnlocked(a.id));
    }

    // Sort by category, then by criteria_value (progressive tiers)
    return filtered.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.criteria_value - b.criteria_value;
    });
  }, [achievements, selectedCategory, filter, isAchievementUnlocked]);

  // Get earned timestamp for an achievement
  const getEarnedAt = useCallback(
    (achievementId: string): string | undefined => {
      const prog = getProgressForAchievement(achievementId);
      if (prog?.is_unlocked) {
        // The progress doesn't have earned_at, so we'd need to get it from userAchievements
        // For now, return undefined and let the card handle it
        return undefined;
      }
      return undefined;
    },
    [getProgressForAchievement]
  );

  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      {stats && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.total_earned}/{stats.total_possible}
              </p>
              <p className="text-sm text-gray-400">Achievements</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.completion_percentage}%
              </p>
              <p className="text-sm text-gray-400">Complete</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.total_coins_earned}
              </p>
              <p className="text-sm text-gray-400">Coins Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {stats.by_rarity.legendary}
              </p>
              <p className="text-sm text-gray-400">Legendary</p>
            </div>
          </div>
        </div>
      )}

      {/* Category tabs - horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap
              ${
                selectedCategory === 'all'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            All ({achievements.length})
          </button>
          {categories.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const count = achievements.filter((a) => a.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap
                  flex items-center gap-2
                  ${
                    selectedCategory === category
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                <span>{config?.icon}</span>
                <span>{config?.label || category}</span>
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex gap-2">
        {(['all', 'unlocked', 'locked'] as AchievementFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                filter === f
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievement grid - responsive columns */}
      <div
        className={`
          grid gap-4
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          ${!prefersReducedMotion ? 'animate-stagger-in' : ''}
        `}
      >
        {filteredAchievements.map((achievement, index) => {
          const isUnlocked = isAchievementUnlocked(achievement.id);
          const achievementProgress = getProgressForAchievement(achievement.id);

          return (
            <div
              key={achievement.id}
              style={{
                animationDelay: prefersReducedMotion
                  ? '0ms'
                  : `${index * 50}ms`,
              }}
            >
              <AchievementCard
                achievement={achievement}
                isUnlocked={isUnlocked}
                earnedAt={getEarnedAt(achievement.id)}
                progress={achievementProgress}
                onClick={() => setSelectedAchievement(achievement)}
              />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No achievements found</p>
          <p className="text-sm mt-2">
            {filter === 'unlocked'
              ? 'Keep playing to unlock achievements!'
              : filter === 'locked'
              ? 'You\'ve unlocked all achievements in this category!'
              : 'No achievements available'}
          </p>
        </div>
      )}

      {/* Detail modal */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        isUnlocked={selectedAchievement ? isAchievementUnlocked(selectedAchievement.id) : false}
        earnedAt={selectedAchievement ? getEarnedAt(selectedAchievement.id) : undefined}
        progress={
          selectedAchievement
            ? getProgressForAchievement(selectedAchievement.id)
            : undefined
        }
        isOpen={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}

export default AchievementPanel;
