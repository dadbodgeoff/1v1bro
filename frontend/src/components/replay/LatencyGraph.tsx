/**
 * Latency Graph
 * Visualizes network latency over the replay timeline
 */

import { useMemo, useState, useCallback, useRef } from 'react'
import type { TelemetryFrame } from '../../game/telemetry'

interface LatencyGraphProps {
  frames: TelemetryFrame[]
  currentFrameIndex: number
}

interface TooltipData {
  x: number
  y: number
  rtt: number
  frameIndex: number
  timeFromDeath: number
}

const GRAPH_HEIGHT = 60
const GRAPH_PADDING = 4

export function LatencyGraph({ frames, currentFrameIndex }: LatencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const { maxRtt, points, currentRtt } = useMemo(() => {
    const rttValues = frames.map(f => f.networkStats.rttMs)
    const max = Math.max(...rttValues, 100) // At least 100ms scale
    
    const pts = frames.map((frame, i) => {
      const x = (i / (frames.length - 1)) * 100
      const y = GRAPH_HEIGHT - (frame.networkStats.rttMs / max) * (GRAPH_HEIGHT - GRAPH_PADDING * 2) - GRAPH_PADDING
      return { x, y, rtt: frame.networkStats.rttMs }
    })

    return {
      maxRtt: max,
      points: pts,
      currentRtt: frames[currentFrameIndex]?.networkStats.rttMs ?? 0,
    }
  }, [frames, currentFrameIndex])

  // Create SVG path
  const pathD = useMemo(() => {
    if (points.length === 0) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }, [points])

  // Current position marker
  const currentX = (currentFrameIndex / (frames.length - 1)) * 100
  const currentY = points[currentFrameIndex]?.y ?? GRAPH_HEIGHT / 2

  // Color based on latency
  const getRttColor = (rtt: number) => {
    if (rtt < 50) return '#44ff44' // Green
    if (rtt < 100) return '#ffff44' // Yellow
    return '#ff4444' // Red
  }

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || frames.length === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const relativeX = (e.clientX - rect.left) / rect.width
    const frameIndex = Math.round(relativeX * (frames.length - 1))
    
    if (frameIndex >= 0 && frameIndex < frames.length) {
      const frame = frames[frameIndex]
      const rtt = frame.networkStats.rttMs
      // Calculate time from death (assuming 60fps, last frame is death)
      const timeFromDeath = ((frameIndex - frames.length + 1) / 60)
      
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        rtt,
        frameIndex,
        timeFromDeath,
      })
    }
  }, [frames])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div className="bg-gray-800 rounded p-3 relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Network Latency (RTT)</span>
        <span className="text-xs font-mono" style={{ color: getRttColor(currentRtt) }}>
          {currentRtt}ms
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 100 ${GRAPH_HEIGHT}`}
        className="w-full cursor-crosshair"
        style={{ height: GRAPH_HEIGHT }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background grid */}
        <line x1="0" y1={GRAPH_HEIGHT / 2} x2="100" y2={GRAPH_HEIGHT / 2} stroke="#374151" strokeWidth="0.5" />
        
        {/* Threshold lines */}
        <line
          x1="0"
          y1={GRAPH_HEIGHT - (50 / maxRtt) * (GRAPH_HEIGHT - GRAPH_PADDING * 2) - GRAPH_PADDING}
          x2="100"
          y2={GRAPH_HEIGHT - (50 / maxRtt) * (GRAPH_HEIGHT - GRAPH_PADDING * 2) - GRAPH_PADDING}
          stroke="#44ff44"
          strokeWidth="0.3"
          strokeDasharray="2,2"
        />
        <line
          x1="0"
          y1={GRAPH_HEIGHT - (100 / maxRtt) * (GRAPH_HEIGHT - GRAPH_PADDING * 2) - GRAPH_PADDING}
          x2="100"
          y2={GRAPH_HEIGHT - (100 / maxRtt) * (GRAPH_HEIGHT - GRAPH_PADDING * 2) - GRAPH_PADDING}
          stroke="#ffff44"
          strokeWidth="0.3"
          strokeDasharray="2,2"
        />

        {/* RTT line */}
        <path
          d={pathD}
          fill="none"
          stroke="#4488ff"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Current position marker */}
        <line
          x1={currentX}
          y1="0"
          x2={currentX}
          y2={GRAPH_HEIGHT}
          stroke="#ffffff"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={currentX}
          cy={currentY}
          r="2"
          fill={getRttColor(currentRtt)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs shadow-lg z-10"
          style={{
            left: Math.min(tooltip.x + 10, 280),
            top: tooltip.y - 40,
          }}
        >
          <div className="font-mono" style={{ color: getRttColor(tooltip.rtt) }}>
            {tooltip.rtt}ms
          </div>
          <div className="text-gray-400">
            {tooltip.timeFromDeath.toFixed(2)}s from death
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0ms</span>
        <div className="flex gap-3">
          <span className="text-green-400">●&lt;50ms</span>
          <span className="text-yellow-400">●50-100ms</span>
          <span className="text-red-400">●&gt;100ms</span>
        </div>
        <span>{maxRtt}ms</span>
      </div>
    </div>
  )
}
