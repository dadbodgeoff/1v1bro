/**
 * Latency Indicator - Shows current ping to server
 * 
 * Color coding:
 * - Green: <50ms (excellent)
 * - Yellow: 50-100ms (good)
 * - Orange: 100-150ms (acceptable)
 * - Red: >150ms (poor)
 */

import { useEffect, useState } from 'react'
import { wsService } from '@/services/websocket'

interface LatencyIndicatorProps {
  className?: string
  showTickRate?: boolean
}

export function LatencyIndicator({ className = '', showTickRate = true }: LatencyIndicatorProps) {
  const [latency, setLatency] = useState(0)
  const [tickRate, setTickRate] = useState(0)

  useEffect(() => {
    // Ping every 2 seconds
    const pingInterval = setInterval(() => {
      wsService.ping()
    }, 2000)

    // Update latency display every 500ms
    const updateInterval = setInterval(() => {
      setLatency(wsService.getLatency())
    }, 500)

    // Initial ping
    wsService.ping()

    // Track tick rate using a ref-like closure variable
    let lastTickTime = 0

    // Subscribe to state_update to measure tick rate
    const unsubStateUpdate = wsService.on('state_update', () => {
      const now = Date.now()
      if (lastTickTime > 0) {
        const delta = now - lastTickTime
        // Calculate updates per second (smoothed)
        const rate = Math.round(1000 / delta)
        setTickRate((prev) => Math.round(prev * 0.8 + rate * 0.2)) // Smooth it
      }
      lastTickTime = now
    })

    return () => {
      clearInterval(pingInterval)
      clearInterval(updateInterval)
      unsubStateUpdate()
    }
  }, [])

  const getLatencyColor = (ms: number): string => {
    if (ms === 0) return 'text-neutral-500' // No data yet
    if (ms < 50) return 'text-green-400'
    if (ms < 100) return 'text-yellow-400'
    if (ms < 150) return 'text-orange-400'
    return 'text-red-400'
  }

  const getLatencyBg = (ms: number): string => {
    if (ms === 0) return 'bg-neutral-500/20'
    if (ms < 50) return 'bg-green-500/20'
    if (ms < 100) return 'bg-yellow-500/20'
    if (ms < 150) return 'bg-orange-500/20'
    return 'bg-red-500/20'
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 ${getLatencyBg(latency)} ${className}`}
    >
      {/* Signal bars */}
      <div className="flex items-end gap-0.5 h-3">
        <div
          className={`w-1 rounded-sm transition-colors ${
            latency > 0 ? getLatencyColor(latency) : 'bg-neutral-600'
          }`}
          style={{ height: '33%', opacity: latency > 150 ? 0.3 : 1 }}
        />
        <div
          className={`w-1 rounded-sm transition-colors ${
            latency > 0 && latency < 150 ? getLatencyColor(latency) : 'bg-neutral-600'
          }`}
          style={{ height: '66%', opacity: latency >= 100 ? 0.3 : 1 }}
        />
        <div
          className={`w-1 rounded-sm transition-colors ${
            latency > 0 && latency < 100 ? getLatencyColor(latency) : 'bg-neutral-600'
          }`}
          style={{ height: '100%', opacity: latency >= 50 ? 0.3 : 1 }}
        />
      </div>

      {/* Ping value */}
      <span className={`text-[11px] font-mono font-medium ${getLatencyColor(latency)}`}>
        {latency > 0 ? `${latency}ms` : '---'}
      </span>

      {/* Tick rate (sync speed) */}
      {showTickRate && tickRate > 0 && (
        <>
          <div className="w-px h-3 bg-white/20" />
          <span className="text-[10px] font-mono text-cyan-400">
            {tickRate}Hz
          </span>
        </>
      )}
    </div>
  )
}
