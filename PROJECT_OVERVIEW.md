# 1v1 Bro - Project Overview

## What Is This?

A real-time 1v1 trivia battle platform where two players compete in a 2D game arena while answering questions. Unlike traditional quiz apps, players control characters, collect power-ups, and see their opponent in real-time.

## The Vision

**Core Loop:** Friend argues with friend → One sends a quiz challenge → AI generates custom questions on that topic → They battle in real-time → Winner shares result

**Differentiators:**
- 2D animated arena (not static quiz screens)
- Real-time opponent visibility
- Power-up strategy layer
- AI-generated custom quizzes on any topic
- "Settle arguments" positioning

---

## What's Built

### Backend (Python/FastAPI)

| Component | Status | Description |
|-----------|--------|-------------|
| Authentication | ✅ Complete | Register, login, logout, JWT tokens |
| Lobby System | ✅ Complete | Create/join with 6-char codes |
| WebSocket Sync | ✅ Complete | Real-time game state broadcasting |
| Game Engine | ✅ Complete | 15 questions, scoring, round management |
| Power-up System | ✅ Complete | SOS, Time Steal, Shield, Double Points |
| Question Service | ✅ Complete | 20 Fortnite questions (expandable) |
| Database | ✅ Complete | Supabase (users, lobbies, games) |
| Tests | ✅ Complete | 99 tests (property + integration) |

**Tech Stack:** FastAPI, Supabase, WebSockets, Pydantic, pytest

### Frontend (React/TypeScript)

| Component | Status | Description |
|-----------|--------|-------------|
| Auth Flow | ✅ Complete | Login, register, protected routes |
| Lobby UI | ✅ Complete | Create, join, ready-up, start game |
| Quiz UI | ✅ Complete | Questions, timer, answers, results |
| Game Arena | ✅ Complete | 2D canvas rendering, movement, collisions |
| WebSocket Client | ✅ Complete | Real-time sync with reconnection |
| State Management | ✅ Complete | Zustand stores for auth, lobby, game |

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand

### 2D Game Arena

| Feature | Status | Description |
|---------|--------|-------------|
| Canvas Renderer | ✅ Complete | 60fps, responsive scaling |
| Grid Floor | ✅ Complete | Cyberpunk aesthetic |
| Barriers | ✅ Complete | Purple walls with glow |
| Central Hub | ✅ Complete | Pulsing contested zone |
| Power-up Spawns | ✅ Complete | 6 positions, active/inactive states |
| Player Rendering | ✅ Complete | Circle with trail effect |
| Movement | ✅ Complete | WASD/arrows, collision detection |
| Input System | ✅ Complete | Keyboard support (touch ready) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React + TypeScript + Vite + Tailwind                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Pages  │ │  Hooks  │ │ Stores  │ │  Game   │           │
│  │ (Routes)│ │(Logic)  │ │(Zustand)│ │(Canvas) │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                           │
              REST API + WebSocket
                           │
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  FastAPI + Python 3.11                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   API   │ │Services │ │  Repos  │ │WebSocket│           │
│  │(Routes) │ │(Logic)  │ │ (Data)  │ │(Realtime)│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
│  PostgreSQL + Auth + Realtime                               │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
1v1bro/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints
│   │   ├── core/            # Config, exceptions, responses
│   │   ├── database/        # Supabase client, repositories
│   │   ├── middleware/      # Auth, error handling
│   │   ├── schemas/         # Pydantic models
│   │   ├── services/        # Business logic
│   │   ├── websocket/       # Real-time handlers
│   │   └── main.py          # FastAPI app
│   └── tests/               # 99 tests
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── game/            # 2D arena engine
│   │   │   ├── config/      # Arena settings, colors
│   │   │   ├── renderers/   # Grid, hub, barriers, players
│   │   │   ├── systems/     # Collision, input
│   │   │   └── GameEngine.ts
│   │   ├── hooks/           # useAuth, useLobby, useGame
│   │   ├── pages/           # Route components
│   │   ├── services/        # API, WebSocket clients
│   │   ├── stores/          # Zustand state
│   │   └── types/           # TypeScript definitions
│   └── package.json
│
└── .kiro/specs/             # Design documents
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Get JWT token
- `POST /api/v1/auth/logout` - End session
- `GET /api/v1/auth/me` - Current user

### Lobbies
- `POST /api/v1/lobbies` - Create lobby (returns 6-char code)
- `GET /api/v1/lobbies/{code}` - Get lobby info
- `POST /api/v1/lobbies/{code}/join` - Join lobby
- `DELETE /api/v1/lobbies/{code}` - Leave lobby

### Games
- `GET /api/v1/games/history` - User's past games
- `GET /api/v1/games/{id}` - Game details

### WebSocket
- `WS /ws/{lobby_code}?token={jwt}` - Real-time game connection

---

## WebSocket Events

### Server → Client
| Event | Description |
|-------|-------------|
| `lobby_state` | Current lobby info on connect |
| `player_joined` | Opponent joined lobby |
| `player_left` | Opponent left |
| `player_ready` | Opponent ready status |
| `game_start` | Game beginning |
| `question` | New question with timer |
| `round_result` | Scores after each question |
| `game_end` | Final results |
| `position_update` | Opponent moved |
| `powerup_collected` | Power-up grabbed |

### Client → Server
| Event | Description |
|-------|-------------|
| `ready` | Player ready to start |
| `start_game` | Host starts game |
| `answer` | Submit answer |
| `position_update` | Player moved |
| `powerup_use` | Activate power-up |

---

## Scoring System

**Formula:** `Score = 1000 - (time_ms / 30)`

- Answer instantly: ~1000 points
- Answer in 10 seconds: ~667 points
- Answer in 30 seconds: 0 points
- Wrong answer: 0 points

**Power-ups:**
- Double Points: 2x score for one question
- Time Steal: Add 5 seconds to opponent's time
- SOS: Eliminate 2 wrong answers
- Shield: Block opponent's time steal

**Tiebreaker:** If scores equal, faster total answer time wins.

---

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add Supabase credentials
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Test Arena
Navigate to: `http://localhost:5173/arena-test`

---

## What's Next

### Phase 2: Integration
- [ ] Wire arena into actual game flow
- [ ] Opponent rendering via WebSocket
- [ ] Question overlay on arena
- [ ] Power-up collection → backend sync

### Phase 3: Polish
- [ ] Particle effects
- [ ] Sound effects
- [ ] Victory animations
- [ ] Mobile touch controls

### Phase 4: AI Questions
- [ ] OpenAI/Claude integration
- [ ] Custom topic quiz generation
- [ ] Question caching
- [ ] Rate limiting

### Phase 5: Monetization
- [ ] Ad integration
- [ ] Premium subscription
- [ ] Question pack purchases

### Phase 6: Launch
- [ ] PWA setup
- [ ] Deployment (Digital Ocean)
- [ ] Analytics
- [ ] Marketing content

---

## Repository

**GitHub:** https://github.com/dadbodgeoff/1v1bro

---

## Stats

- **Lines of Code:** ~22,000
- **Backend Tests:** 99 passing
- **Files:** 140+
- **Development Time:** Built iteratively with AI assistance

---

*Last Updated: December 2024*
