/**
 * TriviaPanel - Always-on trivia panel for mobile runner
 * 
 * Layout (portrait mobile):
 * ┌─────────────────────────┐
 * │      Game Canvas        │ ← Resizes to fit above panel
 * │                         │
 * ├─────────────────────────┤
 * │ [Timer] Question        │ ← Compact question row
 * ├───────────┬─────────────┤
 * │  A │  B   │  C  │  D    │ ← Compact answer buttons
 * └───────────┴─────────────┘
 * 
 * Features:
 * - Always visible during gameplay (not an overlay)
 * - 30 second timer per question
 * - New question immediately after answering
 * - Compact auto-sizing answer buttons
 * - Risk/reward: answer for points or focus on running
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
  /** Whether trivia is active (game is running) */
  isActive: boolean
  /** Function to get next question */
  getNextQuestion: () => TriviaQuestion | null
  /** Time limit in seconds */
  timeLimit?: number
  /** Called when player selects an answer */
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void
  /** Called when time runs out */
  onTimeout: (questionId: string) => void
}

// Legacy props for backward compatibility
export interface TriviaOverlayLegacyProps {
  isOpen: boolean
  question: TriviaQuestion | null
  timeLimit?: number
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void
  onTimeout: (questionId: string) => void
  onComplete: () => void
}

type TimerId = ReturnType<typeof setTimeout>

// Panel height constant - export for parent layout
// 120px is compact enough to not cut off character while still being usable
export const TRIVIA_PANEL_HEIGHT = 120

// ============================================
// Compact Answer Button
// ============================================

interface AnswerButtonProps {
  answer: string
  index: number
  isSelected: boolean
  isCorrect: boolean | null
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
  
  let bgColor = 'bg-zinc-700'
  let borderColor = 'border-zinc-600'
  let textColor = 'text-white'
  
  if (isCorrect === true) {
    bgColor = 'bg-emerald-600'
    borderColor = 'border-emerald-400'
  } else if (isCorrect === false && isSelected) {
    bgColor = 'bg-red-600'
    borderColor = 'border-red-400'
  } else if (isSelected) {
    bgColor = 'bg-orange-500'
    borderColor = 'border-orange-400'
  }
  
  return (
    <button
      onClick={() => !isDisabled && onSelect(index)}
      disabled={isDisabled}
      className={`
        ${bgColor} ${borderColor} ${textColor}
        border rounded-md
        px-2 py-1
        text-xs font-semibold
        transition-all duration-100
        active:scale-95
        disabled:opacity-60
        touch-manipulation
        flex items-center gap-1
        min-w-0
        h-[30px]
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="text-[10px] text-orange-400 font-bold shrink-0">{labels[index]}</span>
      <span className="truncate text-left flex-1">{answer}</span>
      {isCorrect === true && <span className="shrink-0 text-emerald-300">✓</span>}
      {isCorrect === false && isSelected && <span className="shrink-0 text-red-300">✗</span>}
    </button>
  )
})
AnswerButton.displayName = 'AnswerButton'

// ============================================
// Timer Display
// ============================================

const TimerDisplay = memo(({ seconds, isUrgent }: { seconds: number; isUrgent: boolean }) => (
  <div className={`
    text-sm font-bold tabular-nums
    ${isUrgent ? 'text-red-400 animate-pulse' : 'text-orange-400'}
  `}>
    {Math.ceil(seconds)}s
  </div>
))
TimerDisplay.displayName = 'TimerDisplay'

// ============================================
// Main Trivia Panel Component (Always-On)
// ============================================

export const TriviaPanel: React.FC<TriviaOverlayProps> = memo(({
  isActive,
  getNextQuestion,
  timeLimit = 30,
  onAnswer,
  onTimeout,
}) => {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  
  const timerRef = useRef<TimerId | null>(null)
  const feedbackTimeoutRef = useRef<TimerId | null>(null)
  
  // Load first question when becoming active
  useEffect(() => {
    if (isActive && !question) {
      const q = getNextQuestion()
      if (q) {
        setQuestion(q)
        setTimeRemaining(timeLimit)
        setSelectedIndex(null)
        setIsRevealed(false)
      }
    }
  }, [isActive, question, getNextQuestion, timeLimit])
  
  // Load next question after feedback
  const loadNextQuestion = useCallback(() => {
    const q = getNextQuestion()
    if (q) {
      setQuestion(q)
      setTimeRemaining(timeLimit)
      setSelectedIndex(null)
      setIsRevealed(false)
    }
  }, [getNextQuestion, timeLimit])
  
  // Timer countdown
  useEffect(() => {
    if (!isActive || !question || isRevealed) return
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current!)
          // Handle timeout
          setIsRevealed(true)
          onTimeout(question.id)
          // Load next question after brief feedback
          feedbackTimeoutRef.current = setTimeout(loadNextQuestion, 800)
          return 0
        }
        return prev - 0.1
      })
    }, 100)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, question?.id, isRevealed, onTimeout, loadNextQuestion])
  
  // Handle answer selection
  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null || isRevealed || !question) return
    
    setSelectedIndex(index)
    setIsRevealed(true)
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    const isCorrect = index === question.correctIndex
    onAnswer(question.id, index, isCorrect)
    
    // Load next question after brief feedback
    feedbackTimeoutRef.current = setTimeout(loadNextQuestion, 600)
  }, [selectedIndex, isRevealed, question, onAnswer, loadNextQuestion])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])
  
  // Reset when becoming inactive
  useEffect(() => {
    if (!isActive) {
      setQuestion(null)
      setSelectedIndex(null)
      setIsRevealed(false)
      if (timerRef.current) clearInterval(timerRef.current)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [isActive])
  
  if (!isActive || !question) return null
  
  const isUrgent = timeRemaining <= 5
  
  return (
    <div 
      className="bg-zinc-900 border-t-2 border-orange-500/50 px-2 py-1.5"
      style={{ height: TRIVIA_PANEL_HEIGHT }}
    >
      {/* Question row with timer */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`
          px-1.5 py-0.5 rounded font-bold text-xs tabular-nums shrink-0
          ${isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}
        `}>
          {Math.ceil(timeRemaining)}s
        </div>
        <p className="text-white text-xs font-medium leading-tight line-clamp-2 flex-1">
          {question.question}
        </p>
      </div>
      
      {/* 2x2 Answer grid - compact */}
      <div className="grid grid-cols-2 gap-1.5">
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
    </div>
  )
})
TriviaPanel.displayName = 'TriviaPanel'

// ============================================
// Legacy TriviaOverlay (for backward compatibility)
// ============================================

export const TriviaOverlay: React.FC<TriviaOverlayLegacyProps> = memo(({
  isOpen,
  question,
  timeLimit = 10,
  onAnswer,
  onTimeout,
  onComplete,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  
  const timerRef = useRef<TimerId | null>(null)
  const feedbackTimeoutRef = useRef<TimerId | null>(null)
  
  useEffect(() => {
    if (question && isOpen) {
      setSelectedIndex(null)
      setIsRevealed(false)
      setTimeRemaining(timeLimit)
    }
  }, [question?.id, isOpen, timeLimit])
  
  useEffect(() => {
    if (!isOpen || !question || isRevealed) return
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current!)
          setIsRevealed(true)
          onTimeout(question.id)
          feedbackTimeoutRef.current = setTimeout(onComplete, 1000)
          return 0
        }
        return prev - 0.1
      })
    }, 100)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, question?.id, isRevealed, onTimeout, onComplete])
  
  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null || isRevealed || !question) return
    
    setSelectedIndex(index)
    setIsRevealed(true)
    if (timerRef.current) clearInterval(timerRef.current)
    
    const isCorrect = index === question.correctIndex
    onAnswer(question.id, index, isCorrect)
    feedbackTimeoutRef.current = setTimeout(onComplete, 600)
  }, [selectedIndex, isRevealed, question, onAnswer, onComplete])
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])
  
  if (!isOpen || !question) return null
  
  const isUrgent = timeRemaining <= 5
  
  return (
    <div 
      className="bg-zinc-900/95 border-t border-zinc-700/50 px-2 py-2"
      style={{ height: TRIVIA_PANEL_HEIGHT }}
    >
      <div className="flex items-start gap-2 mb-2">
        <TimerDisplay seconds={timeRemaining} isUrgent={isUrgent} />
        <p className="text-white text-xs font-medium leading-tight line-clamp-2 flex-1">
          {question.question}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-1.5">
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
    </div>
  )
})
TriviaOverlay.displayName = 'TriviaOverlay'

export default TriviaOverlay
