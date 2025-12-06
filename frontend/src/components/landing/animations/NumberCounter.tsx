/**
 * NumberCounter - Animated number counter with easing
 * 
 * Validates: Requirements 4.1, 4.2
 */

import { useEffect, useState, useRef } from 'react'

interface NumberCounterProps {
  value: number
  duration?: number        // Animation duration in ms
  reducedMotion: boolean
  format?: (value: number) => string
}

// Ease out exponential function
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function NumberCounter({
  value,
  duration = 2000,
  reducedMotion,
  format = (v) => v.toLocaleString(),
}: NumberCounterProps) {
  const [displayValue, setDisplayValue] = useState(reducedMotion ? value : 0)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number>()
  const startValueRef = useRef(0)

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value)
      return
    }

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    startValueRef.current = displayValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)

      const currentValue = Math.round(
        startValueRef.current + (value - startValueRef.current) * easedProgress
      )
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration, reducedMotion])

  return <span>{format(displayValue)}</span>
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format time ago (e.g., "2m ago", "1h ago")
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
