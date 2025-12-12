/**
 * useCRTEffects - CRT effects configuration hook
 * 
 * Manages effect configuration with fallback modes and auto-degradation.
 * 
 * @module landing/arcade/hooks/useCRTEffects
 * Requirements: 3.5, 6.6, 6.7, 6.8
 */

import { useState, useEffect, useCallback } from 'react';
import type { CRTEffectsConfig } from '../types';
import { CRT_DEFAULTS, CRT_DEGRADED } from '../constants';
import { useSVGFilterSupport } from './useSVGFilterSupport';
import { useReducedMotion } from './useReducedMotion';
import { useFPSMonitor } from './useFPSMonitor';

export interface UseCRTEffectsOptions {
  /** Initial config overrides */
  initialConfig?: Partial<CRTEffectsConfig>;
  /** Enable FPS monitoring */
  enableFPSMonitor?: boolean;
  /** Track analytics events */
  trackEvent?: (event: string, payload?: Record<string, unknown>) => void;
}

export interface UseCRTEffectsReturn {
  config: CRTEffectsConfig;
  setConfig: (config: Partial<CRTEffectsConfig>) => void;
  toggleScanlines: () => void;
  togglePhosphorGlow: () => void;
  toggleBarrelDistortion: () => void;
  toggleFlicker: () => void;
  isReducedMotion: boolean;
  isPerformanceDegraded: boolean;
  currentFPS: number;
}

export function useCRTEffects({
  initialConfig,
  enableFPSMonitor = true,
  trackEvent,
}: UseCRTEffectsOptions = {}): UseCRTEffectsReturn {
  const svgSupport = useSVGFilterSupport();
  const reducedMotion = useReducedMotion();
  
  // Initialize config with defaults and SVG support
  const [config, setConfigState] = useState<CRTEffectsConfig>(() => ({
    ...CRT_DEFAULTS,
    ...initialConfig,
    barrelDistortionMode: svgSupport.recommendedBarrelMode,
    phosphorGlowMode: svgSupport.recommendedGlowMode,
  }));

  // Handle performance degradation
  const handleDegrade = useCallback(() => {
    setConfigState((prev) => ({
      ...prev,
      ...CRT_DEGRADED,
    }));
  }, []);

  const fpsMonitor = useFPSMonitor({
    enabled: enableFPSMonitor && !reducedMotion,
    onDegrade: handleDegrade,
    trackEvent,
  });

  // Update config when SVG support is detected
  useEffect(() => {
    setConfigState((prev) => ({
      ...prev,
      barrelDistortionMode: svgSupport.recommendedBarrelMode,
      phosphorGlowMode: svgSupport.recommendedGlowMode,
    }));
  }, [svgSupport.recommendedBarrelMode, svgSupport.recommendedGlowMode]);

  // Apply reduced motion preferences
  useEffect(() => {
    if (reducedMotion) {
      setConfigState((prev) => ({
        ...prev,
        flicker: false,
        scanlineIntensity: 0,
        glowIntensity: 0,
      }));
    }
  }, [reducedMotion]);

  // Config setters
  const setConfig = useCallback((updates: Partial<CRTEffectsConfig>) => {
    setConfigState((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleScanlines = useCallback(() => {
    setConfigState((prev) => ({ ...prev, scanlines: !prev.scanlines }));
  }, []);

  const togglePhosphorGlow = useCallback(() => {
    setConfigState((prev) => ({ ...prev, phosphorGlow: !prev.phosphorGlow }));
  }, []);

  const toggleBarrelDistortion = useCallback(() => {
    setConfigState((prev) => ({ ...prev, barrelDistortion: !prev.barrelDistortion }));
  }, []);

  const toggleFlicker = useCallback(() => {
    setConfigState((prev) => ({ ...prev, flicker: !prev.flicker }));
  }, []);

  return {
    config,
    setConfig,
    toggleScanlines,
    togglePhosphorGlow,
    toggleBarrelDistortion,
    toggleFlicker,
    isReducedMotion: reducedMotion,
    isPerformanceDegraded: fpsMonitor.isPerformanceDegraded,
    currentFPS: fpsMonitor.currentFPS,
  };
}

export default useCRTEffects;
