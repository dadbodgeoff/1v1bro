/**
 * ProfileSection - Enterprise Section Container Component
 * 
 * Features:
 * - Section header with icon container (10x10, 40px)
 * - H2 title (xl-2xl bold) and subtitle (sm muted)
 * - Badge variants (default, count, new)
 * - Consistent padding (24px) and margin (32px bottom)
 * - Optional collapse/expand functionality
 * - Enterprise typography hierarchy (H2 level)
 * 
 * Props:
 * - title: Section title text
 * - subtitle: Optional description text
 * - icon: Optional icon element
 * - badge: Optional badge text or number
 * - badgeVariant: 'default' | 'count' | 'new'
 * - collapsible: Enable collapse functionality
 * - defaultCollapsed: Initial collapsed state
 * - children: Section content
 * - className: Additional CSS classes
 */

import { useState, type ReactNode } from 'react'
import { cn } from '@/utils/helpers'

interface ProfileSectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: string | number
  badgeVariant?: 'default' | 'count' | 'new'
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: ReactNode
  className?: string
}

const badgeStyles = {
  default: 'bg-[#6366f1] text-white',
  count: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-white/10',
  new: 'bg-[#10b981] text-white',
}

export function ProfileSection({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'default',
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
}: ProfileSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      {/* Section Header - H2 level in hierarchy */}
      <div 
        className={cn(
          'flex items-center justify-between mb-4 sm:mb-6',
          collapsible && 'cursor-pointer select-none'
        )}
        onClick={handleToggle}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Icon Container - Responsive sizing */}
          {icon && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-card)] flex items-center justify-center flex-shrink-0 text-[#6366f1] border border-white/5">
              {icon}
            </div>
          )}
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Section Title - Fluid typography */}
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                {title}
              </h2>
              
              {/* Badge */}
              {badge !== undefined && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap',
                  badgeStyles[badgeVariant]
                )}>
                  {badge}
                </span>
              )}
            </div>
            
            {/* Subtitle - Responsive text */}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Collapse Toggle - Touch friendly */}
        {collapsible && (
          <button
            type="button"
            className="p-2 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex-shrink-0"
            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
          >
            <ChevronIcon 
              className={cn(
                'w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-200',
                isCollapsed && '-rotate-90'
              )} 
            />
          </button>
        )}
      </div>

      {/* Section Content */}
      <div 
        className={cn(
          'transition-all duration-200 ease-in-out',
          isCollapsed && 'hidden'
        )}
      >
        {children}
      </div>
    </section>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
