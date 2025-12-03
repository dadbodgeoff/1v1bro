/**
 * Game Engine - Orchestrates all game systems and rendering
 * Single responsibility: coordinate subsystems and manage game loop
 */

import { ARENA_SIZE, PLAYER_CONFIG, PLAYER_SPAWNS } from './config'
import {
  GridRenderer,
  HubRenderer,
  BarrierRenderer,
  PowerUpRenderer,
  PlayerRenderer,
} from './renderers'
import { CollisionSystem, InputSystem } from './systems'
import type { RenderContext, PlayerState, PowerUpState, Vector2 } from './types'

export interface GameEngineCallbacks {
  onPositionUpdate?: (position: Vector2) => void
  onPowerUpCollect?: (powerUpId: number) => void
}

export class GameEngine {
  // Canvas
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scale = 1

  // Renderers
  private gridRenderer: GridRenderer
  private hubRenderer: HubRenderer
  private barrierRenderer: BarrierRenderer
  private powerUpRenderer: PowerUpRenderer
  private playerRenderer: PlayerRenderer

  // Systems
  private collisionSystem: CollisionSystem
  private inputSystem: InputSystem

  // State
  private animationTime = 0
  private lastFrameTime = 0
  private isRunning = false
  private animationFrameId: number | null = null

  // Game state
  private localPlayer: PlayerState | null = null
  private opponent: PlayerState | null = null
  private powerUps: PowerUpState[] = []

  // Callbacks
  private callbacks: GameEngineCallbacks = {}

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2d context')
    this.ctx = ctx

    // Initialize renderers
    this.gridRenderer = new GridRenderer()
    this.hubRenderer = new HubRenderer()
    this.barrierRenderer = new BarrierRenderer()
    this.powerUpRenderer = new PowerUpRenderer()
    this.playerRenderer = new PlayerRenderer()

    // Initialize systems
    this.collisionSystem = new CollisionSystem()
    this.inputSystem = new InputSystem()

    this.resize()
  }

  /**
   * Set callbacks for game events
   */
  setCallbacks(callbacks: GameEngineCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Initialize local player
   */
  initLocalPlayer(playerId: string, isPlayer1: boolean): void {
    const spawn = isPlayer1 ? PLAYER_SPAWNS.player1 : PLAYER_SPAWNS.player2
    this.localPlayer = {
      id: playerId,
      position: { ...spawn },
      trail: [],
      isLocal: true,
    }
  }

  /**
   * Set opponent state (from WebSocket)
   */
  setOpponent(opponent: PlayerState | null): void {
    this.opponent = opponent
  }

  /**
   * Update opponent position (from WebSocket)
   */
  updateOpponentPosition(position: Vector2): void {
    if (this.opponent) {
      this.opponent.position = position
    }
  }

  /**
   * Set power-ups state
   */
  setPowerUps(powerUps: PowerUpState[]): void {
    this.powerUps = powerUps
  }

  /**
   * Handle canvas resize
   */
  resize(): void {
    const container = this.canvas.parentElement
    if (!container) return

    const { clientWidth, clientHeight } = container
    const aspectRatio = ARENA_SIZE.width / ARENA_SIZE.height

    let width = clientWidth
    let height = clientWidth / aspectRatio

    if (height > clientHeight) {
      height = clientHeight
      width = clientHeight * aspectRatio
    }

    this.canvas.width = width
    this.canvas.height = height
    this.scale = width / ARENA_SIZE.width
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.loop()
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop()
    this.inputSystem.destroy()
  }

  /**
   * Main game loop
   */
  private loop = (): void => {
    if (!this.isRunning) return

    const now = performance.now()
    const deltaTime = (now - this.lastFrameTime) / 1000
    this.lastFrameTime = now
    this.animationTime += deltaTime

    this.update(deltaTime)
    this.render()

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    this.updateLocalPlayer(deltaTime)
    this.updateTrails()
    this.checkPowerUpCollisions()
  }

  /**
   * Update local player position based on input
   */
  private updateLocalPlayer(deltaTime: number): void {
    if (!this.localPlayer) return

    const velocity = this.inputSystem.getVelocity()
    if (velocity.x === 0 && velocity.y === 0) return

    const speed = PLAYER_CONFIG.speed * deltaTime
    const newPosition: Vector2 = {
      x: this.localPlayer.position.x + velocity.x * speed,
      y: this.localPlayer.position.y + velocity.y * speed,
    }

    // Resolve collisions
    const resolved = this.collisionSystem.resolveCollision(newPosition)
    
    // Only update if position changed
    if (resolved.x !== this.localPlayer.position.x || resolved.y !== this.localPlayer.position.y) {
      this.localPlayer.position = resolved
      this.callbacks.onPositionUpdate?.(resolved)
    }
  }

  /**
   * Update player trails
   */
  private updateTrails(): void {
    this.updatePlayerTrail(this.localPlayer)
    this.updatePlayerTrail(this.opponent)
  }

  private updatePlayerTrail(player: PlayerState | null): void {
    if (!player) return

    // Add current position to trail
    player.trail.unshift({
      ...player.position,
      alpha: 1,
    })

    // Fade and trim trail
    player.trail = player.trail
      .map(point => ({ ...point, alpha: point.alpha - 0.05 }))
      .filter(point => point.alpha > 0)
      .slice(0, PLAYER_CONFIG.trailLength)
  }

  /**
   * Check for power-up collisions
   */
  private checkPowerUpCollisions(): void {
    if (!this.localPlayer) return

    this.powerUps.forEach(powerUp => {
      if (powerUp.collected || !powerUp.active) return

      const dx = this.localPlayer!.position.x - powerUp.position.x
      const dy = this.localPlayer!.position.y - powerUp.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < PLAYER_CONFIG.radius + 30) {
        this.callbacks.onPowerUpCollect?.(powerUp.id)
      }
    })
  }

  /**
   * Render the game
   */
  private render(): void {
    const context: RenderContext = {
      ctx: this.ctx,
      scale: this.scale,
      animationTime: this.animationTime,
    }

    this.ctx.save()
    this.ctx.scale(this.scale, this.scale)

    // Render layers in order
    this.gridRenderer.setContext(context)
    this.gridRenderer.render()

    this.hubRenderer.setContext(context)
    this.hubRenderer.render()

    this.barrierRenderer.setContext(context)
    this.barrierRenderer.render()

    this.powerUpRenderer.setContext(context)
    this.powerUpRenderer.setPowerUps(this.powerUps)
    this.powerUpRenderer.render()

    this.playerRenderer.setContext(context)
    this.playerRenderer.setPlayers(this.localPlayer, this.opponent)
    this.playerRenderer.render()

    this.ctx.restore()
  }
}
