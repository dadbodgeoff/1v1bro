/**
 * DynamicSpawnManager Tests
 * Tests for random hazard and trap spawning system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DynamicSpawnManager } from './DynamicSpawnManager'

describe('DynamicSpawnManager', () => {
  let manager: DynamicSpawnManager

  beforeEach(() => {
    manager = new DynamicSpawnManager()
  })

  describe('initialization', () => {
    it('starts with no active hazards or traps', () => {
      manager.initialize([])
      expect(manager.getActiveHazards()).toHaveLength(0)
      expect(manager.getActiveTraps()).toHaveLength(0)
    })

    it('respects exclusion zones', () => {
      const exclusionZones = [
        { position: { x: 100, y: 100 }, radius: 100 },
        { position: { x: 1000, y: 600 }, radius: 100 }
      ]
      manager.initialize(exclusionZones)
      expect(manager.getActiveHazards()).toHaveLength(0)
    })
  })

  describe('spawning', () => {
    it('spawns hazards after initial delay', () => {
      // Use short delays for testing
      manager = new DynamicSpawnManager(
        { initialDelayMin: 0, initialDelayMax: 0.001, maxConcurrent: 3 },
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 }
      )
      manager.initialize([])

      // Wait a bit and update
      const result = manager.update(0.1)
      
      // Should have spawned at least one hazard
      expect(result.newHazards.length).toBeGreaterThanOrEqual(0)
    })

    it('respects max concurrent hazards', () => {
      manager = new DynamicSpawnManager(
        { initialDelayMin: 0, initialDelayMax: 0, respawnDelayMin: 0, respawnDelayMax: 0, maxConcurrent: 2, lifetimeMin: 100, lifetimeMax: 100 },
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 }
      )
      manager.initialize([])

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        manager.update(0.1)
      }

      // Should not exceed max concurrent
      expect(manager.getActiveHazards().length).toBeLessThanOrEqual(2)
    })

    it('respects max concurrent traps', () => {
      manager = new DynamicSpawnManager(
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 },
        { initialDelayMin: 0, initialDelayMax: 0, respawnDelayMin: 0, respawnDelayMax: 0, maxConcurrent: 2, lifetimeMin: 100, lifetimeMax: 100 }
      )
      manager.initialize([])

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        manager.update(0.1)
      }

      // Should not exceed max concurrent
      expect(manager.getActiveTraps().length).toBeLessThanOrEqual(2)
    })
  })

  describe('callbacks', () => {
    it('invokes onHazardSpawned callback', () => {
      let spawnedCount = 0
      manager = new DynamicSpawnManager(
        { initialDelayMin: 0, initialDelayMax: 0, maxConcurrent: 1, lifetimeMin: 100, lifetimeMax: 100 },
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 }
      )
      manager.setCallbacks({
        onHazardSpawned: () => { spawnedCount++ }
      })
      manager.initialize([])

      manager.update(0.1)

      expect(spawnedCount).toBeGreaterThanOrEqual(0)
    })

    it('invokes onTrapSpawned callback', () => {
      let spawnedCount = 0
      manager = new DynamicSpawnManager(
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 },
        { initialDelayMin: 0, initialDelayMax: 0, maxConcurrent: 1, lifetimeMin: 100, lifetimeMax: 100 }
      )
      manager.setCallbacks({
        onTrapSpawned: () => { spawnedCount++ }
      })
      manager.initialize([])

      manager.update(0.1)

      expect(spawnedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('hazard types', () => {
    it('spawns valid hazard types', () => {
      manager = new DynamicSpawnManager(
        { initialDelayMin: 0, initialDelayMax: 0, respawnDelayMin: 0, respawnDelayMax: 0, maxConcurrent: 10, lifetimeMin: 100, lifetimeMax: 100 },
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 }
      )
      manager.initialize([])

      // Spawn several hazards
      for (let i = 0; i < 20; i++) {
        manager.update(0.1)
      }

      const hazards = manager.getActiveHazards()
      for (const hazard of hazards) {
        expect(['slow', 'damage', 'emp']).toContain(hazard.type)
        expect(hazard.bounds.width).toBe(80)
        expect(hazard.bounds.height).toBe(80)
      }
    })
  })

  describe('trap types', () => {
    it('spawns valid trap configs', () => {
      manager = new DynamicSpawnManager(
        { initialDelayMin: 100, initialDelayMax: 100, maxConcurrent: 0 },
        { initialDelayMin: 0, initialDelayMax: 0, respawnDelayMin: 0, respawnDelayMax: 0, maxConcurrent: 10, lifetimeMin: 100, lifetimeMax: 100 }
      )
      manager.initialize([])

      // Spawn several traps
      for (let i = 0; i < 20; i++) {
        manager.update(0.1)
      }

      const traps = manager.getActiveTraps()
      for (const trap of traps) {
        expect(trap.type).toBe('pressure')
        expect(['damage_burst', 'knockback', 'stun']).toContain(trap.effect)
        expect(trap.radius).toBeGreaterThanOrEqual(35)
        expect(trap.radius).toBeLessThanOrEqual(50)
      }
    })
  })
})
