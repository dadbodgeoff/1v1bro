# PvP Combat System - Implementation Plan

## Overview

This implementation plan follows a **layered approach**:
1. Core combat logic (no networking)
2. Visual rendering
3. Server integration
4. Polish and feedback

**Key Principle:** Test each layer locally before adding network complexity.

---

## Phase 1: Combat Configuration and Types

### Task 1: Create Combat Types
- [ ] 1.1 Create `frontend/src/game/types/combat.ts`
- [ ] 1.2 Define Projectile, WeaponConfig, HealthState interfaces
- [ ] 1.3 Define CombatState, HitEvent, FireEvent interfaces
- [ ] 1.4 Export from `frontend/src/game/types/index.ts`
  - _Requirements: 1.1, 3.1, 4.1_

### Task 2: Create Combat Configuration
- [ ] 2.1 Create `frontend/src/game/config/combat.ts`
- [ ] 2.2 Define WEAPON_CONFIG with fire rate, speed, damage, spread
- [ ] 2.3 Define HEALTH_CONFIG with max health, shield, invulnerability
- [ ] 2.4 Define RESPAWN_CONFIG with delay and spawn points
- [ ] 2.5 Define PROJECTILE_CONFIG with hitbox and trail settings
- [ ] 2.6 Export from `frontend/src/game/config/index.ts`
  - _Requirements: 1.2, 1.4, 1.5, 4.1, 6.1_

---

## Phase 2: Core Combat Managers

### Task 3: Implement WeaponManager
- [ ] 3.1 Create `frontend/src/game/combat/WeaponManager.ts`
- [ ] 3.2 Implement canFire() with fire rate limiting
- [ ] 3.3 Implement recordFire() to track last fire time
- [ ] 3.4 Implement getCooldownProgress() for UI
- [ ] 3.5 Implement applySpread() for aim deviation
- [ ]* 3.6 Write unit tests for fire rate limiting
  - _Requirements: 1.2, 2.1_

### Task 4: Implement ProjectileManager
- [ ] 4.1 Create `frontend/src/game/combat/ProjectileManager.ts`
- [ ] 4.2 Implement spawnProjectile() with position and direction
- [ ] 4.3 Implement update() to move projectiles each frame
- [ ] 4.4 Implement range checking and auto-destroy
- [ ] 4.5 Implement barrier collision detection
- [ ] 4.6 Implement destroyProjectile() and getProjectiles()
- [ ]* 4.7 Write unit tests for projectile lifecycle
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 3.4_

### Task 5: Implement HealthManager
- [ ] 5.1 Create `frontend/src/game/combat/HealthManager.ts`
- [ ] 5.2 Implement initPlayer() to set up health state
- [ ] 5.3 Implement applyDamage() with shield-first logic
- [ ] 5.4 Implement isAlive() and isInvulnerable() checks
- [ ] 5.5 Implement respawn() to restore health and grant invulnerability
- [ ] 5.6 Implement addShield() for shield power-up integration
- [ ]* 5.7 Write unit tests for damage calculation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.3, 6.4_

### Task 6: Implement RespawnManager
- [ ] 6.1 Create `frontend/src/game/combat/RespawnManager.ts`
- [ ] 6.2 Implement startRespawn() with timer and position selection
- [ ] 6.3 Implement selectSpawnPoint() to choose safe location
- [ ] 6.4 Implement update() to track respawn timers
- [ ] 6.5 Implement getRespawnTimeRemaining() for UI
- [ ]* 6.6 Write unit tests for spawn point selection
  - _Requirements: 6.1, 6.2, 6.3_

### Task 7: Implement CombatSystem Coordinator
- [ ] 7.1 Create `frontend/src/game/combat/CombatSystem.ts`
- [ ] 7.2 Integrate all managers (Weapon, Projectile, Health, Respawn)
- [ ] 7.3 Implement updateAim() for mouse/keyboard aiming
- [ ] 7.4 Implement tryFire() to spawn projectiles
- [ ] 7.5 Implement update() with collision detection loop
- [ ] 7.6 Implement checkProjectileCollisions() with circle-circle test
- [ ] 7.7 Implement handleDeath() to trigger respawn flow
- [ ] 7.8 Create `frontend/src/game/combat/index.ts` exports
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.5_

### Task 8: Checkpoint - Combat Logic Works Locally
- [ ] 8.1 Projectiles spawn and travel correctly
- [ ] 8.2 Fire rate limiting works
- [ ] 8.3 Projectiles destroyed at max range
- [ ] 8.4 Projectiles destroyed on barrier collision
- [ ] 8.5 Damage applies correctly
- [ ] 8.6 Death triggers respawn timer
- [ ] 8.7 All unit tests pass

---

## Phase 3: Combat Rendering

### Task 9: Add Combat Colors
- [ ] 9.1 Update `frontend/src/game/config/colors.ts`
- [ ] 9.2 Add projectile color (#00ffff cyan)
- [ ] 9.3 Add health bar colors (high/med/low)
- [ ] 9.4 Add shield color (#00d4ff)
- [ ] 9.5 Add invulnerability color (#ffffff with pulse)
  - _Requirements: 5.1, 5.2, 5.3_

### Task 10: Implement ProjectileRenderer
- [ ] 10.1 Create `frontend/src/game/renderers/ProjectileRenderer.ts`
- [ ] 10.2 Extend BaseRenderer
- [ ] 10.3 Implement trail tracking with fade
- [ ] 10.4 Implement renderTrail() with glow effect
- [ ] 10.5 Implement renderProjectile() with core and glow
- [ ] 10.6 Export from renderers index
  - _Requirements: 5.6, 1.3_

### Task 11: Implement HealthBarRenderer
- [ ] 11.1 Create `frontend/src/game/renderers/HealthBarRenderer.ts`
- [ ] 11.2 Extend BaseRenderer
- [ ] 11.3 Implement renderHealthBar() above player sprite
- [ ] 11.4 Implement shield bar rendering
- [ ] 11.5 Implement invulnerability indicator
- [ ] 11.6 Implement getHealthColor() for damage states
- [ ] 11.7 Export from renderers index
  - _Requirements: 4.5, 4.6, 6.3_

### Task 12: Implement Aim Indicator
- [ ] 12.1 Update PlayerRenderer to show aim direction
- [ ] 12.2 Draw line or arrow from player in aim direction
- [ ] 12.3 Only show for local player
- [ ] 12.4 Style with player color and transparency
  - _Requirements: 2.4_

### Task 13: Checkpoint - Combat Renders Correctly
- [ ] 13.1 Projectiles visible with trails
- [ ] 13.2 Health bars show above players
- [ ] 13.3 Shield bar visible when active
- [ ] 13.4 Aim indicator shows direction
- [ ] 13.5 Invulnerability has visual indicator

---

## Phase 4: Input Integration

### Task 14: Add Combat Input Handling
- [ ] 14.1 Update InputSystem to track mouse position
- [ ] 14.2 Add fire button detection (left mouse, spacebar)
- [ ] 14.3 Implement getMousePosition() method
- [ ] 14.4 Implement isFirePressed() method
- [ ] 14.5 Add keyboard-only aim fallback (use movement direction)
  - _Requirements: 2.1, 2.2, 2.3_

### Task 15: Integrate Combat with GameEngine
- [ ] 15.1 Add CombatSystem to GameEngine
- [ ] 15.2 Add ProjectileRenderer and HealthBarRenderer
- [ ] 15.3 Implement initCombat() method
- [ ] 15.4 Add handleMouseMove() for aim updates
- [ ] 15.5 Add handleFire() for shooting
- [ ] 15.6 Update game loop to call combat update
- [ ] 15.7 Update render to draw combat elements
- [ ] 15.8 Add combat callbacks to GameEngineCallbacks
  - _Requirements: 1.1, 2.5, 3.1, 3.2, 3.3_

### Task 16: Update GameArena Component
- [ ] 16.1 Add mouse event listeners to canvas
- [ ] 16.2 Pass mouse position to engine
- [ ] 16.3 Handle fire input
- [ ] 16.4 Add combat event callbacks
  - _Requirements: 1.1, 2.1_

### Task 17: Checkpoint - Can Shoot Locally
- [ ] 17.1 Aiming follows mouse
- [ ] 17.2 Click/spacebar fires projectile
- [ ] 17.3 Fire rate limiting works
- [ ] 17.4 Projectiles travel and despawn
- [ ] 17.5 Can hit opponent (local simulation)

---

## Phase 5: Combat Feedback

### Task 18: Implement Hit Effects
- [x] 18.1 Create hit marker sprite/effect
- [x] 18.2 Show hit marker at impact point
- [x] 18.3 Implement floating damage numbers
- [x] 18.4 Add player flash on damage (red tint 0.1s)
  - _Requirements: 5.2, 5.3, 4.6_

### Task 19: Implement Muzzle Flash
- [x] 19.1 Create muzzle flash effect
- [x] 19.2 Show at projectile spawn point
- [x] 19.3 Brief duration (0.05s)
  - _Requirements: 5.5_

### Task 20: Implement Death/Respawn Effects
- [x] 20.1 Create elimination effect (explosion/fade)
- [x] 20.2 Show respawn countdown UI
- [x] 20.3 Show spawn-in effect
- [x] 20.4 Visual indicator for invulnerability period
  - _Requirements: 5.4, 6.5, 6.6_

### Task 21: Checkpoint - Feedback Feels Good
- [x] 21.1 Hits feel impactful
- [x] 21.2 Damage is clearly communicated
- [x] 21.3 Death/respawn flow is clear
- [x] 21.4 Invulnerability is obvious

---

## Phase 6: WebSocket Integration

### Task 22: Define Combat WebSocket Messages
- [ ] 22.1 Add combat message types to websocket types
- [ ] 22.2 Define FireMessage, HitClaimMessage (client → server)
- [ ] 22.3 Define FireConfirmMessage, OpponentFireMessage (server → client)
- [ ] 22.4 Define HitConfirmMessage, DeathMessage, RespawnMessage
  - _Requirements: 7.1, 8.1_

### Task 23: Extend WebSocket Service
- [ ] 23.1 Add sendCombatFire() method
- [ ] 23.2 Add sendHitClaim() method
- [ ] 23.3 Add handlers for combat events
- [ ] 23.4 Wire events to combat system
  - _Requirements: 7.2, 7.3, 8.2, 8.3_

### Task 24: Implement Client-Side Prediction
- [ ] 24.1 Mark local projectiles as predicted
- [ ] 24.2 Reconcile on server confirmation
- [ ] 24.3 Handle rejected shots gracefully
- [ ] 24.4 Interpolate remote player projectiles
  - _Requirements: 8.1, 8.2, 8.3_

### Task 25: Checkpoint - Multiplayer Combat Works
- [ ] 25.1 Both players can shoot
- [ ] 25.2 Hits register on both clients
- [ ] 25.3 Health syncs correctly
- [ ] 25.4 Death/respawn syncs correctly

---

## Phase 7: Server-Side Implementation

### Task 26: Create Backend Combat Module
- [ ] 26.1 Create `backend/app/combat/__init__.py`
- [ ] 26.2 Create `backend/app/combat/hit_validator.py`
- [ ] 26.3 Implement HitValidator class
- [ ] 26.4 Implement register_projectile() method
- [ ] 26.5 Implement validate_hit() with all checks
- [ ]* 26.6 Write unit tests for hit validation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

### Task 27: Create Damage Calculator
- [ ] 27.1 Create `backend/app/combat/damage_calculator.py`
- [ ] 27.2 Implement apply_damage() with shield logic
- [ ] 27.3 Implement check_death()
- [ ] 27.4 Track authoritative health values
  - _Requirements: 7.5_

### Task 28: Create Respawn Handler
- [ ] 28.1 Create `backend/app/combat/respawn_handler.py`
- [ ] 28.2 Implement select_spawn_point()
- [ ] 28.3 Implement respawn_player()
- [ ] 28.4 Track respawn timers
  - _Requirements: 6.1, 6.2_

### Task 29: Integrate Combat with WebSocket Handler
- [ ] 29.1 Add combat event handlers to websocket router
- [ ] 29.2 Handle combat_fire messages
- [ ] 29.3 Handle combat_hit_claim messages
- [ ] 29.4 Broadcast combat events to both players
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

### Task 30: Checkpoint - Server Authority Works
- [ ] 30.1 Server validates all hits
- [ ] 30.2 Invalid hits are rejected
- [ ] 30.3 Fire rate enforced server-side
- [ ] 30.4 Health is authoritative on server

---

## Phase 8: Audio

### Task 31: Add Combat Sound Effects
- [ ] 31.1 Source/create blaster fire sound
- [ ] 31.2 Source/create hit impact sound
- [ ] 31.3 Source/create elimination sound
- [ ] 31.4 Source/create respawn sound
- [ ] 31.5 Add to asset loading
  - _Requirements: 5.1, 5.2, 5.4_

### Task 32: Integrate Combat Audio
- [ ] 32.1 Play fire sound on shoot
- [ ] 32.2 Play hit sound on damage
- [ ] 32.3 Play elimination sound on death
- [ ] 32.4 Play respawn sound on spawn
  - _Requirements: 5.1, 5.2, 5.4_

### Task 33: Checkpoint - Audio Works
- [ ] 33.1 All combat sounds play correctly
- [ ] 33.2 Sounds don't overlap badly
- [ ] 33.3 Volume is balanced

---

## Phase 9: Polish and Balance

### Task 34: Tune Combat Feel
- [ ] 34.1 Adjust fire rate for good rhythm
- [ ] 34.2 Adjust projectile speed for dodgeability
- [ ] 34.3 Adjust damage for time-to-kill
- [ ] 34.4 Adjust knockback for impact feel
- [ ] 34.5 Adjust respawn time for flow

### Task 35: Add Connection Quality Indicator
- [ ] 35.1 Show ping/latency
- [ ] 35.2 Warn when latency > 200ms
- [ ] 35.3 Show packet loss indicator
  - _Requirements: 8.4_

### Task 36: Final Checkpoint - Combat Complete
- [ ] 36.1 Combat feels responsive
- [ ] 36.2 Hits register fairly
- [ ] 36.3 No obvious exploits
- [ ] 36.4 Works up to 150ms latency
- [ ] 36.5 All tests pass
- [ ] 36.6 Build passes

---

## Quick Reference

### Default Weapon Stats

| Property | Value |
|----------|-------|
| Fire Rate | 3 shots/sec (333ms cooldown) |
| Projectile Speed | 600 units/sec |
| Max Range | 400 units |
| Damage | 25 per shot |
| Spread | ±2° |
| Knockback | 50 units |

### Health Stats

| Property | Value |
|----------|-------|
| Max Health | 100 |
| Max Shield | 50 |
| Shots to Kill | 4 (no shield) |
| Respawn Delay | 3 seconds |
| Invulnerability | 2 seconds |

### Hitbox Sizes

| Element | Radius |
|---------|--------|
| Player Hurtbox | 12px |
| Projectile Hitbox | 4px |
| Combined Hit Radius | 16px |

---

*Total Tasks: 36*
*Estimated Time: 2-3 weeks*
