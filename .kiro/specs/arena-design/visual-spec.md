# 1v1 Bro Arena - Visual Design Specification

## Overview
Neon cyberpunk 2D arena for competitive trivia battles. Code-generated graphics using Canvas/SVG.

## Dimensions
- **Arena Size**: 1280px × 720px (16:9)
- **Player 1 Spawn**: (160px, 360px) - left side
- **Player 2 Spawn**: (1120px, 360px) - right side
- **Central Hub**: circle at (640px, 360px), radius 120px

## Color Palette

| Element | Hex | Usage |
|---------|-----|-------|
| Background | #0a0e27 | Main arena floor |
| Grid Pattern | #1a2456 | Subtle floor detail (20% opacity) |
| Player 1 | #00ff88 | Lime/matrix green |
| Player 2 | #ff006e | Hot pink/cyberpunk |
| Central Hub | #00d4ff | Cyan accent, neutral |
| Power-up Base | #ffb700 | Inactive spawn points (gold/amber) |
| Power-up Active | #ff1493 | When spawned (magenta pulse) |
| Barrier | #4d0099 | Walls (deep purple) |
| Barrier Glow | #b300ff | Wall outlines (neon purple) |

## Layout

```
FULL ARENA TOP-DOWN (1280×720):

     0   160   280   640   1000  1120  1280
    ├────┼────┼────┼────┼────┼────┼────┤
 0  │         ●PWR1      ●PWR2        │
    │    ║                      ║     │
    │ P1 ║    ●PWR3  ◆  ●PWR4   ║ P2  │
360 │(#) ║         (hub)        ║ (#) │
    │    ║    ●PWR5      ●PWR6  ║     │
    │    ║                      ║     │
720 │                                 │
    └─────────────────────────────────┘

LEGEND:
  (#) = Player spawn
  ◆ = Central hub (contested zone)
  ● = Power-up spawn points
  ║ = Purple barriers (left/right)
```

## Power-up Spawn Positions

| ID | Position | Default Type |
|----|----------|--------------|
| 1 | (280px, 180px) | Time Steal |
| 2 | (1000px, 180px) | Double Points |
| 3 | (120px, 360px) | SOS |
| 4 | (1160px, 360px) | Shield |
| 5 | (280px, 540px) | Time Steal |
| 6 | (1000px, 540px) | SOS |

## Barriers

Two vertical rectangular barriers creating lanes:
- **Left barrier**: x=240-300, y=80-640
- **Right barrier**: x=980-1040, y=80-640

## Visual Effects

### Floor
- Solid background: #0a0e27
- Grid lines every 80px: #1a2456 at 20% opacity
- Center ring: radius 180px, #00d4ff at 10% opacity, pulsing

### Power-up States
- **Inactive**: r=20px, solid #ffb700, faint glow blur 4px
- **Active**: r=30px, pulses #ff1493 ↔ #ffb700 (1.5s cycle), glow blur 12px
- **Collected**: explosion animation, circle expands 60px over 0.3s, fades

### Player Rendering
- Small circle r=15px in player color
- Trail: thin line following movement, fading over time
- Success flash: brief glow on correct answer

### Tension Escalation (close scores)
- Barriers glow brighter
- Central hub pulses faster
- Timer bar turns red earlier
- Player trails more saturated

## Particle Effects

### Power-up Collection Burst
- 30-50 particles exploding outward
- Color matches power-up type
- Fade over 0.5s

### Player Trail Particles
- Small dots spawning behind movement
- Player color, fading quickly
- Creates motion blur effect

### Spawn Point Ambient
- 5-10 floating particles around active power-ups
- Slow orbit/float motion
- Subtle, not distracting

### Central Hub Energy
- Swirling particles in contested zone
- Cyan color, slow rotation
- Intensifies when both players nearby

### Victory Confetti
- 100+ particles on game end
- Winner's color dominant
- Falls with gravity + slight wind
