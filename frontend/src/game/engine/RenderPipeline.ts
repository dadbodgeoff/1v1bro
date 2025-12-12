/**
 * RenderPipeline - Orchestrates all rendering in correct layer order
 * Single responsibility: Coordinate renderers and manage render context
 */

import {
  HubRenderer,
  PowerUpRenderer,
  PlayerRenderer,
  ProjectileRenderer,
  HealthBarRenderer,
  CombatEffectsRenderer,
  QuestionBroadcastRenderer,
  BuffRenderer,
  RespawnOverlayRenderer,
} from '../renderers'
import type { BroadcastState } from '../renderers'
import { BackdropSystem } from '../backdrop'
import { ArenaManager } from '../arena'
import { CombatSystem, BuffManager } from '../combat'
import type { RenderContext, PlayerState, PowerUpState, Vector2, HealthState } from './types'
import type { VisualSystemCoordinator } from '../visual'
import { SimpleArenaRenderer } from '../terrain/SimpleArenaRenderer'

export class RenderPipeline {
  private ctx: CanvasRenderingContext2D
  private scale = 1

  // Systems
  private backdropSystem: BackdropSystem
  private arenaManager: ArenaManager
  private combatSystem: CombatSystem

  // Renderers
  private hubRenderer: HubRenderer
  private questionBroadcastRenderer: QuestionBroadcastRenderer
  private powerUpRenderer: PowerUpRenderer
  private playerRenderer: PlayerRenderer
  private projectileRenderer: ProjectileRenderer
  private healthBarRenderer: HealthBarRenderer
  private combatEffectsRenderer: CombatEffectsRenderer
  private buffRenderer: BuffRenderer
  private respawnOverlayRenderer: RespawnOverlayRenderer

  // Buff manager reference
  private buffManager: BuffManager | null = null

  // AAA Visual System Coordinator
  private visualCoordinator: VisualSystemCoordinator | null = null

  private currentTheme: import('../config/maps/map-schema').MapTheme = 'simple'

  // Simple arena renderer
  private simpleRenderer: SimpleArenaRenderer | null = null
  private simpleRendererReady = false

  constructor(
    ctx: CanvasRenderingContext2D,
    backdropSystem: BackdropSystem,
    arenaManager: ArenaManager,
    combatSystem: CombatSystem
  ) {
    this.ctx = ctx
    this.backdropSystem = backdropSystem
    this.arenaManager = arenaManager
    this.combatSystem = combatSystem

    // Initialize renderers
    this.hubRenderer = new HubRenderer()
    this.questionBroadcastRenderer = new QuestionBroadcastRenderer()
    this.powerUpRenderer = new PowerUpRenderer()
    this.playerRenderer = new PlayerRenderer()
    this.projectileRenderer = new ProjectileRenderer()
    this.healthBarRenderer = new HealthBarRenderer()
    this.combatEffectsRenderer = new CombatEffectsRenderer()
    this.buffRenderer = new BuffRenderer()
    this.respawnOverlayRenderer = new RespawnOverlayRenderer()
  }

  setBuffManager(buffManager: BuffManager): void {
    this.buffManager = buffManager
  }

  setVisualCoordinator(coordinator: VisualSystemCoordinator): void {
    this.visualCoordinator = coordinator
  }

  /**
   * Set the map theme for theme-aware renderers
   */
  setTheme(theme: import('../config/maps/map-schema').MapTheme): void {
    this.currentTheme = theme
    this.hubRenderer.setTheme(theme)
  }

  /**
   * Check if simple renderer should be used
   */
  isSimpleTheme(): boolean {
    return this.currentTheme === 'simple'
  }

  /**
   * Initialize simple arena renderer for simple theme maps
   */
  async initializeSimpleRenderer(ctx: CanvasRenderingContext2D): Promise<void> {
    if (this.simpleRenderer) return

    this.simpleRenderer = new SimpleArenaRenderer()
    this.simpleRenderer.setContext({ ctx, animationTime: 0, scale: this.scale })

    try {
      await this.simpleRenderer.loadTile()
      this.simpleRendererReady = true
      console.log('[RenderPipeline] Simple arena tile loaded successfully')
    } catch (err) {
      console.error('[RenderPipeline] Failed to load simple arena tile:', err)
      this.simpleRendererReady = false
    }
  }

  /**
   * Update simple renderer animation time
   */
  updateSimpleRenderer(deltaTime: number): void {
    if (this.simpleRenderer) {
      this.simpleRenderer.update(deltaTime)
    }
  }

  setScale(scale: number): void {
    this.scale = scale
  }

  setQuestionBroadcast(state: BroadcastState): void {
    this.questionBroadcastRenderer.setState(state)
  }


  getCombatEffectsRenderer(): CombatEffectsRenderer {
    return this.combatEffectsRenderer
  }

  getPlayerRenderer(): PlayerRenderer {
    return this.playerRenderer
  }

  setPlayers(localPlayer: PlayerState | null, opponent: PlayerState | null): void {
    this.playerRenderer.setPlayers(localPlayer, opponent)
  }

  updateAnimations(deltaTime: number): void {
    this.playerRenderer.updateAnimations(deltaTime)
    this.projectileRenderer.updateTrails()
    this.combatEffectsRenderer.update(deltaTime)
    this.questionBroadcastRenderer.update(deltaTime)
    this.buffRenderer.update(deltaTime)
    this.respawnOverlayRenderer.update(deltaTime)
  }

  render(
    animationTime: number,
    powerUps: PowerUpState[],
    combatEnabled: boolean,
    localPlayer: PlayerState | null,
    opponent: PlayerState | null
  ): void {
    const context: RenderContext = {
      ctx: this.ctx,
      scale: this.scale,
      animationTime,
    }

    this.ctx.save()
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.scale(this.scale, this.scale)

    // Layer 0: Background (skip for simple theme - grass tiles cover everything)
    if (!this.isSimpleTheme()) {
      if (this.visualCoordinator?.isEnabled()) {
        this.visualCoordinator.renderBackground(this.ctx)
      } else {
        this.backdropSystem.render(this.ctx)
      }

      // Layer 0.5: Background props (AAA visual system)
      this.visualCoordinator?.renderBackgroundProps(this.ctx)
    }

    // Layer 1: Simple arena floor tiles (if simple theme)
    if (this.isSimpleTheme() && this.simpleRendererReady && this.simpleRenderer) {
      this.simpleRenderer.setContext(context)
      this.simpleRenderer.render()
    }

    // Layer 1-3: Arena (hazards, barriers, etc.)
    // For simple theme: clean floor only, skip ArenaManager rendering entirely
    // For other themes: use ArenaManager for everything
    if (this.isSimpleTheme()) {
      // Simple theme: clean floor only, no arena elements rendered
      // Props are rendered by SimpleArenaRenderer, not ArenaManager
    } else {
      // Default: render everything through ArenaManager
      this.arenaManager.render(this.ctx)
    }

    // Layer 3.5: Gameplay props (AAA visual system) - skip for simple theme
    if (!this.isSimpleTheme()) {
      this.visualCoordinator?.renderGameplayProps(this.ctx)
    }

    // Layer 4: Hub
    this.hubRenderer.setContext(context)
    this.hubRenderer.render()

    // Layer 4.5: Question broadcast (behind players, on the floor)
    this.questionBroadcastRenderer.setContext(context)
    this.questionBroadcastRenderer.render()

    // Layer 5: Entities
    this.powerUpRenderer.setContext(context)
    this.powerUpRenderer.setPowerUps(powerUps)
    this.powerUpRenderer.render()

    if (combatEnabled) {
      this.projectileRenderer.setContext(context)
      this.projectileRenderer.setProjectiles(this.combatSystem.getProjectiles())
      this.projectileRenderer.render()
    }

    // Set flashing and respawning players
    if (combatEnabled) {
      const flashingIds: string[] = []
      if (localPlayer && this.combatEffectsRenderer.isPlayerFlashing(localPlayer.id)) {
        flashingIds.push(localPlayer.id)
      }
      if (opponent && this.combatEffectsRenderer.isPlayerFlashing(opponent.id)) {
        flashingIds.push(opponent.id)
      }
      this.playerRenderer.setFlashingPlayers(flashingIds)

      // Set respawning players for ghost effect
      const respawningIds: string[] = []
      if (localPlayer && this.combatSystem.isPlayerRespawning(localPlayer.id)) {
        respawningIds.push(localPlayer.id)
      }
      if (opponent && this.combatSystem.isPlayerRespawning(opponent.id)) {
        respawningIds.push(opponent.id)
      }
      this.playerRenderer.setRespawningPlayers(respawningIds)
    }

    this.playerRenderer.setContext(context)
    this.playerRenderer.render()

    // Layer 5.3: Foreground props (grass) - renders ABOVE players for stealth effect
    if (this.isSimpleTheme() && this.simpleRendererReady && this.simpleRenderer) {
      this.simpleRenderer.renderForeground()
    }

    // Layer 5.5: Buff effects (rendered around players)
    if (combatEnabled && this.buffManager) {
      this.renderBuffEffects(context, localPlayer, opponent)
    }

    // Layer 5-6: Effects and UI
    if (combatEnabled) {
      this.renderHealthBars(context, localPlayer, opponent)
      this.combatEffectsRenderer.setContext(context)
      this.combatEffectsRenderer.render()
    }

    // Layer 6.5-8: AAA visual system effects - skip for simple theme
    if (!this.isSimpleTheme()) {
      // Layer 6.5: Foreground props (AAA visual system - stalactites, steam)
      this.visualCoordinator?.renderForegroundProps(this.ctx)

      // Layer 7: Environmental events (debris, lava bursts)
      this.visualCoordinator?.renderEnvironmentalEvents(this.ctx)

      // Layer 8: Post-processing - Vignette (final pass)
      this.visualCoordinator?.applyVignette(this.ctx)
    }

    // Layer 9: Respawn/Death overlay (UI layer - always on top)
    if (combatEnabled && localPlayer) {
      this.renderRespawnOverlay(context, localPlayer)
    }

    this.ctx.restore()
  }

  /**
   * Render respawn/death overlay for local player
   */
  private renderRespawnOverlay(context: RenderContext, localPlayer: PlayerState): void {
    const isRespawning = this.combatSystem.isPlayerRespawning(localPlayer.id)
    const isAlive = this.combatSystem.isPlayerAlive(localPlayer.id)
    const healthState = this.combatSystem.getHealthState(localPlayer.id)
    
    const isInvulnerable = healthState?.isInvulnerable ?? false
    const invulnerabilityEnd = healthState?.invulnerabilityEnd ?? 0
    const invulnerabilityRemaining = Math.max(0, invulnerabilityEnd - Date.now())
    
    const respawnTimeRemaining = this.combatSystem.getRespawnTimeRemaining(localPlayer.id)
    
    // Can't shoot if dead, respawning, or invulnerable
    const canShoot = isAlive && !isRespawning

    this.respawnOverlayRenderer.setContext(context)
    this.respawnOverlayRenderer.setState({
      isDead: !isAlive,
      isRespawning,
      isInvulnerable,
      respawnTimeRemaining,
      invulnerabilityRemaining,
      canShoot,
    })
    this.respawnOverlayRenderer.render()
  }

  private renderBuffEffects(
    context: RenderContext,
    localPlayer: PlayerState | null,
    opponent: PlayerState | null
  ): void {
    if (!this.buffManager) return

    const players: Array<{
      position: Vector2
      buffs: ReturnType<BuffManager['getBuffs']>
      isLocal: boolean
    }> = []

    if (localPlayer) {
      const buffs = this.buffManager.getBuffs(localPlayer.id)
      if (buffs.length > 0) {
        players.push({ position: localPlayer.position, buffs, isLocal: true })
      }
    }

    if (opponent) {
      const buffs = this.buffManager.getBuffs(opponent.id)
      if (buffs.length > 0) {
        players.push({ position: opponent.position, buffs, isLocal: false })
      }
    }

    this.buffRenderer.setContext(context)
    this.buffRenderer.setPlayers(players)
    this.buffRenderer.render()
  }

  private renderHealthBars(
    context: RenderContext,
    localPlayer: PlayerState | null,
    opponent: PlayerState | null
  ): void {
    const players: Array<{
      position: Vector2
      state: HealthState
      isLocal: boolean
    }> = []

    if (localPlayer) {
      const state = this.combatSystem.getHealthState(localPlayer.id)
      if (state) players.push({ position: localPlayer.position, state, isLocal: true })
    }

    if (opponent) {
      const state = this.combatSystem.getHealthState(opponent.id)
      if (state) players.push({ position: opponent.position, state, isLocal: false })
    }

    this.healthBarRenderer.setContext(context)
    this.healthBarRenderer.setPlayers(players)
    this.healthBarRenderer.render()
  }
}
