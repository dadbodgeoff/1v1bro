# Analytics System Audit

## Executive Summary

Your analytics system is comprehensive but fragmented across multiple systems. This audit maps everything being tracked, displayed, and identifies gaps and improvements.

---

## 1. DATA COLLECTION LAYER

### 1.1 Website Analytics (General)
**Source:** `useSectionViewTracking`, `useAnalytics` hooks
**Storage:** `analytics_sessions`, `analytics_page_views`, `analytics_events`

| What's Tracked | Where Stored | Displayed In |
|----------------|--------------|--------------|
| Session ID | analytics_sessions | Sessions Panel |
| Visitor ID (persistent) | analytics_sessions | Sessions Panel |
| Device type/browser/OS | analytics_sessions | Tech Panel, Sessions |
| Screen size | analytics_sessions | Tech Panel |
| Locale/timezone | analytics_sessions | Geography Panel |
| UTM params | analytics_sessions | UTM Panel |
| First referrer | analytics_sessions | UTM Panel |
| Page views | analytics_page_views | Pages Panel, Overview |
| Time on page | analytics_page_views | Sessions, Journeys |
| Scroll depth | analytics_page_views | Heatmap Panel |
| Custom events | analytics_events | Events Panel |
| Conversion status | analytics_sessions | Overview, Journeys |

### 1.2 Survival Game Analytics
**Source:** `useSurvivalAnalytics` hook
**Storage:** `survival_analytics_*` tables

| What's Tracked | Where Stored | Displayed In |
|----------------|--------------|--------------|
| Session start/end | survival_analytics_sessions | Sessions Panel |
| Run metrics (distance, score, duration) | survival_analytics_runs | Survival Panel, Sessions |
| Death cause/position/lane | survival_analytics_runs | Survival Panel, Sessions |
| Max combo/speed | survival_analytics_runs | Survival Panel |
| Obstacles cleared | survival_analytics_runs | Survival Panel |
| Near misses | survival_analytics_runs | Survival Panel |
| Input patterns (jumps, slides, lanes) | survival_analytics_inputs | NOT DISPLAYED ❌ |
| Combo analytics | survival_analytics_combos | NOT DISPLAYED ❌ |
| Trivia answers | survival_analytics_trivia | Sessions Explorer |
| FPS/performance | survival_analytics_runs | NOT DISPLAYED ❌ |
| Funnel events | survival_analytics_funnels | Survival Panel |

### 1.3 Enterprise Analytics
**Source:** Various tracking endpoints
**Storage:** `analytics_*` enterprise tables

| What's Tracked | Where Stored | Displayed In |
|----------------|--------------|--------------|
| User journeys | analytics_user_journeys | Journeys Panel |
| Journey steps | analytics_journey_steps | Journeys Panel |
| Core Web Vitals | analytics_performance | Performance Panel |
| JS errors | analytics_errors | Errors Panel |
| Click heatmaps | analytics_clicks | Heatmap Panel |
| Scroll depth | analytics_scroll_depth | Heatmap Panel |
| Cohort assignments | analytics_cohorts | Cohorts Panel |
| Retention data | analytics_retention | Cohorts Panel |
| A/B experiments | analytics_experiments | Experiments Panel |
| Shop events | analytics_shop_events | NOT DISPLAYED ❌ |
| Leaderboard events | analytics_leaderboard_events | NOT DISPLAYED ❌ |
| Battle pass events | analytics_battlepass_events | NOT DISPLAYED ❌ |
| Auth events | analytics_auth_events | Survival Panel (auth-analysis) |
| Milestones | survival_analytics_milestones | NOT DISPLAYED ❌ |

---

## 2. DASHBOARD PANELS AUDIT

### 2.1 Summary Panel (AdvertiserSummaryPanel)
**Purpose:** High-level KPIs for advertisers/stakeholders
**Data Sources:** Multiple endpoints
**Status:** ✅ Good

### 2.2 Overview Panel
**Purpose:** Traffic overview, daily trends
**Data Sources:** `/analytics/dashboard/overview`, `/analytics/dashboard/daily`
**Status:** ✅ Good

### 2.3 Engagement Panel
**Purpose:** DAU/MAU, stickiness, session frequency
**Data Sources:** `/analytics/dashboard/engagement`
**Status:** ✅ Good

### 2.4 Revenue Panel
**Purpose:** Revenue tracking
**Data Sources:** `/analytics/dashboard/revenue`
**Status:** ⚠️ May need shop event integration

### 2.5 Geography Panel
**Purpose:** Country/region breakdown
**Data Sources:** `/analytics/dashboard/geo`, `/analytics/dashboard/countries`
**Status:** ✅ Good

### 2.6 Pages Panel
**Purpose:** Page performance
**Data Sources:** `/analytics/dashboard/pages`
**Status:** ✅ Good

### 2.7 Tech Panel
**Purpose:** Device/browser breakdown
**Data Sources:** `/analytics/dashboard/tech`
**Status:** ✅ Good

### 2.8 UTM Panel
**Purpose:** Campaign attribution
**Data Sources:** `/analytics/dashboard/utm`
**Status:** ✅ Good

### 2.9 Journeys Panel
**Purpose:** User journey visualization
**Data Sources:** `/analytics/enterprise/dashboard/journeys`
**Status:** ✅ Good

### 2.10 Sessions Panel
**Purpose:** Individual session exploration
**Data Sources:** `/analytics/dashboard/sessions`, `/analytics/dashboard/session/{id}/events`, `/analytics/dashboard/session/{id}/survival`
**Status:** ✅ Recently enhanced with survival data

### 2.11 Heatmap Panel
**Purpose:** Click/scroll visualization
**Data Sources:** `/analytics/enterprise/dashboard/heatmap`
**Status:** ✅ Good

### 2.12 Events Panel
**Purpose:** Custom event tracking
**Data Sources:** `/analytics/dashboard/events`
**Status:** ✅ Good

### 2.13 Funnels Panel
**Purpose:** Conversion funnel analysis
**Data Sources:** `/analytics/enterprise/dashboard/funnels`
**Status:** ✅ Good

### 2.14 Performance Panel
**Purpose:** Core Web Vitals
**Data Sources:** `/analytics/enterprise/dashboard/performance`
**Status:** ✅ Good

### 2.15 Realtime Panel
**Purpose:** Live visitor tracking
**Data Sources:** `/analytics/enterprise/dashboard/realtime`
**Status:** ✅ Good

### 2.16 Errors Panel
**Purpose:** JS error tracking
**Data Sources:** `/analytics/enterprise/dashboard/errors`
**Status:** ✅ Good

### 2.17 Experiments Panel
**Purpose:** A/B test management
**Data Sources:** `/analytics/enterprise/dashboard/experiments`
**Status:** ✅ Good

### 2.18 Cohorts Panel
**Purpose:** Retention analysis
**Data Sources:** `/analytics/enterprise/dashboard/cohorts`
**Status:** ✅ Good

### 2.19 Survival Panel
**Purpose:** Game-specific analytics
**Data Sources:** Multiple survival endpoints
**Status:** ⚠️ Missing some tracked data (see below)

---

## 3. GAPS IDENTIFIED

### 3.1 Data Being Tracked But NOT Displayed

| Data | Table | Recommendation |
|------|-------|----------------|
| Input patterns (jumps, slides, reaction times) | survival_analytics_inputs | Add to Survival Panel - valuable for game feel tuning |
| Combo analytics (duration, end reasons) | survival_analytics_combos | Add to Survival Panel - scoring balance |
| FPS/frame drops | survival_analytics_runs | Add to Performance Panel or Survival Panel |
| Shop funnel events | analytics_shop_events | Create Shop Analytics section |
| Leaderboard engagement | analytics_leaderboard_events | Add to Engagement or Survival Panel |
| Battle pass progression | analytics_battlepass_events | Create Battle Pass Analytics section |
| Milestones (PBs, achievements) | survival_analytics_milestones | Add to Survival Panel |
| Trivia by category/difficulty | survival_analytics_trivia | Add detailed trivia breakdown to Survival Panel |

### 3.2 Missing Cross-Panel Connections

| Gap | Impact | Solution |
|-----|--------|----------|
| Sessions → Survival not bidirectional | Can't see which survival runs belong to which session from Survival Panel | Add session links in Survival Panel |
| No unified player view | Can't see full player journey across website + game | Create Player Profile panel |
| Funnel panels disconnected | Website funnel vs Survival funnel are separate | Create unified funnel view |
| No correlation analysis | Can't see how trivia performance affects retention | Add correlation metrics |

### 3.3 Missing Metrics

| Metric | Value | Where to Add |
|--------|-------|--------------|
| D1/D7/D30 retention for survival players | Critical for game health | Survival Panel or Cohorts |
| Average session value (time × engagement) | Advertiser metric | Summary Panel |
| Trivia accuracy by distance | Game balance | Survival Panel |
| Death heatmap by position | Level design | Survival Panel |
| Input latency distribution | Performance | Performance Panel |
| Ghost race completion rate | Feature usage | Survival Panel |

---

## 4. RECOMMENDATIONS

### 4.1 HIGH PRIORITY - Add Missing Displays

**A. Enhance Survival Panel with:**
```
- Input Analysis section (from survival_analytics_inputs)
  - Inputs per second distribution
  - Jump/slide/lane change ratios
  - Reaction time percentiles
  - Coyote time usage rate
  
- Combo Analysis section (from survival_analytics_combos)
  - Combo distribution chart
  - Average combo duration
  - End reasons breakdown (death/timeout/hit)
  
- Trivia Deep Dive (from survival_analytics_trivia)
  - Accuracy by category
  - Accuracy by difficulty
  - Timeout rate trends
  - Average answer time
  
- Milestone Tracking (from survival_analytics_milestones)
  - Personal bests per day
  - Rank changes
  - Achievement unlocks
```

**B. Create Shop Analytics Panel:**
```
- Shop funnel visualization
- Popular items
- Purchase conversion rate
- Failed purchase analysis
- Revenue by item type
```

**C. Create Battle Pass Panel:**
```
- Level distribution
- XP earning rate
- Reward claim rate
- Premium conversion
```

### 4.2 MEDIUM PRIORITY - Better Integration

**A. Unified Player View:**
- Create a "Player Lookup" feature
- Show: website sessions + survival runs + purchases + achievements
- Link from any session/run to full player profile

**B. Cross-Panel Navigation:**
- Click session ID in Survival Panel → Opens Sessions Explorer
- Click player in Sessions → Shows all their survival runs
- Click trivia category → Shows questions in that category

**C. Correlation Dashboard:**
- Trivia accuracy vs retention
- FPS vs play again rate
- Death cause vs quit rate
- Session duration vs conversion

### 4.3 LOW PRIORITY - Nice to Have

**A. Real-time Survival Dashboard:**
- Live runs in progress
- Current player count
- Live leaderboard changes

**B. Automated Insights:**
- "Players who answer 3+ trivia correctly have 40% higher retention"
- "Spike obstacles have highest death rate at 200-300m"
- "Mobile players have 20% lower avg distance"

**C. Export Enhancements:**
- Include survival data in session exports
- Add trivia export
- Add run-level export

---

## 5. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA COLLECTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Website                    Survival Game                       │
│  ────────                   ─────────────                       │
│  useAnalytics()             useSurvivalAnalytics()              │
│  useSectionViewTracking()   useSurvivalGameWithAnalytics()      │
│       │                            │                            │
│       ▼                            ▼                            │
│  /analytics/track/*         /analytics/survival/track/*         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WEBSITE TABLES              SURVIVAL TABLES                    │
│  ──────────────              ───────────────                    │
│  analytics_sessions          survival_analytics_sessions        │
│  analytics_page_views        survival_analytics_runs            │
│  analytics_events            survival_analytics_inputs          │
│  analytics_daily_stats       survival_analytics_combos          │
│                              survival_analytics_trivia          │
│  ENTERPRISE TABLES           survival_analytics_funnels         │
│  ────────────────            survival_analytics_milestones      │
│  analytics_user_journeys                                        │
│  analytics_performance       MONETIZATION TABLES                │
│  analytics_errors            ───────────────────                │
│  analytics_clicks            analytics_shop_events              │
│  analytics_cohorts           analytics_battlepass_events        │
│  analytics_experiments       analytics_leaderboard_events       │
│                              analytics_auth_events              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD DISPLAY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DISPLAYED ✅                NOT DISPLAYED ❌                   │
│  ───────────                 ────────────────                   │
│  Summary Panel               Input patterns                     │
│  Overview Panel              Combo analytics                    │
│  Engagement Panel            FPS/performance                    │
│  Revenue Panel               Shop events                        │
│  Geography Panel             Leaderboard events                 │
│  Pages Panel                 Battle pass events                 │
│  Tech Panel                  Milestones                         │
│  UTM Panel                   Detailed trivia breakdown          │
│  Journeys Panel                                                 │
│  Sessions Panel (enhanced)                                      │
│  Heatmap Panel                                                  │
│  Events Panel                                                   │
│  Funnels Panel                                                  │
│  Performance Panel                                              │
│  Realtime Panel                                                 │
│  Errors Panel                                                   │
│  Experiments Panel                                              │
│  Cohorts Panel                                                  │
│  Survival Panel (partial)                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. IMPLEMENTATION PRIORITY

### Phase 1: Display Missing Data (1-2 days)
1. Add Input Analysis to Survival Panel
2. Add Combo Analysis to Survival Panel  
3. Add Trivia Deep Dive to Survival Panel
4. Add Milestones to Survival Panel

### Phase 2: New Panels (2-3 days)
1. Create Shop Analytics Panel
2. Create Battle Pass Panel
3. Add FPS metrics to Performance Panel

### Phase 3: Integration (2-3 days)
1. Cross-panel navigation
2. Unified player lookup
3. Enhanced exports with survival data

### Phase 4: Advanced (1 week)
1. Correlation dashboard
2. Automated insights
3. Real-time survival dashboard

---

## 7. QUICK WINS

These can be done immediately with minimal effort:

1. **Add API calls that already exist but aren't used:**
   - `getInputAnalysis()` - already in useAnalyticsAPI
   - `getComboAnalysis()` - already in useAnalyticsAPI
   - `getTriviaAnalysis()` - already in useAnalyticsAPI
   - `getShopFunnel()` - already in useAnalyticsAPI

2. **The backend endpoints exist, just need frontend display**

3. **Sessions Panel already has survival data - just needs more columns**

---

## 8. CHANGES IMPLEMENTED

### Session 1 (Current)

**SessionsPanel Enhancements:**
- ✅ Added survival run tracking per session (runs, distance, best distance, score, combo)
- ✅ Added trivia tracking per session (answered, correct)
- ✅ Added death cause tracking per session
- ✅ Added filtering by survival activity (all/with runs/multi-run/no runs)
- ✅ Added survival summary stats row (sessions with runs, total distance, play again rate, trivia stats, top death cause)
- ✅ Added additional metrics row (avg runs/session, avg distance/run, best single run, avg survival duration)

**SessionExplorer Enhancements:**
- ✅ Added Survival Gameplay section with run history
- ✅ Added expandable run details (combo, obstacles, jumps, slides, lane changes)
- ✅ Added trivia answers table with category, result, time, distance
- ✅ Added death causes breakdown

**SurvivalPanel Enhancements:**
- ✅ Added Input Analysis tab (inputs/sec, reaction times, input breakdown, advanced patterns)
- ✅ Added Combo Analysis tab (distribution, end reasons, top combos)
- ✅ Added Trivia Analysis tab (by category, by difficulty, answer times)

**Backend Enhancements:**
- ✅ New endpoint: `/analytics/dashboard/session/{id}/survival`
- ✅ Enhanced `/analytics/dashboard/sessions` with survival data
- ✅ Added best_distance, best_score, best_combo per session

---

*Audit completed: December 2024*
*Last updated: December 2024*
