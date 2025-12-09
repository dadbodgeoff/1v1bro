/**
 * usePerformanceMonitor - FPS detection and quality adjustment hook
 * 
 * Monitors frame rate and provides callbacks for quality reduction
 * when performance drops below threshold.
 * 
 * @module landing/enterprise/usePerformanceMonitor
 * Requirements: 1.4, 5.3
 */

import { useEffect, useRef, useCallback, useState } from 'react'

export interface PerformanceMetrics {
  fps: number
  avgFps: number
  frameDrops: number
  qualityLevel: 'high' | 'medium' | 'low'
}

export interface UsePerformanceMonitorOptions {
  /** Target FPS (default: 60) */
  targetFps?: number
  /** FPS threshold for quality reduction (default: 30) */
  lowFpsThreshold?: number
  /** Number of samples for averaging (default: 60) */
  sampleSize?: number
  /** Callback when quality should be reduced */
  onQualityReduce?: (level: 'medium' | 'low') => void
  /** Enable logging in development */
  enableLogging?: boolean
}

export function usePerformanceMonitor({
  targetFps = 60,
  lowFpsThreshold = 30,
  sampleSize = 60,
  onQualityReduce,
  enableLogging = false,
}: UsePerformanceMonitorOptions = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: targetFps,
    avgFps: targetFps,
    frameDrops: 0,
    qualityLevel: 'high',
  })

  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef<number>(0)
  const frameDropCountRef = useRef<number>(0)
  const qualityReducedRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number>(0)

  const measureFrame = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current > 0) {
      const delta = timestamp - lastFrameTimeRef.current
      const fps = 1000 / delta

      // Add to samples
      frameTimesRef.current.push(fps)
      if (frameTimesRef.current.length > sampleSize) {
        frameTimesRef.current.shift()
      }

      // Calculate average
      const avgFps = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length

      // Detect frame drops
      if (fps < lowFpsThreshold) {
        frameDropCountRef.current++
      }

      // Determine quality level
      let qualityLevel: 'high' | 'medium' | 'low' = 'high'
      if (avgFps < lowFpsThreshold) {
        qualityLevel = 'low'
      } else if (avgFps < targetFps * 0.75) {
        qualityLevel = 'medium'
      }

      // Trigger quality reduction if needed
      if (qualityLevel !== 'high' && !qualityReducedRef.current) {
        qualityReducedRef.current = true
        onQualityReduce?.(qualityLevel)
        
        if (enableLogging && import.meta.env.DEV) {
          console.log(`[Performance] Quality reduced to ${qualityLevel}, avgFps: ${avgFps.toFixed(1)}`)
        }
      }

      // Update metrics periodically (every 10 frames)
      if (frameTimesRef.current.length % 10 === 0) {
        setMetrics({
          fps: Math.round(fps),
          avgFps: Math.round(avgFps),
          frameDrops: frameDropCountRef.current,
          qualityLevel,
        })
      }
    }

    lastFrameTimeRef.current = timestamp
    animationFrameRef.current = requestAnimationFrame(measureFrame)
  }, [sampleSize, lowFpsThreshold, targetFps, onQualityReduce, enableLogging])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(measureFrame)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [measureFrame])

  const resetMetrics = useCallback(() => {
    frameTimesRef.current = []
    frameDropCountRef.current = 0
    qualityReducedRef.current = false
    setMetrics({
      fps: targetFps,
      avgFps: targetFps,
      frameDrops: 0,
      qualityLevel: 'high',
    })
  }, [targetFps])

  return {
    metrics,
    resetMetrics,
  }
}

export default usePerformanceMonitor
