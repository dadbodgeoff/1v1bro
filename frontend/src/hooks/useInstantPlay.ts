/**
 * useInstantPlay - Hook for InstantPlay game state and logic
 * 
 * Manages:
 * - Game flow phases (category, tutorial, playing, summary)
 * - Bot AI movement and shooting
 * - Quiz question flow
 * - Combat state
 * - Guest session tracking
 * 
 * @module hooks/useInstantPlay
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { API_BASE } from '@/utils/constants'
import {
  getInstantPlayManager,
  GuestSessionManager,
  getEngagementFeedbackSystem,
  getSoftConversionPrompts,
  getNewMilestones,
  type MatchResult,
  type GuestMilestone,
} from '@/game/guest'
import type { Vector2, FireEvent, HitEvent, DeathEvent, Projectile } from '@/game'
import {
  trackInstantPlayStart,
  trackInstantPlayCategorySelect,
  trackInstantPlayTutorialComplete,
  trackInstantPlayMatchStart,
  trackInstantPlayMatchComplete,
  trackInstantPlayPlayAgain,
  trackInstantPlayExit,
  trackConversionPromptShown,
  trackConversionPromptClicked,
  trackConversionPromptDismissed,
} from '@/services/analytics'

interface PracticeQuestion {
  id: number
  text: string
  options: string[]
  correct_answer: string
  category: string
}

const QUESTIONS_PER_GAME = 15
const BOT_SPEED = 120

const PATROL_POINTS: Vector2[] = [
  { x: 1000, y: 200 },
  { x: 1100, y: 500 },
  { x: 900, y: 360 },
  { x: 1050, y: 300 },
]

const BOT_CONFIG = {
  quizAccuracy: 0.55,
  minAnswerTime: 2500,
  maxAnswerTime: 8000,
  shootCooldown: 800,
  shootAccuracy: 0.7,
  aggroRange: 400,
  retreatHealth: 30,
}

type BotBehavior = 'patrol' | 'chase' | 'evade' | 'strafe'


export type InstantPlayPhase = 'category' | 'tutorial' | 'playing' | 'summary'

export function useInstantPlay() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')

  // Game flow state
  const [phase, setPhase] = useState<InstantPlayPhase>('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'general')
  
  // Managers
  const instantPlayManager = getInstantPlayManager()
  const sessionManager = GuestSessionManager.getInstance()
  const feedbackSystem = getEngagementFeedbackSystem()
  const conversionPrompts = getSoftConversionPrompts()

  // Game store
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
  const [botHealth, setBotHealth] = useState(100)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [botProjectiles, setBotProjectiles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([])
  const projectileIdRef = useRef(0)
  const serverProjectilesCallbackRef = useRef<((projectiles: Projectile[]) => void) | null>(null)
  const serverHealthCallbackRef = useRef<((playerId: string, health: number, maxHealth: number) => void) | null>(null)
  
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
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  
  // Combat stats
  const [playerKills, setPlayerKills] = useState(0)
  const [botKills, setBotKills] = useState(0)
  const [answerStreak, setAnswerStreak] = useState(0)
  const [killStreak, setKillStreak] = useState(0)

  // Answer tracking
  const [playerAnswer, setPlayerAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [botAnswer, setBotAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [waitingForBot, setWaitingForBot] = useState(false)
  const botAnswerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Match result for summary
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [newMilestones, setNewMilestones] = useState<GuestMilestone[]>([])
  
  // Conversion prompt
  const [showConversionPrompt, setShowConversionPrompt] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState<ReturnType<typeof conversionPrompts.shouldShowPrompt>>(null)

  // Mobile landscape detection
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)


  // Check orientation
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

  // Initialize on mount
  useEffect(() => {
    instantPlayManager.markInitStart()
    reset()
    setLocalPlayer('guest', 'You')
    setOpponent('bot', 'Practice Bot')
    feedbackSystem.resetStreaks()
    trackInstantPlayStart()
    
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
      trackInstantPlayCategorySelect(categoryFromUrl)
      setPhase('tutorial')
    }
  }, [])

  // Fetch questions
  const fetchQuestions = useCallback(async (category: string) => {
    setQuestionsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/questions/practice/${category}?count=${QUESTIONS_PER_GAME}`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
    } finally {
      setQuestionsLoading(false)
    }
  }, [])

  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category)
    instantPlayManager.setSelectedCategory(category)
    trackInstantPlayCategorySelect(category)
    fetchQuestions(category)
    setPhase('tutorial')
  }, [fetchQuestions])

  // Handle tutorial dismiss
  const handleTutorialDismiss = useCallback(() => {
    setPhase('playing')
    setStatus('playing')
    instantPlayManager.markInitEnd()
    trackInstantPlayTutorialComplete()
    trackInstantPlayMatchStart()
  }, [setStatus])

  // Start first question when ready
  useEffect(() => {
    if (phase === 'playing' && questions.length > 0 && !currentQuestion) {
      const q = questions[0]
      setQuestion({
        qNum: 1,
        text: q.text,
        options: q.options,
        startTime: Date.now(),
      })
    }
  }, [phase, questions, currentQuestion, setQuestion])


  // Bot movement loop
  useEffect(() => {
    if (phase !== 'playing') return
    const updateBot = () => {
      const state = botStateRef.current
      const now = Date.now()
      const deltaTime = 1 / 60
      const dx = playerPosition.x - state.position.x
      const dy = playerPosition.y - state.position.y
      const distToPlayer = Math.sqrt(dx * dx + dy * dy)

      if (now - state.lastBehaviorChange > 2000 + Math.random() * 1500) {
        if (state.health < BOT_CONFIG.retreatHealth) {
          state.behavior = 'evade'
        } else if (distToPlayer < BOT_CONFIG.aggroRange) {
          state.behavior = Math.random() < 0.6 ? 'strafe' : 'chase'
        } else {
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
            state.velocity.x *= 0.85
            state.velocity.y *= 0.85
          }
          break
        }
        case 'strafe': {
          if (distToPlayer > 100 && distToPlayer < 350) {
            const perpX = -dy / distToPlayer
            const perpY = dx / distToPlayer
            state.velocity.x = perpX * BOT_SPEED * state.strafeDirection
            state.velocity.y = perpY * BOT_SPEED * state.strafeDirection
            if (Math.random() < 0.02) state.strafeDirection *= -1
          } else if (distToPlayer <= 100) {
            state.velocity.x = -(dx / distToPlayer) * BOT_SPEED * 0.5
            state.velocity.y = -(dy / distToPlayer) * BOT_SPEED * 0.5
          } else {
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

      state.position.x += state.velocity.x * deltaTime
      state.position.y += state.velocity.y * deltaTime
      state.position.x = Math.max(100, Math.min(1180, state.position.x))
      state.position.y = Math.max(100, Math.min(620, state.position.y))
      setBotPosition({ ...state.position })

      // Bot shooting
      if (distToPlayer < 500 && now - state.lastShot > BOT_CONFIG.shootCooldown) {
        state.lastShot = now
        let shotDx = dx, shotDy = dy
        if (Math.random() > BOT_CONFIG.shootAccuracy) {
          const spread = 0.3
          shotDx += (Math.random() - 0.5) * distToPlayer * spread
          shotDy += (Math.random() - 0.5) * distToPlayer * spread
        }
        const shotDist = Math.sqrt(shotDx * shotDx + shotDy * shotDy)
        setBotProjectiles(prev => [...prev, {
          id: projectileIdRef.current++,
          x: state.position.x,
          y: state.position.y,
          vx: (shotDx / shotDist) * 400,
          vy: (shotDy / shotDist) * 400,
        }])
      }
    }
    const interval = setInterval(updateBot, 1000 / 60)
    return () => clearInterval(interval)
  }, [phase, playerPosition])


  // Update bot projectiles
  useEffect(() => {
    if (phase !== 'playing' || botProjectiles.length === 0) return
    const updateProjectiles = () => {
      const deltaTime = 1 / 60
      setBotProjectiles(prev => {
        const updated: typeof prev = []
        for (const p of prev) {
          const newX = p.x + p.vx * deltaTime
          const newY = p.y + p.vy * deltaTime
          if (newX < 0 || newX > 1280 || newY < 0 || newY > 720) continue
          const dx = newX - playerPosition.x
          const dy = newY - playerPosition.y
          if (Math.sqrt(dx * dx + dy * dy) < 30) {
            setPlayerHealth(prev => {
              const newHealth = Math.max(0, prev - 10)
              if (newHealth <= 0) {
                setBotKills(k => k + 1)
                setKillStreak(0)
                setTimeout(() => setPlayerHealth(100), 1500)
              }
              return newHealth
            })
            continue
          }
          updated.push({ ...p, x: newX, y: newY })
        }
        return updated
      })
    }
    const interval = setInterval(updateProjectiles, 1000 / 60)
    return () => clearInterval(interval)
  }, [phase, botProjectiles.length, playerPosition])

  // Sync bot projectiles to engine
  useEffect(() => {
    if (!serverProjectilesCallbackRef.current) return
    const engineProjectiles: Projectile[] = botProjectiles.map(p => ({
      id: `bot-proj-${p.id}`,
      ownerId: 'bot',
      position: { x: p.x, y: p.y },
      velocity: { x: p.vx, y: p.vy },
      spawnTime: Date.now(),
      spawnPosition: { x: p.x, y: p.y },
      damage: 10,
      isPredicted: false,
    }))
    serverProjectilesCallbackRef.current(engineProjectiles)
  }, [botProjectiles])

  // Sync health to engine
  useEffect(() => {
    if (!serverHealthCallbackRef.current) return
    serverHealthCallbackRef.current('guest', playerHealth, 100)
    serverHealthCallbackRef.current('bot', botHealth, 100)
  }, [playerHealth, botHealth])

  // Schedule bot answer
  useEffect(() => {
    if (phase !== 'playing' || status !== 'playing' || !currentQuestion || questions.length === 0) return
    if (botAnswerTimeoutRef.current) clearTimeout(botAnswerTimeoutRef.current)
    setPlayerAnswer(null)
    setBotAnswer(null)
    setWaitingForBot(false)

    const botDelay = BOT_CONFIG.minAnswerTime + Math.random() * (BOT_CONFIG.maxAnswerTime - BOT_CONFIG.minAnswerTime)
    botAnswerTimeoutRef.current = setTimeout(() => {
      const q = questions[questionIndex]
      if (!q) return
      const botCorrect = Math.random() < BOT_CONFIG.quizAccuracy
      const answer = botCorrect ? q.correct_answer : ['A', 'B', 'C', 'D'].filter(a => a !== q.correct_answer)[Math.floor(Math.random() * 3)]
      setBotAnswer({ answer, timeMs: botDelay })
    }, botDelay)

    return () => { if (botAnswerTimeoutRef.current) clearTimeout(botAnswerTimeoutRef.current) }
  }, [phase, status, currentQuestion, questionIndex, questions])


  // Handle game end
  const handleGameEnd = useCallback(() => {
    const result: MatchResult = {
      won: localScore > opponentScore,
      playerScore: localScore,
      botScore: opponentScore,
      kills: playerKills,
      deaths: botKills,
      questionsAnswered: questions.length,
      questionsCorrect: Math.floor(localScore / 100),
      matchDurationMs: Date.now() - (instantPlayManager.getInitTimeMs() > 0 ? Date.now() - instantPlayManager.getInitTimeMs() : 0),
      category: selectedCategory,
    }

    sessionManager.recordMatchResult(result)
    const session = sessionManager.getSession()
    const newOnes = getNewMilestones(session, session.milestonesAchieved)
    
    newOnes.forEach(m => sessionManager.addMilestone(m.id))
    setNewMilestones(newOnes)
    newOnes.forEach(m => feedbackSystem.showMilestoneUnlocked(m))
    feedbackSystem.showMatchSummary(result, newOnes)
    setMatchResult(result)
    setStatus('finished')
    setPhase('summary')
    
    // Track match completion
    trackInstantPlayMatchComplete(result.won ? 'win' : 'loss', result.matchDurationMs)

    const prompt = conversionPrompts.shouldShowPrompt(session)
    if (prompt) {
      setCurrentPrompt(prompt)
      conversionPrompts.recordPromptInteraction(prompt.id, 'shown')
      trackConversionPromptShown(prompt.id, session.matchesPlayed)
      setTimeout(() => setShowConversionPrompt(true), 2000)
    }
  }, [localScore, opponentScore, playerKills, botKills, questions.length, selectedCategory])

  // Process round when both answered
  useEffect(() => {
    if (!playerAnswer || !botAnswer || status !== 'playing' || questions.length === 0) return
    const q = questions[questionIndex]
    if (!q) return

    const playerCorrect = playerAnswer.answer === q.correct_answer
    const playerScoreVal = playerCorrect ? Math.max(100, 1000 - Math.floor(playerAnswer.timeMs / 30)) : 0
    const botCorrect = botAnswer.answer === q.correct_answer
    const botScoreVal = botCorrect ? Math.max(100, 1000 - Math.floor(botAnswer.timeMs / 30)) : 0

    if (playerCorrect) {
      const newStreak = answerStreak + 1
      setAnswerStreak(newStreak)
      feedbackSystem.onCorrectAnswer(playerAnswer.timeMs, newStreak)
    } else {
      setAnswerStreak(0)
    }

    const correctIndex = q.correct_answer.charCodeAt(0) - 65
    setRoundResult({
      correctAnswer: q.options[correctIndex] || q.correct_answer,
      localScore: playerScoreVal,
      opponentScore: botScoreVal,
      localAnswer: playerAnswer.answer,
      opponentAnswer: botAnswer.answer,
    })
    updateScores(localScore + playerScoreVal, opponentScore + botScoreVal)

    setTimeout(() => {
      const nextIndex = questionIndex + 1
      if (nextIndex < questions.length) {
        setQuestionIndex(nextIndex)
        const nextQ = questions[nextIndex]
        setQuestion({ qNum: nextIndex + 1, text: nextQ.text, options: nextQ.options, startTime: Date.now() })
      } else {
        handleGameEnd()
      }
    }, 3000)
  }, [playerAnswer, botAnswer, questionIndex, localScore, opponentScore, status, questions, handleGameEnd])


  // Handle player answer
  const handleAnswer = useCallback((answer: string, timeMs: number) => {
    if (playerAnswer) return
    setPlayerAnswer({ answer, timeMs })
    if (!botAnswer) setWaitingForBot(true)
  }, [playerAnswer, botAnswer])

  const handlePositionUpdate = useCallback((position: Vector2) => {
    setPlayerPosition(position)
  }, [])

  const handleCombatFire = useCallback((_event: FireEvent) => {}, [])

  const handleCombatHit = useCallback((event: HitEvent) => {
    if (event.targetId === 'bot') {
      setBotHealth(prev => {
        const newHealth = Math.max(0, prev - event.damage)
        botStateRef.current.health = newHealth
        if (newHealth <= 0) {
          const newKillStreak = killStreak + 1
          setPlayerKills(k => k + 1)
          setKillStreak(newKillStreak)
          feedbackSystem.onKillConfirmed(newKillStreak)
          setTimeout(() => {
            setBotHealth(100)
            botStateRef.current.health = 100
            const spawnPoint = PATROL_POINTS[Math.floor(Math.random() * PATROL_POINTS.length)]
            botStateRef.current.position = { ...spawnPoint }
            setBotPosition({ ...spawnPoint })
          }, 1500)
        }
        return newHealth
      })
    }
  }, [killStreak])

  const handleCombatDeath = useCallback((_event: DeathEvent) => {}, [])

  const setServerProjectilesCallback = useCallback((callback: (projectiles: Projectile[]) => void) => {
    serverProjectilesCallbackRef.current = callback
  }, [])

  const setServerHealthCallback = useCallback((callback: (playerId: string, health: number, maxHealth: number) => void) => {
    serverHealthCallbackRef.current = callback
  }, [])

  // Play again handler
  const handlePlayAgain = useCallback(() => {
    const session = sessionManager.getSession()
    trackInstantPlayPlayAgain(session.matchesPlayed)
    
    reset()
    setQuestionIndex(0)
    setPlayerHealth(100)
    setBotHealth(100)
    setPlayerKills(0)
    setBotKills(0)
    setAnswerStreak(0)
    setKillStreak(0)
    setBotProjectiles([])
    botStateRef.current.health = 100
    setMatchResult(null)
    setNewMilestones([])
    feedbackSystem.resetStreaks()
    feedbackSystem.clearXpPopupQueue()
    
    const categoriesInSession = session.categoriesPlayed.filter(c => c === selectedCategory).length
    const suggestion = conversionPrompts.getCategorySuggestion(selectedCategory, categoriesInSession)
    
    if (suggestion) {
      setPhase('category')
    } else {
      fetchQuestions(selectedCategory)
      setPhase('tutorial')
    }
  }, [selectedCategory, fetchQuestions])

  const handleLeave = useCallback(() => {
    const session = sessionManager.getSession()
    trackInstantPlayExit(session.matchesPlayed, session.previewXpEarned)
    reset()
    navigate('/')
  }, [reset, navigate])

  const handlePromptDismiss = useCallback(() => {
    if (currentPrompt) {
      conversionPrompts.recordPromptInteraction(currentPrompt.id, 'dismissed')
      trackConversionPromptDismissed(currentPrompt.id)
    }
    setShowConversionPrompt(false)
  }, [currentPrompt])

  const handlePromptCta = useCallback(() => {
    if (currentPrompt) {
      conversionPrompts.recordPromptInteraction(currentPrompt.id, 'clicked')
      trackConversionPromptClicked(currentPrompt.id)
    }
    setShowConversionPrompt(false)
  }, [currentPrompt])


  return {
    // Phase and flow
    phase,
    selectedCategory,
    questionsLoading,
    
    // Game state
    status,
    currentQuestion,
    localScore,
    opponentScore,
    waitingForBot,
    
    // Positions and health
    botPosition,
    playerHealth,
    botHealth,
    localHealth: { playerId: 'guest', health: playerHealth, maxHealth: 100 },
    opponentHealth: { playerId: 'bot', health: botHealth, maxHealth: 100 },
    
    // Match result
    matchResult,
    newMilestones,
    sessionManager,
    
    // Conversion prompt
    showConversionPrompt,
    currentPrompt,
    
    // Mobile
    isMobileLandscape,
    
    // Handlers
    handleCategorySelect,
    handleTutorialDismiss,
    handleAnswer,
    handlePositionUpdate,
    handleCombatFire,
    handleCombatHit,
    handleCombatDeath,
    setServerProjectilesCallback,
    setServerHealthCallback,
    handlePlayAgain,
    handleLeave,
    handlePromptDismiss,
    handlePromptCta,
  }
}
