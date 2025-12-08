/**
 * useScrollAnimation - Intersection Observer hook for scroll animations
 * Tracks element visibility and animation state
 * 
 * Validates: Requirements 3.2, 3.7, 3.8
 */

import { useState, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { ScrollAnimationState } from '@/components/landing/types'

interface UseScrollAnimationOptions {
  threshold?: number      // 0-1, percentage visible to trigger
  rootMargin?: string     // CSS margin around root
  resetOnExit?: boolean   // Reset animation state when element exits
  once?: boolean          // Only animate once
}

const defaultOptions: UseScrollAnimationOptions = {
  threshold: 0.2,
  rootMargin: '0px',
  resetOnExit: false,
  once: false,
}

export function useScrollAnimation(
  ref: RefObject<HTMLElement | null>,
  options: UseScrollAnimationOptions = {}
): ScrollAnimationState {
  const mergedOptions = { ...defaultOptions, ...options }
  
  const [state, setState] = useState<ScrollAnimationState>({
    isVisible: false,
    progress: 0,
    hasAnimated: false,
  })
  
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const isVisible = entry.isIntersecting
        const progress = Math.min(1, Math.max(0, entry.intersectionRatio / (mergedOptions.threshold || 0.2)))

        setState((prev) => {
          // If already animated and once is true, don't update
          if (prev.hasAnimated && mergedOptions.once) {
            return prev
          }

          // Element entering viewport
          if (isVisible && !prev.isVisible) {
            return {
              isVisible: true,
              progress,
              hasAnimated: true,
            }
          }

          // Element exiting viewport
          if (!isVisible && prev.isVisible) {
            if (mergedOptions.resetOnExit) {
              return {
                isVisible: false,
                progress: 0,
                hasAnimated: prev.hasAnimated,
              }
            }
            return {
              ...prev,
              isVisible: false,
            }
          }

          // Update progress while visible
          if (isVisible) {
            return {
              ...prev,
              progress,
            }
          }

          return prev
        })
      },
      {
        threshold: [0, mergedOptions.threshold || 0.2, 0.5, 1],
        rootMargin: mergedOptions.rootMargin,
      }
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [ref, mergedOptions.threshold, mergedOptions.rootMargin, mergedOptions.resetOnExit, mergedOptions.once])

  return state
}
