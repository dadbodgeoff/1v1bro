/**
 * Scanlines - Horizontal line overlay for CRT effect
 * 
 * CSS-based scanlines with configurable intensity.
 * 
 * @module landing/arcade/CRTEffects/Scanlines
 * Requirements: 3.1
 */

import { cn } from '@/utils/helpers';
import type { ScanlinesProps } from '../types';
import '../styles/arcade.css';

export function Scanlines({ intensity = 0.15, enabled = true }: ScanlinesProps) {
  if (!enabled) return null;

  return (
    <div
      className={cn('crt-scanlines', intensity < 0.1 && 'crt-scanlines--light')}
      style={{
        '--arcade-scanline-color': `rgba(0, 0, 0, ${intensity})`,
      } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}

export default Scanlines;
