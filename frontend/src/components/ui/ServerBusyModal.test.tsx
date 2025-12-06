/**
 * Tests for ServerBusyModal component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ServerBusyModal } from './ServerBusyModal'

describe('ServerBusyModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(<ServerBusyModal isOpen={false} />)
      
      expect(screen.queryByText('Servers Are Busy')).not.toBeInTheDocument()
    })

    it('renders modal when open', () => {
      render(<ServerBusyModal isOpen={true} />)
      
      expect(screen.getByText('Servers Are Busy')).toBeInTheDocument()
    })

    it('displays default message', () => {
      render(<ServerBusyModal isOpen={true} />)
      
      expect(screen.getByText(/Servers are busy right now/)).toBeInTheDocument()
    })

    it('displays custom message', () => {
      render(<ServerBusyModal isOpen={true} message="Custom error message" />)
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('shows retry button when canRetry is true', () => {
      render(<ServerBusyModal isOpen={true} canRetry={true} />)
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('hides retry button when canRetry is false', () => {
      render(<ServerBusyModal isOpen={true} canRetry={false} />)
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })

    it('shows go back button when onClose provided', () => {
      render(<ServerBusyModal isOpen={true} onClose={() => {}} />)
      
      expect(screen.getByText('Go Back')).toBeInTheDocument()
    })
  })

  describe('retry functionality', () => {
    it('starts countdown on retry click', () => {
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={() => {}} />)
      
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      
      expect(screen.getByText(/Retrying in \d+ seconds/)).toBeInTheDocument()
    })

    it('shows retry now button during countdown', () => {
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={() => {}} />)
      
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      
      expect(screen.getByRole('button', { name: /retry now/i })).toBeInTheDocument()
    })

    it('calls onRetry when countdown completes', () => {
      const onRetry = vi.fn()
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={onRetry} />)
      
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      
      // Fast-forward through countdown (5 seconds for first attempt)
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      
      expect(onRetry).toHaveBeenCalled()
    })

    it('calls onRetry immediately on retry now click', () => {
      const onRetry = vi.fn()
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={onRetry} />)
      
      // Start countdown
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      
      // Click retry now
      fireEvent.click(screen.getByRole('button', { name: /retry now/i }))
      
      expect(onRetry).toHaveBeenCalled()
    })

    it('shows attempt counter after first retry', () => {
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={() => {}} />)
      
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      
      expect(screen.getByText(/Attempt 1 of 5/)).toBeInTheDocument()
    })

    it('increments attempt counter on subsequent retries', () => {
      const onRetry = vi.fn()
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={onRetry} />)
      
      // First retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      
      // Second retry
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      
      expect(screen.getByText(/Attempt 2 of 5/)).toBeInTheDocument()
    })
  })

  describe('close functionality', () => {
    it('calls onClose when go back clicked', () => {
      const onClose = vi.fn()
      render(<ServerBusyModal isOpen={true} onClose={onClose} />)
      
      fireEvent.click(screen.getByText('Go Back'))
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('countdown timer', () => {
    it('decrements countdown each second', () => {
      render(<ServerBusyModal isOpen={true} canRetry={true} onRetry={() => {}} />)
      
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      
      // Initial countdown is 5 seconds
      expect(screen.getByText(/Retrying in 5 seconds/)).toBeInTheDocument()
      
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      expect(screen.getByText(/Retrying in 4 seconds/)).toBeInTheDocument()
    })
  })
})
