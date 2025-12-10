/**
 * useTouch - Touch capability and gesture detection hook
 *
 * Provides touch capability detection, pointer type detection,
 * and accessibility preferences for responsive interactions.
 *
 * Features:
 * - Touch capability via ontouchstart and maxTouchPoints
 * - Pointer type detection (fine vs coarse)
 * - Reduced motion preference detection
 * - Gesture handlers for swipe detection
 *
 * @module hooks/useTouch
 * Requirements: 1.3
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ============================================
// Types
// ============================================

export interface TouchState {
  /** Whether device supports touch input */
  isTouch: boolean
  /** Whether device has fine pointer (mouse/trackpad) */
  hasFinePointer: boolean
  /** Whether device has coarse pointer (touch/stylus) */
  hasCoarsePointer: boolean
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean
  /** Whether device supports hover */
  canHover: boolean
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  velocity: number
}

export interface GestureOptions {
  /** Minimum distance in pixels to trigger swipe */
  threshold?: number
  /** Maximum time in ms for swipe gesture */
  maxTime?: number
  /** Callback when swipe is detected */
  onSwipe?: (direction: SwipeDirection) => void
  /** Callback when swipe left is detected */
  onSwipeLeft?: () => void
  /** Callback when swipe right is detected */
  onSwipeRight?: () => void
  /** Callback when swipe up is detected */
  onSwipeUp?: () => void
  /** Callback when swipe down is detected */
  onSwipeDown?: () => void
}

export interface TouchHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

// ============================================
// Detection Utilities
// ============================================

/**
 * Detect touch capability
 */
const detectTouchCapability = (): boolean => {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Detect fine pointer (mouse/trackpad)
 */
const detectFinePointer = (): boolean => {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(pointer: fine)')?.matches ?? true
}

/**
 * Detect coarse pointer (touch/stylus)
 */
const detectCoarsePointer = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(pointer: coarse)')?.matches ?? false
}

/**
 * Detect reduced motion preference
 */
const detectReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

/**
 * Detect hover capability
 */
const detectHoverCapability = (): boolean => {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(hover: hover)')?.matches ?? true
}

// ============================================
// useTouch Hook
// ============================================

/**
 * Hook for touch capability detection
 *
 * @returns TouchState with device capabilities
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTouch, prefersReducedMotion } = useTouch()
 *
 *   return (
 *     <button className={isTouch ? 'touch-target' : ''}>
 *       {prefersReducedMotion ? 'Click' : 'Tap'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useTouch(): TouchState {
  const [state, setState] = useState<TouchState>(() => ({
    isTouch: detectTouchCapability(),
    hasFinePointer: detectFinePointer(),
    hasCoarsePointer: detectCoarsePointer(),
    prefersReducedMotion: detectReducedMotion(),
    canHover: detectHoverCapability(),
  }))

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Listen for reduced motion preference changes
    const reducedMotionQuery = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({
        ...prev,
        prefersReducedMotion: e.matches,
      }))
    }

    if (reducedMotionQuery?.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
    } else if (reducedMotionQuery?.addListener) {
      reducedMotionQuery.addListener(handleReducedMotionChange)
    }

    return () => {
      if (reducedMotionQuery?.removeEventListener) {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
      } else if (reducedMotionQuery?.removeListener) {
        reducedMotionQuery.removeListener(handleReducedMotionChange)
      }
    }
  }, [])

  return state
}

// ============================================
// useTouchGesture Hook
// ============================================

interface TouchPoint {
  x: number
  y: number
  time: number
}

/**
 * Hook for touch gesture detection (swipe)
 *
 * @param options - Gesture configuration and callbacks
 * @returns Touch event handlers to attach to element
 *
 * @example
 * ```tsx
 * function Carousel() {
 *   const handlers = useTouchGesture({
 *     onSwipeLeft: () => nextSlide(),
 *     onSwipeRight: () => prevSlide(),
 *   })
 *
 *   return <div {...handlers}>Swipe me</div>
 * }
 * ```
 */
export function useTouchGesture(options: GestureOptions = {}): TouchHandlers {
  const {
    threshold = 50,
    maxTime = 300,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options

  const startPoint = useRef<TouchPoint | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }, [])

  const onTouchMove = useCallback((_e: React.TouchEvent) => {
    // Optional: track movement for visual feedback
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startPoint.current) return

      const touch = e.changedTouches[0]
      const endPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      const deltaX = endPoint.x - startPoint.current.x
      const deltaY = endPoint.y - startPoint.current.y
      const deltaTime = endPoint.time - startPoint.current.time

      // Check if gesture is within time limit
      if (deltaTime > maxTime) {
        startPoint.current = null
        return
      }

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Determine swipe direction
      let direction: SwipeDirection['direction'] = null
      let distance = 0

      if (absX > absY && absX >= threshold) {
        direction = deltaX > 0 ? 'right' : 'left'
        distance = absX
      } else if (absY > absX && absY >= threshold) {
        direction = deltaY > 0 ? 'down' : 'up'
        distance = absY
      }

      if (direction) {
        const velocity = distance / deltaTime

        const swipeData: SwipeDirection = {
          direction,
          distance,
          velocity,
        }

        onSwipe?.(swipeData)

        switch (direction) {
          case 'left':
            onSwipeLeft?.()
            break
          case 'right':
            onSwipeRight?.()
            break
          case 'up':
            onSwipeUp?.()
            break
          case 'down':
            onSwipeDown?.()
            break
        }
      }

      startPoint.current = null
    },
    [threshold, maxTime, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  )

  return useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }),
    [onTouchStart, onTouchMove, onTouchEnd]
  )
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if device is touch-capable (for non-React contexts)
 */
export function isTouchDevice(): boolean {
  return detectTouchCapability()
}

/**
 * Check if user prefers reduced motion (for non-React contexts)
 */
export function prefersReducedMotion(): boolean {
  return detectReducedMotion()
}

export default useTouch
