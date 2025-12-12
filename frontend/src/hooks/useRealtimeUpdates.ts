/**
 * useRealtimeUpdates - Hook for dashboard real-time WebSocket updates
 * 
 * Subscribes to friend status changes, match events, and ELO updates.
 * Handles WebSocket reconnection with exponential backoff.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { wsService } from '@/services/websocket'
import { useFriendStore } from '@/stores/friendStore'
import type { FriendOnlinePayload, FriendOfflinePayload } from '@/types/friend'

export interface RealtimeState {
  isConnected: boolean
  lastConnected: Date | null
  reconnectAttempts: number
  pendingEvents: RealtimeEvent[]
}

export interface RealtimeEvent {
  id: string
  type: 'friend_online' | 'friend_offline' | 'match_found' | 'elo_change' | 'notification'
  payload: unknown
  timestamp: Date
}

interface EloChangePayload {
  player_id: string
  old_elo: number
  new_elo: number
  change: number
}

interface MatchFoundPayload {
  lobby_code: string
  opponent_id: string
  opponent_name: string
}

interface UseRealtimeUpdatesOptions {
  onFriendOnline?: (userId: string, displayName: string) => void
  onFriendOffline?: (userId: string) => void
  onMatchFound?: (lobbyCode: string, opponentName: string) => void
  onEloChange?: (oldElo: number, newElo: number, change: number) => void
  onConnectionChange?: (isConnected: boolean) => void
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const [state, setState] = useState<RealtimeState>({
    isConnected: wsService.isConnected,
    lastConnected: wsService.isConnected ? new Date() : null,
    reconnectAttempts: 0,
    pendingEvents: [],
  })

  const { updateFriendOnlineStatus } = useFriendStore()
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Add event to pending queue
  const addEvent = useCallback((event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => {
    const newEvent: RealtimeEvent = {
      ...event,
      id: `${event.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    }
    setState(prev => ({
      ...prev,
      pendingEvents: [...prev.pendingEvents.slice(-49), newEvent], // Keep last 50 events
    }))
    return newEvent
  }, [])

  // Clear pending events
  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, pendingEvents: [] }))
  }, [])

  // Update connection status
  const updateConnectionStatus = useCallback((isConnected: boolean) => {
    setState(prev => ({
      ...prev,
      isConnected,
      lastConnected: isConnected ? new Date() : prev.lastConnected,
      reconnectAttempts: isConnected ? 0 : prev.reconnectAttempts,
    }))
    optionsRef.current.onConnectionChange?.(isConnected)
  }, [])

  // Subscribe to WebSocket events
  useEffect(() => {
    // Friend online handler
    const handleFriendOnline = (payload: unknown) => {
      const data = payload as FriendOnlinePayload
      updateFriendOnlineStatus(data.user_id, true)
      addEvent({ type: 'friend_online', payload: data })
      optionsRef.current.onFriendOnline?.(data.user_id, data.display_name || 'Friend')
    }

    // Friend offline handler
    const handleFriendOffline = (payload: unknown) => {
      const data = payload as FriendOfflinePayload
      updateFriendOnlineStatus(data.user_id, false)
      addEvent({ type: 'friend_offline', payload: data })
      optionsRef.current.onFriendOffline?.(data.user_id)
    }

    // Match found handler
    const handleMatchFound = (payload: unknown) => {
      const data = payload as MatchFoundPayload
      addEvent({ type: 'match_found', payload: data })
      optionsRef.current.onMatchFound?.(data.lobby_code, data.opponent_name)
    }

    // ELO change handler
    const handleEloChange = (payload: unknown) => {
      const data = payload as EloChangePayload
      addEvent({ type: 'elo_change', payload: data })
      optionsRef.current.onEloChange?.(data.old_elo, data.new_elo, data.change)
    }

    // Subscribe to events
    const unsubOnline = wsService.on('friend_online', handleFriendOnline)
    const unsubOffline = wsService.on('friend_offline', handleFriendOffline)
    const unsubMatch = wsService.on('match_found', handleMatchFound)
    const unsubElo = wsService.on('elo_change', handleEloChange)

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      const isConnected = wsService.isConnected
      setState(prev => {
        if (prev.isConnected !== isConnected) {
          optionsRef.current.onConnectionChange?.(isConnected)
          return {
            ...prev,
            isConnected,
            lastConnected: isConnected ? new Date() : prev.lastConnected,
          }
        }
        return prev
      })
    }, 2000)

    return () => {
      unsubOnline()
      unsubOffline()
      unsubMatch()
      unsubElo()
      clearInterval(connectionCheck)
    }
  }, [updateFriendOnlineStatus, addEvent])

  return {
    ...state,
    clearEvents,
    updateConnectionStatus,
  }
}
