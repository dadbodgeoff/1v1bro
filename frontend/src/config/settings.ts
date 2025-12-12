/**
 * Settings Configuration
 * 
 * Centralized settings options for enterprise configurability.
 * Allows adding/removing options without code deployment.
 * 
 * @module config/settings
 */

export interface SettingsOption<T = string> {
  value: T
  label: string
  description?: string
  /** Whether this option is enabled (default: true) */
  enabled?: boolean
}

// ============================================
// Video Settings
// ============================================

export const VIDEO_QUALITY_OPTIONS: SettingsOption[] = [
  { value: 'low', label: 'Low', description: 'Best performance', enabled: true },
  { value: 'medium', label: 'Medium', description: 'Balanced', enabled: true },
  { value: 'high', label: 'High', description: 'Recommended', enabled: true },
  { value: 'ultra', label: 'Ultra', description: 'Best quality', enabled: true },
]

export const FPS_LIMIT_OPTIONS: SettingsOption[] = [
  { value: '0', label: 'Unlimited', description: 'No FPS cap', enabled: true },
  { value: '30', label: '30 FPS', description: 'Low power', enabled: true },
  { value: '60', label: '60 FPS', description: 'Smooth', enabled: true },
  { value: '120', label: '120 FPS', description: 'High refresh', enabled: true },
]

// ============================================
// Accessibility Settings
// ============================================

export const COLORBLIND_OPTIONS: SettingsOption[] = [
  { value: 'none', label: 'None', description: 'Default colors', enabled: true },
  { value: 'protanopia', label: 'Protanopia', description: 'Red-blind', enabled: true },
  { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind', enabled: true },
  { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind', enabled: true },
]

// ============================================
// Controls Settings
// ============================================

export interface KeybindAction {
  key: string
  label: string
  /** Whether this keybind is configurable (default: true) */
  configurable?: boolean
}

export const KEYBIND_ACTIONS: KeybindAction[] = [
  { key: 'move_up', label: 'Move Up', configurable: true },
  { key: 'move_down', label: 'Move Down', configurable: true },
  { key: 'move_left', label: 'Move Left', configurable: true },
  { key: 'move_right', label: 'Move Right', configurable: true },
  { key: 'use_powerup', label: 'Use Power-up', configurable: true },
  { key: 'open_emote', label: 'Open Emote Wheel', configurable: true },
  { key: 'toggle_scoreboard', label: 'Toggle Scoreboard', configurable: true },
]

// ============================================
// Audio Settings
// ============================================

export interface AudioSliderConfig {
  id: string
  label: string
  min: number
  max: number
  defaultValue: number
  step?: number
}

export const AUDIO_SLIDERS: AudioSliderConfig[] = [
  { id: 'master', label: 'Master Volume', min: 0, max: 100, defaultValue: 80 },
  { id: 'music', label: 'Music Volume', min: 0, max: 100, defaultValue: 70 },
  { id: 'sfx', label: 'Sound Effects', min: 0, max: 100, defaultValue: 80 },
  { id: 'voice', label: 'Voice/Announcer', min: 0, max: 100, defaultValue: 100 },
]

// ============================================
// Helpers
// ============================================

/**
 * Get enabled options from a list
 */
export function getEnabledOptions<T>(options: SettingsOption<T>[]): SettingsOption<T>[] {
  return options.filter(opt => opt.enabled !== false)
}

/**
 * Get configurable keybind actions
 */
export function getConfigurableKeybinds(): KeybindAction[] {
  return KEYBIND_ACTIONS.filter(action => action.configurable !== false)
}
