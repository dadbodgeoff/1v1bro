/**
 * useAnimatedValue - Smooth number interpolation for progress bars and counters
 * 
 * **Feature: ui-polish-8-of-10, Property 3: Animated value stays within bounds**
 * **Validates: Requirements 1.4**
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

export interface AnimatedValueConfig {
  from: number
  to: number
  duration?: number  // default: 600ms
  easing?: 'linear' | 'ease-out' | 'ease-in' | 'ease-in-out'  // default: 'ease-out'
}

export interface UseAnimatedValueReturn {
  value: number
  isAnimating: boolean
  animate: (newValue: number) => void
}

const DEFAULT_DURATION = 600

/**
 * Easing functions
 * All return values between 0 and 1 for input t between 0 and 1
 */
export const easingFunctions = {
  linear: (t: number): number => t,
  'ease-out': (t: number): number => 1 - Math.pow(1 - t, 3),
  'ease-in': (t: number): number => Math.pow(t, 3),
  'ease-in-out': (t: number): number => 
    t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

/**
 * Interpolate between two values
 * Property 3: result is always between min(from, to) and max(from, to)
 */
export function interpolateValue(from: number, to: number, progress: number): number {
  // Clamp progress to [0, 1] to ensure bounds
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const result = from + (to - from) * clampedProgress
  
  // Extra safety: clamp result to bounds
  const minVal = Math.min(from, to)
  const maxVal = Math.max(from, to)
  return Math.max(minVal, Math.min(maxVal, result))
}

export function useAnimatedValue(config: AnimatedValueConfig): UseAnimatedValueReturn {
  const {
    from,
    to,
    duration = DEFAULT_DURATION,
    easing = 'ease-out',
  } = config

  const { prefersReducedMotion } = useReducedMotion()
  const [value, setValue] = useState(from)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const fromValueRef = useRef(from)
  const toValueRef = useRef(to)

  const easingFn = easingFunctions[easing]

  const animate = useCallback((newValue: number) => {
    // Cancel any existing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // If reduced motion, jump to final value immediately
    if (prefersReducedMotion || duration === 0) {
      setValue(newValue)
      setIsAnimating(false)
      return
    }

    // Start new animation
    fromValueRef.current = value
    toValueRef.current = newValue
    startTimeRef.current = performance.now()
    setIsAnimating(true)

    const runAnimation = (currentTime: number) => {
      if (startTimeRef.current === null) return

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easingFn(progress)
      
      const newVal = interpolateValue(fromValueRef.current, toValueRef.current, easedProgress)
      setValue(newVal)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(runAnimation)
      } else {
        setIsAnimating(false)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(runAnimation)
  }, [prefersReducedMotion, duration, easingFn, value])

  // Animate to initial 'to' value on mount
  useEffect(() => {
    if (from !== to) {
      animate(to)
    } else {
      setValue(to)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animate when 'to' changes
  useEffect(() => {
    if (to !== toValueRef.current) {
      animate(to)
    }
  }, [to, animate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    value,
    isAnimating,
    animate,
  }
}
