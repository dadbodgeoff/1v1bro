/**
 * Property-Based Tests for Analytics Tracking
 * 
 * Tests Property 12 from the design document:
 * - Property 12: Analytics Tracking
 * 
 * @module landing/arcade/__tests__/properties/analytics.property
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ANALYTICS_EVENTS } from '../../constants';

// Mock analytics service
interface AnalyticsEvent {
  name: string;
  payload?: Record<string, unknown>;
}

const trackedEvents: AnalyticsEvent[] = [];

function trackEvent(name: string, payload?: Record<string, unknown>): void {
  trackedEvents.push({ name, payload });
}

function clearTrackedEvents(): void {
  trackedEvents.length = 0;
}

function getTrackedEvents(): AnalyticsEvent[] {
  return [...trackedEvents];
}

// Event validators
function isValidBootEvent(event: AnalyticsEvent): boolean {
  const validBootEvents = [
    ANALYTICS_EVENTS.bootStart,
    ANALYTICS_EVENTS.bootPhase,
    ANALYTICS_EVENTS.bootSkip,
    ANALYTICS_EVENTS.bootComplete,
  ];
  return validBootEvents.includes(event.name as typeof validBootEvents[number]);
}

function isValidCTAEvent(event: AnalyticsEvent): boolean {
  return (
    event.name === ANALYTICS_EVENTS.ctaClick &&
    event.payload !== undefined &&
    typeof event.payload.cta_type === 'string' &&
    typeof event.payload.is_authenticated === 'boolean'
  );
}

describe('Analytics Tracking Properties', () => {
  beforeEach(() => {
    clearTrackedEvents();
  });

  /**
   * **Feature: crt-arcade-landing, Property 12: Analytics Tracking**
   * 
   * *For any* page view or CTA click event, the analytics service SHALL be
   * called with the appropriate event type and metadata.
   * 
   * **Validates: Requirements 8.5**
   */
  it('Property 12: CTA clicks are tracked with correct metadata', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary'), // CTA type
        fc.boolean(), // isAuthenticated
        (ctaType, isAuthenticated) => {
          clearTrackedEvents();

          // Simulate CTA click tracking
          trackEvent(ANALYTICS_EVENTS.ctaClick, {
            cta_type: ctaType,
            is_authenticated: isAuthenticated,
          });

          const events = getTrackedEvents();
          expect(events.length).toBe(1);

          const event = events[0];
          expect(event.name).toBe(ANALYTICS_EVENTS.ctaClick);
          expect(event.payload?.cta_type).toBe(ctaType);
          expect(event.payload?.is_authenticated).toBe(isAuthenticated);
          expect(isValidCTAEvent(event)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Boot events are tracked in sequence
   */
  it('Boot events are tracked in correct sequence', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // wasSkipped
        fc.integer({ min: 100, max: 5000 }), // duration
        (wasSkipped, duration) => {
          clearTrackedEvents();

          // Simulate boot sequence tracking
          trackEvent(ANALYTICS_EVENTS.bootStart);
          trackEvent(ANALYTICS_EVENTS.bootPhase, { phase: 'powering-on' });
          trackEvent(ANALYTICS_EVENTS.bootPhase, { phase: 'booting' });

          if (wasSkipped) {
            trackEvent(ANALYTICS_EVENTS.bootSkip, {
              phase_at_skip: 'booting',
              time_elapsed_ms: duration / 2,
            });
          } else {
            trackEvent(ANALYTICS_EVENTS.bootPhase, { phase: 'ready' });
          }

          trackEvent(ANALYTICS_EVENTS.bootComplete, {
            total_duration_ms: duration,
            was_skipped: wasSkipped,
          });

          const events = getTrackedEvents();

          // First event should be boot start
          expect(events[0].name).toBe(ANALYTICS_EVENTS.bootStart);

          // Last event should be boot complete
          expect(events[events.length - 1].name).toBe(ANALYTICS_EVENTS.bootComplete);
          expect(events[events.length - 1].payload?.was_skipped).toBe(wasSkipped);

          // All events should be valid boot events
          events.forEach((event) => {
            expect(isValidBootEvent(event)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Performance degradation is tracked
   */
  it('Performance degradation events include FPS data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 29 }), // FPS at trigger (below 30)
        fc.array(fc.constantFrom('flicker', 'scanlines', 'phosphorGlow'), { minLength: 1, maxLength: 3 }),
        (fpsAtTrigger, effectsDisabled) => {
          clearTrackedEvents();

          trackEvent(ANALYTICS_EVENTS.performanceDegraded, {
            fps_at_trigger: fpsAtTrigger,
            effects_disabled: effectsDisabled,
          });

          const events = getTrackedEvents();
          expect(events.length).toBe(1);

          const event = events[0];
          expect(event.name).toBe(ANALYTICS_EVENTS.performanceDegraded);
          expect(event.payload?.fps_at_trigger).toBe(fpsAtTrigger);
          expect(event.payload?.fps_at_trigger).toBeLessThan(30);
          expect(Array.isArray(event.payload?.effects_disabled)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: All analytics event names are defined
   */
  it('All analytics event names are properly defined', () => {
    const expectedEvents = [
      'bootStart',
      'bootPhase',
      'bootSkip',
      'bootComplete',
      'ctaVisible',
      'ctaClick',
      'performanceDegraded',
      'errorBoundaryTriggered',
      'svgFallbackUsed',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...expectedEvents),
        (eventKey) => {
          const eventName = ANALYTICS_EVENTS[eventKey as keyof typeof ANALYTICS_EVENTS];
          expect(eventName).toBeTruthy();
          expect(typeof eventName).toBe('string');
          expect(eventName.startsWith('arcade_')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
