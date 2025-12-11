/**
 * useArenaConfig - Manages arena configuration for GameArena
 * 
 * Handles sending arena config to server (host only)
 * 
 * @module hooks/useArenaConfig
 */

import { useEffect, type MutableRefObject } from 'react'
import type { GameEngine } from '@/game'

interface UseArenaConfigOptions {
  engineRef: MutableRefObject<GameEngine | null>
  playerId: string
  isPlayer1: boolean
  sendArenaConfig?: (config: unknown) => void
}

export function useArenaConfig({
  engineRef,
  playerId,
  isPlayer1,
  sendArenaConfig,
}: UseArenaConfigOptions): void {
  // Send arena config to server when engine is ready (host only)
  useEffect(() => {
    if (sendArenaConfig && engineRef.current && isPlayer1) {
      // Small delay to ensure server is ready
      const timer = setTimeout(() => {
        const config = engineRef.current?.getMapConfig()
        if (config) {
          sendArenaConfig(config)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [sendArenaConfig, isPlayer1, playerId, engineRef])
}
