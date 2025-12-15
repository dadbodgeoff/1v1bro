/**
 * useMobileOptimization - React hook for mobile-specific features
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
} from '../config/device'
import {
  getQualityProfile,
  setQualityTier,
  onQualityChange,
  setAutoQualityAdjust,
  type QualityProfile,
} from '../config/quality'
import type { PerformanceTier } from '../config/device'
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
  // Device info
  deviceCapabilities: DeviceCapabilities
  isMobile: boolean
  isTablet: boolean
  isTouch: boolean
  isPortrait: boolean
  
  // Quality
  qualityProfile: QualityProfile
  qualityTier: PerformanceTier
  
  // Mobile config
  mobileConfig: MobileConfig
  
  // Viewport
  viewportState: ViewportState
  isFullscreen: boolean
  hasWakeLock: boolean
  
  // Status
  isReady: boolean
}

export interface MobileOptimizationActions {
  // Quality control
  setQuality: (tier: PerformanceTier) => void
  enableAutoQuality: (enabled: boolean) => void
  
  // Fullscreen
  requestFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<boolean>
  toggleFullscreen: () => Promise<boolean>
  
  // Wake lock
  requestWakeLock: () => Promise<boolean>
  releaseWakeLock: () => Promise<void>
  
  // Orientation
  lockOrientation: (orientation?: 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary') => Promise<boolean>
  unlockOrientation: () => void
  
  // Refresh
  refresh: () => void
}

export function useMobileOptimization(): MobileOptimizationState & MobileOptimizationActions {
  // State
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>(
    getDeviceCapabilities()
  )
  const [qualityProfile, setQualityProfile] = useState<QualityProfile>(
    getQualityProfile()
  )
  const [mobileConfig, setMobileConfig] = useState<MobileConfig>(
    getMobileConfig()
  )
  const [viewportState, setViewportState] = useState<ViewportState>(
    getViewportManager().getState()
  )
  const [hasWakeLock, setHasWakeLock] = useState(false)
  const [isReady, setIsReady] = useState(false)
  
  // Refs for cleanup
  const unsubscribeRefs = useRef<(() => void)[]>([])

  // Initialize and subscribe to changes
  useEffect(() => {
    // Subscribe to device capability changes
    const unsubDevice = onDeviceCapabilitiesChange((caps) => {
      setDeviceCapabilities(caps)
    })
    unsubscribeRefs.current.push(unsubDevice)
    
    // Subscribe to quality changes
    const unsubQuality = onQualityChange((profile) => {
      setQualityProfile(profile)
    })
    unsubscribeRefs.current.push(unsubQuality)
    
    // Subscribe to mobile config changes
    const unsubMobile = onMobileConfigChange((config) => {
      setMobileConfig(config)
    })
    unsubscribeRefs.current.push(unsubMobile)
    
    // Setup viewport callbacks
    const viewportManager = getViewportManager()
    viewportManager.setCallbacks({
      onResize: (state) => setViewportState(state),
      onOrientationChange: () => setViewportState(viewportManager.getState()),
      onFullscreenChange: () => setViewportState(viewportManager.getState()),
    })
    
    setIsReady(true)
    
    // Cleanup
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub())
      unsubscribeRefs.current = []
    }
  }, [])

  // Derived state
  const isMobile = deviceCapabilities.deviceType === 'mobile'
  const isTablet = deviceCapabilities.deviceType === 'tablet'
  const isTouch = deviceCapabilities.touchSupported
  const isPortrait = deviceCapabilities.isPortrait
  const isFullscreen = viewportState.isFullscreen

  // Actions
  const setQuality = useCallback((tier: PerformanceTier) => {
    setQualityTier(tier)
  }, [])

  const enableAutoQuality = useCallback((enabled: boolean) => {
    setAutoQualityAdjust(enabled)
  }, [])

  const requestFullscreen = useCallback(async () => {
    const viewportManager = getViewportManager()
    return viewportManager.requestFullscreen()
  }, [])

  const exitFullscreen = useCallback(async () => {
    const viewportManager = getViewportManager()
    return viewportManager.exitFullscreen()
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const viewportManager = getViewportManager()
    return viewportManager.toggleFullscreen()
  }, [])

  const requestWakeLock = useCallback(async () => {
    const viewportManager = getViewportManager()
    const success = await viewportManager.requestWakeLock()
    setHasWakeLock(success)
    return success
  }, [])

  const releaseWakeLock = useCallback(async () => {
    const viewportManager = getViewportManager()
    await viewportManager.releaseWakeLock()
    setHasWakeLock(false)
  }, [])

  const lockOrientation = useCallback(async (orientation: 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' = 'landscape') => {
    const viewportManager = getViewportManager()
    // Filter to only supported orientations
    const supportedOrientation = (['landscape', 'portrait', 'landscape-primary', 'landscape-secondary', 'portrait-primary', 'portrait-secondary'].includes(orientation) 
      ? orientation 
      : 'landscape') as 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'portrait-primary' | 'portrait-secondary'
    return viewportManager.lockOrientation(supportedOrientation)
  }, [])

  const unlockOrientation = useCallback(() => {
    const viewportManager = getViewportManager()
    viewportManager.unlockOrientation()
  }, [])

  const refresh = useCallback(() => {
    setDeviceCapabilities(getDeviceCapabilities())
    setQualityProfile(getQualityProfile())
    setMobileConfig(getMobileConfig())
    setViewportState(getViewportManager().getState())
  }, [])

  return {
    // State
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
    
    // Actions
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
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  default: T
}): T {
  const { deviceCapabilities } = useMobileOptimization()
  
  switch (deviceCapabilities.deviceType) {
    case 'mobile':
      return values.mobile ?? values.default
    case 'tablet':
      return values.tablet ?? values.default
    case 'desktop':
      return values.desktop ?? values.default
    default:
      return values.default
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
    // Renderer features
    antialias: qualityProfile.renderer.antialias,
    shadows: qualityProfile.renderer.shadows,
    postProcessing: qualityProfile.renderer.postProcessing,
    
    // Particle features
    particlesEnabled: qualityProfile.particles.enabled,
    dustEnabled: qualityProfile.particles.dustEnabled,
    trailsEnabled: qualityProfile.particles.trailsEnabled,
    
    // Animation features
    cameraShake: qualityProfile.animation.cameraShake,
    dynamicFOV: qualityProfile.animation.dynamicFOV,
    speedLines: qualityProfile.animation.speedLines,
    
    // Space features
    nebulaEnabled: qualityProfile.space.nebulaEnabled,
    shootingStarsEnabled: qualityProfile.space.shootingStarsEnabled,
    celestialCount: qualityProfile.space.celestialCount,
    
    // Audio features
    spatialAudio: qualityProfile.audio.spatialAudio,
  }
}
