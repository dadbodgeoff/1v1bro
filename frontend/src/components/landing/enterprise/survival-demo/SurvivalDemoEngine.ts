/**
 * SurvivalDemoEngine - Game engine for survival demo
 * 
 * Coordinates AI, physics, spawning, and rendering for the
 * landing page survival runner showcase.
 * 
 * @module landing/enterprise/survival-demo/SurvivalDemoEngine
 */

import type {
  DemoRunnerState,
  DemoObstacle,
  DemoCollectible,
  DemoTrackTile,
  DemoGameState,
  Lane,
  ObstacleType,
} from './types'
import {
  createRunner,
  updateRunner,
  createObstacle,
  createCollectible,
  checkObstacleCollision,
  checkCollectibleCollision,
} from './SurvivalDemoPhysics'
import { createAI, updateAI, type DemoAIState } from './SurvivalDemoAI'
import { renderFrame } from './SurvivalDemoRenderer'

// Demo configuration
const DEMO_CONFIG = {
  baseSpeed: 200,
  maxSpeed: 400,
  speedIncrement: 5,
  obstacleSpawnInterval: 1.2,
  collectibleSpawnInterval: 0.8,
  loopDuration: 25000, // 25 second loop
  maxObstacles: 15,
  maxCollectibles: 20,
}

export class SurvivalDemoEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private lastTime = 0
  private gameTime = 0
  
  // Game state
  private runner: DemoRunnerState
  private ai: DemoAIState
  private obstacles: DemoObstacle[] = []
  private collectibles: DemoCollectible[] = []
  private tiles: DemoTrackTile[] = []
  private viewZ = 0
  
  // Spawning
  private lastObstacleSpawn = 0
  private lastCollectibleSpawn = 0
  
  // Game state
  private gameState: DemoGameState = {
    phase: 'intro',
    distance: 0,
    score: 0,
    speed: DEMO_CONFIG.baseSpeed,
    combo: 0,
    lives: 3,
    maxLives: 3,
  }
  
  private isPlaying = false
  private onStateChange?: (state: DemoGameState) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2d context')
    this.ctx = ctx
    
    // Initialize
    this.runner = createRunner()
    this.ai = createAI()
    this.initializeTiles()
  }

  private initializeTiles(): void {
    // Create initial track tiles
    for (let i = 0; i < 20; i++) {
      this.tiles.push({ z: i * 50, opacity: 1 })
    }
  }

  setOnStateChange(callback: (state: DemoGameState) => void): void {
    this.onStateChange = callback
  }

  start(): void {
    if (this.isPlaying) return
    this.isPlaying = true
    this.gameState.phase = 'running'
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.isPlaying = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  destroy(): void {
    this.stop()
  }

  private loop = (): void => {
    if (!this.isPlaying) return

    const now = performance.now()
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now

    this.update(deltaTime)
    this.render()

    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    this.gameTime += dt * 1000
    
    // Check for loop reset
    if (this.gameTime >= DEMO_CONFIG.loopDuration) {
      this.resetDemo()
      return
    }
    
    // Update phase
    this.updatePhase()
    
    if (this.gameState.phase !== 'running') return
    
    // Update speed (gradual increase)
    this.gameState.speed = Math.min(
      DEMO_CONFIG.maxSpeed,
      DEMO_CONFIG.baseSpeed + (this.gameTime / 1000) * DEMO_CONFIG.speedIncrement
    )
    
    // Update AI
    updateAI(this.ai, this.runner, this.obstacles, this.collectibles, this.viewZ, this.gameTime / 1000)
    
    // Update runner physics
    updateRunner(this.runner, dt, this.gameState.speed)
    
    // Update view position
    this.viewZ += this.gameState.speed * dt
    this.gameState.distance = Math.floor(this.viewZ / 10)
    
    // Spawn obstacles and collectibles
    this.updateSpawning(dt)
    
    // Check collisions
    this.checkCollisions()
    
    // Cleanup off-screen objects
    this.cleanup()
    
    // Update score based on distance
    this.gameState.score = Math.floor(this.gameState.distance * 10 + this.gameState.combo * 50)
    
    this.onStateChange?.(this.gameState)
  }

  private updatePhase(): void {
    const time = this.gameTime
    
    if (time < 1500) {
      this.gameState.phase = 'intro'
    } else if (this.gameState.phase === 'intro') {
      this.gameState.phase = 'running'
    }
  }

  private updateSpawning(_dt: number): void {
    const time = this.gameTime / 1000
    
    // Spawn obstacles
    if (time - this.lastObstacleSpawn > DEMO_CONFIG.obstacleSpawnInterval) {
      this.spawnObstacle()
      this.lastObstacleSpawn = time
    }
    
    // Spawn collectibles
    if (time - this.lastCollectibleSpawn > DEMO_CONFIG.collectibleSpawnInterval) {
      this.spawnCollectible()
      this.lastCollectibleSpawn = time
    }
  }

  private spawnObstacle(): void {
    if (this.obstacles.length >= DEMO_CONFIG.maxObstacles) return
    
    const lanes: Lane[] = ['left', 'center', 'right']
    const types: ObstacleType[] = ['barrier', 'spike', 'overhead', 'gap']
    
    // Pick random lane and type
    const lane = lanes[Math.floor(Math.random() * lanes.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    
    // Spawn ahead of view
    const spawnZ = this.viewZ + 400 + Math.random() * 100
    
    this.obstacles.push(createObstacle(type, lane, spawnZ))
  }

  private spawnCollectible(): void {
    if (this.collectibles.length >= DEMO_CONFIG.maxCollectibles) return
    
    const lanes: Lane[] = ['left', 'center', 'right']
    const lane = lanes[Math.floor(Math.random() * lanes.length)]
    
    // Check if lane has obstacle nearby
    const hasObstacle = this.obstacles.some(obs => {
      const relZ = obs.z - this.viewZ
      return obs.lane === lane && relZ > 300 && relZ < 500
    })
    
    if (hasObstacle) return
    
    const spawnZ = this.viewZ + 350 + Math.random() * 150
    const floating = Math.random() > 0.6
    
    this.collectibles.push(createCollectible(lane, spawnZ, floating))
  }

  private checkCollisions(): void {
    // Check obstacle collisions
    for (const obstacle of this.obstacles) {
      const result = checkObstacleCollision(this.runner, obstacle, this.viewZ)
      
      if (result.hit && result.type === 'obstacle') {
        this.handleHit()
        break
      }
      
      // Track cleared obstacles for combo
      if (obstacle.cleared && !obstacle.id.includes('_scored')) {
        this.gameState.combo++
        obstacle.id += '_scored'
      }
    }
    
    // Check collectible collisions
    for (const collectible of this.collectibles) {
      const result = checkCollectibleCollision(this.runner, collectible, this.viewZ)
      
      if (result.hit && result.type === 'collectible') {
        this.gameState.score += result.points || 25
        this.gameState.combo++
      }
    }
  }

  private handleHit(): void {
    this.gameState.lives--
    this.gameState.combo = 0
    
    if (this.gameState.lives <= 0) {
      this.gameState.phase = 'gameover'
      // Reset after brief pause
      setTimeout(() => this.resetDemo(), 2000)
    } else {
      this.gameState.phase = 'hit'
      // Brief invulnerability
      setTimeout(() => {
        if (this.gameState.phase === 'hit') {
          this.gameState.phase = 'running'
        }
      }, 500)
    }
  }

  private cleanup(): void {
    // Remove obstacles behind view
    this.obstacles = this.obstacles.filter(obs => obs.z > this.viewZ - 100)
    
    // Remove collected/passed collectibles
    this.collectibles = this.collectibles.filter(col => 
      !col.collected && col.z > this.viewZ - 100
    )
  }

  private resetDemo(): void {
    this.gameTime = 0
    this.viewZ = 0
    this.lastObstacleSpawn = 0
    this.lastCollectibleSpawn = 0
    
    this.runner = createRunner()
    this.ai = createAI()
    this.obstacles = []
    this.collectibles = []
    
    this.gameState = {
      phase: 'intro',
      distance: 0,
      score: 0,
      speed: DEMO_CONFIG.baseSpeed,
      combo: 0,
      lives: 3,
      maxLives: 3,
    }
    
    this.onStateChange?.(this.gameState)
  }

  private render(): void {
    renderFrame(
      this.ctx,
      this.canvas,
      this.runner,
      this.obstacles,
      this.collectibles,
      this.tiles,
      this.viewZ,
      this.gameTime / 1000,
      this.gameState
    )
  }

  // Public getters for HUD
  getRunner(): DemoRunnerState { return this.runner }
  getGameState(): DemoGameState { return this.gameState }
  getDistance(): number { return this.gameState.distance }
  getScore(): number { return this.gameState.score }
  getSpeed(): number { return this.gameState.speed }
  getCombo(): number { return this.gameState.combo }
  getLives(): number { return this.gameState.lives }
  getGameTime(): number { return this.gameTime }
  getLoopDuration(): number { return DEMO_CONFIG.loopDuration }
}
