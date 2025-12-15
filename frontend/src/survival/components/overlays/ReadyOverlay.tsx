/**
 * ReadyOverlay - Pre-game lobby with controls display
 */

import { memo } from 'react'
import {
  EnterpriseCard,
  EnterpriseTitle,
  EnterpriseButton,
  StatRow,
} from '../EnterpriseOverlays'

interface ReadyOverlayProps {
  title?: string
  subtitle?: string
  isMobile: boolean
  isMuted: boolean
  onToggleMute: () => void
  onStart: () => void
  onBack: () => void
  backLabel?: string
  // Optional session stats (for guest mode)
  sessionStats?: {
    bestDistance: number
    totalRuns: number
  }
}

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

export const ReadyOverlay = memo(({
  title = 'Survival Runner',
  subtitle = 'How far can you go?',
  isMobile,
  isMuted,
  onToggleMute,
  onStart,
  onBack,
  backLabel = '← Back',
  sessionStats,
}: ReadyOverlayProps) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <EnterpriseCard maxWidth="md" glow="subtle">
        <EnterpriseTitle size="lg">{title}</EnterpriseTitle>
        <p className="text-gray-400 text-sm text-center mb-4">{subtitle}</p>
        
        {/* Session Stats (guest mode) */}
        {sessionStats && sessionStats.totalRuns > 0 && (
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
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3 font-medium">
            {isMobile ? 'Touch Controls' : 'Keyboard Controls'}
          </p>
          
          {isMobile ? (
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_CONTROLS.map(({ action, control }) => (
                <div key={action} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-sm">{action}</span>
                  <span className="text-orange-400 text-sm font-medium">{control}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {KEYBOARD_CONTROLS.map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-sm">{action}</span>
                  <kbd className="bg-gray-800 text-orange-400 text-xs font-mono px-2 py-1 rounded border border-gray-700">
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
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 
                   rounded-lg px-4 py-2 mb-4 text-sm text-gray-400 transition-colors"
        >
          {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
        </button>
        
        <div className="space-y-3">
          <EnterpriseButton onClick={onStart} variant="primary" fullWidth>
            Start Run
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
