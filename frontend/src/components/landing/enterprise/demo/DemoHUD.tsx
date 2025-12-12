/**
 * DemoHUD - HUD overlay for the landing page demo
 * 
 * Displays health bars, scores, question panel, timer, and kill feed
 * overlaid on the demo game canvas.
 * 
 * @module landing/enterprise/demo/DemoHUD
 * Requirements: 2.2, 2.5
 */

import { cn } from '@/utils/helpers'
import type { DemoPlayerState, DemoQuestion, DemoMatchState, KillFeedEntry } from './types'

export interface DemoHUDProps {
  player1: DemoPlayerState
  player2: DemoPlayerState
  question: DemoQuestion | null
  questionTimer: number
  killFeed: KillFeedEntry[]
  matchState: DemoMatchState
  matchTime: number
  loopDuration: number
  ai1Answer: number | null
  ai2Answer: number | null
  className?: string
}

function HealthBar({ 
  player, 
  side 
}: { 
  player: DemoPlayerState
  side: 'left' | 'right' 
}) {
  const healthPercent = (player.health / player.maxHealth) * 100
  const isLow = healthPercent < 30

  return (
    <div className={cn(
      'flex items-center gap-1 sm:gap-2',
      side === 'right' && 'flex-row-reverse'
    )}>
      {/* Player indicator - smaller on mobile */}
      <div 
        className="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[8px] sm:text-xs font-bold text-white"
        style={{ backgroundColor: player.color }}
      >
        {player.id === 'player1' ? 'P1' : 'P2'}
      </div>
      
      {/* Health bar - narrower on mobile */}
      <div className="flex-1 max-w-[60px] sm:max-w-[120px]">
        <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-200 rounded-full',
              isLow && 'animate-pulse'
            )}
            style={{ 
              width: `${healthPercent}%`,
              backgroundColor: isLow ? '#EF4444' : player.color,
            }}
          />
        </div>
        <div className="text-[8px] sm:text-[10px] text-white/60 mt-0.5 text-center hidden sm:block">
          {player.health}/{player.maxHealth}
        </div>
      </div>

      {/* Score */}
      <div className="text-white font-bold text-[10px] sm:text-sm min-w-[24px] sm:min-w-[40px] text-center">
        {player.score}
      </div>
    </div>
  )
}

function QuestionPanel({
  question,
  timer,
  ai1Answer,
  ai2Answer,
}: {
  question: DemoQuestion
  timer: number
  ai1Answer: number | null
  ai2Answer: number | null
}) {
  const timerSeconds = Math.ceil(timer / 1000)
  const isUrgent = timerSeconds <= 2

  return (
    <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2 bg-black/85 backdrop-blur-sm rounded-md sm:rounded-lg p-2 sm:p-3 border border-white/10">
      {/* Timer */}
      <div className="flex justify-between items-center mb-1 sm:mb-2">
        <span className="text-white/60 text-[10px] sm:text-xs">Question</span>
        <span className={cn(
          'text-xs sm:text-sm font-bold',
          isUrgent ? 'text-red-500 animate-pulse' : 'text-white'
        )}>
          {timerSeconds}s
        </span>
      </div>

      {/* Question text - more compact on mobile */}
      <p className="text-white text-[11px] sm:text-sm font-medium mb-1.5 sm:mb-2 line-clamp-2">
        {question.text}
      </p>

      {/* Options grid - tighter on mobile */}
      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
        {question.options.map((option, index) => {
          const isP1Selected = ai1Answer === index
          const isP2Selected = ai2Answer === index
          
          return (
            <div
              key={index}
              className={cn(
                'px-1.5 py-1 sm:px-2 sm:py-1.5 rounded text-[10px] sm:text-xs text-white/80 bg-white/5 border border-white/10',
                'flex items-center justify-between gap-0.5 sm:gap-1',
                (isP1Selected || isP2Selected) && 'border-white/30'
              )}
            >
              <span className="truncate">{option}</span>
              <div className="flex gap-0.5">
                {isP1Selected && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#F97316]" title="Player 1" />
                )}
                {isP2Selected && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#A855F7]" title="Player 2" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KillFeed({ entries }: { entries: KillFeedEntry[] }) {
  if (entries.length === 0) return null

  return (
    <div className="absolute top-10 right-2 flex flex-col gap-1">
      {entries.slice(-3).map((entry, i) => (
        <div
          key={`${entry.time}-${i}`}
          className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/80 animate-fade-up"
        >
          {entry.text}
        </div>
      ))}
    </div>
  )
}

function PhaseIndicator({ phase, matchTime, loopDuration }: { 
  phase: DemoMatchState['phase']
  matchTime: number
  loopDuration: number
}) {
  const progress = (matchTime / loopDuration) * 100

  const phaseLabels: Record<DemoMatchState['phase'], string> = {
    intro: 'MATCH START',
    question: 'TRIVIA TIME',
    combat: 'COMBAT',
    finale: 'FINAL ROUND',
    reset: 'REMATCH...',
  }

  return (
    <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className={cn(
        'px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-wider',
        phase === 'intro' && 'bg-[#F97316] text-white',
        phase === 'question' && 'bg-blue-500 text-white',
        phase === 'combat' && 'bg-red-500 text-white',
        phase === 'finale' && 'bg-indigo-500 text-white animate-pulse',
        phase === 'reset' && 'bg-white/20 text-white/60',
      )}>
        {phaseLabels[phase]}
      </div>
      
      {/* Progress bar - hidden on very small screens */}
      <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-white/10 rounded-full mt-0.5 sm:mt-1 overflow-hidden">
        <div 
          className="h-full bg-white/40 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function DemoHUD({
  player1,
  player2,
  question,
  questionTimer,
  killFeed,
  matchState,
  matchTime,
  loopDuration,
  ai1Answer,
  ai2Answer,
  className,
}: DemoHUDProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* Top bar - Health and scores - tighter on mobile */}
      <div className="absolute top-1 left-1 right-1 sm:top-2 sm:left-2 sm:right-2 flex justify-between items-start">
        <HealthBar player={player1} side="left" />
        <HealthBar player={player2} side="right" />
      </div>

      {/* Phase indicator */}
      <PhaseIndicator 
        phase={matchState.phase} 
        matchTime={matchTime}
        loopDuration={loopDuration}
      />

      {/* Kill feed - hidden on very small screens */}
      <div className="hidden sm:block">
        <KillFeed entries={killFeed} />
      </div>

      {/* Question panel */}
      {question && (
        <QuestionPanel
          question={question}
          timer={questionTimer}
          ai1Answer={ai1Answer}
          ai2Answer={ai2Answer}
        />
      )}

      {/* Intro overlay - smaller text on mobile */}
      {matchState.phase === 'intro' && matchState.timeInPhase < 2000 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xl sm:text-4xl font-bold text-white animate-pulse">
            MATCH START
          </div>
        </div>
      )}

      {/* Interactive hint - hidden on mobile */}
      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-[8px] sm:text-[10px] text-white/40 hidden sm:block">
        AI vs AI Demo
      </div>
    </div>
  )
}

export default DemoHUD
