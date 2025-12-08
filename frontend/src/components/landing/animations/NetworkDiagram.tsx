/**
 * NetworkDiagram - Animated tech stack network visualization
 * Shows data flow between client, server, and database
 * 
 * Validates: Requirements 5.3, 5.4, 5.5
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface NetworkDiagramProps {
  reducedMotion: boolean
}

interface Node {
  id: string
  label: string
  icon: string
  x: number
  y: number
}

interface Connection {
  from: string
  to: string
}

const NODES: Node[] = [
  { id: 'client', label: 'Browser', icon: '🌐', x: 50, y: 100 },
  { id: 'server', label: 'Server', icon: '⚡', x: 200, y: 100 },
  { id: 'database', label: 'Database', icon: '🗄️', x: 350, y: 100 },
]

const CONNECTIONS: Connection[] = [
  { from: 'client', to: 'server' },
  { from: 'server', to: 'database' },
]

export function NetworkDiagram({ reducedMotion }: NetworkDiagramProps) {
  const [activePacket, setActivePacket] = useState<number>(0)
  const [pulsingNode, setPulsingNode] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (reducedMotion) return

    // Animate packets flowing through network
    let packetIndex = 0
    const cycleTime = 4000 // 4 second cycle
    const packetDuration = cycleTime / (CONNECTIONS.length * 2)

    intervalRef.current = setInterval(() => {
      packetIndex = (packetIndex + 1) % (CONNECTIONS.length * 2)
      setActivePacket(packetIndex)

      // Pulse receiving node
      const connectionIndex = Math.floor(packetIndex / 2)
      const isReturn = packetIndex % 2 === 1
      const connection = CONNECTIONS[connectionIndex]
      if (connection) {
        setPulsingNode(isReturn ? connection.from : connection.to)
        setTimeout(() => setPulsingNode(null), 400)
      }
    }, packetDuration)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [reducedMotion])

  const getNodeById = (id: string) => NODES.find(n => n.id === id)

  return (
    <div className="relative w-full max-w-md mx-auto h-48">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Connection lines */}
        {CONNECTIONS.map((conn, idx) => {
          const from = getNodeById(conn.from)
          const to = getNodeById(conn.to)
          if (!from || !to) return null

          return (
            <g key={`${conn.from}-${conn.to}`}>
              {/* Base line */}
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#374151"
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              
              {/* Animated packet */}
              {!reducedMotion && (
                <motion.circle
                  r="6"
                  fill="#6366f1"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: Math.floor(activePacket / 2) === idx ? 1 : 0,
                    cx: activePacket % 2 === 0 ? [from.x, to.x] : [to.x, from.x],
                    cy: activePacket % 2 === 0 ? [from.y, to.y] : [to.y, from.y],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: 'linear',
                  }}
                />
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {NODES.map((node) => (
          <g key={node.id}>
            {/* Node circle */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="30"
              fill="#1f2937"
              stroke={pulsingNode === node.id ? '#6366f1' : '#374151'}
              strokeWidth="2"
              animate={{
                scale: pulsingNode === node.id ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Node icon */}
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fontSize="20"
            >
              {node.icon}
            </text>
            
            {/* Node label */}
            <text
              x={node.x}
              y={node.y + 55}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="12"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Latency indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-neutral-400">
        <motion.div
          className="w-2 h-2 rounded-full bg-green-500"
          animate={reducedMotion ? {} : { opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span>&lt; 50ms typical latency</span>
      </div>
    </div>
  )
}
