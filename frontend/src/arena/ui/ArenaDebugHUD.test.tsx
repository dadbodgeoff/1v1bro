/**
 * ArenaDebugHUD Tests
 *
 * Property-based tests for debug HUD rendering.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import {
  ArenaDebugHUD,
  DEFAULT_DEBUG_INFO,
  type ArenaDebugInfo,
  type BotTacticalIntent,
} from './ArenaDebugHUD';

describe('ArenaDebugHUD', () => {
  describe('visibility', () => {
    it('should not render when visible is false', () => {
      const { container } = render(
        <ArenaDebugHUD
          debugInfo={DEFAULT_DEBUG_INFO}
          visible={false}
          botEnabled={false}
          botPersonality="duelist"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when visible is true', () => {
      render(
        <ArenaDebugHUD
          debugInfo={DEFAULT_DEBUG_INFO}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
        />
      );

      expect(screen.getByText('Performance')).toBeInTheDocument();
    });
  });

  describe('Property 7: Debug HUD displays all required metrics', () => {
    it('should render all performance metrics without errors', () => {
      fc.assert(
        fc.property(
          // Generate random debug info
          fc.record({
            fps: fc.integer({ min: 0, max: 144 }),
            frameTime: fc.integer({ min: 0, max: 100 }),
            worstFrame: fc.integer({ min: 0, max: 200 }),
            physicsMs: fc.integer({ min: 0, max: 50 }),
            renderMs: fc.integer({ min: 0, max: 50 }),
            botMs: fc.integer({ min: 0, max: 50 }),
            memoryMB: fc.integer({ min: 50, max: 500 }),
            gcWarning: fc.boolean(),
            drawCalls: fc.integer({ min: 0, max: 500 }),
            triangles: fc.integer({ min: 0, max: 1000000 }),
            position: fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -10, max: 50 }),
              z: fc.integer({ min: -100, max: 100 }),
            }),
            velocity: fc.record({
              x: fc.integer({ min: -20, max: 20 }),
              y: fc.integer({ min: -20, max: 20 }),
              z: fc.integer({ min: -20, max: 20 }),
            }),
            isGrounded: fc.boolean(),
            pointerLocked: fc.boolean(),
            collisionCount: fc.integer({ min: 0, max: 10 }),
            health: fc.integer({ min: 0, max: 100 }),
            ammo: fc.integer({ min: 0, max: 100 }),
          }),
          (debugInfo) => {
            const { container, unmount } = render(
              <ArenaDebugHUD
                debugInfo={debugInfo as ArenaDebugInfo}
                visible={true}
                botEnabled={false}
                botPersonality="duelist"
              />
            );

            // Should render without throwing
            expect(container.firstChild).not.toBeNull();

            // Should contain expected text (use container queries to avoid global screen issues)
            expect(container.textContent).toContain('FPS:');
            expect(container.textContent).toContain('Pos:');
            expect(container.textContent).toContain('Health:');

            // Cleanup to avoid DOM pollution between property runs
            unmount();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render bot info when bot is enabled', () => {
      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        botHealth: 75,
        botState: 'engaging',
        botScore: 3,
        playerScore: 5,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={true}
          botPersonality="rusher"
        />
      );

      expect(screen.getByText(/Bot \(rusher\)/)).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('engaging')).toBeInTheDocument();
    });

    it('should render bot tactical intent when provided', () => {
      const tacticalIntent: BotTacticalIntent = {
        status: 'pushing',
        laneName: 'Center Lane',
        laneType: 'push',
        waypointProgress: '3/5',
        angleName: null,
        mercyActive: false,
        isPausing: false,
      };

      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        botHealth: 100,
        botTacticalIntent: tacticalIntent,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={true}
          botPersonality="sentinel"
        />
      );

      expect(screen.getByText('🧠 Bot Intent')).toBeInTheDocument();
      expect(screen.getByText(/Center Lane/)).toBeInTheDocument();
      expect(screen.getByText(/WP: 3\/5/)).toBeInTheDocument();
    });

    it('should show mercy active indicator', () => {
      const tacticalIntent: BotTacticalIntent = {
        status: 'mercy',
        laneName: null,
        laneType: null,
        waypointProgress: '',
        angleName: 'Corner Angle',
        mercyActive: true,
        isPausing: false,
      };

      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        botHealth: 100,
        botTacticalIntent: tacticalIntent,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={true}
          botPersonality="duelist"
        />
      );

      expect(screen.getByText('⚡ MERCY ACTIVE')).toBeInTheDocument();
    });

    it('should show pause indicator when bot is pausing', () => {
      const tacticalIntent: BotTacticalIntent = {
        status: 'pausing',
        laneName: 'Side Lane',
        laneType: 'retreat',
        waypointProgress: '2/4',
        angleName: null,
        mercyActive: false,
        isPausing: true,
      };

      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        botHealth: 50,
        botTacticalIntent: tacticalIntent,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={true}
          botPersonality="sentinel"
        />
      );

      expect(screen.getByText(/\[PAUSE\]/)).toBeInTheDocument();
    });
  });

  describe('color coding', () => {
    it('should show green FPS for 60+', () => {
      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        fps: 60,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
        />
      );

      const fpsElement = screen.getByText('60');
      expect(fpsElement).toHaveClass('text-green-400');
    });

    it('should show yellow FPS for 30-54', () => {
      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        fps: 45,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
        />
      );

      const fpsElement = screen.getByText('45');
      expect(fpsElement).toHaveClass('text-yellow-400');
    });

    it('should show red FPS for below 30', () => {
      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        fps: 20,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
        />
      );

      const fpsElement = screen.getByText('20');
      expect(fpsElement).toHaveClass('text-red-400');
    });

    it('should show GC warning when gcWarning is true', () => {
      const debugInfo: ArenaDebugInfo = {
        ...DEFAULT_DEBUG_INFO,
        gcWarning: true,
      };

      render(
        <ArenaDebugHUD
          debugInfo={debugInfo}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
        />
      );

      expect(screen.getByText('⚠ GC')).toBeInTheDocument();
    });
  });

  describe('debug overlay status', () => {
    it('should show debug overlay as ON when enabled', () => {
      render(
        <ArenaDebugHUD
          debugInfo={DEFAULT_DEBUG_INFO}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
          showDebugOverlay={true}
        />
      );

      expect(screen.getByText('ON (F3)')).toBeInTheDocument();
    });

    it('should show debug overlay as OFF when disabled', () => {
      render(
        <ArenaDebugHUD
          debugInfo={DEFAULT_DEBUG_INFO}
          visible={true}
          botEnabled={false}
          botPersonality="duelist"
          showDebugOverlay={false}
        />
      );

      expect(screen.getByText('OFF (F3)')).toBeInTheDocument();
    });
  });
});
