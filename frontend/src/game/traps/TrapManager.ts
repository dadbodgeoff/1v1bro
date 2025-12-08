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
import { arenaAssets } from '../assets/ArenaAssetLoader'
import { VOLCANIC_COLORS } from '../backdrop/types'

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
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
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

  /**
   * Set the visual theme for trap rendering
   * @param theme - Map theme ('space' | 'volcanic' | etc.)
   */
  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  /**
   * Initialize traps from map configuration
   * 
   * @param configs - Array of trap configurations
   */
  initialize(configs: TrapConfig[]): void {
    this.traps.clear()
    this.pressureTraps.clear()
    this.timedTraps.clear()
    this.projectileTraps.clear()
    this.pendingChains = []

    for (const config of configs) {
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
  }

  /**
   * Set event callbacks
   * 
   * @param callbacks - Callback functions for trap events
   */
  setCallbacks(callbacks: TrapCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Add a single trap dynamically
   * 
   * @param config - Trap configuration to add
   */
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

  /**
   * Remove a trap dynamically
   * 
   * @param trapId - ID of trap to remove
   */
  removeTrap(trapId: string): void {
    // Remove from pending chains
    this.pendingChains = this.pendingChains.filter(c => c.trapId !== trapId)
    
    // Clean up type-specific data
    this.pressureTraps.delete(trapId)
    this.timedTraps.delete(trapId)
    this.projectileTraps.delete(trapId)
    this.traps.delete(trapId)
  }

  /**
   * Update trap states and check triggers
   * Requirements: 4.1, 4.2, 4.6
   * 
   * @param deltaTime - Time since last update in seconds
   * @param players - Map of player IDs to positions
   */
  update(deltaTime: number, players: Map<string, Vector2>): void {
    const currentTime = Date.now()

    // Process pending chain triggers
    this.processChainTriggers(currentTime, players)

    for (const [trapId, trap] of this.traps) {
      // Update cooldown
      if (trap.state === 'cooldown') {
        trap.cooldownRemaining -= deltaTime
        if (trap.cooldownRemaining <= 0) {
          trap.state = 'armed'
          trap.cooldownRemaining = 0
          this.callbacks.onCooldownComplete?.(trapId)
        }
        continue
      }

      // Update warning state - telegraph before actual trigger
      if (trap.state === 'warning') {
        if (currentTime - trap.lastTriggerTime >= WARNING_DURATION_MS) {
          // Warning period over, now actually trigger
          this.executeTriggeredTrap(trapId, trap, currentTime, players)
        }
        continue
      }

      // Update triggered state
      if (trap.state === 'triggered') {
        if (currentTime - trap.lastTriggerTime >= TRIGGER_DURATION_MS) {
          trap.state = 'cooldown'
          trap.cooldownRemaining = trap.cooldown
        }
        continue
      }

      // Check for triggers (armed state)
      if (trap.state === 'armed') {
        this.checkTrapTrigger(trapId, trap, currentTime, players)
      }
    }
  }

  /**
   * Check if a trap should trigger
   */
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

  /**
   * Handle projectile hit on traps
   * Requirements: 4.3
   * 
   * @param position - Projectile position
   * @param players - Map of player positions
   */
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

  /**
   * Start trap warning state (telegraph before actual trigger)
   * Requirements: 4.4, 4.5, 4.9
   * 
   * @param trapId - ID of trap to trigger
   * @param _affectedPlayers - Players affected by the trap (used after warning)
   * @param currentTime - Current timestamp
   * @param _players - Map of player positions
   */
  private triggerTrap(
    trapId: string, 
    _affectedPlayers: string[], 
    currentTime: number,
    _players: Map<string, Vector2>
  ): void {
    const trap = this.traps.get(trapId)
    if (!trap) return

    // Enter warning state - gives players 0.3s to escape
    trap.state = 'warning'
    trap.lastTriggerTime = currentTime
  }

  /**
   * Execute the actual trap effect after warning period
   */
  private executeTriggeredTrap(
    trapId: string,
    trap: TrapState,
    currentTime: number,
    players: Map<string, Vector2>
  ): void {
    // Update trap state to triggered
    trap.state = 'triggered'
    trap.lastTriggerTime = currentTime

    // Get players currently in radius (they may have escaped during warning)
    const affectedPlayers = TrapEffects.getPlayersInRadius(
      trap.position,
      trap.radius,
      players
    )

    // Apply effect only to players still in range
    this.trapEffects.apply(
      trap.effect,
      trap.effectValue,
      affectedPlayers,
      trap.position,
      players
    )

    // Emit event
    this.callbacks.onTriggered?.(trapId, affectedPlayers)

    // Queue chain triggers
    if (trap.chainRadius) {
      this.queueChainTriggers(trapId, trap.chainRadius, currentTime)
    }
  }

  /**
   * Queue adjacent traps for chain triggering
   * Requirements: 4.9
   */
  private queueChainTriggers(sourceTrapId: string, chainRadius: number, currentTime: number): void {
    const sourceTrap = this.traps.get(sourceTrapId)
    if (!sourceTrap) return

    // Find adjacent traps within chain radius
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

    // Sort by distance and queue
    adjacentTraps.sort((a, b) => a.distance - b.distance)
    
    for (const adjacent of adjacentTraps) {
      this.pendingChains.push({
        trapId: adjacent.id,
        triggerTime: currentTime + CHAIN_DELAY_MS
      })
    }
  }

  /**
   * Process pending chain triggers
   * Requirements: 4.10
   */
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

  /**
   * Get trap state
   * Requirements: 4.11
   * 
   * @param trapId - Trap ID
   * @returns Trap state type or null
   */
  getTrapState(trapId: string): TrapStateType | null {
    const trap = this.traps.get(trapId)
    return trap?.state ?? null
  }

  /**
   * Get trap effect results
   * 
   * @returns Array of effect results
   */
  getTrapEffectResults(): TrapEffectResult[] {
    return this.trapEffects.getAndClearResults()
  }

  /**
   * Render all traps
   * Requirements: 4.7, 4.8
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const trap of this.traps.values()) {
      this.renderTrap(ctx, trap)
    }
  }

  /**
   * Render a single trap
   */
  private renderTrap(ctx: CanvasRenderingContext2D, trap: TrapState): void {
    const { position, radius, state, cooldown, cooldownRemaining } = trap

    ctx.save()

    // Use volcanic rendering if theme is volcanic
    if (this.theme === 'volcanic') {
      switch (state) {
        case 'armed':
          this.renderVolcanicArmedTrap(ctx, position, radius)
          break
        case 'warning':
          this.renderVolcanicWarningTrap(ctx, position, radius)
          break
        case 'triggered':
          this.renderVolcanicTriggeredTrap(ctx, position, radius)
          break
        case 'cooldown':
          this.renderVolcanicCooldownTrap(ctx, position, radius, cooldown, cooldownRemaining)
          break
      }
    } else {
      // State-based visuals (default theme)
      switch (state) {
        case 'armed':
          this.renderArmedTrap(ctx, position, radius)
          break
        case 'warning':
          this.renderWarningTrap(ctx, position, radius)
          break
        case 'triggered':
          this.renderTriggeredTrap(ctx, position, radius)
          break
        case 'cooldown':
          this.renderCooldownTrap(ctx, position, radius, cooldown, cooldownRemaining)
          break
      }
    }

    ctx.restore()
  }

  /**
   * Render armed trap with mine icon
   */
  private renderArmedTrap(ctx: CanvasRenderingContext2D, position: Vector2, radius: number): void {
    const time = Date.now() / 1000
    const pulse = 0.5 + 0.5 * Math.sin(time * 4)

    // Draw mine icon from image asset
    const iconSize = radius * 2.2
    ctx.globalAlpha = 0.85 + pulse * 0.15
    const drawn = arenaAssets.drawCentered(ctx, 'trap-mine', position.x, position.y, iconSize, iconSize)
    ctx.globalAlpha = 1

    // Fallback if image not loaded
    if (!drawn) {
      // Main body gradient
      const gradient = ctx.createRadialGradient(
        position.x, position.y - radius * 0.3, 0,
        position.x, position.y, radius
      )
      gradient.addColorStop(0, `rgba(255, 120, 80, ${0.6 + pulse * 0.3})`)
      gradient.addColorStop(0.6, `rgba(200, 50, 50, ${0.5 + pulse * 0.3})`)
      gradient.addColorStop(1, `rgba(150, 30, 30, ${0.4 + pulse * 0.2})`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Warning symbol
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', position.x, position.y)
    }
  }

  /**
   * Render warning state - flashing danger indicator before explosion
   * Gives players 0.3s to escape
   */
  private renderWarningTrap(ctx: CanvasRenderingContext2D, position: Vector2, radius: number): void {
    const time = Date.now() / 1000
    // Fast flashing during warning
    const flash = Math.sin(time * 30) > 0 ? 1 : 0.3

    // Expanding danger ring
    ctx.strokeStyle = `rgba(255, 50, 50, ${flash})`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
    ctx.stroke()

    // Inner danger zone fill
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius * 1.2
    )
    gradient.addColorStop(0, `rgba(255, 100, 50, ${0.6 * flash})`)
    gradient.addColorStop(1, `rgba(255, 50, 50, ${0.3 * flash})`)
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 1.2, 0, Math.PI * 2)
    ctx.fill()

    // Draw mine icon (dimmer)
    const iconSize = radius * 2.2
    ctx.globalAlpha = 0.5 + flash * 0.5
    arenaAssets.drawCentered(ctx, 'trap-mine', position.x, position.y, iconSize, iconSize)
    ctx.globalAlpha = 1

    // Warning text
    ctx.fillStyle = `rgba(255, 255, 255, ${flash})`
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('!', position.x, position.y - radius - 15)
  }

  /**
   * Render triggered trap with explosion effect
   */
  private renderTriggeredTrap(ctx: CanvasRenderingContext2D, position: Vector2, radius: number): void {
    // Explosion rings
    const time = Date.now() / 1000
    const expand = ((time * 10) % 1)
    
    for (let i = 0; i < 3; i++) {
      const ringExpand = (expand + i * 0.3) % 1
      const ringRadius = radius * (1 + ringExpand * 2)
      const alpha = 1 - ringExpand
      
      ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`
      ctx.lineWidth = 4 - ringExpand * 3
      ctx.beginPath()
      ctx.arc(position.x, position.y, ringRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Bright flash center
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius * 1.5
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.7)')
    gradient.addColorStop(1, 'rgba(255, 100, 50, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Render cooldown trap with progress indicator
   * Requirements: 4.8
   */
  private renderCooldownTrap(
    ctx: CanvasRenderingContext2D, 
    position: Vector2, 
    radius: number,
    cooldown: number,
    cooldownRemaining: number
  ): void {
    // Dim base
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, 'rgba(80, 80, 80, 0.4)')
    gradient.addColorStop(1, 'rgba(50, 50, 50, 0.2)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Inactive border
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Progress arc (recharging)
    const progress = 1 - (cooldownRemaining / cooldown)
    ctx.strokeStyle = `rgba(255, 150, 100, ${0.4 + progress * 0.4})`
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(
      position.x, 
      position.y, 
      radius - 6, 
      -Math.PI / 2, 
      -Math.PI / 2 + progress * Math.PI * 2
    )
    ctx.stroke()
    ctx.lineCap = 'butt'

    // Cooldown timer text
    const secondsLeft = Math.ceil(cooldownRemaining)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${secondsLeft}`, position.x, position.y)
  }

  // ============================================================================
  // Volcanic Theme Trap Rendering
  // ============================================================================

  /**
   * Render volcanic armed trap - lava vent with bubbling magma
   */
  private renderVolcanicArmedTrap(ctx: CanvasRenderingContext2D, position: Vector2, radius: number): void {
    const time = Date.now() / 1000
    const pulse = 0.5 + 0.5 * Math.sin(time * 3)

    // Dark rock ring (vent opening)
    ctx.fillStyle = VOLCANIC_COLORS.obsidian
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius + 4, 0, Math.PI * 2)
    ctx.fill()

    // Glowing magma core
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, VOLCANIC_COLORS.fire)
    gradient.addColorStop(0.4, VOLCANIC_COLORS.lavaCore)
    gradient.addColorStop(0.8, VOLCANIC_COLORS.lavaDark)
    gradient.addColorStop(1, VOLCANIC_COLORS.obsidian)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Bubbling effect
    const bubbleCount = 3
    for (let i = 0; i < bubbleCount; i++) {
      const angle = (time * 1.5 + i * (Math.PI * 2 / bubbleCount)) % (Math.PI * 2)
      const bx = position.x + Math.cos(angle) * radius * 0.4
      const by = position.y + Math.sin(angle) * radius * 0.4
      const bubbleSize = 3 + Math.sin(time * 4 + i) * 2

      ctx.fillStyle = `rgba(255, 200, 100, ${0.6 * pulse})`
      ctx.beginPath()
      ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Glow effect
    ctx.shadowColor = VOLCANIC_COLORS.lavaCore
    ctx.shadowBlur = 10 * pulse
    ctx.strokeStyle = VOLCANIC_COLORS.lavaGlow
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  /**
   * Render volcanic warning trap - ground cracks before eruption
   */
  private renderVolcanicWarningTrap(ctx: CanvasRenderingContext2D, position: Vector2, radius: number): void {
    const time = Date.now() / 1000
    const flash = Math.sin(time * 25) > 0 ? 1 : 0.4

    // Expanding danger ring with lava glow
    ctx.shadowColor = VOLCANIC_COLORS.lavaCore
    ctx.shadowBlur = 15 * flash
    ctx.strokeStyle = VOLCANIC_COLORS.crack
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
    ctx.stroke()

    // Ground crack pattern
    ctx.strokeStyle = `rgba(255, 34, 0, ${flash})`
    ctx.lineWidth = 3
    const crackCount = 6
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2
      const innerR = radius * 0.3
      const outerR = radius * 1.3
      ctx.beginPath()
      ctx.moveTo(
        position.x + Math.cos(angle) * innerR,
        position.y + Math.sin(angle) * innerR
      )
      ctx.lineTo(
        position.x + Math.cos(angle) * outerR,
        position.y + Math.sin(angle) * outerR
      )
      ctx.stroke()
    }

    // Inner lava glow
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, `rgba(255, 68, 0, ${0.8 * flash})`)
    gradient.addColorStop(0.5, `rgba(255, 102, 0, ${0.5 * flash})`)
    gradient.addColorStop(1, `rgba(204, 51, 0, ${0.3 * flash})`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Render volcanic triggered trap - lava geyser burst
   */
  private renderVolcanicTriggeredTrap(ctx: CanvasRenderingContext2D, position: Vector2, radius: number): void {
    const time = Date.now() / 1000
    const expand = ((time * 8) % 1)

    // Lava burst rings
    for (let i = 0; i < 4; i++) {
      const ringExpand = (expand + i * 0.25) % 1
      const ringRadius = radius * (1 + ringExpand * 2.5)
      const alpha = 1 - ringExpand

      ctx.strokeStyle = `rgba(255, 102, 0, ${alpha})`
      ctx.lineWidth = 5 - ringExpand * 4
      ctx.beginPath()
      ctx.arc(position.x, position.y, ringRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Bright lava center
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius * 2
    )
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.95)')
    gradient.addColorStop(0.2, VOLCANIC_COLORS.fire)
    gradient.addColorStop(0.5, VOLCANIC_COLORS.lavaCore)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius * 2, 0, Math.PI * 2)
    ctx.fill()

    // Lava splash particles
    const particleCount = 8
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time * 2
      const dist = radius * (0.5 + expand * 1.5)
      const px = position.x + Math.cos(angle) * dist
      const py = position.y + Math.sin(angle) * dist - expand * 20

      ctx.fillStyle = `rgba(255, 136, 68, ${1 - expand})`
      ctx.beginPath()
      ctx.arc(px, py, 4 * (1 - expand * 0.5), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * Render volcanic cooldown trap - smoldering embers
   */
  private renderVolcanicCooldownTrap(
    ctx: CanvasRenderingContext2D,
    position: Vector2,
    radius: number,
    cooldown: number,
    cooldownRemaining: number
  ): void {
    const time = Date.now() / 1000
    const progress = 1 - (cooldownRemaining / cooldown)

    // Cooled rock base
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, `rgba(45, 45, 45, ${0.5 + progress * 0.3})`)
    gradient.addColorStop(1, `rgba(26, 26, 26, ${0.4 + progress * 0.2})`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Smoldering ember particles
    const emberCount = 4
    for (let i = 0; i < emberCount; i++) {
      const angle = (time * 0.5 + i * (Math.PI * 2 / emberCount)) % (Math.PI * 2)
      const dist = radius * 0.5
      const ex = position.x + Math.cos(angle) * dist
      const ey = position.y + Math.sin(angle) * dist
      const emberAlpha = 0.3 + Math.sin(time * 3 + i) * 0.2

      ctx.fillStyle = `rgba(255, 136, 68, ${emberAlpha * progress})`
      ctx.beginPath()
      ctx.arc(ex, ey, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Progress arc (recharging with lava color)
    ctx.strokeStyle = `rgba(255, 102, 0, ${0.4 + progress * 0.5})`
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(
      position.x,
      position.y,
      radius - 4,
      -Math.PI / 2,
      -Math.PI / 2 + progress * Math.PI * 2
    )
    ctx.stroke()
    ctx.lineCap = 'butt'

    // Cooldown timer
    const secondsLeft = Math.ceil(cooldownRemaining)
    ctx.fillStyle = `rgba(255, 200, 150, ${0.6 + progress * 0.4})`
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${secondsLeft}`, position.x, position.y)
  }
}
