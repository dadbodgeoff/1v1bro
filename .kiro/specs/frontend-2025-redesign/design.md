# Frontend 2025 Redesign - Design Document

## Overview

This design document outlines the architecture for a comprehensive frontend modernization of the 1v1bro gaming platform. The redesign transforms the current implementation into a professional, enterprise-grade 2025 design system with:

1. **Unified Design System** - Centralized design tokens in CSS custom properties
2. **Component Library** - Professional-grade reusable React components
3. **Shop Module** - Conversion-optimized e-commerce experience
4. **Battle Pass Display** - Engaging progression UI
5. **Dashboard Polish** - Refined styling and interactions

The implementation preserves existing functionality while upgrading visual quality, removing legacy cyan/purple colors, and adding modern interactions.

## Current State Analysis

### Files to Modify
| File | Current State | Changes Needed |
|------|---------------|----------------|
| `frontend/src/index.css` | Basic Tailwind setup, legacy colors | Add design tokens, remove cyan/purple |
| `frontend/src/components/ui/Button.tsx` | Basic variants | Add premium variant, polish states |
| `frontend/src/components/ui/Input.tsx` | Basic input | Add icon slots, improve styling |
| `frontend/src/components/ui/GlassCard.tsx` | Glass morphism card | Align with new design tokens |
| `frontend/src/components/ui/Badge.tsx` | Basic badge | Add rarity variants |
| `frontend/src/components/ui/Skeleton.tsx` | Basic skeleton | Add shimmer animation |
| `frontend/src/pages/Shop.tsx` | Basic shop page | Full redesign with hero, filters |
| `frontend/src/components/cosmetics/ShopGrid.tsx` | Basic grid | Add hover effects, owned states |
| `frontend/src/pages/BattlePass.tsx` | Basic battle pass | Full redesign with new track |
| `frontend/src/components/battlepass/BattlePassTrack.tsx` | Basic track | Horizontal scroll, animations |

### New Files to Create
| File | Purpose |
|------|---------|
| `frontend/src/styles/tokens.css` | Design tokens as CSS custom properties |
| `frontend/src/components/ui/Modal.tsx` | Modal with animations and focus trap |
| `frontend/src/components/ui/Tooltip.tsx` | Tooltip component |
| `frontend/src/components/ui/Select.tsx` | Dropdown select component |
| `frontend/src/components/ui/Progress.tsx` | Linear and circular progress |
| `frontend/src/components/ui/Toast.tsx` | Toast notification system |
| `frontend/src/components/ui/Confetti.tsx` | Celebration particle effects |
| `frontend/src/components/shop/ShopCard.tsx` | Individual shop item card |
| `frontend/src/components/shop/ShopFilters.tsx` | Filter pills and sort dropdown |
| `frontend/src/components/shop/FeaturedItem.tsx` | Hero featured item section |
| `frontend/src/components/shop/PurchaseModal.tsx` | Purchase confirmation modal |
| `frontend/src/components/battlepass/SeasonHeader.tsx` | Season info with countdown |
| `frontend/src/components/battlepass/TierCard.tsx` | Individual tier card |
| `frontend/src/components/battlepass/XPProgressBar.tsx` | XP progress display |
| `frontend/src/components/battlepass/PremiumUpsell.tsx` | Premium upgrade CTA |
| `frontend/src/hooks/useConfetti.ts` | Confetti animation hook |
| `frontend/src/hooks/useCountdown.ts` | Countdown timer hook |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Design System Layer                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         tokens.css (CSS Custom Properties)                    │   │
│  │  Colors │ Typography │ Spacing │ Shadows │ Borders │ Animations              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Component Library (ui/)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Button  │ │  Input   │ │   Card   │ │  Modal   │ │  Badge   │ │ Tooltip  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Select  │ │ Progress │ │ Skeleton │ │  Toast   │ │ Confetti │ │   Icon   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    Shop Module      │     │  Battle Pass Module │     │   Dashboard Module  │
│  ┌───────────────┐  │     │  ┌───────────────┐  │     │  ┌───────────────┐  │
│  │   ShopCard    │  │     │  │ SeasonHeader  │  │     │  │    Widgets    │  │
│  │  ShopFilters  │  │     │  │   TierCard    │  │     │  │  EmptyStates  │  │
│  │ FeaturedItem  │  │     │  │ XPProgressBar │  │     │  │   Skeletons   │  │
│  │ PurchaseModal │  │     │  │ PremiumUpsell │  │     │  │  Transitions  │  │
│  └───────────────┘  │     │  └───────────────┘  │     │  └───────────────┘  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Components and Interfaces

### Design Tokens (tokens.css)

```css
:root {
  /* Background Colors */
  --color-bg-base: #0a0a0a;
  --color-bg-card: #111111;
  --color-bg-elevated: #1a1a1a;
  --color-bg-hover: rgba(255, 255, 255, 0.04);
  
  /* Text Colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #737373;
  
  /* Accent Colors */
  --color-accent-primary: #6366f1;
  --color-accent-primary-hover: #4f46e5;
  --color-accent-premium: #f59e0b;
  --color-accent-success: #10b981;
  --color-accent-error: #f43f5e;
  
  /* Border Colors */
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-visible: rgba(255, 255, 255, 0.1);
  
  /* Rarity Colors */
  --color-rarity-common: #737373;
  --color-rarity-uncommon: #10b981;
  --color-rarity-rare: #3b82f6;
  --color-rarity-epic: #a855f7;
  --color-rarity-legendary: #f59e0b;
  
  /* Spacing (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.25);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.25);
  
  /* Transitions */
  --transition-fast: 100ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

### Button Component

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Variant styles
const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
  secondary: 'bg-white/10 text-white hover:bg-white/20 focus:ring-white/50',
  ghost: 'bg-transparent text-neutral-400 hover:bg-white/5 hover:text-white',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500',
  premium: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400',
};
```

### Modal Component

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

// Features:
// - Backdrop blur with bg-black/60%
// - Scale animation (0.95 → 1.0)
// - Focus trap using @headlessui/react or custom implementation
// - Escape key to close
// - Click outside to close (optional)
```

### Badge Component (Rarity Variants)

```typescript
interface BadgeProps {
  variant?: 'default' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  shimmer?: boolean; // For legendary
}

const rarityStyles = {
  common: 'bg-neutral-600/50 text-neutral-300',
  uncommon: 'bg-emerald-900/50 text-emerald-400',
  rare: 'bg-blue-900/50 text-blue-400',
  epic: 'bg-purple-900/50 text-purple-400',
  legendary: 'bg-amber-900/50 text-amber-400',
};
```

### Shop Card Component

```typescript
interface ShopCardProps {
  item: Cosmetic;
  isOwned: boolean;
  onPurchase: () => void;
  onViewDetails: () => void;
}

// Features:
// - Rarity gradient border
// - Aspect-square preview image
// - Name, type badge, price
// - Hover: scale(1.02), shadow enhancement, overlay buttons
// - Owned state: green badge, disabled purchase, opacity 0.8
// - Limited: pulsing badge, countdown timer
```

### Featured Item Component

```typescript
interface FeaturedItemProps {
  item: Cosmetic;
  isOwned: boolean;
  onPurchase: () => void;
  expiresAt?: Date; // For limited items
}

// Features:
// - Full-width hero card
// - Large preview (400px+)
// - Animated glow effect
// - "Featured" badge
// - Countdown timer if limited
```

### Purchase Modal Component

```typescript
interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Cosmetic;
  userBalance: number;
  onConfirm: () => Promise<void>;
}

// Features:
// - Item preview centered
// - Price breakdown (cost, balance, remaining)
// - Insufficient funds state with "Get Coins" CTA
// - Loading state during purchase
// - Success triggers confetti
```

### Battle Pass Tier Card Component

```typescript
interface TierCardProps {
  tier: BattlePassTier;
  currentTier: number;
  isPremium: boolean;
  isClaimable: boolean;
  isClaimed: boolean;
  onClaim: () => void;
}

// Features:
// - Tier number badge
// - Free reward (bottom) and premium reward (top)
// - Lock icon on premium if not purchased
// - Glow effect if claimable
// - Checkmark if claimed
// - Reduced opacity if locked
```

### XP Progress Bar Component

```typescript
interface XPProgressBarProps {
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  seasonName: string;
}

// Features:
// - Tier number prominently displayed
// - Gradient progress bar (indigo → purple)
// - "1,234 / 2,000 XP" text
// - Percentage label
// - Animated fill on XP gain
```

### Season Header Component

```typescript
interface SeasonHeaderProps {
  season: Season;
  daysRemaining: number;
}

// Features:
// - Season name and theme
// - Banner/artwork image
// - Days remaining countdown
// - "Ending Soon" warning if < 3 days
```


## Data Models

### Design Token Types

```typescript
// Color tokens
type ColorToken = 
  | 'bg-base' | 'bg-card' | 'bg-elevated' | 'bg-hover'
  | 'text-primary' | 'text-secondary' | 'text-muted'
  | 'accent-primary' | 'accent-premium' | 'accent-success' | 'accent-error'
  | 'border-subtle' | 'border-visible'
  | 'rarity-common' | 'rarity-uncommon' | 'rarity-rare' | 'rarity-epic' | 'rarity-legendary';

// Spacing tokens
type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

// Size tokens
type SizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

### Shop State

```typescript
interface ShopState {
  items: Cosmetic[];
  featuredItem: Cosmetic | null;
  filters: {
    type: CosmeticType | null;
    rarity: Rarity | null;
    sort: SortOption;
  };
  loading: boolean;
  error: string | null;
  purchaseModal: {
    isOpen: boolean;
    item: Cosmetic | null;
    isPurchasing: boolean;
  };
}

type SortOption = 
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rarity-asc'
  | 'rarity-desc';
```

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

interface BattlePassTier {
  tier: number;
  xp_required: number;
  free_reward: Reward | null;
  premium_reward: Reward | null;
}

interface Reward {
  type: 'coins' | 'xp_boost' | 'cosmetic' | 'title';
  value: string | number;
  cosmetic_preview_url?: string;
}
```

### Toast Notification

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // ms, default 3000
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Button Variant Styling
*For any* button variant (primary, secondary, ghost, danger, premium), the rendered button SHALL have the correct background color, text color, and hover state as defined in the design tokens.
**Validates: Requirements 2.1**

### Property 2: Badge Rarity Colors
*For any* rarity value (common, uncommon, rare, epic, legendary), the Badge component SHALL render with the correct background and text colors as defined in the rarity color tokens.
**Validates: Requirements 2.5**

### Property 3: Modal Focus Trap
*For any* open modal, keyboard focus SHALL be trapped within the modal content, and pressing Escape SHALL close the modal.
**Validates: Requirements 2.4**

### Property 4: Shop Filter Application
*For any* filter selection (type or rarity), the displayed shop items SHALL only include items matching the selected filter criteria.
**Validates: Requirements 3.3**

### Property 5: Shop Sort Order
*For any* sort option selected, the shop items SHALL be ordered according to the sort criteria (price ascending/descending, newest, rarity).
**Validates: Requirements 3.10**

### Property 6: Owned Item Display
*For any* cosmetic item that the user owns, the shop card SHALL display an "Owned" badge and the purchase button SHALL be disabled.
**Validates: Requirements 3.7**

### Property 7: Limited Item Countdown
*For any* limited-time item with an expiration date, the countdown timer SHALL display the correct remaining time (days, hours, minutes).
**Validates: Requirements 3.9**

### Property 8: XP Progress Calculation
*For any* XP progress state, the progress bar fill percentage SHALL equal (currentXP / xpToNextTier) * 100, clamped to [0, 100].
**Validates: Requirements 4.5**

### Property 9: Tier Claimable State
*For any* battle pass tier where currentTier >= tier.tier and the reward is not claimed, the tier SHALL be marked as claimable with appropriate visual highlighting.
**Validates: Requirements 4.3**

### Property 10: Premium Lock Display
*For any* premium reward where the user does not have premium, the reward SHALL display a lock icon overlay.
**Validates: Requirements 4.2, 4.9**

### Property 11: Responsive Grid Columns
*For any* viewport width, the shop grid SHALL display the correct number of columns: 2 for mobile (<640px), 3 for tablet (640-1024px), 4 for desktop (>1024px).
**Validates: Requirements 3.1, 6.1**

### Property 12: Keyboard Focus Visibility
*For any* interactive element receiving keyboard focus, a visible focus ring (2px indigo-500) SHALL be displayed.
**Validates: Requirements 6.2**

### Property 13: Touch Target Size
*For any* interactive element, the tap target size SHALL be at least 44x44 pixels.
**Validates: Requirements 6.5**

### Property 14: No Legacy Colors
*For any* rendered component, the computed styles SHALL NOT contain the legacy cyan (#06b6d4) or purple (#a855f7) colors.
**Validates: Requirements 1.3**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Shop load failure | Display error state with retry button, show cached items if available |
| Purchase failure | Show error toast, keep modal open, enable retry |
| Insufficient funds | Show "Get Coins" CTA in purchase modal |
| Battle pass load failure | Display error state with retry button |
| Claim reward failure | Show error toast, revert optimistic update |
| Image load failure | Show placeholder with item name |
| Network timeout | Show timeout message with retry option |

## Testing Strategy

### Property-Based Testing (fast-check)

The following properties will be tested using the fast-check library with minimum 100 iterations per test:

1. **Button Variants**: Generate all variant combinations, verify correct class application
2. **Badge Rarity**: Generate all rarity values, verify correct color classes
3. **Shop Filters**: Generate filter combinations, verify item filtering logic
4. **Shop Sort**: Generate item arrays, verify sort order correctness
5. **XP Progress**: Generate XP values, verify progress percentage calculation
6. **Tier Claimable**: Generate tier/progress combinations, verify claimable state
7. **Grid Columns**: Generate viewport widths, verify column count
8. **Color Validation**: Generate component renders, verify no legacy colors

### Unit Tests

- Component rendering with various props
- Event handler invocation
- State management logic
- Utility function correctness
- Animation trigger conditions

### Integration Tests

- Full shop purchase flow
- Battle pass claim flow
- Filter and sort interactions
- Modal open/close cycles
- Toast notification lifecycle

### Visual Regression Tests

- Component snapshots at different states
- Responsive layout screenshots
- Animation keyframe verification

## Animation Specifications

### Micro-interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| Button | Click | scale(0.98) → scale(1), 100ms |
| Card | Hover | translateY(-2px), shadow-lg → shadow-xl, 200ms |
| Modal | Open | opacity 0→1, scale 0.95→1, 200ms |
| Modal | Close | opacity 1→0, scale 1→0.95, 150ms |
| Toast | Enter | translateX(100%) → translateX(0), 300ms |
| Toast | Exit | translateX(0) → translateX(100%), 200ms |

### Celebration Effects

| Event | Effect |
|-------|--------|
| Purchase (common) | 20 particles, gray/white colors, 1s duration |
| Purchase (uncommon) | 40 particles, green colors, 1.2s duration |
| Purchase (rare) | 60 particles, blue colors, 1.5s duration |
| Purchase (epic) | 80 particles, purple colors, 1.8s duration |
| Purchase (legendary) | 100 particles, gold colors, 2s duration, screen flash |
| Tier claim | Card flip animation, particle burst, 1s duration |

### Loading States

| Component | Skeleton |
|-----------|----------|
| Shop grid | 8-12 card skeletons with shimmer |
| Featured item | Large rectangle skeleton |
| Filter pills | 6 pill skeletons |
| Battle pass track | 10 tier card skeletons |
| XP progress | Bar skeleton with shimmer |

## Migration Notes

### Color Migration

Replace all instances of:
- `#06b6d4` (cyan-500) → `#6366f1` (indigo-500) for primary actions
- `#a855f7` (purple-500) → `#f59e0b` (amber-500) for premium/special
- `bg-cyan-*` → `bg-indigo-*`
- `text-cyan-*` → `text-indigo-*`
- `border-cyan-*` → `border-indigo-*`
- `bg-purple-*` → `bg-amber-*` (for premium) or `bg-indigo-*` (for primary)

### Component Updates

1. **Button.tsx**: Add `premium` variant, update color classes
2. **Input.tsx**: Add icon slots, update border/focus colors
3. **Badge.tsx**: Add rarity variants with new colors
4. **GlassCard.tsx**: Align with new design tokens
5. **Skeleton.tsx**: Add shimmer animation keyframes

### New Dependencies

```json
{
  "@headlessui/react": "^2.0.0",  // For Modal, Tooltip, Select
  "canvas-confetti": "^1.9.0",    // For celebration effects
  "framer-motion": "^11.0.0"      // For animations (optional)
}
```
