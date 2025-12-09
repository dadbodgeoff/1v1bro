# Requirements Document

## Introduction

This specification defines a comprehensive AAA-quality landing page redesign for the 1v1bro gaming platform. The goal is to create a professional, enterprise-grade landing experience that screams "2026" - not just 2025 - with custom backgrounds, professional typography hierarchy, bespoke components, and a visual identity that establishes 1v1bro as a premium competitive gaming destination.

**Current State Analysis:**

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| Background | Solid neutral-950 | No visual impact, generic, forgettable |
| Typography | Basic Tailwind defaults | No hierarchy, no brand identity |
| Buttons | Simple white/neutral | Generic, no premium feel |
| Layout | Basic grid | No visual flow, no storytelling |
| Icons | Emoji placeholders | Unprofessional, inconsistent |
| Color Palette | Neutral grays + white | No brand colors, AI-default feel |
| Hero Section | Text + demo box | No immersion, no excitement |
| Components | Standard Tailwind | No custom design language |

**Design Principles:**

1. **No Gradient Colors** - Clean, solid colors with depth through layering
2. **No Cyan/Purple/AI Colors** - Intentional, brand-specific palette
3. **Custom Background** - Immersive scene that tells a story
4. **Enterprise Typography** - Professional hierarchy with custom sizing
5. **Bespoke Components** - Custom boxes, buttons, icons designed for 1v1bro
6. **2026 Aesthetic** - Forward-looking, not following current trends

**Page Structure (5 Sections):**

1. **Hero Section** - Full-bleed gameplay background, headline, dual CTAs, trust line
2. **How It Works** - 3-step horizontal flow with icons
3. **Features Grid** - 2×3 feature cards under "Built For Competitive Chaos"
4. **Social Proof & Use Cases** - "Perfect For..." with audience segments
5. **Closing CTA** - "Ready To Settle It?" with final conversion push

**Official Copy:**

- **Headline**: "1v1 Bro – Trivia Duels With Real-Time Combat"
- **Subheadline**: "Outplay your friends in a live 1v1 arena where every question, dodge, and shot can swing the match."
- **Primary CTA**: "Play Free In Browser"
- **Secondary CTA**: "Host a Match With Friends"
- **Trust Line**: "No downloads. No setup. Just share a code and start battling."

## Glossary

- **Landing_System**: The public-facing landing page at `frontend/src/pages/Landing.tsx`
- **Background_Scene**: Multi-layer background system creating depth and atmosphere
- **Typography_Scale**: The 8-level type hierarchy from Display to Caption
- **Component_Box**: Base container component with consistent styling
- **CTA_Button**: Call-to-action button with primary/secondary/tertiary variants
- **Feature_Card**: Premium card component for showcasing features
- **Hero_Section**: Above-the-fold cinematic introduction area
- **Social_Proof**: Section displaying stats, testimonials, and trust indicators
- **Icon_System**: Consistent SVG icon library with 24px base size
- **Brand_Palette**: The official color system excluding gradients and AI colors
- **Depth_Layer**: Visual layer in the background scene (far, mid, near, foreground)
- **Hover_State**: Interactive visual feedback on mouse hover
- **Focus_State**: Accessibility-compliant focus indicator for keyboard navigation

## Requirements

### Requirement 1: Brand Color Palette

**User Story:** As a visitor, I want to see a distinctive, professional color scheme, so that 1v1bro feels like a premium gaming brand rather than a generic template.

#### Acceptance Criteria

1.1. WHEN the Landing_System renders THEN the system SHALL use the following primary palette:
- **Background Deep**: #0A0A0B (near-black with subtle warmth)
- **Background Mid**: #121214 (elevated surfaces)
- **Background Light**: #1A1A1D (cards, containers)
- **Surface**: #222226 (interactive elements)
- **Border Subtle**: rgba(255, 255, 255, 0.06)
- **Border Default**: rgba(255, 255, 255, 0.10)
- **Border Strong**: rgba(255, 255, 255, 0.16)

1.2. WHEN displaying text THEN the system SHALL use the following text colors:
- **Text Primary**: #FFFFFF (headings, important content)
- **Text Secondary**: #A1A1AA (body text, descriptions)
- **Text Muted**: #71717A (captions, metadata)
- **Text Disabled**: #52525B (inactive states)

1.3. WHEN displaying accent colors THEN the system SHALL use:
- **Accent Primary**: #E85D04 (warm orange - CTAs, highlights)
- **Accent Secondary**: #DC2626 (deep red - arena theme)
- **Accent Tertiary**: #F59E0B (amber - rewards, premium)
- **Success**: #22C55E (wins, positive feedback)
- **Warning**: #EAB308 (cautions, timers)
- **Error**: #EF4444 (errors, losses)

1.4. WHEN any color is applied THEN the system SHALL NOT use:
- Gradient fills on backgrounds or buttons
- Cyan (#00FFFF or similar)
- Purple (#8B5CF6 or similar)
- Neon colors
- Default Tailwind indigo/violet

### Requirement 2: Typography Hierarchy

**User Story:** As a visitor, I want clear visual hierarchy in text, so that I can quickly scan and understand the page content.

#### Acceptance Criteria

2.1. WHEN the Typography_Scale is applied THEN the system SHALL define 8 levels:
```
Display:    64px / 72px line-height / -0.02em tracking / 800 weight
H1:         48px / 56px line-height / -0.02em tracking / 700 weight
H2:         36px / 44px line-height / -0.01em tracking / 700 weight
H3:         28px / 36px line-height / -0.01em tracking / 600 weight
H4:         24px / 32px line-height / 0em tracking / 600 weight
Body Large: 18px / 28px line-height / 0em tracking / 400 weight
Body:       16px / 24px line-height / 0em tracking / 400 weight
Caption:    14px / 20px line-height / 0.01em tracking / 500 weight
```

2.2. WHEN rendering headings THEN the system SHALL apply:
- Font family: Inter (with system fallbacks)
- Anti-aliased rendering
- Subpixel rendering disabled for consistency

2.3. WHEN rendering body text THEN the system SHALL apply:
- Maximum line length: 65 characters (ch units)
- Paragraph spacing: 1.5em between paragraphs
- Text color: Text Secondary (#A1A1AA)

2.4. WHEN rendering on mobile (< 640px) THEN the system SHALL scale typography:
```
Display:    40px / 48px line-height
H1:         32px / 40px line-height
H2:         28px / 36px line-height
H3:         24px / 32px line-height
H4:         20px / 28px line-height
Body Large: 16px / 24px line-height
Body:       15px / 22px line-height
Caption:    13px / 18px line-height
```

### Requirement 3: Custom Background Scene

**User Story:** As a visitor, I want to see an immersive background that showcases the arena experience, so that I immediately understand this is a competitive gaming platform.

#### Acceptance Criteria

3.1. WHEN the Background_Scene renders THEN the system SHALL display 4 depth layers:
- **Far Layer** (z-index: 0): Distant volcanic mountains with subtle glow
- **Mid Layer** (z-index: 1): Arena silhouette with lava pools
- **Near Layer** (z-index: 2): Floating platforms and debris
- **Foreground Layer** (z-index: 3): Particle effects and atmospheric haze

3.2. WHEN rendering the Far Layer THEN the system SHALL display:
- Mountain silhouettes in #1A0A0A
- Horizon glow in Accent Secondary (#DC2626) at 20% opacity
- Subtle animated pulse (0.5Hz frequency)
- Static position (no parallax)

3.3. WHEN rendering the Mid Layer THEN the system SHALL display:
- Arena structure outline in #222226
- Lava pool reflections with animated shimmer
- Parallax movement at 0.3x scroll rate
- Opacity: 60%

3.4. WHEN rendering the Near Layer THEN the system SHALL display:
- Floating rock platforms in #2D2D2D
- Subtle rotation animation (±2 degrees, 8s cycle)
- Parallax movement at 0.6x scroll rate
- Opacity: 80%

3.5. WHEN rendering the Foreground Layer THEN the system SHALL display:
- Ember particles rising (20-40 particles)
- Smoke wisps at bottom edge
- Parallax movement at 1.2x scroll rate
- Particles fade at 70% viewport height

3.6. WHEN the background renders THEN the system SHALL apply vignette:
- Darken edges by 40%
- Radius: 60% of viewport diagonal
- Smooth falloff (no hard edge)

3.7. WHEN performance is constrained THEN the system SHALL reduce:
- Particle count to 10
- Disable parallax on mobile
- Reduce animation frame rate to 30fps

### Requirement 4: Component Box System

**User Story:** As a visitor, I want consistent, premium-looking containers, so that the page feels cohesive and professionally designed.

#### Acceptance Criteria

4.1. WHEN a Component_Box renders THEN the system SHALL apply base styles:
- Background: Background Light (#1A1A1D)
- Border: 1px solid Border Subtle
- Border radius: 16px
- Padding: 24px (desktop), 20px (tablet), 16px (mobile)

4.2. WHEN Component_Box has variant "elevated" THEN the system SHALL apply:
- Background: Background Mid (#121214)
- Box shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
- Border: 1px solid Border Default

4.3. WHEN Component_Box has variant "interactive" THEN the system SHALL apply:
- Hover: translateY(-2px), box-shadow increase
- Transition: 200ms ease-out
- Cursor: pointer
- Focus: 2px outline in Accent Primary

4.4. WHEN Component_Box has variant "featured" THEN the system SHALL apply:
- Border: 1px solid Accent Primary at 30% opacity
- Subtle inner glow: inset 0 0 40px rgba(232, 93, 4, 0.05)
- No gradient backgrounds

4.5. WHEN Component_Box contains a header THEN the system SHALL display:
- Title in H4 typography
- Optional subtitle in Caption typography, Text Muted color
- 16px gap between header and content
- Optional right-aligned action element

### Requirement 5: CTA Button System

**User Story:** As a visitor, I want clear, compelling call-to-action buttons, so that I know exactly what actions I can take.

#### Acceptance Criteria

5.1. WHEN a CTA_Button renders with variant "primary" THEN the system SHALL apply:
- Background: Accent Primary (#E85D04)
- Text: #FFFFFF, 16px, 600 weight
- Padding: 16px 32px
- Border radius: 12px
- Min height: 52px
- Min width: 160px

5.2. WHEN a CTA_Button renders with variant "secondary" THEN the system SHALL apply:
- Background: transparent
- Border: 1px solid Border Strong
- Text: Text Primary, 16px, 500 weight
- Padding: 14px 28px
- Border radius: 12px

5.3. WHEN a CTA_Button renders with variant "tertiary" THEN the system SHALL apply:
- Background: transparent
- Border: none
- Text: Text Secondary, 16px, 500 weight
- Underline on hover
- Padding: 8px 16px

5.4. WHEN CTA_Button is hovered THEN the system SHALL apply:
- Primary: brightness(1.1), translateY(-1px)
- Secondary: background rgba(255, 255, 255, 0.04), border Border Strong
- Tertiary: text color Text Primary
- Transition: 150ms ease-out

5.5. WHEN CTA_Button is focused THEN the system SHALL apply:
- 2px outline offset 2px
- Outline color: Accent Primary
- Visible focus ring for accessibility

5.6. WHEN CTA_Button is disabled THEN the system SHALL apply:
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

5.7. WHEN CTA_Button has size "large" THEN the system SHALL apply:
- Padding: 20px 40px
- Font size: 18px
- Min height: 60px
- Border radius: 14px

### Requirement 6: Hero Section

**User Story:** As a visitor, I want an impactful first impression, so that I immediately understand what 1v1bro offers and feel compelled to try it.

#### Acceptance Criteria

6.1. WHEN the Hero_Section renders THEN the system SHALL display:
- Full viewport height (100vh) with scroll indicator
- Full-bleed gameplay background (arena screenshot, slightly darkened)
- Content positioned center-left with right side showing looping gameplay clip or character cards

6.2. WHEN rendering hero content THEN the system SHALL display:
- Headline: "1v1 Bro – Trivia Duels With Real-Time Combat" in Display typography
- Subheadline: "Outplay your friends in a live 1v1 arena where every question, dodge, and shot can swing the match." in Body Large, Text Secondary
- Primary CTA: "Play Free In Browser" (large variant, Accent Primary)
- Secondary CTA: "Host a Match With Friends" (secondary variant)
- Trust line: "No downloads. No setup. Just share a code and start battling." in Caption, Text Muted

6.3. WHEN the headline renders THEN the system SHALL display:
- Text split with "1v1 Bro" emphasized
- Animated text reveal (fade up, 0.5s delay per word)
- No gradient text effects
- Max-width: 700px

6.4. WHEN hero CTAs render THEN the system SHALL display:
- Horizontal layout on desktop (gap: 16px)
- Stacked layout on mobile (gap: 12px)
- Primary CTA first in visual hierarchy
- Trust line positioned 16px below CTAs

6.5. WHEN scroll indicator renders THEN the system SHALL display:
- Positioned at bottom center, 32px from edge
- Animated bounce (1s cycle)
- Chevron icon pointing down
- Fades out after 3 seconds of no scroll

6.6. WHEN user scrolls past 100px THEN the system SHALL:
- Fade hero content to 0 opacity over 200px scroll
- Parallax hero content at 0.5x scroll rate
- Keep background visible

### Requirement 7: Feature Showcase Section

**User Story:** As a visitor, I want to understand the key features of 1v1bro, so that I can decide if it's worth trying.

#### Acceptance Criteria

7.1. WHEN the Feature Showcase renders THEN the system SHALL display:
- Section heading: "Built For Competitive Chaos" in H2 typography, centered
- 6 Feature_Cards in 2×3 responsive grid

7.2. WHEN a Feature_Card renders THEN the system SHALL display:
- Component_Box with "interactive" variant
- Custom icon (48px, Accent Primary)
- Title: H4 typography
- Description: Body typography, Text Secondary
- Min height: 200px

7.3. WHEN Feature_Cards are arranged THEN the system SHALL use:
- Desktop (> 1024px): 3-column grid, 2 rows, 24px gap
- Tablet (640-1024px): 2-column grid, 20px gap
- Mobile (< 640px): 1-column stack, 16px gap

7.4. WHEN displaying features THEN the system SHALL show exactly these 6 cards:
- **Real-time 2D arena**: "WASD movement, obstacles, hazards, and projectiles instead of static quiz screens."
- **Head-to-head trivia**: "Fifteen fast-paced questions where timing and accuracy both matter."
- **Power-ups that flip rounds**: "Freeze time, steal points, shield yourself, and more."
- **Progression & battle pass**: "Unlock skins, emotes, and crowns as you climb tiers each season."
- **Cosmetic-only monetization**: "No pay-to-win: coins and skins are for flexing, not stat boosts."
- **Play anywhere**: "Runs in the browser; perfect for Discord calls, parties, and office breaks."

7.5. WHEN a Feature_Card is hovered THEN the system SHALL apply:
- Icon color shifts to Accent Tertiary
- Card elevates (translateY -4px)
- Subtle glow appears (box-shadow)

### Requirement 8: How It Works Section

**User Story:** As a visitor, I want to understand the gameplay flow, so that I know what to expect before signing up.

#### Acceptance Criteria

8.1. WHEN the How It Works section renders THEN the system SHALL display:
- Section title: "How It Works" in H2 typography, centered
- 3 step cards in horizontal layout
- Connecting line between steps (desktop only)
- Simple icons for each step

8.2. WHEN a step card renders THEN the system SHALL display:
- Step number: Display typography, Accent Primary, 20% opacity
- Step title: H3 typography
- Step description: Body typography, Text Secondary
- Custom icon (32px) above title

8.3. WHEN step cards are arranged THEN the system SHALL use:
- Desktop: 3-column grid with connecting line
- Tablet: 3-column grid, no connecting line
- Mobile: Vertical stack with step numbers

8.4. WHEN displaying steps THEN the system SHALL show exactly this copy:
- **Step 1 - Pick a mode & topic**: "Choose Fortnite trivia, general knowledge, or custom categories and jump into a 1v1 match."
- **Step 2 - Share a code, join instantly**: "Send your lobby code to a friend—both of you see the same arena in real time."
- **Step 3 - Fight, answer, and level up**: "Move, shoot, grab power-ups, and answer faster to earn XP, coins, and bragging rights."

8.5. WHEN the connecting line renders THEN the system SHALL display:
- 2px height, Border Default color
- Positioned at vertical center of step numbers
- Dashed pattern (8px dash, 8px gap)

### Requirement 9: Social Proof & Use Cases Section

**User Story:** As a visitor, I want to see who 1v1bro is perfect for, so that I can relate to the product and feel confident trying it.

#### Acceptance Criteria

9.1. WHEN the Social_Proof section renders THEN the system SHALL display:
- Section heading: "Perfect For..." in H2 typography, centered
- 3 use case cards in horizontal layout
- Optional testimonial area (placeholder for future quotes)

9.2. WHEN displaying use cases THEN the system SHALL show exactly these 3 cards:
- **Friends hanging out online**: "Drop a code in Discord and decide every argument with a quick best-of-3."
- **Communities & servers**: "Run pickup 1v1 tournaments or 'beat the mod' nights."
- **Events & watch parties**: "Use trivia tied to live sports, shows, or streams to keep everyone engaged."

9.3. WHEN a use case card renders THEN the system SHALL display:
- Component_Box with "elevated" variant
- Icon representing the audience (24px, Accent Primary)
- Title: H4 typography
- Description: Body typography, Text Secondary
- Min height: 160px

9.4. WHEN use case cards are arranged THEN the system SHALL use:
- Desktop: 3-column grid, 24px gap
- Tablet: 3-column grid, 20px gap
- Mobile: 1-column stack, 16px gap

9.5. WHEN testimonial area renders THEN the system SHALL display:
- Placeholder text: "Add room for quotes or short testimonials when you have them."
- Muted styling (Text Muted, italic)
- Hidden in production until testimonials are added

### Requirement 10: Final CTA Section

**User Story:** As a visitor who has scrolled through the page, I want a final compelling reason to sign up, so that I take action.

#### Acceptance Criteria

10.1. WHEN the Final CTA section renders THEN the system SHALL display:
- Full-width background with subtle arena imagery
- Centered content with max-width 600px
- Headline: H2 typography
- Subheadline: Body Large, Text Secondary
- Two CTA buttons centered

10.2. WHEN the headline renders THEN the system SHALL display:
- Text: "Ready To Settle It?"
- No animation effects

10.3. WHEN the subheadline renders THEN the system SHALL display:
- Text: "Jump into a free 1v1 arena match in under 30 seconds. No signup required for your first game."
- Body Large typography, Text Secondary

10.4. WHEN the CTA buttons render THEN the system SHALL display:
- Primary: "Start A Free Match" (large variant, Accent Primary)
- Secondary: "Join With A Code" (secondary variant)
- Horizontal layout on desktop (gap: 16px)
- Stacked layout on mobile (gap: 12px)
- Centered alignment

10.5. WHEN the background renders THEN the system SHALL display:
- Subtle arena silhouette at 10% opacity
- Vignette effect from edges
- No parallax (static)

### Requirement 11: Header Navigation

**User Story:** As a visitor, I want clear navigation options, so that I can explore the site or take action.

#### Acceptance Criteria

11.1. WHEN the header renders THEN the system SHALL display:
- Fixed position at top
- Background: Background Deep with 90% opacity
- Backdrop blur: 12px
- Border bottom: 1px solid Border Subtle
- Height: 72px (desktop), 64px (mobile)

11.2. WHEN displaying logo THEN the system SHALL show:
- "1v1 Bro" text in H4 typography, 700 weight
- No icon/image logo
- Link to home page

11.3. WHEN displaying navigation links THEN the system SHALL show:
- "Leaderboards" link (desktop only)
- "How It Works" link (desktop only, scrolls to section)
- Links in Body typography, Text Secondary
- Hover: Text Primary

11.4. WHEN displaying auth actions THEN the system SHALL show:
- Unauthenticated: "Log in" (tertiary), "Sign up" (primary)
- Authenticated: Username display, "Dashboard" (primary)

11.5. WHEN on mobile THEN the system SHALL:
- Hide navigation links
- Show hamburger menu icon
- Menu opens full-screen overlay

### Requirement 12: Footer

**User Story:** As a visitor, I want access to additional information and legal links, so that I can learn more about the platform.

#### Acceptance Criteria

12.1. WHEN the footer renders THEN the system SHALL display:
- Background: Background Mid
- Border top: 1px solid Border Subtle
- Padding: 48px vertical (desktop), 32px (mobile)

12.2. WHEN displaying footer content THEN the system SHALL show:
- Logo and tagline (left column)
- Navigation links (center columns)
- Social links (right column)

12.3. WHEN displaying navigation columns THEN the system SHALL show:
- **Play**: Dashboard, Leaderboards, Battle Pass
- **Learn**: How It Works, FAQ (placeholder)
- **Legal**: Privacy Policy, Terms of Service

12.4. WHEN displaying copyright THEN the system SHALL show:
- "© 2025 1v1 Bro. All rights reserved."
- Caption typography, Text Muted
- Centered on mobile, left-aligned on desktop

12.5. WHEN footer links are clicked THEN the system SHALL:
- Internal links: Navigate via React Router
- External links: Open in new tab with rel="noopener"
- Placeholder links: Show "Coming Soon" tooltip

### Requirement 13: Icon System

**User Story:** As a visitor, I want consistent, professional icons, so that the interface feels polished and cohesive.

#### Acceptance Criteria

13.1. WHEN icons render THEN the system SHALL use:
- Base size: 24px
- Stroke width: 1.5px (outline style)
- Stroke color: currentColor (inherits text color)
- No fill by default

13.2. WHEN icons have size variants THEN the system SHALL support:
- Small: 16px
- Default: 24px
- Large: 32px
- XLarge: 48px

13.3. WHEN feature icons render THEN the system SHALL use custom SVGs:
- Combat icon: Crossed swords
- Brain icon: Brain with lightning
- Trophy icon: Trophy cup
- Palette icon: Artist palette
- Checkmark icon: Circle with check
- Lightning icon: Lightning bolt
- Browser icon: Browser window

13.4. WHEN icons are interactive THEN the system SHALL apply:
- Hover: color transition to Accent Primary
- Transition: 150ms ease-out
- Cursor: pointer (when clickable)

### Requirement 14: Responsive Behavior

**User Story:** As a visitor on any device, I want the landing page to work perfectly, so that I have a great experience regardless of screen size.

#### Acceptance Criteria

14.1. WHEN viewport is desktop (> 1024px) THEN the system SHALL:
- Use full typography scale
- Display all navigation links
- Show 4-column feature grid
- Enable all parallax effects
- Max content width: 1280px

14.2. WHEN viewport is tablet (640-1024px) THEN the system SHALL:
- Use scaled typography (90%)
- Hide secondary navigation links
- Show 2-column feature grid
- Reduce parallax intensity by 50%
- Max content width: 100% with 48px padding

14.3. WHEN viewport is mobile (< 640px) THEN the system SHALL:
- Use mobile typography scale
- Show hamburger menu
- Show 1-column layout
- Disable parallax effects
- Max content width: 100% with 24px padding

14.4. WHEN touch interactions occur THEN the system SHALL:
- Provide 44x44px minimum tap targets
- Add touch feedback (opacity change)
- Disable hover effects
- Support swipe gestures where appropriate

### Requirement 15: Accessibility

**User Story:** As a visitor with accessibility needs, I want the landing page to be fully accessible, so that I can use it effectively.

#### Acceptance Criteria

15.1. WHEN keyboard navigation is used THEN the system SHALL:
- Provide visible focus indicators on all interactive elements
- Support Tab key navigation in logical order
- Support Enter/Space for button activation
- Support Escape to close modals/menus

15.2. WHEN screen readers are used THEN the system SHALL:
- Provide alt text for all images
- Use semantic HTML elements (header, main, section, footer)
- Include ARIA labels where needed
- Announce dynamic content changes

15.3. WHEN color contrast is evaluated THEN the system SHALL:
- Meet WCAG 2.1 AA standards (4.5:1 for normal text)
- Meet 3:1 for large text and UI components
- Not rely solely on color to convey information

15.4. WHEN motion preferences are set THEN the system SHALL:
- Respect prefers-reduced-motion media query
- Disable parallax and animations when reduced motion preferred
- Maintain functionality without animations

