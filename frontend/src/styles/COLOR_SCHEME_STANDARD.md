# Enterprise Color Scheme Standard

> **⚠️ DEPRECATED**: This document has been superseded by the comprehensive **BRAND_SYSTEM.md**.
> Please refer to `frontend/src/styles/BRAND_SYSTEM.md` for the complete enterprise branding package.

## Overview

This document establishes the professional color replacement standard for the frontend codebase, eliminating "AI-style" colors (cyan, purple gradients, neon effects) in favor of an enterprise-appropriate palette.

## Current Issues Identified

### 1. Problematic Colors to Replace

| Category | Current Usage | Problem |
|----------|--------------|---------|
| **Cyan** | `#00ffff`, `#00d4ff`, `cyan-400/500` | Neon/AI aesthetic, unprofessional |
| **Purple Gradients** | `from-purple-500 to-orange-500`, `#a855f7` | Overused AI/tech startup look |
| **Indigo-Purple Gradients** | `from-[#6366f1] to-[#8b5cf6]` | Acceptable but overused |
| **Neon Glows** | `#00ff88`, `#ff00ff`, bright saturated colors | Gaming aesthetic, not enterprise |
| **Cyan-Magenta Combos** | Game backdrop colors | Dated cyberpunk aesthetic |

### 2. Files Requiring Updates

**High Priority (User-Facing UI):**
- `pages/BotGame.tsx` - Purple/orange gradients for guest CTAs
- `pages/Register.tsx` - Purple links and checkboxes
- `pages/AdminAnalytics.tsx` - Cyan/purple stat cards
- `pages/Results.tsx` - Slate/indigo gradients
- `components/progression/XPNotification.tsx` - Cyan/blue gradients
- `components/progression/TierUpCelebration.tsx` - Gold/orange gradients (acceptable for rewards)
- `components/battlepass/BattlePassTrack.tsx` - Indigo-purple progress bars
- `components/landing/StickyMobileCTA.tsx` - Indigo-purple gradient
- Legal pages - Purple link colors

**Medium Priority (Game Elements):**
- `game/backdrop/types.ts` - Cyan/magenta backdrop colors
- `game/barriers/BarrierRenderer.ts` - Cyan barriers
- `game/terrain/MapThemes.ts` - Cyan hazard colors
- `game/config/colors.ts` - Cyan projectiles/shields

**Low Priority (Internal/Admin):**
- Test files with color constants

---

## Enterprise Color Palette Standard

### Primary Palette

```css
/* Primary Brand - Neutral Indigo (keep but use sparingly) */
--color-primary: #6366f1;        /* Use for primary actions only */
--color-primary-hover: #4f46e5;
--color-primary-active: #4338ca;

/* REPLACEMENT: Use slate/neutral for most UI */
--color-action-primary: #3b82f6;  /* Blue-600 - professional, accessible */
--color-action-hover: #2563eb;    /* Blue-700 */
```

### Semantic Colors (Keep As-Is)

```css
/* Success - Emerald (professional, accessible) */
--color-success: #10b981;
--color-success-bg: rgba(16, 185, 129, 0.1);

/* Warning - Amber (professional) */
--color-warning: #f59e0b;
--color-warning-bg: rgba(245, 158, 11, 0.1);

/* Error - Rose (professional) */
--color-error: #f43f5e;
--color-error-bg: rgba(244, 63, 94, 0.1);

/* Info - Blue (professional) */
--color-info: #3b82f6;
--color-info-bg: rgba(59, 130, 246, 0.1);
```

### Replacement Mappings

| Remove | Replace With | Rationale |
|--------|-------------|-----------|
| `cyan-400/500` | `blue-400/500` | Professional, accessible |
| `purple-400/500` | `slate-400` or `blue-500` | Neutral, enterprise |
| `#00ffff` (cyan) | `#3b82f6` (blue-500) | Standard UI blue |
| `#00d4ff` | `#60a5fa` (blue-400) | Softer, professional |
| `from-purple-500 to-orange-500` | `bg-blue-600` (solid) | No gradient needed |
| `from-indigo-500 to-purple-600` | `bg-indigo-600` (solid) | Single color |
| `#ff00ff` (magenta) | `#ec4899` (pink-500) | If needed, softer pink |

### Link Colors

```css
/* BEFORE (AI-style) */
.link { color: purple-400; }

/* AFTER (Enterprise) */
.link { color: #3b82f6; }  /* blue-500 */
.link:hover { color: #60a5fa; }  /* blue-400 */
```

### Gradient Policy

**Allowed Gradients:**
- Premium/Gold rewards: `from-amber-500 to-yellow-500` ✓
- Rarity indicators (legendary): `from-amber-600 to-amber-400` ✓
- Subtle backgrounds: `from-[#111] to-[#0a0a0a]` ✓

**Prohibited Gradients:**
- `from-purple-* to-orange-*` ✗
- `from-cyan-* to-*` ✗
- `from-indigo-* to-purple-*` ✗ (replace with solid indigo)
- Any neon color combinations ✗

---

## Implementation Checklist

### Phase 1: User-Facing Pages (Critical) ✅ COMPLETED

- [x] `BotGame.tsx` - Replace purple/orange CTAs with solid indigo
- [x] `Register.tsx` - Replace purple links with blue
- [x] `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `RefundPolicy.tsx` - Blue links
- [x] `AdminAnalytics.tsx` - Replace cyan/purple stat colors with indigo/blue
- [x] `Results.tsx` - Remove slate gradients, use solid dark background

### Phase 2: Components ✅ COMPLETED

- [x] `StickyMobileCTA.tsx` - Solid indigo button, no gradient
- [x] `BattlePassTrack.tsx` - Solid indigo progress, no purple gradient
- [x] `XPNotification.tsx` - Replace cyan glow with indigo
- [x] `TutorialOverlay.tsx` - Replace purple with indigo
- [x] `ArenaQuizPanel.tsx` - Replace purple with indigo
- [x] `PracticeSetupScreen.tsx` - Replace purple with indigo
- [x] `PracticeResultsScreen.tsx` - Replace purple/orange with indigo
- [x] `ArenaGameSetup.tsx` - Replace purple with indigo

### Phase 3: Game Visuals ✅ COMPLETED

- [x] `game/config/colors.ts` - Replace cyan with blue variants
- [x] `game/backdrop/types.ts` - Muted blue/indigo backdrop
- [x] `game/terrain/MapThemes.ts` - Professional hazard colors
- [x] `game/barriers/BarrierRenderer.ts` - Blue barriers
- [x] `game/visual/VisualHierarchySystem.ts` - Blue teleporters
- [x] `game/telemetry/ReplayRenderer.ts` - Professional colors
- [x] `game/backdrop/layers/AtmosphereLayer.ts` - Blue/indigo glows

### Phase 4: Design Tokens Update ✅ COMPLETED

Updated `tokens.css`:
```css
/* Updated gradients - no purple */
--gradient-primary: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
--gradient-xp: linear-gradient(90deg, #4338ca 0%, #6366f1 100%);

/* New enterprise link colors */
--color-link: #3b82f6;
--color-link-hover: #60a5fa;
--color-accent-secondary: #3b82f6;
```

---

## CSS Token Additions

Add to `tokens.css`:

```css
/* Enterprise Link Colors */
--color-link: #3b82f6;
--color-link-hover: #60a5fa;
--color-link-visited: #6366f1;

/* Professional Accent (replaces cyan) */
--color-accent-secondary: #3b82f6;
--color-accent-secondary-hover: #2563eb;

/* Muted Game Elements */
--color-game-projectile: #60a5fa;
--color-game-shield: #3b82f6;
--color-game-barrier: #4f46e5;
```

---

## Quick Reference: Find & Replace

```bash
# Cyan replacements
text-cyan-400 → text-blue-400
text-cyan-500 → text-blue-500
bg-cyan-500 → bg-blue-500
#00ffff → #3b82f6
#00d4ff → #60a5fa

# Purple link replacements  
text-purple-400 → text-blue-500
text-purple-300 → text-blue-400
hover:text-purple-300 → hover:text-blue-400

# Gradient removals (replace with solid)
bg-gradient-to-r from-purple-500 to-orange-500 → bg-blue-600
bg-gradient-to-r from-indigo-500 to-purple-600 → bg-indigo-600
from-[#6366f1] to-[#8b5cf6] → bg-[#6366f1]
```

---

## Exceptions

The following uses are acceptable and should NOT be changed:

1. **Rarity System** - Epic rarity uses purple (`#a855f7`) by gaming convention
2. **Premium/Gold** - Amber/yellow gradients for monetization CTAs
3. **Social Platform Colors** - Twitch purple (`#9146FF`), Discord purple (`#5865F2`)
4. **Existing Indigo Primary** - `#6366f1` as primary action color (but no gradients to purple)

---

## Validation

After implementation, run the design system tests:
```bash
npm test -- --grep "Legacy Colors"
npm test -- --grep "Color Palette"
```

The tests in `design-system.test.ts` should pass with no legacy cyan/purple violations.
