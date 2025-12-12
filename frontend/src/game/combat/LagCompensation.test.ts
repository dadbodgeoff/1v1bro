import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { LagCompensation } from './LagCompensation'

describe('LagCompensation', () => {
  let lagComp: LagCompensation

  beforeEach(() => {
    lagComp = new LagCompensation()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('recordPosition', () => {
    it('records position snapshots', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      
      const history = lagComp.getHistory('player1')
      expect(history.length).toBe(1)
      expect(history[0].position).toEqual({ x: 100, y: 200 })
    })

    it('records multiple positions over time', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      vi.advanceTimersByTime(50)
      lagComp.recordPosition('player1', { x: 150, y: 200 })
      vi.advanceTimersByTime(50)
      lagComp.recordPosition('player1', { x: 200, y: 200 })

      const history = lagComp.getHistory('player1')
      expect(history.length).toBe(3)
    })

    it('records velocity when provided', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 }, { x: 50, y: 0 })
      
      const history = lagComp.getHistory('player1')
      expect(history[0].velocity).toEqual({ x: 50, y: 0 })
    })

    it('handles multiple entities', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      lagComp.recordPosition('player2', { x: 500, y: 300 })

      expect(lagComp.getHistory('player1').length).toBe(1)
      expect(lagComp.getHistory('player2').length).toBe(1)
    })
  })

  describe('getPositionAtTime', () => {
    it('returns null for unknown entity', () => {
      const pos = lagComp.getPositionAtTime('unknown', Date.now())
      expect(pos).toBeNull()
    })

    it('returns null with insufficient history', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      const pos = lagComp.getPositionAtTime('player1', Date.now())
      expect(pos).toBeNull() // Need at least 2 snapshots
    })

    it('interpolates between two snapshots', () => {
      const startTime = Date.now()
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      
      vi.advanceTimersByTime(100)
      lagComp.recordPosition('player1', { x: 200, y: 200 })

      // Get position at midpoint
      const midTime = startTime + 50
      const pos = lagComp.getPositionAtTime('player1', midTime)
      
      expect(pos).not.toBeNull()
      expect(pos!.x).toBeCloseTo(150, 0)
      expect(pos!.y).toBeCloseTo(200, 0)
    })

    it('returns earliest position for timestamps before history', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      vi.advanceTimersByTime(100)
      lagComp.recordPosition('player1', { x: 200, y: 200 })

      // Request position from before first snapshot
      const pos = lagComp.getPositionAtTime('player1', Date.now() - 1000)
      
      expect(pos).not.toBeNull()
      expect(pos!.x).toBe(100)
    })

    it('extrapolates for timestamps after history', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 }, { x: 100, y: 0 })
      vi.advanceTimersByTime(50)
      lagComp.recordPosition('player1', { x: 105, y: 200 }, { x: 100, y: 0 })

      // Request position slightly in the future
      vi.advanceTimersByTime(50)
      const pos = lagComp.getPositionAtTime('player1', Date.now() + 50)
      
      expect(pos).not.toBeNull()
      // Should extrapolate forward using velocity
      expect(pos!.x).toBeGreaterThan(105)
    })
  })

  describe('getAllPositionsAtTime', () => {
    it('returns positions for all entities', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      lagComp.recordPosition('player2', { x: 500, y: 300 })
      vi.advanceTimersByTime(50)
      lagComp.recordPosition('player1', { x: 150, y: 200 })
      lagComp.recordPosition('player2', { x: 550, y: 300 })

      const positions = lagComp.getAllPositionsAtTime(Date.now())
      
      expect(positions.size).toBe(2)
      expect(positions.has('player1')).toBe(true)
      expect(positions.has('player2')).toBe(true)
    })
  })

  describe('getLatestPosition', () => {
    it('returns latest recorded position', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      vi.advanceTimersByTime(50)
      lagComp.recordPosition('player1', { x: 200, y: 300 })

      const pos = lagComp.getLatestPosition('player1')
      
      expect(pos).toEqual({ x: 200, y: 300 })
    })

    it('returns null for unknown entity', () => {
      const pos = lagComp.getLatestPosition('unknown')
      expect(pos).toBeNull()
    })
  })

  describe('clearEntity', () => {
    it('clears history for specific entity', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      lagComp.recordPosition('player2', { x: 500, y: 300 })

      lagComp.clearEntity('player1')

      expect(lagComp.getHistory('player1').length).toBe(0)
      expect(lagComp.getHistory('player2').length).toBe(1)
    })
  })

  describe('clear', () => {
    it('clears all history', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      lagComp.recordPosition('player2', { x: 500, y: 300 })

      lagComp.clear()

      expect(lagComp.getStats().entityCount).toBe(0)
    })
  })

  describe('getStats', () => {
    it('returns correct statistics', () => {
      lagComp.recordPosition('player1', { x: 100, y: 200 })
      lagComp.recordPosition('player1', { x: 150, y: 200 })
      lagComp.recordPosition('player2', { x: 500, y: 300 })

      const stats = lagComp.getStats()
      
      expect(stats.entityCount).toBe(2)
      expect(stats.totalSnapshots).toBe(3)
    })
  })
})
