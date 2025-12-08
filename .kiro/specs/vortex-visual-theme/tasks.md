# Implementation Plan

## Overview
This plan transforms Vortex Arena into a fully immersive volcanic/lava themed arena, completely distinct from the space-themed Nexus Arena. The implementation creates new backdrop layers, integrates animated tile effects, and adds theme-aware rendering to all arena components.

---

- [x] 1. Add MapTheme type and VOLCANIC_COLORS constants
  - [x] 1.1 Update MapTheme type in map-schema.ts
    - Add 'volcanic' to MapTheme union type: `'space' | 'volcanic' | 'void'`
    - _Requirements: 12.1_
  - [x] 1.2 Add VOLCANIC_COLORS constant to backdrop types
    - Create VolcanicColors interface in `frontend/src/game/backdrop/types.ts`
    - Add VOLCANIC_COLORS constant with lavaCore, lavaGlow, lavaDark, fire, ember, obsidian, stone, smoke, steam, crack colors
    - _Requirements: 11.1_
  - [x] 1.3 Write property test for color constant validity
    - **Property 2: Color constant validity**
    - **Validates: Requirements 11.1**

- [x] 2. Update VORTEX_ARENA config with volcanic theme
  - [x] 2.1 Add theme property to VORTEX_ARENA metadata
    - Set `theme: 'volcanic'` in VORTEX_ARENA.metadata
    - Update version to '2.0.0' for volcanic theme release
    - Update description to mention volcanic features
    - _Requirements: 12.2_
  - [x] 2.2 Write test for map config theme value
    - **Property 3: Map config theme value**
    - **Validates: Requirements 12.2**

- [x] 3. Create VolcanicCavernLayer backdrop
  - [x] 3.1 Create VolcanicCavernLayer.ts file
    - Create new file at `frontend/src/game/backdrop/layers/VolcanicCavernLayer.ts`
    - Implement BackdropLayer interface
    - Create dark cavern gradient (dark at top, red/orange glow at bottom)
    - Add rocky texture overlay effect
    - _Requirements: 1.1_

- [x] 4. Create LavaGlowLayer backdrop
  - [x] 4.1 Create LavaGlowLayer.ts file
    - Create new file at `frontend/src/game/backdrop/layers/LavaGlowLayer.ts`
    - Implement BackdropLayer interface with update() for animation
    - Create pulsing radial gradient from bottom edge
    - Pulse intensity using sine wave (2-3 second cycle)
    - _Requirements: 1.4_

- [x] 5. Create EmberParticleLayer backdrop
  - [x] 5.1 Create EmberParticleLayer.ts file
    - Create new file at `frontend/src/game/backdrop/layers/EmberParticleLayer.ts`
    - Implement Ember interface (x, y, vx, vy, size, alpha, life)
    - Initialize 50 ember particles at random positions
    - Update: move upward with drift, fade alpha, respawn at bottom
    - Render: draw glowing orange circles
    - _Requirements: 1.3_
  - [x] 5.2 Write property test for particle count limits
    - **Property 6: Particle count limits**
    - **Validates: Requirements 14.1**

- [x] 6. Create SmokeHazeLayer backdrop
  - [x] 6.1 Create SmokeHazeLayer.ts file
    - Create new file at `frontend/src/game/backdrop/layers/SmokeHazeLayer.ts`
    - Implement SmokeWisp interface
    - Create 30 smoke wisps with slow upward drift
    - Render semi-transparent gray wisps
    - _Requirements: 1.2_

- [x] 7. Export volcanic layers and update BackdropSystem
  - [x] 7.1 Export new layers from layers/index.ts
    - Add exports for VolcanicCavernLayer, LavaGlowLayer, EmberParticleLayer, SmokeHazeLayer
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 7.2 Add volcanic theme support to BackdropSystem
    - Add theme parameter to constructor with default 'space'
    - Create createVolcanicLayers() method
    - Add volcanic layers: VolcanicCavernLayer (0), LavaGlowLayer (0), SmokeHazeLayer (0.2), EmberParticleLayer (0.4)
    - Call appropriate layer creation based on theme
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 7.3 Write property test for backdrop creation by theme
    - **Property 4: Backdrop creation by theme**
    - **Validates: Requirements 12.3**

- [x] 8. Checkpoint - Ensure backdrop layers work
  - All tests pass (16/16)

- [x] 9. Update GameEngine for theme support
  - [x] 9.1 Pass theme to BackdropSystem in GameEngine
    - Read theme from `mapConfig?.metadata?.theme ?? 'space'`
    - Pass theme to BackdropSystem constructor
    - _Requirements: 12.3_
  - [x] 9.2 Integrate AnimatedTileRenderer into game loop
    - Import animatedTileRenderer singleton
    - Call animatedTileRenderer.update(deltaTime) in GameEngine.update()
    - _Requirements: 13.1_
  - [x] 9.3 Write property test for animation time advancement
    - **Property 5: Animation time advancement**
    - **Validates: Requirements 13.1**

- [x] 10. Add theme-aware hazard rendering
  - [x] 10.1 Update HazardManager with theme support
    - Add theme property and setTheme() method
    - Import animatedTileRenderer and VOLCANIC_COLORS
    - Update renderDamageZone() to use 'lava' animation for volcanic theme
    - Update renderSlowField() to render steam vent effect for volcanic theme
    - Update renderEMPZone() to use 'electric' animation with volcanic colors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_
  - [ ] 10.2 Write property test for theme animation type selection
    - **Property 1: Theme determines animation type selection**
    - **Validates: Requirements 2.1, 3.1, 4.1**

- [x] 11. Add theme-aware barrier rendering
  - [x] 11.1 Update BarrierManager with volcanic theme
    - Add theme property and setTheme() method
    - Import VOLCANIC_COLORS
    - Create renderVolcanicBarrier() method with obsidian texture
    - Add orange glow edges using gradient
    - Add crack rendering for destructible barriers (intensity based on health)
    - Add lava burst effect on barrier destruction
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Add theme-aware transport rendering
  - [x] 12.1 Update TransportManager with volcanic theme
    - Add theme property and setTheme() method
    - Import animatedTileRenderer and VOLCANIC_COLORS
    - Create renderVolcanicTeleporter() with swirling magma portal effect
    - Create renderVolcanicJumpPad() with volcanic vent and eruption effect
    - Add lava splash effect on teleporter use
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

- [x] 13. Add theme-aware trap rendering
  - [x] 13.1 Update TrapManager with volcanic theme
    - Add theme property and setTheme() method
    - Import VOLCANIC_COLORS
    - Create lava geyser burst effect for pressure trap trigger
    - Create ground crack effect before timed trap activation
    - Add fire/lava splash particles on trap damage
    - Add smoldering embers effect during cooldown
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 14. Create LavaVortexRenderer for center feature
  - [x] 14.1 Create LavaVortexRenderer.ts
    - Create new file at `frontend/src/game/renderers/LavaVortexRenderer.ts`
    - Implement swirling lava whirlpool with 5 concentric rings
    - Add debris particles spiraling inward
    - Add intense center glow with radial gradient
    - Add occasional lava splash effects at edges
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 14.2 Integrate LavaVortexRenderer into ArenaManager
    - Import LavaVortexRenderer
    - Render vortex at map center (640, 360) when theme is volcanic
    - _Requirements: 9.1_

- [ ] 15. Add theme-aware floor tile rendering
  - [ ] 15.1 Update floor tile rendering for volcanic theme
    - Add volcanic stone texture to floor tiles (#2a2a2a to #3a3a3a)
    - Add subtle crack patterns with faint orange glow
    - Vary texture per tile using position-based seed
    - Increase glow near lava zones
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 16. Wire theme through ArenaManager
  - [x] 16.1 Pass theme to all sub-managers
    - Update ArenaManager.loadMap() to read theme from config
    - Call setTheme() on HazardManager, BarrierManager, TransportManager, TrapManager
    - _Requirements: 12.4_

- [x] 17. Final Checkpoint - Ensure all tests pass
  - All property tests pass (16/16)

- [ ] 18. Manual visual verification and Docker rebuild
  - [ ] 18.1 Rebuild Docker and test visually
    - Run `docker compose down && docker compose build frontend --no-cache && docker compose up -d`
    - Navigate to Bot Practice mode
    - Select Nexus Arena - verify space theme unchanged (stars, nebula)
    - Select Vortex Arena - verify volcanic theme:
      - Dark cavern background with lava glow
      - Floating ember particles
      - Animated lava pools on damage zones
      - Steam effects on slow zones
      - Obsidian barriers with orange glow
      - Magma teleporters with swirl effect
      - Volcanic vent jump pads
      - Central lava vortex whirlpool
    - _Requirements: All_

