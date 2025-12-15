/**
 * TouchControlsOverlay - Visual touch control zones for mobile
 * 
 * Features:
 * - Visual zone indicators
 * - Touch feedback animations
 * - Configurable opacity and visibility
 * - Safe area aware positioning
 */

import React, { useState, useCallback, useRef } from 'react'
import { useMobileOptimization, useTouchBehavior } from '../hooks/useMobileOptimization'
import { getTouchZonePixels } from '../config/mobile'

interface TouchFeedback {
  id: number
  x: number
  y: number
  action: string
  timestamp: number
}

interface TouchControlsOverlayProps {
  visible?: boolean
  opacity?: number
  showLabels?: boolean
  showFeedback?: boolean
  onAction?: (action: string) => void
}

export const TouchControlsOverlay: React.FC<TouchControlsOverlayProps> = ({
  visible = true,
  opacity = 0.3,
  showLabels = true,
  showFeedback = true,
  onAction,
}) => {
  const { isTouch, viewportState } = useMobileOptimization()
  const { touchZones, hapticEnabled } = useTouchBehavior()
  const [feedbacks, setFeedbacks] = useState<TouchFeedback[]>([])
  const feedbackIdRef = useRef(0)

  // Handle touch feedback - defined before early return (used for future touch indicator feature)
  // @ts-ignore - addFeedback is defined for future use
  const _addFeedback = useCallback((x: number, y: number, action: string) => {
    if (!showFeedback) return
    
    const id = ++feedbackIdRef.current
    const feedback: TouchFeedback = {
      id,
      x,
      y,
      action,
      timestamp: Date.now(),
    }
    
    setFeedbacks(prev => [...prev, feedback])
    
    // Remove after animation
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== id))
    }, 300)
    
    // Trigger haptic if enabled
    if (hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onAction?.(action)
  }, [showFeedback, hapticEnabled, onAction])

  // Don't render on non-touch devices
  if (!isTouch || !visible) {
    return null
  }

  // Calculate zone positions in pixels
  const leftZone = getTouchZonePixels(touchZones.leftZone)
  const rightZone = getTouchZonePixels(touchZones.rightZone)
  const jumpZone = getTouchZonePixels(touchZones.jumpZone)
  const slideZone = getTouchZonePixels(touchZones.slideZone)

  // Zone style generator
  const getZoneStyle = (
    zone: { x: [number, number]; y: [number, number] },
    color: string
  ): React.CSSProperties => ({
    position: 'absolute',
    left: zone.x[0],
    top: zone.y[0],
    width: zone.x[1] - zone.x[0],
    height: zone.y[1] - zone.y[0],
    backgroundColor: color,
    opacity,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease',
  })

  // Safe area padding
  const safeAreaStyle: React.CSSProperties = {
    paddingTop: viewportState.safeAreaInsets.top,
    paddingRight: viewportState.safeAreaInsets.right,
    paddingBottom: viewportState.safeAreaInsets.bottom,
    paddingLeft: viewportState.safeAreaInsets.left,
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 100,
        ...safeAreaStyle,
      }}
    >
      {/* Left Zone */}
      <div style={getZoneStyle(leftZone, 'rgba(99, 102, 241, 0.2)')}>
        {showLabels && (
          <div style={labelStyle}>
            <LeftArrowIcon />
            <span>LEFT</span>
          </div>
        )}
      </div>

      {/* Right Zone */}
      <div style={getZoneStyle(rightZone, 'rgba(99, 102, 241, 0.2)')}>
        {showLabels && (
          <div style={labelStyle}>
            <RightArrowIcon />
            <span>RIGHT</span>
          </div>
        )}
      </div>

      {/* Jump Zone */}
      <div style={getZoneStyle(jumpZone, 'rgba(249, 115, 22, 0.2)')}>
        {showLabels && (
          <div style={labelStyle}>
            <UpArrowIcon />
            <span>JUMP</span>
          </div>
        )}
      </div>

      {/* Slide Zone */}
      <div style={getZoneStyle(slideZone, 'rgba(16, 185, 129, 0.2)')}>
        {showLabels && (
          <div style={labelStyle}>
            <DownArrowIcon />
            <span>SLIDE</span>
          </div>
        )}
      </div>

      {/* Touch Feedback Ripples */}
      {feedbacks.map(feedback => (
        <div
          key={feedback.id}
          style={{
            position: 'absolute',
            left: feedback.x - 30,
            top: feedback.y - 30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgba(249, 115, 22, 0.4)',
            animation: 'touchRipple 0.3s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* CSS Animation */}
      <style>{`
        @keyframes touchRipple {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Label style
const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

// Simple arrow icons
const LeftArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
)

const RightArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
  </svg>
)

const UpArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
  </svg>
)

const DownArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
  </svg>
)

export default TouchControlsOverlay
