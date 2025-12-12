/**
 * GameTutorial - Comprehensive tutorial for new players
 * 
 * Shows controls, power-ups, quiz effects, and combat mechanics.
 * Includes "don't show again" option.
 * 
 * @module components/game/GameTutorial
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'game_tutorial_dismissed'

interface GameTutorialProps {
  visible: boolean
  onDismiss: () => void
  autoDismissMs?: number
  onStepChange?: (step: string, timeSpentMs: number) => void
  onComplete?: (totalTimeMs: number, skipped: boolean) => void
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Tutorial sections
const SECTIONS = [
  {
    id: 'controls',
    title: 'Controls',
    icon: '🎮',
  },
  {
    id: 'quiz',
    title: 'Quiz Rewards',
    icon: '❓',
  },
  {
    id: 'combat',
    title: 'Combat',
    icon: '⚔️',
  },
  {
    id: 'powerups',
    title: 'Power-Ups',
    icon: '⚡',
  },
]

function ControlsSection({ isTouch }: { isTouch: boolean }) {
  if (isTouch) {
    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/5 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">👆</span>
          <div>
            <p className="text-white font-medium">Move</p>
            <p className="text-neutral-500 text-xs">Left joystick</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <p className="text-white font-medium">Shoot</p>
            <p className="text-neutral-500 text-xs">Fire button</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 flex items-center gap-2 col-span-2">
          <span className="text-xl">📱</span>
          <div>
            <p className="text-white font-medium">Answer Questions</p>
            <p className="text-neutral-500 text-xs">Tap answer buttons at bottom</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="bg-white/5 rounded-lg p-3 text-center">
        <div className="flex justify-center gap-0.5 mb-1">
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">W</kbd>
        </div>
        <div className="flex justify-center gap-0.5">
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">A</kbd>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">S</kbd>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">D</kbd>
        </div>
        <p className="text-neutral-500 text-xs mt-1">Move</p>
      </div>
      <div className="bg-white/5 rounded-lg p-3 text-center">
        <div className="text-xl mb-1">🖱️</div>
        <p className="text-neutral-500 text-xs">Click to Shoot</p>
      </div>
      <div className="bg-white/5 rounded-lg p-3 text-center">
        <div className="flex justify-center gap-0.5 mb-1">
          {['1', '2', '3', '4'].map(k => (
            <kbd key={k} className="px-1.5 py-0.5 bg-white/10 rounded text-xs">{k}</kbd>
          ))}
        </div>
        <p className="text-neutral-500 text-xs">Answer</p>
      </div>
    </div>
  )
}

function QuizRewardsSection() {
  return (
    <div className="space-y-2">
      <p className="text-neutral-400 text-xs mb-3">Answer questions to gain combat advantages!</p>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-3">
          <span className="text-lg">⚡</span>
          <div className="flex-1">
            <p className="text-emerald-400 font-medium">Fast Correct</p>
            <p className="text-neutral-500 text-xs">+20% damage for 4s</p>
          </div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 flex items-center gap-3">
          <span className="text-lg">✓</span>
          <div className="flex-1">
            <p className="text-cyan-400 font-medium">Correct Answer</p>
            <p className="text-neutral-500 text-xs">+15% speed for 3s</p>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-3">
          <span className="text-lg">✗</span>
          <div className="flex-1">
            <p className="text-red-400 font-medium">Wrong Answer</p>
            <p className="text-neutral-500 text-xs">+15% damage taken for 2s</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CombatSection() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
          <span className="text-lg">💚</span>
          <div>
            <p className="text-white font-medium">Health Regen</p>
            <p className="text-neutral-500 text-xs">Stand still 2s → heal</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
          <span className="text-lg">💀</span>
          <div>
            <p className="text-white font-medium">Respawn</p>
            <p className="text-neutral-500 text-xs">3s then invulnerable</p>
          </div>
        </div>
      </div>
      <p className="text-neutral-500 text-xs text-center">Eliminate your opponent while answering trivia!</p>
    </div>
  )
}

function PowerUpsSection() {
  return (
    <div className="space-y-2">
      <p className="text-neutral-400 text-xs mb-2">Collect power-ups that spawn in the arena</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <div>
            <p className="text-blue-400 font-medium">Shield</p>
            <p className="text-neutral-500 text-xs">Block damage</p>
          </div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 flex items-center gap-2">
          <span className="text-lg">2️⃣</span>
          <div>
            <p className="text-orange-400 font-medium">2x Points</p>
            <p className="text-neutral-500 text-xs">Double quiz score</p>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 flex items-center gap-2">
          <span className="text-lg">⏱️</span>
          <div>
            <p className="text-purple-400 font-medium">Time Steal</p>
            <p className="text-neutral-500 text-xs">Steal opponent time</p>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
          <span className="text-lg">🆘</span>
          <div>
            <p className="text-red-400 font-medium">SOS</p>
            <p className="text-neutral-500 text-xs">Remove wrong answer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GameTutorial({ visible, onDismiss, autoDismissMs, onStepChange, onComplete }: GameTutorialProps) {
  const [isTouch] = useState(() => isTouchDevice())
  const [activeSection, setActiveSection] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const startTimeRef = useRef(Date.now())
  const sectionStartTimeRef = useRef(Date.now())

  // Auto-advance sections
  useEffect(() => {
    if (!visible || !autoDismissMs) return
    
    const sectionTime = autoDismissMs / SECTIONS.length
    const timer = setInterval(() => {
      setActiveSection(prev => {
        if (prev >= SECTIONS.length - 1) {
          clearInterval(timer)
          return prev
        }
        return prev + 1
      })
    }, sectionTime)

    return () => clearInterval(timer)
  }, [visible, autoDismissMs])

  const handleDismiss = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    const totalTime = Date.now() - startTimeRef.current
    const skipped = activeSection < SECTIONS.length - 1
    onComplete?.(totalTime, skipped)
    onDismiss()
  }, [dontShowAgain, onDismiss, activeSection, onComplete])

  // Check if should show
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'true' && visible) {
      onDismiss()
    }
  }, [visible, onDismiss])

  const renderSection = () => {
    switch (SECTIONS[activeSection].id) {
      case 'controls': return <ControlsSection isTouch={isTouch} />
      case 'quiz': return <QuizRewardsSection />
      case 'combat': return <CombatSection />
      case 'powerups': return <PowerUpsSection />
      default: return null
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Section tabs */}
            <div className="flex gap-1 mb-4">
              {SECTIONS.map((section, i) => (
                <button
                  key={section.id}
                  onClick={() => {
                    // Track time spent on previous section
                    const timeSpent = Date.now() - sectionStartTimeRef.current
                    onStepChange?.(SECTIONS[activeSection].id, timeSpent)
                    sectionStartTimeRef.current = Date.now()
                    setActiveSection(i)
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                    i === activeSection
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <span className="mr-1">{section.icon}</span>
                  <span className="hidden sm:inline">{section.title}</span>
                </button>
              ))}
            </div>

            {/* Section content */}
            <div className="min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderSection()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Don't show again checkbox */}
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
              />
              <span className="text-neutral-500 text-xs">Don't show this again</span>
            </label>

            {/* Start button */}
            <button
              onClick={handleDismiss}
              className="w-full mt-4 min-h-[48px] px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
            >
              {isTouch ? 'Tap to Start' : 'Start Playing'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to check if tutorial should be shown
export function useGameTutorial() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setShouldShow(dismissed !== 'true')
  }, [])

  const dismiss = useCallback(() => {
    setShouldShow(false)
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setShouldShow(true)
  }, [])

  return { shouldShow, dismiss, reset }
}

export default GameTutorial
