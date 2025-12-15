/**
 * Property-based tests for ComboEscalationSystem
 * Feature: enterprise-juice-feedback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { ComboEscalationSystem } from './ComboEscalationSystem'

describe('ComboEscalationSystem', () => {
  let comboSystem: ComboEscalationSystem

  beforeEach(() => {
    comboSystem = new ComboEscalationSystem()
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 10: Combo visual levels are correct**
   * For any combo value C, visual level shall be:
   * - none (C < 5)
   * - low (5 ≤ C < 10)
   * - medium (10 ≤ C < 15)
   * - high (C ≥ 15)
   */
  it('Property 10: Combo visual levels are correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),  // Combo value
        (combo) => {
          comboSystem.reset()
          comboSystem.setCombo(combo)
          
          const state = comboSystem.getVisualState()
          
          if (combo < 5) {
            expect(state.level).toBe('none')
          } else if (combo < 10) {
            expect(state.level).toBe('low')
          } else if (combo < 15) {
            expect(state.level).toBe('medium')
          } else {
            expect(state.level).toBe('high')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Trail activates at combo 5+
   */
  it('Trail activates at combo 5+', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        (combo) => {
          comboSystem.reset()
          comboSystem.setCombo(combo)
          
          const state = comboSystem.getVisualState()
          
          if (combo >= 5) {
            expect(state.trailActive).toBe(true)
          } else {
            expect(state.trailActive).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Edge glow activates only at combo 15+
   */
  it('Edge glow activates only at combo 15+', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        (combo) => {
          comboSystem.reset()
          comboSystem.setCombo(combo)
          
          const state = comboSystem.getVisualState()
          
          if (combo >= 15) {
            expect(state.edgeGlowActive).toBe(true)
          } else {
            expect(state.edgeGlowActive).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Glow intensity increases with level
   */
  it('Glow intensity increases with level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),   // Low combo
        fc.integer({ min: 5, max: 9 }),   // Low level
        fc.integer({ min: 10, max: 14 }), // Medium level
        fc.integer({ min: 15, max: 50 }), // High level
        (noneCombo, lowCombo, mediumCombo, highCombo) => {
          comboSystem.reset()
          comboSystem.setCombo(noneCombo)
          const noneIntensity = comboSystem.getVisualState().glowIntensity
          
          comboSystem.setCombo(lowCombo)
          const lowIntensity = comboSystem.getVisualState().glowIntensity
          
          comboSystem.setCombo(mediumCombo)
          const mediumIntensity = comboSystem.getVisualState().glowIntensity
          
          comboSystem.setCombo(highCombo)
          const highIntensity = comboSystem.getVisualState().glowIntensity
          
          expect(noneIntensity).toBe(0)
          expect(lowIntensity).toBeGreaterThan(noneIntensity)
          expect(mediumIntensity).toBeGreaterThan(lowIntensity)
          expect(highIntensity).toBeGreaterThan(mediumIntensity)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit tests
  describe('Unit Tests', () => {
    it('should start with no visual effects', () => {
      const state = comboSystem.getVisualState()
      expect(state.level).toBe('none')
      expect(state.glowIntensity).toBe(0)
      expect(state.trailActive).toBe(false)
      expect(state.edgeGlowActive).toBe(false)
    })

    it('should update visual state on combo change', () => {
      comboSystem.setCombo(5)
      expect(comboSystem.getVisualState().level).toBe('low')
      
      comboSystem.setCombo(10)
      expect(comboSystem.getVisualState().level).toBe('medium')
      
      comboSystem.setCombo(15)
      expect(comboSystem.getVisualState().level).toBe('high')
    })

    it('should start fade out on combo reset', () => {
      comboSystem.setCombo(10)
      comboSystem.setCombo(0)
      
      expect(comboSystem.isFadingOut()).toBe(true)
    })

    it('should complete fade out after duration', () => {
      comboSystem.setCombo(10)
      comboSystem.setCombo(0)
      
      // Simulate fade out duration (0.5 seconds)
      for (let i = 0; i < 50; i++) {
        comboSystem.update(0.016)
      }
      
      expect(comboSystem.isFadingOut()).toBe(false)
      expect(comboSystem.getVisualState().level).toBe('none')
    })

    it('should cancel fade if combo builds again', () => {
      comboSystem.setCombo(10)
      comboSystem.setCombo(0)
      expect(comboSystem.isFadingOut()).toBe(true)
      
      comboSystem.setCombo(5)
      expect(comboSystem.isFadingOut()).toBe(false)
    })

    it('should reset correctly', () => {
      comboSystem.setCombo(15)
      comboSystem.reset()
      
      expect(comboSystem.getCombo()).toBe(0)
      expect(comboSystem.getVisualState().level).toBe('none')
      expect(comboSystem.isFadingOut()).toBe(false)
    })

    it('static method should return correct level', () => {
      expect(ComboEscalationSystem.getVisualLevelForCombo(0)).toBe('none')
      expect(ComboEscalationSystem.getVisualLevelForCombo(4)).toBe('none')
      expect(ComboEscalationSystem.getVisualLevelForCombo(5)).toBe('low')
      expect(ComboEscalationSystem.getVisualLevelForCombo(9)).toBe('low')
      expect(ComboEscalationSystem.getVisualLevelForCombo(10)).toBe('medium')
      expect(ComboEscalationSystem.getVisualLevelForCombo(14)).toBe('medium')
      expect(ComboEscalationSystem.getVisualLevelForCombo(15)).toBe('high')
      expect(ComboEscalationSystem.getVisualLevelForCombo(100)).toBe('high')
    })
  })
})
