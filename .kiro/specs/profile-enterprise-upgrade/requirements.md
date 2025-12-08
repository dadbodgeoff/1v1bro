# Requirements Document

## Introduction

This specification defines a comprehensive enterprise-grade upgrade for the Profile experience in the 1v1bro gaming platform. The redesign transforms the current basic Profile implementation into a AAA-quality player identity system that matches the enterprise standards established in the Item Shop, Battle Pass, and Inventory redesigns.

**IMPORTANT: Unified Progression System**
The Profile upgrade unifies the player progression system with the Battle Pass system. The Battle Pass tier IS the player's level, and Battle Pass XP IS the player's XP. This ensures:
- Single source of truth for player progression
- No drift between profile level and battle pass tier
- Consistent XP display across all surfaces
- Simplified data model and reduced complexity

The upgrade encompasses:

1. **Enterprise Component Architecture** - New enterprise-grade components in `frontend/src/components/profile/enterprise/` following the same patterns as the Shop, Battle Pass, and Inventory enterprise components
2. **Typography Hierarchy System** - Consistent H1→H4 hierarchy with proper font weights, sizes, and tracking across all Profile elements
3. **Profile Header System** - Enhanced banner display with gradient overlays, avatar with tier ring (showing Battle Pass tier), and player identity section
4. **Unified Progression Display** - Battle Pass tier displayed as player level, with XP progress to next tier
5. **Statistics Dashboard** - Visual statistics cards showing games played, wins, win rate, current tier/level, season XP, and achievements
6. **Match History Section** - Recent match results with opponent info, outcome indicators, and XP earned
7. **Equipped Loadout Preview** - Visual display of currently equipped cosmetics with rarity theming
8. **Social Links Section** - Styled social media links with platform icons and hover effects
9. **Edit Mode Enhancement** - Improved profile editor with enterprise form styling and real-time preview
10. **Achievement Showcase** - Display of earned achievements and badges with rarity styling

The goal is to achieve visual and functional parity with the enterprise Item Shop, Battle Pass, and Inventory, creating a cohesive premium experience across the platform's player identity surfaces.

## Glossary

- **Profile_System**: The player identity system at `frontend/src/pages/Profile.tsx` and `frontend/src/components/profile/`
- **Enterprise_Component**: A component following the enterprise architecture pattern established in `frontend/src/components/shop/enterprise/`
- **Profile_Header**: The top section displaying banner, avatar, name, title, and tier/level
- **Stats_Card**: A visual card displaying a single statistic with value, label, and optional trend indicator
- **Stats_Dashboard**: A grid of Stats_Cards showing player performance metrics
- **Tier_Ring**: A circular progress indicator around the avatar showing XP progress to next Battle Pass tier (unified with player level)
- **Battle_Pass_Tier**: The player's current tier in the active Battle Pass season - this IS the player's level
- **Season_XP**: The player's total XP earned in the current season - this IS the player's XP
- **Match_History_Item**: A single row displaying match result with opponent, outcome, and XP
- **Loadout_Preview**: A horizontal display of equipped cosmetics with slot icons
- **Social_Link_Button**: A styled button for external social media links
- **Achievement_Badge**: A visual badge displaying an earned achievement with rarity styling
- **Profile_Editor**: The form interface for editing profile information
- **Typography_Hierarchy**: The systematic organization of text elements from H1 (player name) through body text with consistent sizing and weights
- **Rarity_Theming**: Visual styling (borders, glows, gradients) based on item rarity (common, uncommon, rare, epic, legendary)
- **Unified_Progression**: The merged system where Battle Pass tier = player level and Battle Pass XP = player XP

## Requirements

### Requirement 1: Enterprise Component Architecture

**User Story:** As a developer, I want Profile components organized in an enterprise architecture, so that the codebase maintains consistency with the Shop, Battle Pass, and Inventory modules and enables scalable development.

#### Acceptance Criteria

1.1. WHEN the Profile_System initializes THEN the system SHALL load enterprise components from `frontend/src/components/profile/enterprise/` directory

1.2. WHEN enterprise components are created THEN each component SHALL include a JSDoc header documenting:
- Component purpose and features
- Size variants and their specifications (where applicable)
- Typography hierarchy per size
- Props interface with descriptions

1.3. WHEN the enterprise directory is structured THEN the system SHALL contain:
- `ProfileHeader.tsx` - Enhanced header with banner, avatar, level ring, and identity info
- `StatsCard.tsx` - Individual statistic display with value, label, and optional trend
- `StatsDashboard.tsx` - Grid of stats cards with responsive layout
- `MatchHistoryItem.tsx` - Single match result row with opponent and outcome
- `MatchHistorySection.tsx` - Section container for match history list
- `LoadoutPreview.tsx` - Horizontal equipped cosmetics display
- `SocialLinkButton.tsx` - Styled social media link button
- `AchievementBadge.tsx` - Achievement display with rarity styling
- `ProfileSection.tsx` - Section container with title, subtitle, and content area
- `ProfileEditor.tsx` - Enhanced profile edit form with enterprise styling
- `index.ts` - Barrel export file for all enterprise components

1.4. WHEN components are exported THEN the barrel file SHALL export all enterprise components for clean imports: `import { ProfileHeader, StatsDashboard, ... } from '@/components/profile/enterprise'`

### Requirement 2: Typography Hierarchy System

**User Story:** As a player, I want clear visual hierarchy in the Profile interface, so that I can quickly understand my identity and stats.

#### Acceptance Criteria

2.1. WHEN the ProfileHeader renders THEN the system SHALL display:
- H1: Player display name in 3xl-4xl (30-36px) extrabold with white text
- Title: Player title in sm (14px) medium weight, accent color (indigo-400)
- Level badge: "Level X" in sm (14px) bold, white text on indigo background
- Country flag: Emoji flag with tooltip showing country name

2.2. WHEN ProfileSection headers render THEN the system SHALL display:
- H2: Section title in xl-2xl (20-24px) bold with tight tracking
- Subtitle: Section description in sm (14px) medium weight, muted color
- Icon: 10x10 (40px) icon container with gradient background matching section theme

2.3. WHEN StatsCard renders THEN the system SHALL use:
- Value: 2xl-3xl (24-30px) bold, white text, tabular-nums for numbers
- Label: xs-sm (12-14px) medium, muted color, uppercase tracking-wider
- Trend: xs (12px) semibold, green for positive, red for negative

2.4. WHEN MatchHistoryItem renders THEN the system SHALL use:
- Opponent name: base (16px) medium, white text
- Outcome: sm (14px) bold, green for win, red for loss
- XP earned: sm (14px) medium, accent color
- Date: xs (12px) regular, muted color

2.5. WHEN bio text displays THEN the system SHALL use:
- Bio: base (16px) regular, gray-300 text, max 3 lines with ellipsis overflow

### Requirement 3: Profile Header System (Unified Progression)

**User Story:** As a player, I want an impressive profile header that showcases my identity and Battle Pass progression, so that my profile feels premium and shows my current season progress.

#### Acceptance Criteria

3.1. WHEN ProfileHeader renders THEN the system SHALL display:
- Banner: Full-width banner image or solid color (256px height on desktop, 160px on mobile)
- Gradient overlay: Bottom gradient from transparent to dark for text readability
- Avatar: 120px circular avatar with 4px border in card background color
- Tier ring: Circular progress indicator around avatar showing XP to next Battle Pass tier
- Edit button: Positioned top-right on own profile with hover effect

3.2. WHEN the banner has an image THEN the system SHALL:
- Display image with object-cover and center positioning
- Apply gradient overlay from transparent to rgba(0,0,0,0.7) at bottom
- Support parallax scroll effect on desktop (optional)

3.3. WHEN the banner has no image THEN the system SHALL:
- Display solid color from profile.banner_color
- Default to dark indigo (#1a1a2e) if no color set
- Apply subtle gradient overlay for consistency

3.4. WHEN the tier ring displays THEN the system SHALL:
- Fetch current Battle Pass progress (current_tier, current_xp, xp_to_next_tier)
- Show circular progress from 0-100% based on current_xp / xp_to_next_tier
- Use indigo-500 for progress fill, gray-700 for background track
- Display tier number in center of avatar on hover
- Animate progress on initial load
- Show "Tier X" badge below avatar

3.5. WHEN the avatar displays THEN the system SHALL:
- Show 120px circular image with border
- Apply hover scale effect (1.05x)
- Show camera icon overlay on own profile for upload hint
- Support click to upload new avatar on own profile

3.6. WHEN no active Battle Pass season exists THEN the system SHALL:
- Display tier ring at 0% progress
- Show "No Active Season" indicator
- Hide tier badge or show "—"

### Requirement 4: Statistics Dashboard (Unified Progression)

**User Story:** As a player, I want to see my performance statistics including my Battle Pass progression in a visually appealing dashboard, so that I can track my progress and achievements.

#### Acceptance Criteria

4.1. WHEN StatsDashboard renders THEN the system SHALL display:
- 4-6 StatsCards in responsive grid (2 columns mobile, 3-4 columns desktop)
- Cards for: Games Played, Wins, Win Rate, Current Tier (from Battle Pass), Season XP (from Battle Pass), Best Streak
- Consistent card sizing and spacing (16px gap)

4.2. WHEN StatsCard renders THEN the system SHALL:
- Display value prominently with size-appropriate typography
- Show label below value in muted uppercase text
- Apply card background with subtle border
- Add hover lift effect (translateY -2px, shadow enhancement)

4.3. WHEN displaying win rate THEN the system SHALL:
- Calculate percentage from games_won / games_played
- Display as "XX%" with one decimal place
- Color code: green (>60%), yellow (40-60%), red (<40%)
- Show "N/A" if no games played

4.4. WHEN displaying tier progress THEN the system SHALL:
- Fetch Battle Pass progress (current_tier, current_xp, xp_to_next_tier)
- Show current tier as primary value with "Tier" prefix
- Display XP progress bar below (current_xp / xp_to_next_tier)
- Show "X XP to Tier Y" as subtitle
- Apply indigo gradient to progress bar
- Link to Battle Pass page on click

4.5. WHEN displaying season XP THEN the system SHALL:
- Fetch total_xp from Battle Pass progress
- Format large numbers with compact notation (12.5k)
- Show season name in tooltip ("Season 1: Elemental Warriors")

4.6. WHEN a stat has trend data THEN the system SHALL:
- Display trend indicator (↑ or ↓) with percentage change
- Color green for positive trends, red for negative
- Show trend period ("vs last week") in tooltip

4.7. WHEN no active Battle Pass season exists THEN the system SHALL:
- Show "—" for tier and season XP values
- Display "No Active Season" message
- Hide progress bars

### Requirement 5: Match History Section

**User Story:** As a player, I want to see my recent match history, so that I can review my performance and opponents.

#### Acceptance Criteria

5.1. WHEN MatchHistorySection renders THEN the system SHALL display:
- Section header with "Recent Matches" title and match count badge
- List of 5-10 most recent matches
- "View All" link if more matches exist
- Empty state if no matches played

5.2. WHEN MatchHistoryItem renders THEN the system SHALL display:
- Opponent avatar (40px) and display name
- Match outcome badge (WIN/LOSS) with appropriate color
- XP earned from match with icon
- Relative timestamp ("2 hours ago", "Yesterday")
- Hover effect with background highlight

5.3. WHEN a match was won THEN the system SHALL:
- Display "WIN" badge with green background (#10b981)
- Show positive XP with "+" prefix
- Apply subtle green left border accent

5.4. WHEN a match was lost THEN the system SHALL:
- Display "LOSS" badge with red background (#ef4444)
- Show XP earned (still positive, no prefix)
- Apply subtle red left border accent

5.5. WHEN match history is loading THEN the system SHALL:
- Display skeleton items with shimmer animation
- Show 5 skeleton rows matching item height
- Maintain layout stability during load

### Requirement 6: Equipped Loadout Preview

**User Story:** As a player, I want to see my currently equipped cosmetics on my profile, so that visitors can see my style.

#### Acceptance Criteria

6.1. WHEN LoadoutPreview renders THEN the system SHALL display:
- Horizontal row of 6 equipped cosmetic slots
- Each slot showing: slot icon, item preview, item name
- Empty slots with placeholder styling
- "Customize" link to inventory page

6.2. WHEN a slot has an equipped item THEN the system SHALL:
- Display item preview image (64px)
- Apply rarity border color to slot
- Show item name below preview (truncated)
- Add rarity glow on hover

6.3. WHEN a slot is empty THEN the system SHALL:
- Display slot type icon at 50% opacity
- Show "Empty" label in muted text
- Apply dashed border styling
- No hover effect on empty slots

6.4. WHEN displaying on mobile THEN the system SHALL:
- Show 3 slots per row (2 rows total)
- Reduce preview size to 48px
- Maintain touch-friendly tap targets (44px minimum)

### Requirement 7: Social Links Section

**User Story:** As a player, I want to display my social media links on my profile, so that others can connect with me.

#### Acceptance Criteria

7.1. WHEN SocialLinkButton renders THEN the system SHALL display:
- Platform icon (Twitter, Twitch, YouTube, Discord)
- Platform name or username
- External link indicator for URLs
- Hover effect with platform brand color

7.2. WHEN social links exist THEN the system SHALL:
- Display buttons in horizontal row with wrap
- Order: Twitter, Twitch, YouTube, Discord
- Hide platforms with no link set
- Show "Add Social Links" prompt if all empty on own profile

7.3. WHEN a social link is clicked THEN the system SHALL:
- Open URL in new tab for Twitter, Twitch, YouTube
- Copy Discord username to clipboard with toast notification
- Track click for analytics (optional)

7.4. WHEN displaying platform icons THEN the system SHALL:
- Use official platform colors on hover
- Twitter: #1DA1F2, Twitch: #9146FF, YouTube: #FF0000, Discord: #5865F2
- Default to muted gray when not hovered

### Requirement 8: Profile Editor Enhancement

**User Story:** As a player, I want an improved profile editor with real-time preview, so that I can easily customize my profile.

#### Acceptance Criteria

8.1. WHEN ProfileEditor renders THEN the system SHALL display:
- Split layout: form on left, live preview on right (desktop)
- Stacked layout: form above preview (mobile)
- Enterprise-styled form inputs with labels
- Save and Cancel buttons with loading states

8.2. WHEN editing display name THEN the system SHALL:
- Show character count (X/30)
- Validate minimum 3 characters
- Update preview in real-time
- Show error state for invalid input

8.3. WHEN editing bio THEN the system SHALL:
- Show character count (X/500)
- Support multi-line input (textarea)
- Update preview in real-time
- Show remaining characters when near limit

8.4. WHEN uploading avatar/banner THEN the system SHALL:
- Show upload progress indicator
- Display preview of selected image before confirm
- Validate file type (JPEG, PNG, WebP) and size (<5MB)
- Show error message for invalid files

8.5. WHEN form has unsaved changes THEN the system SHALL:
- Show "Unsaved changes" indicator
- Prompt confirmation on navigation away
- Enable Save button only when changes exist
- Reset form on Cancel

### Requirement 9: Achievement Showcase

**User Story:** As a player, I want to display my achievements on my profile, so that I can show off my accomplishments.

#### Acceptance Criteria

9.1. WHEN AchievementBadge renders THEN the system SHALL display:
- Achievement icon (48px) with rarity-colored background
- Achievement name below icon
- Earned date on hover tooltip
- Rarity glow effect matching achievement tier

9.2. WHEN achievements section renders THEN the system SHALL:
- Display up to 6 featured achievements
- Show "View All (X)" link if more exist
- Order by rarity (legendary first) then date earned
- Show empty state with "No achievements yet" message

9.3. WHEN an achievement is legendary THEN the system SHALL:
- Apply gold border and shimmer animation
- Display star icon overlay
- Use larger size variant (64px icon)

9.4. WHEN hovering an achievement THEN the system SHALL:
- Show tooltip with full name and description
- Display earned date in readable format
- Apply scale effect (1.1x) with shadow

### Requirement 10: Responsive and Mobile Experience

**User Story:** As a player on any device, I want the Profile to work well on mobile, so that I can view and edit my profile anywhere.

#### Acceptance Criteria

10.1. WHEN viewport is mobile (< 640px) THEN the system SHALL:
- Stack all sections vertically
- Reduce banner height to 160px
- Use 2-column grid for stats
- Show 3 loadout slots per row
- Use bottom sheet for edit mode

10.2. WHEN viewport is tablet (640-1024px) THEN the system SHALL:
- Use 3-column grid for stats
- Display full loadout row
- Side-by-side layout for editor preview

10.3. WHEN viewport is desktop (> 1024px) THEN the system SHALL:
- Use 4-column grid for stats
- Display full loadout row with larger previews
- Side panel for editor with live preview

10.4. WHEN touch interactions occur THEN the system SHALL:
- Provide minimum 44x44px tap targets on all interactive elements
- Support long-press for additional options on mobile
- Add touch feedback (opacity change) on tap
- Prevent accidental double-taps with debouncing
