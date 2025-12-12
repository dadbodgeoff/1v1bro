/**
 * PhosphorGlow - Bloom effect for bright elements
 * 
 * SVG filter with CSS box-shadow fallback.
 * 
 * @module landing/arcade/CRTEffects/PhosphorGlow
 * Requirements: 3.2, 6.7
 */

import type { PhosphorGlowProps } from '../types';
import '../styles/arcade.css';

export function PhosphorGlow({ intensity = 0.4, mode = 'svg-filter' }: PhosphorGlowProps) {
  if (mode === 'none') return null;

  // SVG filter definition (applied via CSS filter: url(#phosphor-glow))
  if (mode === 'svg-filter') {
    return (
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="phosphor-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={4 * intensity} result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values={`
                1 0 0 0 0.976
                0 1 0 0 0.451
                0 0 1 0 0.086
                0 0 0 ${intensity} 0
              `}
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    );
  }

  // CSS fallback is applied via class in arcade.css
  return null;
}

export default PhosphorGlow;
