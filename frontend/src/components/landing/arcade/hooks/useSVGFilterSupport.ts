/**
 * useSVGFilterSupport - Detect SVG filter support
 * 
 * Detects browser support for SVG filters and iOS Safari 18 bugs.
 * Returns recommended fallback modes for each effect.
 * 
 * @module landing/arcade/hooks/useSVGFilterSupport
 * Requirements: 6.7, 10.5
 */

import { useState, useEffect } from 'react';
import type { SVGFilterSupport, BarrelDistortionMode, PhosphorGlowMode } from '../types';
import { SVG_FILTER_SUPPORT } from '../constants';

export function useSVGFilterSupport(): SVGFilterSupport {
  const [support, setSupport] = useState<SVGFilterSupport>({
    feDisplacementMap: true,
    feGaussianBlur: true,
    isIOSSafari18: false,
    recommendedBarrelMode: 'svg-filter',
    recommendedGlowMode: 'svg-filter',
  });

  useEffect(() => {
    // Detect SVG filter support
    const feDisplacementMap = SVG_FILTER_SUPPORT.feDisplacementMap;
    const feGaussianBlur = SVG_FILTER_SUPPORT.feGaussianBlur;
    const isIOSSafari18 = SVG_FILTER_SUPPORT.isIOSSafari18();

    // Determine recommended modes based on support
    let recommendedBarrelMode: BarrelDistortionMode = 'svg-filter';
    let recommendedGlowMode: PhosphorGlowMode = 'svg-filter';

    // iOS Safari 18 has feDisplacementMap bugs - use CSS fallback
    if (isIOSSafari18 || !feDisplacementMap) {
      recommendedBarrelMode = 'css-border-radius-hack';
    }

    // If feGaussianBlur not supported, use CSS box-shadow
    if (!feGaussianBlur) {
      recommendedGlowMode = 'css-box-shadow';
    }

    setSupport({
      feDisplacementMap,
      feGaussianBlur,
      isIOSSafari18,
      recommendedBarrelMode,
      recommendedGlowMode,
    });
  }, []);

  return support;
}

export default useSVGFilterSupport;
