# Implementation Plan

## Phase 1: Core Infrastructure

- [x] 1. Set up visual system directory structure
  - [x] 1.1 Create `frontend/src/game/visual/` directory structure
    - Create TileArtSystem.ts, ParallaxDepthSystem.ts, EnvironmentalPropSystem.ts
    - Create DynamicLightingSystem.ts, AnimationLifeSystem.ts, VisualHierarchySystem.ts
    - Create ThemeAssetLoader.ts, QualityManager.ts
    - Create types.ts for shared interfaces
    - _Requirements: 8.1_

  - [x] 1.2 Create theme asset directory structure
    - Create `frontend/src/game/themes/volcanic/` with manifest.json
    - Create tiles/, props/, backgrounds/, particles/ subdirectories
    - _Requirements: 8.1, 8.2_

---

## Phase 2: Theme Asset Pipeline

- [-] 2. Implement ThemeAssetLoader
  - [x] 2.1 Create ThemeAssetLoader class
    - Implement loadTheme() to fetch and parse manifest.json
    - Implement loadAsset() with caching
    - Implement validateManifest() with required field checks
    - Implement getPlaceholderTexture() for magenta/black checkerboard
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 2.2 Write property test for manifest validation
    - **Property 17: Theme Manifest Validation**
    - Generate random manifests, verify validation logic
    - **Validates: Requirements 8.6**

  - [x] 2.3 Write property test for asset fallback
    - **Property 18: Asset Fallback Behavior**
    - Verify procedural generation on missing assets
    - **Validates: Requirements 8.3**

  - [x] 2.4 Write property test for placeholder rendering
    - **Property 19: Placeholder Rendering**
    - Verify magenta/black checkerboard on failed loads
    - **Validates: Requirements 8.4**

  - [x] 2.5 Write property test for dimension validation
    - **Property 20: Asset Dimension Validation**
    - Generate random dimensions, verify validation
    - **Validates: Requirements 8.5**

- [x] 3. Implement QualityManager
  - [x] 3.1 Create QualityManager class
    - Implement detectDeviceCapabilities() for tier detection
    - Implement setPreset() and getSettings()
    - Implement recordFrameTime() and shouldReduceQuality()
    - Implement autoAdjustQuality() for adaptive scaling
    - Implement serialize()/deserialize() for persistence
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6_

  - [x] 3.2 Write property test for preset settings
    - **Property 14: Quality Preset Settings**
    - Verify settings match preset definitions
    - **Validates: Requirements 7.2**

  - [x] 3.3 Write property test for config round-trip
    - **Property 15: Quality Config Round-Trip**
    - Serialize then deserialize, verify equality
    - **Validates: Requirements 7.6**

  - [x] 3.4 Write property test for auto quality reduction
    - **Property 16: Auto Quality Reduction**
    - Simulate high frame times, verify reduction
    - **Validates: Requirements 7.5**

---

## Phase 3: Checkpoint - Infrastructure Tests

- [x] 4. Checkpoint - Ensure infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Tile Art System

- [x] 5. Implement TileArtSystem
  - [x] 5.1 Create TileArtSystem class
    - Implement generateTileTexture() with procedural generation
    - Implement renderBaseColor() with seeded noise
    - Implement renderCracks() with configurable density
    - Implement renderEdgeErosion() for exposed edges
    - Implement applyBakedLighting() with gradient
    - Implement render9Slice() for barriers
    - Add texture caching with cache key generation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.2 Write property test for seed determinism
    - **Property 1: Seed Determinism**
    - Generate same texture twice, verify pixel equality
    - **Validates: Requirements 1.5**

  - [x] 5.3 Write property test for texture dimensions
    - **Property 2: Tile Texture Dimensions**
    - Verify all textures are 80x80 with content
    - **Validates: Requirements 1.1**

  - [x] 5.4 Write property test for baked lighting
    - **Property 3: Baked Lighting Gradient**
    - Sample pixels, verify top lighter and bottom darker
    - **Validates: Requirements 1.4**

  - [x] 5.5 Write property test for 9-slice corners
    - **Property 4: 9-Slice Corner Preservation**
    - Render various sizes, verify corner preservation
    - **Validates: Requirements 1.3**

---

## Phase 5: Parallax Depth System

- [x] 6. Implement ParallaxDepthSystem
  - [x] 6.1 Create ParallaxDepthSystem class
    - Implement initializeLayers() with 4 depth layers
    - Implement createFarBackground() for Layer 0 (scrollRatio 0.1)
    - Implement createMidBackground() for Layer 1 (scrollRatio 0.3)
    - Implement createForegroundElements() for Layer 3 (scrollRatio 1.2)
    - Implement updateCameraPosition() and render()
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Write property test for layer count
    - **Property 5: Parallax Layer Count**
    - Verify exactly 4 layers after initialization
    - **Validates: Requirements 2.1**

  - [x] 6.3 Write property test for scroll ratio
    - **Property 6: Parallax Scroll Ratio**
    - Generate random camera deltas, verify layer offsets
    - **Validates: Requirements 2.2**

---

## Phase 6: Environmental Props System

- [x] 7. Implement EnvironmentalPropSystem
  - [x] 7.1 Create EnvironmentalPropSystem class
    - Implement loadDefinitions() to parse props.json
    - Implement placeProp() with position, layer, rotation, scale
    - Implement update() for animation frame cycling with phase offset
    - Implement render() with layer filtering and ordering
    - Add sprite preloading and caching
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.2 Write property test for prop placement
    - **Property 7: Prop Placement Accuracy**
    - Verify placed props match anchor positions
    - **Validates: Requirements 3.1**

  - [x] 7.3 Write property test for layer ordering
    - **Property 8: Prop Layer Ordering**
    - Verify render order: background < gameplay < foreground
    - **Validates: Requirements 3.4**

---

## Phase 7: Checkpoint - Core Systems Tests

- [x] 8. Checkpoint - Ensure core systems tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Dynamic Lighting System

- [x] 9. Implement DynamicLightingSystem
  - [x] 9.1 Create DynamicLightingSystem class
    - Implement createLightsFromHazards() with position, color, radius, intensity
    - Implement update() for pulse animation
    - Implement getLightIntensityAt() with falloff calculation
    - Implement applyRimLighting() for platform edges
    - Implement applyPlayerUnderglow() with distance-based intensity
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 9.2 Write property test for light from hazard
    - **Property 11: Light Source from Hazard**
    - Verify light properties match hazard specifications
    - **Validates: Requirements 4.1**

  - [x] 9.3 Write property test for underglow threshold
    - **Property 12: Underglow Distance Threshold**
    - Verify underglow applied only within 100px
    - **Validates: Requirements 4.4**

---

## Phase 9: Animation Life System

- [x] 10. Implement AnimationLifeSystem
  - [x] 10.1 Create AnimationLifeSystem class
    - Implement registerLavaAnimation() with 8+ frames
    - Implement registerSteamVent() with particle config
    - Implement update() with delta-time based progression
    - Implement checkForNewEvents() with probability-based triggering
    - Implement generateLavaFrames() with bubbling effect
    - Add phase offset assignment for staggered animations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 10.2 Write property test for phase diversity
    - **Property 9: Animation Phase Diversity**
    - Verify 3+ elements have diverse phase offsets
    - **Validates: Requirements 5.5**

  - [x] 10.3 Write property test for delta-time animation
    - **Property 10: Delta-Time Animation**
    - Verify animation progress proportional to deltaTime
    - **Validates: Requirements 5.6**

---

## Phase 10: Visual Hierarchy System

- [x] 11. Implement VisualHierarchySystem
  - [x] 11.1 Create VisualHierarchySystem class
    - Implement applyPlatformContrast() with brightness boost
    - Implement applyBackgroundEffects() with desaturation and blur
    - Implement applyHazardIndicators() with pulsing glow
    - Implement applyInteractiveGlow() with distinct colors
    - Implement applyVignette() with configurable radius/intensity
    - Implement calculateContrastRatio() for WCAG compliance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 11.2 Write property test for hazard contrast
    - **Property 13: Hazard Contrast Ratio**
    - Verify contrast ratio >= 4.5:1 for all hazards
    - **Validates: Requirements 6.2**

---

## Phase 11: Checkpoint - All Systems Tests

- [x] 12. Checkpoint - Ensure all systems tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 12: Integration with Existing Systems

- [x] 13. Integrate with GameEngine
  - [x] 13.1 Update GameEngine to initialize visual systems
    - Add TileArtSystem, ParallaxDepthSystem, EnvironmentalPropSystem
    - Add DynamicLightingSystem, AnimationLifeSystem, VisualHierarchySystem
    - Add ThemeAssetLoader and QualityManager
    - Wire up update() calls with deltaTime
    - _Requirements: All_

  - [x] 13.2 Update RenderPipeline for visual compositing
    - Integrate parallax layers before gameplay rendering
    - Add lighting pass after platform rendering
    - Add visual hierarchy post-processing
    - Add vignette as final pass
    - _Requirements: 2.6, 6.6_

  - [x] 13.3 Update TileBatchRenderer to use TileArtSystem
    - Replace solid color rendering with procedural textures
    - Add 9-slice support for barriers
    - Implement texture batching for performance
    - _Requirements: 1.1, 1.3, 7.3_

  - [x] 13.4 Update BackdropSystem to use ParallaxDepthSystem
    - Replace existing backdrop with enhanced parallax
    - Add foreground layer rendering after gameplay
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

---

## Phase 13: Create Volcanic Theme Assets

- [x] 14. Create volcanic theme manifest and assets
  - [x] 14.1 Create volcanic manifest.json
    - Define palette colors (primary, secondary, background, platform, hazard)
    - Define tileConfig (seed, crackDensity, weatheringIntensity, edgeErosion)
    - Define lighting config (ambientColor, ambientIntensity, rimLighting)
    - Define parallax layer configuration
    - Define prop definitions (chains, crystals, steam vents)
    - _Requirements: 8.2_

  - [x] 14.2 Create placeholder sprite assets
    - Create platform.png, wall.png, hazard_lava.png tiles
    - Create chain_hanging.png, crystal_cluster.png, steam_vent.png props
    - Create far_mountains.png, mid_rocks.png backgrounds
    - Create ember.png, smoke.png, lava_splash.png particles
    - _Requirements: 8.1_

---

## Phase 14: Performance Optimization

- [x] 15. Implement performance optimizations
  - [x] 15.1 Add texture batching to TileArtSystem
    - Group tiles by texture for single draw calls
    - Target < 50 draw calls per frame
    - _Requirements: 7.3_

  - [x] 15.2 Add particle object pooling
    - Pre-allocate particle pool based on quality setting
    - Implement particle reuse instead of creation
    - _Requirements: 7.4_

  - [x] 15.3 Wire up QualityManager auto-adjustment
    - Record frame times in render loop
    - Trigger auto-adjustment when sustained > 18ms
    - _Requirements: 7.5_

---

## Phase 15: Final Checkpoint

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| visual/TileArtSystem.ts | Procedural tile textures |
| visual/ParallaxDepthSystem.ts | 4-layer parallax backdrop |
| visual/EnvironmentalPropSystem.ts | Decorative prop placement |
| visual/DynamicLightingSystem.ts | Real-time lighting effects |
| visual/AnimationLifeSystem.ts | Environmental animations |
| visual/VisualHierarchySystem.ts | Gameplay clarity post-processing |
| visual/ThemeAssetLoader.ts | Theme asset loading/validation |
| visual/QualityManager.ts | Performance-based quality scaling |
| visual/types.ts | Shared TypeScript interfaces |
| themes/volcanic/manifest.json | Volcanic theme configuration |

### Modified Files
| File | Changes |
|------|---------|
| GameEngine.ts | Initialize and coordinate visual systems |
| RenderPipeline.ts | Composite visual layers |
| TileBatchRenderer.ts | Use TileArtSystem for textures |
| BackdropSystem.ts | Use ParallaxDepthSystem |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Seed Determinism | test_tile_art.ts | 1.5 |
| 2. Tile Texture Dimensions | test_tile_art.ts | 1.1 |
| 3. Baked Lighting Gradient | test_tile_art.ts | 1.4 |
| 4. 9-Slice Corner Preservation | test_tile_art.ts | 1.3 |
| 5. Parallax Layer Count | test_parallax.ts | 2.1 |
| 6. Parallax Scroll Ratio | test_parallax.ts | 2.2 |
| 7. Prop Placement Accuracy | test_props.ts | 3.1 |
| 8. Prop Layer Ordering | test_props.ts | 3.4 |
| 9. Animation Phase Diversity | test_animation.ts | 5.5 |
| 10. Delta-Time Animation | test_animation.ts | 5.6 |
| 11. Light Source from Hazard | test_lighting.ts | 4.1 |
| 12. Underglow Distance Threshold | test_lighting.ts | 4.4 |
| 13. Hazard Contrast Ratio | test_hierarchy.ts | 6.2 |
| 14. Quality Preset Settings | test_quality.ts | 7.2 |
| 15. Quality Config Round-Trip | test_quality.ts | 7.6 |
| 16. Auto Quality Reduction | test_quality.ts | 7.5 |
| 17. Theme Manifest Validation | test_theme_loader.ts | 8.6 |
| 18. Asset Fallback Behavior | test_theme_loader.ts | 8.3 |
| 19. Placeholder Rendering | test_theme_loader.ts | 8.4 |
| 20. Asset Dimension Validation | test_theme_loader.ts | 8.5 |

### Quality Presets
| Setting | Low | Medium | High | Ultra |
|---------|-----|--------|------|-------|
| Parallax Layers | 2 | 3 | 4 | 4 |
| Particle Multiplier | 0.25 | 0.5 | 0.75 | 1.0 |
| Animated Tiles | Off | On | On | On |
| Dynamic Lighting | Off | Basic | Full | Full |
| Blur Effects | Off | Off | On | On |

---

*Total Tasks: 16 phases with sub-tasks*
*Estimated Time: 5-7 days*
*New Files: 10*
*Modified Files: 4*
*Property Tests: 20*