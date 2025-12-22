/**
 * Arena Mobile Configuration
 * Ported from survival runner with arena-specific adaptations
 * 
 * Features:
 * - Touch control configuration for arena combat
 * - Responsive UI scaling
 * - Mobile-specific game balance (aim assist, hitbox tolerance)
 * - Battery-aware optimizations
 */

import type { DeviceCapabilities, DeviceType } from './device'
import { getDeviceCapabilities, BREAKPOINTS } from './device'
import { getArenaQualityProfile } from './quality'

/**
 * Touch control zone configuration for arena
 */
export interface TouchZoneConfig {
  // Zone boundaries (0-1 normalized)
  moveZone: { x: [number, number]; y: [number, number] }      // Virtual joystick area
  aimZone: { x: [number, number]; y: [number, number] }       // Look/aim area
  fireZone: { x: [number, number]; y: [number, number] }      // Fire button
  reloadZone: { x: [number, number]; y: [number, number] }    // Reload button
  weaponSwitchZone: { x: [number, number]; y: [number, number] } // Weapon switch
  pauseZone: { x: [number, number]; y: [number, number] }     // Pause button
  
  // Gesture settings
  swipeThreshold: number
  swipeVelocity: number
  tapTimeout: number
  doubleTapTimeout: number
  holdDuration: number
  
  // Virtual joystick settings
  joystickDeadzone: number    // Inner deadzone (0-1)
  joystickMaxRadius: number   // Max drag radius in pixels
  
  // Visual feedback
  showTouchIndicators: boolean
  hapticFeedback: boolean
  touchHighlightDuration: number
}

/**
 * UI scaling configuration
 */
export interface UIScaleConfig {
  hudScale: number
  buttonScale: number
  textScale: number
  iconScale: number
  safeAreaPadding: number
  hudMargin: number
  buttonSpacing: number
  compactMode: boolean
  stackedLayout: boolean
  // Arena-specific
  crosshairScale: number
  healthBarScale: number
  ammoDisplayScale: number
}

/**
 * Mobile game balance adjustments for arena
 */
export interface MobileBalanceConfig {
  // Aim assist (mobile needs more help)
  aimAssistStrength: number     // 0-1, how much aim snaps to targets
  aimAssistRadius: number       // Pixels, detection radius
  aimSlowdownNearTarget: number // 0-1, sensitivity reduction near targets
  
  // Input timing
  inputBufferMs: number
  
  // Hitbox adjustments
  hitboxTolerance: number       // Extra forgiveness on hit detection
  
  // Sensitivity
  lookSensitivity: number       // Base look sensitivity
  aimSensitivity: number        // ADS sensitivity multiplier
  
  // Camera
  fov: number
}

/**
 * Complete mobile configuration
 */
export interface MobileConfig {
  touch: TouchZoneConfig
  ui: UIScaleConfig
  balance: MobileBalanceConfig
  
  // Feature flags
  enableGyroscope: boolean      // Gyro aiming
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
    // Left side: movement joystick
    moveZone: { x: [0, 0.4], y: [0.4, 1] },
    // Right side: aim/look
    aimZone: { x: [0.4, 1], y: [0.2, 0.8] },
    // Bottom right: fire button
    fireZone: { x: [0.75, 0.95], y: [0.7, 0.95] },
    // Above fire: reload
    reloadZone: { x: [0.75, 0.95], y: [0.5, 0.7] },
    // Left of fire: weapon switch
    weaponSwitchZone: { x: [0.55, 0.75], y: [0.7, 0.95] },
    // Top right: pause
    pauseZone: { x: [0.85, 1], y: [0, 0.15] },
    
    swipeThreshold: 15,
    swipeVelocity: 0.15,
    tapTimeout: 180,
    doubleTapTimeout: 250,
    holdDuration: 400,
    
    joystickDeadzone: 0.15,
    joystickMaxRadius: 60,
    
    showTouchIndicators: true,
    hapticFeedback: true,
    touchHighlightDuration: 100,
  },
  
  tablet: {
    moveZone: { x: [0, 0.35], y: [0.5, 1] },
    aimZone: { x: [0.35, 1], y: [0.2, 0.8] },
    fireZone: { x: [0.8, 0.95], y: [0.65, 0.9] },
    reloadZone: { x: [0.8, 0.95], y: [0.45, 0.65] },
    weaponSwitchZone: { x: [0.6, 0.8], y: [0.65, 0.9] },
    pauseZone: { x: [0.9, 1], y: [0, 0.1] },
    
    swipeThreshold: 30,
    swipeVelocity: 0.3,
    tapTimeout: 200,
    doubleTapTimeout: 300,
    holdDuration: 500,
    
    joystickDeadzone: 0.12,
    joystickMaxRadius: 80,
    
    showTouchIndicators: false,
    hapticFeedback: true,
    touchHighlightDuration: 100,
  },
  
  desktop: {
    moveZone: { x: [0, 0.33], y: [0, 1] },
    aimZone: { x: [0.33, 1], y: [0, 1] },
    fireZone: { x: [0.8, 1], y: [0.7, 1] },
    reloadZone: { x: [0.8, 1], y: [0.5, 0.7] },
    weaponSwitchZone: { x: [0.6, 0.8], y: [0.7, 1] },
    pauseZone: { x: [0.9, 1], y: [0, 0.1] },
    
    swipeThreshold: 50,
    swipeVelocity: 0.5,
    tapTimeout: 150,
    doubleTapTimeout: 250,
    holdDuration: 400,
    
    joystickDeadzone: 0.1,
    joystickMaxRadius: 100,
    
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
    buttonScale: 1.5,
    textScale: 1.1,
    iconScale: 1.3,
    safeAreaPadding: 20,
    hudMargin: 12,
    buttonSpacing: 10,
    compactMode: true,
    stackedLayout: true,
    crosshairScale: 1.3,
    healthBarScale: 1.2,
    ammoDisplayScale: 1.2,
  },
  
  tablet: {
    hudScale: 1.0,
    buttonScale: 1.2,
    textScale: 1.0,
    iconScale: 1.1,
    safeAreaPadding: 16,
    hudMargin: 20,
    buttonSpacing: 14,
    compactMode: false,
    stackedLayout: false,
    crosshairScale: 1.1,
    healthBarScale: 1.0,
    ammoDisplayScale: 1.0,
  },
  
  desktop: {
    hudScale: 1.0,
    buttonScale: 1.0,
    textScale: 1.0,
    iconScale: 1.0,
    safeAreaPadding: 0,
    hudMargin: 24,
    buttonSpacing: 16,
    compactMode: false,
    stackedLayout: false,
    crosshairScale: 1.0,
    healthBarScale: 1.0,
    ammoDisplayScale: 1.0,
  },
}

/**
 * Mobile balance adjustments by device type
 */
const MOBILE_BALANCE: Record<DeviceType, MobileBalanceConfig> = {
  mobile: {
    aimAssistStrength: 0.6,       // Strong aim assist for touch
    aimAssistRadius: 80,          // Large detection radius
    aimSlowdownNearTarget: 0.5,   // Significant slowdown near targets
    inputBufferMs: 180,           // Forgiving input buffer
    hitboxTolerance: 0.15,        // 15% larger hitboxes
    lookSensitivity: 2.5,
    aimSensitivity: 0.6,
    fov: 75,
  },
  
  tablet: {
    aimAssistStrength: 0.4,
    aimAssistRadius: 60,
    aimSlowdownNearTarget: 0.35,
    inputBufferMs: 160,
    hitboxTolerance: 0.1,
    lookSensitivity: 3.0,
    aimSensitivity: 0.7,
    fov: 78,
  },
  
  desktop: {
    aimAssistStrength: 0.0,       // No aim assist on desktop
    aimAssistRadius: 0,
    aimSlowdownNearTarget: 0.0,
    inputBufferMs: 100,
    hitboxTolerance: 0.0,
    lookSensitivity: 4.0,
    aimSensitivity: 0.8,
    fov: 80,
  },
}

/**
 * Generate mobile configuration from device capabilities
 */
export function generateMobileConfig(caps?: DeviceCapabilities): MobileConfig {
  const capabilities = caps || getDeviceCapabilities()
  const quality = getArenaQualityProfile()
  const deviceType = capabilities.deviceType
  
  const touchConfig = { ...TOUCH_ZONES[deviceType] }
  const uiConfig = { ...UI_SCALES[deviceType] }
  const balanceConfig = { ...MOBILE_BALANCE[deviceType] }
  
  // Apply safe area insets
  if (capabilities.safeAreaInsets.bottom > 0) {
    uiConfig.safeAreaPadding = Math.max(uiConfig.safeAreaPadding, capabilities.safeAreaInsets.bottom)
  }
  
  // Apply pixel ratio scaling
  if (capabilities.pixelRatio > 2) {
    uiConfig.hudScale *= 0.9
    uiConfig.buttonScale *= 0.95
  }
  
  // Apply screen size adjustments
  if (capabilities.screenWidth < BREAKPOINTS.xs) {
    uiConfig.compactMode = true
    uiConfig.hudScale *= 0.9
  }
  
  // Determine target FPS
  let targetFPS = 60
  if (quality.tier === 'low') targetFPS = 30
  else if (capabilities.isLowPowerMode) targetFPS = 30
  
  // Feature flags
  const enableGyroscope = capabilities.isMobile && 'DeviceOrientationEvent' in window
  const enableVibration = capabilities.isMobile && 'vibrate' in navigator && !capabilities.prefersReducedMotion
  const enableWakeLock = 'wakeLock' in navigator
  const enableFullscreen = 'fullscreenEnabled' in document || 'webkitFullscreenEnabled' in document
  
  return {
    touch: touchConfig,
    ui: uiConfig,
    balance: balanceConfig,
    enableGyroscope,
    enableVibration,
    enableWakeLock,
    enableFullscreen,
    targetFPS,
    maxDeltaTime: 1 / 20,
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

  getConfig(): MobileConfig { return this.config }

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

export function onMobileConfigChange(callback: (config: MobileConfig) => void): () => void {
  return MobileConfigManager.getInstance().onChange(callback)
}

/**
 * Utility: Get responsive value based on screen width
 */
export function getResponsiveValue<T>(values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; default: T }): T {
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
export function getTouchZonePixels(zone: { x: [number, number]; y: [number, number] }): { x: [number, number]; y: [number, number] } {
  const width = window.innerWidth
  const height = window.innerHeight
  return { x: [zone.x[0] * width, zone.x[1] * width], y: [zone.y[0] * height, zone.y[1] * height] }
}

/**
 * Utility: Check if point is within touch zone
 */
export function isInTouchZone(x: number, y: number, zone: { x: [number, number]; y: [number, number] }): boolean {
  const pixels = getTouchZonePixels(zone)
  return x >= pixels.x[0] && x <= pixels.x[1] && y >= pixels.y[0] && y <= pixels.y[1]
}
