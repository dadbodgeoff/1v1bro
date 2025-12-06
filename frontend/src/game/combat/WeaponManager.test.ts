import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { WeaponManager } from './WeaponManager'
import { FIRE_COOLDOWN_MS } from '../config'

describe('WeaponManager', () => {
  let manager: WeaponManager

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 0, 1, 0, 0, 0))
    manager = new WeaponManager()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('canFire', () => {
    it('returns true initially (no cooldown)', () => {
      expect(manager.canFire()).toBe(true)
    })

    it('returns false immediately after firing', () => {
      manager.recordFire()
      expect(manager.canFire()).toBe(false)
    })

    it('returns true after cooldown elapsed', () => {
      manager.recordFire()
      expect(manager.canFire()).toBe(false)

      vi.advanceTimersByTime(FIRE_COOLDOWN_MS + 1)
      expect(manager.canFire()).toBe(true)
    })

    it('returns false during cooldown', () => {
      manager.recordFire()
      vi.advanceTimersByTime(FIRE_COOLDOWN_MS - 10)
      expect(manager.canFire()).toBe(false)
    })
  })

  describe('recordFire', () => {
    it('starts cooldown timer', () => {
      expect(manager.canFire()).toBe(true)
      manager.recordFire()
      expect(manager.canFire()).toBe(false)
    })

    it('resets cooldown on subsequent fires', () => {
      manager.recordFire()
      vi.advanceTimersByTime(FIRE_COOLDOWN_MS + 1)
      expect(manager.canFire()).toBe(true)

      manager.recordFire()
      expect(manager.canFire()).toBe(false)
    })
  })

  describe('getCooldownProgress', () => {
    it('returns 1 when ready to fire', () => {
      expect(manager.getCooldownProgress()).toBe(1)
    })

    it('returns 0 immediately after firing', () => {
      manager.recordFire()
      expect(manager.getCooldownProgress()).toBe(0)
    })

    it('returns 0.5 at half cooldown', () => {
      manager.recordFire()
      vi.advanceTimersByTime(FIRE_COOLDOWN_MS / 2)
      expect(manager.getCooldownProgress()).toBeCloseTo(0.5, 1)
    })

    it('returns 1 after full cooldown', () => {
      manager.recordFire()
      vi.advanceTimersByTime(FIRE_COOLDOWN_MS + 1)
      expect(manager.getCooldownProgress()).toBe(1)
    })
  })

  describe('getCooldownRemaining', () => {
    it('returns 0 when ready to fire', () => {
      expect(manager.getCooldownRemaining()).toBe(0)
    })

    it('returns full cooldown immediately after firing', () => {
      manager.recordFire()
      expect(manager.getCooldownRemaining()).toBe(FIRE_COOLDOWN_MS)
    })

    it('returns remaining time during cooldown', () => {
      manager.recordFire()
      vi.advanceTimersByTime(100)
      expect(manager.getCooldownRemaining()).toBe(FIRE_COOLDOWN_MS - 100)
    })
  })

  describe('applySpread', () => {
    it('returns a normalized direction vector', () => {
      const direction = { x: 1, y: 0 }
      const result = manager.applySpread(direction)

      // Result should be approximately unit length
      const length = Math.sqrt(result.x * result.x + result.y * result.y)
      expect(length).toBeCloseTo(1, 5)
    })

    it('applies small random deviation', () => {
      const direction = { x: 1, y: 0 }
      const results = Array.from({ length: 100 }, () => manager.applySpread(direction))

      // All results should be close to original direction (within spread angle)
      results.forEach((result) => {
        expect(result.x).toBeGreaterThan(0.99) // ~2 degree spread
        expect(Math.abs(result.y)).toBeLessThan(0.05)
      })
    })
  })

  describe('reset', () => {
    it('clears cooldown state', () => {
      manager.recordFire()
      expect(manager.canFire()).toBe(false)

      manager.reset()
      expect(manager.canFire()).toBe(true)
    })
  })
})
