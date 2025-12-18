/**
 * ArenaDebugHUD - Debug overlay component for arena
 *
 * Displays performance metrics, player state, and bot tactical intent.
 * Extracted from ArenaPlayTest.tsx for reusability.
 *
 * @module ui/ArenaDebugHUD
 */

import type { ReactElement } from 'react';
import type { BotPersonalityType } from '../bot/types';

/**
 * Bot tactical intent for "thought bubble" display
 */
export interface BotTacticalIntent {
  status: string;
  laneName: string | null;
  laneType: string | null;
  waypointProgress: string;
  angleName: string | null;
  mercyActive: boolean;
  isPausing: boolean;
}

/**
 * Debug information for the HUD
 */
export interface ArenaDebugInfo {
  // Performance
  fps: number;
  frameTime?: number;
  worstFrame?: number;
  physicsMs?: number;
  renderMs?: number;
  botMs?: number;
  memoryMB?: number;
  gcWarning?: boolean;
  drawCalls?: number;
  triangles?: number;

  // Player
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  isGrounded: boolean;
  pointerLocked: boolean;
  collisionCount: number;
  health: number;
  ammo: number;

  // Bot
  botHealth?: number;
  botState?: string;
  botScore?: number;
  playerScore?: number;
  botTacticalIntent?: BotTacticalIntent;
}

/**
 * Props for ArenaDebugHUD component
 */
export interface ArenaDebugHUDProps {
  debugInfo: ArenaDebugInfo;
  visible: boolean;
  botEnabled: boolean;
  botPersonality: BotPersonalityType;
  showDebugOverlay?: boolean;
}

/**
 * Default debug info for initial state
 */
export const DEFAULT_DEBUG_INFO: ArenaDebugInfo = {
  fps: 0,
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  isGrounded: false,
  pointerLocked: false,
  collisionCount: 0,
  health: 100,
  ammo: 30,
};

/**
 * ArenaDebugHUD displays debug information during arena gameplay.
 *
 * Features:
 * - Performance metrics (FPS, frame time, draw calls)
 * - Frame breakdown (physics, bot AI, render times)
 * - Player state (position, velocity, grounded)
 * - Combat stats (health, ammo, score)
 * - Bot tactical intent ("thought bubble")
 */
export function ArenaDebugHUD({
  debugInfo,
  visible,
  botEnabled,
  botPersonality,
  showDebugOverlay = false,
}: ArenaDebugHUDProps): ReactElement | null {
  if (!visible) return null;

  const {
    fps,
    frameTime,
    worstFrame,
    physicsMs,
    renderMs,
    botMs,
    memoryMB,
    gcWarning,
    drawCalls,
    triangles,
    position,
    velocity,
    isGrounded,
    collisionCount,
    health,
    ammo,
    botHealth,
    botState,
    botScore,
    playerScore,
    botTacticalIntent,
  } = debugInfo;

  return (
    <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-xs font-mono text-gray-400 min-w-[280px]">
      {/* Performance Section */}
      <p className="text-amber-400 font-bold mb-2">Performance</p>
      <p>
        FPS:{' '}
        <span
          className={
            fps >= 55
              ? 'text-green-400'
              : fps >= 30
                ? 'text-yellow-400'
                : 'text-red-400'
          }
        >
          {fps}
        </span>
        {gcWarning && <span className="text-red-500 ml-2">⚠ GC</span>}
      </p>
      <p>
        Frame:{' '}
        <span
          className={(frameTime ?? 0) < 20 ? 'text-green-400' : 'text-yellow-400'}
        >
          {frameTime ?? 0}ms
        </span>
        <span className="text-gray-500 ml-1">(worst: {worstFrame ?? 0}ms)</span>
      </p>
      <p>
        Draw Calls:{' '}
        <span
          className={(drawCalls ?? 0) < 100 ? 'text-green-400' : 'text-yellow-400'}
        >
          {drawCalls ?? 0}
        </span>
      </p>
      <p>
        Triangles:{' '}
        <span className="text-blue-400">
          {((triangles ?? 0) / 1000).toFixed(1)}k
        </span>
      </p>
      {memoryMB && (
        <p>
          Memory:{' '}
          <span className={memoryMB < 200 ? 'text-green-400' : 'text-yellow-400'}>
            {memoryMB}MB
          </span>
        </p>
      )}

      {/* Frame Breakdown Section */}
      <div className="border-t border-white/10 mt-2 pt-2">
        <p className="text-amber-400 font-bold mb-1">Frame Breakdown</p>
        <p>
          Physics:{' '}
          <span
            className={(physicsMs ?? 0) < 2 ? 'text-green-400' : 'text-yellow-400'}
          >
            {physicsMs ?? 0}ms
          </span>
        </p>
        <p>
          Bot AI:{' '}
          <span
            className={(botMs ?? 0) < 2 ? 'text-green-400' : 'text-yellow-400'}
          >
            {botMs ?? 0}ms
          </span>
        </p>
        <p>
          Render:{' '}
          <span
            className={(renderMs ?? 0) < 8 ? 'text-green-400' : 'text-yellow-400'}
          >
            {renderMs ?? 0}ms
          </span>
        </p>
      </div>

      {/* Player Section */}
      <div className="border-t border-white/10 mt-2 pt-2">
        <p className="text-amber-400 font-bold mb-1">Player</p>
        <p>
          Pos:{' '}
          <span className="text-cyan-400">
            {position.x}, {position.y}, {position.z}
          </span>
        </p>
        <p>
          Vel:{' '}
          <span className="text-purple-400">
            {velocity.x}, {velocity.y}, {velocity.z}
          </span>
        </p>
        <p>
          Grounded:{' '}
          <span className={isGrounded ? 'text-green-400' : 'text-red-400'}>
            {isGrounded ? 'Yes' : 'No'}
          </span>
        </p>
        <p>
          Collisions:{' '}
          <span
            className={collisionCount > 0 ? 'text-orange-400' : 'text-gray-500'}
          >
            {collisionCount}
          </span>
        </p>
      </div>

      {/* Debug Overlay Status */}
      <p className="text-gray-500 mt-2">
        Debug Overlay:{' '}
        <span className={showDebugOverlay ? 'text-green-400' : 'text-gray-500'}>
          {showDebugOverlay ? 'ON (F3)' : 'OFF (F3)'}
        </span>
      </p>

      {/* Combat Section */}
      <div className="border-t border-white/10 mt-2 pt-2">
        <p className="text-amber-400 font-bold mb-1">Combat</p>
        <p>
          Health:{' '}
          <span
            className={
              health > 50
                ? 'text-green-400'
                : health > 25
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }
          >
            {health}
          </span>
        </p>
        <p>
          Ammo: <span className="text-cyan-400">{ammo}</span>
        </p>
      </div>

      {/* Bot Section */}
      {botEnabled && botHealth !== undefined && (
        <div className="border-t border-white/10 mt-2 pt-2">
          <p className="text-red-400 font-bold mb-1">Bot ({botPersonality})</p>
          <p>
            Health:{' '}
            <span
              className={
                botHealth > 50
                  ? 'text-green-400'
                  : botHealth > 25
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }
            >
              {botHealth}
            </span>
          </p>
          <p>
            State: <span className="text-purple-400">{botState}</span>
          </p>
          <p>
            Score: <span className="text-red-400">{botScore}</span> vs{' '}
            <span className="text-green-400">{playerScore}</span>
          </p>
        </div>
      )}

      {/* Bot Tactical Intent ("Thought Bubble") */}
      {botEnabled && botTacticalIntent && (
        <div className="border-t border-white/10 mt-2 pt-2">
          <p className="text-cyan-400 font-bold mb-1">🧠 Bot Intent</p>
          {botTacticalIntent.mercyActive && (
            <p className="text-blue-400 font-bold">⚡ MERCY ACTIVE</p>
          )}
          {botTacticalIntent.laneName ? (
            <>
              <p
                className={
                  botTacticalIntent.laneType === 'push'
                    ? 'text-green-400'
                    : 'text-orange-400'
                }
              >
                {botTacticalIntent.laneType === 'push' ? '>> ' : '<< '}
                {botTacticalIntent.laneName}
              </p>
              <p className="text-gray-500">
                WP: {botTacticalIntent.waypointProgress}
                {botTacticalIntent.isPausing && ' [PAUSE]'}
              </p>
            </>
          ) : botTacticalIntent.angleName ? (
            <p className="text-purple-400">◎ {botTacticalIntent.angleName}</p>
          ) : (
            <p className="text-gray-500">○ Idle</p>
          )}
        </div>
      )}
    </div>
  );
}
