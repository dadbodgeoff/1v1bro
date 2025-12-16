/**
 * Property-based tests for SessionExplorer
 * 
 * **Feature: unified-analytics-dashboard, Property 2: Session events are chronologically ordered**
 * **Validates: Requirements 2.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { sortEventsChronologically, type SessionEvent } from './SessionExplorer'

// Generate a valid ISO timestamp string
const timestampArbitrary = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(ts => new Date(ts).toISOString())

// Arbitrary for generating valid SessionEvent objects
const sessionEventArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('pageview', 'event', 'click', 'error', 'conversion') as fc.Arbitrary<SessionEvent['type']>,
  timestamp: timestampArbitrary,
  page: fc.stringMatching(/^\/[a-z0-9/-]{0,50}$/),
  eventName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  metadata: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()), { nil: undefined }),
  duration: fc.option(fc.nat({ max: 3600 }), { nil: undefined }),
  isConversion: fc.boolean(),
})

describe('SessionExplorer - Property Tests', () => {
  /**
   * Property 2: Session events are chronologically ordered
   * 
   * *For any* session's event list in the Session Explorer, events SHALL be 
   * sorted by timestamp in ascending order (earliest first).
   * 
   * **Validates: Requirements 2.3**
   */
  it('Property 2: sortEventsChronologically returns events in ascending timestamp order', () => {
    fc.assert(
      fc.property(
        fc.array(sessionEventArbitrary, { minLength: 0, maxLength: 100 }),
        (events) => {
          const sorted = sortEventsChronologically(events)
          
          // Verify the result has the same length as input
          expect(sorted.length).toBe(events.length)
          
          // Verify events are in chronological order (ascending)
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].timestamp).getTime()
            const currTime = new Date(sorted[i].timestamp).getTime()
            expect(currTime).toBeGreaterThanOrEqual(prevTime)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property: sortEventsChronologically is idempotent
   * Sorting an already sorted array should produce the same result
   */
  it('sortEventsChronologically is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(sessionEventArbitrary, { minLength: 0, maxLength: 50 }),
        (events) => {
          const sortedOnce = sortEventsChronologically(events)
          const sortedTwice = sortEventsChronologically(sortedOnce)
          
          // Sorting twice should produce the same result as sorting once
          expect(sortedTwice).toEqual(sortedOnce)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property: sortEventsChronologically preserves all events
   * No events should be lost or duplicated during sorting
   */
  it('sortEventsChronologically preserves all events', () => {
    fc.assert(
      fc.property(
        fc.array(sessionEventArbitrary, { minLength: 0, maxLength: 50 }),
        (events) => {
          const sorted = sortEventsChronologically(events)
          
          // Same number of events
          expect(sorted.length).toBe(events.length)
          
          // All original event IDs are present in sorted result
          const originalIds = new Set(events.map(e => e.id))
          const sortedIds = new Set(sorted.map(e => e.id))
          expect(sortedIds).toEqual(originalIds)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property: sortEventsChronologically does not mutate input
   */
  it('sortEventsChronologically does not mutate input array', () => {
    fc.assert(
      fc.property(
        fc.array(sessionEventArbitrary, { minLength: 1, maxLength: 20 }),
        (events) => {
          const originalOrder = events.map(e => e.id)
          sortEventsChronologically(events)
          const afterSortOrder = events.map(e => e.id)
          
          // Original array should be unchanged
          expect(afterSortOrder).toEqual(originalOrder)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
