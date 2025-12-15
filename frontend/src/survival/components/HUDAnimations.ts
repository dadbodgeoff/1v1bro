/**
 * HUDAnimations - Animation utilities for AAA-quality HUD elements
 * 
 * Provides:
 * - Spring physics for smooth value transitions
 * - Pulse effects for score updates
 * - Shake effects for damage feedback
 * - Easing functions for distance meter
 */

// ============================================
// Spring Physics
// ============================================

export interface SpringConfig {
  stiffness: number   // Higher = snappier (default: 180)
  damping: number     // Higher = less bounce (default: 12)
  mass: number        // Higher = more inertia (default: 1)
}

export interface SpringState {
  value: number
  velocity: number
  target: number
}

export const DEFAULT_SPRING: SpringConfig = {
  stiffness: 180,
  damping: 12,
  mass: 1,
}

export const SNAPPY_SPRING: SpringConfig = {
  stiffness: 300,
  damping: 20,
  mass: 1,
}

export const BOUNCY_SPRING: SpringConfig = {
  stiffness: 120,
  damping: 8,
  mass: 1,
}

/**
 * Update spring physics - call every frame
 * Returns new state with updated value and velocity
 */
export function updateSpring(
  state: SpringState,
  config: SpringConfig,
  deltaTime: number
): SpringState {
  const { stiffness, damping, mass } = config
  const { value, velocity, target } = state
  
  // Clamp deltaTime to prevent instability
  const dt = Math.min(deltaTime, 0.064)
  
  // Spring force: F = -k * x
  const displacement = value - target
  const springForce = -stiffness * displacement
  
  // Damping force: F = -c * v
  const dampingForce = -damping * velocity
  
  // Acceleration: a = F / m
  const acceleration = (springForce + dampingForce) / mass
  
  // Semi-implicit Euler integration
  const newVelocity = velocity + acceleration * dt
  const newValue = value + newVelocity * dt
  
  // Snap to target if close enough and slow enough
  if (Math.abs(newValue - target) < 0.001 && Math.abs(newVelocity) < 0.01) {
    return { value: target, velocity: 0, target }
  }
  
  return { value: newValue, velocity: newVelocity, target }
}

// ============================================
// Pulse Effect
// ============================================

export interface PulseState {
  scale: number
  opacity: number
  active: boolean
  time: number
}

/**
 * Create a punch-in pulse effect
 * Scale: 1.0 -> 1.3 -> 1.0 with overshoot
 */
export function updatePulse(
  state: PulseState,
  deltaTime: number,
  duration: number = 0.4
): PulseState {
  if (!state.active) {
    return { ...state, scale: 1, opacity: 1 }
  }
  
  const newTime = state.time + deltaTime
  const progress = Math.min(newTime / duration, 1)
  
  // Elastic ease-out for punch effect
  const elasticOut = (t: number): number => {
    if (t === 0 || t === 1) return t
    const p = 0.3
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
  }
  
  // Scale punch: 1.0 -> 1.4 -> 1.0
  const scalePeak = 1.4
  const scaleProgress = progress < 0.3 
    ? progress / 0.3  // Rise to peak
    : 1 - ((progress - 0.3) / 0.7)  // Fall back
  const scale = 1 + (scalePeak - 1) * elasticOut(scaleProgress)
  
  // Glow opacity: 1.0 -> 1.5 -> 1.0
  const opacity = 1 + 0.5 * Math.sin(progress * Math.PI)
  
  if (progress >= 1) {
    return { scale: 1, opacity: 1, active: false, time: 0 }
  }
  
  return { scale, opacity, active: true, time: newTime }
}

export function triggerPulse(): PulseState {
  return { scale: 1, opacity: 1, active: true, time: 0 }
}

// ============================================
// Shake Effect
// ============================================

export interface ShakeState {
  offsetX: number
  offsetY: number
  rotation: number
  trauma: number  // 0-1, decays over time
}

/**
 * Update trauma-based shake effect
 * Uses Perlin-like noise for organic movement
 */
export function updateShake(
  state: ShakeState,
  deltaTime: number,
  maxOffset: number = 8,
  maxRotation: number = 3
): ShakeState {
  if (state.trauma <= 0) {
    return { offsetX: 0, offsetY: 0, rotation: 0, trauma: 0 }
  }
  
  // Decay trauma over time
  const decayRate = 2.0  // Full decay in 0.5 seconds
  const newTrauma = Math.max(0, state.trauma - deltaTime * decayRate)
  
  // Shake intensity is trauma squared (feels more natural)
  const shake = newTrauma * newTrauma
  
  // Use time-based noise for organic movement
  const time = Date.now() / 1000
  const noiseX = Math.sin(time * 25) * Math.cos(time * 17)
  const noiseY = Math.sin(time * 23) * Math.cos(time * 19)
  const noiseR = Math.sin(time * 21) * Math.cos(time * 15)
  
  return {
    offsetX: noiseX * shake * maxOffset,
    offsetY: noiseY * shake * maxOffset,
    rotation: noiseR * shake * maxRotation,
    trauma: newTrauma,
  }
}

export function addTrauma(state: ShakeState, amount: number): ShakeState {
  return {
    ...state,
    trauma: Math.min(1, state.trauma + amount),
  }
}

// ============================================
// Easing Functions
// ============================================

export const easing = {
  // Smooth deceleration
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  
  // Smooth acceleration
  easeInCubic: (t: number): number => t * t * t,
  
  // Smooth both ends
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Overshoot at end
  easeOutBack: (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  
  // Elastic bounce
  easeOutElastic: (t: number): number => {
    if (t === 0 || t === 1) return t
    const c4 = (2 * Math.PI) / 3
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
}

// ============================================
// Value Interpolation
// ============================================

/**
 * Smoothly interpolate between values with easing
 */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/**
 * Exponential smoothing for continuous value updates
 * smoothing: 0-1, higher = faster response
 */
export function expSmooth(
  current: number,
  target: number,
  smoothing: number,
  deltaTime: number
): number {
  const factor = 1 - Math.pow(1 - smoothing, deltaTime * 60)
  return current + (target - current) * factor
}

// ============================================
// Color Utilities
// ============================================

/**
 * Interpolate between two hex colors
 */
export function lerpColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from)
  const toRgb = hexToRgb(to)
  
  const r = Math.round(lerp(fromRgb.r, toRgb.r, t))
  const g = Math.round(lerp(fromRgb.g, toRgb.g, t))
  const b = Math.round(lerp(fromRgb.b, toRgb.b, t))
  
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}

/**
 * Generate glow shadow for text
 */
export function glowShadow(color: string, intensity: number = 1): string {
  const blur1 = Math.round(10 * intensity)
  const blur2 = Math.round(20 * intensity)
  const blur3 = Math.round(40 * intensity)
  return `0 0 ${blur1}px ${color}, 0 0 ${blur2}px ${color}, 0 0 ${blur3}px ${color}`
}
