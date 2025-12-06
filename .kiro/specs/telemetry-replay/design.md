# Telemetry + Replay System - Design Document

## Overview

This system captures combat telemetry in real-time and enables death replay for debugging "BS deaths". It uses a client-side ring buffer for immediate replay and server-side storage for flagged incidents.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Telemetry Pipeline                                 │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Client     │    │   Server     │    │   Storage    │                   │
│  │  Ring Buffer │───▶│  Aggregator  │───▶│  (Postgres)  │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                                                │
│         ▼                   ▼                                                │
│  ┌──────────────┐    ┌──────────────┐                                       │
│  │   Replay     │    │    Debug     │                                       │
│  │   Viewer     │    │   Console    │                                       │
│  └──────────────┘    └──────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Structures

### TelemetryFrame (captured every tick, ~60fps)

```typescript
interface TelemetryFrame {
  tick: number                    // Server tick number
  timestamp: number               // Unix ms
  players: PlayerSnapshot[]
  projectiles: ProjectileSnapshot[]
  events: CombatEvent[]
  networkStats: NetworkStats
}

interface PlayerSnapshot {
  playerId: string
  position: Vector2
  velocity: Vector2
  health: number
  shield: number
  isInvulnerable: boolean
  aimDirection: Vector2
  state: 'alive' | 'dead' | 'respawning'
}

interface ProjectileSnapshot {
  id: string
  ownerId: string
  position: Vector2
  velocity: Vector2
  spawnTick: number
}

interface CombatEvent {
  type: 'fire' | 'hit' | 'damage' | 'death' | 'respawn'
  tick: number
  timestamp: number
  data: FireEventData | HitEventData | DamageEventData | DeathEventData
}

interface HitEventData {
  projectileId: string
  shooterId: string
  targetId: string
  hitPosition: Vector2
  targetPosition: Vector2       // Where server thought target was
  clientTargetPosition: Vector2 // Where client thought target was
  damage: number
  latencyMs: number
}

interface DeathEventData {
  playerId: string
  killerId: string
  finalHitPosition: Vector2
  healthBeforeHit: number
  damageDealt: number
}

interface NetworkStats {
  clientTick: number
  serverTick: number
  rttMs: number
  jitterMs: number
  packetLoss: number  // 0-1
}
```

### DeathReplay (stored on death)

```typescript
interface DeathReplay {
  id: string                      // UUID
  lobbyId: string
  victimId: string
  killerId: string
  deathTick: number
  deathTimestamp: number
  frames: TelemetryFrame[]        // Last 300 frames (~5 seconds at 60fps)
  flagged: boolean
  flagReason?: string
  createdAt: number
  expiresAt: number               // Auto-cleanup timestamp
}
```

## Project Structure

```
frontend/src/game/
├── telemetry/
│   ├── index.ts
│   ├── TelemetryRecorder.ts      # Ring buffer, frame capture
│   ├── ReplayPlayer.ts           # Playback controller
│   ├── ReplayRenderer.ts         # Render replay frames
│   └── types.ts                  # Telemetry types
├── components/
│   └── replay/
│       ├── DeathReplayModal.tsx  # Post-death replay viewer
│       ├── ReplayControls.tsx    # Play/pause/scrub
│       ├── LatencyGraph.tsx      # Network visualization
│       └── ReportDeathButton.tsx # Flag suspicious death

backend/app/
├── telemetry/
│   ├── __init__.py
│   ├── replay_service.py         # Store/retrieve replays
│   ├── telemetry_aggregator.py   # Process incoming telemetry
│   └── schemas.py                # Pydantic models
├── database/
│   └── migrations/
│       └── 00X_death_replays.sql # Replay storage table
```

## Core Components

### TelemetryRecorder (Client)

```typescript
/**
 * Client-side telemetry recorder using a ring buffer.
 * Captures last N seconds of gameplay for instant replay.
 */
export class TelemetryRecorder {
  private buffer: TelemetryFrame[] = []
  private readonly MAX_FRAMES = 600  // 10 seconds at 60fps
  private currentTick = 0
  private networkStats: NetworkStats = { /* defaults */ }

  /**
   * Called every game tick to capture current state
   */
  captureFrame(
    players: Map<string, PlayerState>,
    projectiles: Projectile[],
    events: CombatEvent[]
  ): void {
    const frame: TelemetryFrame = {
      tick: this.currentTick++,
      timestamp: Date.now(),
      players: this.snapshotPlayers(players),
      projectiles: this.snapshotProjectiles(projectiles),
      events: [...events],  // Copy events from this tick
      networkStats: { ...this.networkStats },
    }

    // Ring buffer: overwrite oldest when full
    if (this.buffer.length >= this.MAX_FRAMES) {
      this.buffer.shift()
    }
    this.buffer.push(frame)
  }

  /**
   * Extract replay data for a death event
   * Returns last 5 seconds (300 frames) before death
   */
  extractDeathReplay(
    victimId: string,
    killerId: string,
    deathTick: number
  ): DeathReplay {
    const REPLAY_FRAMES = 300  // 5 seconds
    const startIndex = Math.max(0, this.buffer.length - REPLAY_FRAMES)
    const frames = this.buffer.slice(startIndex)

    return {
      id: crypto.randomUUID(),
      lobbyId: this.lobbyId,
      victimId,
      killerId,
      deathTick,
      deathTimestamp: Date.now(),
      frames,
      flagged: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,  // 24 hours
    }
  }

  updateNetworkStats(stats: Partial<NetworkStats>): void {
    Object.assign(this.networkStats, stats)
  }

  reset(): void {
    this.buffer = []
    this.currentTick = 0
  }
}
```

### ReplayPlayer (Client)

```typescript
/**
 * Controls replay playback with scrubbing and speed control.
 */
export class ReplayPlayer {
  private replay: DeathReplay | null = null
  private currentFrameIndex = 0
  private isPlaying = false
  private playbackSpeed = 1.0
  private lastUpdateTime = 0

  // Callbacks for UI updates
  onFrameChange?: (frame: TelemetryFrame, index: number, total: number) => void
  onPlaybackEnd?: () => void

  load(replay: DeathReplay): void {
    this.replay = replay
    this.currentFrameIndex = 0
    this.isPlaying = false
  }

  play(): void {
    this.isPlaying = true
    this.lastUpdateTime = Date.now()
  }

  pause(): void {
    this.isPlaying = false
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(2.0, speed))
  }

  seekToFrame(index: number): void {
    if (!this.replay) return
    this.currentFrameIndex = Math.max(0, Math.min(index, this.replay.frames.length - 1))
    this.emitFrame()
  }

  seekToTime(timestamp: number): void {
    if (!this.replay) return
    const frame = this.replay.frames.find(f => f.timestamp >= timestamp)
    if (frame) {
      this.currentFrameIndex = this.replay.frames.indexOf(frame)
      this.emitFrame()
    }
  }

  update(): void {
    if (!this.isPlaying || !this.replay) return

    const now = Date.now()
    const elapsed = (now - this.lastUpdateTime) * this.playbackSpeed
    const frameTime = 1000 / 60  // 60fps

    if (elapsed >= frameTime) {
      this.currentFrameIndex++
      this.lastUpdateTime = now

      if (this.currentFrameIndex >= this.replay.frames.length) {
        this.isPlaying = false
        this.onPlaybackEnd?.()
      } else {
        this.emitFrame()
      }
    }
  }

  getCurrentFrame(): TelemetryFrame | null {
    return this.replay?.frames[this.currentFrameIndex] ?? null
  }

  private emitFrame(): void {
    if (!this.replay) return
    const frame = this.replay.frames[this.currentFrameIndex]
    this.onFrameChange?.(frame, this.currentFrameIndex, this.replay.frames.length)
  }
}
```

### ReplayRenderer (Client)

```typescript
/**
 * Renders replay frames with debug overlays.
 */
export class ReplayRenderer {
  private ctx: CanvasRenderingContext2D
  private showHitboxes = false
  private showTrails = true
  private showLatencyOverlay = false
  private viewPerspective: 'victim' | 'killer' | 'overhead' = 'overhead'

  // Trail history for smooth visualization
  private playerTrails: Map<string, Vector2[]> = new Map()
  private projectileTrails: Map<string, Vector2[]> = new Map()

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }

  renderFrame(frame: TelemetryFrame, victimId: string, killerId: string): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    // Update trails
    this.updateTrails(frame)

    // Render layers
    this.renderArenaBackground()
    if (this.showTrails) this.renderTrails()
    this.renderProjectiles(frame.projectiles)
    this.renderPlayers(frame.players, victimId, killerId)
    if (this.showHitboxes) this.renderHitboxes(frame)
    this.renderCombatEvents(frame.events)
    if (this.showLatencyOverlay) this.renderLatencyOverlay(frame.networkStats)
  }

  private renderPlayers(
    players: PlayerSnapshot[],
    victimId: string,
    killerId: string
  ): void {
    for (const player of players) {
      const isVictim = player.playerId === victimId
      const isKiller = player.playerId === killerId

      // Player circle
      this.ctx.beginPath()
      this.ctx.arc(player.position.x, player.position.y, 16, 0, Math.PI * 2)
      this.ctx.fillStyle = isVictim ? '#ff4444' : isKiller ? '#44ff44' : '#4444ff'
      this.ctx.fill()

      // Aim direction indicator
      const aimEnd = {
        x: player.position.x + player.aimDirection.x * 30,
        y: player.position.y + player.aimDirection.y * 30,
      }
      this.ctx.beginPath()
      this.ctx.moveTo(player.position.x, player.position.y)
      this.ctx.lineTo(aimEnd.x, aimEnd.y)
      this.ctx.strokeStyle = '#ffffff'
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      // Health bar
      this.renderHealthBar(player)

      // Label
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '10px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(
        isVictim ? 'VICTIM' : isKiller ? 'KILLER' : player.playerId.slice(0, 6),
        player.position.x,
        player.position.y - 25
      )
    }
  }

  private renderHitboxes(frame: TelemetryFrame): void {
    // Player hurtboxes
    for (const player of frame.players) {
      this.ctx.beginPath()
      this.ctx.arc(player.position.x, player.position.y, 12, 0, Math.PI * 2)
      this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
      this.ctx.lineWidth = 1
      this.ctx.stroke()
    }

    // Projectile hitboxes
    for (const proj of frame.projectiles) {
      this.ctx.beginPath()
      this.ctx.arc(proj.position.x, proj.position.y, 4, 0, Math.PI * 2)
      this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'
      this.ctx.stroke()
    }
  }

  private renderLatencyOverlay(stats: NetworkStats): void {
    const x = 10
    const y = this.ctx.canvas.height - 80

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(x, y, 150, 70)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'

    const rttColor = stats.rttMs < 50 ? '#44ff44' : stats.rttMs < 100 ? '#ffff44' : '#ff4444'

    this.ctx.fillText(`RTT: `, x + 5, y + 15)
    this.ctx.fillStyle = rttColor
    this.ctx.fillText(`${stats.rttMs}ms`, x + 40, y + 15)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`Jitter: ${stats.jitterMs}ms`, x + 5, y + 30)
    this.ctx.fillText(`Client Tick: ${stats.clientTick}`, x + 5, y + 45)
    this.ctx.fillText(`Server Tick: ${stats.serverTick}`, x + 5, y + 60)
  }

  setShowHitboxes(show: boolean): void { this.showHitboxes = show }
  setShowTrails(show: boolean): void { this.showTrails = show }
  setShowLatencyOverlay(show: boolean): void { this.showLatencyOverlay = show }
}
```

## Backend Components

### Database Schema

```sql
-- 00X_death_replays.sql

CREATE TABLE death_replays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL REFERENCES lobbies(id),
    victim_id UUID NOT NULL REFERENCES users(id),
    killer_id UUID NOT NULL REFERENCES users(id),
    death_tick INTEGER NOT NULL,
    death_timestamp TIMESTAMPTZ NOT NULL,
    
    -- Compressed replay data (JSONB, typically 20-50KB)
    frames JSONB NOT NULL,
    
    -- Flagging
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    flagged_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Indexes
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for cleanup job
CREATE INDEX idx_death_replays_expires ON death_replays(expires_at) WHERE NOT flagged;

-- Index for player lookup
CREATE INDEX idx_death_replays_victim ON death_replays(victim_id, created_at DESC);
CREATE INDEX idx_death_replays_killer ON death_replays(killer_id, created_at DESC);

-- Index for lobby lookup
CREATE INDEX idx_death_replays_lobby ON death_replays(lobby_id);

-- RLS policies
ALTER TABLE death_replays ENABLE ROW LEVEL SECURITY;

-- Players can view replays they're involved in
CREATE POLICY "Players can view own replays"
    ON death_replays FOR SELECT
    USING (auth.uid() = victim_id OR auth.uid() = killer_id);

-- Players can flag their own deaths
CREATE POLICY "Players can flag own deaths"
    ON death_replays FOR UPDATE
    USING (auth.uid() = victim_id)
    WITH CHECK (auth.uid() = victim_id);
```

### ReplayService (Backend)

```python
# backend/app/telemetry/replay_service.py

from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID
import json
import zlib

from pydantic import BaseModel
from supabase import Client


class DeathReplayCreate(BaseModel):
    lobby_id: UUID
    victim_id: UUID
    killer_id: UUID
    death_tick: int
    death_timestamp: datetime
    frames: list  # Will be compressed


class DeathReplayResponse(BaseModel):
    id: UUID
    lobby_id: UUID
    victim_id: UUID
    killer_id: UUID
    death_tick: int
    death_timestamp: datetime
    frames: list
    flagged: bool
    flag_reason: Optional[str]
    created_at: datetime


class ReplayService:
    """Service for storing and retrieving death replays."""

    RETENTION_HOURS = 24
    FLAGGED_RETENTION_DAYS = 7

    def __init__(self, client: Client):
        self.client = client

    async def store_replay(self, replay: DeathReplayCreate) -> UUID:
        """
        Store a death replay with compression.
        Returns the replay ID.
        """
        # Compress frames to reduce storage
        frames_json = json.dumps(replay.frames)
        compressed = zlib.compress(frames_json.encode(), level=6)
        
        # Store as base64 in JSONB (or use bytea column)
        import base64
        frames_b64 = base64.b64encode(compressed).decode()

        expires_at = datetime.utcnow() + timedelta(hours=self.RETENTION_HOURS)

        result = self.client.table("death_replays").insert({
            "lobby_id": str(replay.lobby_id),
            "victim_id": str(replay.victim_id),
            "killer_id": str(replay.killer_id),
            "death_tick": replay.death_tick,
            "death_timestamp": replay.death_timestamp.isoformat(),
            "frames": {"compressed": frames_b64},
            "expires_at": expires_at.isoformat(),
        }).execute()

        return UUID(result.data[0]["id"])

    async def get_replay(self, replay_id: UUID) -> Optional[DeathReplayResponse]:
        """Retrieve and decompress a replay."""
        result = self.client.table("death_replays")\
            .select("*")\
            .eq("id", str(replay_id))\
            .single()\
            .execute()

        if not result.data:
            return None

        # Decompress frames
        import base64
        frames_b64 = result.data["frames"]["compressed"]
        compressed = base64.b64decode(frames_b64)
        frames_json = zlib.decompress(compressed).decode()
        frames = json.loads(frames_json)

        return DeathReplayResponse(
            id=result.data["id"],
            lobby_id=result.data["lobby_id"],
            victim_id=result.data["victim_id"],
            killer_id=result.data["killer_id"],
            death_tick=result.data["death_tick"],
            death_timestamp=result.data["death_timestamp"],
            frames=frames,
            flagged=result.data["flagged"],
            flag_reason=result.data.get("flag_reason"),
            created_at=result.data["created_at"],
        )

    async def flag_replay(
        self,
        replay_id: UUID,
        reason: str,
        user_id: UUID
    ) -> bool:
        """
        Flag a replay for extended retention.
        Only the victim can flag their own death.
        """
        # Extend expiry to 7 days
        new_expiry = datetime.utcnow() + timedelta(days=self.FLAGGED_RETENTION_DAYS)

        result = self.client.table("death_replays")\
            .update({
                "flagged": True,
                "flag_reason": reason,
                "flagged_at": datetime.utcnow().isoformat(),
                "expires_at": new_expiry.isoformat(),
            })\
            .eq("id", str(replay_id))\
            .eq("victim_id", str(user_id))\
            .execute()

        return len(result.data) > 0

    async def get_player_replays(
        self,
        player_id: UUID,
        limit: int = 10
    ) -> List[DeathReplayResponse]:
        """Get recent replays for a player (as victim or killer)."""
        result = self.client.table("death_replays")\
            .select("*")\
            .or_(f"victim_id.eq.{player_id},killer_id.eq.{player_id}")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        replays = []
        for row in result.data:
            # Decompress each replay
            import base64
            frames_b64 = row["frames"]["compressed"]
            compressed = base64.b64decode(frames_b64)
            frames_json = zlib.decompress(compressed).decode()
            frames = json.loads(frames_json)

            replays.append(DeathReplayResponse(
                id=row["id"],
                lobby_id=row["lobby_id"],
                victim_id=row["victim_id"],
                killer_id=row["killer_id"],
                death_tick=row["death_tick"],
                death_timestamp=row["death_timestamp"],
                frames=frames,
                flagged=row["flagged"],
                flag_reason=row.get("flag_reason"),
                created_at=row["created_at"],
            ))

        return replays

    async def cleanup_expired(self) -> int:
        """
        Delete expired replays (called by cron job).
        Returns count of deleted replays.
        """
        result = self.client.table("death_replays")\
            .delete()\
            .lt("expires_at", datetime.utcnow().isoformat())\
            .eq("flagged", False)\
            .execute()

        return len(result.data)
```

## WebSocket Events

### Client → Server

```typescript
// Upload replay on death
interface UploadReplayMessage {
  type: 'telemetry_upload_replay'
  payload: {
    victimId: string
    killerId: string
    deathTick: number
    frames: TelemetryFrame[]  // Compressed client-side
  }
}

// Flag a death as suspicious
interface FlagDeathMessage {
  type: 'telemetry_flag_death'
  payload: {
    replayId: string
    reason: string
  }
}
```

### Server → Client

```typescript
// Confirm replay stored
interface ReplayStoredMessage {
  type: 'telemetry_replay_stored'
  payload: {
    replayId: string
    expiresAt: number
  }
}

// Network stats update (sent periodically)
interface NetworkStatsMessage {
  type: 'telemetry_network_stats'
  payload: {
    serverTick: number
    rttMs: number
    jitterMs: number
  }
}
```

## UI Components

### DeathReplayModal

```tsx
// frontend/src/components/replay/DeathReplayModal.tsx

interface DeathReplayModalProps {
  replay: DeathReplay
  onClose: () => void
  onReport: (reason: string) => void
}

export function DeathReplayModal({ replay, onClose, onReport }: DeathReplayModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [player] = useState(() => new ReplayPlayer())
  const [renderer, setRenderer] = useState<ReplayRenderer | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHitboxes, setShowHitboxes] = useState(false)
  const [showLatency, setShowLatency] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReportForm, setShowReportForm] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      const r = new ReplayRenderer(canvasRef.current)
      setRenderer(r)
      player.load(replay)
      player.onFrameChange = (frame, index, total) => {
        setCurrentFrame(index)
        r.renderFrame(frame, replay.victimId, replay.killerId)
      }
      player.onPlaybackEnd = () => setIsPlaying(false)
    }
  }, [replay])

  // Animation loop
  useEffect(() => {
    let animId: number
    const loop = () => {
      player.update()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [player])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-4 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Death Replay</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full bg-black rounded"
        />

        {/* Timeline scrubber */}
        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={replay.frames.length - 1}
            value={currentFrame}
            onChange={(e) => player.seekToFrame(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>-5.0s</span>
            <span>{((currentFrame - replay.frames.length) / 60).toFixed(1)}s</span>
            <span>Death</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => { isPlaying ? player.pause() : player.play(); setIsPlaying(!isPlaying) }}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showHitboxes}
              onChange={(e) => { setShowHitboxes(e.target.checked); renderer?.setShowHitboxes(e.target.checked) }}
            />
            Show Hitboxes
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showLatency}
              onChange={(e) => { setShowLatency(e.target.checked); renderer?.setShowLatencyOverlay(e.target.checked) }}
            />
            Show Latency
          </label>

          <div className="flex-1" />

          <button
            onClick={() => setShowReportForm(true)}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            🚩 Report This Death
          </button>
        </div>

        {/* Report form */}
        {showReportForm && (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-300 mb-2">
              What felt wrong about this death?
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g., 'I was behind cover but still got hit'"
              className="w-full p-2 bg-gray-700 rounded text-white"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { onReport(reportReason); setShowReportForm(false) }}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Submit Report
              </button>
              <button
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

## Integration Points

### GameEngine Integration

```typescript
// In GameEngine.ts update loop

update(deltaTime: number): void {
  // ... existing update logic ...

  // Capture telemetry frame
  const events = this.combatSystem.getEventsThisTick()
  this.telemetryRecorder.captureFrame(
    this.players,
    this.combatSystem.getProjectiles(),
    events
  )

  // On death, extract and upload replay
  if (this.combatSystem.hasDeathThisTick()) {
    const death = this.combatSystem.getLastDeath()
    const replay = this.telemetryRecorder.extractDeathReplay(
      death.victimId,
      death.killerId,
      death.tick
    )
    this.uploadReplay(replay)
    this.showDeathReplayButton(replay)
  }
}
```

### CombatSystem Integration

```typescript
// Add to CombatSystem.ts

private eventsThisTick: CombatEvent[] = []
private lastDeath: DeathEventData | null = null

// Called when hit is confirmed
private recordHitEvent(hit: HitEvent): void {
  this.eventsThisTick.push({
    type: 'hit',
    tick: this.currentTick,
    timestamp: Date.now(),
    data: {
      projectileId: hit.projectileId,
      shooterId: hit.shooterId,
      targetId: hit.targetId,
      hitPosition: hit.position,
      targetPosition: this.getPlayerPosition(hit.targetId),
      clientTargetPosition: this.getClientPredictedPosition(hit.targetId),
      damage: hit.damage,
      latencyMs: this.networkStats.rttMs,
    }
  })
}

getEventsThisTick(): CombatEvent[] {
  const events = [...this.eventsThisTick]
  this.eventsThisTick = []
  return events
}

hasDeathThisTick(): boolean {
  return this.lastDeath !== null
}

getLastDeath(): DeathEventData | null {
  const death = this.lastDeath
  this.lastDeath = null
  return death
}
```

## Performance Considerations

1. **Ring Buffer Size**: 600 frames (10s) uses ~2-3MB RAM - acceptable for modern browsers
2. **Compression**: zlib level 6 typically achieves 5-10x compression on JSON
3. **Upload Timing**: Replay upload happens during respawn delay (3s) - no gameplay impact
4. **Sampling**: Full 60fps capture; could reduce to 30fps if needed
5. **Cleanup**: Server cron job runs hourly to delete expired replays

## Testing Strategy

1. **Unit Tests**: TelemetryRecorder ring buffer, ReplayPlayer seek/playback
2. **Integration Tests**: Full death → replay → upload → retrieve flow
3. **Load Tests**: Verify <1ms capture overhead under combat load
4. **Visual Tests**: Replay renderer accuracy vs live gameplay
