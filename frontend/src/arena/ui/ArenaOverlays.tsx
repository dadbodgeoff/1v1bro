/**
 * ArenaOverlays - Loading, instructions, and results overlays
 *
 * Extracted from ArenaPlayTest.tsx for reusability.
 *
 * @module ui/ArenaOverlays
 */

import type { ReactElement } from 'react';
import type { BotPersonalityType, DifficultyLevel } from '../bot/types';
import { getPersonalityDisplayInfo, getDifficultyDisplayInfo } from '../bot/BotPersonality';
import type { MatchState, MatchResult } from '../bot/BotMatchManager';

/**
 * Props for ArenaOverlays component
 */
export interface ArenaOverlaysProps {
  // Loading state
  isLoading: boolean;
  loadProgress: number;
  loadError: string | null;

  // Instructions state
  showInstructions: boolean;
  onStartGame: () => void;

  // Match state
  matchState?: MatchState;
  countdownRemaining?: number;

  // Results state
  matchResult?: MatchResult | null;
  onPlayAgain?: () => void;
  onReturnToDashboard?: () => void;

  // Bot config (for instructions display)
  botEnabled: boolean;
  botPersonality: BotPersonalityType;
  botDifficulty: DifficultyLevel;

  // Character loaded state
  characterLoaded?: boolean;
}

/**
 * Loading overlay with progress bar
 */
function LoadingOverlay({ progress }: { progress: number }): ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90">
      <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-500/30 text-center max-w-md">
        <h1 className="text-2xl font-bold text-amber-400 mb-4">Loading Map...</h1>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-amber-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-400 text-sm">{progress}%</p>
      </div>
    </div>
  );
}

/**
 * Error overlay with retry button
 */
function ErrorOverlay({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90">
      <div className="bg-gray-900/90 p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Map</h1>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Instructions overlay with controls
 */
function InstructionsOverlay({
  botEnabled,
  botPersonality,
  botDifficulty,
  characterLoaded,
  onStartGame,
}: {
  botEnabled: boolean;
  botPersonality: BotPersonalityType;
  botDifficulty: DifficultyLevel;
  characterLoaded: boolean;
  onStartGame: () => void;
}): ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-500/30 text-center max-w-md">
        <h1 className="text-2xl font-bold text-amber-400 mb-4">Arena Play Test</h1>
        <p className="text-gray-300 mb-6">
          Full arena test with physics, combat, audio, and AI bot
        </p>

        {botEnabled && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm font-bold">🤖 Bot Active</p>
            <p className="text-gray-400 text-xs">
              {getPersonalityDisplayInfo(botPersonality).name} (
              {getDifficultyDisplayInfo(botDifficulty).name})
            </p>
          </div>
        )}

        <div className="text-left text-sm text-gray-400 space-y-2 mb-6">
          <p>
            <span className="text-amber-400 font-mono">WASD</span> - Move
          </p>
          <p>
            <span className="text-amber-400 font-mono">Mouse</span> - Look around
          </p>
          <p>
            <span className="text-amber-400 font-mono">Space</span> - Jump
          </p>
          <p>
            <span className="text-amber-400 font-mono">LMB</span> - Shoot
          </p>
          <p>
            <span className="text-amber-400 font-mono">1</span> - AK-47
          </p>
          <p>
            <span className="text-amber-400 font-mono">2</span> - Raygun
          </p>
          <p>
            <span className="text-amber-400 font-mono">R</span> - Respawn
          </p>
          <p>
            <span className="text-amber-400 font-mono">B</span> - Toggle bot
          </p>
          <p>
            <span className="text-amber-400 font-mono">F3</span> - Toggle debug overlay
          </p>
          <p>
            <span className="text-amber-400 font-mono">ESC</span> - Release cursor
          </p>
        </div>

        <button
          onClick={onStartGame}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
        >
          Click to Play
        </button>

        {characterLoaded && (
          <p className="text-green-400 text-xs mt-4">✓ Character model loaded</p>
        )}
      </div>
    </div>
  );
}

/**
 * Match countdown overlay
 */
export function ArenaCountdown({
  remainingMs,
}: {
  remainingMs: number;
}): ReactElement {
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <p className="text-8xl font-bold text-amber-400 animate-pulse">{seconds}</p>
        <p className="text-xl text-gray-400 mt-4">Get Ready!</p>
      </div>
    </div>
  );
}

/**
 * Match results overlay
 */
export function ArenaResults({
  result,
  onPlayAgain,
  onReturnToDashboard,
}: {
  result: MatchResult;
  onPlayAgain?: () => void;
  onReturnToDashboard?: () => void;
}): ReactElement {
  const isWinner = result.winner === 'player';
  const isDraw = result.winner === 'draw';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-500/30 text-center max-w-md">
        <h1
          className={`text-4xl font-bold mb-4 ${
            isWinner ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'
          }`}
        >
          {isWinner ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
        </h1>

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">You</p>
            <p className="text-3xl font-bold text-green-400">{result.playerScore}</p>
          </div>
          <div className="text-gray-500 text-2xl self-center">vs</div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Bot</p>
            <p className="text-3xl font-bold text-red-400">{result.botScore}</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Duration: {Math.floor(result.duration / 60)}:
          {String(Math.floor(result.duration % 60)).padStart(2, '0')}
        </p>

        <div className="flex gap-4 justify-center">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
            >
              Play Again
            </button>
          )}
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ArenaOverlays manages all overlay states for the arena.
 *
 * Displays:
 * - Loading overlay with progress bar
 * - Error overlay with retry button
 * - Instructions overlay with controls
 * - Match countdown
 * - Match results
 */
export function ArenaOverlays({
  isLoading,
  loadProgress,
  loadError,
  showInstructions,
  onStartGame,
  matchState,
  countdownRemaining,
  matchResult,
  onPlayAgain,
  onReturnToDashboard,
  botEnabled,
  botPersonality,
  botDifficulty,
  characterLoaded = false,
}: ArenaOverlaysProps): ReactElement | null {
  // Loading state
  if (isLoading) {
    return <LoadingOverlay progress={loadProgress} />;
  }

  // Error state
  if (loadError) {
    return <ErrorOverlay error={loadError} onRetry={() => window.location.reload()} />;
  }

  // Match ended - show results
  if (matchState === 'ended' && matchResult) {
    return (
      <ArenaResults
        result={matchResult}
        onPlayAgain={onPlayAgain}
        onReturnToDashboard={onReturnToDashboard}
      />
    );
  }

  // Countdown state
  if (matchState === 'countdown' && countdownRemaining !== undefined) {
    return <ArenaCountdown remainingMs={countdownRemaining} />;
  }

  // Instructions state
  if (showInstructions) {
    return (
      <InstructionsOverlay
        botEnabled={botEnabled}
        botPersonality={botPersonality}
        botDifficulty={botDifficulty}
        characterLoaded={characterLoaded}
        onStartGame={onStartGame}
      />
    );
  }

  return null;
}
