/**
 * useAchievementToasts Hook
 * Requirements: 9.3, 9.4
 * 
 * Manages achievement toast queue with 1-second delays between toasts.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Achievement, AchievementToastData } from '@/types/achievements';

interface UseAchievementToastsReturn {
  toasts: AchievementToastData[];
  addToast: (achievement: Achievement, coinsAwarded?: number) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const TOAST_DELAY_MS = 1000; // 1 second between toasts
const AUTO_DISMISS_MS = 5000; // 5 seconds auto-dismiss

export function useAchievementToasts(): UseAchievementToastsReturn {
  const [toasts, setToasts] = useState<AchievementToastData[]>([]);
  const [activeToast, setActiveToast] = useState<AchievementToastData | null>(null);
  const queueRef = useRef<AchievementToastData[]>([]);
  const processingRef = useRef(false);

  // Process the queue with delays
  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const nextToast = queueRef.current.shift();

    if (nextToast) {
      setActiveToast(nextToast);
      setToasts((prev) => [...prev, nextToast]);

      // Schedule next toast after delay
      setTimeout(() => {
        processingRef.current = false;
        processQueue();
      }, TOAST_DELAY_MS + AUTO_DISMISS_MS);
    }
  }, []);

  // Add a toast to the queue
  const addToast = useCallback(
    (achievement: Achievement, coinsAwarded = 3) => {
      const toast: AchievementToastData = {
        id: `${achievement.id}-${Date.now()}`,
        achievement,
        earnedAt: new Date().toISOString(),
        coinsAwarded,
      };

      queueRef.current.push(toast);
      processQueue();
    },
    [processQueue]
  );

  // Dismiss a specific toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (activeToast?.id === id) {
      setActiveToast(null);
    }
  }, [activeToast]);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    queueRef.current = [];
    setToasts([]);
    setActiveToast(null);
    processingRef.current = false;
  }, []);

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) => {
      return setTimeout(() => {
        dismissToast(toast.id);
      }, AUTO_DISMISS_MS);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, dismissToast]);

  return {
    toasts,
    addToast,
    dismissToast,
    clearAllToasts,
  };
}

export default useAchievementToasts;
