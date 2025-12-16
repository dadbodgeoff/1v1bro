# Design Document: Unified Analytics Dashboard

## Overview

The Unified Analytics Dashboard consolidates three existing analytics systems (AdminAnalytics, AdminAnalyticsEnterprise, AdminSurvivalAnalytics) into a single, advertiser-ready platform at `/analytics`. The dashboard provides comprehensive tracking, session-level drill-down, and enterprise-grade UI components.

### Key Design Goals
1. **Single source of truth** - One dashboard for all analytics needs
2. **Advertiser-ready metrics** - Clear KPIs for engagement, conversion, retention
3. **Session Explorer** - Click any session ID to see complete event timeline
4. **Enterprise UI** - Consistent components with professional styling
5. **Performance** - Lazy loading, efficient data fetching, responsive design

## Architecture

```mermaid
graph TB
    subgraph Frontend
        AD[AnalyticsDashboard Page]
        TP[Tab Panel Container]
        SE[Session Explorer Modal]
        
        subgraph Panels
            OP[OverviewPanel]
            PP[PagesPanel]
            TP2[TechPanel]
            UP[UTMPanel]
            JP[JourneysPanel]
            SP[SessionsPanel]
            HP[HeatmapPanel]
            EP[EventsPanel]
            FP[FunnelsPanel]
            PerfP[PerformancePanel]
            RP[RealtimePanel]
            ErrP[ErrorsPanel]
            ExpP[ExperimentsPanel]
            CP[CohortsPanel]
            SurvP[SurvivalPanel]
        end
        
        subgraph Enterprise Components
            MC[MetricCard]
            DT[DataTable]
            CH[Charts]
            SL[SessionLink]
        end
    end
    
    subgraph Backend APIs
        BA[/analytics/*]
        EA[/analytics/enterprise/*]
        SA[/analytics/survival/*]
    end
    
    AD --> TP
    TP --> Panels
    Panels --> Enterprise Components
    SP --> SE
    JP --> SE
    EP --> SE
    
    Panels --> BA
    Panels --> EA
    Panels --> SA
```

## Components and Interfaces

### 1. SessionLink Component
A reusable component that renders session IDs as clickable links, opening the Session Explorer.

```typescript
interface SessionLinkProps {
  sessionId: string
  className?: string
  children?: React.ReactNode
}

// Usage: <SessionLink sessionId="abc-123" />
```

### 2. SessionExplorer Modal
A modal component displaying complete session details with event timeline.

```typescript
interface SessionExplorerProps {
  sessionId: string
  isOpen: boolean
  onClose: () => void
}

interface SessionDetails {
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

interface SessionEvent {
  id: string
  type: 'pageview' | 'event' | 'click' | 'error' | 'conversion'
  timestamp: string
  page: string
  eventName?: string
  metadata?: Record<string, unknown>
  duration?: number
  isConversion: boolean
}
```

### 3. Enhanced MetricCard
Extended metric card with trend comparison.

```typescript
interface MetricCardProps {
  label: string
  value: number | string
  previousValue?: number
  format?: 'number' | 'percent' | 'duration' | 'currency'
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  icon?: React.ReactNode
  loading?: boolean
}
```

### 4. Panel Header Component
Consistent header for all panels.

```typescript
interface PanelHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  badge?: string
}
```

### 5. Tab Categories
Panels organized into logical groups:

```typescript
type TabCategory = 'traffic' | 'engagement' | 'technical' | 'experiments' | 'game'

const TAB_CATEGORIES: Record<TabCategory, Tab[]> = {
  traffic: ['overview', 'pages', 'utm', 'sessions'],
  engagement: ['journeys', 'funnels', 'events', 'heatmap'],
  technical: ['performance', 'tech', 'errors'],
  experiments: ['experiments', 'cohorts'],
  game: ['survival', 'realtime'],
}
```

## Data Models

### Session Explorer Data
```typescript
interface SessionExplorerData {
  session: SessionDetails
  events: SessionEvent[]
  pageJourney: PageVisit[]
  totalDuration: number
  totalPages: number
  totalEvents: number
}

interface PageVisit {
  page: string
  enteredAt: string
  exitedAt: string | null
  duration: number
  scrollDepth: number | null
}
```

### API Response Types
```typescript
interface SessionEventsResponse {
  success: boolean
  data: {
    session: SessionDetails
    events: SessionEvent[]
    pageviews: PageVisit[]
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Device breakdown percentages sum to 100%
*For any* device breakdown data (mobile, tablet, desktop), the sum of percentages SHALL equal 100% (within floating point tolerance of 0.1%).
**Validates: Requirements 1.2**

### Property 2: Session events are chronologically ordered
*For any* session's event list in the Session Explorer, events SHALL be sorted by timestamp in ascending order (earliest first).
**Validates: Requirements 2.3**

### Property 3: Session context fields are complete
*For any* session displayed in the Session Explorer, all required context fields (device, browser, OS, timezone) SHALL be present and non-null.
**Validates: Requirements 2.4**

### Property 4: Funnel conversion rates are correctly calculated
*For any* funnel step N and step N+1, the conversion rate SHALL equal (count at step N+1) / (count at step N) * 100.
**Validates: Requirements 3.1**

### Property 5: Funnel drop-off is inverse of conversion
*For any* funnel step, drop-off percentage SHALL equal 100% minus the conversion rate to the next step.
**Validates: Requirements 3.2**

### Property 6: Date range preservation across navigation
*For any* sequence of tab navigations, the selected date range SHALL remain unchanged unless explicitly modified by the user.
**Validates: Requirements 4.2**

### Property 7: Error grouping and counting
*For any* set of JS errors with the same error message, they SHALL be grouped together with an accurate occurrence count.
**Validates: Requirements 6.1**

### Property 8: Cohort retention percentages are bounded
*For any* cohort retention data, retention percentages SHALL be between 0% and 100% inclusive.
**Validates: Requirements 7.3**

### Property 9: Experiment variant weights sum to 100%
*For any* experiment with multiple variants, the traffic allocation weights SHALL sum to 100%.
**Validates: Requirements 8.3**

### Property 10: Survival funnel is monotonically decreasing
*For any* survival progression funnel, each step's count SHALL be less than or equal to the previous step's count.
**Validates: Requirements 9.4**

### Property 11: Metric card displays all required fields
*For any* MetricCard component, it SHALL render value, label, and trend indicator (when previousValue is provided).
**Validates: Requirements 10.4**

### Property 12: Export includes date range
*For any* data export (CSV or JSON), the filename or content SHALL include the selected date range.
**Validates: Requirements 11.3**

### Property 13: Scroll depth milestones are monotonically decreasing
*For any* scroll depth data, the percentage of users reaching each milestone (25%, 50%, 75%, 100%) SHALL be monotonically decreasing.
**Validates: Requirements 12.3**

### Property 14: Web Vitals grading follows thresholds
*For any* Core Web Vital metric, the grade (Good/Needs Improvement/Poor) SHALL be determined by standard Web Vitals thresholds:
- LCP: Good < 2.5s, Poor > 4s
- FID: Good < 100ms, Poor > 300ms
- CLS: Good < 0.1, Poor > 0.25
**Validates: Requirements 13.1**

### Property 15: Percentile ordering
*For any* performance metric with percentiles, p75 SHALL be less than or equal to p95.
**Validates: Requirements 13.2**

### Property 16: Campaign conversion rate calculation
*For any* UTM campaign, conversion rate SHALL equal (conversions / visitors) * 100.
**Validates: Requirements 14.2**

## Error Handling

1. **API Failures**: Display error state with retry button, preserve last known data
2. **Empty States**: Show helpful empty state messages with suggested actions
3. **Loading States**: Skeleton loaders matching component dimensions
4. **Invalid Data**: Gracefully handle null/undefined values with fallback displays

## Testing Strategy

Testing will be minimal and focused on critical functionality only:

1. **Manual testing** - Primary validation through browser testing
2. **Smoke tests** - Basic render tests for key components if needed
3. **API validation** - Verify backend endpoints return expected data structures

No extensive unit tests or property-based tests required for this feature.
