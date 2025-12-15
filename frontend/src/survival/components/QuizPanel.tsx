/**
 * QuizPanel - Compact top-center quiz overlay for Survival Mode
 * 
 * Design: Minimal, non-intrusive horizontal bar at top of screen
 * - 30 second timer per question
 * - Lose a life on timeout
 * - Score rewards fast correct answers (max 1000pts, min 200pts for correct)
 * - Auto-advances to next question
 * - Slides down from top when question appears
 */

import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react'
import type { QuizQuestion } from '@/types/quiz'

// ============================================
// Types
// ============================================

export interface QuizPanelProps {
  question: QuizQuestion | null
  questionNumber: number
  totalAnswered: number
  correctCount: number
  onAnswer: (answerIndex: number, isCorrect: boolean, timeRemaining: number, points: number) => void
  onTimeout: () => void
  isActive: boolean // false during countdown, game over, etc.
  onSound?: (event: 'quiz-popup' | 'quiz-correct' | 'quiz-wrong') => void
  /** Compact mode - horizontal bar at top (default: true) */
  compact?: boolean
}

// ============================================
// Constants
// ============================================

const TIME_LIMIT = 30 // seconds
const MAX_POINTS = 1000
const MIN_POINTS = 200 // Still get points for correct but slow
const FAST_BONUS_THRESHOLD = 20 // seconds remaining for max bonus

// ============================================
// Score calculation
// ============================================

function calculatePoints(timeRemaining: number, isCorrect: boolean): number {
  if (!isCorrect) return 0
  
  // Linear interpolation: 30s = 1000pts, 0s = 200pts
  // But reward fast answers more: >20s remaining = max points
  if (timeRemaining >= FAST_BONUS_THRESHOLD) {
    return MAX_POINTS
  }
  
  // Scale from MIN to MAX based on time
  const timeRatio = timeRemaining / FAST_BONUS_THRESHOLD
  return Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * timeRatio)
}

// ============================================
// Sub-components
// ============================================

/**
 * Compact circular timer - smaller for horizontal layout
 */
const CompactTimer = memo(({ timeRemaining, totalTime, size = 'normal' }: { timeRemaining: number; totalTime: number; size?: 'small' | 'normal' }) => {
  const progress = timeRemaining / totalTime
  const radius = size === 'small' ? 12 : 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const containerSize = size === 'small' ? 'w-8 h-8' : 'w-12 h-12'
  const viewBox = size === 'small' ? '0 0 28 28' : '0 0 40 40'
  const center = size === 'small' ? 14 : 20
  const strokeWidth = size === 'small' ? 2.5 : 3

  // Color progression
  let color: string
  if (progress > 0.6) color = '#22c55e'
  else if (progress > 0.3) color = '#eab308'
  else if (progress > 0.15) color = '#f97316'
  else color = '#ef4444'

  const isPulsing = timeRemaining <= 5

  return (
    <div className={`relative ${containerSize} flex-shrink-0 ${isPulsing ? 'animate-pulse' : ''}`}>
      <svg className="w-full h-full -rotate-90" viewBox={viewBox}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.1s linear', filter: `drop-shadow(0 0 3px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${size === 'small' ? 'text-xs' : 'text-sm'} font-bold tabular-nums`} style={{ color }}>
          {Math.ceil(timeRemaining)}
        </span>
      </div>
    </div>
  )
})
CompactTimer.displayName = 'CompactTimer'

/**
 * Answer button - supports both compact (horizontal) and normal (vertical) layouts
 */
const AnswerButton = memo(({
  text, letter, isSelected, isCorrect, isRevealed, onClick, disabled, compact = false
}: {
  text: string
  letter: string
  isSelected: boolean
  isCorrect: boolean | null
  isRevealed: boolean
  onClick: () => void
  disabled: boolean
  compact?: boolean
}) => {
  let bgColor = 'rgba(255,255,255,0.05)'
  let borderColor = 'rgba(255,255,255,0.15)'
  let textColor = '#e5e5e5'

  if (isRevealed) {
    if (isCorrect) {
      bgColor = 'rgba(34, 197, 94, 0.25)'
      borderColor = '#22c55e'
      textColor = '#22c55e'
    } else if (isSelected) {
      bgColor = 'rgba(239, 68, 68, 0.25)'
      borderColor = '#ef4444'
      textColor = '#ef4444'
    } else {
      textColor = 'rgba(255,255,255,0.3)'
    }
  } else if (isSelected) {
    bgColor = 'rgba(34, 211, 238, 0.2)'
    borderColor = '#22d3ee'
    textColor = '#22d3ee'
  }

  if (compact) {
    // Compact horizontal button
    return (
      <button
        onClick={onClick}
        disabled={disabled || isRevealed}
        className="flex-1 min-w-0 transition-all duration-150 rounded-md px-2 py-1.5 border text-xs"
        style={{ backgroundColor: bgColor, borderColor, color: textColor, cursor: disabled ? 'default' : 'pointer' }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
            style={{
              backgroundColor: isSelected || (isRevealed && isCorrect) ? borderColor : 'rgba(255,255,255,0.1)',
              color: isSelected || (isRevealed && isCorrect) ? '#000' : textColor,
            }}
          >
            {letter}
          </span>
          <span className="font-medium leading-tight truncate">{text}</span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRevealed}
      className="w-full text-left transition-all duration-150 rounded-lg p-2.5 border text-sm"
      style={{ backgroundColor: bgColor, borderColor, color: textColor, cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{
            backgroundColor: isSelected || (isRevealed && isCorrect) ? borderColor : 'rgba(255,255,255,0.1)',
            color: isSelected || (isRevealed && isCorrect) ? '#000' : textColor,
          }}
        >
          {letter}
        </span>
        <span className="font-medium leading-tight line-clamp-2">{text}</span>
      </div>
    </button>
  )
})
AnswerButton.displayName = 'AnswerButton'

/**
 * Stats bar showing progress
 */
const StatsBar = memo(({ questionNumber, correctCount, totalAnswered }: {
  questionNumber: number
  correctCount: number
  totalAnswered: number
}) => {
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
  
  return (
    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
      <span>Q{questionNumber}</span>
      <span className="flex items-center gap-2">
        <span className="text-green-400">{correctCount}✓</span>
        <span className="text-gray-500">|</span>
        <span>{accuracy}%</span>
      </span>
    </div>
  )
})
StatsBar.displayName = 'StatsBar'

// ============================================
// Main Component
// ============================================

export const QuizPanel: React.FC<QuizPanelProps> = memo(({
  question,
  questionNumber,
  totalAnswered,
  correctCount,
  onAnswer,
  onTimeout,
  isActive,
  onSound,
  compact = true,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT)
  const [showResult, setShowResult] = useState<{ correct: boolean; points: number } | null>(null)
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const lastSecondRef = useRef<number>(TIME_LIMIT) // Track last second to reduce re-renders
  const timeRemainingRef = useRef<number>(TIME_LIMIT) // Keep accurate time without re-renders
  const letters = useMemo(() => ['A', 'B', 'C', 'D'], [])
  const prevQuestionIdRef = useRef<string | null>(null)

  // Reset state when question changes and play popup sound
  useEffect(() => {
    setSelectedAnswer(null)
    setIsRevealed(false)
    setTimeRemaining(TIME_LIMIT)
    setShowResult(null)
    startTimeRef.current = Date.now()
    
    // Play popup sound when new question appears (not on initial mount)
    if (question?.id && prevQuestionIdRef.current !== null && prevQuestionIdRef.current !== question.id) {
      onSound?.('quiz-popup')
    }
    prevQuestionIdRef.current = question?.id ?? null
  }, [question?.id, onSound])

  // Timer logic - optimized to only re-render when second changes
  useEffect(() => {
    if (!isActive || !question || isRevealed) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    startTimeRef.current = Date.now()
    lastSecondRef.current = TIME_LIMIT
    timeRemainingRef.current = TIME_LIMIT
    
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, TIME_LIMIT - elapsed)
      timeRemainingRef.current = remaining // Always track accurate time
      
      const currentSecond = Math.ceil(remaining)
      
      // Only trigger React re-render when the displayed second changes
      if (currentSecond !== lastSecondRef.current) {
        lastSecondRef.current = currentSecond
        setTimeRemaining(remaining)
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleTimeout()
      }
    }, 100)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, question?.id, isRevealed])

  const handleTimeout = useCallback(() => {
    if (isRevealed) return
    setIsRevealed(true)
    setShowResult({ correct: false, points: 0 })
    onSound?.('quiz-wrong') // Play wrong sound on timeout
    
    setTimeout(() => {
      onTimeout()
    }, 1500)
  }, [isRevealed, onTimeout, onSound])

  const handleAnswer = useCallback((index: number) => {
    if (isRevealed || selectedAnswer !== null || !question) return

    setSelectedAnswer(index)
    if (timerRef.current) clearInterval(timerRef.current)

    // Use ref for accurate time (not stale state)
    const accurateTimeRemaining = timeRemainingRef.current
    const isCorrect = index === question.correctAnswer
    const points = calculatePoints(accurateTimeRemaining, isCorrect)

    setTimeout(() => {
      setIsRevealed(true)
      setShowResult({ correct: isCorrect, points })
      // Play correct/wrong sound
      onSound?.(isCorrect ? 'quiz-correct' : 'quiz-wrong')

      setTimeout(() => {
        onAnswer(index, isCorrect, accurateTimeRemaining, points)
      }, 1200)
    }, 300)
  }, [isRevealed, selectedAnswer, question, onAnswer])

  // Keyboard navigation - ONLY number keys to avoid conflict with game controls (WASD)
  useEffect(() => {
    if (!isActive || isRevealed || !question) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only use number keys 1-4 to avoid conflict with game movement (A/D for lanes)
      const keyMap: Record<string, number> = {
        '1': 0, '2': 1, '3': 2, '4': 3,
      }
      if (e.key in keyMap && keyMap[e.key] < question.options.length) {
        e.preventDefault()
        e.stopPropagation()
        handleAnswer(keyMap[e.key])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isRevealed, question, handleAnswer])

  if (!question) {
    return compact ? (
      <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 px-4 py-2">
        <div className="text-center text-gray-500 text-xs">Loading question...</div>
      </div>
    ) : (
      <div className="w-72 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4">
        <div className="text-center text-gray-500 text-sm">Loading question...</div>
      </div>
    )
  }

  // Compact horizontal layout for top-center positioning
  if (compact) {
    return (
      <div 
        className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden transition-all duration-300"
        style={{ maxWidth: '600px' }}
      >
        {/* Single row: Timer | Question | Answers | Stats */}
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Timer */}
          <CompactTimer timeRemaining={timeRemaining} totalTime={TIME_LIMIT} size="small" />
          
          {/* Question text - truncated */}
          <div className="flex-shrink-0 max-w-[180px]">
            <p className="text-xs font-medium text-white/90 leading-tight line-clamp-2">
              {question.question}
            </p>
          </div>
          
          {/* Answers - horizontal row */}
          <div className="flex gap-1.5 flex-1 min-w-0">
            {question.options.map((option, idx) => (
              <AnswerButton
                key={idx}
                text={option}
                letter={letters[idx]}
                isSelected={selectedAnswer === idx}
                isCorrect={isRevealed ? idx === question.correctAnswer : null}
                isRevealed={isRevealed}
                onClick={() => handleAnswer(idx)}
                disabled={!isActive}
                compact={true}
              />
            ))}
          </div>
          
          {/* Stats & Result */}
          <div className="flex-shrink-0 text-right">
            {showResult ? (
              <div 
                className={`px-2 py-1 rounded text-xs font-bold ${
                  showResult.correct 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {showResult.correct ? `+${showResult.points}` : '-1 ❤️'}
              </div>
            ) : (
              <div className="text-[10px] text-gray-500">
                <span className="text-green-400">{correctCount}✓</span>
                <span className="mx-1">|</span>
                <span>Q{questionNumber}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Keyboard hint - subtle */}
        {!isRevealed && isActive && (
          <div className="text-center text-[10px] text-gray-600 pb-1">
            Press <span className="text-cyan-400/70">1-4</span>
          </div>
        )}
      </div>
    )
  }

  // Original vertical layout (fallback)
  return (
    <div className="w-72 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header with timer */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-white/5">
        <CompactTimer timeRemaining={timeRemaining} totalTime={TIME_LIMIT} />
        <div className="flex-1 min-w-0">
          <StatsBar questionNumber={questionNumber} correctCount={correctCount} totalAnswered={totalAnswered} />
        </div>
      </div>

      {/* Question */}
      <div className="p-3">
        <p className="text-sm font-medium text-white leading-snug mb-3 line-clamp-3">
          {question.question}
        </p>

        {/* Answers */}
        <div className="space-y-2">
          {question.options.map((option, idx) => (
            <AnswerButton
              key={idx}
              text={option}
              letter={letters[idx]}
              isSelected={selectedAnswer === idx}
              isCorrect={isRevealed ? idx === question.correctAnswer : null}
              isRevealed={isRevealed}
              onClick={() => handleAnswer(idx)}
              disabled={!isActive}
            />
          ))}
        </div>

        {/* Keyboard hint */}
        {!isRevealed && isActive && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Press <span className="text-cyan-400">1-4</span> to answer
          </div>
        )}

        {/* Result feedback */}
        {showResult && (
          <div 
            className={`mt-3 p-2 rounded-lg text-center text-sm font-bold ${
              showResult.correct 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {showResult.correct ? (
              <span>✓ +{showResult.points} pts</span>
            ) : (
              <span>✗ -1 Life</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
QuizPanel.displayName = 'QuizPanel'

export default QuizPanel
