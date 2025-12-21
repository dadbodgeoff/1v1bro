/**
 * BotMatchManager - Manages bot vs player matches
 *
 * Handles bot spawning, match state, and integration with game systems.
 */

import { Vector3 as ThreeVector3 } from 'three';
import type {
  BotPersonalityType,
  CoverPosition,
  DifficultyLevel,
} from './types';
import { BotPlayer } from './BotPlayer';
import type { BotMatchContext, BotPlayerState } from './BotPlayer';
import { Vector3 } from '../math/Vector3';
import type { SpawnSystem } from '../game/SpawnSystem';
import type { CombatSystem } from '../game/CombatSystem';
import type { IEventBus } from '../core/EventBus';

/**
 * Match configuration
 */
export interface BotMatchConfig {
  matchDurationSeconds: number;
  scoreLimit: number;
  botPersonality?: BotPersonalityType | 'random';
  botDifficulty?: DifficultyLevel;
  mapBounds: { min: ThreeVector3; max: ThreeVector3 };
  coverPositions?: CoverPosition[];
}

/**
 * Match state
 */
export type MatchState = 'waiting' | 'countdown' | 'playing' | 'ended';

/**
 * Match result
 */
export interface MatchResult {
  winner: 'player' | 'bot' | 'draw';
  playerScore: number;
  botScore: number;
  duration: number;
}

/**
 * Default match configuration
 */
const DEFAULT_MATCH_CONFIG: BotMatchConfig = {
  matchDurationSeconds: 180, // 3 minutes
  scoreLimit: 10,
  botPersonality: 'random',
  botDifficulty: 'medium',
  mapBounds: {
    min: new ThreeVector3(-20, 0, -20),
    max: new ThreeVector3(20, 10, 20),
  },
};

/**
 * Bot player ID (always 999 to distinguish from real players)
 */
const BOT_PLAYER_ID = 999;

export class BotMatchManager {
  private config: BotMatchConfig;
  private bot: BotPlayer | null = null;
  private spawnSystem: SpawnSystem;
  private combatSystem: CombatSystem;
  private eventBus: IEventBus;

  // Match state
  private state: MatchState = 'waiting';
  private matchStartTime: number = 0;
  private timeRemaining: number = 0;
  private playerScore: number = 0;
  private localPlayerId: number = 0;

  // Player tracking
  private playerPosition: Vector3 = Vector3.ZERO;
  private playerVelocity: Vector3 = Vector3.ZERO;
  private playerHealth: number = 100;

  // Visibility (simplified - would use raycasting in production)
  private playerVisible: boolean = false;
  private lastVisibilityCheck: number = 0;
  private visibilityCheckInterval: number = 100; // ms

  constructor(
    spawnSystem: SpawnSystem,
    combatSystem: CombatSystem,
    eventBus: IEventBus,
    config?: Partial<BotMatchConfig>
  ) {
    this.spawnSystem = spawnSystem;
    this.combatSystem = combatSystem;
    this.eventBus = eventBus;
    this.config = { ...DEFAULT_MATCH_CONFIG, ...config };
  }

  /**
   * Set initial player position (call before startMatch for proper bot spawn)
   */
  setPlayerPosition(position: Vector3): void {
    this.playerPosition = position;
  }

  /**
   * Start a new bot match
   */
  startMatch(localPlayerId: number): void {
    this.localPlayerId = localPlayerId;
    this.playerScore = 0;
    this.matchStartTime = Date.now();
    this.timeRemaining = this.config.matchDurationSeconds;

    // Create bot
    this.bot = new BotPlayer({
      playerId: BOT_PLAYER_ID,
      personality: this.config.botPersonality,
      difficulty: this.config.botDifficulty,
    });

    // Initialize bot in combat system
    this.combatSystem.initializePlayer(BOT_PLAYER_ID);

    // Spawn bot
    this.spawnBot();

    // Start match
    this.state = 'playing';

    // Emit match start event
    this.eventBus.emit({
      type: 'match_started',
      timestamp: Date.now(),
      matchType: 'bot',
      botPersonality: this.bot.getPersonality().type,
      botDifficulty: this.bot.getDifficulty().name,
    });
  }

  /**
   * Update match each tick
   * 
   * NOTE: Bot shooting is handled in Arena.tsx, not here.
   * This method only updates bot AI state and movement.
   */
  update(
    deltaMs: number,
    playerPosition: Vector3,
    playerVelocity: Vector3,
    playerHealth: number
  ): void {
    if (this.state !== 'playing' || !this.bot) return;

    // Update player tracking
    this.playerPosition = playerPosition;
    this.playerVelocity = playerVelocity;
    this.playerHealth = playerHealth;

    // Update time
    const elapsed = (Date.now() - this.matchStartTime) / 1000;
    this.timeRemaining = Math.max(0, this.config.matchDurationSeconds - elapsed);

    // Check match end conditions
    if (this.checkMatchEnd()) {
      this.endMatch();
      return;
    }

    // Update visibility
    this.updateVisibility();

    // NOTE: Bot respawn is now handled in Arena.tsx to ensure proper
    // coordination with CombatSystem and visual updates

    // Build context for bot
    const context: BotMatchContext = {
      playerPosition: this.playerPosition,
      playerVelocity: this.playerVelocity,
      playerHealth: this.playerHealth,
      playerVisible: this.playerVisible,
      playerScore: this.playerScore,
      timeRemaining: this.timeRemaining,
      matchDuration: this.config.matchDurationSeconds,
      coverPositions: this.config.coverPositions ?? [],
      mapBounds: this.config.mapBounds,
    };

    // Update bot AI (movement decisions, state machine)
    // NOTE: Bot shooting is handled separately in Arena.tsx with proper
    // line-of-sight checks and collision detection
    this.bot.update(deltaMs, context);
  }

  /**
   * Update visibility check
   */
  private updateVisibility(): void {
    const now = Date.now();
    if (now - this.lastVisibilityCheck < this.visibilityCheckInterval) {
      return;
    }
    this.lastVisibilityCheck = now;

    if (!this.bot) {
      this.playerVisible = false;
      return;
    }

    const botPos = this.bot.getPosition();
    const distance = botPos.distanceTo(this.playerPosition);

    // Simple visibility: within range and not too far
    // In production, would use raycasting against collision world
    this.playerVisible = distance < 30 && distance > 0.5;
  }

  /**
   * Player hit the bot
   * 
   * NOTE: Score tracking is handled in Arena.tsx to avoid double-counting.
   * This method only applies damage to the bot.
   */
  onPlayerHitBot(damage: number): void {
    if (!this.bot) return;

    this.bot.applyDamage(damage, this.localPlayerId);

    // NOTE: Score increment moved to Arena.tsx to prevent double-counting
    // The caller (Arena.tsx) checks if bot died and increments playerScore there
  }

  /**
   * Spawn bot at a spawn point
   */
  private spawnBot(): void {
    if (!this.bot) return;

    const spawnPoint = this.spawnSystem.selectSpawnPoint(
      BOT_PLAYER_ID,
      [this.playerPosition]
    );

    this.bot.respawn(spawnPoint.position);
    // Use performance.now() to match CombatSystem's time base
    this.combatSystem.respawnPlayer(BOT_PLAYER_ID, performance.now());
  }

  /**
   * Check if match should end
   */
  private checkMatchEnd(): boolean {
    if (this.timeRemaining <= 0) return true;
    if (this.playerScore >= this.config.scoreLimit) return true;
    if (this.bot && this.bot.getScore() >= this.config.scoreLimit) return true;
    return false;
  }

  /**
   * End the match
   */
  private endMatch(): void {
    this.state = 'ended';

    const result = this.getMatchResult();

    this.eventBus.emit({
      type: 'match_ended',
      timestamp: Date.now(),
      winner: result.winner,
      playerScore: result.playerScore,
      botScore: result.botScore,
      duration: result.duration,
    });
  }

  /**
   * Get match result
   */
  getMatchResult(): MatchResult {
    const botScore = this.bot?.getScore() ?? 0;
    const duration = (Date.now() - this.matchStartTime) / 1000;

    let winner: 'player' | 'bot' | 'draw';
    if (this.playerScore > botScore) {
      winner = 'player';
    } else if (botScore > this.playerScore) {
      winner = 'bot';
    } else {
      winner = 'draw';
    }

    return {
      winner,
      playerScore: this.playerScore,
      botScore,
      duration,
    };
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getState(): MatchState {
    return this.state;
  }

  getBot(): BotPlayer | null {
    return this.bot;
  }

  getBotState(): BotPlayerState | null {
    return this.bot?.getState() ?? null;
  }

  getPlayerScore(): number {
    return this.playerScore;
  }

  getBotScore(): number {
    return this.bot?.getScore() ?? 0;
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  getConfig(): BotMatchConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<BotMatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.bot) {
      this.combatSystem.removePlayer(BOT_PLAYER_ID);
      this.bot.dispose();
      this.bot = null;
    }
    this.state = 'waiting';
  }
}
