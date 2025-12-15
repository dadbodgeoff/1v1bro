/**
 * Polish Store - Centralized state management for polish systems.
 * Requirements: 7.1, 7.2, 7.4
 * 
 * Manages settings for haptic feedback, ambient effects, celebration animations,
 * and syncs with the existing settings infrastructure.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from './settingsStore';

// ============================================
// Types
// ============================================

export interface PolishSettings {
  hapticFeedback: boolean;
  ambientEffects: boolean;
  celebrationAnimations: boolean;
  pageTransitions: boolean;
}

export interface PolishState {
  settings: PolishSettings;
  isInitialized: boolean;
  performanceScore: number; // 0-100, higher = better device
  
  // Actions
  updateSettings: (updates: Partial<PolishSettings>) => void;
  setPerformanceScore: (score: number) => void;
  initialize: () => void;
  reset: () => void;
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_POLISH_SETTINGS: PolishSettings = {
  hapticFeedback: true,
  ambientEffects: true,
  celebrationAnimations: true,
  pageTransitions: true,
};

// ============================================
// Store
// ============================================

export const usePolishStore = create<PolishState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_POLISH_SETTINGS },
      isInitialized: false,
      performanceScore: 100,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      setPerformanceScore: (score) => {
        set({ performanceScore: Math.max(0, Math.min(100, score)) });
      },

      initialize: () => {
        if (get().isInitialized) return;
        
        // Sync reduced_motion from accessibility settings
        const accessibilitySettings = useSettingsStore.getState().settings?.accessibility;
        if (accessibilitySettings?.reduced_motion) {
          set((state) => ({
            settings: {
              ...state.settings,
              celebrationAnimations: false,
              pageTransitions: false,
              ambientEffects: false,
            },
          }));
        }
        
        // Check for prefers-reduced-motion media query
        if (typeof window !== 'undefined') {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (prefersReducedMotion) {
            set((state) => ({
              settings: {
                ...state.settings,
                celebrationAnimations: false,
                pageTransitions: false,
                ambientEffects: false,
              },
            }));
          }
        }
        
        set({ isInitialized: true });
      },

      reset: () => {
        set({
          settings: { ...DEFAULT_POLISH_SETTINGS },
          isInitialized: false,
          performanceScore: 100,
        });
      },
    }),
    {
      name: 'polish-settings-storage',
      partialize: (state) => ({
        settings: state.settings,
        performanceScore: state.performanceScore,
      }),
    }
  )
);

// ============================================
// Selector Hooks
// ============================================

export const useHapticFeedbackEnabled = () => 
  usePolishStore((s) => s.settings.hapticFeedback);

export const useAmbientEffectsEnabled = () => 
  usePolishStore((s) => s.settings.ambientEffects);

export const useCelebrationAnimationsEnabled = () => 
  usePolishStore((s) => s.settings.celebrationAnimations);

export const usePageTransitionsEnabled = () => 
  usePolishStore((s) => s.settings.pageTransitions);

export const usePerformanceScore = () => 
  usePolishStore((s) => s.performanceScore);

// ============================================
// Sync with Accessibility Settings
// ============================================

/**
 * Subscribe to accessibility settings changes and sync reduced_motion.
 * Call this once at app initialization.
 */
export function syncPolishWithAccessibility(): () => void {
  return useSettingsStore.subscribe((state) => {
    const reducedMotion = state.settings?.accessibility?.reduced_motion;
    if (reducedMotion !== undefined) {
      const polishStore = usePolishStore.getState();
      // When reduced_motion is enabled, disable animations
      if (reducedMotion) {
        polishStore.updateSettings({
          celebrationAnimations: false,
          pageTransitions: false,
          ambientEffects: false,
        });
      }
    }
  });
}
