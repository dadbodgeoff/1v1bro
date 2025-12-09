# Implementation Plan

## 1. Set up landing page enterprise architecture and design tokens

- [x] 1.1 Create landing enterprise directory structure
  - Create `frontend/src/components/landing/enterprise/` directory
  - Create `frontend/src/styles/landing/` directory for design tokens
  - Create barrel export file `index.ts`
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 1.2 Implement brand color palette constants
  - Create `frontend/src/styles/landing/colors.ts` with LANDING_COLORS
  - Define all background, border, text, and accent colors
  - Export type definitions for type safety
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.3 Write property test for color palette constraint
  - **Property 1: Color Palette Constraint**
  - **Validates: Requirements 1.4**
  - Test that no colors contain gradients, cyan, or purple hues

- [x] 1.4 Implement typography scale constants
  - Create `frontend/src/styles/landing/typography.ts` with TYPOGRAPHY
  - Define all 8 typography levels with desktop and mobile variants
  - Export type definitions
  - _Requirements: 2.1, 2.4_

- [x] 1.5 Write property test for typography scale consistency
  - **Property 2: Typography Scale Consistency**
  - **Validates: Requirements 2.1**

## 2. Implement base component library

- [x] 2.1 Create ComponentBox component
  - Implement base container with 4 variants (default, elevated, interactive, featured)
  - Apply correct styles for each variant per design spec
  - Support className prop for customization
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.2 Write property test for ComponentBox variants
  - **Property 3: Component Box Variant Styling**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 2.3 Create CTAButton component
  - Implement button with 3 variants (primary, secondary, tertiary)
  - Implement 2 sizes (default, large)
  - Add hover, focus, and disabled states
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 2.4 Write property test for CTA button states
  - **Property 4: CTA Button State Transitions**
  - **Validates: Requirements 5.4, 5.5, 5.6**

- [x] 2.5 Create SectionHeader component
  - Implement reusable section header with title and optional subtitle
  - Apply H2 typography for title, Body Large for subtitle
  - Center alignment with max-width constraint
  - _Requirements: 7.1, 8.1, 9.1_

## 3. Implement custom icon system

- [x] 3.1 Create icon base component and size variants
  - Create `frontend/src/components/landing/enterprise/icons/` directory
  - Implement base Icon wrapper with size prop (16, 24, 32, 48px)
  - Apply currentColor for stroke inheritance
  - _Requirements: 13.1, 13.2_

- [x] 3.2 Write property test for icon sizes
  - **Property 8: Icon Size Consistency**
  - **Validates: Requirements 13.2**

- [x] 3.3 Create feature icons
  - ArenaIcon (crossed swords for Real-time 2D arena)
  - TriviaIcon (brain/lightbulb for Head-to-head trivia)
  - PowerUpIcon (lightning/shield for Power-ups)
  - BattlePassIcon (trophy/tier for Progression)
  - CosmeticIcon (palette for Cosmetic-only)
  - BrowserIcon (browser window for Play anywhere)
  - _Requirements: 13.3_

- [x] 3.4 Create use case icons
  - FriendsIcon (people for Friends hanging out)
  - CommunityIcon (server/group for Communities)
  - EventIcon (calendar/party for Events)
  - _Requirements: 13.3_

## 4. Checkpoint - Ensure all tests pass
  - [x] All 43 property tests pass

## 5. Implement background scene system

- [x] 5.1 Create BackgroundScene component
  - Implement 4-layer depth system (far, mid, near, foreground)
  - Apply correct z-index ordering
  - Add vignette overlay effect
  - _Requirements: 3.1, 3.6_

- [x] 5.2 Implement far layer (mountains)
  - Create mountain silhouettes in #1A0A0A
  - Add horizon glow with accent secondary at 20% opacity
  - Implement subtle animated pulse (0.5Hz)
  - _Requirements: 3.2_

- [x] 5.3 Implement mid layer (arena silhouette)
  - Create arena structure outline
  - Add parallax movement at 0.3x scroll rate
  - Apply 60% opacity
  - _Requirements: 3.3_

- [x] 5.4 Implement near layer (platforms)
  - Create floating rock platforms
  - Add subtle rotation animation (±2 degrees, 8s cycle)
  - Apply parallax at 0.6x scroll rate
  - _Requirements: 3.4_

- [x] 5.5 Implement foreground layer (particles)
  - Create ember particle system (20-40 particles)
  - Add smoke wisps at bottom edge
  - Implement parallax at 1.2x scroll rate
  - Fade particles at 70% viewport height
  - _Requirements: 3.5_

- [x] 5.6 Add performance fallbacks
  - Reduce particle count on mobile
  - Disable parallax on mobile
  - Respect prefers-reduced-motion
  - _Requirements: 3.7_

## 6. Implement hero section

- [x] 6.1 Create HeroSection component
  - Implement full viewport height layout
  - Integrate BackgroundScene as backdrop
  - Position content center-left
  - _Requirements: 6.1_

- [x] 6.2 Implement hero content
  - Add headline with exact copy: "1v1 Bro – Trivia Duels With Real-Time Combat"
  - Add subheadline with exact copy
  - Implement animated text reveal (fade up)
  - _Requirements: 6.2, 6.3_

- [x] 6.3 Implement hero CTAs
  - Add primary CTA: "Play Free In Browser"
  - Add secondary CTA: "Host a Match With Friends"
  - Add trust line below CTAs
  - Implement responsive layout (horizontal desktop, stacked mobile)
  - _Requirements: 6.4_

- [x] 6.4 Implement scroll indicator
  - Position at bottom center
  - Add bounce animation
  - Fade out after 3 seconds
  - _Requirements: 6.5_

- [x] 6.5 Implement scroll parallax effect
  - Fade hero content on scroll past 100px
  - Apply 0.5x parallax to hero content
  - Keep background visible
  - _Requirements: 6.6_

## 7. Implement How It Works section

- [x] 7.1 Create StepCard component
  - Display step number in Display typography at 20% opacity
  - Show title in H3 typography
  - Show description in Body typography
  - Include icon above title
  - _Requirements: 8.2_

- [x] 7.2 Create HowItWorksSection component
  - Add section header "How It Works"
  - Implement 3-column grid layout
  - Add connecting line between steps (desktop only)
  - _Requirements: 8.1, 8.3, 8.5_

- [x] 7.3 Implement step content with exact copy
  - Step 1: "Pick a mode & topic" - "Choose Fortnite trivia..."
  - Step 2: "Share a code, join instantly" - "Send your lobby code..."
  - Step 3: "Fight, answer, and level up" - "Move, shoot, grab power-ups..."
  - _Requirements: 8.4_

## 8. Implement Features section

- [x] 8.1 Create FeatureCard component
  - Use ComponentBox with "interactive" variant
  - Display icon at 48px in accent primary
  - Show title in H4, description in Body
  - Add hover effects (elevation, icon color shift)
  - _Requirements: 7.2, 7.5_

- [x] 8.2 Create FeaturesSection component
  - Add section header "Built For Competitive Chaos"
  - Implement 2×3 responsive grid
  - _Requirements: 7.1, 7.3_

- [x] 8.3 Implement feature cards with exact copy
  - Real-time 2D arena: "WASD movement, obstacles..."
  - Head-to-head trivia: "Fifteen fast-paced questions..."
  - Power-ups that flip rounds: "Freeze time, steal points..."
  - Progression & battle pass: "Unlock skins, emotes..."
  - Cosmetic-only monetization: "No pay-to-win..."
  - Play anywhere: "Runs in the browser..."
  - _Requirements: 7.4_

- [x] 8.4 Write property test for feature cards count
  - **Property 5: Feature Cards Count and Content**
  - **Validates: Requirements 7.4**

## 9. Checkpoint - Ensure all tests pass
  - [x] All 43 property tests pass

## 10. Implement Use Cases section

- [x] 10.1 Create UseCaseCard component
  - Use ComponentBox with "elevated" variant
  - Display icon at 24px in accent primary
  - Show title in H4, description in Body
  - _Requirements: 9.3_

- [x] 10.2 Create UseCasesSection component
  - Add section header "Perfect For..."
  - Implement 3-column responsive grid
  - _Requirements: 9.1, 9.4_

- [x] 10.3 Implement use case cards with exact copy
  - Friends hanging out online: "Drop a code in Discord..."
  - Communities & servers: "Run pickup 1v1 tournaments..."
  - Events & watch parties: "Use trivia tied to live sports..."
  - _Requirements: 9.2_

## 11. Implement Final CTA section

- [x] 11.1 Create FinalCTASection component
  - Implement full-width background with arena imagery
  - Center content with max-width 600px
  - Add vignette effect
  - _Requirements: 10.1, 10.5_

- [x] 11.2 Implement final CTA content
  - Add headline: "Ready To Settle It?"
  - Add subheadline: "Jump into a free 1v1 arena match..."
  - Add primary CTA: "Start A Free Match"
  - Add secondary CTA: "Join With A Code"
  - _Requirements: 10.2, 10.3, 10.4_

## 12. Implement header and footer

- [x] 12.1 Create LandingHeader component
  - Implement fixed position with backdrop blur
  - Add logo "1v1 Bro" text
  - Add navigation links (desktop only)
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 12.2 Implement header auth state
  - Show "Log in" + "Sign up" when unauthenticated
  - Show username + "Dashboard" when authenticated
  - _Requirements: 11.4_

- [x] 12.3 Write property test for header auth state
  - **Property 7: Header Auth State Display**
  - **Validates: Requirements 11.4**

- [x] 12.4 Implement mobile header
  - Hide navigation links on mobile
  - Add hamburger menu icon
  - Implement full-screen overlay menu
  - _Requirements: 11.5_

- [x] 12.5 Create LandingFooter component
  - Implement footer with logo and tagline
  - Add navigation columns (Play, Learn, Legal)
  - Add copyright text
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## 13. Implement responsive behavior

- [x] 13.1 Implement desktop layout (> 1024px)
  - Apply full typography scale
  - Show all navigation links
  - Use 3-column feature grid
  - Enable all parallax effects
  - _Requirements: 14.1_

- [x] 13.2 Implement tablet layout (640-1024px)
  - Scale typography to 90%
  - Hide secondary navigation
  - Use 2-column feature grid
  - Reduce parallax intensity
  - _Requirements: 14.2_

- [x] 13.3 Implement mobile layout (< 640px)
  - Apply mobile typography scale
  - Show hamburger menu
  - Use 1-column layout
  - Disable parallax effects
  - _Requirements: 14.3_

- [x] 13.4 Write property test for responsive breakpoints
  - **Property 6: Responsive Layout Breakpoints**
  - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 13.5 Write property test for mobile touch targets
  - **Property 10: Mobile Touch Targets**
  - **Validates: Requirements 14.4**

## 14. Implement accessibility

- [x] 14.1 Add keyboard navigation support
  - Ensure all interactive elements are focusable
  - Support Tab key navigation in logical order
  - Support Enter/Space for button activation
  - _Requirements: 15.1_

- [x] 14.2 Write property test for focus indicators
  - **Property 9: Accessibility Focus Indicators**
  - **Validates: Requirements 15.1**

- [x] 14.3 Add screen reader support
  - Add alt text for all images
  - Use semantic HTML elements
  - Include ARIA labels where needed
  - _Requirements: 15.2_

- [x] 14.4 Implement reduced motion support
  - Respect prefers-reduced-motion media query
  - Disable parallax and animations when preferred
  - _Requirements: 15.4_

## 15. Integrate landing page

- [x] 15.1 Update Landing.tsx page
  - Replace existing implementation with enterprise components
  - Import all sections from enterprise barrel export
  - Wire up navigation and auth state
  - _Requirements: All_

- [x] 15.2 Update routing if needed
  - Ensure / route renders new Landing page
  - Verify navigation links work correctly
  - Test auth redirects
  - _Requirements: 11.3, 11.4_

## 16. Final Checkpoint - Ensure all tests pass
  - [x] All 43 property tests pass (landing-properties.test.ts)
