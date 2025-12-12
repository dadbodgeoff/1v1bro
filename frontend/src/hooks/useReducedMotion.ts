/**
 * useReducedMotion - Detects user's motion preference
 * Returns true if user prefers reduced motion
 * 
 * **Feature: ui-polish-8-of-10, Property 9: Reduced motion disables animations**
 * **Validates: Requirements 3.4, 5.4**
 */

import { useState, useEffect } from 'react'

export interface UseReducedMotionReturn {
  prefersReducedMotion: boolean
}

export function useReducedMotion(): UseReducedMotionReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check initial value (SSR-safe)
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    
    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return { prefersReducedMotion }
}
