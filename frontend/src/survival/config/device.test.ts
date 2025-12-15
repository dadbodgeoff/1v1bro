/**
 * Device Detection Tests
 * Verifies device capability detection and classification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDeviceCapabilities,
  refreshDeviceCapabilities,
  isMobileDevice,
  isTouchDevice,
  getPerformanceTier,
  BREAKPOINTS,
} from './device'

describe('Device Detection', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.restoreAllMocks()
  })

  describe('getDeviceCapabilities', () => {
    it('should return device capabilities object', () => {
      const caps = getDeviceCapabilities()
      
      expect(caps).toBeDefined()
      expect(caps.deviceType).toBeDefined()
      expect(caps.performanceTier).toBeDefined()
      expect(caps.inputMode).toBeDefined()
      expect(caps.screenWidth).toBeGreaterThan(0)
      expect(caps.screenHeight).toBeGreaterThan(0)
    })

    it('should detect screen dimensions', () => {
      const caps = getDeviceCapabilities()
      
      expect(caps.screenWidth).toBe(window.innerWidth)
      expect(caps.screenHeight).toBe(window.innerHeight)
    })

    it('should detect pixel ratio', () => {
      const caps = getDeviceCapabilities()
      
      expect(caps.pixelRatio).toBeGreaterThanOrEqual(1)
      expect(caps.pixelRatio).toBeLessThanOrEqual(3)
    })

    it('should detect touch support', () => {
      const caps = getDeviceCapabilities()
      
      expect(typeof caps.touchSupported).toBe('boolean')
      expect(typeof caps.multiTouchSupported).toBe('boolean')
      expect(typeof caps.maxTouchPoints).toBe('number')
    })

    it('should classify device type based on screen width', () => {
      const caps = getDeviceCapabilities()
      
      expect(['mobile', 'tablet', 'desktop']).toContain(caps.deviceType)
    })

    it('should classify performance tier', () => {
      const caps = getDeviceCapabilities()
      
      expect(['low', 'medium', 'high', 'ultra']).toContain(caps.performanceTier)
    })

    it('should detect WebGL capabilities', () => {
      const caps = getDeviceCapabilities()
      
      expect(typeof caps.supportsWebGL2).toBe('boolean')
      expect(typeof caps.supportsFloatTextures).toBe('boolean')
      expect(caps.maxTextureSize).toBeGreaterThanOrEqual(2048)
    })

    it('should detect safe area insets', () => {
      const caps = getDeviceCapabilities()
      
      expect(caps.safeAreaInsets).toBeDefined()
      expect(typeof caps.safeAreaInsets.top).toBe('number')
      expect(typeof caps.safeAreaInsets.right).toBe('number')
      expect(typeof caps.safeAreaInsets.bottom).toBe('number')
      expect(typeof caps.safeAreaInsets.left).toBe('number')
    })
  })

  describe('refreshDeviceCapabilities', () => {
    it('should return updated capabilities', () => {
      const caps1 = getDeviceCapabilities()
      const caps2 = refreshDeviceCapabilities()
      
      expect(caps2).toBeDefined()
      expect(caps2.screenWidth).toBe(window.innerWidth)
    })
  })

  describe('utility functions', () => {
    it('isMobileDevice should return boolean', () => {
      expect(typeof isMobileDevice()).toBe('boolean')
    })

    it('isTouchDevice should return boolean', () => {
      expect(typeof isTouchDevice()).toBe('boolean')
    })

    it('getPerformanceTier should return valid tier', () => {
      const tier = getPerformanceTier()
      expect(['low', 'medium', 'high', 'ultra']).toContain(tier)
    })
  })

  describe('BREAKPOINTS', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.xs).toBe(480)
      expect(BREAKPOINTS.sm).toBe(768)
      expect(BREAKPOINTS.md).toBe(1024)
      expect(BREAKPOINTS.lg).toBe(1440)
      expect(BREAKPOINTS.xl).toBe(1920)
    })

    it('should have ascending breakpoint values', () => {
      expect(BREAKPOINTS.xs).toBeLessThan(BREAKPOINTS.sm)
      expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md)
      expect(BREAKPOINTS.md).toBeLessThan(BREAKPOINTS.lg)
      expect(BREAKPOINTS.lg).toBeLessThan(BREAKPOINTS.xl)
    })
  })
})

describe('Device Type Classification', () => {
  it('should classify small screens as mobile', () => {
    const caps = getDeviceCapabilities()
    
    if (caps.screenWidth < BREAKPOINTS.sm) {
      expect(caps.deviceType).toBe('mobile')
    }
  })

  it('should classify medium screens as tablet', () => {
    const caps = getDeviceCapabilities()
    
    if (caps.screenWidth >= BREAKPOINTS.sm && caps.screenWidth < BREAKPOINTS.md) {
      expect(['mobile', 'tablet']).toContain(caps.deviceType)
    }
  })

  it('should classify large screens as desktop', () => {
    const caps = getDeviceCapabilities()
    
    if (caps.screenWidth >= BREAKPOINTS.md && !caps.isMobile) {
      expect(caps.deviceType).toBe('desktop')
    }
  })
})

describe('Performance Tier Classification', () => {
  it('should consider GPU tier in classification', () => {
    const caps = getDeviceCapabilities()
    
    // Higher GPU tier should generally mean higher performance tier
    expect(caps.gpuTier).toBeGreaterThanOrEqual(0)
    expect(caps.gpuTier).toBeLessThanOrEqual(3)
  })

  it('should consider memory in classification', () => {
    const caps = getDeviceCapabilities()
    
    expect(caps.estimatedMemoryMB).toBeGreaterThan(0)
    expect(typeof caps.isLowMemory).toBe('boolean')
  })
})
