/**
 * AchievementCinematic - Full-screen achievement unlock display.
 * Requirements: 5.1, 5.2, 5.5
 * 
 * Displays achievement icon, name, description, rarity glow,
 * and queue indicator for multiple achievements.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Trophy } from 'lucide-react';
import {
  CinematicController,
  getCinematicController,
  type AchievementCinematic as AchievementCinematicType,
  type CinematicState,
  type AchievementRarity,
} from '@/systems/polish/CinematicController';
import { usePolishStore } from '@/stores/polishStore';

// ============================================
// Types
// ============================================

interface AchievementCinematicProps {
  controller?: CinematicController;
}

// ============================================
// Rarity Styling
// ============================================

const RARITY_COLORS: Record<AchievementRarity, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-purple-500',
};

const RARITY_GLOW: Record<AchievementRarity, string> = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-gray-400/50',
  gold: 'shadow-yellow-500/50',
  platinum: 'shadow-cyan-400/50',
};

const RARITY_BORDER: Record<AchievementRarity, string> = {
  bronze: 'border-amber-500',
  silver: 'border-gray-400',
  gold: 'border-yellow-500',
  platinum: 'border-cyan-400',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};


// ============================================
// Particle Burst Component
// ============================================

interface ParticleBurstProps {
  rarity: AchievementRarity;
}

function ParticleBurst({ rarity }: ParticleBurstProps) {
  const particleCount = rarity === 'platinum' ? 40 : rarity === 'gold' ? 30 : 20;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * 360;
        const distance = 100 + Math.random() * 150;
        const delay = Math.random() * 0.3;
        const size = 4 + Math.random() * 8;
        
        return (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${RARITY_COLORS[rarity]}`}
            style={{
              left: '50%',
              top: '50%',
              width: size,
              height: size,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.3 + delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function AchievementCinematic({ controller }: AchievementCinematicProps) {
  const cinematicController = controller ?? getCinematicController();
  const [cinematic, setCinematic] = useState<AchievementCinematicType | null>(null);
  const [state, setState] = useState<CinematicState>('idle');
  const [queueLength, setQueueLength] = useState(0);
  
  const { settings } = usePolishStore();
  const reducedMotion = !settings.celebrationAnimations;

  // Subscribe to cinematic controller
  useEffect(() => {
    const unsubState = cinematicController.onStateChange((newState) => {
      setState(newState);
      setQueueLength(cinematicController.queueLength);
    });
    
    const unsubCinematic = cinematicController.onCinematicChange((newCinematic) => {
      setCinematic(newCinematic);
      setQueueLength(cinematicController.queueLength);
    });
    
    // Initial state
    setCinematic(cinematicController.current);
    setState(cinematicController.state);
    setQueueLength(cinematicController.queueLength);
    
    return () => {
      unsubState();
      unsubCinematic();
    };
  }, [cinematicController]);

  // Handle skip
  const handleSkip = useCallback(() => {
    cinematicController.skip();
  }, [cinematicController]);

  // Handle click to skip
  const handleClick = useCallback(() => {
    if (state === 'displaying') {
      handleSkip();
    }
  }, [state, handleSkip]);

  // Handle keyboard skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === ' ') && (state === 'displaying' || state === 'entering')) {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleSkip]);

  if (!cinematic || state === 'idle') {
    return null;
  }

  const rarity = cinematic.rarity;
  const gradientClass = RARITY_COLORS[rarity];
  const glowClass = RARITY_GLOW[rarity];
  const borderClass = RARITY_BORDER[rarity];

  // Reduced motion: toast notification
  if (reducedMotion) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className={`bg-gray-900 border-2 ${borderClass} px-4 py-3 rounded-lg shadow-lg max-w-sm`}
          onClick={handleClick}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Achievement Unlocked</div>
              <div className="font-bold text-white">{cinematic.name}</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }


  // Full cinematic display
  return (
    <AnimatePresence>
      <motion.div
        key={cinematic.id}
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
      >
        {/* Backdrop with dim */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Particle burst */}
        {state === 'entering' && <ParticleBurst rarity={rarity} />}

        {/* Main Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-6 p-8"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        >
          {/* Achievement Icon */}
          <motion.div
            className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-2xl ${glowClass}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.1 }}
          >
            {/* Glow ring */}
            <motion.div
              className={`absolute inset-0 rounded-full border-4 ${borderClass}`}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            />
            
            {/* Icon or emoji */}
            <span className="text-5xl">{cinematic.icon}</span>
          </motion.div>

          {/* Achievement Unlocked Label */}
          <motion.div
            className="text-sm uppercase tracking-widest text-gray-400"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Achievement Unlocked
          </motion.div>

          {/* Achievement Name */}
          <motion.h2
            className="text-3xl font-bold text-white text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {cinematic.name}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg text-gray-300 text-center max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {cinematic.description}
          </motion.p>

          {/* Rarity Badge */}
          <motion.div
            className={`px-4 py-1 rounded-full bg-gradient-to-r ${gradientClass} text-white text-sm font-semibold uppercase tracking-wide`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {RARITY_LABELS[rarity]}
          </motion.div>

          {/* XP Reward */}
          {cinematic.xpReward && (
            <motion.div
              className="flex items-center gap-2 text-yellow-400"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-lg font-semibold">+{cinematic.xpReward} XP</span>
            </motion.div>
          )}

          {/* Skip hint */}
          <motion.p
            className="text-sm text-gray-500 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Tap anywhere or press Space to continue
          </motion.p>

          {/* Queue indicator */}
          {queueLength > 0 && (
            <motion.div
              className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full text-white text-sm"
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

export default AchievementCinematic;
