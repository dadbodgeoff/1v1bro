import { motion } from 'framer-motion';

interface QueueStatusProps {
  queueTime: number;
  queuePosition: number | null;
  queueSize: number;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function QueueStatus({ queueTime, queuePosition, queueSize, onCancel }: QueueStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Pulsing search indicator */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 rounded-full bg-white/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-white/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <div className="absolute inset-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-2">
          Searching for opponent...
        </h2>
        
        <p className="text-zinc-400 text-sm mb-6">
          Finding a worthy challenger
        </p>
        
        {/* Queue stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-2xl font-mono font-bold text-white">
              {formatTime(queueTime)}
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-wide">
              Elapsed
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-2xl font-mono font-bold text-white">
              {queuePosition !== null ? `#${queuePosition}` : '—'}
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-wide">
              Position
            </div>
          </div>
        </div>
        
        {queueSize > 0 && (
          <p className="text-zinc-500 text-sm mb-6">
            {queueSize} player{queueSize !== 1 ? 's' : ''} in queue
          </p>
        )}
        
        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
