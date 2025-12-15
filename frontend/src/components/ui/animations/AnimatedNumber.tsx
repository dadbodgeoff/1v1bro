/**
 * AnimatedNumber - Smooth counting number display
 * 
 * Features:
 * - Counts up/down with easing
 * - Supports formatting (locale, decimals, prefix/suffix)
 * - Optional "flip" style animation
 * - Respects reduced motion
 * 
 * Usage:
 * <AnimatedNumber value={1234} prefix="$" />
 * <AnimatedNumber value={progress} suffix="%" decimals={1} />
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface AnimatedNumberProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
  value: number
  /** Duration in ms, default 800 */
  duration?: number
  /** Decimal places to show */
  decimals?: number
  /** Prefix string (e.g., "$") */
  prefix?: string
  /** Suffix string (e.g., "%", " XP") */
  suffix?: string
  /** Use locale formatting (commas), default true */
  useLocale?: boolean
  /** Animation style */
  variant?: 'count' | 'flip'
  /** Spring stiffness for flip variant */
  stiffness?: number
  /** Spring damping for flip variant */
  damping?: number
}

export function AnimatedNumber({
  value,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  useLocale = true,
  variant = 'count',
  stiffness = 100,
  damping = 30,
  className,
  ...props
}: AnimatedNumberProps) {
  const { prefersReducedMotion } = useReducedMotion()
  
  if (prefersReducedMotion || variant === 'count') {
    return (
      <CountingNumber
        value={value}
        duration={prefersReducedMotion ? 0 : duration}
        decimals={decimals}
        prefix={prefix}
        suffix={suffix}
        useLocale={useLocale}
        className={className}
        style={props.style as React.CSSProperties}
        id={props.id}
      />
    )
  }

  return (
    <FlipNumber
      value={value}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      useLocale={useLocale}
      stiffness={stiffness}
      damping={damping}
      className={className}
      {...props}
    />
  )
}

// ============================================
// Counting Number (requestAnimationFrame)
// ============================================

interface CountingNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  useLocale?: boolean
  className?: string
  style?: React.CSSProperties
  id?: string
}

function CountingNumber({
  value,
  duration,
  decimals,
  prefix,
  suffix,
  useLocale,
  className,
  style,
  id,
}: CountingNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)
  const frameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (duration === 0) {
      setDisplayValue(value)
      previousValue.current = value
      return
    }

    const from = previousValue.current
    const to = value
    
    if (from === to) return

    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) return

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / (duration || 800), 1)
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased

      setDisplayValue(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        previousValue.current = to
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  const formatted = formatNumber(displayValue, decimals!, useLocale!)

  return (
    <span className={cn('tabular-nums', className)} style={style} id={id}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

// ============================================
// Flip Number (Framer Motion spring)
// ============================================

function FlipNumber({
  value,
  decimals,
  prefix,
  suffix,
  useLocale,
  stiffness,
  damping,
  className,
  ...props
}: Omit<AnimatedNumberProps, 'variant' | 'duration'>) {
  const spring = useSpring(value, { stiffness, damping })
  const display = useTransform(spring, (v) => formatNumber(v, decimals!, useLocale!))

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return (
    <motion.span className={cn('tabular-nums', className)} {...props}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  )
}

// ============================================
// Formatting Helper
// ============================================

function formatNumber(value: number, decimals: number, useLocale: boolean): string {
  const rounded = Number(value.toFixed(decimals))
  
  if (useLocale) {
    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  
  return rounded.toFixed(decimals)
}
