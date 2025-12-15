/**
 * useTriviaBillboards - React hook for the holographic trivia billboard system
 * 
 * Replaces the compact QuizPanel with large holographic billboards
 * on the sides of the track. Handles:
 * - Subsystem lifecycle tied to engine
 * - Score/timeout callbacks
 * - Sound integration
 * - Stats for UI display
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SurvivalEngine } from '../engine/SurvivalEngine'
import {
  TriviaBillboardSubsystem,
  type TriviaScoreEvent,
  type TriviaTimeoutEvent,
} from '../systems/TriviaBillboardSubsystem'
import type { TriviaCategory } from '../world/TriviaQuestionProvider'
import { useSurvivalAnalytics } from './useSurvivalAnalytics'

export interface UseTriviaBillboardsOptions {
  category?: TriviaCategory
  enabled?: boolean
  onCorrectAnswer?: (points: number) => void
  onWrongAnswer?: () => void
  onTimeout?: () => void
}

export interface UseTriviaBillboardsReturn {
  isActive: boolean
  stats: {
    activeBillboards: number
    questionsUsed: number
    questionsRemaining: number
    category: TriviaCategory
    timeRemaining: number
  } | null
  totalScore: number
  correctCount: number
  wrongCount: number
  streak: number
  hasActiveQuestion: boolean
  start: () => void
  stop: () => void
  setCategory: (category: TriviaCategory) => void
  answerQuestion: (answerIndex: number) => boolean // For mobile tap input
}

export function useTriviaBillboards(
  engine: SurvivalEngine | null,
  options: UseTriviaBillboardsOptions = {}
): UseTriviaBillboardsReturn {
  const { category = 'fortnite', enabled = true } = options

  const subsystemRef = useRef<TriviaBillboardSubsystem | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const initializedRef = useRef(false)

  const [isActive, setIsActive] = useState(false)
  const [stats, setStats] = useState<UseTriviaBillboardsReturn['stats']>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)

  // Analytics tracking
  const analytics = useSurvivalAnalytics()

  // Store callbacks and engine in refs to avoid re-creating subsystem
  const callbacksRef = useRef(options)
  callbacksRef.current = options
  const engineRef = useRef(engine)
  engineRef.current = engine
  const analyticsRef = useRef(analytics)
  analyticsRef.current = analytics

  // Initialize subsystem ONCE when engine becomes available
  useEffect(() => {
    // Only initialize once
    if (!engine || !enabled || initializedRef.current) return
    if (subsystemRef.current) return // Already have a subsystem

    initializedRef.current = true

    const scene = engine.getScene()
    const subsystem = new TriviaBillboardSubsystem(scene, { category })
    subsystemRef.current = subsystem

    // Wire up sound callback
    const feedbackSystem = engine.getFeedbackSystem()
    subsystem.setSoundCallback((sound, opts) => {
      feedbackSystem.emitSound(sound as 'quiz-correct' | 'quiz-wrong', opts)
    })

    // Wire up screen shake callback
    subsystem.setScreenShakeCallback((intensity, _duration) => {
      engine.triggerScreenShake(intensity)
    })

    // Wire up score callback
    const unsubScore = subsystem.onScore((event: TriviaScoreEvent) => {
      const playerZ = engineRef.current?.getPlayerZ() || 0
      
      if (event.isCorrect) {
        setTotalScore((prev) => prev + event.points)
        setCorrectCount((prev) => {
          // Track trivia analytics for correct answer
          analyticsRef.current.trackTrivia({
            questionId: event.questionId,
            category,
            correct: true,
            distanceAtQuestion: playerZ,
            streakBefore: prev, // prev is the count before this answer
          })
          return prev + 1
        })
        setStreak((prev) => prev + 1)
        callbacksRef.current.onCorrectAnswer?.(event.points)
      } else {
        // Track trivia analytics for wrong answer
        analyticsRef.current.trackTrivia({
          questionId: event.questionId,
          category,
          correct: false,
          distanceAtQuestion: playerZ,
        })
        setWrongCount((prev) => prev + 1)
        setStreak(0)
        callbacksRef.current.onWrongAnswer?.()
      }
    })

    // Wire up timeout callback
    const unsubTimeout = subsystem.onTimeout((event: TriviaTimeoutEvent) => {
      const playerZ = engineRef.current?.getPlayerZ() || 0
      
      // Track trivia analytics for timeout
      analyticsRef.current.trackTrivia({
        questionId: event.questionId,
        category,
        correct: false,
        timedOut: true,
        distanceAtQuestion: playerZ,
      })
      
      setWrongCount((prev) => prev + 1)
      setStreak(0)
      callbacksRef.current.onTimeout?.()
    })

    return () => {
      unsubScore()
      unsubTimeout()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      subsystem.dispose()
      subsystemRef.current = null
      initializedRef.current = false
    }
  }, [engine, enabled, category])

  // Start the billboard system
  const start = useCallback(() => {
    if (!subsystemRef.current) {
      return
    }

    // Cancel any existing loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    subsystemRef.current.start()
    setIsActive(true)

    // Start update loop
    let lastTime = performance.now()
    const updateLoop = () => {
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      if (subsystemRef.current && engineRef.current) {
        const playerZ = engineRef.current.getPlayerZ()
        subsystemRef.current.update(delta, playerZ)

        // Update stats less frequently (every ~30 frames)
        if (Math.random() < 0.03) {
          setStats(subsystemRef.current.getStats())
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateLoop)
    }
    animationFrameRef.current = requestAnimationFrame(updateLoop)
  }, [])

  // Stop the billboard system
  const stop = useCallback(() => {
    if (!subsystemRef.current) return

    subsystemRef.current.stop()
    setIsActive(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Change category
  const setCategoryFn = useCallback((newCategory: TriviaCategory) => {
    subsystemRef.current?.setCategory(newCategory)
  }, [])

  // Answer question (for mobile tap input)
  const answerQuestion = useCallback((answerIndex: number): boolean => {
    if (!subsystemRef.current) return false
    // Convert index to key string (0 -> '1', 1 -> '2', etc.)
    const key = String(answerIndex + 1)
    return subsystemRef.current.handleAnswerInput(key)
  }, [])

  // Check if there's an active question
  const hasActiveQuestion = subsystemRef.current?.hasActiveQuestion() ?? false

  return {
    isActive,
    stats,
    totalScore,
    correctCount,
    wrongCount,
    streak,
    hasActiveQuestion,
    start,
    stop,
    setCategory: setCategoryFn,
    answerQuestion,
  }
}

export default useTriviaBillboards
