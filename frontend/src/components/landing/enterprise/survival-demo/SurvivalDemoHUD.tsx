/**
 * SurvivalDemoHUD - HUD overlay for survival demo
 * 
 * Displays score, distance, combo, lives, and speed.
 * Compact design for landing page integration.
 * 
 * @module landing/enterprise/survival-demo/SurvivalDemoHUD
 */

import { cn } from '@/utils/helpers'
import type { DemoGameState } from './types'

export interface SurvivalDemoHUDProps {
  gameState: DemoGameState
  className?: string
}

export function SurvivalDemoHUD({ gameState, className }: SurvivalDemoHUDProps) {
  const { distance, score, combo, lives, maxLives, speed, phase } = gameState
  
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* Top bar - Score and Distance */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
        {/* Left: Score */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Score</div>
          <div className="text-lg font-bold text-white tabular-nums">
            {score.toLocaleString()}
          </div>
        </div>
        
        {/* Center: Distance */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Distance</div>
          <div className="text-lg font-bold text-[#F97316] tabular-nums">
            {distance}m
          </div>
        </div>
        
        {/* Right: Lives */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Lives</div>
          <div className="flex gap-1 mt-0.5">
            {Array.from({ length: maxLives }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  i < lives
                    ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                    : 'bg-gray-700'
                )}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom bar - Combo and Speed */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
        {/* Combo */}
        {combo > 0 && (
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase">Combo</span>
              <span className={cn(
                'text-lg font-bold tabular-nums',
                combo >= 10 ? 'text-yellow-400' : combo >= 5 ? 'text-[#F97316]' : 'text-white'
              )}>
                x{combo}
              </span>
              {combo >= 5 && (
                <span className="text-yellow-400 animate-pulse">🔥</span>
              )}
            </div>
          </div>
        )}
        
        {/* Speed indicator */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 ml-auto">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Speed</div>
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-yellow-400 transition-all"
                style={{ width: `${Math.min(100, (speed / 400) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-white tabular-nums">{Math.round(speed)}</span>
          </div>
        </div>
      </div>
      
      {/* Phase overlays */}
      {phase === 'intro' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">SURVIVAL MODE</div>
            <div className="text-sm text-gray-400">Endless Runner Demo</div>
          </div>
        </div>
      )}
      
      {phase === 'hit' && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
      )}
      
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="text-xl font-bold text-red-500 mb-1">GAME OVER</div>
            <div className="text-sm text-gray-400">Restarting...</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SurvivalDemoHUD
