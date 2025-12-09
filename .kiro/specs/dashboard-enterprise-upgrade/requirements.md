# Requirements Document

## Introduction

This specification defines a comprehensive enterprise-grade upgrade for the Dashboard (Home) experience in the 1v1bro gaming platform. The redesign transforms the current basic Dashboard implementation into a AAA-quality hub that showcases all platform features and provides quick access to key functionality.

**IMPORTANT: Feature Integration**
The Dashboard upgrade integrates all major platform features that have been built since the original dashboard was created:
- Battle Pass progression system with tier/XP display
- Item Shop with featured items preview
- Inventory with loadout preview
- Profile with stats summary
- Friends system with proper /friends route
- Match history with recent games

The upgrade encompasses:

1. **Enterprise Component Architecture** - New enterprise-grade components in `frontend/src/components/dashboard/enterprise/` following the same patterns as the Shop, Battle Pass, Inventory, and Profile enterprise components
2. **Hero Play Section** - Prominent Find Match CTA with category/map selection, queue status, and secondary actions (Create Lobby, Join Lobby, Practice vs Bot)
3. **Battle Pass Widget** - Compact progression display showing current tier, XP progress bar, claimable rewards badge, and days remaining
4. **Shop Preview Widget** - Featured items carousel showing 3-4 items with images, names, rarity, prices, and daily rotation timer
5. **Loadout Preview Widget** - Current equipped cosmetics (skin, banner, player card) with quick access to inventory
6. **Stats Summary Widget** - Key performance metrics (wins, win rate, rank tier, ELO rating) with link to full profile
7. **Match History Widget** - Recent 5 matches with opponent, outcome, ELO change, and timestamp
8. **Friends Widget** - Online friends list with proper /friends page route (fixing broken sidebar link)
9. **Responsive Grid Layout** - 3-column desktop, 2-column tablet, 1-column mobile with consistent spacing

The goal is to achieve visual and functional parity with the enterprise Shop, Battle Pass, Inventory, and Profile pages, creating a cohesive premium experience that serves as the central hub for all platform features.

## Glossary

- **Dashboard_System**: The main authenticated user home page at `frontend/src/pages/Home.tsx` and `frontend/src/components/dashboard/`
- **Enterprise_Component**: A component following the enterprise architecture pattern established in `frontend/src/components/shop/enterprise/`
- **Hero_Section**: The primary action area containing Find Match CTA and secondary play options
- **Widget**: A self-contained UI component displaying summarized data from a feature module with link to full page
- **Quick_Action**: A prominent button or card that initiates a primary user flow
- **Preview_Card**: A compact display showing a snapshot of content from another page
- **Battle_Pass_Widget**: Compact display of current tier, XP progress, and claimable rewards
- **Shop_Preview_Widget**: Featured items display with images, prices, and daily timer
- **Loadout_Preview_Widget**: Current equipped cosmetics display with customize link
- **Stats_Summary_Widget**: Key performance metrics display with profile link
- **Match_History_Widget**: Recent matches list with opponent and outcome
- **Friends_Widget**: Online friends list with proper route navigation
- **Friends_Page**: Dedicated page at /friends route using existing FriendsPanel logic
- **Typography_Hierarchy**: The systematic organization of text elements with consistent sizing and weights
- **Rarity_Theming**: Visual styling (borders, glows) based on item rarity

## Requirements

### Requirement 1: Enterprise Component Architecture

**User Story:** As a developer, I want Dashboard components organized in an enterprise architecture, so that the codebase maintains consistency with the Shop, Battle Pass, Inventory, and Profile modules and enables scalable development.

#### Acceptance Criteria

1.1. WHEN the Dashboard_System initializes THEN the system SHALL load enterprise components from `frontend/src/components/dashboard/enterprise/` directory

1.2. WHEN enterprise components are created THEN each component SHALL include a JSDoc header documenting:
- Component purpose and features
- Props interface with descriptions
- Requirements references

1.3. WHEN the enterprise directory is structured THEN the system SHALL contain:
- `HeroPlaySection.tsx` - Primary Find Match CTA with category/map selection and secondary actions
- `BattlePassWidget.tsx` - Compact tier/XP progress display (enhanced from existing)
- `ShopPreviewWidget.tsx` - Featured items carousel with prices and timer
- `LoadoutPreviewWidget.tsx` - Equipped cosmetics display with customize link
- `StatsSummaryWidget.tsx` - Key metrics display with profile link
- `MatchHistoryWidget.tsx` - Recent matches list (enhanced from existing)
- `FriendsWidget.tsx` - Online friends with proper navigation (enhanced from existing)
- `DashboardSection.tsx` - Section container with title, subtitle, and content area
- `index.ts` - Barrel export file for all enterprise components

1.4. WHEN components are exported THEN the barrel file SHALL export all enterprise components for clean imports: `import { HeroPlaySection, BattlePassWidget, ... } from '@/components/dashboard/enterprise'`

### Requirement 2: Hero Play Section

**User Story:** As a player, I want a prominent play section on my dashboard, so that I can quickly start a match with minimal clicks.

#### Acceptance Criteria

2.1. WHEN HeroPlaySection renders THEN the system SHALL display:
- H2: "Quick Play" title in 2xl (24px) bold with tight tracking
- Category selector dropdown showing available trivia categories
- Map selector dropdown showing available arena maps
- Primary "Find Match" button in accent color (indigo-500) with 16px height, full width
- Secondary actions row with "Create Lobby" and "Join Lobby" buttons

2.2. WHEN the Find Match button is clicked THEN the system SHALL:
- Initiate matchmaking with selected category and map
- Disable the button and show "Finding Match..." text
- Display queue status modal with time elapsed and cancel option

2.3. WHEN a match is found THEN the system SHALL:
- Display match found modal with opponent name
- Transition to lobby page automatically

2.4. WHEN matchmaking cooldown is active THEN the system SHALL:
- Display countdown timer on Find Match button
- Disable the button until cooldown expires
- Show "Cooldown: X:XX" format

2.5. WHEN secondary actions are used THEN the system SHALL:
- "Create Lobby" creates a new lobby and navigates to lobby page
- "Join Lobby" shows input field for lobby code
- "Practice vs Bot" navigates to /bot-game route

2.6. WHEN displaying on mobile THEN the system SHALL:
- Stack category and map selectors vertically
- Maintain full-width buttons
- Ensure 44px minimum tap targets

### Requirement 3: Battle Pass Widget

**User Story:** As a player, I want to see my Battle Pass progress on the dashboard, so that I can track my tier and XP without navigating away.

#### Acceptance Criteria

3.1. WHEN BattlePassWidget renders THEN the system SHALL display:
- Widget header with "Battle Pass" title and season name
- Current tier number prominently (3xl font, bold)
- XP progress bar with gradient fill (indigo-500 to indigo-400)
- "X / Y XP" text below progress bar
- Days remaining until season end

3.2. WHEN claimable rewards exist THEN the system SHALL:
- Display badge showing count of claimable rewards
- Apply subtle pulsing animation to badge
- Use emerald color for badge background

3.3. WHEN the widget is clicked THEN the system SHALL:
- Navigate to /battlepass page
- Apply hover effect (bg-white/[0.02], translateY -1px)

3.4. WHEN no active season exists THEN the system SHALL:
- Display "No active season" message
- Show "Check back soon" subtitle
- Hide progress bar and tier display

3.5. WHEN user has premium Battle Pass THEN the system SHALL:
- Display premium badge with star icon
- Apply amber/gold accent color to badge

### Requirement 4: Shop Preview Widget

**User Story:** As a player, I want to see featured shop items on my dashboard, so that I can discover new cosmetics without navigating to the shop.

#### Acceptance Criteria

4.1. WHEN ShopPreviewWidget renders THEN the system SHALL display:
- Widget header with "Featured Items" title and "View Shop" link
- 3-4 featured items in horizontal scroll or grid
- Daily rotation countdown timer

4.2. WHEN displaying a shop item THEN the system SHALL show:
- Item preview image (80px height)
- Item name (sm font, truncated)
- Rarity indicator (colored dot or border)
- Price with coin icon

4.3. WHEN an item is clicked THEN the system SHALL:
- Navigate to /shop page
- Apply hover effect with rarity glow

4.4. WHEN "View Shop" is clicked THEN the system SHALL:
- Navigate to /shop page

4.5. WHEN daily rotation timer expires THEN the system SHALL:
- Display "Refreshing..." text
- Trigger shop data refresh

4.6. WHEN shop data is loading THEN the system SHALL:
- Display skeleton placeholders for items
- Maintain layout stability

### Requirement 5: Loadout Preview Widget

**User Story:** As a player, I want to see my current loadout on the dashboard, so that I can quickly view my equipped cosmetics.

#### Acceptance Criteria

5.1. WHEN LoadoutPreviewWidget renders THEN the system SHALL display:
- Widget header with "Your Loadout" title and "Customize" link
- 3 equipped item slots: Skin, Banner, Player Card
- Each slot showing item preview image and name

5.2. WHEN a slot has an equipped item THEN the system SHALL:
- Display item preview image (64px)
- Show item name below (xs font, truncated)
- Apply rarity border color

5.3. WHEN a slot is empty THEN the system SHALL:
- Display slot type icon at 50% opacity
- Show "Empty" label in muted text
- Apply dashed border styling

5.4. WHEN the widget is clicked THEN the system SHALL:
- Navigate to /inventory page
- Apply hover effect

5.5. WHEN "Customize" is clicked THEN the system SHALL:
- Navigate to /inventory page

### Requirement 6: Stats Summary Widget

**User Story:** As a player, I want to see my key stats on the dashboard, so that I can track my overall performance at a glance.

#### Acceptance Criteria

6.1. WHEN StatsSummaryWidget renders THEN the system SHALL display:
- Widget header with "Your Stats" title and "View Profile" link
- 4 stat cards in 2x2 grid: Total Wins, Win Rate, Rank Tier, ELO Rating

6.2. WHEN displaying a stat card THEN the system SHALL show:
- Stat value prominently (xl font, bold, tabular-nums)
- Stat label below (xs font, muted, uppercase)
- Icon or indicator appropriate to stat type

6.3. WHEN displaying rank tier THEN the system SHALL:
- Show tier icon (bronze/silver/gold/platinum/diamond)
- Display tier name
- Apply tier-appropriate color

6.4. WHEN displaying ELO rating THEN the system SHALL:
- Show numeric rating value
- Display rating change indicator if available (+/- with color)

6.5. WHEN the widget is clicked THEN the system SHALL:
- Navigate to /profile page
- Apply hover effect

6.6. WHEN user has no stats THEN the system SHALL:
- Display "0" for numeric values
- Show "Unranked" for tier
- Display "Play a match to see your stats" message

### Requirement 7: Match History Widget

**User Story:** As a player, I want to see my recent matches on the dashboard, so that I can review my performance.

#### Acceptance Criteria

7.1. WHEN MatchHistoryWidget renders THEN the system SHALL display:
- Widget header with "Recent Matches" title
- List of 5 most recent matches
- Each match showing opponent, outcome, and timestamp

7.2. WHEN displaying a match THEN the system SHALL show:
- Opponent avatar (32px, rounded)
- Opponent display name (sm font)
- Win/Loss indicator (green/red badge)
- ELO change (+/- with color)
- Relative timestamp ("2h ago", "Yesterday")

7.3. WHEN a match is clicked THEN the system SHALL:
- Navigate to /match/:id details page
- Apply hover effect (bg-white/[0.04])

7.4. WHEN no matches exist THEN the system SHALL:
- Display empty state with icon
- Show "No matches yet" message
- Display "Play a Match" CTA button

7.5. WHEN matches are loading THEN the system SHALL:
- Display skeleton rows
- Maintain layout stability

### Requirement 8: Friends Widget and /friends Route

**User Story:** As a player, I want to see my online friends and access a dedicated friends page, so that I can quickly invite them to play.

#### Acceptance Criteria

8.1. WHEN FriendsWidget renders THEN the system SHALL display:
- Widget header with "Friends Online" title and count badge
- "View All" link that navigates to /friends page
- List of online friends (max 5)

8.2. WHEN displaying an online friend THEN the system SHALL show:
- Friend avatar (32px, rounded)
- Friend display name (sm font)
- Online status indicator (green dot)

8.3. WHEN "View All" is clicked THEN the system SHALL:
- Navigate to /friends page (NOT open panel)

8.4. WHEN no friends are online THEN the system SHALL:
- Display empty state with icon
- Show "No friends online" message
- Display "Add Friends" CTA button

8.5. WHEN a user navigates to /friends route THEN the system SHALL:
- Display a dedicated Friends page
- Show full friends list using existing FriendsList component
- Show friend requests using existing FriendRequests component
- Show user search using existing UserSearch component
- Use DashboardLayout wrapper for consistent navigation

8.6. WHEN the Friends page loads THEN the system SHALL:
- Fetch friends list data
- Display loading state during fetch
- Handle errors gracefully

### Requirement 9: Dashboard Section Container

**User Story:** As a player, I want consistent visual organization across dashboard widgets, so that the interface feels cohesive and professional.

#### Acceptance Criteria

9.1. WHEN DashboardSection renders THEN the system SHALL display:
- Section container with card background (bg-[#111111])
- Border styling (border-white/[0.06])
- Rounded corners (rounded-xl)
- Consistent padding (p-5)

9.2. WHEN section has header THEN the system SHALL display:
- Title in sm font, medium weight, muted color
- Optional badge with count or status
- Optional action link aligned right

9.3. WHEN section has content THEN the system SHALL:
- Apply consistent spacing between header and content (mb-4)
- Support flexible content area

### Requirement 10: Responsive Grid Layout

**User Story:** As a player on any device, I want the dashboard to work well on all screen sizes, so that I can access features anywhere.

#### Acceptance Criteria

10.1. WHEN viewport is desktop (> 1024px) THEN the system SHALL:
- Display 3-column grid layout
- Left column (2/3 width): Hero Play Section, Match History
- Right column (1/3 width): Battle Pass, Shop Preview, Loadout, Stats, Friends
- Use 24px gap between columns and rows

10.2. WHEN viewport is tablet (640-1024px) THEN the system SHALL:
- Display 2-column grid layout
- Adjust widget sizes appropriately
- Maintain visual hierarchy

10.3. WHEN viewport is mobile (< 640px) THEN the system SHALL:
- Display single-column stacked layout
- Hero Play Section at top
- Widgets stacked in priority order
- Ensure 44px minimum tap targets

10.4. WHEN touch interactions occur THEN the system SHALL:
- Provide minimum 44x44px tap targets on all interactive elements
- Add touch feedback (opacity change) on tap
- Support swipe gestures where appropriate
