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
} from '../renderers'
import type { BroadcastState } from '../renderers'
import { BackdropSystem } from '../backdrop'
import { ArenaManager } from '../arena'
import { CombatSystem, BuffManager } from '../combat'
import type { RenderContext, PlayerState, PowerUpState, Vector2, HealthState } from './types'
import type { VisualSystemCoordinator } from '../visual'
import { IndustrialArenaRenderer } from '../terrain/TileRenderer'
import { INDUSTRIAL_ARENA } from '../terrain/IndustrialArenaMap'

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

  // Buff manager reference
  private buffManager: BuffManager | null = null

  // AAA Visual System Coordinator
  private visualCoordinator: VisualSystemCoordinator | null = null

  // Industrial tileset renderer
  private industrialRenderer: IndustrialArenaRenderer | null = null
  private industrialRendererReady = false

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
    this.hubRenderer.setTheme(theme)
  }

  /**
   * Initialize industrial tileset renderer for industrial theme maps
   */
  async initializeIndustrialRenderer(ctx: CanvasRenderingContext2D): Promise<void> {
    if (this.industrialRenderer) return
    
    this.industrialRenderer = new IndustrialArenaRenderer(ctx, 80)
    
    try {
      await this.industrialRenderer.loadMap(INDUSTRIAL_ARENA)
      this.industrialRendererReady = true
      console.log('[RenderPipeline] Industrial tilesets loaded successfully')
    } catch (err) {
      console.error('[RenderPipeline] Failed to load industrial tilesets:', err)
      this.industrialRendererReady = false
    }
  }

  /**
   * Check if industrial renderer should be used
   */
  isIndustrialTheme(): boolean {
    return this.backdropSystem.getTheme() === 'industrial'
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

    // Layer 0: Background (AAA parallax if enabled, otherwise standard backdrop)
    if (this.visualCoordinator?.isEnabled()) {
      this.visualCoordinator.renderBackground(this.ctx)
    } else {
      this.backdropSystem.render(this.ctx)
    }

    // Layer 0.5: Background props (AAA visual system)
    this.visualCoordinator?.renderBackgroundProps(this.ctx)

    // Layer 1: Industrial tileset floor/obstacles (if industrial theme)
    if (this.isIndustrialTheme() && this.industrialRendererReady && this.industrialRenderer) {
      this.industrialRenderer.render()
      this.industrialRenderer.renderBorder()
    }

    // Layer 1-3: Arena (hazards, barriers, etc.) - skip for industrial as tilesets handle it
    if (!this.isIndustrialTheme() || !this.industrialRendererReady) {
      this.arenaManager.render(this.ctx)
    }

    // Layer 3.5: Gameplay props (AAA visual system)
    this.visualCoordinator?.renderGameplayProps(this.ctx)

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

    // Layer 6.5: Foreground props (AAA visual system - stalactites, steam)
    this.visualCoordinator?.renderForegroundProps(this.ctx)

    // Layer 7: Environmental events (debris, lava bursts)
    this.visualCoordinator?.renderEnvironmentalEvents(this.ctx)

    // Layer 8: Post-processing - Vignette (final pass)
    this.visualCoordinator?.applyVignette(this.ctx)

    this.ctx.restore()
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
