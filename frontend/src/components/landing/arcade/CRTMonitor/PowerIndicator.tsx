/**
 * PowerIndicator - Animated LED indicator for CRT monitor
 * 
 * Displays a glowing LED that pulses when powered on.
 * Uses brand orange color.
 * 
 * @module landing/arcade/CRTMonitor/PowerIndicator
 * Requirements: 1.5
 */

import { cn } from '@/utils/helpers';
import { ARCADE_COLORS } from '../constants';
import type { PowerIndicatorProps } from '../types';
import '../styles/arcade.css';

export function PowerIndicator({
  isOn = false,
  color = ARCADE_COLORS.ledOn,
  glowColor = ARCADE_COLORS.ledGlow,
}: PowerIndicatorProps) {
  return (
    <div
      className={cn('power-led', isOn && 'power-led--on')}
      style={{
        '--arcade-led-on': color,
        '--arcade-led-glow': glowColor,
      } as React.CSSProperties}
      role="status"
      aria-label={isOn ? 'Power on' : 'Power off'}
    />
  );
}

export default PowerIndicator;
