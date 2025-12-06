/**
 * usePresence - Maintains online presence via heartbeat
 * 
 * Sends a heartbeat to the server every 30 seconds while the user is logged in.
 * This ensures users appear online even without a WebSocket connection.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { friendsAPI } from '@/services/api'

const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export function usePresence() {
  const user = useAuthStore((s) => s.user)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user) {
      // Clear interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Send initial heartbeat
    friendsAPI.heartbeat().catch(() => {
      // Silently ignore heartbeat failures
    })

    // Set up interval
    intervalRef.current = window.setInterval(() => {
      friendsAPI.heartbeat().catch(() => {
        // Silently ignore heartbeat failures
      })
    }, HEARTBEAT_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user])
}
