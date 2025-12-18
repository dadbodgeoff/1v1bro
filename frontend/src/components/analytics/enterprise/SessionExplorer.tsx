/**
 * SessionExplorer - Modal for viewing complete session details
 * Displays session context, event timeline, and page journey
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'

// Session context information
export interface SessionDetails {
  sessionId: string
  visitorId: string
  deviceType: string
  browser: string
  os: string
  screenSize: string
  locale: string
  timezone: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  firstReferrer: string | null
  startedAt: string
  endedAt: string | null
  converted: boolean
  convertedAt: string | null
}

// Individual event in the session
export interface SessionEvent {
  id: string
  type: 'pageview' | 'event' | 'click' | 'error' | 'conversion'
  timestamp: string
  page: string
  eventName?: string
  metadata?: Record<string, unknown>
  duration?: number
  isConversion: boolean
}

// Page visit in the journey
export interface PageVisit {
  page: string
  enteredAt: string
  exitedAt: string | null
  duration: number
  scrollDepth: number | null
}

// Survival run data
export interface SurvivalRun {
  runNumber: number
  distance: number
  score: number
  duration: number
  maxCombo: number
  obstaclesCleared: number
  nearMisses: number
  jumps: number
  slides: number
  laneChanges: number
  deathCause: string | null
  deathLane: number | null
  speedAtDeath: number | null
  startedAt: string
  endedAt: string | null
}

export interface TriviaAnswer {
  category: string
  difficulty: string | null
  correct: boolean
  timedOut: boolean
  timeToAnswerMs: number | null
  distanceAtQuestion: number | null
  streakBefore: number
  timestamp: string
}

export interface SurvivalSummary {
  totalRuns: number
  playAgainCount: number
  totalDistance: number
  maxDistance: number
  totalPlaytimeSeconds: number
  questionsAnswered: number
  correctAnswers: number
  timedOutAnswers: number
  correctRate: number
  deathCauses: [string, number][]
  topDeathCause: string | null
}

export interface SessionExplorerProps {
  sessionId: string
  isOpen: boolean
  onClose: () => void
}


export function SessionExplorer({ sessionId, isOpen, onClose }: SessionExplorerProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [pageJourney, setPageJourney] = useState<PageVisit[]>([])
  const [survivalSummary, setSurvivalSummary] = useState<SurvivalSummary | null>(null)
  const [survivalRuns, setSurvivalRuns] = useState<SurvivalRun[]>([])
  const [triviaAnswers, setTriviaAnswers] = useState<TriviaAnswer[]>([])

  const fetchSessionData = useCallback(async () => {
    if (!sessionId || !token) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Fetch session events and survival data in parallel
      const [eventsRes, survivalRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard/session/${sessionId}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analytics/dashboard/session/${sessionId}/survival`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      
      const eventsData = await eventsRes.json()
      const survivalData = await survivalRes.json()
      
      if (eventsData.success) {
        setSession(eventsData.data.session)
        const sortedEvents = sortEventsChronologically(eventsData.data.events || [])
        setEvents(sortedEvents)
        setPageJourney(eventsData.data.pageviews || [])
      } else {
        setError(eventsData.error || 'Failed to load session data')
      }
      
      // Survival data is optional - session may not have played survival
      if (survivalData.success && survivalData.data) {
        setSurvivalSummary(survivalData.data.summary)
        setSurvivalRuns(survivalData.data.runs || [])
        setTriviaAnswers(survivalData.data.trivia || [])
      }
    } catch (e) {
      console.error('Failed to fetch session data', e)
      setError('Failed to load session data')
    }
    
    setLoading(false)
  }, [sessionId, token])

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionData()
    }
  }, [isOpen, sessionId, fetchSessionData])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Session Explorer</h2>
            <p className="text-xs text-neutral-500 font-mono">{sessionId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close session explorer"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchSessionData} />
          ) : session ? (
            <div className="p-6 space-y-6">
              <SessionContext session={session} />
              {survivalSummary && survivalSummary.totalRuns > 0 && (
                <SurvivalSection 
                  summary={survivalSummary} 
                  runs={survivalRuns} 
                  trivia={triviaAnswers} 
                />
              )}
              <EventTimeline events={events} />
              <PageJourney pages={pageJourney} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


/**
 * Sorts session events in chronological order (ascending by timestamp)
 * Property 2: Session events are chronologically ordered
 */
export function sortEventsChronologically(events: SessionEvent[]): SessionEvent[] {
  return [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

// Session context display component
function SessionContext({ session }: { session: SessionDetails }) {
  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const contextItems = [
    { label: 'Device', value: session.deviceType, icon: '📱' },
    { label: 'Browser', value: session.browser, icon: '🌐' },
    { label: 'OS', value: session.os, icon: '💻' },
    { label: 'Screen', value: session.screenSize, icon: '📐' },
    { label: 'Locale', value: session.locale, icon: '🌍' },
    { label: 'Timezone', value: session.timezone, icon: '🕐' },
  ]

  const utmItems = [
    { label: 'Source', value: session.utmSource },
    { label: 'Medium', value: session.utmMedium },
    { label: 'Campaign', value: session.utmCampaign },
    { label: 'Referrer', value: session.firstReferrer },
  ].filter(item => item.value)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Session Context</h3>
      
      {/* Time info */}
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-neutral-500">Started:</span>{' '}
          <span className="text-white">{formatDate(session.startedAt)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Ended:</span>{' '}
          <span className="text-white">{formatDate(session.endedAt)}</span>
        </div>
        {session.converted && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Converted</span>
            {session.convertedAt && (
              <span className="text-neutral-500 text-xs">at {formatDate(session.convertedAt)}</span>
            )}
          </div>
        )}
      </div>

      {/* Device/Browser info grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {contextItems.map(item => (
          <div key={item.label} className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-xs text-neutral-500">{item.label}</div>
            <div className="text-sm text-white truncate" title={item.value || '—'}>
              {item.value || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* UTM Parameters */}
      {utmItems.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-xs text-neutral-500 mb-2">UTM Parameters</div>
          <div className="flex flex-wrap gap-2">
            {utmItems.map(item => (
              <span 
                key={item.label} 
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// Event timeline component
function EventTimeline({ events }: { events: SessionEvent[] }) {
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getEventIcon = (type: SessionEvent['type']) => {
    switch (type) {
      case 'pageview': return '📄'
      case 'event': return '⚡'
      case 'click': return '👆'
      case 'error': return '❌'
      case 'conversion': return '🎯'
      default: return '•'
    }
  }

  const getEventColor = (type: SessionEvent['type'], isConversion: boolean) => {
    if (isConversion) return 'border-green-500 bg-green-500/10'
    switch (type) {
      case 'pageview': return 'border-blue-500 bg-blue-500/10'
      case 'event': return 'border-orange-500 bg-orange-500/10'
      case 'click': return 'border-cyan-500 bg-cyan-500/10'
      case 'error': return 'border-red-500 bg-red-500/10'
      case 'conversion': return 'border-green-500 bg-green-500/10'
      default: return 'border-neutral-500 bg-neutral-500/10'
    }
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Event Timeline</h3>
        <div className="text-center py-8 text-neutral-500">No events recorded for this session</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
        Event Timeline ({events.length} events)
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
        
        {/* Events */}
        <div className="space-y-3">
          {events.map((event, index) => (
            <div 
              key={event.id || index} 
              className={`relative pl-10 ${event.isConversion ? 'animate-pulse' : ''}`}
            >
              {/* Timeline dot */}
              <div className={`absolute left-2 w-4 h-4 rounded-full border-2 ${getEventColor(event.type, event.isConversion)}`}>
                <span className="absolute -left-0.5 -top-0.5 text-xs">{getEventIcon(event.type)}</span>
              </div>
              
              {/* Event card */}
              <div className={`rounded-lg border p-3 ${getEventColor(event.type, event.isConversion)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white uppercase">{event.type}</span>
                      {event.isConversion && (
                        <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded font-medium">
                          CONVERSION
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-300 mt-1">
                      {event.eventName || event.page}
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-neutral-500 font-mono">
                        {JSON.stringify(event.metadata, null, 0).slice(0, 100)}
                        {JSON.stringify(event.metadata).length > 100 && '...'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 whitespace-nowrap">
                    {formatTime(event.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// Page journey component
function PageJourney({ pages }: { pages: PageVisit[] }) {
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '0s'
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  if (pages.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Page Journey</h3>
        <div className="text-center py-8 text-neutral-500">No page visits recorded</div>
      </div>
    )
  }

  const totalDuration = pages.reduce((sum, p) => sum + (p.duration || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
          Page Journey ({pages.length} pages)
        </h3>
        <span className="text-xs text-neutral-500">
          Total time: {formatDuration(totalDuration)}
        </span>
      </div>
      
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-2 text-xs text-neutral-500 font-medium">#</th>
              <th className="text-left px-4 py-2 text-xs text-neutral-500 font-medium">Page</th>
              <th className="text-right px-4 py-2 text-xs text-neutral-500 font-medium">Duration</th>
              <th className="text-right px-4 py-2 text-xs text-neutral-500 font-medium">Scroll</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, index) => (
              <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-2 text-neutral-500">{index + 1}</td>
                <td className="px-4 py-2">
                  <span className="font-mono text-xs text-cyan-400 truncate block max-w-[300px]" title={page.page}>
                    {page.page}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-blue-400">
                  {formatDuration(page.duration)}
                </td>
                <td className="px-4 py-2 text-right">
                  {page.scrollDepth !== null ? (
                    <span className={`${page.scrollDepth >= 75 ? 'text-green-400' : page.scrollDepth >= 50 ? 'text-yellow-400' : 'text-neutral-400'}`}>
                      {page.scrollDepth}%
                    </span>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-500">Loading session data...</span>
      </div>
    </div>
  )
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-4xl">😕</div>
        <div className="text-red-400">{error}</div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}


// Survival gameplay section
function SurvivalSection({ 
  summary, 
  runs, 
  trivia 
}: { 
  summary: SurvivalSummary
  runs: SurvivalRun[]
  trivia: TriviaAnswer[]
}) {
  const [expandedRun, setExpandedRun] = useState<number | null>(null)
  
  const formatDistance = (d: number) => d >= 1000 ? `${(d / 1000).toFixed(2)}km` : `${Math.round(d)}m`
  const formatDuration = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`
    const mins = Math.floor(s / 60)
    const secs = Math.round(s % 60)
    return `${mins}m ${secs}s`
  }

  const deathIcon = (cause: string | null) => {
    if (!cause) return '❓'
    const lower = cause.toLowerCase()
    if (lower.includes('spike')) return '🔺'
    if (lower.includes('barrier') || lower.includes('wall')) return '🧱'
    if (lower.includes('gap') || lower.includes('hole')) return '🕳️'
    if (lower.includes('laser')) return '⚡'
    if (lower.includes('train')) return '🚂'
    return '💀'
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
        <span>🎮</span> Survival Gameplay
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20 p-3">
          <div className="text-xs text-orange-400 mb-1">Total Runs</div>
          <div className="text-xl font-bold text-orange-400">{summary.totalRuns}</div>
          {summary.playAgainCount > 0 && (
            <div className="text-xs text-neutral-500 mt-1">
              🔄 Played again {summary.playAgainCount}x
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20 p-3">
          <div className="text-xs text-blue-400 mb-1">Distance Traveled</div>
          <div className="text-xl font-bold text-blue-400">{formatDistance(summary.totalDistance)}</div>
          <div className="text-xs text-neutral-500 mt-1">
            Best: {formatDistance(summary.maxDistance)}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20 p-3">
          <div className="text-xs text-purple-400 mb-1">Questions</div>
          <div className="text-xl font-bold text-purple-400">{summary.questionsAnswered}</div>
          {summary.questionsAnswered > 0 && (
            <div className="text-xs text-neutral-500 mt-1">
              ✅ {summary.correctAnswers} correct ({summary.correctRate}%)
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20 p-3">
          <div className="text-xs text-red-400 mb-1">Top Death Cause</div>
          <div className="text-xl font-bold text-red-400 flex items-center gap-1">
            {deathIcon(summary.topDeathCause)}
            <span className="truncate">{summary.topDeathCause || 'None'}</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Playtime: {formatDuration(summary.totalPlaytimeSeconds)}
          </div>
        </div>
      </div>
      
      {/* Death Causes Breakdown */}
      {summary.deathCauses.length > 1 && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-xs text-neutral-500 mb-2">Death Causes</div>
          <div className="flex flex-wrap gap-2">
            {summary.deathCauses.map(([cause, count]) => (
              <span 
                key={cause}
                className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs flex items-center gap-1"
              >
                {deathIcon(cause)} {cause}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Run Details */}
      {runs.length > 0 && (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10 text-xs text-neutral-500">
            Run History ({runs.length} runs)
          </div>
          <div className="divide-y divide-white/5">
            {runs.map((run) => (
              <div key={run.runNumber} className="hover:bg-white/5">
                <button
                  onClick={() => setExpandedRun(expandedRun === run.runNumber ? null : run.runNumber)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500">#{run.runNumber}</span>
                    <span className="text-sm text-white font-medium">{formatDistance(run.distance)}</span>
                    <span className="text-xs text-neutral-400">{run.score.toLocaleString()} pts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {run.deathCause && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        {deathIcon(run.deathCause)} {run.deathCause}
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">{formatDuration(run.duration)}</span>
                    <svg 
                      className={`w-4 h-4 text-neutral-500 transition-transform ${expandedRun === run.runNumber ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {expandedRun === run.runNumber && (
                  <div className="px-4 pb-3 grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-neutral-500">Max Combo</div>
                      <div className="text-yellow-400 font-medium">{run.maxCombo}x</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-neutral-500">Obstacles</div>
                      <div className="text-green-400 font-medium">{run.obstaclesCleared}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-neutral-500">Near Misses</div>
                      <div className="text-orange-400 font-medium">{run.nearMisses}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-neutral-500">Jumps</div>
                      <div className="text-cyan-400 font-medium">{run.jumps}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-neutral-500">Slides</div>
                      <div className="text-purple-400 font-medium">{run.slides}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-neutral-500">Lane Changes</div>
                      <div className="text-blue-400 font-medium">{run.laneChanges}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Trivia Answers */}
      {trivia.length > 0 && (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10 text-xs text-neutral-500">
            Trivia Questions ({trivia.length} answered)
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-neutral-500">Category</th>
                  <th className="text-center px-3 py-2 text-neutral-500">Result</th>
                  <th className="text-right px-3 py-2 text-neutral-500">Time</th>
                  <th className="text-right px-3 py-2 text-neutral-500">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trivia.map((t, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-3 py-2 text-neutral-300">{t.category}</td>
                    <td className="px-3 py-2 text-center">
                      {t.timedOut ? (
                        <span className="text-yellow-400">⏱️ Timeout</span>
                      ) : t.correct ? (
                        <span className="text-green-400">✅ Correct</span>
                      ) : (
                        <span className="text-red-400">❌ Wrong</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-neutral-400">
                      {t.timeToAnswerMs ? `${(t.timeToAnswerMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-neutral-400">
                      {t.distanceAtQuestion ? formatDistance(t.distanceAtQuestion) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
