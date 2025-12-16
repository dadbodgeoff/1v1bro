/**
 * Tests for GameEventBus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameEventBus, getEventBus, resetEventBus } from './GameEventBus'

describe('GameEventBus', () => {
  let eventBus: GameEventBus

  beforeEach(() => {
    eventBus = new GameEventBus()
  })

  describe('on/emit', () => {
    it('should call subscriber when event is emitted', () => {
      const callback = vi.fn()
      eventBus.on('player:nearMiss', callback)

      eventBus.emit('player:nearMiss', {
        distance: 0.3,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: false,
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        distance: 0.3,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: false,
      })
    })

    it('should support multiple subscribers for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('combo:milestone', callback1)
      eventBus.on('combo:milestone', callback2)

      eventBus.emit('combo:milestone', {
        milestone: 5,
        combo: 5,
        multiplier: 1.5,
      })

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should not call subscriber for different events', () => {
      const callback = vi.fn()
      eventBus.on('game:start', callback)

      eventBus.emit('game:pause', {})

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    it('should stop receiving events after unsubscribe', () => {
      const callback = vi.fn()
      const unsubscribe = eventBus.on('game:over', callback)

      eventBus.emit('game:over', { score: 100, distance: 500 })
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      eventBus.emit('game:over', { score: 200, distance: 1000 })
      expect(callback).toHaveBeenCalledTimes(1) // Still 1, not called again
    })
  })

  describe('once', () => {
    it('should only call subscriber once', () => {
      const callback = vi.fn()
      eventBus.once('milestone:reached', callback)

      eventBus.emit('milestone:reached', { distance: 500, isMajor: false })
      eventBus.emit('milestone:reached', { distance: 1000, isMajor: true })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({ distance: 500, isMajor: false })
    })
  })

  describe('off', () => {
    it('should remove all listeners for an event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('score:add', callback1)
      eventBus.on('score:add', callback2)

      eventBus.off('score:add')

      eventBus.emit('score:add', { points: 100, source: 'nearMiss' })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('should remove all listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('game:start', callback1)
      eventBus.on('game:over', callback2)

      eventBus.clear()

      eventBus.emit('game:start', {})
      eventBus.emit('game:over', { score: 100, distance: 500 })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should continue calling other subscribers if one throws', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalCallback = vi.fn()

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      eventBus.on('player:jump', errorCallback)
      eventBus.on('player:jump', normalCallback)

      eventBus.emit('player:jump', { position: { x: 0, y: 2, z: -5 } })

      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('getListenerCount', () => {
    it('should return count for specific event', () => {
      eventBus.on('game:start', () => {})
      eventBus.on('game:start', () => {})
      eventBus.on('game:pause', () => {})

      expect(eventBus.getListenerCount('game:start')).toBe(2)
      expect(eventBus.getListenerCount('game:pause')).toBe(1)
      expect(eventBus.getListenerCount('game:over')).toBe(0)
    })

    it('should return total count when no event specified', () => {
      eventBus.on('game:start', () => {})
      eventBus.on('game:pause', () => {})
      eventBus.on('game:over', () => {})

      expect(eventBus.getListenerCount()).toBe(3)
    })
  })

  describe('getRegisteredEvents', () => {
    it('should return list of events with listeners', () => {
      eventBus.on('game:start', () => {})
      eventBus.on('combo:milestone', () => {})

      const events = eventBus.getRegisteredEvents()

      expect(events).toContain('game:start')
      expect(events).toContain('combo:milestone')
      expect(events).not.toContain('game:over')
    })
  })
})

describe('Global event bus', () => {
  beforeEach(() => {
    resetEventBus()
  })

  it('should return same instance', () => {
    const bus1 = getEventBus()
    const bus2 = getEventBus()

    expect(bus1).toBe(bus2)
  })

  it('should reset properly', () => {
    const bus1 = getEventBus()
    bus1.on('game:start', () => {})

    resetEventBus()

    const bus2 = getEventBus()
    expect(bus2).not.toBe(bus1)
    expect(bus2.getListenerCount()).toBe(0)
  })
})
