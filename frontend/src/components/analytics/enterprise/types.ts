/**
 * Enterprise Analytics Types
 */

// Date range for all analytics queries
export interface DateRange {
  start: string
  end: string
}

// Overview metrics
export interface OverviewMetrics {
  totalSessions: number
  uniqueVisitors: number
  totalPageViews: number
  totalEvents: number
  totalConversions: number
  conversionRate: number
}

// Daily stats for charts
export interface DailyStats {
  date: string
  views: number
  visitors: number
  conversions: number
}

// Device breakdown
export interface DeviceBreakdown {
  mobile: number
  tablet: number
  desktop: number
}

// Traffic source
export interface TrafficSource {
  source: string
  count: number
  conversions?: number
  conversionRate?: number
}

// Page analytics
export interface PageStats {
  page: string
  views: number
  avgTimeOnPage: number
  avgScrollDepth: number
  bounceRate?: number
}

// Performance metrics (Core Web Vitals)
export interface WebVitals {
  lcp: { avg: number | null; p75: number | null; p95: number | null }
  fid: { avg: number | null; p75: number | null; p95: number | null }
  cls: { avg: number | null; p75: number | null; p95: number | null }
  ttfb: { avg: number | null; p75: number | null; p95: number | null }
}

export type VitalGrade = 'Good' | 'Needs Improvement' | 'Poor' | 'N/A'

// User journey
export interface Journey {
  id: string
  visitorId: string
  sessionId: string
  entryPage: string
  exitPage: string
  totalPages: number
  totalEvents: number
  converted: boolean
  conversionType: string | null
  deviceType: string
  startedAt: string
  endedAt: string
}

export interface JourneyStep {
  id: string
  stepNumber: number
  stepType: 'pageview' | 'event' | 'click'
  page: string
  eventName: string | null
  elementId: string | null
  durationMs: number | null
  timestamp: string
}

// Error tracking
export interface TrackedError {
  id: string
  errorType: string
  errorMessage: string
  errorSource: string | null
  errorLine: number | null
  component: string | null
  occurrenceCount: number
  firstSeen: string
  lastSeen: string
  resolved: boolean
  browser: string
}

// Realtime data
export interface RealtimeSession {
  sessionId: string
  currentPage: string
  deviceType: string
  lastActivity: string
}

export interface RealtimeData {
  activeUsers: number
  sessions: RealtimeSession[]
  pageBreakdown: Array<{ page: string; count: number }>
  deviceBreakdown: DeviceBreakdown
}

// Survival game analytics
export interface SurvivalOverview {
  totalRuns: number
  uniquePlayers: number
  avgDistance: number
  avgScore: number
  maxDistance: number
  maxScore: number
  maxCombo: number
}

export interface DifficultyCurvePoint {
  distanceBucket: number
  distanceLabel: string
  totalReached: number
  totalDeaths: number
  survivalRate: number
  avgSpeed: number
}

export interface ObstacleStats {
  obstacleType: string
  totalEncounters: number
  totalDeaths: number
  deathRate: number
  avgDistance: number
}

export interface FunnelStep {
  step: string
  label: string
  count: number
  conversionRate: number
  dropOff: number
}

// Shop analytics
export interface ShopFunnel {
  funnel: FunnelStep[]
  totalRevenue: number
  purchaseCount: number
  failedPurchases: number
  popularItems: Array<{ id: string; type: string; views: number }>
  topSellers: Array<{ id: string; type: string; count: number; revenue: number }>
}

// Trivia analytics
export interface TriviaAnalysis {
  sampleSize: number
  totalCorrect: number
  totalWrong: number
  totalTimeout: number
  overallCorrectRate: number
  avgTimeToAnswerMs: number | null
  byCategory: Array<{
    category: string
    total: number
    correct: number
    correctRate: number
    timeoutRate: number
  }>
}
