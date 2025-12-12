/**
 * useOfflineStatus - Network status tracking and offline support
 * 
 * Features:
 * - Monitor navigator.onLine status
 * - Track lastOnline timestamp
 * - Manage cached data for offline display
 * - Track data staleness per widget
 * - Trigger refresh on reconnection
 * 
 * Requirements: 10.3, 10.4, 10.5
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface OfflineState {
  isOffline: boolean
  lastOnline: Date | null
  wasOffline: boolean
  staleness: Record<string, Date>
}

export interface UseOfflineStatusOptions {
  onOnline?: () => void
  onOffline?: () => void
  staleThresholdMs?: number
}

const DEFAULT_STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

export function useOfflineStatus(options: UseOfflineStatusOptions = {}) {
  const { staleThresholdMs = DEFAULT_STALE_THRESHOLD } = options
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [state, setState] = useState<OfflineState>({
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    lastOnline: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
    wasOffline: false,
    staleness: {},
  })

  // Update staleness for a widget
  const updateStaleness = useCallback((widgetId: string) => {
    setState(prev => ({
      ...prev,
      staleness: {
        ...prev.staleness,
        [widgetId]: new Date(),
      },
    }))
  }, [])

  // Check if data is stale
  const isStale = useCallback((widgetId: string): boolean => {
    const lastUpdate = state.staleness[widgetId]
    if (!lastUpdate) return false
    return Date.now() - lastUpdate.getTime() > staleThresholdMs
  }, [state.staleness, staleThresholdMs])

  // Get staleness duration
  const getStaleDuration = useCallback((widgetId: string): number | null => {
    const lastUpdate = state.staleness[widgetId]
    if (!lastUpdate) return null
    return Date.now() - lastUpdate.getTime()
  }, [state.staleness])

  // Clear wasOffline flag
  const clearWasOffline = useCallback(() => {
    setState(prev => ({ ...prev, wasOffline: false }))
  }, [])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOffline: false,
        lastOnline: new Date(),
        wasOffline: prev.isOffline, // Track that we were offline
      }))
      optionsRef.current.onOnline?.()
    }

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOffline: true,
      }))
      optionsRef.current.onOffline?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    ...state,
    updateStaleness,
    isStale,
    getStaleDuration,
    clearWasOffline,
    staleThresholdMs,
  }
}

/**
 * Format staleness duration for display
 */
export function formatStaleDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
