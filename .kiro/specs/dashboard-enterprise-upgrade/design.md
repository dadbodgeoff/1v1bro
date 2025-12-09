# Design Document: Dashboard Enterprise Upgrade

## Overview

This design document outlines the enterprise-grade upgrade for the Dashboard (Home) page. The redesign transforms the current basic dashboard into a comprehensive hub that showcases all platform features with quick access to key functionality.

The implementation follows the established enterprise component patterns from Shop, Battle Pass, Inventory, and Profile modules, ensuring visual and functional consistency across the platform.

## Architecture

### Component Hierarchy

```
Home.tsx (Page)
├── DashboardLayout (existing)
│   ├── Sidebar (existing)
│   └── DashboardHeader (existing)
└── Dashboard Content
    ├── HeroPlaySection (enterprise)
    │   ├── CategorySelector (existing)
    │   ├── MapSelector (existing)
    │   ├── QueueStatus (existing)
    │   └── MatchFoundModal (existing)
    ├── BattlePassWidget (enterprise - enhanced)
    ├── ShopPreviewWidget (enterprise - new)
    ├── LoadoutPreviewWidget (enterprise - new)
    ├── StatsSummaryWidget (enterprise - new)
    ├── MatchHistoryWidget (enterprise - enhanced)
    └── FriendsWidget (enterprise - enhanced)

Friends.tsx (New Page)
├── DashboardLayout
└── FriendsPageContent
    ├── FriendsList (existing)
    ├── FriendRequests (existing)
    └── UserSearch (existing)
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐
│   useDashboard  │────▶│  Dashboard Page  │
│   (hook)        │     │                  │
└─────────────────┘     └──────────────────┘
        │
        ├── useProfile() ──────▶ StatsSummaryWidget
        ├── useBattlePass() ───▶ BattlePassWidget
        ├── useCosmetics() ────▶ ShopPreviewWidget, LoadoutPreviewWidget
        ├── useMatchHistory() ─▶ MatchHistoryWidget
        ├── useFriends() ──────▶ FriendsWidget
        └── useMatchmaking() ──▶ HeroPlaySection
```

## Components and Interfaces

### HeroPlaySection

Primary play action component with Find Match CTA and secondary actions.

```typescript
interface HeroPlaySectionProps {
  className?: string
}

// Internal state managed via useMatchmaking hook
// - isInQueue: boolean
// - queueTime: number
// - cooldownSeconds: number | null
// - selectedCategory: string
// - selectedMap: string
```

### BattlePassWidget (Enhanced)

Compact Battle Pass progress display.

```typescript
interface BattlePassWidgetProps {
  className?: string
}

// Data from useBattlePass hook
interface BattlePassDisplayData {
  seasonName: string
  currentTier: number
  maxTier: number
  currentXp: number
  xpToNextTier: number
  claimableCount: number
  daysRemaining: number | null
  isPremium: boolean
}
```

### ShopPreviewWidget

Featured shop items carousel.

```typescript
interface ShopPreviewWidgetProps {
  maxItems?: number // default: 4
  className?: string
}

interface ShopPreviewItem {
  id: string
  name: string
  previewUrl: string
  rarity: Rarity
  price: number
  type: CosmeticType
}
```

### LoadoutPreviewWidget

Current equipped cosmetics display.

```typescript
interface LoadoutPreviewWidgetProps {
  className?: string
}

interface LoadoutSlot {
  type: 'skin' | 'banner' | 'playercard'
  item: {
    id: string
    name: string
    previewUrl: string
    rarity: Rarity
  } | null
}
```

### StatsSummaryWidget

Key performance metrics display.

```typescript
interface StatsSummaryWidgetProps {
  className?: string
}

interface StatsSummaryData {
  totalWins: number
  winRate: number // 0-100
  rankTier: RankTier
  eloRating: number | null
}
```

### MatchHistoryWidget (Enhanced)

Recent matches list with enhanced styling.

```typescript
interface MatchHistoryWidgetProps {
  maxItems?: number // default: 5
  className?: string
}

// Uses existing RecentMatch type from types/matchHistory.ts
```

### FriendsWidget (Enhanced)

Online friends list with proper navigation.

```typescript
interface FriendsWidgetProps {
  maxItems?: number // default: 5
  className?: string
}

// Uses existing Friend type from types/friend.ts
```

### DashboardSection

Consistent section container for widgets.

```typescript
interface DashboardSectionProps {
  title?: string
  badge?: string | number
  badgeVariant?: 'default' | 'count' | 'new' | 'hot'
  actionLabel?: string
  onAction?: () => void
  children: ReactNode
  className?: string
}
```

### Friends Page

New dedicated page for /friends route.

```typescript
// frontend/src/pages/Friends.tsx
interface FriendsPageProps {}

// Uses existing components:
// - FriendsList
// - FriendRequests
// - UserSearch
// - DashboardLayout
```

## Data Models

### Dashboard State

```typescript
interface DashboardState {
  // From existing hooks
  profile: Profile | null
  battlePassProgress: PlayerBattlePass | null
  season: Season | null
  recentMatches: RecentMatch[]
  onlineFriends: Friend[]
  shopItems: Cosmetic[]
  loadout: Loadout | null
  inventory: InventoryItem[]
  
  // Loading states
  loading: {
    profile: boolean
    battlePass: boolean
    matches: boolean
    friends: boolean
    shop: boolean
    loadout: boolean
  }
  
  // Error states
  errors: {
    profile: string | null
    battlePass: string | null
    matches: string | null
    friends: string | null
    shop: string | null
    loadout: string | null
  }
}
```

### Rank Tier Mapping

```typescript
// From existing types/leaderboard.ts
type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

const RANK_TIERS: Record<RankTier, { min: number; max: number; icon: string; color: string }> = {
  bronze: { min: 0, max: 1199, icon: '🥉', color: '#cd7f32' },
  silver: { min: 1200, max: 1399, icon: '🥈', color: '#c0c0c0' },
  gold: { min: 1400, max: 1599, icon: '🥇', color: '#ffd700' },
  platinum: { min: 1600, max: 1799, icon: '💎', color: '#e5e4e2' },
  diamond: { min: 1800, max: Infinity, icon: '💠', color: '#b9f2ff' },
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Battle Pass Widget Display Consistency

*For any* Battle Pass progress data with valid tier (1-100) and XP values (0 to xpToNextTier), the widget SHALL display:
- Current tier as the primary value
- XP progress percentage calculated as (currentXp / xpToNextTier) * 100
- Claimable rewards badge only when claimableCount > 0

**Validates: Requirements 3.1, 3.2**

### Property 2: Shop Item Display Completeness

*For any* shop item with valid data, the rendered preview SHALL contain:
- Item preview image (or placeholder if missing)
- Item name (truncated if exceeds max length)
- Rarity indicator with correct color mapping
- Price with coin icon

**Validates: Requirements 4.2**

### Property 3: Loadout Slot Display State

*For any* loadout configuration, each slot SHALL display:
- Item preview and name when item is equipped (item !== null)
- Placeholder icon and "Empty" label when slot is empty (item === null)
- Correct rarity border color when item is equipped

**Validates: Requirements 5.2, 5.3**

### Property 4: Stats Value Formatting

*For any* stats data, the widget SHALL display:
- Win rate as percentage with correct calculation (wins / gamesPlayed * 100)
- Rank tier determined by ELO rating using RANK_TIERS mapping
- ELO rating as numeric value with optional change indicator
- "0" or "Unranked" for missing/null values

**Validates: Requirements 6.2, 6.3, 6.4, 6.6**

### Property 5: Match History Item Display

*For any* match data, the rendered item SHALL contain:
- Opponent avatar and display name
- Win/Loss indicator with correct color (green for win, red for loss)
- ELO change with sign (+/-) and color
- Relative timestamp in human-readable format

**Validates: Requirements 7.2**

### Property 6: Friends Display Filtering

*For any* friends list, the widget SHALL display only friends where:
- is_online === true
- show_online_status !== false
- Limited to maxItems count

**Validates: Requirements 8.1, 8.2**

### Property 7: Cooldown Timer Format

*For any* cooldown value in seconds, the display SHALL show:
- Format "M:SS" (e.g., "2:30" for 150 seconds)
- "0:00" when cooldown reaches zero
- Button disabled state when cooldown > 0

**Validates: Requirements 2.4**

## Error Handling

### Network Errors

- All widgets handle fetch failures gracefully
- Display error state with retry option
- Maintain layout stability during errors
- Log errors for debugging

### Empty States

- Each widget has dedicated empty state UI
- Empty states include helpful CTA (e.g., "Play a Match", "Add Friends")
- Empty states use consistent styling with muted icons

### Loading States

- Skeleton placeholders maintain layout during load
- Loading states use shimmer animation
- Prevent layout shift on data arrival

## Testing Strategy

### Dual Testing Approach

The implementation uses both unit tests and property-based tests:

**Unit Tests:**
- Component rendering with various props
- User interaction flows (clicks, navigation)
- Edge cases (empty data, loading states, errors)
- Integration with existing hooks

**Property-Based Tests:**
- Use `fast-check` library for TypeScript
- Minimum 100 iterations per property
- Test data transformations and display logic
- Verify invariants across random inputs

### Property Test Implementation

Each correctness property will be implemented as a property-based test:

```typescript
// Example: Property 1 - Battle Pass Widget Display
import fc from 'fast-check'

describe('BattlePassWidget', () => {
  it('Property 1: displays correct XP progress percentage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // currentTier
        fc.integer({ min: 0, max: 10000 }), // currentXp
        fc.integer({ min: 1, max: 10000 }), // xpToNextTier
        (tier, xp, xpToNext) => {
          const progress = calculateXpProgress(xp, xpToNext)
          expect(progress).toBeGreaterThanOrEqual(0)
          expect(progress).toBeLessThanOrEqual(100)
          expect(progress).toBe(Math.min(100, Math.round((xp / xpToNext) * 100)))
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test File Structure

```
frontend/src/components/dashboard/enterprise/__tests__/
├── HeroPlaySection.test.tsx
├── BattlePassWidget.test.tsx
├── ShopPreviewWidget.test.tsx
├── LoadoutPreviewWidget.test.tsx
├── StatsSummaryWidget.test.tsx
├── MatchHistoryWidget.test.tsx
├── FriendsWidget.test.tsx
└── dashboard-properties.test.ts  // Property-based tests
```

### Test Tags

Each property-based test will be tagged with:
```typescript
/**
 * **Feature: dashboard-enterprise-upgrade, Property 1: Battle Pass Widget Display Consistency**
 * **Validates: Requirements 3.1, 3.2**
 */
```
