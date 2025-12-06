# PvP Combat System - Requirements Document

## Introduction

This document defines the requirements for implementing a projectile-based PvP combat system for the 1v1 Bro arena game. The system adds real-time shooting mechanics to the existing trivia battle, allowing players to engage in combat during the exploration phase between questions.

The combat system is designed to be server-authoritative to prevent cheating, with client-side prediction for responsive gameplay. It integrates with the existing neon cyberpunk aesthetic and chibi pilot sprites.

## Glossary

- **Projectile**: A fired shot that travels across the arena and can damage players
- **Hitbox**: The collision area of a projectile used to detect hits
- **Hurtbox**: The collision area of a player that can receive damage
- **Health Pool**: The total damage a player can absorb before being eliminated
- **Shield**: Temporary damage absorption that depletes before health
- **Fire Rate**: How many shots per second a weapon can fire
- **Spread**: Random deviation in projectile direction for balance
- **Knockback**: Brief movement impulse applied when hit
- **Respawn**: Process of returning to play after elimination
- **Client-Side Prediction**: Local simulation of actions before server confirmation
- **Server Reconciliation**: Correcting client state when server disagrees
- **Hit Validation**: Server verification that a claimed hit actually occurred

---

## Requirements

### Requirement 1: Projectile Weapon System

**User Story:** As a player, I want to fire projectiles at my opponent, so that I can engage in combat during exploration phases.

#### Acceptance Criteria

1. WHEN a player presses the fire button (left mouse / spacebar) THEN the System SHALL spawn a projectile traveling in the aim direction
2. WHEN firing THEN the System SHALL enforce a minimum interval between shots based on fire rate (default: 3 shots/second)
3. WHEN a projectile spawns THEN the System SHALL position it at the player's sprite center offset by facing direction
4. WHEN a projectile travels THEN the System SHALL move it at constant velocity (default: 600 units/second)
5. WHEN a projectile exceeds max range (default: 400 units) THEN the System SHALL destroy it
6. WHEN a projectile collides with a barrier THEN the System SHALL destroy it with a visual effect

---

### Requirement 2: Aiming System

**User Story:** As a player, I want to aim my shots precisely, so that combat feels skill-based.

#### Acceptance Criteria

1. WHEN using mouse input THEN the System SHALL aim toward the cursor position relative to the player
2. WHEN using keyboard only THEN the System SHALL aim in the current movement direction
3. WHEN the player is stationary with keyboard THEN the System SHALL maintain the last aim direction
4. WHEN rendering the player THEN the System SHALL display an aim indicator showing fire direction
5. WHEN aiming THEN the System SHALL update aim direction at 60Hz for responsive feel

---

### Requirement 3: Hitbox and Hurtbox System

**User Story:** As a player, I want fair and consistent hit detection, so that combat outcomes feel earned.

#### Acceptance Criteria

1. THE System SHALL define player hurtboxes as circles centered on sprite position with radius 12px
2. THE System SHALL define projectile hitboxes as circles with radius 4px
3. WHEN checking collisions THEN the System SHALL use circle-circle intersection tests
4. WHEN a projectile moves fast THEN the System SHALL use swept collision (raycast) to prevent tunneling
5. THE System SHALL NOT allow players to hit themselves with their own projectiles
6. WHEN a hit occurs THEN the System SHALL register it on the server before applying damage

---

### Requirement 4: Health and Damage System

**User Story:** As a player, I want to see my health status clearly, so that I can make tactical decisions.

#### Acceptance Criteria

1. THE System SHALL give each player 100 health points at match start
2. WHEN a projectile hits a player THEN the System SHALL deal damage (default: 25 per shot)
3. WHEN a player has a shield power-up active THEN the System SHALL absorb damage to shield first
4. WHEN health reaches zero THEN the System SHALL trigger player elimination
5. WHEN displaying health THEN the System SHALL show a health bar above each player sprite
6. WHEN taking damage THEN the System SHALL flash the player sprite red briefly (0.1s)

---

### Requirement 5: Combat Feedback

**User Story:** As a player, I want clear visual and audio feedback, so that I know when I hit or get hit.

#### Acceptance Criteria

1. WHEN a projectile is fired THEN the System SHALL play a blaster sound effect
2. WHEN a projectile hits a player THEN the System SHALL display a hit marker at impact point
3. WHEN a player takes damage THEN the System SHALL show floating damage numbers
4. WHEN a player is eliminated THEN the System SHALL play an elimination effect and sound
5. WHEN firing THEN the System SHALL display muzzle flash at projectile spawn point
6. WHEN a projectile travels THEN the System SHALL render a glowing trail effect

---

### Requirement 6: Respawn System

**User Story:** As a player, I want to respawn after elimination, so that combat doesn't end the match prematurely.

#### Acceptance Criteria

1. WHEN a player is eliminated THEN the System SHALL start a respawn timer (default: 3 seconds)
2. WHEN respawning THEN the System SHALL choose a spawn point far from the opponent
3. WHEN respawning THEN the System SHALL grant 2 seconds of invulnerability (visual indicator)
4. WHEN a player respawns THEN the System SHALL restore full health
5. THE System SHALL NOT allow eliminated players to move or fire during respawn timer
6. WHEN displaying respawn THEN the System SHALL show countdown timer to the eliminated player

---

### Requirement 7: Server Authority

**User Story:** As a competitive player, I want the game to be cheat-resistant, so that matches are fair.

#### Acceptance Criteria

1. THE Server SHALL validate all hit claims before applying damage
2. THE Server SHALL enforce fire rate limits regardless of client input
3. THE Server SHALL reject projectile spawns from invalid positions
4. WHEN client and server state conflict THEN the System SHALL reconcile to server state
5. THE Server SHALL track authoritative health values for all players
6. WHEN a client claims a hit THEN the Server SHALL verify projectile trajectory and timing

---

### Requirement 8: Network Synchronization

**User Story:** As a player on varying network conditions, I want smooth gameplay, so that latency doesn't ruin the experience.

#### Acceptance Criteria

1. WHEN firing locally THEN the System SHALL immediately spawn a predicted projectile
2. WHEN the server confirms a shot THEN the System SHALL reconcile predicted projectile state
3. WHEN rendering remote player shots THEN the System SHALL interpolate projectile positions
4. WHEN latency exceeds 200ms THEN the System SHALL display a connection warning
5. THE System SHALL send projectile updates at 20Hz to minimize bandwidth
6. WHEN a hit is confirmed THEN the System SHALL apply damage within 100ms of server message

---

## Weapon Configuration (Default Values)

| Property | Value | Rationale |
|----------|-------|-----------|
| Fire Rate | 3 shots/sec | Fast enough for action, slow enough for skill |
| Projectile Speed | 600 units/sec | Dodgeable at range, hard to dodge up close |
| Max Range | 400 units | ~1/3 arena width, encourages positioning |
| Damage | 25 per shot | 4 shots to kill, rewards accuracy |
| Spread | ±2° | Slight randomness, mostly skill-based |
| Knockback | 50 units | Noticeable but not disruptive |

---

## Out of Scope (Future Phases)

- Multiple weapon types
- Weapon pickups
- Ammunition / reload mechanics
- Melee attacks
- Area-of-effect weapons
- Destructible environment

---

## Success Metrics

1. **Hit Registration**: >95% of valid hits register correctly
2. **Latency Tolerance**: Playable up to 150ms ping
3. **Fairness**: No exploitable cheats in first month
4. **Feel**: Combat feels responsive (<50ms input-to-visual)

---

*Document Version: 1.0*
*Created: December 2024*
