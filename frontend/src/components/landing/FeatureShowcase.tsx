/**
 * FeatureShowcase - Scroll-animated feature cards section
 * Displays game features with animated demonstrations
 * 
 * Validates: Requirements 3.1, 3.2
 */

import { motion } from 'framer-motion'
import { FeatureCard } from './FeatureCard'
import type { FeatureShowcaseProps, FeatureConfig } from './types'

// Feature configurations
const FEATURES: FeatureConfig[] = [
  {
    id: 'combat',
    title: 'Real-Time Combat',
    description: 'Dodge projectiles, land shots, and outmaneuver your opponent in fast-paced arena battles. Every millisecond counts.',
    icon: 'crosshair',
    animation: {
      type: 'combat',
      config: { projectileSpeed: 300, damageAmount: 25, cycleTime: 3000 },
    },
  },
  {
    id: 'trivia',
    title: 'Trivia Integration',
    description: 'Answer questions correctly to gain power-ups and advantages. Knowledge is your ultimate weapon.',
    icon: 'brain',
    animation: {
      type: 'trivia',
      config: {
        question: 'What year was Fortnite released?',
        options: ['2015', '2016', '2017', '2018'],
        correctIndex: 2,
        cycleTime: 4000,
      },
    },
  },
  {
    id: 'arena',
    title: 'Dynamic Arenas',
    description: 'Navigate teleporters, avoid hazards, and use the terrain to your advantage. Master the map to dominate.',
    icon: 'map',
    animation: {
      type: 'arena',
      config: { mapScale: 0.25, playerPaths: [], cycleTime: 5000 },
    },
  },
  {
    id: 'competitive',
    title: 'Competitive Play',
    description: "Climb the leaderboards, track your stats, and prove you're the best. Your rank awaits.",
    icon: 'trophy',
    animation: {
      type: 'competitive',
      config: {
        leaderboardEntries: [
          { rank: 1, name: 'ProPlayer99', elo: 2450 },
          { rank: 2, name: 'QuizMaster', elo: 2380 },
          { rank: 3, name: 'ArenaKing', elo: 2290 },
        ],
        cycleTime: 3000,
      },
    },
  },
]

export function FeatureShowcase({ reducedMotion }: FeatureShowcaseProps) {
  return (
    <section
      id="features"
      className="py-24 bg-[#0a0a0a]"
      aria-label="Game features"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Players Love It
          </h2>
          <p className="text-neutral-400 max-w-lg mx-auto">
            A unique blend of fast-paced combat and brain-teasing trivia
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="space-y-24 md:space-y-32">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
