/**
 * Arena Configuration Exports
 * Central export point for all arena config modules
 */

// Quality system
export {
  getArenaQualityProfile,
  setArenaQualityTier,
  recordArenaFPS,
  onArenaQualityChange,
  setArenaAutoQualityAdjust,
  getArenaDeviceCapabilities,
  detectDeviceCapabilities,
  ARENA_QUALITY_PRESETS,
  type ArenaQualityProfile,
  type RendererQuality,
  type CharacterQuality,
  type EffectsQuality,
  type PhysicsQuality,
  type PerformanceTier,
  type DeviceCapabilities as LegacyDeviceCapabilities,
} from './quality'

// Device detection (enhanced)
export {
  getDeviceCapabilities,
  refreshDeviceCapabilities,
  onDeviceCapabilitiesChange,
  isMobileDevice,
  isTouchDevice,
  getPerformanceTier,
  shouldReduceMotion,
  BREAKPOINTS,
  type DeviceCapabilities,
  type DeviceType,
  type InputMode,
  type SafeAreaInsets,
  type Breakpoints,
} from './device'

// Mobile configuration
export {
  getMobileConfig,
  refreshMobileConfig,
  setMobileConfigOverrides,
  onMobileConfigChange,
  getResponsiveValue,
  getTouchZonePixels,
  isInTouchZone,
  generateMobileConfig,
  type MobileConfig,
  type TouchZoneConfig,
  type UIScaleConfig,
  type MobileBalanceConfig,
} from './mobile'
