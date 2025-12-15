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
export const TRIVIA_PANEL_HEIGHT = 124

// ============================================
// Answer Button - Clean, professional styling
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
  
  // State-based styling
  let containerStyle = 'bg-zinc-800/90 border-zinc-600/50'
  let labelStyle = 'bg-zinc-700 text-zinc-300'
  let textStyle = 'text-zinc-100'
  
  if (isCorrect === true) {
    containerStyle = 'bg-emerald-600/90 border-emerald-400/60'
    labelStyle = 'bg-emerald-500 text-white'
    textStyle = 'text-white'
  } else if (isCorrect === false && isSelected) {
    containerStyle = 'bg-red-600/90 border-red-400/60'
    labelStyle = 'bg-red-500 text-white'
    textStyle = 'text-white'
  } else if (isSelected) {
    containerStyle = 'bg-orange-600/90 border-orange-400/60'
    labelStyle = 'bg-orange-500 text-white'
    textStyle = 'text-white'
  }
  
  return (
    <button
      onClick={() => !isDisabled && onSelect(index)}
      disabled={isDisabled}
      className={`
        ${containerStyle}
        border rounded-lg
        px-2 py-1.5
        transition-colors duration-75
        active:scale-[0.98]
        disabled:opacity-50
        touch-manipulation
        flex items-center gap-2
        min-w-0
        h-[32px]
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Letter badge */}
      <span className={`
        ${labelStyle}
        w-5 h-5 rounded
        flex items-center justify-center
        text-[11px] font-bold
        shrink-0
      `}>
        {labels[index]}
      </span>
      
      {/* Answer text */}
      <span className={`
        ${textStyle}
        text-[13px] font-medium tracking-tight
        truncate text-left flex-1
      `}>
        {answer}
      </span>
      
      {/* Result indicator */}
      {isCorrect === true && (
        <span className="shrink-0 text-emerald-200 text-sm font-bold">✓</span>
      )}
      {isCorrect === false && isSelected && (
        <span className="shrink-0 text-red-200 text-sm font-bold">✗</span>
      )}
    </button>
  )
})
AnswerButton.displayName = 'AnswerButton'

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
  const timerPercent = (timeRemaining / timeLimit) * 100
  
  return (
    <div 
      className="bg-gradient-to-t from-zinc-900 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 px-3 py-2"
      style={{ height: TRIVIA_PANEL_HEIGHT }}
    >
      {/* Question row with timer */}
      <div className="flex items-start gap-3 mb-2">
        {/* Timer with progress ring */}
        <div className="relative shrink-0">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isUrgent ? 'bg-red-500/20' : 'bg-orange-500/20'}
          `}>
            {/* Progress ring (CSS-only, no animation overhead) */}
            <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="17"
                fill="none"
                stroke={isUrgent ? '#ef4444' : '#f97316'}
                strokeWidth="3"
                strokeDasharray={`${timerPercent * 1.07} 107`}
                strokeLinecap="round"
                className="opacity-80"
              />
            </svg>
            <span className={`
              text-sm font-bold tabular-nums relative z-10
              ${isUrgent ? 'text-red-400' : 'text-orange-400'}
            `}>
              {Math.ceil(timeRemaining)}
            </span>
          </div>
        </div>
        
        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-semibold leading-snug line-clamp-2 tracking-tight">
            {question.question}
          </p>
          {question.category && (
            <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
              {question.category}
            </span>
          )}
        </div>
      </div>
      
      {/* 2x2 Answer grid */}
      <div className="grid grid-cols-2 gap-2">
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
  const timerPercent = (timeRemaining / timeLimit) * 100
  
  return (
    <div 
      className="bg-gradient-to-t from-zinc-900 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 px-3 py-2"
      style={{ height: TRIVIA_PANEL_HEIGHT }}
    >
      {/* Question row with timer */}
      <div className="flex items-start gap-3 mb-2">
        {/* Timer with progress ring */}
        <div className="relative shrink-0">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isUrgent ? 'bg-red-500/20' : 'bg-orange-500/20'}
          `}>
            <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="17"
                fill="none"
                stroke={isUrgent ? '#ef4444' : '#f97316'}
                strokeWidth="3"
                strokeDasharray={`${timerPercent * 1.07} 107`}
                strokeLinecap="round"
                className="opacity-80"
              />
            </svg>
            <span className={`
              text-sm font-bold tabular-nums relative z-10
              ${isUrgent ? 'text-red-400' : 'text-orange-400'}
            `}>
              {Math.ceil(timeRemaining)}
            </span>
          </div>
        </div>
        
        {/* Question text */}
        <p className="text-white text-[14px] font-semibold leading-snug line-clamp-2 tracking-tight flex-1">
          {question.question}
        </p>
      </div>
      
      {/* 2x2 Answer grid */}
      <div className="grid grid-cols-2 gap-2">
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
