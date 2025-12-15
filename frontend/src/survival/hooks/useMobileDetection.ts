/**
 * useMobileDetection - Reliable mobile device detection
 * Uses multiple methods: UA, touch support, screen size
 */

import { useMemo } from 'react'
import { useMobileOptimization } from './useMobileOptimization'

export interface MobileDetectionResult {
  isMobile: boolean
  isTouch: boolean
  enableTriviaBillboards: boolean
}

export function useMobileDetection(): MobileDetectionResult {
  const { isTouch, deviceCapabilities } = useMobileOptimization()
  
  const isMobile = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase()
    const uaIsMobile = /iphone|ipad|ipod|android|mobile|webos|blackberry|opera mini|iemobile/.test(ua)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth < 768
    return uaIsMobile || deviceCapabilities.isMobile || isTouch || (hasTouch && isSmallScreen)
  }, [deviceCapabilities.isMobile, isTouch])
  
  return {
    isMobile,
    isTouch,
    // Disable 3D trivia billboards on mobile - use 2D panel instead
    enableTriviaBillboards: !isMobile,
  }
}
