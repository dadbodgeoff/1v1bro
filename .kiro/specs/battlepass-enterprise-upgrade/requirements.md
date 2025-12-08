# Requirements Document

## Introduction

This specification defines a comprehensive enterprise-grade upgrade for the Battle Pass experience in the 1v1bro gaming platform. The redesign transforms the current Battle Pass implementation into a AAA-quality progression system that matches the enterprise standards established in the Item Shop redesign.

The upgrade encompasses:

1. **Enterprise Component Architecture** - New enterprise-grade components in `frontend/src/components/battlepass/enterprise/` following the same patterns as the Shop enterprise components
2. **Typography Hierarchy System** - Consistent H1→H4 hierarchy with proper font weights, sizes, and tracking across all Battle Pass elements
3. **Reward Display System** - Configurable size variants (xl/lg/md/sm) for reward cards with rarity theming, borders, and glows matching ItemDisplayBox patterns
4. **Progress Visualization** - Enhanced XP progress bars, tier indicators, and season countdown displays with premium visual treatment
5. **Premium Track Experience** - Gold/amber themed premium rewards with conversion-optimized upsell components and urgency CTAs
6. **Section Organization** - Clear visual hierarchy with section headers, dividers, and consistent spacing following ShopSection patterns

The goal is to achieve visual and functional parity with the enterprise Item Shop, creating a cohesive premium experience across the platform's monetization surfaces.

## Glossary

- **Battle_Pass_System**: The progression system at `frontend/src/pages/BattlePass.tsx` and `frontend/src/components/battlepass/`
- **Enterprise_Component**: A component following the enterprise architecture pattern established in `frontend/src/components/shop/enterprise/`
- **Reward_Display_Box**: A configurable component for displaying Battle Pass rewards with size variants and rarity theming
- **Typography_Hierarchy**: The systematic organization of text elements from H1 (page title) through body text with consistent sizing and weights
- **Premium_Track**: The upper row of Battle Pass rewards requiring premium purchase, styled with gold/amber theming
- **Free_Track**: The lower row of Battle Pass rewards available to all players, styled with neutral theming
- **Tier_Card**: Individual tier display showing tier number, free reward, and premium reward
- **XP_Progress_Section**: The combined display of current tier, XP bar, and progress statistics
- **Season_Header**: The hero section displaying season name, theme, artwork, and countdown timer
- **Urgency_CTA**: Call-to-action buttons with time-sensitive styling to drive conversions
- **Rarity_Theming**: Visual styling (borders, glows, gradients) based on reward rarity (common, uncommon, rare, epic, legendary)
- **Size_Config**: Standardized configuration object defining dimensions, typography, and spacing for component size variants

## Requirements

### Requirement 1: Enterprise Component Architecture

**User Story:** As a developer, I want Battle Pass components organized in an enterprise architecture, so that the codebase maintains consistency with the Shop module and enables scalable development.

#### Acceptance Criteria

1.1. WHEN the Battle_Pass_System initializes THEN the system SHALL load enterprise components from `frontend/src/components/battlepass/enterprise/` directory

1.2. WHEN enterprise components are created THEN each component SHALL include a JSDoc header documenting:
- Component purpose and features
- Size variants and their specifications
- Typography hierarchy per size
- Props interface with descriptions

1.3. WHEN the enterprise directory is structured THEN the system SHALL contain:
- `BattlePassHeader.tsx` - Page header with season info, XP display, and countdown
- `RewardDisplayBox.tsx` - Configurable size display for rewards with rarity theming
- `ProgressSection.tsx` - Combined tier badge, XP bar, and statistics display
- `TrackSection.tsx` - Section container with title, subtitle, and content area
- `TierIndicator.tsx` - Individual tier number display with state styling
- `ClaimCTA.tsx` - Conversion-optimized claim buttons with variants
- `index.ts` - Barrel export file for all enterprise components

1.4. WHEN components are exported THEN the barrel file SHALL export all enterprise components for clean imports: `import { BattlePassHeader, RewardDisplayBox, ... } from '@/components/battlepass/enterprise'`

### Requirement 2: Typography Hierarchy System

**User Story:** As a player, I want clear visual hierarchy in the Battle Pass interface, so that I can quickly understand my progress and available rewards.

#### Acceptance Criteria

2.1. WHEN the BattlePassHeader renders THEN the system SHALL display:
- H1: Season name in 4xl-5xl (36-48px) extrabold with gradient text (indigo→purple or seasonal theme)
- Subtitle: Season theme in sm (14px) medium weight, muted color, uppercase tracking-wider
- Gradient bar: 1.5px height accent bar below title matching Shop header pattern

2.2. WHEN TrackSection headers render THEN the system SHALL display:
- H2: Section title in 2xl-3xl (24-30px) bold with tight tracking
- Subtitle: Section description in sm (14px) medium weight, muted color
- Icon: 12x12 (48px) icon container with gradient background matching section theme

2.3. WHEN RewardDisplayBox renders THEN the system SHALL use size-specific typography:
- XL: 28px extrabold title, 12px uppercase type label, 14px description
- LG: 22px bold title, 11px uppercase type label, 13px description
- MD: 16px bold title, 10px uppercase type label, no description
- SM: 14px semibold title, no type label, no description

2.4. WHEN tier numbers display THEN the system SHALL use:
- Current tier: 2xl (24px) extrabold, white text, accent background with glow
- Unlocked tiers: lg (18px) bold, white text, elevated background
- Locked tiers: lg (18px) semibold, muted text, subtle background

2.5. WHEN XP statistics display THEN the system SHALL use:
- Current XP value: xl (20px) bold, white text, tabular-nums
- Total XP required: base (16px) medium, secondary text
- Percentage: sm (14px) semibold, white text on progress bar

### Requirement 3: Reward Display System

**User Story:** As a player, I want visually appealing reward displays that clearly show what I can earn, so that I'm motivated to progress through the Battle Pass.

#### Acceptance Criteria

3.1. WHEN RewardDisplayBox renders THEN the system SHALL support size variants with uniform specifications:
- XL: 420px min-height, 240px image, used for featured/current tier rewards
- LG: 200px min-height, 160px image, used for spotlight rewards
- MD: 280px min-height, 120px image, used for standard tier display
- SM: 180px min-height, 80px image, used for compact track view

3.2. WHEN a reward has rarity THEN the RewardDisplayBox SHALL apply rarity theming:
- Border: 2px solid with rarity color at 40% opacity (legendary at 50%)
- Glow: Hover shadow with rarity color (0_0_30px for common→epic, 0_0_40px for legendary)
- Background: Gradient from rarity color at 5-15% opacity to transparent
- Badge: Rarity badge with shimmer animation for legendary items

3.3. WHEN displaying reward content THEN the RewardDisplayBox SHALL show:
- Reward preview image or icon centered in image area
- Reward name with size-appropriate typography
- Reward type label (Coins, XP Boost, Cosmetic, Title) in uppercase
- Claim status indicator (locked, claimable, claimed)

3.4. WHEN a reward is a cosmetic THEN the system SHALL display:
- Preview image from cosmetic.image_url or cosmetic.shop_preview_url
- Cosmetic name as reward title
- "COSMETIC" type label
- Rarity badge matching cosmetic rarity

3.5. WHEN a reward is currency (coins/XP) THEN the system SHALL display:
- Appropriate icon (coin icon for coins, lightning for XP boost)
- Formatted value (e.g., "500 Coins", "2x XP Boost")
- Gold theming for coins, purple theming for XP

### Requirement 4: Progress Visualization

**User Story:** As a player, I want clear visualization of my Battle Pass progress, so that I understand how close I am to the next reward.

#### Acceptance Criteria

4.1. WHEN ProgressSection renders THEN the system SHALL display:
- Tier badge: Current tier number in prominent display with accent styling
- XP bar: Gradient fill (indigo→purple) with percentage label
- Statistics: "currentXP / xpToNextTier XP" with "X XP to Tier Y" hint
- All elements using tabular-nums for aligned number display

4.2. WHEN the XP bar renders THEN the system SHALL:
- Use 12px height track with elevated background and subtle border
- Apply gradient fill matching design system (--gradient-xp)
- Display percentage label positioned at fill edge
- Animate fill changes with 500ms ease-out transition

4.3. WHEN tier progress displays THEN the system SHALL show:
- Visual connector line between tiers showing progression
- Filled portion in accent color up to current tier
- Unfilled portion in subtle border color
- Current tier indicator with scale(1.1) and glow effect

4.4. WHEN season countdown displays THEN the system SHALL show:
- Days/Hours/Minutes in separate boxes with labels
- Seconds displayed only when < 1 day remaining
- "Ending Soon" warning badge when < 3 days remaining
- Pulsing animation on warning badge

### Requirement 5: Premium Track Experience

**User Story:** As a player considering premium, I want the premium rewards to look valuable and desirable, so that I'm motivated to upgrade.

#### Acceptance Criteria

5.1. WHEN premium rewards display THEN the system SHALL apply premium theming:
- Background: Gradient from amber-500/20 to orange-500/20
- Border: 2px solid amber-500/30
- Glow: Hover shadow with amber color (0_0_30px_rgba(245,158,11,0.3))
- Crown icon badge indicating premium status

5.2. WHEN a premium reward is locked (user not premium) THEN the system SHALL:
- Display lock icon overlay centered on reward
- Apply bg-black/60 overlay on reward content
- Show "Premium" label with crown icon
- Reduce content opacity to 60%

5.3. WHEN PremiumUpsell renders THEN the system SHALL display:
- Gradient background (amber-500/10 → orange-500/10)
- "Premium Pass" badge with crown icon
- Headline: "Unlock Premium Rewards" in 2xl bold
- Value proposition text describing benefits
- Preview of 3-5 locked premium rewards with lock overlays
- "Upgrade for X Coins" CTA button with premium variant styling

5.4. WHEN premium CTA buttons render THEN the system SHALL use:
- Gradient background (amber-500 → orange-500)
- Black text for contrast
- Hover: Brighter gradient (amber-400 → orange-400)
- Shadow: shadow-lg with amber glow on hover

### Requirement 6: Section Organization

**User Story:** As a player, I want the Battle Pass organized into clear sections, so that I can easily navigate between different parts of the experience.

#### Acceptance Criteria

6.1. WHEN TrackSection renders THEN the system SHALL display:
- Section header with icon, title, subtitle, and optional badge
- Content area with consistent padding (24px)
- Bottom margin (48px) for section separation
- Optional countdown timer for time-sensitive sections

6.2. WHEN the Battle Pass page renders THEN the system SHALL organize content into sections:
- Hero Section: BattlePassHeader with season info and XP progress
- Current Progress Section: Current tier highlight with claim CTA
- Rewards Track Section: Horizontal scrollable tier track
- Premium Upsell Section: (if not premium) Upgrade CTA with reward previews

6.3. WHEN section badges display THEN the system SHALL support variants:
- Default: Indigo background, white text
- Hot: Orange→red gradient, white text, shadow
- New: Emerald background, white text
- Limited: Rose background, white text, pulse animation
- Premium: Amber background, black text, crown icon

6.4. WHEN navigating between sections THEN the system SHALL:
- Maintain smooth scroll behavior
- Highlight current section in any navigation
- Support keyboard navigation between sections
- Auto-scroll to current tier section on page load

### Requirement 7: Claim Flow and Animations

**User Story:** As a player, I want satisfying feedback when claiming rewards, so that progression feels rewarding and engaging.

#### Acceptance Criteria

7.1. WHEN ClaimCTA renders THEN the system SHALL support variants:
- Default: Indigo background for standard claims
- Premium: Amber gradient for premium reward claims
- Claimed: Emerald background with checkmark, disabled state
- Locked: Gray background with lock icon, disabled state

7.2. WHEN a reward is claimable THEN the system SHALL:
- Apply pulsing glow effect (emerald for free, amber for premium)
- Show "Claim" button overlaid on reward
- Display notification dot on tier indicator
- Add subtle bounce animation to draw attention

7.3. WHEN claiming a reward THEN the system SHALL:
- Show loading state on claim button
- Play success animation on completion
- Display confetti burst (rarity-appropriate intensity)
- Update claimed status with checkmark overlay
- Show "+[reward]" toast notification

7.4. WHEN a reward is claimed THEN the system SHALL display:
- Green checkmark overlay centered on reward
- "Claimed" badge replacing claim button
- Reduced opacity (85%) on reward card
- No hover effects or click handlers

### Requirement 8: Responsive and Mobile Experience

**User Story:** As a player on any device, I want the Battle Pass to work well on mobile, so that I can check my progress anywhere.

#### Acceptance Criteria

8.1. WHEN viewport is mobile (< 640px) THEN the system SHALL:
- Stack header elements vertically
- Use SM size variant for tier cards in track
- Show 2-3 visible tiers with horizontal scroll
- Collapse XP statistics to essential info only

8.2. WHEN viewport is tablet (640-1024px) THEN the system SHALL:
- Use MD size variant for tier cards
- Show 4-5 visible tiers with horizontal scroll
- Display full XP statistics

8.3. WHEN viewport is desktop (> 1024px) THEN the system SHALL:
- Use LG/XL size variants for featured content
- Show 6-8 visible tiers with horizontal scroll
- Display full layout with all statistics and previews

8.4. WHEN touch interactions occur THEN the system SHALL:
- Provide minimum 44x44px tap targets on all interactive elements
- Support swipe gestures for track scrolling
- Add touch feedback (opacity change) on tap
- Prevent accidental double-taps with debouncing

