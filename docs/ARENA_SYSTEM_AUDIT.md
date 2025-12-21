# Arena System Audit Report

## System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ARENA GAME LOOP                                     │
│                         (requestAnimationFrame @ 60fps)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  1. INPUT CAPTURE                                                                │
│  ┌─────────────────┐                                                            │
│  │ InputManager    │ → captureFrame() → InputPacket (movement, look, buttons)   │
│  └─────────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  2. PLAYER PHYSICS                                                               │
│  ┌─────────────────┐                                                            │
│  │ Physics3D       │ → step() → PlayerPhysicsState (position, velocity, grounded)│
│  └─────────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  3. RESPAWN CHECK                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ CombatSystem.update(now)                                                 │    │
│  │   └─ Returns playersReadyToRespawn[] (checks respawnTime vs currentTime) │    │
│  │                                                                          │    │
│  │ BotPlayer.checkRespawn(Date.now())                                       │    │
│  │   └─ Returns true if isDead && respawnTime <= currentTime                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ⚠️  BUG IDENTIFIED: Time base mismatch!                                        │
│      - CombatSystem uses performance.now() (ms since page load)                 │
│      - BotPlayer uses Date.now() (ms since epoch)                               │
│      - These are DIFFERENT time bases!                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  4. PLAYER SHOOTING                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ if (isFiring && pointerLocked && canFire && !isDead)                     │    │
│  │   └─ CombatSystem.processFire() → checks capsule intersection            │    │
│  │   └─ If hit bot: BotMatchManager.onPlayerHitBot(damage)                  │    │
│  │        └─ BotPlayer.applyDamage() → may trigger die()                    │    │
│  │        └─ If bot died: playerScore++                                     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  5. BOT UPDATE                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ BotMatchManager.update(deltaMs, playerPos, playerVel, playerHealth)      │    │
│  │   └─ BotPlayer.update() → AI decision making                             │    │
│  │   └─ Collision detection for bot movement                                │    │
│  │   └─ Line-of-sight check for shooting                                    │    │
│  │                                                                          │    │
│  │ Bot Shooting (in Arena.tsx, NOT in BotMatchManager):                     │    │
│  │   └─ if (gameStarted && botWantsToShoot && canFire && visible && !spawn) │    │
│  │   └─ Random accuracy check → CombatSystem.applyDamage()                  │    │
│  │   └─ If player died: bot.addKill()                                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ⚠️  ISSUE: Duplicate shooting logic!                                           │
│      - BotMatchManager.processBotShot() exists but is NOT used in Arena.tsx     │
│      - Arena.tsx has its own bot shooting logic                                 │
│      - This could cause confusion and maintenance issues                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  6. HUD UPDATE                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ HUDRenderer.update({                                                     │    │
│  │   health: combatState.health,                                            │    │
│  │   score: playerScore,        ← Local variable in game loop               │    │
│  │   opponentScore: botScore,   ← From botManagerRef.getBotScore()          │    │
│  │ })                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  7. STORE SYNC                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ if (playerScore !== lastSyncedPlayerScore || botScore !== lastSyncedBot) │    │
│  │   setScores(playerScore, botScore)  ← Updates Zustand store              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ✅ GOOD: Only syncs when scores change (prevents excessive re-renders)         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Arena.tsx      │     │  BotMatchManager │     │    BotPlayer     │
│   (Game Loop)    │     │                  │     │                  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │  update(deltaMs,...)   │                        │
         │───────────────────────>│                        │
         │                        │  update(deltaMs,ctx)   │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │<───────────────────────│
         │                        │     BotOutput          │
         │<───────────────────────│                        │
         │                        │                        │
         │                        │                        │
         │  onPlayerHitBot(dmg)   │                        │
         │───────────────────────>│                        │
         │                        │  applyDamage(dmg)      │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │  if health <= 0:       │
         │                        │    die() → isDead=true │
         │                        │    respawnTime=Date.now()+3000
         │                        │                        │
         │  getBotState()         │                        │
         │───────────────────────>│  getState()            │
         │                        │───────────────────────>│
         │<───────────────────────│<───────────────────────│
         │   BotPlayerState       │                        │
         │                        │                        │
```

## Score Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PLAYER KILLS BOT                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Player fires → CombatSystem.processFire() → HitResult with targetId=999
2. Arena.tsx checks: wasAlive = !botState.isDead (BEFORE damage)
3. BotMatchManager.onPlayerHitBot(damage)
   └─ BotPlayer.applyDamage(damage)
      └─ health -= damage
      └─ if health <= 0: die() → isDead = true, score NOT incremented here
   └─ if bot.isDead: playerScore++ (in BotMatchManager)
4. Arena.tsx checks: if wasAlive && botState.isDead → playerScore++ (LOCAL VAR)

⚠️  BUG: playerScore is incremented in TWO places!
    - BotMatchManager.onPlayerHitBot() increments this.playerScore
    - Arena.tsx also increments local playerScore variable
    - These are DIFFERENT variables! BotMatchManager.playerScore is never used.

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BOT KILLS PLAYER                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Bot shooting logic in Arena.tsx (NOT BotMatchManager.processBotShot)
2. Arena.tsx checks: wasAlive = !combatState.isDead (BEFORE damage)
3. CombatSystem.applyDamage(LOCAL_PLAYER_ID, BOT_PLAYER_ID, damage, ...)
   └─ health -= damage
   └─ if health <= 0: isDead = true, respawnTime = now + 3000
4. Arena.tsx checks: if wasAlive && combatState.isDead → bot.addKill()
   └─ BotPlayer.score++ (this is the bot's kill count)

✅ CORRECT: Bot score is tracked in BotPlayer.score, accessed via getBotScore()
```

## Respawn Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PLAYER RESPAWN                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

Time Base: performance.now() (milliseconds since page load)

1. Player dies:
   CombatSystem.applyDamage() → health = 0 → isDead = true
   respawnTime = performance.now() + 3000 (3 seconds)

2. Each frame:
   CombatSystem.update(performance.now())
   └─ if isDead && respawnTime && now >= respawnTime → return [playerId]

3. Arena.tsx:
   if playersReadyToRespawn.includes(LOCAL_PLAYER_ID):
     └─ Get new spawn point
     └─ Reset physics state
     └─ CombatSystem.respawnPlayer() → health = 100, isDead = false
     └─ Reset ammo

✅ CORRECT: Uses consistent time base (performance.now())

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BOT RESPAWN                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

Time Base: Date.now() (milliseconds since Unix epoch)

1. Bot dies:
   BotPlayer.die() → isDead = true
   respawnTime = Date.now() + 3000 (3 seconds)

2. Each frame in Arena.tsx:
   bot.checkRespawn(Date.now())
   └─ if isDead && respawnTime && Date.now() >= respawnTime → return true

3. Arena.tsx:
   if bot.checkRespawn(Date.now()):
     └─ Get new spawn point
     └─ bot.respawn(position) → health = 100, isDead = false
     └─ CombatSystem.respawnPlayer(BOT_PLAYER_ID, performance.now())

✅ CORRECT: Bot uses Date.now() consistently for its own respawn
⚠️  NOTE: CombatSystem.respawnPlayer uses performance.now() for invulnerability
          This is fine because invulnerability check also uses performance.now()
```

## Identified Issues (FIXED)

### ✅ FIXED: Duplicate Player Score Tracking

**Problem:** `BotMatchManager.playerScore` was incremented in `onPlayerHitBot()`, but Arena.tsx also incremented its local `playerScore` variable.

**Fix Applied:** Removed score increment from `BotMatchManager.onPlayerHitBot()`. Score tracking is now solely handled in Arena.tsx.

### ✅ FIXED: Duplicate Bot Shooting Logic

**Problem:** `BotMatchManager.processBotShot()` existed and was called from `update()`, but Arena.tsx had its own bot shooting implementation with better line-of-sight checks.

**Fix Applied:** 
- Removed `processBotShot()` method entirely from BotMatchManager
- Removed the call to `processBotShot()` from `update()`
- Bot shooting is now solely handled in Arena.tsx with proper collision detection

### ✅ FIXED: setDebugInfo Called Every Frame

**Problem:** React state update every frame (~60 times/second) could cause performance issues.

**Fix Applied:** Added throttling - debug info now updates every 100ms instead of every frame.

### 🟢 DOCUMENTED: Inconsistent Time Bases (Not a Bug)

**Status:** CombatSystem uses `performance.now()`, BotPlayer uses `Date.now()`. Both are internally consistent within their own systems. This is documented but not a bug since each system uses its time base consistently.

## Test Scenarios

| Scenario | Expected | Status |
|----------|----------|--------|
| Player shoots bot, bot dies | playerScore++ once | ✅ Fixed |
| Bot shoots player, player dies | botScore++ once | ✅ Works |
| Player dies, waits 3 seconds | Auto-respawn | ✅ Works |
| Bot dies, waits 3 seconds | Auto-respawn | ✅ Works |
| Player has spawn protection | Bot can't damage for 2s | ✅ Works |
| Score displays correctly | HUD shows correct scores | ✅ Works |
| Score syncs to store | Zustand updated on change | ✅ Works |
| Debug info performance | Updates throttled to 100ms | ✅ Fixed |

## Conclusion

All identified issues have been fixed:

1. ✅ **Score tracking** - Now handled solely in Arena.tsx, no double-counting
2. ✅ **Bot shooting** - Now handled solely in Arena.tsx with proper LOS checks
3. ✅ **Debug performance** - Throttled to 100ms updates
4. ✅ **Respawn system** - Working correctly with consistent time bases

The arena system is now clean with single responsibility for each feature:
- **Arena.tsx**: Game loop, rendering, player input, bot shooting, score tracking
- **BotMatchManager**: Bot AI state, match timing, visibility checks
- **BotPlayer**: Bot state machine, movement, health tracking
- **CombatSystem**: Damage application, respawn timing, invulnerability
