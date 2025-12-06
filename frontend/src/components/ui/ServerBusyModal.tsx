/**
 * ServerBusyModal - Friendly error when servers are at capacity
 * 
 * Shows when WebSocket connection is rejected due to server_full (4003).
 * Provides retry functionality with exponential backoff.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from './Button'
import { GlassCard } from './GlassCard'

interface ServerBusyModalProps {
  isOpen: boolean
  message?: string
  canRetry?: boolean
  onRetry?: () => void
  onClose?: () => void
}

export function ServerBusyModal({
  isOpen,
  message = 'Servers are busy right now. Please try again in a few minutes!',
  canRetry = true,
  onRetry,
  onClose,
}: ServerBusyModalProps) {
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Calculate backoff delay: 5s, 10s, 20s, 30s max
  const getBackoffDelay = useCallback((attempt: number) => {
    const delays = [5, 10, 20, 30]
    return delays[Math.min(attempt, delays.length - 1)]
  }, [])

  // Handle countdown timer
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Auto-retry when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRetrying && onRetry) {
      setIsRetrying(false)
      onRetry()
    }
  }, [countdown, isRetrying, onRetry])

  const handleRetry = () => {
    if (!canRetry) return
    
    const delay = getBackoffDelay(retryCount)
    setRetryCount((prev) => prev + 1)
    setCountdown(delay)
    setIsRetrying(true)
  }

  const handleRetryNow = () => {
    setCountdown(0)
    setIsRetrying(false)
    setRetryCount((prev) => prev + 1)
    onRetry?.()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <GlassCard className="max-w-md mx-4 p-6 text-center">
        {/* Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2">
          Servers Are Busy
        </h2>

        {/* Message */}
        <p className="text-gray-300 mb-6">
          {message}
        </p>

        {/* Countdown or retry button */}
        {canRetry && (
          <div className="space-y-3">
            {countdown > 0 ? (
              <>
                <p className="text-sm text-gray-400">
                  Retrying in {countdown} seconds...
                </p>
                <Button
                  variant="secondary"
                  onClick={handleRetryNow}
                  className="w-full"
                >
                  Retry Now
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={handleRetry}
                className="w-full"
              >
                {retryCount > 0 ? 'Try Again' : 'Retry'}
              </Button>
            )}
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Go Back
          </button>
        )}

        {/* Attempt counter */}
        {retryCount > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            Attempt {retryCount} of 5
          </p>
        )}
      </GlassCard>
    </div>
  )
}
