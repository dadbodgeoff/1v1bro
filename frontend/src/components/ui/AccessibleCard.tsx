/**
 * AccessibleCard - Wrapper component for keyboard-accessible clickable cards
 * 
 * **Feature: ui-polish-8-of-10, Property 7: Interactive elements are keyboard accessible**
 * **Feature: ui-polish-8-of-10, Property 10: Clickable cards have correct ARIA attributes**
 * **Validates: Requirements 3.2, 3.6**
 */

import { forwardRef, useCallback, type KeyboardEvent, type ReactNode } from 'react'
import clsx from 'clsx'

export interface AccessibleCardProps {
  children: ReactNode
  onClick?: () => void
  ariaLabel: string
  className?: string
  disabled?: boolean
  /** Additional ARIA description for more context */
  ariaDescription?: string
  /** Test ID for testing */
  testId?: string
}

/**
 * AccessibleCard wraps content to make it keyboard accessible.
 * 
 * When onClick is provided:
 * - Adds role="button" for screen readers
 * - Adds tabindex="0" for keyboard focus
 * - Handles Enter and Space key activation
 * - Applies focus-ring and press-feedback classes
 * 
 * When onClick is not provided:
 * - Renders as a simple div without interactive attributes
 */
export const AccessibleCard = forwardRef<HTMLDivElement, AccessibleCardProps>(
  function AccessibleCard(
    {
      children,
      onClick,
      ariaLabel,
      className,
      disabled = false,
      ariaDescription,
      testId,
    },
    ref
  ) {
    const isInteractive = !!onClick && !disabled

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive) return

        // Activate on Enter or Space
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      },
      [isInteractive, onClick]
    )

    const handleClick = useCallback(() => {
      if (!isInteractive) return
      onClick?.()
    }, [isInteractive, onClick])

    // Base classes for all cards
    const baseClasses = 'rounded-lg transition-all duration-200'

    // Interactive classes (focus ring, press feedback, cursor)
    const interactiveClasses = isInteractive
      ? 'focus-ring press-feedback cursor-pointer touch-target'
      : ''

    // Disabled state classes
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''

    return (
      <div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${testId}-description` : undefined}
        aria-disabled={disabled || undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={clsx(baseClasses, interactiveClasses, disabledClasses, className)}
        data-testid={testId}
      >
        {ariaDescription && (
          <span id={`${testId}-description`} className="sr-only">
            {ariaDescription}
          </span>
        )}
        {children}
      </div>
    )
  }
)

export default AccessibleCard
