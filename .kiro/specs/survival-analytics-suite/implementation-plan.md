# Survival Analytics Suite - Implementation Plan

## Phase 1: Backend Schema & API Extensions

### 1.1 New Database Tables

```sql
-- Migration: 039_extended_analytics.sql

-- ============================================
-- Trivia Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS survival_analytics_trivia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    run_id TEXT,
    
    -- Question data
    question_id TEXT,
    category TEXT NOT NULL,
    difficulty TEXT,
    
    -- Answer data
    answer_given TEXT,
    correct BOOLEAN NOT NULL,
    time_to_answer_ms INTEGER,
    timed_out BOOLEAN DEFAULT FALSE,
    
    -- Context
    distance_at_question FLOAT,
    speed_at_question FLOAT,
    streak_before INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trivia_session ON survival_analytics_trivia(session_id);
CREATE INDEX idx_trivia_user ON survival_analytics_trivia(user_id);
CREATE INDEX idx_trivia_category ON survival_analytics_trivia(category);
CREATE INDEX idx_trivia_created ON survival_analytics_trivia(created_at);

-- ============================================
-- Auth Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    
    event_type TEXT NOT NULL, -- login_success, login_failure, logout, signup_complete, etc.
    method TEXT, -- email, google, discord, etc.
    error_type TEXT,
    
    -- Context
    device_type TEXT,
    browser TEXT,
    ip_country TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_events_user ON analytics_auth_events(user_id);
CREATE INDEX idx_auth_events_type ON analytics_auth_events(event_type);
CREATE INDEX idx_auth_events_created ON analytics_auth_events(created_at);

-- ============================================
-- Milestone Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS survival_analytics_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    run_id TEXT,
    
    milestone_type TEXT NOT NULL, -- distance, personal_best, rank_change, achievement
    milestone_value FLOAT,
    previous_value FLOAT,
    
    -- For rank changes
    old_rank INTEGER,
    new_rank INTEGER,
    
    -- For achievements
    achievement_id TEXT,
    achievement_name TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_user ON survival_analytics_milestones(user_id);
CREATE INDEX idx_milestones_type ON survival_analytics_milestones(milestone_type);

-- ============================================
-- Shop Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_shop_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    
    event_type TEXT NOT NULL, -- view, item_view, preview, purchase_start, purchase_complete, purchase_failed
    
    -- Item data
    item_id TEXT,
    item_type TEXT,
    item_rarity TEXT,
    price INTEGER,
    currency TEXT, -- coins, premium
    
    -- For failures
    error_type TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_user ON analytics_shop_events(user_id);
CREATE INDEX idx_shop_type ON analytics_shop_events(event_type);
CREATE INDEX idx_shop_item ON analytics_shop_events(item_id);

-- ============================================
-- Leaderboard Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_leaderboard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    
    event_type TEXT NOT NULL, -- view, scroll, player_click, filter_change, refresh
    
    user_rank INTEGER,
    max_rank_viewed INTEGER,
    target_user_id UUID,
    filter_type TEXT,
    filter_value TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lb_events_user ON analytics_leaderboard_events(user_id);
CREATE INDEX idx_lb_events_type ON analytics_leaderboard_events(event_type);

-- ============================================
-- Battle Pass Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_battlepass_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    event_type TEXT NOT NULL, -- view, level_up, reward_claim, purchase, tier_skip
    
    current_level INTEGER,
    new_level INTEGER,
    xp_earned INTEGER,
    reward_type TEXT,
    reward_id TEXT,
    tiers_skipped INTEGER,
    cost INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bp_events_user ON analytics_battlepass_events(user_id);
CREATE INDEX idx_bp_events_type ON analytics_battlepass_events(event_type);

-- ============================================
-- Extended Run Analytics (add columns)
-- ============================================
ALTER TABLE survival_analytics_runs 
ADD COLUMN IF NOT EXISTS trivia_questions_shown INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_wrong INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_timeouts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_best_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS death_after_trivia_ms INTEGER,
ADD COLUMN IF NOT EXISTS ghost_loaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghost_beaten BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghost_margin FLOAT,
ADD COLUMN IF NOT EXISTS cosmetic_runner_id TEXT,
ADD COLUMN IF NOT EXISTS quick_restart_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pause_duration_ms INTEGER DEFAULT 0;
```

### 1.2 New API Endpoints

Add to `backend/app/api/v1/survival_analytics.py`:

```python
# New tracking models
class TriviaAnalyticsData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    run_id: Optional[str] = None
    question_id: Optional[str] = None
    category: str
    difficulty: Optional[str] = None
    answer_given: Optional[str] = None
    correct: bool
    time_to_answer_ms: Optional[int] = None
    timed_out: bool = False
    distance_at_question: Optional[float] = None
    speed_at_question: Optional[float] = None
    streak_before: int = 0

class MilestoneData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    run_id: Optional[str] = None
    milestone_type: str  # distance, personal_best, rank_change, achievement
    milestone_value: Optional[float] = None
    previous_value: Optional[float] = None
    old_rank: Optional[int] = None
    new_rank: Optional[int] = None
    achievement_id: Optional[str] = None
    achievement_name: Optional[str] = None
    metadata: Optional[dict] = None

class ShopEventData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    event_type: str  # view, item_view, preview, purchase_start, purchase_complete, purchase_failed
    item_id: Optional[str] = None
    item_type: Optional[str] = None
    item_rarity: Optional[str] = None
    price: Optional[int] = None
    currency: Optional[str] = None
    error_type: Optional[str] = None
    metadata: Optional[dict] = None

class LeaderboardEventData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    event_type: str  # view, scroll, player_click, filter_change, refresh
    user_rank: Optional[int] = None
    max_rank_viewed: Optional[int] = None
    target_user_id: Optional[str] = None
    filter_type: Optional[str] = None
    filter_value: Optional[str] = None

class BattlePassEventData(BaseModel):
    session_id: str
    event_type: str  # view, level_up, reward_claim, purchase, tier_skip
    current_level: Optional[int] = None
    new_level: Optional[int] = None
    xp_earned: Optional[int] = None
    reward_type: Optional[str] = None
    reward_id: Optional[str] = None
    tiers_skipped: Optional[int] = None
    cost: Optional[int] = None

# New endpoints
@router.post("/track/trivia")
async def track_trivia(data: TriviaAnalyticsData, user: Optional[CurrentUser] = None):
    """Track trivia question interaction."""
    # Implementation...

@router.post("/track/milestone")
async def track_milestone(data: MilestoneData, user: Optional[CurrentUser] = None):
    """Track milestone events (PB, rank change, achievement)."""
    # Implementation...

@router.post("/track/shop")
async def track_shop_event(data: ShopEventData, user: Optional[CurrentUser] = None):
    """Track shop interactions."""
    # Implementation...

@router.post("/track/leaderboard")
async def track_leaderboard_event(data: LeaderboardEventData, user: Optional[CurrentUser] = None):
    """Track leaderboard interactions."""
    # Implementation...

@router.post("/track/battlepass")
async def track_battlepass_event(data: BattlePassEventData, user: Optional[CurrentUser] = None):
    """Track battle pass events."""
    # Implementation...
```

Add to `backend/app/api/v1/analytics.py`:

```python
class AuthEventData(BaseModel):
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    event_type: str  # login_success, login_failure, logout, signup_complete, password_reset, etc.
    method: Optional[str] = None  # email, google, discord
    error_type: Optional[str] = None
    metadata: Optional[dict] = None

@router.post("/auth-event")
async def track_auth_event(data: AuthEventData, user: Optional[CurrentUser] = None):
    """Track authentication events."""
    # Implementation...
```

---

## Phase 2: Frontend Analytics Extensions

### 2.1 Extend useSurvivalAnalytics Hook

Add to `frontend/src/survival/hooks/useSurvivalAnalytics.ts`:

```typescript
// New types
export interface TriviaAnalytics {
  questionId?: string
  category: string
  difficulty?: string
  answerGiven?: string
  correct: boolean
  timeToAnswerMs?: number
  timedOut?: boolean
  distanceAtQuestion?: number
  speedAtQuestion?: number
  streakBefore?: number
}

export interface MilestoneAnalytics {
  milestoneType: 'distance' | 'personal_best' | 'rank_change' | 'achievement'
  milestoneValue?: number
  previousValue?: number
  oldRank?: number
  newRank?: number
  achievementId?: string
  achievementName?: string
}

// Add to hook return
const trackTrivia = useCallback((analytics: TriviaAnalytics) => {
  if (!isEnabled) return
  trackAsync('/track/trivia', {
    session_id: sessionId.current,
    visitor_id: visitorId.current,
    run_id: currentRunId.current,
    ...analytics,
  })
}, [isEnabled])

const trackMilestone = useCallback((analytics: MilestoneAnalytics) => {
  if (!isEnabled) return
  trackAsync('/track/milestone', {
    session_id: sessionId.current,
    visitor_id: visitorId.current,
    run_id: currentRunId.current,
    ...analytics,
  })
}, [isEnabled])

const trackPersonalBest = useCallback((distance: number, previousBest: number) => {
  trackMilestone({
    milestoneType: 'personal_best',
    milestoneValue: distance,
    previousValue: previousBest,
  })
}, [trackMilestone])

const trackRankChange = useCallback((oldRank: number, newRank: number) => {
  trackMilestone({
    milestoneType: 'rank_change',
    oldRank,
    newRank,
  })
}, [trackMilestone])

const trackAchievement = useCallback((achievementId: string, achievementName: string) => {
  trackMilestone({
    milestoneType: 'achievement',
    achievementId,
    achievementName,
  })
}, [trackMilestone])
```

### 2.2 Create New Analytics Hooks

Create `frontend/src/hooks/useShopAnalytics.ts`:

```typescript
import { useCallback } from 'react'
import { analytics } from '@/services/analytics'

export function useShopAnalytics() {
  const trackShopView = useCallback(() => {
    analytics.trackEvent('shop_view')
  }, [])

  const trackItemView = useCallback((itemId: string, itemType: string, price: number) => {
    analytics.trackEvent('shop_item_view', { item_id: itemId, item_type: itemType, price })
  }, [])

  const trackItemPreview = useCallback((itemId: string) => {
    analytics.trackEvent('shop_item_preview', { item_id: itemId })
  }, [])

  const trackPurchaseStart = useCallback((itemId: string, price: number, currency: string) => {
    analytics.trackEvent('shop_purchase_start', { item_id: itemId, price, currency })
  }, [])

  const trackPurchaseComplete = useCallback((itemId: string, price: number, currency: string) => {
    analytics.trackEvent('shop_purchase_complete', { item_id: itemId, price, currency })
  }, [])

  const trackPurchaseFailed = useCallback((itemId: string, errorType: string) => {
    analytics.trackEvent('shop_purchase_failed', { item_id: itemId, error_type: errorType })
  }, [])

  return {
    trackShopView,
    trackItemView,
    trackItemPreview,
    trackPurchaseStart,
    trackPurchaseComplete,
    trackPurchaseFailed,
  }
}
```

Create `frontend/src/hooks/useLeaderboardAnalytics.ts`:

```typescript
import { useCallback } from 'react'
import { analytics } from '@/services/analytics'

export function useLeaderboardAnalytics() {
  const trackLeaderboardView = useCallback((userRank?: number) => {
    analytics.trackEvent('leaderboard_view', { user_rank: userRank })
  }, [])

  const trackLeaderboardScroll = useCallback((maxRankViewed: number) => {
    analytics.trackEvent('leaderboard_scroll', { max_rank_viewed: maxRankViewed })
  }, [])

  const trackPlayerClick = useCallback((targetRank: number, targetUserId: string) => {
    analytics.trackEvent('leaderboard_player_click', { target_rank: targetRank, target_user_id: targetUserId })
  }, [])

  return {
    trackLeaderboardView,
    trackLeaderboardScroll,
    trackPlayerClick,
  }
}
```

Create `frontend/src/hooks/useAuthAnalytics.ts`:

```typescript
import { useCallback } from 'react'
import { analytics } from '@/services/analytics'

export function useAuthAnalytics() {
  const trackLoginSuccess = useCallback((method: string) => {
    analytics.trackEvent('login_success', { method })
  }, [])

  const trackLoginFailure = useCallback((errorType: string) => {
    analytics.trackEvent('login_failure', { error_type: errorType })
  }, [])

  const trackLogout = useCallback((sessionDurationMs: number) => {
    analytics.trackEvent('logout', { session_duration_ms: sessionDurationMs })
  }, [])

  const trackSignupComplete = useCallback((method: string) => {
    analytics.trackEvent('signup_complete', { method })
    analytics.markConversion(method)
  }, [])

  return {
    trackLoginSuccess,
    trackLoginFailure,
    trackLogout,
    trackSignupComplete,
  }
}
```

### 2.3 Integration Points

#### SurvivalGame.tsx - Add tracking calls:

```typescript
// In handleGameOver callback
const handleGameOver = useCallback(async (score: number, distance: number) => {
  // Track personal best
  if (playerRank && distance > playerRank.bestDistance) {
    analytics.trackPersonalBest(distance, playerRank.bestDistance)
  }
  
  // Track rank change after refresh
  const oldRank = playerRank?.rank
  await refreshRank()
  const newRank = leaderboard?.playerEntry?.rank
  if (oldRank && newRank && oldRank !== newRank) {
    analytics.trackRankChange(oldRank, newRank)
  }
  // ... rest of handler
}, [playerRank, refreshRank])

// Track achievements
useEffect(() => {
  if (currentAchievement) {
    analytics.trackAchievement(currentAchievement.id, currentAchievement.name)
  }
}, [currentAchievement])

// Track ghost beaten
useEffect(() => {
  if (gameState?.phase === 'gameover' && isGhostActive) {
    const ghostDistance = /* get from ghost data */
    if (gameState.distance > ghostDistance) {
      analytics.trackEvent('survival_ghost_beaten', { 
        margin_distance: gameState.distance - ghostDistance 
      })
    }
  }
}, [gameState?.phase, isGhostActive])
```

#### useTriviaBillboards.ts - Add tracking:

```typescript
// In onCorrectAnswer
onCorrectAnswer: (points) => {
  analytics.trackTrivia({
    category: selectedCategory,
    correct: true,
    timeToAnswerMs: /* calculate */,
    streakBefore: currentStreak,
  })
  // ... existing code
}

// In onWrongAnswer
onWrongAnswer: () => {
  analytics.trackTrivia({
    category: selectedCategory,
    correct: false,
    streakBefore: currentStreak,
  })
  // ... existing code
}

// In onTimeout
onTimeout: () => {
  analytics.trackTrivia({
    category: selectedCategory,
    correct: false,
    timedOut: true,
    streakBefore: currentStreak,
  })
  // ... existing code
}
```

#### Shop.tsx - Add tracking:

```typescript
import { useShopAnalytics } from '@/hooks/useShopAnalytics'

function Shop() {
  const shopAnalytics = useShopAnalytics()
  
  // Track page view on mount
  useEffect(() => {
    shopAnalytics.trackShopView()
  }, [])
  
  // Track item clicks
  const handleItemClick = (item) => {
    shopAnalytics.trackItemView(item.id, item.type, item.price)
  }
  
  // Track preview opens
  const handlePreviewOpen = (item) => {
    shopAnalytics.trackItemPreview(item.id)
  }
  
  // Track purchases
  const handlePurchase = async (item) => {
    shopAnalytics.trackPurchaseStart(item.id, item.price, 'coins')
    try {
      await purchaseItem(item)
      shopAnalytics.trackPurchaseComplete(item.id, item.price, 'coins')
    } catch (error) {
      shopAnalytics.trackPurchaseFailed(item.id, error.message)
    }
  }
}
```

---

## Phase 3: Dashboard Extensions

### 3.1 New Dashboard Endpoints

Add to `backend/app/api/v1/survival_analytics.py`:

```python
@router.get("/dashboard/trivia-analysis")
async def get_trivia_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get trivia performance analysis for game balance."""
    # Returns:
    # - Correct rate by category
    # - Correct rate by difficulty
    # - Average time to answer
    # - Timeout rate
    # - Impact on deaths (deaths within 2s of trivia)

@router.get("/dashboard/milestone-analysis")
async def get_milestone_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get milestone achievement analysis."""
    # Returns:
    # - PB frequency
    # - Rank change distribution
    # - Achievement unlock rates

@router.get("/dashboard/shop-funnel")
async def get_shop_funnel(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get shop conversion funnel."""
    # Returns:
    # - View -> Item View -> Preview -> Purchase conversion rates
    # - Popular items
    # - Revenue by item type

@router.get("/dashboard/auth-analysis")
async def get_auth_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get authentication analytics."""
    # Returns:
    # - Login success/failure rates
    # - Auth method distribution
    # - Session duration distribution
```

---

## Phase 4: Implementation Checklist

### Backend Tasks
- [ ] Create migration 039_extended_analytics.sql
- [ ] Add TriviaAnalyticsData model and endpoint
- [ ] Add MilestoneData model and endpoint
- [ ] Add ShopEventData model and endpoint
- [ ] Add LeaderboardEventData model and endpoint
- [ ] Add BattlePassEventData model and endpoint
- [ ] Add AuthEventData model and endpoint
- [ ] Add dashboard analysis endpoints
- [ ] Update survival_analytics_runs table with new columns

### Frontend Tasks
- [ ] Extend useSurvivalAnalytics with trivia tracking
- [ ] Extend useSurvivalAnalytics with milestone tracking
- [ ] Create useShopAnalytics hook
- [ ] Create useLeaderboardAnalytics hook
- [ ] Create useAuthAnalytics hook
- [ ] Integrate tracking in SurvivalGame.tsx
- [ ] Integrate tracking in SurvivalInstantPlay.tsx
- [ ] Integrate tracking in useTriviaBillboards.ts
- [ ] Integrate tracking in Shop.tsx
- [ ] Integrate tracking in Leaderboard page
- [ ] Integrate tracking in auth flows (Login, Register)
- [ ] Integrate tracking in BattlePass page

### Testing Tasks
- [ ] Verify all events fire correctly in dev
- [ ] Verify data appears in database
- [ ] Test dashboard endpoints return correct data
- [ ] Load test analytics endpoints
- [ ] Verify no analytics errors break game flow
