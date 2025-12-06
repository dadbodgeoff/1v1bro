import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'silver' | 'bronze' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  gradient?: string
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', gradient, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full'
    
    const variants = {
      default: 'bg-slate-700/80 text-slate-200',
      gold: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900',
      silver: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900',
      bronze: 'bg-gradient-to-r from-orange-400 to-amber-600 text-slate-900',
      gradient: gradient ? `bg-gradient-to-r ${gradient} text-white` : 'bg-indigo-500 text-white',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Rank badge with special styling for top 3
export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Badge variant="gold" size="lg">🥇 1st</Badge>
  }
  if (rank === 2) {
    return <Badge variant="silver" size="lg">🥈 2nd</Badge>
  }
  if (rank === 3) {
    return <Badge variant="bronze" size="lg">🥉 3rd</Badge>
  }
  return <Badge variant="default" size="lg">#{rank}</Badge>
}
