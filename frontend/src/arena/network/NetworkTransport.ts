/**
 * Network Transport Layer
 *
 * Layer 2: Networking - WebSocket-based transport with reconnection support.
 * Handles connection management, keepalive, and exponential backoff reconnection.
 */

import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';
import type { IEventBus } from '../core/EventBus';
import { MessageType } from './Serializer';

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** WebSocket server URL */
  readonly serverUrl: string;
  /** Interval between keepalive messages in ms */
  readonly keepaliveIntervalMs: number;
  /** Initial reconnection delay in ms */
  readonly reconnectDelayMs: number;
  /** Maximum reconnection delay in ms */
  readonly maxReconnectDelayMs: number;
  /** Connection timeout in ms */
  readonly connectionTimeoutMs: number;
}

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  serverUrl: 'ws://localhost:8080',
  keepaliveIntervalMs: 5000,
  reconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  connectionTimeoutMs: 10000,
};

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Network transport interface
 */
export interface INetworkTransport {
  /** Initiate connection to server */
  connect(): Promise<Result<void, string>>;
  /** Disconnect from server */
  disconnect(): void;
  /** Send binary data to server */
  send(data: ArrayBuffer): Result<void, string>;
  /** Register a message handler, returns unsubscribe function */
  onMessage(handler: (data: ArrayBuffer) => void): () => void;
  /** Check if currently connected */
  isConnected(): boolean;
  /** Get current connection state */
  getConnectionState(): ConnectionState;
}

/**
 * WebSocket-based network transport
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Keepalive messages to detect connection loss
 * - Event bus integration for connection state changes
 */
export class WebSocketTransport implements INetworkTransport {
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private messageHandlers: Set<(data: ArrayBuffer) => void> = new Set();
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect: boolean = true;
  private readonly config: NetworkConfig;
  private readonly eventBus?: IEventBus;

  constructor(
    config: NetworkConfig = DEFAULT_NETWORK_CONFIG,
    eventBus?: IEventBus
  ) {
    this.config = config;
    this.eventBus = eventBus;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<Result<void, string>> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return Ok(undefined);
    }

    this.shouldReconnect = true;
    this.state = 'connecting';

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.socket?.close();
        this.state = 'disconnected';
        resolve(Err('Connection timeout'));
      }, this.config.connectionTimeoutMs);

      try {
        this.socket = new WebSocket(this.config.serverUrl);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
          clearTimeout(timeout);
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.startKeepalive();
          this.eventBus?.emit({
            type: 'connection_established',
            timestamp: Date.now(),
            playerId: 0,
            rtt: 0,
          });
          resolve(Ok(undefined));
        };

        this.socket.onclose = (event) => {
          clearTimeout(timeout);
          this.handleDisconnect(event.reason || 'Connection closed');
        };

        this.socket.onerror = () => {
          clearTimeout(timeout);
          if (this.state === 'connecting') {
            this.state = 'disconnected';
            resolve(Err('WebSocket error'));
          }
        };

        this.socket.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            this.messageHandlers.forEach((handler) => handler(event.data));
          }
        };
      } catch (error) {
        clearTimeout(timeout);
        this.state = 'disconnected';
        resolve(Err(`Failed to create WebSocket: ${error}`));
      }
    });
  }


  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopKeepalive();
    this.cancelReconnect();
    this.socket?.close();
    this.socket = null;
    this.state = 'disconnected';
  }

  /**
   * Send binary data to the server
   */
  send(data: ArrayBuffer): Result<void, string> {
    if (!this.socket || this.state !== 'connected') {
      return Err('Not connected');
    }

    try {
      this.socket.send(data);
      return Ok(undefined);
    } catch (error) {
      return Err(`Send failed: ${error}`);
    }
  }

  /**
   * Register a message handler
   * @returns Unsubscribe function
   */
  onMessage(handler: (data: ArrayBuffer) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.state;
  }

  /**
   * Get the number of reconnection attempts
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(reason: string): void {
    this.stopKeepalive();
    const wasConnected = this.state === 'connected';
    this.state = 'disconnected';

    if (wasConnected) {
      this.eventBus?.emit({
        type: 'connection_lost',
        timestamp: Date.now(),
        playerId: 0,
        reason,
      });
    }

    if (this.shouldReconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (!this.shouldReconnect) return;

    this.state = 'reconnecting';

    // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s, ... up to max
    const delay = Math.min(
      this.config.reconnectDelayMs * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelayMs
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (this.state === 'reconnecting' && this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Cancel pending reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start sending keepalive messages
   */
  private startKeepalive(): void {
    this.keepaliveTimer = setInterval(() => {
      const keepalive = new ArrayBuffer(1);
      new DataView(keepalive).setUint8(0, MessageType.KEEPALIVE);
      this.send(keepalive);
    }, this.config.keepaliveIntervalMs);
  }

  /**
   * Stop sending keepalive messages
   */
  private stopKeepalive(): void {
    if (this.keepaliveTimer !== null) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }
}

/**
 * Mock transport for testing
 * Simulates network behavior without actual WebSocket connection
 */
export class MockTransport implements INetworkTransport {
  private state: ConnectionState = 'disconnected';
  private messageHandlers: Set<(data: ArrayBuffer) => void> = new Set();
  private sentMessages: ArrayBuffer[] = [];

  async connect(): Promise<Result<void, string>> {
    this.state = 'connected';
    return Ok(undefined);
  }

  disconnect(): void {
    this.state = 'disconnected';
  }

  send(data: ArrayBuffer): Result<void, string> {
    if (this.state !== 'connected') {
      return Err('Not connected');
    }
    this.sentMessages.push(data);
    return Ok(undefined);
  }

  onMessage(handler: (data: ArrayBuffer) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  getConnectionState(): ConnectionState {
    return this.state;
  }

  // Test helpers
  simulateMessage(data: ArrayBuffer): void {
    this.messageHandlers.forEach((handler) => handler(data));
  }

  getSentMessages(): ArrayBuffer[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }

  simulateDisconnect(): void {
    this.state = 'disconnected';
  }
}
