/**
 * Property-Based Tests for Boot Sequence
 * 
 * Tests Properties 2-5 from the design document:
 * - Property 2: Boot Lines Sequential Display
 * - Property 3: Boot Progress Monotonic Increase
 * - Property 4: Skip Functionality
 * - Property 5: Boot Duration Limit
 * 
 * @module landing/arcade/__tests__/properties/boot-sequence.property
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useBootSequence } from '../../hooks/useBootSequence';
import { BOOT_LINES, BOOT_TIMING } from '../../constants';

describe('Boot Sequence Properties', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Feature: crt-arcade-landing, Property 2: Boot Lines Sequential Display**
   * 
   * *For any* boot sequence execution, boot text lines SHALL appear in the order
   * defined in BOOT_LINES array, with each line appearing only after the previous
   * line has started displaying.
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 2: Boot lines appear sequentially in order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Number of lines to generate
        async (numLines) => {
          const testLines = Array.from({ length: numLines }, (_, i) => `LINE_${i}`);
          const observedLines: number[] = [];

          const { result } = renderHook(() =>
            useBootSequence({
              bootLines: testLines,
              skipBoot: false,
            })
          );

          // Advance through power-on phase
          await act(async () => {
            vi.advanceTimersByTime(BOOT_TIMING.powerOnDelay);
          });

          // Collect line indices as they appear
          for (let i = 0; i < numLines; i++) {
            await act(async () => {
              vi.advanceTimersByTime(BOOT_TIMING.lineDelay);
            });
            observedLines.push(result.current.currentLine);
          }

          // Verify lines appear in sequential order (each >= previous)
          for (let i = 1; i < observedLines.length; i++) {
            expect(observedLines[i]).toBeGreaterThanOrEqual(observedLines[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: crt-arcade-landing, Property 3: Boot Progress Monotonic Increase**
   * 
   * *For any* boot sequence execution, the progress value SHALL only increase
   * (never decrease) from 0 to 100 over the duration of the boot.
   * 
   * **Validates: Requirements 2.4**
   */
  it('Property 3: Boot progress only increases monotonically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 8 }), // Number of boot lines
        async (numLines) => {
          const testLines = Array.from({ length: numLines }, (_, i) => `LINE_${i}`);
          const progressValues: number[] = [];

          const { result } = renderHook(() =>
            useBootSequence({
              bootLines: testLines,
              skipBoot: false,
            })
          );

          // Record initial progress
          progressValues.push(result.current.progress);

          // Advance through boot sequence
          await act(async () => {
            vi.advanceTimersByTime(BOOT_TIMING.powerOnDelay);
          });
          progressValues.push(result.current.progress);

          for (let i = 0; i < numLines; i++) {
            await act(async () => {
              vi.advanceTimersByTime(BOOT_TIMING.lineDelay);
            });
            progressValues.push(result.current.progress);
          }

          // Verify progress never decreases
          for (let i = 1; i < progressValues.length; i++) {
            expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
          }

          // Verify final progress is 100 or close to it
          const finalProgress = progressValues[progressValues.length - 1];
          expect(finalProgress).toBeGreaterThanOrEqual(90);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: crt-arcade-landing, Property 4: Skip Functionality**
   * 
   * *For any* boot phase before 'complete', triggering skip SHALL immediately
   * transition the boot state to 'complete' and render the Dashboard_UI.
   * 
   * **Validates: Requirements 2.6**
   */
  it('Property 4: Skip immediately transitions to complete from any phase', async () => {
    const phases = ['powering-on', 'booting', 'ready'] as const;

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...phases),
        fc.integer({ min: 0, max: 2000 }), // Random time within phase
        async (targetPhase, additionalTime) => {
          const { result } = renderHook(() =>
            useBootSequence({
              bootLines: BOOT_LINES,
              skipBoot: false,
            })
          );

          // Advance to target phase
          if (targetPhase === 'booting' || targetPhase === 'ready') {
            await act(async () => {
              vi.advanceTimersByTime(BOOT_TIMING.powerOnDelay);
            });
          }
          if (targetPhase === 'ready') {
            await act(async () => {
              vi.advanceTimersByTime(BOOT_TIMING.lineDelay * BOOT_LINES.length + BOOT_TIMING.progressDuration);
            });
          }

          // Add some random time within the phase
          await act(async () => {
            vi.advanceTimersByTime(Math.min(additionalTime, 500));
          });

          // Skip should work from any non-complete phase
          if (result.current.phase !== 'complete') {
            await act(async () => {
              result.current.skip();
            });

            // Verify immediate transition to complete
            expect(result.current.phase).toBe('complete');
            expect(result.current.isComplete).toBe(true);
            expect(result.current.progress).toBe(100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: crt-arcade-landing, Property 5: Boot Duration Limit**
   * 
   * *For any* boot sequence execution without user skip, the total time from
   * start to 'complete' phase SHALL NOT exceed 5000ms.
   * 
   * **Validates: Requirements 2.7**
   */
  it('Property 5: Boot completes within 5000ms hard timeout', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }), // Variable number of boot lines
        async (numLines) => {
          const testLines = Array.from({ length: numLines }, (_, i) => `LINE_${i}`);
          const startTime = Date.now();

          const { result } = renderHook(() =>
            useBootSequence({
              bootLines: testLines,
              skipBoot: false,
              duration: BOOT_TIMING.totalDuration, // 4500ms default, 5000ms max
            })
          );

          // Advance past the hard timeout
          await act(async () => {
            vi.advanceTimersByTime(5100); // Just past 5 seconds
          });

          // Boot should be complete due to hard timeout
          expect(result.current.phase).toBe('complete');
          expect(result.current.isComplete).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
