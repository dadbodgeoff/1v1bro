# Enterprise Analytics Suite

A comprehensive analytics system for tracking user behavior, performance, and running experiments.

## Features

### 1. User Journey Tracking
- Complete path visualization from entry to exit
- Step-by-step journey breakdown (pageviews, events, clicks)
- Conversion tracking with type attribution
- Funnel analysis with configurable steps

### 2. Core Web Vitals & Performance
- **LCP** (Largest Contentful Paint) - loading performance
- **FID** (First Input Delay) - interactivity
- **CLS** (Cumulative Layout Shift) - visual stability
- Additional metrics: TTFB, FCP, DOM timing, resource counts
- Automatic grading (Good/Needs Improvement/Poor)

### 3. Click Heatmaps
- Visual click density maps per page
- **Rage click detection** - 3+ clicks in 1 second (frustration indicator)
- **Dead click detection** - clicks on non-interactive elements
- Element-level click tracking with coordinates

### 4. Scroll Depth Analytics
- Per-page scroll depth tracking
- Milestone tracking (25%, 50%, 75%, 100%)
- Time-to-milestone metrics
- Scroll-up behavior tracking

### 5. Error Tracking
- Automatic JS error capture with stack traces
- Error deduplication and occurrence counting
- Resolution workflow
- Component and action context

### 6. Cohort Analysis
- User grouping by signup date, source, behavior
- Retention curves (Day 1, 7, 14, 30, 60, 90)
- Acquisition source comparison
- Engagement level segmentation

### 7. A/B Testing
- Experiment creation and management
- Deterministic variant assignment (consistent per visitor)
- Traffic allocation control
- Conversion tracking with statistical analysis

### 8. Real-time Dashboard
- Live active user count
- Current page distribution
- Device breakdown
- Auto-refreshing (10 second intervals)

## Usage

### Frontend Integration

```tsx
// In your App.tsx or root component
import { AnalyticsProvider } from '@/providers/AnalyticsProvider'

function App() {
  return (
    <AnalyticsProvider enabled={true}>
      <YourApp />
    </AnalyticsProvider>
  )
}
```

### Track Custom Events

```tsx
import { useAnalyticsContext } from '@/providers/AnalyticsProvider'

function MyComponent() {
  const { trackEvent } = useAnalyticsContext()
  
  const handleClick = () => {
    trackEvent('button_clicked', { 
      button_name: 'signup',
      location: 'header' 
    })
  }
  
  return <button onClick={handleClick}>Sign Up</button>
}
```

### A/B Testing

```tsx
import { useExperiment, useExperimentConversion } from '@/hooks/useExperiment'

function PricingPage() {
  const { variant, loading } = useExperiment('pricing_test')
  const { trackConversion } = useExperimentConversion()
  
  if (loading) return <Skeleton />
  
  const handlePurchase = () => {
    trackConversion('pricing_test', 99.99)
  }
  
  return (
    <div>
      {variant === 'variant_a' ? (
        <NewPricingLayout onPurchase={handlePurchase} />
      ) : (
        <OriginalPricingLayout onPurchase={handlePurchase} />
      )}
    </div>
  )
}
```

### Using Variant Helper

```tsx
import { useVariant } from '@/hooks/useExperiment'

function CTAButton() {
  const { value: buttonText, loading } = useVariant(
    'cta_experiment',
    {
      control: 'Get Started',
      variant_a: 'Start Free Trial',
      variant_b: 'Try It Now',
    },
    'Get Started'
  )
  
  return <button>{buttonText}</button>
}
```

## API Endpoints

### Tracking (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analytics/enterprise/track/journey-step` | POST | Track journey step |
| `/analytics/enterprise/track/performance` | POST | Track Web Vitals |
| `/analytics/enterprise/track/error` | POST | Track JS error |
| `/analytics/enterprise/track/click` | POST | Track click for heatmap |
| `/analytics/enterprise/track/scroll` | POST | Track scroll depth |
| `/analytics/enterprise/track/heartbeat` | POST | Update real-time presence |
| `/analytics/enterprise/experiment/assign` | POST | Get experiment variant |
| `/analytics/enterprise/experiment/convert` | POST | Record conversion |

### Dashboard (Admin Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analytics/enterprise/dashboard/journeys` | GET | List user journeys |
| `/analytics/enterprise/dashboard/journey/{id}/steps` | GET | Get journey steps |
| `/analytics/enterprise/dashboard/performance` | GET | Get Web Vitals data |
| `/analytics/enterprise/dashboard/errors` | GET | List errors |
| `/analytics/enterprise/dashboard/errors/{id}/resolve` | POST | Mark error resolved |
| `/analytics/enterprise/dashboard/heatmap` | GET | Get click heatmap |
| `/analytics/enterprise/dashboard/scroll-depth` | GET | Get scroll analytics |
| `/analytics/enterprise/dashboard/cohorts` | GET | Get retention curves |
| `/analytics/enterprise/dashboard/experiments` | GET | List experiments |
| `/analytics/enterprise/dashboard/experiments/{id}` | GET | Get experiment details |
| `/analytics/enterprise/dashboard/experiments` | POST | Create experiment |
| `/analytics/enterprise/dashboard/experiments/{id}/start` | POST | Start experiment |
| `/analytics/enterprise/dashboard/experiments/{id}/stop` | POST | Stop experiment |
| `/analytics/enterprise/dashboard/funnels` | GET | List funnels |
| `/analytics/enterprise/dashboard/funnels` | POST | Create funnel |
| `/analytics/enterprise/dashboard/funnels/{id}/stats` | GET | Get funnel stats |
| `/analytics/enterprise/dashboard/realtime` | GET | Get live stats |

## Database Tables

- `analytics_user_journeys` - User journey records
- `analytics_journey_steps` - Individual journey steps
- `analytics_funnels` - Funnel definitions
- `analytics_funnel_stats` - Daily funnel metrics
- `analytics_performance` - Web Vitals data
- `analytics_errors` - JS error tracking
- `analytics_clicks` - Click heatmap data
- `analytics_scroll_depth` - Scroll tracking
- `analytics_cohorts` - User cohort assignments
- `analytics_retention` - Daily retention records
- `analytics_retention_curves` - Pre-calculated retention
- `analytics_experiments` - A/B test definitions
- `analytics_experiment_assignments` - Variant assignments
- `analytics_experiment_results` - Daily experiment metrics
- `analytics_active_sessions` - Real-time presence

## Dashboard Access

- Basic Analytics: `/admin/analytics`
- Enterprise Analytics: `/admin/analytics/enterprise`

Admin access is restricted to emails in `ADMIN_EMAILS` list.

## Running the Migration

```sql
-- Run migration 036
\i backend/app/database/migrations/036_enterprise_analytics.sql
```

---

# Survival Mode Analytics

Enterprise-grade analytics specifically for the Survival Mode game.

## Features

### 1. Session Analytics
- Session lifecycle tracking (start, end, duration)
- Device and browser context
- Performance grading (A-F based on FPS)
- Session-level bests (distance, score, combo)

### 2. Run Analytics
- Complete run metrics (distance, score, duration)
- Skill metrics (obstacles cleared, near misses, perfect dodges)
- Death analysis (obstacle type, position, context)
- Performance context (FPS, frame drops, input latency)

### 3. Input Analytics (Game Feel Tuning)
- Input breakdown (jumps, slides, lane changes)
- Reaction time analysis
- Advanced input detection (coyote jumps, buffered inputs)
- Spam and double-tap detection

### 4. Combo Analytics
- Combo distribution analysis
- End reason tracking (death, timeout, hit)
- Score contribution analysis

### 5. Difficulty Curve Analysis
- Survival rate by distance bucket
- Speed and difficulty correlation
- Death hotspot identification

### 6. Obstacle Analysis
- Per-obstacle death rates
- Encounter context (distance, speed)
- Pattern vs standalone deaths

### 7. Funnel Analysis
- Page visit → Game load → First run → Milestones
- Conversion rates between steps
- Drop-off identification

## Frontend Integration

```tsx
import { useSurvivalGameWithAnalytics } from '@/survival'

function SurvivalGame() {
  const {
    containerRef,
    gameState,
    start,
    reset,
    analytics,
  } = useSurvivalGameWithAnalytics({
    analyticsEnabled: true,
    onGameOver: (score, distance) => {
      console.log('Game over!', score, distance)
    },
  })

  // Analytics are automatically tracked for:
  // - Session start/end
  // - Run start/end with full metrics
  // - Combo tracking
  // - Distance milestones
  // - FPS monitoring

  // Manual input tracking (optional, for detailed analysis)
  const handleJump = () => {
    analytics.trackJump({ isBuffered: false, isCoyote: false })
  }

  return <div ref={containerRef} />
}
```

### Direct Analytics Hook

```tsx
import { useSurvivalAnalytics } from '@/survival'

function CustomComponent() {
  const analytics = useSurvivalAnalytics({ enabled: true })

  // Track custom funnel events
  analytics.trackFunnelEvent('viewed_leaderboard')

  // Get session stats
  const stats = analytics.getSessionStats()
  console.log('Runs:', stats.runCount, 'Best:', stats.longestDistance)
}
```

## API Endpoints

### Tracking (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analytics/survival/track/session-start` | POST | Track session start |
| `/analytics/survival/track/session-end` | POST | Track session end |
| `/analytics/survival/track/run` | POST | Track completed run |
| `/analytics/survival/track/inputs` | POST | Track input analytics |
| `/analytics/survival/track/combo` | POST | Track significant combo |
| `/analytics/survival/track/funnel` | POST | Track funnel event |

### Dashboard (Admin Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analytics/survival/dashboard/overview` | GET | Daily aggregates |
| `/analytics/survival/dashboard/difficulty-curve` | GET | Survival rate by distance |
| `/analytics/survival/dashboard/obstacle-analysis` | GET | Per-obstacle death rates |
| `/analytics/survival/dashboard/funnel` | GET | Conversion funnel |
| `/analytics/survival/dashboard/input-analysis` | GET | Input pattern analysis |
| `/analytics/survival/dashboard/combo-analysis` | GET | Combo distribution |
| `/analytics/survival/dashboard/refresh` | POST | Refresh materialized views |

## Database Tables

- `survival_analytics_sessions` - Session records
- `survival_analytics_runs` - Run-level metrics
- `survival_analytics_inputs` - Input pattern data
- `survival_analytics_combos` - Combo records
- `survival_analytics_obstacles` - Obstacle death rates
- `survival_analytics_difficulty` - Difficulty curve data
- `survival_analytics_funnels` - Daily funnel counts
- `survival_analytics_daily` - Materialized daily aggregates

## Running the Migration

```sql
-- Run migration 037
\i backend/app/database/migrations/037_survival_analytics.sql
```
