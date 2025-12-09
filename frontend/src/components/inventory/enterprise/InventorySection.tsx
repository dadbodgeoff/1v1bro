/**
 * InventorySection - Section Container Component
 * 
 * Features:
 * - Section header with icon container (12x12 / 48px)
 * - H2 title (2xl-3xl bold) and subtitle (sm muted)
 * - Badge variants (default, count, new, equipped)
 * - Consistent padding (24px) and margin (48px bottom)
 * - Optional collapse/expand functionality
 * 
 * Typography:
 * - H2: Section title in 2xl-3xl (24-30px) bold with tight tracking
 * - Subtitle: Section description in sm (14px) medium weight, muted color
 */

import { useState } from 'react'
import { cn } from '@/utils/helpers'

type BadgeVariant = 'default' | 'count' | 'new' | 'equipped'

interface InventorySectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: string | number
  badgeVariant?: BadgeVariant
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: React.ReactNode
  className?: string
}

export const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#6366f1] text-white',
  count: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
  new: 'bg-[#10b981] text-white',
  equipped: 'bg-[#10b981] text-white',
}

export function InventorySection({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'default',
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
}: InventorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <section className={cn('mb-12', className)}>
      {/* Section Header */}
      <div 
        className={cn(
          'flex items-start gap-4 mb-6',
          collapsible && 'cursor-pointer'
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        {/* Icon Container */}
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {title}
            </h2>
            
            {/* Badge */}
            {badge !== undefined && (
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-bold',
                badgeStyles[badgeVariant]
              )}>
                {badge}
              </span>
            )}

            {/* Collapse Indicator */}
            {collapsible && (
              <svg
                className={cn(
                  'w-5 h-5 text-[var(--color-text-muted)] transition-transform',
                  isCollapsed && '-rotate-90'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content Area */}
      {!isCollapsed && (
        <div className="p-6 bg-[var(--color-bg-card)] rounded-xl">
          {children}
        </div>
      )}
    </section>
  )
}
