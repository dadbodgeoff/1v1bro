import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { wsService } from '@/services/websocket'
import type {
  QuestionPayload,
  RoundResultPayload,
  GameEndPayload,
} from '@/types/websocket'

export function useGame(lobbyCode?: string) {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const userName = useAuthStore((s) => s.user?.display_name)
  const { players } = useLobbyStore()

  const {
    status,
    currentQuestion,
    localScore,
    opponentScore,
    roundResult,
    finalResult,
    setLobbyId,
    setLocalPlayer,
    setOpponent,
    setQuestion,
    updateScores,
    setRoundResult,
    setFinalResult,
    reset,
  } = useGameStore()

  // Initialize players from lobby
  useEffect(() => {
    if (userId && players.length > 0) {
      setLocalPlayer(userId, userName || null)

      const opponent = players.find((p) => p.id !== userId)
      if (opponent) {
        setOpponent(opponent.id, opponent.display_name)
      }
    }
  }, [userId, userName, players, setLocalPlayer, setOpponent])

  // Connect to WebSocket and subscribe to game events
  useEffect(() => {
    if (!lobbyCode) return

    setLobbyId(lobbyCode)

    const connectAndSubscribe = async () => {
      // Check if already connected (from lobby)
      if (!wsService.isConnected) {
        try {
          await wsService.connect(lobbyCode)
        } catch (err) {
          console.error('Failed to connect:', err)
          navigate('/')
          return
        }
      }

      // Subscribe to game events
      const unsubQuestion = wsService.on('question', (payload) => {
        const data = payload as QuestionPayload
        // Use client's local time when question is received to avoid clock skew issues
        // The server's start_time is only used for synchronization between players
        setQuestion({
          qNum: data.q_num,
          text: data.text,
          options: data.options,
          startTime: Date.now(), // Use local time instead of server time
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

        // Update total scores
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
      })

      return () => {
        unsubQuestion()
        unsubRoundResult()
        unsubGameEnd()
      }
    }

    const cleanup = connectAndSubscribe()

    return () => {
      cleanup.then((fn) => fn?.())
    }
  }, [lobbyCode, navigate, setLobbyId, setQuestion, setRoundResult, setFinalResult, updateScores])

  // Navigate to results when game ends
  useEffect(() => {
    if (finalResult && lobbyCode) {
      navigate(`/results/${lobbyCode}`)
    }
  }, [finalResult, lobbyCode, navigate])

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

  const leaveGame = useCallback(() => {
    wsService.disconnect()
    reset()
    navigate('/')
  }, [reset, navigate])

  return {
    status,
    currentQuestion,
    localScore,
    opponentScore,
    roundResult,
    finalResult,
    sendAnswer,
    leaveGame,
  }
}
