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

    // Check bot respawn
    if (this.bot.checkRespawn(Date.now())) {
      this.spawnBot();
    }

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

    // Update bot
    const output = this.bot.update(deltaMs, context);

    // Process bot shooting
    if (output.shouldShoot && !this.bot.getState().isDead) {
      this.processBotShot(output.aimTarget);
    }
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
   * Process bot shooting
   */
  private processBotShot(aimTarget: ThreeVector3): void {
    if (!this.bot) return;

    const botPos = this.bot.getPosition();
    const direction = new Vector3(
      aimTarget.x - botPos.x,
      aimTarget.y - botPos.y,
      aimTarget.z - botPos.z
    ).normalize();

    // Check if shot hits player (simplified)
    const toPlayer = this.playerPosition.subtract(botPos);
    const distance = toPlayer.magnitude();
    const dot = direction.dot(toPlayer.normalize());

    // Hit if aiming roughly at player and within range
    const hitThreshold = 0.9; // cos(~25 degrees)
    const isHit = dot > hitThreshold && distance < 50;

    if (isHit) {
      // Apply damage to player
      const damage = 25; // Standard damage
      this.combatSystem.applyDamage(
        this.localPlayerId,
        BOT_PLAYER_ID,
        damage,
        this.playerPosition,
        Date.now()
      );

      this.bot.recordHit(damage);

      // Check if player died
      const playerState = this.combatSystem.getPlayerState(this.localPlayerId);
      if (playerState?.isDead) {
        this.bot.addKill();
      }
    } else {
      this.bot.recordMiss();
    }
  }

  /**
   * Player hit the bot
   */
  onPlayerHitBot(damage: number): void {
    if (!this.bot) return;

    this.bot.applyDamage(damage, this.localPlayerId);

    // Check if bot died
    if (this.bot.getState().isDead) {
      this.playerScore++;

      this.eventBus.emit({
        type: 'player_scored',
        timestamp: Date.now(),
        playerId: this.localPlayerId,
        newScore: this.playerScore,
      });
    }
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
    this.combatSystem.respawnPlayer(BOT_PLAYER_ID, Date.now());
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
