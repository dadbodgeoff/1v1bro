/**
 * useAchievements Hook
 * Requirements: 4.1, 4.2, 4.5, 10.1, 10.2, 10.3, 10.4
 */

import { useState, useEffect, useCallback } from 'react';
import { achievementAPI } from '@/services/achievementService';
import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  AchievementStats,
  AchievementUnlock,
  AchievementCategory,
  AchievementsByCategory,
} from '@/types/achievements';

interface UseAchievementsReturn {
  // Data
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  progress: AchievementProgress[];
  stats: AchievementStats | null;
  categories: AchievementCategory[];
  achievementsByCategory: AchievementsByCategory;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  checkAchievements: () => Promise<AchievementUnlock[]>;
  
  // Helpers
  getAchievementById: (id: string) => Achievement | undefined;
  isAchievementUnlocked: (achievementId: string) => boolean;
  getProgressForAchievement: (achievementId: string) => AchievementProgress | undefined;
}

export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all achievement data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [achievementsData, userAchievementsData, progressData, statsData] =
        await Promise.all([
          achievementAPI.getAchievements(),
          achievementAPI.getUserAchievements(),
          achievementAPI.getAchievementProgress(),
          achievementAPI.getAchievementStats(),
        ]);

      setAchievements(achievementsData);
      setUserAchievements(userAchievementsData);
      setProgress(progressData);
      setStats(statsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(message);
      console.error('Failed to fetch achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check achievements manually
  const checkAchievements = useCallback(async (): Promise<AchievementUnlock[]> => {
    try {
      const unlocks = await achievementAPI.checkAchievements();
      
      // Refetch data if any achievements were unlocked
      if (unlocks.length > 0) {
        await fetchData();
      }
      
      return unlocks;
    } catch (err) {
      console.error('Failed to check achievements:', err);
      throw err;
    }
  }, [fetchData]);

  // Get unique categories from achievements
  const categories = Array.from(
    new Set(achievements.map((a) => a.category))
  ) as AchievementCategory[];

  // Group achievements by category
  const achievementsByCategory: AchievementsByCategory = achievements.reduce(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    },
    {} as AchievementsByCategory
  );

  // Helper to get achievement by ID
  const getAchievementById = useCallback(
    (id: string): Achievement | undefined => {
      return achievements.find((a) => a.id === id);
    },
    [achievements]
  );

  // Helper to check if achievement is unlocked
  const isAchievementUnlocked = useCallback(
    (achievementId: string): boolean => {
      return userAchievements.some((ua) => ua.achievement_id === achievementId);
    },
    [userAchievements]
  );

  // Helper to get progress for an achievement
  const getProgressForAchievement = useCallback(
    (achievementId: string): AchievementProgress | undefined => {
      return progress.find((p) => p.achievement_id === achievementId);
    },
    [progress]
  );

  return {
    achievements,
    userAchievements,
    progress,
    stats,
    categories,
    achievementsByCategory,
    isLoading,
    error,
    refetch: fetchData,
    checkAchievements,
    getAchievementById,
    isAchievementUnlocked,
    getProgressForAchievement,
  };
}

/**
 * Hook for viewing another user's achievements
 */
export function useUserAchievements(userId: string) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [achievementsData, statsData] = await Promise.all([
          achievementAPI.getUserAchievementsById(userId),
          achievementAPI.getUserAchievementStatsById(userId),
        ]);

        setAchievements(achievementsData);
        setStats(statsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load achievements';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  return { achievements, stats, isLoading, error };
}
