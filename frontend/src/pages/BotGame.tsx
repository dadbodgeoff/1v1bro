/**
 * BotGame - Practice mode against a bot opponent
 * Full game experience with real questions from API
 * Uses same UI components as multiplayer for consistent UX
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard } from '@/components/game/ArenaScoreboard'
import { ArenaQuizPanel } from '@/components/game/ArenaQuizPanel'
import { RoundResultOverlay } from '@/components/game/RoundResultOverlay'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useCategories } from '@/hooks/useCategories'
import { NEXUS_ARENA, VORTEX_ARENA, type MapConfig } from '@/game/config/maps'
import { API_BASE } from '@/utils/constants'
import type { Vector2, FireEvent, HitEvent, DeathEvent, PowerUpState } from '@/game'

// Available maps for practice mode
const AVAILABLE_MAPS = [
  {
    id: 'nexus',
    name: 'Nexus Arena',
    description: 'Classic 3-lane arena with balanced gameplay',
    config: NEXUS_ARENA,
  },
  {
    id: 'vortex',
    name: 'Vortex Arena',
    description: 'Radial arena with central hazards and teleporters',
    config: VORTEX_ARENA,
  },
  // Industrial map hidden behind feature flag until tilesets are ready
  // {
  //   id: 'industrial',
  //   name: 'Industrial Facility',
  //   description: 'Military facility with cover and hazard zones',
  //   config: INDUSTRIAL_FACILITY,
  // },
] as const

// Question type from API
interface PracticeQuestion {
  id: number
  text: string
  options: string[]
  correct_answer: string // A, B, C, or D
  category: string
}

// Fallback questions if API fails
const FALLBACK_QUESTIONS: PracticeQuestion[] = [
  { id: 1, text: 'What is the rarest item in Fortnite?', options: ['Gold Scar', 'Mythic Goldfish', 'Purple Pump', 'Blue AR'], correct_answer: 'B', category: 'fortnite' },
  { id: 2, text: 'Which game has a Battle Royale mode?', options: ['Minecraft', 'Fortnite', 'Tetris', 'Chess'], correct_answer: 'B', category: 'fortnite' },
  { id: 3, text: 'What does "GG" stand for?', options: ['Good Game', 'Get Going', 'Great Goal', 'Go Go'], correct_answer: 'A', category: 'fortnite' },
  { id: 4, text: 'How many players in a standard BR match?', options: ['50', '100', '150', '200'], correct_answer: 'B', category: 'fortnite' },
  { id: 5, text: 'What is a "Victory Royale"?', options: ['A dance', 'Winning the game', 'A weapon', 'A location'], correct_answer: 'B', category: 'fortnite' },
  { id: 6, text: 'What year was Fortnite released?', options: ['2015', '2016', '2017', '2018'], correct_answer: 'C', category: 'fortnite' },
  { id: 7, text: 'What is the name of the storm in Fortnite?', options: ['The Circle', 'The Storm', 'The Zone', 'The Ring'], correct_answer: 'B', category: 'fortnite' },
  { id: 8, text: 'Which company made Fortnite?', options: ['Activision', 'EA Games', 'Epic Games', 'Ubisoft'], correct_answer: 'C', category: 'fortnite' },
  { id: 9, text: 'What is the in-game currency called?', options: ['V-Coins', 'V-Bucks', 'F-Bucks', 'Gold'], correct_answer: 'B', category: 'fortnite' },
  { id: 10, text: 'What material is strongest when built?', options: ['Wood', 'Stone', 'Metal', 'All equal'], correct_answer: 'C', category: 'fortnite' },
]

// Number of questions per game (configurable)
const QUESTIONS_PER_GAME = 10

// Bot behavior patterns
type BotBehavior = 'patrol' | 'chase' | 'evade' | 'strafe'

const PATROL_POINTS: Vector2[] = [
  { x: 1000, y: 200 },
  { x: 1100, y: 500 },
  { x: 900, y: 360 },
  { x: 1050, y: 300 },
]

const BOT_SPEED = 120 // Slightly faster for challenge

// Bot difficulty settings (moderate - gives human fair chance)
const BOT_CONFIG = {
  // Quiz behavior
  quizAccuracy: 0.55, // 55% chance to answer correctly
  minAnswerTime: 2500, // Minimum 2.5s to answer
  maxAnswerTime: 8000, // Maximum 8s to answer
  
  // Combat behavior
  shootCooldown: 800, // ms between shots (player is ~500ms)
  shootAccuracy: 0.7, // 70% chance to aim at player vs random
  aggroRange: 400, // Distance to start chasing
  retreatHealth: 30, // Health % to start evading
  
  // Movement
  reactionTime: 200, // ms delay before reacting to player
}

export function BotGame() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id) || 'guest-player'
  const userName = useAuthStore((s) => s.user?.display_name) || 'You'
  
  // Guest mode - user is not logged in
  const isGuest = !isAuthenticated
  
  // Mobile landscape detection for overlay quiz mode
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)
  
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 1024
      const landscape = window.innerWidth > window.innerHeight
      setIsMobileLandscape(isMobile && landscape)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

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

  // Categories from API
  const { categories, isLoading: categoriesLoading } = useCategories()

  // Bot state
  const [botPosition, setBotPosition] = useState<Vector2>({ x: 1050, y: 360 })
  const [playerPosition, setPlayerPosition] = useState<Vector2>({ x: 200, y: 360 })
  const [botHealth, setBotHealth] = useState(100)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [botProjectiles, setBotProjectiles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([])
  const projectileIdRef = useRef(0)
  
  const botStateRef = useRef({
    position: { x: 1050, y: 360 },
    velocity: { x: 0, y: 0 },
    behavior: 'patrol' as BotBehavior,
    patrolIndex: 0,
    lastBehaviorChange: Date.now(),
    lastShot: 0,
    health: 100,
    strafeDirection: 1,
  })

  // Game state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedMap, setSelectedMap] = useState<MapConfig>(NEXUS_ARENA)
  const [selectedCategory, setSelectedCategory] = useState('fortnite')
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const localHealth = { playerId: userId, health: playerHealth, maxHealth: 100 }
  const opponentHealth = { playerId: 'bot', health: botHealth, maxHealth: 100 }
  const [powerUps] = useState<PowerUpState[]>([])
  
  // Combat stats
  const [playerKills, setPlayerKills] = useState(0)
  const [botKills, setBotKills] = useState(0)

  // Answer tracking - wait for both to answer
  const [playerAnswer, setPlayerAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [botAnswer, setBotAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [waitingForBot, setWaitingForBot] = useState(false)
  const botAnswerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch questions from API
  const fetchQuestions = useCallback(async (category: string) => {
    setQuestionsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/questions/practice/${category}?count=${QUESTIONS_PER_GAME}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || FALLBACK_QUESTIONS)
      } else {
        console.warn('Failed to fetch questions, using fallback')
        setQuestions(FALLBACK_QUESTIONS)
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
      setQuestions(FALLBACK_QUESTIONS)
    } finally {
      setQuestionsLoading(false)
    }
  }, [token])

  // Initialize game
  useEffect(() => {
    reset()
    setLocalPlayer(userId, userName)
    setOpponent('bot', 'Practice Bot')
    setStatus('waiting')
  }, [userId, userName, reset, setLocalPlayer, setOpponent, setStatus])

  // Start game - fetch questions first, then begin
  const startGame = useCallback(async () => {
    console.log('[BotGame] Starting game with map:', selectedMap?.metadata?.name, 'theme:', selectedMap?.metadata?.theme)
    
    // Fetch questions for selected category
    await fetchQuestions(selectedCategory)
    
    setGameStarted(true)
    setStatus('playing')
  }, [selectedMap, selectedCategory, fetchQuestions, setStatus])

  // Send first question when questions are loaded and game starts
  useEffect(() => {
    if (gameStarted && questions.length > 0 && status === 'playing' && questionIndex === 0 && !currentQuestion) {
      const q = questions[0]
      setQuestion({
        qNum: 1,
        text: q.text,
        options: q.options,
        startTime: Date.now(),
      })
    }
  }, [gameStarted, questions, status, questionIndex, currentQuestion, setQuestion])

  // Bot movement and combat loop
  useEffect(() => {
    if (!gameStarted) return

    const updateBot = () => {
      const state = botStateRef.current
      const now = Date.now()
      const deltaTime = 1 / 60

      // Calculate distance to player
      const dx = playerPosition.x - state.position.x
      const dy = playerPosition.y - state.position.y
      const distToPlayer = Math.sqrt(dx * dx + dy * dy)

      // Smart behavior selection based on situation
      if (now - state.lastBehaviorChange > 2000 + Math.random() * 1500) {
        // Low health? Evade
        if (state.health < BOT_CONFIG.retreatHealth) {
          state.behavior = 'evade'
        }
        // Player close? Chase or strafe
        else if (distToPlayer < BOT_CONFIG.aggroRange) {
          state.behavior = Math.random() < 0.6 ? 'strafe' : 'chase'
        }
        // Otherwise patrol
        else {
          const behaviors: BotBehavior[] = ['patrol', 'chase', 'strafe']
          state.behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
        }
        state.lastBehaviorChange = now
      }

      switch (state.behavior) {
        case 'patrol': {
          const target = PATROL_POINTS[state.patrolIndex]
          const pdx = target.x - state.position.x
          const pdy = target.y - state.position.y
          const dist = Math.sqrt(pdx * pdx + pdy * pdy)

          if (dist < 20) {
            state.patrolIndex = (state.patrolIndex + 1) % PATROL_POINTS.length
          } else {
            state.velocity.x = (pdx / dist) * BOT_SPEED
            state.velocity.y = (pdy / dist) * BOT_SPEED
          }
          break
        }

        case 'chase': {
          if (distToPlayer > 150) {
            state.velocity.x = (dx / distToPlayer) * BOT_SPEED
            state.velocity.y = (dy / distToPlayer) * BOT_SPEED
          } else {
            // Close enough, slow down
            state.velocity.x *= 0.85
            state.velocity.y *= 0.85
          }
          break
        }

        case 'strafe': {
          // Circle strafe around player while shooting
          if (distToPlayer > 100 && distToPlayer < 350) {
            // Perpendicular movement (strafing)
            const perpX = -dy / distToPlayer
            const perpY = dx / distToPlayer
            state.velocity.x = perpX * BOT_SPEED * state.strafeDirection
            state.velocity.y = perpY * BOT_SPEED * state.strafeDirection
            
            // Occasionally change strafe direction
            if (Math.random() < 0.02) {
              state.strafeDirection *= -1
            }
          } else if (distToPlayer <= 100) {
            // Too close, back up
            state.velocity.x = -(dx / distToPlayer) * BOT_SPEED * 0.5
            state.velocity.y = -(dy / distToPlayer) * BOT_SPEED * 0.5
          } else {
            // Too far, approach
            state.velocity.x = (dx / distToPlayer) * BOT_SPEED * 0.7
            state.velocity.y = (dy / distToPlayer) * BOT_SPEED * 0.7
          }
          break
        }

        case 'evade': {
          if (distToPlayer < 400) {
            state.velocity.x = -(dx / distToPlayer) * BOT_SPEED
            state.velocity.y = -(dy / distToPlayer) * BOT_SPEED
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

      // Bot shooting logic
      if (distToPlayer < 500 && now - state.lastShot > BOT_CONFIG.shootCooldown) {
        state.lastShot = now
        
        // Calculate shot direction
        let shotDx = dx
        let shotDy = dy
        
        // Add some inaccuracy (30% chance to miss)
        if (Math.random() > BOT_CONFIG.shootAccuracy) {
          const spread = 0.3
          shotDx += (Math.random() - 0.5) * distToPlayer * spread
          shotDy += (Math.random() - 0.5) * distToPlayer * spread
        }
        
        const shotDist = Math.sqrt(shotDx * shotDx + shotDy * shotDy)
        const projectileSpeed = 400
        
        const newProjectile = {
          id: projectileIdRef.current++,
          x: state.position.x,
          y: state.position.y,
          vx: (shotDx / shotDist) * projectileSpeed,
          vy: (shotDy / shotDist) * projectileSpeed,
        }
        
        setBotProjectiles(prev => [...prev, newProjectile])
      }
    }

    const interval = setInterval(updateBot, 1000 / 60)
    return () => clearInterval(interval)
  }, [gameStarted, playerPosition])

  // Update bot projectiles and check collisions
  useEffect(() => {
    if (!gameStarted || botProjectiles.length === 0) return

    const updateProjectiles = () => {
      const deltaTime = 1 / 60
      
      setBotProjectiles(prev => {
        const updated: typeof prev = []
        
        for (const p of prev) {
          // Move projectile
          const newX = p.x + p.vx * deltaTime
          const newY = p.y + p.vy * deltaTime
          
          // Check bounds
          if (newX < 0 || newX > 1280 || newY < 0 || newY > 720) {
            continue // Remove projectile
          }
          
          // Check collision with player (simple circle collision)
          const dx = newX - playerPosition.x
          const dy = newY - playerPosition.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 30) {
            // Hit player!
            setPlayerHealth(prev => {
              const newHealth = Math.max(0, prev - 10)
              if (newHealth <= 0) {
                // Player died, respawn
                setBotKills(k => k + 1)
                setTimeout(() => setPlayerHealth(100), 1500)
              }
              return newHealth
            })
            continue // Remove projectile
          }
          
          updated.push({ ...p, x: newX, y: newY })
        }
        
        return updated
      })
    }

    const interval = setInterval(updateProjectiles, 1000 / 60)
    return () => clearInterval(interval)
  }, [gameStarted, botProjectiles.length, playerPosition])

  // Schedule bot answer when question starts
  useEffect(() => {
    if (!gameStarted || status !== 'playing' || !currentQuestion || questions.length === 0) return

    // Clear any existing timeout
    if (botAnswerTimeoutRef.current) {
      clearTimeout(botAnswerTimeoutRef.current)
    }

    // Reset answers for new question
    setPlayerAnswer(null)
    setBotAnswer(null)
    setWaitingForBot(false)

    // Bot answers with moderate skill - competitive but beatable
    const botDelay = BOT_CONFIG.minAnswerTime + Math.random() * (BOT_CONFIG.maxAnswerTime - BOT_CONFIG.minAnswerTime)
    botAnswerTimeoutRef.current = setTimeout(() => {
      const q = questions[questionIndex]
      if (!q) return
      
      const botCorrect = Math.random() < BOT_CONFIG.quizAccuracy
      const botTimeMs = botDelay
      const correctAnswer = q.correct_answer
      const answer = botCorrect 
        ? correctAnswer 
        : ['A', 'B', 'C', 'D'].filter(a => a !== correctAnswer)[Math.floor(Math.random() * 3)]
      
      setBotAnswer({ answer, timeMs: botTimeMs })
    }, botDelay)

    return () => {
      if (botAnswerTimeoutRef.current) {
        clearTimeout(botAnswerTimeoutRef.current)
      }
    }
  }, [gameStarted, status, currentQuestion, questionIndex, questions])

  // Process round when both have answered
  useEffect(() => {
    if (!playerAnswer || !botAnswer || status !== 'playing' || questions.length === 0) return

    const q = questions[questionIndex]
    if (!q) return
    
    // Calculate scores - correct_answer is A, B, C, or D
    const playerCorrect = playerAnswer.answer === q.correct_answer
    const playerScoreVal = playerCorrect ? Math.max(100, 1000 - Math.floor(playerAnswer.timeMs / 30)) : 0

    const botCorrect = botAnswer.answer === q.correct_answer
    const botScoreVal = botCorrect ? Math.max(100, 1000 - Math.floor(botAnswer.timeMs / 30)) : 0

    // Get correct answer text
    const correctIndex = q.correct_answer.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
    const correctAnswerText = q.options[correctIndex] || q.correct_answer

    // Show round result
    setRoundResult({
      correctAnswer: correctAnswerText,
      localScore: playerScoreVal,
      opponentScore: botScoreVal,
      localAnswer: playerAnswer.answer || null,
      opponentAnswer: botAnswer.answer,
    })

    updateScores(localScore + playerScoreVal, opponentScore + botScoreVal)

    // Next question after delay
    setTimeout(() => {
      const nextIndex = questionIndex + 1
      if (nextIndex < QUESTIONS_PER_GAME && nextIndex < questions.length) {
        setQuestionIndex(nextIndex)
        const nextQ = questions[nextIndex]
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
  }, [playerAnswer, botAnswer, questionIndex, localScore, opponentScore, status, questions, setRoundResult, updateScores, setQuestion, setStatus])

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
    // Player fired - stats tracking
  }, [])

  const handleCombatHit = useCallback((event: HitEvent) => {
    // Player hit the bot
    if (event.targetId === 'bot') {
      setBotHealth(prev => {
        const newHealth = Math.max(0, prev - event.damage)
        botStateRef.current.health = newHealth
        
        if (newHealth <= 0) {
          // Bot died, respawn after delay
          setPlayerKills(k => k + 1)
          setTimeout(() => {
            setBotHealth(100)
            botStateRef.current.health = 100
            // Respawn at random patrol point
            const spawnPoint = PATROL_POINTS[Math.floor(Math.random() * PATROL_POINTS.length)]
            botStateRef.current.position = { ...spawnPoint }
            setBotPosition({ ...spawnPoint })
          }, 1500)
        }
        return newHealth
      })
    }
  }, [])

  const handleCombatDeath = useCallback((_event: DeathEvent) => {
    // Death event handling
  }, [])

  const handleLeave = useCallback(() => {
    reset()
    navigate(isGuest ? '/' : '/dashboard')
  }, [reset, navigate, isGuest])

  // Pre-game screen with category and map selection
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Practice Mode</h1>
        <p className="text-neutral-500 mb-6 text-center max-w-md text-sm">
          Practice your skills against an AI opponent. Fight in the arena while answering trivia questions.
        </p>

        {/* Category Selection */}
        <div className="w-full max-w-md mb-6">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">Select Category</p>
          <div className="grid grid-cols-2 gap-3">
            {categoriesLoading ? (
              <div className="col-span-2 text-center py-4 text-neutral-500 text-sm">Loading categories...</div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    selectedCategory === cat.slug
                      ? 'bg-purple-500/20 border-purple-500/40 ring-1 ring-purple-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedCategory === cat.slug ? 'bg-purple-400' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{cat.question_count.toLocaleString()} questions</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map Selection */}
        <div className="w-full max-w-md mb-8">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">Select Map</p>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_MAPS.map((map) => (
              <button
                key={map.id}
                onClick={() => {
                  console.log('[BotGame] Selected map:', map.name, 'config theme:', map.config?.metadata?.theme)
                  setSelectedMap(map.config)
                }}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedMap === map.config
                    ? 'bg-white/[0.08] border-white/20 ring-1 ring-white/20'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedMap === map.config ? 'bg-emerald-400' : 'bg-neutral-600'
                    }`}
                  />
                  <span className="text-sm font-medium text-white">{map.name}</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{map.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={startGame}
            disabled={questionsLoading}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {questionsLoading ? 'Loading...' : 'Start Game'}
          </button>
          <button
            onClick={() => navigate(isGuest ? '/' : '/dashboard')}
            className="px-6 py-2.5 bg-white/[0.06] text-neutral-300 text-sm font-medium rounded-lg border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            Back
          </button>
        </div>
        
        {/* Guest mode hint */}
        {isGuest && (
          <p className="text-xs text-neutral-500 mt-4 text-center">
            Playing as guest · <button onClick={() => navigate('/register')} className="text-purple-400 hover:text-purple-300">Sign up</button> to track stats & compete on leaderboards
          </p>
        )}
      </div>
    )
  }

  // Game over screen
  if (status === 'finished') {
    const won = localScore > opponentScore
    const tied = localScore === opponentScore

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <div className={`w-3 h-3 rounded-full mb-4 ${won ? 'bg-emerald-400' : tied ? 'bg-amber-400' : 'bg-red-400'}`} />
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
          {won ? 'Victory' : tied ? 'Draw' : 'Defeat'}
        </h1>
        <div className="text-4xl font-semibold text-white tabular-nums mb-4">
          {localScore} <span className="text-neutral-600">-</span> {opponentScore}
        </div>
        
        {/* Combat Stats */}
        <div className="flex gap-6 mb-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">{playerKills}</div>
            <div className="text-neutral-500">Kills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400 tabular-nums">{botKills}</div>
            <div className="text-neutral-500">Deaths</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400 tabular-nums">
              {botKills > 0 ? (playerKills / botKills).toFixed(1) : playerKills.toFixed(1)}
            </div>
            <div className="text-neutral-500">K/D</div>
          </div>
        </div>
        
        {/* Guest signup CTA */}
        {isGuest && (
          <div className="bg-gradient-to-r from-purple-500/20 to-orange-500/20 border border-purple-500/30 rounded-xl p-4 mb-6 max-w-sm text-center">
            <p className="text-white font-medium mb-1">Ready to compete for real?</p>
            <p className="text-neutral-400 text-sm mb-3">Sign up to play against real players, climb leaderboards, and earn rewards.</p>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity w-full"
            >
              Create Free Account
            </button>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              reset()
              setQuestionIndex(0)
              setGameStarted(false)
              setPlayerHealth(100)
              setBotHealth(100)
              setPlayerKills(0)
              setBotKills(0)
              setBotProjectiles([])
              botStateRef.current.health = 100
            }}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate(isGuest ? '/' : '/dashboard')}
            className="px-6 py-2.5 bg-white/[0.06] text-neutral-300 text-sm font-medium rounded-lg border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            {isGuest ? 'Back to Home' : 'Back to Menu'}
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
      {/* Scoreboard header - scores only, no question (matches multiplayer) */}
      <ArenaScoreboard
        localHealth={localHealth}
        opponentHealth={opponentHealth}
        showHealth={true}
        showQuestion={false}
        onAnswer={handleAnswer}
      />

      {/* Main game area */}
      <div className="flex-1 relative min-h-0">
        {/* Arena container - full bleed like multiplayer */}
        <div className="h-full relative">
          <GameArena
            playerId={userId}
            isPlayer1={true}
            opponentId="bot"
            opponentPosition={botPosition}
            powerUps={powerUps}
            onPositionUpdate={handlePositionUpdate}
            onPowerUpCollect={() => {}}
            mapConfig={selectedMap}
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

          {/* Controls hint - bottom left corner */}
          <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 hidden lg:block z-10">
            <div className="px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
              <p className="text-[9px] text-neutral-500 font-mono">
                WASD move · Click shoot · 1-4 answer
              </p>
            </div>
          </div>

          {/* Leave button - bottom right corner (above mobile controls) */}
          <div className="absolute bottom-3 right-3 z-10" style={{ bottom: isMobileLandscape ? '140px' : '12px' }}>
            <button
              onClick={handleLeave}
              className="px-2 py-1.5 text-[10px] text-neutral-600 hover:text-red-400 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px] min-w-[44px]"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Quiz panel - overlay on mobile landscape, below canvas on desktop/portrait */}
      {isMobileLandscape ? (
        <ArenaQuizPanel
          onAnswer={handleAnswer}
          visible={showQuestion}
          overlayMode={true}
        />
      ) : (
        <ArenaQuizPanel
          onAnswer={handleAnswer}
          visible={showQuestion}
        />
      )}
    </div>
  )
}
