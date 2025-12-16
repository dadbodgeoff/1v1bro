/**
 * useMobileDetection - Reliable mobile device detection
 * Uses multiple methods: UA, touch support, screen size
 * Also detects PWA/standalone mode and iOS Safari for layout adjustments
 */

import { useMemo } from 'react'
import { useMobileOptimization } from './useMobileOptimization'

export interface MobileDetectionResult {
  isMobile: boolean
  isTouch: boolean
  enableTriviaBillboards: boolean
  /** True when running as installed PWA (no browser chrome) */
  isPWA: boolean
  /** True when running in iOS Safari (has bottom nav bar eating viewport) */
  isIOSSafari: boolean
  /** True when running in any mobile browser (not PWA) */
  isMobileBrowser: boolean
}

export function useMobileDetection(): MobileDetectionResult {
  const { isTouch, deviceCapabilities } = useMobileOptimization()
  
  const detection = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase()
    const uaIsMobile = /iphone|ipad|ipod|android|mobile|webos|blackberry|opera mini|iemobile/.test(ua)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth < 768
    const isMobile = uaIsMobile || deviceCapabilities.isMobile || isTouch || (hasTouch && isSmallScreen)
    
    // PWA detection - standalone mode means no browser chrome
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as { standalone?: boolean }).standalone === true
    
    // iOS Safari detection (not Chrome/Firefox on iOS, specifically Safari)
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua)
    const isIOSSafari = isIOS && isSafari && !isPWA
    
    // Any mobile browser (not PWA) - needs extra space for browser UI
    const isMobileBrowser = isMobile && !isPWA
    
    return { isMobile, isPWA, isIOSSafari, isMobileBrowser }
  }, [deviceCapabilities.isMobile, isTouch])
  
  return {
    ...detection,
    isTouch,
    // Disable 3D trivia billboards on mobile - use 2D panel instead
    enableTriviaBillboards: !detection.isMobile,
  }
}
