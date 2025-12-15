/**
 * useBootSequence - Boot sequence state machine hook
 * 
 * Manages boot phases (off → powering-on → booting → ready → complete).
 * Supports skip functionality and 5000ms hard timeout.
 * 
 * @module landing/arcade/hooks/useBootSequence
 * Requirements: 2.1, 2.5, 2.6, 2.7, 10.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BootPhase, BootSequenceState } from '../types';
import { BOOT_TIMING, BOOT_LINES, ANALYTICS_EVENTS } from '../constants';

export interface UseBootSequenceOptions {
  /** Skip boot sequence entirely */
  skipBoot?: boolean;
  /** Boot text lines to display */
  bootLines?: string[];
  /** Total boot duration in ms */
  duration?: number;
  /** Callback when boot completes */
  onComplete?: () => void;
  /** Callback when phase changes */
  onPhaseChange?: (phase: BootPhase) => void;
  /** Callback when a boot line completes */
  onLineComplete?: (lineIndex: number) => void;
  /** Track analytics events */
  trackEvent?: (event: string, payload?: Record<string, unknown>) => void;
}

export interface UseBootSequenceReturn {
  state: BootSequenceState;
  skip: () => void;
  isComplete: boolean;
  currentLine: number;
  progress: number;
  phase: BootPhase;
}

export function useBootSequence({
  skipBoot = false,
  bootLines = BOOT_LINES,
  duration = BOOT_TIMING.totalDuration,
  onComplete,
  onPhaseChange,
  onLineComplete,
  trackEvent,
}: UseBootSequenceOptions = {}): UseBootSequenceReturn {
  // Start in 'powering-on' phase immediately (not 'off') for better UX
  const [state, setState] = useState<BootSequenceState>(() => ({
    phase: skipBoot ? 'complete' : 'powering-on',
    currentLine: 0,
    progress: skipBoot ? 100 : 0,
    isSkipped: skipBoot,
    startTime: skipBoot ? null : Date.now(),
  } as BootSequenceState));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTrackedStart = useRef(false);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Skip to complete
  const skip = useCallback(() => {
    if (state.phase === 'complete') return;

    const elapsedTime = state.startTime ? Date.now() - state.startTime : 0;

    // Track skip event
    trackEvent?.(ANALYTICS_EVENTS.bootSkip, {
      phase_at_skip: state.phase,
      time_elapsed_ms: elapsedTime,
    });

    clearTimers();
    setState((prev) => ({
      ...prev,
      phase: 'complete',
      progress: 100,
      isSkipped: true,
    }));
    onPhaseChange?.('complete');
    onComplete?.();
  }, [state.phase, state.startTime, clearTimers, trackEvent, onPhaseChange, onComplete]);

  // Handle keyboard skip (Space, Enter, Escape)
  useEffect(() => {
    if (state.phase === 'complete') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        skip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, skip]);

  // Boot sequence progression
  useEffect(() => {
    if (skipBoot) {
      return;
    }

    // Track boot start
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent?.(ANALYTICS_EVENTS.bootStart);
      onPhaseChange?.('powering-on');
      trackEvent?.(ANALYTICS_EVENTS.bootPhase, { phase: 'powering-on' });
    }

    const startTime = Date.now();

    // Phase 2: Booting (show lines) - start after power-on delay
    timeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, phase: 'booting' }));
      onPhaseChange?.('booting');
      trackEvent?.(ANALYTICS_EVENTS.bootPhase, { phase: 'booting' });

        // Progress through boot lines
        let lineIndex = 0;
        intervalRef.current = setInterval(() => {
          lineIndex++;
          const progress = Math.min((lineIndex / bootLines.length) * 100, 100);
          
          setState((prev) => ({
            ...prev,
            currentLine: lineIndex,
            progress,
          }));

          // Play line complete sound
          onLineComplete?.(lineIndex);

          if (lineIndex >= bootLines.length) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;

            // Phase 3: Ready (logo reveal)
            timeoutRef.current = setTimeout(() => {
              setState((prev) => ({ ...prev, phase: 'ready' }));
              onPhaseChange?.('ready');
              trackEvent?.(ANALYTICS_EVENTS.bootPhase, { phase: 'ready' });

              // Phase 4: Complete
              timeoutRef.current = setTimeout(() => {
                const totalDuration = Date.now() - startTime;
                setState((prev) => ({
                  ...prev,
                  phase: 'complete',
                  progress: 100,
                }));
                onPhaseChange?.('complete');
                trackEvent?.(ANALYTICS_EVENTS.bootComplete, {
                  total_duration_ms: totalDuration,
                  was_skipped: false,
                });
                onComplete?.();
              }, BOOT_TIMING.logoRevealDelay);
            }, BOOT_TIMING.progressDuration);
          }
        }, BOOT_TIMING.lineDelay);
    }, BOOT_TIMING.powerOnDelay);

    // Hard timeout - auto-complete after max duration
    const hardTimeout = setTimeout(() => {
      if (state.phase !== 'complete') {
        clearTimers();
        const totalDuration = Date.now() - startTime;
        setState((prev) => ({
          ...prev,
          phase: 'complete',
          progress: 100,
        }));
        onPhaseChange?.('complete');
        trackEvent?.(ANALYTICS_EVENTS.bootComplete, {
          total_duration_ms: totalDuration,
          was_skipped: false,
        });
        onComplete?.();
      }
    }, duration);

    return () => {
      clearTimers();
      clearTimeout(hardTimeout);
    };
  }, [skipBoot]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    skip,
    isComplete: state.phase === 'complete',
    currentLine: state.currentLine,
    progress: state.progress,
    phase: state.phase,
  };
}

export default useBootSequence;
