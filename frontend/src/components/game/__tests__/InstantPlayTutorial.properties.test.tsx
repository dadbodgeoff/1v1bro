/**
 * Property-Based Tests for InstantPlayTutorial
 * 
 * Tests auto-dismiss timing and interaction behavior.
 * 
 * @module components/game/__tests__/InstantPlayTutorial.properties
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { InstantPlayTutorial } from '../InstantPlayTutorial'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * **Feature: guest-experience-enhancement, Property 2: Tutorial auto-dismiss timing**
 * 
 * For any tutorial overlay display, if not manually dismissed, the overlay
 * SHALL automatically dismiss after exactly 5000ms (±100ms tolerance).
 * 
 * **Validates: Requirements 1.4**
 */
describe('Property 2: Tutorial auto-dismiss timing', () => {
  it('auto-dismisses after default 5000ms', async () => {
    const onDismiss = vi.fn()
    
    render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={onDismiss}
      />
    )

    // Should not dismiss before 5000ms
    act(() => {
      vi.advanceTimersByTime(4900)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    // Should dismiss at 5000ms
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })


  it('auto-dismisses after custom timeout', async () => {
    const onDismiss = vi.fn()
    const customTimeout = 3000
    
    render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={onDismiss}
        autoDismissMs={customTimeout}
      />
    )

    // Should not dismiss before custom timeout
    act(() => {
      vi.advanceTimersByTime(2900)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    // Should dismiss at custom timeout
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not auto-dismiss when not visible', async () => {
    const onDismiss = vi.fn()
    
    render(
      <InstantPlayTutorial
        visible={false}
        onDismiss={onDismiss}
      />
    )

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on click', async () => {
    const onDismiss = vi.fn()
    
    render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={onDismiss}
      />
    )

    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('clears timer when dismissed manually', async () => {
    const onDismiss = vi.fn()
    
    const { rerender } = render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={onDismiss}
      />
    )

    // Dismiss manually
    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    expect(onDismiss).toHaveBeenCalledTimes(1)

    // Hide the tutorial
    rerender(
      <InstantPlayTutorial
        visible={false}
        onDismiss={onDismiss}
      />
    )

    // Advance past auto-dismiss time
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    // Should not have been called again
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('resets timer when visibility changes', async () => {
    const onDismiss = vi.fn()
    
    const { rerender } = render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={onDismiss}
        autoDismissMs={5000}
      />
    )

    // Advance partway
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    // Hide and show again
    rerender(
      <InstantPlayTutorial
        visible={false}
        onDismiss={onDismiss}
        autoDismissMs={5000}
      />
    )
    rerender(
      <InstantPlayTutorial
        visible={true}
        onDismiss={onDismiss}
        autoDismissMs={5000}
      />
    )

    // Should need full 5000ms again
    act(() => {
      vi.advanceTimersByTime(4900)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('InstantPlayTutorial content', () => {
  it('renders controls heading', () => {
    render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText('Controls')).toBeInTheDocument()
  })

  it('renders dismiss hint', () => {
    render(
      <InstantPlayTutorial
        visible={true}
        onDismiss={() => {}}
      />
    )

    // Should have some dismiss hint text
    const hint = screen.getByText(/anywhere/i)
    expect(hint).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(
      <InstantPlayTutorial
        visible={false}
        onDismiss={() => {}}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
