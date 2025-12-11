# Design Document: Game Flow Mobile Optimization

## Overview

This design extends the mobile enterprise optimization to cover game flow screens: landing page, matchmaking, lobby, bot game, instant play, and arena overlays. The implementation follows the same patterns established in the initial mobile optimization spec, leveraging existing utility components (TouchTarget, ResponsiveContainer, ResponsiveGrid) and property-based testing infrastructure.

## Architecture

### Component Hierarchy

```
Game Flow Screens
├── Landing Page
│   ├── LandingHeader (menu toggle, mobile menu)
│   ├── HeroSection (CTAs)
│   ├── StickyMobileCTA
│   └── FeaturesSection (cards)
├── Matchmaking
│   ├── CategorySelector
│   ├── MapSelector
│   ├── QueueStatus (modal)
│   └── MatchFoundModal
├── Lobby
│   ├── Lobby.tsx (page)
│   ├── HeadToHeadDisplay
│   ├── LobbyCode
│   └── PlayerCard/PlayerCardBanner
├── Bot Game
│   ├── BotGame.tsx (SetupScreen, ResultsScreen)
│   └── Shared game components
├── Instant Play
│   ├── InstantPlay.tsx
│   ├── QuickCategoryPicker
│   ├── InstantPlayTutorial
│   ├── GuestMatchSummary
│   └── ConversionPromptModal
└── Arena Overlays
    ├── RespawnOverlay
    ├── RotateDeviceHint
    ├── RoundResultOverlay
    └── ArenaQuizPanel (overlay mode)
```

### Design Principles

1. **Consistency**: Use the same touch target utilities and patterns from the main mobile optimization
2. **Progressive Enhancement**: Mobile-first approach with desktop enhancements
3. **Safe Area Awareness**: All fixed/sticky elements respect device safe areas
4. **Fluid Sizing**: Replace hardcoded pixel values with responsive alternatives

## Components and Interfaces

### Landing Page Updates

#### LandingHeader
- Add `min-h-[44px] min-w-[44px]` to mobile menu toggle button
- Ensure mobile menu items have adequate touch targets and spacing

#### StickyMobileCTA
- Already has good sizing, verify safe area padding with `pb-safe`

### Matchmaking Components

#### CategorySelector
```typescript
// Add to button className
className={`
  ...existing classes...
  min-h-[44px]  // Touch target compliance
`}
```

#### MapSelector
```typescript
// Add to button className
className={`
  ...existing classes...
  min-h-[44px]  // Touch target compliance
`}
```

#### QueueStatus
- Add `min-h-[44px]` to cancel button
- Add safe area padding to modal container

#### MatchFoundModal
- Add safe area padding to modal container

### Lobby Components

#### HeadToHeadDisplay
- Replace fixed `w-[240px] h-[360px]` with responsive sizing
- Use `max-w-[240px] w-full aspect-[2/3]` pattern
- Add mobile breakpoint for vertical stacking

#### LobbyCode
- Add `min-h-[44px]` to copy button

#### Lobby.tsx
- Verify safe area classes on header and action buttons

### Bot Game Components

#### SetupScreen (in BotGame.tsx)
- Add `min-h-[44px]` to category selection buttons
- Add `min-h-[44px]` to map selection buttons
- Add `min-h-[44px]` to Start Game and Back buttons

#### ResultsScreen (in BotGame.tsx)
- Add `min-h-[44px]` to Play Again and Back buttons

### Arena Overlay Components

#### RespawnOverlay
- Add `min-h-[44px] min-w-[44px]` to Watch Replay button

#### RotateDeviceHint
- Add `min-h-[44px]` to action buttons (already has good sizing, verify)

#### ArenaQuizPanel (overlay mode)
- Verify answer buttons meet touch target requirements

### Instant Play Components

#### QuickCategoryPicker
- Add `min-h-[44px]` to category option buttons

#### InstantPlayTutorial
- Add `min-h-[44px]` to dismiss/continue buttons

#### GuestMatchSummary
- Add `min-h-[44px]` to action buttons

#### ConversionPromptModal
- Add safe area padding
- Add `min-h-[44px]` to CTA buttons

## Data Models

No new data models required. This spec focuses on UI/UX improvements to existing components.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following consolidated properties will be tested:

### Property 1: Game Flow Touch Target Minimum Size

*For any* interactive button or tappable element in game flow screens (landing, matchmaking, lobby, bot game, instant play, arena overlays), the element SHALL have minimum dimensions of 44×44px.

**Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.5, 6.1, 6.2, 6.3, 7.1**

### Property 2: Touch Target Spacing

*For any* pair of adjacent interactive elements in game flow screens, the spacing between their touch targets SHALL be at least 8px.

**Validates: Requirements 7.2**

### Property 3: No Hardcoded Layout Dimensions

*For any* player card or layout container in game flow screens, the element SHALL NOT use fixed pixel width values (e.g., `w-[240px]`) but instead use responsive alternatives (percentage, max-width, aspect-ratio).

**Validates: Requirements 3.1, 8.1**

### Property 4: Responsive Grid Columns

*For any* grid layout in game flow screens at mobile viewport widths (< 640px), the grid SHALL collapse to single column or two columns maximum.

**Validates: Requirements 1.5, 8.3**

### Property 5: Horizontal Overflow Prevention

*For any* viewport width from 320px to 1920px, game flow screens SHALL NOT produce horizontal overflow (no horizontal scrollbar).

**Validates: Requirements 5.3, 8.5**

### Property 6: Fluid Typography

*For any* text element in game flow screens, font sizes SHALL use responsive Tailwind classes (text-sm, text-base, etc.) or CSS clamp() functions, not hardcoded pixel values.

**Validates: Requirements 8.4**

### Property 7: Mobile Modal Presentation

*For any* modal displayed on mobile viewports (< 768px), the modal SHALL use full-screen or bottom sheet presentation with safe area padding.

**Validates: Requirements 3.2, 8.2**

## Error Handling

- If touch target dimensions cannot be verified (e.g., element not rendered), tests should skip gracefully
- If viewport resize fails during testing, retry with fallback dimensions
- Safe area insets should default to 0 if not supported by the test environment

## Testing Strategy

### Dual Testing Approach

This spec uses both unit tests and property-based tests:

1. **Unit Tests**: Verify specific components render correctly with expected classes
2. **Property-Based Tests**: Verify universal properties hold across all game flow components

### Property-Based Testing

- **Library**: fast-check (already used in the codebase)
- **Iterations**: Minimum 100 iterations per property test
- **Viewport Range**: 320px to 1920px width

### Test File Location

Tests will be added to:
- `frontend/src/__tests__/audit/game-flow-mobile-optimization.test.ts` (property tests)
- Individual component test files for unit tests

### Test Annotations

Each property-based test will be tagged with:
```typescript
// **Feature: game-flow-mobile-optimization, Property {N}: {property_text}**
// **Validates: Requirements X.Y**
```

