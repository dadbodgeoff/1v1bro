/**
 * ScreenFlicker - Occasional screen flicker effect
 * 
 * Random opacity flicker at configurable intervals.
 * Disabled when reduced motion is preferred.
 * 
 * @module landing/arcade/CRTEffects/ScreenFlicker
 * Requirements: 3.3, 3.5, 6.8
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/helpers';
import { ANIMATION_CHOREOGRAPHY } from '../constants';
import type { ScreenFlickerProps } from '../types';
import '../styles/arcade.css';

export function ScreenFlicker({
  enabled = true,
  frequency = ANIMATION_CHOREOGRAPHY.flicker.minInterval / 1000,
}: ScreenFlickerProps) {
  const [isFlickering, setIsFlickering] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const scheduleFlicker = () => {
      // Random interval between min and max
      const minInterval = ANIMATION_CHOREOGRAPHY.flicker.minInterval;
      const maxInterval = ANIMATION_CHOREOGRAPHY.flicker.maxInterval;
      const interval = minInterval + Math.random() * (maxInterval - minInterval);

      timeoutRef.current = setTimeout(() => {
        setIsFlickering(true);

        // Reset after flicker duration
        setTimeout(() => {
          setIsFlickering(false);
          scheduleFlicker();
        }, ANIMATION_CHOREOGRAPHY.flicker.duration);
      }, interval);
    };

    scheduleFlicker();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, frequency]);

  if (!enabled) return null;

  return (
    <div
      className={cn('crt-flicker', isFlickering && 'crt-flicker--active')}
      aria-hidden="true"
    />
  );
}

export default ScreenFlicker;
