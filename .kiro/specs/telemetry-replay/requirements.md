# Telemetry + Replay System - Requirements

## Problem Statement

When players die in combat, they often feel like "that was BS" but have no way to verify what actually happened. Network latency, client prediction mismatches, and fast-paced action make it hard to understand why a death occurred. We need a system to capture, store, and replay combat moments for debugging and player satisfaction.

## Goals

1. **Death Replay** - Let players watch the last 5-10 seconds before their death from both perspectives
2. **Telemetry Capture** - Record all combat-relevant events with precise timestamps
3. **Debug Tooling** - Provide developers with tools to analyze "felt unfair" reports
4. **Minimal Overhead** - Don't impact game performance or significantly increase bandwidth

## User Stories

### US-1: Death Replay Viewer
As a player who just died, I want to see a replay of what happened so I can understand if it was lag, a fair hit, or something buggy.

**Acceptance Criteria:**
- After death, player can click "Watch Replay" during respawn timer
- Replay shows last 5 seconds before death
- Can toggle between "my view" and "opponent view"
- Shows position trails, projectile paths, and hit markers
- Displays latency/tick info overlay (optional toggle)

### US-2: Combat Event Logging
As a developer, I want all combat events logged with full context so I can debug player complaints.

**Acceptance Criteria:**
- Every projectile spawn, hit, and despawn is logged
- Every position update is logged (sampled at tick rate)
- Every damage event includes: positions, health states, timestamps, latencies
- Logs are queryable by lobby_id, player_id, or time range
- Retention: 24 hours for all games, 7 days for flagged games

### US-3: "Report BS Death" Button
As a player, I want to flag a death as suspicious so developers can investigate.

**Acceptance Criteria:**
- Button appears on death screen: "Report This Death"
- Flagged deaths are retained longer (7 days)
- Includes automatic context: replay data, latency stats, client/server state diff
- Optional text field for player description

### US-4: Latency Visualization
As a player, I want to see network conditions during replay so I can understand if lag caused my death.

**Acceptance Criteria:**
- Replay shows RTT (round-trip time) graph
- Shows server tick vs client tick alignment
- Highlights moments of high latency or packet loss
- Color-coded: green (<50ms), yellow (50-100ms), red (>100ms)

### US-5: Developer Debug Console
As a developer, I want a debug view to step through combat frame-by-frame.

**Acceptance Criteria:**
- Accessible via admin panel or dev tools
- Can scrub through timeline
- Shows all entity positions at each tick
- Shows projectile trajectories and collision boxes
- Shows client prediction vs server state diff
- Can export replay data as JSON

## Non-Functional Requirements

### Performance
- Telemetry capture must add <1ms per frame
- Replay data size: <50KB per death event (5 second window)
- Client-side ring buffer: last 10 seconds always in memory

### Storage
- Backend stores compressed replay chunks
- Auto-cleanup after retention period
- Flagged replays exempt from auto-cleanup for 7 days

### Privacy
- Replay data only accessible to participants and admins
- No PII in telemetry (only player_ids, positions, game state)

## Out of Scope (v1)

- Full game replay (only death moments)
- Spectator mode integration
- Video export
- Cross-match replay comparison
- Machine learning for cheat detection
