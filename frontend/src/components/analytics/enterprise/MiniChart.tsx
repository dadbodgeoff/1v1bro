/**
 * MiniChart - Simple SVG-based charts for analytics
 * Enhanced with sparklines, trend indicators, and better visualizations
 */

interface DataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  height?: number
  color?: string
  showLabels?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  animate?: boolean
}

export function LineChart({ 
  data, 
  height = 80, 
  color = '#f97316', 
  showLabels = false,
  showGrid = false,
  animate = true,
}: LineChartProps) {
  if (data.length < 2) return <div className="text-neutral-500 text-xs">Not enough data</div>

  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const range = max - min || 1

  const width = 100
  const padding = 2

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.value - min) / range) * (height - padding * 2),
    value: d.value,
    label: d.label,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length
  const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'flat'
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : color

  return (
    <div className="relative group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {showGrid && (
          <g className="text-white/10">
            {[0.25, 0.5, 0.75].map(pct => (
              <line 
                key={pct}
                x1={padding} 
                y1={height * pct} 
                x2={width - padding} 
                y2={height * pct} 
                stroke="currentColor" 
                strokeDasharray="2,2"
              />
            ))}
          </g>
        )}
        
        <path d={areaD} fill={`url(#gradient-${color.replace('#', '')})`} />
        <path 
          d={pathD} 
          fill="none" 
          stroke={trendColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          className={animate ? 'animate-draw' : ''}
        />
        
        {/* Data points - show on hover */}
        {points.map((p, i) => (
          <g key={i} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <circle cx={p.x} cy={p.y} r="3" fill={trendColor} />
            <circle cx={p.x} cy={p.y} r="6" fill={trendColor} fillOpacity="0.2" />
          </g>
        ))}
        
        {/* Always show first and last points */}
        <circle cx={points[0].x} cy={points[0].y} r="2" fill={trendColor} />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={trendColor} />
      </svg>
      
      {showLabels && (
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>{data[0].label}</span>
          <span className="text-neutral-400 font-medium">{data[data.length - 1].value.toLocaleString()}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      )}
    </div>
  )
}

// Sparkline - compact inline chart for metric cards
interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showTrend?: boolean
}

export function Sparkline({ data, width = 60, height = 20, color = '#f97316', showTrend = true }: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  
  // Trend calculation
  const trend = data[data.length - 1] > data[0] ? 'up' : data[data.length - 1] < data[0] ? 'down' : 'flat'
  const trendColor = showTrend 
    ? (trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : color)
    : color

  return (
    <svg width={width} height={height} className="inline-block">
      <path d={pathD} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={trendColor} />
    </svg>
  )
}

// Comparison bar - shows current vs previous period
interface ComparisonBarProps {
  current: number
  previous: number
  label?: string
  color?: string
}

export function ComparisonBar({ current, previous, label, color = '#f97316' }: ComparisonBarProps) {
  const max = Math.max(current, previous, 1)
  const currentPct = (current / max) * 100
  const previousPct = (previous / max) * 100
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
  const isPositive = change > 0

  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-neutral-500">{label}</div>}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${currentPct}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-white font-medium w-12 text-right">{current.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-neutral-600"
              style={{ width: `${previousPct}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 w-12 text-right">{previous.toLocaleString()}</span>
        </div>
      </div>
      {previous > 0 && (
        <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs previous
        </div>
      )}
    </div>
  )
}

interface BarChartProps {
  data: DataPoint[]
  height?: number
  color?: string
  horizontal?: boolean
  showValues?: boolean
  animate?: boolean
}

export function BarChart({ 
  data, 
  height = 120, 
  color = '#f97316', 
  horizontal = false,
  showValues = true,
  animate = true,
}: BarChartProps) {
  if (data.length === 0) return <div className="text-neutral-500 text-xs">No data</div>

  const max = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((a, b) => a + b.value, 0)

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <div key={i} className="flex items-center gap-2 group">
              <span className="text-xs text-neutral-400 w-20 truncate" title={d.label}>
                {d.label}
              </span>
              <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                <div
                  className={`h-full rounded transition-all duration-500 ${animate ? 'animate-grow-width' : ''}`}
                  style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
                />
                {/* Percentage overlay on hover */}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  {pct.toFixed(1)}%
                </span>
              </div>
              {showValues && (
                <span className="text-xs text-neutral-300 w-14 text-right font-medium">
                  {d.value.toLocaleString()}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const barWidth = 100 / data.length
  const gap = barWidth * 0.2

  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        <g className="text-white/5">
          {[0.25, 0.5, 0.75].map(pct => (
            <line 
              key={pct}
              x1="0" 
              y1={height - 20 - (height - 20) * pct} 
              x2="100" 
              y2={height - 20 - (height - 20) * pct} 
              stroke="currentColor" 
            />
          ))}
        </g>
        
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 20)
          return (
            <g key={i} className="group">
              <rect
                x={i * barWidth + gap / 2}
                y={height - 20 - barHeight}
                width={barWidth - gap}
                height={barHeight}
                fill={color}
                rx="2"
                className={`transition-all hover:brightness-110 ${animate ? 'animate-grow-height' : ''}`}
                style={{ transformOrigin: 'bottom' }}
              />
              {/* Value label on hover */}
              <text
                x={i * barWidth + barWidth / 2}
                y={height - 20 - barHeight - 4}
                textAnchor="middle"
                className="fill-white text-[6px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {d.value.toLocaleString()}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-neutral-500 -mt-4">
        {data.map((d, i) => (
          <span key={i} className="truncate text-center" style={{ width: `${barWidth}%` }} title={d.label}>
            {d.label.slice(0, 4)}
          </span>
        ))}
      </div>
    </div>
  )
}

// Stacked bar for comparing multiple metrics
interface StackedBarProps {
  data: Array<{ label: string; values: Array<{ name: string; value: number; color: string }> }>
  height?: number
}

export function StackedBar({ data, height = 24 }: StackedBarProps) {
  if (data.length === 0) return null

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const total = item.values.reduce((a, b) => a + b.value, 0)
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">{item.label}</span>
              <span className="text-white font-medium">{total.toLocaleString()}</span>
            </div>
            <div className="flex rounded-full overflow-hidden bg-white/5" style={{ height: `${Math.max(8, height / 3)}px` }}>
              {item.values.map((v, j) => {
                const pct = total > 0 ? (v.value / total) * 100 : 0
                return (
                  <div
                    key={j}
                    className="h-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: v.color }}
                    title={`${v.name}: ${v.value.toLocaleString()} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface DonutChartProps {
  data: DataPoint[]
  size?: number
  colors?: string[]
  showLegend?: boolean
  showPercentages?: boolean
  centerLabel?: string
  centerValue?: string | number
}

export function DonutChart({ 
  data, 
  size = 100, 
  colors = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'],
  showLegend = true,
  showPercentages = false,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = 40
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius

  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          
          {data.map((d, i) => {
            const percent = d.value / total
            const dashLength = percent * circumference
            const currentOffset = offset
            offset += dashLength

            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={-currentOffset}
                transform="rotate(-90 50 50)"
                className="transition-all duration-500 hover:brightness-110"
              />
            )
          })}
          
          {/* Center text */}
          <text x="50" y="46" textAnchor="middle" className="fill-white text-lg font-bold">
            {centerValue ?? total.toLocaleString()}
          </text>
          {centerLabel && (
            <text x="50" y="58" textAnchor="middle" className="fill-neutral-500 text-[8px]">
              {centerLabel}
            </text>
          )}
        </svg>
      </div>
      
      {showLegend && (
        <div className="space-y-1.5 flex-1">
          {data.map((d, i) => {
            const pct = (d.value / total) * 100
            return (
              <div key={i} className="flex items-center gap-2 text-xs group">
                <div 
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: colors[i % colors.length] }} 
                />
                <span className="text-neutral-400 flex-1 truncate">{d.label}</span>
                <span className="text-white font-medium">{d.value.toLocaleString()}</span>
                {showPercentages && (
                  <span className="text-neutral-500 w-10 text-right">
                    {pct.toFixed(1)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Progress ring - for single metric visualization
interface ProgressRingProps {
  value: number
  max: number
  size?: number
  color?: string
  label?: string
  showPercentage?: boolean
}

export function ProgressRing({ 
  value, 
  max, 
  size = 80, 
  color = '#f97316',
  label,
  showPercentage = true,
}: ProgressRingProps) {
  const radius = 35
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const percentage = max > 0 ? (value / max) * 100 : 0
  const dashLength = (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {/* Background */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashLength} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-700"
        />
        {/* Center text */}
        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="fill-white text-sm font-bold">
          {showPercentage ? `${percentage.toFixed(0)}%` : value.toLocaleString()}
        </text>
      </svg>
      {label && <span className="text-xs text-neutral-500 mt-1">{label}</span>}
    </div>
  )
}

// Funnel visualization - enhanced with drop-off indicators
interface FunnelProps {
  steps: Array<{ label: string; count: number; rate: number }>
  color?: string
  showDropOff?: boolean
}

export function FunnelChart({ steps, color = '#f97316', showDropOff = true }: FunnelProps) {
  if (steps.length === 0) return null

  const maxCount = steps[0]?.count || 1

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const width = Math.max(25, (step.count / maxCount) * 100)
        const dropOff = i > 0 ? steps[i - 1].count - step.count : 0
        const dropOffPct = i > 0 && steps[i - 1].count > 0 
          ? (dropOff / steps[i - 1].count) * 100 
          : 0
        
        // Color gradient based on position
        const opacity = 0.3 + (1 - i / steps.length) * 0.5
        
        return (
          <div key={i}>
            {/* Drop-off indicator */}
            {showDropOff && i > 0 && dropOff > 0 && (
              <div className="flex items-center gap-2 py-1 pl-4">
                <div className="flex-1 border-l-2 border-dashed border-red-500/30 h-3" />
                <span className="text-xs text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded">
                  ↓ {dropOff.toLocaleString()} ({dropOffPct.toFixed(0)}%)
                </span>
              </div>
            )}
            
            <div className="relative flex items-center">
              {/* Step number */}
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-neutral-400 mr-2 flex-shrink-0">
                {i + 1}
              </div>
              
              {/* Funnel bar */}
              <div
                className="h-10 rounded-lg flex items-center justify-between px-4 transition-all duration-500 hover:brightness-110"
                style={{ 
                  width: `${width}%`, 
                  backgroundColor: color,
                  opacity,
                }}
              >
                <span className="text-sm font-medium text-white truncate">{step.label}</span>
                <span className="text-sm text-white font-bold">{step.count.toLocaleString()}</span>
              </div>
              
              {/* Conversion rate badge */}
              {i > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  step.rate >= 50 ? 'bg-green-500/20 text-green-400' : 
                  step.rate >= 25 ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-red-500/20 text-red-400'
                }`}>
                  {step.rate.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Gauge chart for single KPI
interface GaugeProps {
  value: number
  min?: number
  max: number
  thresholds?: { good: number; warning: number }
  label?: string
  unit?: string
  size?: number
}

export function GaugeChart({ 
  value, 
  min = 0, 
  max, 
  thresholds,
  label,
  unit = '',
  size = 120,
}: GaugeProps) {
  const range = max - min
  const percentage = Math.min(100, Math.max(0, ((value - min) / range) * 100))
  const angle = (percentage / 100) * 180 - 90 // -90 to 90 degrees
  
  // Determine color based on thresholds
  let color = '#f97316'
  if (thresholds) {
    if (value >= thresholds.good) color = '#22c55e'
    else if (value >= thresholds.warning) color = '#eab308'
    else color = '#ef4444'
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" style={{ width: size, height: size * 0.6 }}>
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          className="transition-all duration-700"
        />
        
        {/* Needle */}
        <line
          x1="50"
          y1="50"
          x2={50 + 30 * Math.cos((angle * Math.PI) / 180)}
          y2={50 + 30 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        <circle cx="50" cy="50" r="4" fill={color} />
        
        {/* Value text */}
        <text x="50" y="48" textAnchor="middle" className="fill-white text-sm font-bold">
          {value.toLocaleString()}{unit}
        </text>
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between w-full text-xs text-neutral-500 -mt-1">
        <span>{min}{unit}</span>
        {label && <span className="text-neutral-400">{label}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

// Heat calendar - for showing activity over time
interface HeatCalendarProps {
  data: Array<{ date: string; value: number }>
  weeks?: number
  color?: string
}

export function HeatCalendar({ data, weeks = 12, color = '#f97316' }: HeatCalendarProps) {
  const max = Math.max(...data.map(d => d.value), 1)
  const dataMap = new Map(data.map(d => [d.date, d.value]))
  
  // Generate dates for the last N weeks
  const today = new Date()
  const days: Array<{ date: string; value: number; dayOfWeek: number }> = []
  
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      value: dataMap.get(dateStr) || 0,
      dayOfWeek: date.getDay(),
    })
  }

  const getOpacity = (value: number) => {
    if (value === 0) return 0.1
    return 0.2 + (value / max) * 0.8
  }

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: weeks }).map((_, weekIdx) => (
        <div key={weekIdx} className="flex flex-col gap-0.5">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const idx = weekIdx * 7 + dayIdx
            const day = days[idx]
            if (!day) return <div key={dayIdx} className="w-2.5 h-2.5" />
            
            return (
              <div
                key={dayIdx}
                className="w-2.5 h-2.5 rounded-sm transition-all hover:ring-1 hover:ring-white/30"
                style={{ backgroundColor: color, opacity: getOpacity(day.value) }}
                title={`${day.date}: ${day.value}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
