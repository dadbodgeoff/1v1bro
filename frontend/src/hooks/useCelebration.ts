/**
 * useCelebration - Hook for triggering celebrations from components.
 * Requirements: 2.1, 2.2, 2.3
 * 
 * Provides convenient methods for triggering purchase, tier-up, and achievement celebrations.
 */

import { useCallback, useMemo } from 'react';
import {
  getCelebrationSystem,
  type RewardItem,
  type ItemRarity,
  type CelebrationData,
  type CelebrationType,
  type CelebrationPriority,
} from '@/systems/polish/CelebrationSystem';
import { usePolishStore } from '@/stores/polishStore';

export interface UseCelebrationReturn {
  // Trigger methods
  triggerPurchase: (item: RewardItem) => void;
  triggerCoinPurchase: (amount: number) => void;
  triggerTierUp: (tierNumber: number, reward?: RewardItem) => void;
  triggerAchievement: (name: string, description: string, xpReward?: number, rarity?: ItemRarity) => void;
  triggerMilestone: (title: string, subtitle?: string) => void;
  triggerDailyReward: (reward: RewardItem) => void;
  
  // Generic trigger
  trigger: (type: CelebrationType, data: CelebrationData, priority?: CelebrationPriority) => void;
  
  // Skip current celebration
  skip: () => void;
  
  // Clear all pending
  clearQueue: () => void;
  
  // State
  isEnabled: boolean;
}

export function useCelebration(): UseCelebrationReturn {
  const { settings } = usePolishStore();
  const isEnabled = settings.celebrationAnimations;
  
  const system = useMemo(() => getCelebrationSystem(), []);
  
  // Update system enabled state when settings change
  useMemo(() => {
    system.setEnabled(isEnabled);
  }, [system, isEnabled]);
  
  const triggerPurchase = useCallback((item: RewardItem) => {
    system.triggerPurchase(item);
  }, [system]);
  
  const triggerCoinPurchase = useCallback((amount: number) => {
    system.triggerCoinPurchase(amount);
  }, [system]);
  
  const triggerTierUp = useCallback((tierNumber: number, reward?: RewardItem) => {
    system.triggerTierUp(tierNumber, reward);
  }, [system]);
  
  const triggerAchievement = useCallback((
    name: string,
    description: string,
    xpReward?: number,
    rarity?: ItemRarity
  ) => {
    system.triggerAchievement(name, description, xpReward, rarity);
  }, [system]);
  
  const triggerMilestone = useCallback((title: string, subtitle?: string) => {
    system.queueCelebration('milestone', { title, subtitle });
  }, [system]);
  
  const triggerDailyReward = useCallback((reward: RewardItem) => {
    system.queueCelebration('daily-reward', {
      title: 'Daily Reward!',
      subtitle: reward.name,
      icon: reward.icon,
      rarity: reward.rarity,
      rewards: [reward],
    });
  }, [system]);
  
  const trigger = useCallback((
    type: CelebrationType,
    data: CelebrationData,
    priority?: CelebrationPriority
  ) => {
    system.queueCelebration(type, data, priority);
  }, [system]);
  
  const skip = useCallback(() => {
    system.skip();
  }, [system]);
  
  const clearQueue = useCallback(() => {
    system.clearQueue();
  }, [system]);
  
  return {
    triggerPurchase,
    triggerCoinPurchase,
    triggerTierUp,
    triggerAchievement,
    triggerMilestone,
    triggerDailyReward,
    trigger,
    skip,
    clearQueue,
    isEnabled,
  };
}

export default useCelebration;
