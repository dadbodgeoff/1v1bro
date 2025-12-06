# Telemetry + Replay System - Implementation Tasks

## Phase 1: Core Telemetry Infrastructure

### Task 1.1: Telemetry Types
- [x] Create `frontend/src/game/telemetry/types.ts`
- [x] Define `TelemetryFrame`, `PlayerSnapshot`, `ProjectileSnapshot`
- [x] Define `CombatEvent` union type with all event variants
- [x] Define `NetworkStats` interface
- [x] Define `DeathReplay` interface
- [x] Export all types

### Task 1.2: TelemetryRecorder
- [x] Create `frontend/src/game/telemetry/TelemetryRecorder.ts`
- [x] Implement ring buffer with configurable size (default 600 frames)
- [x] Implement `captureFrame()` method
- [x] Implement `snapshotPlayers()` helper
- [x] Implement `snapshotProjectiles()` helper
- [x] Implement `extractDeathReplay()` method
- [x] Implement `updateNetworkStats()` method
- [x] Implement `reset()` method
- [x] Add unit tests for ring buffer behavior

### Task 1.3: GameEngine Integration
- [x] Add TelemetryRecorder instance to GameEngine
- [x] Call `captureFrame()` in update loop
- [x] Pass player states, projectiles, and combat events
- [x] Wire up network stats from WebSocket

## Phase 2: Replay Playback

### Task 2.1: ReplayPlayer
- [x] Create `frontend/src/game/telemetry/ReplayPlayer.ts`
- [x] Implement `load()` method
- [x] Implement `play()`, `pause()`, `setSpeed()` methods
- [x] Implement `seekToFrame()` and `seekToTime()` methods
- [x] Implement `update()` method with frame timing
- [x] Add callbacks: `onFrameChange`, `onPlaybackEnd`
- [x] Add unit tests for playback timing

### Task 2.2: ReplayRenderer
- [x] Create `frontend/src/game/telemetry/ReplayRenderer.ts`
- [x] Implement `renderFrame()` method
- [x] Implement player rendering with victim/killer highlighting
- [x] Implement projectile rendering with trails
- [x] Implement hitbox overlay (toggle)
- [x] Implement latency overlay (toggle)
- [x] Implement trail history tracking
- [x] Add health bar rendering

### Task 2.3: Telemetry Module Index
- [x] Create `frontend/src/game/telemetry/index.ts`
- [x] Export TelemetryRecorder, ReplayPlayer, ReplayRenderer
- [x] Export all types

## Phase 3: Backend Storage

### Task 3.1: Database Migration
- [x] Create `backend/app/database/migrations/004_death_replays.sql`
- [x] Create `death_replays` table with all columns
- [x] Add indexes for expiry, victim, killer, lobby
- [x] Add RLS policies for player access
- [ ] Test migration up/down

### Task 3.2: Replay Service
- [x] Create `backend/app/telemetry/__init__.py`
- [x] Create `backend/app/telemetry/schemas.py` with Pydantic models
- [x] Create `backend/app/telemetry/replay_service.py`
- [x] Implement `store_replay()` with compression
- [x] Implement `get_replay()` with decompression
- [x] Implement `flag_replay()` method
- [x] Implement `get_player_replays()` method
- [x] Implement `cleanup_expired()` method
- [x] Add unit tests for compression/decompression

### Task 3.3: WebSocket Events
- [x] Add `telemetry_upload_replay` handler (via wsService.sendDeathReplay)
- [x] Add `telemetry_flag_death` handler (via wsService.flagDeath)
- [x] Add `telemetry_replay_stored` response
- [ ] Add `telemetry_network_stats` periodic broadcast
- [x] Wire up to existing WebSocket manager

## Phase 4: UI Components

### Task 4.1: DeathReplayModal
- [x] Create `frontend/src/components/replay/DeathReplayModal.tsx`
- [x] Add canvas for replay rendering
- [x] Add timeline scrubber
- [x] Add play/pause controls
- [x] Add speed control (0.25x, 0.5x, 1x, 2x)
- [x] Add hitbox toggle
- [x] Add latency overlay toggle
- [x] Style with Tailwind

### Task 4.2: ReportDeathButton
- [x] Create `frontend/src/components/replay/ReportDeathButton.tsx` (integrated into DeathReplayModal)
- [x] Add report form with reason textarea
- [x] Add submit/cancel buttons
- [x] Wire up to flag_replay WebSocket event
- [x] Show confirmation toast on submit

### Task 4.3: LatencyGraph
- [x] Create `frontend/src/components/replay/LatencyGraph.tsx`
- [x] Render RTT over time from replay frames
- [x] Color-code by latency threshold
- [x] Show current frame marker
- [x] Add hover tooltip with exact values

### Task 4.4: Integration with Death Screen
- [x] Add "Watch Replay" button to respawn overlay
- [x] Store latest death replay in game state
- [x] Open DeathReplayModal on button click
- [x] Auto-dismiss modal on respawn (modal closes on user action)

## Phase 5: CombatSystem Integration

### Task 5.1: Event Tracking
- [x] Add `eventsThisTick` array to CombatSystem (via GameEngine telemetryEvents)
- [x] Record hit events with full context
- [x] Record death events with health/damage info
- [x] Add `getEventsThisTick()` method (via GameEngine)
- [x] Add `hasDeathThisTick()` and `getLastDeath()` methods (via GameEngine callbacks)

### Task 5.2: Network Stats Tracking
- [x] Add RTT measurement to WebSocket service (existing ping/pong)
- [ ] Calculate jitter from RTT variance
- [ ] Track client/server tick alignment
- [x] Expose stats to TelemetryRecorder

### Task 5.3: Death Flow Integration
- [x] On death, call `extractDeathReplay()`
- [x] Upload replay via WebSocket
- [x] Store replay ID for "Watch Replay" button
- [ ] Handle upload confirmation

## Phase 6: Developer Tools

### Task 6.1: Debug Console (Optional)
- [ ] Create admin-only replay browser
- [ ] Add frame-by-frame stepping
- [ ] Add JSON export button
- [ ] Add flagged replay filter
- [ ] Add search by player/lobby

### Task 6.2: Cleanup Job
- [ ] Create cleanup script/endpoint
- [ ] Schedule hourly via cron or serverless
- [ ] Log cleanup stats
- [ ] Alert on high flagged replay count

## Testing Checklist

- [x] Unit: TelemetryRecorder ring buffer overflow
- [x] Unit: ReplayPlayer seek accuracy
- [x] Unit: Compression/decompression roundtrip
- [ ] Integration: Death → replay → upload → retrieve
- [x] Performance: <50KB replay size (verified via compression tests)
- [x] E2E: Full combat sequence with death replay
- [x] E2E: Network stats tracking through replay
- [x] E2E: Projectile tracking through combat
- [x] E2E: Player state transitions (alive → dead → respawning)
- [x] E2E: Replay player edge cases (speed, seek, callbacks)
- [ ] E2E: Report death and verify flag persists
