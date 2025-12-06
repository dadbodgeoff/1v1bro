/**
 * BuffManager - Client-side buff tracking
 * Mirrors server buff state for rendering and UI feedback
 */

export type BuffType = 'damage_boost' | 'speed_boost' | 'vulnerability' | 'shield' | 'invulnerable'

export interface ActiveBuff {
  type: BuffType
  value: number
  remaining: number // seconds
  source: string
}

export interface BuffState {
  playerId: string
  buffs: ActiveBuff[]
}

export class BuffManager {
  private buffs: Map<string, ActiveBuff[]> = new Map()
  private callbacks: {
    onBuffApplied?: (playerId: string, buff: ActiveBuff) => void
    onBuffExpired?: (playerId: string, buffType: BuffType) => void
  } = {}

  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Update buff state from server broadcast
   */
  setFromServer(buffState: Record<string, Array<{ type: string; value: number; remaining: number; source: string }>>): void {
    for (const [playerId, serverBuffs] of Object.entries(buffState)) {
      const currentBuffs = this.buffs.get(playerId) || []
      const newBuffs: ActiveBuff[] = serverBuffs.map(b => ({
        type: b.type as BuffType,
        value: b.value,
        remaining: b.remaining,
        source: b.source,
      }))

      // Check for new buffs
      for (const newBuff of newBuffs) {
        const existing = currentBuffs.find(b => b.type === newBuff.type)
        if (!existing) {
          this.callbacks.onBuffApplied?.(playerId, newBuff)
        }
      }

      // Check for expired buffs
      for (const oldBuff of currentBuffs) {
        const stillActive = newBuffs.find(b => b.type === oldBuff.type)
        if (!stillActive) {
          this.callbacks.onBuffExpired?.(playerId, oldBuff.type)
        }
      }

      this.buffs.set(playerId, newBuffs)
    }
  }

  /**
   * Apply buff from quiz reward event
   */
  applyBuff(playerId: string, buff: ActiveBuff): void {
    const playerBuffs = this.buffs.get(playerId) || []
    const filtered = playerBuffs.filter(b => b.type !== buff.type)
    filtered.push(buff)
    this.buffs.set(playerId, filtered)
    this.callbacks.onBuffApplied?.(playerId, buff)
  }

  /**
   * Get active buffs for a player
   */
  getBuffs(playerId: string): ActiveBuff[] {
    return this.buffs.get(playerId) || []
  }

  /**
   * Check if player has a specific buff
   */
  hasBuff(playerId: string, type: BuffType): boolean {
    const playerBuffs = this.buffs.get(playerId) || []
    return playerBuffs.some(b => b.type === type)
  }

  /**
   * Get buff value (0 if not active)
   */
  getBuffValue(playerId: string, type: BuffType): number {
    const playerBuffs = this.buffs.get(playerId) || []
    const buff = playerBuffs.find(b => b.type === type)
    return buff?.value || 0
  }

  /**
   * Get damage multiplier for a player (for UI display)
   */
  getDamageMultiplier(playerId: string): number {
    return 1 + this.getBuffValue(playerId, 'damage_boost')
  }

  /**
   * Get speed multiplier for a player (for UI display)
   */
  getSpeedMultiplier(playerId: string): number {
    return 1 + this.getBuffValue(playerId, 'speed_boost')
  }

  /**
   * Check if player is vulnerable
   */
  isVulnerable(playerId: string): boolean {
    return this.hasBuff(playerId, 'vulnerability')
  }

  /**
   * Clear all buffs for a player (on death)
   */
  clearPlayer(playerId: string): void {
    this.buffs.delete(playerId)
  }

  /**
   * Reset all buff state
   */
  reset(): void {
    this.buffs.clear()
  }
}
