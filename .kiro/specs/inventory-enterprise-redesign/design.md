# Inventory Enterprise Redesign - Design Document

## Overview

This design document outlines the architecture for transforming the Inventory experience into an enterprise-grade system matching the quality established in the Item Shop and Battle Pass redesigns. The upgrade creates visual and functional parity across the platform's collection management surfaces.

The implementation:
1. Creates new enterprise components in `frontend/src/components/inventory/enterprise/`
2. Establishes consistent typography hierarchy (H1→H4)
3. Implements configurable InventoryItemBox with size variants
4. Enhances loadout visualization with slot previews
5. Adds collection statistics with progress tracking
6. Implements advanced filtering and sorting
7. Organizes content into clear sections

All changes preserve existing functionality while upgrading visual quality and user experience.

## Current State Analysis

### Files to Modify
| File | Current State | Changes Needed |
|------|---------------|----------------|
| `frontend/src/pages/Inventory.tsx` | Basic page layout with tabs | Integrate enterprise components, add sections |
| `frontend/src/components/cosmetics/InventoryGrid.tsx` | Basic grid with filter tabs | Replace with enterprise InventoryItemBox, improve styling |
| `frontend/src/components/cosmetics/LoadoutDisplay.tsx` | Basic 3x2/6x1 grid | Upgrade to enterprise LoadoutPanel |

### New Files to Create
| File | Purpose |
|------|---------|
| `frontend/src/components/inventory/enterprise/InventoryHeader.tsx` | Enterprise page header with stats and controls |
| `frontend/src/components/inventory/enterprise/InventoryItemBox.tsx` | Configurable size display with rarity theming |
| `frontend/src/components/inventory/enterprise/LoadoutPanel.tsx` | Enhanced loadout display with slot previews |
| `frontend/src/components/inventory/enterprise/InventorySection.tsx` | Section container with title, subtitle, content |
| `frontend/src/components/inventory/enterprise/FilterBar.tsx` | Filter chips and sort controls |
| `frontend/src/components/inventory/enterprise/CollectionStats.tsx` | Statistics display with progress |
| `frontend/src/components/inventory/enterprise/EquipCTA.tsx` | Equip/unequip buttons with variants |
| `frontend/src/components/inventory/enterprise/index.ts` | Barrel export file |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Inventory Page                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         InventoryHeader                                       │   │
│  │  "My Collection" (H1) │ Item Count │ View Toggle │ CollectionStats           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    InventorySection: "Current Loadout"                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         LoadoutPanel                                  │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │    │   │
│  │  │  │ Skin │ │Emote │ │Banner│ │ Name │ │Effect│ │Trail │             │    │   │
│  │  │  │      │ │      │ │      │ │ plate│ │      │ │      │             │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    InventorySection: "My Items"                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         FilterBar                                     │    │   │
│  │  │  [All] [Skin] [Emote] ... │ [Rarity ▼] │ [Status ▼] │ [Sort ▼]      │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    Inventory Grid                                     │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │    │   │
│  │  │  │Item 1│ │Item 2│ │Item 3│ │Item 4│ │Item 5│ ...                   │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                       │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Inventory (Page)
├── InventoryHeader
│   ├── Page Title (H1 gradient)
│   ├── Item Count Subtitle
│   ├── View Toggle (Grid/List)
│   └── CollectionStats (inline or expandable)
├── InventorySection: "Current Loadout"
│   └── LoadoutPanel
│       └── LoadoutSlot[] (6 slots)
│           ├── Slot Icon
│           ├── Item Preview (if equipped)
│           └── Item Name / Empty Label
├── InventorySection: "My Items"
│   ├── FilterBar
│   │   ├── Type Filter Chips
│   │   ├── Rarity Filter Dropdown
│   │   ├── Status Filter Toggle
│   │   └── Sort Dropdown
│   └── Inventory Grid
│       └── InventoryItemBox[]
│           ├── Rarity Badge
│           ├── Item Preview
│           ├── Item Info (name, type)
│           ├── Equipped Indicator
│           └── EquipCTA
└── Empty State (conditional)
```

## Components and Interfaces

### InventoryHeader Component

```typescript
/**
 * InventoryHeader - Enterprise Inventory Header Component
 * 
 * Features:
 * - Page title with gradient text (H1 level)
 * - Item count subtitle
 * - View toggle (grid/compact)
 * - Integrated collection stats
 * - Gradient accent bar
 */

interface InventoryHeaderProps {
  totalItems: number;
  viewMode: 'grid' | 'compact';
  onViewModeChange: (mode: 'grid' | 'compact') => void;
  stats?: CollectionStatsData;
  className?: string;
}

interface CollectionStatsData {
  totalOwned: number;
  totalCatalog?: number;
  byType: Record<CosmeticType, number>;
  byRarity: Record<Rarity, number>;
}
```

### InventoryItemBox Component

```typescript
/**
 * InventoryItemBox - Configurable Size Display Component
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

interface InventoryItemBoxProps {
  item: InventoryItem;
  size?: DisplaySize;
  onEquip: () => void;
  onUnequip: () => void;
  onViewDetails?: () => void;
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
    showAcquiredDate: true,
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
    showAcquiredDate: true,
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
    showAcquiredDate: false,
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
    showAcquiredDate: false,
    badgeSize: 'sm' as const,
    ctaSize: 'sm' as const,
  },
};

const rarityBorders: Record<Rarity, string> = {
  common: 'border-[#737373]/40',
  uncommon: 'border-[#10b981]/40',
  rare: 'border-[#3b82f6]/40',
  epic: 'border-[#a855f7]/40',
  legendary: 'border-[#f59e0b]/50',
};

const rarityGlows: Record<Rarity, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  epic: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
};

const equippedGlow = 'shadow-[0_0_20px_rgba(16,185,129,0.3)]';
```

### LoadoutPanel Component

```typescript
/**
 * LoadoutPanel - Enhanced Loadout Display
 * 
 * Features:
 * - 6 loadout slots in responsive grid
 * - Slot type icons and labels
 * - Equipped item previews with rarity borders
 * - Empty slot styling with dashed borders
 * - Click to filter/equip functionality
 */

interface LoadoutPanelProps {
  loadout: Loadout | null;
  inventory: InventoryItem[];
  onSlotClick: (type: CosmeticType) => void;
  onUnequip: (cosmeticId: string) => void;
  className?: string;
}

const SLOT_ICONS: Record<CosmeticType, string> = {
  skin: '👤',
  emote: '💃',
  banner: '🏳️',
  nameplate: '🏷️',
  effect: '✨',
  trail: '🌟',
};

// Slot styling
const filledSlotStyle = 'bg-[var(--color-bg-elevated)] border-2';
const emptySlotStyle = 'bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border-subtle)]';
```

### FilterBar Component

```typescript
/**
 * FilterBar - Filter Chips and Sort Controls
 * 
 * Features:
 * - Type filter chips with counts
 * - Rarity filter dropdown
 * - Equipped status toggle
 * - Sort dropdown
 * - Active filter summary
 * - Clear all button
 */

interface FilterBarProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  itemCounts: {
    total: number;
    byType: Record<CosmeticType, number>;
    byRarity: Record<Rarity, number>;
    equipped: number;
    unequipped: number;
  };
  className?: string;
}

interface InventoryFilters {
  type: CosmeticType | 'all';
  rarity: Rarity | 'all';
  status: 'all' | 'equipped' | 'unequipped';
  sort: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'rarity';
}

const filterChipStyles = {
  active: 'bg-[#6366f1] text-white',
  inactive: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]',
};
```

### CollectionStats Component

```typescript
/**
 * CollectionStats - Statistics Display
 * 
 * Features:
 * - Total items owned
 * - Type breakdown with icons
 * - Rarity breakdown with colored indicators
 * - Collection completion percentage
 */

interface CollectionStatsProps {
  stats: CollectionStatsData;
  variant?: 'inline' | 'expanded';
  className?: string;
}

// Rarity indicator colors
const rarityIndicators: Record<Rarity, string> = {
  common: 'bg-[#737373]',
  uncommon: 'bg-[#10b981]',
  rare: 'bg-[#3b82f6]',
  epic: 'bg-[#a855f7]',
  legendary: 'bg-[#f59e0b]',
};
```

### EquipCTA Component

```typescript
/**
 * EquipCTA - Equip/Unequip Buttons
 * 
 * Variants:
 * - default: Indigo bg for equip action
 * - equipped: Green bg with checkmark
 * - unequip: Gray bg for unequip action
 * - loading: Shows spinner
 */

interface EquipCTAProps {
  variant: 'default' | 'equipped' | 'unequip' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  slotType?: CosmeticType;
}

const variantStyles = {
  default: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white',
  equipped: 'bg-[#10b981] text-white cursor-default',
  unequip: 'bg-[#374151] hover:bg-[#4b5563] text-white',
  loading: 'bg-[#6366f1] text-white cursor-wait',
};
```

### InventorySection Component

```typescript
/**
 * InventorySection - Section Container
 * 
 * Features:
 * - Section header with icon, title, subtitle
 * - Optional badge (count, new, equipped)
 * - Consistent padding and margins
 * - Optional collapse functionality
 */

interface InventorySectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'count' | 'new' | 'equipped';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles = {
  default: 'bg-[#6366f1] text-white',
  count: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
  new: 'bg-[#10b981] text-white',
  equipped: 'bg-[#10b981] text-white',
};
```

## Data Models

### Inventory State

```typescript
interface InventoryState {
  items: InventoryItem[];
  loadout: Loadout | null;
  filters: InventoryFilters;
  loading: boolean;
  error: string | null;
  actionLoading: string | null; // ID of item being equipped/unequipped
}

interface InventoryItem {
  id: string;
  cosmetic_id: string;
  cosmetic: Cosmetic;
  acquired_date: string;
  is_equipped: boolean;
}

interface Loadout {
  skin?: string;
  emote?: string;
  banner?: string;
  nameplate?: string;
  effect?: string;
  trail?: string;
}

interface InventoryFilters {
  type: CosmeticType | 'all';
  rarity: Rarity | 'all';
  status: 'all' | 'equipped' | 'unequipped';
  sort: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'rarity';
}
```

### Display Configuration Types

```typescript
type DisplaySize = 'xl' | 'lg' | 'md' | 'sm';
type BadgeVariant = 'default' | 'count' | 'new' | 'equipped';
type EquipVariant = 'default' | 'equipped' | 'unequip' | 'loading';

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
  showAcquiredDate: boolean;
  badgeSize: 'sm' | 'md';
  ctaSize: 'sm' | 'md';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Size Config Consistency
*For any* InventoryItemBox size variant (xl, lg, md, sm), the rendered component SHALL apply the exact typography specifications (titleSize, titleWeight, typeSize) and dimensions (minHeight, imageSize) defined in the sizeConfig for that size.
**Validates: Requirements 2.3, 3.1**

### Property 2: Rarity Theming Application
*For any* inventory item with a rarity value, the InventoryItemBox SHALL apply the correct border color, hover glow, and background gradient as defined in the rarity styling maps.
**Validates: Requirements 3.2**

### Property 3: Equipped Item Styling
*For any* inventory item where is_equipped is true, the InventoryItemBox SHALL display a green checkmark badge, "EQUIPPED" indicator, and green border glow.
**Validates: Requirements 3.4**

### Property 4: Loadout Slot Display
*For any* loadout slot, if the slot contains an equipped item then the slot SHALL display the item preview with rarity border; if the slot is empty then the slot SHALL display the slot type icon with dashed border.
**Validates: Requirements 4.2, 4.3**

### Property 5: Collection Stats Calculation
*For any* inventory with items, the CollectionStats SHALL correctly calculate and display the count for each rarity, the count for each type, and the completion percentage (if total catalog is known).
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 6: Filter Application
*For any* combination of type, rarity, and status filters, the filtered inventory SHALL contain only items that match ALL active filter criteria.
**Validates: Requirements 6.2**

### Property 7: Sort Order
*For any* sort option (newest, oldest, name-asc, name-desc, rarity), the inventory items SHALL be ordered according to the selected sort criteria.
**Validates: Requirements 6.4**

### Property 8: Badge Variant Styling
*For any* badge variant (default, count, new, equipped), the rendered badge SHALL apply the correct background color and text color as defined in badgeStyles.
**Validates: Requirements 7.3**

### Property 9: Equip CTA Variants
*For any* EquipCTA variant (default, equipped, unequip, loading), the rendered button SHALL apply the correct background color, text, and cursor style as defined in variantStyles.
**Validates: Requirements 8.1**

### Property 10: Equip State Transitions
*For any* item transitioning from unequipped to equipped state (or vice versa), the InventoryItemBox SHALL update its equipped indicator and the LoadoutPanel SHALL update the corresponding slot.
**Validates: Requirements 8.3, 8.4**

### Property 11: Responsive Size Selection
*For any* viewport width, the inventory grid SHALL use the appropriate size variant and column count: SM/2-col for mobile (<640px), MD/3-col for tablet (640-1024px), MD-LG/4-5-col for desktop (>1024px).
**Validates: Requirements 9.1, 9.2, 9.3**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Inventory load failure | Display error state with retry button |
| Loadout load failure | Show "Unable to load loadout" message with retry |
| Equip action failure | Show error toast, revert optimistic update, enable retry |
| Unequip action failure | Show error toast, revert optimistic update, enable retry |
| Image load failure | Show placeholder icon based on item type |
| Network timeout | Show timeout message with retry option |
| Invalid item data | Skip rendering invalid item, log warning |

## Testing Strategy

### Property-Based Testing (fast-check)

The following properties will be tested using the fast-check library with minimum 100 iterations per test:

1. **Size Config Consistency**: Generate size variants, verify typography and dimension classes
2. **Rarity Theming**: Generate rarity values, verify border/glow/gradient classes
3. **Equipped Item Styling**: Generate items with equipped=true, verify indicator classes
4. **Loadout Slot Display**: Generate loadouts with filled/empty slots, verify slot rendering
5. **Collection Stats Calculation**: Generate inventories, verify stat calculations
6. **Filter Application**: Generate filter combinations and items, verify filtering logic
7. **Sort Order**: Generate items and sort options, verify ordering
8. **Badge Variant Styling**: Generate badge variants, verify style classes
9. **Equip CTA Variants**: Generate CTA variants, verify style classes
10. **Equip State Transitions**: Generate state transitions, verify UI updates
11. **Responsive Size Selection**: Generate viewport widths, verify size/column selection

### Unit Tests

- Component rendering with various props
- Event handler invocation (equip, unequip, filter)
- State management logic
- Utility function correctness (filtering, sorting, stats calculation)

### Integration Tests

- Full equip/unequip flow
- Filter and sort combinations
- Loadout slot interactions
- Responsive breakpoint behavior

## Animation Specifications

### Micro-interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| InventoryItemBox | Hover | translateY(-2px), shadow enhancement, 200ms |
| EquipCTA | Click | scale(0.98) → scale(1), 100ms |
| Filter Chip | Select | background color transition, 150ms |
| Loadout Slot | Hover | border color brighten, 150ms |
| Equipped Badge | Appear | scale(0) → scale(1), 200ms ease-out |

### Equip Effects

| Event | Effect |
|-------|--------|
| Equip success | Green checkmark fade in, toast notification |
| Unequip success | Badge fade out, slot update animation |
| Loading state | Spinner rotation, button disabled |

### Loading States

| Component | Skeleton |
|-----------|----------|
| InventoryHeader | Text skeletons for title and count |
| LoadoutPanel | 6 slot skeletons with shimmer |
| Inventory Grid | 8-12 card skeletons with shimmer |
| CollectionStats | Stat card skeletons |

## Migration Notes

### Component Migration

1. **InventoryGrid.tsx** → Replace internals with InventoryItemBox, move to enterprise
2. **LoadoutDisplay.tsx** → Upgrade to LoadoutPanel with enhanced styling
3. **Inventory.tsx** → Integrate enterprise components, add sections

### Styling Updates

- Replace hardcoded colors with design token variables
- Update typography to match hierarchy specifications
- Add rarity theming to item displays
- Implement size variants for responsive behavior

### Import Updates

```typescript
// Before
import { InventoryGrid } from '@/components/cosmetics/InventoryGrid'
import { LoadoutDisplay } from '@/components/cosmetics/LoadoutDisplay'

// After
import {
  InventoryHeader,
  InventoryItemBox,
  LoadoutPanel,
  InventorySection,
  FilterBar,
  CollectionStats,
  EquipCTA,
} from '@/components/inventory/enterprise'
```
