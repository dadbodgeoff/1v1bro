import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { wsService } from './websocket'
import { useAuthStore } from '@/stores/authStore'

// Mock WebSocket
let mockWsInstance: MockWebSocket | null = null

class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number; reason: string }) => void) | null = null
  onerror: ((error: unknown) => void) | null = null

  send = vi.fn()
  close = vi.fn()

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockWsInstance = this
    this.close.mockImplementation(() => {
      this.readyState = MockWebSocket.CLOSED
    })
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ code, reason })
  }
}

describe('WebSocketService', () => {
  beforeEach(() => {
    mockWsInstance = null
    vi.stubGlobal('WebSocket', MockWebSocket)
    useAuthStore.setState({ token: 'test-token' })
  })

  afterEach(() => {
    wsService.disconnect()
    vi.unstubAllGlobals()
  })

  it('connects with token', async () => {
    const connectPromise = wsService.connect('ABC123')
    // Wait a tick for WebSocket to be created
    await new Promise((r) => setTimeout(r, 0))
    mockWsInstance?.simulateOpen()
    await connectPromise

    expect(mockWsInstance).not.toBeNull()
    expect(wsService.isConnected).toBe(true)
  })

  it('rejects connection without token', async () => {
    useAuthStore.setState({ token: null })

    await expect(wsService.connect('ABC123')).rejects.toThrow('Not authenticated')
  })

  it('sends messages when connected', async () => {
    const connectPromise = wsService.connect('ABC123')
    await new Promise((r) => setTimeout(r, 0))
    mockWsInstance?.simulateOpen()
    await connectPromise

    wsService.send('start_game')

    expect(mockWsInstance?.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'start_game', payload: undefined })
    )
  })

  it('dispatches received messages to handlers', async () => {
    const handler = vi.fn()
    wsService.on('player_joined', handler)

    const connectPromise = wsService.connect('ABC123')
    await new Promise((r) => setTimeout(r, 0))
    mockWsInstance?.simulateOpen()
    await connectPromise

    mockWsInstance?.simulateMessage({
      type: 'player_joined',
      payload: { players: [], can_start: false },
    })

    expect(handler).toHaveBeenCalledWith({ players: [], can_start: false })
  })

  it('unsubscribes handlers correctly', async () => {
    const handler = vi.fn()
    const unsubscribe = wsService.on('player_joined', handler)

    const connectPromise = wsService.connect('ABC123')
    await new Promise((r) => setTimeout(r, 0))
    mockWsInstance?.simulateOpen()
    await connectPromise

    unsubscribe()

    mockWsInstance?.simulateMessage({
      type: 'player_joined',
      payload: {},
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('disconnect closes connection', async () => {
    const connectPromise = wsService.connect('ABC123')
    await new Promise((r) => setTimeout(r, 0))
    mockWsInstance?.simulateOpen()
    await connectPromise

    wsService.disconnect()

    expect(mockWsInstance?.close).toHaveBeenCalled()
    expect(wsService.isConnected).toBe(false)
  })
})
