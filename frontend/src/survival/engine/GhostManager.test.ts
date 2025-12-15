/**
 * GhostManager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GhostManager } from './GhostManager'

// Mock survivalApi
vi.mock('../services/SurvivalApiService', () => ({
  survivalApi: {
    getPersonalBest: vi.fn(),
  },
}))

describe('GhostManager', () => {
  let ghostManager: GhostManager
  let mockGhostReplay: {
    load: ReturnType<typeof vi.fn>
    start: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    isActive: ReturnType<typeof vi.fn>
    getDuration: ReturnType<typeof vi.fn>
    reset: ReturnType<typeof vi.fn>
  }
  let mockGhostRenderer: {
    initialize: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    hide: ReturnType<typeof vi.fn>
    reset: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockGhostReplay = {
      load: vi.fn(),
      start: vi.fn(),
      update: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0, state: 'run' }),
      isActive: vi.fn().mockReturnValue(false),
      getDuration: vi.fn().mockReturnValue(0),
      reset: vi.fn(),
    }

    mockGhostRenderer = {
      initialize: vi.fn(),
      update: vi.fn(),
      hide: vi.fn(),
      reset: vi.fn(),
      dispose: vi.fn(),
    }

    ghostManager = new GhostManager({
      ghostReplay: mockGhostReplay as never,
      ghostRenderer: mockGhostRenderer as never,
    })
  })

  describe('loadGhost', () => {
    it('should load ghost data into replay system', () => {
      const ghostData = 'serialized-ghost-data'
      ghostManager.loadGhost(ghostData)
      expect(mockGhostReplay.load).toHaveBeenCalledWith(ghostData)
    })
  })

  describe('startGhost', () => {
    it('should start ghost replay when duration > 0', () => {
      mockGhostReplay.getDuration.mockReturnValue(5000)
      ghostManager.startGhost()
      expect(mockGhostReplay.start).toHaveBeenCalled()
    })

    it('should not start ghost replay when duration is 0', () => {
      mockGhostReplay.getDuration.mockReturnValue(0)
      ghostManager.startGhost()
      expect(mockGhostReplay.start).not.toHaveBeenCalled()
    })
  })

  describe('getGhostState', () => {
    it('should return ghost state for given time', () => {
      const expectedState = { x: 1, y: 2, z: 3, state: 'jump' }
      mockGhostReplay.update.mockReturnValue(expectedState)
      
      const result = ghostManager.getGhostState(1000)
      
      expect(mockGhostReplay.update).toHaveBeenCalledWith(1000)
      expect(result).toEqual(expectedState)
    })
  })

  describe('isGhostActive', () => {
    it('should return true when ghost is active', () => {
      mockGhostReplay.isActive.mockReturnValue(true)
      expect(ghostManager.isGhostActive()).toBe(true)
    })

    it('should return false when ghost is not active', () => {
      mockGhostReplay.isActive.mockReturnValue(false)
      expect(ghostManager.isGhostActive()).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset both replay and renderer', () => {
      ghostManager.reset()
      expect(mockGhostReplay.reset).toHaveBeenCalled()
      expect(mockGhostRenderer.reset).toHaveBeenCalled()
    })
  })

  describe('updateRenderer', () => {
    it('should update renderer when running and ghost is active', () => {
      mockGhostReplay.isActive.mockReturnValue(true)
      const ghostState = { x: 1, y: 2, z: -100, state: 'run' }
      mockGhostReplay.update.mockReturnValue(ghostState)
      
      ghostManager.updateRenderer(1000, -50, true)
      
      expect(mockGhostReplay.update).toHaveBeenCalledWith(1000)
      expect(mockGhostRenderer.update).toHaveBeenCalledWith(ghostState, -50)
    })

    it('should hide renderer when not running', () => {
      ghostManager.updateRenderer(1000, -50, false)
      expect(mockGhostRenderer.hide).toHaveBeenCalled()
    })

    it('should not update renderer when ghost is not active', () => {
      mockGhostReplay.isActive.mockReturnValue(false)
      ghostManager.updateRenderer(1000, -50, true)
      expect(mockGhostRenderer.update).not.toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should dispose ghost renderer', () => {
      ghostManager.dispose()
      expect(mockGhostRenderer.dispose).toHaveBeenCalled()
    })
  })
})
