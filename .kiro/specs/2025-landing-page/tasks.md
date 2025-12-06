# 2025 Landing Page - Implementation Plan

## Overview

This implementation plan follows a **layered approach** building from foundational hooks and utilities to complete page integration:

1. Core hooks and utilities
2. Animation components
3. Section components (Hero, Demo, Features, Stats, Tech, Footer)
4. Demo game engine and bot AI
5. Main page integration
6. Performance optimization and testing

**Key Principles:**
- Each file stays under 400 lines
- Test each component in isolation before integration
- Property-based tests validate correctness properties from design
- Build incrementally with checkpoints
- Reuse existing backdrop layers and game systems

**Estimated Time:** 2-3 weeks
**Total New Files:** ~30 files
**Lines of Code:** ~5,000 lines

---

## Phase 1: Core Hooks and Utilities

### Task 1: Create Landing Page Types
- [ ] 1.1 Create `frontend/src/components/landing/types.ts`
  - Define LandingState interface
  - Define SectionId type
  - Define DemoState interface
  - Define LandingStats and RecentMatch interfaces
  - Define FeatureConfig and animation config types
  - Define ScrollAnimationState interface
  - Define CTAConfig interface
  - _Requirements: All sections_

### Task 2: Create Core Hooks
- [ ] 2.1 Create `frontend/src/hooks/landing/useReducedMotion.ts`
  - Implement hook to detect prefers-reduced-motion
  - Return boolean indicating motion preference
  - _Requirements: 9.1_

- [ ] 2.2 Create `frontend/src/hooks/landing/useScrollAnimation.ts`
  - Implement Intersection Observer hook
  - Accept ref and threshold options
  - Return isVisible, progress, hasAnimated state
  - Support reset on exit option
  - _Requirements: 3.2, 3.7, 3.8_

- [ ] 2.3 Write property test for scroll animation
  - **Property 3: Scroll Animation Lifecycle**
  - Verify animation triggers at correct threshold
  - Verify state resets on exit when configured
  - **Validates: Requirements 3.2, 3.7, 3.8**

- [ ] 2.4 Create `frontend/src/hooks/landing/useParallax.ts`
  - Implement scroll-based parallax offset calculation
  - Accept parallax factor parameter
  - Return current offset value
  - Throttle to 60fps
  - _Requirements: 1.10_

- [ ] 2.5 Create `frontend/src/hooks/landing/useLandingStats.ts`
  - Implement stats fetching with polling
  - Handle loading and error states
  - Cache results for fallback
  - Poll every 30 seconds when visible
  - _Requirements: 4.1, 4.3, 4.4, 4.6_

- [ ] 2.6 Create `frontend/src/hooks/landing/index.ts`
  - Export all landing hooks
  - _Requirements: All_

### Task 3: Create Landing API Service
- [ ] 3.1 Create `frontend/src/services/landingAPI.ts`
  - Implement fetchLandingStats() function
  - Implement fetchRecentMatches() function
  - Handle API errors with fallback values
  - _Requirements: 4.1, 4.3, 4.6_

---

## Phase 2: Animation Components

### Task 4: Create Logo Reveal Animation
- [ ] 4.1 Create `frontend/src/components/landing/animations/LogoReveal.tsx`
  - Implement SVG logo with stroke-dasharray animation
  - Accept duration and reducedMotion props
  - Complete reveal within specified duration
  - Support instant reveal for reduced motion
  - _Requirements: 1.5_

### Task 5: Create Particle Burst Animation
- [ ] 5.1 Create `frontend/src/components/landing/animations/ParticleBurst.tsx`
  - Implement canvas-based particle effect
  - Accept count prop for particle count
  - Particles radiate outward from center
  - Auto-cleanup after animation completes
  - _Requirements: 1.8_

### Task 6: Create Number Counter Animation
- [ ] 6.1 Create `frontend/src/components/landing/animations/NumberCounter.tsx`
  - Implement animated number counter
  - Accept value, duration, reducedMotion props
  - Use easeOutExpo easing function
  - Support custom format function
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Write property test for counter animation
  - **Property 4: Counter Animation Behavior**
  - Verify counter reaches target value
  - Verify animation completes within duration
  - **Validates: Requirements 4.1, 4.2**

### Task 7: Create Scroll Reveal Wrapper
- [ ] 7.1 Create `frontend/src/components/landing/animations/ScrollReveal.tsx`
  - Implement wrapper component for scroll animations
  - Accept direction (left/right/up/down) prop
  - Accept delay and duration props
  - Use Framer Motion for animations
  - Support reduced motion
  - _Requirements: 3.2_

### Task 8: Create Network Diagram Animation
- [ ] 8.1 Create `frontend/src/components/landing/animations/NetworkDiagram.tsx`
  - Implement SVG network visualization
  - Animate data packets flowing along connections
  - Pulse nodes when receiving data
  - 4-second animation cycle
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 8.2 Create `frontend/src/components/landing/animations/index.ts`
  - Export all animation components
  - _Requirements: All_

---

## Phase 3: Checkpoint - Foundation
- [ ] 9. Ensure all tests pass, ask the user if questions arise.
  - Verify hooks work correctly
  - Verify animation components render
  - All property tests pass

---

## Phase 4: Hero Section

### Task 10: Create Hero Background
- [ ] 10.1 Create `frontend/src/components/landing/HeroBackground.tsx`
  - Initialize canvas with full viewport size
  - Instantiate DeepSpaceLayer, HexGridLayer, StarFieldLayer
  - Conditionally add NebulaLayer, ShootingStarLayer (not in reduced motion)
  - Implement animation loop with requestAnimationFrame
  - Apply parallax transform based on scroll
  - Handle resize events
  - Reduce particle count for reduced motion
  - _Requirements: 1.2, 1.3, 1.4, 1.10_

- [ ] 10.2 Write property test for backdrop initialization
  - **Property 1: Backdrop Layer Initialization**
  - Verify all layers initialize with correct config
  - Verify reduced motion reduces particle count
  - **Validates: Requirements 1.2, 1.3, 1.4**

### Task 11: Create Hero Section
- [ ] 11.1 Create `frontend/src/components/landing/HeroSection.tsx`
  - Implement full-viewport section
  - Integrate HeroBackground component
  - Add vignette overlay (radial gradient)
  - Add LogoReveal animation
  - Add tagline with delayed fade-in
  - Add primary CTA with pulsing glow
  - Add ParticleBurst on CTA hover
  - Add secondary "Try demo" CTA
  - Add scroll indicator animation
  - Support reduced motion
  - _Requirements: 1.1, 1.5, 1.6, 1.7, 1.8, 1.9_

---

## Phase 5: Demo Game System

### Task 12: Create Demo Configuration
- [ ] 12.1 Create `frontend/src/game/demo/DemoConfig.ts`
  - Define demo duration (60 seconds)
  - Define player spawn position and settings
  - Define bot spawn position and settings
  - Define arena configuration
  - Define control mappings (desktop and mobile)
  - _Requirements: 2.3, 2.4, 2.5_

### Task 13: Create Bot AI
- [ ] 13.1 Create `frontend/src/game/demo/BotAI.ts`
  - Implement basic AI behavior
  - Move toward player with reaction delay
  - Shoot at player every 2 seconds
  - Apply accuracy modifier (70%)
  - Implement start/stop/reset methods
  - _Requirements: 2.5_

### Task 14: Create Demo Game Engine
- [ ] 14.1 Create `frontend/src/game/demo/DemoGameEngine.ts`
  - Extend/simplify existing GameEngine for demo
  - Initialize with demo configuration
  - Load Nexus Arena map
  - Spawn player and bot
  - Implement game loop with timer
  - Handle player input (keyboard/touch)
  - Integrate BotAI for opponent
  - Implement pause/resume functionality
  - Implement reset functionality
  - Fire callbacks for health/time/end events
  - _Requirements: 2.1, 2.3, 2.5, 2.6, 2.9, 2.10_

- [ ] 14.2 Write property test for demo state machine
  - **Property 9: Demo Game State Machine**
  - Verify state transitions are valid
  - Verify state preservation across pause/resume
  - **Validates: Requirements 2.1, 2.3, 2.5, 2.6, 2.10**

- [ ] 14.3 Create `frontend/src/game/demo/index.ts`
  - Export DemoGameEngine, BotAI, DemoConfig
  - _Requirements: 2.1_

### Task 15: Create Demo Game Hook
- [ ] 15.1 Create `frontend/src/hooks/landing/useDemoGame.ts`
  - Initialize DemoGameEngine with canvas ref
  - Manage demo state (idle/playing/paused/ended)
  - Implement startDemo, pauseDemo, resumeDemo, resetDemo
  - Handle input events
  - Wire up engine callbacks to state updates
  - Cleanup on unmount
  - _Requirements: 2.1, 2.5, 2.6, 2.10_

---

## Phase 6: Demo Section Components

### Task 16: Create Demo Overlay
- [ ] 16.1 Create `frontend/src/components/landing/DemoOverlay.tsx`
  - Implement "start" overlay with play button
  - Implement "hud" overlay with timer and health bars
  - Implement "results" overlay with win/lose/draw
  - Show replay and sign-up CTAs on results
  - Animate overlay transitions
  - _Requirements: 2.2, 2.6_

### Task 17: Create Mobile Controls
- [ ] 17.1 Create `frontend/src/components/landing/MobileControls.tsx`
  - Implement virtual joystick (left side)
  - Implement shoot button (right side)
  - Implement power-up button (right side)
  - Semi-transparent (60% opacity)
  - Fire input events on interaction
  - _Requirements: 2.4, 6.4_

### Task 18: Create Live Demo Section
- [ ] 18.1 Create `frontend/src/components/landing/LiveDemo.tsx`
  - Implement section with header and description
  - Create game canvas container
  - Integrate useDemoGame hook
  - Integrate useScrollAnimation for visibility
  - Pause game when not visible
  - Resume game when visible
  - Show DemoOverlay based on state
  - Show MobileControls on mobile when playing
  - Show control hints on desktop
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 18.2 Write property test for visibility state management
  - **Property 2: Demo Visibility State Management**
  - Verify pause on visibility loss
  - Verify resume within 100ms on visibility gain
  - **Validates: Requirements 2.7, 2.8**

---

## Phase 7: Checkpoint - Demo System
- [ ] 19. Ensure all tests pass, ask the user if questions arise.
  - Verify demo game initializes and plays
  - Verify bot AI behaves correctly
  - Verify pause/resume works
  - Verify mobile controls work
  - All property tests pass

---

## Phase 8: Feature Section

### Task 20: Create Feature Card
- [ ] 20.1 Create `frontend/src/components/landing/FeatureCard.tsx`
  - Implement card with icon, title, description
  - Implement SVG icon with draw-on animation
  - Implement staggered reveal (icon → title → description)
  - Implement feature-specific animation based on type
  - Support alternating left/right slide direction
  - Pause animation when fully visible
  - Reset animation on exit
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

### Task 21: Create Feature Animations
- [ ] 21.1 Create combat animation for FeatureCard
  - Two player sprites facing each other
  - Animated projectile traveling between them
  - Damage number popup on hit
  - 3-second loop
  - _Requirements: 3.3_

- [ ] 21.2 Create trivia animation for FeatureCard
  - Mock question card with 4 options
  - Animated selection highlight cycling
  - Correct answer reveal with green glow
  - Points awarded animation
  - _Requirements: 3.4_

- [ ] 21.3 Create arena animation for FeatureCard
  - Isometric mini-map view (300x170px)
  - Animated player dots moving along lanes
  - Pulsing hazard zones
  - Teleporter activation effect
  - _Requirements: 3.5_

- [ ] 21.4 Create competitive animation for FeatureCard
  - Animated leaderboard with 5 entries
  - Rank numbers counting up
  - ELO rating badges
  - Queue animation
  - _Requirements: 3.6_

### Task 22: Create Feature Showcase Section
- [ ] 22.1 Create `frontend/src/components/landing/FeatureShowcase.tsx`
  - Implement section with header
  - Define feature configurations
  - Render 4 FeatureCard components
  - Space cards with scroll-triggered reveals
  - _Requirements: 3.1, 3.2_

---

## Phase 9: Stats and Tech Sections

### Task 23: Create Stats Section
- [ ] 23.1 Create `frontend/src/components/landing/StatsSection.tsx`
  - Implement section with header
  - Display 4 stat cards in grid
  - Use NumberCounter for animated values
  - Trigger animation on scroll into view
  - Display recent matches feed
  - Animate new match entries sliding in
  - Show "Updated X ago" indicator
  - Handle loading and error states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

### Task 24: Create Tech Showcase Section
- [ ] 24.1 Create `frontend/src/components/landing/TechShowcase.tsx`
  - Implement section with header
  - Display technology badges (React, TypeScript, WebSocket, etc.)
  - Implement hover tooltips with descriptions
  - Integrate NetworkDiagram animation
  - Display live ping indicator
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

---

## Phase 10: Footer and Mobile Components

### Task 25: Create Footer CTA Section
- [ ] 25.1 Create `frontend/src/components/landing/FooterCTA.tsx`
  - Implement full-width section
  - Add subtle particle background
  - Display "Ready to Dominate?" headline
  - Display primary CTA with player count
  - Display secondary links
  - _Requirements: 8.4_

### Task 26: Create Sticky Mobile CTA
- [ ] 26.1 Create `frontend/src/components/landing/StickyMobileCTA.tsx`
  - Implement sticky bottom bar (mobile only)
  - Show after 75% scroll
  - Display condensed "Sign Up Free" button
  - Add dismiss option
  - Auto-hide after 10 seconds
  - _Requirements: 8.5_

### Task 27: Create Loading Screen
- [ ] 27.1 Create `frontend/src/components/landing/LoadingScreen.tsx`
  - Display centered logo silhouette
  - Add pulsing glow effect
  - Show "Loading..." with animated ellipsis
  - Accept progress prop
  - Fade out when complete
  - _Requirements: 7.1_

---

## Phase 11: Checkpoint - All Sections
- [ ] 28. Ensure all tests pass, ask the user if questions arise.
  - Verify all sections render correctly
  - Verify scroll animations trigger
  - Verify stats display and update
  - All property tests pass

---

## Phase 12: Main Page Integration

### Task 29: Create Landing Page
- [ ] 29.1 Create `frontend/src/pages/Landing.tsx`
  - Implement main page component
  - Add SEO meta tags (Helmet)
  - Add skip-to-content link
  - Add fixed header with auth-aware CTA
  - Integrate all section components
  - Manage loading state
  - Handle CTA clicks with analytics
  - Navigate based on auth state
  - Integrate StickyMobileCTA
  - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2, 10.3_

- [ ] 29.2 Write property test for CTA navigation
  - **Property 6: CTA Navigation Behavior**
  - Verify navigation to /register when unauthenticated
  - Verify navigation to / when authenticated
  - **Validates: Requirements 8.1, 8.2**

- [ ] 29.3 Write property test for SEO metadata
  - **Property 8: SEO Metadata Presence**
  - Verify all required meta tags present
  - Verify Open Graph tags present
  - Verify Twitter Card tags present
  - **Validates: Requirements 10.1, 10.2, 10.3**

### Task 30: Update App Router
- [ ] 30.1 Update `frontend/src/App.tsx`
  - Add /landing route for Landing page
  - Update root route to show Landing for unauthenticated users
  - Keep Home for authenticated users
  - _Requirements: 8.2_

### Task 31: Create Component Index
- [ ] 31.1 Create `frontend/src/components/landing/index.ts`
  - Export all landing components
  - _Requirements: All_

---

## Phase 13: Accessibility and Responsive

### Task 32: Implement Accessibility Features
- [ ] 32.1 Add keyboard navigation support
  - Ensure all CTAs are focusable
  - Add visible focus indicators
  - Support Tab navigation
  - Support Enter/Space activation
  - _Requirements: 9.3_

- [ ] 32.2 Add screen reader support
  - Add ARIA labels to interactive elements
  - Add alt text to visual elements
  - Ensure logical heading hierarchy
  - _Requirements: 9.2_

- [ ] 32.3 Add demo keyboard controls
  - Arrow keys for movement
  - P key for pause
  - _Requirements: 9.5_

- [ ] 32.4 Write property test for accessibility
  - **Property 7: Accessibility Compliance**
  - Verify reduced motion disables animations
  - Verify keyboard accessibility
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Task 33: Implement Responsive Design
- [ ] 33.1 Add responsive breakpoints
  - Single-column layout below 768px
  - Two-column layout 768-1024px
  - Full layout above 1024px
  - _Requirements: 6.2_

- [ ] 33.2 Reduce particles on mobile
  - Stars: 100 (down from 200)
  - Nebula clouds: 2 (down from 5)
  - Shooting stars: 1 max
  - _Requirements: 6.3_

- [ ] 33.3 Write property test for responsive layout
  - **Property 5: Responsive Layout Adaptation**
  - Verify layout changes at breakpoints
  - Verify no overflow or breakage
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

---

## Phase 14: Checkpoint - Full Integration
- [ ] 34. Ensure all tests pass, ask the user if questions arise.
  - Verify page loads and renders correctly
  - Verify all sections work together
  - Verify responsive design works
  - Verify accessibility features work
  - All property tests pass

---

## Phase 15: Performance Optimization

### Task 35: Implement Code Splitting
- [ ] 35.1 Add lazy loading for sections
  - Lazy load LiveDemo section
  - Lazy load FeatureShowcase section
  - Lazy load StatsSection
  - Lazy load TechShowcase section
  - Lazy load FooterCTA section
  - Preload demo when scrolling near
  - _Requirements: 7.6_

### Task 36: Optimize Assets
- [ ] 36.1 Implement progressive loading
  - Add blur-up placeholders for images
  - Add skeleton screens for dynamic content
  - _Requirements: 7.3_

- [ ] 36.2 Optimize animations
  - Use CSS transforms instead of layout properties
  - Throttle scroll handlers to 60fps
  - Pause off-screen animations
  - _Requirements: 7.5_

### Task 37: Add Performance Monitoring
- [ ] 37.1 Add performance metrics
  - Log FCP and LCP times
  - Monitor frame rate during animations
  - Log warnings for slow frames
  - _Requirements: 7.2, 7.4, 7.5_

- [ ] 37.2 Write property test for performance
  - **Property 10: Performance Budget Compliance**
  - Verify bundle size under 500KB
  - Verify FCP under 1.5s
  - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

---

## Phase 16: Final Checkpoint
- [ ] 38. Ensure all tests pass, ask the user if questions arise.
  - Verify 60fps performance
  - Verify all property tests pass
  - Verify no console errors
  - Build passes without errors
  - Lighthouse scores meet targets
  - All acceptance criteria met

---

## Quick Reference

### File Size Targets

| File | Target Lines |
|------|--------------|
| Landing.tsx | <400 |
| HeroSection.tsx | <300 |
| HeroBackground.tsx | <250 |
| LiveDemo.tsx | <350 |
| DemoOverlay.tsx | <150 |
| FeatureShowcase.tsx | <300 |
| FeatureCard.tsx | <200 |
| StatsSection.tsx | <200 |
| TechShowcase.tsx | <200 |
| FooterCTA.tsx | <150 |
| MobileControls.tsx | <200 |
| LoadingScreen.tsx | <100 |
| useDemoGame.ts | <250 |
| useScrollAnimation.ts | <100 |
| DemoGameEngine.ts | <300 |
| BotAI.ts | <150 |

### Property Test Summary

| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Backdrop Layer Initialization | HeroBackground.test.ts | 1.2, 1.3, 1.4 |
| 2. Demo Visibility State Management | LiveDemo.test.ts | 2.7, 2.8 |
| 3. Scroll Animation Lifecycle | useScrollAnimation.test.ts | 3.2, 3.7, 3.8 |
| 4. Counter Animation Behavior | NumberCounter.test.ts | 4.1, 4.2 |
| 5. Responsive Layout Adaptation | Landing.test.ts | 6.1-6.6 |
| 6. CTA Navigation Behavior | Landing.test.ts | 8.1, 8.2 |
| 7. Accessibility Compliance | Landing.test.ts | 9.1-9.5 |
| 8. SEO Metadata Presence | Landing.test.ts | 10.1-10.4 |
| 9. Demo Game State Machine | DemoGameEngine.test.ts | 2.1, 2.3, 2.5, 2.6, 2.10 |
| 10. Performance Budget Compliance | performance.test.ts | 7.2-7.5 |

### Component Hierarchy

```
Landing.tsx
├── LoadingScreen.tsx
├── Header (inline)
├── HeroSection.tsx
│   ├── HeroBackground.tsx
│   ├── LogoReveal.tsx
│   └── ParticleBurst.tsx
├── LiveDemo.tsx
│   ├── DemoOverlay.tsx
│   └── MobileControls.tsx
├── FeatureShowcase.tsx
│   └── FeatureCard.tsx (x4)
├── StatsSection.tsx
│   └── NumberCounter.tsx (x4)
├── TechShowcase.tsx
│   └── NetworkDiagram.tsx
├── FooterCTA.tsx
└── StickyMobileCTA.tsx
```

---

*Total Tasks: 38 (with sub-tasks)*
*Estimated Time: 2-3 weeks*
*Property Tests: 10*
