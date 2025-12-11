# Implementation Plan

- [x] 1. Refactor TileRenderer (974 lines → 946 total across 4 files) ✅
  - [x] 1.0 Pre-refactor audit for TileRenderer
  - [x] 1.1 Extract IndustrialArenaRenderer module (340 lines)
  - [x] 1.2 Extract TileTypes module (91 lines)
  - [x] 1.3 Extract TileVariation module (187 lines)
  - [x] 1.4 Slim down TileRenderer coordinator (328 lines)

- [x] 2. Checkpoint - Run terrain tests ✅ (25 tests pass)

- [x] 3. Refactor TrapManager (855 lines → 761 total across 3 files) ✅
  - [x] 3.1 Extract TrapRenderer module (179 lines)
  - [x] 3.2 Extract VolcanicTrapRenderer module (238 lines)
  - [x] 3.3 Slim down TrapManager coordinator (344 lines)

- [x] 4. Refactor BarrierManager (726 lines → 629 total across 3 files) ✅
  - [x] 4.1 Extract BarrierRenderer module (172 lines)
  - [x] 4.2 Extract VolcanicBarrierRenderer module (130 lines)
  - [x] 4.3 Slim down BarrierManager coordinator (327 lines)

- [x] 5. Checkpoint - Run game tests ✅ (49 tests pass)

- [x] 6. Refactor InstantPlay (724 lines → 804 total across 2 files) ✅
  - [x] 6.1 Extract useInstantPlay hook (616 lines)
  - [x] 6.2 Slim down InstantPlay page (188 lines)

- [x] 7. Refactor TilesetLoader (679 lines → 511 total across 2 files) ✅
  - [x] 7.1 Extract TileIndices module (212 lines)
  - [x] 7.2 Slim down TilesetLoader (299 lines)

- [x] 8. Checkpoint - Run terrain tests ✅ (25 tests pass)


- [x] 9. Refactor GameArena (592 lines → ~650 total across 4 files)
  - [x] 9.1 Extract useGameLoop hook
  - [x] 9.2 Extract useArenaInput hook
  - [x] 9.3 Extract ArenaOverlays component
  - [x] 9.4 Slim down GameArena component

- [x] 10. Refactor GameEngine (571 lines → ~650 total across 4 files)
  - [x] 10.1 Extract GameLoop module
  - [x] 10.2 Extract EntityManager module
  - [x] 10.3 Extract PhysicsIntegration module
  - [x] 10.4 Slim down GameEngine coordinator

- [x] 11. Checkpoint - Run engine tests

- [x] 12. Refactor DemoGameEngine (558 lines → ~650 total across 4 files)
  - [x] 12.1 Extract DemoLoop module
  - [x] 12.2 Extract DemoEntityController module
  - [x] 12.3 Extract DemoScenarioManager module
  - [x] 12.4 Slim down DemoGameEngine coordinator

- [x] 13. Refactor RewardDisplayBox (555 lines → ~550 total across 4 files)
  - [x] 13.1 Extract RewardIcon component
  - [x] 13.2 Extract RewardProgress component
  - [x] 13.3 Extract RewardAnimation component
  - [x] 13.4 Slim down RewardDisplayBox

- [x] 14. Checkpoint - Run battlepass tests

- [x] 15. Refactor CombatSystem (547 lines → ~650 total across 4 files)
  - [x] 15.1 Extract DamageCalculator module
  - [x] 15.2 Extract ProjectileManager module
  - [x] 15.3 Extract HitDetection module
  - [x] 15.4 Slim down CombatSystem coordinator

- [x] 16. Refactor HazardManager (540 lines → ~600 total across 4 files)
  - [x] 16.1 Extract HazardSpawner module
  - [x] 16.2 Extract HazardCollision module
  - [x] 16.3 Extract HazardEffects module
  - [x] 16.4 Slim down HazardManager coordinator

- [x] 17. Checkpoint - Run hazard tests

- [x] 18. Refactor ArenaManager (526 lines → ~600 total across 4 files)
  - [x] 18.1 Extract ArenaStateManager module
  - [x] 18.2 Extract ArenaEventDispatcher module
  - [x] 18.3 Extract ArenaEntityCoordinator module
  - [x] 18.4 Slim down ArenaManager coordinator

- [x] 19. Refactor useSettings (516 lines → ~550 total across 5 files)
  - [x] 19.1 Extract useAudioSettings hook
  - [x] 19.2 Extract useVideoSettings hook
  - [x] 19.3 Extract useControlSettings hook
  - [x] 19.4 Extract useSettingsPersistence hook
  - [x] 19.5 Slim down useSettings composition hook

- [x] 20. Checkpoint - Run settings tests

- [x] 21. Refactor ArenaGame (505 lines → ~600 total across 4 files)
  - [x] 21.1 Extract useArenaGame hook
  - [x] 21.2 Extract ArenaGameSetup component
  - [x] 21.3 Extract ArenaGameResults component
  - [x] 21.4 Slim down ArenaGame page

- [ ] 22. Final Checkpoint - Run full test suite
