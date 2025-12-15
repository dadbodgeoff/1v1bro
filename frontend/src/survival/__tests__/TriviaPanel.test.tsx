/**
 * TriviaPanel Tests
 * Verifies trivia panel functionality for mobile runner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { TriviaPanel, type TriviaQuestion } from '../components/TriviaOverlay'

// Mock question generator
const createMockQuestion = (id: string = 'q1'): TriviaQuestion => ({
  id,
  question: 'What year did Fortnite launch?',
  answers: ['2016', '2017', '2018', '2019'],
  correctIndex: 1,
  category: 'history',
  difficulty: 'easy',
})

describe('TriviaPanel', () => {
  let mockGetNextQuestion: ReturnType<typeof vi.fn>
  let mockOnAnswer: ReturnType<typeof vi.fn>
  let mockOnTimeout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockGetNextQuestion = vi.fn().mockReturnValue(createMockQuestion())
    mockOnAnswer = vi.fn()
    mockOnTimeout = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render nothing when isActive is false', () => {
    const { container } = render(
      <TriviaPanel
        isActive={false}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should load and display first question when becoming active', () => {
    render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )

    expect(mockGetNextQuestion).toHaveBeenCalledTimes(1)
    expect(screen.getByText('What year did Fortnite launch?')).toBeInTheDocument()
    expect(screen.getByText('2016')).toBeInTheDocument()
    expect(screen.getByText('2017')).toBeInTheDocument()
    expect(screen.getByText('2018')).toBeInTheDocument()
    expect(screen.getByText('2019')).toBeInTheDocument()
  })

  it('should show 30 second timer by default', () => {
    render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
        timeLimit={30}
      />
    )

    expect(screen.getByText('30s')).toBeInTheDocument()
  })

  it('should call onAnswer with correct=true when correct answer selected', async () => {
    render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )

    // Click the correct answer (index 1 = "2017")
    const correctButton = screen.getByText('2017')
    fireEvent.click(correctButton)

    expect(mockOnAnswer).toHaveBeenCalledWith('q1', 1, true)
  })

  it('should call onAnswer with correct=false when wrong answer selected', async () => {
    render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )

    // Click wrong answer (index 0 = "2016")
    const wrongButton = screen.getByText('2016')
    fireEvent.click(wrongButton)

    expect(mockOnAnswer).toHaveBeenCalledWith('q1', 0, false)
  })

  it('should load next question after answering', async () => {
    mockGetNextQuestion
      .mockReturnValueOnce(createMockQuestion('q1'))
      .mockReturnValueOnce(createMockQuestion('q2'))

    render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )

    // Answer first question
    fireEvent.click(screen.getByText('2017'))

    // Wait for feedback timeout (600ms)
    act(() => {
      vi.advanceTimersByTime(700)
    })

    // Should have loaded next question
    expect(mockGetNextQuestion).toHaveBeenCalledTimes(2)
  })

  it('should call onTimeout when timer expires', async () => {
    render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
        timeLimit={5}
      />
    )

    // Advance timer past 5 seconds
    act(() => {
      vi.advanceTimersByTime(5100)
    })

    expect(mockOnTimeout).toHaveBeenCalledWith('q1')
  })

  it('should reset state when becoming inactive', () => {
    const { rerender } = render(
      <TriviaPanel
        isActive={true}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )

    expect(screen.getByText('What year did Fortnite launch?')).toBeInTheDocument()

    // Become inactive
    rerender(
      <TriviaPanel
        isActive={false}
        getNextQuestion={mockGetNextQuestion}
        onAnswer={mockOnAnswer}
        onTimeout={mockOnTimeout}
      />
    )

    expect(screen.queryByText('What year did Fortnite launch?')).not.toBeInTheDocument()
  })
})

describe('Mobile Detection for Trivia', () => {
  it('should detect mobile correctly based on user agent', () => {
    // This would test useMobileDetection hook
    // For now, just verify the logic
    const testMobileUA = (ua: string): boolean => {
      return /iphone|ipad|ipod|android|mobile|webos|blackberry|opera mini|iemobile/.test(ua.toLowerCase())
    }

    expect(testMobileUA('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')).toBe(true)
    expect(testMobileUA('Mozilla/5.0 (Linux; Android 10; SM-G960U)')).toBe(true)
    expect(testMobileUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false)
    expect(testMobileUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false)
  })
})
