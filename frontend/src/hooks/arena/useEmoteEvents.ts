/**
 * useEmoteEvents - Hook for emote WebSocket event handling
 * Subscribes to emote_triggered events and provides callback setters
 * 
 * Requirements: 5.1, 5.3, 5.4
 */

import { useEffect, useCallback, useRef } from 'react'
import { wsService } from '@/services/websocket'
import type { EmoteTriggeredPayload } from '@/types/websocket'
import type { Vector2 } from './types'

interface EmoteEventCallbacks {
  onRemoteEmote?: (playerId: string, emoteId: string, position: Vector2) => void
}

export function useEmoteEvents(lobbyCode?: string, localPlayerId?: string) {
  const callbacksRef = useRef<EmoteEventCallbacks>({})

  // Subscribe to emote_triggered events from server
  useEffect(() => {
    if (!lobbyCode) return

    // Handle opponent emote trigger (Requirement 5.3)
    const unsubEmoteTriggered = wsService.on('emote_triggered', (payload) => {
      const data = payload as EmoteTriggeredPayload
      
      // Only handle opponent emotes, not our own
      if (data.player_id !== localPlayerId) {
        callbacksRef.current.onRemoteEmote?.(
          data.player_id,
          data.emote_id,
          { x: 0, y: 0 } // Position will be updated by the callback handler
        )
      }
    })

    return () => {
      unsubEmoteTriggered()
    }
  }, [lobbyCode, localPlayerId])

  // Set callback for remote emote events
  const setRemoteEmoteCallback = useCallback(
    (callback: (playerId: string, emoteId: string, position: Vector2) => void) => {
      callbacksRef.current.onRemoteEmote = callback
    },
    []
  )

  // Send emote trigger to server (Requirement 5.1)
  const sendEmote = useCallback((emoteId: string) => {
    wsService.sendEmote(emoteId)
  }, [])

  return {
    sendEmote,
    setRemoteEmoteCallback,
  }
}
