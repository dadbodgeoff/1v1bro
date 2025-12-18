/**
 * Clock Synchronization System
 *
 * Layer 2: Networking - Synchronizes client time with server time.
 * Uses median filtering to reject outliers and detect clock drift.
 */

import type { IEventBus } from '../core/EventBus';

/**
 * Configuration for clock synchronization
 */
export interface ClockSyncConfig {
  /** Number of samples required for calibration */
  readonly sampleCount: number;
  /** Threshold in ms for triggering resync */
  readonly resyncThresholdMs: number;
  /** Duration in ms for smoothing offset changes */
  readonly smoothingDurationMs: number;
}

/**
 * Default clock sync configuration
 */
export const DEFAULT_CLOCK_SYNC_CONFIG: ClockSyncConfig = {
  sampleCount: 5,
  resyncThresholdMs: 50,
  smoothingDurationMs: 500,
};

/**
 * Clock synchronization interface
 */
export interface IClockSync {
  /** Record a new timing sample */
  recordSample(clientSendTime: number, serverTime: number, clientReceiveTime: number): void;
  /** Check if clock is calibrated with enough samples */
  isCalibrated(): boolean;
  /** Get the calculated offset between client and server time */
  getOffset(): number;
  /** Get the calculated round-trip time */
  getRTT(): number;
  /** Convert server time to local client time */
  serverTimeToLocal(serverTime: number): number;
  /** Convert local client time to server time */
  localTimeToServer(localTime: number): number;
  /** Check if drift exceeds threshold, triggers recalibration if so */
  checkDrift(serverTime: number, localTime: number): boolean;
  /** Clear all samples and reset calibration */
  clear(): void;
}

/**
 * Clock sample data
 */
interface ClockSample {
  readonly offset: number;
  readonly rtt: number;
}

/**
 * Clock synchronization implementation
 *
 * Uses NTP-style offset calculation:
 * offset = serverTime - (clientSendTime + RTT/2)
 *
 * The median of samples is used to reject outliers from network jitter.
 */
export class ClockSync implements IClockSync {
  private samples: ClockSample[] = [];
  private calibratedOffset: number = 0;
  private calibratedRTT: number = 0;
  private isReady: boolean = false;
  private readonly config: ClockSyncConfig;
  private readonly eventBus?: IEventBus;

  constructor(
    config: ClockSyncConfig = DEFAULT_CLOCK_SYNC_CONFIG,
    eventBus?: IEventBus
  ) {
    this.config = config;
    this.eventBus = eventBus;
  }

  /**
   * Record a timing sample from a clock sync exchange
   *
   * @param clientSendTime - Local time when request was sent
   * @param serverTime - Server time from response
   * @param clientReceiveTime - Local time when response was received
   */
  recordSample(clientSendTime: number, serverTime: number, clientReceiveTime: number): void {
    const rtt = clientReceiveTime - clientSendTime;
    const oneWayLatency = rtt / 2;
    const offset = serverTime - (clientSendTime + oneWayLatency);

    this.samples.push({ offset, rtt });

    // Keep only the most recent samples
    if (this.samples.length > this.config.sampleCount) {
      this.samples.shift();
    }

    // Calibrate when we have enough samples
    if (this.samples.length >= this.config.sampleCount) {
      this.calibrate();
    }
  }

  /**
   * Calibrate using median of samples to reject outliers
   */
  private calibrate(): void {
    // Sort by offset and use median
    const sortedByOffset = [...this.samples].sort((a, b) => a.offset - b.offset);
    const sortedByRTT = [...this.samples].sort((a, b) => a.rtt - b.rtt);

    const medianIndex = Math.floor(sortedByOffset.length / 2);
    this.calibratedOffset = sortedByOffset[medianIndex].offset;
    this.calibratedRTT = sortedByRTT[medianIndex].rtt;
    this.isReady = true;
  }

  /**
   * Check if clock is calibrated with enough samples
   */
  isCalibrated(): boolean {
    return this.isReady;
  }

  /**
   * Get the calculated offset between client and server time
   * Positive offset means server is ahead of client
   */
  getOffset(): number {
    return this.calibratedOffset;
  }

  /**
   * Get the calculated round-trip time in milliseconds
   */
  getRTT(): number {
    return this.calibratedRTT;
  }

  /**
   * Convert server time to local client time
   */
  serverTimeToLocal(serverTime: number): number {
    return serverTime - this.calibratedOffset;
  }

  /**
   * Convert local client time to server time
   */
  localTimeToServer(localTime: number): number {
    return localTime + this.calibratedOffset;
  }

  /**
   * Check if drift exceeds threshold
   * Returns true if drift detected and recalibration triggered
   */
  checkDrift(serverTime: number, localTime: number): boolean {
    const expectedServerTime = this.localTimeToServer(localTime);
    const drift = Math.abs(serverTime - expectedServerTime);

    if (drift > this.config.resyncThresholdMs) {
      // Emit drift event if event bus is available
      this.eventBus?.emit({
        type: 'clock_drift_detected',
        timestamp: localTime,
        drift,
      });

      // Force recalibration
      this.samples = [];
      this.isReady = false;
      return true;
    }

    return false;
  }

  /**
   * Clear all samples and reset calibration
   */
  clear(): void {
    this.samples = [];
    this.calibratedOffset = 0;
    this.calibratedRTT = 0;
    this.isReady = false;
  }

  /**
   * Get the number of samples currently stored
   */
  getSampleCount(): number {
    return this.samples.length;
  }
}
