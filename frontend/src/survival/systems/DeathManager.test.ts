/**
 * Property-based tests for DeathManager
 * Uses fast-check for property testing
 * 
 * **Feature: survival-game-feel-telemetry**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { DeathManager } from './DeathManager'
import type { DeathContext, ObstacleType, Lane } from '../types/survival'

describe('DeathManager', () => {
  let deathManager: DeathManager
  
  // Arbitrary generators for death context
  const obstacleTypeArb = fc.constantFrom<ObstacleType>(
    'highBarrier', 'lowBarrier', 'laneBarrier', 'knowledgeGate', 'gap'
  )
  
  const laneArb = fc.constantFrom<Lane>(-1, 0, 1)
  
  const deathContextArb = fc.record({
    position: fc.record({
      x: fc.double({ min: -10, max: 10, noNaN: true }),
      z: fc.double({ min: -1000, max: 0, noNaN: true }),
    }),
    obstacleType: obstacleTypeArb,
    obstacleId: fc.string({ minLength: 1, maxLength: 20 }),
    speed: fc.double({ min: 1, max: 100, noNaN: true }),
    distance: fc.integer({ min: 0, max: 100000 }),
    wasJumping: fc.boolean(),
    wasSliding: fc.boolean(),
    currentLane: laneArb,
    comboAtDeath: fc.integer({ min: 0, max: 1000 }),
  }) as fc.Arbitrary<DeathContext>
  
  beforeEach(() => {
    deathManager = new DeathManager()
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 1: Slow-mo time scale on death**
   * **Validates: Requirements 1.1**
   * 
   * For any collision event, the game time scale SHALL be set to 0.2
   * immediately after collision detection.
   */
  describe('Property 1: Slow-mo time scale on death', () => {
    it('should set time scale to 0.2 immediately after death trigger', () => {
      fc.assert(
        fc.property(
          deathContextArb,
          (context) => {
            const manager = new DeathManager()
            
            // Before death, time scale should be 1.0
            expect(manager.getTimeScale()).toBe(1.0)
            
            // Trigger death
            manager.triggerDeath(context)
            
            // Immediately after, time scale should be 0.2
            expect(manager.getTimeScale()).toBe(0.2)
            expect(manager.isInSlowMo()).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should return 0.2 time scale during slow-mo phase', () => {
      fc.assert(
        fc.property(
          deathContextArb,
          // Time during slow-mo (0 to 1.4 seconds, before it ends)
          fc.double({ min: 0, max: 1.4, noNaN: true }),
          (context, elapsedTime) => {
            const manager = new DeathManager()
            
            manager.triggerDeath(context)
            
            // Simulate time passing
            const timeScale = manager.update(elapsedTime)
            
            // Should still be in slow-mo
            expect(timeScale).toBe(0.2)
            expect(manager.isInSlowMo()).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 2: Slow-mo restoration**
   * **Validates: Requirements 1.3**
   * 
   * For any slow-mo death sequence, after 1.5 seconds of game time,
   * the time scale SHALL return to 1.0 and game phase SHALL transition to 'complete'.
   */
  describe('Property 2: Slow-mo restoration', () => {
    it('should restore time scale to 1.0 after 1.5 seconds', () => {
      fc.assert(
        fc.property(
          deathContextArb,
          // Extra time after slow-mo ends (0 to 5 seconds)
          fc.double({ min: 0, max: 5, noNaN: true }),
          (context, extraTime) => {
            const manager = new DeathManager()
            
            manager.triggerDeath(context)
            
            // Simulate exactly 1.5 seconds passing
            manager.update(1.5)
            
            // Should be complete
            expect(manager.isComplete()).toBe(true)
            expect(manager.isInSlowMo()).toBe(false)
            expect(manager.getTimeScale()).toBe(1.0)
            expect(manager.getPhase()).toBe('complete')
            
            // Additional time should not change anything
            manager.update(extraTime)
            expect(manager.getTimeScale()).toBe(1.0)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should transition to complete phase after duration', () => {
      fc.assert(
        fc.property(
          deathContextArb,
          (context) => {
            const manager = new DeathManager()
            const phases: string[] = []
            
            manager.setCallbacks({
              onPhaseChange: (phase) => phases.push(phase),
            })
            
            manager.triggerDeath(context)
            
            // Should have recorded slow_mo phase
            expect(phases).toContain('slow_mo')
            
            // Complete the slow-mo
            manager.update(1.5)
            
            // Should have recorded complete phase
            expect(phases).toContain('complete')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should call onSlowMoEnd callback when slow-mo ends', () => {
      fc.assert(
        fc.property(
          deathContextArb,
          (context) => {
            const manager = new DeathManager()
            let endContext: DeathContext | null = null
            
            manager.setCallbacks({
              onSlowMoEnd: (ctx) => { endContext = ctx },
            })
            
            manager.triggerDeath(context)
            manager.update(1.5)
            
            // Should have received the death context
            expect(endContext).not.toBeNull()
            expect(endContext?.obstacleType).toBe(context.obstacleType)
            expect(endContext?.distance).toBe(context.distance)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 8: Hitstop on perfect dodge**
   * **Validates: Requirements 3.3**
   * 
   * Note: This property tests the GameLoop.triggerHitstop integration,
   * which is tested in the integration tests. Here we test the DeathManager
   * doesn't interfere with hitstop.
   */
  describe('Property 8: Hitstop on perfect dodge (DeathManager non-interference)', () => {
    it('should not affect time scale when not in death sequence', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 10, noNaN: true }),
          (deltaTime) => {
            const manager = new DeathManager()
            
            // Without triggering death, update should return 1.0
            const timeScale = manager.update(deltaTime)
            
            expect(timeScale).toBe(1.0)
            expect(manager.getPhase()).toBe('none')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  // Additional unit tests
  describe('Edge cases', () => {
    it('should not allow multiple death triggers', () => {
      const context1: DeathContext = {
        position: { x: 0, z: -100 },
        obstacleType: 'highBarrier',
        obstacleId: 'obs1',
        speed: 10,
        distance: 100,
        wasJumping: false,
        wasSliding: false,
        currentLane: 0,
        comboAtDeath: 5,
      }
      
      const context2: DeathContext = {
        ...context1,
        obstacleId: 'obs2',
        distance: 200,
      }
      
      deathManager.triggerDeath(context1)
      deathManager.triggerDeath(context2)
      
      // Should still have first context
      expect(deathManager.getDeathContext()?.obstacleId).toBe('obs1')
      expect(deathManager.getDeathContext()?.distance).toBe(100)
    })
    
    it('should reset properly', () => {
      const context: DeathContext = {
        position: { x: 0, z: -100 },
        obstacleType: 'highBarrier',
        obstacleId: 'obs1',
        speed: 10,
        distance: 100,
        wasJumping: false,
        wasSliding: false,
        currentLane: 0,
        comboAtDeath: 5,
      }
      
      deathManager.triggerDeath(context)
      deathManager.update(0.5)
      
      expect(deathManager.isInSlowMo()).toBe(true)
      
      deathManager.reset()
      
      expect(deathManager.getPhase()).toBe('none')
      expect(deathManager.getDeathContext()).toBeNull()
      expect(deathManager.getTimeScale()).toBe(1.0)
    })
    
    it('should track slow-mo progress correctly', () => {
      const context: DeathContext = {
        position: { x: 0, z: -100 },
        obstacleType: 'highBarrier',
        obstacleId: 'obs1',
        speed: 10,
        distance: 100,
        wasJumping: false,
        wasSliding: false,
        currentLane: 0,
        comboAtDeath: 5,
      }
      
      deathManager.triggerDeath(context)
      
      expect(deathManager.getSlowMoProgress()).toBe(0)
      
      deathManager.update(0.75)
      expect(deathManager.getSlowMoProgress()).toBeCloseTo(0.5, 2)
      
      deathManager.update(0.75)
      expect(deathManager.getSlowMoProgress()).toBe(1)
    })
  })
})
