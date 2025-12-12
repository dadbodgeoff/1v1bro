/**
 * HyperCRTFilterPipeline - Tier-1 SVG Filter Stack
 * 
 * Advanced CRT simulation using SVG filter primitives:
 * - HDR Bloom pass (feGaussianBlur + feColorMatrix)
 * - V-Hold glitch via feDisplacementMap + feTurbulence
 * - Gamma correction via feComponentTransfer
 * - Chromatic aberration via feOffset + feBlend
 * 
 * @module landing/arcade/CRTEffects/HyperCRTFilterPipeline
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface HyperCRTFilterProps {
  /** Enable HDR bloom effect */
  enableBloom?: boolean;
  /** Bloom intensity 0-1 */
  bloomIntensity?: number;
  /** Enable V-hold glitch effect */
  enableVHold?: boolean;
  /** V-hold glitch intensity 0-1 */
  vHoldIntensity?: number;
  /** Enable chromatic aberration */
  enableChromaticAberration?: boolean;
  /** Chromatic aberration offset in pixels */
  chromaticOffset?: number;
  /** Enable gamma correction */
  enableGammaCorrection?: boolean;
  /** Gamma value (1.0 = neutral) */
  gamma?: number;
  /** Enable scanline tearing */
  enableScanlineTearing?: boolean;
  /** Reduced motion preference */
  reducedMotion?: boolean;
  /** Trigger high-energy chromatic burst */
  triggerChromaticBurst?: boolean;
}

// Unique filter IDs to avoid conflicts
const FILTER_IDS = {
  bloom: 'hyper-crt-bloom',
  vhold: 'hyper-crt-vhold',
  chromatic: 'hyper-crt-chromatic',
  gamma: 'hyper-crt-gamma',
  composite: 'hyper-crt-composite',
  displacement: 'hyper-crt-displacement-map',
} as const;

export function HyperCRTFilterPipeline({
  enableBloom = true,
  bloomIntensity = 0.6,
  enableVHold = true,
  vHoldIntensity = 0.3,
  enableChromaticAberration = true,
  chromaticOffset = 2,
  enableGammaCorrection = true,
  gamma = 1.2,
  enableScanlineTearing = true,
  reducedMotion = false,
  triggerChromaticBurst = false,
}: HyperCRTFilterProps) {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const [turbulenceSeed, setTurbulenceSeed] = useState(1);
  const [chromaticBurstOffset, setChromaticBurstOffset] = useState(0);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Animate turbulence seed for V-hold glitch effect
  const animateTurbulence = useCallback((timestamp: number) => {
    if (reducedMotion || !enableVHold) return;

    const deltaTime = timestamp - lastTimeRef.current;
    
    // Update seed every ~100ms for glitch effect
    if (deltaTime > 100) {
      lastTimeRef.current = timestamp;
      setTurbulenceSeed(Math.floor(Math.random() * 1000));
    }

    animationFrameRef.current = requestAnimationFrame(animateTurbulence);
  }, [reducedMotion, enableVHold]);

  // Start/stop turbulence animation
  useEffect(() => {
    if (!reducedMotion && enableVHold) {
      animationFrameRef.current = requestAnimationFrame(animateTurbulence);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [reducedMotion, enableVHold, animateTurbulence]);

  // Handle chromatic burst on high-energy events
  useEffect(() => {
    if (triggerChromaticBurst && !reducedMotion) {
      setChromaticBurstOffset(chromaticOffset * 3);
      const timeout = setTimeout(() => {
        setChromaticBurstOffset(0);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [triggerChromaticBurst, chromaticOffset, reducedMotion]);

  const effectiveChromaticOffset = chromaticBurstOffset || chromaticOffset;

  // Calculate gamma transfer function values
  const gammaExponent = 1 / gamma;
  
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        {/* ============================================
         * FILTER 1: HDR Bloom Pass
         * Isolates high-luminance values before blurring
         * ============================================ */}
        {enableBloom && (
          <filter
            id={FILTER_IDS.bloom}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            {/* Extract bright areas using threshold matrix */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={`
                1 0 0 0 -0.5
                0 1 0 0 -0.5
                0 0 1 0 -0.5
                0 0 0 1 0
              `}
              result="threshold"
            />
            {/* Clamp to positive values (bright areas only) */}
            <feComponentTransfer in="threshold" result="brightPass">
              <feFuncR type="linear" slope="2" intercept="0" />
              <feFuncG type="linear" slope="2" intercept="0" />
              <feFuncB type="linear" slope="2" intercept="0" />
              <feFuncA type="identity" />
            </feComponentTransfer>
            {/* Multi-pass blur for smooth bloom */}
            <feGaussianBlur
              in="brightPass"
              stdDeviation={8 * bloomIntensity}
              result="blur1"
            />
            <feGaussianBlur
              in="blur1"
              stdDeviation={16 * bloomIntensity}
              result="blur2"
            />
            {/* Tint bloom with phosphor orange */}
            <feColorMatrix
              in="blur2"
              type="matrix"
              values={`
                1.2 0 0 0 ${0.1 * bloomIntensity}
                0 0.8 0 0 ${0.05 * bloomIntensity}
                0 0 0.6 0 0
                0 0 0 ${bloomIntensity} 0
              `}
              result="tintedBloom"
            />
            {/* Composite bloom over original */}
            <feBlend
              in="SourceGraphic"
              in2="tintedBloom"
              mode="screen"
              result="bloomed"
            />
          </filter>
        )}

        {/* ============================================
         * FILTER 2: V-Hold Glitch / Scanline Tearing
         * Uses feTurbulence-driven displacement
         * ============================================ */}
        {enableVHold && enableScanlineTearing && (
          <filter
            id={FILTER_IDS.vhold}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            {/* Horizontal scanline tearing pattern */}
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.005 0.1"
              numOctaves="2"
              seed={turbulenceSeed}
              result="noise"
            />
            {/* Displacement for horizontal tearing */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={vHoldIntensity * 15}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          </filter>
        )}

        {/* ============================================
         * FILTER 3: Chromatic Aberration
         * RGB channel separation via feOffset + feBlend
         * ============================================ */}
        {enableChromaticAberration && (
          <filter
            id={FILTER_IDS.chromatic}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            {/* Extract Red channel */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            {/* Extract Green channel (stays centered) */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            {/* Extract Blue channel */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            {/* Offset Red channel left */}
            <feOffset
              in="red"
              dx={-effectiveChromaticOffset}
              dy={0}
              result="redShifted"
            />
            {/* Offset Blue channel right */}
            <feOffset
              in="blue"
              dx={effectiveChromaticOffset}
              dy={0}
              result="blueShifted"
            />
            {/* Composite channels back together */}
            <feBlend in="redShifted" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blueShifted" mode="screen" result="rgb" />
          </filter>
        )}

        {/* ============================================
         * FILTER 4: Gamma Correction
         * Crushes blacks, boosts whites for CRT contrast
         * ============================================ */}
        {enableGammaCorrection && (
          <filter id={FILTER_IDS.gamma} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              {/* Gamma curve for each channel */}
              <feFuncR type="gamma" amplitude="1" exponent={gammaExponent} offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent={gammaExponent} offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent={gammaExponent} offset="0" />
              <feFuncA type="identity" />
            </feComponentTransfer>
            {/* Crush blacks - increase contrast */}
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.1" intercept="-0.05" />
              <feFuncG type="linear" slope="1.1" intercept="-0.05" />
              <feFuncB type="linear" slope="1.1" intercept="-0.05" />
            </feComponentTransfer>
          </filter>
        )}

        {/* ============================================
         * COMPOSITE FILTER: All effects combined
         * ============================================ */}
        <filter
          id={FILTER_IDS.composite}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          {/* Start with source */}
          <feImage xlinkHref="" result="source" />
          
          {/* Apply gamma correction first */}
          {enableGammaCorrection && (
            <>
              <feComponentTransfer in="SourceGraphic" result="gammaCorrected">
                <feFuncR type="gamma" amplitude="1" exponent={gammaExponent} offset="0" />
                <feFuncG type="gamma" amplitude="1" exponent={gammaExponent} offset="0" />
                <feFuncB type="gamma" amplitude="1" exponent={gammaExponent} offset="0" />
              </feComponentTransfer>
              <feComponentTransfer in="gammaCorrected" result="contrastBoosted">
                <feFuncR type="linear" slope="1.15" intercept="-0.075" />
                <feFuncG type="linear" slope="1.15" intercept="-0.075" />
                <feFuncB type="linear" slope="1.15" intercept="-0.075" />
              </feComponentTransfer>
            </>
          )}

          {/* Bloom pass */}
          {enableBloom && (
            <>
              <feGaussianBlur
                in={enableGammaCorrection ? "contrastBoosted" : "SourceGraphic"}
                stdDeviation={12 * bloomIntensity}
                result="bloomBlur"
              />
              <feColorMatrix
                in="bloomBlur"
                type="matrix"
                values={`
                  1 0 0 0 0.05
                  0 0.7 0 0 0.02
                  0 0 0.5 0 0
                  0 0 0 ${bloomIntensity * 0.5} 0
                `}
                result="bloomTinted"
              />
              <feBlend
                in={enableGammaCorrection ? "contrastBoosted" : "SourceGraphic"}
                in2="bloomTinted"
                mode="screen"
                result="withBloom"
              />
            </>
          )}

          {/* Chromatic aberration */}
          {enableChromaticAberration && (
            <>
              <feColorMatrix
                in={enableBloom ? "withBloom" : (enableGammaCorrection ? "contrastBoosted" : "SourceGraphic")}
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="redChannel"
              />
              <feColorMatrix
                in={enableBloom ? "withBloom" : (enableGammaCorrection ? "contrastBoosted" : "SourceGraphic")}
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="greenChannel"
              />
              <feColorMatrix
                in={enableBloom ? "withBloom" : (enableGammaCorrection ? "contrastBoosted" : "SourceGraphic")}
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="blueChannel"
              />
              <feOffset in="redChannel" dx={-effectiveChromaticOffset} result="redOffset" />
              <feOffset in="blueChannel" dx={effectiveChromaticOffset} result="blueOffset" />
              <feBlend in="redOffset" in2="greenChannel" mode="screen" result="rgMerge" />
              <feBlend in="rgMerge" in2="blueOffset" mode="screen" result="withChromatic" />
            </>
          )}

          {/* V-Hold displacement (subtle, always-on) */}
          {enableVHold && !reducedMotion && (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.003 0.08"
                numOctaves="1"
                seed={turbulenceSeed}
                result="vholdNoise"
              />
              <feDisplacementMap
                in={enableChromaticAberration ? "withChromatic" : (enableBloom ? "withBloom" : "SourceGraphic")}
                in2="vholdNoise"
                scale={vHoldIntensity * 8}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </>
          )}
        </filter>

        {/* Displacement map texture for barrel distortion */}
        <radialGradient id={FILTER_IDS.displacement} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#808080" />
          <stop offset="100%" stopColor="#404040" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default HyperCRTFilterPipeline;
