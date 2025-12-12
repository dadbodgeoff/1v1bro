/**
 * useArcadeSound - Web Audio API sound synthesis hook
 * 
 * Generates retro 8-bit sounds programmatically using oscillators.
 * Manages mute state with localStorage persistence.
 * 
 * @module landing/arcade/hooks/useArcadeSound
 * Requirements: 7.1, 7.5, 7.6, 7.7, 7.8
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ArcadeSoundHook } from '../types';
import { SOUND_CONFIG } from '../constants';

const STORAGE_KEY = 'arcade-sound-muted';

export function useArcadeSound(): ArcadeSoundHook {
  const [isMuted, setIsMutedState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true'; // Default muted
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize AudioContext lazily on first user interaction
  const initAudioContext = useCallback(() => {
    if (isInitializedRef.current || typeof window === 'undefined') return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      isInitializedRef.current = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }, []);

  // Persist mute preference
  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(muted));
    }
  }, []);

  // Play a tone with optional pitch bend
  const playTone = useCallback((
    frequency: number,
    duration: number,
    gain: number,
    type: OscillatorType = 'square',
    frequencyEnd?: number
  ) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Pitch bend if specified
    if (frequencyEnd) {
      oscillator.frequency.linearRampToValueAtTime(frequencyEnd, ctx.currentTime + duration / 1000);
    }

    // Gain envelope
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, [isMuted]);

  // Play startup chime (ascending tone sequence)
  const playStartupChime = useCallback(() => {
    initAudioContext();
    if (isMuted || !audioContextRef.current) return;

    const { notes, noteDuration, gain, type } = SOUND_CONFIG.startupChime;
    
    notes?.forEach((note, index) => {
      setTimeout(() => {
        playTone(note, noteDuration!, gain, type);
      }, index * noteDuration!);
    });
  }, [isMuted, initAudioContext, playTone]);

  // Play hover blip
  const playHoverBlip = useCallback(() => {
    initAudioContext();
    if (isMuted) return;

    const { frequency, duration, gain, type } = SOUND_CONFIG.hoverBlip;
    playTone(frequency!, duration, gain, type);
  }, [isMuted, initAudioContext, playTone]);

  // Play click blip
  const playClickBlip = useCallback(() => {
    initAudioContext();
    if (isMuted) return;

    const { frequency, frequencyEnd, duration, gain, type } = SOUND_CONFIG.clickBlip;
    playTone(frequency!, duration, gain, type, frequencyEnd);
  }, [isMuted, initAudioContext, playTone]);

  // Initialize on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudioContext]);

  return {
    isMuted,
    setMuted,
    playStartupChime,
    playHoverBlip,
    playClickBlip,
  };
}

export default useArcadeSound;
