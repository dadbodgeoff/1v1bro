# Mobile App Fork Guide

This document outlines what to include/exclude when creating a mobile-focused fork of the codebase.

## Quick Start

Run the fork script:
```bash
./scripts/create-mobile-fork.sh /path/to/new/mobile-app
```

## What Gets EXCLUDED (2D Arena Game Engine)

### 2D Game Engine Subfolders (EXCLUDED)
- `frontend/src/game/engine/` - GameLoop, PlayerController, RenderPipeline
- `frontend/src/game/arena/` - 2D ArenaManager, TileMap, MapLoader
- `frontend/src/game/combat/` - 2D CombatSystem, ProjectileManager, WeaponManager
- `frontend/src/game/renderers/` - All 2D canvas renderers
- `frontend/src/game/terrain/` - Tile-based terrain system
- `frontend/src/game/visual/` - 2D visual effects
- `frontend/src/game/backdrop/` - 2D backdrop system
- `frontend/src/game/barriers/` - 2D barriers
- `frontend/src/game/hazards/` - 2D hazards
- `frontend/src/game/traps/` - 2D traps
- `frontend/src/game/zones/` - 2D zones
- `frontend/src/game/transport/` - 2D transport (teleporters, jump pads)
- `frontend/src/game/interactive/` - 2D interactive elements
- `frontend/src/game/particles/` - 2D particle system
- `frontend/src/game/props/` - 2D props
- `frontend/src/game/rendering/` - 2D rendering layers
- `frontend/src/game/themes/` - 2D themes
- `frontend/src/game/emotes/` - 2D emote system
- `frontend/src/game/telemetry/` - 2D telemetry/replay
- `frontend/src/game/collision/` - 2D collision system
- `frontend/src/game/GameEngine.ts` - Main 2D engine file
- `frontend/src/game/__tests__/` - 2D game tests

### 2D Arena Pages (EXCLUDED)
- `frontend/src/pages/Game.tsx` - Quiz-only game
- `frontend/src/pages/ArenaGame.tsx` - 2D PvP arena with quiz
- `frontend/src/pages/BotGame.tsx` - 2D practice mode
- `frontend/src/pages/CornfieldMapBuilder.tsx` - 2D map builder
- `frontend/src/pages/VolcanicLanding.tsx` - 2D volcanic theme landing
- `frontend/src/pages/SimpleArenaTest.tsx` - 2D simple arena test

### 2D Game Components (EXCLUDED)
- `frontend/src/components/game/` - All 2D game UI components
  - `GameArena.tsx`
  - `ArenaScoreboard.tsx`
  - `ArenaQuizPanel.tsx`
  - `MobileControls.tsx`
  - etc.

### 2D Game Hooks (EXCLUDED)
- `frontend/src/hooks/useGame.ts`
- `frontend/src/hooks/useBotGame.ts`
- `frontend/src/hooks/useArenaGame.ts`
- `frontend/src/hooks/useGameLoop.ts`
- `frontend/src/hooks/useGameArenaCallbacks.ts`
- `frontend/src/hooks/useArenaConfig.ts`
- `frontend/src/hooks/useArenaCosmetics.ts`
- `frontend/src/hooks/useArenaInput.ts`

---

## SHARED MODULES (KEPT - Required by other systems)

These modules from `frontend/src/game/` are KEPT because other systems depend on them:

### `frontend/src/game/guest/` ✅ KEPT
Used by `Register.tsx` for session transfer when guests sign up.
- `GuestSessionManager.ts` - Guest session tracking
- `SessionTransferFlow.ts` - Transfer guest progress to account
- `MilestoneSystem.ts` - Guest milestones
- `SoftConversionPrompts.ts` - Conversion prompts
- `EngagementFeedbackSystem.ts` - XP popups

### `frontend/src/game/types/` ✅ KEPT
Basic types used throughout the app:
- `Vector2` - Position type
- `PowerUpState`, `PowerUpType` - Power-up types
- `PlayerState` - Player state type

### `frontend/src/game/config/` ✅ KEPT
Map configurations used by matchmaking:
- `maps/` - Map definitions and loader
- `arena.ts`, `colors.ts`, `combat.ts` - Config values

### `frontend/src/game/bot/` ✅ KEPT
Bot behavior system (may be useful for 3D arena bots):
- `BotController.ts`
- `BotQuizBehavior.ts`
- `AdaptiveDifficultyManager.ts`
- `TutorialManager.ts`

### `frontend/src/game/assets/` ✅ KEPT
Asset loading used by `useDynamicImage.ts`:
- `DynamicAssetLoader.ts` - Dynamic image loading
- `AssetLoader.ts` - Core asset loading

### `frontend/src/game/systems/` ✅ KEPT
Shared systems:
- `PositionInterpolator.ts` - Used by arena hooks for smooth movement

### `frontend/src/game/index.ts` ✅ KEPT (needs update)
Re-exports types - update to remove GameEngine export

---

## What Gets INCLUDED (Mobile App)

### 3D Arena System ✅
- `frontend/src/arena/` - Complete 3D Three.js arena
  - `bot/` - Bot AI system (CombatConductor, TacticalNavigator, etc.)
  - `client/` - CameraController, InputManager, PredictionSystem
  - `config/` - Quality settings, mobile config, device detection
  - `core/` - EventBus, ViewportManager
  - `effects/` - HitstopSystem, ProjectileParticles
  - `engine/` - ArenaGameLoop, TouchController
  - `game/` - CombatSystem, SpawnSystem, MatchStateMachine
  - `geometry/` - Map geometry builders
  - `hooks/` - useMobileOptimization
  - `maps/` - MapLoader, MapRegistry, definitions
  - `physics/` - 3D physics, CollisionWorld, SpatialHashGrid
  - `player/` - AnimationController, WeaponBuilder
  - `rendering/` - ArenaRenderer, PostProcessing
  - `ui/` - ArenaDebugHUD, ArenaOverlays

### 3D Arena Pages ✅
- `frontend/src/pages/Arena.tsx` - Main 3D arena
- `frontend/src/pages/ArenaPlayTest.tsx` - 3D arena test
- `frontend/src/pages/ArenaMapViewer.tsx` - 3D map viewer
- `frontend/src/pages/SimpleArenaTest.tsx` - Simple 3D test

### Survival Runner ✅
- `frontend/src/survival/` - Complete survival runner
  - `engine/` - FixedUpdateLoop, CollisionSystem, PlayerManager
  - `config/` - Themes, mobile settings
  - `hooks/` - useSurvivalAnalytics, useTriviaBillboards
  - All other survival subsystems

### Survival Pages ✅
- `frontend/src/pages/SurvivalGame.tsx`
- `frontend/src/pages/SurvivalLanding.tsx`
- `frontend/src/pages/SurvivalInstantPlay.tsx`
- `frontend/src/pages/SurvivalLeaderboard.tsx`
- `frontend/src/pages/SurvivalTest.tsx`
- `frontend/src/pages/SurvivalDemoTest.tsx`

### Shared Systems ✅
- `frontend/src/components/` (except `game/`)
  - `achievements/`
  - `battlepass/`
  - `coins/`
  - `cosmetics/`
  - `dashboard/`
  - `friends/`
  - `inventory/`
  - `leaderboard/`
  - `profile/`
  - `settings/`
  - `shop/`
  - `ui/`

### Core Pages ✅
- `frontend/src/pages/Achievements.tsx`
- `frontend/src/pages/BattlePass.tsx`
- `frontend/src/pages/CoinShop.tsx`
- `frontend/src/pages/Friends.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Inventory.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/LeaderboardHub.tsx`
- `frontend/src/pages/LeaderboardDetail.tsx`
- `frontend/src/pages/Lobby.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/MatchHistory.tsx`
- `frontend/src/pages/Profile.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/pages/Shop.tsx`

### Shared Infrastructure ✅
- `frontend/src/hooks/` (shared hooks)
- `frontend/src/stores/` - All Zustand stores
- `frontend/src/services/` - API, WebSocket, analytics
- `frontend/src/types/` - TypeScript types
- `frontend/src/utils/` - Utilities
- `frontend/src/config/` - App configuration
- `frontend/src/providers/` - React providers
- `frontend/src/styles/` - CSS and design system

### Backend ✅
- `backend/` - Entire backend (FastAPI, database, etc.)

### Infrastructure ✅
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `Makefile`
- `.env.example`
- All deployment configs

---

## Post-Fork Cleanup

After creating the fork, update these files:

### 1. `frontend/src/App.tsx`
Remove routes:
```tsx
// REMOVE these routes:
// <Route path="/game/:code" element={<Game />} />
// <Route path="/arena-game/:code" element={<ArenaGame />} />
// <Route path="/bot-game" element={<BotGame />} />
// <Route path="/cornfield-builder" element={<CornfieldMapBuilder />} />
// <Route path="/volcanic" element={<VolcanicLanding />} />
// <Route path="/simple-arena-test" element={<SimpleArenaTest />} />
```

### 2. `frontend/src/pages/index.ts`
Remove exports for excluded pages.

### 3. `frontend/src/game/index.ts`
Update to remove GameEngine export but keep types:
```tsx
// REMOVE:
// export { GameEngine } from './GameEngine'
// export type { GameEngineCallbacks } from './GameEngine'

// KEEP:
export * from './types'
export * from './config'
export * from './assets'
export * from './systems'
export * from './guest'
```

### 4. `frontend/src/hooks/useInstantPlay.ts`
This hook uses the 2D game engine. Options:
- Remove it if instant play is 2D-only
- Refactor to use 3D arena instead
- Keep for reference but disable

### 5. Navigation configs
Update any navigation menus that reference 2D arena modes.

### 6. Dashboard cards
Update `frontend/src/components/dashboard/` to remove 2D arena cards if present.

---

## Mobile Optimization Already Included

The 3D arena and survival runner already have mobile optimization:

- `frontend/src/arena/config/device.ts` - Device detection
- `frontend/src/arena/config/mobile.ts` - Touch zones, UI scaling
- `frontend/src/arena/config/quality.ts` - Adaptive quality
- `frontend/src/arena/hooks/useMobileOptimization.ts` - React hook
- `frontend/src/arena/engine/TouchController.ts` - Touch input
- `frontend/src/arena/core/ViewportManager.ts` - Viewport management

Features:
- Adaptive quality based on device capabilities
- Touch controls with virtual joystick
- Aim assist for mobile
- Wake lock and fullscreen support
- iOS Safari-specific optimizations
- Battery-aware performance scaling
