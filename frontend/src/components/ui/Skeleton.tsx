import { cn } from '@/utils/helpers'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'text'
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const variants = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-700/50',
        variants[variant],
        className
      )}
    />
  )
}

export function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
      <Skeleton className="w-12 h-8" />
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-32" />
        <Skeleton variant="text" className="w-20" />
      </div>
      <Skeleton className="w-20 h-8" />
    </div>
  )
}
