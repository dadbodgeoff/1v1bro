/**
 * BotDebugOverlay - Debug visualization for bot AI
 *
 * Provides visual debugging tools for bot state, aggression curve,
 * tactical intent, and pattern execution.
 */

import type { BotPlayer } from './BotPlayer';
import type { BotState } from './types';

/**
 * Tactical intent summary (from TacticalNavigator.getDebugSummary)
 */
export interface TacticalIntent {
  status: string;
  laneName: string | null;
  laneType: string | null;
  waypointProgress: string;
  angleName: string | null;
  mercyActive: boolean;
  isPausing: boolean;
}

/**
 * Debug overlay configuration
 */
export interface BotDebugConfig {
  enabled: boolean;
  showState: boolean;
  showAggression: boolean;
  showPatternLog: boolean;
  showAimTarget: boolean;
  showTacticalIntent: boolean;
  maxLogEntries: number;
}

/**
 * Pattern log entry
 */
interface PatternLogEntry {
  timestamp: number;
  patternId: string;
  state: BotState;
  aggression: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BotDebugConfig = {
  enabled: false,
  showState: true,
  showAggression: true,
  showPatternLog: true,
  showAimTarget: true,
  showTacticalIntent: true,
  maxLogEntries: 20,
};

export class BotDebugOverlay {
  private config: BotDebugConfig;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private patternLog: PatternLogEntry[] = [];
  private aggressionHistory: number[] = [];
  private maxAggressionHistory: number = 100;
  private currentTacticalIntent: TacticalIntent | null = null;

  constructor(config?: Partial<BotDebugConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize overlay
   */
  initialize(container: HTMLElement): void {
    this.container = container;

    // Create canvas for debug rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 280;
    this.canvas.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #333;
      border-radius: 4px;
      pointer-events: none;
      z-index: 1000;
      display: ${this.config.enabled ? 'block' : 'none'};
    `;

    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);
  }

  /**
   * Update overlay with bot state
   */
  update(bot: BotPlayer | null): void {
    if (!this.config.enabled || !this.ctx || !this.canvas || !bot) {
      return;
    }

    const state = bot.getState();
    const output = bot.getLastOutput();

    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let y = 20;
    const lineHeight = 16;

    // Title
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.fillText('BOT DEBUG', 10, y);
    y += lineHeight + 5;

    // State
    if (this.config.showState) {
      this.ctx.font = '12px monospace';
      this.ctx.fillStyle = this.getStateColor(state.currentState);
      this.ctx.fillText(`State: ${state.currentState}`, 10, y);
      y += lineHeight;

      this.ctx.fillStyle = '#aaa';
      this.ctx.fillText(`Health: ${state.health}/${state.maxHealth}`, 10, y);
      y += lineHeight;

      this.ctx.fillText(`Ammo: ${state.ammo}/${state.maxAmmo}`, 10, y);
      y += lineHeight;

      this.ctx.fillText(`Score: ${state.score}`, 10, y);
      y += lineHeight;

      this.ctx.fillText(
        `Pos: ${state.position.x.toFixed(1)}, ${state.position.z.toFixed(1)}`,
        10,
        y
      );
      y += lineHeight + 5;
    }

    // Use output for aim target display
    void output;

    // Aggression curve
    if (this.config.showAggression && this.aggressionHistory.length > 0) {
      this.drawAggressionGraph(y);
      y += 50;
    }

    // Tactical Intent ("Thought Bubble")
    if (this.config.showTacticalIntent && this.currentTacticalIntent) {
      y += 5;
      this.drawTacticalIntent(y);
      y += 60;
    }

    // Pattern log
    if (this.config.showPatternLog && this.patternLog.length > 0) {
      this.ctx.fillStyle = '#888';
      this.ctx.font = '10px monospace';
      this.ctx.fillText('Recent Patterns:', 10, y);
      y += 12;

      const recentPatterns = this.patternLog.slice(-5);
      for (const entry of recentPatterns) {
        this.ctx.fillStyle = '#666';
        this.ctx.fillText(`  ${entry.patternId}`, 10, y);
        y += 10;
      }
    }
  }

  /**
   * Draw tactical intent visualization ("Thought Bubble")
   */
  private drawTacticalIntent(startY: number): void {
    if (!this.ctx || !this.currentTacticalIntent) return;

    const intent = this.currentTacticalIntent;
    const x = 10;
    let y = startY;

    // Section header
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillText('TACTICAL INTENT', x, y);
    y += 14;

    // Mercy status (prominent if active)
    if (intent.mercyActive) {
      this.ctx.fillStyle = '#5dade2'; // Blue
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText('⚡ MERCY ACTIVE - HOLDING BACK', x, y);
      y += 14;
    }

    // Current action
    if (intent.laneName) {
      // Executing a lane
      const laneColor = intent.laneType === 'push' ? '#2ecc71' : '#f39c12'; // Green for push, Orange for retreat
      this.ctx.fillStyle = laneColor;
      this.ctx.font = 'bold 11px monospace';
      const prefix = intent.laneType === 'push' ? '>> PUSHING:' : '<< RETREAT:';
      this.ctx.fillText(`${prefix} ${intent.laneName}`, x, y);
      y += 12;

      // Waypoint progress
      this.ctx.fillStyle = '#aaa';
      this.ctx.font = '10px monospace';
      const pauseIndicator = intent.isPausing ? ' [PAUSING]' : '';
      this.ctx.fillText(`   Waypoint: ${intent.waypointProgress}${pauseIndicator}`, x, y);
      y += 12;
    } else if (intent.angleName) {
      // Holding an angle
      this.ctx.fillStyle = '#9b59b6'; // Purple
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText(`◎ HOLDING: ${intent.angleName}`, x, y);
      y += 12;
    } else {
      // Idle
      this.ctx.fillStyle = '#7f8c8d'; // Gray
      this.ctx.font = '11px monospace';
      this.ctx.fillText('○ IDLE - Selecting action...', x, y);
      y += 12;
    }
  }

  /**
   * Draw aggression graph
   */
  private drawAggressionGraph(startY: number): void {
    if (!this.ctx || !this.canvas) return;

    const graphWidth = 280;
    const graphHeight = 40;
    const graphX = 10;
    const graphY = startY;

    // Background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(graphX, graphY, graphWidth, graphHeight);

    // Grid lines
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(graphX, graphY + graphHeight / 2);
    this.ctx.lineTo(graphX + graphWidth, graphY + graphHeight / 2);
    this.ctx.stroke();

    // Draw aggression line
    if (this.aggressionHistory.length > 1) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      const step = graphWidth / this.maxAggressionHistory;
      for (let i = 0; i < this.aggressionHistory.length; i++) {
        const x = graphX + i * step;
        const y = graphY + graphHeight - this.aggressionHistory[i] * graphHeight;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }

    // Current value
    const current = this.aggressionHistory[this.aggressionHistory.length - 1] ?? 0;
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.font = '10px monospace';
    this.ctx.fillText(`Aggression: ${(current * 100).toFixed(0)}%`, graphX, graphY - 2);
  }

  /**
   * Record aggression value
   */
  recordAggression(value: number): void {
    this.aggressionHistory.push(value);
    if (this.aggressionHistory.length > this.maxAggressionHistory) {
      this.aggressionHistory.shift();
    }
  }

  /**
   * Record pattern execution
   */
  recordPattern(patternId: string, state: BotState, aggression: number): void {
    this.patternLog.push({
      timestamp: Date.now(),
      patternId,
      state,
      aggression,
    });

    if (this.patternLog.length > this.config.maxLogEntries) {
      this.patternLog.shift();
    }
  }

  /**
   * Update tactical intent from TacticalNavigator.getDebugSummary()
   * Call this every frame to show the bot's current "thought"
   */
  updateTacticalIntent(intent: TacticalIntent): void {
    this.currentTacticalIntent = intent;
  }

  /**
   * Get color for bot state
   */
  private getStateColor(state: BotState): string {
    switch (state) {
      case 'PATROL':
        return '#4ecdc4';
      case 'ENGAGE':
        return '#ff6b6b';
      case 'RETREAT':
        return '#ffd93d';
      case 'REPOSITION':
        return '#6bcb77';
      case 'EXECUTING_SIGNATURE':
        return '#9b59b6';
      default:
        return '#aaa';
    }
  }

  /**
   * Toggle overlay visibility
   */
  toggle(): void {
    this.config.enabled = !this.config.enabled;
    if (this.canvas) {
      this.canvas.style.display = this.config.enabled ? 'block' : 'none';
    }
  }

  /**
   * Enable overlay
   */
  enable(): void {
    this.config.enabled = true;
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
  }

  /**
   * Disable overlay
   */
  disable(): void {
    this.config.enabled = false;
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.patternLog = [];
    this.aggressionHistory = [];
    this.currentTacticalIntent = null;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.container = null;
  }
}
