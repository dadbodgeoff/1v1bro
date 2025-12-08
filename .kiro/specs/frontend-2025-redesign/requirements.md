# Requirements Document

## Introduction

This specification defines a comprehensive frontend modernization for the 1v1bro gaming platform, transforming the current implementation into a professional, enterprise-grade 2025 design system. The redesign encompasses:

1. **Unified Design System** - Centralized design tokens, consistent color palette (removing legacy cyan/purple), modern typography, and spacing scales
2. **Component Library Overhaul** - Professional-grade reusable components (buttons, inputs, cards, modals, badges, dropdowns, progress indicators)
3. **Shop Module Redesign** - Conversion-optimized e-commerce experience with featured items, filters, purchase flows, and celebratory animations
4. **Battle Pass Display** - Engaging progression UI with horizontal track, tier cards, XP progress, and reward claiming
5. **Dashboard Polish** - Refined widget styling, empty states, loading skeletons, and smooth transitions

The goal is to achieve a AAA-quality gaming frontend that feels premium, converts users, and maintains accessibility standards.

## Glossary

- **Design_System**: A collection of reusable UI components, design tokens, and patterns that ensure visual consistency across the application
- **Design_Token**: Named entities storing visual design attributes (colors, spacing, typography) as CSS custom properties
- **Component_Library**: The collection of reusable React components exported from `frontend/src/components/ui/`
- **Shop_Module**: The e-commerce component at `frontend/src/pages/Shop.tsx` and `frontend/src/components/cosmetics/`
- **Battle_Pass_Display**: The UI components at `frontend/src/pages/BattlePass.tsx` and `frontend/src/components/battlepass/`
- **Conversion_Rate**: The percentage of users who complete a purchase after viewing shop items
- **Glass_Morphism**: A modern UI design trend using frosted glass effects with `backdrop-filter: blur()` and transparency
- **Skeleton_Loader**: A placeholder UI showing animated shapes matching content layout during loading states
- **Rarity_Gradient**: Color gradients associated with item rarity (common→gray, uncommon→green, rare→blue, epic→purple, legendary→gold)
- **Premium_Track**: Battle pass rewards requiring premium purchase, displayed with gold/amber styling
- **Free_Track**: Battle pass rewards available to all players, displayed with neutral styling

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a unified design system with consistent tokens and patterns, so that the application has a cohesive, professional appearance.

#### Acceptance Criteria

1.1. WHEN the Design_System initializes THEN the system SHALL load design tokens from `frontend/src/styles/tokens.css` including colors, spacing, typography, shadows, borders, and animation durations as CSS custom properties

1.2. WHEN a component renders THEN the component SHALL reference design tokens via CSS variables (e.g., `var(--color-bg-primary)`) rather than hardcoded values

1.3. WHEN the color palette is applied THEN the Design_System SHALL use:
- Background: neutral grays (#0a0a0a base, #111111 cards, #1a1a1a elevated)
- Text: white (#ffffff) primary, neutral-400 (#a3a3a3) secondary, neutral-500 (#737373) muted
- Accent: indigo-500 (#6366f1) primary actions, amber-500 (#f59e0b) premium/gold, emerald-500 (#10b981) success, rose-500 (#f43f5e) errors
- Borders: white/6% (#ffffff0f) subtle, white/10% (#ffffff1a) visible
- NO cyan (#06b6d4) or purple (#a855f7) legacy colors

1.4. WHEN typography is rendered THEN the Design_System SHALL use Inter font family with weights 400 (normal), 500 (medium), 600 (semibold), 700 (bold) and sizes: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)

1.5. WHEN spacing is applied THEN the Design_System SHALL use a 4px base unit scale: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)

1.6. WHEN shadows are applied THEN the Design_System SHALL provide: sm (0 1px 2px), md (0 4px 6px), lg (0 10px 15px), xl (0 20px 25px) with black/25% opacity

1.7. WHEN border radius is applied THEN the Design_System SHALL use: sm (4px), md (8px), lg (12px), xl (16px), 2xl (24px), full (9999px)

### Requirement 2: Core Component Library

**User Story:** As a developer, I want a comprehensive set of reusable UI components, so that I can build consistent interfaces efficiently.

#### Acceptance Criteria

2.1. WHEN a Button component renders THEN the Component_Library SHALL provide variants:
- `primary`: indigo-600 bg, white text, indigo-500 hover
- `secondary`: white/10% bg, white text, white/20% hover
- `ghost`: transparent bg, neutral-400 text, white/5% hover
- `danger`: rose-600 bg, white text, rose-500 hover
- `premium`: amber gradient bg, black text, brighter gradient hover
- All variants SHALL include focus ring, disabled opacity (50%), and loading spinner state

2.2. WHEN an Input component renders THEN the Component_Library SHALL provide:
- Dark background (#111111), subtle border (white/6%), rounded-lg corners
- Label above input with neutral-400 color
- Error state with rose-500 border and error message below
- Optional left/right icon slots
- Focus state with indigo-500 ring

2.3. WHEN a Card component renders THEN the Component_Library SHALL provide:
- Base: #111111 bg, white/6% border, rounded-xl
- Elevated: #1a1a1a bg, white/10% border, shadow-lg
- Glass: backdrop-blur-xl, bg-white/5%, border-white/10%
- Hover variant with subtle lift (-translate-y-1) and border brightening

2.4. WHEN a Modal component renders THEN the Component_Library SHALL provide:
- Centered overlay with backdrop-blur-sm and bg-black/60%
- Content card with scale-in animation (0.95 → 1.0)
- Close button in top-right corner
- Focus trap within modal content
- Escape key to close

2.5. WHEN a Badge component renders THEN the Component_Library SHALL provide rarity variants:
- `common`: neutral-600 bg, neutral-300 text
- `uncommon`: emerald-900/50% bg, emerald-400 text
- `rare`: blue-900/50% bg, blue-400 text
- `epic`: purple-900/50% bg, purple-400 text
- `legendary`: amber-900/50% bg, amber-400 text, optional shimmer animation

2.6. WHEN a Tooltip component renders THEN the Component_Library SHALL display:
- Dark tooltip (#1a1a1a bg) with white text on hover/focus
- Configurable position (top, bottom, left, right)
- Arrow pointing to trigger element
- 200ms delay before showing, instant hide

2.7. WHEN a Select component renders THEN the Component_Library SHALL provide:
- Dropdown trigger matching Input styling
- Options list with hover highlighting
- Selected state with checkmark icon
- Optional search input for filtering
- Keyboard navigation (arrow keys, enter, escape)

2.8. WHEN a Progress component renders THEN the Component_Library SHALL display:
- Linear: rounded track with animated fill, optional percentage label
- Circular: SVG ring with stroke-dasharray animation
- Color variants: default (indigo), success (emerald), warning (amber), premium (gold gradient)

2.9. WHEN a Skeleton component renders THEN the Component_Library SHALL display:
- Shapes: text (rounded-md), circle, rectangle, card
- Animated shimmer effect (left-to-right gradient sweep)
- Matching dimensions to expected content

2.10. WHEN an Icon component renders THEN the Component_Library SHALL provide:
- Size variants: xs (12px), sm (16px), md (20px), lg (24px), xl (32px)
- Color inheritance from parent text color
- Consistent stroke width (1.5 or 2)
- Common icons: play, trophy, shop, inventory, settings, friends, battlepass, coins, xp, lock, check, x, arrow, search

### Requirement 3: Shop Module Redesign

**User Story:** As a player, I want a visually appealing and intuitive shop experience, so that I can easily browse and purchase cosmetics.

#### Acceptance Criteria

3.1. WHEN the Shop_Module displays items THEN the system SHALL render cosmetics in a responsive grid:
- 2 columns on mobile, 3 on tablet, 4 on desktop
- Each card shows: preview image (aspect-square), name, type badge, rarity gradient border, price with coin icon
- Cards use rarity-based gradient backgrounds (subtle, not overwhelming)

3.2. WHEN a user hovers over a shop item THEN the Shop_Module SHALL:
- Scale card to 1.02 with shadow enhancement
- Show "View Details" overlay button
- Display quick-buy button if not owned

3.3. WHEN filtering shop items THEN the Shop_Module SHALL provide:
- Horizontal pill buttons for type filter (All, Skins, Emotes, Banners, etc.)
- Dropdown for rarity filter (All, Common, Uncommon, Rare, Epic, Legendary)
- Active filters highlighted with indigo background
- Filter changes apply instantly without page reload

3.4. WHEN a featured item displays THEN the Shop_Module SHALL render a hero section:
- Full-width card at top of shop
- Large preview image (400px+) with subtle animation/glow
- Item name, description, rarity badge, and price prominently displayed
- "Featured" badge in corner
- If limited: countdown timer showing days/hours/minutes remaining

3.5. WHEN the purchase flow initiates THEN the Shop_Module SHALL display a confirmation modal:
- Item preview image centered
- Item name, type, and rarity
- Price breakdown (coins required, current balance, balance after)
- "Confirm Purchase" primary button, "Cancel" ghost button
- Insufficient funds state with "Get Coins" CTA

3.6. WHEN a purchase completes THEN the Shop_Module SHALL:
- Close confirmation modal
- Display success toast with item name
- Play confetti/particle animation (rarity-appropriate intensity)
- Update owned status on card immediately
- Show "View in Inventory" link

3.7. WHEN displaying owned items THEN the Shop_Module SHALL:
- Show green "Owned" badge with checkmark overlay
- Disable purchase button
- Reduce card opacity slightly (0.8)
- Allow click to view item details but not purchase

3.8. WHEN the shop loads THEN the Shop_Module SHALL display:
- Skeleton cards matching grid layout (8-12 cards)
- Skeleton for featured section
- Skeleton for filter pills
- Shimmer animation on all skeletons

3.9. WHEN a limited-time item displays THEN the Shop_Module SHALL show:
- "Limited" badge with pulsing red dot
- Countdown timer (if < 7 days remaining)
- "Ending Soon" warning if < 24 hours
- Different border treatment (amber/gold glow)

3.10. WHEN sorting shop items THEN the Shop_Module SHALL provide dropdown with:
- "Featured" (default - featured items first)
- "Price: Low to High"
- "Price: High to Low"
- "Newest First"
- "Rarity: Common to Legendary"
- "Rarity: Legendary to Common"

### Requirement 4: Battle Pass Display Redesign

**User Story:** As a player, I want an engaging battle pass interface, so that I can track my progress and claim rewards efficiently.

#### Acceptance Criteria

4.1. WHEN the Battle_Pass_Display renders THEN the system SHALL show:
- Season header with name, theme image, and days remaining countdown
- XP progress bar showing current tier progress (currentXP / xpToNextTier)
- Horizontal scrollable track with tier cards (snap-scroll behavior)
- Current tier indicator (larger card, glow effect)

4.2. WHEN displaying tier rewards THEN the Battle_Pass_Display SHALL show two rows:
- Top row: Premium rewards with amber/gold gradient background, lock icon if not premium
- Bottom row: Free rewards with neutral background
- Each tier card shows: tier number, reward icon/preview, reward type label
- Visual connector line between tiers showing progression

4.3. WHEN a reward is claimable THEN the Battle_Pass_Display SHALL:
- Add pulsing glow effect to tier card (emerald for free, amber for premium)
- Show "Claim" button overlaid on reward
- Display notification dot on tier number
- Animate attention-grabbing effect (subtle bounce or shimmer)

4.4. WHEN claiming a reward THEN the Battle_Pass_Display SHALL:
- Play reveal animation (card flip or expand)
- Show reward details in modal/overlay
- Display particle effects (rarity-appropriate)
- Update claimed status with checkmark
- Show "+[reward]" toast notification

4.5. WHEN displaying XP progress THEN the Battle_Pass_Display SHALL show:
- Current tier number prominently (e.g., "Tier 15")
- XP bar with gradient fill (indigo to purple)
- Text showing "1,234 / 2,000 XP" format
- Percentage label on progress bar
- "+XP" animation when XP is earned

4.6. WHEN the premium upsell displays THEN the Battle_Pass_Display SHALL show:
- Banner/card for non-premium users
- Preview of 3-5 locked premium rewards (blurred/locked)
- "Upgrade to Premium" CTA button with amber styling
- Price and value proposition text
- Dismissible but persistent across sessions until purchased

4.7. WHEN the season info displays THEN the Battle_Pass_Display SHALL show:
- Season name (e.g., "Season 3: Neon Nights")
- Theme artwork/banner image
- Days remaining with countdown (DD:HH:MM if < 7 days)
- "Season Ending Soon" warning if < 3 days

4.8. WHEN navigating tiers THEN the Battle_Pass_Display SHALL:
- Auto-scroll to current tier on page load
- Support left/right arrow key navigation
- Support click/tap to scroll to specific tier
- Show scroll indicators (arrows) when more content exists
- Smooth scroll animation (300ms ease-out)

4.9. WHEN a tier is locked THEN the Battle_Pass_Display SHALL display:
- Reduced opacity (0.5) on tier card
- Lock icon overlay
- "Tier X" label showing tier number
- XP required tooltip on hover
- No claim button visible

4.10. WHEN displaying reward types THEN the Battle_Pass_Display SHALL use distinct styling:
- Coins: gold coin icon, amber text
- XP Boost: lightning bolt icon, purple text
- Cosmetic: item preview image, rarity border
- Title: scroll/badge icon, white text with preview

### Requirement 5: Dashboard and Layout Modernization

**User Story:** As a player, I want a clean, modern dashboard experience, so that I can navigate the game efficiently.

#### Acceptance Criteria

5.1. WHEN the dashboard renders THEN the system SHALL display:
- #0a0a0a base background
- Sidebar on left (collapsible on mobile)
- Header at top with user info
- Main content area with max-width container (1280px)
- Consistent 24px padding on content area

5.2. WHEN the sidebar renders THEN the system SHALL show:
- Navigation items with icon + label
- Active item with indigo-500 left border and bg-white/5%
- Hover state with bg-white/5%
- Collapse to icon-only on mobile/tablet
- Smooth width transition (200ms)
- User avatar at bottom with settings access

5.3. WHEN widgets render THEN the system SHALL use:
- #111111 background with white/6% border
- rounded-xl corners (16px)
- Consistent padding (20px)
- Widget title in neutral-400, 14px, font-medium
- Content in white, appropriate sizes
- No cyan, purple, or harsh accent colors

5.4. WHEN the header renders THEN the system SHALL display:
- User avatar (32px, rounded-full) with online indicator
- Display name and rank badge
- Coin balance with coin icon
- Notification bell with unread count badge
- Settings gear icon
- All items clickable with appropriate navigation

5.5. WHEN empty states display THEN the system SHALL show:
- Relevant illustration or icon (64px, neutral-600)
- Descriptive text explaining the empty state
- Primary action button to resolve (e.g., "Play a Match", "Add Friends")
- Consistent styling across all empty states

5.6. WHEN loading states occur THEN the system SHALL display:
- Skeleton loaders matching expected content shape
- Shimmer animation (1.5s duration, infinite)
- Appropriate number of skeleton items
- No layout shift when content loads

5.7. WHEN transitions occur THEN the system SHALL use:
- 200ms for micro-interactions (hover, focus)
- 300ms for component state changes (expand, collapse)
- ease-out timing function for most animations
- No jarring or instant transitions

### Requirement 6: Responsive and Accessibility

**User Story:** As a player on any device, I want the interface to be accessible and responsive, so that I can use the platform comfortably.

#### Acceptance Criteria

6.1. WHEN the viewport changes THEN the system SHALL adapt layouts:
- Mobile (< 640px): Single column, collapsed sidebar, stacked widgets
- Tablet (640-1024px): Two columns, icon-only sidebar, responsive grid
- Desktop (> 1024px): Full layout, expanded sidebar, optimal grid

6.2. WHEN using keyboard navigation THEN the system SHALL:
- Provide visible focus ring (2px indigo-500) on all interactive elements
- Maintain logical tab order (left-to-right, top-to-bottom)
- Support Enter/Space for activation, Escape for dismissal
- Trap focus within modals when open

6.3. WHEN screen readers access content THEN the system SHALL:
- Use semantic HTML (button, nav, main, article, etc.)
- Provide aria-label for icon-only buttons
- Use aria-live regions for dynamic content updates
- Include alt text for all meaningful images

6.4. WHEN color conveys meaning THEN the system SHALL:
- Include icons alongside color indicators (checkmark for success, X for error)
- Use text labels in addition to color badges
- Maintain 4.5:1 contrast ratio for text
- Provide patterns/textures for rarity in addition to color

6.5. WHEN touch interactions occur THEN the system SHALL:
- Provide minimum 44x44px tap targets
- Add appropriate touch feedback (opacity change)
- Support swipe gestures for horizontal scrolling
- Prevent accidental double-taps with debouncing

### Requirement 7: Animation and Polish

**User Story:** As a player, I want smooth, delightful interactions, so that the interface feels premium and responsive.

#### Acceptance Criteria

7.1. WHEN buttons are clicked THEN the system SHALL:
- Apply scale(0.98) transform on mousedown
- Return to scale(1) on mouseup
- Transition duration 100ms
- Provide visual feedback within 50ms of interaction

7.2. WHEN cards are hovered THEN the system SHALL:
- Apply translateY(-2px) lift effect
- Enhance shadow (shadow-lg → shadow-xl)
- Brighten border (white/6% → white/10%)
- Transition duration 200ms ease-out

7.3. WHEN modals open THEN the system SHALL:
- Fade in backdrop (0 → 60% opacity) over 200ms
- Scale content from 0.95 → 1.0 over 200ms
- Apply backdrop-blur-sm to background
- Reverse animation on close

7.4. WHEN notifications/toasts appear THEN the system SHALL:
- Slide in from top-right corner
- Auto-dismiss after 3-5 seconds (configurable)
- Support manual dismiss with X button
- Stack multiple notifications with 8px gap

7.5. WHEN purchases complete THEN the system SHALL:
- Display confetti/particle burst animation
- Particle count based on rarity (common: 20, legendary: 100)
- Animation duration 1-2 seconds
- Particles use rarity-appropriate colors

7.6. WHEN page transitions occur THEN the system SHALL:
- Fade out old content (150ms)
- Fade in new content (150ms)
- Maintain scroll position where appropriate
- Show loading indicator if data fetch required
