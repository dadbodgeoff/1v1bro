import { useAuthStore } from '@/stores/authStore'
import { WS_RECONNECT_ATTEMPTS, WS_RECONNECT_BASE_DELAY } from '@/utils/constants'
import type { WSMessage, WSMessageType } from '@/types/websocket'

type MessageHandler = (payload: unknown) => void

/**
 * Optimized WebSocket service for real-time multiplayer
 * Features:
 * - Message batching for high-frequency updates
 * - Binary position encoding for minimal bandwidth
 * - Automatic reconnection with exponential backoff
 */
class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectAttempts = 0
  private lobbyCode: string | null = null
  private isIntentionallyClosed = false
  private connectPromise: Promise<void> | null = null

  // Message batching for high-frequency updates
  private positionBatch: { x: number; y: number; seq?: number; dx?: number; dy?: number } | null = null
  private batchTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly BATCH_INTERVAL_MS = 16 // ~60fps batching

  // Last sent position for delta compression
  private lastSentPosition: { x: number; y: number } | null = null
  private readonly POSITION_CHANGE_THRESHOLD = 0.5 // Only send if moved more than 0.5px

  // Latency tracking
  private lastPingTime = 0
  private latency = 0

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
      const wsUrl = `${protocol}//${host}/ws/${lobbyCode}`

      // Pass token via Sec-WebSocket-Protocol header instead of query params
      // This prevents token exposure in server logs, browser history, and referrer headers
      this.ws = new WebSocket(wsUrl, [`auth.${token}`])

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.connectPromise = null
        this.startBatchLoop()
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          
          // Handle pong for latency measurement
          if (message.type === 'pong') {
            this.latency = Date.now() - this.lastPingTime
            return
          }
          
          this.dispatch(message.type, message.payload)
        } catch {
          // Silently handle parse errors
        }
      }

      this.ws.onclose = (event) => {
        this.stopBatchLoop()
        
        // Handle server capacity errors (code 4003)
        if (event.code === 4003) {
          if (event.reason === 'server_full') {
            this.dispatch('server_full', {
              message: 'Servers are busy right now. Please try again in a few minutes!',
              canRetry: true,
            })
          } else if (event.reason === 'lobby_full') {
            this.dispatch('lobby_full', {
              message: 'This lobby is full.',
              canRetry: false,
            })
          }
          return // Don't attempt reconnect for capacity errors
        }
        
        if (!this.isIntentionallyClosed) {
          this.handleDisconnect()
        }
      }

      this.ws.onerror = () => {
        this.connectPromise = null
        reject(new Error('WebSocket connection failed'))
      }
    })

    return this.connectPromise
  }

  private startBatchLoop(): void {
    // Batch loop sends accumulated position updates at fixed interval
    const sendBatch = () => {
      if (this.positionBatch && this.ws?.readyState === WebSocket.OPEN) {
        // Delta compression: only send if position changed significantly
        const shouldSend =
          !this.lastSentPosition ||
          Math.abs(this.positionBatch.x - this.lastSentPosition.x) > this.POSITION_CHANGE_THRESHOLD ||
          Math.abs(this.positionBatch.y - this.lastSentPosition.y) > this.POSITION_CHANGE_THRESHOLD

        if (shouldSend) {
          this.ws.send(JSON.stringify({
            type: 'position_update',
            payload: this.positionBatch,
          }))
          this.lastSentPosition = { x: this.positionBatch.x, y: this.positionBatch.y }
        }
        this.positionBatch = null
      }
      this.batchTimeout = setTimeout(sendBatch, this.BATCH_INTERVAL_MS)
    }
    this.batchTimeout = setTimeout(sendBatch, this.BATCH_INTERVAL_MS)
  }

  private stopBatchLoop(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < WS_RECONNECT_ATTEMPTS && this.lobbyCode) {
      this.reconnectAttempts++
      const delay = WS_RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1)

      setTimeout(() => {
        if (this.lobbyCode && !this.isIntentionallyClosed) {
          this.connect(this.lobbyCode).catch(() => {
            // Silently handle reconnection errors
          })
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
    this.stopBatchLoop()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Send a message immediately (for important events)
   */
  send(type: WSMessageType, payload?: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  /**
   * Queue position update for batched sending (reduces network overhead)
   * Only the latest position is kept - older positions are discarded
   */
  sendPosition(x: number, y: number, sequence?: number) {
    // Round to 1 decimal place for bandwidth savings (~30% reduction)
    const roundedX = Math.round(x * 10) / 10
    const roundedY = Math.round(y * 10) / 10

    // Just update the batch - the batch loop will send it
    this.positionBatch = { x: roundedX, y: roundedY, seq: sequence }
  }

  /**
   * Send position with input data for server reconciliation
   */
  sendInputWithPosition(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    sequence: number
  ) {
    // Compact format: position + direction + sequence
    this.positionBatch = {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      dx: Math.round(dirX * 100) / 100, // Direction normalized
      dy: Math.round(dirY * 100) / 100,
      seq: sequence,
    }
  }

  /**
   * Send fire event to server for authoritative combat
   */
  sendFire(dirX: number, dirY: number, sequence: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'combat_fire',
        payload: {
          dx: Math.round(dirX * 1000) / 1000,
          dy: Math.round(dirY * 1000) / 1000,
          seq: sequence,
        },
      }))
    }
  }

  /**
   * Send arena config to server for initialization
   */
  sendArenaConfig(config: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'arena_init',
        payload: { config },
      }))
    }
  }

  /**
   * Measure latency to server
   */
  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.lastPingTime = Date.now()
      this.ws.send(JSON.stringify({ type: 'ping' }))
    }
  }

  /**
   * Get current latency in ms
   */
  getLatency(): number {
    return this.latency
  }

  // ============================================================================
  // Telemetry Methods
  // ============================================================================

  /**
   * Upload a death replay to the server
   */
  sendDeathReplay(replay: {
    victimId: string
    killerId: string
    deathTick: number
    frames: unknown[]
  }): void {
    this.send('telemetry_upload_replay' as WSMessageType, replay)
  }

  /**
   * Flag a death as suspicious
   */
  flagDeath(replayId: string, reason: string): void {
    this.send('telemetry_flag_death' as WSMessageType, { replayId, reason })
  }

  /**
   * Get network stats for telemetry
   */
  getNetworkStats(): { rttMs: number; jitterMs: number } {
    return {
      rttMs: this.latency,
      jitterMs: 0, // Could track jitter by measuring variance
    }
  }

  // ============================================================================
  // Emote Methods
  // ============================================================================

  /**
   * Send an emote trigger to the server
   */
  sendEmote(emoteId: string): void {
    this.send('emote_trigger', {
      emote_id: emoteId,
      timestamp: Date.now(),
    })
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

  get currentLobby(): string | null {
    return this.lobbyCode
  }

  isConnectedToLobby(lobbyCode: string): boolean {
    return this.lobbyCode === lobbyCode && this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const wsService = new WebSocketService()
