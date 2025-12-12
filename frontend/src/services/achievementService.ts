/**
 * Achievement API Service
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { API_BASE } from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';
import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  AchievementStats,
  AchievementUnlock,
  AchievementCategory,
} from '@/types/achievements';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

class AchievementAPIError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'AchievementAPIError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data: APIResponse<T> = await response.json();

  if (!data.success) {
    throw new AchievementAPIError(
      data.error || 'Request failed',
      data.error_code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return data.data as T;
}

export const achievementAPI = {
  /**
   * Get all achievement definitions
   * Requirements: 7.1, 7.5
   */
  getAchievements: (params?: {
    category?: AchievementCategory;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    
    const query = searchParams.toString();
    return request<Achievement[]>(`/achievements${query ? `?${query}` : ''}`);
  },

  /**
   * Get all achievement categories
   */
  getCategories: () => request<string[]>('/achievements/categories'),

  /**
   * Get current user's earned achievements
   * Requirements: 7.2
   */
  getUserAchievements: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    
    const query = searchParams.toString();
    return request<UserAchievement[]>(`/achievements/me${query ? `?${query}` : ''}`);
  },

  /**
   * Get progress toward all achievements
   * Requirements: 7.3
   */
  getAchievementProgress: () =>
    request<AchievementProgress[]>('/achievements/progress'),

  /**
   * Get achievement statistics for profile
   */
  getAchievementStats: () =>
    request<AchievementStats>('/achievements/stats'),

  /**
   * Manually trigger achievement check
   * Requirements: 7.4
   */
  checkAchievements: () =>
    request<AchievementUnlock[]>('/achievements/check', {
      method: 'POST',
    }),

  /**
   * Get achievements for a specific user (for profile viewing)
   */
  getUserAchievementsById: (
    userId: string,
    params?: { limit?: number; offset?: number }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    
    const query = searchParams.toString();
    return request<UserAchievement[]>(
      `/achievements/user/${userId}${query ? `?${query}` : ''}`
    );
  },

  /**
   * Get achievement stats for a specific user
   */
  getUserAchievementStatsById: (userId: string) =>
    request<AchievementStats>(`/achievements/user/${userId}/stats`),
};

export { AchievementAPIError };
