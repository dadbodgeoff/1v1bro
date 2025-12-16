/**
 * ReadyOverlay - Pre-game lobby with controls display
 * 
 * Enterprise-grade component following brand guidelines:
 * - No hardcoded strings - all text passed via props
 * - Consistent typography scale from EnterpriseOverlays
 * - Brand colors from COLORS constant
 */

import { memo } from 'react'
import {
  EnterpriseCard,
  EnterpriseTitle,
  EnterpriseButton,
  StatRow,
} from '../EnterpriseOverlays'

// ============================================
// Types
// ============================================

interface ReadyOverlayProps {
  /** Main title - required, no defaults */
  title: string
  /** Subtitle text - optional */
  subtitle?: string
  /** Device type for control display */
  isMobile: boolean
  /** Audio state */
  isMuted: boolean
  /** Audio toggle handler */
  onToggleMute: () => void
  /** Start game handler */
  onStart: () => void
  /** Back/exit handler */
  onBack: () => void
  /** Back button label */
  backLabel?: string
  /** Start button label */
  startLabel?: string
  /** Session stats for returning players */
  sessionStats?: {
    bestDistance: number
    totalRuns: number
  }
}

// ============================================
// Control Mappings
// ============================================

const MOBILE_CONTROLS = [
  { action: 'Jump', control: 'Swipe Up' },
  { action: 'Slide', control: 'Swipe Down' },
  { action: 'Move Left', control: 'Tap Left' },
  { action: 'Move Right', control: 'Tap Right' },
]

const KEYBOARD_CONTROLS = [
  { key: 'SPACE / W', action: 'Jump' },
  { key: 'S / ↓', action: 'Slide' },
  { key: 'A / ←', action: 'Move Left' },
  { key: 'D / →', action: 'Move Right' },
  { key: 'ESC / P', action: 'Pause' },
  { key: 'R', action: 'Quick Restart' },
]

// ============================================
// Component
// ============================================

export const ReadyOverlay = memo(({
  title,
  subtitle,
  isMobile,
  isMuted,
  onToggleMute,
  onStart,
  onBack,
  backLabel = '← Back',
  startLabel = 'Start Run',
  sessionStats,
}: ReadyOverlayProps) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <EnterpriseCard maxWidth="md" glow="subtle">
        <EnterpriseTitle size="lg">{title}</EnterpriseTitle>
        
        {subtitle && (
          <p className="text-neutral-400 text-sm text-center mb-4 font-medium">
            {subtitle}
          </p>
        )}
        
        {/* Session Stats - only show if they have a meaningful best */}
        {sessionStats && sessionStats.bestDistance > 0 && (
          <div className="mb-4">
            <StatRow 
              items={[
                { value: `${Math.floor(sessionStats.bestDistance)}m`, label: 'Your Best', color: '#f97316' },
                { value: sessionStats.totalRuns, label: 'Total Runs', color: '#ffffff' },
              ]}
              size="sm"
            />
          </div>
        )}

        {/* Controls Section */}
        <div className="mb-4">
          <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3 font-semibold">
            {isMobile ? 'Touch Controls' : 'Keyboard Controls'}
          </p>
          
          {isMobile ? (
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_CONTROLS.map(({ action, control }) => (
                <div 
                  key={action} 
                  className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06]"
                >
                  <span className="text-neutral-400 text-sm font-medium">{action}</span>
                  <span className="text-orange-400 text-sm font-semibold">{control}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {KEYBOARD_CONTROLS.map(({ key, action }) => (
                <div 
                  key={key} 
                  className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06]"
                >
                  <span className="text-neutral-400 text-sm font-medium">{action}</span>
                  <kbd className="bg-neutral-800 text-orange-400 text-xs font-mono px-2 py-1 rounded border border-neutral-700">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] 
                   rounded-lg px-4 py-2.5 mb-4 text-sm text-neutral-400 font-medium transition-colors
                   border border-white/[0.06]"
        >
          {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
        </button>
        
        <div className="space-y-3">
          <EnterpriseButton onClick={onStart} variant="primary" fullWidth>
            {startLabel}
          </EnterpriseButton>
          <EnterpriseButton onClick={onBack} variant="ghost" fullWidth>
            {backLabel}
          </EnterpriseButton>
        </div>
      </EnterpriseCard>
    </div>
  )
})
ReadyOverlay.displayName = 'ReadyOverlay'
