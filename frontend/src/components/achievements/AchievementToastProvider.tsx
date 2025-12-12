/**
 * Achievement Toast Provider
 * Requirements: 9.1, 9.4
 * 
 * Global provider for achievement toasts that listens to WebSocket events.
 * Wrap your app with this to enable achievement toasts everywhere.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAchievementToasts } from '@/hooks/useAchievementToasts';
import { AchievementToast } from './AchievementToast';
import { wsService } from '@/services/websocket';
import type { Achievement, AchievementToastData } from '@/types/achievements';

interface AchievementToastContextValue {
  toasts: AchievementToastData[];
  addToast: (achievement: Achievement, coinsAwarded?: number) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const AchievementToastContext = createContext<AchievementToastContextValue | null>(null);

export function useAchievementToastContext() {
  const context = useContext(AchievementToastContext);
  if (!context) {
    throw new Error('useAchievementToastContext must be used within AchievementToastProvider');
  }
  return context;
}

interface AchievementToastProviderProps {
  children: ReactNode;
}

export function AchievementToastProvider({ children }: AchievementToastProviderProps) {
  const { toasts, addToast, dismissToast, clearAllToasts } = useAchievementToasts();

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
      
      // Check if this is an achievement notification
      if (
        data.type === 'reward' &&
        data.metadata?.achievement_id
      ) {
        const meta = data.metadata;
        
        // Construct achievement object from notification metadata
        const achievement: Achievement = {
          id: meta.achievement_id!,
          name: meta.achievement_name || 'Achievement Unlocked',
          description: meta.achievement_description || '',
          rarity: (meta.achievement_rarity as Achievement['rarity']) || 'common',
          icon_url: meta.achievement_icon_url || '',
          category: 'games', // Default category
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
    <AchievementToastContext.Provider
      value={{ toasts, addToast, dismissToast, clearAllToasts }}
    >
      {children}
      
      {/* Render active toasts - only show the first one at a time */}
      {toasts.slice(0, 1).map((toast) => (
        <AchievementToast
          key={toast.id}
          achievement={toast.achievement}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </AchievementToastContext.Provider>
  );
}

export default AchievementToastProvider;
