/**
 * TriviaOverlay - Portrait-optimized 2D trivia overlay for mobile runner
 * 
 * Layout (portrait mobile):
 * ┌─────────────────────────┐
 * │      Game Canvas        │
 * │                         │
 * ├─────────────────────────┤ ← 200px reserved area
 * │   Question Text Area    │ ← ~60px
 * ├───────────┬─────────────┤
 * │  Answer A │  Answer B   │ ← 2x2 grid
 * ├───────────┼─────────────┤   ~140px total
 * │  Answer C │  Answer D   │
 * └───────────┴─────────────┘
 * 
 * Features:
 * - Slides up from bottom when trivia triggers
 * - 2x2 touch-friendly answer grid
 * - Timer bar at top of overlay
 * - Correct/incorrect feedback animations
 * - Game continues running in background (slowed)
 */

import React, { useState, useEffect, useCallback, memo, useRef } from 'react'

// ============================================
// Types
// ============================================

export interface TriviaQuestion {
  id: string
  question: string
  answers: string[]
  correctIndex: number
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface TriviaOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean
  /** Current question to display */
  question: TriviaQuestion | null
  /** Time limit in seconds */
  timeLimit?: number
  /** Called when player selects an answer */
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void
  /** Called when time runs out */
  onTimeout: (questionId: string) => void
  /** Called when overlay animation completes (after feedback) */
  onComplete: () => void
}

// Timer type for browser environment
type TimerId = ReturnType<typeof setTimeout>

// ============================================
// Answer Button Component
// ============================================

interface AnswerButtonProps {
  answer: string
  index: number
  isSelected: boolean
  isCorrect: boolean | null // null = not revealed yet
  isDisabled: boolean
  onSelect: (index: number) => void
}

const AnswerButton = memo(({ 
  answer, 
  index, 
  isSelected, 
  isCorrect, 
  isDisabled,
  onSelect 
}: AnswerButtonProps) => {
  const labels = ['A', 'B', 'C', 'D']
  
  // Determine button state and styling
  let bgColor = 'bg-zinc-800/90'
  let borderColor = 'border-zinc-600/50'
  let textColor = 'text-white'
  let labelBg = 'bg-zinc-700'
  
  if (isCorrect === true) {
    // This is the correct answer (revealed)
    bgColor = 'bg-emerald-600/90'
    borderColor = 'border-emerald-400'
    textColor = 'text-white'
    labelBg = 'bg-emerald-500'
  } else if (isCorrect === false && isSelected) {
    // Player selected this wrong answer
    bgColor = 'bg-red-600/90'
    borderColor = 'border-red-400'
    textColor = 'text-white'
    labelBg = 'bg-red-500'
  } else if (isSelected) {
    // Selected but not yet revealed
    bgColor = 'bg-orange-500/90'
    borderColor = 'border-orange-400'
    labelBg = 'bg-orange-400'
  }
  
  return (
    <button
      onClick={() => !isDisabled && onSelect(index)}
      disabled={isDisabled}
      className={`
        relative w-full h-full min-h-[56px]
        ${bgColor} ${textColor}
        border-2 ${borderColor}
        rounded-xl
        flex items-center justify-center
        text-sm font-semibold
        transition-all duration-150
        active:scale-95
        disabled:opacity-70 disabled:cursor-not-allowed
        touch-manipulation
        p-2
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Letter label */}
      <span className={`
        absolute top-1 left-1
        ${labelBg}
        w-5 h-5 rounded-md
        flex items-center justify-center
        text-xs font-bold text-white
      `}>
        {labels[index]}
      </span>
      
      {/* Answer text - centered, with padding for label */}
      <span className="text-center leading-tight px-1 line-clamp-3">
        {answer}
      </span>
      
      {/* Correct/incorrect icon */}
      {isCorrect === true && (
        <span className="absolute top-1 right-1 text-lg">✓</span>
      )}
      {isCorrect === false && isSelected && (
        <span className="absolute top-1 right-1 text-lg">✗</span>
      )}
    </button>
  )
})
AnswerButton.displayName = 'AnswerButton'

// ============================================
// Timer Bar Component
// ============================================

const TimerBar = memo(({ progress, isUrgent }: { progress: number; isUrgent: boolean }) => {
  return (
    <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-100 ${
          isUrgent ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
        }`}
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
})
TimerBar.displayName = 'TimerBar'

// ============================================
// Main Trivia Overlay Component
// ============================================

export const TriviaOverlay: React.FC<TriviaOverlayProps> = memo(({
  isOpen,
  question,
  timeLimit = 10,
  onAnswer,
  onTimeout,
  onComplete,
}) => {
  // State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [isVisible, setIsVisible] = useState(false)
  
  // Refs - using TimerId type for browser compatibility
  const timerRef = useRef<TimerId | null>(null)
  const feedbackTimeoutRef = useRef<TimerId | null>(null)
  
  // Reset state when question changes
  useEffect(() => {
    if (question && isOpen) {
      setSelectedIndex(null)
      setIsRevealed(false)
      setTimeRemaining(timeLimit)
      
      // Slide in animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    }
  }, [question?.id, isOpen, timeLimit])
  
  // Timer countdown
  useEffect(() => {
    if (!isOpen || !question || isRevealed) return
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0.1) {
          // Time's up
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return prev - 0.1
      })
    }, 100)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, question?.id, isRevealed])
  
  // Handle answer selection
  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null || isRevealed || !question) return
    
    setSelectedIndex(index)
    setIsRevealed(true)
    
    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current)
    
    const isCorrect = index === question.correctIndex
    onAnswer(question.id, index, isCorrect)
    
    // Show feedback then close
    feedbackTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 200) // Wait for slide-out animation
    }, 1200)
  }, [selectedIndex, isRevealed, question, onAnswer, onComplete])
  
  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (!question || isRevealed) return
    
    setIsRevealed(true)
    onTimeout(question.id)
    
    // Show correct answer then close
    feedbackTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 200)
    }, 1500)
  }, [question, isRevealed, onTimeout, onComplete])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])
  
  // Don't render if not open or no question
  if (!isOpen || !question) return null
  
  const progress = timeRemaining / timeLimit
  const isUrgent = timeRemaining <= 3
  
  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-50
        transition-transform duration-200 ease-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ height: '200px' }}
    >
      {/* Background with blur */}
      <div className="absolute inset-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700/50" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col p-3 gap-2">
        {/* Timer bar */}
        <TimerBar progress={progress} isUrgent={isUrgent} />
        
        {/* Question text */}
        <div className="flex-shrink-0 px-1">
          <p className="text-white text-sm font-medium leading-tight line-clamp-2 text-center">
            {question.question}
          </p>
        </div>
        
        {/* 2x2 Answer grid */}
        <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
          {question.answers.slice(0, 4).map((answer, index) => (
            <AnswerButton
              key={index}
              answer={answer}
              index={index}
              isSelected={selectedIndex === index}
              isCorrect={
                isRevealed 
                  ? index === question.correctIndex 
                    ? true 
                    : selectedIndex === index 
                      ? false 
                      : null
                  : null
              }
              isDisabled={isRevealed}
              onSelect={handleSelect}
            />
          ))}
        </div>
        
        {/* Timeout indicator */}
        {isRevealed && selectedIndex === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-red-400 text-xl font-bold animate-pulse">
              TIME'S UP!
            </span>
          </div>
        )}
      </div>
    </div>
  )
})
TriviaOverlay.displayName = 'TriviaOverlay'

export default TriviaOverlay
