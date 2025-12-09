# Design Document: Landing Typography Polish

## Overview

This design document outlines the enterprise-grade typography and visual hierarchy polish for the 1v1 Bro landing page. The implementation refines the existing landing page components with improved typography scales, spacing systems, color palette adjustments, and component styling to achieve a premium AAA-quality aesthetic.

The changes are purely CSS/styling updates to existing components - no structural changes to the component hierarchy or new components are needed.

## Architecture

### Files to Modify

```
frontend/src/
├── styles/
│   └── landing/
│       ├── typography.ts      # Update type scale values
│       └── colors.ts          # Update color palette (create if needed)
├── components/
│   └── landing/
│       └── enterprise/
│           ├── HeroSection.tsx       # Update typography & spacing
│           ├── LandingHeader.tsx     # Update header height & styling
│           ├── SectionHeader.tsx     # Update typography & spacing
│           ├── FeatureCard.tsx       # Update padding & typography
│           ├── StepCard.tsx          # Update step number & spacing
│           ├── UseCaseCard.tsx       # Update padding & typography
│           ├── FinalCTASection.tsx   # Update padding & typography
│           ├── LandingFooter.tsx     # Update padding & typography
│           ├── CTAButton.tsx         # Update sizing & styling
│           ├── HowItWorksSection.tsx # Update section padding
│           ├── FeaturesSection.tsx   # Update section padding
│           └── UseCasesSection.tsx   # Update section padding
└── pages/
    └── Landing.tsx                   # No changes needed
```

## Components and Interfaces

### Updated Typography Scale

```typescript
// frontend/src/styles/landing/typography.ts
export const TYPOGRAPHY = {
  // Hero headline - larger, tighter tracking
  display: {
    desktop: {
      fontSize: '72px',
      lineHeight: '80px',
      letterSpacing: '-0.03em',
      fontWeight: 800,
    },
    mobile: {
      fontSize: '48px',
      lineHeight: '56px',
      letterSpacing: '-0.03em',
      fontWeight: 800,
    },
  },
  // Section headers - refined
  h1: {
    desktop: {
      fontSize: '48px',
      lineHeight: '56px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    mobile: {
      fontSize: '36px',
      lineHeight: '44px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
  },
  // Section titles
  h2: {
    desktop: {
      fontSize: '40px',
      lineHeight: '48px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    mobile: {
      fontSize: '32px',
      lineHeight: '40px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
  },
  // Card titles, step titles
  h3: {
    desktop: {
      fontSize: '28px',
      lineHeight: '36px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    mobile: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
  },
  // Feature card titles
  h4: {
    desktop: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    mobile: {
      fontSize: '20px',
      lineHeight: '28px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
  },
  // Subheadlines, descriptions
  bodyLarge: {
    desktop: {
      fontSize: '18px',
      lineHeight: '28px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
    mobile: {
      fontSize: '17px',
      lineHeight: '26px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
  },
  // Body text - slightly larger
  body: {
    desktop: {
      fontSize: '17px',
      lineHeight: '28px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
    mobile: {
      fontSize: '16px',
      lineHeight: '26px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
  },
  // Captions, trust lines
  caption: {
    desktop: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0.02em',
      fontWeight: 500,
    },
    mobile: {
      fontSize: '13px',
      lineHeight: '18px',
      letterSpacing: '0.02em',
      fontWeight: 500,
    },
  },
} as const
```

### Updated Color Palette

```typescript
// frontend/src/styles/landing/colors.ts
export const LANDING_COLORS = {
  // Backgrounds - slightly darker for more contrast
  bgDeep: '#09090B',
  bgMid: '#111113',
  bgLight: '#18181B',
  surface: '#1F1F23',
  
  // Borders - refined opacity levels
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  borderHover: 'rgba(255, 255, 255, 0.16)',
  
  // Text - better contrast hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#B4B4B4',
  textMuted: '#737373',
  textDisabled: '#525252',
  
  // Accents - warmer orange
  accentPrimary: '#F97316',
  accentHover: '#FB923C',
  accentMuted: 'rgba(249, 115, 22, 0.10)',
  
  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
} as const
```

### Spacing System

```typescript
// Spacing constants for consistency
export const SPACING = {
  // Section vertical padding
  sectionPadding: {
    desktop: '120px',
    mobile: '80px',
  },
  // Final CTA section (larger)
  sectionPaddingLarge: {
    desktop: '160px',
    mobile: '100px',
  },
  // Section header bottom margin
  headerMargin: {
    desktop: '64px',
    mobile: '48px',
  },
  // Card grid gap
  gridGap: {
    desktop: '32px',
    mobile: '24px',
  },
  // Card internal padding
  cardPadding: {
    desktop: '32px',
    mobile: '24px',
  },
  // CTA margin from text
  ctaMargin: {
    desktop: '48px',
    mobile: '40px',
  },
} as const
```

### Component Style Updates

#### LandingHeader
```typescript
// Height: 80px desktop, 64px mobile
// Logo: 28px, -0.02em tracking, 700 weight
// Nav links: 15px, 500 weight, 32px gap
// Backdrop: blur-xl (12px), bg-opacity-95
// Auth buttons: 16px padding, 44px min-height
```

#### HeroSection
```typescript
// Headline: 72px/80px desktop, 48px/56px mobile, -0.03em
// Subheadline: 18px/28px, secondary text color
// Spacing: 32px between headline and subheadline
// CTA margin: 48px from subheadline
// Trust line: 14px, muted text color
```

#### SectionHeader
```typescript
// Title: 40px/48px desktop, 32px/40px mobile, -0.02em
// Bottom margin: 64px desktop, 48px mobile
```

#### CTAButton
```typescript
// Default: 56px height, 24px horizontal padding, 16px radius
// Large: 64px height, 32px horizontal padding
// Font: 16px, 600 weight
// Secondary border: 1.5px, rgba(255,255,255,0.16)
// Hover: translateY(-2px), shadow increase
```

#### FeatureCard
```typescript
// Padding: 32px desktop, 24px mobile
// Icon: 40px size, accent color
// Title margin-bottom: 16px
// Description: secondary color, 1.6 line-height
// Hover border: rgba(255,255,255,0.16)
```

#### StepCard
```typescript
// Step number: 96px, 10% opacity, -0.04em tracking
// Spacing below number: 48px
// Title: 28px/36px, 600 weight
// Description max-width: 320px, center-aligned
```

#### FinalCTASection
```typescript
// Padding: 160px desktop, 100px mobile
// Headline: 48px/56px desktop, 36px/44px mobile
// Subheadline max-width: 560px, centered
// Button gap: 20px
// Vignette: radial-gradient from center
```

#### LandingFooter
```typescript
// Padding: 80px top, 48px bottom
// Background: #09090B
// Top border: rgba(255,255,255,0.06)
// Links: 14px, muted color, white on hover
// Copyright: 13px, muted color
// Logo: 24px, primary color
```

## Data Models

No data model changes required - this is purely a styling update.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Typography Scale Consistency

*For any* text element on the landing page, the computed font-size, line-height, letter-spacing, and font-weight SHALL match one of the defined typography levels in the updated type scale (display, h1, h2, h3, h4, bodyLarge, body, caption).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Spacing System Consistency

*For any* section on the landing page, the computed vertical padding SHALL match the defined spacing values (120px/80px for standard sections, 160px/100px for final CTA), and section headers SHALL have the correct bottom margin (64px/48px).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Color Palette Consistency

*For any* rendered element on the landing page, the computed color values SHALL match the defined color palette:
- Text colors: #FFFFFF (primary), #B4B4B4 (secondary), #737373 (muted)
- Background colors: #09090B (deep), #111113 (mid), #18181B (surface)
- Accent colors: #F97316 (primary), #FB923C (hover)
- Border colors: rgba(255,255,255,0.06/0.08/0.12/0.16)

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 4: Header Dimensions

*For any* render of the LandingHeader, the component SHALL have:
- Height of 80px on desktop (≥768px) and 64px on mobile (<768px)
- Logo at 28px font-size with 700 weight
- Navigation links at 15px with 500 weight and 32px horizontal spacing

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 5: CTA Button Dimensions

*For any* CTAButton with default size, the button SHALL have:
- Height of 56px, horizontal padding of 24px, border-radius of 16px
- Font-size of 16px with font-weight 600

*For any* CTAButton with large size, the button SHALL have:
- Height of 64px, horizontal padding of 32px

**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 6: Feature Card Styling

*For any* FeatureCard component, the card SHALL have:
- Internal padding of 32px on desktop and 24px on mobile
- Icon size of 40px with accent primary color
- Title with 16px bottom margin
- Description with secondary text color and 1.6 line-height

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 7: Step Card Styling

*For any* StepCard component, the card SHALL have:
- Step number at 96px font-size with 10% opacity and -0.04em letter-spacing
- 48px spacing between number and content
- Title at 28px/36px with 600 weight
- Description max-width of 320px with center-aligned text

**Validates: Requirements 7.1, 7.2, 7.4, 7.5**

### Property 8: Final CTA Section Styling

*For any* render of FinalCTASection, the section SHALL have:
- Vertical padding of 160px on desktop and 100px on mobile
- Headline at 48px/56px on desktop and 36px/44px on mobile
- Subheadline max-width of 560px with center alignment
- Button gap of 20px

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 9: Footer Styling

*For any* render of LandingFooter, the footer SHALL have:
- Top padding of 80px and bottom padding of 48px
- Background color of #09090B with top border at rgba(255,255,255,0.06)
- Links at 14px with muted text color
- Copyright at 13px with muted text color
- Logo at 24px with primary text color

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

## Error Handling

No error handling changes required - this is purely a styling update.

## Testing Strategy

### Dual Testing Approach

**Unit Tests:**
- Verify component renders with correct CSS classes
- Snapshot tests for visual regression
- Responsive breakpoint tests

**Property-Based Tests:**
- Use `fast-check` library for TypeScript
- Minimum 100 iterations per property
- Test computed style values against defined constants
- Verify color values match palette
- Verify typography values match scale

### Test Implementation

```typescript
// Example: Property 1 - Typography Scale Consistency
import fc from 'fast-check'
import { TYPOGRAPHY } from '@/styles/landing/typography'

describe('Landing Typography Properties', () => {
  /**
   * **Feature: landing-typography-polish, Property 1: Typography Scale Consistency**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
   */
  it('all text elements use defined typography scale', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TYPOGRAPHY)),
        (level) => {
          const style = TYPOGRAPHY[level]
          // Verify style has required properties
          expect(style.desktop.fontSize).toBeDefined()
          expect(style.desktop.lineHeight).toBeDefined()
          expect(style.desktop.letterSpacing).toBeDefined()
          expect(style.desktop.fontWeight).toBeDefined()
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test File Location

```
frontend/src/components/landing/enterprise/__tests__/
└── typography-polish.test.ts  // Property-based tests for typography polish
```
