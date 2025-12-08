/**
 * Settings types for user preferences management.
 * Requirements: 2.3
 */

// ============================================
// Enums and Types
// ============================================

export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type FPSLimit = 0 | 30 | 60 | 120;

// ============================================
// Notification Preferences
// ============================================

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  friend_activity: boolean;
  match_updates: boolean;
  marketing_emails: boolean;
}

export interface NotificationPreferencesUpdate {
  email_enabled?: boolean;
  push_enabled?: boolean;
  friend_activity?: boolean;
  match_updates?: boolean;
  marketing_emails?: boolean;
}

// ============================================
// Audio Settings
// ============================================

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  voice: number;
}

export interface AudioSettingsUpdate {
  master?: number;
  music?: number;
  sfx?: number;
  voice?: number;
}

// ============================================
// Video Settings
// ============================================

export interface VideoSettings {
  quality: VideoQuality;
  fps_limit: FPSLimit;
  show_fps_counter: boolean;
}

export interface VideoSettingsUpdate {
  quality?: VideoQuality;
  fps_limit?: FPSLimit;
  show_fps_counter?: boolean;
}

// ============================================
// Accessibility Settings
// ============================================

export interface AccessibilitySettings {
  reduced_motion: boolean;
  colorblind_mode: ColorblindMode;
  font_scale: number;
  high_contrast: boolean;
}

export interface AccessibilitySettingsUpdate {
  reduced_motion?: boolean;
  colorblind_mode?: ColorblindMode;
  font_scale?: number;
  high_contrast?: boolean;
}

// ============================================
// Keybinds
// ============================================

export interface Keybinds {
  move_up: string;
  move_down: string;
  move_left: string;
  move_right: string;
  use_powerup: string;
  open_emote: string;
  toggle_scoreboard: string;
}

export interface KeybindsUpdate {
  move_up?: string;
  move_down?: string;
  move_left?: string;
  move_right?: string;
  use_powerup?: string;
  open_emote?: string;
  toggle_scoreboard?: string;
}

export const DEFAULT_KEYBINDS: Keybinds = {
  move_up: 'KeyW',
  move_down: 'KeyS',
  move_left: 'KeyA',
  move_right: 'KeyD',
  use_powerup: 'Space',
  open_emote: 'KeyE',
  toggle_scoreboard: 'Tab',
};

// ============================================
// Privacy Settings
// ============================================

export interface PrivacySettings {
  is_public: boolean;
  accept_friend_requests: boolean;
  allow_messages: boolean;
  show_online_status: boolean;
  show_match_history: boolean;
}

export interface PrivacySettingsUpdate {
  is_public?: boolean;
  accept_friend_requests?: boolean;
  allow_messages?: boolean;
  show_online_status?: boolean;
  show_match_history?: boolean;
}

// ============================================
// Composite User Settings
// ============================================

export interface UserSettings {
  user_id: string;
  notifications: NotificationPreferences;
  audio: AudioSettings;
  video: VideoSettings;
  accessibility: AccessibilitySettings;
  keybinds: Keybinds;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get display name for a key code.
 */
export function getKeyDisplayName(keyCode: string): string {
  const keyMap: Record<string, string> = {
    KeyW: 'W',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    KeyE: 'E',
    KeyQ: 'Q',
    KeyR: 'R',
    KeyF: 'F',
    Space: 'Space',
    Tab: 'Tab',
    ShiftLeft: 'L Shift',
    ShiftRight: 'R Shift',
    ControlLeft: 'L Ctrl',
    ControlRight: 'R Ctrl',
    AltLeft: 'L Alt',
    AltRight: 'R Alt',
    Escape: 'Esc',
    Enter: 'Enter',
    Backspace: 'Backspace',
  };
  
  return keyMap[keyCode] || keyCode.replace('Key', '');
}

/**
 * Check if keybinds have conflicts.
 */
export function hasKeybindConflicts(keybinds: Keybinds): string[] {
  const keys = Object.values(keybinds);
  const seen = new Set<string>();
  const conflicts: string[] = [];
  
  for (const key of keys) {
    if (seen.has(key)) {
      conflicts.push(key);
    }
    seen.add(key);
  }
  
  return conflicts;
}

/**
 * Get default settings.
 */
export function getDefaultSettings(): Omit<UserSettings, 'user_id'> {
  return {
    notifications: {
      email_enabled: true,
      push_enabled: true,
      friend_activity: true,
      match_updates: true,
      marketing_emails: false,
    },
    audio: {
      master: 80,
      music: 70,
      sfx: 80,
      voice: 100,
    },
    video: {
      quality: 'high',
      fps_limit: 60,
      show_fps_counter: false,
    },
    accessibility: {
      reduced_motion: false,
      colorblind_mode: 'none',
      font_scale: 1.0,
      high_contrast: false,
    },
    keybinds: { ...DEFAULT_KEYBINDS },
  };
}
