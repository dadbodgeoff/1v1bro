/**
 * ZoneManager - Centralized zone effect management
 * 
 * @module zones/ZoneManager
 */

import type { 
  ZoneEffect, 
  EffectState, 
  ZoneManagerCallbacks 
} from '../arena/types'
import { EffectStack } from './EffectStack'

// ============================================================================
// ZoneManager Class
// ============================================================================

/**
 * ZoneManager maintains effect registries for all players
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */
export class ZoneManager {
  private playerEffects: Map<string, EffectStack> = new Map()
  private callbacks: ZoneManagerCallbacks = {}

  /**
   * Set event callbacks
   * Requirements: 8.6
   * 
   * @param callbacks - Callback functions for zone events
   */
  setCallbacks(callbacks: ZoneManagerCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Add an effect to a player
   * Requirements: 8.2
   * 
   * @param playerId - Player ID
   * @param effect - Effect to add
   */
  addEffect(playerId: string, effect: ZoneEffect): void {
    let stack = this.playerEffects.get(playerId)
    if (!stack) {
      stack = new EffectStack()
      this.playerEffects.set(playerId, stack)
    }

    const isNew = stack.addEffect(effect)
    
    if (isNew) {
      this.callbacks.onEffectAdded?.(playerId, effect)
    } else {
      this.callbacks.onEffectModified?.(playerId, effect)
    }
  }

  /**
   * Remove an effect from a player by source ID
   * Requirements: 8.3
   * 
   * @param playerId - Player ID
   * @param sourceId - Source ID of effect to remove
   */
  removeEffect(playerId: string, sourceId: string): void {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return

    const removed = stack.removeEffect(sourceId)
    if (removed) {
      this.callbacks.onEffectRemoved?.(playerId, sourceId)
    }

    // Clean up empty stacks
    if (stack.isEmpty()) {
      this.playerEffects.delete(playerId)
    }
  }

  /**
   * Clean up effects from zones the player has left
   * Requirements: 8.9
   * 
   * @param playerId - Player ID
   * @param activeSourceIds - IDs of zones the player is currently in
   */
  cleanupStaleEffects(playerId: string, activeSourceIds: string[]): void {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return

    const activeSet = new Set(activeSourceIds)
    const currentSourceIds = stack.getSourceIds()

    for (const sourceId of currentSourceIds) {
      if (!activeSet.has(sourceId)) {
        this.removeEffect(playerId, sourceId)
      }
    }
  }

  /**
   * Get aggregated effect state for a player
   * Requirements: 8.5
   * 
   * @param playerId - Player ID
   * @returns Aggregated EffectState
   */
  getEffectState(playerId: string): EffectState {
    const stack = this.playerEffects.get(playerId)
    if (!stack) {
      return {
        speedMultiplier: 1.0,
        damagePerSecond: 0,
        powerUpsDisabled: false,
        activeEffects: []
      }
    }
    return stack.getAggregatedState()
  }

  /**
   * Get active effects for a player
   * Requirements: 8.8
   * 
   * @param playerId - Player ID
   * @returns Array of active effects
   */
  getActiveEffects(playerId: string): ZoneEffect[] {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return []
    return stack.getEffects()
  }

  /**
   * Clear all effects for a player
   * Requirements: 8.10
   * 
   * @param playerId - Player ID
   */
  clearPlayerEffects(playerId: string): void {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return

    const effects = stack.getEffects()
    for (const effect of effects) {
      this.callbacks.onEffectRemoved?.(playerId, effect.sourceId)
    }

    stack.clear()
    this.playerEffects.delete(playerId)
  }

  /**
   * Check if a player has a specific effect type
   * 
   * @param playerId - Player ID
   * @param effectType - Effect type to check
   * @returns true if player has effect type
   */
  hasEffect(playerId: string, effectType: ZoneEffect['type']): boolean {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return false
    return stack.hasEffectType(effectType)
  }

  /**
   * Get effect icons for UI display
   * Requirements: 8.7
   * 
   * @param playerId - Player ID
   * @returns Array of effect types for icon display
   */
  getEffectIcons(playerId: string): ZoneEffect['type'][] {
    const stack = this.playerEffects.get(playerId)
    if (!stack) return []

    const types = new Set<ZoneEffect['type']>()
    for (const effect of stack.getEffects()) {
      types.add(effect.type)
    }
    return Array.from(types)
  }

  /**
   * Get all players with active effects
   * 
   * @returns Array of player IDs
   */
  getPlayersWithEffects(): string[] {
    return Array.from(this.playerEffects.keys())
  }

  /**
   * Clear all effects for all players
   */
  clearAll(): void {
    for (const playerId of this.playerEffects.keys()) {
      this.clearPlayerEffects(playerId)
    }
  }
}
