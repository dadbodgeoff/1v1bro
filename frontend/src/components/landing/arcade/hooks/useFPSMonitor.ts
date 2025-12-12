/**
 * useFPSMonitor - Performance monitoring hook
 * 
 * Tracks FPS and detects performance degradation.
 * Auto-degrades effects when FPS drops below threshold.
 * 
 * @module landing/arcade/hooks/useFPSMonitor
 * Requirements: 6.8
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FPSMonitorState } from '../types';
import { PERFORMANCE_THRESHOLDS, ANALYTICS_EVENTS } from '../constants';

export interface UseFPSMonitorOptions {
  /** Enable FPS monitoring */
  enabled?: boolean;
  /** Callback when performance degrades */
  onDegrade?: () => void;
  /** Track analytics events */
  trackEvent?: (event: string, payload?: Record<string, unknown>) => void;
}

export function useFPSMonitor({
  enabled = true,
  onDegrade,
  trackEvent,
}: UseFPSMonitorOptions = {}): FPSMonitorState {
  const [state, setState] = useState<FPSMonitorState>({
    currentFPS: 60,
    averageFPS: 60,
    isPerformanceDegraded: false,
    degradeEffects: () => {},
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const lowFPSStartRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const hasDegradedRef = useRef(false);

  const degradeEffects = useCallback(() => {
    if (hasDegradedRef.current) return;
    hasDegradedRef.current = true;

    setState((prev) => ({
      ...prev,
      isPerformanceDegraded: true,
    }));

    trackEvent?.(ANALYTICS_EVENTS.performanceDegraded, {
      fps_at_trigger: state.currentFPS,
    });

    onDegrade?.();
  }, [state.currentFPS, trackEvent, onDegrade]);

  useEffect(() => {
    if (!enabled) return;

    const measureFPS = (timestamp: number) => {
      const delta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      if (delta > 0) {
        const fps = 1000 / delta;
        frameTimesRef.current.push(fps);

        // Keep last 60 frames for average
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }

        // Calculate average FPS
        const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;

        // Check for performance degradation
        if (avgFPS < PERFORMANCE_THRESHOLDS.minAcceptableFPS) {
          if (lowFPSStartRef.current === null) {
            lowFPSStartRef.current = timestamp;
          } else {
            const lowFPSDuration = (timestamp - lowFPSStartRef.current) / 1000;
            if (lowFPSDuration >= PERFORMANCE_THRESHOLDS.degradationTriggerSeconds) {
              degradeEffects();
            }
          }
        } else {
          lowFPSStartRef.current = null;
        }

        setState((prev) => ({
          ...prev,
          currentFPS: Math.round(fps),
          averageFPS: Math.round(avgFPS),
          degradeEffects,
        }));
      }

      rafIdRef.current = requestAnimationFrame(measureFPS);
    };

    rafIdRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled, degradeEffects]);

  return state;
}

export default useFPSMonitor;
