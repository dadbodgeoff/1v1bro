/**
 * Settings store for global settings state management.
 * Requirements: 11.1, 11.2, 11.4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserSettings,
  AudioSettings,
  VideoSettings,
  AccessibilitySettings,
  Keybinds,
  NotificationPreferences,
} from '../types/settings';
import { getDefaultSettings } from '../types/settings';

// Type for pending changes - allows partial nested objects
type PendingChange = {
  audio?: Partial<AudioSettings>;
  video?: Partial<VideoSettings>;
  accessibility?: Partial<AccessibilitySettings>;
  keybinds?: Partial<Keybinds>;
  notifications?: Partial<NotificationPreferences>;
};

interface SettingsState {
  settings: UserSettings | null;
  isLoaded: boolean;
  isOffline: boolean;
  pendingChanges: PendingChange[];
  
  // Actions
  setSettings: (settings: UserSettings) => void;
  updateAudio: (audio: Partial<AudioSettings>) => void;
  updateVideo: (video: Partial<VideoSettings>) => void;
  updateAccessibility: (accessibility: Partial<AccessibilitySettings>) => void;
  updateKeybinds: (keybinds: Partial<Keybinds>) => void;
  updateNotifications: (notifications: Partial<NotificationPreferences>) => void;
  setOffline: (offline: boolean) => void;
  queueChange: (change: PendingChange) => void;
  clearPendingChanges: () => void;
  reset: () => void;
}

const defaults = getDefaultSettings();

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: null,
      isLoaded: false,
      isOffline: false,
      pendingChanges: [],

      setSettings: (settings) => set({ settings, isLoaded: true }),

      updateAudio: (audio) => set((state) => {
        if (!state.settings) return state;
        const newSettings = {
          ...state.settings,
          audio: { ...state.settings.audio, ...audio },
        };
        
        // Queue change if offline
        if (state.isOffline) {
          return {
            settings: newSettings,
            pendingChanges: [...state.pendingChanges, { audio }],
          };
        }
        
        return { settings: newSettings };
      }),

      updateVideo: (video) => set((state) => {
        if (!state.settings) return state;
        const newSettings = {
          ...state.settings,
          video: { ...state.settings.video, ...video },
        };
        
        if (state.isOffline) {
          return {
            settings: newSettings,
            pendingChanges: [...state.pendingChanges, { video }],
          };
        }
        
        return { settings: newSettings };
      }),

      updateAccessibility: (accessibility) => set((state) => {
        if (!state.settings) return state;
        const newSettings = {
          ...state.settings,
          accessibility: { ...state.settings.accessibility, ...accessibility },
        };
        
        if (state.isOffline) {
          return {
            settings: newSettings,
            pendingChanges: [...state.pendingChanges, { accessibility }],
          };
        }
        
        return { settings: newSettings };
      }),

      updateKeybinds: (keybinds) => set((state) => {
        if (!state.settings) return state;
        const newSettings = {
          ...state.settings,
          keybinds: { ...state.settings.keybinds, ...keybinds },
        };
        
        if (state.isOffline) {
          return {
            settings: newSettings,
            pendingChanges: [...state.pendingChanges, { keybinds }],
          };
        }
        
        return { settings: newSettings };
      }),

      updateNotifications: (notifications) => set((state) => {
        if (!state.settings) return state;
        const newSettings = {
          ...state.settings,
          notifications: { ...state.settings.notifications, ...notifications },
        };
        
        if (state.isOffline) {
          return {
            settings: newSettings,
            pendingChanges: [...state.pendingChanges, { notifications }],
          };
        }
        
        return { settings: newSettings };
      }),

      setOffline: (offline) => set({ isOffline: offline }),

      queueChange: (change) => set((state) => ({
        pendingChanges: [...state.pendingChanges, change],
      })),

      clearPendingChanges: () => set({ pendingChanges: [] }),

      reset: () => set({
        settings: { user_id: '', ...defaults },
        isLoaded: false,
        isOffline: false,
        pendingChanges: [],
      }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings,
        pendingChanges: state.pendingChanges,
      }),
    }
  )
);

// Selector hooks for specific settings
export const useAudioSettings = () => useSettingsStore((s) => s.settings?.audio);
export const useVideoSettings = () => useSettingsStore((s) => s.settings?.video);
export const useAccessibilitySettings = () => useSettingsStore((s) => s.settings?.accessibility);
export const useKeybinds = () => useSettingsStore((s) => s.settings?.keybinds);
export const useNotificationPreferences = () => useSettingsStore((s) => s.settings?.notifications);
