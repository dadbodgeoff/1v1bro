/**
 * Property-based tests for AccessibleCard component.
 *
 * Tests correctness properties for ARIA attributes and keyboard accessibility.
 *
 * **Feature: ui-polish-8-of-10**
 */

import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccessibleCard } from '../AccessibleCard'

// ============================================
// Property 7: Interactive elements are keyboard accessible
// ============================================

describe('Property 7: Interactive elements are keyboard accessible', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 7: Interactive elements are keyboard accessible**
   *
   * For any interactive element (buttons, clickable cards), the element should
   * either be a naturally focusable element (button, a, input) or have tabindex >= 0.
   *
   * **Validates: Requirements 3.2**
   */

  it('should have tabindex=0 when onClick is provided', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveAttribute('tabindex', '0')
  })

  it('should not have tabindex when onClick is not provided', () => {
    render(
      <AccessibleCard ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).not.toHaveAttribute('tabindex')
  })

  it('should activate on Enter key press', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should activate on Space key press', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.keyDown(card, { key: ' ' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should not activate on other key presses', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.keyDown(card, { key: 'Tab' })
    fireEvent.keyDown(card, { key: 'Escape' })
    fireEvent.keyDown(card, { key: 'a' })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('property: any interactive card has tabindex >= 0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // ariaLabel
        (ariaLabel) => {
          const onClick = vi.fn()
          const { container } = render(
            <AccessibleCard onClick={onClick} ariaLabel={ariaLabel}>
              Content
            </AccessibleCard>
          )

          const card = container.firstChild as HTMLElement
          const tabIndex = card.getAttribute('tabindex')
          
          // Cleanup
          container.remove()
          
          return tabIndex !== null && parseInt(tabIndex) >= 0
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Property 10: Clickable cards have correct ARIA attributes
// ============================================

describe('Property 10: Clickable cards have correct ARIA attributes', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 10: Clickable cards have correct ARIA attributes**
   *
   * For any AccessibleCard component with an onClick handler, the rendered element
   * should have role="button" and tabindex="0".
   *
   * **Validates: Requirements 3.6**
   */

  it('should have role="button" when onClick is provided', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveAttribute('role', 'button')
  })

  it('should not have role="button" when onClick is not provided', () => {
    render(
      <AccessibleCard ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).not.toHaveAttribute('role')
  })

  it('should have aria-label attribute', () => {
    const onClick = vi.fn()
    const ariaLabel = 'View item details'
    render(
      <AccessibleCard onClick={onClick} ariaLabel={ariaLabel} testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveAttribute('aria-label', ariaLabel)
  })

  it('should have aria-disabled when disabled', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card" disabled>
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveAttribute('aria-disabled', 'true')
  })

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card" disabled>
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.click(card)
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('property: any clickable card has role="button" and tabindex="0"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // ariaLabel
        (ariaLabel) => {
          const onClick = vi.fn()
          const { container } = render(
            <AccessibleCard onClick={onClick} ariaLabel={ariaLabel}>
              Content
            </AccessibleCard>
          )

          const card = container.firstChild as HTMLElement
          const hasRole = card.getAttribute('role') === 'button'
          const hasTabIndex = card.getAttribute('tabindex') === '0'
          
          // Cleanup
          container.remove()
          
          return hasRole && hasTabIndex
        }
      ),
      { numRuns: 50 }
    )
  })

  it('property: aria-label is always present', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // ariaLabel
        fc.boolean(), // hasOnClick
        (ariaLabel, hasOnClick) => {
          const onClick = hasOnClick ? vi.fn() : undefined
          const { container } = render(
            <AccessibleCard onClick={onClick} ariaLabel={ariaLabel}>
              Content
            </AccessibleCard>
          )

          const card = container.firstChild as HTMLElement
          const hasAriaLabel = card.getAttribute('aria-label') === ariaLabel
          
          // Cleanup
          container.remove()
          
          return hasAriaLabel
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Click and Keyboard Interaction Tests
// ============================================

describe('Click and keyboard interactions', () => {
  it('should call onClick on click', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.click(card)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should render children correctly', () => {
    render(
      <AccessibleCard ariaLabel="Test card" testId="test-card">
        <span data-testid="child">Child content</span>
      </AccessibleCard>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Child content')
  })

  it('should apply custom className', () => {
    render(
      <AccessibleCard ariaLabel="Test card" testId="test-card" className="custom-class">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('custom-class')
  })

  it('should include focus-ring and press-feedback classes when interactive', () => {
    const onClick = vi.fn()
    render(
      <AccessibleCard onClick={onClick} ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('focus-ring')
    expect(card).toHaveClass('press-feedback')
    expect(card).toHaveClass('touch-target')
  })

  it('should not include interactive classes when not clickable', () => {
    render(
      <AccessibleCard ariaLabel="Test card" testId="test-card">
        Content
      </AccessibleCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).not.toHaveClass('focus-ring')
    expect(card).not.toHaveClass('press-feedback')
  })
})
