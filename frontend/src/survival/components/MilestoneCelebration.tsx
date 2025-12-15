/**
 * MilestoneCelebration - Visual celebration overlay for distance milestones
 * 
 * Features:
 * - Animated banner with distance
 * - Particle burst effect
 * - Screen flash
 * - Escalating effects for major milestones
 */

import { memo, useEffect, useState, useRef } from 'react'
import type { MilestoneEvent } from '../systems/MilestoneSystem'
import type { UnlockedAchievement } from '../systems/AchievementSystem'
import { glowShadow, lerpColor } from './HUDAnimations'

// ============================================
// Milestone Banner
// ============================================

interface MilestoneBannerProps {
  milestone: MilestoneEvent | null | undefined
  celebrationProgress: number
}

export const MilestoneBanner = memo(({ milestone, celebrationProgress }: MilestoneBannerProps) => {
  if (!milestone || celebrationProgress >= 1) return null
  
  const { distance, isMajor } = milestone
  
  // Animation phases - faster for less intrusion
  const enterPhase = Math.min(1, celebrationProgress * 5)  // 0-20% of duration (faster)
  const exitPhase = celebrationProgress > 0.6 ? (celebrationProgress - 0.6) * 2.5 : 0
  
  // Scale: smaller punch in, hold, fade out (reduced by ~40%)
  const scale = enterPhase < 1 
    ? 0.4 + enterPhase * 0.35  // 0.4 -> 0.75
    : 0.75 - exitPhase * 0.15   // 0.75 -> 0.6
  
  // Opacity - reduced max opacity to 70%
  const baseOpacity = exitPhase > 0 ? 1 - exitPhase : enterPhase
  const opacity = baseOpacity * 0.7
  
  // Colors based on milestone type
  const primaryColor = isMajor ? '#fbbf24' : '#22d3ee'  // Gold for major, cyan for regular
  const secondaryColor = isMajor ? '#f97316' : '#06b6d4'
  const glowColor = lerpColor(primaryColor, secondaryColor, Math.sin(celebrationProgress * Math.PI * 4) * 0.5 + 0.5)
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
      style={{ opacity }}
    >
      {/* Screen flash for major milestones - reduced intensity */}
      {isMajor && enterPhase < 0.5 && (
        <div 
          className="absolute inset-0 bg-yellow-400"
          style={{ opacity: (0.5 - enterPhase) * 0.15 }}
        />
      )}
      
      {/* Main banner - positioned slightly above center to not block gameplay */}
      <div 
        className="relative -translate-y-16"
        style={{
          transform: `scale(${scale}) translateY(-64px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Glow background - reduced */}
        <div 
          className="absolute inset-0 blur-2xl rounded-full"
          style={{
            background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
        
        {/* Content - smaller text */}
        <div className="relative text-center">
          {/* Label - smaller */}
          <div 
            className="text-sm font-bold tracking-widest mb-1"
            style={{ 
              color: secondaryColor,
              textShadow: glowShadow(secondaryColor, 0.3),
            }}
          >
            {isMajor ? '🎉 MILESTONE 🎉' : '✨ MILESTONE ✨'}
          </div>
          
          {/* Distance - reduced from 7xl to 5xl */}
          <div 
            className="text-5xl font-black tabular-nums"
            style={{
              color: primaryColor,
              textShadow: glowShadow(glowColor, isMajor ? 1.2 : 0.6),
              letterSpacing: '-0.02em',
            }}
          >
            {distance.toLocaleString()}
            <span className="text-2xl ml-1">m</span>
          </div>
          
          {/* Subtitle - smaller */}
          <div 
            className="text-xs font-semibold mt-1 tracking-wide"
            style={{ color: `${primaryColor}80` }}
          >
            {isMajor ? 'INCREDIBLE!' : 'KEEP GOING!'}
          </div>
        </div>
        
        {/* Particle burst effect - fewer, smaller particles */}
        {enterPhase < 0.5 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: isMajor ? 8 : 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? primaryColor : secondaryColor,
                  transform: `rotate(${i * (360 / (isMajor ? 8 : 6))}deg) translateY(-${40 + enterPhase * 60}px)`,
                  opacity: (1 - enterPhase * 2) * 0.7,
                  boxShadow: `0 0 6px ${primaryColor}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
MilestoneBanner.displayName = 'MilestoneBanner'

// ============================================
// Achievement Toast
// ============================================

interface AchievementToastProps {
  achievement: UnlockedAchievement | null | undefined
  onComplete?: () => void
}

export const AchievementToast = memo(({ achievement, onComplete }: AchievementToastProps) => {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  useEffect(() => {
    if (achievement) {
      setVisible(true)
      setExiting(false)
      
      // Start exit after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setExiting(true)
        // Complete after exit animation
        setTimeout(() => {
          setVisible(false)
          onComplete?.()
        }, 500)
      }, 3000)
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [achievement, onComplete])
  
  if (!visible || !achievement) return null
  
  const { achievement: ach } = achievement
  
  // Rarity colors
  const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
    common: { bg: 'bg-gray-800/90', border: 'border-gray-500', text: 'text-gray-300' },
    uncommon: { bg: 'bg-green-900/90', border: 'border-green-500', text: 'text-green-300' },
    rare: { bg: 'bg-blue-900/90', border: 'border-blue-500', text: 'text-blue-300' },
    epic: { bg: 'bg-purple-900/90', border: 'border-purple-500', text: 'text-purple-300' },
    legendary: { bg: 'bg-yellow-900/90', border: 'border-yellow-500', text: 'text-yellow-300' },
  }
  
  const colors = rarityColors[ach.rarity] || rarityColors.common
  
  return (
    <div 
      className={`
        fixed top-24 left-1/2 -translate-x-1/2 z-40
        ${colors.bg} ${colors.border} border rounded-lg
        px-4 py-3 backdrop-blur-sm
        transition-all duration-500 ease-out
        ${exiting ? 'opacity-0 -translate-y-4' : 'opacity-90 translate-y-0'}
      `}
      style={{
        animation: !exiting ? 'achievementSlideIn 0.5s ease-out' : undefined,
        boxShadow: `0 0 20px ${colors.border.replace('border-', '')}30`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon - smaller */}
        <div className="text-2xl">{ach.icon}</div>
        
        {/* Content - more compact */}
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
            Achievement!
          </div>
          <div className="text-base font-bold text-white">{ach.name}</div>
          <div className="text-xs text-white/60">{ach.description}</div>
        </div>
      </div>
    </div>
  )
})
AchievementToast.displayName = 'AchievementToast'

// ============================================
// Milestone Progress Bar
// ============================================

interface MilestoneProgressProps {
  currentDistance?: number  // Optional, for display purposes
  nextMilestone: number
  progress: number
}

export const MilestoneProgress = memo(({ nextMilestone, progress }: MilestoneProgressProps) => {
  const isMajor = nextMilestone % 1000 === 0
  const color = isMajor ? '#fbbf24' : '#22d3ee'
  
  return (
    <div className="w-full">
      {/* Label */}
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/50">Next milestone</span>
        <span style={{ color }} className="font-bold">{nextMilestone}m</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
            boxShadow: progress > 0.8 ? `0 0 10px ${color}` : undefined,
          }}
        />
      </div>
    </div>
  )
})
MilestoneProgress.displayName = 'MilestoneProgress'

// ============================================
// CSS Keyframes (inject once)
// ============================================

const styleId = 'milestone-celebration-styles'
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes achievementSlideIn {
      0% {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px) scale(0.9);
      }
      50% {
        transform: translateX(-50%) translateY(5px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }
  `
  document.head.appendChild(style)
}

export default MilestoneBanner
