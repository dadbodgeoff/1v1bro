/**
 * SymphonyDebugOverlay - Visual monitoring for the Symphony Conductor
 * Shows real-time orchestration state: tension, phrases, motifs, breathers
 * Toggle with backtick (`) key during gameplay
 */

import { useState, useEffect } from 'react'
import type { SymphonyState } from '../orchestrator'

interface RenderStats {
  totalObstacles: number
  instancedObstacles: number
  clonedObstacles: number
  drawCalls: number
  poolUtilization: Record<string, string>
}

interface SymphonyDebugOverlayProps {
  getSymphonyState: () => SymphonyState | null
  getOrchestratorDebug: () => object | null
  getRenderStats?: () => RenderStats | null
  enabled?: boolean
}

// Tension bar color based on value
const getTensionColor = (tension: number): string => {
  if (tension < 0.3) return '#10b981' // Green - calm
  if (tension < 0.6) return '#f59e0b' // Amber - building
  if (tension < 0.8) return '#f97316' // Orange - intense
  return '#ef4444' // Red - peak
}

// Phase badge color
const getPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'warmup': return '#6366f1'
    case 'building': return '#f59e0b'
    case 'intense': return '#ef4444'
    case 'recovery': return '#10b981'
    case 'climax': return '#ec4899'
    default: return '#6b7280'
  }
}

export function SymphonyDebugOverlay({ 
  getSymphonyState, 
  getOrchestratorDebug,
  getRenderStats,
  enabled = true 
}: SymphonyDebugOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<SymphonyState | null>(null)
  const [debug, setDebug] = useState<object | null>(null)
  const [renderStats, setRenderStats] = useState<RenderStats | null>(null)

  // Toggle with backtick key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Backquote' && enabled) {
        setVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [enabled])

  // Update state at 10Hz (not every frame)
  useEffect(() => {
    if (!visible) return

    const interval = setInterval(() => {
      setState(getSymphonyState())
      setDebug(getOrchestratorDebug())
      if (getRenderStats) {
        setRenderStats(getRenderStats())
      }
    }, 100)

    return () => clearInterval(interval)
  }, [visible, getSymphonyState, getOrchestratorDebug, getRenderStats])

  if (!visible || !enabled) return null

  return (
    <div className="fixed top-4 right-4 w-80 bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 font-mono text-xs text-zinc-300 z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-orange-500 font-bold">🎼 Symphony Monitor</span>
        <button 
          onClick={() => setVisible(false)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          ✕
        </button>
      </div>

      {state ? (
        <div className="space-y-3">
          {/* Tension Meter */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-zinc-500">Tension</span>
              <span style={{ color: getTensionColor(state.tension.currentTension) }}>
                {(state.tension.currentTension * 100).toFixed(0)}%
                <span className="ml-1 text-zinc-500">
                  {state.tension.trend === 'rising' ? '↑' : state.tension.trend === 'falling' ? '↓' : '→'}
                </span>
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-200"
                style={{ 
                  width: `${state.tension.currentTension * 100}%`,
                  backgroundColor: getTensionColor(state.tension.currentTension)
                }}
              />
            </div>
          </div>

          {/* Current Phrase */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Phrase:</span>
            {state.currentPhrase ? (
              <>
                <span className="text-indigo-400">{state.currentPhrase.structure}</span>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${state.phraseProgress * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <span className="text-zinc-600">—</span>
            )}
          </div>

          {/* Motif Status */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Motif:</span>
            {state.inMotif ? (
              <span className="text-pink-400">♫ {state.currentMotifName}</span>
            ) : (
              <span className="text-zinc-600">—</span>
            )}
          </div>

          {/* Breather Status */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Breather:</span>
            {state.isInBreather ? (
              <span className="text-emerald-400">
                🌬️ Active ({state.breatherPatternsRemaining} left)
              </span>
            ) : state.breatherRecommendation.shouldBreather ? (
              <span className="text-amber-400">
                ⚠️ {state.breatherRecommendation.urgency}
              </span>
            ) : (
              <span className="text-zinc-600">—</span>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
            <div className="text-center">
              <div className="text-lg text-indigo-400">{state.phrasesComposed}</div>
              <div className="text-zinc-600">Phrases</div>
            </div>
            <div className="text-center">
              <div className="text-lg text-pink-400">{state.motifsPlayed}</div>
              <div className="text-zinc-600">Motifs</div>
            </div>
            <div className="text-center">
              <div className="text-lg text-emerald-400">{state.breathersGiven}</div>
              <div className="text-zinc-600">Breathers</div>
            </div>
          </div>

          {/* Render Stats */}
          {renderStats && (
            <div className="pt-2 border-t border-zinc-800">
              <div className="text-zinc-500 mb-1">Render Stats</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span>Obstacles: {renderStats.totalObstacles}</span>
                <span>Draw Calls: {renderStats.drawCalls}</span>
                <span className="col-span-2 text-zinc-600">
                  Instanced: {renderStats.instancedObstacles}/{renderStats.totalObstacles}
                </span>
              </div>
            </div>
          )}

          {/* Debug Tier/Phase */}
          {debug && 'tier' in debug && 'phase' in debug && (
            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                style={{ backgroundColor: getPhaseColor(String((debug as {phase: string}).phase)) + '33', color: getPhaseColor(String((debug as {phase: string}).phase)) }}
              >
                {String((debug as {phase: string}).phase)}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400">
                {String((debug as {tier: string}).tier)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-zinc-600 text-center py-4">
          Symphony not active
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-zinc-600 text-center">
        Press ` to toggle
      </div>
    </div>
  )
}
