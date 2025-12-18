/**
 * SurvivalPanel - Game analytics for survival mode
 * 
 * Requirements: 9.4 - Player progression funnel visualization
 */

import { useEffect, useState } from 'react'
import { MetricCard } from '../MetricCard'
import { BarChart, FunnelChart, LineChart } from '../MiniChart'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'

/**
 * Validates that a funnel is monotonically decreasing
 * Property 10: Survival funnel is monotonically decreasing
 * 
 * Each step's count should be less than or equal to the previous step's count
 */
export function isFunnelMonotonicallyDecreasing(
  steps: Array<{ count: number }>
): boolean {
  if (!steps || steps.length === 0) return true
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].count > steps[i - 1].count) {
      return false
    }
  }
  return true
}

/**
 * Finds the first step where the funnel increases (violation)
 * Returns null if funnel is valid
 */
export function findFunnelViolation(
  steps: Array<{ step: string; count: number }>
): { step: string; previousCount: number; currentCount: number } | null {
  if (!steps || steps.length < 2) return null
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].count > steps[i - 1].count) {
      return {
        step: steps[i].step,
        previousCount: steps[i - 1].count,
        currentCount: steps[i].count,
      }
    }
  }
  return null
}

interface SurvivalOverview {
  daily: Array<{
    date: string
    total_runs: number
    unique_players: number
    avg_distance: number
    avg_score: number
    max_distance: number
  }>
  totals: {
    total_runs: number
    unique_players: number
    unique_visitors: number
    avg_distance: number
    avg_score: number
    max_distance: number
    max_score: number
    max_combo: number
  }
}

interface DifficultyCurve {
  curve: Array<{
    distance_bucket: number
    distance_label: string
    total_reached: number
    total_deaths: number
    survival_rate: number
    avg_speed: number
  }>
}

interface ObstacleAnalysis {
  obstacles: Array<{
    obstacle_type: string
    total_encounters: number
    total_deaths: number
    death_rate: number
    avg_distance: number
  }>
}

interface FunnelData {
  funnel: Array<{
    step: string
    label: string
    count: number
    conversion_rate: number
    drop_off: number
  }>
}

interface InputAnalysis {
  analysis: {
    sample_size: number
    avg_inputs_per_second: number
    avg_reaction_time_ms: number
    min_reaction_time_ms: number
    input_breakdown: {
      jumps: number
      slides: number
      lane_left: number
      lane_right: number
    }
    advanced_inputs: {
      coyote_jumps: number
      buffered_jumps: number
      buffered_inputs: number
      double_taps: number
      input_spam: number
    }
  } | null
}

interface ComboAnalysis {
  analysis: {
    total_combos: number
    distribution: Record<string, number>
    end_reasons: {
      death: number
      timeout: number
      hit: number
      other: number
    }
    avg_score_per_combo: number
    avg_duration_ms: number
    max_combo: number
  } | null
  top_combos: Array<{
    combo_count: number
    score_earned: number
    duration_ms: number
  }>
}

interface TriviaAnalysis {
  analysis: {
    sample_size: number
    total_correct: number
    total_wrong: number
    total_timeout: number
    overall_correct_rate: number
    overall_timeout_rate: number
    avg_time_to_answer_ms: number | null
    max_streak_seen: number
    by_category: Array<{
      category: string
      total: number
      correct: number
      correct_rate: number
      timeout_rate: number
      avg_time_ms: number | null
    }>
    by_difficulty: Array<{
      difficulty: string
      total: number
      correct: number
      correct_rate: number
    }>
  } | null
}

interface Props {
  days?: number
}

export function SurvivalPanel({ days = 7 }: Props) {
  const api = useAnalyticsAPI()
  const [overview, setOverview] = useState<SurvivalOverview | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyCurve | null>(null)
  const [obstacles, setObstacles] = useState<ObstacleAnalysis | null>(null)
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [inputAnalysis, setInputAnalysis] = useState<InputAnalysis | null>(null)
  const [comboAnalysis, setComboAnalysis] = useState<ComboAnalysis | null>(null)
  const [triviaAnalysis, setTriviaAnalysis] = useState<TriviaAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'inputs' | 'combos' | 'trivia'>('overview')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [ov, diff, obs, fun, inp, combo, trivia] = await Promise.all([
        api.getSurvivalOverview(days),
        api.getDifficultyCurve(days),
        api.getObstacleAnalysis(days),
        api.getSurvivalFunnel(days),
        api.getInputAnalysis(days),
        api.getComboAnalysis(days),
        api.getTriviaAnalysis(days),
      ])
      setOverview(ov as SurvivalOverview)
      setDifficulty(diff as DifficultyCurve)
      setObstacles(obs as ObstacleAnalysis)
      setFunnel(fun as FunnelData)
      setInputAnalysis(inp as InputAnalysis)
      setComboAnalysis(combo as ComboAnalysis)
      setTriviaAnalysis(trivia as TriviaAnalysis)
      setLoading(false)
    }
    load()
  }, [days])

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  const totals = overview?.totals

  const obstacleColumns: Column<ObstacleAnalysis['obstacles'][0]>[] = [
    { key: 'obstacle_type', label: 'Obstacle', render: (r) => <span className="font-medium">{r.obstacle_type}</span> },
    { key: 'total_encounters', label: 'Encounters', sortable: true, align: 'right' },
    { key: 'total_deaths', label: 'Deaths', sortable: true, align: 'right', render: (r) => <span className="text-red-400">{r.total_deaths}</span> },
    { 
      key: 'death_rate', 
      label: 'Death Rate', 
      sortable: true, 
      align: 'right',
      render: (r) => (
        <span className={r.death_rate > 20 ? 'text-red-400' : r.death_rate > 10 ? 'text-yellow-400' : 'text-green-400'}>
          {r.death_rate.toFixed(1)}%
        </span>
      ),
    },
    { key: 'avg_distance', label: 'Avg Distance', sortable: true, align: 'right', render: (r) => `${r.avg_distance.toFixed(0)}m` },
  ]

  const dailyChartData = overview?.daily.map(d => ({
    label: d.date.slice(5),
    value: d.total_runs,
  })) || []

  const survivalCurveData = difficulty?.curve.map(c => ({
    label: c.distance_label,
    value: c.survival_rate,
  })) || []

  return (
    <div className="space-y-6">
      {/* Key Metrics with sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Runs" 
          value={totals?.total_runs} 
          size="lg"
          sparkline={overview?.daily.map(d => d.total_runs)}
          icon={<span className="text-lg">🎮</span>}
        />
        <MetricCard 
          label="Unique Players" 
          value={totals?.unique_players} 
          size="lg"
          sparkline={overview?.daily.map(d => d.unique_players)}
          icon={<span className="text-lg">👥</span>}
        />
        <MetricCard 
          label="Avg Distance" 
          value={totals?.avg_distance?.toFixed(0)} 
          unit="m" 
          size="lg"
          sparkline={overview?.daily.map(d => d.avg_distance)}
          icon={<span className="text-lg">📏</span>}
        />
        <MetricCard 
          label="Avg Score" 
          value={totals?.avg_score?.toFixed(0)} 
          size="lg"
          sparkline={overview?.daily.map(d => d.avg_score)}
          icon={<span className="text-lg">⭐</span>}
        />
      </div>

      {/* Records - highlighted */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Max Distance" 
          value={totals?.max_distance?.toFixed(0)} 
          unit="m" 
          variant="success"
          icon={<span className="text-lg">🏆</span>}
          description="All-time record"
        />
        <MetricCard 
          label="Max Score" 
          value={totals?.max_score} 
          variant="success"
          icon={<span className="text-lg">🥇</span>}
          description="All-time record"
        />
        <MetricCard 
          label="Max Combo" 
          value={totals?.max_combo} 
          variant="success"
          icon={<span className="text-lg">🔥</span>}
          description="All-time record"
        />
        <MetricCard 
          label="Unique Visitors" 
          value={totals?.unique_visitors}
          icon={<span className="text-lg">👀</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Runs Chart */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Daily Runs</h3>
          {dailyChartData.length > 0 ? (
            <LineChart data={dailyChartData} height={150} showLabels />
          ) : (
            <div className="text-neutral-500 text-sm">No data</div>
          )}
        </div>

        {/* Survival Curve */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Survival Rate by Distance</h3>
          {survivalCurveData.length > 0 ? (
            <BarChart data={survivalCurveData.slice(0, 10)} height={150} color="#22c55e" />
          ) : (
            <div className="text-neutral-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-400">Player Progression Funnel</h3>
          {funnel?.funnel && !isFunnelMonotonicallyDecreasing(funnel.funnel) && (
            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
              ⚠️ Data anomaly detected
            </span>
          )}
        </div>
        {funnel?.funnel && funnel.funnel.length > 0 ? (
          <>
            <FunnelChart 
              steps={funnel.funnel.map(f => ({ label: f.label, count: f.count, rate: f.conversion_rate }))} 
            />
            {/* Funnel step details */}
            <div className="mt-4 space-y-2">
              {funnel.funnel.map((step, i) => (
                <div key={step.step} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-neutral-300">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">{step.count.toLocaleString()}</span>
                    {i > 0 && (
                      <span className={`text-xs ${step.drop_off > 50 ? 'text-red-400' : 'text-neutral-500'}`}>
                        -{step.drop_off.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-neutral-500 text-sm">No funnel data</div>
        )}
      </div>

      {/* Obstacle Analysis */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Obstacle Death Rates</h3>
        <DataTable
          columns={obstacleColumns}
          data={obstacles?.obstacles || []}
          keyField="obstacle_type"
          maxHeight="300px"
          emptyMessage="No obstacle data"
        />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: '📊 Overview', hasData: true },
          { id: 'inputs', label: '🎮 Inputs', hasData: !!inputAnalysis?.analysis },
          { id: 'combos', label: '🔥 Combos', hasData: !!comboAnalysis?.analysis },
          { id: 'trivia', label: '❓ Trivia', hasData: !!triviaAnalysis?.analysis },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              activeSection === tab.id
                ? 'bg-white/10 text-white border-b-2 border-orange-500'
                : 'text-neutral-500 hover:text-white'
            } ${!tab.hasData ? 'opacity-50' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input Analysis Section */}
      {activeSection === 'inputs' && inputAnalysis?.analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="Sample Size" 
              value={inputAnalysis.analysis.sample_size}
              icon={<span className="text-lg">📊</span>}
            />
            <MetricCard 
              label="Avg Inputs/Sec" 
              value={inputAnalysis.analysis.avg_inputs_per_second?.toFixed(1)}
              icon={<span className="text-lg">⚡</span>}
            />
            <MetricCard 
              label="Avg Reaction Time" 
              value={inputAnalysis.analysis.avg_reaction_time_ms?.toFixed(0)}
              unit="ms"
              icon={<span className="text-lg">⏱️</span>}
            />
            <MetricCard 
              label="Min Reaction Time" 
              value={inputAnalysis.analysis.min_reaction_time_ms?.toFixed(0)}
              unit="ms"
              variant="success"
              icon={<span className="text-lg">🏆</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Breakdown */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Input Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(inputAnalysis.analysis.input_breakdown).map(([key, value]) => {
                  const total = Object.values(inputAnalysis.analysis!.input_breakdown).reduce((a, b) => a + b, 0)
                  const percent = total > 0 ? (value / total) * 100 : 0
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-400 w-24 capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-white w-16 text-right">{value.toLocaleString()}</span>
                      <span className="text-xs text-neutral-500 w-12">{percent.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Advanced Inputs */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Advanced Input Patterns</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Coyote Jumps</div>
                  <div className="text-xl font-bold text-cyan-400">{inputAnalysis.analysis.advanced_inputs.coyote_jumps.toLocaleString()}</div>
                  <div className="text-xs text-neutral-500 mt-1">Late jumps saved</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Buffered Jumps</div>
                  <div className="text-xl font-bold text-purple-400">{inputAnalysis.analysis.advanced_inputs.buffered_jumps.toLocaleString()}</div>
                  <div className="text-xs text-neutral-500 mt-1">Pre-emptive inputs</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Double Taps</div>
                  <div className="text-xl font-bold text-yellow-400">{inputAnalysis.analysis.advanced_inputs.double_taps.toLocaleString()}</div>
                  <div className="text-xs text-neutral-500 mt-1">Rapid inputs</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Input Spam</div>
                  <div className="text-xl font-bold text-red-400">{inputAnalysis.analysis.advanced_inputs.input_spam.toLocaleString()}</div>
                  <div className="text-xs text-neutral-500 mt-1">Panic mashing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combo Analysis Section */}
      {activeSection === 'combos' && comboAnalysis?.analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="Total Combos" 
              value={comboAnalysis.analysis.total_combos}
              icon={<span className="text-lg">🔥</span>}
            />
            <MetricCard 
              label="Max Combo" 
              value={comboAnalysis.analysis.max_combo}
              variant="success"
              icon={<span className="text-lg">🏆</span>}
            />
            <MetricCard 
              label="Avg Score/Combo" 
              value={comboAnalysis.analysis.avg_score_per_combo?.toFixed(0)}
              icon={<span className="text-lg">⭐</span>}
            />
            <MetricCard 
              label="Avg Duration" 
              value={(comboAnalysis.analysis.avg_duration_ms / 1000)?.toFixed(1)}
              unit="s"
              icon={<span className="text-lg">⏱️</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Combo Distribution */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Combo Size Distribution</h3>
              <div className="space-y-3">
                {Object.entries(comboAnalysis.analysis.distribution).map(([range, count]) => {
                  const total = Object.values(comboAnalysis.analysis!.distribution).reduce((a, b) => a + b, 0)
                  const percent = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={range} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-400 w-16">{range}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-white w-16 text-right">{count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Combo End Reasons */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">How Combos End</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <div className="text-xs text-red-400">Death</div>
                  <div className="text-xl font-bold text-red-400">{comboAnalysis.analysis.end_reasons.death.toLocaleString()}</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <div className="text-xs text-yellow-400">Timeout</div>
                  <div className="text-xl font-bold text-yellow-400">{comboAnalysis.analysis.end_reasons.timeout.toLocaleString()}</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                  <div className="text-xs text-orange-400">Hit Obstacle</div>
                  <div className="text-xl font-bold text-orange-400">{comboAnalysis.analysis.end_reasons.hit.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-neutral-400">Other</div>
                  <div className="text-xl font-bold text-neutral-400">{comboAnalysis.analysis.end_reasons.other.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Combos */}
          {comboAnalysis.top_combos.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Top 10 Combos</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {comboAnalysis.top_combos.slice(0, 10).map((combo, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{combo.combo_count}x</div>
                    <div className="text-xs text-neutral-500">{combo.score_earned.toLocaleString()} pts</div>
                    <div className="text-xs text-neutral-600">{(combo.duration_ms / 1000).toFixed(1)}s</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trivia Analysis Section */}
      {activeSection === 'trivia' && triviaAnalysis?.analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="Questions Answered" 
              value={triviaAnalysis.analysis.sample_size}
              icon={<span className="text-lg">❓</span>}
            />
            <MetricCard 
              label="Correct Rate" 
              value={triviaAnalysis.analysis.overall_correct_rate?.toFixed(1)}
              unit="%"
              variant={triviaAnalysis.analysis.overall_correct_rate > 60 ? 'success' : 'warning'}
              icon={<span className="text-lg">✅</span>}
            />
            <MetricCard 
              label="Timeout Rate" 
              value={triviaAnalysis.analysis.overall_timeout_rate?.toFixed(1)}
              unit="%"
              variant={triviaAnalysis.analysis.overall_timeout_rate < 20 ? 'success' : 'warning'}
              icon={<span className="text-lg">⏱️</span>}
            />
            <MetricCard 
              label="Max Streak" 
              value={triviaAnalysis.analysis.max_streak_seen}
              variant="success"
              icon={<span className="text-lg">🔥</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Category */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Performance by Category</h3>
              <div className="space-y-3">
                {triviaAnalysis.analysis.by_category.map(cat => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-400 w-24 truncate" title={cat.category}>{cat.category}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat.correct_rate > 60 ? 'bg-green-500' : cat.correct_rate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${cat.correct_rate}%` }}
                      />
                    </div>
                    <span className={`text-sm w-12 text-right ${cat.correct_rate > 60 ? 'text-green-400' : cat.correct_rate > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {cat.correct_rate.toFixed(0)}%
                    </span>
                    <span className="text-xs text-neutral-500 w-12">({cat.total})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Difficulty */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Performance by Difficulty</h3>
              <div className="space-y-4">
                {triviaAnalysis.analysis.by_difficulty.map(diff => (
                  <div key={diff.difficulty} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white capitalize">{diff.difficulty}</span>
                      <span className={`text-lg font-bold ${diff.correct_rate > 60 ? 'text-green-400' : diff.correct_rate > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {diff.correct_rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{diff.correct} / {diff.total} correct</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${diff.correct_rate > 60 ? 'bg-green-500' : diff.correct_rate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${diff.correct_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Answer Time */}
          {triviaAnalysis.analysis.avg_time_to_answer_ms && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Answer Time Analysis</h3>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {(triviaAnalysis.analysis.avg_time_to_answer_ms / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-neutral-500">Average answer time</div>
                </div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, (triviaAnalysis.analysis.avg_time_to_answer_ms / 15000) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-500">15s limit</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No data message for sections */}
      {activeSection === 'inputs' && !inputAnalysis?.analysis && (
        <div className="text-center py-12 text-neutral-500">No input analysis data available</div>
      )}
      {activeSection === 'combos' && !comboAnalysis?.analysis && (
        <div className="text-center py-12 text-neutral-500">No combo analysis data available</div>
      )}
      {activeSection === 'trivia' && !triviaAnalysis?.analysis && (
        <div className="text-center py-12 text-neutral-500">No trivia analysis data available</div>
      )}
    </div>
  )
}
