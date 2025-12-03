import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('starts with initial state', () => {
    const state = useGameStore.getState()
    expect(state.status).toBe('idle')
    expect(state.localScore).toBe(0)
    expect(state.opponentScore).toBe(0)
    expect(state.currentQuestion).toBeNull()
    expect(state.questionNumber).toBe(0)
  })

  it('setQuestion updates question state and resets answer', () => {
    // First select an answer
    useGameStore.getState().selectAnswer('A')
    useGameStore.getState().submitAnswer()

    // Then set new question
    const question = {
      qNum: 3,
      text: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      startTime: Date.now(),
    }
    useGameStore.getState().setQuestion(question)

    const state = useGameStore.getState()
    expect(state.currentQuestion).toEqual(question)
    expect(state.questionNumber).toBe(3)
    expect(state.selectedAnswer).toBeNull()
    expect(state.answerSubmitted).toBe(false)
    expect(state.status).toBe('playing')
  })

  it('selectAnswer and submitAnswer work correctly', () => {
    useGameStore.getState().selectAnswer('B')
    expect(useGameStore.getState().selectedAnswer).toBe('B')
    expect(useGameStore.getState().answerSubmitted).toBe(false)

    useGameStore.getState().submitAnswer()
    expect(useGameStore.getState().answerSubmitted).toBe(true)
  })

  it('updateScores updates both scores', () => {
    useGameStore.getState().updateScores(500, 750)

    const state = useGameStore.getState()
    expect(state.localScore).toBe(500)
    expect(state.opponentScore).toBe(750)
  })

  it('setRoundResult updates result and status', () => {
    const result = {
      correctAnswer: 'C',
      localScore: 850,
      opponentScore: 0,
      localAnswer: 'C',
      opponentAnswer: 'A',
    }
    useGameStore.getState().setRoundResult(result)

    const state = useGameStore.getState()
    expect(state.roundResult).toEqual(result)
    expect(state.status).toBe('round_result')
  })

  it('setFinalResult updates result and status', () => {
    const result = {
      winnerId: 'player-1',
      isTie: false,
      localScore: 8500,
      opponentScore: 7200,
    }
    useGameStore.getState().setFinalResult(result)

    const state = useGameStore.getState()
    expect(state.finalResult).toEqual(result)
    expect(state.status).toBe('finished')
  })

  it('reset returns to initial state', () => {
    // Set some state
    useGameStore.getState().setStatus('playing')
    useGameStore.getState().updateScores(1000, 500)
    useGameStore.getState().selectAnswer('A')

    // Reset
    useGameStore.getState().reset()

    const state = useGameStore.getState()
    expect(state.status).toBe('idle')
    expect(state.localScore).toBe(0)
    expect(state.selectedAnswer).toBeNull()
  })
})
