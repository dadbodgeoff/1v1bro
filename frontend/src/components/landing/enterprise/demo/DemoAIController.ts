/**
 * DemoAIController - AI behavior for demo players
 * 
 * Handles AI state machine, decision making, and quiz answering
 * 
 * @module landing/enterprise/demo/DemoAIController
 */

import type { DemoAI, DemoPlayerState, DemoQuestion } from './types'

/**
 * Create AI controller with personality
 */
export function createAI(personality: 'aggressive' | 'defensive'): DemoAI {
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

interface AIUpdateContext {
  arenaWidth: number
  arenaHeight: number
  currentQuestion: DemoQuestion | null
  onFire: (from: DemoPlayerState, to: DemoPlayerState) => void
}

/**
 * Update AI state machine
 */
export function updateAI(
  ai: DemoAI,
  self: DemoPlayerState,
  opponent: DemoPlayerState,
  dt: number,
  context: AIUpdateContext
): void {
  ai.stateTimer += dt * 1000

  // State machine
  switch (ai.state) {
    case 'idle':
      handleIdleState(ai, context)
      break

    case 'moving':
      handleMovingState(ai, self)
      break

    case 'aiming':
      handleAimingState(ai, self, opponent)
      break

    case 'firing':
      handleFiringState(ai, self, opponent, context)
      break

    case 'dodging':
      handleDodgingState(ai, self)
      break

    case 'answering':
      if (!context.currentQuestion) {
        ai.state = 'idle'
        ai.stateTimer = 0
      }
      break
  }

  // Override to answering when question is active
  if (context.currentQuestion && ai.state !== 'answering') {
    ai.state = 'answering'
    ai.stateTimer = 0
  }
}

function handleIdleState(ai: DemoAI, context: AIUpdateContext): void {
  if (ai.stateTimer > 500 + Math.random() * 500) {
    ai.state = 'moving'
    ai.stateTimer = 0
    ai.targetPosition = {
      x: 100 + Math.random() * (context.arenaWidth - 200),
      y: 100 + Math.random() * (context.arenaHeight - 200),
    }
  }
}

function handleMovingState(ai: DemoAI, self: DemoPlayerState): void {
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
}

function handleAimingState(ai: DemoAI, self: DemoPlayerState, opponent: DemoPlayerState): void {
  self.velocity.x *= 0.9
  self.velocity.y *= 0.9
  
  // Face opponent
  self.facingRight = opponent.position.x > self.position.x

  if (ai.stateTimer > ai.reactionTime) {
    ai.state = 'firing'
    ai.stateTimer = 0
  }
}

function handleFiringState(
  ai: DemoAI,
  self: DemoPlayerState,
  opponent: DemoPlayerState,
  context: AIUpdateContext
): void {
  if (performance.now() - ai.lastFireTime > 500) {
    context.onFire(self, opponent)
    ai.lastFireTime = performance.now()
  }
  
  if (ai.stateTimer > 300) {
    ai.state = ai.personality === 'aggressive' ? 'moving' : 'dodging'
    ai.stateTimer = 0
  }
}

function handleDodgingState(ai: DemoAI, self: DemoPlayerState): void {
  // Quick strafe
  const dodgeDir = Math.random() > 0.5 ? 1 : -1
  self.velocity.y = dodgeDir * 200
  
  if (ai.stateTimer > 400) {
    ai.state = 'idle'
    ai.stateTimer = 0
  }
}

/**
 * Schedule AI answer for a question
 */
export function scheduleAIAnswer(
  ai: DemoAI,
  question: DemoQuestion,
  onAnswer: (answer: number) => void
): void {
  setTimeout(() => {
    const answer = Math.random() < ai.accuracy 
      ? question.correctIndex 
      : Math.floor(Math.random() * 4)
    ai.selectedAnswer = answer
    onAnswer(answer)
  }, ai.quizSpeed * 1000)
}
