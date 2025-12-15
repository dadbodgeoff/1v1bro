/**
 * MiniChart - Simple SVG-based charts for analytics
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
}

export function LineChart({ data, height = 80, color = '#f97316', showLabels = false }: LineChartProps) {
  if (data.length < 2) return <div className="text-neutral-500 text-xs">Not enough data</div>

  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const range = max - min || 1

  const width = 100
  const padding = 2

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.value - min) / range) * (height - padding * 2),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#gradient-${color})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
        ))}
      </svg>
      {showLabels && (
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>{data[0].label}</span>
          <span>{data[data.length - 1].label}</span>
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
}

export function BarChart({ data, height = 120, color = '#f97316', horizontal = false }: BarChartProps) {
  if (data.length === 0) return <div className="text-neutral-500 text-xs">No data</div>

  const max = Math.max(...data.map(d => d.value), 1)

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 w-20 truncate" title={d.label}>
              {d.label}
            </span>
            <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs text-neutral-300 w-12 text-right">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  const barWidth = 100 / data.length
  const gap = barWidth * 0.2

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 20)
          return (
            <g key={i}>
              <rect
                x={i * barWidth + gap / 2}
                y={height - 20 - barHeight}
                width={barWidth - gap}
                height={barHeight}
                fill={color}
                rx="2"
              />
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-neutral-500 -mt-4">
        {data.map((d, i) => (
          <span key={i} className="truncate" style={{ width: `${barWidth}%` }} title={d.label}>
            {d.label.slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  )
}

interface DonutChartProps {
  data: DataPoint[]
  size?: number
  colors?: string[]
}

export function DonutChart({ data, size = 100, colors = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444'] }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = 40
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius

  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
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
            />
          )
        })}
        <text x="50" y="50" textAnchor="middle" dy="0.3em" className="fill-white text-lg font-bold">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-neutral-400">{d.label}</span>
            <span className="text-white font-medium">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Funnel visualization
interface FunnelProps {
  steps: Array<{ label: string; count: number; rate: number }>
  color?: string
}

export function FunnelChart({ steps, color = '#f97316' }: FunnelProps) {
  if (steps.length === 0) return null

  const maxCount = steps[0]?.count || 1

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const width = Math.max(20, (step.count / maxCount) * 100)
        return (
          <div key={i} className="relative">
            <div
              className="h-10 rounded flex items-center justify-between px-3 transition-all"
              style={{ 
                width: `${width}%`, 
                backgroundColor: `${color}${Math.round(30 + (1 - i / steps.length) * 40).toString(16)}`,
              }}
            >
              <span className="text-sm font-medium text-white truncate">{step.label}</span>
              <span className="text-sm text-white/80">{step.count.toLocaleString()}</span>
            </div>
            {i > 0 && (
              <span className={`absolute -top-1 right-0 text-xs ${step.rate >= 50 ? 'text-green-400' : step.rate >= 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {step.rate.toFixed(1)}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
