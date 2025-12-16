/**
 * LifeEnforcer - Centralized life management and game over enforcement
 *
 * Responsibilities:
 * - Monitor life count changes
 * - Trigger respawn when lives > 0
 * - Trigger immediate game over when lives = 0
 * - Prevent race conditions and duplicate triggers
 */

export interface LifeEnforcerCallbacks {
  onRespawn: () => void
  onGameOver: () => void
  getCurrentLives: () => number
}

export class LifeEnforcer {
  private callbacks: LifeEnforcerCallbacks
  private isProcessingLifeLoss: boolean = false
  private lastKnownLives: number = 3
  private gameOverTriggered: boolean = false
  private respawnTimer: ReturnType<typeof setTimeout> | null = null

  // Timing constants
  private readonly RESPAWN_DELAY_MS = 1000 // Time before respawn after death
  private readonly GAME_OVER_DELAY_MS = 10 // Near-instant game over (0.01 seconds)

  constructor(callbacks: LifeEnforcerCallbacks) {
    this.callbacks = callbacks
    this.lastKnownLives = callbacks.getCurrentLives()
  }

  /**
   * Called when a life is lost
   * Handles respawn or game over based on remaining lives
   */
  onLifeLost(): void {
    // Prevent duplicate processing
    if (this.isProcessingLifeLoss || this.gameOverTriggered) {
      return
    }

    this.isProcessingLifeLoss = true
    const currentLives = this.callbacks.getCurrentLives()
    this.lastKnownLives = currentLives

    if (currentLives <= 0) {
      // GAME OVER - trigger almost immediately
      this.gameOverTriggered = true

      // Clear any pending respawn
      if (this.respawnTimer) {
        clearTimeout(this.respawnTimer)
        this.respawnTimer = null
      }

      // Trigger game over after tiny delay (allows death animation to start)
      setTimeout(() => {
        this.callbacks.onGameOver()
        this.isProcessingLifeLoss = false
      }, this.GAME_OVER_DELAY_MS)
    } else {
      // RESPAWN - trigger after delay for death animation
      this.respawnTimer = setTimeout(() => {
        // Double-check we haven't hit game over during the delay
        if (!this.gameOverTriggered) {
          this.callbacks.onRespawn()
        }
        this.isProcessingLifeLoss = false
        this.respawnTimer = null
      }, this.RESPAWN_DELAY_MS)
    }
  }

  /**
   * Force check current lives (for safety)
   * Call this periodically to catch any missed life loss events
   */
  checkLives(): void {
    if (this.gameOverTriggered || this.isProcessingLifeLoss) {
      return
    }

    const currentLives = this.callbacks.getCurrentLives()

    // Detect if lives decreased without onLifeLost being called
    if (currentLives < this.lastKnownLives) {
      this.lastKnownLives = currentLives

      if (currentLives <= 0) {
        this.gameOverTriggered = true
        this.callbacks.onGameOver()
      }
    }

    this.lastKnownLives = currentLives
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.isProcessingLifeLoss = false
    this.gameOverTriggered = false
    this.lastKnownLives = this.callbacks.getCurrentLives()

    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer)
      this.respawnTimer = null
    }
  }

  /**
   * Check if game over has been triggered
   */
  isGameOver(): boolean {
    return this.gameOverTriggered
  }
}
