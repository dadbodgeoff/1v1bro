# Requirements Document

## Introduction

This feature creates a unique, memorable landing page experience for 1v1 Bro that simulates a retro CRT gaming monitor/arcade cabinet. The entire landing page IS the CRT screen - users view the page as if looking at an old-school gaming console's display. The experience includes a boot-up sequence that transitions into a "dashboard" showing the live gameplay demo, headline, tagline, and CTAs. This approach creates a viral-worthy, talk-about-it landing page that differentiates 1v1 Bro from competitors while maintaining full functionality.

## Glossary

- **CRT_Monitor**: The retro cathode-ray tube monitor visual frame that surrounds the entire viewport, rendered as SVG
- **Boot_Sequence**: The animated power-on sequence that plays when the page loads, simulating a retro console starting up
- **Screen_Content**: The interactive area inside the CRT frame where the dashboard, demo, and CTAs are displayed
- **Scanline_Effect**: Horizontal lines overlaid on the screen to simulate CRT display characteristics
- **Phosphor_Glow**: The characteristic glow effect of CRT displays, particularly on bright elements
- **LiveDemo**: The existing AI vs AI gameplay demonstration component that auto-plays on the landing page
- **Dashboard_UI**: The main content area after boot sequence completes, containing demo, headline, tagline, and CTAs

## Requirements

### Requirement 1: CRT Monitor Frame

**User Story:** As a visitor, I want to see the landing page framed within a realistic retro CRT monitor/arcade cabinet, so that I immediately understand this is a gaming product with a unique personality.

#### Acceptance Criteria

1. WHEN the page loads THEN the CRT_Monitor frame SHALL render as an SVG element that surrounds the entire viewport
2. WHEN viewing on desktop THEN the CRT_Monitor SHALL display with visible bezel, rounded screen corners, and cabinet details (vents, power LED, brand area)
3. WHEN viewing on mobile THEN the CRT_Monitor frame SHALL adapt to show minimal bezel while maintaining the CRT aesthetic
4. WHEN the CRT_Monitor renders THEN the Screen_Content area SHALL maintain a 16:9 or 4:3 aspect ratio appropriate for retro displays
5. WHEN the power LED is visible THEN the CRT_Monitor SHALL display an animated glowing indicator in brand orange (#F97316)

### Requirement 2: Boot Sequence Animation

**User Story:** As a visitor, I want to see an engaging boot-up animation when the page loads, so that I feel like I'm powering on a real gaming console.

#### Acceptance Criteria

1. WHEN the page first loads THEN the Boot_Sequence SHALL begin with a black screen and CRT power-on effect (warm-up glow expanding from center)
2. WHEN the Boot_Sequence starts THEN the system SHALL display retro-styled boot text lines appearing sequentially (e.g., "INITIALIZING ARENA SYSTEMS...")
3. WHEN boot text displays THEN each line SHALL appear with a typewriter effect and appropriate timing delays
4. WHEN the Boot_Sequence progresses THEN a progress bar SHALL fill to indicate loading completion
5. WHEN the Boot_Sequence completes THEN the screen SHALL transition smoothly to reveal the Dashboard_UI
6. WHEN the user presses Space, Enter, or clicks "Skip" THEN the Boot_Sequence SHALL skip immediately to the Dashboard_UI
7. WHEN the Boot_Sequence runs THEN the total duration SHALL NOT exceed 5 seconds before auto-completing

### Requirement 3: CRT Visual Effects

**User Story:** As a visitor, I want to see authentic CRT visual effects on the screen content, so that the retro aesthetic feels genuine and immersive.

#### Acceptance Criteria

1. WHILE the Screen_Content is visible THEN the Scanline_Effect SHALL overlay horizontal lines at consistent intervals
2. WHILE bright elements display THEN the Phosphor_Glow effect SHALL create subtle bloom around text and UI elements
3. WHEN the screen content updates THEN a subtle screen flicker effect SHALL occur occasionally (every 10-30 seconds)
4. WHILE the CRT effects are active THEN the screen edges SHALL display slight barrel distortion (curved edges)
5. WHEN the user has reduced-motion preferences enabled THEN the system SHALL disable flicker and reduce animation intensity
6. WHILE CRT effects render THEN the performance SHALL maintain 60fps on modern devices

### Requirement 4: Dashboard UI Layout

**User Story:** As a visitor, I want to see the game demo, headline, and CTAs clearly within the CRT screen, so that I understand what the product is and can take action.

#### Acceptance Criteria

1. WHEN the Dashboard_UI displays THEN the LiveDemo component SHALL render prominently and auto-play immediately
2. WHEN the Dashboard_UI displays THEN the headline "1v1 Bro" SHALL appear with Phosphor_Glow effect
3. WHEN the Dashboard_UI displays THEN the tagline "Trivia Duels With Real-Time Combat" SHALL appear below the headline
4. WHEN the Dashboard_UI displays THEN primary CTA "Play Now" and secondary CTA "Sign Up" SHALL be clearly visible
5. WHEN a user clicks the primary CTA THEN the system SHALL navigate to /instant-play (guests) or /dashboard (authenticated)
6. WHEN a user clicks the secondary CTA THEN the system SHALL navigate to /register (guests) or /dashboard (authenticated)
7. WHEN the Dashboard_UI renders THEN all interactive elements SHALL meet 44px minimum touch target size

### Requirement 5: Responsive Design

**User Story:** As a visitor on any device, I want the CRT landing page to work well regardless of screen size, so that I have a good experience on mobile, tablet, or desktop.

#### Acceptance Criteria

1. WHEN viewing on mobile (<768px) THEN the CRT_Monitor frame SHALL simplify to a minimal bezel with screen taking most of viewport
2. WHEN viewing on tablet (768px-1024px) THEN the CRT_Monitor SHALL display with moderate bezel and full effects
3. WHEN viewing on desktop (>1024px) THEN the CRT_Monitor SHALL display with full cabinet details and maximum visual fidelity
4. WHEN the viewport resizes THEN the Screen_Content SHALL scale proportionally while maintaining aspect ratio
5. WHEN viewing on any device THEN all text SHALL remain readable and CTAs SHALL remain accessible

### Requirement 6: Performance and Accessibility

**User Story:** As a visitor, I want the page to load quickly and be accessible, so that I can use it regardless of my device capabilities or accessibility needs.

#### Acceptance Criteria

1. WHEN the page loads THEN the initial render SHALL complete within 3 seconds on 3G connections
2. WHEN screen readers access the page THEN all interactive elements SHALL have appropriate ARIA labels
3. WHEN keyboard navigation is used THEN focus states SHALL be clearly visible with brand-appropriate styling
4. WHEN the Boot_Sequence plays THEN a skip button SHALL be keyboard-accessible from the start
5. WHEN CRT effects render THEN the system SHALL use CSS/SVG filters rather than heavy JavaScript for performance
6. WHEN the user has prefers-reduced-motion enabled THEN animations SHALL be minimized or disabled
7. WHEN SVG filters are unsupported THEN the system SHALL gracefully degrade to CSS fallbacks without visual breakage
8. WHEN frame rate drops below 30fps for 2 seconds THEN the system SHALL automatically reduce effect intensity
9. WHEN the page renders THEN the system SHALL prevent horizontal scroll on all viewport sizes
10. WHEN viewing on notched devices THEN the system SHALL respect safe-area-inset CSS properties

### Requirement 7: Sound Effects (Optional Enhancement)

**User Story:** As a visitor, I want optional retro sound effects, so that the experience feels even more authentic if I choose to enable audio.

#### Acceptance Criteria

1. WHEN the page loads THEN audio SHALL be muted by default
2. WHERE the user enables sound THEN the Boot_Sequence SHALL play a retro startup chime
3. WHERE the user enables sound THEN CTA hover/click SHALL play subtle UI feedback sounds
4. WHEN sound is enabled THEN a visible mute/unmute toggle SHALL appear on the CRT frame
5. WHEN the user mutes sound THEN the preference SHALL persist in localStorage
6. WHEN sound effects are generated THEN the system SHALL use Web Audio API oscillators to synthesize retro 8-bit style sounds programmatically
7. WHEN the startup chime plays THEN the system SHALL generate an ascending tone sequence using square/sine wave oscillators lasting 1-2 seconds
8. WHEN UI click/hover sounds play THEN the system SHALL generate short blip sounds (50-100ms) with different pitches for hover vs click

### Requirement 8: Visual Polish and Delight Details

**User Story:** As a visitor, I want to experience premium visual details and micro-interactions, so that the landing page feels polished and worth sharing with friends.

#### Acceptance Criteria

1. WHEN the CRT powers on THEN the screen SHALL display a warm-up effect with the glow expanding from center outward over 600ms
2. WHEN boot text displays THEN a blinking terminal cursor (█) SHALL appear at the end of the current line with 530ms blink interval
3. WHEN the headline renders THEN it SHALL have a multi-layer text-shadow creating a phosphor glow effect in brand orange
4. WHEN the dashboard loads THEN elements SHALL stagger-animate in sequence: Demo → Headline → Tagline → Primary CTA → Secondary CTA with 80ms delays
5. WHEN hovering over CTAs THEN the button SHALL lift 2px and the glow intensity SHALL increase by 50%
6. WHEN pressing CTAs THEN the button SHALL scale to 97% for tactile feedback
7. WHEN the dashboard has been visible for 3 seconds THEN a subtle "PRESS START" text SHALL blink at the bottom of the screen
8. WHEN the CRT frame renders THEN it SHALL include a glass reflection gradient overlay for realism
9. WHEN the demo is playing THEN a pulsing green "LIVE" indicator dot SHALL appear in the corner
10. WHEN viewing on desktop THEN the CRT bezel SHALL display ventilation slots and a brand badge

### Requirement 9: Integration with Existing Systems

**User Story:** As a developer, I want the CRT landing page to integrate cleanly with existing components and routing, so that it can replace or coexist with the current landing page.

#### Acceptance Criteria

1. WHEN the CRT landing page is built THEN it SHALL import and use the existing LiveDemo component
2. WHEN the CRT landing page is built THEN it SHALL use the existing authentication state from useAuthStore
3. WHEN the CRT landing page is built THEN it SHALL follow the existing brand color system from tokens.css (Brand Orange #F97316, backgrounds, text colors)
4. WHEN the CRT landing page is deployed THEN it SHALL be accessible at a configurable route (initially /arcade, optionally replacing /)
5. WHEN analytics are configured THEN the page SHALL track views and CTA clicks using the existing analytics service
6. WHEN typography is rendered THEN it SHALL use the Inter font family for headlines/body and JetBrains Mono for boot text as defined in BRAND_SYSTEM.md
7. WHEN spacing is applied THEN it SHALL use the 4px base unit spacing scale from tokens.css

### Requirement 10: Error Resilience

**User Story:** As a visitor, I want the landing page to work even if some features fail, so that I can still learn about and access the product.

#### Acceptance Criteria

1. WHEN any component throws an error THEN the ErrorBoundary SHALL catch it and display a static fallback page
2. WHEN the LiveDemo fails to load THEN the system SHALL display a static gameplay screenshot with "Demo unavailable" message
3. WHEN the boot sequence fails THEN the system SHALL skip directly to the dashboard within 2 seconds
4. WHEN authentication state is undefined during CTA click THEN the system SHALL default to unauthenticated navigation targets
5. WHEN iOS Safari 18 is detected THEN the system SHALL use CSS fallbacks for SVG filters that have known bugs

### Requirement 11: Analytics and Observability

**User Story:** As a product manager, I want detailed analytics on the landing page funnel, so that I can optimize conversion and identify issues.

#### Acceptance Criteria

1. WHEN the boot sequence starts THEN the system SHALL track arcade_boot_start event
2. WHEN the boot sequence changes phase THEN the system SHALL track arcade_boot_phase event with phase name
3. WHEN the user skips the boot sequence THEN the system SHALL track arcade_boot_skip event with elapsed time
4. WHEN the boot sequence completes THEN the system SHALL track arcade_boot_complete event with duration and skip status
5. WHEN performance degrades THEN the system SHALL track arcade_performance_degraded event with FPS data
6. WHEN the error boundary triggers THEN the system SHALL track arcade_error_boundary_triggered event
