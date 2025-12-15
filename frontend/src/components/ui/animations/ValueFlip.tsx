/**
 * ValueFlip - Animated value change with flip/roll effect
 * 
 * Features:
 * - Digit-by-digit flip animation
 * - Direction-aware (up for increase, down for decrease)
 * - Color flash on change
 * - Respects reduced motion
 * 
 * Usage:
 * <ValueFlip value={score} />
 * <ValueFlip value={coins} prefix="$" flashColor="#10b981" />
 */

import { useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface ValueFlipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number
  /** Prefix string */
  prefix?: string
  /** Suffix string */
  suffix?: string
  /** Use locale formatting */
  useLocale?: boolean
  /** Flash color on value change */
  flashColor?: string
  /** Flash duration in ms */
  flashDuration?: number
  /** Animation duration per digit in seconds */
  digitDuration?: number
}

export function ValueFlip({
  value,
  prefix = '',
  suffix = '',
  useLocale = true,
  flashColor,
  flashDuration = 300,
  digitDuration = 0.3,
  className,
  ...props
}: ValueFlipProps) {
  const { prefersReducedMotion } = useReducedMotion()
  const previousValue = useRef(value)
  const [isFlashing, setIsFlashing] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down'>('up')

  // Format the number
  const formatted = useLocale 
    ? Math.floor(value).toLocaleString()
    : Math.floor(value).toString()

  // Detect value changes
  useEffect(() => {
    if (value !== previousValue.current) {
      setDirection(value > previousValue.current ? 'up' : 'down')
      
      if (flashColor) {
        setIsFlashing(true)
        const timer = setTimeout(() => setIsFlashing(false), flashDuration)
        return () => clearTimeout(timer)
      }
      
      previousValue.current = value
    }
  }, [value, flashColor, flashDuration])

  // Simple display for reduced motion
  if (prefersReducedMotion) {
    return (
      <span 
        className={cn('tabular-nums', className)} 
        style={isFlashing && flashColor ? { color: flashColor } : undefined}
        {...props}
      >
        {prefix}{formatted}{suffix}
      </span>
    )
  }

  return (
    <span 
      className={cn('inline-flex items-baseline tabular-nums', className)}
      {...props}
    >
      {prefix && <span>{prefix}</span>}
      
      <span className="inline-flex overflow-hidden">
        {formatted.split('').map((char, index) => (
          <FlipDigit
            key={`${index}-${char}`}
            char={char}
            direction={direction}
            duration={digitDuration}
            delay={index * 0.02}
            flashColor={isFlashing ? flashColor : undefined}
          />
        ))}
      </span>
      
      {suffix && <span>{suffix}</span>}
    </span>
  )
}

// ============================================
// Individual Flip Digit
// ============================================

interface FlipDigitProps {
  char: string
  direction: 'up' | 'down'
  duration: number
  delay: number
  flashColor?: string
}

function FlipDigit({ char, direction, duration, delay, flashColor }: FlipDigitProps) {
  const isNumber = /\d/.test(char)
  
  // Don't animate separators (commas, periods)
  if (!isNumber) {
    return <span>{char}</span>
  }

  const yOffset = direction === 'up' ? 20 : -20

  return (
    <span className="relative inline-block" style={{ width: '0.6em' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={char}
          className="inline-block"
          initial={{ y: yOffset, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            color: flashColor || 'inherit',
          }}
          exit={{ y: -yOffset, opacity: 0 }}
          transition={{
            duration,
            delay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ============================================
// Compact variant for inline use
// ============================================

export interface CompactValueFlipProps extends Omit<ValueFlipProps, 'flashColor' | 'flashDuration'> {
  /** Show +/- indicator */
  showDelta?: boolean
  /** Color for positive changes */
  positiveColor?: string
  /** Color for negative changes */
  negativeColor?: string
}

export function CompactValueFlip({
  value,
  showDelta = false,
  positiveColor = '#10b981',
  negativeColor = '#f43f5e',
  className,
  ...props
}: CompactValueFlipProps) {
  const previousValue = useRef(value)
  const [delta, setDelta] = useState(0)
  const [showingDelta, setShowingDelta] = useState(false)

  useEffect(() => {
    const diff = value - previousValue.current
    if (diff !== 0 && showDelta) {
      setDelta(diff)
      setShowingDelta(true)
      const timer = setTimeout(() => setShowingDelta(false), 1500)
      previousValue.current = value
      return () => clearTimeout(timer)
    }
    previousValue.current = value
  }, [value, showDelta])

  const deltaColor = delta > 0 ? positiveColor : negativeColor

  return (
    <span className={cn('relative inline-flex items-baseline gap-1', className)}>
      <ValueFlip 
        value={value} 
        flashColor={delta !== 0 ? deltaColor : undefined}
        {...props} 
      />
      
      <AnimatePresence>
        {showingDelta && delta !== 0 && (
          <motion.span
            className="text-xs font-medium"
            style={{ color: deltaColor }}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {delta > 0 ? '+' : ''}{delta.toLocaleString()}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
