/**
 * DemoGameEngine - Simplified game engine for landing page demo
 * 
 * A lightweight version of the game engine that runs AI vs AI matches
 * for the landing page showcase. Uses canvas rendering with simplified
 * physics and combat.
 * 
 * @module landing/enterprise/demo/DemoGameEngine
 * Requirements: 2.1, 2.2, 2.3
 */

import type { DemoAI, DemoMatchState, DemoPlayerState, DemoProjectile, DemoQuestion } from './types'

// Demo arena configuration
const DEMO_ARENA = {
  width: 800,
  height: 450,
  playerRadius: 16,
  projectileRadius: 6,
  projectileSpeed: 400,
}

// Demo questions for the showcase
const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: '1',
    text: 'What year was Fortnite released?',
    options: ['2015', '2016', '2017', '2018'],
    correctIndex: 2,
  },
  {
    id: '2',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
  },
  {
    id: '3',
    text: 'What is the capital of Japan?',
    options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
    correctIndex: 2,
  },
]

/**
 * Create initial player state
 */
function createPlayer(id: string, x: number, y: number, color: string): DemoPlayerState {
  return {
    id,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    health: 100,
    maxHealth: 100,
    score: 0,
    color,
    isAlive: true,
    facingRight: id === 'player1',
  }
}

/**
 * Create AI controller
 */
function createAI(personality: 'aggressive' | 'defensive'): DemoAI {
  return {
    state: 'idle',
    personality,
    reactionTime: personality === 'aggressive' ? 200 : 300,
    accuracy: personality === 'aggressive' ? 0.8 : 0.7,
    quizSpeed: personality === 'aggressive' ? 1.5 : 2.0,
    targetPosition: null,
    stateTimer: 0,
    lastFireTime: 0,
    selectedAnswer: null,
  }
}

export class DemoGameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private lastTime = 0
  private matchTime = 0
  private loopDuration = 30000 // 30 seconds
  
  // Game state
  private player1: DemoPlayerState
  private player2: DemoPlayerState
  private ai1: DemoAI
  private ai2: DemoAI
  private projectiles: DemoProjectile[] = []
  private currentQuestion: DemoQuestion | null = null
  private questionTimer = 0
  private killFeed: Array<{ text: string; time: number }> = []
  
  // Match state
  private matchState: DemoMatchState = {
    phase: 'intro',
    timeInPhase: 0,
    isPlaying: false,
  }

  // Callbacks
  private onStateChange?: (state: DemoMatchState) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2d context')
    this.ctx = ctx

    // Initialize players
    this.player1 = createPlayer('player1', 150, DEMO_ARENA.height / 2, '#F97316')
    this.player2 = createPlayer('player2', DEMO_ARENA.width - 150, DEMO_ARENA.height / 2, '#A855F7')
    
    // Initialize AI
    this.ai1 = createAI('aggressive')
    this.ai2 = createAI('defensive')
  }

  setOnStateChange(callback: (state: DemoMatchState) => void): void {
    this.onStateChange = callback
  }

  start(): void {
    if (this.matchState.isPlaying) return
    this.matchState.isPlaying = true
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.matchState.isPlaying = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  destroy(): void {
    this.stop()
  }

  private loop = (): void => {
    if (!this.matchState.isPlaying) return

    const now = performance.now()
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1) // Cap at 100ms
    this.lastTime = now

    this.update(deltaTime)
    this.render()

    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    this.matchTime += dt * 1000
    this.matchState.timeInPhase += dt * 1000

    // Update match phases
    this.updateMatchPhase()

    // Update AI
    this.updateAI(this.ai1, this.player1, this.player2, dt)
    this.updateAI(this.ai2, this.player2, this.player1, dt)

    // Update physics
    this.updatePlayer(this.player1, dt)
    this.updatePlayer(this.player2, dt)

    // Update projectiles
    this.updateProjectiles(dt)

    // Update question timer
    if (this.currentQuestion) {
      this.questionTimer -= dt * 1000
      if (this.questionTimer <= 0) {
        this.resolveQuestion()
      }
    }

    // Clean up kill feed
    const currentTime = performance.now()
    this.killFeed = this.killFeed.filter(k => currentTime - k.time < 3000)

    // Check for loop reset
    if (this.matchTime >= this.loopDuration) {
      this.resetMatch()
    }
  }

  private updateMatchPhase(): void {
    const time = this.matchTime

    if (time < 3000) {
      this.setPhase('intro')
    } else if (time < 9000) {
      this.setPhase('question')
      if (!this.currentQuestion && this.matchState.phase === 'question') {
        this.showQuestion(0)
      }
    } else if (time < 15000) {
      this.setPhase('combat')
    } else if (time < 21000) {
      this.setPhase('question')
      if (!this.currentQuestion && this.matchState.phase === 'question') {
        this.showQuestion(1)
      }
    } else if (time < 28000) {
      this.setPhase('finale')
      if (!this.currentQuestion && time > 24000 && time < 25000) {
        this.showQuestion(2)
      }
    } else {
      this.setPhase('reset')
    }
  }

  private setPhase(phase: DemoMatchState['phase']): void {
    if (this.matchState.phase !== phase) {
      this.matchState.phase = phase
      this.matchState.timeInPhase = 0
      this.onStateChange?.(this.matchState)
    }
  }

  private showQuestion(index: number): void {
    if (index >= DEMO_QUESTIONS.length) return
    this.currentQuestion = DEMO_QUESTIONS[index]
    this.questionTimer = 6000 // 6 seconds per question
    this.ai1.selectedAnswer = null
    this.ai2.selectedAnswer = null
    
    // Schedule AI answers
    setTimeout(() => {
      if (this.currentQuestion) {
        this.ai1.selectedAnswer = Math.random() < this.ai1.accuracy 
          ? this.currentQuestion.correctIndex 
          : Math.floor(Math.random() * 4)
      }
    }, this.ai1.quizSpeed * 1000)

    setTimeout(() => {
      if (this.currentQuestion) {
        this.ai2.selectedAnswer = Math.random() < this.ai2.accuracy 
          ? this.currentQuestion.correctIndex 
          : Math.floor(Math.random() * 4)
      }
    }, this.ai2.quizSpeed * 1000)
  }

  private resolveQuestion(): void {
    if (!this.currentQuestion) return

    const correct = this.currentQuestion.correctIndex
    
    if (this.ai1.selectedAnswer === correct) {
      this.player1.score += 100
      this.addKillFeed('Player 1 answered correctly! +100')
    }
    if (this.ai2.selectedAnswer === correct) {
      this.player2.score += 100
      this.addKillFeed('Player 2 answered correctly! +100')
    }

    this.currentQuestion = null
  }

  private addKillFeed(text: string): void {
    this.killFeed.push({ text, time: performance.now() })
  }

  private updateAI(ai: DemoAI, self: DemoPlayerState, opponent: DemoPlayerState, dt: number): void {
    ai.stateTimer += dt * 1000

    // State machine
    switch (ai.state) {
      case 'idle':
        if (ai.stateTimer > 500 + Math.random() * 500) {
          ai.state = 'moving'
          ai.stateTimer = 0
          ai.targetPosition = {
            x: 100 + Math.random() * (DEMO_ARENA.width - 200),
            y: 100 + Math.random() * (DEMO_ARENA.height - 200),
          }
        }
        break

      case 'moving':
        if (ai.targetPosition) {
          const dx = ai.targetPosition.x - self.position.x
          const dy = ai.targetPosition.y - self.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 20 || ai.stateTimer > 2000) {
            ai.state = 'aiming'
            ai.stateTimer = 0
          } else {
            const speed = 150
            self.velocity.x = (dx / dist) * speed
            self.velocity.y = (dy / dist) * speed
          }
        }
        break

      case 'aiming':
        self.velocity.x *= 0.9
        self.velocity.y *= 0.9
        
        // Face opponent
        self.facingRight = opponent.position.x > self.position.x

        if (ai.stateTimer > ai.reactionTime) {
          ai.state = 'firing'
          ai.stateTimer = 0
        }
        break

      case 'firing':
        if (performance.now() - ai.lastFireTime > 500) {
          this.fireProjectile(self, opponent)
          ai.lastFireTime = performance.now()
        }
        
        if (ai.stateTimer > 300) {
          ai.state = ai.personality === 'aggressive' ? 'moving' : 'dodging'
          ai.stateTimer = 0
        }
        break

      case 'dodging':
        // Quick strafe
        const dodgeDir = Math.random() > 0.5 ? 1 : -1
        self.velocity.y = dodgeDir * 200
        
        if (ai.stateTimer > 400) {
          ai.state = 'idle'
          ai.stateTimer = 0
        }
        break

      case 'answering':
        // Handled by question system
        if (!this.currentQuestion) {
          ai.state = 'idle'
          ai.stateTimer = 0
        }
        break
    }

    // Override to answering when question is active
    if (this.currentQuestion && ai.state !== 'answering') {
      ai.state = 'answering'
      ai.stateTimer = 0
    }
  }

  private fireProjectile(from: DemoPlayerState, to: DemoPlayerState): void {
    const dx = to.position.x - from.position.x
    const dy = to.position.y - from.position.y
    
    // Add some inaccuracy
    const wobble = (1 - (from.id === 'player1' ? this.ai1.accuracy : this.ai2.accuracy)) * 0.3
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * wobble

    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      position: { x: from.position.x, y: from.position.y },
      velocity: {
        x: Math.cos(angle) * DEMO_ARENA.projectileSpeed,
        y: Math.sin(angle) * DEMO_ARENA.projectileSpeed,
      },
      ownerId: from.id,
      color: from.color,
    })
  }

  private updatePlayer(player: DemoPlayerState, dt: number): void {
    // Apply velocity
    player.position.x += player.velocity.x * dt
    player.position.y += player.velocity.y * dt

    // Friction
    player.velocity.x *= 0.95
    player.velocity.y *= 0.95

    // Bounds
    const r = DEMO_ARENA.playerRadius
    player.position.x = Math.max(r, Math.min(DEMO_ARENA.width - r, player.position.x))
    player.position.y = Math.max(r, Math.min(DEMO_ARENA.height - r, player.position.y))
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      
      // Move
      proj.position.x += proj.velocity.x * dt
      proj.position.y += proj.velocity.y * dt

      // Check bounds
      if (proj.position.x < 0 || proj.position.x > DEMO_ARENA.width ||
          proj.position.y < 0 || proj.position.y > DEMO_ARENA.height) {
        this.projectiles.splice(i, 1)
        continue
      }

      // Check collision with players
      const target = proj.ownerId === 'player1' ? this.player2 : this.player1
      const dx = proj.position.x - target.position.x
      const dy = proj.position.y - target.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < DEMO_ARENA.playerRadius + DEMO_ARENA.projectileRadius) {
        // Hit!
        target.health = Math.max(0, target.health - 15)
        this.projectiles.splice(i, 1)
        
        const attacker = proj.ownerId === 'player1' ? 'Player 1' : 'Player 2'
        this.addKillFeed(`${attacker} landed a hit!`)

        if (target.health <= 0) {
          target.isAlive = false
          this.addKillFeed(`${attacker} eliminated ${target.id === 'player1' ? 'Player 1' : 'Player 2'}!`)
          
          // Respawn after delay
          setTimeout(() => {
            target.health = target.maxHealth
            target.isAlive = true
            target.position = {
              x: target.id === 'player1' ? 150 : DEMO_ARENA.width - 150,
              y: DEMO_ARENA.height / 2,
            }
          }, 2000)
        }
      }
    }
  }

  private resetMatch(): void {
    this.matchTime = 0
    this.matchState.phase = 'intro'
    this.matchState.timeInPhase = 0
    this.currentQuestion = null
    
    // Reset players
    this.player1 = createPlayer('player1', 150, DEMO_ARENA.height / 2, '#F97316')
    this.player2 = createPlayer('player2', DEMO_ARENA.width - 150, DEMO_ARENA.height / 2, '#A855F7')
    
    // Reset AI
    this.ai1 = createAI('aggressive')
    this.ai2 = createAI('defensive')
    
    this.projectiles = []
    this.killFeed = []
  }

  private render(): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const scaleX = w / DEMO_ARENA.width
    const scaleY = h / DEMO_ARENA.height

    // Clear
    ctx.fillStyle = '#09090B'
    ctx.fillRect(0, 0, w, h)

    // Draw arena background
    this.renderArena(ctx, scaleX, scaleY)

    // Draw projectiles
    for (const proj of this.projectiles) {
      ctx.beginPath()
      ctx.arc(proj.position.x * scaleX, proj.position.y * scaleY, DEMO_ARENA.projectileRadius * scaleX, 0, Math.PI * 2)
      ctx.fillStyle = proj.color
      ctx.shadowColor = proj.color
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // Draw players
    this.renderPlayer(ctx, this.player1, scaleX, scaleY)
    this.renderPlayer(ctx, this.player2, scaleX, scaleY)

    // Draw HUD is handled by DemoHUD component
  }

  private renderArena(ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number): void {
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1

    const gridSize = 50
    for (let x = 0; x <= DEMO_ARENA.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x * scaleX, 0)
      ctx.lineTo(x * scaleX, DEMO_ARENA.height * scaleY)
      ctx.stroke()
    }
    for (let y = 0; y <= DEMO_ARENA.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y * scaleY)
      ctx.lineTo(DEMO_ARENA.width * scaleX, y * scaleY)
      ctx.stroke()
    }

    // Border
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, DEMO_ARENA.width * scaleX - 4, DEMO_ARENA.height * scaleY - 4)
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, player: DemoPlayerState, scaleX: number, scaleY: number): void {
    if (!player.isAlive) return

    const x = player.position.x * scaleX
    const y = player.position.y * scaleY
    const r = DEMO_ARENA.playerRadius * scaleX

    // Glow
    ctx.beginPath()
    ctx.arc(x, y, r * 1.5, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5)
    gradient.addColorStop(0, player.color + '40')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fill()

    // Body
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = player.color
    ctx.fill()

    // Direction indicator
    const dirX = player.facingRight ? r * 0.8 : -r * 0.8
    ctx.beginPath()
    ctx.arc(x + dirX, y - r * 0.3, r * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  }

  // Public getters for HUD
  getPlayer1(): DemoPlayerState { return this.player1 }
  getPlayer2(): DemoPlayerState { return this.player2 }
  getCurrentQuestion(): DemoQuestion | null { return this.currentQuestion }
  getQuestionTimer(): number { return this.questionTimer }
  getKillFeed(): Array<{ text: string; time: number }> { return this.killFeed }
  getMatchState(): DemoMatchState { return this.matchState }
  getMatchTime(): number { return this.matchTime }
  getLoopDuration(): number { return this.loopDuration }
  getAI1Answer(): number | null { return this.ai1.selectedAnswer }
  getAI2Answer(): number | null { return this.ai2.selectedAnswer }
}
