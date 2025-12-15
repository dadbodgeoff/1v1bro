/**
 * Property-based tests for ParticleSystem dodge particles
 * Feature: enterprise-juice-feedback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import * as THREE from 'three'
import { ParticleSystem } from './ParticleSystem'

describe('ParticleSystem Dodge Particles', () => {
  let scene: THREE.Scene
  let particleSystem: ParticleSystem

  beforeEach(() => {
    scene = new THREE.Scene()
    particleSystem = new ParticleSystem(scene)
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 4: Near-miss emits correct particle count**
   * For any near-miss event, the particle count shall be between 15 and 20.
   */
  it('Property 4: Near-miss emits correct particle count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10, max: 10 }),  // Position X
        fc.integer({ min: -10, max: 10 }),  // Position Z
        fc.integer({ min: 10, max: 100 }).map(n => n / 100), // Intensity 0.1-1.0
        (posX, posZ, intensity) => {
          particleSystem.reset()
          
          const position = new THREE.Vector3(posX, 0, posZ)
          const direction = new THREE.Vector3(1, 0, 0)
          
          particleSystem.emitDodgeParticles(position, direction, intensity)
          
          const count = particleSystem.getLastDodgeEmitCount()
          expect(count).toBeGreaterThanOrEqual(15)
          expect(count).toBeLessThanOrEqual(20)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 5: Perfect dodge emits enhanced particles**
   * For any perfect dodge event, the particle count shall be between 30 and 40.
   */
  it('Property 5: Perfect dodge emits enhanced particles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10, max: 10 }),  // Position X
        fc.integer({ min: -10, max: 10 }),  // Position Z
        (posX, posZ) => {
          particleSystem.reset()
          
          const position = new THREE.Vector3(posX, 0, posZ)
          const direction = new THREE.Vector3(1, 0, 0)
          
          particleSystem.emitPerfectDodgeBurst(position, direction)
          
          const count = particleSystem.getLastPerfectEmitCount()
          expect(count).toBeGreaterThanOrEqual(30)
          expect(count).toBeLessThanOrEqual(40)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Perfect dodge emits more particles than near-miss
   */
  it('Perfect dodge emits more particles than near-miss', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10, max: 10 }),
        fc.integer({ min: -10, max: 10 }),
        (posX, posZ) => {
          particleSystem.reset()
          
          const position = new THREE.Vector3(posX, 0, posZ)
          const direction = new THREE.Vector3(1, 0, 0)
          
          particleSystem.emitDodgeParticles(position, direction, 1)
          const dodgeCount = particleSystem.getLastDodgeEmitCount()
          
          particleSystem.emitPerfectDodgeBurst(position, direction)
          const perfectCount = particleSystem.getLastPerfectEmitCount()
          
          expect(perfectCount).toBeGreaterThan(dodgeCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit tests
  describe('Unit Tests', () => {
    it('should emit dodge particles', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const direction = new THREE.Vector3(1, 0, 0)
      
      particleSystem.emitDodgeParticles(position, direction, 1)
      
      expect(particleSystem.getLastDodgeEmitCount()).toBeGreaterThan(0)
    })

    it('should emit perfect dodge burst', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const direction = new THREE.Vector3(1, 0, 0)
      
      particleSystem.emitPerfectDodgeBurst(position, direction)
      
      expect(particleSystem.getLastPerfectEmitCount()).toBeGreaterThan(0)
    })

    it('should reset counts on reset', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const direction = new THREE.Vector3(1, 0, 0)
      
      particleSystem.emitDodgeParticles(position, direction, 1)
      particleSystem.emitPerfectDodgeBurst(position, direction)
      
      particleSystem.reset()
      
      expect(particleSystem.getLastDodgeEmitCount()).toBe(0)
      expect(particleSystem.getLastPerfectEmitCount()).toBe(0)
    })

    it('should not emit combo trail at low combo', () => {
      const position = new THREE.Vector3(0, 0, 0)
      
      // This should not throw and should not emit (combo < 5)
      particleSystem.updateComboTrail(position, 3)
    })
  })
})
