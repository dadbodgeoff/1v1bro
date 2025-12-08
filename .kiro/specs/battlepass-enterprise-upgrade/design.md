# Battle Pass Enterprise Upgrade - Design Document

## Overview

This design document outlines the architecture for transforming the Battle Pass experience into an enterprise-grade system matching the quality established in the Item Shop redesign. The upgrade creates visual and functional parity across the platform's monetization surfaces.

The implementation:
1. Creates new enterprise components in `frontend/src/components/battlepass/enterprise/`
2. Establishes consistent typography hierarchy (H1→H4)
3. Implements configurable RewardDisplayBox with size variants
4. Enhances progress visualization with premium styling
5. Optimizes premium track for conversion
6. Organizes content into clear sections

All changes preserve existing functionality while upgrading visual quality and user experience.

## Current State Analysis

### Files to Modify
| File | Current State | Changes Needed |
|------|---------------|----------------|
| `frontend/src/pages/BattlePass.tsx` | Basic page layout | Integrate enterprise components, add sections |
| `frontend/src/components/battlepass/BattlePassTrack.tsx` | Basic horizontal track | Use enterprise TierCard, improve styling |
| `frontend/src/components/battlepass/SeasonHeader.tsx` | Basic header | Upgrade to enterprise BattlePassHeader |
| `frontend/src/components/battlepass/TierCard.tsx` | Basic 80x80 cards | Replace with RewardDisplayBox |
| `frontend/src/components/battlepass/XPProgressBar.tsx` | Basic progress bar | Upgrade to enterprise ProgressSection |
| `frontend/src/components/battlepass/PremiumUpsell.tsx` | Basic upsell | Enhance with enterprise styling |

### New Files to Create
| File | Purpose |
|------|---------|
| `frontend/src/components/battlepass/enterprise/BattlePassHeader.tsx` | Enterprise page header with gradient title, XP display, countdown |
| `frontend/src/components/battlepass/enterprise/RewardDisplayBox.tsx` | Configurable size display with rarity theming |
| `frontend/src/components/battlepass/enterprise/ProgressSection.tsx` | Combined tier badge, XP bar, statistics |
| `frontend/src/components/battlepass/enterprise/TrackSection.tsx` | Section container with title, subtitle, content |
| `frontend/src/components/battlepass/enterprise/TierIndicator.tsx` | Tier number display with state styling |
| `frontend/src/components/battlepass/enterprise/ClaimCTA.tsx` | Conversion-optimized claim buttons |
| `frontend/src/components/battlepass/enterprise/index.ts` | Barrel export file |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BattlePass Page                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         BattlePassHeader                                      │   │
│  │  Season Name (H1) │ Theme │ XP Display │ Countdown Timer                     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         ProgressSection                                       │   │
│  │  Tier Badge │ XP Progress Bar │ Statistics                                   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    TrackSection: "Rewards Track"                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    BattlePassTrack (Horizontal Scroll)               │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │    │   │
│  │  │  │Tier 1│ │Tier 2│ │Tier 3│ │Tier 4│ │Tier 5│ │Tier 6│ ...         │    │   │
│  │  │  │ Free │ │ Free │ │ Free │ │ Free │ │ Free │ │ Free │             │    │   │
│  │  │  │Premiu│ │Premiu│ │Premiu│ │Premiu│ │Premiu│ │Premiu│             │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    TrackSection: "Premium Upgrade" (if not premium)          │   │
│  │  PremiumUpsell with reward previews and upgrade CTA                          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
BattlePass (Page)
├── BattlePassHeader
│   ├── Season Title (H1 gradient)
│   ├── Theme Subtitle
│   ├── XP Quick Display
│   └── Countdown Timer
├── ProgressSection
│   ├── TierBadge
│   ├── XPProgressBar
│   └── Statistics
├── TrackSection
│   ├── Section Header (H2)
│   └── BattlePassTrack
│       └── TierCard[] (using RewardDisplayBox)
│           ├── TierIndicator
│           ├── RewardDisplayBox (Premium)
│           ├── RewardDisplayBox (Free)
│           └── ClaimCTA
└── PremiumUpsell (conditional)
    ├── Headline
    ├── Value Proposition
    ├── Reward Previews
    └── Upgrade CTA
```

## Components and Interfaces

### BattlePassHeader Component

```typescript
/**
 * BattlePassHeader - Enterprise Battle Pass Header Component
 * 
 * Features:
 * - Season name with gradient text (H1 level)
 * - Theme subtitle with uppercase tracking
 * - Integrated XP quick display
 * - Season countdown timer
 * - Gradient accent bar
 */

interface BattlePassHeaderProps {
  seasonName: string;
  seasonTheme?: string;
  seasonThemeColor?: 'default' | 'winter' | 'summer' | 'halloween' | 'neon';
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  seasonEndDate: Date | null;
  bannerUrl?: string;
}

const themeStyles = {
  default: {
    gradient: 'from-[#6366f1] via-[#8b5cf6] to-[#a855f7]',
    accent: '#6366f1',
  },
  winter: {
    gradient: 'from-[#06b6d4] via-[#3b82f6] to-[#6366f1]',
    accent: '#06b6d4',
  },
  summer: {
    gradient: 'from-[#f59e0b] via-[#f97316] to-[#ef4444]',
    accent: '#f59e0b',
  },
  halloween: {
    gradient: 'from-[#f97316] via-[#a855f7] to-[#6366f1]',
    accent: '#f97316',
  },
  neon: {
    gradient: 'from-[#10b981] via-[#06b6d4] to-[#3b82f6]',
    accent: '#10b981',
  },
};
```

### RewardDisplayBox Component

```typescript
/**
 * RewardDisplayBox - Configurable Size Display Component
 * 
 * Enterprise Standard Box Sizes:
 * - XL (Featured): 420px min-height, 240px image, full details
 * - LG (Spotlight): 200px min-height, 160px image, with description
 * - MD (Standard): 280px min-height, 120px image, essential info
 * - SM (Compact): 180px min-height, 80px image, name + type only
 * 
 * Typography Hierarchy per size:
 * - XL: 28px title, 12px type label, 14px description
 * - LG: 22px title, 11px type label, 13px description
 * - MD: 16px title, 10px type label, no description
 * - SM: 14px title, no type label, no description
 */

type DisplaySize = 'xl' | 'lg' | 'md' | 'sm';
type RewardType = 'coins' | 'xp_boost' | 'cosmetic' | 'title';
type ClaimState = 'locked' | 'claimable' | 'claimed';

interface Reward {
  type: RewardType;
  value: string | number;
  preview_url?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cosmetic_name?: string;
}

interface RewardDisplayBoxProps {
  reward: Reward | null;
  size?: DisplaySize;
  isPremium?: boolean;
  claimState: ClaimState;
  onClaim?: () => void;
  className?: string;
}

const sizeConfig = {
  xl: {
    container: 'col-span-2 row-span-2',
    minHeight: 'min-h-[420px]',
    imageSize: 240,
    imageWrapper: 'p-4',
    padding: 'p-6',
    gap: 'gap-4',
    badgeGap: 'mb-4',
    titleSize: 'text-2xl md:text-[28px]',
    titleWeight: 'font-extrabold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-xs',
    descSize: 'text-sm',
    showDescription: true,
    showType: true,
    badgeSize: 'md' as const,
    ctaSize: 'md' as const,
  },
  lg: {
    container: 'col-span-2 row-span-1',
    minHeight: 'min-h-[200px]',
    imageSize: 160,
    imageWrapper: 'p-3',
    padding: 'p-5',
    gap: 'gap-3',
    badgeGap: 'mb-3',
    titleSize: 'text-xl md:text-[22px]',
    titleWeight: 'font-bold',
    titleTracking: 'tracking-tight',
    typeSize: 'text-[11px]',
    descSize: 'text-[13px]',
    showDescription: true,
    showType: true,
    badgeSize: 'md' as const,
    ctaSize: 'md' as const,
  },
  md: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[280px]',
    imageSize: 120,
    imageWrapper: 'p-2',
    padding: 'p-4',
    gap: 'gap-2',
    badgeGap: 'mb-2',
    titleSize: 'text-base',
    titleWeight: 'font-bold',
    titleTracking: '',
    typeSize: 'text-[10px]',
    descSize: '',
    showDescription: false,
    showType: true,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
  sm: {
    container: 'col-span-1 row-span-1',
    minHeight: 'min-h-[180px]',
    imageSize: 80,
    imageWrapper: 'p-1',
    padding: 'p-3',
    gap: 'gap-1.5',
    badgeGap: 'mb-1.5',
    titleSize: 'text-sm',
    titleWeight: 'font-semibold',
    titleTracking: '',
    typeSize: '',
    descSize: '',
    showDescription: false,
    showType: false,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
};

const rarityBorders = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
};

const rarityGlows = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
};
```

### ProgressSection Component

```typescript
/**
 * ProgressSection - Combined Progress Display
 * 
 * Features:
 * - Prominent tier badge with accent styling
 * - Gradient XP progress bar
 * - Statistics with tabular-nums
 * - Animated fill transitions
 */

interface ProgressSectionProps {
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  totalTiers: number;
  className?: string;
}

// XP bar uses --gradient-xp from design tokens
// Progress percentage = (currentXP / xpToNextTier) * 100, clamped to [0, 100]
```

### TrackSection Component

```typescript
/**
 * TrackSection - Enterprise Section Container
 * 
 * Features:
 * - Section header with icon, title, subtitle
 * - Optional badge (hot, new, limited, premium)
 * - Optional countdown timer
 * - Consistent padding and margins
 */

interface TrackSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'hot' | 'new' | 'limited' | 'premium';
  endTime?: Date | null;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles = {
  default: 'bg-[#6366f1] text-white',
  hot: 'bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white shadow-lg shadow-orange-500/20',
  new: 'bg-[#10b981] text-white',
  limited: 'bg-[#f43f5e] text-white animate-pulse',
  premium: 'bg-[#f59e0b] text-black',
};
```

### TierIndicator Component

```typescript
/**
 * TierIndicator - Tier Number Display
 * 
 * States:
 * - Current: Accent bg, white text, scale(1.1), glow
 * - Unlocked: Elevated bg, white text
 * - Locked: Subtle bg, muted text, reduced opacity
 */

interface TierIndicatorProps {
  tier: number;
  currentTier: number;
  size?: 'sm' | 'md' | 'lg';
}

// Current tier: scale-110, shadow-[0_0_20px_rgba(99,102,241,0.5)]
// Unlocked: bg-[var(--color-bg-elevated)], border-[var(--color-border-visible)]
// Locked: bg-[var(--color-bg-card)], border-[var(--color-border-subtle)], opacity-50
```

### ClaimCTA Component

```typescript
/**
 * ClaimCTA - Conversion-Optimized Claim Buttons
 * 
 * Variants:
 * - default: Indigo bg for standard claims
 * - premium: Amber gradient for premium claims
 * - claimed: Emerald bg with checkmark, disabled
 * - locked: Gray bg with lock icon, disabled
 */

interface ClaimCTAProps {
  variant: 'default' | 'premium' | 'claimed' | 'locked';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isLoading?: boolean;
}

const variantStyles = {
  default: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white',
  premium: 'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f97316] text-black',
  claimed: 'bg-[#10b981] text-white cursor-default',
  locked: 'bg-[#374151] text-[#9ca3af] cursor-not-allowed',
};
```

## Data Models

### Battle Pass State

```typescript
interface BattlePassState {
  season: Season | null;
  tiers: BattlePassTier[];
  progress: PlayerBattlePass | null;
  loading: boolean;
  error: string | null;
  claimingTier: number | null;
}

interface Season {
  id: string;
  name: string;
  theme?: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
}

interface BattlePassTier {
  tier_number: number;
  xp_required: number;
  free_reward: Reward | null;
  premium_reward: Reward | null;
}

interface Reward {
  type: 'coins' | 'xp_boost' | 'cosmetic' | 'title';
  value: string | number;
  cosmetic_preview_url?: string;
  cosmetic?: {
    id: string;
    name: string;
    image_url: string;
    rarity: string;
  };
}

interface PlayerBattlePass {
  current_tier: number;
  current_xp: number;
  xp_to_next_tier: number;
  is_premium: boolean;
  claimed_rewards: number[];
}
```

### Display Configuration Types

```typescript
type DisplaySize = 'xl' | 'lg' | 'md' | 'sm';
type ClaimState = 'locked' | 'claimable' | 'claimed';
type BadgeVariant = 'default' | 'hot' | 'new' | 'limited' | 'premium';
type ThemeColor = 'default' | 'winter' | 'summer' | 'halloween' | 'neon';

interface SizeConfig {
  container: string;
  minHeight: string;
  imageSize: number;
  imageWrapper: string;
  padding: string;
  gap: string;
  badgeGap: string;
  titleSize: string;
  titleWeight: string;
  titleTracking: string;
  typeSize: string;
  descSize: string;
  showDescription: boolean;
  showType: boolean;
  badgeSize: 'sm' | 'md';
  ctaSize: 'sm' | 'md';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: XP Progress Percentage Calculation
*For any* XP progress state with currentXP and xpToNextTier values, the progress bar fill percentage SHALL equal (currentXP / xpToNextTier) * 100, clamped to the range [0, 100].
**Validates: Requirements 4.1, 4.2**

### Property 2: Tier Claimable State Determination
*For any* battle pass tier where currentTier >= tier.tier_number AND the reward is not in claimed_rewards array, the tier SHALL be marked as claimable with appropriate visual highlighting.
**Validates: Requirements 7.2**

### Property 3: Premium Lock Display
*For any* premium reward where the user's is_premium is false, the reward SHALL display a lock icon overlay and reduced opacity.
**Validates: Requirements 5.2**

### Property 4: Size Config Typography Consistency
*For any* RewardDisplayBox size variant, the rendered component SHALL apply the exact typography specifications (titleSize, titleWeight, typeSize) defined in the sizeConfig for that size.
**Validates: Requirements 2.3, 3.1**

### Property 5: Rarity Theming Application
*For any* reward with a rarity value, the RewardDisplayBox SHALL apply the correct border color, hover glow, and background gradient as defined in the rarity styling maps.
**Validates: Requirements 3.2**

### Property 6: Countdown Timer Accuracy
*For any* season with an end_date, the countdown timer SHALL display the correct remaining time (days, hours, minutes) that decrements accurately every second.
**Validates: Requirements 4.4**

### Property 7: Claim State Transitions
*For any* tier transitioning from claimable to claimed state, the ClaimCTA SHALL change from the claimable variant to the claimed variant with checkmark icon.
**Validates: Requirements 7.3, 7.4**

### Property 8: Responsive Size Variant Selection
*For any* viewport width, the tier cards SHALL use the appropriate size variant: SM for mobile (<640px), MD for tablet (640-1024px), LG for desktop (>1024px).
**Validates: Requirements 8.1, 8.2, 8.3**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Season load failure | Display error state with retry button, show cached data if available |
| Tiers load failure | Display error state with retry button |
| Progress load failure | Show "Unable to load progress" message with retry |
| Claim reward failure | Show error toast, revert optimistic update, enable retry |
| Image load failure | Show placeholder icon based on reward type |
| Network timeout | Show timeout message with retry option |
| Invalid tier data | Skip rendering invalid tier, log warning |

## Testing Strategy

### Property-Based Testing (fast-check)

The following properties will be tested using the fast-check library with minimum 100 iterations per test:

1. **XP Progress Calculation**: Generate XP values, verify percentage calculation and clamping
2. **Tier Claimable State**: Generate tier/progress combinations, verify claimable determination
3. **Premium Lock Display**: Generate premium status combinations, verify lock overlay
4. **Size Config Typography**: Generate size variants, verify typography class application
5. **Rarity Theming**: Generate rarity values, verify border/glow/gradient classes
6. **Countdown Timer**: Generate end dates, verify countdown calculation
7. **Claim State Transitions**: Generate state transitions, verify CTA variant changes
8. **Responsive Size Selection**: Generate viewport widths, verify size variant selection

### Unit Tests

- Component rendering with various props
- Event handler invocation (claim, scroll)
- State management logic
- Utility function correctness
- Animation trigger conditions

### Integration Tests

- Full claim reward flow
- Premium upgrade flow
- Track scroll and navigation
- Section organization and layout
- Responsive breakpoint behavior

## Animation Specifications

### Micro-interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| ClaimCTA | Click | scale(0.98) → scale(1), 100ms |
| RewardDisplayBox | Hover | translateY(-2px), shadow enhancement, 200ms |
| TierIndicator (current) | Render | scale(1.1), glow pulse, continuous |
| XP Bar Fill | XP Change | width transition, 500ms ease-out |
| Countdown | Second tick | Number fade transition, 200ms |

### Claim Effects

| Event | Effect |
|-------|--------|
| Claim (common) | 20 particles, gray/white colors, 1s duration |
| Claim (uncommon) | 40 particles, green colors, 1.2s duration |
| Claim (rare) | 60 particles, blue colors, 1.5s duration |
| Claim (epic) | 80 particles, purple colors, 1.8s duration |
| Claim (legendary) | 100 particles, gold colors, 2s duration |
| Claim (coins) | Gold coin burst, 40 particles, 1s duration |
| Claim (XP boost) | Purple lightning effect, 1s duration |

### Loading States

| Component | Skeleton |
|-----------|----------|
| BattlePassHeader | Large rectangle for banner, text skeletons for title |
| ProgressSection | Bar skeleton with shimmer, badge skeleton |
| Tier cards | 8-10 card skeletons with shimmer |
| Premium upsell | Card skeleton with button skeleton |

## Migration Notes

### Component Migration

1. **SeasonHeader.tsx** → Integrate into BattlePassHeader or deprecate
2. **TierCard.tsx** → Replace internals with RewardDisplayBox
3. **XPProgressBar.tsx** → Integrate into ProgressSection or upgrade in place
4. **PremiumUpsell.tsx** → Upgrade styling to match enterprise patterns

### Styling Updates

- Replace hardcoded colors with design token variables
- Update typography to match hierarchy specifications
- Add rarity theming to reward displays
- Implement size variants for responsive behavior

### Import Updates

```typescript
// Before
import { TierCard } from '@/components/battlepass/TierCard'
import { SeasonHeader } from '@/components/battlepass/SeasonHeader'

// After
import {
  BattlePassHeader,
  RewardDisplayBox,
  ProgressSection,
  TrackSection,
  TierIndicator,
  ClaimCTA,
} from '@/components/battlepass/enterprise'
```

