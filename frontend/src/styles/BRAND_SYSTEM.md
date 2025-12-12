# 1v1 Bro Enterprise Brand System

## Brand Identity

**1v1 Bro** is a competitive 2D arena shooter with trivia mechanics. The brand conveys:
- **Competitive intensity** - Fast-paced, skill-based gameplay
- **Accessible fun** - Easy to pick up, hard to master
- **Modern gaming** - Clean, professional aesthetic without dated neon/cyberpunk tropes

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Brand Orange** | `#F97316` | Primary CTAs, brand accent, highlights |
| **Brand Orange Light** | `#FB923C` | Hover states, secondary highlights |
| **Brand Orange Dark** | `#EA580C` | Active/pressed states |

### Neutral Palette (Dark Theme)

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Background Base** | `#09090B` | `--color-bg-base` | Page backgrounds |
| **Background Card** | `#111111` | `--color-bg-card` | Cards, panels |
| **Background Elevated** | `#1A1A1A` | `--color-bg-elevated` | Modals, dropdowns |
| **Background Hover** | `rgba(255,255,255,0.04)` | `--color-bg-hover` | Interactive hover |
| **Background Active** | `rgba(255,255,255,0.06)` | `--color-bg-active` | Active states |

### Text Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Text Primary** | `#FFFFFF` | `--color-text-primary` | Headlines, important text |
| **Text Secondary** | `#B4B4B4` | `--color-text-secondary` | Body text, descriptions |
| **Text Muted** | `#737373` | `--color-text-muted` | Captions, hints |
| **Text Disabled** | `#525252` | `--color-text-disabled` | Disabled states |

### Semantic Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Success** | `#10B981` | `--color-accent-success` | Wins, correct answers, positive |
| **Error** | `#F43F5E` | `--color-accent-error` | Losses, wrong answers, alerts |
| **Warning** | `#F59E0B` | `--color-accent-warning` | Caution, premium/coins |
| **Info** | `#3B82F6` | `--color-accent-info` | Information, links |

### Action Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Action Primary** | `#6366F1` | `--color-accent-primary` | Buttons, interactive elements |
| **Action Primary Hover** | `#4F46E5` | `--color-accent-primary-hover` | Hover state |
| **Action Primary Active** | `#4338CA` | `--color-accent-primary-active` | Pressed state |

### Rarity System (Gaming Convention)

| Rarity | Hex | Usage |
|--------|-----|-------|
| **Common** | `#737373` | Basic items |
| **Uncommon** | `#10B981` | Green tier |
| **Rare** | `#3B82F6` | Blue tier |
| **Epic** | `#A855F7` | Purple tier (exception - gaming standard) |
| **Legendary** | `#F59E0B` | Gold tier |

### Game-Specific Colors

| Element | Hex | Usage |
|---------|-----|-------|
| **Player 1** | `#10B981` | Emerald - local player |
| **Player 2** | `#F43F5E` | Rose - opponent |
| **Projectile** | `#60A5FA` | Blue-400 - blaster shots |
| **Shield** | `#3B82F6` | Blue-500 - shield bar |
| **Health High** | `#10B981` | Emerald - healthy |
| **Health Medium** | `#F59E0B` | Amber - damaged |
| **Health Low** | `#EF4444` | Red - critical |

### PROHIBITED Colors

These colors are banned from the UI (except rarity system):
- `#00FFFF` (Cyan)
- `#00D4FF` (Bright cyan)
- `#FF00FF` (Magenta)
- Any cyan-* Tailwind classes
- Any teal-* Tailwind classes
- Purple gradients (except epic rarity)

---

## Typography

### Font Stack

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| **Display** | 64px | 800 | 1.1 | -0.03em | Hero headlines |
| **H1** | 48px | 700 | 1.15 | -0.02em | Page titles |
| **H2** | 36px | 700 | 1.2 | -0.02em | Section headers |
| **H3** | 28px | 600 | 1.25 | -0.01em | Card titles |
| **H4** | 24px | 600 | 1.3 | -0.01em | Widget headers |
| **H5** | 20px | 600 | 1.35 | 0 | Subsection titles |
| **H6** | 18px | 600 | 1.4 | 0 | Minor headers |
| **Body Large** | 18px | 400 | 1.6 | 0 | Lead paragraphs |
| **Body** | 16px | 400 | 1.5 | 0 | Default body text |
| **Body Small** | 14px | 400 | 1.5 | 0 | Secondary text |
| **Caption** | 12px | 500 | 1.4 | 0.02em | Labels, hints |
| **Overline** | 11px | 700 | 1.3 | 0.08em | Category labels (uppercase) |

### Responsive Typography

| Breakpoint | Display | H1 | H2 | H3 | Body |
|------------|---------|----|----|----|----|
| Mobile (<640px) | 40px | 32px | 28px | 22px | 16px |
| Tablet (640-1024px) | 52px | 40px | 32px | 24px | 16px |
| Desktop (>1024px) | 64px | 48px | 36px | 28px | 16px |

---

## Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | None |
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Icon gaps |
| `--space-3` | 12px | Small padding |
| `--space-4` | 16px | Default padding |
| `--space-5` | 20px | Medium padding |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Section gaps |
| `--space-10` | 40px | Large gaps |
| `--space-12` | 48px | Section padding |
| `--space-16` | 64px | Page sections |
| `--space-20` | 80px | Hero spacing |
| `--space-24` | 96px | Major sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements, badges |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Modals, large cards |
| `--radius-2xl` | 24px | Hero elements |
| `--radius-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.25)` | Subtle depth |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.25)` | Cards |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.25)` | Elevated cards |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.25)` | Modals |
| `--shadow-2xl` | `0 25px 50px rgba(0,0,0,0.35)` | Hero elements |

### Glow Effects (Use Sparingly)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-glow-primary` | `0 0 20px rgba(99,102,241,0.3)` | Primary action glow |
| `--shadow-glow-premium` | `0 0 20px rgba(245,158,11,0.3)` | Premium/gold glow |
| `--shadow-glow-success` | `0 0 20px rgba(16,185,129,0.3)` | Success glow |
| `--shadow-glow-brand` | `0 0 20px rgba(249,115,22,0.3)` | Brand orange glow |

---

## Component Patterns

### Buttons

**Primary (Brand Orange)**
```css
background: #F97316;
color: white;
shadow: 0 0 20px rgba(249,115,22,0.3);
hover: #FB923C, shadow intensifies;
active: #EA580C;
```

**Secondary (Outline)**
```css
background: transparent;
border: 1.5px solid rgba(255,255,255,0.16);
color: white;
hover: bg rgba(255,255,255,0.04), border rgba(255,255,255,0.24);
```

**Tertiary (Ghost)**
```css
background: transparent;
color: #B4B4B4;
hover: color white, underline;
```

**Action (Indigo)**
```css
background: #6366F1;
color: white;
hover: #4F46E5;
active: #4338CA;
```

### Button Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| Small | 32px | 12px 16px | 14px |
| Medium | 40px | 16px 20px | 16px |
| Large | 48px | 20px 24px | 18px |
| XL (CTA) | 56px | 24px 32px | 18px |

### Cards

**Standard Card**
```css
background: #111111;
border: 1px solid rgba(255,255,255,0.06);
border-radius: 12px;
padding: 20px;
```

**Elevated Card**
```css
background: #1A1A1A;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 16px;
padding: 24px;
shadow: 0 10px 15px rgba(0,0,0,0.25);
```

**Interactive Card**
```css
/* Base + hover effects */
transition: transform 200ms, box-shadow 200ms, border-color 200ms;
hover: translateY(-2px), shadow-xl, border rgba(255,255,255,0.1);
```

### Inputs

```css
background: #111111;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 8px;
height: 40px (md), 48px (lg);
padding: 0 16px;
color: white;
placeholder: #737373;
focus: border #6366F1, ring 2px rgba(99,102,241,0.5);
```

### Badges

**Status Badges**
```css
padding: 4px 10px;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.02em;
```

**Rarity Badges**
- Use rarity color at 20% opacity for background
- Use rarity color at 100% for text
- Legendary gets shimmer animation

---

## Layout Grid

### Container Widths

| Breakpoint | Max Width |
|------------|-----------|
| Mobile | 100% (16px padding) |
| Tablet | 768px |
| Desktop | 1024px |
| Wide | 1280px |
| Max | 1440px |

### Grid System

- 12-column grid
- Gutter: 24px (desktop), 16px (mobile)
- Dashboard: 3-column (desktop), 2-column (tablet), 1-column (mobile)

---

## Animation & Motion

### Timing

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `--transition-fast` | 100ms | ease-out | Micro-interactions |
| `--transition-normal` | 200ms | ease-out | Standard transitions |
| `--transition-slow` | 300ms | ease-out | Complex animations |
| `--transition-slower` | 500ms | ease-out | Page transitions |

### Standard Animations

- **Hover lift**: translateY(-2px) + shadow increase
- **Press feedback**: scale(0.97) on active
- **Fade in**: opacity 0→1, 200ms
- **Slide up**: translateY(20px)→0, opacity 0→1, 300ms

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce`

---

## Touch Targets

| Minimum | Recommended | Comfortable |
|---------|-------------|-------------|
| 44px | 48px | 56px |

All interactive elements must meet 44px minimum on touch devices.

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 100 | Dropdowns, popovers |
| `--z-sticky` | 200 | Sticky headers |
| `--z-modal-backdrop` | 300 | Modal overlays |
| `--z-modal` | 400 | Modal content |
| `--z-tooltip` | 500 | Tooltips |
| `--z-toast` | 600 | Toast notifications |
| `--z-confetti` | 700 | Celebration effects |

---

## Accessibility

### Focus States
- 2px solid indigo-500 ring
- 2px offset from element
- Visible on keyboard navigation only (`:focus-visible`)

### Color Contrast
- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Interactive elements have 3:1 contrast against background

### Screen Reader Support
- All images have alt text
- Icons have aria-labels
- Interactive elements have descriptive labels

---

## File Structure

```
frontend/src/styles/
├── tokens.css          # CSS custom properties
├── responsive.css      # Responsive utilities
├── BRAND_SYSTEM.md     # This document
└── landing/            # Landing page specific styles
```

---

## Implementation Checklist

When building new components:

1. ✅ Use CSS variables from tokens.css
2. ✅ Follow typography scale exactly
3. ✅ Use spacing tokens (no magic numbers)
4. ✅ Ensure 44px touch targets on mobile
5. ✅ Add focus-visible states
6. ✅ Test with reduced motion
7. ✅ Verify color contrast
8. ✅ No cyan, teal, or purple (except epic rarity)
