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

interface Props {
  days?: number
}

export function SurvivalPanel({ days = 7 }: Props) {
  const api = useAnalyticsAPI()
  const [overview, setOverview] = useState<SurvivalOverview | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyCurve | null>(null)
  const [obstacles, setObstacles] = useState<ObstacleAnalysis | null>(null)
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [ov, diff, obs, fun] = await Promise.all([
        api.getSurvivalOverview(days),
        api.getDifficultyCurve(days),
        api.getObstacleAnalysis(days),
        api.getSurvivalFunnel(days),
      ])
      setOverview(ov as SurvivalOverview)
      setDifficulty(diff as DifficultyCurve)
      setObstacles(obs as ObstacleAnalysis)
      setFunnel(fun as FunnelData)
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
    </div>
  )
}
