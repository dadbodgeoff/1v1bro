/**
 * TechShowcase - Technology badges and network diagram
 * Shows the tech stack powering the game
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NetworkDiagram } from './animations'
import type { TechShowcaseProps, TechBadge } from './types'

const TECH_BADGES: TechBadge[] = [
  {
    name: 'React 18',
    version: '18.2',
    description: 'Concurrent rendering for smooth UI updates',
    badge: 'Concurrent',
    icon: '⚛️',
  },
  {
    name: 'TypeScript',
    version: '5.0',
    description: 'Type-safe code for reliability',
    badge: 'Type-Safe',
    icon: '📘',
  },
  {
    name: 'WebSocket',
    description: 'Real-time bidirectional communication',
    badge: 'Real-Time',
    icon: '🔌',
  },
  {
    name: 'Canvas 2D',
    description: 'Hardware-accelerated game rendering',
    badge: '60fps',
    icon: '🎮',
  },
  {
    name: 'FastAPI',
    description: 'High-performance async Python backend',
    badge: 'Async',
    icon: '⚡',
  },
  {
    name: 'Supabase',
    description: 'Real-time database with instant sync',
    badge: 'Real-Time DB',
    icon: '🗄️',
  },
]

export function TechShowcase({ reducedMotion }: TechShowcaseProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)

  return (
    <section
      id="tech"
      className="py-24 bg-[#0a0a0a]"
      aria-label="Technology stack"
    >
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for Performance
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Powered by modern technologies for a seamless gaming experience
            </p>
          </motion.div>

          {/* Tech badges grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {TECH_BADGES.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative"
                onMouseEnter={() => setHoveredBadge(tech.name)}
                onMouseLeave={() => setHoveredBadge(null)}
              >
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center cursor-pointer transition-all hover:bg-white/10 hover:border-indigo-500/50">
                  <div className="text-2xl mb-2">{tech.icon}</div>
                  <div className="text-sm font-medium text-white">{tech.name}</div>
                  <div className="mt-1 px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full inline-block">
                    {tech.badge}
                  </div>
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredBadge === tech.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-white/10 rounded-lg shadow-xl"
                    >
                      <div className="text-sm font-medium text-white mb-1">
                        {tech.name} {tech.version && <span className="text-neutral-500">v{tech.version}</span>}
                      </div>
                      <div className="text-xs text-neutral-400">{tech.description}</div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral-900" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Network diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Real-Time Architecture
            </h3>
            <NetworkDiagram reducedMotion={reducedMotion} />
          </motion.div>
        </div>
      </section>
  )
}
