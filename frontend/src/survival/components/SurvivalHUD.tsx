/**
 * SurvivalHUD - AAA-quality heads-up display for Survival Mode
 * 
 * Features:
 * - Score counter with pulse animation on updates
 * - Health hearts with shake on damage
 * - Distance meter with smooth easing
 * - Combo multiplier with escalating glow
 * - Speed indicator with dynamic color
 * - Milestone progress tracking
 * - Achievement notifications
 * - Mobile-responsive scaling with safe area support
 */

import React, { useEffect, useRef, memo, useMemo } from 'react'
import type { SurvivalGameState, GamePhase } from '../types/survival'
import type { MilestoneEvent } from '../systems/MilestoneSystem'
import type { UnlockedAchievement } from '../systems/AchievementSystem'
import { MilestoneBanner, AchievementToast, MilestoneProgress } from './MilestoneCelebration'
import {
  useAnimatedScore,
  useAnimatedDistance,
  useAnimatedSpeed,
  useAnimatedCombo,
} from './useAnimatedValue'
import { glowShadow, lerpColor } from './HUDAnimations'
import { useMobileOptimization } from '../hooks/useMobileOptimization'

// ============================================
// Types
// ============================================

interface SurvivalHUDProps {
  gameState: SurvivalGameState
  combo: number
  multiplier: number
  onDamage?: () => void  // Called when lives decrease
  // Ghost indicator
  isGhostActive?: boolean
  // Milestone & Achievement props
  currentMilestone?: MilestoneEvent | null
  milestoneProgress?: number
  nextMilestone?: number
  currentAchievement?: UnlockedAchievement | null
  onAchievementDismiss?: () => void
}

// ============================================
// Sub-components
// ============================================

/**
 * Animated score counter with pulse effect
 */
const ScoreCounter = memo(({ score, compact = false }: { score: number; compact?: boolean }) => {
  const { displayValue, scale, opacity } = useAnimatedScore(score)
  
  const glowIntensity = Math.min(1, score / 5000)
  const glowColor = lerpColor('#f97316', '#fbbf24', glowIntensity)
  
  return (
    <div 
      className="relative"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'right center',
      }}
    >
      <span 
        className={`${compact ? 'text-3xl' : 'text-4xl'} font-black tabular-nums tracking-tight`}
        style={{
          color: '#f97316',
          textShadow: glowShadow(glowColor, opacity * glowIntensity),
          filter: `brightness(${0.9 + opacity * 0.2})`,
        }}
      >
        {Math.round(displayValue).toLocaleString()}
      </span>
      <span className={`${compact ? 'text-sm' : 'text-lg'} text-orange-400/60 ml-1 font-semibold`}>pts</span>
    </div>
  )
})
ScoreCounter.displayName = 'ScoreCounter'

/**
 * Distance meter with smooth easing
 */
const DistanceMeter = memo(({ distance, compact = false }: { distance: number; compact?: boolean }) => {
  const { displayValue } = useAnimatedDistance(distance)
  
  // Color shifts from white to cyan as distance increases
  const progress = Math.min(1, distance / 2000)
  const color = lerpColor('#ffffff', '#22d3ee', progress)
  
  return (
    <div className="flex items-baseline gap-1">
      <span 
        className={`${compact ? 'text-4xl' : 'text-5xl'} font-black tabular-nums`}
        style={{ 
          color,
          textShadow: `0 0 20px ${color}40`,
        }}
      >
        {Math.round(displayValue)}
      </span>
      <span className={`${compact ? 'text-lg' : 'text-xl'} text-white/50 font-bold`}>m</span>
    </div>
  )
})
DistanceMeter.displayName = 'DistanceMeter'

/**
 * Speed indicator with dynamic color
 */
const SpeedIndicator = memo(({ speed, maxSpeed = 50 }: { speed: number; maxSpeed?: number }) => {
  const { displayValue, scale } = useAnimatedSpeed(speed)
  
  // Color: green -> yellow -> red as speed increases
  const progress = Math.min(1, speed / maxSpeed)
  let color: string
  if (progress < 0.5) {
    color = lerpColor('#22c55e', '#eab308', progress * 2)
  } else {
    color = lerpColor('#eab308', '#ef4444', (progress - 0.5) * 2)
  }
  
  return (
    <div 
      className="flex items-center gap-2"
      style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}
    >
      <div 
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span 
        className="text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {Math.round(displayValue)} u/s
      </span>
    </div>
  )
})
SpeedIndicator.displayName = 'SpeedIndicator'

/**
 * Health hearts with shake on damage
 */
const HealthHearts = memo(({ 
  lives, 
  maxLives = 3,
  onDamage,
  compact = false,
}: { 
  lives: number
  maxLives?: number
  onDamage?: () => void
  compact?: boolean
}) => {
  const prevLivesRef = useRef(lives)
  const shakeRef = useRef({ x: 0, y: 0, active: false })
  const rafRef = useRef<number | undefined>(undefined)
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0)
  
  // Detect damage and trigger shake
  useEffect(() => {
    if (lives < prevLivesRef.current) {
      shakeRef.current = { x: 0, y: 0, active: true }
      onDamage?.()
      
      let startTime = performance.now()
      const duration = 500
      
      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = elapsed / duration
        
        if (progress >= 1) {
          shakeRef.current = { x: 0, y: 0, active: false }
          forceUpdate()
          return
        }
        
        // Decaying shake
        const intensity = (1 - progress) * 8
        const time = elapsed / 1000
        shakeRef.current = {
          x: Math.sin(time * 50) * intensity,
          y: Math.cos(time * 45) * intensity * 0.5,
          active: true,
        }
        forceUpdate()
        rafRef.current = requestAnimationFrame(animate)
      }
      
      rafRef.current = requestAnimationFrame(animate)
    }
    prevLivesRef.current = lives
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [lives, onDamage])
  
  const hearts = []
  for (let i = 0; i < maxLives; i++) {
    const isFilled = i < lives
    const isLost = i === lives && shakeRef.current.active
    
    hearts.push(
      <span
        key={i}
        className={`${compact ? 'text-sm' : 'text-2xl'} transition-all duration-200`}
        style={{
          filter: isFilled ? 'drop-shadow(0 0 4px #ef4444)' : 'grayscale(1) opacity(0.4)',
          transform: isLost 
            ? `translate(${shakeRef.current.x}px, ${shakeRef.current.y}px) scale(1.2)`
            : isFilled ? 'scale(1)' : 'scale(0.9)',
        }}
      >
        {isFilled ? '❤️' : '🖤'}
      </span>
    )
  }
  
  return (
    <div 
      className={`flex ${compact ? 'gap-0.5' : 'gap-1'}`}
      style={{
        transform: shakeRef.current.active 
          ? `translate(${shakeRef.current.x * 0.5}px, ${shakeRef.current.y * 0.5}px)`
          : undefined,
      }}
    >
      {hearts}
    </div>
  )
})
HealthHearts.displayName = 'HealthHearts'

/**
 * Combo multiplier with escalating effects
 */
const ComboDisplay = memo(({ combo, multiplier, compact = false }: { combo: number; multiplier: number; compact?: boolean }) => {
  const { displayValue, scale } = useAnimatedCombo(combo)
  
  if (combo <= 0) return null
  
  // Escalating glow based on combo
  const tier = Math.floor(combo / 5)
  const colors = ['#22d3ee', '#a855f7', '#f97316', '#ef4444', '#fbbf24']
  const color = colors[Math.min(tier, colors.length - 1)]
  const glowIntensity = Math.min(2, 0.5 + tier * 0.3)
  
  return (
    <div 
      className="flex flex-col items-end"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'right center',
      }}
    >
      <div className="flex items-baseline gap-1">
        <span 
          className={`${compact ? 'text-2xl' : 'text-3xl'} font-black tabular-nums`}
          style={{ 
            color,
            textShadow: glowShadow(color, glowIntensity),
          }}
        >
          {Math.round(displayValue)}
        </span>
        <span className={`${compact ? 'text-sm' : 'text-lg'} font-bold`} style={{ color: `${color}99` }}>
          COMBO
        </span>
      </div>
      <span 
        className={`${compact ? 'text-xs' : 'text-sm'} font-bold`}
        style={{ color: `${color}cc` }}
      >
        ×{multiplier.toFixed(1)}
      </span>
    </div>
  )
})
ComboDisplay.displayName = 'ComboDisplay'

/**
 * Ghost indicator - shows when racing against personal best
 */
const GhostIndicator = memo(({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null
  
  return (
    <div 
      className="flex items-center gap-2 text-sm font-bold animate-pulse"
      style={{ color: '#00ffff' }}
    >
      <span className="text-lg">👻</span>
      <span>RACING PB</span>
    </div>
  )
})
GhostIndicator.displayName = 'GhostIndicator'

/**
 * Game phase indicator
 */
const PhaseIndicator = memo(({ phase }: { phase: GamePhase }) => {
  const config: Record<GamePhase, { label: string; color: string; icon: string }> = {
    loading: { label: 'LOADING', color: '#6b7280', icon: '◌' },
    ready: { label: 'READY', color: '#22d3ee', icon: '◎' },
    running: { label: 'RUNNING', color: '#22c55e', icon: '●' },
    paused: { label: 'PAUSED', color: '#eab308', icon: '○' },
    gameover: { label: 'GAME OVER', color: '#ef4444', icon: '✕' },
  }
  
  const { label, color, icon } = config[phase]
  
  return (
    <div 
      className="flex items-center gap-2 text-sm font-bold"
      style={{ color }}
    >
      <span className={phase === 'running' ? 'animate-pulse' : ''}>{icon}</span>
      <span>{label}</span>
    </div>
  )
})
PhaseIndicator.displayName = 'PhaseIndicator'

// ============================================
// Main HUD Component
// ============================================

export const SurvivalHUD: React.FC<SurvivalHUDProps> = memo(({
  gameState,
  combo,
  multiplier,
  onDamage,
  isGhostActive = false,
  currentMilestone,
  milestoneProgress = 0,
  nextMilestone = 500,
  currentAchievement,
  onAchievementDismiss,
}) => {
  const { phase, distance, speed, score, player } = gameState
  
  // Get mobile optimization settings
  const { isMobile, isTablet, mobileConfig, viewportState } = useMobileOptimization()
  
  // Calculate responsive styles based on device
  const responsiveStyles = useMemo(() => {
    const { ui } = mobileConfig
    const safeArea = viewportState.safeAreaInsets
    
    // Determine if portrait mobile (most important for sizing)
    const isPortraitMobile = isMobile && window.innerHeight > window.innerWidth
    
    // Scale factor for HUD elements - smaller on portrait mobile
    const scale = isPortraitMobile ? 0.85 : ui.hudScale
    const isCompact = ui.compactMode || isPortraitMobile
    
    // Safe area padding - tighter on mobile
    const safeTop = Math.max(safeArea.top, isPortraitMobile ? 8 : ui.hudMargin)
    const safeRight = Math.max(safeArea.right, isPortraitMobile ? 8 : ui.hudMargin)
    const safeLeft = Math.max(safeArea.left, isPortraitMobile ? 8 : ui.hudMargin)
    
    // Reserve bottom space for trivia panel (150px on mobile - matches TRIVIA_PANEL_HEIGHT)
    // Note: actual space includes iOS safe area, handled by parent container
    const bottomReserved = isPortraitMobile ? 150 : 0
    
    return {
      scale,
      isCompact,
      isPortraitMobile,
      safeTop,
      safeRight,
      safeLeft,
      bottomReserved,
      padding: isCompact ? 'p-2' : 'p-4',
      minWidth: isCompact ? 'min-w-[120px]' : 'min-w-[180px]',
      spacing: isCompact ? 'space-y-0.5' : 'space-y-2',
      // Font size classes for mobile - more compact
      distanceSize: isCompact ? 'text-3xl' : 'text-5xl',
      scoreSize: isCompact ? 'text-xl' : 'text-4xl',
      comboSize: isCompact ? 'text-lg' : 'text-3xl',
      // Hearts size
      heartSize: isCompact ? 'text-lg' : 'text-2xl',
    }
  }, [mobileConfig, viewportState.safeAreaInsets, isMobile])
  
  // Calculate milestone celebration progress
  const celebrationProgress = currentMilestone 
    ? Math.min(1, (performance.now() - currentMilestone.timestamp) / 2000)
    : 0
  
  return (
    <>
      {/* Milestone celebration overlay */}
      <MilestoneBanner 
        milestone={currentMilestone} 
        celebrationProgress={celebrationProgress} 
      />
      
      {/* Achievement toast */}
      <AchievementToast 
        achievement={currentAchievement} 
        onComplete={onAchievementDismiss} 
      />
      
      {/* Top-left: Lives only on portrait mobile, full panel on desktop */}
      <div 
        className="absolute z-10"
        style={{ 
          top: responsiveStyles.safeTop,
          left: responsiveStyles.safeLeft,
          transform: `scale(${responsiveStyles.scale})`,
          transformOrigin: 'top left',
        }}
      >
        {responsiveStyles.isPortraitMobile ? (
          // Portrait mobile: minimal lives display, smaller hearts
          <HealthHearts lives={player.lives} onDamage={onDamage} compact />
        ) : (
          // Desktop/tablet: full panel
          <div className={`bg-black/70 backdrop-blur-sm ${responsiveStyles.padding} rounded-xl border border-white/10 ${responsiveStyles.spacing}`}>
            <HealthHearts lives={player.lives} onDamage={onDamage} />
            {!responsiveStyles.isCompact && (
              <div className="text-xs text-gray-500 font-medium">
                Lane: {player.targetLane === -1 ? '← Left' : player.targetLane === 0 ? '● Center' : 'Right →'}
              </div>
            )}
            <GhostIndicator isActive={isGhostActive} />
          </div>
        )}
      </div>
      
      {/* Top-right: Score, distance, speed, combo */}
      <div 
        className="absolute z-10"
        style={{ 
          top: responsiveStyles.safeTop,
          right: responsiveStyles.safeRight,
          transform: `scale(${responsiveStyles.scale})`,
          transformOrigin: 'top right',
        }}
      >
        {responsiveStyles.isPortraitMobile ? (
          // Portrait mobile: ultra-compact stats
          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-right">
            {/* Distance - primary */}
            <div className="flex items-baseline justify-end gap-0.5">
              <span className="text-xl font-black tabular-nums text-white">
                {Math.round(distance)}
              </span>
            </div>
            {/* Score - secondary, smaller */}
            <div className="text-sm font-bold tabular-nums text-orange-400">
              {Math.round(score).toLocaleString()}
            </div>
            {/* Combo - tiny */}
            {combo > 0 && (
              <div className="text-xs font-bold text-cyan-400">{combo}x</div>
            )}
          </div>
        ) : (
          // Desktop/tablet: full panel
          <div className={`bg-black/70 backdrop-blur-sm ${responsiveStyles.padding} rounded-xl border border-white/10 text-right ${responsiveStyles.minWidth} ${responsiveStyles.spacing}`}>
            <DistanceMeter distance={distance} compact={responsiveStyles.isCompact} />
            <ScoreCounter score={score} compact={responsiveStyles.isCompact} />
            <div className="pt-2 border-t border-white/10">
              <SpeedIndicator speed={speed} />
            </div>
            {!(responsiveStyles.isCompact && phase === 'running') && (
              <PhaseIndicator phase={phase} />
            )}
            {combo > 0 && (
              <div className="pt-2 border-t border-white/10">
                <ComboDisplay combo={combo} multiplier={multiplier} compact={responsiveStyles.isCompact} />
              </div>
            )}
            {phase === 'running' && (
              <div className="pt-2 border-t border-white/10">
                <MilestoneProgress 
                  currentDistance={distance}
                  nextMilestone={nextMilestone}
                  progress={milestoneProgress}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Mobile touch hint - show briefly on first play (above reserved trivia area) */}
      {(isMobile || isTablet) && phase === 'ready' && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ bottom: responsiveStyles.bottomReserved + 32 }}
        >
          <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 text-center">
            <p className="text-white/80 text-sm font-medium">
              Swipe ↑ Jump • Swipe ↓ Slide • Tap sides to move
            </p>
          </div>
        </div>
      )}
      
      {/* Reserved trivia area indicator (dev only - remove in production) */}
      {/* {responsiveStyles.isPortraitMobile && phase === 'running' && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-5 border-t border-dashed border-white/10"
          style={{ height: responsiveStyles.bottomReserved }}
        >
          <div className="flex items-center justify-center h-full text-white/20 text-xs">
            Trivia Area (200px reserved)
          </div>
        </div>
      )} */}
    </>
  )
})
SurvivalHUD.displayName = 'SurvivalHUD'

export default SurvivalHUD
