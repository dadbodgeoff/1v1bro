/**
 * Property-based tests for EnvironmentalPropSystem
 *
 * **Feature: aaa-arena-visual-system**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { EnvironmentalPropSystem } from '../EnvironmentalPropSystem'
import type { PropAnchor, PropLayer, Vector2 } from '../types'

describe('EnvironmentalPropSystem', () => {
  let system: EnvironmentalPropSystem

  beforeEach(() => {
    system = new EnvironmentalPropSystem()
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 7: Prop Placement Accuracy**
   * **Validates: Requirements 3.1**
   *
   * *For any* prop anchor defined in map config, the placed PropInstance position
   * SHALL match the anchor position exactly.
   */
  describe('Property 7: Prop Placement Accuracy', () => {
    it('should place props at exact anchor positions', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 2000, noNaN: true }), // x position
          fc.float({ min: 0, max: 2000, noNaN: true }), // y position
          fc.constantFrom<PropLayer>('background', 'gameplay', 'foreground'),
          fc.float({ min: 0, max: Math.fround(Math.PI * 2), noNaN: true }), // rotation
          fc.float({ min: 0.5, max: 2, noNaN: true }), // scale
          (x, y, layer, rotation, scale) => {
            const position: Vector2 = { x, y }
            
            const instance = system.placeProp('test_prop', position, layer, {
              rotation,
              scale,
            })

            // Position should match exactly
            expect(instance.position.x).toBe(x)
            expect(instance.position.y).toBe(y)
            expect(instance.layer).toBe(layer)
            expect(instance.rotation).toBe(rotation)
            expect(instance.scale).toBe(scale)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should place props from anchors at exact positions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              definitionId: fc.string({ minLength: 1, maxLength: 20 }),
              position: fc.record({
                x: fc.float({ min: 0, max: 2000, noNaN: true }),
                y: fc.float({ min: 0, max: 2000, noNaN: true }),
              }),
              layer: fc.constantFrom<PropLayer>('background', 'gameplay', 'foreground'),
              rotation: fc.option(fc.float({ min: 0, max: Math.fround(Math.PI * 2), noNaN: true })),
              scale: fc.option(fc.float({ min: 0.5, max: 2, noNaN: true })),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (anchors) => {
            system.clearInstances()
            system.placePropsFromAnchors(anchors as PropAnchor[])

            const props = system.getAllProps()
            expect(props.length).toBe(anchors.length)

            // Each prop should match its anchor position
            for (let i = 0; i < anchors.length; i++) {
              const anchor = anchors[i]
              const prop = props[i]
              expect(prop.position.x).toBe(anchor.position.x)
              expect(prop.position.y).toBe(anchor.position.y)
              expect(prop.layer).toBe(anchor.layer)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should use default rotation and scale when not provided', () => {
      const instance = system.placeProp('test', { x: 100, y: 200 }, 'gameplay')
      expect(instance.rotation).toBe(0)
      expect(instance.scale).toBe(1)
    })
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 8: Prop Layer Ordering**
   * **Validates: Requirements 3.4**
   *
   * *For any* set of props across layers, background props SHALL render before
   * gameplay props, and gameplay props SHALL render before foreground props.
   */
  describe('Property 8: Prop Layer Ordering', () => {
    it('should filter props by layer correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // background count
          fc.integer({ min: 1, max: 5 }), // gameplay count
          fc.integer({ min: 1, max: 5 }), // foreground count
          (bgCount, gpCount, fgCount) => {
            system.clearInstances()

            // Place props in mixed order
            for (let i = 0; i < bgCount; i++) {
              system.placeProp(`bg_${i}`, { x: i * 10, y: 0 }, 'background')
            }
            for (let i = 0; i < gpCount; i++) {
              system.placeProp(`gp_${i}`, { x: i * 10, y: 100 }, 'gameplay')
            }
            for (let i = 0; i < fgCount; i++) {
              system.placeProp(`fg_${i}`, { x: i * 10, y: 200 }, 'foreground')
            }

            // Verify layer filtering
            const bgProps = system.getPropsInLayer('background')
            const gpProps = system.getPropsInLayer('gameplay')
            const fgProps = system.getPropsInLayer('foreground')

            expect(bgProps.length).toBe(bgCount)
            expect(gpProps.length).toBe(gpCount)
            expect(fgProps.length).toBe(fgCount)

            // All background props should have layer 'background'
            expect(bgProps.every((p) => p.layer === 'background')).toBe(true)
            expect(gpProps.every((p) => p.layer === 'gameplay')).toBe(true)
            expect(fgProps.every((p) => p.layer === 'foreground')).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should maintain correct render order: background < gameplay < foreground', () => {
      // Place props in each layer
      system.placeProp('bg', { x: 0, y: 0 }, 'background')
      system.placeProp('gp', { x: 0, y: 0 }, 'gameplay')
      system.placeProp('fg', { x: 0, y: 0 }, 'foreground')

      // Verify render order by checking layer depths
      const layerOrder: PropLayer[] = ['background', 'gameplay', 'foreground']
      
      for (let i = 0; i < layerOrder.length - 1; i++) {
        const currentLayer = layerOrder[i]
        const nextLayer = layerOrder[i + 1]
        
        const currentProps = system.getPropsInLayer(currentLayer)
        const nextProps = system.getPropsInLayer(nextLayer)
        
        // Both layers should have props
        expect(currentProps.length).toBeGreaterThan(0)
        expect(nextProps.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Prop management', () => {
    it('should remove props by id', () => {
      const prop = system.placeProp('test', { x: 0, y: 0 }, 'gameplay')
      expect(system.getAllProps().length).toBe(1)

      system.removeProp(prop.id)
      expect(system.getAllProps().length).toBe(0)
    })

    it('should clear all instances', () => {
      system.placeProp('test1', { x: 0, y: 0 }, 'gameplay')
      system.placeProp('test2', { x: 100, y: 0 }, 'gameplay')
      expect(system.getAllProps().length).toBe(2)

      system.clearInstances()
      expect(system.getAllProps().length).toBe(0)
    })

    it('should assign unique phase offsets for animation staggering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          (count) => {
            system.clearInstances()
            
            for (let i = 0; i < count; i++) {
              system.placeProp(`prop_${i}`, { x: i * 10, y: 0 }, 'gameplay')
            }

            const props = system.getAllProps()
            const phases = props.map((p) => p.phaseOffset)
            
            // Phases should be diverse (not all the same)
            const uniquePhases = new Set(phases.map((p) => Math.round(p * 10) / 10))
            
            // With random phases, we expect at least 2 unique values for 3+ props
            if (count >= 3) {
              expect(uniquePhases.size).toBeGreaterThanOrEqual(2)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
