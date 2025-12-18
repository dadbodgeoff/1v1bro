/**
 * DebugOverlay - Debug visualization and network stats display
 * 
 * Provides visual debugging tools for collision AABBs, player capsules,
 * hitscan rays, spawn points, and network statistics.
 * 
 * @module debug/DebugOverlay
 */

import { Vector3 } from '../math/Vector3';
import { AABB } from '../physics/AABB';
import { Capsule } from '../physics/Capsule';

// ============================================================================
// Configuration
// ============================================================================

export interface DebugConfig {
  readonly enabled: boolean;
  readonly showColliders: boolean;
  readonly showCapsules: boolean;
  readonly showRaycasts: boolean;
  readonly showSpawnPoints: boolean;
  readonly showNetworkStats: boolean;
}

export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  enabled: false,
  showColliders: true,
  showCapsules: true,
  showRaycasts: true,
  showSpawnPoints: true,
  showNetworkStats: true
};

// ============================================================================
// Network Stats
// ============================================================================

export interface NetworkStats {
  fps: number;
  tickRate: number;
  rtt: number;
  packetLoss: number;
  predictionError: number;
  interpolationDelay: number;
  pendingInputs: number;
}

export const DEFAULT_NETWORK_STATS: NetworkStats = {
  fps: 0,
  tickRate: 0,
  rtt: 0,
  packetLoss: 0,
  predictionError: 0,
  interpolationDelay: 0,
  pendingInputs: 0
};

// ============================================================================
// Draw Commands
// ============================================================================

export type DebugDrawCommand =
  | { type: 'aabb'; aabb: AABB; color: string }
  | { type: 'capsule'; capsule: Capsule; color: string }
  | { type: 'ray'; origin: Vector3; direction: Vector3; length: number; color: string }
  | { type: 'point'; position: Vector3; color: string; size: number }
  | { type: 'line'; start: Vector3; end: Vector3; color: string };

// ============================================================================
// Interface
// ============================================================================

export interface IDebugOverlay {
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  updateStats(stats: NetworkStats): void;
  drawAABB(aabb: AABB, color: string): void;
  drawCapsule(capsule: Capsule, color: string): void;
  drawRay(origin: Vector3, direction: Vector3, length: number, color: string): void;
  drawPoint(position: Vector3, color: string, size: number): void;
  drawLine(start: Vector3, end: Vector3, color: string): void;
  clear(): void;
  getDrawCommands(): DebugDrawCommand[];
  getStats(): NetworkStats | null;
}

// ============================================================================
// Implementation
// ============================================================================

export class DebugOverlay implements IDebugOverlay {
  private enabled: boolean;
  private stats: NetworkStats | null = null;
  private drawCommands: DebugDrawCommand[] = [];
  private config: DebugConfig;

  constructor(config: DebugConfig = DEFAULT_DEBUG_CONFIG) {
    this.config = config;
    this.enabled = config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DebugConfig {
    return { ...this.config };
  }

  updateStats(stats: NetworkStats): void {
    this.stats = { ...stats };
  }

  drawAABB(aabb: AABB, color: string): void {
    if (!this.enabled || !this.config.showColliders) return;
    this.drawCommands.push({ type: 'aabb', aabb, color });
  }

  drawCapsule(capsule: Capsule, color: string): void {
    if (!this.enabled || !this.config.showCapsules) return;
    this.drawCommands.push({ type: 'capsule', capsule, color });
  }

  drawRay(origin: Vector3, direction: Vector3, length: number, color: string): void {
    if (!this.enabled || !this.config.showRaycasts) return;
    this.drawCommands.push({ type: 'ray', origin, direction, length, color });
  }

  drawPoint(position: Vector3, color: string, size: number): void {
    if (!this.enabled || !this.config.showSpawnPoints) return;
    this.drawCommands.push({ type: 'point', position, color, size });
  }

  drawLine(start: Vector3, end: Vector3, color: string): void {
    if (!this.enabled) return;
    this.drawCommands.push({ type: 'line', start, end, color });
  }

  clear(): void {
    this.drawCommands = [];
  }

  getDrawCommands(): DebugDrawCommand[] {
    return [...this.drawCommands];
  }

  getStats(): NetworkStats | null {
    return this.stats ? { ...this.stats } : null;
  }

  /**
   * Get formatted stats string for display
   */
  getFormattedStats(): string {
    if (!this.stats || !this.config.showNetworkStats) return '';

    const lines = [
      `FPS: ${this.stats.fps.toFixed(0)}`,
      `Tick Rate: ${this.stats.tickRate.toFixed(0)} Hz`,
      `RTT: ${this.stats.rtt.toFixed(0)} ms`,
      `Packet Loss: ${(this.stats.packetLoss * 100).toFixed(1)}%`,
      `Prediction Error: ${this.stats.predictionError.toFixed(3)} units`,
      `Interp Delay: ${this.stats.interpolationDelay.toFixed(0)} ms`,
      `Pending Inputs: ${this.stats.pendingInputs}`
    ];

    return lines.join('\n');
  }

  /**
   * Get count of draw commands by type
   */
  getDrawCommandCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      aabb: 0,
      capsule: 0,
      ray: 0,
      point: 0,
      line: 0
    };

    for (const cmd of this.drawCommands) {
      counts[cmd.type]++;
    }

    return counts;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a color string with alpha
 */
export function colorWithAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  
  return color;
}

/**
 * Get color based on value threshold
 */
export function getThresholdColor(
  value: number,
  goodThreshold: number,
  warnThreshold: number
): string {
  if (value <= goodThreshold) return '#00ff88';
  if (value <= warnThreshold) return '#ffaa00';
  return '#ff4444';
}
