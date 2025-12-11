/**
 * ArenaQuizPanel - Quiz panel rendered OUTSIDE the canvas as HTML/CSS
 * 
 * Layout modes:
 * - Desktop: Below canvas, horizontal layout
 * - Mobile landscape (fullscreen): Overlay at top of screen, compact
 * - Mobile portrait: Below canvas, 2x2 grid
 * 
 * Responsive, accessible, touch-friendly
 */

import { useEffect, useCallback, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface ArenaQuizPanelProps {
  onAnswer: (answer: string, timeMs: number) => void
  visible: boolean
  /** When true, renders as overlay instead of below canvas */
  overlayMode?: boolean
}

export function ArenaQuizPanel({ onAnswer, visible, overlayMode = false }: ArenaQuizPanelProps) {
  const {
    currentQuestion,
    selectedAnswer,
    answerSubmitted,
    selectAnswer,
    submitAnswer,
  } = useGameStore()

  const [timeRemaining, setTimeRemaining] = useState(30)

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion || answerSubmitted) return

    const updateTimer = () => {
      const elapsed = Date.now() - currentQuestion.startTime
      const remaining = Math.max(0, Math.ceil((30000 - elapsed) / 1000))
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        submitAnswer()
        onAnswer('', 30000)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 100)
    return () => clearInterval(interval)
  }, [currentQuestion, answerSubmitted, submitAnswer, onAnswer])

  const handleSelect = useCallback(
    (answer: string) => {
      if (answerSubmitted || !currentQuestion) return

      selectAnswer(answer)
      submitAnswer()

      const timeMs = Date.now() - currentQuestion.startTime
      onAnswer(answer, timeMs)
    },
    [answerSubmitted, currentQuestion, onAnswer, selectAnswer, submitAnswer]
  )

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    if (answerSubmitted || !visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
      }

      const answer = keyMap[e.key]
      if (answer) handleSelect(answer)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answerSubmitted, visible, handleSelect])

  if (!visible || !currentQuestion) {
    // Return empty placeholder to maintain layout (only in non-overlay mode)
    if (overlayMode) return null
    return (
      <div className="w-full h-[100px] bg-[#0a0a0a] border-t border-white/[0.06]" />
    )
  }

  const options = ['A', 'B', 'C', 'D']
  const timerPercent = (timeRemaining / 30) * 100
  const isUrgent = timeRemaining <= 5
  const isWarning = timeRemaining <= 10 && timeRemaining > 5

  // Overlay mode: Fixed position at top of screen for mobile fullscreen
  if (overlayMode) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-purple-500/30 safe-area-top">
        {/* Timer bar */}
        <div className="h-1 bg-white/[0.04]">
          <div
            className={`h-full transition-all duration-100 ${
              isUrgent 
                ? 'bg-red-500 animate-pulse' 
                : isWarning 
                  ? 'bg-amber-500' 
                  : 'bg-purple-500/70'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Compact horizontal layout for landscape */}
        <div className="px-2 py-1.5 flex items-center gap-2">
          {/* Timer + Question (compact) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`text-sm font-mono font-bold tabular-nums shrink-0 ${
                isUrgent ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-purple-400'
              }`}
            >
              {timeRemaining}s
            </span>
            <p className="text-white/90 text-xs leading-tight truncate">
              {currentQuestion.text}
            </p>
          </div>

          {/* Options - horizontal row, compact */}
          <div className="flex gap-1 shrink-0">
            {options.map((letter, index) => {
              const isSelected = selectedAnswer === letter

              return (
                <button
                  key={letter}
                  onClick={() => handleSelect(letter)}
                  disabled={answerSubmitted}
                  className={`
                    flex items-center gap-1 px-2 py-1.5 rounded-md text-left transition-all min-w-[60px] max-w-[100px]
                    ${isSelected
                      ? 'bg-purple-600/60 border border-purple-400/80'
                      : 'bg-white/10 border border-white/20 active:bg-white/20'
                    }
                    ${answerSubmitted && !isSelected ? 'opacity-40' : ''}
                  `}
                >
                  <span
                    className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white text-purple-900' : 'bg-white/20 text-white/70'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[10px] text-white/90 truncate">
                    {currentQuestion.options[index]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Waiting indicator */}
          {answerSubmitted && (
            <div className="flex items-center gap-1 text-white/50 shrink-0">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Standard mode: Below canvas
  return (
    <div className="w-full bg-gradient-to-b from-[#12101a] to-[#0a0a0a] border-t border-purple-500/20 safe-area-bottom">
      {/* Timer bar - full width */}
      <div className="h-1 bg-white/[0.04]">
        <div
          className={`h-full transition-all duration-100 ${
            isUrgent 
              ? 'bg-red-500 animate-pulse' 
              : isWarning 
                ? 'bg-amber-500' 
                : 'bg-purple-500/70'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Content - more compact on mobile */}
      <div className="px-3 py-2 lg:px-4 lg:py-3 flex flex-col lg:flex-row gap-2 lg:gap-6 items-start lg:items-center max-w-[1280px] mx-auto">
        {/* Question section - inline on mobile */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-purple-400/70 uppercase tracking-wider">
              Q{currentQuestion.qNum}
            </span>
            <span
              className={`text-xs font-mono tabular-nums ${
                isUrgent ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-white/40'
              }`}
            >
              {timeRemaining}s
            </span>
          </div>
          <p className="text-white/90 text-sm lg:text-base leading-snug mt-0.5">
            {currentQuestion.text}
          </p>
        </div>

        {/* Options - 2x2 grid on mobile (compact), row on desktop */}
        <div className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-1.5 lg:gap-2">
          {options.map((letter, index) => {
            const isSelected = selectedAnswer === letter
            const keyNumber = index + 1

            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={answerSubmitted}
                className={`
                  flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg text-left transition-all
                  min-h-[44px] lg:min-w-[160px] lg:max-w-[200px]
                  ${isSelected
                    ? 'bg-purple-600/40 border-2 border-purple-400/60 shadow-lg shadow-purple-500/20'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
                  }
                  ${answerSubmitted && !isSelected ? 'opacity-40' : ''}
                  disabled:cursor-default
                `}
              >
                {/* Key badge */}
                <span
                  className={`
                    w-5 h-5 lg:w-6 lg:h-6 rounded-md text-[10px] lg:text-xs font-bold flex items-center justify-center shrink-0
                    ${isSelected
                      ? 'bg-white text-purple-900'
                      : 'bg-white/10 text-white/60'
                    }
                  `}
                >
                  {keyNumber}
                </span>
                {/* Option text */}
                <span className="text-xs lg:text-sm text-white/85 truncate">
                  {currentQuestion.options[index]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Waiting indicator */}
        {answerSubmitted && (
          <div className="flex items-center gap-2 text-white/40">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">waiting</span>
          </div>
        )}
      </div>
    </div>
  )
}
