/**
 * Achievements Page
 * Requirements: 4.1, 9.1
 */

import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AchievementPanel } from '@/components/achievements/AchievementPanel';
import { AchievementToast } from '@/components/achievements/AchievementToast';
import { useAchievementToasts } from '@/hooks/useAchievementToasts';
import { wsService } from '@/services/websocket';
import type { Achievement } from '@/types/achievements';

export function Achievements() {
  const { toasts, addToast, dismissToast } = useAchievementToasts();

  // Listen for achievement unlock notifications via WebSocket
  useEffect(() => {
    const handleNotification = (payload: unknown) => {
      const data = payload as {
        type?: string;
        metadata?: {
          achievement_id?: string;
          achievement_name?: string;
          achievement_description?: string;
          achievement_rarity?: string;
          achievement_icon_url?: string;
          coin_reward?: number;
        };
      };
      
      if (
        data.type === 'reward' &&
        data.metadata?.achievement_id
      ) {
        const meta = data.metadata;
        const achievement: Achievement = {
          id: meta.achievement_id!,
          name: meta.achievement_name || 'Achievement',
          description: meta.achievement_description || '',
          rarity: (meta.achievement_rarity as Achievement['rarity']) || 'common',
          icon_url: meta.achievement_icon_url || '',
          category: 'games', // Default, not critical for toast
          criteria_type: 'games_played',
          criteria_value: 0,
          is_active: true,
          sort_order: 0,
          coin_reward: meta.coin_reward || 3,
        };
        addToast(achievement, meta.coin_reward);
      }
    };

    const unsubscribe = wsService.on('notification', handleNotification);

    return () => {
      unsubscribe();
    };
  }, [addToast]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-gray-400">
            Track your progress and earn coins by completing achievements
          </p>
        </div>

        {/* Achievement panel */}
        <AchievementPanel />

        {/* Achievement toasts */}
        {toasts.slice(0, 1).map((toast) => (
          <AchievementToast
            key={toast.id}
            achievement={toast.achievement}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Achievements;
