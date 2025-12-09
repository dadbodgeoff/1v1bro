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
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { type ReactNode, type MouseEvent } from 'react'
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
}: DashboardSectionProps) {
  const isClickable = !!onClick

  const handleActionClick = (e: MouseEvent) => {
    e.stopPropagation()
    onAction?.()
  }

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
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Section Header - Requirements 9.2 */}
      {(title || badge !== undefined || actionLabel) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Title - sm font, medium weight, muted color */}
            {title && (
              <h3 className="text-sm font-medium text-neutral-400">
                {title}
              </h3>
            )}
            
            {/* Badge */}
            {badge !== undefined && (
              <span className={cn(
                'px-2 py-0.5 text-xs font-semibold rounded-full',
                badgeStyles[badgeVariant]
              )}>
                {badge}
              </span>
            )}
          </div>

          {/* Action Link */}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={handleActionClick}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}

      {/* Section Content - Requirements 9.3 */}
      {children}
    </section>
  )
}
