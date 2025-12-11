/**
 * Property-Based Tests for InstantPlayManager
 * 
 * Tests initialization timing bounds and configuration consistency.
 * 
 * @module game/guest/__tests__/InstantPlayManager.properties
 */

import fc from 'fast-check'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InstantPlayManager } from '../InstantPlayManager'

// Reset singleton between tests
beforeEach(() => {
  InstantPlayManager.resetInstance()
  vi.clearAllMocks()
})

/**
 * **Feature: guest-experience-enhancement, Property 1: Game initialization timing bound**
 * 
 * For any instant play initialization, the time from trigger to playable state
 * SHALL be less than 3000ms when assets are preloaded.
 * 
 * **Validates: Requirements 1.1**
 */
describe('Property 1: Game initialization timing bound', () => {
  it('preload completes in reasonable time', async () => {
    const manager = InstantPlayManager.getInstance()
    
    const startTime = performance.now()
    await manager.preloadAssets()
    const endTime = performance.now()
    
    // Preload should complete quickly (assets may not exist in test env)
    expect(endTime - startTime).toBeLessThan(3000)
    expect(manager.isReady()).toBe(true)
  })

  it('initialization timing is tracked correctly', () => {
    const manager = InstantPlayManager.getInstance()
    
    manager.markInitStart()
    // Simulate some work
    const start = performance.now()
    while (performance.now() - start < 10) {
      // Busy wait for ~10ms
    }
    manager.markInitEnd()
    
    const initTime = manager.getInitTimeMs()
    expect(initTime).toBeGreaterThanOrEqual(0)
    expect(initTime).toBeLessThan(3000)
  })

  it('getInitTimeMs returns -1 before initialization', () => {
    const manager = InstantPlayManager.getInstance()
    expect(manager.getInitTimeMs()).toBe(-1)
  })


  it('multiple preload calls return same promise', async () => {
    const manager = InstantPlayManager.getInstance()
    
    const promise1 = manager.preloadAssets()
    const promise2 = manager.preloadAssets()
    
    // Should be the same promise (idempotent)
    await Promise.all([promise1, promise2])
    expect(manager.isReady()).toBe(true)
  })

  it('isReady returns false before preload', () => {
    const manager = InstantPlayManager.getInstance()
    expect(manager.isReady()).toBe(false)
  })

  it('isReady returns true after preload', async () => {
    const manager = InstantPlayManager.getInstance()
    await manager.preloadAssets()
    expect(manager.isReady()).toBe(true)
  })
})

describe('InstantPlayManager configuration', () => {
  it('default config has sensible values', () => {
    const manager = InstantPlayManager.getInstance()
    const config = manager.getConfig()
    
    expect(config.defaultCategory).toBeTruthy()
    expect(config.defaultMap).toBeTruthy()
    expect(typeof config.tutorialEnabled).toBe('boolean')
    expect(typeof config.preloadAssets).toBe('boolean')
  })

  it('custom config overrides defaults', () => {
    fc.assert(
      fc.property(
        fc.record({
          defaultCategory: fc.constantFrom('fortnite', 'nfl', 'sports'),
          tutorialEnabled: fc.boolean(),
        }),
        (customConfig) => {
          InstantPlayManager.resetInstance()
          const manager = InstantPlayManager.getInstance()
          manager.initialize(customConfig)
          
          const config = manager.getConfig()
          expect(config.defaultCategory).toBe(customConfig.defaultCategory)
          expect(config.tutorialEnabled).toBe(customConfig.tutorialEnabled)
        }
      ),
      { numRuns: 20 }
    )
  })

  it('getDefaultCategory returns configured category', () => {
    const manager = InstantPlayManager.getInstance()
    const config = manager.getConfig()
    expect(manager.getDefaultCategory()).toBe(config.defaultCategory)
  })

  it('getDefaultMap returns configured map', () => {
    const manager = InstantPlayManager.getInstance()
    const config = manager.getConfig()
    expect(manager.getDefaultMap()).toBe(config.defaultMap)
  })

  it('disableTutorial updates config', () => {
    const manager = InstantPlayManager.getInstance()
    manager.initialize({ tutorialEnabled: true })
    
    expect(manager.shouldShowTutorial()).toBe(true)
    manager.disableTutorial()
    expect(manager.shouldShowTutorial()).toBe(false)
  })
})

describe('InstantPlayManager subscription', () => {
  it('subscriber is notified when ready', async () => {
    const manager = InstantPlayManager.getInstance()
    const callback = vi.fn()
    
    manager.subscribe(callback)
    await manager.preloadAssets()
    
    expect(callback).toHaveBeenCalledWith(true)
  })

  it('subscriber is immediately notified if already ready', async () => {
    const manager = InstantPlayManager.getInstance()
    await manager.preloadAssets()
    
    const callback = vi.fn()
    manager.subscribe(callback)
    
    expect(callback).toHaveBeenCalledWith(true)
  })

  it('unsubscribe prevents further notifications', async () => {
    InstantPlayManager.resetInstance()
    const manager = InstantPlayManager.getInstance()
    const callback = vi.fn()
    
    const unsubscribe = manager.subscribe(callback)
    unsubscribe()
    
    await manager.preloadAssets()
    
    // Should not be called after unsubscribe
    expect(callback).not.toHaveBeenCalled()
  })
})
