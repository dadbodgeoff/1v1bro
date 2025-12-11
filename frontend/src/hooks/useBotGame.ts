/**
 * useBotGame - Custom hook for bot game state management
 * Extracts game logic from BotGame.tsx component
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
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
import type { Vector2 } from '@/game'
import type { MapConfig } from '@/game/config/maps'

interface PracticeQuestion {
  id: number
  text: string
  options: string[]
  correct_answer: string
  category: string
}

const QUESTIONS_PER_GAME = 15

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

  // Answer state
  const [playerAnswer, setPlayerAnswer] = useState<{ answer: string; timeMs: number } | null>(null)
  const [botAnswer, setBotAnswer] = useState<BotAnswer | null>(null)
  const [waitingForBot, setWaitingForBot] = useState(false)
  const botAnswerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Bot mode runs entirely client-side - no server projectile sync needed
  // Player projectiles are handled by local CombatSystem
  // Bot projectiles are handled by BotController and merged into the render

  // Sync health
  useEffect(() => {
    serverHealthCallbackRef.current?.(userId, playerHealth, 100)
    serverHealthCallbackRef.current?.('bot', botHealth, 100)
  }, [playerHealth, botHealth, userId])

  // Bot update loop
  useEffect(() => {
    if (!gameStarted) return
    let last = performance.now()
    let id: number
    const loop = () => {
      const now = performance.now()
      botControllerRef.current.update((now - last) / 1000, playerPositionRef.current)
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [gameStarted])

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

  // Auto-start when questions loaded
  useEffect(() => {
    if (questions.length > 0 && !questionsLoading && !questionsError && !gameStarted) {
      botControllerRef.current.reset()
      setGameStarted(true)
      setStatus('playing')
    }
  }, [questions, questionsLoading, questionsError, gameStarted, setStatus])

  // Set first question
  useEffect(() => {
    if (gameStarted && questions.length > 0 && status === 'playing' && questionIndex === 0 && !currentQuestion) {
      const q = questions[0]
      setQuestion({ qNum: 1, text: q.text, options: q.options, startTime: Date.now() })
    }
  }, [gameStarted, questions, status, questionIndex, currentQuestion, setQuestion])

  // Bot answer timer
  useEffect(() => {
    if (!gameStarted || status !== 'playing' || !currentQuestion || !questions.length) return
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
            questionsAnswered: questions.length,
            questionsCorrect: Math.floor(localScore / 100),
            matchDurationMs: 0,
            category: selectedCategory,
          } as MatchResult)
        }
        setStatus('finished')
      }
    }, 3000)
  }, [playerAnswer, botAnswer, questionIndex, localScore, opponentScore, status, questions, setRoundResult, updateScores, setQuestion, setStatus, isGuest, playerKills, botKills, selectedCategory])

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

  // Note: No setServerProjectilesCallback needed - bot mode runs client-side

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
    botControllerRef.current.reset()
  }, [reset])

  return {
    // Auth
    userId, userName, isGuest, isAuthenticated,
    // Game state
    status, currentQuestion, localScore, opponentScore,
    gameStarted, waitingForBot,
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
    // Handlers
    startGame, handleAnswer, handlePositionUpdate, handleCombatHit,
    handleLeave, handlePlayAgain,
    setServerHealthCallback,
    // For health display
    localHealth: { playerId: userId, health: playerHealth, maxHealth: 100 },
    opponentHealth: { playerId: 'bot', health: botHealth, maxHealth: 100 },
  }
}
