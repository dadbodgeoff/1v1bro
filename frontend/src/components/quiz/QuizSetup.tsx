/**
 * QuizSetup - Clean configuration interface
 */

import { useState } from 'react'
import type { QuizConfig, QuizDifficulty, QuizCategory, QuizMode } from '@/types/quiz'

interface QuizSetupProps {
  onStart: (config: QuizConfig) => void
  onBack: () => void
}

export function QuizSetup({ onStart, onBack }: QuizSetupProps) {
  const [mode, setMode] = useState<QuizMode>('classic')
  const [difficulty, setDifficulty] = useState<QuizDifficulty | 'mixed'>('mixed')
  const [category, setCategory] = useState<QuizCategory | 'mixed'>('mixed')
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimit, setTimeLimit] = useState(15)

  const difficulties: { value: QuizDifficulty | 'mixed'; label: string }[] = [
    { value: 'mixed', label: 'All Levels' },
    { value: 'casual', label: 'Casual' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'expert', label: 'Expert' },
    { value: 'legendary', label: 'Legendary' },
    { value: 'impossible', label: 'Impossible' },
  ]

  const categories: { value: QuizCategory | 'mixed'; label: string }[] = [
    { value: 'mixed', label: 'All Categories' },
    { value: 'seasons', label: 'Seasons' },
    { value: 'events', label: 'Events' },
    { value: 'skins', label: 'Cosmetics' },
    { value: 'weapons', label: 'Weapons' },
    { value: 'esports', label: 'Esports' },
    { value: 'collabs', label: 'Collaborations' },
  ]

  const handleStart = () => {
    const config: QuizConfig = {
      mode,
      questionCount,
      timeLimit: mode === 'speed' ? timeLimit : 0,
      ...(difficulty !== 'mixed' && { difficulty }),
      ...(category !== 'mixed' && { category }),
    }
    onStart(config)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-white transition-colors mb-6"
        >
          ← Back to menu
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Configure Quiz</h1>
        <p className="text-neutral-500 mt-2">Customize your experience</p>
      </div>

      {/* Mode Selection */}
      <Section title="Mode">
        <div className="grid grid-cols-3 gap-2">
          {(['classic', 'speed', 'personality'] as QuizMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-white text-black'
                  : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {m === 'classic' && 'Classic'}
              {m === 'speed' && 'Speed'}
              {m === 'personality' && 'Era Match'}
            </button>
          ))}
        </div>
      </Section>

      {mode !== 'personality' && (
        <>
          {/* Difficulty */}
          <Section title="Difficulty">
            <div className="flex flex-wrap gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`py-2 px-4 rounded-lg text-sm transition-all ${
                    difficulty === d.value
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Category */}
          <Section title="Category">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`py-2 px-4 rounded-lg text-sm transition-all ${
                    category === c.value
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Question Count */}
          <Section title="Questions">
            <div className="flex gap-2">
              {[5, 10, 15, 20, 25].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`w-14 py-2 rounded-lg text-sm font-mono transition-all ${
                    questionCount === count
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </Section>

          {/* Time Limit (Speed mode only) */}
          {mode === 'speed' && (
            <Section title="Time per Question">
              <div className="flex gap-2">
                {[10, 15, 20, 30].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`py-2 px-4 rounded-lg text-sm font-mono transition-all ${
                      timeLimit === t
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Summary */}
      <div className="mt-10 p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Configuration</span>
          <span className="text-neutral-400 font-mono">
            {mode === 'personality'
              ? '5 questions • Era Match'
              : `${questionCount} questions • ${difficulty === 'mixed' ? 'Mixed' : difficulty} • ${category === 'mixed' ? 'All' : category}${mode === 'speed' ? ` • ${timeLimit}s` : ''}`}
          </span>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full mt-6 py-4 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
      >
        Begin
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
        {title}
      </label>
      {children}
    </div>
  )
}
