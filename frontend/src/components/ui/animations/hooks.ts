/**
 * Animation Hooks - Low-level animation primitives
 * 
 * Provides mouse tracking, spring physics, and tilt effects.
 */

import { useState, useEffect, useRef, type RefObject } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// ============================================
// Mouse Position Hook
// ============================================

interface MousePosition {
  x: number
  y: number
  isInside: boolean
}

export function useMousePosition(ref: RefObject<HTMLElement>): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0.5, y: 0.5, isInside: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setPosition({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)), isInside: true })
    }

    const handleMouseLeave = () => {
      setPosition({ x: 0.5, y: 0.5, isInside: false })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref])

  return position
}

// ============================================
// Spring Animation Hook
// ============================================

interface SpringConfig {
  stiffness?: number  // default: 150
  damping?: number    // default: 15
  mass?: number       // default: 1
}

interface SpringState {
  value: number
  velocity: number
}

export function useSpringAnimation(
  target: number,
  config: SpringConfig = {}
): number {
  const { stiffness = 150, damping = 15, mass = 1 } = config
  const { prefersReducedMotion } = useReducedMotion()
  
  const [current, setCurrent] = useState(target)
  const stateRef = useRef<SpringState>({ value: target, velocity: 0 })
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(performance.now())

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrent(target)
      stateRef.current = { value: target, velocity: 0 }
      return
    }

    const animate = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.064) // Cap at ~15fps minimum
      lastTimeRef.current = time

      const { value, velocity } = stateRef.current
      const displacement = value - target
      
      // Spring physics: F = -kx - cv
      const springForce = -stiffness * displacement
      const dampingForce = -damping * velocity
      const acceleration = (springForce + dampingForce) / mass
      
      const newVelocity = velocity + acceleration * dt
      const newValue = value + newVelocity * dt

      stateRef.current = { value: newValue, velocity: newVelocity }
      setCurrent(newValue)

      // Stop when settled (velocity and displacement both tiny)
      const isSettled = Math.abs(newVelocity) < 0.01 && Math.abs(displacement) < 0.001
      if (!isSettled) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        stateRef.current = { value: target, velocity: 0 }
        setCurrent(target)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, stiffness, damping, mass, prefersReducedMotion])

  return current
}

// ============================================
// Tilt Effect Hook
// ============================================

export interface TiltConfig {
  maxTilt?: number      // degrees, default: 10
  perspective?: number  // px, default: 1000
  scale?: number        // hover scale, default: 1.02
  speed?: number        // transition speed ms, default: 400
  glare?: boolean       // show glare effect, default: false
  glareOpacity?: number // default: 0.2
}

interface TiltStyle {
  transform: string
  transition: string
}

interface GlareStyle {
  background: string
  opacity: number
}

export function useTiltEffect(
  ref: RefObject<HTMLElement>,
  config: TiltConfig = {}
): { tiltStyle: TiltStyle; glareStyle: GlareStyle } {
  const {
    maxTilt = 10,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
    glare = false,
    glareOpacity = 0.2,
  } = config

  const { prefersReducedMotion } = useReducedMotion()
  const mouse = useMousePosition(ref)
  
  // Use spring for smooth tilt
  const tiltX = useSpringAnimation(
    prefersReducedMotion ? 0 : mouse.isInside ? (mouse.y - 0.5) * -maxTilt * 2 : 0,
    { stiffness: 150, damping: 20 }
  )
  const tiltY = useSpringAnimation(
    prefersReducedMotion ? 0 : mouse.isInside ? (mouse.x - 0.5) * maxTilt * 2 : 0,
    { stiffness: 150, damping: 20 }
  )
  const currentScale = useSpringAnimation(
    prefersReducedMotion ? 1 : mouse.isInside ? scale : 1,
    { stiffness: 200, damping: 25 }
  )

  const tiltStyle: TiltStyle = {
    transform: `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${currentScale})`,
    transition: prefersReducedMotion ? 'none' : `transform ${speed}ms ease-out`,
  }

  // Glare follows mouse position
  const glareAngle = Math.atan2(mouse.y - 0.5, mouse.x - 0.5) * (180 / Math.PI) + 90
  const glareStyle: GlareStyle = {
    background: glare && mouse.isInside
      ? `linear-gradient(${glareAngle}deg, rgba(255,255,255,${glareOpacity}) 0%, transparent 80%)`
      : 'transparent',
    opacity: mouse.isInside ? 1 : 0,
  }

  return { tiltStyle, glareStyle }
}
