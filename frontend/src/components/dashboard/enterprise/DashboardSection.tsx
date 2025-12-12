/**
 * DashboardSection - Enterprise Section Container Component
 * 
 * A consistent container for dashboard widgets with card styling,
 * optional header with title, badge, and action link.
 * 
 * Features:
 * - Card background (bg-[#111111]) with border styling
 * - Rounded corners (rounded-xl) and consistent padding (p-5)
 * - Optional title with sm font, medium weight, muted color
 * - Badge variants (default, count, new, hot)
 * - Optional action link aligned right
 * - Hover effects for clickable sections
 * - ARIA labels and roles for accessibility
 * - Focus ring styling for keyboard navigation
 * 
 * Props:
 * @param title - Optional section title text
 * @param badge - Optional badge text or number
 * @param badgeVariant - 'default' | 'count' | 'new' | 'hot'
 * @param actionLabel - Optional action link text
 * @param onAction - Callback when action link is clicked
 * @param onClick - Callback when entire section is clicked
 * @param children - Section content
 * @param className - Additional CSS classes
 * @param ariaLabel - Custom ARIA label (defaults to title)
 * @param ariaDescribedBy - ID of element describing this section
 * 
 * Requirements: 1.1, 1.4, 9.1, 9.2, 9.3
 */

import { type ReactNode, type MouseEvent, useId } from 'react'
import { cn } from '@/utils/helpers'

export interface DashboardSectionProps {
  title?: string
  badge?: string | number
  badgeVariant?: 'default' | 'count' | 'new' | 'hot'
  actionLabel?: string
  onAction?: () => void
  onClick?: () => void
  children: ReactNode
  className?: string
  /** Custom ARIA label for the section */
  ariaLabel?: string
  /** ID of element describing this section */
  ariaDescribedBy?: string
}

const badgeStyles = {
  default: 'bg-indigo-500/20 text-indigo-400',
  count: 'bg-white/10 text-neutral-300',
  new: 'bg-emerald-500/20 text-emerald-400',
  hot: 'bg-amber-500/20 text-amber-400',
}

export function DashboardSection({
  title,
  badge,
  badgeVariant = 'default',
  actionLabel,
  onAction,
  onClick,
  children,
  className,
  ariaLabel,
  ariaDescribedBy,
}: DashboardSectionProps) {
  const isClickable = !!onClick
  const titleId = useId()
  const descriptionId = useId()

  const handleActionClick = (e: MouseEvent) => {
    e.stopPropagation()
    onAction?.()
  }

  // Build ARIA label from title and badge if not provided
  const computedAriaLabel = ariaLabel || (title ? `${title}${badge !== undefined ? ` (${badge})` : ''}` : undefined)

  return (
    <section
      className={cn(
        // Base card styling - Requirements 9.1
        'bg-[#111111] border border-white/[0.06] rounded-xl p-5',
        // Hover effects for clickable sections
        isClickable && [
          'cursor-pointer',
          'transition-all duration-200',
          'hover:bg-white/[0.02]',
          'hover:-translate-y-0.5',
        ],
        // Focus ring for keyboard navigation - Requirements 1.1
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
        className
      )}
      onClick={onClick}
      // ARIA attributes - Requirements 1.4
      role="region"
      aria-label={computedAriaLabel}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={ariaDescribedBy || (title ? descriptionId : undefined)}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
    >
      {/* Section Header - Requirements 9.2 */}
      {(title || badge !== undefined || actionLabel) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Title - sm font, medium weight, muted color */}
            {title && (
              <h3 id={titleId} className="text-sm font-medium text-neutral-400">
                {title}
              </h3>
            )}
            
            {/* Badge */}
            {badge !== undefined && (
              <span 
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-full',
                  badgeStyles[badgeVariant]
                )}
                aria-label={typeof badge === 'number' ? `${badge} items` : badge}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Action Link */}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={handleActionClick}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] rounded"
              aria-label={`${actionLabel} for ${title || 'this section'}`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
      
      {/* Hidden description for screen readers */}
      {title && (
        <span id={descriptionId} className="sr-only">
          {isClickable ? `Click to view ${title} details` : `${title} widget`}
        </span>
      )}

      {/* Section Content - Requirements 9.3 */}
      {children}
    </section>
  )
}
