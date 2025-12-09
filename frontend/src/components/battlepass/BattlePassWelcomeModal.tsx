/**
 * BattlePassWelcomeModal - Enterprise Design System
 * First-time visitor modal highlighting both tracks
 * 
 * Typography hierarchy:
 * - Headline: text-[28px] md:text-[36px] font-extrabold tracking-[-0.03em]
 * - Subheadline: text-[15px] md:text-[17px] leading-[1.6] text-[#B4B4B4]
 * - Section titles: text-[16px] font-bold
 * - Body: text-[14px] text-[#B4B4B4]
 * - Labels: text-[12px] font-semibold uppercase tracking-[0.02em]
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'

const STORAGE_KEY = 'battlepass_welcome_dismissed'

// Battle pass price in coins
const PREMIUM_PRICE = 650

interface BattlePassWelcomeModalProps {
  onClose: () => void
}

export function BattlePassWelcomeModal({ onClose }: BattlePassWelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#111113] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Decorative glow effects */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#F97316]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#A855F7]/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header with gradient */}
          <div className="relative px-6 py-8 md:px-8 md:py-10 border-b border-white/10">
            {/* Grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />
            
            <div className="relative text-center">
              {/* Season badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-[#F97316]/20 border border-[#F97316]/30 rounded-full"
              >
                <span className="text-[#F97316]">⭐</span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.02em] text-[#F97316]">
                  Season 1: Elemental Warriors
                </span>
              </motion.div>
              
              {/* Headline - Enterprise typography */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[28px] md:text-[36px] font-extrabold tracking-[-0.03em] text-white leading-[1.1]"
              >
                Welcome to the Battle Pass
              </motion.h2>
              
              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[15px] md:text-[17px] leading-[1.6] text-[#B4B4B4] mt-3 max-w-md mx-auto"
              >
                Earn XP by playing matches and unlock amazing rewards as you progress through 35 tiers
              </motion.p>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 md:p-8">
            {/* Two Track Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid md:grid-cols-2 gap-4 mb-6"
            >
              {/* Free Track */}
              <div className="relative p-5 rounded-xl bg-[#1A1A1C] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xl">🎁</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white">Free Track</h3>
                    <p className="text-[12px] text-emerald-400 font-medium">Available to everyone</p>
                  </div>
                </div>
                
                <ul className="space-y-2.5">
                  {[
                    { icon: '🎭', text: 'Frostborne Valkyrie Skin' },
                    { icon: '🃏', text: '2 Player Cards' },
                    { icon: '🪙', text: '500 Coins Total' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-emerald-400 text-sm">✓</span>
                      <span className="text-[14px] text-[#B4B4B4]">{item.text}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.02em] text-emerald-400">
                    Free for all players
                  </span>
                </div>
              </div>

              {/* Premium Track */}
              <div className="relative p-5 rounded-xl bg-gradient-to-br from-[#F97316]/10 to-[#A855F7]/10 border border-[#F97316]/30">
                {/* Premium badge */}
                <div className="absolute -top-2 -right-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black bg-gradient-to-r from-[#F97316] to-[#FBBF24] rounded-full shadow-lg shadow-[#F97316]/30">
                    Premium
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F97316]/20 flex items-center justify-center">
                    <span className="text-xl">👑</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white">Premium Track</h3>
                    <p className="text-[12px] text-[#F97316] font-medium">{PREMIUM_PRICE} coins to unlock</p>
                  </div>
                </div>
                
                <ul className="space-y-2.5">
                  {[
                    { icon: '🎭', text: '5 Exclusive Skins' },
                    { icon: '😄', text: '8 Emotes' },
                    { icon: '🃏', text: '5 Player Cards' },
                    { icon: '🪙', text: '1,500 Coins Total' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-[#F97316] text-sm">✓</span>
                      <span className="text-[14px] text-[#B4B4B4]">{item.text}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-[#F97316]/20">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.02em] text-[#F97316]">
                    Unlock all premium rewards
                  </span>
                </div>
              </div>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 p-5 rounded-xl bg-[#1A1A1C] border border-white/10"
            >
              <h4 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#F97316]">💡</span> How It Works
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: '🎮', color: 'blue', title: 'Play', desc: 'Earn XP in matches' },
                  { icon: '📈', color: 'purple', title: 'Level Up', desc: '35 tiers to unlock' },
                  { icon: '🎁', color: 'emerald', title: 'Claim', desc: 'Get your rewards' },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className={cn(
                      'w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center text-xl',
                      step.color === 'blue' && 'bg-blue-500/20',
                      step.color === 'purple' && 'bg-purple-500/20',
                      step.color === 'emerald' && 'bg-emerald-500/20',
                    )}>
                      {step.icon}
                    </div>
                    <p className="text-[13px] font-semibold text-white">{step.title}</p>
                    <p className="text-[12px] text-[#737373]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Don't show again checkbox */}
            <motion.label
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3 mb-5 cursor-pointer group"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={cn(
                  'w-5 h-5 rounded border-2 transition-all duration-200',
                  'border-white/20 bg-transparent',
                  'peer-checked:border-[#F97316] peer-checked:bg-[#F97316]',
                  'group-hover:border-white/40'
                )}>
                  {dontShowAgain && (
                    <svg className="w-full h-full text-black p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[14px] text-[#737373] group-hover:text-[#B4B4B4] transition-colors">
                Don't show this again
              </span>
            </motion.label>

            {/* CTA Button - Enterprise style */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleClose}
              className={cn(
                'w-full py-4 px-6 rounded-xl',
                'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
                'hover:from-[#FB923C] hover:to-[#F97316]',
                'text-[15px] font-bold text-black uppercase tracking-[0.02em]',
                'shadow-lg shadow-[#F97316]/30 hover:shadow-xl hover:shadow-[#F97316]/40',
                'transition-all duration-200 active:scale-[0.98]'
              )}
            >
              Let's Go!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function useBattlePassWelcome() {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowWelcome(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  return {
    showWelcome,
    closeWelcome: () => setShowWelcome(false),
  }
}
