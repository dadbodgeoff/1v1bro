/**
 * Configuration Module Index
 * 
 * Centralized exports for all configuration.
 * Import from '@/config' for clean access.
 * 
 * @module config
 */

// Categories
export {
  CATEGORY_DISPLAY_CONFIG,
  FALLBACK_CATEGORY_CONFIG,
  getCategoryConfig,
  getCategoryColor,
  getEnabledCategories,
  type CategoryDisplayConfig,
} from './categories'

// Z-Index
export {
  Z_INDEX,
  Z_CLASS,
  getZIndex,
  getZClass,
} from './zindex'

// Navigation
export {
  DEFAULT_NAV_ITEMS,
  getEnabledNavItems,
  getNavItem,
  type NavItemConfig,
  type NavItemId,
} from './navigation'

// Onboarding
export {
  DEFAULT_ONBOARDING_STEPS,
  getEnabledOnboardingSteps,
  getAccentColor,
  type OnboardingStep,
  type OnboardingHighlight,
} from './onboarding'

// Settings
export {
  VIDEO_QUALITY_OPTIONS,
  FPS_LIMIT_OPTIONS,
  COLORBLIND_OPTIONS,
  KEYBIND_ACTIONS,
  AUDIO_SLIDERS,
  getEnabledOptions,
  getConfigurableKeybinds,
  type SettingsOption,
  type KeybindAction,
  type AudioSliderConfig,
} from './settings'

// Features
export {
  DEFAULT_FEATURES,
  getEnabledFeatures,
  getFeatureTitles,
  type FeatureConfig,
} from './features'
