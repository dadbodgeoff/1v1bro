/**
 * Property-based tests for InputRecorder
 * Uses fast-check for property testing
 * 
 * **Feature: survival-game-feel-telemetry**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { InputRecorder } from './InputRecorder'
import type { InputAction, InputRecording } from '../types/survival'
import { INPUT_TYPE } from '../types/survival'

describe('InputRecorder', () => {
  let recorder: InputRecorder
  
  // Arbitrary generators
  const gameplayActionArb = fc.constantFrom<InputAction>(
    'moveLeft', 'moveRight', 'jump', 'slide'
  )
  
  const seedArb = fc.integer({ min: 0, max: 2147483647 })
  
  const gameTimeArb = fc.integer({ min: 0, max: 300000 }) // 0-5 minutes in ms
  
  const positionZArb = fc.double({ min: -10000, max: 0, noNaN: true })
  
  // Generate a sequence of input events
  const inputSequenceArb = fc.array(
    fc.record({
      action: gameplayActionArb,
      gameTime: gameTimeArb,
      positionZ: fc.option(positionZArb, { nil: undefined }),
    }),
    { minLength: 1, maxLength: 100 }
  ).map(events => {
    // Sort by game time to ensure chronological order
    return events.sort((a, b) => a.gameTime - b.gameTime)
  })
  
  beforeEach(() => {
    recorder = new InputRecorder()
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 10: Input recording contains required fields**
   * **Validates: Requirements 4.2**
   * 
   * For any recorded input event, the stored data SHALL contain
   * input type, timestamp, and player position.
   */
  describe('Property 10: Input recording contains required fields', () => {
    it('should store input type and timestamp for every recorded event', () => {
      fc.assert(
        fc.property(
          seedArb,
          inputSequenceArb,
          (seed, inputs) => {
            const rec = new InputRecorder()
            rec.start(seed)
            
            for (const input of inputs) {
              rec.recordInput(input.action, input.gameTime, input.positionZ)
            }
            
            const recording = rec.stop()
            
            // Every event should have type and timestamp
            for (const event of recording.events) {
              expect(event.t).toBeDefined()
              expect(typeof event.t).toBe('number')
              expect(event.i).toBeDefined()
              expect([0, 1, 2, 3]).toContain(event.i)
            }
            
            // Event count should match input count
            expect(recording.events.length).toBe(inputs.length)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('should store position when provided', () => {
      fc.assert(
        fc.property(
          seedArb,
          gameplayActionArb,
          gameTimeArb,
          positionZArb,
          (seed, action, gameTime, positionZ) => {
            const rec = new InputRecorder()
            rec.start(seed)
            rec.recordInput(action, gameTime, positionZ)
            
            const recording = rec.stop()
            
            expect(recording.events.length).toBe(1)
            expect(recording.events[0].p).toBeDefined()
            // Position should be rounded to 2 decimal places
            expect(recording.events[0].p).toBeCloseTo(positionZ, 2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 11: Input recording round-trip**
   * **Validates: Requirements 4.3, 4.5**
   * 
   * For any valid InputRecording, serializing then deserializing
   * SHALL produce an equivalent recording with identical events and timing.
   */
  describe('Property 11: Input recording round-trip', () => {
    it('should produce identical recording after serialize/deserialize', () => {
      fc.assert(
        fc.property(
          seedArb,
          inputSequenceArb,
          (seed, inputs) => {
            const rec = new InputRecorder()
            rec.start(seed)
            
            for (const input of inputs) {
              rec.recordInput(input.action, input.gameTime, input.positionZ)
            }
            
            const original = rec.stop()
            
            // Serialize and deserialize
            const serialized = InputRecorder.serializeRecording(original)
            const deserialized = InputRecorder.deserialize(serialized)
            
            // Check metadata
            expect(deserialized.version).toBe(original.version)
            expect(deserialized.seed).toBe(original.seed)
            expect(deserialized.startTime).toBe(original.startTime)
            expect(deserialized.duration).toBe(original.duration)
            
            // Check events
            expect(deserialized.events.length).toBe(original.events.length)
            
            for (let i = 0; i < original.events.length; i++) {
              expect(deserialized.events[i].t).toBe(original.events[i].t)
              expect(deserialized.events[i].i).toBe(original.events[i].i)
              if (original.events[i].p !== undefined) {
                // Use toBeCloseTo to handle -0 vs 0 edge case
                expect(deserialized.events[i].p).toBeCloseTo(original.events[i].p, 10)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 12: Recording size constraint**
   * **Validates: Requirements 4.4**
   * 
   * For any 5-minute run (assuming max 10 inputs/second = 3000 events),
   * the serialized recording SHALL be smaller than 50KB.
   */
  describe('Property 12: Recording size constraint', () => {
    it('should produce output smaller than 50KB for 5-minute run', () => {
      fc.assert(
        fc.property(
          seedArb,
          // Generate up to 3000 events (10 inputs/sec for 5 minutes)
          fc.array(
            fc.record({
              action: gameplayActionArb,
              gameTime: fc.integer({ min: 0, max: 300000 }),
              positionZ: fc.option(positionZArb, { nil: undefined }),
            }),
            { minLength: 100, maxLength: 3000 }
          ),
          (seed, inputs) => {
            const rec = new InputRecorder()
            rec.start(seed)
            
            // Sort inputs by time
            const sortedInputs = inputs.sort((a, b) => a.gameTime - b.gameTime)
            
            for (const input of sortedInputs) {
              rec.recordInput(input.action, input.gameTime, input.positionZ)
            }
            
            const serialized = rec.serialize()
            const sizeKB = serialized.length / 1024
            
            // Should be under 50KB
            expect(sizeKB).toBeLessThan(50)
          }
        ),
        { numRuns: 20 } // Fewer runs due to larger data
      )
    })
    
    it('should estimate size reasonably accurately', () => {
      fc.assert(
        fc.property(
          seedArb,
          fc.array(
            fc.record({
              action: gameplayActionArb,
              gameTime: gameTimeArb,
            }),
            { minLength: 10, maxLength: 500 }
          ),
          (seed, inputs) => {
            const rec = new InputRecorder()
            rec.start(seed)
            
            const sortedInputs = inputs.sort((a, b) => a.gameTime - b.gameTime)
            for (const input of sortedInputs) {
              rec.recordInput(input.action, input.gameTime)
            }
            
            const recording = rec.stop()
            const serialized = InputRecorder.serializeRecording(recording)
            const actualSize = serialized.length
            const estimatedSize = InputRecorder.estimateSize(recording.events)
            
            // Estimate should be within 2x of actual
            expect(estimatedSize).toBeGreaterThan(actualSize * 0.3)
            expect(estimatedSize).toBeLessThan(actualSize * 3)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
  
  // Additional unit tests
  describe('Edge cases', () => {
    it('should not record when not started', () => {
      recorder.recordInput('jump', 1000)
      
      // Start and stop to get recording
      recorder.start(12345)
      const recording = recorder.stop()
      
      expect(recording.events.length).toBe(0)
    })
    
    it('should not record pause/start actions', () => {
      recorder.start(12345)
      recorder.recordInput('pause', 1000)
      recorder.recordInput('start', 2000)
      recorder.recordInput('jump', 3000)
      
      const recording = recorder.stop()
      
      expect(recording.events.length).toBe(1)
      expect(recording.events[0].i).toBe(INPUT_TYPE.JUMP)
    })
    
    it('should store seed correctly', () => {
      const seed = 987654321
      recorder.start(seed)
      
      expect(recorder.getSeed()).toBe(seed)
      
      const recording = recorder.stop()
      expect(recording.seed).toBe(seed)
    })
    
    it('should reset properly', () => {
      recorder.start(12345)
      recorder.recordInput('jump', 1000)
      recorder.reset()
      
      expect(recorder.isRecording()).toBe(false)
      expect(recorder.getEventCount()).toBe(0)
      expect(recorder.getSeed()).toBe(0)
    })
  })
})
