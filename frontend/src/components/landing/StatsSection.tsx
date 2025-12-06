/**
 * StatsSection - Animated statistics display
 * Shows game stats with animated counters and recent matches
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { NumberCounter, formatTime, formatTimeAgo } from './animations'
import { useScrollAnimation } from '@/hooks/landing/useScrollAnimation'
import type { StatsSectionProps } from './types'

export function StatsSection({ stats, isLoading, reducedMotion }: StatsSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isVisible } = useScrollAnimation(containerRef, { threshold: 0.3 })

    const statItems = [
      { label: 'Games Played', value: stats?.totalGames ?? 0, suffix: '' },
      { label: 'Players Online', value: stats?.activePlayers ?? 0, suffix: '' },
      { label: 'Questions Answered', value: stats?.questionsAnswered ?? 0, suffix: '' },
      { label: 'Avg Match Time', value: stats?.avgMatchDuration ?? 0, suffix: '', format: formatTime },
    ]

  return (
    <section
      id="stats"
      className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f1a]"
      aria-label="Game statistics"
    >
        <div ref={containerRef} className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Join the Community
            </h2>
            <p className="text-neutral-400">
              Thousands of players are already competing
            </p>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {isVisible && !isLoading ? (
                    <>
                      <NumberCounter
                        value={stat.value}
                        duration={2000}
                        reducedMotion={reducedMotion}
                        format={stat.format}
                      />
                      {stat.suffix}
                    </>
                  ) : (
                    <span className="opacity-50">--</span>
                  )}
                </div>
                <div className="text-sm text-neutral-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Recent matches feed */}
          {stats?.recentMatches && stats.recentMatches.length > 0 && (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Recent Matches
              </h3>
              <div className="space-y-3">
                {stats.recentMatches.slice(0, 5).map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400 font-medium">{match.winner}</span>
                      <span className="text-neutral-600">defeated</span>
                      <span className="text-red-400">{match.loser}</span>
                    </div>
                    <span className="text-xs text-neutral-600">
                      {formatTimeAgo(match.timestamp)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Last updated indicator */}
          {stats?.lastUpdated && (
            <p className="text-center text-xs text-neutral-600 mt-8">
              Updated {formatTimeAgo(stats.lastUpdated)}
            </p>
          )}
        </div>
      </section>
    )
}
