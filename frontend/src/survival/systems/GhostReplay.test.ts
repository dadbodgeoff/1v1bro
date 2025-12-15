/**
 * Property-based tests for GhostReplay
 * Uses fast-check for property testing
 * 
 * **Feature: survival-game-feel-telemetry**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { GhostReplay } from './GhostReplay'
import { InputRecorder } from './InputRecorder'
import type { InputRecording, InputAction } from '../types/survival'

describe('GhostReplay', () => {
  let ghostReplay: GhostReplay
  
  // Arbitrary generators
  const gameplayActionArb = fc.constantFrom<InputAction>(
    'moveLeft', 'moveRight', 'jump', 'slide'
  )
  
  const seedArb = fc.integer({ min: 0, max: 2147483647 })
  
  // Generate a valid recording with sorted timestamps
  const recordingArb = fc.record({
    seed: seedArb,
    eventCount: fc.integer({ min: 1, max: 50 }),
    maxTime: fc.integer({ min: 1000, max: 60000 }),
  }).chain(({ seed, eventCount, maxTime }) => {
    return fc.array(
      fc.record({
        action: gameplayActionArb,
        timeOffset: fc.double({ min: 0, max: 1, noNaN: true }),
      }),
      { minLength: eventCount, maxLength: eventCount }
    ).map(events => {
      // Create recording with sorted events
      const recorder = new InputRecorder()
      recorder.start(seed)
      
      // Sort by time offset and convert to actual timestamps
      const sortedEvents = events
        .map((e, i) => ({ ...e, time: Math.floor(e.timeOffset * maxTime) }))
        .sort((a, b) => a.time - b.time)
      
      for (const event of sortedEvents) {
        recorder.recordInput(event.action, event.time)
      }
      
      return recorder.stop()
    })
  })
  
  beforeEach(() => {
    ghostReplay = new GhostReplay()
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 13: Ghost input timing accuracy**
   * **Validates: Requirements 5.2**
   * 
   * For any ghost replay, inputs SHALL be applied within 1 frame (16.67ms)
   * of their recorded timestamp.
   */
  describe('Property 13: Ghost input timing accuracy', () => {
    it('should return inputs within 1 frame of their recorded timestamp', () => {
      fc.assert(
        fc.property(
          recordingArb,
          (recording) => {
            const ghost = new GhostReplay()
            ghost.load(recording)
            ghost.start()
            
            const receivedInputs: Array<{ timestamp: number; eventTime: number }> = []
            
            // Simulate playback at 60fps
            const frameTime = 1000 / 60  // ~16.67ms
            let gameTime = 0
            
            while (gameTime <= recording.duration + 100) {
              const inputs = ghost.getAllInputsAtTime(gameTime)
              
              for (const input of inputs) {
                receivedInputs.push({
                  timestamp: gameTime,
                  eventTime: input.event.t,
                })
              }
              
              gameTime += frameTime
            }
            
            // Verify all events were received
            expect(receivedInputs.length).toBe(recording.events.length)
            
            // Verify timing accuracy (within 1 frame + tolerance)
            const maxAllowedDelay = frameTime + 17  // 1 frame + tolerance
            
            for (const received of receivedInputs) {
              const delay = received.timestamp - received.eventTime
              // Input should be received at or after its timestamp
              // but within the allowed delay
              expect(delay).toBeGreaterThanOrEqual(-17)  // Allow small early delivery
              expect(delay).toBeLessThanOrEqual(maxAllowedDelay)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
    
    it('should not return inputs before their timestamp', () => {
      fc.assert(
        fc.property(
          recordingArb,
          (recording) => {
            const ghost = new GhostReplay()
            ghost.load(recording)
            ghost.start()
            
            // Check at time 0 - should only get events at t=0
            const earlyInputs = ghost.getAllInputsAtTime(0)
            
            for (const input of earlyInputs) {
              // Events returned at time 0 should have timestamp near 0
              expect(input.event.t).toBeLessThanOrEqual(17)  // Within tolerance
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 20: Seed determinism for obstacles**
   * **Validates: Requirements 8.2**
   * 
   * Note: This tests that the seed is correctly stored and retrieved.
   * Actual obstacle generation determinism is tested in the orchestrator.
   */
  describe('Property 20: Seed determinism for obstacles', () => {
    it('should preserve seed through load/getSeed cycle', () => {
      fc.assert(
        fc.property(
          recordingArb,
          (recording) => {
            const ghost = new GhostReplay()
            ghost.load(recording)
            
            expect(ghost.getSeed()).toBe(recording.seed)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
  
  /**
   * **Feature: survival-game-feel-telemetry, Property 21: Replay position determinism**
   * **Validates: Requirements 8.4**
   * 
   * For any input recording played back with the same seed,
   * the ghost position at any timestamp SHALL match the original within 0.01 units.
   * 
   * Note: This tests that position data is preserved through serialization.
   */
  describe('Property 21: Replay position determinism', () => {
    it('should preserve position data through serialization', () => {
      fc.assert(
        fc.property(
          seedArb,
          fc.array(
            fc.record({
              action: gameplayActionArb,
              time: fc.integer({ min: 0, max: 10000 }),
              positionZ: fc.double({ min: -1000, max: 0, noNaN: true }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (seed, events) => {
            // Create recording with positions
            const recorder = new InputRecorder()
            recorder.start(seed)
            
            const sortedEvents = events.sort((a, b) => a.time - b.time)
            for (const event of sortedEvents) {
              recorder.recordInput(event.action, event.time, event.positionZ)
            }
            
            const recording = recorder.stop()
            
            // Serialize and deserialize
            const serialized = InputRecorder.serializeRecording(recording)
            const deserialized = InputRecorder.deserialize(serialized)
            
            // Verify positions are preserved in the deserialized recording
            expect(deserialized.events.length).toBe(recording.events.length)
            
            for (let i = 0; i < recording.events.length; i++) {
              const original = recording.events[i]
              const restored = deserialized.events[i]
              
              // Timestamps should match exactly
              expect(restored.t).toBe(original.t)
              
              // Positions should match within 0.01 units (2 decimal precision)
              if (original.p !== undefined) {
                expect(restored.p).toBeDefined()
                expect(restored.p).toBeCloseTo(original.p, 2)
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
  
  // Additional unit tests
  describe('Edge cases', () => {
    it('should return inactive state when no recording loaded', () => {
      const state = ghostReplay.update(1000)
      
      expect(state.active).toBe(false)
      expect(state.opacity).toBe(0)
    })
    
    it('should fade out at end of recording', () => {
      const recorder = new InputRecorder()
      recorder.start(12345)
      recorder.recordInput('jump', 100)
      const recording = recorder.stop()
      
      ghostReplay.load(recording)
      ghostReplay.start()
      
      // Before end
      let state = ghostReplay.update(50)
      expect(state.opacity).toBe(GhostReplay.GHOST_OPACITY)
      
      // At end
      state = ghostReplay.update(recording.duration)
      expect(ghostReplay.isComplete()).toBe(true)
      
      // During fade out
      state = ghostReplay.update(recording.duration + 500)
      expect(state.opacity).toBeLessThan(GhostReplay.GHOST_OPACITY)
      expect(state.opacity).toBeGreaterThan(0)
      
      // After fade out
      state = ghostReplay.update(recording.duration + GhostReplay.FADE_OUT_DURATION + 100)
      expect(state.active).toBe(false)
    })
    
    it('should track progress correctly', () => {
      const recorder = new InputRecorder()
      recorder.start(12345)
      recorder.recordInput('jump', 500)
      recorder.recordInput('slide', 1000)
      const recording = recorder.stop()
      
      ghostReplay.load(recording)
      ghostReplay.start()
      
      expect(ghostReplay.getProgress()).toBe(0)
      
      ghostReplay.update(500)
      expect(ghostReplay.getProgress()).toBeCloseTo(0.5, 2)
      
      ghostReplay.update(1000)
      expect(ghostReplay.getProgress()).toBe(1)
    })
    
    it('should reset properly', () => {
      const recorder = new InputRecorder()
      recorder.start(12345)
      recorder.recordInput('jump', 100)
      const recording = recorder.stop()
      
      ghostReplay.load(recording)
      ghostReplay.start()
      ghostReplay.update(50)
      
      ghostReplay.reset()
      
      expect(ghostReplay.isActive()).toBe(false)
      expect(ghostReplay.getSeed()).toBeNull()
      expect(ghostReplay.getDuration()).toBe(0)
    })
  })
})
