# 2025 Landing Page - Requirements Document

## Introduction

This document defines the comprehensive requirements for creating a revolutionary 2025 landing page for 1v1bro - a real-time PvP trivia arena game. The landing page will deliver an immediate "what the fuck, this is awesome" first impression through cutting-edge web technologies including live game demos, custom SVG animations, WebGL particle effects, scroll-driven animations, and interactive showcases.

The current application has no dedicated landing page - unauthenticated users are redirected directly to the login page. This represents a missed opportunity to showcase the game's impressive technical capabilities and convert visitors into players. The landing page will serve as both a marketing tool and a technical demonstration of the game's AAA-quality visual systems.

The implementation leverages existing game engine components (HexGridLayer, DeepSpaceLayer, NebulaLayer, StarFieldLayer, ShootingStarLayer) to create a cohesive visual experience that previews the in-game atmosphere while adding landing-page-specific animations and interactions.

All implementations adhere to the 400-line maximum per file constraint, ensuring maintainability and testability. The system integrates seamlessly with the existing React/TypeScript frontend architecture.

## Glossary

- **Landing_Page**: The public-facing marketing page at the root URL for unauthenticated users
- **Hero_Section**: The above-the-fold viewport area containing the primary visual impact and call-to-action
- **Live_Demo**: An embedded, playable game instance running in the browser with AI opponent
- **SVG_Animation**: Scalable vector graphics with CSS/GSAP-driven motion effects
- **Particle_System**: Canvas-based visual effects system for ambient atmosphere
- **Scroll_Animation**: Animations triggered by scroll position using Intersection Observer API
- **Feature_Showcase**: Interactive sections demonstrating game capabilities with animated diagrams

- **CTA**: Call-to-action button prompting user engagement (sign up, play now)
- **WebGL**: Web Graphics Library for hardware-accelerated 2D/3D rendering
- **GSAP**: GreenSock Animation Platform for high-performance JavaScript animations
- **Intersection_Observer**: Browser API for detecting element visibility in viewport
- **FCP**: First Contentful Paint - time until first content renders
- **LCP**: Largest Contentful Paint - time until largest content element renders
- **Parallax**: Visual effect where background elements move slower than foreground
- **Morphing_SVG**: SVG paths that animate between different shapes
- **Stagger_Animation**: Sequential animation of multiple elements with delay between each
- **Blur_Up**: Progressive image loading technique showing blurred placeholder first
- **Vignette**: Darkened edges effect creating focus on center content
- **Glow_Effect**: CSS/Canvas effect creating luminous aura around elements
- **Micro_Interaction**: Small, subtle animations responding to user actions
- **Bot_Opponent**: AI-controlled player for demo gameplay
- **Touch_Controls**: On-screen virtual controls for mobile gameplay
- **Responsive_Breakpoint**: Screen width threshold triggering layout changes

---

## Current State Analysis

| Component | Current Implementation | Limitation |
|-----------|----------------------|------------|
| Landing Experience | None - redirects to /login | No marketing presence |
| Visual Showcase | None | Game visuals hidden behind auth |
| Demo Access | None | Must register to try game |
| Feature Communication | None | No explanation of game mechanics |
| Social Proof | None | No player counts or activity |
| Mobile Experience | Login form only | No engaging mobile content |
| Performance | N/A | No landing page to optimize |
| SEO | Minimal | No indexable marketing content |

### Problems to Solve

1. **No First Impression**: Visitors see a basic login form with no indication of game quality
2. **High Friction**: Must register before experiencing any gameplay
3. **No Visual Hook**: The impressive backdrop/arena systems are hidden
4. **Missing Social Proof**: No indication of active player community
5. **Poor Mobile Conversion**: Mobile visitors have no engaging content
6. **No Feature Education**: Game mechanics not explained before signup
7. **Wasted Technical Assets**: Existing visual systems not leveraged for marketing

### Existing Assets to Leverage

| Asset | Location | Usage |
|-------|----------|-------|
| DeepSpaceLayer | game/backdrop/layers/ | Hero background gradient |
| HexGridLayer | game/backdrop/layers/ | Animated grid pattern |
| StarFieldLayer | game/backdrop/layers/ | Parallax star field |
| NebulaLayer | game/backdrop/layers/ | Atmospheric clouds |
| ShootingStarLayer | game/backdrop/layers/ | Dynamic shooting stars |
| GameEngine | game/engine/ | Live demo foundation |
| CombatSystem | game/combat/ | Demo combat mechanics |
| PlayerRenderer | game/renderers/ | Demo player visuals |
| ProjectileRenderer | game/renderers/ | Demo projectile visuals |

---

## Requirements

### Requirement 1: Hero Section with Animated Background

**User Story:** As a visitor, I want to see an immediately captivating hero section, so that I understand this is a premium gaming experience worth my time.

#### Acceptance Criteria

1. WHEN a visitor loads the landing page THEN the Hero_Section SHALL display a full-viewport (100vh) animated background within 500ms of page load
2. WHEN the hero background initializes THEN the Landing_Page SHALL render the existing HexGridLayer with pulsing opacity animation (0.03-0.07 alpha, 0.5Hz frequency)
3. WHEN the hero background initializes THEN the Landing_Page SHALL render the existing DeepSpaceLayer as the base gradient (#0a0a20 center to #020208 edges)
4. WHEN the hero background initializes THEN the Landing_Page SHALL render animated particle effects including:
   - StarFieldLayer with 200 stars at varying depths (parallax factor 0.1-0.5)
   - ShootingStarLayer with 1-3 shooting stars visible at any time
   - NebulaLayer with 3-5 slowly drifting nebula clouds (drift speed: 5px/second)
5. WHEN the hero section loads THEN the Landing_Page SHALL display the game logo ("1v1 BRO") with a custom SVG reveal animation completing within 1.5 seconds using stroke-dasharray animation
6. WHEN the hero section loads THEN the Landing_Page SHALL display a tagline ("Real-time PvP Trivia Arena") with fade-in animation delayed 0.5s after logo reveal
7. WHEN the hero section is visible THEN the Landing_Page SHALL display a primary CTA button with:
   - Pulsing glow effect (box-shadow animation, 2s cycle)
   - Gradient background (#6366f1 to #4f46e5)
   - Text: "Play Now - Free"
8. WHEN a visitor hovers over the primary CTA THEN the Landing_Page SHALL trigger:
   - Enhanced glow intensity (2x normal)
   - Scale transform (1.05x)
   - Particle burst effect (8-12 particles radiating outward)
9. WHEN the hero section renders THEN the Landing_Page SHALL apply a subtle vignette effect (20% opacity black gradient at edges)
10. WHEN the hero section is scrolled THEN the Landing_Page SHALL apply parallax effect to background layers (background moves at 0.3x scroll speed)

---

### Requirement 2: Live Playable Demo Section

**User Story:** As a visitor, I want to try the game immediately without signing up, so that I can experience the gameplay quality before committing to registration.

#### Acceptance Criteria

1. WHEN a visitor scrolls to the demo section (50vh from top) THEN the Landing_Page SHALL initialize an embedded game canvas (800x450px desktop, 100% width mobile)
2. WHEN the demo initializes THEN the Landing_Page SHALL display a "Try It Now" overlay with play button that starts the demo on click
3. WHEN the demo starts THEN the Landing_Page SHALL spawn the player at the left spawn point and a bot opponent at the right spawn point
4. WHEN the demo is active THEN the Landing_Page SHALL display on-screen control hints:
   - Desktop: "WASD to move, Click to shoot, Space for power-up"
   - Mobile: Virtual joystick (left) and action buttons (right)
5. WHEN the visitor interacts with the demo THEN the Landing_Page SHALL provide:
   - Full movement mechanics (WASD/joystick, 200 units/second)
   - Combat mechanics (click/tap to shoot, 500ms cooldown)
   - Bot opponent with basic AI (moves toward player, shoots every 2 seconds)
   - 60-second demo timer displayed in corner
6. WHEN the demo timer reaches 0 OR player/bot health reaches 0 THEN the Landing_Page SHALL display a results overlay showing:
   - Win/Lose/Draw status
   - Damage dealt/received stats
   - "Sign Up to Play Real Opponents" CTA button
7. WHEN the demo canvas is not in viewport (scrolled away) THEN the Landing_Page SHALL pause the game loop to conserve CPU/GPU resources
8. WHEN the demo canvas returns to viewport THEN the Landing_Page SHALL resume the game loop within 100ms
9. WHEN the demo is active THEN the Landing_Page SHALL render the Nexus Arena map with all visual elements (barriers, hazards, floor tiles)
10. WHEN the demo ends THEN the Landing_Page SHALL allow replay by clicking "Play Again" button without page reload

---

### Requirement 3: Feature Showcase with Scroll Animations

**User Story:** As a visitor, I want to see the game's features presented in an engaging way, so that I understand what makes this game unique and worth playing.

#### Acceptance Criteria

1. WHEN a visitor scrolls through the feature section THEN the Landing_Page SHALL display 4 feature cards in sequence:
   - "Real-Time Combat" - projectile mechanics showcase
   - "Trivia Integration" - quiz system showcase
   - "Dynamic Arenas" - map features showcase
   - "Competitive Play" - matchmaking/leaderboards showcase
2. WHEN a feature card enters the viewport (20% visible) THEN the Landing_Page SHALL trigger a staggered reveal animation:
   - Card slides in from left/right (alternating) over 0.6 seconds
   - Icon draws on using SVG stroke animation over 0.8 seconds
   - Title fades in at 0.3s delay
   - Description fades in at 0.5s delay
3. WHEN displaying the "Real-Time Combat" feature THEN the Landing_Page SHALL show an animated diagram with:
   - Two player sprites facing each other
   - Animated projectile traveling between them
   - Damage number popup on hit
   - Looping animation (3 second cycle)
4. WHEN displaying the "Trivia Integration" feature THEN the Landing_Page SHALL show:
   - Mock question card with 4 answer options
   - Animated selection highlight cycling through options
   - Correct answer reveal with green glow
   - Points awarded animation (+100 floating up)
5. WHEN displaying the "Dynamic Arenas" feature THEN the Landing_Page SHALL show:
   - Isometric mini-map view of Nexus Arena (scaled to 300x170px)
   - Animated player dots moving along lanes
   - Pulsing hazard zones
   - Teleporter activation effect (every 4 seconds)
6. WHEN displaying the "Competitive Play" feature THEN the Landing_Page SHALL show:
   - Animated leaderboard with 5 entries
   - Rank numbers counting up
   - ELO rating badges
   - "Find Match" button with queue animation
7. WHEN a feature card is fully visible THEN the Landing_Page SHALL pause its animation loop to reduce motion for accessibility
8. WHEN a feature card exits viewport THEN the Landing_Page SHALL reset animation state for re-entry

---

### Requirement 4: Real-time Stats and Social Proof

**User Story:** As a visitor, I want to see that this is an active game with real players, so that I feel confident joining an engaged community.

#### Acceptance Criteria

1. WHEN the stats section enters viewport THEN the Landing_Page SHALL display animated counters for:
   - Total games played (counting up from 0 to actual value over 2 seconds)
   - Active players online (real-time from API, updated every 30 seconds)
   - Questions answered (counting up animation)
   - Average match duration (formatted as "X:XX")
2. WHEN displaying player counts THEN the Landing_Page SHALL use eased number-rolling animation (ease-out curve) that counts up to actual values
3. WHEN the stats section is visible THEN the Landing_Page SHALL display a live feed panel showing:
   - Recent match results (last 5 matches)
   - Player avatars (or default icons)
   - Win/loss indicators
   - Time ago timestamps ("2m ago", "5m ago")
4. WHEN new match data arrives (polled every 30 seconds) THEN the Landing_Page SHALL animate new entries sliding in from the top with 0.3s transition
5. WHEN displaying stats THEN the Landing_Page SHALL show stat cards with:
   - Large number display (48px font)
   - Descriptive label below (14px font)
   - Subtle background glow matching brand colors
6. IF the API is unavailable THEN the Landing_Page SHALL display cached/fallback values with "Updated X hours ago" indicator

---

### Requirement 5: Technology Showcase Section

**User Story:** As a technically-minded visitor, I want to see the advanced technology powering the game, so that I appreciate the engineering quality and trust the platform.

#### Acceptance Criteria

1. WHEN displaying the tech stack THEN the Landing_Page SHALL show animated technology badges for:
   - React 18 (with concurrent rendering badge)
   - TypeScript (with type-safe badge)
   - WebSocket (with real-time badge)
   - Canvas 2D (with 60fps badge)
   - FastAPI (with async badge)
   - Supabase (with real-time DB badge)
2. WHEN a visitor hovers over a tech badge THEN the Landing_Page SHALL display a tooltip showing:
   - Technology name and version
   - Brief description of usage in the game
   - Performance metric if applicable
3. WHEN the tech section loads THEN the Landing_Page SHALL display an animated network diagram showing:
   - Client node (browser icon)
   - WebSocket connection line (animated dashes flowing)
   - Server node (server icon)
   - Database node (database icon)
   - Arrows showing data flow direction
4. WHEN displaying latency information THEN the Landing_Page SHALL show:
   - Live ping indicator (actual WebSocket ping if connected, or simulated)
   - Animated waveform visualization
   - "< 50ms typical latency" text
5. WHEN the tech section is visible THEN the Landing_Page SHALL animate the network diagram:
   - Data packets flowing along connection lines
   - Nodes pulsing when receiving data
   - 4-second animation cycle

---

### Requirement 6: Mobile-First Responsive Design

**User Story:** As a mobile visitor, I want the landing page to work flawlessly on my device, so that I can experience the full impact regardless of screen size.

#### Acceptance Criteria

1. WHEN viewed on mobile devices (width < 768px) THEN the Landing_Page SHALL adapt all animations to touch-friendly interactions:
   - Tap instead of hover for tooltips
   - Swipe gestures for feature carousel
   - Touch-and-hold for extended information
2. WHEN viewed on screens under 768px THEN the Landing_Page SHALL reorganize layout:
   - Single-column feature cards (stacked vertically)
   - Full-width demo canvas
   - Condensed stats display (2x2 grid instead of 4x1)
   - Hamburger menu for navigation
3. WHEN viewed on mobile THEN the Landing_Page SHALL reduce particle density:
   - Stars: 100 (down from 200)
   - Nebula clouds: 2 (down from 5)
   - Shooting stars: 1 max (down from 3)
4. WHEN the demo section is viewed on mobile THEN the Landing_Page SHALL display touch control overlays:
   - Left side: Virtual joystick (120px diameter)
   - Right side: Shoot button (80px), Power-up button (60px)
   - Semi-transparent (60% opacity) to not obscure gameplay
5. WHEN viewed on tablet (768px - 1024px) THEN the Landing_Page SHALL use intermediate layout:
   - Two-column feature cards
   - Scaled demo canvas (90% width)
   - Full stats display
6. WHEN orientation changes on mobile THEN the Landing_Page SHALL smoothly transition layout within 300ms

---

### Requirement 7: Performance and Loading Experience

**User Story:** As a visitor on any connection speed, I want the page to load quickly and progressively, so that I don't abandon before seeing the content.

#### Acceptance Criteria

1. WHEN the page begins loading THEN the Landing_Page SHALL display a branded loading animation within 100ms consisting of:
   - Centered logo silhouette
   - Pulsing glow effect
   - "Loading..." text with animated ellipsis
2. WHEN critical content loads THEN the Landing_Page SHALL achieve First Contentful Paint (FCP) under 1.5 seconds on 3G connection
3. WHEN heavy assets load THEN the Landing_Page SHALL use progressive loading:
   - Blur-up placeholders for images (20px blur, 10% quality)
   - Skeleton screens for dynamic content
   - Lazy loading for below-fold sections
4. WHEN all content loads THEN the Landing_Page SHALL achieve Largest Contentful Paint (LCP) under 2.5 seconds on 3G connection
5. WHEN animations run THEN the Landing_Page SHALL maintain minimum 60fps on devices with:
   - Intel UHD 620 or equivalent integrated graphics
   - 4GB RAM minimum
   - Chrome 90+, Firefox 88+, Safari 14+
6. WHEN the page loads THEN the Landing_Page SHALL implement code splitting:
   - Hero section: immediate load
   - Demo section: lazy load on scroll (500px before visible)
   - Feature sections: lazy load on scroll
   - Stats section: lazy load on scroll
7. WHEN assets are cached THEN the Landing_Page SHALL achieve sub-500ms load times on repeat visits
8. WHEN JavaScript fails to load THEN the Landing_Page SHALL display a functional fallback with:
   - Static hero image
   - Basic feature descriptions
   - Working CTA links

---

### Requirement 8: Call-to-Action Flow

**User Story:** As a visitor ready to play, I want clear paths to start playing, so that I can quickly get into the game without confusion.

#### Acceptance Criteria

1. WHEN the visitor clicks any CTA button THEN the Landing_Page SHALL navigate to the registration page with:
   - Smooth page transition (fade out 0.3s, fade in 0.3s)
   - Preserved scroll position for back navigation
   - UTM parameter tracking for conversion analytics
2. WHEN the visitor is already authenticated (has valid session) THEN the Landing_Page SHALL:
   - Replace "Sign Up" CTAs with "Play Now"
   - Navigate directly to home dashboard on CTA click
   - Show personalized greeting in header ("Welcome back, [username]")
3. WHEN CTAs are displayed THEN the Landing_Page SHALL show contextual microcopy based on section:
   - Hero: "Play Now - Free" (primary), "Watch Gameplay" (secondary)
   - Demo end: "Sign Up to Play Real Opponents"
   - Features: "Try This Feature"
   - Footer: "Join [X] Players Now"
4. WHEN the visitor reaches the page footer THEN the Landing_Page SHALL display a final full-width CTA section with:
   - Animated background (subtle particle effect)
   - Large headline: "Ready to Dominate?"
   - Primary CTA button (same style as hero)
   - Secondary links: "Learn More", "View Leaderboards"
5. WHEN the visitor scrolls past 75% of page THEN the Landing_Page SHALL display a sticky bottom CTA bar (mobile only) with:
   - Condensed "Sign Up Free" button
   - Dismiss option (X button)
   - Auto-hide after 10 seconds if not interacted with
6. WHEN any CTA is clicked THEN the Landing_Page SHALL fire analytics event with:
   - CTA location (hero, demo, feature, footer)
   - Time on page before click
   - Scroll depth at click time

---

### Requirement 9: Accessibility and Reduced Motion

**User Story:** As a visitor with motion sensitivity or using assistive technology, I want the landing page to be accessible, so that I can experience the content comfortably.

#### Acceptance Criteria

1. WHEN the user has prefers-reduced-motion enabled THEN the Landing_Page SHALL:
   - Disable all particle animations
   - Replace scroll animations with instant reveals
   - Stop looping animations after first cycle
   - Reduce parallax effect to static positioning
2. WHEN screen reader is detected THEN the Landing_Page SHALL provide:
   - Descriptive alt text for all visual elements
   - ARIA labels for interactive components
   - Skip-to-content link at page top
   - Logical heading hierarchy (h1 → h2 → h3)
3. WHEN keyboard navigation is used THEN the Landing_Page SHALL:
   - Provide visible focus indicators on all interactive elements
   - Support Tab navigation through all CTAs
   - Support Enter/Space to activate buttons
   - Support Escape to close modals/overlays
4. WHEN displaying color-coded information THEN the Landing_Page SHALL:
   - Not rely solely on color to convey meaning
   - Maintain WCAG AA contrast ratio (4.5:1 for text)
   - Provide text labels alongside color indicators
5. WHEN the demo section is focused THEN the Landing_Page SHALL provide:
   - Keyboard controls as alternative to mouse (Arrow keys for movement)
   - Audio cues for game events (optional, off by default)
   - Pause functionality accessible via keyboard (P key)

---

### Requirement 10: SEO and Social Sharing

**User Story:** As a potential player finding the game through search or social media, I want proper metadata and previews, so that I understand what the game is before clicking.

#### Acceptance Criteria

1. WHEN the page is indexed by search engines THEN the Landing_Page SHALL include:
   - Unique title tag: "1v1 Bro - Real-Time PvP Trivia Arena Game"
   - Meta description (150-160 chars): "Challenge players worldwide in fast-paced trivia battles. Answer questions, dodge attacks, and climb the leaderboards. Play free now!"
   - Canonical URL
   - Structured data (Game schema)
2. WHEN shared on social media THEN the Landing_Page SHALL provide Open Graph tags:
   - og:title: "1v1 Bro - Real-Time PvP Trivia Arena"
   - og:description: "Challenge players in fast-paced trivia battles"
   - og:image: 1200x630px preview image showing gameplay
   - og:type: "website"
3. WHEN shared on Twitter THEN the Landing_Page SHALL provide Twitter Card tags:
   - twitter:card: "summary_large_image"
   - twitter:title, twitter:description, twitter:image
4. WHEN the page loads THEN the Landing_Page SHALL be server-side renderable for:
   - Search engine crawlers
   - Social media preview generators
   - Users with JavaScript disabled (basic content)

---

## System Architecture

```
frontend/src/
├── pages/
│   └── Landing.tsx                 # Main landing page component (<400 lines)
│
├── components/
│   └── landing/                    # Landing page components
│       ├── index.ts                # Exports
│       ├── HeroSection.tsx         # Hero with animated background (<300 lines)
│       ├── LiveDemo.tsx            # Embedded game demo (<350 lines)
│       ├── FeatureShowcase.tsx     # Feature cards with animations (<300 lines)
│       ├── StatsSection.tsx        # Real-time stats display (<200 lines)
│       ├── TechShowcase.tsx        # Technology badges (<200 lines)
│       ├── FooterCTA.tsx           # Final call-to-action (<150 lines)
│       ├── MobileControls.tsx      # Touch controls overlay (<200 lines)
│       └── LoadingScreen.tsx       # Initial loading animation (<100 lines)
│
├── components/landing/animations/  # Animation components
│   ├── LogoReveal.tsx              # SVG logo animation (<150 lines)
│   ├── ParticleBurst.tsx           # CTA hover effect (<100 lines)
│   ├── NumberCounter.tsx           # Animated stat counter (<100 lines)
│   ├── FeatureCard.tsx             # Scroll-animated card (<200 lines)
│   └── NetworkDiagram.tsx          # Tech section animation (<200 lines)
│
├── hooks/
│   └── landing/                    # Landing page hooks
│       ├── useScrollAnimation.ts   # Intersection Observer hook (<100 lines)
│       ├── useDemoGame.ts          # Demo game state management (<200 lines)
│       ├── useParallax.ts          # Parallax scroll effect (<80 lines)
│       └── useReducedMotion.ts     # Accessibility preference (<50 lines)
│
└── services/
    └── statsAPI.ts                 # Stats fetching service (<100 lines)
```

---

## Integration Points

### With Existing Systems

| System | Integration |
|--------|-------------|
| GameEngine | Embedded in LiveDemo component for playable demo |
| BackdropLayers | Reused in HeroSection for animated background |
| ArenaManager | Loads Nexus Arena map for demo |
| CombatSystem | Provides combat mechanics for demo |
| PlayerRenderer | Renders player sprites in demo |
| AuthStore | Checks authentication state for CTA personalization |
| Router | Handles navigation to /register, /login, / |

### Event Flow

```
Page Load → LoadingScreen displays → Assets preload
         → HeroSection initializes backdrop layers
         → Intersection Observer registers sections
         → Loading complete → LoadingScreen fades out

Scroll → Intersection Observer triggers
      → Section enters viewport → Animation starts
      → Section exits viewport → Animation pauses/resets

Demo Start → GameEngine initializes with demo config
          → Bot AI activates
          → Timer starts (60s)
          → Player input enabled

Demo End → Results overlay displays
        → Stats calculated
        → CTA presented
        → GameEngine pauses

CTA Click → Analytics event fired
         → Page transition animation
         → Navigate to /register or /
```

---

## Out of Scope (Future Phases)

These features are explicitly NOT part of this implementation:

- Video trailer/gameplay footage
- User testimonials/reviews section
- Blog/news integration
- Discord widget integration
- Twitch stream embed
- Multi-language support (i18n)
- A/B testing framework
- Email capture/newsletter signup
- Pricing/premium features section
- Download links (mobile apps)
- Detailed game tutorial
- Character/skin showcase

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Frame Rate | 60fps sustained | Performance profiler |
| Bounce Rate | < 40% | Analytics |
| Demo Play Rate | > 30% of visitors | Analytics |
| Demo Completion Rate | > 50% of demo starts | Analytics |
| CTA Click Rate | > 15% | Analytics |
| Mobile Usability | 100/100 | Lighthouse |
| Accessibility Score | > 90/100 | Lighthouse |
| SEO Score | > 90/100 | Lighthouse |

---

## Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | Touch controls |
| Chrome Android | 90+ | Touch controls |
| Samsung Internet | 14+ | Touch controls |

---

## Performance Budget

| Resource Type | Budget | Notes |
|---------------|--------|-------|
| HTML | < 50KB | Compressed |
| CSS | < 100KB | Compressed, critical inlined |
| JavaScript | < 300KB | Initial bundle, code-split |
| Images | < 500KB | Total, lazy loaded |
| Fonts | < 100KB | Subset, preloaded |
| Total Initial | < 500KB | Above-fold content |
| Total Page | < 2MB | All assets loaded |
