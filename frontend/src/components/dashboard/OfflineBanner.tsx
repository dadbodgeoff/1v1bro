/**
 * OfflineBanner - Network status indicator component
 * 
 * Features:
 * - Display banner when offline
 * - Show "Offline - showing cached data" message
 * - Manual retry button
 * - Animate in/out smoothly
 * 
 * Requirements: 10.3
 */

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

export interface OfflineBannerProps {
  isOffline: boolean
  lastOnline?: Date | null
  onRetry?: () => void
  wasOffline?: boolean
  onDismissReconnected?: () => void
}

export function OfflineBanner({
  isOffline,
  lastOnline,
  onRetry,
  wasOffline,
  onDismissReconnected,
}: OfflineBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  // Show reconnected message briefly when coming back online
  useEffect(() => {
    if (!isOffline && wasOffline) {
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
        onDismissReconnected?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOffline, wasOffline, onDismissReconnected])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      onRetry?.()
    } finally {
      setTimeout(() => setIsRetrying(false), 1000)
    }
  }

  // Show reconnected banner
  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300"
      >
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-300">Back online! Refreshing data...</span>
      </div>
    )
  }

  // Don't show if online
  if (!isOffline) return null

  const lastOnlineText = lastOnline
    ? `Last online: ${formatLastOnline(lastOnline)}`
    : 'Connection lost'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-300">
          You're offline — showing cached data
        </span>
        <span className="text-xs text-amber-400/70 hidden sm:inline">
          ({lastOnlineText})
        </span>
      </div>
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1.5 px-3 py-1 text-sm text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Retry connection"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      )}
    </div>
  )
}

function formatLastOnline(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleTimeString()
}
