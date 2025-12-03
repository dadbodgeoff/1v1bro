import { useAuthStore } from '@/stores/authStore'
import { WS_RECONNECT_ATTEMPTS, WS_RECONNECT_BASE_DELAY } from '@/utils/constants'
import type { WSMessage, WSMessageType } from '@/types/websocket'

type MessageHandler = (payload: unknown) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectAttempts = 0
  private lobbyCode: string | null = null
  private isIntentionallyClosed = false
  private connectPromise: Promise<void> | null = null

  connect(lobbyCode: string): Promise<void> {
    // If already connected to this lobby, return existing connection
    if (this.lobbyCode === lobbyCode && this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    // If connection is in progress to same lobby, return that promise
    if (this.lobbyCode === lobbyCode && this.connectPromise) {
      return this.connectPromise
    }

    // Close any existing connection to different lobby
    if (this.ws && this.lobbyCode !== lobbyCode) {
      this.disconnect()
    }

    this.connectPromise = new Promise((resolve, reject) => {
      const token = useAuthStore.getState().token
      if (!token) {
        this.connectPromise = null
        reject(new Error('Not authenticated'))
        return
      }

      this.lobbyCode = lobbyCode
      this.isIntentionallyClosed = false

      // In development, connect directly to backend; in production, use same host
      const isDev = import.meta.env.DEV
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = isDev ? 'localhost:8000' : window.location.host
      const wsUrl = `${protocol}//${host}/ws/${lobbyCode}?token=${token}`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[WS] Connected to', lobbyCode)
        this.reconnectAttempts = 0
        this.connectPromise = null
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          this.dispatch(message.type, message.payload)
        } catch (e) {
          console.error('[WS] Failed to parse message:', e)
        }
      }

      this.ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason)
        if (!this.isIntentionallyClosed) {
          this.handleDisconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error)
        this.connectPromise = null
        reject(error)
      }
    })

    return this.connectPromise
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < WS_RECONNECT_ATTEMPTS && this.lobbyCode) {
      this.reconnectAttempts++
      const delay = WS_RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1)
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

      setTimeout(() => {
        if (this.lobbyCode && !this.isIntentionallyClosed) {
          this.connect(this.lobbyCode).catch(console.error)
        }
      }, delay)
    } else {
      this.dispatch('connection_lost', {})
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true
    this.lobbyCode = null
    this.connectPromise = null
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type: WSMessageType, payload?: unknown) {
    console.log('[WS] Sending:', type, 'readyState:', this.ws?.readyState)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
      console.log('[WS] Sent:', type)
    } else {
      console.warn('[WS] Not connected, cannot send:', type, 'readyState:', this.ws?.readyState)
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => this.off(type, handler)
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler)
  }

  private dispatch(type: string, payload: unknown) {
    this.handlers.get(type)?.forEach((handler) => handler(payload))
    // Also dispatch to wildcard handlers
    this.handlers.get('*')?.forEach((handler) => handler({ type, payload }))
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const wsService = new WebSocketService()
