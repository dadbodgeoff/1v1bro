/**
 * CelebrationOverlay - Full-screen celebration display component.
 * Requirements: 2.1, 2.5, 2.6
 * 
 * Displays purchase cinematics, tier-up fanfares, and achievement celebrations
 * with confetti particles, animations, and skip functionality.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Trophy, ShoppingBag, Coins, Star } from 'lucide-react';
import {
  CelebrationSystem,
  getCelebrationSystem,
  type Celebration,
  type CelebrationState,
  type CelebrationType,
} from '@/systems/polish/CelebrationSystem';
import { usePolishStore } from '@/stores/polishStore';

// ============================================
// Types
// ============================================

interface CelebrationOverlayProps {
  system?: CelebrationSystem;
}

// ============================================
// Icon Mapping
// ============================================

const CELEBRATION_ICONS: Record<CelebrationType, React.ComponentType<{ className?: string }>> = {
  'purchase': ShoppingBag,
  'coin-purchase': Coins,
  'tier-up': Star,
  'achievement': Trophy,
  'milestone': Trophy,
  'daily-reward': Sparkles,
};

// ============================================
// Rarity Colors
// ============================================

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

const RARITY_GLOW = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50',
};


// ============================================
// Confetti Particle Component
// ============================================

interface ConfettiParticleProps {
  index: number;
  reducedMotion: boolean;
}

function ConfettiParticle({ index, reducedMotion }: ConfettiParticleProps) {
  if (reducedMotion) return null;
  
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const color = colors[index % colors.length];
  const delay = Math.random() * 0.5;
  const duration = 2 + Math.random() * 2;
  const startX = Math.random() * 100;
  const endX = startX + (Math.random() - 0.5) * 40;
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color, left: `${startX}%` }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: '100vh',
        opacity: [1, 1, 0],
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        x: `${endX - startX}%`,
      }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
      }}
    />
  );
}

// ============================================
// Main Component
// ============================================

export function CelebrationOverlay({ system }: CelebrationOverlayProps) {
  const celebrationSystem = system ?? getCelebrationSystem();
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [state, setState] = useState<CelebrationState>('idle');
  const [queueLength, setQueueLength] = useState(0);
  
  const { settings } = usePolishStore();
  const reducedMotion = !settings.celebrationAnimations;

  // Subscribe to celebration system
  useEffect(() => {
    const unsubState = celebrationSystem.onStateChange((newState) => {
      setState(newState);
      setQueueLength(celebrationSystem.queueLength);
    });
    
    const unsubCelebration = celebrationSystem.onCelebrationChange((newCelebration) => {
      setCelebration(newCelebration);
      setQueueLength(celebrationSystem.queueLength);
    });
    
    // Initial state
    setCelebration(celebrationSystem.current);
    setState(celebrationSystem.state);
    setQueueLength(celebrationSystem.queueLength);
    
    return () => {
      unsubState();
      unsubCelebration();
    };
  }, [celebrationSystem]);

  // Handle skip
  const handleSkip = useCallback(() => {
    celebrationSystem.skip();
  }, [celebrationSystem]);

  // Handle click to skip
  const handleClick = useCallback(() => {
    if (state === 'displaying') {
      handleSkip();
    }
  }, [state, handleSkip]);

  // Handle keyboard skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === ' ') && state === 'displaying') {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleSkip]);

  if (!celebration || state === 'idle') {
    return null;
  }

  const Icon = CELEBRATION_ICONS[celebration.type];
  const rarity = celebration.data.rarity ?? 'common';
  const gradientClass = RARITY_COLORS[rarity];
  const glowClass = RARITY_GLOW[rarity];

  // Reduced motion: simple banner
  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pointer-events-none">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`bg-gradient-to-r ${gradientClass} px-6 py-3 rounded-lg shadow-lg pointer-events-auto`}
          onClick={handleClick}
        >
          <div className="flex items-center gap-3 text-white">
            <Icon className="w-6 h-6" />
            <div>
              <div className="font-bold">{celebration.data.title}</div>
              {celebration.data.subtitle && (
                <div className="text-sm opacity-90">{celebration.data.subtitle}</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }


  // Full celebration with animations
  return (
    <AnimatePresence>
      <motion.div
        key={celebration.id}
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} reducedMotion={reducedMotion} />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-6 p-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        >
          {/* Icon */}
          <motion.div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-2xl ${glowClass}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
          >
            <Icon className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-3xl font-bold text-white text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {celebration.data.title}
          </motion.h2>

          {/* Subtitle */}
          {celebration.data.subtitle && (
            <motion.p
              className="text-xl text-white/80 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {celebration.data.subtitle}
            </motion.p>
          )}

          {/* XP Reward */}
          {celebration.data.xpReward && (
            <motion.div
              className="flex items-center gap-2 text-yellow-400"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-lg font-semibold">+{celebration.data.xpReward} XP</span>
            </motion.div>
          )}

          {/* Amount (for coin purchases) */}
          {celebration.data.amount && (
            <motion.div
              className="flex items-center gap-2 text-yellow-400"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Coins className="w-5 h-5" />
              <span className="text-2xl font-bold">+{celebration.data.amount.toLocaleString()}</span>
            </motion.div>
          )}

          {/* Skip hint */}
          <motion.p
            className="text-sm text-white/50 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Tap anywhere or press Space to skip
          </motion.p>

          {/* Queue indicator */}
          {queueLength > 0 && (
            <motion.div
              className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-white text-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              1 of {queueLength + 1}
            </motion.div>
          )}

          {/* Skip button */}
          <motion.button
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CelebrationOverlay;
