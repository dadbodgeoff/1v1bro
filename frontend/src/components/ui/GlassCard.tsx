import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow'
  gradient?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', gradient, hover = false, padding = 'md', children, ...props }, ref) => {
    const baseStyles = 'relative rounded-2xl backdrop-blur-xl border transition-all duration-300'
    
    const variants = {
      default: 'bg-slate-800/40 border-slate-700/50',
      elevated: 'bg-slate-800/60 border-slate-600/50 shadow-xl shadow-black/20',
      glow: 'bg-slate-800/50 border-slate-600/50 shadow-lg',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    }

    const hoverStyles = hover
      ? 'hover:bg-slate-800/60 hover:border-slate-600/70 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer'
      : ''

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], hoverStyles, className)}
        {...props}
      >
        {gradient && (
          <div
            className={cn(
              'absolute inset-0 rounded-2xl opacity-10 bg-gradient-to-br pointer-events-none',
              gradient
            )}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'
