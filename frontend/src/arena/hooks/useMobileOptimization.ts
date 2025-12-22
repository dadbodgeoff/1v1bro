/**
 * useMobileOptimization - React hook for arena mobile features
 * Ported from survival runner
 * 
 * Features:
 * - Device capability detection
 * - Quality profile management
 * - Viewport state tracking
 * - Touch control configuration
 * - Fullscreen/wake lock management
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getDeviceCapabilities,
  onDeviceCapabilitiesChange,
  type DeviceCapabilities,
  type PerformanceTier,
} from '../config/device'
import {
  getArenaQualityProfile,
  setArenaQualityTier,
  onArenaQualityChange,
  setArenaAutoQualityAdjust,
  type ArenaQualityProfile,
} from '../config/quality'
import {
  getMobileConfig,
  onMobileConfigChange,
  type MobileConfig,
} from '../config/mobile'
import {
  getViewportManager,
  type ViewportState,
} from '../core/ViewportManager'

export interface MobileOptimizationState {
  deviceCapabilities: DeviceCapabilities
  isMobile: boolean
  isTablet: boolean
  isTouch: boolean
  isPortrait: boolean
  qualityProfile: ArenaQualityProfile
  qualityTier: PerformanceTier
  mobileConfig: MobileConfig
  viewportState: ViewportState
  isFullscreen: boolean
  hasWakeLock: boolean
  isReady: boolean
}

export interface MobileOptimizationActions {
  setQuality: (tier: PerformanceTier) => void
  enableAutoQuality: (enabled: boolean) => void
  requestFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<boolean>
  toggleFullscreen: () => Promise<boolean>
  requestWakeLock: () => Promise<boolean>
  releaseWakeLock: () => Promise<void>
  lockOrientation: (orientation?: 'landscape' | 'portrait') => Promise<boolean>
  unlockOrientation: () => void
  refresh: () => void
}

export function useMobileOptimization(): MobileOptimizationState & MobileOptimizationActions {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>(getDeviceCapabilities())
  const [qualityProfile, setQualityProfile] = useState<ArenaQualityProfile>(getArenaQualityProfile())
  const [mobileConfig, setMobileConfig] = useState<MobileConfig>(getMobileConfig())
  const [viewportState, setViewportState] = useState<ViewportState>(getViewportManager().getState())
  const [hasWakeLock, setHasWakeLock] = useState(false)
  const [isReady, setIsReady] = useState(false)
  
  const unsubscribeRefs = useRef<(() => void)[]>([])

  useEffect(() => {
    const unsubDevice = onDeviceCapabilitiesChange(setDeviceCapabilities)
    unsubscribeRefs.current.push(unsubDevice)
    
    const unsubQuality = onArenaQualityChange(setQualityProfile)
    unsubscribeRefs.current.push(unsubQuality)
    
    const unsubMobile = onMobileConfigChange(setMobileConfig)
    unsubscribeRefs.current.push(unsubMobile)
    
    const viewportManager = getViewportManager()
    viewportManager.setCallbacks({
      onResize: (state) => setViewportState(state),
      onOrientationChange: () => setViewportState(viewportManager.getState()),
      onFullscreenChange: () => setViewportState(viewportManager.getState()),
    })
    
    setIsReady(true)
    
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub())
      unsubscribeRefs.current = []
    }
  }, [])

  const isMobile = deviceCapabilities.deviceType === 'mobile'
  const isTablet = deviceCapabilities.deviceType === 'tablet'
  const isTouch = deviceCapabilities.touchSupported
  const isPortrait = deviceCapabilities.isPortrait
  const isFullscreen = viewportState.isFullscreen

  const setQuality = useCallback((tier: PerformanceTier) => {
    setArenaQualityTier(tier)
  }, [])

  const enableAutoQuality = useCallback((enabled: boolean) => {
    setArenaAutoQualityAdjust(enabled)
  }, [])

  const requestFullscreen = useCallback(async () => {
    return getViewportManager().requestFullscreen()
  }, [])

  const exitFullscreen = useCallback(async () => {
    return getViewportManager().exitFullscreen()
  }, [])

  const toggleFullscreen = useCallback(async () => {
    return getViewportManager().toggleFullscreen()
  }, [])

  const requestWakeLock = useCallback(async () => {
    const success = await getViewportManager().requestWakeLock()
    setHasWakeLock(success)
    return success
  }, [])

  const releaseWakeLock = useCallback(async () => {
    await getViewportManager().releaseWakeLock()
    setHasWakeLock(false)
  }, [])

  const lockOrientation = useCallback(async (orientation: 'landscape' | 'portrait' = 'landscape') => {
    return getViewportManager().lockOrientation(orientation)
  }, [])

  const unlockOrientation = useCallback(() => {
    getViewportManager().unlockOrientation()
  }, [])

  const refresh = useCallback(() => {
    setDeviceCapabilities(getDeviceCapabilities())
    setQualityProfile(getArenaQualityProfile())
    setMobileConfig(getMobileConfig())
    setViewportState(getViewportManager().getState())
  }, [])

  return {
    deviceCapabilities,
    isMobile,
    isTablet,
    isTouch,
    isPortrait,
    qualityProfile,
    qualityTier: qualityProfile.tier,
    mobileConfig,
    viewportState,
    isFullscreen,
    hasWakeLock,
    isReady,
    setQuality,
    enableAutoQuality,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
    requestWakeLock,
    releaseWakeLock,
    lockOrientation,
    unlockOrientation,
    refresh,
  }
}

/**
 * Hook for responsive values based on device type
 */
export function useResponsiveValue<T>(values: { mobile?: T; tablet?: T; desktop?: T; default: T }): T {
  const { deviceCapabilities } = useMobileOptimization()
  
  switch (deviceCapabilities.deviceType) {
    case 'mobile': return values.mobile ?? values.default
    case 'tablet': return values.tablet ?? values.default
    case 'desktop': return values.desktop ?? values.default
    default: return values.default
  }
}

/**
 * Hook for touch-specific behavior
 */
export function useTouchBehavior() {
  const { isTouch, mobileConfig } = useMobileOptimization()
  
  return {
    isTouch,
    showTouchIndicators: isTouch && mobileConfig.touch.showTouchIndicators,
    hapticEnabled: isTouch && mobileConfig.enableVibration,
    touchZones: mobileConfig.touch,
  }
}

/**
 * Hook for quality-aware feature flags
 */
export function useQualityFeatures() {
  const { qualityProfile } = useMobileOptimization()
  
  return {
    antialias: qualityProfile.renderer.antialias,
    shadows: qualityProfile.renderer.shadows,
    postProcessing: qualityProfile.renderer.postProcessing,
    particlesEnabled: qualityProfile.effects.particlesEnabled,
    bulletTrails: qualityProfile.effects.bulletTrails,
    impactEffects: qualityProfile.effects.impactEffects,
    bloomEnabled: qualityProfile.effects.bloomEnabled,
    maxParticles: qualityProfile.effects.maxParticles,
  }
}

/**
 * Hook for arena-specific mobile balance settings
 */
export function useArenaMobileBalance() {
  const { mobileConfig, isMobile, isTablet } = useMobileOptimization()
  
  return {
    aimAssistStrength: mobileConfig.balance.aimAssistStrength,
    aimAssistRadius: mobileConfig.balance.aimAssistRadius,
    aimSlowdownNearTarget: mobileConfig.balance.aimSlowdownNearTarget,
    hitboxTolerance: mobileConfig.balance.hitboxTolerance,
    lookSensitivity: mobileConfig.balance.lookSensitivity,
    aimSensitivity: mobileConfig.balance.aimSensitivity,
    inputBufferMs: mobileConfig.balance.inputBufferMs,
    needsAimAssist: isMobile || isTablet,
  }
}
