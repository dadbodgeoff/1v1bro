/**
 * useQuizEvents - Subscribes to quiz-related WebSocket events
 * Single responsibility: Quiz question/answer flow
 * 
 * Includes stuck question detection and recovery
 */

import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { wsService } from '@/services/websocket'
import type {
  QuestionPayload,
  RoundResultPayload,
  GameEndPayload,
} from '@/types/websocket'

// Question timeout + buffer for network latency
const QUESTION_TIMEOUT_MS = 30000
const STUCK_DETECTION_BUFFER_MS = 8000 // Extra time before considering stuck
const STUCK_CHECK_INTERVAL_MS = 2000

export function useQuizEvents(lobbyCode?: string) {
  const navigate = useNavigate()
  const {
    status,
    currentQuestion,
    localScore,
    opponentScore,
    roundResult,
    finalResult,
    answerSubmitted,
    setLobbyId,
    setQuestion,
    updateScores,
    setRoundResult,
    setFinalResult,
  } = useGameStore()

  // Track when we last received a question to detect stuck state
  const lastQuestionTimeRef = useRef<number>(0)
  const stuckRecoveryAttemptRef = useRef<number>(0)

  // Subscribe to quiz events
  useEffect(() => {
    if (!lobbyCode) return

    setLobbyId(lobbyCode)

    const unsubQuestion = wsService.on('question', (payload) => {
      const data = payload as QuestionPayload
      const localStartTime = Date.now() // Use local time to avoid clock skew
      lastQuestionTimeRef.current = localStartTime
      stuckRecoveryAttemptRef.current = 0 // Reset recovery attempts on new question
      setQuestion({
        qNum: data.q_num,
        text: data.text,
        options: data.options,
        startTime: localStartTime, // Use local time instead of server time
      })
    })

    const unsubRoundResult = wsService.on('round_result', (payload) => {
      const data = payload as RoundResultPayload
      const localId = useAuthStore.getState().user?.id

      setRoundResult({
        correctAnswer: data.correct_answer,
        localScore: data.scores[localId || ''] || 0,
        opponentScore: Object.entries(data.scores).find(([id]) => id !== localId)?.[1] || 0,
        localAnswer: data.answers[localId || ''] || null,
        opponentAnswer: Object.entries(data.answers).find(([id]) => id !== localId)?.[1] || null,
      })

      const localTotal = data.total_scores[localId || ''] || 0
      const opponentTotal = Object.entries(data.total_scores).find(([id]) => id !== localId)?.[1] || 0
      updateScores(localTotal, opponentTotal)
    })

    const unsubGameEnd = wsService.on('game_end', (payload) => {
      const data = payload as GameEndPayload
      const localId = useAuthStore.getState().user?.id

      setFinalResult({
        winnerId: data.winner_id,
        isTie: data.is_tie,
        localScore: data.final_scores[localId || ''] || 0,
        opponentScore: Object.entries(data.final_scores).find(([id]) => id !== localId)?.[1] || 0,
      })
      
      // Extract and store recap for local player (MATCH AUTO-END RECAP)
      if (data.recaps && localId && data.recaps[localId]) {
        useGameStore.getState().setRecap(data.recaps[localId])
      }
    })

    return () => {
      unsubQuestion()
      unsubRoundResult()
      unsubGameEnd()
    }
  }, [lobbyCode, setLobbyId, setQuestion, setRoundResult, setFinalResult, updateScores])

  // Navigate to results when game ends
  useEffect(() => {
    if (finalResult && lobbyCode) {
      navigate(`/results/${lobbyCode}`)
    }
  }, [finalResult, lobbyCode, navigate])

  // Stuck question detection and recovery
  useEffect(() => {
    if (!lobbyCode || !currentQuestion || status !== 'playing') return

    const checkStuck = () => {
      const now = Date.now()
      const questionAge = now - currentQuestion.startTime
      const timeSinceReceived = now - lastQuestionTimeRef.current

      // Question is stuck if:
      // 1. Answer was submitted
      // 2. Question time has expired + buffer
      // 3. We haven't received a new question or round_result
      const isStuck =
        answerSubmitted &&
        questionAge > QUESTION_TIMEOUT_MS + STUCK_DETECTION_BUFFER_MS &&
        timeSinceReceived > QUESTION_TIMEOUT_MS + STUCK_DETECTION_BUFFER_MS

      if (isStuck && stuckRecoveryAttemptRef.current < 3) {
        stuckRecoveryAttemptRef.current++
        console.warn(
          `[Quiz] Question ${currentQuestion.qNum} appears stuck. Recovery attempt ${stuckRecoveryAttemptRef.current}`
        )

        // Request game state resync from server
        wsService.send('request_resync', {
          q_num: currentQuestion.qNum,
          reason: 'stuck_question',
        })
      }
    }

    const interval = setInterval(checkStuck, STUCK_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [lobbyCode, currentQuestion, status, answerSubmitted])

  // Send answer to server
  const sendAnswer = useCallback(
    (answer: string, timeMs: number) => {
      if (currentQuestion) {
        wsService.send('answer', {
          q_num: currentQuestion.qNum,
          answer,
          time_ms: timeMs,
        })
      }
    },
    [currentQuestion]
  )

  return {
    status,
    currentQuestion,
    localScore,
    opponentScore,
    roundResult,
    finalResult,
    sendAnswer,
  }
}
