/**
 * useTTS - Text-to-Speech hook using Web Speech API
 * 
 * Reads quiz questions aloud to players.
 * Respects user preference stored in localStorage.
 * 
 * Usage:
 *   const { speak, stop, isSpeaking, enabled, setEnabled } = useTTS()
 *   speak("What year did Fortnite release?")
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'tts_enabled'

interface UseTTSOptions {
  /** Speech rate (0.1 to 10, default 1.1 for slightly faster) */
  rate?: number
  /** Speech pitch (0 to 2, default 1) */
  pitch?: number
  /** Preferred voice name (will try to match) */
  voiceName?: string
}

export function useTTS(options: UseTTSOptions = {}) {
  const { rate = 1.1, pitch = 1, voiceName } = options
  
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  // Check browser support and load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false)
      return
    }
    
    setIsSupported(true)
    
    // Load voices (may be async in some browsers)
    const loadVoices = () => {
      voicesRef.current = speechSynthesis.getVoices()
    }
    
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [])

  // Persist enabled state
  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
    
    // Stop any current speech when disabling
    if (!value && typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Find best voice (prefer English, natural-sounding)
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current
    if (!voices.length) return null
    
    // If specific voice requested, try to find it
    if (voiceName) {
      const match = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()))
      if (match) return match
    }
    
    // Prefer: English, not "Google" prefix (those are robotic), female voices tend to be clearer
    const englishVoices = voices.filter(v => v.lang.startsWith('en'))
    
    // Try to find a good quality voice
    const preferred = englishVoices.find(v => 
      !v.name.startsWith('Google') && 
      (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel'))
    )
    if (preferred) return preferred
    
    // Fall back to any English voice
    if (englishVoices.length) return englishVoices[0]
    
    // Last resort: any voice
    return voices[0]
  }, [voiceName])

  // Speak text
  const speak = useCallback((text: string) => {
    if (!enabled || !isSupported || !text) return
    
    // Cancel any ongoing speech
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    
    const voice = getVoice()
    if (voice) utterance.voice = voice
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }, [enabled, isSupported, rate, pitch, getVoice])

  // Stop speaking
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    enabled,
    setEnabled,
    isSupported,
  }
}
