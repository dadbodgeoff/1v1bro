/**
 * useCountdown Hook - 2025 Design System
 * Requirements: 3.9
 *
 * Countdown timer hook for limited items.
 * Returns days, hours, minutes, seconds.
 * Updates every second.
 */

import { useState, useEffect, useMemo } from 'react'

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
  formatted: string
}

export function useCountdown(targetDate: Date | null): CountdownResult | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!targetDate) return

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return useMemo(() => {
    if (!targetDate) return null

    const target = targetDate.getTime()
    const diff = Math.max(0, target - now)
    const totalSeconds = Math.floor(diff / 1000)

    if (totalSeconds <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: 'Expired',
      }
    }

    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    // Format string
    let formatted: string
    if (days > 0) {
      formatted = `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`
    } else {
      formatted = `${seconds}s`
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      isExpired: false,
      formatted,
    }
  }, [targetDate, now])
}

/**
 * Format countdown for display.
 */
export function formatCountdown(countdown: CountdownResult | null): string {
  if (!countdown) return ''
  return countdown.formatted
}

/**
 * Check if countdown is ending soon (< 24 hours).
 */
export function isEndingSoon(countdown: CountdownResult | null): boolean {
  if (!countdown) return false
  return countdown.totalSeconds > 0 && countdown.totalSeconds < 86400
}

/**
 * Check if countdown is critical (< 1 hour).
 */
export function isCritical(countdown: CountdownResult | null): boolean {
  if (!countdown) return false
  return countdown.totalSeconds > 0 && countdown.totalSeconds < 3600
}
