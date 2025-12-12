/**
 * useBotGame - Custom hook for bot game state management
 * Extracts game logic from BotGame.tsx component
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useCosmeticsStore } from '@/stores/cosmeticsStore'
import { useCategories } from '@/hooks/useCategories'
import { API_BASE } from '@/utils/constants'
import { GuestSessionManager, type MatchResult } from '@/game/guest'
import { BotController, DEFAULT_BOT_CONFIG } from '@/game/bot'
import {
  calculateBotAnswer,
  calculateAnswerScore,
  getCorrectAnswerText,
  DEFAULT_BOT_QUIZ_CONFIG,
  type BotAnswer,
} from '@/game/bot/BotQuizBehavior'
import type { Vector2, PowerUpState, PowerUpType } from '@/game'
import type { MapConfig } from '@/game/config/maps'
import { SIMPLE_ARENA } from '@/game/config/maps'

interface PracticeQuestion {
  id: number
  text: string
  options: string[]
  correct_answer: string
  category: string
}

const QUESTIONS_PER_GAME = 15

// Power-up configuration
const POWER_UP_TYPES: PowerUpType[] = ['sos', 'time_steal', 'shield', 'double_points']
const POWER_UP_SPAWN_INTERVAL = 15000 // 15 seconds
const POWER_UP_DURATION = 10000 // 10 seconds before despawn

export function useBotGame() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id) || 'guest-player'
  const userName = useAuthStore((s) => s.user?.display_name) || 'You'
  const isGuest = !isAuthenticated

  const {
    status, currentQuestion, localScore, opponentScore,
    setLocalPlayer, setOpponent, setQuestion, updateScores,
    setRoundResult, setStatus, reset,
  } = useGameStore()
  const { categories, isLoading: categoriesLoading } = useCategories()

  // Cosmetics store for emotes
  const { inventory, loadoutWithDetails, fetchInventory, fetchLoadout } = useCosmeticsStore()

  // Bot controller
  const botControllerRef = useRef(new BotController(DEFAULT_BOT_CONFIG))
  const playerPositionRef = useRef<Vector2>({ x: 200, y: 360 })

  // Bot state
  const [botPosition, setBotPosition] = useState<Vector2>({ x: 1050, y: 360 })
  const [botHealth, setBotHealth] = useState(100)
  const [playerHealth, setPlayerHealth] = useState(100)

  // Health sync callback (for UI display)
  const serverHealthCallbackRef = useRef<((id: string, h: number, m: number) => void) | null>(null)

  // Game state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedMap, setSelectedMap] = useState<MapConfig | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('fortnite')
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)

  // Combat stats
  const [playerKills, setPlayerKills] = useState(0)
  const [botKills, setBotKills] = useState(0)
  
  // Quiz stats - track actual correct answers
  const [playerCorrectAnswers, setPlayerCorrectAnswers] = useState(0)
  const [playerAnsweredCount, setPlayerAnsweredCount] = useState(0)
  
  // Power-up state
  const [powerUps, setPowerUps] = useState<PowerUpState[]>([])
  const powerUpIdRef = useRef(0)
  const lastPowerUpSpawnRef = useRef(0)

  // Answer state
  const [playerAnswer, setPlayerAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [botAnswer, setBotAnswer] = useState<BotAnswer | null>(null)
  const [waitingForBot, setWaitingForBot] = useState(false)
  const botAnswerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Countdown state - game doesn't truly start until countdown completes
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownComplete, setCountdownComplete] = useState(false)

  // Initialize bot callbacks
  useEffect(() => {
    botControllerRef.current.setCallbacks({
      onPositionUpdate: (pos) => setBotPosition({ ...pos }),
      onHealthUpdate: (h) => setBotHealth(h),
      onBotDeath: () => setPlayerKills(k => k + 1),
      onPlayerHit: (dmg) => {
        setPlayerHealth(prev => {
          const newH = Math.max(0, prev - dmg)
          if (newH <= 0) {
            setBotKills(k => k + 1)
            setTimeout(() => setPlayerHealth(100), 1500)
          }
          return newH
        })
      },
    })
  }, [])

  // Initialize game store
  useEffect(() => {
    reset()
    setLocalPlayer(userId, userName)
    setOpponent('bot', 'Practice Bot')
    setStatus('waiting')
  }, [userId, userName, reset, setLocalPlayer, setOpponent, setStatus])

  // Fetch inventory and loadout for emotes (authenticated users only)
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchInventory(token)
      fetchLoadout(token)
    }
  }, [isAuthenticated, token, fetchInventory, fetchLoadout])

  // Derive emote data from inventory and loadout
  const inventoryEmotes = inventory
    .filter(item => item.cosmetic?.type === 'emote')
    .map(item => ({
      id: item.cosmetic!.id,
      name: item.cosmetic!.name,
      image_url: item.cosmetic!.image_url || '',
    }))

  const equippedEmoteId = loadoutWithDetails?.emote_equipped?.id ?? null

  // Derive skin data from loadout
  const equippedSkin = loadoutWithDetails?.skin_equipped
    ? {
        skinId: loadoutWithDetails.skin_equipped.skin_id || undefined,
        spriteSheetUrl: loadoutWithDetails.skin_equipped.sprite_sheet_url || undefined,
        metadataUrl: loadoutWithDetails.skin_equipped.sprite_meta_url || undefined,
      }
    : isGuest
      ? {
          // Guest default skin - Frostborne Valkyrie
          spriteSheetUrl: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Frostborne Valkyrie.jpg',
          metadataUrl: undefined,
        }
      : undefined

  // Bot skin - pink for contrast
  const opponentSkin = { skinId: 'pink' as const }

  // Bot mode runs entirely client-side
  // Player projectiles are handled by local CombatSystem
  // Bot projectiles are synced via callback to GameEngine for rendering
  const serverProjectilesCallbackRef = useRef<((projectiles: import('@/game').Projectile[]) => void) | null>(null)

  // Sync health
  useEffect(() => {
    serverHealthCallbackRef.current?.(userId, playerHealth, 100)
    serverHealthCallbackRef.current?.('bot', botHealth, 100)
  }, [playerHealth, botHealth, userId])

  // Bot update loop - also syncs bot projectiles to GameEngine
  // Only runs after countdown completes to prevent bot moving before map renders
  useEffect(() => {
    if (!gameStarted || !countdownComplete) return
    let last = performance.now()
    let id: number
    const loop = () => {
      const now = performance.now()
      botControllerRef.current.update((now - last) / 1000, playerPositionRef.current)
      
      // Sync bot projectiles to GameEngine for rendering
      const botProjectiles = botControllerRef.current.getProjectiles()
      serverProjectilesCallbackRef.current?.(botProjectiles)
      
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [gameStarted, countdownComplete])

  // Power-up spawning loop
  useEffect(() => {
    if (!gameStarted) return
    
    const spawnPowerUp = () => {
      const now = Date.now()
      if (now - lastPowerUpSpawnRef.current < POWER_UP_SPAWN_INTERVAL) return
      
      // Get spawn positions from selected map or default
      const spawnPositions = selectedMap?.powerUpSpawns || SIMPLE_ARENA.powerUpSpawns
      if (spawnPositions.length === 0) return
      
      // Pick random position and type
      const pos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)]
      const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)]
      
      const newPowerUp: PowerUpState = {
        id: powerUpIdRef.current++,
        position: { x: pos.x, y: pos.y },
        type,
        active: true,
        collected: false,
      }
      
      setPowerUps(prev => [...prev, newPowerUp])
      lastPowerUpSpawnRef.current = now
      
      // Auto-despawn after duration
      setTimeout(() => {
        setPowerUps(prev => prev.filter(p => p.id !== newPowerUp.id))
      }, POWER_UP_DURATION)
    }
    
    // Spawn initial power-up after 3 seconds
    const initialTimeout = setTimeout(() => {
      spawnPowerUp()
    }, 3000)
    
    // Then spawn periodically
    const interval = setInterval(spawnPowerUp, POWER_UP_SPAWN_INTERVAL)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [gameStarted, selectedMap])

  // Fetch questions
  const fetchQuestions = useCallback(async (cat: string) => {
    setQuestionsLoading(true)
    setQuestionsError(null)
    setQuestions([])
    try {
      const res = await fetch(`${API_BASE}/questions/practice/${cat}?count=${QUESTIONS_PER_GAME}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.questions?.length) {
          setQuestionsError('No questions available.')
          return
        }
        setQuestions(data.questions)
      } else {
        setQuestionsError('Failed to load questions.')
      }
    } catch {
      setQuestionsError('Network error.')
    } finally {
      setQuestionsLoading(false)
    }
  }, [token])

  // Start game
  const startGame = useCallback(async () => {
    await fetchQuestions(selectedCategory)
  }, [selectedCategory, fetchQuestions])

  // Auto-start when questions loaded - begin countdown
  useEffect(() => {
    if (questions.length > 0 && !questionsLoading && !questionsError && !gameStarted) {
      botControllerRef.current.reset()
      setGameStarted(true)
      setCountdown(3) // Start 3-second countdown
      setCountdownComplete(false)
      setStatus('playing')
    }
  }, [questions, questionsLoading, questionsError, gameStarted, setStatus])

  // Countdown timer - ticks down from 3 to 0, then enables gameplay
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdownComplete(true)
      setCountdown(null)
      return
    }
    const timer = setTimeout(() => {
      setCountdown(c => (c !== null ? c - 1 : null))
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Set first question - only after countdown completes
  useEffect(() => {
    if (gameStarted && countdownComplete && questions.length > 0 && status === 'playing' && questionIndex === 0 && !currentQuestion) {
      const q = questions[0]
      setQuestion({ qNum: 1, text: q.text, options: q.options, startTime: Date.now() })
    }
  }, [gameStarted, countdownComplete, questions, status, questionIndex, currentQuestion, setQuestion])

  // Bot answer timer - only after countdown completes
  useEffect(() => {
    if (!gameStarted || !countdownComplete || status !== 'playing' || !currentQuestion || !questions.length) return
    if (botAnswerTimeoutRef.current) clearTimeout(botAnswerTimeoutRef.current)
    setPlayerAnswer(null)
    setBotAnswer(null)
    setWaitingForBot(false)

    const q = questions[questionIndex]
    if (!q) return

    const botResult = calculateBotAnswer(q, DEFAULT_BOT_QUIZ_CONFIG)
    botAnswerTimeoutRef.current = setTimeout(() => {
      setBotAnswer(botResult)
    }, botResult.timeMs)

    return () => {
      if (botAnswerTimeoutRef.current) clearTimeout(botAnswerTimeoutRef.current)
    }
  }, [gameStarted, status, currentQuestion, questionIndex, questions])

  // Process answers when both ready
  useEffect(() => {
    if (!playerAnswer || !botAnswer || status !== 'playing' || !questions.length) return
    const q = questions[questionIndex]
    if (!q) return

    const pScore = calculateAnswerScore(playerAnswer.answer, q.correct_answer, playerAnswer.timeMs)
    const bScore = calculateAnswerScore(botAnswer.answer, q.correct_answer, botAnswer.timeMs)
    const correctText = getCorrectAnswerText(q)
    
    // Track actual correct answers (pScore > 0 means correct)
    const playerWasCorrect = pScore > 0
    if (playerWasCorrect) {
      setPlayerCorrectAnswers(prev => prev + 1)
    }
    setPlayerAnsweredCount(prev => prev + 1)

    setRoundResult({
      correctAnswer: correctText,
      localScore: pScore,
      opponentScore: bScore,
      localAnswer: playerAnswer.answer,
      opponentAnswer: botAnswer.answer,
    })
    updateScores(localScore + pScore, opponentScore + bScore)

    setTimeout(() => {
      const next = questionIndex + 1
      if (next < questions.length) {
        setQuestionIndex(next)
        const nq = questions[next]
        setQuestion({ qNum: next + 1, text: nq.text, options: nq.options, startTime: Date.now() })
      } else {
        if (isGuest) {
          GuestSessionManager.getInstance().recordMatchResult({
            won: localScore > opponentScore,
            playerScore: localScore,
            botScore: opponentScore,
            kills: playerKills,
            deaths: botKills,
            questionsAnswered: playerAnsweredCount + (playerWasCorrect ? 1 : 1), // Include current answer
            questionsCorrect: playerCorrectAnswers + (playerWasCorrect ? 1 : 0), // Include current if correct
            matchDurationMs: 0,
            category: selectedCategory,
          } as MatchResult)
        }
        setStatus('finished')
      }
    }, 3000)
  }, [playerAnswer, botAnswer, questionIndex, localScore, opponentScore, status, questions, setRoundResult, updateScores, setQuestion, setStatus, isGuest, playerKills, botKills, selectedCategory, playerCorrectAnswers, playerAnsweredCount])

  // Handlers
  const handleAnswer = useCallback((ans: string, time: number) => {
    if (playerAnswer) return
    setPlayerAnswer({ answer: ans, timeMs: time })
    if (!botAnswer) setWaitingForBot(true)
  }, [playerAnswer, botAnswer])

  const handlePositionUpdate = useCallback((pos: Vector2) => {
    playerPositionRef.current = pos
  }, [])

  const handleCombatHit = useCallback((targetId: string, damage: number) => {
    if (targetId === 'bot') botControllerRef.current.applyDamage(damage)
  }, [])

  // Handle power-up collection
  const handlePowerUpCollect = useCallback((powerUpId: number) => {
    setPowerUps(prev => prev.map(p => 
      p.id === powerUpId ? { ...p, collected: true, active: false } : p
    ))
    // Remove after brief delay for collection animation
    setTimeout(() => {
      setPowerUps(prev => prev.filter(p => p.id !== powerUpId))
    }, 500)
  }, [])

  // Handle local hazard damage (offline mode - player steps on hazard)
  const handleLocalHazardDamage = useCallback((targetId: string, damage: number) => {
    if (targetId === userId) {
      setPlayerHealth(prev => {
        const newH = Math.max(0, prev - damage)
        if (newH <= 0) {
          // Player died to hazard
          setBotKills(k => k + 1)
          setTimeout(() => setPlayerHealth(100), 1500)
        }
        return newH
      })
    }
  }, [userId])

  // Handle local trap triggered (offline mode - player triggers trap)
  const handleLocalTrapTriggered = useCallback((targetId: string, damage: number) => {
    if (targetId === userId) {
      setPlayerHealth(prev => {
        const newH = Math.max(0, prev - damage)
        if (newH <= 0) {
          // Player died to trap
          setBotKills(k => k + 1)
          setTimeout(() => setPlayerHealth(100), 1500)
        }
        return newH
      })
    }
  }, [userId])

  // Bot projectiles callback - syncs bot projectiles to GameEngine for rendering
  const setServerProjectilesCallback = useCallback((cb: (projectiles: import('@/game').Projectile[]) => void) => {
    serverProjectilesCallbackRef.current = cb
  }, [])

  const setServerHealthCallback = useCallback((cb: (id: string, h: number, m: number) => void) => {
    serverHealthCallbackRef.current = cb
  }, [])

  const handleLeave = useCallback(() => {
    reset()
    navigate(isGuest ? '/' : '/dashboard')
  }, [reset, navigate, isGuest])

  const handlePlayAgain = useCallback(() => {
    reset()
    setQuestionIndex(0)
    setGameStarted(false)
    setPlayerHealth(100)
    setBotHealth(100)
    setPlayerKills(0)
    setBotKills(0)
    setPlayerCorrectAnswers(0)
    setPlayerAnsweredCount(0)
    setCountdown(null)
    setCountdownComplete(false)
    botControllerRef.current.reset()
  }, [reset])

  return {
    // Auth
    userId, userName, isGuest, isAuthenticated,
    // Game state
    status, currentQuestion, localScore, opponentScore,
    gameStarted, waitingForBot,
    // Countdown
    countdown, countdownComplete,
    // Questions
    questions, questionsLoading, questionsError,
    selectedCategory, setSelectedCategory,
    // Map
    selectedMap, setSelectedMap,
    // Categories
    categories, categoriesLoading,
    // Combat
    botPosition, botHealth, playerHealth,
    playerKills, botKills,
    // Power-ups
    powerUps, handlePowerUpCollect,
    // Handlers
    startGame, handleAnswer, handlePositionUpdate, handleCombatHit,
    handleLeave, handlePlayAgain,
    setServerProjectilesCallback,
    setServerHealthCallback,
    // Local hazard/trap damage handlers for offline mode
    handleLocalHazardDamage,
    handleLocalTrapTriggered,
    // For health display
    localHealth: { playerId: userId, health: playerHealth, maxHealth: 100 },
    opponentHealth: { playerId: 'bot', health: botHealth, maxHealth: 100 },
    // Emotes
    inventoryEmotes,
    equippedEmoteId,
    // Skins
    equippedSkin,
    opponentSkin,
  }
}
