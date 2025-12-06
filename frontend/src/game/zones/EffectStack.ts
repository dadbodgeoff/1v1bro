/**
 * EffectStack - Manages player effect stacking
 * 
 * @module zones/EffectStack
 */

import type { ZoneEffect, EffectState } from '../arena/types'

// ============================================================================
// EffectStack Class
// ============================================================================

/**
 * EffectStack manages the stack of zone effects on a single player
 * Requirements: 8.2, 8.3, 8.4
 */
export class EffectStack {
  private effects: Map<string, ZoneEffect> = new Map()  // sourceId -> effect

  /**
   * Add an effect to the stack
   * Requirements: 8.2
   * 
   * @param effect - Effect to add
   * @returns true if this is a new effect, false if updated existing
   */
  addEffect(effect: ZoneEffect): boolean {
    const isNew = !this.effects.has(effect.sourceId)
    this.effects.set(effect.sourceId, effect)
    return isNew
  }

  /**
   * Remove an effect by source ID
   * Requirements: 8.3
   * 
   * @param sourceId - Source ID of effect to remove
   * @returns true if effect was removed
   */
  removeEffect(sourceId: string): boolean {
    return this.effects.delete(sourceId)
  }

  /**
   * Get all source IDs
   * 
   * @returns Array of source IDs
   */
  getSourceIds(): string[] {
    return Array.from(this.effects.keys())
  }

  /**
   * Get all effects
   * 
   * @returns Array of effects
   */
  getEffects(): ZoneEffect[] {
    return Array.from(this.effects.values())
  }

  /**
   * Check if stack has an effect of a specific type
   * 
   * @param type - Effect type to check
   * @returns true if effect type exists
   */
  hasEffectType(type: ZoneEffect['type']): boolean {
    for (const effect of this.effects.values()) {
      if (effect.type === type) return true
    }
    return false
  }

  /**
   * Get effect by source ID
   * 
   * @param sourceId - Source ID
   * @returns Effect or undefined
   */
  getEffect(sourceId: string): ZoneEffect | undefined {
    return this.effects.get(sourceId)
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.effects.clear()
  }

  /**
   * Get number of active effects
   * 
   * @returns Effect count
   */
  size(): number {
    return this.effects.size
  }

  /**
   * Check if stack is empty
   * 
   * @returns true if no effects
   */
  isEmpty(): boolean {
    return this.effects.size === 0
  }

  /**
   * Get aggregated effect state
   * Requirements: 8.4
   * 
   * Aggregation rules:
   * - speed_modifier: multiplicative (multiply all values)
   * - damage_over_time: additive (sum all values)
   * - power_up_disable: boolean OR (true if any effect is true)
   * 
   * @returns Aggregated EffectState
   */
  getAggregatedState(): EffectState {
    let speedMultiplier = 1.0
    let damagePerSecond = 0
    let powerUpsDisabled = false
    const activeEffects: ZoneEffect[] = []

    for (const effect of this.effects.values()) {
      activeEffects.push(effect)

      switch (effect.type) {
        case 'speed_modifier':
          // Multiplicative: multiply all speed modifiers
          speedMultiplier *= effect.value
          break
        case 'damage_over_time':
          // Additive: sum all damage values
          damagePerSecond += effect.value
          break
        case 'power_up_disable':
          // Boolean OR: true if any effect disables
          powerUpsDisabled = powerUpsDisabled || effect.value > 0
          break
      }
    }

    return {
      speedMultiplier,
      damagePerSecond,
      powerUpsDisabled,
      activeEffects
    }
  }

  /**
   * Get strongest effect of a specific type
   * 
   * @param type - Effect type
   * @returns Strongest effect or undefined
   */
  getStrongestEffect(type: ZoneEffect['type']): ZoneEffect | undefined {
    let strongest: ZoneEffect | undefined

    for (const effect of this.effects.values()) {
      if (effect.type !== type) continue

      if (!strongest) {
        strongest = effect
        continue
      }

      // For speed_modifier, lower is stronger (more slow)
      // For damage_over_time, higher is stronger
      // For power_up_disable, any is equally strong
      if (type === 'speed_modifier') {
        if (effect.value < strongest.value) {
          strongest = effect
        }
      } else if (type === 'damage_over_time') {
        if (effect.value > strongest.value) {
          strongest = effect
        }
      }
    }

    return strongest
  }
}
