/**
 * TransitionOverlay - Visual overlay for game transitions
 * 
 * Renders:
 * - Screen fade (black overlay with opacity)
 * - 3-2-1-GO countdown with animations
 * - Death vignette effect
 * - Respawn flash effect
 */

import React, { useEffect, useState, useCallback } from 'react'
import type { TransitionPhase, CountdownValue } from '../effects/TransitionSystem'

interface TransitionOverlayProps {
  phase: TransitionPhase
  screenOpacity: number
  countdownValue: CountdownValue
  countdownTickProgress: number
  respawnFlashAlpha: number
  deathCameraZoom: number
}

// Countdown number animation styles
const getCountdownStyle = (
  value: CountdownValue,
  tickProgress: number
): React.CSSProperties => {
  if (!value) return { opacity: 0 }
  
  // Punch-in effect: start big, shrink to normal, then fade
  const punchPhase = Math.min(tickProgress * 3, 1) // First 33% is punch-in
  const fadePhase = Math.max(0, (tickProgress - 0.6) / 0.4) // Last 40% is fade
  
  // Scale: 1.5 -> 1.0 during punch, then slight grow during fade
  const punchScale = 1.5 - punchPhase * 0.5
  const fadeScale = 1 + fadePhase * 0.3
  const scale = tickProgress < 0.33 ? punchScale : fadeScale
  
  // Opacity: full during punch, fade out at end
  const opacity = 1 - fadePhase * 0.9
  
  const isGo = value === 'GO'
  const color = isGo ? '#00ff88' : '#ffffff'
  const glowIntensity = isGo ? 1 : (1 - tickProgress * 0.5)
  const textShadow = isGo 
    ? `0 0 ${40 * glowIntensity}px #00ff88, 0 0 ${80 * glowIntensity}px #00ff88, 0 0 ${120 * glowIntensity}px #00ff88`
    : `0 0 ${30 * glowIntensity}px rgba(255,255,255,0.9), 0 0 ${60 * glowIntensity}px rgba(255,255,255,0.5), 0 0 ${100 * glowIntensity}px rgba(255,100,50,0.3)`
  
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scale})`,
    fontSize: isGo ? '140px' : '200px',
    fontWeight: 900,
    fontFamily: '"Orbitron", "Rajdhani", monospace',
    color,
    textShadow,
    opacity,
    letterSpacing: isGo ? '0.3em' : '0.05em',
    transition: 'none',
    pointerEvents: 'none',
    zIndex: 1001,
    WebkitTextStroke: isGo ? '2px rgba(0,255,136,0.5)' : '1px rgba(255,255,255,0.3)',
  }
}

// Vignette effect for death - dramatic red edges
const getVignetteStyle = (intensity: number): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: `radial-gradient(ellipse at center, 
    transparent 0%, 
    transparent 20%, 
    rgba(180, 0, 0, ${intensity * 0.25}) 45%, 
    rgba(120, 0, 0, ${intensity * 0.5}) 70%, 
    rgba(60, 0, 0, ${intensity * 0.8}) 100%)`,
  pointerEvents: 'none',
  zIndex: 999,
  mixBlendMode: 'multiply',
})

// Respawn flash effect
const getRespawnFlashStyle = (alpha: number): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: `rgba(0, 255, 200, ${alpha * 0.3})`,
  pointerEvents: 'none',
  zIndex: 998,
})

// Main fade overlay
const getFadeOverlayStyle = (opacity: number): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: '#000000',
  opacity,
  pointerEvents: opacity > 0.5 ? 'auto' : 'none',
  zIndex: 1000,
})

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  phase,
  screenOpacity,
  countdownValue,
  countdownTickProgress,
  respawnFlashAlpha,
  deathCameraZoom,
}) => {
  // Death vignette intensity
  const vignetteIntensity = phase === 'death-slowmo' || phase === 'death-fade' 
    ? (deathCameraZoom - 1) * 3 
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Main fade overlay */}
      {screenOpacity > 0.01 && (
        <div style={getFadeOverlayStyle(screenOpacity)} />
      )}
      
      {/* Death vignette */}
      {vignetteIntensity > 0.01 && (
        <div style={getVignetteStyle(vignetteIntensity)} />
      )}
      
      {/* Respawn flash */}
      {respawnFlashAlpha > 0.01 && (
        <div style={getRespawnFlashStyle(respawnFlashAlpha)} />
      )}
      
      {/* Countdown display */}
      {countdownValue !== null && (
        <div style={getCountdownStyle(countdownValue, countdownTickProgress)}>
          {countdownValue}
        </div>
      )}
    </div>
  )
}

/**
 * Hook to manage transition overlay state from TransitionSystem
 */
export function useTransitionOverlay(transitionSystem: {
  getPhase: () => TransitionPhase
  getScreenOpacity: () => number
  getCountdownValue: () => CountdownValue
  getCountdownTickProgress: () => number
  getRespawnFlashAlpha: () => number
  getDeathCameraZoom: () => number
} | null) {
  const [overlayState, setOverlayState] = useState<TransitionOverlayProps>({
    phase: 'none',
    screenOpacity: 0,
    countdownValue: null,
    countdownTickProgress: 0,
    respawnFlashAlpha: 0,
    deathCameraZoom: 1,
  })

  const updateOverlay = useCallback(() => {
    if (!transitionSystem) return
    
    setOverlayState({
      phase: transitionSystem.getPhase(),
      screenOpacity: transitionSystem.getScreenOpacity(),
      countdownValue: transitionSystem.getCountdownValue(),
      countdownTickProgress: transitionSystem.getCountdownTickProgress(),
      respawnFlashAlpha: transitionSystem.getRespawnFlashAlpha(),
      deathCameraZoom: transitionSystem.getDeathCameraZoom(),
    })
  }, [transitionSystem])

  useEffect(() => {
    if (!transitionSystem) return
    
    // Update at 30fps for smooth animations
    const interval = setInterval(updateOverlay, 33)
    return () => clearInterval(interval)
  }, [transitionSystem, updateOverlay])

  return overlayState
}

export default TransitionOverlay
