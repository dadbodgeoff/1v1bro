/**
 * QuestionStatsCard - Displays trivia performance with Perfect badge.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import type { QuestionStats } from '@/types/recap'

interface QuestionStatsCardProps {
  stats: QuestionStats
}

export function QuestionStatsCard({ stats }: QuestionStatsCardProps) {
  const isPerfect = stats.correct_count === stats.total_questions

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Trivia Performance</h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-green-400">
          {stats.correct_count}/{stats.total_questions}
        </div>
        {isPerfect && (
          <span className="px-3 py-1 bg-yellow-500 text-black font-bold rounded-full text-sm animate-bounce">
            PERFECT!
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-400">Accuracy</span>
          <div className="text-white font-medium">
            {stats.accuracy_percent.toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400">Avg Time</span>
          <div className="text-white font-medium">
            {(stats.avg_answer_time_ms / 1000).toFixed(1)}s
          </div>
        </div>
        <div>
          <span className="text-slate-400">Fastest</span>
          <div className="text-white font-medium">
            {(stats.fastest_answer_ms / 1000).toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  )
}
