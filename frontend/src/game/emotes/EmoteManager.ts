/**
 * EmoteManager - Coordinates emote state, cooldowns, and triggering
 * Requirements: 2.1, 2.2, 2.4, 2.5, 3.1-3.5, 6.1-6.4
 */

import { EMOTE_CONFIG, EMOTE_TOTAL_DURATION } from '../config/emotes'
import { EmoteAssetLoader } from './EmoteAssetLoader'
import type {
  ActiveEmote,
  EmoteAsset,
  EmoteState,
  EmoteTriggerEvent,
  EmoteInventoryItem,
} from './types'
import type { Vector2 } from '../types'

export class EmoteManager {
  private state: EmoteState
  private assetLoader: EmoteAssetLoader
  private localPlayerId: string | null = null
  private nextEmoteId = 0

  // Callbacks
  private onEmoteTrigger?: (event: EmoteTriggerEvent) => void

  constructor() {
    this.state = {
      equippedEmoteId: null,
      activeEmotes: new Map(),
      cooldownEnd: 0,
      assets: new Map(),
    }
    this.assetLoader = new EmoteAssetLoader()
  }

  /**
   * Initialize with player's inventory emotes
   * Requirements: 1.1, 7.2, 7.3
   */
  async initialize(
    localPlayerId: string,
    inventoryEmotes: EmoteInventoryItem[],
    equippedEmoteId: string | null
  ): Promise<void> {
    this.localPlayerId = localPlayerId
    this.state.equippedEmoteId = equippedEmoteId

    // Preload all inventory emotes
    await this.assetLoader.preloadEmotes(inventoryEmotes)
    this.state.assets = this.assetLoader.getAssets()
  }

  /**
   * Set callback for emote trigger events (for WebSocket)
   * Requirements: 2.3
   */
  setOnEmoteTrigger(callback: (event: EmoteTriggerEvent) => void): void {
    this.onEmoteTrigger = callback
  }

  /**
   * Attempt to trigger the equipped emote
   * Returns true if successful, false if blocked
   * Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.2
   */
  triggerEmote(playerPosition: Vector2, isAlive: boolean): boolean {
    // Guard: Must have local player ID
    if (!this.localPlayerId) {
      return false
    }

    // Guard: Must have equipped emote (Requirement 2.4)
    if (!this.state.equippedEmoteId) {
      return false
    }

    // Guard: Must be alive (Requirement 2.5)
    if (!isAlive) {
      return false
    }

    // Guard: Must not be on cooldown (Requirement 3.2)
    if (this.isOnCooldown()) {
      return false
    }

    // Create active emote (Requirement 2.2)
    this.createActiveEmote(
      this.localPlayerId,
      this.state.equippedEmoteId,
      playerPosition
    )

    // Start cooldown (Requirement 3.1)
    this.state.cooldownEnd = Date.now() + EMOTE_CONFIG.cooldown

    // Notify WebSocket (Requirement 2.3)
    const event: EmoteTriggerEvent = {
      playerId: this.localPlayerId,
      emoteId: this.state.equippedEmoteId,
      timestamp: Date.now(),
    }
    this.onEmoteTrigger?.(event)

    return true
  }

  /**
   * Handle remote emote trigger (from opponent via WebSocket)
   * Requirements: 5.3
   */
  handleRemoteEmote(event: EmoteTriggerEvent, playerPosition: Vector2): void {
    this.createActiveEmote(event.playerId, event.emoteId, playerPosition)
  }

  /**
   * Create an active emote instance
   * Requirements: 6.2
   */
  private createActiveEmote(
    playerId: string,
    emoteId: string,
    position: Vector2
  ): void {
    const activeEmote: ActiveEmote = {
      id: `emote_${playerId}_${this.nextEmoteId++}`,
      emoteId,
      playerId,
      position: {
        x: position.x,
        y: position.y + EMOTE_CONFIG.yOffset,
      },
      startTime: Date.now(),
      duration: EMOTE_CONFIG.duration,
      phase: 'pop-in',
      opacity: 1,
      scale: EMOTE_CONFIG.popInStartScale,
    }

    // Only one active emote per player
    this.state.activeEmotes.set(playerId, activeEmote)
  }

  /**
   * Update emote states - call from game loop
   * Requirements: 6.3, 4.6
   */
  update(_deltaTime: number, playerPositions: Map<string, Vector2>): void {
    const now = Date.now()

    for (const [playerId, emote] of this.state.activeEmotes) {
      const elapsed = now - emote.startTime

      // Update position to follow player (Requirement 4.6)
      const playerPos = playerPositions.get(playerId)
      if (playerPos) {
        emote.position = {
          x: playerPos.x,
          y: playerPos.y + EMOTE_CONFIG.yOffset,
        }
      }

      // Update phase and animation values
      if (elapsed < EMOTE_CONFIG.popInDuration) {
        // Pop-in phase
        emote.phase = 'pop-in'
        const progress = elapsed / EMOTE_CONFIG.popInDuration
        emote.scale =
          EMOTE_CONFIG.popInStartScale +
          (EMOTE_CONFIG.popInEndScale - EMOTE_CONFIG.popInStartScale) *
            this.easeOutBack(progress)
        emote.opacity = 1
      } else if (elapsed < emote.duration) {
        // Display phase
        emote.phase = 'display'
        emote.scale = EMOTE_CONFIG.popInEndScale
        emote.opacity = 1
      } else if (elapsed < EMOTE_TOTAL_DURATION) {
        // Fade-out phase
        emote.phase = 'fade-out'
        emote.scale = EMOTE_CONFIG.popInEndScale
        const fadeProgress =
          (elapsed - emote.duration) / EMOTE_CONFIG.fadeOutDuration
        emote.opacity = 1 - fadeProgress
      } else {
        // Expired - remove (Requirement 6.3)
        this.state.activeEmotes.delete(playerId)
      }
    }
  }

  /**
   * Easing function for pop-in animation
   */
  private easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  /**
   * Check if local player is on cooldown
   * Requirements: 3.2
   */
  isOnCooldown(): boolean {
    return Date.now() < this.state.cooldownEnd
  }

  /**
   * Get remaining cooldown time in ms
   * Requirements: 3.3
   */
  getCooldownRemaining(): number {
    return Math.max(0, this.state.cooldownEnd - Date.now())
  }

  /**
   * Get all active emotes for rendering
   * Requirements: 6.5
   */
  getActiveEmotes(): ActiveEmote[] {
    return Array.from(this.state.activeEmotes.values())
  }

  /**
   * Get asset for an emote ID
   */
  getEmoteAsset(emoteId: string): EmoteAsset | null {
    return this.state.assets.get(emoteId) ?? null
  }

  /**
   * Get all assets
   */
  getAssets(): Map<string, EmoteAsset> {
    return this.state.assets
  }

  /**
   * Update equipped emote
   * Requirements: 7.1, 3.5 (cooldown persists)
   */
  setEquippedEmote(emoteId: string | null): void {
    this.state.equippedEmoteId = emoteId
    // Note: Cooldown is NOT reset (Requirement 3.5)
  }

  /**
   * Get currently equipped emote ID
   */
  getEquippedEmoteId(): string | null {
    return this.state.equippedEmoteId
  }

  /**
   * Clear all state (on match end)
   * Requirements: 6.4
   */
  reset(): void {
    this.state.activeEmotes.clear()
    this.state.cooldownEnd = 0
  }

  /**
   * Update inventory (when emotes are purchased/acquired)
   * Requirements: 1.5
   */
  async updateInventory(emotes: EmoteInventoryItem[]): Promise<void> {
    await this.assetLoader.preloadEmotes(emotes)
    this.state.assets = this.assetLoader.getAssets()
  }

  /**
   * Get the internal state (for testing)
   */
  getState(): EmoteState {
    return this.state
  }

  /**
   * Get cooldown end timestamp (for testing)
   */
  getCooldownEnd(): number {
    return this.state.cooldownEnd
  }
}
