/**
 * usePowerUpEvents - Subscribes to power-up WebSocket events
 * Single responsibility: Power-up spawn and collection
 */

import { useEffect, useState } from 'react'
import { wsService } from '@/services/websocket'
import type { PowerUpState } from './types'

export function usePowerUpEvents(lobbyCode: string | undefined) {
  const [powerUps, setPowerUps] = useState<PowerUpState[]>([])

  useEffect(() => {
    if (!lobbyCode) return

    const unsubPowerupSpawn = wsService.on('powerup_spawn', (payload) => {
      const data = payload as { id: string; type: string; x: number; y: number }
      setPowerUps((prev) => [
        ...prev,
        {
          id: parseInt(data.id) || Date.now(),
          position: { x: data.x, y: data.y },
          type: data.type as PowerUpState['type'],
          active: true,
          collected: false,
        },
      ])
    })

    const unsubPowerupCollected = wsService.on('powerup_collected', (payload) => {
      const data = payload as { powerup_id: string; player_id: string }
      setPowerUps((prev) =>
        prev.map((pu) =>
          pu.id.toString() === data.powerup_id ? { ...pu, collected: true, active: false } : pu
        )
      )
    })

    return () => {
      unsubPowerupSpawn()
      unsubPowerupCollected()
    }
  }, [lobbyCode])

  return { powerUps }
}
