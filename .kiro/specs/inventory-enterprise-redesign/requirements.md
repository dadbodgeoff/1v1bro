# Requirements Document

## Introduction

This specification defines a comprehensive enterprise-grade upgrade for the Inventory experience in the 1v1bro gaming platform. The redesign transforms the current basic Inventory implementation into a AAA-quality collection management system that matches the enterprise standards established in the Item Shop and Battle Pass redesigns.

The upgrade encompasses:

1. **Enterprise Component Architecture** - New enterprise-grade components in `frontend/src/components/inventory/enterprise/` following the same patterns as the Shop and Battle Pass enterprise components
2. **Typography Hierarchy System** - Consistent H1→H4 hierarchy with proper font weights, sizes, and tracking across all Inventory elements
3. **Item Display System** - Configurable size variants (xl/lg/md/sm) for inventory cards with rarity theming, borders, and glows matching ItemDisplayBox patterns
4. **Loadout Visualization** - Enhanced loadout display with slot previews, equipped indicators, and quick-swap functionality
5. **Collection Statistics** - Visual statistics showing collection progress, rarity breakdown, and completion percentages
6. **Filter and Sort System** - Advanced filtering by type, rarity, equipped status with visual filter chips and sort options
7. **Section Organization** - Clear visual hierarchy with section headers, dividers, and consistent spacing following ShopSection patterns

The goal is to achieve visual and functional parity with the enterprise Item Shop and Battle Pass, creating a cohesive premium experience across the platform's collection management surfaces.

## Glossary

- **Inventory_System**: The collection management system at `frontend/src/pages/Inventory.tsx` and `frontend/src/components/inventory/`
- **Enterprise_Component**: A component following the enterprise architecture pattern established in `frontend/src/components/shop/enterprise/`
- **Item_Display_Box**: A configurable component for displaying inventory items with size variants and rarity theming
- **Typography_Hierarchy**: The systematic organization of text elements from H1 (page title) through body text with consistent sizing and weights
- **Loadout_Panel**: The visual display of currently equipped items organized by slot type
- **Loadout_Slot**: An individual equipment slot (skin, emote, banner, nameplate, effect, trail)
- **Collection_Stats**: Aggregate statistics about owned items including counts, rarity breakdown, and completion percentage
- **Filter_Chip**: A visual pill-shaped button for toggling filter options
- **Rarity_Theming**: Visual styling (borders, glows, gradients) based on item rarity (common, uncommon, rare, epic, legendary)
- **Size_Config**: Standardized configuration object defining dimensions, typography, and spacing for component size variants
- **Quick_Equip**: One-click action to equip an item directly from the inventory grid
- **Equipped_Indicator**: Visual badge or overlay showing an item is currently equipped

## Requirements

### Requirement 1: Enterprise Component Architecture

**User Story:** As a developer, I want Inventory components organized in an enterprise architecture, so that the codebase maintains consistency with the Shop and Battle Pass modules and enables scalable development.

#### Acceptance Criteria

1.1. WHEN the Inventory_System initializes THEN the system SHALL load enterprise components from `frontend/src/components/inventory/enterprise/` directory

1.2. WHEN enterprise components are created THEN each component SHALL include a JSDoc header documenting:
- Component purpose and features
- Size variants and their specifications
- Typography hierarchy per size
- Props interface with descriptions

1.3. WHEN the enterprise directory is structured THEN the system SHALL contain:
- `InventoryHeader.tsx` - Page header with collection stats, filter controls, and view toggle
- `InventoryItemBox.tsx` - Configurable size display for items with rarity theming and equip actions
- `LoadoutPanel.tsx` - Visual loadout display with slot previews and quick-swap
- `InventorySection.tsx` - Section container with title, subtitle, and content area
- `FilterBar.tsx` - Filter chips and sort controls
- `CollectionStats.tsx` - Statistics display with progress bars and counts
- `EquipCTA.tsx` - Conversion-optimized equip/unequip buttons with variants
- `index.ts` - Barrel export file for all enterprise components

1.4. WHEN components are exported THEN the barrel file SHALL export all enterprise components for clean imports: `import { InventoryHeader, InventoryItemBox, ... } from '@/components/inventory/enterprise'`

### Requirement 2: Typography Hierarchy System

**User Story:** As a player, I want clear visual hierarchy in the Inventory interface, so that I can quickly understand my collection and find items.

#### Acceptance Criteria

2.1. WHEN the InventoryHeader renders THEN the system SHALL display:
- H1: "My Collection" in 4xl-5xl (36-48px) extrabold with gradient text (indigo→purple)
- Subtitle: Item count in sm (14px) medium weight, muted color
- Gradient bar: 1.5px height accent bar below title matching Shop header pattern

2.2. WHEN InventorySection headers render THEN the system SHALL display:
- H2: Section title in 2xl-3xl (24-30px) bold with tight tracking
- Subtitle: Section description in sm (14px) medium weight, muted color
- Icon: 12x12 (48px) icon container with gradient background matching section theme

2.3. WHEN InventoryItemBox renders THEN the system SHALL use size-specific typography:
- XL: 28px extrabold title, 12px uppercase type label, 14px description
- LG: 22px bold title, 11px uppercase type label, 13px description
- MD: 16px bold title, 10px uppercase type label, no description
- SM: 14px semibold title, no type label, no description

2.4. WHEN loadout slot labels display THEN the system SHALL use:
- Slot type: sm (14px) semibold, uppercase tracking-wider, muted color
- Item name: base (16px) medium, white text, truncate overflow
- Empty slot: sm (14px) regular, muted color, italic

2.5. WHEN collection statistics display THEN the system SHALL use:
- Stat value: 2xl (24px) bold, white text, tabular-nums
- Stat label: xs (12px) medium, muted color, uppercase
- Progress percentage: sm (14px) semibold, accent color

### Requirement 3: Item Display System

**User Story:** As a player, I want visually appealing item displays that clearly show what I own and what's equipped, so that I can easily manage my collection.

#### Acceptance Criteria

3.1. WHEN InventoryItemBox renders THEN the system SHALL support size variants with uniform specifications:
- XL: 420px min-height, 240px image, used for featured/selected item detail
- LG: 200px min-height, 160px image, used for spotlight items
- MD: 280px min-height, 120px image, used for standard grid display
- SM: 180px min-height, 80px image, used for compact grid view

3.2. WHEN an item has rarity THEN the InventoryItemBox SHALL apply rarity theming:
- Border: 2px solid with rarity color at 40% opacity (legendary at 50%)
- Glow: Hover shadow with rarity color (0_0_30px for common→epic, 0_0_40px for legendary)
- Background: Gradient from rarity color at 5-15% opacity to transparent
- Badge: Rarity badge with shimmer animation for legendary items

3.3. WHEN displaying item content THEN the InventoryItemBox SHALL show:
- Item preview image or animated skin preview centered in image area
- Item name with size-appropriate typography
- Item type label (Skin, Emote, Banner, etc.) in uppercase
- Equipped status indicator (equipped badge or checkmark)
- Acquired date in relative format ("2 days ago")

3.4. WHEN an item is equipped THEN the system SHALL display:
- Green checkmark badge in top-right corner
- "EQUIPPED" label overlay or badge
- Subtle green border glow (0_0_20px_rgba(16,185,129,0.3))
- Equipped items appear first in grid when sorted by status

3.5. WHEN an item is a skin with sprite data THEN the system SHALL display:
- Animated SkinPreview component with sprite sheet
- Fallback to static image if sprite data unavailable
- Size-appropriate animation scale

### Requirement 4: Loadout Visualization

**User Story:** As a player, I want a clear view of my current loadout, so that I can see what I have equipped and quickly make changes.

#### Acceptance Criteria

4.1. WHEN LoadoutPanel renders THEN the system SHALL display:
- 6 loadout slots arranged in a responsive grid (3x2 on mobile, 6x1 on desktop)
- Each slot showing: slot type icon, equipped item preview, item name
- Empty slots with placeholder icon and "Empty" label
- Visual distinction between filled and empty slots

4.2. WHEN a loadout slot contains an equipped item THEN the system SHALL:
- Display item preview image at 80px size
- Show item name below preview (truncated if needed)
- Apply rarity border color to slot
- Add subtle rarity glow on hover

4.3. WHEN a loadout slot is empty THEN the system SHALL:
- Display slot type icon at 40px size with 30% opacity
- Show slot type name as label
- Apply dashed border with muted color
- Show "Click to equip" tooltip on hover

4.4. WHEN a user clicks a loadout slot THEN the system SHALL:
- Open item selection filtered to that slot's type
- Highlight currently equipped item if any
- Allow one-click equip from filtered view
- Close selection and update slot on equip

4.5. WHEN a user clicks an equipped item in loadout THEN the system SHALL:
- Show quick action menu with "View Details" and "Unequip" options
- Animate slot update on unequip
- Provide visual feedback for action completion

### Requirement 5: Collection Statistics

**User Story:** As a player, I want to see statistics about my collection, so that I understand my progress and what I'm missing.

#### Acceptance Criteria

5.1. WHEN CollectionStats renders THEN the system SHALL display:
- Total items owned count with icon
- Items by type breakdown (6 type counts)
- Items by rarity breakdown (5 rarity counts with colored indicators)
- Collection completion percentage if total catalog known

5.2. WHEN displaying rarity breakdown THEN the system SHALL:
- Show count for each rarity with rarity-colored dot indicator
- Display as horizontal bar chart or pill badges
- Order from common to legendary
- Highlight legendary count with shimmer effect if > 0

5.3. WHEN displaying type breakdown THEN the system SHALL:
- Show count for each cosmetic type with type icon
- Display as grid of stat cards or inline badges
- Highlight the type with most items
- Show "0" for types with no items (not hidden)

5.4. WHEN collection completion is calculable THEN the system SHALL:
- Display circular or linear progress indicator
- Show "X of Y items" text
- Apply milestone styling at 25%, 50%, 75%, 100%
- Celebrate 100% completion with special badge

### Requirement 6: Filter and Sort System

**User Story:** As a player, I want to filter and sort my inventory, so that I can quickly find specific items.

#### Acceptance Criteria

6.1. WHEN FilterBar renders THEN the system SHALL display:
- Type filter chips (All, Skin, Emote, Banner, Nameplate, Effect, Trail)
- Rarity filter chips (All, Common, Uncommon, Rare, Epic, Legendary)
- Equipped status toggle (All, Equipped, Unequipped)
- Sort dropdown (Newest, Oldest, Name A-Z, Name Z-A, Rarity)

6.2. WHEN a filter chip is selected THEN the system SHALL:
- Apply accent background color to selected chip
- Update inventory grid to show only matching items
- Display count of filtered items
- Allow multiple filter combinations (type + rarity + status)

6.3. WHEN filters are applied THEN the system SHALL:
- Show active filter summary ("Showing X Legendary Skins")
- Provide "Clear All" button when filters active
- Persist filter state during session
- Animate grid items on filter change

6.4. WHEN sort option is selected THEN the system SHALL:
- Reorder grid items according to sort criteria
- Maintain filter state while sorting
- Show sort indicator in dropdown
- Default to "Newest" sort order

6.5. WHEN no items match filters THEN the system SHALL:
- Display empty state with relevant message
- Suggest clearing filters or visiting shop
- Show illustration or icon for empty state

### Requirement 7: Section Organization

**User Story:** As a player, I want the Inventory organized into clear sections, so that I can easily navigate between different parts of my collection.

#### Acceptance Criteria

7.1. WHEN InventorySection renders THEN the system SHALL display:
- Section header with icon, title, subtitle, and optional badge
- Content area with consistent padding (24px)
- Bottom margin (48px) for section separation
- Optional collapse/expand functionality

7.2. WHEN the Inventory page renders THEN the system SHALL organize content into sections:
- Header Section: InventoryHeader with stats and view controls
- Loadout Section: LoadoutPanel with current equipment
- Collection Section: Filtered inventory grid with items
- Empty states handled per section

7.3. WHEN section badges display THEN the system SHALL support variants:
- Default: Indigo background, white text
- Count: Shows item count in section
- New: Emerald background for recently acquired
- Equipped: Green background for equipped section

7.4. WHEN navigating between sections THEN the system SHALL:
- Maintain smooth scroll behavior
- Support keyboard navigation
- Remember scroll position on filter changes
- Auto-scroll to top on major view changes

### Requirement 8: Equip Flow and Animations

**User Story:** As a player, I want satisfying feedback when equipping items, so that managing my loadout feels responsive and engaging.

#### Acceptance Criteria

8.1. WHEN EquipCTA renders THEN the system SHALL support variants:
- Default: Indigo background for equip action
- Equipped: Green background with checkmark, shows "Equipped"
- Unequip: Gray background for unequip action
- Loading: Shows spinner during API call

8.2. WHEN an item is equippable THEN the system SHALL:
- Show "Equip" button on hover or always visible based on size
- Apply hover lift effect (translateY -2px)
- Display slot type hint ("Equip as Skin")

8.3. WHEN equipping an item THEN the system SHALL:
- Show loading state on equip button
- Play success animation on completion
- Update equipped indicator immediately (optimistic)
- Show toast notification ("Skin equipped!")
- Update loadout panel in real-time

8.4. WHEN unequipping an item THEN the system SHALL:
- Show confirmation for accidental unequip prevention (optional)
- Remove equipped indicator with fade animation
- Update loadout panel slot to empty state
- Show toast notification ("Skin unequipped")

### Requirement 9: Responsive and Mobile Experience

**User Story:** As a player on any device, I want the Inventory to work well on mobile, so that I can manage my collection anywhere.

#### Acceptance Criteria

9.1. WHEN viewport is mobile (< 640px) THEN the system SHALL:
- Stack header elements vertically
- Use SM size variant for inventory cards
- Show 2 columns in inventory grid
- Collapse loadout to 3x2 grid
- Use bottom sheet for item details

9.2. WHEN viewport is tablet (640-1024px) THEN the system SHALL:
- Use MD size variant for inventory cards
- Show 3 columns in inventory grid
- Display loadout as 6x1 row
- Use side panel for item details

9.3. WHEN viewport is desktop (> 1024px) THEN the system SHALL:
- Use MD/LG size variants for inventory cards
- Show 4-5 columns in inventory grid
- Display full loadout panel
- Use modal or side panel for item details

9.4. WHEN touch interactions occur THEN the system SHALL:
- Provide minimum 44x44px tap targets on all interactive elements
- Support long-press for quick actions on mobile
- Add touch feedback (opacity change) on tap
- Prevent accidental double-taps with debouncing
