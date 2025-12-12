/**
 * CRTScreen - Screen container with CRT effects
 * 
 * Wraps content within the CRT bezel with proper aspect ratio
 * and optional barrel distortion effect.
 * 
 * @module landing/arcade/CRTMonitor/CRTScreen
 * Requirements: 1.4, 3.4
 */

import { cn } from '@/utils/helpers';
import type { CRTScreenProps } from '../types';
import '../styles/arcade.css';

export function CRTScreen({
  children,
  barrelDistortion = false,
  distortionMode = 'css-border-radius-hack',
}: CRTScreenProps) {
  // SVG filter for barrel distortion (when supported)
  const svgFilter = distortionMode === 'svg-filter' && barrelDistortion;
  const cssDistortion = distortionMode === 'css-border-radius-hack' && barrelDistortion;

  return (
    <>
      {/* SVG Filter Definition (hidden) */}
      {svgFilter && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="barrel-distortion" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="blur" />
              <feDisplacementMap
                in="blur"
                in2="SourceGraphic"
                scale="2"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      <div
        className={cn(
          'crt-screen-container',
          cssDistortion && 'crt-barrel-distortion',
          svgFilter && 'crt-barrel-distortion-svg'
        )}
        role="region"
        aria-label="Game screen"
      >
        {children}
        
        {/* Glass glare/reflection for curved CRT illusion */}
        <div className="crt-screen-reflection" aria-hidden="true" />
      </div>
    </>
  );
}

export default CRTScreen;
