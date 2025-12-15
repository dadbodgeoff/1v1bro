/**
 * useUISound - Hook for UI sound effects
 * 
 * Provides easy access to common UI sounds across the app.
 * Uses SynthSoundManager for procedural audio generation.
 * Respects user sound preferences.
 * 
 * Usage:
 * const { playHover, playClick, playSuccess, playError } = useUISound()
 * <button onMouseEnter={playHover} onClick={playClick}>
 */

import { useCallback, useRef, useEffect } from 'react'
import { SynthSoundManager } from '@/survival/audio/SynthSoundManager'

// Singleton sound manager instance
let soundManagerInstance: SynthSoundManager | null = null

function getSoundManager(): SynthSoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SynthSoundManager()
  }
  return soundManagerInstance
}

export interface UseUISoundOptions {
  /** Disable all sounds */
  disabled?: boolean
  /** Volume multiplier 0-1 */
  volume?: number
}

export interface UseUISoundReturn {
  /** Play hover sound (subtle blip) */
  playHover: () => void
  /** Play click/select sound */
  playClick: () => void
  /** Play success sound (purchase, claim, etc) */
  playSuccess: () => void
  /** Play error sound */
  playError: () => void
  /** Play notification sound */
  playNotification: () => void
  /** Play coin/currency sound */
  playCoin: () => void
  /** Play level up / tier up sound */
  playLevelUp: () => void
  /** Play countdown tick */
  playTick: () => void
  /** Play urgent countdown tick */
  playTickUrgent: () => void
}

export function useUISound(options: UseUISoundOptions = {}): UseUISoundReturn {
  const { disabled = false, volume = 1 } = options
  const managerRef = useRef<SynthSoundManager | null>(null)
  const initializedRef = useRef(false)

  // Initialize sound manager on first interaction
  useEffect(() => {
    if (disabled) return
    
    managerRef.current = getSoundManager()
    
    // Initialize on first user interaction
    const initOnInteraction = async () => {
      if (initializedRef.current) return
      initializedRef.current = true
      
      try {
        await managerRef.current?.initialize()
        await managerRef.current?.resume()
      } catch (e) {
        // Ignore initialization errors
      }
    }

    const events = ['click', 'touchstart', 'keydown']
    events.forEach(e => document.addEventListener(e, initOnInteraction, { once: true }))

    return () => {
      events.forEach(e => document.removeEventListener(e, initOnInteraction))
    }
  }, [disabled])

  const play = useCallback((event: string, intensity: number = 1, pitch: number = 1) => {
    if (disabled || !managerRef.current) return
    
    managerRef.current.play({
      event: event as Parameters<SynthSoundManager['play']>[0]['event'],
      intensity: intensity * volume,
      pitch,
    })
  }, [disabled, volume])

  const playHover = useCallback(() => {
    play('arcade-hover', 0.6)
  }, [play])

  const playClick = useCallback(() => {
    play('arcade-click', 0.8)
  }, [play])

  const playSuccess = useCallback(() => {
    play('quiz-correct', 0.7)
  }, [play])

  const playError = useCallback(() => {
    play('quiz-wrong', 0.6)
  }, [play])

  const playNotification = useCallback(() => {
    play('quiz-popup', 0.5)
  }, [play])

  const playCoin = useCallback(() => {
    play('collect', 0.7, 1.2)
  }, [play])

  const playLevelUp = useCallback(() => {
    play('milestone', 0.8)
  }, [play])

  const playTick = useCallback(() => {
    play('quiz-tick', 0.4)
  }, [play])

  const playTickUrgent = useCallback(() => {
    play('quiz-tick-urgent', 0.6)
  }, [play])

  return {
    playHover,
    playClick,
    playSuccess,
    playError,
    playNotification,
    playCoin,
    playLevelUp,
    playTick,
    playTickUrgent,
  }
}

/**
 * Standalone functions for use outside React components
 */
export const UISound = {
  hover: () => getSoundManager().play({ event: 'arcade-hover', intensity: 0.6 }),
  click: () => getSoundManager().play({ event: 'arcade-click', intensity: 0.8 }),
  success: () => getSoundManager().play({ event: 'quiz-correct', intensity: 0.7 }),
  error: () => getSoundManager().play({ event: 'quiz-wrong', intensity: 0.6 }),
  notification: () => getSoundManager().play({ event: 'quiz-popup', intensity: 0.5 }),
  coin: () => getSoundManager().play({ event: 'collect', intensity: 0.7, pitch: 1.2 }),
  levelUp: () => getSoundManager().play({ event: 'milestone', intensity: 0.8 }),
}
