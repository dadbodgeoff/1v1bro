/**
 * SoundEventRegistry - Single source of truth for all game sound triggers
 *
 * This file documents EVERY sound in the game and what triggers it.
 * Use this as a reference when debugging "why isn't X sound playing?"
 *
 * Architecture:
 * - Game systems emit events → FeedbackSystem → SoundManager
 * - This registry documents the mapping between game events and sounds
 *
 * @see FeedbackSystem for the actual sound emission
 * @see SynthSoundManager for sound generation
 */

import type { SoundEvent } from '../effects/FeedbackSystem'

/**
 * Sound trigger configuration
 */
export interface SoundTrigger {
  /** The sound event to play */
  sound: SoundEvent
  /** Default intensity (0-1) */
  intensity: number
  /** Default pitch multiplier */
  pitch?: number
  /** Description of when this sound plays */
  description: string
  /** Which system triggers this sound */
  triggeredBy: string
  /** File location where the trigger originates */
  sourceFile: string
}

/**
 * Complete registry of all game sounds and their triggers
 *
 * This is the SINGLE PLACE to see what sounds play and when.
 * If a sound isn't playing, check:
 * 1. Is the trigger listed here?
 * 2. Is the sourceFile actually calling the trigger?
 * 3. Is FeedbackSystem wired to SoundManager? (useSurvivalGame.ts)
 */
export const SOUND_REGISTRY: Record<string, SoundTrigger> = {
  // ============================================
  // PLAYER MOVEMENT SOUNDS
  // ============================================

  'player.jump': {
    sound: 'jump',
    intensity: 0.8,
    description: 'Player initiates a jump',
    triggeredBy: 'FeedbackSystem.onJump()',
    sourceFile: 'engine/FixedUpdateLoop.ts',
  },

  'player.land': {
    sound: 'land',
    intensity: 0.5, // Varies with velocity
    description: 'Player lands from a jump (normal landing)',
    triggeredBy: 'FeedbackSystem.onLand(velocity)',
    sourceFile: 'engine/FixedUpdateLoop.ts',
  },

  'player.landHeavy': {
    sound: 'land-heavy',
    intensity: 0.8,
    pitch: 0.8,
    description: 'Player lands from a high jump (velocity > 15)',
    triggeredBy: 'FeedbackSystem.onLand(velocity)',
    sourceFile: 'engine/FixedUpdateLoop.ts',
  },

  'player.slideStart': {
    sound: 'slide-start',
    intensity: 0.7,
    description: 'Player begins sliding',
    triggeredBy: 'FeedbackSystem.onSlideStart()',
    sourceFile: 'engine/FixedUpdateLoop.ts',
  },

  'player.slideEnd': {
    sound: 'slide-end',
    intensity: 0.5,
    description: 'Player stops sliding',
    triggeredBy: 'FeedbackSystem.onSlideEnd()',
    sourceFile: 'engine/FixedUpdateLoop.ts',
  },

  'player.laneChange': {
    sound: 'lane-change',
    intensity: 0.5,
    description: 'Player changes lanes (left/right)',
    triggeredBy: 'FeedbackSystem.onLaneChange(direction)',
    sourceFile: 'engine/FixedUpdateLoop.ts',
  },

  // ============================================
  // COLLISION & DODGE SOUNDS
  // ============================================

  'collision.obstacle': {
    sound: 'collision',
    intensity: 1,
    description: 'Player collides with an obstacle',
    triggeredBy: 'FeedbackSystem.onCollision()',
    sourceFile: 'engine/CollisionHandler.ts',
  },

  'collision.nearMiss': {
    sound: 'near-miss',
    intensity: 0.7, // Varies with distance
    description: 'Player barely clears an obstacle (close call)',
    triggeredBy: 'FeedbackSystem.onNearMiss(distance, position)',
    sourceFile: 'engine/CollisionHandler.ts',
  },

  'collision.perfectDodge': {
    sound: 'perfect-dodge',
    intensity: 1,
    pitch: 1.2,
    description: 'Player perfectly dodges an obstacle (very close)',
    triggeredBy: 'FeedbackSystem.onPerfectDodge(position)',
    sourceFile: 'engine/CollisionHandler.ts',
  },

  // ============================================
  // GAME STATE SOUNDS
  // ============================================

  'game.countdown': {
    sound: 'countdown',
    intensity: 0.8,
    description: 'Countdown tick (3, 2, 1)',
    triggeredBy: 'feedbackSystem.emitSound("countdown")',
    sourceFile: 'engine/SurvivalEngine.ts (setupTransitionCallbacks)',
  },

  'game.go': {
    sound: 'boost',
    intensity: 1,
    description: 'Game starts (GO!)',
    triggeredBy: 'feedbackSystem.emitSound("boost")',
    sourceFile: 'engine/SurvivalEngine.ts (setupTransitionCallbacks)',
  },

  'game.over': {
    sound: 'game-over',
    intensity: 1,
    description: 'Player loses all lives',
    triggeredBy: 'FeedbackSystem.onGameOver()',
    sourceFile: 'engine/CollisionHandler.ts',
  },

  'game.lifeLost': {
    sound: 'collision',
    intensity: 0.8,
    description: 'Player loses a life (from quiz wrong answer)',
    triggeredBy: 'feedbackSystem.emitSound("collision")',
    sourceFile: 'engine/SurvivalEngine.ts (loseLife)',
  },

  // ============================================
  // MILESTONE & ACHIEVEMENT SOUNDS
  // ============================================

  'milestone.reached': {
    sound: 'milestone',
    intensity: 0.7, // 1.0 for major milestones
    description: 'Player reaches a distance milestone (500m, 1000m, etc)',
    triggeredBy: 'feedbackSystem.emitSound("milestone")',
    sourceFile: 'engine/SurvivalEngine.ts (milestoneSystem.onMilestone)',
  },

  'achievement.unlocked': {
    sound: 'milestone',
    intensity: 1,
    pitch: 1.2,
    description: 'Player unlocks an achievement',
    triggeredBy: 'feedbackSystem.emitSound("milestone")',
    sourceFile: 'engine/SurvivalEngine.ts (achievementSystem.onAchievement)',
  },

  'combo.milestone': {
    sound: 'combo-milestone',
    intensity: 1,
    description: 'Player reaches a combo milestone (5x, 10x, etc)',
    triggeredBy: 'FeedbackSystem.onComboMilestone(combo, position)',
    sourceFile: 'engine/CollisionHandler.ts',
  },

  // ============================================
  // COLLECTIBLE SOUNDS
  // ============================================

  'collectible.gem': {
    sound: 'collect',
    intensity: 0.6,
    description: 'Player collects a gem/collectible',
    triggeredBy: 'feedbackSystem.emitSound("collect")',
    sourceFile: 'engine/SurvivalEngine.ts (collectibleManager.onCollect)',
  },

  // ============================================
  // QUIZ/TRIVIA SOUNDS
  // ============================================

  'quiz.popup': {
    sound: 'quiz-popup',
    intensity: 1,
    description: 'New trivia question appears',
    triggeredBy: 'FeedbackSystem.onQuizPopup()',
    sourceFile: 'world/TriviaBillboardManager.ts (showNextQuestion)',
  },

  'quiz.correct': {
    sound: 'quiz-correct',
    intensity: 1,
    description: 'Player answers trivia correctly',
    triggeredBy: 'FeedbackSystem.onQuizCorrect()',
    sourceFile: 'world/TriviaBillboardManager.ts (handleAnswer)',
  },

  'quiz.wrong': {
    sound: 'quiz-wrong',
    intensity: 0.8,
    description: 'Player answers trivia incorrectly or times out',
    triggeredBy: 'FeedbackSystem.onQuizWrong()',
    sourceFile: 'world/TriviaBillboardManager.ts (handleAnswer, handleTimeout)',
  },

  'quiz.tick': {
    sound: 'quiz-tick',
    intensity: 0.8,
    description: 'Quiz countdown tick (6-10 seconds remaining)',
    triggeredBy: 'FeedbackSystem.onQuizTick()',
    sourceFile: 'world/TriviaBillboardManager.ts (startTimer)',
  },

  'quiz.tickUrgent': {
    sound: 'quiz-tick-urgent',
    intensity: 1,
    description: 'Quiz countdown tick (last 5 seconds)',
    triggeredBy: 'FeedbackSystem.onQuizTickUrgent()',
    sourceFile: 'world/TriviaBillboardManager.ts (startTimer)',
  },

  // ============================================
  // AMBIENT SOUNDS
  // ============================================

  'ambient.wind': {
    sound: 'speed-wind',
    intensity: 0.5, // Varies with speed
    description: 'Wind sound that increases with speed',
    triggeredBy: 'FeedbackSystem.updateSpeedWind(speed)',
    sourceFile: 'engine/RenderUpdateLoop.ts (not currently wired)',
  },

  'ambient.boost': {
    sound: 'boost',
    intensity: 1,
    description: 'Speed boost activated',
    triggeredBy: 'FeedbackSystem.onBoost()',
    sourceFile: 'Not currently used in survival mode',
  },

  // ============================================
  // UI/ARCADE SOUNDS
  // ============================================

  'ui.hover': {
    sound: 'arcade-hover',
    intensity: 0.6,
    description: 'Mouse hovers over interactive element',
    triggeredBy: 'useUISound().playHover() or UISound.hover()',
    sourceFile: 'hooks/useUISound.ts',
  },

  'ui.click': {
    sound: 'arcade-click',
    intensity: 0.8,
    description: 'User clicks/selects an element',
    triggeredBy: 'useUISound().playClick() or UISound.click()',
    sourceFile: 'hooks/useUISound.ts',
  },

  'arcade.powerOn': {
    sound: 'arcade-power-on',
    intensity: 1,
    description: 'Arcade cabinet powers on (landing page)',
    triggeredBy: 'useArcadeSound().playStartupChime()',
    sourceFile: 'components/landing/arcade/hooks/useArcadeSound.ts',
  },

  'arcade.bootBlip': {
    sound: 'arcade-boot-blip',
    intensity: 1,
    description: 'Terminal typing sound during boot sequence',
    triggeredBy: 'useArcadeSound().playBootBlip()',
    sourceFile: 'components/landing/arcade/hooks/useArcadeSound.ts',
  },

  'arcade.bootLine': {
    sound: 'arcade-boot-line',
    intensity: 1,
    description: 'Boot sequence line complete',
    triggeredBy: 'useArcadeSound().playBootLine()',
    sourceFile: 'components/landing/arcade/hooks/useArcadeSound.ts',
  },

  'arcade.ready': {
    sound: 'arcade-ready',
    intensity: 1,
    description: 'Arcade boot complete fanfare',
    triggeredBy: 'useArcadeSound().playReadyFanfare()',
    sourceFile: 'components/landing/arcade/hooks/useArcadeSound.ts',
  },
}

/**
 * Get all sounds triggered by a specific system
 */
export function getSoundsBySystem(system: string): SoundTrigger[] {
  return Object.values(SOUND_REGISTRY).filter((trigger) =>
    trigger.triggeredBy.toLowerCase().includes(system.toLowerCase())
  )
}

/**
 * Get all sounds from a specific source file
 */
export function getSoundsBySourceFile(file: string): SoundTrigger[] {
  return Object.values(SOUND_REGISTRY).filter((trigger) =>
    trigger.sourceFile.toLowerCase().includes(file.toLowerCase())
  )
}

/**
 * Get a sound trigger by its key
 */
export function getSoundTrigger(key: string): SoundTrigger | undefined {
  return SOUND_REGISTRY[key]
}

/**
 * Debug: Print all sound triggers to console
 */
export function debugPrintSoundRegistry(): void {
  console.group('[SoundEventRegistry] All Sound Triggers')

  const categories = new Map<string, SoundTrigger[]>()

  Object.entries(SOUND_REGISTRY).forEach(([key, trigger]) => {
    const category = key.split('.')[0]
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(trigger)
  })

  categories.forEach((triggers, category) => {
    console.group(`${category.toUpperCase()} (${triggers.length} sounds)`)
    triggers.forEach((t) => {
      console.log(`  ${t.sound}: ${t.description}`)
      console.log(`    → ${t.triggeredBy}`)
      console.log(`    @ ${t.sourceFile}`)
    })
    console.groupEnd()
  })

  console.groupEnd()
}
