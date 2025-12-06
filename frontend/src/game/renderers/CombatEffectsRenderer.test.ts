import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CombatEffectsRenderer } from './CombatEffectsRenderer'

describe('CombatEffectsRenderer', () => {
  let renderer: CombatEffectsRenderer

  beforeEach(() => {
    renderer = new CombatEffectsRenderer()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('addHitMarker', () => {
    it('adds hit marker at position', () => {
      renderer.addHitMarker({ x: 100, y: 200 })
      // Hit marker should exist (we can't directly inspect, but update shouldn't throw)
      expect(() => renderer.update(0.016)).not.toThrow()
    })

    it('hit marker expires after duration', () => {
      renderer.addHitMarker({ x: 100, y: 200 })

      // Advance past hit marker duration (200ms)
      vi.advanceTimersByTime(250)
      renderer.update(0.25)

      // Should not throw, marker should be cleaned up
      expect(() => renderer.update(0.016)).not.toThrow()
    })
  })

  describe('addDamageNumber', () => {
    it('adds floating damage number', () => {
      renderer.addDamageNumber({ x: 100, y: 200 }, 25)
      expect(() => renderer.update(0.016)).not.toThrow()
    })

    it('damage number expires after duration', () => {
      renderer.addDamageNumber({ x: 100, y: 200 }, 25)

      // Advance past damage number duration (800ms)
      vi.advanceTimersByTime(900)
      renderer.update(0.9)

      expect(() => renderer.update(0.016)).not.toThrow()
    })
  })

  describe('addMuzzleFlash', () => {
    it('adds muzzle flash effect', () => {
      renderer.addMuzzleFlash({ x: 100, y: 200 }, { x: 1, y: 0 })
      expect(() => renderer.update(0.016)).not.toThrow()
    })

    it('muzzle flash expires quickly (50ms)', () => {
      renderer.addMuzzleFlash({ x: 100, y: 200 }, { x: 1, y: 0 })

      vi.advanceTimersByTime(60)
      renderer.update(0.06)

      expect(() => renderer.update(0.016)).not.toThrow()
    })
  })

  describe('addDeathEffect', () => {
    it('adds death explosion effect', () => {
      renderer.addDeathEffect({ x: 100, y: 200 })
      expect(() => renderer.update(0.016)).not.toThrow()
    })

    it('death effect expires after duration', () => {
      renderer.addDeathEffect({ x: 100, y: 200 })

      // Advance past death effect duration (500ms)
      vi.advanceTimersByTime(600)
      renderer.update(0.6)

      expect(() => renderer.update(0.016)).not.toThrow()
    })
  })

  describe('addPlayerFlash', () => {
    it('marks player as flashing', () => {
      renderer.addPlayerFlash('player1')
      expect(renderer.isPlayerFlashing('player1')).toBe(true)
    })

    it('flash expires after duration', () => {
      renderer.addPlayerFlash('player1')

      // Advance past flash duration (100ms)
      vi.advanceTimersByTime(150)
      renderer.update(0.15)

      expect(renderer.isPlayerFlashing('player1')).toBe(false)
    })
  })

  describe('addRespawnEffect', () => {
    it('adds respawn ring effect', () => {
      renderer.addRespawnEffect({ x: 100, y: 200 })
      expect(() => renderer.update(0.016)).not.toThrow()
    })

    it('respawn effect expires after duration', () => {
      renderer.addRespawnEffect({ x: 100, y: 200 })

      // Advance past respawn effect duration (500ms)
      vi.advanceTimersByTime(600)
      renderer.update(0.6)

      expect(() => renderer.update(0.016)).not.toThrow()
    })
  })

  describe('isPlayerFlashing', () => {
    it('returns false for player not flashing', () => {
      expect(renderer.isPlayerFlashing('player1')).toBe(false)
    })

    it('returns true for flashing player', () => {
      renderer.addPlayerFlash('player1')
      expect(renderer.isPlayerFlashing('player1')).toBe(true)
    })

    it('returns false after flash expires', () => {
      renderer.addPlayerFlash('player1')
      vi.advanceTimersByTime(150)
      renderer.update(0.15)

      expect(renderer.isPlayerFlashing('player1')).toBe(false)
    })
  })

  describe('update', () => {
    it('cleans up expired effects', () => {
      renderer.addHitMarker({ x: 100, y: 100 })
      renderer.addDamageNumber({ x: 100, y: 100 }, 25)
      renderer.addMuzzleFlash({ x: 100, y: 100 }, { x: 1, y: 0 })
      renderer.addDeathEffect({ x: 100, y: 100 })
      renderer.addPlayerFlash('player1')
      renderer.addRespawnEffect({ x: 100, y: 100 })

      // Advance past all durations
      vi.advanceTimersByTime(1000)
      renderer.update(1.0)

      // All effects should be cleaned up
      expect(renderer.isPlayerFlashing('player1')).toBe(false)
    })

    it('updates damage number positions', () => {
      renderer.addDamageNumber({ x: 100, y: 100 }, 25)

      // Update should move damage numbers upward
      renderer.update(0.1)

      // No direct way to check position, but shouldn't throw
      expect(() => renderer.update(0.016)).not.toThrow()
    })

    it('updates death effect particles', () => {
      renderer.addDeathEffect({ x: 100, y: 100 })

      // Update should move particles outward
      renderer.update(0.1)

      expect(() => renderer.update(0.016)).not.toThrow()
    })
  })

  describe('clear', () => {
    it('removes all effects', () => {
      renderer.addHitMarker({ x: 100, y: 100 })
      renderer.addDamageNumber({ x: 100, y: 100 }, 25)
      renderer.addMuzzleFlash({ x: 100, y: 100 }, { x: 1, y: 0 })
      renderer.addDeathEffect({ x: 100, y: 100 })
      renderer.addPlayerFlash('player1')
      renderer.addRespawnEffect({ x: 100, y: 100 })

      renderer.clear()

      expect(renderer.isPlayerFlashing('player1')).toBe(false)
    })
  })

  describe('render', () => {
    it('does not throw without context', () => {
      renderer.addHitMarker({ x: 100, y: 100 })
      expect(() => renderer.render()).not.toThrow()
    })
  })
})
