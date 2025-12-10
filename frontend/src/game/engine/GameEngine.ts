/**
 * GameEngine - Facade coordinating all game systems
 * Single responsibility: Wire up and coordinate subsystems
 * 
 * Delegates to:
 * - GameLoop: Timing and animation frame
 * - PlayerController: Movement and physics
 * - RenderPipeline: All rendering
 * - ServerSync: Server-authoritative updates
 * - TelemetryManager: Recording and replays
 * - CombatWiring: Combat event connections
 */

import { ARENA_SIZE, PLAYER_CONFIG, PLAYER_SPAWNS } from '../config'
import { NEXUS_ARENA, type MapConfig } from '../config/maps'
import type { MapTheme } from '../config/maps/map-schema'
import { InputSystem } from '../systems'
import { CombatSystem, BuffManager } from '../combat'
import { BackdropSystem } from '../backdrop'
import { ArenaManager } from '../arena'
import { loadGameAssets } from '../assets'
import { arenaAssets } from '../assets/ArenaAssetLoader'
import { EmoteManager } from '../emotes'
import { EmoteRenderer } from '../renderers/EmoteRenderer'
import { animatedTileRenderer } from '../terrain/AnimatedTiles'

import { GameLoop } from './GameLoop'
import { PlayerController } from './PlayerController'
import { RenderPipeline } from './RenderPipeline'
import { ServerSync } from './ServerSync'
import { TelemetryManager } from './TelemetryManager'
import { wireCombatCallbacks } from './CombatWiring'
import type { GameEngineCallbacks, PlayerState, PowerUpState, Vector2, Projectile } from './types'

// AAA Visual System
import { VisualSystemCoordinator } from '../visual'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private scale = 1

  // Modules
  private gameLoop: GameLoop
  private playerController: PlayerController
  private renderPipeline: RenderPipeline
  private serverSync: ServerSync
  private telemetryManager: TelemetryManager

  // Systems
  private backdropSystem: BackdropSystem
  private arenaManager: ArenaManager
  private inputSystem: InputSystem
  private combatSystem: CombatSystem
  private buffManager: BuffManager
  private emoteManager: EmoteManager
  private emoteRenderer: EmoteRenderer

  // AAA Visual System Coordinator
  private visualCoordinator: VisualSystemCoordinator

  // State
  private assetsLoaded = false
  private combatEnabled = false
  private mousePosition: Vector2 = { x: 0, y: 0 }
  private localPlayer: PlayerState | null = null
  private opponent: PlayerState | null = null
  private powerUps: PowerUpState[] = []
  private callbacks: GameEngineCallbacks = {}
  private currentMapConfig: MapConfig

  constructor(canvas: HTMLCanvasElement, mapConfig?: MapConfig) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2d context')

    // Initialize systems with theme from map config
    const theme: MapTheme = mapConfig?.metadata?.theme ?? 'space'
    this.backdropSystem = new BackdropSystem(ARENA_SIZE.width, ARENA_SIZE.height, theme)
    this.arenaManager = new ArenaManager()
    this.inputSystem = new InputSystem()
    this.combatSystem = new CombatSystem()
    this.buffManager = new BuffManager()
    this.telemetryManager = new TelemetryManager()
    this.emoteManager = new EmoteManager()
    this.emoteRenderer = new EmoteRenderer()

    // Initialize AAA Visual System Coordinator
    this.visualCoordinator = new VisualSystemCoordinator({
      width: ARENA_SIZE.width,
      height: ARENA_SIZE.height,
      themeId: theme === 'volcanic' ? 'volcanic' : 'space',
      enableAAA: theme === 'volcanic', // Enable AAA visuals for volcanic theme
    })

    // Initialize modules
    this.gameLoop = new GameLoop()
    this.playerController = new PlayerController(this.inputSystem, this.arenaManager)
    this.renderPipeline = new RenderPipeline(ctx, this.backdropSystem, this.arenaManager, this.combatSystem)
    this.renderPipeline.setBuffManager(this.buffManager)
    this.renderPipeline.setVisualCoordinator(this.visualCoordinator)
    this.serverSync = new ServerSync(
      this.combatSystem,
      this.renderPipeline.getCombatEffectsRenderer(),
      this.arenaManager,
      () => this.localPlayer,
      () => this.opponent,
      (v, d) => this.playerController.setLaunch(v, d),
      (v) => this.playerController.setLaunchFromKnockback(v),
      (pos) => this.playerController.setPositionOverride(pos)
    )

    // Store map config (default to NEXUS_ARENA if not provided)
    this.currentMapConfig = mapConfig ?? NEXUS_ARENA

    this.wireCallbacks()
    this.loadMap()
    this.resize()
    this.loadAssets()
  }

  private wireCallbacks(): void {
    this.gameLoop.setCallbacks(
      (dt) => this.update(dt),
      () => this.render()
    )
    this.playerController.setCallbacks(
      (pos) => this.callbacks.onPositionUpdate?.(pos),
      (opponentId, pos) => this.handleLaunchCollision(opponentId, pos)
    )
    // Wire emote input
    this.inputSystem.onEmote(() => this.handleEmoteTrigger())
  }

  private loadMap(): void {
    this.arenaManager.loadMap(this.currentMapConfig)
    this.arenaManager.setCallbacks({
      onBarrierDestroyed: (_id, pos) => this.renderPipeline.getCombatEffectsRenderer().addDeathEffect(pos),
      onTrapTriggered: () => this.handleTrapEffects(),
      onPlayerTeleported: (_playerId, _from, to) => this.renderPipeline.getCombatEffectsRenderer().addRespawnEffect(to),
      onPlayerLaunched: (playerId, velocity) => {
        if (this.localPlayer && playerId === this.localPlayer.id) {
          this.playerController.setLaunch(velocity)
        }
      },
      onHazardDamage: (playerId, damage) => this.combatSystem.applyDamage(playerId, damage, 'hazard'),
    })
  }

  private handleTrapEffects(): void {
    const results = this.arenaManager.getTrapEffectResults()
    for (const result of results) {
      if (result.type === 'damage_burst') {
        this.combatSystem.applyDamage(result.playerId, result.value, 'trap')
      }
      this.renderPipeline.getCombatEffectsRenderer().addHitMarker(result.position)
      this.renderPipeline.getCombatEffectsRenderer().addDamageNumber(result.position, result.value)
    }
  }

  private async loadAssets(): Promise<void> {
    try {
      // Load core assets
      const coreLoads = [
        loadGameAssets(),
        arenaAssets.load(),
        this.visualCoordinator.initialize(),
      ] as const
      
      await Promise.all(coreLoads)
      
      // Industrial tileset renderer disabled until feature is ready
      // const ctx = this.canvas.getContext('2d')
      // const theme = this.currentMapConfig?.metadata?.theme ?? 'space'
      // if (theme === 'industrial' && ctx) {
      // }
      
      // Register hazards with visual system after map is loaded
      this.registerVisualsFromMap()
      
      this.assetsLoaded = true
      this.callbacks.onAssetsLoaded?.()
    } catch (err) {
      console.error('[GameEngine] Asset loading error:', err)
      this.assetsLoaded = true
    }
  }

  /**
   * Register hazards and props from map config with visual system
   */
  private registerVisualsFromMap(): void {
    if (!this.visualCoordinator.isEnabled()) return

    // Get hazard zones from arena manager and register with visual system
    const hazardZones = this.arenaManager.getHazardZones()
    if (hazardZones.length > 0) {
      this.visualCoordinator.registerHazards(
        hazardZones.map(hz => ({
          id: hz.id,
          type: hz.type as 'damage' | 'slow' | 'bounce',
          bounds: hz.bounds,
          intensity: hz.intensity ?? 1,
        }))
      )
    }
  }

  private handleLaunchCollision(opponentId: string, position: Vector2): void {
    this.combatSystem.applyDamage(opponentId, 15, 'launch_collision')
    this.renderPipeline.getCombatEffectsRenderer().addHitMarker(position)
    this.renderPipeline.getCombatEffectsRenderer().addDamageNumber(position, 15)
  }

  private handleEmoteTrigger(): void {
    if (!this.localPlayer) return
    const isAlive = this.combatSystem.isPlayerAlive(this.localPlayer.id)
    this.emoteManager.triggerEmote(this.localPlayer.position, isAlive)
  }


  // Public API
  areAssetsLoaded(): boolean { return this.assetsLoaded }

  setCallbacks(callbacks: GameEngineCallbacks): void {
    this.callbacks = callbacks
    wireCombatCallbacks(
      {
        combatSystem: this.combatSystem,
        effectsRenderer: this.renderPipeline.getCombatEffectsRenderer(),
        arenaManager: this.arenaManager,
        telemetryManager: this.telemetryManager,
        getLocalPlayer: () => this.localPlayer,
        getOpponent: () => this.opponent,
        getPlayerPositions: () => this.getPlayerPositions(),
      },
      callbacks,
      (replay) => {
        callbacks.onDeathReplayReady?.(replay)
      }
    )
    this.serverSync.setCallbacks({
      onCombatDeath: callbacks.onCombatDeath,
      onCombatRespawn: callbacks.onCombatRespawn,
    })
  }

  initLocalPlayer(playerId: string, isPlayer1: boolean): void {
    const spawn = isPlayer1 ? PLAYER_SPAWNS.player1 : PLAYER_SPAWNS.player2
    this.localPlayer = { id: playerId, position: { ...spawn }, trail: [], isLocal: true, isPlayer1 }
    this.combatSystem.setLocalPlayer(playerId)
  }

  setCombatEnabled(enabled: boolean): void { this.combatEnabled = enabled }

  /** Enable mobile mode with boosted aim assist */
  setMobileMode(isMobile: boolean): void { this.combatSystem.setMobileMode(isMobile) }

  handleMouseMove(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect()
    this.mousePosition = { x: (clientX - rect.left) / this.scale, y: (clientY - rect.top) / this.scale }
  }

  handleFire(): boolean {
    if (!this.combatEnabled || !this.localPlayer) return false
    return this.combatSystem.tryFire(this.localPlayer.position)
  }

  /** Fire in a specific direction (for mobile controls) */
  handleFireDirection(direction: Vector2): boolean {
    if (!this.combatEnabled || !this.localPlayer) return false
    // Update aim to the specified direction before firing
    this.combatSystem.updateAimFromMovement(direction)
    return this.combatSystem.tryFire(this.localPlayer.position)
  }

  setMobileVelocity(velocity: Vector2): void { this.playerController.setMobileVelocity(velocity) }

  setOpponent(opponent: PlayerState | null, isOpponentPlayer1?: boolean): void {
    if (opponent) {
      this.opponent = { ...opponent, isPlayer1: isOpponentPlayer1 ?? opponent.isPlayer1 ?? false }
      this.combatSystem.setOpponent(opponent.id)
    } else {
      this.opponent = null
    }
  }

  updateOpponentPosition(position: Vector2): void {
    if (this.opponent) this.opponent.position = position
  }

  setPowerUps(powerUps: PowerUpState[]): void { this.powerUps = powerUps }
  getMapConfig(): MapConfig { return this.currentMapConfig }

  // Server-authoritative methods (delegate to ServerSync)
  setServerProjectiles(projectiles: Projectile[]): void { this.serverSync.setServerProjectiles(projectiles) }
  setServerHealth(playerId: string, health: number, maxHealth: number): void { this.serverSync.setServerHealth(playerId, health, maxHealth) }
  handleServerDeath(playerId: string, killerId: string): void { this.serverSync.handleServerDeath(playerId, killerId) }
  handleServerRespawn(playerId: string, x: number, y: number): void { this.serverSync.handleServerRespawn(playerId, x, y) }
  handleServerTeleport(playerId: string, toX: number, toY: number): void { this.serverSync.handleServerTeleport(playerId, toX, toY) }
  handleServerJumpPad(playerId: string, vx: number, vy: number): void { this.serverSync.handleServerJumpPad(playerId, vx, vy) }
  handleServerHazardDamage(playerId: string, damage: number): void { this.serverSync.handleServerHazardDamage(playerId, damage) }
  handleServerTrapTriggered(trapId: string, effect: string, value: number, affectedPlayers: string[], position: { x: number; y: number }, knockbacks?: Record<string, { dx: number; dy: number }>): void {
    this.serverSync.handleServerTrapTriggered(trapId, effect, value, affectedPlayers, position, knockbacks)
  }

  // Buff state from server
  setServerBuffs(buffs: Record<string, Array<{ type: string; value: number; remaining: number; source: string }>>): void {
    this.buffManager.setFromServer(buffs)
  }

  // Get buff manager for external access
  getBuffManager(): BuffManager {
    return this.buffManager
  }

  // Lifecycle
  resize(): void {
    const container = this.canvas.parentElement
    if (!container) return
    const { clientWidth, clientHeight } = container
    
    // Detect mobile/touch device
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    if (isMobile) {
      // Mobile: Fill entire screen (Brawl Stars style)
      // Game will be slightly stretched/cropped but controls overlay on top
      this.canvas.width = clientWidth
      this.canvas.height = clientHeight
      // Use the larger scale to ensure arena fills screen (may crop edges)
      const scaleX = clientWidth / ARENA_SIZE.width
      const scaleY = clientHeight / ARENA_SIZE.height
      this.scale = Math.max(scaleX, scaleY)
    } else {
      // Desktop: Maintain aspect ratio (letterbox)
      const aspectRatio = ARENA_SIZE.width / ARENA_SIZE.height
      let width = clientWidth, height = clientWidth / aspectRatio
      if (height > clientHeight) { height = clientHeight; width = clientHeight * aspectRatio }
      this.canvas.width = width
      this.canvas.height = height
      this.scale = width / ARENA_SIZE.width
    }
    
    this.renderPipeline.setScale(this.scale)
  }

  start(): void { this.gameLoop.start() }
  stop(): void { this.gameLoop.stop() }
  destroy(): void { this.stop(); this.playerController.destroy() }

  // Update and render
  private update(deltaTime: number): void {
    this.backdropSystem.update(deltaTime)
    animatedTileRenderer.update(deltaTime)
    this.arenaManager.update(deltaTime, this.getPlayerPositions())
    this.playerController.update(deltaTime, this.localPlayer, this.opponent)
    this.updateTrails()
    this.checkPowerUpCollisions()
    if (this.combatEnabled) this.updateCombat(deltaTime)
    this.emoteManager.update(deltaTime, this.getPlayerPositions())
    this.renderPipeline.setPlayers(this.localPlayer, this.opponent)
    this.renderPipeline.updateAnimations(deltaTime)
    
    // Update AAA visual systems
    this.visualCoordinator.update(deltaTime)
  }

  private render(): void {
    this.renderPipeline.render(this.gameLoop.getAnimationTime(), this.powerUps, this.combatEnabled, this.localPlayer, this.opponent)
    // Render emotes above players
    this.renderEmotes()
  }

  private renderEmotes(): void {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    
    ctx.save()
    ctx.scale(this.scale, this.scale)
    
    this.emoteRenderer.setContext({ ctx, animationTime: this.gameLoop.getAnimationTime(), scale: this.scale })
    this.emoteRenderer.setEmotes(this.emoteManager.getActiveEmotes())
    this.emoteRenderer.setAssets(this.emoteManager.getAssets())
    this.emoteRenderer.render()
    
    ctx.restore()
  }

  private getPlayerPositions(): Map<string, Vector2> {
    const players = new Map<string, Vector2>()
    if (this.localPlayer) players.set(this.localPlayer.id, this.localPlayer.position)
    if (this.opponent) players.set(this.opponent.id, this.opponent.position)
    return players
  }

  private updateCombat(deltaTime: number): void {
    const playerPositions = this.getPlayerPositions()
    // Store target positions for mobile auto-aim on fire
    this.combatSystem.setTargetPositions(playerPositions)
    if (this.localPlayer) this.combatSystem.updateAim(this.mousePosition, this.localPlayer.position, playerPositions)
    this.combatSystem.update(deltaTime, playerPositions)
    const players = new Map<string, PlayerState>()
    if (this.localPlayer) players.set(this.localPlayer.id, this.localPlayer)
    if (this.opponent) players.set(this.opponent.id, this.opponent)
    this.telemetryManager.captureFrame(players, this.combatSystem.getAllHealthStates(), this.combatSystem.getProjectiles(), this.combatSystem.getAimDirections(), this.combatSystem.getRespawningPlayers())
  }

  private updateTrails(): void {
    [this.localPlayer, this.opponent].forEach(player => {
      if (!player) return
      player.trail.unshift({ ...player.position, alpha: 1 })
      player.trail = player.trail.map(p => ({ ...p, alpha: p.alpha - 0.05 })).filter(p => p.alpha > 0).slice(0, PLAYER_CONFIG.trailLength)
    })
  }

  private checkPowerUpCollisions(): void {
    if (!this.localPlayer) return
    this.powerUps.forEach(powerUp => {
      if (powerUp.collected || !powerUp.active) return
      const dx = this.localPlayer!.position.x - powerUp.position.x
      const dy = this.localPlayer!.position.y - powerUp.position.y
      if (Math.sqrt(dx * dx + dy * dy) < PLAYER_CONFIG.radius + 30) this.callbacks.onPowerUpCollect?.(powerUp.id)
    })
  }

  // Combat state getters
  isLocalPlayerRespawning(): boolean { return this.localPlayer ? this.combatSystem.isPlayerRespawning(this.localPlayer.id) : false }
  getLocalPlayerRespawnTime(): number { return this.localPlayer ? this.combatSystem.getRespawnTimeRemaining(this.localPlayer.id) : 0 }
  isLocalPlayerAlive(): boolean { return this.localPlayer ? this.combatSystem.isPlayerAlive(this.localPlayer.id) : true }

  // Question broadcast (in-arena display)
  setQuestionBroadcast(question: { qNum: number; text: string; options: string[]; startTime: number; totalTime: number } | null, selectedAnswer: string | null, answerSubmitted: boolean, visible: boolean): void {
    this.renderPipeline.setQuestionBroadcast({
      question,
      selectedAnswer,
      answerSubmitted,
      visible,
    })
  }

  // Telemetry
  setLobbyId(lobbyId: string): void { this.telemetryManager.setLobbyId(lobbyId) }
  updateNetworkStats(stats: { rttMs?: number; serverTick?: number; jitterMs?: number }): void { this.telemetryManager.updateNetworkStats(stats) }
  getLastDeathReplay() { return this.telemetryManager.getLastDeathReplay() }
  clearLastDeathReplay(): void { this.telemetryManager.clearLastDeathReplay() }

  // Skin system
  setPlayerSkin(playerId: string, skinId: string): void {
    this.renderPipeline.getPlayerRenderer().setPlayerSkin(playerId, skinId as import('../assets').SkinId)
  }

  setDynamicSkin(playerId: string, spriteSheetUrl: string, metadataUrl?: string): void {
    this.renderPipeline.getPlayerRenderer().setDynamicSkin(playerId, spriteSheetUrl, metadataUrl)
  }

  // Emote system
  getEmoteManager(): EmoteManager { return this.emoteManager }
  
  async initializeEmotes(
    inventoryEmotes: Array<{ id: string; name: string; image_url: string }>,
    equippedEmoteId: string | null
  ): Promise<void> {
    if (!this.localPlayer) return
    await this.emoteManager.initialize(this.localPlayer.id, inventoryEmotes, equippedEmoteId)
  }

  setEquippedEmote(emoteId: string | null): void {
    this.emoteManager.setEquippedEmote(emoteId)
  }

  handleRemoteEmote(playerId: string, emoteId: string): void {
    const position = this.opponent?.id === playerId ? this.opponent.position : null
    if (position) {
      this.emoteManager.handleRemoteEmote({ playerId, emoteId, timestamp: Date.now() }, position)
    }
  }

  resetEmotes(): void {
    this.emoteManager.reset()
  }
}
