/**
 * Mobile-Optimized Configuration
 * Enterprise-grade mobile settings derived from device capabilities
 * 
 * Features:
 * - Touch control configuration
 * - Responsive UI scaling
 * - Mobile-specific game balance
 * - Battery-aware optimizations
 */

import type { DeviceCapabilities, DeviceType } from './device'
import { getDeviceCapabilities, BREAKPOINTS } from './device'
import { getQualityProfile } from './quality'

/**
 * Touch control zone configuration
 */
export interface TouchZoneConfig {
  // Zone boundaries (0-1 normalized)
  leftZone: { x: [number, number]; y: [number, number] }
  rightZone: { x: [number, number]; y: [number, number] }
  jumpZone: { x: [number, number]; y: [number, number] }
  slideZone: { x: [number, number]; y: [number, number] }
  pauseZone: { x: [number, number]; y: [number, number] }
  
  // Gesture settings
  swipeThreshold: number      // Min distance for swipe (px)
  swipeVelocity: number       // Min velocity for swipe (px/ms)
  tapTimeout: number          // Max duration for tap (ms)
  doubleTapTimeout: number    // Max gap for double-tap (ms)
  holdDuration: number        // Min duration for hold (ms)
  
  // Visual feedback
  showTouchIndicators: boolean
  hapticFeedback: boolean
  touchHighlightDuration: number
}

/**
 * UI scaling configuration
 */
export interface UIScaleConfig {
  // Base scale factors
  hudScale: number            // HUD element scaling
  buttonScale: number         // Touch button scaling
  textScale: number           // Text size multiplier
  iconScale: number           // Icon size multiplier
  
  // Spacing
  safeAreaPadding: number     // Extra padding for notched devices
  hudMargin: number           // HUD margin from edges
  buttonSpacing: number       // Space between touch buttons
  
  // Responsive breakpoints
  compactMode: boolean        // Use compact layout
  stackedLayout: boolean      // Stack HUD elements vertically
}

/**
 * Mobile game balance adjustments
 */
export interface MobileBalanceConfig {
  // Difficulty adjustments
  speedMultiplier: number     // Base speed adjustment
  obstacleGapMultiplier: number // Gap between obstacles
  hitboxTolerance: number     // Collision forgiveness (0-1)
  
  // Input timing
  inputBufferMs: number       // Input buffer window
  coyoteTimeMs: number        // Jump grace period
  
  // Camera
  cameraDistance: number      // Camera distance from player
  cameraHeight: number        // Camera height
  fov: number                 // Field of view
}

/**
 * Complete mobile configuration
 */
export interface MobileConfig {
  touch: TouchZoneConfig
  ui: UIScaleConfig
  balance: MobileBalanceConfig
  
  // Feature flags
  enableGyroscope: boolean
  enableVibration: boolean
  enableWakeLock: boolean
  enableFullscreen: boolean
  
  // Performance
  targetFPS: number
  maxDeltaTime: number
  throttleBackground: boolean
}

/**
 * Default touch zone configurations by device type
 */
const TOUCH_ZONES: Record<DeviceType, TouchZoneConfig> = {
  mobile: {
    // Portrait-optimized zones
    leftZone: { x: [0, 0.35], y: [0.3, 1] },
    rightZone: { x: [0.65, 1], y: [0.3, 1] },
    jumpZone: { x: [0.35, 0.65], y: [0.3, 0.65] },
    slideZone: { x: [0.35, 0.65], y: [0.65, 1] },
    pauseZone: { x: [0.85, 1], y: [0, 0.15] },
    
    swipeThreshold: 12,         // Ultra-responsive - minimal drag needed
    swipeVelocity: 0.12,        // Quick flicks register instantly
    tapTimeout: 150,            // Snappy tap detection
    doubleTapTimeout: 250,
    holdDuration: 400,
    
    showTouchIndicators: true,
    hapticFeedback: true,
    touchHighlightDuration: 100, // Faster visual feedback
  },
  
  tablet: {
    // Landscape-optimized zones
    leftZone: { x: [0, 0.25], y: [0.4, 1] },
    rightZone: { x: [0.75, 1], y: [0.4, 1] },
    jumpZone: { x: [0.25, 0.75], y: [0.4, 0.7] },
    slideZone: { x: [0.25, 0.75], y: [0.7, 1] },
    pauseZone: { x: [0.9, 1], y: [0, 0.1] },
    
    swipeThreshold: 50,
    swipeVelocity: 0.4,
    tapTimeout: 200,
    doubleTapTimeout: 300,
    holdDuration: 500,
    
    showTouchIndicators: false,
    hapticFeedback: true,
    touchHighlightDuration: 100,
  },
  
  desktop: {
    // Desktop doesn't use touch zones primarily
    leftZone: { x: [0, 0.33], y: [0, 1] },
    rightZone: { x: [0.67, 1], y: [0, 1] },
    jumpZone: { x: [0.33, 0.67], y: [0, 0.5] },
    slideZone: { x: [0.33, 0.67], y: [0.5, 1] },
    pauseZone: { x: [0.9, 1], y: [0, 0.1] },
    
    swipeThreshold: 50,
    swipeVelocity: 0.5,
    tapTimeout: 150,
    doubleTapTimeout: 250,
    holdDuration: 400,
    
    showTouchIndicators: false,
    hapticFeedback: false,
    touchHighlightDuration: 100,
  },
}

/**
 * UI scale configurations by device type
 */
const UI_SCALES: Record<DeviceType, UIScaleConfig> = {
  mobile: {
    hudScale: 1.2,
    buttonScale: 1.4,
    textScale: 1.1,
    iconScale: 1.3,
    safeAreaPadding: 20,
    hudMargin: 16,
    buttonSpacing: 12,
    compactMode: true,
    stackedLayout: true,
  },
  
  tablet: {
    hudScale: 1.0,
    buttonScale: 1.2,
    textScale: 1.0,
    iconScale: 1.1,
    safeAreaPadding: 16,
    hudMargin: 24,
    buttonSpacing: 16,
    compactMode: false,
    stackedLayout: false,
  },
  
  desktop: {
    hudScale: 1.0,
    buttonScale: 1.0,
    textScale: 1.0,
    iconScale: 1.0,
    safeAreaPadding: 0,
    hudMargin: 32,
    buttonSpacing: 20,
    compactMode: false,
    stackedLayout: false,
  },
}

/**
 * Mobile balance adjustments by device type
 */
const MOBILE_BALANCE: Record<DeviceType, MobileBalanceConfig> = {
  mobile: {
    speedMultiplier: 0.92,      // Slightly slower for touch (was 0.9)
    obstacleGapMultiplier: 1.1, // Slightly more space (was 1.15 - too easy)
    hitboxTolerance: 0.12,      // Slightly forgiving for touch controls
    inputBufferMs: 150,         // Tighter buffer - more responsive feel
    coyoteTimeMs: 150,          // Snappier edge jumps
    cameraDistance: 5.0,        // Pulled back slightly for better obstacle visibility
    cameraHeight: 5.5,          // Raised slightly for better view ahead
    fov: 68,                    // Slightly wider FOV for better peripheral vision
  },
  
  tablet: {
    speedMultiplier: 0.95,
    obstacleGapMultiplier: 1.1,
    hitboxTolerance: 0.1,
    inputBufferMs: 175,
    coyoteTimeMs: 125,
    cameraDistance: 5,
    cameraHeight: 5.5,
    fov: 68,
  },
  
  desktop: {
    speedMultiplier: 1.0,
    obstacleGapMultiplier: 1.0,
    hitboxTolerance: 0.05,
    inputBufferMs: 150,
    coyoteTimeMs: 100,
    cameraDistance: 6,
    cameraHeight: 6,
    fov: 70,
  },
}

/**
 * Generate mobile configuration from device capabilities
 */
export function generateMobileConfig(caps?: DeviceCapabilities): MobileConfig {
  const capabilities = caps || getDeviceCapabilities()
  const quality = getQualityProfile()
  const deviceType = capabilities.deviceType
  
  // Get base configurations
  const touchConfig = { ...TOUCH_ZONES[deviceType] }
  const uiConfig = { ...UI_SCALES[deviceType] }
  const balanceConfig = { ...MOBILE_BALANCE[deviceType] }
  
  // Apply portrait/landscape adjustments
  if (capabilities.isPortrait && deviceType === 'mobile') {
    // Adjust zones for portrait mode
    touchConfig.leftZone = { x: [0, 0.4], y: [0.5, 1] }
    touchConfig.rightZone = { x: [0.6, 1], y: [0.5, 1] }
    touchConfig.jumpZone = { x: [0.2, 0.8], y: [0.3, 0.5] }
    touchConfig.slideZone = { x: [0.2, 0.8], y: [0.7, 0.9] }
  }
  
  // Apply safe area insets
  if (capabilities.safeAreaInsets.bottom > 0) {
    uiConfig.safeAreaPadding = Math.max(
      uiConfig.safeAreaPadding,
      capabilities.safeAreaInsets.bottom
    )
  }
  
  // Apply pixel ratio scaling
  if (capabilities.pixelRatio > 2) {
    uiConfig.hudScale *= 0.9 // Slightly smaller on high-DPI
    uiConfig.buttonScale *= 0.95
  }
  
  // Apply screen size adjustments
  if (capabilities.screenWidth < BREAKPOINTS.xs) {
    uiConfig.compactMode = true
    uiConfig.hudScale *= 0.9
    // Keep camera close on tiny screens - don't pull back
  }
  
  // Determine target FPS based on device
  let targetFPS = 60
  if (quality.tier === 'low') {
    targetFPS = 30
  } else if (capabilities.isLowPowerMode) {
    targetFPS = 30
  }
  
  // Feature flags
  const enableGyroscope = capabilities.isMobile && 
    'DeviceOrientationEvent' in window
  const enableVibration = capabilities.isMobile && 
    'vibrate' in navigator &&
    !capabilities.prefersReducedMotion
  const enableWakeLock = 'wakeLock' in navigator
  const enableFullscreen = 'fullscreenEnabled' in document ||
    'webkitFullscreenEnabled' in document
  
  return {
    touch: touchConfig,
    ui: uiConfig,
    balance: balanceConfig,
    enableGyroscope,
    enableVibration,
    enableWakeLock,
    enableFullscreen,
    targetFPS,
    maxDeltaTime: 1 / 20, // Cap at 50ms (20 FPS minimum)
    throttleBackground: true,
  }
}

/**
 * Mobile configuration singleton
 */
class MobileConfigManager {
  private static instance: MobileConfigManager | null = null
  private config: MobileConfig
  private listeners: Set<(config: MobileConfig) => void> = new Set()

  private constructor() {
    this.config = generateMobileConfig()
  }

  static getInstance(): MobileConfigManager {
    if (!MobileConfigManager.instance) {
      MobileConfigManager.instance = new MobileConfigManager()
    }
    return MobileConfigManager.instance
  }

  getConfig(): MobileConfig {
    return this.config
  }

  refresh(): MobileConfig {
    this.config = generateMobileConfig()
    this.notifyListeners()
    return this.config
  }

  setOverrides(overrides: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...overrides }
    this.notifyListeners()
  }

  onChange(callback: (config: MobileConfig) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.config))
  }
}

// Export singleton accessors
export function getMobileConfig(): MobileConfig {
  return MobileConfigManager.getInstance().getConfig()
}

export function refreshMobileConfig(): MobileConfig {
  return MobileConfigManager.getInstance().refresh()
}

export function setMobileConfigOverrides(overrides: Partial<MobileConfig>): void {
  MobileConfigManager.getInstance().setOverrides(overrides)
}

export function onMobileConfigChange(
  callback: (config: MobileConfig) => void
): () => void {
  return MobileConfigManager.getInstance().onChange(callback)
}

/**
 * Utility: Get responsive value based on screen width
 */
export function getResponsiveValue<T>(
  values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; default: T }
): T {
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.xs && values.xs !== undefined) return values.xs
  if (width < BREAKPOINTS.sm && values.sm !== undefined) return values.sm
  if (width < BREAKPOINTS.md && values.md !== undefined) return values.md
  if (width < BREAKPOINTS.lg && values.lg !== undefined) return values.lg
  if (width >= BREAKPOINTS.lg && values.xl !== undefined) return values.xl
  
  return values.default
}

/**
 * Utility: Calculate touch zone from normalized coordinates
 */
export function getTouchZonePixels(
  zone: { x: [number, number]; y: [number, number] }
): { x: [number, number]; y: [number, number] } {
  const width = window.innerWidth
  const height = window.innerHeight
  
  return {
    x: [zone.x[0] * width, zone.x[1] * width],
    y: [zone.y[0] * height, zone.y[1] * height],
  }
}

/**
 * Utility: Check if point is within touch zone
 */
export function isInTouchZone(
  x: number,
  y: number,
  zone: { x: [number, number]; y: [number, number] }
): boolean {
  const pixels = getTouchZonePixels(zone)
  return x >= pixels.x[0] && x <= pixels.x[1] &&
         y >= pixels.y[0] && y <= pixels.y[1]
}
