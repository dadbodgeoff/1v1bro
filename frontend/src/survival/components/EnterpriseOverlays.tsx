/**
 * EnterpriseOverlays - Shared enterprise-styled overlay components
 * 
 * Provides consistent styling for all survival runner UI overlays:
 * - Game Over screens
 * - Ready/Start screens
 * - Pause screens
 * - Stats displays
 * - CTAs and buttons
 * 
 * Design patterns:
 * - Glassmorphism with backdrop-blur
 * - Gradient accents
 * - Smooth entrance/exit animations
 * - Consistent typography scale
 * - Glow effects for emphasis
 */

import { memo, useEffect, useState, type ReactNode } from 'react'

// ============================================
// Animation Keyframes (inject once)
// ============================================

const styleId = 'enterprise-overlay-styles'
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes overlaySlideUp {
      from { 
        opacity: 0; 
        transform: translate(-50%, -45%) scale(0.95);
      }
      to { 
        opacity: 1; 
        transform: translate(-50%, -50%) scale(1);
      }
    }
    
    @keyframes overlayPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    
    @keyframes statCountUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes glowPulse {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.2); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    .enterprise-shimmer {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255,255,255,0.1) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
  `
  document.head.appendChild(style)
}

// ============================================
// Base Overlay Container
// ============================================

interface OverlayContainerProps {
  children: ReactNode
  blur?: 'sm' | 'md' | 'lg'
  darkness?: number // 0-100
  animate?: boolean
}

export const OverlayContainer = memo(({ 
  children, 
  blur = 'md',
  darkness = 70,
  animate = true 
}: OverlayContainerProps) => {
  const blurClass = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  }[blur]

  return (
    <div 
      className={`absolute inset-0 z-30 ${blurClass} flex items-center justify-center overflow-y-auto py-4`}
      style={{ 
        backgroundColor: `rgba(0, 0, 0, ${darkness / 100})`,
        animation: animate ? 'overlayFadeIn 0.3s ease-out' : undefined,
      }}
    >
      {children}
    </div>
  )
})
OverlayContainer.displayName = 'OverlayContainer'

// ============================================
// Enterprise Card
// ============================================

interface EnterpriseCardProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
  animate?: boolean
  glow?: 'none' | 'subtle' | 'strong'
  glowColor?: string
}

export const EnterpriseCard = memo(({ 
  children, 
  maxWidth = 'md',
  animate = true,
  glow = 'subtle',
  glowColor = '#f97316'
}: EnterpriseCardProps) => {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[maxWidth]

  const glowStyle = glow === 'none' ? {} : {
    boxShadow: glow === 'strong' 
      ? `0 0 60px ${glowColor}20, 0 0 30px ${glowColor}10, inset 0 1px 0 rgba(255,255,255,0.1)`
      : `0 0 40px ${glowColor}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
  }

  return (
    <div 
      className={`
        ${maxWidthClass} w-full mx-4
        bg-gradient-to-b from-gray-900/95 to-gray-950/95
        rounded-2xl border border-white/10
        shadow-2xl
      `}
      style={{
        ...glowStyle,
        animation: animate ? 'overlaySlideUp 0.4s ease-out' : undefined,
      }}
    >
      <div className="p-6 relative overflow-hidden">
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {children}
      </div>
    </div>
  )
})
EnterpriseCard.displayName = 'EnterpriseCard'

// ============================================
// Enterprise Title
// ============================================

interface EnterpriseTitleProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'md' | 'lg' | 'xl'
  glow?: boolean
}

export const EnterpriseTitle = memo(({ 
  children, 
  variant = 'default',
  size = 'lg',
  glow = false
}: EnterpriseTitleProps) => {
  const sizeClass = {
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  }[size]

  const variantStyles = {
    default: 'text-white',
    success: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500',
    warning: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500',
    error: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500',
  }

  return (
    <h2 
      className={`${sizeClass} font-bold text-center mb-4 ${variantStyles[variant]}`}
      style={glow ? { 
        textShadow: '0 0 30px rgba(249, 115, 22, 0.5)',
        animation: 'glowPulse 2s ease-in-out infinite',
      } : undefined}
    >
      {children}
    </h2>
  )
})
EnterpriseTitle.displayName = 'EnterpriseTitle'

// ============================================
// Stat Display Components
// ============================================

interface StatBoxProps {
  value: string | number
  label: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  icon?: string
}

export const StatBox = memo(({ 
  value, 
  label, 
  color = '#ffffff',
  size = 'md',
  delay = 0,
  icon
}: StatBoxProps) => {
  const [visible, setVisible] = useState(delay === 0)
  
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  const sizeStyles = {
    sm: { value: 'text-lg', label: 'text-[10px]', padding: 'p-2' },
    md: { value: 'text-2xl', label: 'text-xs', padding: 'p-3' },
    lg: { value: 'text-3xl', label: 'text-sm', padding: 'p-4' },
  }[size]

  return (
    <div 
      className={`bg-white/5 rounded-xl ${sizeStyles.padding} text-center border border-white/5 hover:border-white/10 transition-all`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.3s ease-out',
      }}
    >
      <div 
        className={`${sizeStyles.value} font-bold tabular-nums flex items-center justify-center gap-1`}
        style={{ color }}
      >
        {icon && <span className="text-base">{icon}</span>}
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={`${sizeStyles.label} text-gray-500 uppercase tracking-wider mt-1`}>
        {label}
      </div>
    </div>
  )
})
StatBox.displayName = 'StatBox'

interface StatRowProps {
  items: Array<{ value: string | number; label: string; color?: string; icon?: string }>
  size?: 'sm' | 'md'
}

export const StatRow = memo(({ items, size = 'sm' }: StatRowProps) => {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((item, i) => (
        <StatBox 
          key={item.label} 
          {...item} 
          size={size}
          delay={i * 50}
        />
      ))}
    </div>
  )
})
StatRow.displayName = 'StatRow'

// ============================================
// Highlight Box (for special stats)
// ============================================

interface HighlightBoxProps {
  children: ReactNode
  gradient?: 'orange' | 'purple' | 'cyan' | 'green'
  animate?: boolean
}

export const HighlightBox = memo(({ 
  children, 
  gradient = 'orange',
  animate = false
}: HighlightBoxProps) => {
  const gradients = {
    orange: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
  }

  return (
    <div 
      className={`bg-gradient-to-r ${gradients[gradient]} rounded-xl p-3 border`}
      style={animate ? { animation: 'overlayPulse 2s ease-in-out infinite' } : undefined}
    >
      {children}
    </div>
  )
})
HighlightBox.displayName = 'HighlightBox'

// ============================================
// Enterprise Buttons
// ============================================

interface EnterpriseButtonProps {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: string
  shortcut?: string
  disabled?: boolean
}

export const EnterpriseButton = memo(({ 
  children, 
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  shortcut,
  disabled = false
}: EnterpriseButtonProps) => {
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }[size]

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-orange-500 to-amber-500 
      hover:from-orange-600 hover:to-amber-600 
      text-white font-bold
      shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
      hover:scale-[1.02] active:scale-[0.98]
    `,
    secondary: `
      bg-white/5 hover:bg-white/10 
      text-white font-semibold
      border border-white/10 hover:border-white/20
    `,
    ghost: `
      text-gray-400 hover:text-white 
      font-medium
      hover:bg-white/5
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-rose-500 
      hover:from-red-600 hover:to-rose-600 
      text-white font-bold
      shadow-lg shadow-red-500/30 hover:shadow-red-500/50
    `,
  }

  return (
    <button
      onClick={onClick}
      onTouchEnd={(e) => {
        // Ensure touch events trigger onClick on mobile
        e.preventDefault()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      className={`
        ${sizeStyles}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl transition-all duration-200
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        touch-action-manipulation select-none
      `}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {icon && <span>{icon}</span>}
      {children}
      {shortcut && (
        <span className="text-xs opacity-60 ml-1">({shortcut})</span>
      )}
    </button>
  )
})
EnterpriseButton.displayName = 'EnterpriseButton'

// ============================================
// Rank Display
// ============================================

interface RankDisplayProps {
  rank: number | null
  totalPlayers?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const RankDisplay = memo(({ 
  rank, 
  totalPlayers,
  label = 'Rank',
  size = 'md'
}: RankDisplayProps) => {
  if (rank === null) return null

  const sizeStyles = {
    sm: { rank: 'text-xl', label: 'text-xs' },
    md: { rank: 'text-2xl', label: 'text-xs' },
    lg: { rank: 'text-3xl', label: 'text-sm' },
  }[size]

  // Color based on rank
  const rankColor = rank <= 10 ? '#fbbf24' : rank <= 50 ? '#a855f7' : rank <= 100 ? '#22d3ee' : '#ffffff'

  return (
    <HighlightBox gradient="purple">
      <div className="text-center">
        <div className={`${sizeStyles.label} text-gray-400 mb-1`}>{label}</div>
        <div 
          className={`${sizeStyles.rank} font-bold`}
          style={{ color: rankColor }}
        >
          #{rank}
        </div>
        {totalPlayers && (
          <div className="text-xs text-gray-500">
            of {totalPlayers.toLocaleString()} players
          </div>
        )}
      </div>
    </HighlightBox>
  )
})
RankDisplay.displayName = 'RankDisplay'

// ============================================
// XP Display
// ============================================

interface XPDisplayProps {
  xp: number
  label?: string
  totalXp?: number
}

export const XPDisplay = memo(({ xp, label = 'XP Earned', totalXp }: XPDisplayProps) => {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-green-400">+{xp.toLocaleString()} XP</div>
      {totalXp !== undefined && (
        <div className="text-xs text-gray-500 mt-1">
          Total: {totalXp.toLocaleString()} XP
        </div>
      )}
    </div>
  )
})
XPDisplay.displayName = 'XPDisplay'

// ============================================
// Divider
// ============================================

export const EnterpriseDivider = memo(() => (
  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
))
EnterpriseDivider.displayName = 'EnterpriseDivider'

// ============================================
// Controls Panel
// ============================================

interface ControlItem {
  key: string
  action: string
}

interface ControlsPanelProps {
  controls: ControlItem[]
  onMuteToggle?: () => void
  isMuted?: boolean
  compact?: boolean
}

export const ControlsPanel = memo(({ 
  controls, 
  onMuteToggle, 
  isMuted = false,
  compact = false
}: ControlsPanelProps) => {
  return (
    <div className={`
      bg-black/70 backdrop-blur-sm rounded-xl border border-white/10
      ${compact ? 'p-3' : 'p-4'}
    `}>
      <p className={`text-gray-300 font-semibold ${compact ? 'mb-1 text-xs' : 'mb-2 text-sm'}`}>
        Controls
      </p>
      <ul className={`text-gray-500 ${compact ? 'space-y-0.5 text-xs' : 'space-y-1 text-sm'}`}>
        {controls.map(({ key, action }) => (
          <li key={key}>
            <span className="text-orange-400">{key}</span> = {action}
          </li>
        ))}
      </ul>
      {onMuteToggle && (
        <button
          onClick={onMuteToggle}
          className={`
            mt-3 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 transition-colors
            ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-xs'}
          `}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      )}
    </div>
  )
})
ControlsPanel.displayName = 'ControlsPanel'

// ============================================
// Trivia Stats Bar
// ============================================

interface TriviaStatsBarProps {
  timeRemaining?: number
  totalScore: number
  correctCount: number
  wrongCount: number
  streak: number
}

export const TriviaStatsBar = memo(({ 
  timeRemaining, 
  totalScore, 
  correctCount, 
  wrongCount, 
  streak 
}: TriviaStatsBarProps) => {
  const timeColor = timeRemaining !== undefined
    ? timeRemaining <= 10 ? 'text-red-400 animate-pulse' 
      : timeRemaining <= 20 ? 'text-yellow-400' 
      : 'text-green-400'
    : 'text-gray-400'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/10">
        {timeRemaining !== undefined && (
          <>
            <span className={`font-bold tabular-nums ${timeColor}`}>
              {timeRemaining}s
            </span>
            <span className="text-gray-600">|</span>
          </>
        )}
        <span className="text-gray-400">Trivia:</span>
        <span className="font-bold text-purple-400 tabular-nums">{totalScore.toLocaleString()}</span>
        <span className="text-green-400">{correctCount}✓</span>
        <span className="text-red-400">{wrongCount}✗</span>
        {streak >= 3 && (
          <span className="text-yellow-400">🔥 {streak}</span>
        )}
      </div>
      <div className="text-xs text-gray-500">
        Press <span className="text-cyan-400">1-4</span> to answer
      </div>
    </div>
  )
})
TriviaStatsBar.displayName = 'TriviaStatsBar'

// ============================================
// Guest Mode Indicator
// ============================================

interface GuestIndicatorProps {
  onSignUp: () => void
}

export const GuestIndicator = memo(({ onSignUp }: GuestIndicatorProps) => {
  return (
    <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">Playing as</span>
        <span className="font-semibold text-white">Guest</span>
        <button
          onClick={onSignUp}
          className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
        >
          Sign up to save progress
        </button>
      </div>
    </div>
  )
})
GuestIndicator.displayName = 'GuestIndicator'

// ============================================
// Player Info Header
// ============================================

interface PlayerInfoProps {
  displayName: string
  rank?: number
  personalBest?: number
}

export const PlayerInfo = memo(({ displayName, rank, personalBest }: PlayerInfoProps) => {
  return (
    <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">Playing as</span>
        <span className="font-semibold text-white">{displayName}</span>
        {rank && personalBest && (
          <span className="text-orange-400 text-sm">
            Rank #{rank} • PB: {Math.floor(personalBest)}m
          </span>
        )}
      </div>
    </div>
  )
})
PlayerInfo.displayName = 'PlayerInfo'

// ============================================
// Error Display
// ============================================

interface ErrorDisplayProps {
  error: string
  onBack: () => void
  backLabel?: string
}

export const ErrorDisplay = memo(({ error, onBack, backLabel = 'Go Back' }: ErrorDisplayProps) => {
  return (
    <div className="bg-black/70 backdrop-blur-sm p-4 rounded-xl border border-red-500/30">
      <h1 className="text-xl font-bold text-red-500">Error</h1>
      <p className="text-red-400 mt-2">{error}</p>
      <button
        onClick={onBack}
        className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
      >
        {backLabel}
      </button>
    </div>
  )
})
ErrorDisplay.displayName = 'ErrorDisplay'

export default {
  OverlayContainer,
  EnterpriseCard,
  EnterpriseTitle,
  StatBox,
  StatRow,
  HighlightBox,
  EnterpriseButton,
  RankDisplay,
  XPDisplay,
  EnterpriseDivider,
  ControlsPanel,
  TriviaStatsBar,
  GuestIndicator,
  PlayerInfo,
  ErrorDisplay,
}
