/**
 * EnterpriseLoadingScreen - Professional SVG-based loading UI
 * 
 * Features:
 * - Animated SVG graphics
 * - Subsystem status indicators
 * - Smooth progress animations
 * - Professional countdown overlay
 */

import { useState, useEffect, useCallback } from 'react'
import type { LoadingProgress, LoadingStage } from '../core/LoadingOrchestrator'

interface Props {
  progress: LoadingProgress
  countdownValue?: number | 'GO' | null
  onRetry?: () => void
}

// Animated runner SVG component
function RunnerSVG({ isAnimating }: { isAnimating: boolean }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`w-24 h-24 ${isAnimating ? 'animate-pulse' : ''}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Track/ground line */}
      <line x1="10" y1="85" x2="90" y2="85" stroke="#333" strokeWidth="2" />
      
      {/* Runner silhouette */}
      <g className={isAnimating ? 'animate-bounce' : ''} style={{ animationDuration: '0.5s' }}>
        {/* Head */}
        <circle cx="50" cy="30" r="8" fill="#f97316" />
        {/* Body */}
        <line x1="50" y1="38" x2="50" y2="58" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
        {/* Arms */}
        <line x1="50" y1="45" x2="38" y2="52" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="45" x2="62" y2="40" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        {/* Legs */}
        <line x1="50" y1="58" x2="40" y2="75" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="58" x2="60" y2="75" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
      </g>
      
      {/* Speed lines */}
      {isAnimating && (
        <g className="animate-pulse" style={{ animationDuration: '0.3s' }}>
          <line x1="20" y1="40" x2="30" y2="40" stroke="#f97316" strokeWidth="2" opacity="0.5" />
          <line x1="15" y1="50" x2="28" y2="50" stroke="#f97316" strokeWidth="2" opacity="0.4" />
          <line x1="18" y1="60" x2="32" y2="60" stroke="#f97316" strokeWidth="2" opacity="0.3" />
        </g>
      )}
    </svg>
  )
}

// Circular progress indicator
function CircularProgress({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1f1f23"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300 ease-out"
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Subsystem status indicator
function SubsystemIndicator({ name, ready, error }: { name: string; ready: boolean; error?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
        error ? 'bg-red-500' : ready ? 'bg-green-500' : 'bg-gray-600 animate-pulse'
      }`} />
      <span className={`capitalize ${ready ? 'text-gray-300' : 'text-gray-500'}`}>
        {name}
      </span>
      {error && <span className="text-red-400 text-xs">(!)</span>}
    </div>
  )
}

// Stage description
function getStageDescription(stage: LoadingStage): string {
  switch (stage) {
    case 'idle': return 'Waiting...'
    case 'initializing': return 'Initializing engine'
    case 'loading-critical': return 'Loading core assets'
    case 'loading-secondary': return 'Loading environment'
    case 'initializing-systems': return 'Starting systems'
    case 'warming-up': return 'Preparing renderer'
    case 'ready': return 'Ready to play!'
    case 'countdown': return 'Starting...'
    case 'running': return 'Playing'
    case 'error': return 'Error occurred'
  }
}

// Countdown overlay component
function CountdownOverlay({ value }: { value: number | 'GO' }) {
  const isGo = value === 'GO'
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`
        text-9xl font-black tracking-tighter
        ${isGo ? 'text-green-500 animate-ping' : 'text-orange-500'}
        drop-shadow-[0_0_30px_rgba(249,115,22,0.8)]
        animate-bounce
      `}
      style={{ animationDuration: '0.3s' }}
      >
        {value}
      </div>
    </div>
  )
}

export function EnterpriseLoadingScreen({ progress, countdownValue, onRetry }: Props) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const isError = progress.stage === 'error'
  const isReady = progress.stage === 'ready'
  const isLoading = !isError && !isReady && progress.stage !== 'countdown' && progress.stage !== 'running'

  // Smooth progress animation
  useEffect(() => {
    const target = progress.overallProgress
    const step = () => {
      setDisplayProgress(prev => {
        const diff = target - prev
        if (Math.abs(diff) < 0.5) return target
        return prev + diff * 0.1
      })
    }
    const interval = setInterval(step, 16)
    return () => clearInterval(interval)
  }, [progress.overallProgress])

  // Show countdown overlay
  if (countdownValue !== null && countdownValue !== undefined) {
    return <CountdownOverlay value={countdownValue} />
  }

  // Hide when running
  if (progress.stage === 'running') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center z-40">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #f97316 2px, transparent 0)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo area with circular progress */}
        <div className="relative mb-8">
          <CircularProgress progress={displayProgress} size={140} />
          <div className="absolute inset-0 flex items-center justify-center">
            <RunnerSVG isAnimating={isLoading} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Survival Mode
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Neural Pathway Runner
        </p>

        {/* Progress percentage */}
        <div className="text-5xl font-bold text-orange-500 tabular-nums mb-2">
          {Math.round(displayProgress)}%
        </div>

        {/* Stage description */}
        <p className="text-gray-400 mb-6">
          {progress.currentTask || getStageDescription(progress.stage)}
        </p>

        {/* Subsystem status grid */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-2 mb-8">
          {progress.subsystems.slice(0, 6).map(sub => (
            <SubsystemIndicator 
              key={sub.name} 
              name={sub.name} 
              ready={sub.ready}
              error={sub.error}
            />
          ))}
        </div>

        {/* Error state */}
        {isError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md text-center">
            <p className="text-red-400 mb-4">{progress.error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Ready state */}
        {isReady && (
          <div className="text-center">
            <p className="text-green-400 mb-2">✓ All systems ready</p>
            <p className="text-gray-500 text-sm">
              Loaded in {(progress.totalLoadTimeMs / 1000).toFixed(1)}s
            </p>
          </div>
        )}

        {/* Loading tips */}
        {isLoading && (
          <div className="mt-8 text-center max-w-sm">
            <p className="text-gray-600 text-xs">
              <span className="text-gray-500">TIP:</span> Use A/D to switch lanes, 
              SPACE to jump, S to slide
            </p>
          </div>
        )}
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-4 text-gray-700 text-xs">
        Enterprise Edition
      </div>
    </div>
  )
}

// Hook to manage loading screen state
export function useLoadingScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [countdownValue, setCountdownValue] = useState<number | 'GO' | null>(null)

  const showCountdown = useCallback((value: number | 'GO') => {
    setCountdownValue(value)
  }, [])

  const hideCountdown = useCallback(() => {
    setCountdownValue(null)
  }, [])

  const hide = useCallback(() => {
    setIsVisible(false)
  }, [])

  const show = useCallback(() => {
    setIsVisible(true)
  }, [])

  return {
    isVisible,
    countdownValue,
    showCountdown,
    hideCountdown,
    hide,
    show,
  }
}
