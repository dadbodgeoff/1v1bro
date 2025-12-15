/**
 * useArcadeSound - Arcade sound hook using shared SynthSoundManager
 * 
 * Integrates with the survival mode's audio system for consistent
 * sound handling and proper browser autoplay policy management.
 * 
 * @module landing/arcade/hooks/useArcadeSound
 * Requirements: 7.1, 7.5, 7.6, 7.7, 7.8
 */

import { useState, useEffect, useCallback } from 'react';
import { getSoundManager } from '@/survival/audio/SynthSoundManager';
import type { ArcadeSoundHook } from '../types';

const STORAGE_KEY = 'arcade-sound-muted';

export function useArcadeSound(): ArcadeSoundHook {
  const [isMuted, setIsMutedState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true'; // Default muted
  });

  const soundManager = getSoundManager();

  // Sync mute state with sound manager
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted, soundManager]);

  // Persist mute preference
  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    soundManager.setMuted(muted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(muted));
    }
  }, [soundManager]);

  // Play startup chime (power on + ascending notes)
  const playStartupChime = useCallback(() => {
    if (isMuted) return;
    soundManager.play({ event: 'arcade-power-on', intensity: 1 });
  }, [isMuted, soundManager]);

  // Play hover blip
  const playHoverBlip = useCallback(() => {
    if (isMuted) return;
    soundManager.play({ event: 'arcade-hover', intensity: 1 });
  }, [isMuted, soundManager]);

  // Play click blip
  const playClickBlip = useCallback(() => {
    if (isMuted) return;
    soundManager.play({ event: 'arcade-click', intensity: 1 });
  }, [isMuted, soundManager]);

  // Play boot text blip (for typing effect)
  const playBootBlip = useCallback(() => {
    if (isMuted) return;
    soundManager.play({ event: 'arcade-boot-blip', intensity: 1 });
  }, [isMuted, soundManager]);

  // Play boot line complete
  const playBootLine = useCallback(() => {
    if (isMuted) return;
    soundManager.play({ event: 'arcade-boot-line', intensity: 1 });
  }, [isMuted, soundManager]);

  // Play ready fanfare
  const playReadyFanfare = useCallback(() => {
    if (isMuted) return;
    soundManager.play({ event: 'arcade-ready', intensity: 1 });
  }, [isMuted, soundManager]);

  return {
    isMuted,
    setMuted,
    playStartupChime,
    playHoverBlip,
    playClickBlip,
    // Extended methods for boot sequence
    playBootBlip,
    playBootLine,
    playReadyFanfare,
  };
}

export default useArcadeSound;
