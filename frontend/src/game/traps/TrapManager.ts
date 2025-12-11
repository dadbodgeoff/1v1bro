/**
 * TrapManager - Coordinates all trap instances and their effects
 * 
 * @module traps/TrapManager
 */

import type { 
  TrapConfig, 
  TrapState, 
  TrapStateType,
  TrapCallbacks,
  TrapEffectResult
} from '../arena/types'
import type { MapTheme } from '../config/maps/map-schema'
import type { Vector2 } from '../types'
import { PressureTrap } from './PressureTrap'
import { TimedTrap } from './TimedTrap'
import { ProjectileTrap } from './ProjectileTrap'
import { TrapEffects } from './TrapEffects'
import {
  renderArmedTrap,
  renderWarningTrap,
  renderTriggeredTrap,
  renderCooldownTrap,
} from './TrapRenderer'
import {
  renderVolcanicArmedTrap,
  renderVolcanicWarningTrap,
  renderVolcanicTriggeredTrap,
  renderVolcanicCooldownTrap,
} from './VolcanicTrapRenderer'

// ============================================================================
// Constants
// ============================================================================

const WARNING_DURATION_MS = 300  // 0.3 seconds warning telegraph before trigger
const TRIGGER_DURATION_MS = 100  // 0.1 seconds in triggered state
const CHAIN_DELAY_MS = 300       // 0.3 seconds for chain triggers

// ============================================================================
// TrapManager Class
// ============================================================================

/**
 * TrapManager coordinates all trap instances and their effects
 */
export class TrapManager {
  private traps: Map<string, TrapState> = new Map()
  private pressureTraps: Map<string, PressureTrap> = new Map()
  private timedTraps: Map<string, TimedTrap> = new Map()
  private projectileTraps: Map<string, ProjectileTrap> = new Map()
  private trapEffects: TrapEffects = new TrapEffects()
  private callbacks: TrapCallbacks = {}
  private pendingChains: Array<{ trapId: string; triggerTime: number }> = []
  private theme: MapTheme = 'space'

  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  initialize(configs: TrapConfig[]): void {
    this.traps.clear()
    this.pressureTraps.clear()
    this.timedTraps.clear()
    this.projectileTraps.clear()
    this.pendingChains = []

    for (const config of configs) {
      this.addTrap(config)
    }
  }

  setCallbacks(callbacks: TrapCallbacks): void {
    this.callbacks = callbacks
  }

  addTrap(config: TrapConfig): void {
    const state: TrapState = {
      id: config.id,
      type: config.type,
      position: { ...config.position },
      radius: config.radius,
      effect: config.effect,
      effectValue: config.effectValue,
      cooldown: config.cooldown,
      cooldownRemaining: 0,
      state: 'armed',
      lastTriggerTime: 0,
      interval: config.interval,
      chainRadius: config.chainRadius
    }

    this.traps.set(config.id, state)

    switch (config.type) {
      case 'pressure':
        this.pressureTraps.set(config.id, new PressureTrap(state))
        break
      case 'timed':
        this.timedTraps.set(config.id, new TimedTrap(state))
        break
      case 'projectile':
        this.projectileTraps.set(config.id, new ProjectileTrap(state))
        break
    }
  }

  removeTrap(trapId: string): void {
    this.pendingChains = this.pendingChains.filter(c => c.trapId !== trapId)
    this.pressureTraps.delete(trapId)
    this.timedTraps.delete(trapId)
    this.projectileTraps.delete(trapId)
    this.traps.delete(trapId)
  }

  update(deltaTime: number, players: Map<string, Vector2>): void {
    const currentTime = Date.now()

    this.processChainTriggers(currentTime, players)

    for (const [trapId, trap] of this.traps) {
      if (trap.state === 'cooldown') {
        trap.cooldownRemaining -= deltaTime
        if (trap.cooldownRemaining <= 0) {
          trap.state = 'armed'
          trap.cooldownRemaining = 0
          this.callbacks.onCooldownComplete?.(trapId)
        }
        continue
      }

      if (trap.state === 'warning') {
        if (currentTime - trap.lastTriggerTime >= WARNING_DURATION_MS) {
          this.executeTriggeredTrap(trapId, trap, currentTime, players)
        }
        continue
      }

      if (trap.state === 'triggered') {
        if (currentTime - trap.lastTriggerTime >= TRIGGER_DURATION_MS) {
          trap.state = 'cooldown'
          trap.cooldownRemaining = trap.cooldown
        }
        continue
      }

      if (trap.state === 'armed') {
        this.checkTrapTrigger(trapId, trap, currentTime, players)
      }
    }
  }

  private checkTrapTrigger(
    trapId: string, 
    trap: TrapState, 
    currentTime: number, 
    players: Map<string, Vector2>
  ): void {
    let shouldTrigger = false
    let affectedPlayers: string[] = []

    switch (trap.type) {
      case 'pressure': {
        const pressureTrap = this.pressureTraps.get(trapId)
        if (pressureTrap) {
          affectedPlayers = pressureTrap.checkTrigger(players)
          shouldTrigger = affectedPlayers.length > 0
        }
        break
      }
      case 'timed': {
        const timedTrap = this.timedTraps.get(trapId)
        if (timedTrap && timedTrap.shouldTrigger(currentTime)) {
          shouldTrigger = true
          affectedPlayers = timedTrap.getPlayersInRadius(players)
          timedTrap.markTriggered(currentTime)
        }
        break
      }
    }

    if (shouldTrigger) {
      this.triggerTrap(trapId, affectedPlayers, currentTime, players)
    }
  }

  onProjectileHit(position: Vector2, players: Map<string, Vector2>): void {
    const currentTime = Date.now()

    for (const [trapId, projectileTrap] of this.projectileTraps) {
      const trap = this.traps.get(trapId)
      if (!trap || trap.state !== 'armed') continue

      if (projectileTrap.checkProjectileHit(position)) {
        const affectedPlayers = projectileTrap.getPlayersInRadius(players)
        this.triggerTrap(trapId, affectedPlayers, currentTime, players)
      }
    }
  }

  private triggerTrap(
    trapId: string, 
    _affectedPlayers: string[], 
    currentTime: number,
    _players: Map<string, Vector2>
  ): void {
    const trap = this.traps.get(trapId)
    if (!trap) return

    trap.state = 'warning'
    trap.lastTriggerTime = currentTime
  }

  private executeTriggeredTrap(
    trapId: string,
    trap: TrapState,
    currentTime: number,
    players: Map<string, Vector2>
  ): void {
    trap.state = 'triggered'
    trap.lastTriggerTime = currentTime

    const affectedPlayers = TrapEffects.getPlayersInRadius(
      trap.position,
      trap.radius,
      players
    )

    this.trapEffects.apply(
      trap.effect,
      trap.effectValue,
      affectedPlayers,
      trap.position,
      players
    )

    this.callbacks.onTriggered?.(trapId, affectedPlayers)

    if (trap.chainRadius) {
      this.queueChainTriggers(trapId, trap.chainRadius, currentTime)
    }
  }

  private queueChainTriggers(sourceTrapId: string, chainRadius: number, currentTime: number): void {
    const sourceTrap = this.traps.get(sourceTrapId)
    if (!sourceTrap) return

    const adjacentTraps: Array<{ id: string; distance: number }> = []

    for (const [trapId, trap] of this.traps) {
      if (trapId === sourceTrapId || trap.state !== 'armed') continue

      const dx = trap.position.x - sourceTrap.position.x
      const dy = trap.position.y - sourceTrap.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= chainRadius) {
        adjacentTraps.push({ id: trapId, distance })
      }
    }

    adjacentTraps.sort((a, b) => a.distance - b.distance)
    
    for (const adjacent of adjacentTraps) {
      this.pendingChains.push({
        trapId: adjacent.id,
        triggerTime: currentTime + CHAIN_DELAY_MS
      })
    }
  }

  private processChainTriggers(currentTime: number, players: Map<string, Vector2>): void {
    const toProcess = this.pendingChains.filter(c => currentTime >= c.triggerTime)
    this.pendingChains = this.pendingChains.filter(c => currentTime < c.triggerTime)

    for (const chain of toProcess) {
      const trap = this.traps.get(chain.trapId)
      if (!trap || trap.state !== 'armed') continue

      const affectedPlayers = TrapEffects.getPlayersInRadius(
        trap.position,
        trap.radius,
        players
      )
      this.triggerTrap(chain.trapId, affectedPlayers, currentTime, players)
    }
  }

  getTrapState(trapId: string): TrapStateType | null {
    const trap = this.traps.get(trapId)
    return trap?.state ?? null
  }

  getTrapEffectResults(): TrapEffectResult[] {
    return this.trapEffects.getAndClearResults()
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const trap of this.traps.values()) {
      this.renderTrap(ctx, trap)
    }
  }

  private renderTrap(ctx: CanvasRenderingContext2D, trap: TrapState): void {
    const { position, radius, state, cooldown, cooldownRemaining } = trap

    ctx.save()

    if (this.theme === 'volcanic') {
      switch (state) {
        case 'armed':
          renderVolcanicArmedTrap(ctx, position, radius)
          break
        case 'warning':
          renderVolcanicWarningTrap(ctx, position, radius)
          break
        case 'triggered':
          renderVolcanicTriggeredTrap(ctx, position, radius)
          break
        case 'cooldown':
          renderVolcanicCooldownTrap(ctx, position, radius, cooldown, cooldownRemaining)
          break
      }
    } else {
      switch (state) {
        case 'armed':
          renderArmedTrap(ctx, position, radius)
          break
        case 'warning':
          renderWarningTrap(ctx, position, radius)
          break
        case 'triggered':
          renderTriggeredTrap(ctx, position, radius)
          break
        case 'cooldown':
          renderCooldownTrap(ctx, position, radius, cooldown, cooldownRemaining)
          break
      }
    }

    ctx.restore()
  }
}
