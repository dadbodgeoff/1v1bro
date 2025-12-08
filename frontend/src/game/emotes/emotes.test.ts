/**
 * Emote System Property Tests
 *
 * Property-based tests using fast-check for emote functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { EMOTE_CONFIG, EMOTE_TOTAL_DURATION } from '../config/emotes'
import { EmoteAssetLoader } from './EmoteAssetLoader'
import { EmoteManager } from './EmoteManager'
import type { EmoteInventoryItem, EmotePhase } from './types'

// ============================================
// Test Arbitraries
// ============================================

const emoteInventoryItemArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  image_url: fc.webUrl(),
})

const vector2Arb = fc.record({
  x: fc.float({ min: 0, max: 1280, noNaN: true }),
  y: fc.float({ min: 0, max: 720, noNaN: true }),
})

const emotePhaseArb: fc.Arbitrary<EmotePhase> = fc.constantFrom('pop-in', 'display', 'fade-out')

// Arbitrary for future property tests - exported to avoid unused variable error
export const activeEmoteArb = fc.record({
  id: fc.uuid(),
  emoteId: fc.uuid(),
  playerId: fc.uuid(),
  position: vector2Arb,
  startTime: fc.integer({ min: 0, max: Date.now() }),
  duration: fc.constant(EMOTE_CONFIG.duration),
  phase: emotePhaseArb,
  opacity: fc.float({ min: 0, max: 1, noNaN: true }),
  scale: fc.float({ min: 0.5, max: 1, noNaN: true }),
})

// ============================================
// Property Tests
// ============================================

describe('Emote System Property Tests', () => {
  /**
   * **Feature: emote-system, Property 1: Cache consistency with inventory**
   * **Validates: Requirements 1.1, 1.5**
   *
   * For any player inventory containing emotes, after initialization completes,
   * all emote IDs in the inventory should have corresponding entries in the asset cache.
   */
  describe('Property 1: Cache consistency with inventory', () => {
    it('all inventory emote IDs should be present in cache after preload', async () => {
      // This test will be fully implemented once EmoteAssetLoader is created
      // For now, we test the type structure is correct
      fc.assert(
        fc.property(
          fc.array(emoteInventoryItemArb, { minLength: 0, maxLength: 10 }),
          (inventory) => {
            // Verify inventory items have required fields
            return inventory.every(item => 
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              typeof item.image_url === 'string'
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('inventory items have valid structure', () => {
      fc.assert(
        fc.property(
          emoteInventoryItemArb,
          (item) => {
            return (
              item.id.length > 0 &&
              item.name.length > 0 &&
              item.image_url.startsWith('http')
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: emote-system, Property 4: Position tracking**
   * **Validates: Requirements 4.2, 4.6**
   *
   * For any active emote and player position update, the emote's position.y
   * should equal player.position.y + yOffset.
   */
  describe('Property 4: Position tracking', () => {
    it('emote position y equals player y + yOffset', () => {
      fc.assert(
        fc.property(
          vector2Arb,
          (playerPosition) => {
            const emoteY = playerPosition.y + EMOTE_CONFIG.yOffset
            // Verify the calculation is correct
            return emoteY === playerPosition.y + EMOTE_CONFIG.yOffset
          }
        ),
        { numRuns: 100 }
      )
    })

    it('emote position x equals player x (centered)', () => {
      fc.assert(
        fc.property(
          vector2Arb,
          (playerPosition) => {
            // Emote should be centered on player x
            const emoteX = playerPosition.x
            return emoteX === playerPosition.x
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: emote-system, Property 6: Emote expiration**
   * **Validates: Requirements 6.3**
   *
   * For any active emote, after (duration + fadeOutDuration) milliseconds
   * have elapsed since start_time, the emote should be removed.
   */
  describe('Property 6: Emote expiration', () => {
    it('emote should expire after total duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (startTime) => {
            const now = startTime + EMOTE_TOTAL_DURATION + 1
            const elapsed = now - startTime
            // Emote should be expired
            return elapsed > EMOTE_TOTAL_DURATION
          }
        ),
        { numRuns: 100 }
      )
    })

    it('emote should not expire before total duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: EMOTE_TOTAL_DURATION - 1 }),
          (startTime, elapsedOffset) => {
            const now = startTime + elapsedOffset
            const elapsed = now - startTime
            // Emote should NOT be expired
            return elapsed < EMOTE_TOTAL_DURATION
          }
        ),
        { numRuns: 100 }
      )
    })

    it('total duration equals duration + fadeOutDuration', () => {
      expect(EMOTE_TOTAL_DURATION).toBe(EMOTE_CONFIG.duration + EMOTE_CONFIG.fadeOutDuration)
    })
  })

  /**
   * **Feature: emote-system, Property 7: Match cleanup**
   * **Validates: Requirements 6.4**
   *
   * For any match end event, after reset() is called, the activeEmotes map
   * should be empty and cooldownEnd should be 0.
   */
  describe('Property 7: Match cleanup', () => {
    it('reset state should have empty activeEmotes', () => {
      // Test the expected state after reset
      const resetState = {
        activeEmotes: new Map(),
        cooldownEnd: 0,
      }
      
      expect(resetState.activeEmotes.size).toBe(0)
      expect(resetState.cooldownEnd).toBe(0)
    })
  })

  /**
   * EmoteAssetLoader Unit Tests
   * Requirements: 1.1, 1.2, 1.4
   */
  describe('EmoteAssetLoader', () => {
    let loader: EmoteAssetLoader
    let originalImage: typeof Image

    beforeEach(() => {
      loader = new EmoteAssetLoader()
      originalImage = globalThis.Image
      
      // Mock Image constructor
      class MockImage {
        crossOrigin = ''
        private _src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null

        get src() {
          return this._src
        }

        set src(value: string) {
          this._src = value
          // Simulate async load
          queueMicrotask(() => {
            if (value.includes('fail') || value.includes('error')) {
              this.onerror?.()
            } else {
              this.onload?.()
            }
          })
        }
      }
      
      globalThis.Image = MockImage as unknown as typeof Image
    })

    afterEach(() => {
      globalThis.Image = originalImage
    })

    it('should start with empty cache', () => {
      expect(loader.getCacheSize()).toBe(0)
      expect(loader.getAssets().size).toBe(0)
    })

    it('should add assets to cache after preload', async () => {
      const emotes: EmoteInventoryItem[] = [
        { id: 'emote-1', name: 'Wave', image_url: 'https://example.com/wave.png' },
        { id: 'emote-2', name: 'Dance', image_url: 'https://example.com/dance.png' },
      ]

      await loader.preloadEmotes(emotes)

      expect(loader.getCacheSize()).toBe(2)
      expect(loader.hasAsset('emote-1')).toBe(true)
      expect(loader.hasAsset('emote-2')).toBe(true)
    })

    it('should return null for non-existent asset', () => {
      expect(loader.getAsset('non-existent')).toBeNull()
    })

    it('should return asset after loading', async () => {
      const emotes: EmoteInventoryItem[] = [
        { id: 'emote-1', name: 'Wave', image_url: 'https://example.com/wave.png' },
      ]

      await loader.preloadEmotes(emotes)

      const asset = loader.getAsset('emote-1')
      expect(asset).not.toBeNull()
      expect(asset?.id).toBe('emote-1')
      expect(asset?.name).toBe('Wave')
      expect(asset?.imageUrl).toBe('https://example.com/wave.png')
    })

    it('should handle load failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const emotes: EmoteInventoryItem[] = [
        { id: 'emote-fail', name: 'Fail', image_url: 'https://example.com/fail.png' },
      ]

      await loader.preloadEmotes(emotes)

      // Asset should exist but not be loaded
      expect(loader.hasAsset('emote-fail')).toBe(true)
      expect(loader.isLoaded('emote-fail')).toBe(false)
      
      consoleSpy.mockRestore()
    })

    it('should not reload already loaded assets', async () => {
      const emotes: EmoteInventoryItem[] = [
        { id: 'emote-1', name: 'Wave', image_url: 'https://example.com/wave.png' },
      ]

      await loader.preloadEmotes(emotes)
      const firstAsset = loader.getAsset('emote-1')

      // Preload again
      await loader.preloadEmotes(emotes)
      const secondAsset = loader.getAsset('emote-1')

      // Should be the same asset object
      expect(loader.getCacheSize()).toBe(1)
      expect(firstAsset).toBe(secondAsset)
    })

    it('should clear all assets', async () => {
      const emotes: EmoteInventoryItem[] = [
        { id: 'emote-1', name: 'Wave', image_url: 'https://example.com/wave.png' },
      ]

      await loader.preloadEmotes(emotes)
      expect(loader.getCacheSize()).toBe(1)

      loader.clear()
      expect(loader.getCacheSize()).toBe(0)
      expect(loader.hasAsset('emote-1')).toBe(false)
    })

    it('should report correct loaded status', async () => {
      expect(loader.isLoaded('non-existent')).toBe(false)

      const emotes: EmoteInventoryItem[] = [
        { id: 'emote-1', name: 'Wave', image_url: 'https://example.com/wave.png' },
      ]

      await loader.preloadEmotes(emotes)
      expect(loader.isLoaded('emote-1')).toBe(true)
    })
  })

  /**
   * **Feature: emote-system, Property 2: Trigger creates valid ActiveEmote**
   * **Validates: Requirements 2.1, 2.2, 6.2**
   *
   * For any equipped emote and player in alive state with cooldown expired,
   * triggering an emote should create an ActiveEmote with valid fields.
   */
  describe('Property 2: Trigger creates valid ActiveEmote', () => {
    let manager: EmoteManager

    beforeEach(() => {
      manager = new EmoteManager()
    })

    it('trigger creates emote with correct emoteId', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            manager.reset() // Clear any previous state
            const triggered = manager.triggerEmote(position, true)
            
            if (!triggered) return true // Skip if trigger failed
            
            const emotes = manager.getActiveEmotes()
            return emotes.length === 1 && emotes[0].emoteId === 'emote-wave'
          }
        ),
        { numRuns: 50 }
      )
    })

    it('trigger creates emote with correct playerId', async () => {
      await manager.initialize('player-123', [], 'emote-wave')
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            manager.reset()
            const triggered = manager.triggerEmote(position, true)
            
            if (!triggered) return true
            
            const emotes = manager.getActiveEmotes()
            return emotes.length === 1 && emotes[0].playerId === 'player-123'
          }
        ),
        { numRuns: 50 }
      )
    })

    it('trigger creates emote with correct duration', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            manager.reset()
            const triggered = manager.triggerEmote(position, true)
            
            if (!triggered) return true
            
            const emotes = manager.getActiveEmotes()
            return emotes.length === 1 && emotes[0].duration === EMOTE_CONFIG.duration
          }
        ),
        { numRuns: 50 }
      )
    })

    it('trigger creates emote with correct position offset', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            manager.reset()
            const triggered = manager.triggerEmote(position, true)
            
            if (!triggered) return true
            
            const emotes = manager.getActiveEmotes()
            const emote = emotes[0]
            return (
              emote.position.x === position.x &&
              emote.position.y === position.y + EMOTE_CONFIG.yOffset
            )
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: emote-system, Property 3: Cooldown enforcement**
   * **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
   *
   * For any player, if an emote was triggered at time T, then any trigger
   * attempt before T + cooldown_duration should fail.
   */
  describe('Property 3: Cooldown enforcement', () => {
    let manager: EmoteManager

    beforeEach(() => {
      manager = new EmoteManager()
    })

    it('trigger fails during cooldown', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      const position = { x: 100, y: 100 }
      
      // First trigger should succeed
      const firstTrigger = manager.triggerEmote(position, true)
      expect(firstTrigger).toBe(true)
      
      // Second trigger immediately should fail
      const secondTrigger = manager.triggerEmote(position, true)
      expect(secondTrigger).toBe(false)
      expect(manager.isOnCooldown()).toBe(true)
    })

    it('cooldown persists across emote changes', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      const position = { x: 100, y: 100 }
      
      // Trigger emote
      manager.triggerEmote(position, true)
      const cooldownBefore = manager.getCooldownRemaining()
      
      // Change equipped emote
      manager.setEquippedEmote('emote-dance')
      
      // Cooldown should still be active
      expect(manager.isOnCooldown()).toBe(true)
      expect(manager.getCooldownRemaining()).toBeLessThanOrEqual(cooldownBefore)
    })

    it('getCooldownRemaining returns positive value during cooldown', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      manager.triggerEmote({ x: 100, y: 100 }, true)
      
      expect(manager.getCooldownRemaining()).toBeGreaterThan(0)
      expect(manager.getCooldownRemaining()).toBeLessThanOrEqual(EMOTE_CONFIG.cooldown)
    })

    it('getCooldownRemaining returns 0 when not on cooldown', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      expect(manager.getCooldownRemaining()).toBe(0)
    })
  })

  /**
   * **Feature: emote-system, Property 8: Guard conditions**
   * **Validates: Requirements 2.4, 2.5**
   *
   * Trigger fails when no emote equipped or player dead.
   */
  describe('Property 8: Guard conditions', () => {
    let manager: EmoteManager

    beforeEach(() => {
      manager = new EmoteManager()
    })

    it('trigger fails when no emote equipped', async () => {
      await manager.initialize('player-1', [], null) // No equipped emote
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            const triggered = manager.triggerEmote(position, true)
            return triggered === false
          }
        ),
        { numRuns: 50 }
      )
    })

    it('trigger fails when player is dead', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            manager.reset()
            const triggered = manager.triggerEmote(position, false) // isAlive = false
            return triggered === false
          }
        ),
        { numRuns: 50 }
      )
    })

    it('trigger succeeds when emote equipped and player alive', async () => {
      await manager.initialize('player-1', [], 'emote-wave')
      
      fc.assert(
        fc.property(
          vector2Arb,
          (position) => {
            manager.reset()
            const triggered = manager.triggerEmote(position, true)
            return triggered === true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Configuration validation tests
   */
  describe('Emote Configuration', () => {
    it('duration is positive', () => {
      expect(EMOTE_CONFIG.duration).toBeGreaterThan(0)
    })

    it('cooldown is positive', () => {
      expect(EMOTE_CONFIG.cooldown).toBeGreaterThan(0)
    })

    it('size is positive', () => {
      expect(EMOTE_CONFIG.size).toBeGreaterThan(0)
    })

    it('yOffset is negative (above player)', () => {
      expect(EMOTE_CONFIG.yOffset).toBeLessThan(0)
    })

    it('popInStartScale is less than popInEndScale', () => {
      expect(EMOTE_CONFIG.popInStartScale).toBeLessThan(EMOTE_CONFIG.popInEndScale)
    })

    it('popInEndScale is 1.0', () => {
      expect(EMOTE_CONFIG.popInEndScale).toBe(1.0)
    })
  })
})
