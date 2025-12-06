/**
 * FortniteQuiz - Enterprise-grade quiz experience
 * Clean, minimal, professional design
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuizSetup, QuizGame, QuizResults, PersonalityQuiz } from '@/components/quiz'
import { useQuizStore } from '@/stores/quizStore'
import type { QuizConfig, QuizResult } from '@/types/quiz'

type QuizPhase = 'menu' | 'setup' | 'playing' | 'personality' | 'results'

export function FortniteQuiz() {
  const navigate = useNavigate()
  const { startQuiz, finishQuiz, resetQuiz } = useQuizStore()
  const [phase, setPhase] = useState<QuizPhase>('menu')
  const [result, setResult] = useState<QuizResult | null>(null)

  const handleStartSetup = () => setPhase('setup')

  const handleStartQuiz = (config: QuizConfig) => {
    if (config.mode === 'personality') {
      setPhase('personality')
    } else {
      startQuiz(config)
      setPhase('playing')
    }
  }

  const handleQuizComplete = () => {
    const quizResult = finishQuiz()
    if (quizResult) {
      setResult(quizResult)
      setPhase('results')
    }
  }

  const handlePlayAgain = () => {
    resetQuiz()
    setPhase('setup')
  }

  const handleBackToMenu = () => {
    resetQuiz()
    setResult(null)
    setPhase('menu')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Subtle grid background */}
      <div 
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      <div className="relative z-10 min-h-screen">
        {phase === 'menu' && (
          <QuizMenu onStart={handleStartSetup} onBack={() => navigate('/')} />
        )}

        {phase === 'setup' && (
          <div className="max-w-2xl mx-auto px-6 py-16">
            <QuizSetup onStart={handleStartQuiz} onBack={handleBackToMenu} />
          </div>
        )}

        {phase === 'playing' && (
          <div className="max-w-2xl mx-auto px-6 py-8">
            <QuizGame onComplete={handleQuizComplete} onBack={handleBackToMenu} />
          </div>
        )}

        {phase === 'personality' && (
          <div className="max-w-2xl mx-auto px-6 py-16">
            <PersonalityQuiz onBack={() => setPhase('setup')} />
          </div>
        )}

        {phase === 'results' && result && (
          <div className="max-w-2xl mx-auto px-6 py-16">
            <QuizResults
              result={result}
              onPlayAgain={handlePlayAgain}
              onBack={handleBackToMenu}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function QuizMenu({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.08] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <span className="text-xs text-neutral-600 font-mono">v1.0</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl w-full">
          <div className="mb-12">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Knowledge Assessment
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Fortnite Quiz
            </h1>
            <p className="text-lg text-neutral-400 leading-relaxed">
              Test your expertise across 8 years of Battle Royale history. 
              From Chapter 1 origins to the latest seasons.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-12">
            {[
              { value: '50+', label: 'Questions' },
              { value: '7', label: 'Chapters' },
              { value: '5', label: 'Difficulty Tiers' },
              { value: '7', label: 'Categories' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Mode cards */}
          <div className="space-y-3 mb-10">
            <ModeCard
              title="Classic"
              description="Answer at your own pace with detailed explanations"
              tag="Recommended"
              onClick={onStart}
            />
            <ModeCard
              title="Speed Round"
              description="Race against the clock with timed questions"
              onClick={onStart}
            />
            <ModeCard
              title="Era Match"
              description="Discover which Fortnite chapter matches your style"
              tag="Personality"
              onClick={onStart}
            />
          </div>

          {/* CTA */}
          <button
            onClick={onStart}
            className="w-full py-4 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-600">
          <span>Data sourced from 40+ seasons</span>
          <span>Updated December 2025</span>
        </div>
      </footer>
    </div>
  )
}

function ModeCard({
  title,
  description,
  tag,
  onClick,
}: {
  title: string
  description: string
  tag?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg text-left hover:bg-white/[0.04] hover:border-white/[0.12] transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{title}</span>
            {tag && (
              <span className="text-[10px] font-medium text-neutral-500 bg-white/[0.06] px-2 py-0.5 rounded">
                {tag}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
        <span className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
          →
        </span>
      </div>
    </button>
  )
}
