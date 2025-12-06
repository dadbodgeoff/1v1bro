/**
 * LoadingScreen - Initial loading animation
 * Displays branded loading animation while assets load
 * 
 * Validates: Requirements 7.1
 */

import { motion } from 'framer-motion'
import type { LoadingScreenProps } from './types'

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo silhouette with pulsing glow */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <h1 className="text-5xl font-black text-white/20">
          1v1 <span className="text-indigo-500/30">BRO</span>
        </h1>
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-full h-full bg-gradient-to-r from-indigo-500/50 to-purple-500/50" />
        </motion.div>
      </motion.div>

      {/* Loading text with animated ellipsis */}
      <div className="mt-8 text-neutral-500 text-sm">
        Loading
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
        >
          .
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-48 h-1 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}
