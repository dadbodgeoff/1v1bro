# Design Document: Mobile Enterprise Optimization

## Overview

This design document outlines the technical approach for auditing and optimizing all frontend modules to meet enterprise-grade mobile standards. The optimization focuses on eliminating hardcoded values, ensuring proper responsive layouts, enforcing touch target compliance, and implementing consistent spacing/typography across all pages and components.

The existing codebase already has a solid foundation with:
- Design tokens in `tokens.css` (colors, spacing, typography, shadows)
- Responsive CSS variables in `responsive.css` (fluid typography, touch targets, breakpoints)
- Mobile utilities in `index.css` (safe areas, animations, touch feedback)
- Mobile-aware components (`Button`, `Modal`, `useViewport` hook)

The optimization will build on this foundation to ensure 100% compliance across all modules.

## Architecture

### Mobile-First Responsive Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Breakpoint System                             │
├─────────────────────────────────────────────────────────────────┤
│  Mobile (<640px)  │  Tablet (640-1023px)  │  Desktop (1024px+)  │
├───────────────────┼───────────────────────┼─────────────────────┤
│  Single column    │  2-column layouts     │  Multi-column       │
│  Bottom nav/menu  │  Sidebar visible      │  Full sidebar       │
│  Full-width cards │  Card grids           │  Optimized grids    │
│  Stacked buttons  │  Inline buttons       │  Inline buttons     │
│  Bottom sheets    │  Centered modals      │  Centered modals    │
└───────────────────┴───────────────────────┴─────────────────────┘
```

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      DashboardLayout                             │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐   │
│  │   Sidebar   │  │              Main Content               │   │
│  │  (hidden    │  │  ┌─────────────────────────────────┐   │   │
│  │   mobile)   │  │  │         Page Component          │   │   │
│  │             │  │  │  ┌───────────┐ ┌───────────┐   │   │   │
│  │  ┌───────┐  │  │  │  │  Widget   │ │  Widget   │   │   │   │
│  │  │ Nav   │  │  │  │  │  Card     │ │  Card     │   │   │   │
│  │  │ Items │  │  │  │  └───────────┘ └───────────┘   │   │   │
│  │  └───────┘  │  │  └─────────────────────────────────┘   │   │
│  └─────────────┘  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Mobile Bottom Nav (mobile only)             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Mobile Utilities

#### 1. Responsive Container Component
```typescript
interface ResponsiveContainerProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}
```

#### 2. Touch Target Wrapper
```typescript
interface TouchTargetProps {
  children: ReactNode
  minSize?: number // defaults to 44px
  className?: string
}
```

#### 3. Responsive Grid Component
```typescript
interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    mobile: number    // <640px
    tablet?: number   // 640-1023px
    desktop?: number  // 1024px+
  }
  gap?: 'sm' | 'md' | 'lg'
}
```

### Page-Specific Optimizations

#### Profile Module
- Convert fixed-width avatar to percentage-based sizing
- Ensure stats grid uses responsive columns (1 on mobile, 2 on tablet, 3+ on desktop)
- Stack social links vertically on mobile

#### Dashboard Module
- Implement single-column widget layout on mobile
- Add horizontal scroll for widget overflow
- Ensure hero section scales properly

#### Battle Pass Module
- Horizontal scrollable tier track with snap points
- Touch-friendly claim buttons (min 44px)
- Responsive progress bar sizing

#### Shop Module
- 2-column grid on mobile, scaling to 4+ on desktop
- Bottom sheet for item details on mobile
- Horizontally scrollable category filters

#### Inventory Module
- 2-3 column grid on mobile
- Touch-optimized equip/unequip buttons
- Collapsible filter panel on mobile

#### Coin Shop Module
- Stacked package cards on mobile
- Full-width purchase buttons
- Responsive hero section

#### Leaderboards Module
- Card-based layout on mobile (vs table on desktop)
- Horizontally scrollable tabs
- Sticky user ranking indicator

#### Friends Module
- Full-height list with adequate row spacing
- Touch-optimized action buttons
- Full-screen search on mobile

#### Settings Module
- Single-column layout throughout
- Large toggle switches (44px+ tap area)
- Collapsible sections

## Data Models

### Viewport State (useViewport hook)
```typescript
interface ViewportState {
  width: number
  height: number
  isMobile: boolean      // <640px
  isTablet: boolean      // 640-1023px
  isDesktop: boolean     // 1024px+
  isTouch: boolean       // pointer: coarse
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
  orientation: 'portrait' | 'landscape'
}
```

### Responsive Breakpoints
```typescript
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  wide: 1920,
} as const

const TOUCH_TARGET = {
  min: 44,           // Apple HIG minimum
  recommended: 48,   // Material Design
  comfortable: 56,   // Accessible
  gap: 8,            // Minimum gap between targets
} as const
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Touch Target Minimum Size
*For any* interactive element (button, link, clickable area) rendered in the application, the computed dimensions SHALL be at least 44x44 pixels.
**Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.2, 7.5, 8.2, 8.3, 8.4, 9.2, 9.5, 10.2, 11.2, 11.4, 14.3, 14.4**

### Property 2: Touch Target Spacing
*For any* two adjacent interactive elements, the gap between their bounding boxes SHALL be at least 8 pixels.
**Validates: Requirements 13.2**

### Property 3: Mobile Layout Single Column
*For any* page component rendered at viewport width below 640px, the main content area SHALL use a single-column or two-column layout (grid-cols-1 or grid-cols-2).
**Validates: Requirements 1.1, 2.1, 6.1, 7.1, 9.1**

### Property 4: Responsive Grid Adaptation
*For any* grid component, the number of columns SHALL decrease as viewport width decreases (desktop > tablet > mobile).
**Validates: Requirements 1.2, 4.1, 5.1**

### Property 5: No Hardcoded Layout Dimensions
*For any* component's width, height, padding, or margin properties, the values SHALL use CSS variables, percentages, viewport units, or Tailwind responsive classes instead of hardcoded pixel values for layout-critical dimensions.
**Validates: Requirements 1.4, 12.2**

### Property 6: Fluid Typography Scale
*For any* text element, the font-size SHALL use clamp(), CSS variables, or responsive Tailwind classes that scale between breakpoints.
**Validates: Requirements 1.5, 2.2, 4.2, 6.3, 7.2, 12.1, 12.3**

### Property 7: Minimum Font Size
*For any* text element, the computed font-size SHALL be at least 12px, and body text SHALL be at least 16px to prevent iOS zoom.
**Validates: Requirements 12.4**

### Property 8: Safe Area Handling
*For any* fixed-position element at screen edges, the component SHALL include safe-area-inset padding or margin.
**Validates: Requirements 2.4, 10.3**

### Property 9: Horizontal Overflow Prevention
*For any* page or scrollable container, horizontal overflow SHALL be hidden or controlled (no unexpected horizontal scroll).
**Validates: Requirements 2.5**

### Property 10: Modal Mobile Presentation
*For any* modal rendered at viewport width below 640px, the modal SHALL use full-width or bottom-sheet presentation with safe area padding.
**Validates: Requirements 4.5, 5.5, 6.4, 8.5, 11.1**

### Property 11: Horizontal Scroll Containers
*For any* horizontally scrollable content (tier tracks, tabs, filters), the container SHALL have overflow-x-auto and momentum scrolling enabled.
**Validates: Requirements 3.1, 4.4, 7.3, 10.5, 13.5**

### Property 12: Responsive Card Sizing
*For any* card component, the width SHALL be responsive (percentage-based or grid-controlled) rather than fixed pixel width.
**Validates: Requirements 3.2, 5.2, 14.1**

### Property 13: Progress Bar Responsiveness
*For any* progress bar component, the width SHALL be percentage-based (100% of container) with responsive height.
**Validates: Requirements 3.4**

### Property 14: List Row Touch Height
*For any* list item in a scrollable list, the row height SHALL be at least 44px for touch accessibility.
**Validates: Requirements 8.1**

### Property 15: Input Field Sizing
*For any* input field, the height SHALL be at least 44px on touch devices.
**Validates: Requirements 9.4**

### Property 16: Image Responsiveness
*For any* image element, the sizing SHALL use responsive classes or percentage-based dimensions with proper aspect ratio containers.
**Validates: Requirements 14.2**

### Property 17: Empty State Responsiveness
*For any* empty state component, the layout SHALL be responsive with appropriately sized illustrations and text.
**Validates: Requirements 14.5**

### Property 18: Line Height Relative Values
*For any* text element with explicit line-height, the value SHALL be a relative number (1.5+) rather than fixed pixels.
**Validates: Requirements 12.5**

## Error Handling

### Viewport Detection Fallbacks
- Default to mobile-first layout if viewport detection fails
- Use CSS media queries as fallback for JS-based detection
- Handle orientation changes gracefully

### Safe Area Fallbacks
- Provide fallback values (0px) for browsers without safe-area-inset support
- Use `env()` with fallback: `env(safe-area-inset-bottom, 0px)`

### Touch Detection Fallbacks
- Default to touch-optimized sizing if pointer detection unavailable
- Use `@media (pointer: coarse)` with graceful degradation

## Testing Strategy

### Dual Testing Approach

This optimization requires both unit tests and property-based tests:

1. **Unit Tests**: Verify specific component behaviors at different viewport sizes
2. **Property-Based Tests**: Verify universal properties hold across all components

### Property-Based Testing Framework

We will use **fast-check** for property-based testing in TypeScript/React.

### Test Categories

#### 1. Touch Target Tests
- Generate random interactive elements
- Verify computed dimensions >= 44px
- Verify spacing between adjacent elements >= 8px

#### 2. Layout Responsiveness Tests
- Generate random viewport widths
- Verify layout adapts correctly at breakpoints
- Verify no horizontal overflow

#### 3. Typography Tests
- Generate random text elements
- Verify font sizes use fluid values
- Verify minimum font size compliance

#### 4. Spacing Tests
- Scan component styles for hardcoded pixel values
- Verify CSS variables or relative units used

### Test Configuration
- Minimum 100 iterations per property test
- Test at viewport widths: 320px, 375px, 414px, 640px, 768px, 1024px, 1280px, 1440px
- Test both portrait and landscape orientations

### Test Annotation Format
Each property-based test must include:
```typescript
/**
 * Feature: mobile-enterprise-optimization, Property 1: Touch Target Minimum Size
 * Validates: Requirements 1.3, 2.3, 3.3, ...
 */
```
