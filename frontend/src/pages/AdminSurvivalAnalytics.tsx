/**
 * AdminSurvivalAnalytics - Survival Mode Analytics Dashboard
 * 
 * Features:
 * - Overview metrics (runs, players, scores)
 * - Difficulty curve analysis
 * - Obstacle death rates
 * - Conversion funnel
 * - Input pattern analysis
 * - Combo distribution
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'

// Admin emails
const ADMIN_EMAILS = ['dadbodgeoff@gmail.com']

// Types
interface DailyMetrics {
  date: string
  total_runs: number
  unique_players: number
  unique_visitors: number
  avg_distance: number
  avg_score: number
  max_distance: number
  max_score: number
  max_combo: number
  avg_max_combo: number
  most_common_death: string
}

interface DifficultyCurvePoint {
  distance_bucket: number
  distance_label: string
  total_reached: number
  total_deaths: number
  survival_rate: number
  avg_speed: number
}

interface ObstacleAnalysis {
  obstacle_type: string
  total_encounters: number
  total_deaths: number
  death_rate: number
  avg_distance: number
  avg_speed: number
}

interface FunnelStep {
  step: string
  label: string
  count: number
  conversion_rate: number
  drop_off: number
}

interface InputAnalysis {
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
}

interface ComboAnalysis {
  total_combos: number
  distribution: Record<string, number>
  end_reasons: Record<string, number>
  avg_score_per_combo: number
  avg_duration_ms: number
  max_combo: number
}

interface ZenGardenAnalysis {
  sample_size: number
  period_days: number
  // Funnel
  landing_views: number
  game_starts: number
  game_ends: number
  play_agains: number
  signup_clicks: number
  signup_completes: number
  login_clicks: number
  // Rates
  start_rate: number
  completion_rate: number
  replay_rate: number
  signup_rate: number
  bounce_rate: number
  // Visitors
  unique_visitors: number
  returning_visitors: number
  return_rate: number
  // Gameplay
  avg_distance: number
  max_distance: number
  death_causes: [string, number][]
  // Engagement
  avg_runs_per_session: number
}

export function AdminSurvivalAnalytics() {
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuthStore()
  
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [overview, setOverview] = useState<{ daily: DailyMetrics[], totals: Record<string, number> } | null>(null)
  const [difficultyCurve, setDifficultyCurve] = useState<DifficultyCurvePoint[]>([])
  const [obstacles, setObstacles] = useState<ObstacleAnalysis[]>([])
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [inputs, setInputs] = useState<InputAnalysis | null>(null)
  const [combos, setCombos] = useState<ComboAnalysis | null>(null)
  const [zenGarden, setZenGarden] = useState<ZenGardenAnalysis | null>(null)
  
  const [activeTab, setActiveTab] = useState<'overview' | 'difficulty' | 'obstacles' | 'funnel' | 'inputs' | 'combos' | 'zen-garden'>('overview')

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    try {
      const [overviewRes, difficultyRes, obstaclesRes, funnelRes, inputsRes, combosRes, zenGardenRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/survival/dashboard/overview?days=${days}`, { headers }),
        fetch(`${API_BASE}/analytics/survival/dashboard/difficulty-curve?days=${days}`, { headers }),
        fetch(`${API_BASE}/analytics/survival/dashboard/obstacle-analysis?days=${days}`, { headers }),
        fetch(`${API_BASE}/analytics/survival/dashboard/funnel?days=${days}`, { headers }),
        fetch(`${API_BASE}/analytics/survival/dashboard/input-analysis?days=${days}`, { headers }),
        fetch(`${API_BASE}/analytics/survival/dashboard/combo-analysis?days=${days}`, { headers }),
        fetch(`${API_BASE}/analytics/survival/dashboard/zen-garden?days=${days}`, { headers }),
      ])

      const [overviewData, difficultyData, obstaclesData, funnelData, inputsData, combosData, zenGardenData] = await Promise.all([
        overviewRes.json(),
        difficultyRes.json(),
        obstaclesRes.json(),
        funnelRes.json(),
        inputsRes.json(),
        combosRes.json(),
        zenGardenRes.json(),
      ])

      if (overviewData.data) setOverview(overviewData.data)
      if (difficultyData.data?.curve) setDifficultyCurve(difficultyData.data.curve)
      if (obstaclesData.data?.obstacles) setObstacles(obstaclesData.data.obstacles)
      if (funnelData.data?.funnel) setFunnel(funnelData.data.funnel)
      if (inputsData.data?.analysis) setInputs(inputsData.data.analysis)
      if (combosData.data?.analysis) setCombos(combosData.data.analysis)
      if (zenGardenData.data?.analysis) setZenGarden(zenGardenData.data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [token, days])

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, user, navigate])

  // Fetch on mount and when days change
  useEffect(() => {
    if (isAuthenticated && user?.email && ADMIN_EMAILS.includes(user.email)) {
      fetchData()
    }
  }, [isAuthenticated, user, fetchData])

  // Refresh materialized views
  const handleRefresh = async () => {
    if (!token) return
    try {
      await fetch(`${API_BASE}/analytics/survival/dashboard/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      fetchData()
    } catch {
      // Silent fail
    }
  }

  if (!isAuthenticated || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Survival Analytics</h1>
          <p className="text-neutral-400 text-sm">Enterprise game analytics dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/analytics/enterprise')}
            className="text-sm text-neutral-400 hover:text-white"
          >
            ← Enterprise Analytics
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        {(['overview', 'difficulty', 'obstacles', 'funnel', 'inputs', 'combos', 'zen-garden'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'zen-garden' ? '🌸 Zen Garden' : tab}
          </button>
        ))}
      </div>

      {/* Loading/Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && overview && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Total Runs" value={overview.totals.total_runs} />
                <MetricCard label="Unique Players" value={overview.totals.unique_players} />
                <MetricCard label="Avg Distance" value={`${overview.totals.avg_distance}m`} />
                <MetricCard label="Max Distance" value={`${overview.totals.max_distance}m`} />
                <MetricCard label="Avg Score" value={overview.totals.avg_score} />
                <MetricCard label="Max Score" value={overview.totals.max_score} />
                <MetricCard label="Max Combo" value={`${overview.totals.max_combo}x`} />
                <MetricCard label="Unique Visitors" value={overview.totals.unique_visitors} />
              </div>

              {/* Daily Chart */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Daily Runs</h3>
                <div className="h-48 flex items-end gap-1">
                  {overview.daily.slice(0, 14).reverse().map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-orange-500/60 rounded-t"
                        style={{ height: `${Math.max(4, (day.total_runs / Math.max(...overview.daily.map(d => d.total_runs))) * 100)}%` }}
                        title={`${day.date}: ${day.total_runs} runs`}
                      />
                      <span className="text-[10px] text-neutral-500">{day.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Difficulty Curve Tab */}
          {activeTab === 'difficulty' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Survival Rate by Distance</h3>
              <div className="space-y-2">
                {difficultyCurve.map((point, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-neutral-400">{point.distance_label}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          point.survival_rate > 80 ? 'bg-green-500' :
                          point.survival_rate > 50 ? 'bg-yellow-500' :
                          point.survival_rate > 20 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${point.survival_rate}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm text-right">{point.survival_rate}%</span>
                    <span className="w-20 text-xs text-neutral-500">{point.total_reached} runs</span>
                  </div>
                ))}
              </div>
              {difficultyCurve.length === 0 && (
                <p className="text-neutral-500 text-center py-8">No difficulty data yet</p>
              )}
            </div>
          )}

          {/* Obstacles Tab */}
          {activeTab === 'obstacles' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Obstacle Death Rates</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-neutral-400 border-b border-white/10">
                    <th className="text-left py-2">Obstacle</th>
                    <th className="text-right py-2">Encounters</th>
                    <th className="text-right py-2">Deaths</th>
                    <th className="text-right py-2">Death Rate</th>
                    <th className="text-right py-2">Avg Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {obstacles.map((obs, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 font-medium">{obs.obstacle_type}</td>
                      <td className="py-2 text-right text-neutral-400">{obs.total_encounters}</td>
                      <td className="py-2 text-right text-red-400">{obs.total_deaths}</td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          obs.death_rate > 50 ? 'bg-red-500/20 text-red-400' :
                          obs.death_rate > 25 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {obs.death_rate}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-neutral-400">{obs.avg_distance}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {obstacles.length === 0 && (
                <p className="text-neutral-500 text-center py-8">No obstacle data yet</p>
              )}
            </div>
          )}

          {/* Funnel Tab */}
          {activeTab === 'funnel' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
              <div className="space-y-3">
                {funnel.map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-40 text-sm">{step.label}</span>
                    <div className="flex-1 h-8 bg-white/5 rounded overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                        style={{ width: `${step.conversion_rate}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {step.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-24 text-right">
                      <span className="text-sm text-green-400">{step.conversion_rate}%</span>
                      {step.drop_off > 0 && (
                        <span className="text-xs text-red-400 ml-2">-{step.drop_off}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {funnel.length === 0 && (
                <p className="text-neutral-500 text-center py-8">No funnel data yet</p>
              )}
            </div>
          )}

          {/* Inputs Tab */}
          {activeTab === 'inputs' && inputs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Input Summary</h3>
                <div className="space-y-3">
                  <StatRow label="Sample Size" value={inputs.sample_size} />
                  <StatRow label="Avg Inputs/Second" value={inputs.avg_inputs_per_second.toFixed(2)} />
                  <StatRow label="Avg Reaction Time" value={`${inputs.avg_reaction_time_ms?.toFixed(0) || 'N/A'}ms`} />
                  <StatRow label="Min Reaction Time" value={`${inputs.min_reaction_time_ms?.toFixed(0) || 'N/A'}ms`} />
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Input Breakdown</h3>
                <div className="space-y-3">
                  <StatRow label="Jumps" value={inputs.input_breakdown.jumps} />
                  <StatRow label="Slides" value={inputs.input_breakdown.slides} />
                  <StatRow label="Lane Left" value={inputs.input_breakdown.lane_left} />
                  <StatRow label="Lane Right" value={inputs.input_breakdown.lane_right} />
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Advanced Inputs (Game Feel)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MiniMetric label="Coyote Jumps" value={inputs.advanced_inputs.coyote_jumps} />
                  <MiniMetric label="Buffered Jumps" value={inputs.advanced_inputs.buffered_jumps} />
                  <MiniMetric label="Buffered Inputs" value={inputs.advanced_inputs.buffered_inputs} />
                  <MiniMetric label="Double Taps" value={inputs.advanced_inputs.double_taps} />
                  <MiniMetric label="Input Spam" value={inputs.advanced_inputs.input_spam} />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'inputs' && !inputs && (
            <p className="text-neutral-500 text-center py-8">No input data yet</p>
          )}

          {/* Combos Tab */}
          {activeTab === 'combos' && combos && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Combo Summary</h3>
                <div className="space-y-3">
                  <StatRow label="Total Combos" value={combos.total_combos} />
                  <StatRow label="Max Combo" value={`${combos.max_combo}x`} />
                  <StatRow label="Avg Score/Combo" value={combos.avg_score_per_combo.toFixed(0)} />
                  <StatRow label="Avg Duration" value={`${(combos.avg_duration_ms / 1000).toFixed(1)}s`} />
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Combo Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(combos.distribution).map(([range, count]) => (
                    <div key={range} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-neutral-400">{range}</span>
                      <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${(count / combos.total_combos) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">How Combos End</h3>
                <div className="flex gap-6">
                  {Object.entries(combos.end_reasons).map(([reason, count]) => (
                    <div key={reason} className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{count}</div>
                      <div className="text-sm text-neutral-400 capitalize">{reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'combos' && !combos && (
            <p className="text-neutral-500 text-center py-8">No combo data yet</p>
          )}

          {/* Zen Garden Tab */}
          {activeTab === 'zen-garden' && zenGarden && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Landing Views" value={zenGarden.landing_views} />
                <MetricCard label="Game Starts" value={zenGarden.game_starts} />
                <MetricCard label="Start Rate" value={`${zenGarden.start_rate}%`} />
                <MetricCard label="Bounce Rate" value={`${zenGarden.bounce_rate}%`} />
                <MetricCard label="Replay Rate" value={`${zenGarden.replay_rate}%`} />
                <MetricCard label="Signup Rate" value={`${zenGarden.signup_rate}%`} />
                <MetricCard label="Unique Visitors" value={zenGarden.unique_visitors} />
                <MetricCard label="Returning" value={`${zenGarden.return_rate}%`} />
              </div>

              {/* Funnel */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Zen Garden Funnel</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Landing Views', value: zenGarden.landing_views, rate: 100 },
                    { label: 'Game Starts', value: zenGarden.game_starts, rate: zenGarden.start_rate },
                    { label: 'Game Ends', value: zenGarden.game_ends, rate: zenGarden.completion_rate },
                    { label: 'Play Again', value: zenGarden.play_agains, rate: zenGarden.replay_rate },
                    { label: 'Signup Clicks', value: zenGarden.signup_clicks, rate: (zenGarden.signup_clicks / zenGarden.landing_views * 100) || 0 },
                    { label: 'Signups Complete', value: zenGarden.signup_completes, rate: zenGarden.signup_rate },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-36 text-sm">{step.label}</span>
                      <div className="flex-1 h-8 bg-white/5 rounded overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                          style={{ width: `${Math.min(100, step.rate)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {step.value.toLocaleString()}
                        </span>
                      </div>
                      <span className="w-16 text-sm text-right text-pink-400">{step.rate.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gameplay & Death Causes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4">Gameplay Stats</h3>
                  <div className="space-y-3">
                    <StatRow label="Avg Distance" value={`${zenGarden.avg_distance}m`} />
                    <StatRow label="Max Distance" value={`${zenGarden.max_distance}m`} />
                    <StatRow label="Avg Runs/Session" value={zenGarden.avg_runs_per_session.toFixed(1)} />
                    <StatRow label="Total Games" value={zenGarden.game_ends} />
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4">Death Causes</h3>
                  <div className="space-y-2">
                    {zenGarden.death_causes.map(([cause, count], i) => {
                      const total = zenGarden.death_causes.reduce((sum, [, c]) => sum + c, 0)
                      const pct = total > 0 ? (count / total * 100) : 0
                      const label = cause === 'highBarrier' ? '🚧 Torii Gate (slide)' :
                                   cause === 'lowBarrier' ? '🎋 Bamboo Fence (jump)' :
                                   cause === 'laneBarrier' ? '🏮 Stone Lantern (dodge)' :
                                   cause === 'spikes' ? '⚡ Spikes' : cause
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-40 text-sm">{label}</span>
                          <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                            <div
                              className="h-full bg-red-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-right">{count}</span>
                          <span className="w-12 text-xs text-neutral-500">{pct.toFixed(0)}%</span>
                        </div>
                      )
                    })}
                    {zenGarden.death_causes.length === 0 && (
                      <p className="text-neutral-500 text-sm">No death data yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Visitor Retention */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Visitor Retention</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MiniMetric label="Unique Visitors" value={zenGarden.unique_visitors} />
                  <MiniMetric label="Returning Visitors" value={zenGarden.returning_visitors} />
                  <MiniMetric label="Return Rate" value={Number(zenGarden.return_rate.toFixed(1))} />
                  <MiniMetric label="Login Clicks" value={zenGarden.login_clicks} />
                </div>
              </div>
            </>
          )}
          {activeTab === 'zen-garden' && !zenGarden && (
            <p className="text-neutral-500 text-center py-8">No Zen Garden data yet. Run the SQL migration first.</p>
          )}
        </div>
      )}
    </div>
  )
}

// Helper Components
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="text-2xl font-bold text-orange-400">{value}</div>
      <div className="text-sm text-neutral-400">{label}</div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-white/5 rounded-lg">
      <div className="text-xl font-bold text-cyan-400">{value.toLocaleString()}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  )
}

export default AdminSurvivalAnalytics
