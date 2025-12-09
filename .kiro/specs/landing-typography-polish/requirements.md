# Requirements Document

## Introduction

This specification defines the enterprise-grade typography and visual hierarchy polish for the 1v1 Bro landing page. The current landing page has good messaging and copy, but needs refinement in typography hierarchy, header spacing, font sizing, and color scheme to achieve a premium, AAA-quality aesthetic. The goal is to establish clear visual hierarchy that guides the eye, creates breathing room, and feels polished and intentional.

## Glossary

- **Landing_Page**: The public-facing marketing page at the root URL that introduces 1v1 Bro to new visitors
- **Typography_Hierarchy**: The systematic arrangement of text sizes, weights, and spacing to establish visual importance
- **Visual_Rhythm**: Consistent spacing patterns that create a sense of order and professionalism
- **Section_Spacing**: The vertical padding between major page sections
- **Component_Spacing**: The internal padding and margins within UI components
- **Type_Scale**: The mathematical relationship between font sizes at different hierarchy levels
- **Color_Contrast**: The luminance difference between text and background colors for readability
- **Enterprise_Aesthetic**: A polished, professional visual style characterized by generous whitespace, restrained color use, and clear hierarchy

## Requirements

### Requirement 1

**User Story:** As a visitor, I want the landing page typography to have clear visual hierarchy, so that I can quickly scan and understand the content importance.

#### Acceptance Criteria

1. WHEN the hero section renders THEN the Landing_Page SHALL display the headline at 72px/80px line-height on desktop and 48px/56px on mobile with -0.03em letter-spacing
2. WHEN section headers render THEN the Landing_Page SHALL display H2 titles at 40px/48px on desktop and 32px/40px on mobile with -0.02em letter-spacing
3. WHEN card titles render THEN the Landing_Page SHALL display H3/H4 titles at 24px/32px on desktop and 20px/28px on mobile with -0.01em letter-spacing
4. WHEN body text renders THEN the Landing_Page SHALL display body copy at 17px/28px on desktop and 16px/26px on mobile with 0em letter-spacing
5. WHEN caption text renders THEN the Landing_Page SHALL display captions at 14px/20px with 0.02em letter-spacing and medium weight

### Requirement 2

**User Story:** As a visitor, I want generous and consistent spacing between sections, so that the page feels premium and easy to read.

#### Acceptance Criteria

1. WHEN sections render THEN the Landing_Page SHALL apply 120px vertical padding on desktop and 80px on mobile between major sections
2. WHEN section headers render THEN the Landing_Page SHALL apply 64px bottom margin on desktop and 48px on mobile before content
3. WHEN card grids render THEN the Landing_Page SHALL apply 32px gap on desktop and 24px on mobile between cards
4. WHEN the hero section renders THEN the Landing_Page SHALL apply 32px spacing between headline and subheadline
5. WHEN CTAs render THEN the Landing_Page SHALL apply 48px top margin from preceding text on desktop and 40px on mobile

### Requirement 3

**User Story:** As a visitor, I want the header to feel anchored and professional, so that I trust the brand immediately.

#### Acceptance Criteria

1. WHEN the header renders THEN the Landing_Page SHALL display the logo at 28px font-size with -0.02em letter-spacing and 700 weight
2. WHEN the header renders THEN the Landing_Page SHALL apply 80px height on desktop and 64px on mobile
3. WHEN navigation links render THEN the Landing_Page SHALL display them at 15px font-size with 500 weight and 32px horizontal spacing
4. WHEN the header scrolls THEN the Landing_Page SHALL maintain the frosted glass effect with 12px blur and 95% background opacity
5. WHEN auth buttons render THEN the Landing_Page SHALL display them with 16px horizontal padding and 44px minimum height

### Requirement 4

**User Story:** As a visitor, I want the color scheme to feel sophisticated and intentional, so that the page conveys quality.

#### Acceptance Criteria

1. WHEN text renders THEN the Landing_Page SHALL use #FFFFFF for primary text, #B4B4B4 for secondary text, and #737373 for muted text
2. WHEN backgrounds render THEN the Landing_Page SHALL use #09090B for deep background, #111113 for mid background, and #18181B for surface
3. WHEN accent colors render THEN the Landing_Page SHALL use #F97316 for primary accent (warmer orange) with #FB923C for hover states
4. WHEN borders render THEN the Landing_Page SHALL use rgba(255,255,255,0.08) for subtle borders and rgba(255,255,255,0.12) for default borders
5. WHEN interactive elements render THEN the Landing_Page SHALL apply accent color only to primary CTAs and icons, not to text links

### Requirement 5

**User Story:** As a visitor, I want the CTA buttons to feel substantial and clickable, so that I'm drawn to take action.

#### Acceptance Criteria

1. WHEN primary CTA buttons render THEN the Landing_Page SHALL display them with 56px height, 24px horizontal padding, and 16px border-radius
2. WHEN primary CTA buttons render THEN the Landing_Page SHALL apply 16px font-size with 600 weight
3. WHEN secondary CTA buttons render THEN the Landing_Page SHALL display them with 1.5px border width and rgba(255,255,255,0.16) border color
4. WHEN CTA buttons hover THEN the Landing_Page SHALL apply a subtle lift transform of -2px and increased shadow
5. WHEN large CTA buttons render THEN the Landing_Page SHALL display them with 64px height and 32px horizontal padding

### Requirement 6

**User Story:** As a visitor, I want the feature cards to have clear visual separation and hierarchy, so that I can easily scan the features.

#### Acceptance Criteria

1. WHEN feature cards render THEN the Landing_Page SHALL apply 32px internal padding on desktop and 24px on mobile
2. WHEN feature card icons render THEN the Landing_Page SHALL display them at 40px size with the accent color
3. WHEN feature card titles render THEN the Landing_Page SHALL apply 16px bottom margin before the description
4. WHEN feature cards hover THEN the Landing_Page SHALL apply a subtle border color change to rgba(255,255,255,0.16)
5. WHEN feature card descriptions render THEN the Landing_Page SHALL use secondary text color with 1.6 line-height

### Requirement 7

**User Story:** As a visitor, I want the "How It Works" section to feel like a clear progression, so that I understand the flow.

#### Acceptance Criteria

1. WHEN step numbers render THEN the Landing_Page SHALL display them at 96px font-size with 10% opacity and -0.04em letter-spacing
2. WHEN step cards render THEN the Landing_Page SHALL apply 48px spacing between the number and content
3. WHEN the connecting line renders THEN the Landing_Page SHALL display it as a 1px solid line at rgba(255,255,255,0.08) opacity
4. WHEN step titles render THEN the Landing_Page SHALL display them at 28px/36px with 600 weight
5. WHEN step descriptions render THEN the Landing_Page SHALL limit width to 320px and center-align text

### Requirement 8

**User Story:** As a visitor, I want the final CTA section to feel like a strong closing statement, so that I'm motivated to sign up.

#### Acceptance Criteria

1. WHEN the final CTA section renders THEN the Landing_Page SHALL apply 160px vertical padding on desktop and 100px on mobile
2. WHEN the final CTA headline renders THEN the Landing_Page SHALL display it at 48px/56px on desktop and 36px/44px on mobile
3. WHEN the final CTA subheadline renders THEN the Landing_Page SHALL limit width to 560px and center-align
4. WHEN the final CTA buttons render THEN the Landing_Page SHALL use the large button variant with 20px gap between buttons
5. WHEN the final CTA section renders THEN the Landing_Page SHALL apply a subtle radial gradient vignette from center

### Requirement 9

**User Story:** As a visitor, I want the footer to feel grounded and complete, so that the page has proper closure.

#### Acceptance Criteria

1. WHEN the footer renders THEN the Landing_Page SHALL apply 80px top padding and 48px bottom padding
2. WHEN the footer renders THEN the Landing_Page SHALL use the deep background color (#09090B) with a top border at rgba(255,255,255,0.06)
3. WHEN footer links render THEN the Landing_Page SHALL display them at 14px with muted text color and white on hover
4. WHEN the copyright text renders THEN the Landing_Page SHALL display it at 13px with muted text color
5. WHEN the footer logo renders THEN the Landing_Page SHALL display it at 24px with primary text color

