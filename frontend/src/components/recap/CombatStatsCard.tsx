/**
 * CombatStatsCard - Displays combat performance with K/D and streaks.
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type { CombatStats } from '@/types/recap'

interface CombatStatsCardProps {
  stats: CombatStats
}

export function CombatStatsCard({ stats }: CombatStatsCardProps) {
  const kdDisplay = stats.deaths === 0 
    ? (stats.kills > 0 ? '∞' : '0.00')
    : stats.kd_ratio.toFixed(2)

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Combat Performance</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-slate-400 text-sm">K/D Ratio</span>
          <div className="text-2xl font-bold text-red-400">{kdDisplay}</div>
        </div>
        <div>
          <span className="text-slate-400 text-sm">Kills / Deaths</span>
          <div className="text-xl font-medium text-white">
            {stats.kills} / {stats.deaths}
          </div>
        </div>
        {stats.max_streak >= 3 && (
          <div>
            <span className="text-slate-400 text-sm">Best Streak</span>
            <div className="text-xl font-medium text-orange-400">
              🔥 {stats.max_streak}
            </div>
          </div>
        )}
        <div>
          <span className="text-slate-400 text-sm">Shot Accuracy</span>
          <div className="text-xl font-medium text-white">
            {stats.shot_accuracy.toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-sm">Shots</span>
          <div className="text-sm text-slate-300">
            {stats.shots_hit} / {stats.shots_fired}
          </div>
        </div>
      </div>
    </div>
  )
}
