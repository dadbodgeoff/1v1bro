# Inventory Enterprise Redesign - Implementation Plan

## Overview

This implementation plan transforms the Inventory experience into an enterprise-grade system matching the quality established in the Item Shop and Battle Pass redesigns. The plan is organized into phases that build incrementally, ensuring each phase produces working code.

**Estimated Time:** 1-2 weeks
**New Files:** 8 files
**Modified Files:** 3 files

---

## Phase 1: Enterprise Component Foundation

- [x] 1. Create Enterprise Directory Structure
  - [x] 1.1 Create `frontend/src/components/inventory/enterprise/` directory
    - Create directory structure for enterprise components
    - _Requirements: 1.1_

  - [x] 1.2 Create `frontend/src/components/inventory/enterprise/index.ts`
    - Create barrel export file (initially empty, will add exports as components are created)
    - _Requirements: 1.4_

- [x] 2. Create InventoryHeader Component
  - [x] 2.1 Create `frontend/src/components/inventory/enterprise/InventoryHeader.tsx`
    - Implement "My Collection" title with 4xl-5xl extrabold gradient text (indigo→purple)
    - Add item count subtitle with sm medium weight, muted color
    - Add 1.5px gradient accent bar below title
    - Implement view toggle (grid/compact) with icon buttons
    - Add optional CollectionStats integration
    - _Requirements: 2.1_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Item Display System

- [x] 4. Create InventoryItemBox Component
  - [x] 4.1 Create `frontend/src/components/inventory/enterprise/InventoryItemBox.tsx`
    - Implement sizeConfig with xl/lg/md/sm specifications
    - Add size-specific typography (titleSize, titleWeight, typeSize)
    - Implement rarity borders, glows, and background gradients
    - Add item preview image/icon display with SkinPreview support
    - Add item name and type label
    - Implement equipped indicator (green checkmark badge, "EQUIPPED" label)
    - Add equipped glow effect (green border glow)
    - Add acquired date display for larger sizes
    - Add hover lift effect (translateY -2px)
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Write property test for size config consistency
    - **Property 1: Size Config Consistency**
    - **Validates: Requirements 2.3, 3.1**

  - [x] 4.3 Write property test for rarity theming application
    - **Property 2: Rarity Theming Application**
    - **Validates: Requirements 3.2**

  - [x] 4.4 Write property test for equipped item styling
    - **Property 3: Equipped Item Styling**
    - **Validates: Requirements 3.4**

- [x] 5. Create EquipCTA Component
  - [x] 5.1 Create `frontend/src/components/inventory/enterprise/EquipCTA.tsx`
    - Implement variant styles (default, equipped, unequip, loading)
    - Add size variants (sm, md, lg)
    - Add loading state with spinner
    - Add checkmark icon for equipped variant
    - Implement hover and active states
    - Add slot type hint text ("Equip as Skin")
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Write property test for equip CTA variants
    - **Property 9: Equip CTA Variants**
    - **Validates: Requirements 8.1**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Loadout Visualization

- [x] 7. Create LoadoutPanel Component
  - [x] 7.1 Create `frontend/src/components/inventory/enterprise/LoadoutPanel.tsx`
    - Implement 6 loadout slots in responsive grid (3x2 mobile, 6x1 desktop)
    - Add slot type icons and labels for each slot
    - Implement filled slot styling with item preview and rarity border
    - Implement empty slot styling with dashed border and placeholder icon
    - Add click handler to filter inventory by slot type
    - Add hover effects on slots
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Write property test for loadout slot display
    - **Property 4: Loadout Slot Display**
    - **Validates: Requirements 4.2, 4.3**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Collection Statistics

- [x] 9. Create CollectionStats Component
  - [x] 9.1 Create `frontend/src/components/inventory/enterprise/CollectionStats.tsx`
    - Implement total items owned display with icon
    - Add type breakdown with icons for each cosmetic type
    - Add rarity breakdown with colored dot indicators
    - Implement completion percentage display (if total catalog known)
    - Support inline and expanded variants
    - Add shimmer effect on legendary count if > 0
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 9.2 Write property test for collection stats calculation
    - **Property 5: Collection Stats Calculation**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Filter and Sort System

- [x] 11. Create FilterBar Component
  - [x] 11.1 Create `frontend/src/components/inventory/enterprise/FilterBar.tsx`
    - Implement type filter chips (All, Skin, Emote, Banner, Nameplate, Effect, Trail)
    - Add rarity filter dropdown with all rarity options
    - Add equipped status toggle (All, Equipped, Unequipped)
    - Add sort dropdown (Newest, Oldest, Name A-Z, Name Z-A, Rarity)
    - Implement active filter summary display
    - Add "Clear All" button when filters active
    - Show item counts on filter chips
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 11.2 Write property test for filter application
    - **Property 6: Filter Application**
    - **Validates: Requirements 6.2**

  - [x] 11.3 Write property test for sort order
    - **Property 7: Sort Order**
    - **Validates: Requirements 6.4**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Section Organization

- [x] 13. Create InventorySection Component
  - [x] 13.1 Create `frontend/src/components/inventory/enterprise/InventorySection.tsx`
    - Implement section header with icon container (12x12)
    - Add H2 title (2xl-3xl bold) and subtitle (sm muted)
    - Support badge variants (default, count, new, equipped)
    - Implement consistent padding (24px) and margin (48px bottom)
    - Add optional collapse/expand functionality
    - _Requirements: 2.2, 7.1, 7.3_

  - [x] 13.2 Write property test for badge variant styling
    - **Property 8: Badge Variant Styling**
    - **Validates: Requirements 7.3**

- [x] 14. Update Enterprise Exports
  - [x] 14.1 Update `frontend/src/components/inventory/enterprise/index.ts`
    - Export InventoryHeader
    - Export InventoryItemBox
    - Export LoadoutPanel
    - Export CollectionStats
    - Export FilterBar
    - Export InventorySection
    - Export EquipCTA
    - _Requirements: 1.4_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Page Integration

- [x] 16. Update Inventory Page
  - [x] 16.1 Update `frontend/src/pages/Inventory.tsx`
    - Replace basic header with InventoryHeader
    - Wrap LoadoutDisplay with InventorySection "Current Loadout"
    - Replace InventoryGrid with enterprise components
    - Add FilterBar above inventory grid
    - Wrap inventory grid with InventorySection "My Items"
    - Integrate CollectionStats in header
    - Update skeleton loading states
    - Ensure proper section spacing and layout
    - _Requirements: 7.2_

  - [x] 16.2 Write property test for equip state transitions
    - **Property 10: Equip State Transitions**
    - **Validates: Requirements 8.3, 8.4**

- [x] 17. Update InventoryGrid Component
  - [x] 17.1 Update `frontend/src/components/cosmetics/InventoryGrid.tsx`
    - Replace item cards with InventoryItemBox
    - Integrate FilterBar for filtering
    - Use responsive size variants (SM mobile, MD tablet, MD/LG desktop)
    - Add empty state with enterprise styling
    - Implement filter and sort logic
    - _Requirements: 6.5, 9.1, 9.2, 9.3_

  - [x] 17.2 Write property test for responsive size selection
    - **Property 11: Responsive Size Selection**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 18. Update LoadoutDisplay Component
  - [x] 18.1 Update `frontend/src/components/cosmetics/LoadoutDisplay.tsx`
    - Replace with LoadoutPanel or upgrade styling to match
    - Add rarity borders to filled slots
    - Improve empty slot styling with dashed borders
    - Add hover effects and click handlers
    - _Requirements: 4.5_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Polish and Animations

- [x] 20. Add Equip Animations
  - [x] 20.1 Add equip flow animations
    - Add loading state on equip button during API call
    - Animate equipped badge appearance (scale 0→1)
    - Add toast notification on equip/unequip success
    - Update loadout panel slot with animation
    - Implement optimistic updates
    - _Requirements: 8.3, 8.4_

- [x] 21. Add Micro-interactions
  - [x] 21.1 Add hover and interaction animations
    - Add translateY(-2px) lift on InventoryItemBox hover
    - Add shadow enhancement on hover
    - Add scale(0.98) on EquipCTA click
    - Add filter chip selection transitions
    - Add loadout slot hover effects
    - _Requirements: 8.2_

- [x] 22. Add Responsive Behavior
  - [x] 22.1 Implement responsive breakpoints
    - Mobile (<640px): SM cards, 2 columns, 3x2 loadout grid
    - Tablet (640-1024px): MD cards, 3 columns, 6x1 loadout row
    - Desktop (>1024px): MD/LG cards, 4-5 columns, full loadout panel
    - Ensure 44x44px minimum tap targets
    - Add touch feedback on mobile
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 23. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| components/inventory/enterprise/index.ts | Barrel export file |
| components/inventory/enterprise/InventoryHeader.tsx | Enterprise page header |
| components/inventory/enterprise/InventoryItemBox.tsx | Configurable item display |
| components/inventory/enterprise/LoadoutPanel.tsx | Enhanced loadout display |
| components/inventory/enterprise/CollectionStats.tsx | Statistics display |
| components/inventory/enterprise/FilterBar.tsx | Filter chips and sort controls |
| components/inventory/enterprise/InventorySection.tsx | Section container |
| components/inventory/enterprise/EquipCTA.tsx | Equip/unequip buttons |

### Modified Files
| File | Changes |
|------|---------|
| pages/Inventory.tsx | Integrate enterprise components, add sections |
| components/cosmetics/InventoryGrid.tsx | Use InventoryItemBox, add filtering |
| components/cosmetics/LoadoutDisplay.tsx | Upgrade to enterprise styling |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Size Config Consistency | inventory.test.ts | 2.3, 3.1 |
| 2. Rarity Theming Application | inventory.test.ts | 3.2 |
| 3. Equipped Item Styling | inventory.test.ts | 3.4 |
| 4. Loadout Slot Display | inventory.test.ts | 4.2, 4.3 |
| 5. Collection Stats Calculation | inventory.test.ts | 5.2, 5.3, 5.4 |
| 6. Filter Application | inventory.test.ts | 6.2 |
| 7. Sort Order | inventory.test.ts | 6.4 |
| 8. Badge Variant Styling | inventory.test.ts | 7.3 |
| 9. Equip CTA Variants | inventory.test.ts | 8.1 |
| 10. Equip State Transitions | inventory.test.ts | 8.3, 8.4 |
| 11. Responsive Size Selection | inventory.test.ts | 9.1, 9.2, 9.3 |

### Size Configuration Reference
| Size | Min Height | Image | Title | Type Label | Description |
|------|------------|-------|-------|------------|-------------|
| XL | 420px | 240px | 28px extrabold | 12px | 14px |
| LG | 200px | 160px | 22px bold | 11px | 13px |
| MD | 280px | 120px | 16px bold | 10px | none |
| SM | 180px | 80px | 14px semibold | none | none |

### Rarity Theming Reference
| Rarity | Border | Hover Glow | Background |
|--------|--------|------------|------------|
| Common | #737373/40% | none | #737373/5% |
| Uncommon | #10b981/40% | 0_0_30px rgba(16,185,129,0.2) | #10b981/10% |
| Rare | #3b82f6/40% | 0_0_30px rgba(59,130,246,0.25) | #3b82f6/10% |
| Epic | #a855f7/40% | 0_0_35px rgba(168,85,247,0.3) | #a855f7/10% |
| Legendary | #f59e0b/50% | 0_0_40px rgba(245,158,11,0.35) | #f59e0b/15% |

### Equipped Styling Reference
| Element | Style |
|---------|-------|
| Border Glow | shadow-[0_0_20px_rgba(16,185,129,0.3)] |
| Badge Background | bg-[#10b981] |
| Badge Text | text-white, font-bold |
| Checkmark | w-4 h-4, stroke-width 2.5 |

---

*Total Tasks: 23 phases with sub-tasks*
*Estimated Time: 1-2 weeks*
*New Files: 8*
*Property Tests: 11*

---

## Phase 9: Full-Stack Integration Fixes

- [x] 24. Fix Unequip Endpoint Contract Mismatch
  - [x] 24.1 Update `frontend/src/hooks/useCosmetics.ts`
    - Backend expects `{ slot: CosmeticType }`, frontend was sending `{ cosmetic_id: string }`
    - Look up cosmetic type from inventory before calling unequip
    - Send correct payload format to backend
    - _Requirements: 8.1, 8.3_

- [x] 25. Fix Loadout Schema Mismatch
  - [x] 25.1 Update `frontend/src/hooks/useCosmetics.ts`
    - Backend returns `skin_equipped` as `Cosmetic` objects
    - Frontend expects `skin` as string IDs
    - Add transformer in fetchLoadout to extract IDs from Cosmetic objects
    - Handle both object and string formats for backwards compatibility
    - _Requirements: 4.1, 4.2_

- [x] 26. Add Missing Database Columns
  - [x] 26.1 Create `backend/app/database/migrations/015_add_loadout_slots.sql`
    - Add `trail_equipped` column to loadouts table
    - Add `playercard_equipped` column to loadouts table
    - Update cosmetics_catalog type constraint to include 'playercard'
    - _Requirements: 4.1_

  - [x] 26.2 Update `backend/app/schemas/cosmetic.py`
    - Add `trail_equipped` field to Loadout schema
    - Add `trail_equipped` field to LoadoutSimple schema
    - _Requirements: 4.1_

  - [x] 26.3 Update `backend/app/services/cosmetics_service.py`
    - Fix SLOT_MAP: trail should map to `trail_equipped` not `effect_equipped`
    - Add `trail_equipped` to get_loadout response builder
    - _Requirements: 4.1_

  - [x] 26.4 Update `backend/app/database/repositories/cosmetics_repo.py`
    - Add `trail_equipped` to get_loadout_with_cosmetics slot list
    - _Requirements: 4.1_

  - [x] 26.5 Update `backend/tests/property/test_cosmetics.py`
    - Update expected_slots to reflect trail → trail_equipped mapping
    - _Requirements: 4.1_

- [x] 27. Final Integration Checkpoint
  - All 22 backend cosmetics property tests pass
  - All 656 frontend tests pass (1 unrelated pre-existing failure in DynamicAssetLoader)
  - _Requirements: All_
