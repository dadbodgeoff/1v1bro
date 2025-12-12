# Design Document: Achievement System

## Overview

This design document outlines the technical architecture for a comprehensive achievement system that tracks player milestones, awards 3 coins per unlock, and provides real-time notifications. The system integrates with existing infrastructure including the notification service, coin balance system, and enterprise frontend patterns.

The implementation builds upon:
- Existing `achievements` and `user_achievements` tables (migration 013)
- `NotificationService` for real-time WebSocket notifications
- `BalanceService` for coin rewards
- Enterprise UI patterns from dashboard, profile, and mobile optimization specs

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  AchievementPanel  │  AchievementToast  │  ProfileAchievements          │
│  (full page view)  │  (in-game popup)   │  (profile section)            │
├─────────────────────────────────────────────────────────────────────────┤
│                    useAchievements Hook                                  │
│         (data fetching, caching, real-time updates)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Layer                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  GET /achievements      │  GET /achievements/me  │  GET /achievements/progress │
│  POST /achievements/check                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Service Layer                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                      AchievementService                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ check_and_award │  │ get_progress    │  │ get_user_       │         │
│  │ _achievements() │  │ ()              │  │ achievements()  │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│           │                                                              │
│           ├──────────────────┬──────────────────┐                       │
│           ▼                  ▼                  ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ BalanceService  │  │ Notification    │  │ Achievement     │         │
│  │ (coin rewards)  │  │ Service         │  │ Repository      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```


### Achievement Check Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Match Ends  │────▶│ ProgressionSvc  │────▶│ AchievementSvc  │
└─────────────┘     │ award_match_xp()│     │ check_and_award │
                    └─────────────────┘     └─────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
                    ▼                               ▼                               ▼
           ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
           │ Get User Stats  │            │ Get All Active  │            │ Get User's      │
           │ from user_      │            │ Achievements    │            │ Earned          │
           │ profiles        │            │                 │            │ Achievements    │
           └─────────────────┘            └─────────────────┘            └─────────────────┘
                    │                               │                               │
                    └───────────────────────────────┼───────────────────────────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │ Filter: stats   │
                                           │ >= criteria AND │
                                           │ NOT earned      │
                                           └─────────────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │ For each new    │
                                           │ achievement:    │
                                           │ 1. Insert user_ │
                                           │    achievement  │
                                           │ 2. Credit 3     │
                                           │    coins        │
                                           │ 3. Send notif   │
                                           └─────────────────┘
```

## Components and Interfaces

### Backend Components

#### AchievementService

```python
class AchievementService(BaseService):
    """Service for achievement operations."""
    
    async def check_and_award_achievements(
        self, 
        user_id: str
    ) -> list[AchievementUnlock]:
        """
        Check all achievements against user stats and award any newly qualified.
        Returns list of newly unlocked achievements.
        """
        
    async def get_all_achievements(
        self,
        category: Optional[str] = None,
        include_inactive: bool = False
    ) -> list[Achievement]:
        """Get all achievement definitions, optionally filtered by category."""
        
    async def get_user_achievements(
        self, 
        user_id: str
    ) -> list[UserAchievement]:
        """Get all achievements earned by a user."""
        
    async def get_achievement_progress(
        self, 
        user_id: str
    ) -> list[AchievementProgress]:
        """Get progress toward all locked achievements."""
        
    async def get_achievement_stats(
        self, 
        user_id: str
    ) -> AchievementStats:
        """Get achievement statistics for profile display."""
```

#### AchievementRepository

```python
class AchievementRepository(BaseRepository):
    """Repository for achievement database operations."""
    
    async def get_active_achievements(self) -> list[dict]:
        """Get all active achievement definitions."""
        
    async def get_user_earned_achievement_ids(
        self, 
        user_id: str
    ) -> set[str]:
        """Get set of achievement IDs already earned by user."""
        
    async def award_achievement(
        self, 
        user_id: str, 
        achievement_id: str
    ) -> dict:
        """Create user_achievement record. Returns the created record."""
        
    async def get_user_achievements_with_details(
        self, 
        user_id: str
    ) -> list[dict]:
        """Get user achievements joined with achievement definitions."""
```


### Frontend Components

#### AchievementPanel (Page Component)

```typescript
interface AchievementPanelProps {
  initialCategory?: AchievementCategory
}

// Features:
// - Category tabs (horizontally scrollable on mobile)
// - Achievement grid (responsive: 1 col mobile, 2 tablet, 3+ desktop)
// - Filter controls (all/locked/unlocked)
// - Progress indicators per category
```

#### AchievementCard

```typescript
interface AchievementCardProps {
  achievement: Achievement
  isUnlocked: boolean
  earnedAt?: string
  progress?: AchievementProgress
  onClick: () => void
}

// Features:
// - Rarity-colored border/glow
// - Lock overlay for locked achievements
// - Progress bar for locked achievements
// - Earned timestamp for unlocked
// - Touch-optimized (min 44x44px)
```

#### AchievementToast

```typescript
interface AchievementToastProps {
  achievement: Achievement
  onDismiss: () => void
  onClick: () => void
}

// Features:
// - Rarity-appropriate animation (common: subtle, legendary: dramatic)
// - Icon, name, "+3 coins" indicator
// - Auto-dismiss after 5 seconds
// - Click to navigate to achievements page
```

#### AchievementDetailModal

```typescript
interface AchievementDetailModalProps {
  achievement: Achievement
  isUnlocked: boolean
  earnedAt?: string
  progress?: AchievementProgress
  isOpen: boolean
  onClose: () => void
}

// Features:
// - Bottom sheet on mobile, centered modal on desktop
// - Full achievement details
// - Progress visualization
// - Share button (future)
```

### Hooks

#### useAchievements

```typescript
interface UseAchievementsReturn {
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  progress: AchievementProgress[]
  stats: AchievementStats
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  checkAchievements: () => Promise<AchievementUnlock[]>
}

function useAchievements(): UseAchievementsReturn
```

#### useAchievementToasts

```typescript
interface UseAchievementToastsReturn {
  toasts: AchievementToast[]
  addToast: (achievement: Achievement) => void
  dismissToast: (id: string) => void
}

function useAchievementToasts(): UseAchievementToastsReturn
```

## Data Models

### Achievement Definition

```typescript
interface Achievement {
  id: string
  name: string
  description: string
  icon_url: string
  rarity: AchievementRarity
  category: AchievementCategory
  criteria_type: CriteriaType
  criteria_value: number
  is_active: boolean
  sort_order: number
  coin_reward: 3  // Always 3 coins
}

type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
type AchievementCategory = 'games' | 'wins' | 'streaks' | 'combat' | 'accuracy' | 'social'
type CriteriaType = 'games_played' | 'games_won' | 'win_streak' | 'total_kills' | 'accuracy' | 'friends_count'
```

### User Achievement

```typescript
interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement: Achievement  // Joined data
}
```

### Achievement Progress

```typescript
interface AchievementProgress {
  achievement_id: string
  achievement: Achievement
  current_value: number
  target_value: number
  percentage: number  // 0-100
  is_unlocked: boolean
}
```

### Achievement Stats (for Profile)

```typescript
interface AchievementStats {
  total_earned: number
  total_possible: number
  completion_percentage: number
  by_rarity: {
    common: number
    uncommon: number
    rare: number
    epic: number
    legendary: number
  }
  recent_achievements: UserAchievement[]  // Last 3
  total_coins_earned: number  // total_earned * 3
}
```

### Achievement Unlock Event

```typescript
interface AchievementUnlock {
  achievement: Achievement
  earned_at: string
  coins_awarded: 3
  notification_id: string
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Achievement Unlock Threshold

*For any* user statistics and achievement definition, if the user's statistic value for the criteria_type is greater than or equal to the achievement's criteria_value, and the user has not already earned the achievement, then the achievement SHALL be unlocked.

**Validates: Requirements 1.2, 1.4**

### Property 2: Achievement Unlock Idempotency

*For any* achievement and user, attempting to unlock the same achievement multiple times SHALL result in exactly one user_achievement record, regardless of how many times the unlock is triggered.

**Validates: Requirements 1.3**

### Property 3: Coin Reward Transaction Completeness

*For any* achievement unlock, the system SHALL credit exactly 3 coins to the user's balance AND create a coin transaction record with source="achievement" AND include the achievement_id in the transaction metadata.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Multi-Achievement Coin Calculation

*For any* set of N achievements unlocking simultaneously, the total coins credited SHALL equal exactly 3 × N.

**Validates: Requirements 2.4**

### Property 5: Notification Content Completeness

*For any* achievement unlock notification (WebSocket or persistent), the notification payload SHALL include the achievement name, description, rarity, icon_url, and coin_reward (3).

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Rarity Animation Mapping

*For any* achievement toast displayed, the animation intensity SHALL correspond to the achievement rarity: common (subtle fade), uncommon (gentle pulse), rare (glow effect), epic (particle burst), legendary (dramatic celebration).

**Validates: Requirements 3.4**

### Property 7: Achievement Grouping by Category

*For any* list of achievements displayed in the Achievement_Panel, the achievements SHALL be grouped by category, and each category group SHALL contain only achievements of that category.

**Validates: Requirements 4.1, 4.4**

### Property 8: Achievement Display Completeness

*For any* achievement rendered in the UI, the display SHALL include the name, description, icon, rarity badge, and "3 coins" reward indicator. Locked achievements SHALL additionally show a progress bar, and unlocked achievements SHALL show the earned_at timestamp.

**Validates: Requirements 4.2, 4.3**

### Property 9: Progress Calculation Accuracy

*For any* achievement progress calculation, the percentage SHALL equal floor(current_value / target_value × 100), capped at 100 for unlocked achievements.

**Validates: Requirements 4.5, 8.2**

### Property 10: Progressive Tier Ordering

*For any* achievement category, the achievements within that category SHALL be ordered by criteria_value ascending, forming a progressive tier structure.

**Validates: Requirements 5.3**

### Property 11: Mobile Touch Target Compliance

*For any* interactive element in the Achievement_Panel rendered at viewport width below 640px, the computed dimensions SHALL be at least 44×44 pixels.

**Validates: Requirements 6.2**

### Property 12: Mobile Layout Responsiveness

*For any* Achievement_Panel rendered at viewport width below 640px, the achievement grid SHALL use a single-column layout, and category tabs SHALL be horizontally scrollable.

**Validates: Requirements 6.1**

### Property 13: Reduced Motion Compliance

*For any* animation in the Achievement_Panel, when prefers-reduced-motion is enabled, the animation duration SHALL be 0ms or the animation SHALL be skipped entirely.

**Validates: Requirements 6.5**

### Property 14: Pagination Correctness

*For any* paginated achievement API request with limit L and offset O, the response SHALL contain at most L items starting from position O in the full result set.

**Validates: Requirements 7.5**

### Property 15: Progress Derivation from Stats

*For any* achievement progress query, the current_value SHALL be derived from the user_profiles table statistics, not from a separate progress counter.

**Validates: Requirements 8.1, 8.4**

### Property 16: Achievement Permanence

*For any* earned achievement, if the user's statistics subsequently decrease below the criteria_value, the achievement SHALL remain earned and SHALL NOT be revoked.

**Validates: Requirements 8.5**

### Property 17: Toast Queue Timing

*For any* sequence of N achievement toasts, the toasts SHALL appear with 1-second delays between each, and each toast SHALL auto-dismiss after 5 seconds.

**Validates: Requirements 9.3, 9.4**

### Property 18: Profile Stats Calculation

*For any* user's achievement statistics, total_earned SHALL equal the count of user_achievements, completion_percentage SHALL equal floor(total_earned / total_possible × 100), and by_rarity counts SHALL sum to total_earned.

**Validates: Requirements 10.1, 10.2, 10.4**

### Property 19: Serialization Round-Trip

*For any* Achievement object, serializing to JSON and deserializing back SHALL produce an equivalent object with all fields preserved.

**Validates: Requirements 11.1, 11.2, 11.3**


## Error Handling

### Achievement Check Failures

```python
# Error handling flow for achievement checks
try:
    # 1. Get user stats
    stats = await stats_repo.get_user_stats(user_id)
    
    # 2. Get achievements and check eligibility
    new_achievements = await self._check_eligibility(user_id, stats)
    
    # 3. Award each achievement
    for achievement in new_achievements:
        try:
            # Award achievement (always succeeds or raises)
            await self._award_achievement(user_id, achievement)
            
            # Credit coins (may fail independently)
            try:
                await balance_service.credit_coins(
                    user_id=user_id,
                    amount=3,
                    source="achievement",
                    metadata={"achievement_id": achievement.id}
                )
            except Exception as coin_error:
                # Log but don't fail - achievement is still awarded
                logger.error(f"Coin credit failed for achievement {achievement.id}: {coin_error}")
                
            # Send notification (may fail independently)
            try:
                await notification_service.notify_achievement(user_id, achievement)
            except Exception as notif_error:
                logger.error(f"Notification failed for achievement {achievement.id}: {notif_error}")
                
        except DuplicateAchievementError:
            # Already earned - skip silently (idempotent)
            continue
            
except Exception as e:
    logger.error(f"Achievement check failed for user {user_id}: {e}")
    raise
```

### Frontend Error States

```typescript
// Achievement panel error handling
const { achievements, error, isLoading, refetch } = useAchievements()

if (error) {
  return (
    <WidgetErrorBoundary
      widgetName="achievements"
      onRetry={refetch}
      fallback={<AchievementErrorState message={error} />}
    />
  )
}
```

### Toast Queue Error Handling

```typescript
// Toast queue with error recovery
const addToast = (achievement: Achievement) => {
  try {
    const toast = createToast(achievement)
    setToasts(prev => [...prev, toast])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(toast.id)
    }, 5000)
  } catch (error) {
    console.error('Failed to create achievement toast:', error)
    // Fail silently - achievement is still awarded
  }
}
```

## Testing Strategy

### Dual Testing Approach

The implementation uses both unit tests and property-based tests:

**Unit Tests:**
- Achievement service methods
- Repository operations
- API endpoint responses
- React component rendering
- Hook behavior

**Property-Based Tests:**
- Use `hypothesis` for Python backend
- Use `fast-check` for TypeScript frontend
- Minimum 100 iterations per property

### Property-Based Testing Framework

**Backend:** `hypothesis` (Python)
**Frontend:** `fast-check` (TypeScript)

### Test Categories

#### Backend Property Tests

```python
# Example: Property 1 - Achievement Unlock Threshold
from hypothesis import given, strategies as st

@given(
    games_played=st.integers(min_value=0, max_value=10000),
    criteria_value=st.integers(min_value=1, max_value=1000)
)
def test_achievement_unlock_threshold(games_played: int, criteria_value: int):
    """
    **Feature: achievement-system, Property 1: Achievement Unlock Threshold**
    **Validates: Requirements 1.2, 1.4**
    """
    achievement = create_achievement(criteria_type="games_played", criteria_value=criteria_value)
    user_stats = {"games_played": games_played}
    
    should_unlock = games_played >= criteria_value
    result = check_achievement_eligibility(achievement, user_stats)
    
    assert result == should_unlock
```

#### Frontend Property Tests

```typescript
// Example: Property 9 - Progress Calculation Accuracy
import fc from 'fast-check'

describe('Achievement Progress', () => {
  /**
   * **Feature: achievement-system, Property 9: Progress Calculation Accuracy**
   * **Validates: Requirements 4.5, 8.2**
   */
  it('calculates progress percentage correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),  // current_value
        fc.integer({ min: 1, max: 1000 }),   // target_value
        (currentValue, targetValue) => {
          const progress = calculateProgress(currentValue, targetValue)
          const expected = Math.min(100, Math.floor((currentValue / targetValue) * 100))
          
          return progress.percentage === expected
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test File Structure

```
backend/tests/
├── unit/
│   └── services/
│       └── test_achievement_service.py
├── property/
│   └── test_achievement_properties.py
└── integration/
    └── test_achievement_api.py

frontend/src/
├── components/achievements/__tests__/
│   ├── AchievementPanel.test.tsx
│   ├── AchievementCard.test.tsx
│   └── AchievementToast.test.tsx
├── hooks/__tests__/
│   └── useAchievements.test.ts
└── __tests__/
    └── achievement-properties.test.ts
```

### Test Annotation Format

Each property-based test must include:
```
**Feature: achievement-system, Property {number}: {property_text}**
**Validates: Requirements X.Y**
```

## Achievement Definitions

### Games Category

| Name | Description | Criteria | Rarity |
|------|-------------|----------|--------|
| First Steps | Play your first game | games_played >= 1 | Common |
| Getting Started | Play 10 games | games_played >= 10 | Common |
| Regular Player | Play 50 games | games_played >= 50 | Uncommon |
| Dedicated | Play 100 games | games_played >= 100 | Rare |
| Veteran | Play 500 games | games_played >= 500 | Epic |
| Legend | Play 1000 games | games_played >= 1000 | Legendary |

### Wins Category

| Name | Description | Criteria | Rarity |
|------|-------------|----------|--------|
| First Victory | Win your first game | games_won >= 1 | Common |
| Winner | Win 10 games | games_won >= 10 | Uncommon |
| Champion | Win 50 games | games_won >= 50 | Rare |
| Master | Win 100 games | games_won >= 100 | Epic |
| Unstoppable | Win 500 games | games_won >= 500 | Legendary |

### Streaks Category

| Name | Description | Criteria | Rarity |
|------|-------------|----------|--------|
| Hot Streak | Win 3 games in a row | win_streak >= 3 | Uncommon |
| On Fire | Win 5 games in a row | win_streak >= 5 | Rare |
| Dominator | Win 10 games in a row | win_streak >= 10 | Epic |
| Invincible | Win 20 games in a row | win_streak >= 20 | Legendary |

### Combat Category

| Name | Description | Criteria | Rarity |
|------|-------------|----------|--------|
| First Blood | Get your first kill | total_kills >= 1 | Common |
| Warrior | Get 50 kills | total_kills >= 50 | Uncommon |
| Slayer | Get 200 kills | total_kills >= 200 | Rare |
| Destroyer | Get 500 kills | total_kills >= 500 | Epic |
| Annihilator | Get 1000 kills | total_kills >= 1000 | Legendary |

### Accuracy Category

| Name | Description | Criteria | Rarity |
|------|-------------|----------|--------|
| Sharpshooter | Achieve 60% accuracy | accuracy >= 60 | Uncommon |
| Marksman | Achieve 70% accuracy | accuracy >= 70 | Rare |
| Sniper | Achieve 80% accuracy | accuracy >= 80 | Epic |
| Perfect Aim | Achieve 90% accuracy | accuracy >= 90 | Legendary |

### Social Category

| Name | Description | Criteria | Rarity |
|------|-------------|----------|--------|
| Friendly | Add your first friend | friends_count >= 1 | Common |
| Social | Have 5 friends | friends_count >= 5 | Uncommon |
| Popular | Have 10 friends | friends_count >= 10 | Rare |
| Celebrity | Have 25 friends | friends_count >= 25 | Epic |
| Influencer | Have 50 friends | friends_count >= 50 | Legendary |

**Total: 30 achievements across 6 categories**
