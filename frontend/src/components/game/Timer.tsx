import { useEffect, useState } from 'react'
import { cn } from '@/utils/helpers'
import { QUESTION_TIME_MS } from '@/utils/constants'

interface TimerProps {
  startTime: number
  duration?: number
  onTimeout: () => void
}

export function Timer({ startTime, duration = QUESTION_TIME_MS, onTimeout }: TimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newRemaining = Math.max(0, duration - elapsed)
      setRemaining(newRemaining)

      if (newRemaining === 0 && !hasTimedOut) {
        setHasTimedOut(true)
        onTimeout()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [startTime, duration, onTimeout, hasTimedOut])

  const seconds = Math.ceil(remaining / 1000)
  const progress = remaining / duration

  // Color based on time remaining
  const getTextColor = () => {
    if (progress > 0.5) return 'text-green-400'
    if (progress > 0.2) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = () => {
    if (progress > 0.5) return 'bg-green-500'
    if (progress > 0.2) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      {/* Numeric display */}
      <span className={cn('text-2xl font-bold tabular-nums min-w-[3ch]', getTextColor())}>
        {seconds}s
      </span>

      {/* Progress bar */}
      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-100', getBarColor())}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
