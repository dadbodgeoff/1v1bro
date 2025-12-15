/**
 * useSurvivalAudio - React hook to connect sound system to FeedbackSystem
 * 
 * Usage:
 *   const { initialize, setMuted } = useSurvivalAudio(feedbackSystem)
 */

import { useEffect, useRef, useCallback } from 'react'
import { getSoundManager, type SoundSettings } from './SynthSoundManager'
import type { FeedbackSystem, SoundEventData } from '../effects/FeedbackSystem'

export interface UseSurvivalAudioReturn {
  initialize: () => Promise<void>
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
  getSettings: () => SoundSettings
}

export function useSurvivalAudio(
  feedbackSystem: FeedbackSystem | null
): UseSurvivalAudioReturn {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const initializedRef = useRef(false)

  // Initialize audio context (must be called after user interaction)
  const initialize = useCallback(async () => {
    if (initializedRef.current) return
    
    const soundManager = getSoundManager()
    await soundManager.initialize()
    await soundManager.resume()
    initializedRef.current = true
  }, [])

  // Connect to feedback system
  useEffect(() => {
    if (!feedbackSystem) return

    const soundManager = getSoundManager()

    // Subscribe to sound events
    const handleSound = (data: SoundEventData) => {
      soundManager.play(data)
    }

    unsubscribeRef.current = feedbackSystem.onSound(handleSound)

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [feedbackSystem])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't dispose singleton - other components may use it
    }
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    getSoundManager().setMuted(muted)
  }, [])

  const setVolume = useCallback((volume: number) => {
    getSoundManager().setSettings({ masterVolume: volume })
  }, [])

  const getSettings = useCallback(() => {
    return getSoundManager().getSettings()
  }, [])

  return {
    initialize,
    setMuted,
    setVolume,
    getSettings,
  }
}
