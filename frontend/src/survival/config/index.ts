/**
 * Survival Mode Configuration System
 * Enterprise-grade adaptive configuration for cross-device optimization
 * 
 * This module provides:
 * - Device detection and capability profiling
 * - Quality presets with auto-adjustment
 * - Mobile-optimized settings
 * - Responsive configuration utilities
 */

// Import for local use
import { getDeviceCapabilities as _getDeviceCapabilities } from './device'
import { getQualityProfile as _getQualityProfile } from './quality'

// Device detection
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
  type PerformanceTier,
  type InputMode,
  type SafeAreaInsets,
} from './device'

// Quality settings
export {
  getQualityProfile,
  setQualityTier,
  setQualityOverrides,
  recordFPSForQuality,
  onQualityChange,
  setAutoQualityAdjust,
  QUALITY_PRESETS,
  type QualityProfile,
  type RendererQuality,
  type ParticleQuality,
  type SpaceQuality,
  type PhysicsQuality,
  type AnimationQuality,
  type AudioQuality,
} from './quality'

// Mobile configuration
export {
  getMobileConfig,
  refreshMobileConfig,
  setMobileConfigOverrides,
  onMobileConfigChange,
  getResponsiveValue,
  getTouchZonePixels,
  isInTouchZone,
  type MobileConfig,
  type TouchZoneConfig,
  type UIScaleConfig,
  type MobileBalanceConfig,
} from './mobile'

// Legacy constants (for backward compatibility)
export {
  SURVIVAL_ASSETS,
  SURVIVAL_CONFIG,
  RENDERER_CONFIG,
  getSurvivalConfig,
  getRendererConfig,
  COLORS,
  KEY_BINDINGS,
} from './constants'

// World configuration (runtime-calculated geometry)
export {
  WorldConfig,
  WORLD_CONFIG_DEFAULTS,
  type PlayerDimensions,
} from './WorldConfig'

/**
 * Initialize configuration system
 * Call this early in app startup to ensure device detection runs
 */
export function initializeConfig(): void {
  // Trigger device detection
  const caps = _getDeviceCapabilities()
  
  console.log('[Config] Initialized for:', {
    device: caps.deviceType,
    tier: caps.performanceTier,
    touch: caps.touchSupported,
    screen: `${caps.screenWidth}x${caps.screenHeight}@${caps.pixelRatio}x`,
  })
}

/**
 * Get a summary of current configuration for debugging
 */
export function getConfigSummary(): {
  device: string
  quality: string
  mobile: boolean
  touch: boolean
  screen: string
  performance: string
} {
  const caps = _getDeviceCapabilities()
  const quality = _getQualityProfile()
  
  return {
    device: caps.deviceType,
    quality: quality.name,
    mobile: caps.isMobile,
    touch: caps.touchSupported,
    screen: `${caps.screenWidth}x${caps.screenHeight}@${caps.pixelRatio}x`,
    performance: caps.performanceTier,
  }
}
