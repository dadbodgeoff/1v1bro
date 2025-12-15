/**
 * TriviaModal - AAA-quality trivia modal for Knowledge Gates
 *
 * Features:
 * - Typewriter effect for question text
 * - Spring-animated answer buttons
 * - Circular countdown timer with color progression
 * - Correct/wrong feedback with particles
 * - Keyboard navigation (1-4 or A-D)
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import type { QuizQuestion } from '@/types/quiz'
import { glowShadow } from './HUDAnimations'

// ============================================
// Types
// ============================================

export interface TriviaModalProps {
  question: QuizQuestion
  timeLimit?: number // seconds, default 15
  onAnswer: (answerIndex: number, isCorrect: boolean, timeRemaining: number) => void
  onTimeout: () => void
  multiplier?: number // current combo multiplier for bonus display
}

interface AnswerButtonProps {
  text: string
  letter: string
  isSelected: boolean
  isCorrect: boolean | null // null = not revealed yet
  isRevealed: boolean
  onClick: () => void
  delay: number
}

// ============================================
// Sub-components
// ============================================

/**
 * Typewriter effect for question text
 */
const TypewriterText = memo(
  ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    const [displayText, setDisplayText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
      setDisplayText('')
      setIsComplete(false)
      let index = 0
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
          setIsComplete(true)
          onComplete?.()
        }
      }, 30) // 30ms per character

      return () => clearInterval(interval)
    }, [text, onComplete])

    return (
      <span>
        {displayText}
        {!isComplete && <span className="animate-pulse text-cyan-400">|</span>}
      </span>
    )
  }
)
TypewriterText.displayName = 'TypewriterText'

/**
 * Circular countdown timer
 */
const CircularTimer = memo(
  ({ timeRemaining, totalTime }: { timeRemaining: number; totalTime: number }) => {
    const progress = timeRemaining / totalTime
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDashoffset = circumference * (1 - progress)

    // Color progression: green -> yellow -> orange -> red
    let color: string
    if (progress > 0.6) {
      color = '#22c55e' // green
    } else if (progress > 0.4) {
      color = '#eab308' // yellow
    } else if (progress > 0.2) {
      color = '#f97316' // orange
    } else {
      color = '#ef4444' // red
    }

    const isPulsing = timeRemaining <= 5

    return (
      <div className={`relative w-24 h-24 ${isPulsing ? 'animate-pulse' : ''}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-black tabular-nums"
            style={{
              color,
              textShadow: glowShadow(color, 0.5),
            }}
          >
            {Math.ceil(timeRemaining)}
          </span>
        </div>
      </div>
    )
  }
)
CircularTimer.displayName = 'CircularTimer'

/**
 * Answer button with spring animation
 */
const AnswerButton: React.FC<AnswerButtonProps> = memo(
  ({ text, letter, isSelected, isCorrect, isRevealed, onClick, delay }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), delay)
      return () => clearTimeout(timer)
    }, [delay])

    // Determine button state colors
    let bgColor = 'rgba(255,255,255,0.05)'
    let borderColor = 'rgba(255,255,255,0.2)'
    let textColor = '#ffffff'
    let glowColor = ''

    if (isRevealed) {
      if (isCorrect) {
        bgColor = 'rgba(34, 197, 94, 0.2)'
        borderColor = '#22c55e'
        textColor = '#22c55e'
        glowColor = '#22c55e'
      } else if (isSelected && !isCorrect) {
        bgColor = 'rgba(239, 68, 68, 0.2)'
        borderColor = '#ef4444'
        textColor = '#ef4444'
        glowColor = '#ef4444'
      } else {
        bgColor = 'rgba(255,255,255,0.02)'
        borderColor = 'rgba(255,255,255,0.1)'
        textColor = 'rgba(255,255,255,0.3)'
      }
    } else if (isSelected) {
      bgColor = 'rgba(34, 211, 238, 0.2)'
      borderColor = '#22d3ee'
      textColor = '#22d3ee'
      glowColor = '#22d3ee'
    } else if (isHovered) {
      bgColor = 'rgba(255,255,255,0.1)'
      borderColor = 'rgba(255,255,255,0.4)'
    }

    return (
      <button
        onClick={onClick}
        disabled={isRevealed}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full text-left transition-all duration-200 rounded-xl p-4 border-2"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? isSelected
              ? 'scale(1.02)'
              : 'scale(1)'
            : 'translateY(20px) scale(0.95)',
          backgroundColor: bgColor,
          borderColor,
          color: textColor,
          boxShadow: glowColor ? `0 0 20px ${glowColor}40` : 'none',
          cursor: isRevealed ? 'default' : 'pointer',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{
              backgroundColor: isSelected || (isRevealed && isCorrect) ? borderColor : 'rgba(255,255,255,0.1)',
              color: isSelected || (isRevealed && isCorrect) ? '#000' : textColor,
            }}
          >
            {letter}
          </span>
          <span className="font-medium">{text}</span>
        </div>
      </button>
    )
  }
)
AnswerButton.displayName = 'AnswerButton'

/**
 * Result feedback overlay
 */
const ResultFeedback = memo(
  ({
    isCorrect,
    points,
    explanation,
  }: {
    isCorrect: boolean
    points: number
    explanation: string
  }) => {
    const color = isCorrect ? '#22c55e' : '#ef4444'
    const text = isCorrect ? 'CORRECT!' : 'WRONG'

    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl z-10"
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <div
          className="text-5xl font-black mb-4"
          style={{
            color,
            textShadow: glowShadow(color, 1.5),
            animation: isCorrect ? 'bounceIn 0.5s ease-out' : 'shake 0.5s ease-out',
          }}
        >
          {text}
        </div>
        {isCorrect && (
          <div className="text-2xl font-bold text-yellow-400 mb-4">+{points} pts</div>
        )}
        <div className="text-sm text-gray-400 max-w-md text-center px-4">{explanation}</div>
      </div>
    )
  }
)
ResultFeedback.displayName = 'ResultFeedback'

// ============================================
// Main Component
// ============================================

export const TriviaModal: React.FC<TriviaModalProps> = ({
  question,
  timeLimit = 15,
  onAnswer,
  onTimeout,
  multiplier = 1,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [questionReady, setQuestionReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const lastSecondRef = useRef<number>(timeLimit) // Track last second to reduce re-renders
  const timeRemainingRef = useRef<number>(timeLimit) // Keep accurate time without re-renders

  const letters = ['A', 'B', 'C', 'D']

  // Start timer when question is ready - optimized to only re-render when second changes
  useEffect(() => {
    if (!questionReady) return

    startTimeRef.current = Date.now()
    lastSecondRef.current = timeLimit
    timeRemainingRef.current = timeLimit
    
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, timeLimit - elapsed)
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
  }, [questionReady, timeLimit])

  const handleTimeout = useCallback(() => {
    if (isRevealed) return
    setIsRevealed(true)
    setTimeout(() => onTimeout(), 2000)
  }, [isRevealed, onTimeout])

  const handleAnswer = useCallback(
    (index: number) => {
      if (isRevealed || selectedAnswer !== null) return

      setSelectedAnswer(index)
      if (timerRef.current) clearInterval(timerRef.current)

      // Use ref for accurate time (not stale state)
      const accurateTimeRemaining = timeRemainingRef.current

      // Reveal after short delay
      setTimeout(() => {
        setIsRevealed(true)
        const isCorrect = index === question.correctAnswer

        // Callback after showing result
        setTimeout(() => {
          onAnswer(index, isCorrect, accurateTimeRemaining)
        }, 2000)
      }, 500)
    },
    [isRevealed, selectedAnswer, question.correctAnswer, onAnswer]
  )

  // Keyboard navigation - ONLY number keys to avoid conflict with game controls (WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRevealed) return

      // Only use number keys 1-4 to avoid conflict with game movement (A/D for lanes)
      const keyMap: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
      }

      if (e.key in keyMap && keyMap[e.key] < question.options.length) {
        e.preventDefault()
        e.stopPropagation()
        handleAnswer(keyMap[e.key])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleAnswer, isRevealed, question.options.length])

  const isCorrect = selectedAnswer !== null && selectedAnswer === question.correctAnswer
  const points = Math.round(question.points * multiplier * (1 + timeRemaining / timeLimit))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.1) 0%, rgba(0,0,0,0.8) 70%)',
        }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden"
        style={{
          boxShadow: '0 0 60px rgba(34, 211, 238, 0.2), inset 0 0 60px rgba(34, 211, 238, 0.05)',
          animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <div className="text-xs text-cyan-400 font-semibold tracking-wider mb-1">
              KNOWLEDGE GATE
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{
                  backgroundColor:
                    question.difficulty === 'casual'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : question.difficulty === 'moderate'
                        ? 'rgba(234, 179, 8, 0.2)'
                        : question.difficulty === 'expert'
                          ? 'rgba(249, 115, 22, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                  color:
                    question.difficulty === 'casual'
                      ? '#22c55e'
                      : question.difficulty === 'moderate'
                        ? '#eab308'
                        : question.difficulty === 'expert'
                          ? '#f97316'
                          : '#ef4444',
                }}
              >
                {question.difficulty.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">{question.category}</span>
            </div>
          </div>
          <CircularTimer timeRemaining={timeRemaining} totalTime={timeLimit} />
        </div>

        {/* Question */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 min-h-[3rem]">
            <TypewriterText text={question.question} onComplete={() => setQuestionReady(true)} />
          </h2>

          {/* Answers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, idx) => (
              <AnswerButton
                key={idx}
                text={option}
                letter={letters[idx]}
                isSelected={selectedAnswer === idx}
                isCorrect={isRevealed ? idx === question.correctAnswer : null}
                isRevealed={isRevealed}
                onClick={() => handleAnswer(idx)}
                delay={questionReady ? 0 : 800 + idx * 100}
              />
            ))}
          </div>

          {/* Keyboard hint */}
          {!isRevealed && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Press <span className="text-cyan-400">1-4</span> to answer
            </div>
          )}
        </div>

        {/* Multiplier badge */}
        {multiplier > 1 && !isRevealed && (
          <div className="absolute top-4 right-32 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full">
            <span className="text-sm font-bold text-purple-400">×{multiplier.toFixed(1)} COMBO</span>
          </div>
        )}

        {/* Result overlay */}
        {isRevealed && (
          <ResultFeedback
            isCorrect={isCorrect}
            points={isCorrect ? points : 0}
            explanation={question.explanation}
          />
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

export default TriviaModal
