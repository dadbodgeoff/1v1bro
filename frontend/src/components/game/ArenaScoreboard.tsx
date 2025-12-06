/**
 * ArenaScoreboard - Minimal scoreboard with integrated question display
 * Question appears in center, scores on sides
 * New question triggers attention-grabbing animation
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface PlayerHealth {
  playerId: string
  health: number
  maxHealth: number
}

interface ArenaScoreboardProps {
  localHealth?: PlayerHealth
  opponentHealth?: PlayerHealth
  showHealth?: boolean
  showQuestion?: boolean
  onAnswer?: (answer: string, timeMs: number) => void
}

export function ArenaScoreboard({
  localHealth,
  opponentHealth,
  showHealth = true,
  showQuestion = false,
  onAnswer,
}: ArenaScoreboardProps) {
  const {
    localPlayerName,
    localScore,
    opponentName,
    opponentScore,
    questionNumber,
    totalQuestions,
    currentQuestion,
    answerSubmitted,
    selectAnswer,
    submitAnswer,
  } = useGameStore()

  const [timeRemaining, setTimeRemaining] = useState(30)
  const [isNewQuestion, setIsNewQuestion] = useState(false)
  const lastQuestionNum = useRef<number>(0)

  // Detect new question and trigger animation
  useEffect(() => {
    if (currentQuestion && questionNumber !== lastQuestionNum.current) {
      lastQuestionNum.current = questionNumber
      setIsNewQuestion(true)
      // Remove animation class after it plays
      const timer = setTimeout(() => setIsNewQuestion(false), 600)
      return () => clearTimeout(timer)
    }
  }, [currentQuestion, questionNumber])

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion || answerSubmitted || !showQuestion) return

    const updateTimer = () => {
      const elapsed = Date.now() - currentQuestion.startTime
      const remaining = Math.max(0, Math.ceil((30000 - elapsed) / 1000))
      setTimeRemaining(remaining)

      if (remaining <= 0 && onAnswer) {
        submitAnswer()
        onAnswer('', 30000)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 100)
    return () => clearInterval(interval)
  }, [currentQuestion, answerSubmitted, submitAnswer, onAnswer, showQuestion])

  const handleSelect = useCallback(
    (answer: string) => {
      if (answerSubmitted || !currentQuestion || !onAnswer) return
      selectAnswer(answer)
      submitAnswer()
      const timeMs = Date.now() - currentQuestion.startTime
      onAnswer(answer, timeMs)
    },
    [answerSubmitted, currentQuestion, onAnswer, selectAnswer, submitAnswer]
  )

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    if (answerSubmitted || !showQuestion || !currentQuestion) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' }
      const answer = keyMap[e.key]
      if (answer) handleSelect(answer)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answerSubmitted, showQuestion, currentQuestion, handleSelect])

  const renderHealthBar = (health?: PlayerHealth) => {
    if (!showHealth || !health) return null
    const percentage = Math.max(0, Math.min(100, (health.health / health.maxHealth) * 100))
    return (
      <div className="w-12 h-1 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full bg-white/40 rounded-full transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  return (
    <div className={`bg-[#0a0a0a] border-b border-white/[0.06] transition-all duration-300 ${
      isNewQuestion ? 'bg-white/[0.03]' : ''
    }`}>
      {/* Main bar - grid layout for perfect centering */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2 gap-4">
        {/* Local player - left aligned */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-neutral-400">{localPlayerName || 'You'}</span>
          </div>
          {renderHealthBar(localHealth)}
          <span className="text-lg font-semibold text-white tabular-nums">{localScore}</span>
        </div>

        {/* Center - Round info only (question displayed in arena) */}
        <div className="flex justify-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded transition-all duration-300 ${
            isNewQuestion ? 'bg-white/[0.06]' : 'bg-transparent'
          }`}>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Q</span>
            <span className={`text-sm font-mono tabular-nums transition-colors ${
              isNewQuestion ? 'text-white' : 'text-neutral-400'
            }`}>{questionNumber}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-xs font-mono text-neutral-500">{totalQuestions}</span>
            {showQuestion && currentQuestion && (
              <span className={`ml-2 text-sm font-mono tabular-nums px-2 py-0.5 rounded ${
                timeRemaining <= 5 ? 'text-red-400 bg-red-500/10' : 'text-neutral-500'
              }`}>
                {timeRemaining}s
              </span>
            )}
          </div>
        </div>

        {/* Opponent - right aligned */}
        <div className="flex items-center gap-3 justify-end">
          <span className="text-lg font-semibold text-white tabular-nums">{opponentScore}</span>
          {renderHealthBar(opponentHealth)}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">{opponentName || 'Opponent'}</span>
            <div className="w-2 h-2 rounded-full bg-red-400" />
          </div>
        </div>
      </div>


    </div>
  )
}
