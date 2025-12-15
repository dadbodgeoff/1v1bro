/**
 * Mobile Configuration Tests
 * Verifies mobile-specific settings and responsive behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getMobileConfig,
  refreshMobileConfig,
  getResponsiveValue,
  getTouchZonePixels,
  isInTouchZone,
} from './mobile'
import { BREAKPOINTS } from './device'

describe('Mobile Configuration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getMobileConfig', () => {
    it('should return a valid mobile config object', () => {
      const config = getMobileConfig()
      
      expect(config).toBeDefined()
      expect(config.touch).toBeDefined()
      expect(config.ui).toBeDefined()
      expect(config.balance).toBeDefined()
    })

    it('should have touch zone configuration', () => {
      const config = getMobileConfig()
      
      expect(config.touch.leftZone).toBeDefined()
      expect(config.touch.rightZone).toBeDefined()
      expect(config.touch.jumpZone).toBeDefined()
      expect(config.touch.slideZone).toBeDefined()
      expect(config.touch.pauseZone).toBeDefined()
    })

    it('should have gesture settings', () => {
      const config = getMobileConfig()
      
      expect(config.touch.swipeThreshold).toBeGreaterThan(0)
      expect(config.touch.swipeVelocity).toBeGreaterThan(0)
      expect(config.touch.tapTimeout).toBeGreaterThan(0)
      expect(config.touch.doubleTapTimeout).toBeGreaterThan(0)
      expect(config.touch.holdDuration).toBeGreaterThan(0)
    })

    it('should have UI scaling configuration', () => {
      const config = getMobileConfig()
      
      expect(config.ui.hudScale).toBeGreaterThan(0)
      expect(config.ui.buttonScale).toBeGreaterThan(0)
      expect(config.ui.textScale).toBeGreaterThan(0)
      expect(typeof config.ui.compactMode).toBe('boolean')
    })

    it('should have game balance adjustments', () => {
      const config = getMobileConfig()
      
      expect(config.balance.speedMultiplier).toBeGreaterThan(0)
      expect(config.balance.speedMultiplier).toBeLessThanOrEqual(1)
      expect(config.balance.obstacleGapMultiplier).toBeGreaterThanOrEqual(1)
      expect(config.balance.hitboxTolerance).toBeGreaterThanOrEqual(0)
      expect(config.balance.inputBufferMs).toBeGreaterThan(0)
      expect(config.balance.coyoteTimeMs).toBeGreaterThan(0)
    })

    it('should have feature flags', () => {
      const config = getMobileConfig()
      
      expect(typeof config.enableGyroscope).toBe('boolean')
      expect(typeof config.enableVibration).toBe('boolean')
      expect(typeof config.enableWakeLock).toBe('boolean')
      expect(typeof config.enableFullscreen).toBe('boolean')
    })

    it('should have performance settings', () => {
      const config = getMobileConfig()
      
      expect(config.targetFPS).toBeGreaterThan(0)
      expect(config.maxDeltaTime).toBeGreaterThan(0)
      expect(typeof config.throttleBackground).toBe('boolean')
    })
  })

  describe('refreshMobileConfig', () => {
    it('should return updated config', () => {
      const config1 = getMobileConfig()
      const config2 = refreshMobileConfig()
      
      expect(config2).toBeDefined()
      expect(config2.touch).toBeDefined()
    })
  })

  describe('getResponsiveValue', () => {
    it('should return default value when no breakpoint matches', () => {
      const result = getResponsiveValue({
        default: 'default-value',
      })
      
      expect(result).toBe('default-value')
    })

    it('should return correct type for different value types', () => {
      const numberResult = getResponsiveValue({
        default: 100,
        sm: 50,
      })
      expect(typeof numberResult).toBe('number')

      const boolResult = getResponsiveValue({
        default: true,
        sm: false,
      })
      expect(typeof boolResult).toBe('boolean')
    })
  })

  describe('getTouchZonePixels', () => {
    it('should convert normalized coordinates to pixels', () => {
      const zone = { x: [0, 0.5] as [number, number], y: [0, 0.5] as [number, number] }
      const pixels = getTouchZonePixels(zone)
      
      expect(pixels.x[0]).toBe(0)
      expect(pixels.x[1]).toBe(window.innerWidth * 0.5)
      expect(pixels.y[0]).toBe(0)
      expect(pixels.y[1]).toBe(window.innerHeight * 0.5)
    })

    it('should handle full screen zone', () => {
      const zone = { x: [0, 1] as [number, number], y: [0, 1] as [number, number] }
      const pixels = getTouchZonePixels(zone)
      
      expect(pixels.x[1]).toBe(window.innerWidth)
      expect(pixels.y[1]).toBe(window.innerHeight)
    })
  })

  describe('isInTouchZone', () => {
    it('should return true for point inside zone', () => {
      const zone = { x: [0, 0.5] as [number, number], y: [0, 0.5] as [number, number] }
      const x = window.innerWidth * 0.25
      const y = window.innerHeight * 0.25
      
      expect(isInTouchZone(x, y, zone)).toBe(true)
    })

    it('should return false for point outside zone', () => {
      const zone = { x: [0, 0.5] as [number, number], y: [0, 0.5] as [number, number] }
      const x = window.innerWidth * 0.75
      const y = window.innerHeight * 0.75
      
      expect(isInTouchZone(x, y, zone)).toBe(false)
    })

    it('should return true for point on zone boundary', () => {
      const zone = { x: [0, 0.5] as [number, number], y: [0, 0.5] as [number, number] }
      const x = window.innerWidth * 0.5
      const y = window.innerHeight * 0.5
      
      expect(isInTouchZone(x, y, zone)).toBe(true)
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
  })
})

describe('Mobile Balance Adjustments', () => {
  it('should have more forgiving settings for mobile', () => {
    const config = getMobileConfig()
    
    // Mobile should have longer input buffer
    expect(config.balance.inputBufferMs).toBeGreaterThanOrEqual(150)
    
    // Mobile should have longer coyote time
    expect(config.balance.coyoteTimeMs).toBeGreaterThanOrEqual(100)
  })
})
