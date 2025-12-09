/**
 * ArenaScoreboard - Combat HUD with health bars and activity feed
 * Health bars prominently displayed, activity feed on the right
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { cn } from '@/utils/helpers'

export interface PlayerHealth {
  playerId: string
  health: number
  maxHealth: number
}

export interface KillFeedEntry {
  id: string
  text: string
  type: 'kill' | 'hit' | 'quiz' | 'respawn'
  timestamp: number
}

interface ArenaScoreboardProps {
  localHealth?: PlayerHealth
  opponentHealth?: PlayerHealth
  showHealth?: boolean
  showQuestion?: boolean
  onAnswer?: (answer: string, timeMs: number) => void
  killFeed?: KillFeedEntry[]
}

export function ArenaScoreboard({
  localHealth,
  opponentHealth,
  showHealth = true,
  showQuestion = false,
  onAnswer,
  killFeed = [],
}: ArenaScoreboardProps) {
  const {
    localPlayerName,
    localScore,
    opponentName,
    opponentScore,
    questionNumber,
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

  const renderHealthBar = (health?: PlayerHealth, isLocal?: boolean) => {
    if (!showHealth || !health) return null
    const percentage = Math.max(0, Math.min(100, (health.health / health.maxHealth) * 100))
    const isLow = percentage < 30
    const color = isLocal ? '#10B981' : '#EF4444' // emerald for local, red for opponent
    
    return (
      <div className="flex-1 max-w-[100px]">
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-200',
              isLow && 'animate-pulse'
            )}
            style={{ 
              width: `${percentage}%`,
              backgroundColor: isLow ? '#EF4444' : color,
            }}
          />
        </div>
        <div className="text-[10px] text-white/50 mt-0.5 text-center tabular-nums">
          {health.health}/{health.maxHealth}
        </div>
      </div>
    )
  }

  // Activity feed - shows last 3 entries
  const visibleFeed = killFeed.slice(-3)

  return (
    <div className={cn(
      'bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/[0.06] transition-all duration-300',
      isNewQuestion && 'bg-white/[0.03]'
    )}>
      {/* Main bar - health bars and scores */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Local player - left side */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(localPlayerName || 'You').charAt(0).toUpperCase()}
          </div>
          {renderHealthBar(localHealth, true)}
          <span className="text-base font-bold text-white tabular-nums min-w-[32px] text-center">{localScore}</span>
        </div>

        {/* Center - VS or round info */}
        <div className="flex flex-col items-center px-3">
          <span className="text-xs font-bold text-white/60">VS</span>
          {showQuestion && currentQuestion && (
            <span className={cn(
              'text-[10px] font-mono tabular-nums mt-0.5',
              timeRemaining <= 5 ? 'text-red-400' : 'text-white/40'
            )}>
              {timeRemaining}s
            </span>
          )}
        </div>

        {/* Opponent - right side */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-base font-bold text-white tabular-nums min-w-[32px] text-center">{opponentScore}</span>
          {renderHealthBar(opponentHealth, false)}
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(opponentName || 'Opp').charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Activity Feed - far right */}
        {visibleFeed.length > 0 && (
          <div className="hidden sm:flex flex-col gap-0.5 ml-3 pl-3 border-l border-white/10 min-w-[140px] max-w-[180px]">
            {visibleFeed.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'text-[9px] leading-tight truncate',
                  entry.type === 'kill' && 'text-red-400',
                  entry.type === 'hit' && 'text-orange-400',
                  entry.type === 'quiz' && 'text-green-400',
                  entry.type === 'respawn' && 'text-blue-400'
                )}
              >
                {entry.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
