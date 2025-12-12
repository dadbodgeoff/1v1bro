# Enterprise Standards Audit Report

## Executive Summary

This audit identifies hardcoded values and bundled components that lack individual configurability, violating enterprise standards for maintainability, scalability, and consistency.

## ✅ FIXES APPLIED

The following enterprise-standard fixes have been implemented:

### 1. Centralized Configuration (`frontend/src/config/`)
- `categories.ts` - Category display config with CSS variable colors
- `navigation.ts` - Sidebar nav items with enable/disable support
- `onboarding.ts` - Onboarding steps with CSS variable accent colors
- `settings.ts` - All settings options (video, audio, keybinds, accessibility)
- `features.ts` - Landing page features with enable/disable support
- `zindex.ts` - Z-index constants matching tokens.css

### 2. Components Updated to Use Config
- `QuickCategoryPicker.tsx` - Now uses `getCategoryConfig()` and `getCategoryColor()`
- `Sidebar.tsx` - Now accepts `navItems` and `featureFlags` props
- `OnboardingModal.tsx` - Now accepts `steps` prop, uses CSS variables
- `Settings.tsx` - Now imports from `@/config/settings`
- `FeaturesSection.tsx` - Now accepts `features` prop
- `NotificationDropdown.tsx` - Uses CSS variables and Z_INDEX constants
- `ProfileHeader.tsx` - Uses CSS variables for tier ring colors
- `GameArena.tsx` - Uses CSS variables for backgrounds
- `PlayerCardBanner.tsx` - Exports `getPlayerCardSizeConfig()` for customization
- `rarity.ts` - Added `getRarityColor()` function with CSS variable support

---

## 🔴 CRITICAL: Hardcoded Values

### 1. Colors Hardcoded in Components (Should Use tokens.css)

| File | Issue |
|------|-------|
| `components/profile/enterprise/ProfileHeader.tsx` | `progressColor: '#6366f1'`, `trackColor: '#374151'` - Should use `--color-accent-primary` and `--color-border-subtle` |
| `components/game/QuickCategoryPicker.tsx` | Category colors hardcoded: `'#9333EA'`, `'#059669'`, `'#2563EB'`, etc. |
| `components/onboarding/OnboardingModal.tsx` | `accentColor: '#F97316'`, `'#22C55E'`, `'#3B82F6'`, `'#EC4899'` |
| `components/profile/enterprise/SocialLinkButton.tsx` | Platform colors: `'#1DA1F2'`, `'#9146FF'`, `'#FF0000'`, `'#5865F2'` |
| `components/landing/arcade/HyperCRTArcade.tsx` | `fontSize: 10`, `background: 'rgba(0,0,0,0.8)'` |
| `components/game/GameArena.tsx` | `backgroundColor: '#000'`, `'#0f172a'` |
| `pages/VolcanicLanding.tsx` | 50+ hardcoded hex colors throughout inline styles |
| `components/landing/enterprise/LiveDemo.tsx` | `color: '#F97316'`, `'#A855F7'` |

### 2. Dimensions Hardcoded (Should Use tokens.css spacing/sizing)

| File | Issue |
|------|-------|
| `components/lobby/PlayerCardBanner.tsx` | `SIZE_CONFIG` with hardcoded `width: 120/180/240`, `height: 180/270/360` |
| `components/profile/enterprise/ProfileHeader.tsx` | `size: 96`, `size: 120`, `strokeWidth: 3/4` |
| `components/landing/arcade/constants.ts` | `fontSize: '14px'`, `'48px'`, `'64px'`, `'80px'` - Should reference tokens |
| `game/config/maps/simple-arena.ts` | `TILE = 80`, `SIMPLE_TILE_SIZE = 80`, `SIMPLE_SOURCE_TILE_SIZE = 88` |
| `game/config/arena.ts` | `GRID_SIZE = 80` |

### 3. Z-Index Values Scattered (Should Use --z-* tokens)

Found 40+ instances of hardcoded z-index values (`z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-100`, `z-1000`, `z-1001`) instead of using the defined tokens:
- `--z-base: 0`
- `--z-dropdown: 100`
- `--z-sticky: 200`
- `--z-modal-backdrop: 300`
- `--z-modal: 400`
- `--z-tooltip: 500`
- `--z-toast: 600`

---

## 🟠 HIGH: Bundled Components Without Individual Control

### 1. `ONBOARDING_STEPS` (OnboardingModal.tsx)
**Problem:** 5 steps bundled with no way to:
- Add/remove steps without code changes
- Reorder steps
- Customize individual step content
- A/B test different flows

**Fix:** Extract to configuration file or database-driven content.

### 2. `NAV_ITEMS` (Sidebar.tsx)
**Problem:** 9 navigation items hardcoded with no way to:
- Enable/disable items per user role
- Customize order
- Add feature flags

**Fix:** Make configurable via props or context.

### 3. `CATEGORY_CONFIG` (QuickCategoryPicker.tsx)
**Problem:** 6 categories with hardcoded colors/icons:
```typescript
fortnite: { icon: '🎮', color: '#9333EA', label: 'Fortnite' },
nfl: { icon: '🏈', color: '#059669', label: 'NFL' },
```
**Fix:** Fetch from API or use design tokens for colors.

### 4. `VIDEO_QUALITY_OPTIONS`, `FPS_LIMIT_OPTIONS`, `COLORBLIND_OPTIONS`, `KEYBIND_ACTIONS` (Settings.tsx)
**Problem:** All settings options hardcoded, no way to:
- Add new options without code deployment
- Customize per platform/device

### 5. `FEATURES` (FeaturesSection.tsx)
**Problem:** 6 features hardcoded, marketing can't update without dev.

### 6. `TYPE_CONFIG` (NotificationDropdown.tsx)
**Problem:** Notification types hardcoded, can't add new types without code change.

### 7. `BOOT_LINES`, `BOOT_TIMING` (arcade/constants.ts)
**Problem:** Boot sequence text and timing hardcoded.

---

## 🟡 MEDIUM: Timing/Animation Values

### Hardcoded Durations (Should Use --transition-* tokens)

| File | Values |
|------|--------|
| `HandshakeBootSequence.tsx` | `flashDuration: 200`, `expandDuration: 400`, `totalDuration: 800` |
| `AnimatedWidget.tsx` | `duration: 0.3`, `duration: 0.15`, `duration: 0.1` |
| `OnboardingModal.tsx` | `transition={{ duration: 0.3 }}` repeated 10+ times |
| `TierUpCelebration.tsx` | `delay: 0.2`, `delay: 0.3`, `delay: 0.4`, etc. |
| `BattlePassWelcomeModal.tsx` | `delay: 0.1`, `delay: 0.15`, `delay: 0.2`, etc. |

**Available tokens not being used:**
- `--transition-fast: 100ms`
- `--transition-normal: 200ms`
- `--transition-slow: 300ms`
- `--transition-slower: 500ms`

---

## 🟢 GOOD: Already Following Standards

1. **`tokens.css`** - Comprehensive design token system exists
2. **`rarity.ts`** - Centralized rarity styling (though still has some hardcoded hex)
3. **`arcade/constants.ts`** - Good pattern of centralizing constants (but values still hardcoded)
4. **Component tokens** - `--btn-height-*`, `--input-height-*`, `--modal-width-*` defined but underutilized

---

## Recommendations

### Immediate Actions

1. **Create `config/` directory** for all configurable arrays:
   ```
   frontend/src/config/
   ├── navigation.ts      # NAV_ITEMS
   ├── onboarding.ts      # ONBOARDING_STEPS
   ├── categories.ts      # CATEGORY_CONFIG
   ├── settings.ts        # All settings options
   └── features.ts        # Marketing features
   ```

2. **Replace all hardcoded colors** with CSS variable references:
   ```typescript
   // Before
   progressColor: '#6366f1'
   
   // After
   progressColor: 'var(--color-accent-primary)'
   ```

3. **Create z-index utility classes** in Tailwind config:
   ```javascript
   zIndex: {
     'dropdown': 'var(--z-dropdown)',
     'modal': 'var(--z-modal)',
     'toast': 'var(--z-toast)',
   }
   ```

4. **Add animation duration tokens** to components:
   ```typescript
   // Before
   transition={{ duration: 0.3 }}
   
   // After
   transition={{ duration: 'var(--transition-slow)' }}
   // Or use a constant: ANIMATION_DURATION.slow
   ```

### Long-term Actions

1. **Feature flags system** for toggling navigation items, features
2. **CMS integration** for marketing content (features, onboarding)
3. **API-driven categories** instead of hardcoded config
4. **Theme system** for white-labeling capability

---

## Files Requiring Immediate Attention

| Priority | File | Status |
|----------|------|--------|
| ✅ | `components/game/QuickCategoryPicker.tsx` | FIXED - Uses config/categories.ts |
| ✅ | `components/onboarding/OnboardingModal.tsx` | FIXED - Uses config/onboarding.ts |
| ✅ | `components/profile/enterprise/ProfileHeader.tsx` | FIXED - Uses CSS variables |
| ✅ | `pages/Settings.tsx` | FIXED - Uses config/settings.ts |
| ✅ | `components/dashboard/Sidebar.tsx` | FIXED - Uses config/navigation.ts |
| ✅ | `components/landing/enterprise/FeaturesSection.tsx` | FIXED - Uses config/features.ts |
| ✅ | `components/lobby/PlayerCardBanner.tsx` | FIXED - Exports getPlayerCardSizeConfig() |
| ✅ | `components/dashboard/NotificationDropdown.tsx` | FIXED - Uses CSS variables and Z_INDEX |
| ✅ | `components/game/GameArena.tsx` | FIXED - Uses CSS variables |
| ✅ | `components/landing/enterprise/LiveDemo.tsx` | FIXED - Uses PLAYER_COLORS constant |
| ✅ | `styles/rarity.ts` | FIXED - Added getRarityColor() with CSS var support |
| 🟡 | `pages/VolcanicLanding.tsx` | LEGACY - Prototype page, lower priority |
| 🟡 | `game/config/arena.ts` | Game constants - intentionally hardcoded for performance |

---

## Summary

Enterprise standards have been applied to the core UI components. The centralized config system in `frontend/src/config/` now provides:

1. **Individual control** - Each bundled component now accepts custom config via props
2. **CSS variable integration** - Colors reference tokens.css for consistency
3. **Enable/disable support** - Features, nav items, and steps can be toggled
4. **Type safety** - Full TypeScript interfaces for all configurations
5. **Backwards compatibility** - Default exports maintain existing behavior
