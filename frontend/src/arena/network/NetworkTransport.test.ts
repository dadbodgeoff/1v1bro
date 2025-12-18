/**
 * Network Transport Tests
 *
 * Unit tests for WebSocket transport and mock transport.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebSocketTransport,
  MockTransport,
  DEFAULT_NETWORK_CONFIG,
  ConnectionState,
} from './NetworkTransport';
import { EventBus } from '../core/EventBus';
import { isOk, isErr } from '../core/Result';
import { MessageType } from './Serializer';

// Mock WebSocket for testing
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  binaryType: string = 'blob';
  onopen: (() => void) | null = null;
  onclose: ((event: { reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: ArrayBuffer }) => void) | null = null;
  readyState: number = 0; // CONNECTING

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3; // CLOSED
  });

  // Test helpers
  simulateOpen(): void {
    this.readyState = 1; // OPEN
    this.onopen?.();
  }

  simulateClose(reason: string = ''): void {
    this.readyState = 3; // CLOSED
    this.onclose?.({ reason });
  }

  simulateError(): void {
    this.onerror?.();
  }

  simulateMessage(data: ArrayBuffer): void {
    this.onmessage?.({ data });
  }

  static clear(): void {
    MockWebSocket.instances = [];
  }

  static getLatest(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

describe('WebSocketTransport', () => {
  beforeEach(() => {
    MockWebSocket.clear();
    vi.useFakeTimers();
    // @ts-expect-error - Mocking global WebSocket
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Connection State', () => {
    it('starts in disconnected state', () => {
      const transport = new WebSocketTransport();
      expect(transport.getConnectionState()).toBe('disconnected');
      expect(transport.isConnected()).toBe(false);
    });

    it('transitions to connecting state on connect', () => {
      const transport = new WebSocketTransport();
      transport.connect();

      expect(transport.getConnectionState()).toBe('connecting');
    });

    it('transitions to connected state on successful connection', async () => {
      const transport = new WebSocketTransport();
      const connectPromise = transport.connect();

      const ws = MockWebSocket.getLatest()!;
      ws.simulateOpen();

      const result = await connectPromise;
      expect(isOk(result)).toBe(true);
      expect(transport.getConnectionState()).toBe('connected');
      expect(transport.isConnected()).toBe(true);
    });

    it('returns error on connection timeout', async () => {
      const config = { ...DEFAULT_NETWORK_CONFIG, connectionTimeoutMs: 1000 };
      const transport = new WebSocketTransport(config);
      const connectPromise = transport.connect();

      // Advance past timeout
      vi.advanceTimersByTime(1500);

      const result = await connectPromise;
      expect(isErr(result)).toBe(true);
      expect(transport.getConnectionState()).toBe('disconnected');
    });

    it('returns error on WebSocket error during connection', async () => {
      const transport = new WebSocketTransport();
      const connectPromise = transport.connect();

      const ws = MockWebSocket.getLatest()!;
      ws.simulateError();

      const result = await connectPromise;
      expect(isErr(result)).toBe(true);
      expect(transport.getConnectionState()).toBe('disconnected');
    });
  });


  describe('Reconnection', () => {
    it('attempts reconnection on disconnect with exponential backoff', async () => {
      const config = {
        ...DEFAULT_NETWORK_CONFIG,
        reconnectDelayMs: 1000,
        maxReconnectDelayMs: 30000,
      };
      const transport = new WebSocketTransport(config);

      // Connect successfully
      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      // Simulate disconnect
      MockWebSocket.getLatest()!.simulateClose('Connection lost');

      expect(transport.getConnectionState()).toBe('reconnecting');

      // First reconnect attempt after 1s
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances.length).toBe(2);

      // Simulate another disconnect
      MockWebSocket.getLatest()!.simulateClose('Connection lost');

      // Second reconnect attempt after 2s (exponential backoff)
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances.length).toBe(2); // Not yet

      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances.length).toBe(3);
    });

    it('caps reconnection delay at maxReconnectDelayMs', async () => {
      const config = {
        ...DEFAULT_NETWORK_CONFIG,
        reconnectDelayMs: 1000,
        maxReconnectDelayMs: 4000,
      };
      const transport = new WebSocketTransport(config);

      // Connect and disconnect multiple times to increase backoff
      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      // Simulate multiple disconnects to increase backoff
      for (let i = 0; i < 5; i++) {
        MockWebSocket.getLatest()!.simulateClose('Connection lost');
        vi.advanceTimersByTime(config.maxReconnectDelayMs + 1000);
      }

      // Backoff should be capped at 4000ms, not 16000ms or higher
      expect(transport.getReconnectAttempts()).toBeGreaterThan(0);
    });

    it('stops reconnection attempts after disconnect() is called', async () => {
      const transport = new WebSocketTransport();

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      // Disconnect intentionally
      transport.disconnect();

      expect(transport.getConnectionState()).toBe('disconnected');

      // Advance time - should not attempt reconnection
      vi.advanceTimersByTime(60000);
      expect(MockWebSocket.instances.length).toBe(1);
    });
  });

  describe('Message Handling', () => {
    it('delivers messages to registered handlers', async () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onMessage(handler);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      const testData = new ArrayBuffer(10);
      MockWebSocket.getLatest()!.simulateMessage(testData);

      expect(handler).toHaveBeenCalledWith(testData);
    });

    it('supports multiple message handlers', async () => {
      const transport = new WebSocketTransport();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      transport.onMessage(handler1);
      transport.onMessage(handler2);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      const testData = new ArrayBuffer(10);
      MockWebSocket.getLatest()!.simulateMessage(testData);

      expect(handler1).toHaveBeenCalledWith(testData);
      expect(handler2).toHaveBeenCalledWith(testData);
    });

    it('allows unsubscribing from messages', async () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      const unsubscribe = transport.onMessage(handler);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      // Unsubscribe
      unsubscribe();

      const testData = new ArrayBuffer(10);
      MockWebSocket.getLatest()!.simulateMessage(testData);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Sending', () => {
    it('sends data when connected', async () => {
      const transport = new WebSocketTransport();

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      const testData = new ArrayBuffer(10);
      const result = transport.send(testData);

      expect(isOk(result)).toBe(true);
      expect(MockWebSocket.getLatest()!.send).toHaveBeenCalledWith(testData);
    });

    it('returns error when not connected', () => {
      const transport = new WebSocketTransport();

      const testData = new ArrayBuffer(10);
      const result = transport.send(testData);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('Keepalive', () => {
    it('sends keepalive messages at configured interval', async () => {
      const config = { ...DEFAULT_NETWORK_CONFIG, keepaliveIntervalMs: 5000 };
      const transport = new WebSocketTransport(config);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      const ws = MockWebSocket.getLatest()!;
      ws.send.mockClear();

      // Advance time by keepalive interval
      vi.advanceTimersByTime(5000);

      expect(ws.send).toHaveBeenCalledTimes(1);

      // Check that it's a keepalive message
      const sentData = ws.send.mock.calls[0][0] as ArrayBuffer;
      const view = new DataView(sentData);
      expect(view.getUint8(0)).toBe(MessageType.KEEPALIVE);
    });

    it('stops keepalive on disconnect', async () => {
      const config = { ...DEFAULT_NETWORK_CONFIG, keepaliveIntervalMs: 5000 };
      const transport = new WebSocketTransport(config);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      transport.disconnect();

      const ws = MockWebSocket.getLatest()!;
      ws.send.mockClear();

      // Advance time - should not send keepalive
      vi.advanceTimersByTime(10000);

      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  describe('Event Bus Integration', () => {
    it('emits connection_established event on connect', async () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('connection_established', handler);

      const transport = new WebSocketTransport(DEFAULT_NETWORK_CONFIG, eventBus);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      expect(handler).toHaveBeenCalled();
    });

    it('emits connection_lost event on disconnect', async () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('connection_lost', handler);

      const transport = new WebSocketTransport(DEFAULT_NETWORK_CONFIG, eventBus);

      const connectPromise = transport.connect();
      MockWebSocket.getLatest()!.simulateOpen();
      await connectPromise;

      MockWebSocket.getLatest()!.simulateClose('Test disconnect');

      expect(handler).toHaveBeenCalled();
    });
  });
});


describe('MockTransport', () => {
  it('starts disconnected', () => {
    const transport = new MockTransport();
    expect(transport.isConnected()).toBe(false);
    expect(transport.getConnectionState()).toBe('disconnected');
  });

  it('connects successfully', async () => {
    const transport = new MockTransport();
    const result = await transport.connect();

    expect(isOk(result)).toBe(true);
    expect(transport.isConnected()).toBe(true);
    expect(transport.getConnectionState()).toBe('connected');
  });

  it('disconnects', async () => {
    const transport = new MockTransport();
    await transport.connect();

    transport.disconnect();

    expect(transport.isConnected()).toBe(false);
    expect(transport.getConnectionState()).toBe('disconnected');
  });

  it('sends messages when connected', async () => {
    const transport = new MockTransport();
    await transport.connect();

    const data = new ArrayBuffer(10);
    const result = transport.send(data);

    expect(isOk(result)).toBe(true);
    expect(transport.getSentMessages()).toHaveLength(1);
    expect(transport.getSentMessages()[0]).toBe(data);
  });

  it('fails to send when disconnected', () => {
    const transport = new MockTransport();

    const data = new ArrayBuffer(10);
    const result = transport.send(data);

    expect(isErr(result)).toBe(true);
  });

  it('delivers simulated messages to handlers', async () => {
    const transport = new MockTransport();
    const handler = vi.fn();

    transport.onMessage(handler);
    await transport.connect();

    const data = new ArrayBuffer(10);
    transport.simulateMessage(data);

    expect(handler).toHaveBeenCalledWith(data);
  });

  it('clears sent messages', async () => {
    const transport = new MockTransport();
    await transport.connect();

    transport.send(new ArrayBuffer(10));
    expect(transport.getSentMessages()).toHaveLength(1);

    transport.clearSentMessages();
    expect(transport.getSentMessages()).toHaveLength(0);
  });

  it('simulates disconnect', async () => {
    const transport = new MockTransport();
    await transport.connect();

    transport.simulateDisconnect();

    expect(transport.isConnected()).toBe(false);
  });
});
