/**
 * useAnimatedValue - React hook for smooth value transitions
 * 
 * Provides spring-based animation for numeric values with:
 * - Configurable spring physics
 * - Pulse trigger on value change
 * - Shake trigger for damage feedback
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  SpringConfig,
  SpringState,
  PulseState,
  ShakeState,
} from './HUDAnimations'
import {
  DEFAULT_SPRING,
  SNAPPY_SPRING,
  updateSpring,
  updatePulse,
  updateShake,
  triggerPulse,
  addTrauma,
} from './HUDAnimations'

export interface AnimatedValueOptions {
  spring?: SpringConfig
  pulseOnChange?: boolean
  pulseDuration?: number
  pulseThreshold?: number  // Minimum change to trigger pulse
}

export interface AnimatedValueState {
  displayValue: number
  scale: number
  opacity: number
  offsetX: number
  offsetY: number
  rotation: number
  isAnimating: boolean
}

export function useAnimatedValue(
  targetValue: number,
  options: AnimatedValueOptions = {}
): AnimatedValueState & { triggerShake: (amount: number) => void } {
  const {
    spring = DEFAULT_SPRING,
    pulseOnChange = true,
    pulseDuration = 0.4,
    pulseThreshold = 0.5,
  } = options

  const springRef = useRef<SpringState>({
    value: targetValue,
    velocity: 0,
    target: targetValue,
  })
  
  const pulseRef = useRef<PulseState>({
    scale: 1,
    opacity: 1,
    active: false,
    time: 0,
  })
  
  const shakeRef = useRef<ShakeState>({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    trauma: 0,
  })
  
  const prevValueRef = useRef(targetValue)
  const rafRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef(performance.now())

  const [state, setState] = useState<AnimatedValueState>({
    displayValue: targetValue,
    scale: 1,
    opacity: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    isAnimating: false,
  })

  // Trigger shake externally (for damage)
  const triggerShake = useCallback((amount: number) => {
    shakeRef.current = addTrauma(shakeRef.current, amount)
  }, [])

  // Update target when value changes
  useEffect(() => {
    const delta = Math.abs(targetValue - prevValueRef.current)
    
    // Update spring target
    springRef.current.target = targetValue
    
    // Trigger pulse if change exceeds threshold
    if (pulseOnChange && delta >= pulseThreshold) {
      pulseRef.current = triggerPulse()
    }
    
    prevValueRef.current = targetValue
  }, [targetValue, pulseOnChange, pulseThreshold])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = performance.now()
      const deltaTime = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      // Update spring
      springRef.current = updateSpring(springRef.current, spring, deltaTime)
      
      // Update pulse
      pulseRef.current = updatePulse(pulseRef.current, deltaTime, pulseDuration)
      
      // Update shake
      shakeRef.current = updateShake(shakeRef.current, deltaTime)

      const isAnimating = 
        Math.abs(springRef.current.value - springRef.current.target) > 0.01 ||
        pulseRef.current.active ||
        shakeRef.current.trauma > 0

      setState({
        displayValue: springRef.current.value,
        scale: pulseRef.current.scale,
        opacity: pulseRef.current.opacity,
        offsetX: shakeRef.current.offsetX,
        offsetY: shakeRef.current.offsetY,
        rotation: shakeRef.current.rotation,
        isAnimating,
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [spring, pulseDuration])

  return { ...state, triggerShake }
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * Hook for score counter with punch effect
 */
export function useAnimatedScore(score: number) {
  return useAnimatedValue(score, {
    spring: SNAPPY_SPRING,
    pulseOnChange: true,
    pulseDuration: 0.35,
    pulseThreshold: 1,
  })
}

/**
 * Hook for distance meter with smooth easing
 */
export function useAnimatedDistance(distance: number) {
  return useAnimatedValue(distance, {
    spring: { stiffness: 100, damping: 15, mass: 1 },
    pulseOnChange: false,
  })
}

/**
 * Hook for speed indicator
 */
export function useAnimatedSpeed(speed: number) {
  return useAnimatedValue(speed, {
    spring: { stiffness: 150, damping: 18, mass: 1 },
    pulseOnChange: true,
    pulseThreshold: 5,
    pulseDuration: 0.25,
  })
}

/**
 * Hook for combo counter with bouncy effect
 */
export function useAnimatedCombo(combo: number) {
  return useAnimatedValue(combo, {
    spring: { stiffness: 200, damping: 10, mass: 0.8 },
    pulseOnChange: true,
    pulseDuration: 0.5,
    pulseThreshold: 1,
  })
}
