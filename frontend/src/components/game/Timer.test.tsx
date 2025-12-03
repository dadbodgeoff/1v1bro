import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Timer } from './Timer'

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays initial time correctly', () => {
    const onTimeout = vi.fn()
    render(<Timer startTime={Date.now()} duration={30000} onTimeout={onTimeout} />)

    expect(screen.getByText('30s')).toBeInTheDocument()
  })

  it('counts down over time', () => {
    const startTime = Date.now()
    const onTimeout = vi.fn()
    render(<Timer startTime={startTime} duration={30000} onTimeout={onTimeout} />)

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('25s')).toBeInTheDocument()
  })

  it('calls onTimeout when time expires', () => {
    const startTime = Date.now()
    const onTimeout = vi.fn()
    render(<Timer startTime={startTime} duration={5000} onTimeout={onTimeout} />)

    // Advance time past duration
    act(() => {
      vi.advanceTimersByTime(5100)
    })

    // Should be called at least once (the hasTimedOut flag prevents multiple calls)
    expect(onTimeout).toHaveBeenCalled()
  })

  it('shows green color when time > 50%', () => {
    const onTimeout = vi.fn()
    render(<Timer startTime={Date.now()} duration={30000} onTimeout={onTimeout} />)

    const timerText = screen.getByText('30s')
    expect(timerText).toHaveClass('text-green-400')
  })

  it('shows yellow color when time between 20-50%', () => {
    const startTime = Date.now() - 20000 // 20 seconds elapsed
    const onTimeout = vi.fn()
    render(<Timer startTime={startTime} duration={30000} onTimeout={onTimeout} />)

    // Trigger update
    act(() => {
      vi.advanceTimersByTime(100)
    })

    const timerText = screen.getByText('10s')
    expect(timerText).toHaveClass('text-yellow-400')
  })

  it('shows red color when time < 20%', () => {
    const startTime = Date.now() - 28000 // 28 seconds elapsed
    const onTimeout = vi.fn()
    render(<Timer startTime={startTime} duration={30000} onTimeout={onTimeout} />)

    // Trigger update
    act(() => {
      vi.advanceTimersByTime(100)
    })

    const timerText = screen.getByText('2s')
    expect(timerText).toHaveClass('text-red-400')
  })
})
