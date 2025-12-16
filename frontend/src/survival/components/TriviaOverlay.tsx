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
 * - Polished UI with subtle animations and cyan accent
 */

import React, { useState, useEffect, useCallback, memo, useRef } from 'react'

// Brand colors from BRAND_SYSTEM.md
const ACCENT_COLOR = '#6366f1' // indigo-500 (action primary)
const ACCENT_GLOW = 'rgba(99, 102, 241, 0.3)' // indigo glow

// Inject keyframes for animations (only once)
if (typeof document !== 'undefined' && !document.getElementById('trivia-animations')) {
  const style = document.createElement('style')
  style.id = 'trivia-animations'
  style.textContent = `
    @keyframes triviaSlideUp {
      from { transform: translateY(20px); opacity: 0.8; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes triviaPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .animate-slideUp { animation: triviaSlideUp 0.2s ease-out; }
    .animate-triviaPulse { animation: triviaPulse 0.5s ease-in-out infinite; }
  `
  document.head.appendChild(style)
}

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
// 150px content + safe area padding for iOS home indicator
// Game engine sizes canvas to: calc(100vh - TRIVIA_PANEL_HEIGHT - env(safe-area-inset-bottom))
export const TRIVIA_PANEL_HEIGHT = 150

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
  
  // Dynamic font size based on answer length
  const getFontSize = (text: string) => {
    if (text.length > 35) return 'text-[9px]'
    if (text.length > 25) return 'text-[10px]'
    return 'text-[11px]'
  }
  
  // State-based styling - using brand indigo accent
  let containerStyle = 'bg-zinc-800/90 border-zinc-600/50 hover:border-indigo-500/40'
  let labelStyle = 'bg-zinc-700 text-zinc-300'
  let textStyle = 'text-zinc-100'
  
  if (isCorrect === true) {
    containerStyle = 'bg-emerald-600/90 border-emerald-400/60'
    labelStyle = 'bg-emerald-500 text-white'
    textStyle = 'text-white'
  } else if (isCorrect === false && isSelected) {
    containerStyle = 'bg-rose-600/90 border-rose-400/60'
    labelStyle = 'bg-rose-500 text-white'
    textStyle = 'text-white'
  } else if (isSelected) {
    containerStyle = 'bg-indigo-600/90 border-indigo-400/60'
    labelStyle = 'bg-indigo-500 text-white'
    textStyle = 'text-white'
  }
  
  // Use onPointerDown for immediate touch response on mobile
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isDisabled) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(index)
  }, [isDisabled, onSelect, index])
  
  return (
    <button
      onPointerDown={handlePointerDown}
      disabled={isDisabled}
      className={`
        ${containerStyle}
        border rounded-lg
        px-2 py-1
        transition-colors duration-75
        active:scale-[0.98]
        disabled:opacity-50
        touch-manipulation
        select-none
        flex items-center gap-1.5
        min-w-0
        h-[36px]
        overflow-hidden
      `}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
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
      
      {/* Answer text - auto-scales based on length */}
      <span 
        className={`
          ${textStyle}
          ${getFontSize(answer)}
          font-medium tracking-tight
          truncate text-left flex-1
          leading-tight
        `}
        title={answer}
      >
        {answer}
      </span>
      
      {/* Result indicator */}
      {isCorrect === true && (
        <span className="shrink-0 text-emerald-200 text-xs font-bold">✓</span>
      )}
      {isCorrect === false && isSelected && (
        <span className="shrink-0 text-red-200 text-xs font-bold">✗</span>
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
      className="bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-zinc-800/90 border-t border-indigo-500/20 px-3 pt-2 animate-slideUp"
      style={{ 
        minHeight: TRIVIA_PANEL_HEIGHT, 
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        touchAction: 'manipulation',
        boxShadow: `0 -4px 20px ${ACCENT_GLOW}`,
      }}
    >
      {/* Question row with timer */}
      <div className="flex items-center gap-2 mb-1.5">
        {/* Timer with icon - brand indigo accent */}
        <div className="relative shrink-0">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isUrgent ? 'bg-red-500/20' : 'bg-indigo-500/20'}
            transition-colors duration-200
          `}>
            <svg className="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              {/* Background track */}
              <circle
                cx="16" cy="16" r="13"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              {/* Progress arc */}
              <circle
                cx="16" cy="16" r="13"
                fill="none"
                stroke={isUrgent ? '#ef4444' : ACCENT_COLOR}
                strokeWidth="2"
                strokeDasharray={`${timerPercent * 0.82} 82`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
            <span className={`
              text-[11px] font-bold tabular-nums relative z-10
              ${isUrgent ? 'text-red-400 animate-pulse' : 'text-indigo-400'}
            `}>
              {Math.ceil(timeRemaining)}
            </span>
          </div>
        </div>
        
        {/* Question icon */}
        <span className="text-indigo-400 text-sm shrink-0">❓</span>
        
        {/* Question text - single line */}
        <p className="text-white text-[12px] font-semibold leading-tight line-clamp-1 tracking-tight flex-1 min-w-0">
          {question.question}
        </p>
      </div>
      
      {/* 2x2 Answer grid - tight */}
      <div className="grid grid-cols-2 gap-1" style={{ touchAction: 'manipulation' }}>
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
      className="bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-zinc-800/90 border-t border-indigo-500/20 px-3 py-1.5 animate-slideUp"
      style={{ 
        height: TRIVIA_PANEL_HEIGHT, 
        touchAction: 'manipulation',
        boxShadow: `0 -4px 20px ${ACCENT_GLOW}`,
      }}
    >
      {/* Question row with timer - compact */}
      <div className="flex items-center gap-2 mb-1.5">
        {/* Timer with progress ring - brand indigo accent */}
        <div className="relative shrink-0">
          <div className={`
            w-9 h-9 rounded-full flex items-center justify-center
            ${isUrgent ? 'bg-red-500/20' : 'bg-indigo-500/20'}
            transition-colors duration-200
          `}>
            <svg className="absolute inset-0 w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              {/* Background track */}
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2.5"
              />
              {/* Progress arc */}
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={isUrgent ? '#ef4444' : ACCENT_COLOR}
                strokeWidth="2.5"
                strokeDasharray={`${timerPercent * 0.94} 94`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
            <span className={`
              text-xs font-bold tabular-nums relative z-10
              ${isUrgent ? 'text-red-400 animate-triviaPulse' : 'text-indigo-400'}
            `}>
              {Math.ceil(timeRemaining)}
            </span>
          </div>
        </div>
        
        {/* Question icon */}
        <span className="text-indigo-400 text-sm shrink-0">❓</span>
        
        {/* Question text - single line to save space */}
        <p className="text-white text-[13px] font-semibold leading-tight line-clamp-1 tracking-tight flex-1 min-w-0">
          {question.question}
        </p>
      </div>
      
      {/* 2x2 Answer grid */}
      <div className="grid grid-cols-2 gap-1.5" style={{ touchAction: 'manipulation' }}>
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
