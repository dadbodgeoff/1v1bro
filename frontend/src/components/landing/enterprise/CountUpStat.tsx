/**
 * CountUpStat - Animated count-up number display
 * 
 * Animates a number from 0 to target value when scrolled into view.
 * Used for displaying stats and metrics with visual impact.
 * 
 * @module landing/enterprise/CountUpStat
 * Requirements: 4.4
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/utils/helpers'

export interface CountUpStatProps {
  /** Target number to count up to */
  value: number
  /** Duration of animation in milliseconds */
  duration?: number
  /** Prefix to display before number (e.g., "$") */
  prefix?: string
  /** Suffix to display after number (e.g., "+", "K") */
  suffix?: string
  /** Number of decimal places */
  decimals?: number
  /** Label text below the number */
  label?: string
  /** Additional CSS classes */
  className?: string
  /** Start animation immediately instead of on scroll */
  immediate?: boolean
}

export function CountUpStat({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  label,
  className,
  immediate = false,
}: CountUpStatProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Easing function for smooth animation
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4)
  }

  // Animation function
  const animate = useCallback(() => {
    if (hasAnimated) return
    
    // If reduced motion, just set the final value
    if (prefersReducedMotion) {
      setDisplayValue(value)
      setHasAnimated(true)
      return
    }

    const startTime = performance.now()
    
    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuart(progress)
      
      setDisplayValue(easedProgress * value)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayValue(value)
        setHasAnimated(true)
      }
    }
    
    animationRef.current = requestAnimationFrame(tick)
  }, [value, duration, hasAnimated, prefersReducedMotion])

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    if (immediate) {
      animate()
      return
    }

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated) {
          animate()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [immediate, animate, hasAnimated])

  // Format the display value
  const formattedValue = displayValue.toFixed(decimals)

  return (
    <div
      ref={elementRef}
      className={cn('text-center', className)}
    >
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tabular-nums">
        {prefix}
        {formattedValue}
        {suffix}
      </div>
      {label && (
        <div className="mt-2 text-sm md:text-base text-[#A1A1AA]">
          {label}
        </div>
      )}
    </div>
  )
}

export default CountUpStat
