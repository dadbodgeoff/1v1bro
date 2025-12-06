/**
 * BotGame - Practice mode against a bot opponent
 * Fully client-side game with AI bot and mock quiz questions
 * Questions integrated into top scoreboard bar
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard } from '@/components/game/ArenaScoreboard'
import { RoundResultOverlay } from '@/components/game/RoundResultOverlay'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import type { Vector2, FireEvent, HitEvent, DeathEvent, PowerUpState } from '@/game'

// Mock questions for bot game (10 questions to match multiplayer)
const MOCK_QUESTIONS = [
  { text: 'What is the rarest item in Fortnite?', options: ['Gold Scar', 'Mythic Goldfish', 'Purple Pump', 'Blue AR'], correct: 'B' },
  { text: 'Which game has a Battle Royale mode?', options: ['Minecraft', 'Fortnite', 'Tetris', 'Chess'], correct: 'B' },
  { text: 'What does "GG" stand for?', options: ['Good Game', 'Get Going', 'Great Goal', 'Go Go'], correct: 'A' },
  { text: 'How many players in a standard BR match?', options: ['50', '100', '150', '200'], correct: 'B' },
  { text: 'What is a "Victory Royale"?', options: ['A dance', 'Winning the game', 'A weapon', 'A location'], correct: 'B' },
  { text: 'What year was Fortnite released?', options: ['2015', '2016', '2017', '2018'], correct: 'C' },
  { text: 'What is the name of the storm in Fortnite?', options: ['The Circle', 'The Storm', 'The Zone', 'The Ring'], correct: 'B' },
  { text: 'Which company made Fortnite?', options: ['Activision', 'EA Games', 'Epic Games', 'Ubisoft'], correct: 'C' },
  { text: 'What is the in-game currency called?', options: ['V-Coins', 'V-Bucks', 'F-Bucks', 'Gold'], correct: 'B' },
  { text: 'What material is strongest when built?', options: ['Wood', 'Stone', 'Metal', 'All equal'], correct: 'C' },
]

// Number of questions per game (configurable)
const QUESTIONS_PER_GAME = 10

// Bot behavior patterns
type BotBehavior = 'patrol' | 'chase' | 'evade'

const PATROL_POINTS: Vector2[] = [
  { x: 1000, y: 200 },
  { x: 1100, y: 500 },
  { x: 900, y: 360 },
  { x: 1050, y: 300 },
]

const BOT_SPEED = 100

export function BotGame() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id) || 'local-player'
  const userName = useAuthStore((s) => s.user?.display_name) || 'You'

  const {
    status,
    currentQuestion,
    localScore,
    opponentScore,
    setLocalPlayer,
    setOpponent,
    setQuestion,
    updateScores,
    setRoundResult,
    setStatus,
    reset,
  } = useGameStore()

  // Bot state
  const [botPosition, setBotPosition] = useState<Vector2>({ x: 1050, y: 360 })
  const [playerPosition, setPlayerPosition] = useState<Vector2>({ x: 200, y: 360 })
  const botStateRef = useRef({
    position: { x: 1050, y: 360 },
    velocity: { x: 0, y: 0 },
    behavior: 'patrol' as BotBehavior,
    patrolIndex: 0,
    lastBehaviorChange: Date.now(),
  })

  // Game state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [localHealth] = useState({ playerId: userId, health: 100, maxHealth: 100 })
  const [opponentHealth] = useState({ playerId: 'bot', health: 100, maxHealth: 100 })
  const [powerUps] = useState<PowerUpState[]>([])

  // Answer tracking - wait for both to answer
  const [playerAnswer, setPlayerAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [botAnswer, setBotAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [waitingForBot, setWaitingForBot] = useState(false)
  const botAnswerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize game
  useEffect(() => {
    reset()
    setLocalPlayer(userId, userName)
    setOpponent('bot', 'Bot')
    setStatus('waiting')
  }, [userId, userName, reset, setLocalPlayer, setOpponent, setStatus])

  // Start game
  const startGame = useCallback(() => {
    setGameStarted(true)
    setStatus('playing')
    
    // Send first question
    const q = MOCK_QUESTIONS[0]
    setQuestion({
      qNum: 1,
      text: q.text,
      options: q.options,
      startTime: Date.now(),
    })
  }, [setStatus, setQuestion])

  // Bot movement loop
  useEffect(() => {
    if (!gameStarted) return

    const updateBot = () => {
      const state = botStateRef.current
      const now = Date.now()
      const deltaTime = 1 / 60

      // Change behavior occasionally
      if (now - state.lastBehaviorChange > 3000 + Math.random() * 2000) {
        const behaviors: BotBehavior[] = ['patrol', 'chase', 'evade']
        state.behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
        state.lastBehaviorChange = now
      }

      switch (state.behavior) {
        case 'patrol': {
          const target = PATROL_POINTS[state.patrolIndex]
          const dx = target.x - state.position.x
          const dy = target.y - state.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 20) {
            state.patrolIndex = (state.patrolIndex + 1) % PATROL_POINTS.length
          } else {
            state.velocity.x = (dx / dist) * BOT_SPEED
            state.velocity.y = (dy / dist) * BOT_SPEED
          }
          break
        }

        case 'chase': {
          const dx = playerPosition.x - state.position.x
          const dy = playerPosition.y - state.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 100) {
            state.velocity.x = (dx / dist) * BOT_SPEED
            state.velocity.y = (dy / dist) * BOT_SPEED
          } else {
            state.velocity.x *= 0.9
            state.velocity.y *= 0.9
          }
          break
        }

        case 'evade': {
          const dx = state.position.x - playerPosition.x
          const dy = state.position.y - playerPosition.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 300) {
            state.velocity.x = (dx / dist) * BOT_SPEED * 0.8
            state.velocity.y = (dy / dist) * BOT_SPEED * 0.8
          } else {
            state.behavior = 'patrol'
          }
          break
        }
      }

      // Apply velocity
      state.position.x += state.velocity.x * deltaTime
      state.position.y += state.velocity.y * deltaTime

      // Keep in bounds
      state.position.x = Math.max(100, Math.min(1180, state.position.x))
      state.position.y = Math.max(100, Math.min(620, state.position.y))

      setBotPosition({ ...state.position })
    }

    const interval = setInterval(updateBot, 1000 / 60)
    return () => clearInterval(interval)
  }, [gameStarted, playerPosition])

  // Schedule bot answer when question starts
  useEffect(() => {
    if (!gameStarted || status !== 'playing' || !currentQuestion) return

    // Clear any existing timeout
    if (botAnswerTimeoutRef.current) {
      clearTimeout(botAnswerTimeoutRef.current)
    }

    // Reset answers for new question
    setPlayerAnswer(null)
    setBotAnswer(null)
    setWaitingForBot(false)

    // Bot will answer after 3-12 seconds (random delay)
    const botDelay = 3000 + Math.random() * 9000
    botAnswerTimeoutRef.current = setTimeout(() => {
      const q = MOCK_QUESTIONS[questionIndex]
      const botCorrect = Math.random() < 0.4
      const botTimeMs = 3000 + Math.random() * 9000
      const answer = botCorrect ? q.correct : ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
      
      setBotAnswer({ answer, timeMs: botTimeMs })
    }, botDelay)

    return () => {
      if (botAnswerTimeoutRef.current) {
        clearTimeout(botAnswerTimeoutRef.current)
      }
    }
  }, [gameStarted, status, currentQuestion, questionIndex])

  // Process round when both have answered
  useEffect(() => {
    if (!playerAnswer || !botAnswer || status !== 'playing') return

    const q = MOCK_QUESTIONS[questionIndex]
    
    // Calculate scores
    const playerCorrect = playerAnswer.answer === q.correct
    const playerScore = playerCorrect ? Math.max(100, 1000 - Math.floor(playerAnswer.timeMs / 30)) : 0

    const botCorrect = botAnswer.answer === q.correct
    const botScore = botCorrect ? Math.max(100, 1000 - Math.floor(botAnswer.timeMs / 30)) : 0

    // Show round result
    setRoundResult({
      correctAnswer: q.options[q.correct.charCodeAt(0) - 65],
      localScore: playerScore,
      opponentScore: botScore,
      localAnswer: playerAnswer.answer || null,
      opponentAnswer: botAnswer.answer,
    })

    updateScores(localScore + playerScore, opponentScore + botScore)

    // Next question after delay
    setTimeout(() => {
      const nextIndex = questionIndex + 1
      if (nextIndex < QUESTIONS_PER_GAME && nextIndex < MOCK_QUESTIONS.length) {
        setQuestionIndex(nextIndex)
        const nextQ = MOCK_QUESTIONS[nextIndex]
        setQuestion({
          qNum: nextIndex + 1,
          text: nextQ.text,
          options: nextQ.options,
          startTime: Date.now(),
        })
      } else {
        // Game over
        setStatus('finished')
      }
    }, 3000)
  }, [playerAnswer, botAnswer, questionIndex, localScore, opponentScore, status, setRoundResult, updateScores, setQuestion, setStatus])

  // Handle player answer
  const handleAnswer = useCallback((answer: string, timeMs: number) => {
    if (playerAnswer) return // Already answered
    
    setPlayerAnswer({ answer, timeMs })
    
    // Show waiting state if bot hasn't answered yet
    if (!botAnswer) {
      setWaitingForBot(true)
    }
  }, [playerAnswer, botAnswer])

  const handlePositionUpdate = useCallback((position: Vector2) => {
    setPlayerPosition(position)
  }, [])

  const handleCombatFire = useCallback((_event: FireEvent) => {
    // Stats tracking would go here
  }, [])

  const handleCombatHit = useCallback((_event: HitEvent) => {
    // Stats tracking would go here
  }, [])

  const handleCombatDeath = useCallback((_event: DeathEvent) => {
    // Stats tracking would go here
  }, [])

  const handleLeave = useCallback(() => {
    reset()
    navigate('/')
  }, [reset, navigate])

  // Pre-game screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Bot Practice</h1>
        <p className="text-neutral-500 mb-8 text-center max-w-md text-sm">
          Practice your skills against an AI opponent. Fight in the arena while answering trivia questions.
        </p>
        <div className="flex gap-3">
          <button
            onClick={startGame}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Start Game
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-white/[0.06] text-neutral-300 text-sm font-medium rounded-lg border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // Game over screen
  if (status === 'finished') {
    const won = localScore > opponentScore
    const tied = localScore === opponentScore

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <div className={`w-3 h-3 rounded-full mb-4 ${won ? 'bg-emerald-400' : tied ? 'bg-amber-400' : 'bg-red-400'}`} />
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
          {won ? 'Victory' : tied ? 'Draw' : 'Defeat'}
        </h1>
        <div className="text-4xl font-semibold text-white tabular-nums mb-8">
          {localScore} <span className="text-neutral-600">-</span> {opponentScore}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              reset()
              setQuestionIndex(0)
              setGameStarted(false)
            }}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-white/[0.06] text-neutral-300 text-sm font-medium rounded-lg border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  // Main game view
  const showQuestion = status === 'playing' && !!currentQuestion && !waitingForBot
  const showRoundResult = status === 'round_result'

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Scoreboard header with integrated question */}
      <ArenaScoreboard
        localHealth={localHealth}
        opponentHealth={opponentHealth}
        showHealth={true}
        showQuestion={showQuestion}
        onAnswer={handleAnswer}
      />

      {/* Main game area */}
      <div className="flex-1 relative p-3 min-h-0">
        {/* Arena container */}
        <div className="h-full relative rounded-lg overflow-hidden border border-white/[0.06]">
          <GameArena
            playerId={userId}
            isPlayer1={true}
            opponentId="bot"
            opponentPosition={botPosition}
            powerUps={powerUps}
            onPositionUpdate={handlePositionUpdate}
            onPowerUpCollect={() => {}}
            combatEnabled={true}
            onCombatFire={handleCombatFire}
            onCombatHit={handleCombatHit}
            onCombatDeath={handleCombatDeath}
          />

          {/* Waiting for bot indicator */}
          {waitingForBot && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-black/70 backdrop-blur-sm border border-white/[0.08] rounded-lg px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-white/40">bot thinking</span>
                </div>
              </div>
            </div>
          )}

          {/* Round result toast */}
          <RoundResultOverlay visible={showRoundResult} />
        </div>

        {/* Controls hint - bottom left corner */}
        <div className="absolute bottom-6 left-6 hidden lg:block">
          <div className="px-3 py-2 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/[0.08] rounded-lg">
            <p className="text-[10px] text-neutral-500 font-mono">
              WASD move · Click shoot · 1-4 answer
            </p>
          </div>
        </div>

        {/* Leave button - bottom right corner */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={handleLeave}
            className="px-3 py-2 text-xs text-neutral-600 hover:text-red-400 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/[0.08] rounded-lg transition-colors"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  )
}
