/**
 * BarrelDistortion - Edge curvature effect
 * 
 * SVG feDisplacementMap with CSS border-radius fallback.
 * 
 * @module landing/arcade/CRTEffects/BarrelDistortion
 * Requirements: 3.4, 6.7, 10.5
 */

import type { BarrelDistortionProps } from '../types';
import '../styles/arcade.css';

export function BarrelDistortion({
  amount = 0.02,
  mode = 'svg-filter',
}: BarrelDistortionProps) {
  if (mode === 'none') return null;

  // SVG filter definition (applied via CSS filter: url(#barrel-distortion))
  if (mode === 'svg-filter') {
    return (
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="barrel-distortion" x="-10%" y="-10%" width="120%" height="120%">
            {/* Create displacement map for barrel effect */}
            <feImage
              xlinkHref="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cdefs%3E%3CradialGradient id='g'%3E%3Cstop offset='0%25' stop-color='%23808080'/%3E%3Cstop offset='100%25' stop-color='%23606060'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100' height='100'/%3E%3C/svg%3E"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={amount * 100}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    );
  }

  // CSS fallback is applied via class in arcade.css (.crt-barrel-distortion)
  return null;
}

export default BarrelDistortion;
