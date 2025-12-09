# Design Document: 2025 Landing Page

## Overview

This design document outlines the AAA-quality landing page redesign for 1v1bro. The implementation creates a professional, enterprise-grade landing experience with custom backgrounds, typography hierarchy, bespoke components, and a visual identity that establishes 1v1bro as a premium competitive gaming destination.

The design follows a "2026 aesthetic" - forward-looking, no gradients, no AI-default colors (cyan/purple), with intentional brand-specific palette and custom components.

## Architecture

### Component Hierarchy

```
Landing.tsx (Page)
├── LandingHeader
│   ├── Logo
│   ├── NavLinks (desktop)
│   └── AuthButtons / UserMenu
├── HeroSection
│   ├── BackgroundScene
│   │   ├── FarLayer (mountains)
│   │   ├── MidLayer (arena silhouette)
│   │   ├── NearLayer (platforms)
│   │   └── ForegroundLayer (particles)
│   ├── HeroContent
│   │   ├── Headline
│   │   ├── Subheadline
│   │   ├── CTAGroup
│   │   └── TrustLine
│   └── GameplayPreview (right side)
├── HowItWorksSection
│   ├── SectionHeader
│   └── StepCards (3)
├── FeaturesSection
│   ├── SectionHeader
│   └── FeatureCards (6, 2×3 grid)
├── UseCasesSection
│   ├── SectionHeader
│   └── UseCaseCards (3)
├── FinalCTASection
│   ├── Headline
│   ├── Subheadline
│   └── CTAGroup
└── LandingFooter
    ├── FooterLogo
    ├── FooterNavColumns
    └── FooterCopyright
```

### File Structure

```
frontend/src/
├── pages/
│   └── Landing.tsx (main page)
├── components/
│   └── landing/
│       └── enterprise/
│           ├── index.ts (barrel export)
│           ├── LandingHeader.tsx
│           ├── HeroSection.tsx
│           ├── BackgroundScene.tsx
│           ├── HowItWorksSection.tsx
│           ├── FeaturesSection.tsx
│           ├── UseCasesSection.tsx
│           ├── FinalCTASection.tsx
│           ├── LandingFooter.tsx
│           ├── ComponentBox.tsx
│           ├── CTAButton.tsx
│           ├── FeatureCard.tsx
│           ├── StepCard.tsx
│           ├── UseCaseCard.tsx
│           ├── SectionHeader.tsx
│           └── icons/
│               ├── index.ts
│               ├── ArenaIcon.tsx
│               ├── TriviaIcon.tsx
│               ├── PowerUpIcon.tsx
│               ├── BattlePassIcon.tsx
│               ├── CosmeticIcon.tsx
│               ├── BrowserIcon.tsx
│               ├── FriendsIcon.tsx
│               ├── CommunityIcon.tsx
│               └── EventIcon.tsx
├── styles/
│   └── landing/
│       ├── colors.ts (brand palette)
│       └── typography.ts (type scale)
└── types/
    └── landing.ts (interfaces)
```

## Components and Interfaces

### Brand Palette

```typescript
// frontend/src/styles/landing/colors.ts
export const LANDING_COLORS = {
  // Backgrounds
  bgDeep: '#0A0A0B',
  bgMid: '#121214',
  bgLight: '#1A1A1D',
  surface: '#222226',
  
  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textDisabled: '#52525B',
  
  // Accents
  accentPrimary: '#E85D04',    // Warm orange
  accentSecondary: '#DC2626',  // Deep red
  accentTertiary: '#F59E0B',   // Amber
  
  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
} as const

export type LandingColor = keyof typeof LANDING_COLORS
```

### Typography Scale

```typescript
// frontend/src/styles/landing/typography.ts
export const TYPOGRAPHY = {
  display: {
    fontSize: '64px',
    lineHeight: '72px',
    letterSpacing: '-0.02em',
    fontWeight: 800,
    mobile: { fontSize: '40px', lineHeight: '48px' },
  },
  h1: {
    fontSize: '48px',
    lineHeight: '56px',
    letterSpacing: '-0.02em',
    fontWeight: 700,
    mobile: { fontSize: '32px', lineHeight: '40px' },
  },
  h2: {
    fontSize: '36px',
    lineHeight: '44px',
    letterSpacing: '-0.01em',
    fontWeight: 700,
    mobile: { fontSize: '28px', lineHeight: '36px' },
  },
  h3: {
    fontSize: '28px',
    lineHeight: '36px',
    letterSpacing: '-0.01em',
    fontWeight: 600,
    mobile: { fontSize: '24px', lineHeight: '32px' },
  },
  h4: {
    fontSize: '24px',
    lineHeight: '32px',
    letterSpacing: '0em',
    fontWeight: 600,
    mobile: { fontSize: '20px', lineHeight: '28px' },
  },
  bodyLarge: {
    fontSize: '18px',
    lineHeight: '28px',
    letterSpacing: '0em',
    fontWeight: 400,
    mobile: { fontSize: '16px', lineHeight: '24px' },
  },
  body: {
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '0em',
    fontWeight: 400,
    mobile: { fontSize: '15px', lineHeight: '22px' },
  },
  caption: {
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0.01em',
    fontWeight: 500,
    mobile: { fontSize: '13px', lineHeight: '18px' },
  },
} as const

export type TypographyLevel = keyof typeof TYPOGRAPHY
```

### ComponentBox

```typescript
interface ComponentBoxProps {
  variant?: 'default' | 'elevated' | 'interactive' | 'featured'
  children: ReactNode
  className?: string
  onClick?: () => void
}

// Variant styles:
// default: bg-[#1A1A1D], border-white/[0.06], rounded-2xl, p-6
// elevated: bg-[#121214], shadow-lg, border-white/[0.10]
// interactive: hover:translate-y-[-2px], hover:shadow-xl, cursor-pointer
// featured: border-[#E85D04]/30, inner glow
```

### CTAButton

```typescript
interface CTAButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'default' | 'large'
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

// Primary: bg-[#E85D04], text-white, hover:brightness-110
// Secondary: bg-transparent, border-white/[0.16], hover:bg-white/[0.04]
// Tertiary: bg-transparent, no border, underline on hover
// Large: py-5 px-10, text-lg, min-h-[60px]
```

### FeatureCard

```typescript
interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

// Uses ComponentBox with "interactive" variant
// Icon: 48px, accent primary color
// Title: H4 typography
// Description: Body, text secondary
```

### StepCard

```typescript
interface StepCardProps {
  stepNumber: number
  title: string
  description: string
  icon: ReactNode
  className?: string
}

// Step number: Display typography, accent primary at 20% opacity
// Title: H3 typography
// Description: Body, text secondary
```

### UseCaseCard

```typescript
interface UseCaseCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

// Uses ComponentBox with "elevated" variant
// Icon: 24px, accent primary
// Title: H4 typography
// Description: Body, text secondary
```

## Data Models

### Landing Page Content

```typescript
interface LandingContent {
  hero: {
    headline: string
    subheadline: string
    primaryCTA: string
    secondaryCTA: string
    trustLine: string
  }
  howItWorks: {
    title: string
    steps: Array<{
      number: number
      title: string
      description: string
      iconId: string
    }>
  }
  features: {
    title: string
    cards: Array<{
      iconId: string
      title: string
      description: string
    }>
  }
  useCases: {
    title: string
    cards: Array<{
      iconId: string
      title: string
      description: string
    }>
  }
  finalCTA: {
    headline: string
    subheadline: string
    primaryCTA: string
    secondaryCTA: string
  }
}

// Static content defined in component
const LANDING_CONTENT: LandingContent = {
  hero: {
    headline: '1v1 Bro – Trivia Duels With Real-Time Combat',
    subheadline: 'Outplay your friends in a live 1v1 arena where every question, dodge, and shot can swing the match.',
    primaryCTA: 'Play Free In Browser',
    secondaryCTA: 'Host a Match With Friends',
    trustLine: 'No downloads. No setup. Just share a code and start battling.',
  },
  // ... rest of content
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Color Palette Constraint

*For any* rendered element on the landing page, the computed background-color and color values SHALL NOT contain:
- Gradient values (linear-gradient, radial-gradient)
- Cyan hues (#00FFFF, rgb(0, 255, 255), or similar within ±30 hue degrees)
- Purple hues (#8B5CF6, rgb(139, 92, 246), or similar within ±30 hue degrees)

**Validates: Requirements 1.4**

### Property 2: Typography Scale Consistency

*For any* text element using the typography system, the computed font-size, line-height, and font-weight SHALL match one of the 8 defined typography levels (Display, H1, H2, H3, H4, Body Large, Body, Caption).

**Validates: Requirements 2.1**

### Property 3: Component Box Variant Styling

*For any* ComponentBox instance with a given variant prop, the rendered element SHALL apply the correct CSS properties:
- default: background #1A1A1D, border rgba(255,255,255,0.06)
- elevated: background #121214, box-shadow present
- interactive: cursor pointer, transform on hover
- featured: border with accent primary at 30% opacity

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: CTA Button State Transitions

*For any* CTAButton instance, the button SHALL correctly transition between states:
- Default → Hover: Apply hover styles within 150ms
- Default → Focus: Show 2px outline with accent primary
- Default → Disabled: Apply 50% opacity, no hover effects

**Validates: Requirements 5.4, 5.5, 5.6**

### Property 5: Feature Cards Count and Content

*For any* render of the FeaturesSection, the component SHALL display exactly 6 FeatureCards with the specified titles:
1. "Real-time 2D arena"
2. "Head-to-head trivia"
3. "Power-ups that flip rounds"
4. "Progression & battle pass"
5. "Cosmetic-only monetization"
6. "Play anywhere"

**Validates: Requirements 7.4**

### Property 6: Responsive Layout Breakpoints

*For any* viewport width, the layout SHALL apply correct grid configurations:
- width > 1024px: 3-column feature grid
- 640px ≤ width ≤ 1024px: 2-column feature grid
- width < 640px: 1-column stack

**Validates: Requirements 14.1, 14.2, 14.3**

### Property 7: Header Auth State Display

*For any* authentication state, the header SHALL display correct elements:
- Unauthenticated: "Log in" (tertiary) + "Sign up" (primary)
- Authenticated: Username display + "Dashboard" (primary)

**Validates: Requirements 11.4**

### Property 8: Icon Size Consistency

*For any* icon rendered using the icon system, the computed width and height SHALL match one of the defined sizes:
- Small: 16px
- Default: 24px
- Large: 32px
- XLarge: 48px

**Validates: Requirements 13.2**

### Property 9: Accessibility Focus Indicators

*For any* interactive element (buttons, links), when focused via keyboard navigation, the element SHALL display a visible focus indicator with:
- 2px outline
- Offset of 2px
- Color matching accent primary (#E85D04)

**Validates: Requirements 15.1**

### Property 10: Mobile Touch Targets

*For any* interactive element on mobile viewport (< 640px), the computed touch target area SHALL be at least 44x44 pixels.

**Validates: Requirements 14.4**

## Error Handling

### Asset Loading

- Background scene gracefully degrades if images fail to load
- Fallback to solid color background (#0A0A0B)
- Icons use inline SVG to avoid loading failures

### Animation Performance

- Respect prefers-reduced-motion media query
- Disable parallax and particle effects when reduced motion preferred
- Fallback to static background on low-performance devices

### Auth State

- Handle loading state while checking authentication
- Show skeleton buttons during auth check
- Graceful fallback to unauthenticated state on error

## Testing Strategy

### Dual Testing Approach

The implementation uses both unit tests and property-based tests:

**Unit Tests:**
- Component rendering with various props
- Content verification (exact copy matches)
- Responsive layout at breakpoints
- Auth state conditional rendering

**Property-Based Tests:**
- Use `fast-check` library for TypeScript
- Minimum 100 iterations per property
- Test style computations and layout constraints
- Verify color palette constraints

### Property Test Implementation

```typescript
// Example: Property 1 - Color Palette Constraint
import fc from 'fast-check'

describe('Landing Page Properties', () => {
  /**
   * **Feature: 2025-landing-page, Property 1: Color Palette Constraint**
   * **Validates: Requirements 1.4**
   */
  it('does not use forbidden colors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(LANDING_COLORS)),
        (color) => {
          // Verify no cyan or purple hues
          const isForbidden = isCyanOrPurple(color)
          expect(isForbidden).toBe(false)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test File Structure

```
frontend/src/components/landing/enterprise/__tests__/
├── LandingHeader.test.tsx
├── HeroSection.test.tsx
├── FeaturesSection.test.tsx
├── HowItWorksSection.test.tsx
├── UseCasesSection.test.tsx
├── FinalCTASection.test.tsx
├── ComponentBox.test.tsx
├── CTAButton.test.tsx
└── landing-properties.test.ts  // Property-based tests
```

### Test Tags

Each property-based test will be tagged with:
```typescript
/**
 * **Feature: 2025-landing-page, Property 1: Color Palette Constraint**
 * **Validates: Requirements 1.4**
 */
```
