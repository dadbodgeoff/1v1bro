/**
 * CRTEffects - Combined CRT effects layer
 * 
 * Wraps all effect components with proper z-index stacking.
 * 
 * @module landing/arcade/CRTEffects/CRTEffects
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 6.8
 */

import { Scanlines } from './Scanlines';
import { PhosphorGlow } from './PhosphorGlow';
import { ScreenFlicker } from './ScreenFlicker';
import { BarrelDistortion } from './BarrelDistortion';
import type { CRTEffectsProps } from '../types';
import '../styles/arcade.css';

export function CRTEffects({ config, reducedMotion = false }: CRTEffectsProps) {
  // Disable flicker and reduce effects when reduced motion is preferred
  const effectiveFlicker = !reducedMotion && config.flicker;
  const effectiveScanlineIntensity = reducedMotion ? 0 : config.scanlineIntensity;
  const effectiveGlowIntensity = reducedMotion ? 0 : config.glowIntensity;

  return (
    <>
      {/* SVG Filter Definitions */}
      <PhosphorGlow
        intensity={effectiveGlowIntensity}
        mode={config.phosphorGlowMode}
      />
      <BarrelDistortion
        amount={config.distortionAmount}
        mode={config.barrelDistortionMode}
      />

      {/* Screen edge glow (innermost) */}
      <div className="crt-edge-glow" aria-hidden="true" />

      {/* Vignette (darkened edges) */}
      <div className="crt-vignette" aria-hidden="true" />

      {/* RGB subpixel pattern (subtle) */}
      {!reducedMotion && (
        <div className="crt-rgb-pattern" aria-hidden="true" />
      )}

      {/* Scanlines overlay */}
      <Scanlines
        intensity={effectiveScanlineIntensity}
        enabled={config.scanlines}
      />

      {/* Glass reflection */}
      <div className="crt-glass-reflection" aria-hidden="true" />

      {/* Screen flicker (intermittent) */}
      <ScreenFlicker
        enabled={effectiveFlicker}
        frequency={config.flickerFrequency}
      />
    </>
  );
}

export default CRTEffects;
