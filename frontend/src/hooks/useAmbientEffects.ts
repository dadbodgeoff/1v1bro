/**
 * useAmbientEffects - Hook for controlling ambient particle effects.
 * Requirements: 4.1, 4.5
 * 
 * Provides theme control, status, and auto-detection of current page for heavy page logic.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAmbientEffectRenderer,
  isHeavyPage,
  type AmbientTheme,
  type ParticleConfig,
  type RenderMode,
} from '@/systems/polish/AmbientEffectRenderer';
import { usePolishStore } from '@/stores/polishStore';

export interface UseAmbientEffectsReturn {
  // Current state
  theme: AmbientTheme;
  isActive: boolean;
  renderMode: RenderMode;
  effectiveParticleCount: number;
  config: ParticleConfig | null;
  
  // Page detection
  isHeavyPage: boolean;
  currentPath: string;
  
  // Controls
  setTheme: (theme: AmbientTheme) => void;
  setSeasonalTheme: () => void;
  
  // Settings
  isEnabled: boolean;
}

export function useAmbientEffects(): UseAmbientEffectsReturn {
  const location = useLocation();
  const { settings, performanceScore } = usePolishStore();
  
  const renderer = useMemo(() => getAmbientEffectRenderer(), []);
  
  const [theme, setThemeState] = useState<AmbientTheme>(renderer.theme);
  const [config, setConfig] = useState<ParticleConfig | null>(null);
  
  // Sync renderer with store settings
  useEffect(() => {
    renderer.setEnabled(settings.ambientEffects);
    renderer.setReducedMotion(!settings.celebrationAnimations);
    renderer.setPerformanceScore(performanceScore);
    renderer.setCurrentPath(location.pathname);
  }, [renderer, settings.ambientEffects, settings.celebrationAnimations, performanceScore, location.pathname]);
  
  // Subscribe to renderer changes
  useEffect(() => {
    const unsubTheme = renderer.onThemeChange(setThemeState);
    const unsubConfig = renderer.onConfigChange(setConfig);
    
    // Initial state
    setThemeState(renderer.theme);
    setConfig(renderer.getParticleConfig());
    
    return () => {
      unsubTheme();
      unsubConfig();
    };
  }, [renderer]);
  
  const setTheme = useCallback((newTheme: AmbientTheme) => {
    renderer.setTheme(newTheme);
  }, [renderer]);
  
  const setSeasonalTheme = useCallback(() => {
    renderer.setSeasonalTheme();
  }, [renderer]);
  
  return {
    theme,
    isActive: renderer.isActive,
    renderMode: renderer.renderMode,
    effectiveParticleCount: renderer.effectiveParticleCount,
    config,
    isHeavyPage: isHeavyPage(location.pathname),
    currentPath: location.pathname,
    setTheme,
    setSeasonalTheme,
    isEnabled: settings.ambientEffects,
  };
}

export default useAmbientEffects;
