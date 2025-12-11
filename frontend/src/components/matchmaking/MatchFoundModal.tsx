import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MatchFoundModalProps {
  opponentName: string;
}

export function MatchFoundModal({ opponentName }: MatchFoundModalProps) {
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pb-safe"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center safe-area-inset"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 10 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
        >
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Match Found!
        </motion.h2>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <p className="text-zinc-400 text-sm mb-2">Your opponent</p>
          <p className="text-xl font-semibold text-white">{opponentName}</p>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-500 text-sm"
        >
          Joining lobby in {countdown}...
        </motion.div>
        
        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 3, ease: 'linear' }}
          className="mt-4 h-1 bg-emerald-500 rounded-full origin-left"
        />
      </motion.div>
    </motion.div>
  );
}
