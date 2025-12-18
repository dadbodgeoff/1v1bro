/**
 * Clock Synchronization Tests
 *
 * Property-based and unit tests for clock synchronization.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { ClockSync, DEFAULT_CLOCK_SYNC_CONFIG, ClockSyncConfig } from './ClockSync';
import { EventBus } from '../core/EventBus';

describe('ClockSync', () => {
  describe('Calibration', () => {
    it('is not calibrated initially', () => {
      const clockSync = new ClockSync();
      expect(clockSync.isCalibrated()).toBe(false);
    });

    it('becomes calibrated after enough samples', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 3 });

      // Add samples: client sends at t, server responds at t+100, client receives at t+50
      clockSync.recordSample(0, 100, 50);
      expect(clockSync.isCalibrated()).toBe(false);

      clockSync.recordSample(100, 200, 150);
      expect(clockSync.isCalibrated()).toBe(false);

      clockSync.recordSample(200, 300, 250);
      expect(clockSync.isCalibrated()).toBe(true);
    });

    // Property 18: Clock Offset Calculation - uses median of samples
    it('Property 18: uses median of samples for offset calculation', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 1000, noNaN: true }), { minLength: 5, maxLength: 5 }),
          (offsets) => {
            const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 5 });

            // Create samples with known offsets
            // offset = serverTime - (clientSendTime + RTT/2)
            // If RTT = 100, then offset = serverTime - (clientSendTime + 50)
            // So serverTime = offset + clientSendTime + 50
            for (let i = 0; i < offsets.length; i++) {
              const clientSendTime = i * 1000;
              const rtt = 100;
              const serverTime = offsets[i] + clientSendTime + rtt / 2;
              const clientReceiveTime = clientSendTime + rtt;
              clockSync.recordSample(clientSendTime, serverTime, clientReceiveTime);
            }

            expect(clockSync.isCalibrated()).toBe(true);

            // The offset should be the median of the input offsets
            const sortedOffsets = [...offsets].sort((a, b) => a - b);
            const expectedMedian = sortedOffsets[Math.floor(sortedOffsets.length / 2)];

            expect(clockSync.getOffset()).toBeCloseTo(expectedMedian, 4);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('rejects outliers by using median', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 5 });

      // Add 4 samples with offset ~100
      for (let i = 0; i < 4; i++) {
        clockSync.recordSample(i * 100, i * 100 + 150, i * 100 + 100);
      }

      // Add 1 outlier with offset ~1000
      clockSync.recordSample(400, 1450, 500);

      expect(clockSync.isCalibrated()).toBe(true);

      // Median should be around 100, not affected much by the outlier
      expect(clockSync.getOffset()).toBeCloseTo(100, 0);
    });
  });


  describe('Time Conversion', () => {
    // Property 19: Time Conversion Consistency - round-trip conversion preserves time
    it('Property 19: round-trip conversion preserves time', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1e12, noNaN: true }),
          fc.double({ min: -10000, max: 10000, noNaN: true }),
          (localTime, offset) => {
            const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1 });

            // Create a sample that produces the desired offset
            const clientSendTime = 0;
            const rtt = 100;
            const serverTime = offset + clientSendTime + rtt / 2;
            const clientReceiveTime = clientSendTime + rtt;
            clockSync.recordSample(clientSendTime, serverTime, clientReceiveTime);

            // Round-trip: local -> server -> local should preserve time
            const serverTimeConverted = clockSync.localTimeToServer(localTime);
            const backToLocal = clockSync.serverTimeToLocal(serverTimeConverted);

            expect(backToLocal).toBeCloseTo(localTime, 6);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('converts server time to local correctly', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1 });

      // Create sample with offset = 100 (server is 100ms ahead)
      clockSync.recordSample(0, 150, 100);

      expect(clockSync.getOffset()).toBeCloseTo(100, 4);

      // Server time 1100 should be local time 1000
      expect(clockSync.serverTimeToLocal(1100)).toBeCloseTo(1000, 4);
    });

    it('converts local time to server correctly', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1 });

      // Create sample with offset = 100 (server is 100ms ahead)
      clockSync.recordSample(0, 150, 100);

      // Local time 1000 should be server time 1100
      expect(clockSync.localTimeToServer(1000)).toBeCloseTo(1100, 4);
    });

    it('handles negative offset (client ahead of server)', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1 });

      // Create sample with offset = -100 (client is 100ms ahead)
      // offset = serverTime - (clientSendTime + RTT/2)
      // -100 = serverTime - (0 + 50)
      // serverTime = -50
      clockSync.recordSample(0, -50, 100);

      expect(clockSync.getOffset()).toBeCloseTo(-100, 4);

      // Server time 900 should be local time 1000
      expect(clockSync.serverTimeToLocal(900)).toBeCloseTo(1000, 4);
    });
  });

  describe('RTT Calculation', () => {
    it('calculates RTT correctly', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1 });

      clockSync.recordSample(0, 100, 80);

      expect(clockSync.getRTT()).toBe(80);
    });

    it('uses median RTT', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 5 });

      // Add samples with RTTs: 50, 60, 70, 80, 200 (outlier)
      clockSync.recordSample(0, 100, 50);
      clockSync.recordSample(100, 200, 160);
      clockSync.recordSample(200, 300, 270);
      clockSync.recordSample(300, 400, 380);
      clockSync.recordSample(400, 500, 600); // RTT = 200

      // Median RTT should be 70
      expect(clockSync.getRTT()).toBe(70);
    });
  });

  describe('Drift Detection', () => {
    it('detects drift exceeding threshold', () => {
      const eventBus = new EventBus();
      const driftHandler = vi.fn();
      eventBus.on('clock_drift_detected', driftHandler);

      const clockSync = new ClockSync(
        { ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1, resyncThresholdMs: 50 },
        eventBus
      );

      // Calibrate with offset = 100
      clockSync.recordSample(0, 150, 100);
      expect(clockSync.isCalibrated()).toBe(true);

      // Check drift with server time that's 200ms off from expected
      // Expected server time for local 1000 = 1100
      // Actual server time = 1300 (drift = 200)
      const driftDetected = clockSync.checkDrift(1300, 1000);

      expect(driftDetected).toBe(true);
      expect(driftHandler).toHaveBeenCalled();
      expect(clockSync.isCalibrated()).toBe(false); // Should trigger recalibration
    });

    it('does not detect drift within threshold', () => {
      const eventBus = new EventBus();
      const driftHandler = vi.fn();
      eventBus.on('clock_drift_detected', driftHandler);

      const clockSync = new ClockSync(
        { ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1, resyncThresholdMs: 50 },
        eventBus
      );

      // Calibrate with offset = 100
      clockSync.recordSample(0, 150, 100);

      // Check drift with server time that's only 30ms off
      const driftDetected = clockSync.checkDrift(1130, 1000);

      expect(driftDetected).toBe(false);
      expect(driftHandler).not.toHaveBeenCalled();
      expect(clockSync.isCalibrated()).toBe(true);
    });

    it('clears samples on drift detection', () => {
      const clockSync = new ClockSync({
        ...DEFAULT_CLOCK_SYNC_CONFIG,
        sampleCount: 3,
        resyncThresholdMs: 50,
      });

      // Calibrate
      clockSync.recordSample(0, 150, 100);
      clockSync.recordSample(100, 250, 200);
      clockSync.recordSample(200, 350, 300);
      expect(clockSync.isCalibrated()).toBe(true);
      expect(clockSync.getSampleCount()).toBe(3);

      // Trigger drift
      clockSync.checkDrift(2000, 1000);

      expect(clockSync.isCalibrated()).toBe(false);
      expect(clockSync.getSampleCount()).toBe(0);
    });
  });

  describe('Clear', () => {
    it('resets all state', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 1 });

      clockSync.recordSample(0, 150, 100);
      expect(clockSync.isCalibrated()).toBe(true);
      expect(clockSync.getOffset()).toBeCloseTo(100, 4);

      clockSync.clear();

      expect(clockSync.isCalibrated()).toBe(false);
      expect(clockSync.getOffset()).toBe(0);
      expect(clockSync.getRTT()).toBe(0);
      expect(clockSync.getSampleCount()).toBe(0);
    });
  });

  describe('Sample Management', () => {
    it('keeps only the most recent samples', () => {
      const clockSync = new ClockSync({ ...DEFAULT_CLOCK_SYNC_CONFIG, sampleCount: 3 });

      // Add 5 samples
      for (let i = 0; i < 5; i++) {
        clockSync.recordSample(i * 100, i * 100 + 150, i * 100 + 100);
      }

      // Should only have 3 samples
      expect(clockSync.getSampleCount()).toBe(3);
    });
  });
});
