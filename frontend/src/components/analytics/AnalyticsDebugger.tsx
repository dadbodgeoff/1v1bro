/**
 * AnalyticsDebugger - Development tool for testing analytics
 * 
 * Shows real-time analytics events being tracked.
 * Only visible in development mode.
 */

import { useState, useEffect, useRef } from 'react'

interface TrackedEvent {
  id: string
  timestamp: Date
  type: 'pageview' | 'event' | 'click' | 'scroll' | 'performance' | 'error' | 'journey'
  data: Record<string, unknown>
}

export function AnalyticsDebugger() {
  const [events, setEvents] = useState<TrackedEvent[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const eventsRef = useRef<TrackedEvent[]>([])

  // Intercept fetch calls to analytics endpoints
  useEffect(() => {
    if (import.meta.env.PROD) return // Only in dev

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      const urlStr = typeof url === 'string' ? url : url.toString()

      // Check if this is an analytics call
      if (urlStr.includes('/analytics/')) {
        try {
          const body = options?.body ? JSON.parse(options.body as string) : {}
          
          // Determine event type
          let type: TrackedEvent['type'] = 'event'
          if (urlStr.includes('/pageview')) type = 'pageview'
          else if (urlStr.includes('/click')) type = 'click'
          else if (urlStr.includes('/scroll')) type = 'scroll'
          else if (urlStr.includes('/performance')) type = 'performance'
          else if (urlStr.includes('/error')) type = 'error'
          else if (urlStr.includes('/journey')) type = 'journey'

          const newEvent: TrackedEvent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date(),
            type,
            data: body,
          }

          eventsRef.current = [newEvent, ...eventsRef.current.slice(0, 99)]
          setEvents([...eventsRef.current])
        } catch {
          // Ignore parse errors
        }
      }

      return originalFetch(...args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Don't render in production
  if (import.meta.env.PROD) return null

  const filteredEvents = filter
    ? events.filter(e => e.type === filter || JSON.stringify(e.data).toLowerCase().includes(filter.toLowerCase()))
    : events

  const typeColors: Record<string, string> = {
    pageview: 'bg-blue-500/20 text-blue-400',
    event: 'bg-green-500/20 text-green-400',
    click: 'bg-orange-500/20 text-orange-400',
    scroll: 'bg-purple-500/20 text-purple-400',
    performance: 'bg-cyan-500/20 text-cyan-400',
    error: 'bg-red-500/20 text-red-400',
    journey: 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors"
        title="Analytics Debugger"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {events.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {events.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-96 max-h-[60vh] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Analytics Debugger</span>
              <span className="text-xs text-neutral-500">({events.length} events)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { eventsRef.current = []; setEvents([]) }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter events..."
              className="w-full px-2 py-1 bg-white/5 rounded text-xs border border-white/10"
            />
            <div className="flex gap-1 mt-2 flex-wrap">
              {['pageview', 'event', 'click', 'scroll', 'performance', 'error', 'journey'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(filter === type ? '' : type)}
                  className={`px-2 py-0.5 rounded text-xs ${filter === type ? typeColors[type] : 'bg-white/5 text-neutral-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="overflow-y-auto max-h-[40vh]">
            {filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                No analytics events captured yet.
                <br />
                <span className="text-xs">Navigate around to see events.</span>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="p-2 border-b border-white/5 hover:bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${typeColors[event.type]}`}>
                      {event.type}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs text-neutral-400 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(event.data, null, 2).slice(0, 200)}
                    {JSON.stringify(event.data).length > 200 && '...'}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
