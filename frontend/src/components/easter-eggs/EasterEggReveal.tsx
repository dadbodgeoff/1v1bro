/**
 * EasterEggReveal - Discovery and repeat animations for easter eggs.
 * Requirements: 6.3, 6.6
 * 
 * Shows discovery animation for first-time finds and repeat animation
 * for subsequent triggers.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  HINT_ANIMATION_MS,
  REVEAL_ANIMATION_MS,
} from '../../systems/polish/EasterEggRegistry';
import type { EasterEggActivation } from '../../systems/polish/EasterEggRegistry';
import { usePolishStore } from '../../stores/polishStore';

// ============================================
// Types
// ============================================

interface EasterEggRevealProps {
  activation: EasterEggActivation | null;
  onComplete?: () => void;
}

type RevealPhase = 'idle' | 'hint' | 'reveal' | 'display' | 'exit';

// ============================================
// Styles
// ============================================

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  pointerEvents: 'auto',
};

const backdropStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
};

const contentStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  padding: '32px 48px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '2px solid rgba(255, 215, 0, 0.5)',
  boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
  maxWidth: '400px',
  textAlign: 'center',
};

const iconContainerStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '40px',
  boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#ffd700',
  margin: 0,
  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.7)',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '2px',
};

const hintStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.6)',
  margin: 0,
  fontStyle: 'italic',
};

const rewardStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px 16px',
  borderRadius: '8px',
  background: 'rgba(255, 215, 0, 0.2)',
  border: '1px solid rgba(255, 215, 0, 0.3)',
  fontSize: '14px',
  color: '#ffd700',
};

const skipHintStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-40px',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.4)',
};

// ============================================
// Animation Variants
// ============================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5, y: 50 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 15,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -30,
    transition: { duration: 0.2 },
  },
};

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: 'spring' as const,
      damping: 10,
      stiffness: 200,
      delay: 0.2,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.3 },
  }),
};

const flashVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: [0, 1, 0],
    transition: { duration: 0.3 },
  },
};

// ============================================
// Component
// ============================================

export function EasterEggReveal({ activation, onComplete }: EasterEggRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('idle');
  const [currentActivation, setCurrentActivation] = useState<EasterEggActivation | null>(null);
  
  const celebrationAnimations = usePolishStore((s) => s.settings.celebrationAnimations);
  const reducedMotion = !celebrationAnimations;

  // Handle new activation
  useEffect(() => {
    if (!activation) return;
    
    setCurrentActivation(activation);
    
    if (reducedMotion) {
      // Skip animations in reduced motion mode
      setPhase('display');
      const timer = setTimeout(() => {
        setPhase('idle');
        setCurrentActivation(null);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    // Start animation sequence
    if (activation.isFirstDiscovery) {
      // Discovery animation: hint -> reveal -> display
      setPhase('hint');
      
      const hintTimer = setTimeout(() => {
        setPhase('reveal');
        
        const revealTimer = setTimeout(() => {
          setPhase('display');
          
          const displayTimer = setTimeout(() => {
            setPhase('exit');
            
            const exitTimer = setTimeout(() => {
              setPhase('idle');
              setCurrentActivation(null);
              onComplete?.();
            }, 300);
            
            return () => clearTimeout(exitTimer);
          }, REVEAL_ANIMATION_MS);
          
          return () => clearTimeout(displayTimer);
        }, HINT_ANIMATION_MS);
        
        return () => clearTimeout(revealTimer);
      }, HINT_ANIMATION_MS);
      
      return () => clearTimeout(hintTimer);
    } else {
      // Repeat animation: shorter reveal -> display
      setPhase('reveal');
      
      const revealTimer = setTimeout(() => {
        setPhase('display');
        
        const displayTimer = setTimeout(() => {
          setPhase('exit');
          
          const exitTimer = setTimeout(() => {
            setPhase('idle');
            setCurrentActivation(null);
            onComplete?.();
          }, 200);
          
          return () => clearTimeout(exitTimer);
        }, 1000); // Shorter display for repeat
        
        return () => clearTimeout(displayTimer);
      }, 200);
      
      return () => clearTimeout(revealTimer);
    }
  }, [activation, reducedMotion, onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    setPhase('exit');
    setTimeout(() => {
      setPhase('idle');
      setCurrentActivation(null);
      onComplete?.();
    }, 200);
  }, [onComplete]);

  // Handle click to skip
  const handleClick = useCallback(() => {
    if (phase === 'display') {
      handleSkip();
    }
  }, [phase, handleSkip]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'idle') {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleSkip]);

  if (phase === 'idle' || !currentActivation) {
    return null;
  }

  const { egg, isFirstDiscovery } = currentActivation;

  return (
    <AnimatePresence>
      <div style={overlayStyle} onClick={handleClick}>
        {/* Backdrop */}
        <motion.div
          style={backdropStyle}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        />
        
        {/* Flash effect for discovery */}
        {phase === 'hint' && isFirstDiscovery && (
          <motion.div
            style={{
              ...backdropStyle,
              background: 'rgba(255, 215, 0, 0.3)',
            }}
            variants={flashVariants}
            initial="hidden"
            animate="visible"
          />
        )}
        
        {/* Content */}
        {(phase === 'reveal' || phase === 'display' || phase === 'exit') && (
          <motion.div
            style={contentStyle}
            variants={contentVariants}
            initial="hidden"
            animate={phase === 'exit' ? 'exit' : 'visible'}
          >
            {/* Icon */}
            <motion.div
              style={iconContainerStyle}
              variants={iconVariants}
              initial="hidden"
              animate="visible"
            >
              <span role="img" aria-label="easter egg">🥚</span>
            </motion.div>
            
            {/* Title */}
            <motion.p
              style={subtitleStyle}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              custom={0.3}
            >
              {isFirstDiscovery ? 'Secret Discovered!' : 'Secret Activated'}
            </motion.p>
            
            <motion.h2
              style={titleStyle}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              custom={0.4}
            >
              {egg.name}
            </motion.h2>
            
            {/* Hint text */}
            <motion.p
              style={hintStyle}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              custom={0.5}
            >
              "{egg.hint}"
            </motion.p>
            
            {/* Reward */}
            {egg.reward && isFirstDiscovery && (
              <motion.div
                style={rewardStyle}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                custom={0.6}
              >
                <span role="img" aria-label="gift">🎁</span>
                {' '}Reward: {egg.reward.type === 'xp' 
                  ? `+${egg.reward.amount} XP`
                  : `${egg.reward.type} unlocked!`
                }
              </motion.div>
            )}
            
            {/* Skip hint */}
            {phase === 'display' && (
              <motion.p
                style={skipHintStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Click or press Escape to dismiss
              </motion.p>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

export default EasterEggReveal;
