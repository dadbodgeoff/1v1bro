/**
 * QuizResults - Clean results display
 */

import type { QuizResult } from '@/types/quiz'

interface QuizResultsProps {
  result: QuizResult
  onPlayAgain: () => void
  onBack: () => void
}

export function QuizResults({ result, onPlayAgain, onBack }: QuizResultsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const getGrade = () => {
    if (result.percentage >= 90) return 'A'
    if (result.percentage >= 80) return 'B'
    if (result.percentage >= 70) return 'C'
    if (result.percentage >= 60) return 'D'
    return 'F'
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
          Quiz Complete
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{result.rank}</h1>
      </div>

      {/* Score display */}
      <div className="flex items-center justify-center mb-12">
        <div className="relative">
          {/* Circle background */}
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-white/[0.06]"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${result.percentage * 4.4} 440`}
              className="text-white/60 transition-all duration-1000"
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold">{result.percentage}%</span>
            <span className="text-xs text-neutral-500 mt-1">
              {result.score}/{result.maxScore}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { value: result.correctCount, label: 'Correct' },
          { value: result.totalQuestions - result.correctCount, label: 'Incorrect' },
          { value: formatTime(result.timeSpent), label: 'Time' },
          { value: getGrade(), label: 'Grade' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg"
          >
            <div className="text-xl font-semibold text-white">{stat.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {result.breakdown.length > 1 && (
        <div className="mb-10">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
            Performance by Category
          </h3>
          <div className="space-y-3">
            {result.breakdown.map((cat) => {
              const pct = Math.round((cat.correct / cat.total) * 100)
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-neutral-400 capitalize truncate">
                    {cat.category}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/40 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-mono text-neutral-500">
                    {cat.correct}/{cat.total}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Share card */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg mb-8">
        <p className="text-sm text-neutral-400">
          Scored <span className="text-white font-medium">{result.percentage}%</span> on the
          Fortnite Quiz · Rank: <span className="text-white font-medium">{result.rank}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 text-sm text-neutral-400 bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:text-white transition-all"
        >
          Back to Menu
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
