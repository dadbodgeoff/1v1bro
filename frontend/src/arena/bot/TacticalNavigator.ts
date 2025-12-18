/**
 * TacticalNavigator - Executes tactical lanes and smart angles
 * 
 * Bridges MapTactics with CombatConductor to provide intelligent
 * map-aware navigation that feels human.
 */

import { Vector3 } from 'three';
import {
  type TacticalLane,
  type TacticalWaypoint,
  type SmartAngle,
  type LaneSelectionContext,
  gridToWorld,
  selectPushingLane,
  selectRetreatLane,
  findNearestSmartAngle,
  isAtChokepoint,
  calculateFlankPosition,
  MAP_TACTICS,
} from './MapTactics';
import type { BotState } from './types';

// ============================================================================
// Types
// ============================================================================

export interface NavigatorState {
  /** Currently executing lane */
  activeLane: TacticalLane | null;
  /** Current waypoint index in lane */
  waypointIndex: number;
  /** Time when current waypoint was reached */
  waypointReachedAt: number;
  /** Currently holding a smart angle */
  activeAngle: SmartAngle | null;
  /** Time when angle hold started */
  angleStartedAt: number;
  /** Is currently pausing at waypoint */
  isPausing: boolean;
}

export interface NavigatorOutput {
  /** Target position to move toward */
  targetPosition: Vector3;
  /** Movement speed multiplier (0-1) */
  speedMultiplier: number;
  /** Should the bot shoot while moving */
  shouldPrefire: boolean;
  /** Should the bot crouch */
  shouldCrouch: boolean;
  /** Aim direction override (null = aim at player) */
  aimOverride: Vector3 | null;
  /** Current action being performed */
  currentAction: TacticalWaypoint['action'] | 'navigating' | 'idle';
  /** Debug info */
  debug: {
    laneName: string | null;
    waypointIndex: number;
    angleName: string | null;
  };
}

// ============================================================================
// Debug Logger
// ============================================================================

export interface TacticalDebugLog {
  timestamp: number;
  event: string;
  details: Record<string, unknown>;
}

// ============================================================================
// TacticalNavigator Class
// ============================================================================

export class TacticalNavigator {
  private state: NavigatorState = {
    activeLane: null,
    waypointIndex: 0,
    waypointReachedAt: 0,
    activeAngle: null,
    angleStartedAt: 0,
    isPausing: false,
  };

  /** Enable console logging for debugging */
  private debugEnabled: boolean = false;
  
  /** Debug log history (last 50 entries) */
  private debugLog: TacticalDebugLog[] = [];
  private maxDebugLogSize: number = 50;

  /** Last known bot position (for mercy abort fallback) */
  private lastBotPosition: Vector3 = new Vector3(0, 0, 0);

  /**
   * Enable/disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    if (enabled) {
      console.log('[TacticalNavigator] Debug logging enabled');
    }
  }

  /**
   * Get debug log history
   */
  getDebugLog(): TacticalDebugLog[] {
    return [...this.debugLog];
  }

  /**
   * Log a debug event
   */
  private log(event: string, details: Record<string, unknown> = {}): void {
    const entry: TacticalDebugLog = {
      timestamp: Date.now(),
      event,
      details,
    };
    
    this.debugLog.push(entry);
    if (this.debugLog.length > this.maxDebugLogSize) {
      this.debugLog.shift();
    }
    
    if (this.debugEnabled) {
      console.log(`[TacticalNav] ${event}`, details);
    }
  }

  /**
   * Main update - called every frame
   */
  update(
    botPosition: Vector3,
    playerPosition: Vector3,
    botState: BotState,
    aggression: number,
    botHealth: number,
    botMaxHealth: number,
    playerVisible: boolean,
    _deltaMs: number
  ): NavigatorOutput {
    const now = Date.now();
    const playerDistance = botPosition.distanceTo(playerPosition);

    // Store last known position for mercy abort fallback
    this.lastBotPosition.copy(botPosition);

    const ctx: LaneSelectionContext = {
      botPosition,
      playerPosition,
      botHealth,
      botMaxHealth,
      aggression,
      playerVisible,
      playerDistance,
    };

    // State machine for navigation
    switch (botState) {
      case 'ENGAGE':
      case 'PATROL':
        return this.handleEngageOrPatrol(ctx, now);

      case 'RETREAT':
        return this.handleRetreat(ctx, now);

      case 'REPOSITION':
        return this.handleReposition(ctx, now);

      case 'EXECUTING_SIGNATURE':
        // Let signature system handle movement
        return this.createIdleOutput();

      default:
        return this.createIdleOutput();
    }
  }

  /** Mercy system state - set externally */
  private mercyActive: boolean = false;

  /**
   * Set mercy system state (called by CombatConductor)
   * 
   * When mercy activates and bot is on an aggressive lane, immediately
   * abort and start a defensive angle to avoid 1-frame idle gap.
   */
  setMercyActive(active: boolean): void {
    const wasActive = this.mercyActive;
    this.mercyActive = active;
    
    // Log mercy state changes
    if (active !== wasActive) {
      this.log('MERCY_STATE_CHANGE', {
        mercyActive: active,
        abortingLane: active && this.state.activeLane?.combatStyle === 'aggressive',
      });
    }
    
    // If mercy just activated and we're on an aggressive lane, abort it
    if (active && this.state.activeLane?.combatStyle === 'aggressive') {
      this.log('MERCY_ABORT_AGGRESSIVE_LANE', {
        laneId: this.state.activeLane.id,
        laneName: this.state.activeLane.name,
      });
      this.clearLane();
      
      // IMMEDIATE FALLBACK: Start nearest defensive angle to avoid idle frame
      // Use lastBotPosition since we don't have ctx here
      const fallbackAngle = findNearestSmartAngle(this.lastBotPosition, 'sniper');
      if (fallbackAngle) {
        this.log('MERCY_FALLBACK_ANGLE', {
          angleId: fallbackAngle.id,
          angleName: fallbackAngle.name,
        });
        this.startAngle(fallbackAngle, Date.now());
      }
    }
  }

  /**
   * Handle ENGAGE or PATROL state - use pushing lanes or smart angles
   */
  private handleEngageOrPatrol(ctx: LaneSelectionContext, now: number): NavigatorOutput {
    // If we have an active lane, continue it
    if (this.state.activeLane && this.state.activeLane.type === 'push') {
      return this.executeLane(ctx, now);
    }

    // If holding a smart angle, continue
    if (this.state.activeAngle) {
      return this.executeAngle(ctx, now);
    }

    // Decide: start a new lane or hold an angle?
    const healthRatio = ctx.botHealth / ctx.botMaxHealth;

    // MERCY MODE: Force defensive play when dominating
    if (this.mercyActive) {
      // Only use cautious lanes or hold angles
      const angle = findNearestSmartAngle(ctx.botPosition, 'sniper');
      if (angle) {
        this.startAngle(angle, now);
        return this.executeAngle(ctx, now);
      }
      // Fallback to Platform King style (no crossing)
      const defensiveLane = selectPushingLane(ctx, true); // mercy=true
      if (defensiveLane) {
        this.startLane(defensiveLane, now);
        return this.executeLane(ctx, now);
      }
      return this.createIdleOutput();
    }

    // Low aggression + good health = hold angle
    if (ctx.aggression < 0.4 && healthRatio > 0.5) {
      const angle = findNearestSmartAngle(ctx.botPosition, 'sniper');
      if (angle) {
        this.startAngle(angle, now);
        return this.executeAngle(ctx, now);
      }
    }

    // High aggression or player visible = push
    if (ctx.aggression > 0.5 || ctx.playerVisible) {
      const lane = selectPushingLane(ctx, this.mercyActive);
      if (lane) {
        this.startLane(lane, now);
        return this.executeLane(ctx, now);
      }
    }

    // Default: find nearest smart angle for patrol
    const patrolAngle = findNearestSmartAngle(ctx.botPosition);
    if (patrolAngle) {
      this.startAngle(patrolAngle, now);
      return this.executeAngle(ctx, now);
    }

    return this.createIdleOutput();
  }

  /**
   * Handle RETREAT state - use retreat lanes
   */
  private handleRetreat(ctx: LaneSelectionContext, now: number): NavigatorOutput {
    // If we have an active retreat lane, continue it
    if (this.state.activeLane && this.state.activeLane.type === 'retreat') {
      return this.executeLane(ctx, now);
    }

    // Select a retreat lane
    const lane = selectRetreatLane(ctx);
    if (lane) {
      this.startLane(lane, now);
      return this.executeLane(ctx, now);
    }

    // Fallback: just move away from player
    const awayFromPlayer = new Vector3()
      .subVectors(ctx.botPosition, ctx.playerPosition)
      .normalize()
      .multiplyScalar(5)
      .add(ctx.botPosition);

    return {
      targetPosition: awayFromPlayer,
      speedMultiplier: 1.0,
      shouldPrefire: false,
      shouldCrouch: false,
      aimOverride: null,
      currentAction: 'navigating',
      debug: { laneName: 'fallback_retreat', waypointIndex: 0, angleName: null },
    };
  }

  /**
   * Handle REPOSITION state - use flanking logic
   */
  private handleReposition(ctx: LaneSelectionContext, _now: number): NavigatorOutput {
    // Calculate optimal flank position
    const flank = calculateFlankPosition(ctx.botPosition, ctx.playerPosition);

    // Check if we're at a chokepoint (need to cross)
    if (isAtChokepoint(ctx.botPosition)) {
      // We're crossing - move fast, prefire
      return {
        targetPosition: flank.target,
        speedMultiplier: 1.0,
        shouldPrefire: true,
        shouldCrouch: false,
        aimOverride: null,
        currentAction: 'prefire',
        debug: { laneName: 'flanking', waypointIndex: 0, angleName: null },
      };
    }

    // Move toward chokepoint first
    const chokeWorld = gridToWorld(flank.viaChokepoint.gridX, flank.viaChokepoint.gridZ);
    const distToChoke = ctx.botPosition.distanceTo(chokeWorld);

    if (distToChoke > 2) {
      return {
        targetPosition: chokeWorld,
        speedMultiplier: 0.8,
        shouldPrefire: false,
        shouldCrouch: false,
        aimOverride: null,
        currentAction: 'navigating',
        debug: { laneName: 'flanking_to_choke', waypointIndex: 0, angleName: null },
      };
    }

    // At chokepoint, move to final position
    return {
      targetPosition: flank.target,
      speedMultiplier: 0.9,
      shouldPrefire: false,
      shouldCrouch: false,
      aimOverride: null,
      currentAction: 'navigating',
      debug: { laneName: 'flanking_final', waypointIndex: 0, angleName: null },
    };
  }

  /**
   * Execute current lane
   */
  private executeLane(ctx: LaneSelectionContext, now: number): NavigatorOutput {
    const lane = this.state.activeLane!;
    const waypoints = lane.waypoints;
    let idx = this.state.waypointIndex;

    // Check if lane is complete
    if (idx >= waypoints.length) {
      this.clearLane();
      return this.createIdleOutput();
    }

    const wp = waypoints[idx];
    const wpWorld = gridToWorld(wp.gridX, wp.gridZ);
    const distToWp = ctx.botPosition.distanceTo(wpWorld);

    // Check if we've reached the waypoint
    if (distToWp < 1.5) {
      // First time reaching this waypoint
      if (!this.state.isPausing && wp.pauseMs > 0) {
        this.state.waypointReachedAt = now;
        this.state.isPausing = true;
      }

      // Check if pause is complete
      if (this.state.isPausing) {
        const pauseElapsed = now - this.state.waypointReachedAt;
        if (pauseElapsed >= wp.pauseMs) {
          // Move to next waypoint
          this.state.waypointIndex++;
          this.state.isPausing = false;
          idx = this.state.waypointIndex;

          if (idx >= waypoints.length) {
            this.clearLane();
            return this.createIdleOutput();
          }
        } else {
          // Still pausing - execute waypoint action
          return this.createWaypointOutput(wp, ctx, lane.name);
        }
      } else if (wp.pauseMs === 0) {
        // No pause, move to next immediately
        this.state.waypointIndex++;
        idx = this.state.waypointIndex;

        if (idx >= waypoints.length) {
          this.clearLane();
          return this.createIdleOutput();
        }
      }
    }

    // Move toward current waypoint
    const currentWp = waypoints[Math.min(idx, waypoints.length - 1)];
    const targetPos = gridToWorld(currentWp.gridX, currentWp.gridZ);

    return {
      targetPosition: targetPos,
      speedMultiplier: lane.combatStyle === 'aggressive' ? 1.0 : 0.7,
      shouldPrefire: currentWp.action === 'prefire',
      shouldCrouch: currentWp.action === 'crouch',
      aimOverride: this.getAimOverride(currentWp, ctx),
      currentAction: currentWp.action,
      debug: { laneName: lane.name, waypointIndex: idx, angleName: null },
    };
  }

  /**
   * Execute smart angle hold
   */
  private executeAngle(ctx: LaneSelectionContext, now: number): NavigatorOutput {
    const angle = this.state.activeAngle!;
    const angleWorld = gridToWorld(angle.gridX, angle.gridZ);
    const distToAngle = ctx.botPosition.distanceTo(angleWorld);

    // Move to angle position if not there
    if (distToAngle > 1.5) {
      return {
        targetPosition: angleWorld,
        speedMultiplier: 0.6,
        shouldPrefire: false,
        shouldCrouch: false,
        aimOverride: null,
        currentAction: 'navigating',
        debug: { laneName: null, waypointIndex: 0, angleName: angle.name },
      };
    }

    // Check if hold duration expired
    const holdElapsed = now - this.state.angleStartedAt;
    if (holdElapsed >= angle.holdDuration) {
      this.clearAngle();
      return this.createIdleOutput();
    }

    // Holding the angle
    const aimDir = this.getDirectionVector(angle.aimDirection, ctx.botPosition);

    return {
      targetPosition: angleWorld,
      speedMultiplier: 0,
      shouldPrefire: false,
      shouldCrouch: angle.type === 'ambush',
      aimOverride: aimDir,
      currentAction: 'hold',
      debug: { laneName: null, waypointIndex: 0, angleName: angle.name },
    };
  }

  /**
   * Create output for waypoint action
   */
  private createWaypointOutput(
    wp: TacticalWaypoint,
    ctx: LaneSelectionContext,
    laneName: string
  ): NavigatorOutput {
    const wpWorld = gridToWorld(wp.gridX, wp.gridZ);

    return {
      targetPosition: wpWorld,
      speedMultiplier: 0,
      shouldPrefire: wp.action === 'prefire',
      shouldCrouch: wp.action === 'crouch',
      aimOverride: this.getAimOverride(wp, ctx),
      currentAction: wp.action,
      debug: { laneName, waypointIndex: this.state.waypointIndex, angleName: null },
    };
  }

  /**
   * Get aim override based on waypoint direction
   */
  private getAimOverride(wp: TacticalWaypoint, ctx: LaneSelectionContext): Vector3 | null {
    if (!wp.aimDirection) return null;
    if (wp.aimDirection === 'player') return null; // Let normal aim handle it

    return this.getDirectionVector(wp.aimDirection, ctx.botPosition);
  }

  /**
   * Convert direction string to world vector
   */
  private getDirectionVector(dir: string, fromPos: Vector3): Vector3 {
    const target = fromPos.clone();

    switch (dir) {
      case 'east':
        target.x += 20;
        break;
      case 'west':
        target.x -= 20;
        break;
      case 'north':
        target.z -= 20;
        break;
      case 'south':
        target.z += 20;
        break;
    }

    return target;
  }

  /**
   * Start executing a lane
   */
  private startLane(lane: TacticalLane, now: number): void {
    this.log('LANE_START', {
      laneId: lane.id,
      laneName: lane.name,
      type: lane.type,
      combatStyle: lane.combatStyle,
      waypointCount: lane.waypoints.length,
    });
    
    this.state.activeLane = lane;
    this.state.waypointIndex = 0;
    this.state.waypointReachedAt = now;
    this.state.isPausing = false;
    this.clearAngle();
  }

  /**
   * Clear current lane
   */
  private clearLane(): void {
    if (this.state.activeLane) {
      this.log('LANE_COMPLETE', {
        laneId: this.state.activeLane.id,
        laneName: this.state.activeLane.name,
        waypointsCompleted: this.state.waypointIndex,
      });
    }
    
    this.state.activeLane = null;
    this.state.waypointIndex = 0;
    this.state.isPausing = false;
  }

  /**
   * Start holding a smart angle
   */
  private startAngle(angle: SmartAngle, now: number): void {
    this.log('ANGLE_START', {
      angleId: angle.id,
      angleName: angle.name,
      type: angle.type,
      covers: angle.covers,
      holdDuration: angle.holdDuration,
      gridX: angle.gridX,
      gridZ: angle.gridZ,
    });
    
    this.state.activeAngle = angle;
    this.state.angleStartedAt = now;
    this.clearLane();
  }

  /**
   * Clear current angle
   */
  private clearAngle(): void {
    if (this.state.activeAngle) {
      this.log('ANGLE_COMPLETE', {
        angleId: this.state.activeAngle.id,
        angleName: this.state.activeAngle.name,
      });
    }
    
    this.state.activeAngle = null;
    this.state.angleStartedAt = 0;
  }

  /**
   * Create idle output
   */
  private createIdleOutput(): NavigatorOutput {
    return {
      targetPosition: new Vector3(0, 0, 0),
      speedMultiplier: 0,
      shouldPrefire: false,
      shouldCrouch: false,
      aimOverride: null,
      currentAction: 'idle',
      debug: { laneName: null, waypointIndex: 0, angleName: null },
    };
  }

  /**
   * Force start a specific lane (for testing/debugging)
   */
  forceStartLane(laneId: string): boolean {
    const lane = [...MAP_TACTICS.pushingLanes, ...MAP_TACTICS.retreatLanes]
      .find(l => l.id === laneId);

    if (lane) {
      this.startLane(lane, Date.now());
      return true;
    }
    return false;
  }

  /**
   * Get current state for debugging
   */
  getState(): NavigatorState {
    return { ...this.state };
  }

  /**
   * Get a human-readable summary of current tactical state
   */
  getDebugSummary(): {
    status: string;
    laneName: string | null;
    laneType: string | null;
    waypointProgress: string;
    angleName: string | null;
    mercyActive: boolean;
    isPausing: boolean;
  } {
    const lane = this.state.activeLane;
    const angle = this.state.activeAngle;
    
    let status = 'IDLE';
    if (lane) {
      status = `LANE: ${lane.name}`;
    } else if (angle) {
      status = `ANGLE: ${angle.name}`;
    }
    
    return {
      status,
      laneName: lane?.name ?? null,
      laneType: lane?.type ?? null,
      waypointProgress: lane 
        ? `${this.state.waypointIndex + 1}/${lane.waypoints.length}`
        : '-',
      angleName: angle?.name ?? null,
      mercyActive: this.mercyActive,
      isPausing: this.state.isPausing,
    };
  }

  /**
   * Reset navigator state
   */
  reset(): void {
    this.log('RESET', {});
    
    this.state = {
      activeLane: null,
      waypointIndex: 0,
      waypointReachedAt: 0,
      activeAngle: null,
      angleStartedAt: 0,
      isPausing: false,
    };
    this.mercyActive = false;
    this.debugLog = [];
    this.lastBotPosition.set(0, 0, 0);
  }
}
