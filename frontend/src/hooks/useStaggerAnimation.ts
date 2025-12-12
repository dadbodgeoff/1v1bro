/**
 * useStaggerAnimation - Manages staggered entry animations
 * 
 * **Feature: ui-polish-8-of-10, Property 2: Stagger delay calculation is linear**
 * **Feature: ui-polish-8-of-10, Property 12: Stagger limits concurrent animations**
 * **Validates: Requirements 1.2, 4.3**
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

export interface StaggerConfig {
  itemCount: number
  baseDelay?: number      // default: 50ms
  maxConcurrent?: number  // default: 8
  enabled?: boolean       // respects reduced motion by default
}

export interface UseStaggerReturn {
  getDelay: (index: number) => number
  isVisible: (index: number) => boolean
  triggerStagger: () => void
  visibleCount: number
}

const DEFAULT_BASE_DELAY = 50
const DEFAULT_MAX_CONCURRENT = 8

/**
 * Calculate the delay for an item at a given index
 * Property 2: delay = index * baseDelay (linear)
 */
export function calculateStaggerDelay(index: number, baseDelay: number): number {
  return index * baseDelay
}

/**
 * Calculate which items should be visible given current time and constraints
 * Property 12: at most maxConcurrent items visible simultaneously
 */
export function calculateVisibleItems(
  itemCount: number,
  elapsedMs: number,
  baseDelay: number,
  maxConcurrent: number
): Set<number> {
  const visible = new Set<number>()
  
  for (let i = 0; i < itemCount; i++) {
    const itemDelay = calculateStaggerDelay(i, baseDelay)
    if (elapsedMs >= itemDelay) {
      visible.add(i)
    }
    // Enforce maxConcurrent limit
    if (visible.size >= maxConcurrent) {
      break
    }
  }
  
  return visible
}

export function useStaggerAnimation(config: StaggerConfig): UseStaggerReturn {
  const {
    itemCount,
    baseDelay = DEFAULT_BASE_DELAY,
    maxConcurrent = DEFAULT_MAX_CONCURRENT,
    enabled = true,
  } = config

  const { prefersReducedMotion } = useReducedMotion()
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // If reduced motion or disabled, show all items immediately
  const shouldAnimate = enabled && !prefersReducedMotion

  const triggerStagger = useCallback(() => {
    if (!shouldAnimate) {
      // Show all items immediately
      const allVisible = new Set<number>()
      for (let i = 0; i < itemCount; i++) {
        allVisible.add(i)
      }
      setVisibleItems(allVisible)
      return
    }

    // Reset and start animation
    setVisibleItems(new Set())
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) return

      const elapsed = currentTime - startTimeRef.current
      const newVisible = calculateVisibleItems(itemCount, elapsed, baseDelay, maxConcurrent)
      
      setVisibleItems(newVisible)

      // Continue animation if not all items are visible
      if (newVisible.size < itemCount) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [shouldAnimate, itemCount, baseDelay, maxConcurrent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Auto-trigger on mount or when itemCount changes
  useEffect(() => {
    triggerStagger()
  }, [triggerStagger])

  const getDelay = useCallback((index: number): number => {
    if (!shouldAnimate) return 0
    return calculateStaggerDelay(index, baseDelay)
  }, [shouldAnimate, baseDelay])

  const isVisible = useCallback((index: number): boolean => {
    if (!shouldAnimate) return true
    return visibleItems.has(index)
  }, [shouldAnimate, visibleItems])

  return {
    getDelay,
    isVisible,
    triggerStagger,
    visibleCount: visibleItems.size,
  }
}
