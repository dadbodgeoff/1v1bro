/**
 * Property-based tests for ComboSystem
 * Uses fast-check for property testing
 * 
 * **Feature: survival-game-feel-telemetry**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { ComboSystem, type Vector3Like, type ObstacleBounds } from './ComboSystem'

describe('ComboSystem', () => {
  let comboSystem: ComboSystem
  
  beforeEach(() => {
    comboSystem = new ComboSystem()
  })
  
  // Helper to create obstacle at specific distance from player
  // The distance is measured from player to the closest edge of the obstacle
  const createObstacleAtDistance = (
    playerPos: Vector3Like,
    distance: number
  ): ObstacleBounds => {
    const obstacleHalfSize = 0.1
    // Place obstacle so its closest edge is exactly 'distance' away from player
    // Obstacle center = playerPos.z + distance + obstacleHalfSize
    return {
      position: { x: playerPos.x, y: 0, z: playerPos.z + distance + obstacleHalfSize },
      size: { x: obstacleHalfSize, y: 1, z: obstacleHalfSize },
    }
  }
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 3: Near-miss combo increment**
   * **Validates: Requirements 2.1**
   * 
   * For any player position within 0.5 units but greater than 0.2 units of an obstacle,
   * the combo counter SHALL increase by exactly 1.
   */
  describe('Property 3: Near-miss combo increment', () => {
    it('should increment combo by 1 for near-miss distances (0.2 < d <= 0.5)', () => {
      fc.assert(
        fc.property(
          // Generate distance in near-miss range (0.2, 0.5]
          fc.double({ min: 0.201, max: 0.5, noNaN: true }),
          // Generate player position
          fc.record({
            x: fc.double({ min: -10, max: 10, noNaN: true }),
            y: fc.constant(0),
            z: fc.double({ min: -100, max: 0, noNaN: true }),
          }),
          // Generate initial combo value
          fc.integer({ min: 0, max: 100 }),
          (distance, playerPos, initialCombo) => {
            // Setup: set initial combo
            const system = new ComboSystem()
            for (let i = 0; i < initialCombo; i++) {
              system.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.15))
            }
            // Reset to exact initial combo (perfect dodges add 3)
            // Instead, directly test from 0
            const freshSystem = new ComboSystem()
            const obstacle = createObstacleAtDistance(playerPos, distance)
            
            const comboBefore = freshSystem.getCombo()
            const event = freshSystem.checkProximity(playerPos, obstacle)
            const comboAfter = freshSystem.getCombo()
            
            // Assert: combo increased by exactly 1
            expect(comboAfter).toBe(comboBefore + 1)
            expect(event).not.toBeNull()
            expect(event?.type).toBe('near_miss')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 4: Perfect dodge combo increment**
   * **Validates: Requirements 2.2**
   * 
   * For any player position within 0.2 units of an obstacle (without collision),
   * the combo counter SHALL increase by exactly 3.
   */
  describe('Property 4: Perfect dodge combo increment', () => {
    it('should increment combo by 3 for perfect dodge distances (0 < d <= 0.2)', () => {
      fc.assert(
        fc.property(
          // Generate distance in perfect dodge range (0, 0.2)
          // Use 0.199 as max to avoid floating point boundary issues
          fc.double({ min: 0.01, max: 0.199, noNaN: true }),
          // Generate player position
          fc.record({
            x: fc.double({ min: -10, max: 10, noNaN: true }),
            y: fc.constant(0),
            z: fc.double({ min: -100, max: 0, noNaN: true }),
          }),
          (distance, playerPos) => {
            const system = new ComboSystem()
            const obstacle = createObstacleAtDistance(playerPos, distance)
            
            const comboBefore = system.getCombo()
            const event = system.checkProximity(playerPos, obstacle)
            const comboAfter = system.getCombo()
            
            // Assert: combo increased by exactly 3
            expect(comboAfter).toBe(comboBefore + 3)
            expect(event).not.toBeNull()
            expect(event?.type).toBe('perfect_dodge')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 5: Collision resets combo**
   * **Validates: Requirements 2.3**
   * 
   * For any collision event, regardless of current combo value,
   * the combo counter SHALL be reset to 0.
   */
  describe('Property 5: Collision resets combo', () => {
    it('should reset combo to 0 on collision regardless of current value', () => {
      fc.assert(
        fc.property(
          // Generate any combo value
          fc.integer({ min: 0, max: 1000 }),
          (targetCombo) => {
            const system = new ComboSystem()
            
            // Build up combo to target value using perfect dodges
            const playerPos = { x: 0, y: 0, z: 0 }
            const perfectDodgesNeeded = Math.ceil(targetCombo / 3)
            
            for (let i = 0; i < perfectDodgesNeeded; i++) {
              system.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.15))
            }
            
            // Trigger collision
            const event = system.onCollision()
            
            // Assert: combo is now 0
            expect(system.getCombo()).toBe(0)
            expect(system.getMultiplier()).toBe(1.0)
            expect(event.type).toBe('collision')
            expect(event.combo).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 6: Combo decay timing**
   * **Validates: Requirements 2.4**
   * 
   * For any combo state where 3+ seconds have passed since the last near-miss
   * or perfect dodge, the combo SHALL decay by 1 per second.
   */
  describe('Property 6: Combo decay timing', () => {
    it('should decay combo by 1 per second after 3 seconds of inactivity', () => {
      fc.assert(
        fc.property(
          // Generate initial combo (at least 1 to see decay)
          fc.integer({ min: 1, max: 50 }),
          // Generate time to simulate (3-10 seconds)
          fc.double({ min: 3.0, max: 10.0, noNaN: true }),
          (initialCombo, totalTime) => {
            const system = new ComboSystem()
            const playerPos = { x: 0, y: 0, z: 0 }
            
            // Build up combo
            const perfectDodgesNeeded = Math.ceil(initialCombo / 3)
            for (let i = 0; i < perfectDodgesNeeded; i++) {
              system.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.15))
            }
            
            const comboAfterBuildup = system.getCombo()
            
            // Simulate time passing (in small increments for accuracy)
            const deltaTime = 0.016 // ~60fps
            const steps = Math.floor(totalTime / deltaTime)
            
            for (let i = 0; i < steps; i++) {
              system.update(deltaTime)
            }
            
            // Calculate expected decay
            const timeAfterDecayStart = Math.max(0, totalTime - ComboSystem.DECAY_START_TIME)
            const expectedDecay = Math.floor(timeAfterDecayStart * ComboSystem.DECAY_RATE)
            const expectedCombo = Math.max(0, comboAfterBuildup - expectedDecay)
            
            // Assert: combo decayed correctly (allow small timing variance)
            expect(system.getCombo()).toBeGreaterThanOrEqual(Math.max(0, expectedCombo - 1))
            expect(system.getCombo()).toBeLessThanOrEqual(expectedCombo + 1)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should not decay combo before 3 seconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.double({ min: 0, max: 2.9, noNaN: true }),
          (initialCombo, time) => {
            const system = new ComboSystem()
            const playerPos = { x: 0, y: 0, z: 0 }
            
            // Build up combo
            const perfectDodgesNeeded = Math.ceil(initialCombo / 3)
            for (let i = 0; i < perfectDodgesNeeded; i++) {
              system.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.15))
            }
            
            const comboAfterBuildup = system.getCombo()
            
            // Simulate time passing
            system.update(time)
            
            // Assert: combo unchanged
            expect(system.getCombo()).toBe(comboAfterBuildup)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 7: Score multiplier calculation**
   * **Validates: Requirements 2.6**
   * 
   * For any combo value C, the multiplier SHALL equal 1 + (C * 0.1).
   */
  describe('Property 7: Score multiplier calculation', () => {
    it('should calculate multiplier as 1 + (combo * 0.1)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (combo) => {
            const system = new ComboSystem()
            const expectedMultiplier = 1 + combo * 0.1
            
            // Test the calculation method directly
            const calculatedMultiplier = system.calculateMultiplier(combo)
            
            expect(calculatedMultiplier).toBeCloseTo(expectedMultiplier, 10)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should update multiplier correctly when combo changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (targetCombo) => {
            const system = new ComboSystem()
            const playerPos = { x: 0, y: 0, z: 0 }
            
            // Build up combo
            const perfectDodgesNeeded = Math.ceil(targetCombo / 3)
            for (let i = 0; i < perfectDodgesNeeded; i++) {
              system.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.15))
            }
            
            const currentCombo = system.getCombo()
            const expectedMultiplier = 1 + currentCombo * 0.1
            
            expect(system.getMultiplier()).toBeCloseTo(expectedMultiplier, 10)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 9: Combo milestone events**
   * **Validates: Requirements 3.4**
   * 
   * For any combo value that is a multiple of 5 (5, 10, 15...),
   * a milestone event SHALL be emitted.
   */
  describe('Property 9: Combo milestone events', () => {
    it('should emit milestone events at multiples of 5', () => {
      fc.assert(
        fc.property(
          // Generate target milestone (5, 10, 15, etc.)
          fc.integer({ min: 1, max: 20 }).map(n => n * 5),
          (targetMilestone) => {
            const system = new ComboSystem()
            const playerPos = { x: 0, y: 0, z: 0 }
            const milestones: number[] = []
            
            system.onComboChange((event) => {
              if (event.type === 'milestone' && event.milestone !== undefined) {
                milestones.push(event.milestone)
              }
            })
            
            // Build up combo past target milestone using perfect dodges (+3 each)
            const perfectDodgesNeeded = Math.ceil(targetMilestone / 3) + 1
            for (let i = 0; i < perfectDodgesNeeded; i++) {
              system.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.15))
            }
            
            // Assert: milestone was emitted
            expect(milestones).toContain(targetMilestone)
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
   * For any perfect dodge event, a hitstop callback SHALL be triggered.
   * (The actual 3-frame hitstop is handled by GameLoop.triggerHitstop)
   */
  describe('Property 8: Hitstop on perfect dodge', () => {
    it('should trigger hitstop callback on perfect dodge', () => {
      fc.assert(
        fc.property(
          // Generate distance in perfect dodge range
          fc.double({ min: 0.01, max: 0.199, noNaN: true }),
          fc.record({
            x: fc.double({ min: -10, max: 10, noNaN: true }),
            y: fc.constant(0),
            z: fc.double({ min: -100, max: 0, noNaN: true }),
          }),
          (distance, playerPos) => {
            const system = new ComboSystem()
            let hitstopTriggered = false
            let hitstopPosition: { x: number; z: number } | null = null
            
            system.onPerfectDodge((pos) => {
              hitstopTriggered = true
              hitstopPosition = pos
            })
            
            const obstacle = createObstacleAtDistance(playerPos, distance)
            system.checkProximity(playerPos, obstacle)
            
            // Assert: hitstop was triggered
            expect(hitstopTriggered).toBe(true)
            expect(hitstopPosition).not.toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should NOT trigger hitstop callback on near-miss', () => {
      fc.assert(
        fc.property(
          // Generate distance in near-miss range (not perfect dodge)
          fc.double({ min: 0.201, max: 0.5, noNaN: true }),
          fc.record({
            x: fc.double({ min: -10, max: 10, noNaN: true }),
            y: fc.constant(0),
            z: fc.double({ min: -100, max: 0, noNaN: true }),
          }),
          (distance, playerPos) => {
            const system = new ComboSystem()
            let hitstopTriggered = false
            
            system.onPerfectDodge(() => {
              hitstopTriggered = true
            })
            
            const obstacle = createObstacleAtDistance(playerPos, distance)
            system.checkProximity(playerPos, obstacle)
            
            // Assert: hitstop was NOT triggered
            expect(hitstopTriggered).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  // Additional unit tests for edge cases
  describe('Edge cases', () => {
    it('should return null for distances beyond near-miss threshold', () => {
      const playerPos = { x: 0, y: 0, z: 0 }
      const obstacle = createObstacleAtDistance(playerPos, 0.6)
      
      const event = comboSystem.checkProximity(playerPos, obstacle)
      
      expect(event).toBeNull()
      expect(comboSystem.getCombo()).toBe(0)
    })
    
    it('should reset decay timer on successful dodge', () => {
      const playerPos = { x: 0, y: 0, z: 0 }
      
      // Get a near-miss
      comboSystem.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.3))
      
      // Wait 2 seconds
      comboSystem.update(2.0)
      
      // Get another near-miss (should reset timer)
      comboSystem.checkProximity(playerPos, createObstacleAtDistance(playerPos, 0.3))
      
      // Wait another 2 seconds (total 4 from start, but only 2 from last dodge)
      comboSystem.update(2.0)
      
      // Combo should not have decayed yet
      expect(comboSystem.getCombo()).toBe(2)
    })
  })
})
