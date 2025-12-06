/**
 * useParallax - Scroll-based parallax offset calculation
 * Returns offset value based on scroll position and parallax factor
 * 
 * Validates: Requirements 1.10
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export function useParallax(factor: number = 0.3): number {
  const [offset, setOffset] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastScrollRef = useRef(0)

  const updateOffset = useCallback(() => {
    const scrollY = window.scrollY
    
    // Only update if scroll position changed
    if (scrollY !== lastScrollRef.current) {
      lastScrollRef.current = scrollY
      setOffset(scrollY * factor)
    }
    
    rafRef.current = null
  }, [factor])

  useEffect(() => {
    const handleScroll = () => {
      // Throttle to 60fps using requestAnimationFrame
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(updateOffset)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial calculation
    updateOffset()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [updateOffset])

  return offset
}
