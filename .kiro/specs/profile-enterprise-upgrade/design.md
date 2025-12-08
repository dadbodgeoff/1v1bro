# Profile Enterprise Upgrade - Design Document

## Overview

This design document outlines the architecture for transforming the Profile experience into an enterprise-grade system matching the quality established in the Item Shop, Battle Pass, and Inventory redesigns. The upgrade creates visual and functional parity across the platform's player identity surfaces.

The implementation:
1. Creates new enterprise components in `frontend/src/components/profile/enterprise/`
2. Establishes consistent typography hierarchy (H1→H4)
3. Implements enhanced ProfileHeader with banner, avatar, and level ring
4. Creates StatsDashboard with configurable StatsCards
5. Adds MatchHistorySection with styled match items
6. Implements LoadoutPreview showing equipped cosmetics
7. Enhances SocialLinkButtons with platform theming
8. Upgrades ProfileEditor with real-time preview
9. Adds AchievementBadge showcase with rarity styling

All changes preserve existing functionality while upgrading visual quality and user experience.

## Current State Analysis

### Files to Modify
| File | Current State | Changes Needed |
|------|---------------|----------------|
| `frontend/src/pages/Profile.tsx` | Basic page with view/edit tabs | Integrate enterprise components, add sections |
| `frontend/src/components/profile/ProfileCard.tsx` | Basic card with banner and stats | Replace with enterprise ProfileHeader and sections |
| `frontend/src/components/profile/ProfileEditor.tsx` | Basic form with inputs | Upgrade to enterprise styling with live preview |

### New Files to Create
| File | Purpose |
|------|---------|
| `frontend/src/components/profile/enterprise/ProfileHeader.tsx` | Enhanced header with banner, avatar, level ring |
| `frontend/src/components/profile/enterprise/StatsCard.tsx` | Individual statistic display |
| `frontend/src/components/profile/enterprise/StatsDashboard.tsx` | Grid of stats cards |
| `frontend/src/components/profile/enterprise/MatchHistoryItem.tsx` | Single match result row |
| `frontend/src/components/profile/enterprise/MatchHistorySection.tsx` | Section container for match history |
| `frontend/src/components/profile/enterprise/LoadoutPreview.tsx` | Equipped cosmetics display |
| `frontend/src/components/profile/enterprise/SocialLinkButton.tsx` | Styled social media link |
| `frontend/src/components/profile/enterprise/AchievementBadge.tsx` | Achievement display with rarity |
| `frontend/src/components/profile/enterprise/ProfileSection.tsx` | Section container component |
| `frontend/src/components/profile/enterprise/ProfileEditorForm.tsx` | Enhanced editor with preview |
| `frontend/src/components/profile/enterprise/index.ts` | Barrel export file |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Profile Page                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         ProfileHeader                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    Banner (256px)                                     │    │   │
│  │  │  ┌──────────┐                                          [Edit]        │    │   │
│  │  │  │  Avatar  │  Display Name (H1)                                     │    │   │
│  │  │  │  + Ring  │  Title • Level Badge • 🇺🇸                             │    │   │
│  │  │  └──────────┘                                                         │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    ProfileSection: "Statistics"                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      StatsDashboard                                   │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │    │   │
│  │  │  │Games │ │ Wins │ │Win % │ │Level │ │ XP   │ │Streak│             │    │   │
│  │  │  │ 150  │ │  89  │ │ 59%  │ │  12  │ │12.5k │ │  7   │             │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    ProfileSection: "Current Loadout"                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      LoadoutPreview                                   │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │    │   │
│  │  │  │ Skin │ │Emote │ │Banner│ │ Name │ │Effect│ │Trail │             │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    ProfileSection: "Recent Matches"                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    MatchHistorySection                                │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │ 👤 Opponent1  │ WIN  │ +150 XP │ 2 hours ago              │    │    │   │
│  │  │  ├─────────────────────────────────────────────────────────────┤    │    │   │
│  │  │  │ 👤 Opponent2  │ LOSS │ +75 XP  │ Yesterday                 │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    ProfileSection: "Connect"                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  [Twitter] [Twitch] [YouTube] [Discord]                              │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Profile (Page)
├── ProfileHeader
│   ├── Banner (image or solid color)
│   ├── Gradient Overlay
│   ├── Avatar with Level Ring
│   ├── Player Identity (name, title, level, country)
│   └── Edit Button (own profile only)
├── ProfileSection: "Statistics"
│   └── StatsDashboard
│       └── StatsCard[] (6 cards)
│           ├── Value
│           ├── Label
│           └── Trend (optional)
├── ProfileSection: "Current Loadout"
│   └── LoadoutPreview
│       └── LoadoutSlot[] (6 slots)
│           ├── Item Preview (if equipped)
│           └── Empty Placeholder
├── ProfileSection: "Recent Matches"
│   └── MatchHistorySection
│       └── MatchHistoryItem[]
│           ├── Opponent Avatar & Name
│           ├── Outcome Badge
│           ├── XP Earned
│           └── Timestamp
├── ProfileSection: "Achievements" (optional)
│   └── AchievementBadge[]
├── ProfileSection: "Connect"
│   └── SocialLinkButton[]
└── ProfileEditorForm (edit mode)
    ├── Form Fields
    └── Live Preview
```

## Components and Interfaces

### ProfileHeader Component

```typescript
/**
 * ProfileHeader - Enterprise Profile Header Component
 * 
 * Features:
 * - Full-width banner with gradient overlay
 * - Avatar with circular tier progress ring (unified with Battle Pass)
 * - Player identity section (name, title, tier, country)
 * - Edit button for own profile
 * - Responsive sizing (256px desktop, 160px mobile)
 * 
 * UNIFIED PROGRESSION: Uses Battle Pass tier as player level
 */

interface ProfileHeaderProps {
  profile: Profile;
  battlePassProgress?: PlayerBattlePass | null;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

// Tier ring configuration (unified with Battle Pass)
const TIER_RING_CONFIG = {
  size: 120,
  strokeWidth: 4,
  progressColor: '#6366f1', // indigo-500
  trackColor: '#374151',    // gray-700
};
```

### StatsCard Component

```typescript
/**
 * StatsCard - Individual Statistic Display
 * 
 * Features:
 * - Prominent value display with tabular-nums
 * - Muted uppercase label
 * - Optional trend indicator (↑/↓)
 * - Hover lift effect
 * - Color coding for specific stats (win rate)
 */

interface StatsCardProps {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  colorCode?: 'default' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  className?: string;
}

const colorCodeStyles = {
  default: 'text-white',
  success: 'text-[#10b981]',  // green
  warning: 'text-[#f59e0b]',  // amber
  danger: 'text-[#ef4444]',   // red
};
```

### StatsDashboard Component

```typescript
/**
 * StatsDashboard - Grid of Stats Cards
 * 
 * Features:
 * - Responsive grid (2 cols mobile, 3-4 cols desktop)
 * - Pre-configured stats from profile and Battle Pass data
 * - Win rate calculation with color coding
 * - Tier progress display (unified with Battle Pass)
 * 
 * UNIFIED PROGRESSION: Uses Battle Pass tier/XP as player level/XP
 */

interface StatsDashboardProps {
  profile: Profile;
  battlePassProgress?: PlayerBattlePass | null;
  className?: string;
}

// Stats configuration (unified with Battle Pass)
const STATS_CONFIG = [
  { key: 'games_played', label: 'Games Played', icon: '🎮', source: 'profile' },
  { key: 'games_won', label: 'Wins', icon: '🏆', source: 'profile' },
  { key: 'win_rate', label: 'Win Rate', icon: '📊', calculated: true },
  { key: 'current_tier', label: 'Tier', icon: '⭐', source: 'battlepass' },
  { key: 'total_xp', label: 'Season XP', icon: '✨', format: 'compact', source: 'battlepass' },
  { key: 'best_streak', label: 'Best Streak', icon: '🔥', source: 'profile' },
];
```

### MatchHistoryItem Component

```typescript
/**
 * MatchHistoryItem - Single Match Result Row
 * 
 * Features:
 * - Opponent avatar and name
 * - WIN/LOSS badge with color coding
 * - XP earned display
 * - Relative timestamp
 * - Left border accent based on outcome
 */

interface MatchHistoryItemProps {
  match: MatchResult;
  className?: string;
}

interface MatchResult {
  id: string;
  opponent: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  won: boolean;
  xp_earned: number;
  played_at: string;
}

const outcomeStyles = {
  win: {
    badge: 'bg-[#10b981] text-white',
    border: 'border-l-[#10b981]',
    text: 'WIN',
  },
  loss: {
    badge: 'bg-[#ef4444] text-white',
    border: 'border-l-[#ef4444]',
    text: 'LOSS',
  },
};
```

### LoadoutPreview Component

```typescript
/**
 * LoadoutPreview - Equipped Cosmetics Display
 * 
 * Features:
 * - Horizontal row of 6 loadout slots
 * - Item preview with rarity border
 * - Empty slot placeholder styling
 * - Responsive sizing (64px desktop, 48px mobile)
 * - Link to inventory for customization
 */

interface LoadoutPreviewProps {
  loadout: Loadout | null;
  inventory?: InventoryItem[];
  showCustomizeLink?: boolean;
  className?: string;
}

const SLOT_TYPES: CosmeticType[] = ['skin', 'emote', 'banner', 'nameplate', 'effect', 'trail'];

const slotStyles = {
  filled: 'bg-[var(--color-bg-elevated)] border-2',
  empty: 'bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border-subtle)]',
};
```

### SocialLinkButton Component

```typescript
/**
 * SocialLinkButton - Styled Social Media Link
 * 
 * Features:
 * - Platform icon with brand color on hover
 * - Platform name or username display
 * - External link behavior for URLs
 * - Copy to clipboard for Discord
 */

interface SocialLinkButtonProps {
  platform: 'twitter' | 'twitch' | 'youtube' | 'discord';
  value: string;
  className?: string;
}

const platformConfig = {
  twitter: {
    icon: TwitterIcon,
    color: '#1DA1F2',
    label: 'Twitter',
    isUrl: true,
  },
  twitch: {
    icon: TwitchIcon,
    color: '#9146FF',
    label: 'Twitch',
    isUrl: true,
  },
  youtube: {
    icon: YouTubeIcon,
    color: '#FF0000',
    label: 'YouTube',
    isUrl: true,
  },
  discord: {
    icon: DiscordIcon,
    color: '#5865F2',
    label: 'Discord',
    isUrl: false, // Copy to clipboard
  },
};
```

### AchievementBadge Component

```typescript
/**
 * AchievementBadge - Achievement Display with Rarity
 * 
 * Features:
 * - Achievement icon with rarity background
 * - Achievement name
 * - Rarity-based styling (border, glow)
 * - Legendary shimmer animation
 * - Hover tooltip with description
 */

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
}

const rarityStyles = {
  common: { border: 'border-[#737373]', glow: '' },
  uncommon: { border: 'border-[#10b981]', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  rare: { border: 'border-[#3b82f6]', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  epic: { border: 'border-[#a855f7]', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]' },
  legendary: { border: 'border-[#f59e0b]', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]', shimmer: true },
};
```

### ProfileSection Component

```typescript
/**
 * ProfileSection - Section Container Component
 * 
 * Features:
 * - Section header with icon, title, subtitle
 * - Optional badge (count, new)
 * - Consistent padding and margins
 * - Optional collapse functionality
 */

interface ProfileSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'count' | 'new';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles = {
  default: 'bg-[#6366f1] text-white',
  count: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
  new: 'bg-[#10b981] text-white',
};
```

### ProfileEditorForm Component

```typescript
/**
 * ProfileEditorForm - Enhanced Profile Editor
 * 
 * Features:
 * - Split layout with form and live preview
 * - Enterprise-styled form inputs
 * - Character count displays
 * - File upload with preview
 * - Unsaved changes detection
 * - Validation feedback
 */

interface ProfileEditorFormProps {
  profile: Profile;
  onSave: (updates: ProfileUpdate) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onBannerUpload: (file: File) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Validation rules
const VALIDATION = {
  displayName: { min: 3, max: 30 },
  bio: { max: 500 },
  title: { max: 50 },
  avatar: { maxSize: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  banner: { maxSize: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
};
```

## Data Models

### Profile State

```typescript
interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  banner_url?: string;
  banner_color?: string;
  bio?: string;
  title?: string;
  country?: string;
  level: number;
  total_xp: number;
  games_played: number;
  games_won: number;
  social_links?: SocialLinks;
  created_at: string;
  updated_at: string;
}

interface SocialLinks {
  twitter?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
}

interface ProfileUpdate {
  display_name?: string;
  bio?: string;
  banner_color?: string;
  title?: string;
  country?: string;
  social_links?: SocialLinks;
}
```

### Match History Types

```typescript
interface MatchResult {
  id: string;
  opponent: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  won: boolean;
  xp_earned: number;
  played_at: string;
}

interface MatchHistoryResponse {
  matches: MatchResult[];
  total: number;
  has_more: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Profile Header Typography
*For any* profile data, the ProfileHeader SHALL render the display name with 3xl-4xl extrabold styling, title with sm medium accent color, and level badge with sm bold white text on indigo background.
**Validates: Requirements 2.1**

### Property 2: Stats Card Typography
*For any* StatsCard with value and label, the component SHALL render value with 2xl-3xl bold tabular-nums styling and label with xs-sm medium uppercase tracking-wider styling.
**Validates: Requirements 2.3**

### Property 3: Banner Display Mode
*For any* profile, if banner_url exists then ProfileHeader SHALL display the image with object-cover and gradient overlay; if banner_url is null then ProfileHeader SHALL display solid color from banner_color (defaulting to #1a1a2e).
**Validates: Requirements 3.2, 3.3**

### Property 4: Tier Ring Progress Calculation (Unified Progression)
*For any* Battle Pass progress with current_tier, current_xp, and xp_to_next_tier, the tier ring SHALL display progress percentage calculated as (current_xp / xp_to_next_tier) * 100. If no active season, display 0%.
**Validates: Requirements 3.4**

### Property 5: Win Rate Calculation and Color Coding
*For any* profile with games_played > 0, the win rate SHALL be calculated as (games_won / games_played) * 100 and color coded: green if > 60%, yellow if 40-60%, red if < 40%. If games_played = 0, display "N/A".
**Validates: Requirements 4.3**

### Property 6: Stats Dashboard Card Count (Unified Progression)
*For any* profile and Battle Pass data, the StatsDashboard SHALL render exactly 6 StatsCards: Games Played, Wins, Win Rate, Current Tier (from Battle Pass), Season XP (from Battle Pass), and Best Streak.
**Validates: Requirements 4.1**

### Property 7: Match Outcome Styling
*For any* match result, if won is true then MatchHistoryItem SHALL display "WIN" badge with green (#10b981) background and green left border; if won is false then SHALL display "LOSS" badge with red (#ef4444) background and red left border.
**Validates: Requirements 5.3, 5.4**

### Property 8: Loadout Slot Display
*For any* loadout slot, if the slot contains an equipped item then LoadoutPreview SHALL display item preview with rarity border; if the slot is empty then SHALL display slot type icon with dashed border and 50% opacity.
**Validates: Requirements 6.2, 6.3**

### Property 9: Social Link Platform Colors
*For any* SocialLinkButton, the component SHALL apply the correct platform brand color on hover: Twitter (#1DA1F2), Twitch (#9146FF), YouTube (#FF0000), Discord (#5865F2).
**Validates: Requirements 7.4**

### Property 10: Achievement Rarity Styling
*For any* AchievementBadge with rarity, the component SHALL apply the correct border color and glow effect from rarityStyles. If rarity is "legendary", SHALL also apply shimmer animation.
**Validates: Requirements 9.1, 9.3**

### Property 11: Achievement Ordering
*For any* list of achievements, the achievements section SHALL display them ordered by rarity (legendary first, then epic, rare, uncommon, common) and then by earned_at date (newest first), limited to 6 items.
**Validates: Requirements 9.2**

### Property 12: Display Name Validation
*For any* display name input, the ProfileEditorForm SHALL validate minimum 3 characters and maximum 30 characters, showing error state for invalid input and character count display.
**Validates: Requirements 8.2**

### Property 13: File Upload Validation
*For any* file upload (avatar or banner), the ProfileEditorForm SHALL validate file type is one of [JPEG, PNG, WebP] and file size is less than 5MB, showing error message for invalid files.
**Validates: Requirements 8.4**

### Property 14: Unsaved Changes Detection
*For any* form state where current values differ from initial profile values, the ProfileEditorForm SHALL display "Unsaved changes" indicator and enable the Save button.
**Validates: Requirements 8.5**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Profile load failure | Display error state with retry button |
| Match history load failure | Show "Unable to load matches" message with retry |
| Avatar upload failure | Show error toast, revert preview, enable retry |
| Banner upload failure | Show error toast, revert preview, enable retry |
| Profile update failure | Show error toast, keep form data, enable retry |
| Image load failure | Show placeholder avatar/banner |
| Network timeout | Show timeout message with retry option |
| Invalid profile data | Display fallback values, log warning |

## Testing Strategy

### Property-Based Testing (fast-check)

The following properties will be tested using the fast-check library with minimum 100 iterations per test:

1. **Profile Header Typography**: Generate profile data, verify typography classes
2. **Stats Card Typography**: Generate stat values/labels, verify styling classes
3. **Banner Display Mode**: Generate profiles with/without banner_url, verify rendering
4. **Level Ring Progress**: Generate XP values, verify progress calculation
5. **Win Rate Calculation**: Generate games_played/games_won, verify percentage and color
6. **Stats Dashboard Card Count**: Generate profiles, verify 6 cards rendered
7. **Match Outcome Styling**: Generate match results, verify WIN/LOSS styling
8. **Loadout Slot Display**: Generate loadouts, verify filled/empty slot rendering
9. **Social Link Platform Colors**: Generate platform types, verify color mapping
10. **Achievement Rarity Styling**: Generate achievements, verify rarity styling
11. **Achievement Ordering**: Generate achievement lists, verify sort order
12. **Display Name Validation**: Generate input strings, verify validation logic
13. **File Upload Validation**: Generate file metadata, verify validation logic
14. **Unsaved Changes Detection**: Generate form states, verify change detection

### Unit Tests

- Component rendering with various props
- Event handler invocation (edit, save, upload)
- State management logic
- Utility function correctness (win rate, level progress, relative time)

### Integration Tests

- Full profile edit flow
- Avatar/banner upload flow
- Match history pagination
- Social link interactions

## Animation Specifications

### Micro-interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| StatsCard | Hover | translateY(-2px), shadow enhancement, 200ms |
| Avatar | Hover | scale(1.05), 200ms |
| SocialLinkButton | Hover | background color to platform color, 150ms |
| AchievementBadge | Hover | scale(1.1), shadow enhancement, 200ms |
| MatchHistoryItem | Hover | background highlight, 150ms |

### Level Ring Animation

| Event | Effect |
|-------|--------|
| Initial load | Progress animates from 0 to current value, 800ms ease-out |
| Level up | Ring fills completely, pulse effect, then resets |

### Loading States

| Component | Skeleton |
|-----------|----------|
| ProfileHeader | Banner skeleton, avatar circle, text lines |
| StatsDashboard | 6 card skeletons with shimmer |
| MatchHistorySection | 5 row skeletons with shimmer |
| LoadoutPreview | 6 slot skeletons |

## Migration Notes

### Component Migration

1. **ProfileCard.tsx** → Replace with ProfileHeader + ProfileSections
2. **ProfileEditor.tsx** → Upgrade to ProfileEditorForm with enterprise styling
3. **Profile.tsx** → Integrate enterprise components, add new sections

### Styling Updates

- Replace hardcoded colors with design token variables
- Update typography to match hierarchy specifications
- Add rarity theming to achievement displays
- Implement responsive breakpoints

### Import Updates

```typescript
// Before
import { ProfileCard } from '@/components/profile/ProfileCard'
import { ProfileEditor } from '@/components/profile/ProfileEditor'

// After
import {
  ProfileHeader,
  StatsDashboard,
  StatsCard,
  MatchHistorySection,
  MatchHistoryItem,
  LoadoutPreview,
  SocialLinkButton,
  AchievementBadge,
  ProfileSection,
  ProfileEditorForm,
} from '@/components/profile/enterprise'
```
