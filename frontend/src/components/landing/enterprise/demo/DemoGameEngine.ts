/**
 * DemoGameEngine - Simplified game engine for landing page demo
 * 
 * A lightweight version of the game engine that runs AI vs AI matches
 * for the landing page showcase. Coordinates AI, physics, and rendering.
 * 
 * @module landing/enterprise/demo/DemoGameEngine
 * Requirements: 2.1, 2.2, 2.3
 */

import type { DemoAI, DemoMatchState, DemoPlayerState, DemoProjectile, DemoQuestion } from './types'
import { createAI, updateAI, scheduleAIAnswer } from './DemoAIController'
import { DEMO_ARENA, createPlayer, updatePlayer, fireProjectile, updateProjectiles, applyDamage, respawnPlayer } from './DemoPhysics'
import { renderFrame } from './DemoRenderer'

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
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now

    this.update(deltaTime)
    this.render()

    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    this.matchTime += dt * 1000
    this.matchState.timeInPhase += dt * 1000

    this.updateMatchPhase()
    this.updateAIs(dt)
    this.updatePhysics(dt)
    this.updateQuestionTimer(dt)
    this.cleanupKillFeed()

    if (this.matchTime >= this.loopDuration) {
      this.resetMatch()
    }
  }

  private updateAIs(dt: number): void {
    const context = {
      arenaWidth: DEMO_ARENA.width,
      arenaHeight: DEMO_ARENA.height,
      currentQuestion: this.currentQuestion,
      onFire: (from: DemoPlayerState, to: DemoPlayerState) => this.handleFire(from, to),
    }
    
    updateAI(this.ai1, this.player1, this.player2, dt, context)
    updateAI(this.ai2, this.player2, this.player1, dt, context)
  }

  private updatePhysics(dt: number): void {
    updatePlayer(this.player1, dt, DEMO_ARENA)
    updatePlayer(this.player2, dt, DEMO_ARENA)
    
    this.projectiles = updateProjectiles(
      this.projectiles,
      this.player1,
      this.player2,
      dt,
      DEMO_ARENA,
      (result, proj) => this.handleProjectileHit(result, proj)
    )
  }

  private handleFire(from: DemoPlayerState, to: DemoPlayerState): void {
    const accuracy = from.id === 'player1' ? this.ai1.accuracy : this.ai2.accuracy
    this.projectiles.push(fireProjectile(from, to, accuracy, DEMO_ARENA))
  }

  private handleProjectileHit(result: { targetId: string; damage: number }, proj: DemoProjectile): void {
    const target = result.targetId === 'player1' ? this.player1 : this.player2
    const attacker = proj.ownerId === 'player1' ? 'Player 1' : 'Player 2'
    
    const died = applyDamage(target, result.damage)
    this.addKillFeed(`${attacker} landed a hit!`)

    if (died) {
      const targetName = target.id === 'player1' ? 'Player 1' : 'Player 2'
      this.addKillFeed(`${attacker} eliminated ${targetName}!`)
      
      setTimeout(() => respawnPlayer(target, DEMO_ARENA), 2000)
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
    this.questionTimer = 6000
    this.ai1.selectedAnswer = null
    this.ai2.selectedAnswer = null
    
    scheduleAIAnswer(this.ai1, this.currentQuestion, () => {})
    scheduleAIAnswer(this.ai2, this.currentQuestion, () => {})
  }

  private updateQuestionTimer(dt: number): void {
    if (this.currentQuestion) {
      this.questionTimer -= dt * 1000
      if (this.questionTimer <= 0) {
        this.resolveQuestion()
      }
    }
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

  private cleanupKillFeed(): void {
    const currentTime = performance.now()
    this.killFeed = this.killFeed.filter(k => currentTime - k.time < 3000)
  }

  private resetMatch(): void {
    this.matchTime = 0
    this.matchState.phase = 'intro'
    this.matchState.timeInPhase = 0
    this.currentQuestion = null
    
    this.player1 = createPlayer('player1', 150, DEMO_ARENA.height / 2, '#F97316')
    this.player2 = createPlayer('player2', DEMO_ARENA.width - 150, DEMO_ARENA.height / 2, '#A855F7')
    this.ai1 = createAI('aggressive')
    this.ai2 = createAI('defensive')
    
    this.projectiles = []
    this.killFeed = []
  }

  private render(): void {
    renderFrame(this.ctx, this.canvas, DEMO_ARENA, this.player1, this.player2, this.projectiles)
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
