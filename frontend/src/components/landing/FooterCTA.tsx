/**
 * FooterCTA - Final call-to-action section
 * Full-width section with animated background
 * 
 * Validates: Requirements 8.4
 */

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { FooterCTAProps } from './types'

export function FooterCTA({ onCTAClick, playerCount, isAuthenticated }: FooterCTAProps) {
  return (
    <section
      className="relative py-24 overflow-hidden"
      aria-label="Get started"
    >
        {/* Gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f2a] to-[#0a0a0a]"
          aria-hidden="true"
        />

        {/* Subtle particle effect (CSS-based for performance) */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Dominate?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-400 mb-10 max-w-lg mx-auto"
          >
            Join thousands of players competing in real-time trivia battles.
            Test your knowledge and reflexes.
          </motion.p>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={onCTAClick}
              className="px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              {isAuthenticated ? 'Play Now' : playerCount ? `Join ${playerCount.toLocaleString()} Players Now` : 'Sign Up Free'}
            </button>
          </motion.div>

          {/* Secondary links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex justify-center gap-6 text-sm"
          >
            <Link
              to="/leaderboards"
              className="text-neutral-500 hover:text-white transition-colors"
            >
              View Leaderboards
            </Link>
            <span className="text-neutral-700">•</span>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Bottom border gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"
          aria-hidden="true"
        />
      </section>
  )
}
