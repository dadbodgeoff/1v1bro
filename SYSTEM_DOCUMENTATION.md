# 1v1 Bro - Complete System Documentation

> **Generated:** December 8, 2025  
> **Version:** 2.0 Enterprise  
> **Repository:** https://github.com/dadbodgeoff/1v1bro

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [WebSocket Protocol](#websocket-protocol)
8. [Game Engine](#game-engine)
9. [Testing Infrastructure](#testing-infrastructure)
10. [Deployment](#deployment)

---

## Executive Summary

### What Is 1v1 Bro?

A real-time 1v1 trivia battle platform where two players compete in a 2D game arena while answering questions. Unlike traditional quiz apps, players control characters, collect power-ups, engage in PvP combat, and see their opponent in real-time.

### Core Game Loop

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CORE GAME LOOP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│   │  QUEUE   │───▶│  LOBBY   │───▶│  ARENA   │───▶│ RESULTS  │         │
│   │          │    │          │    │          │    │          │         │
│   │ Category │    │ Ready Up │    │ Combat + │    │ XP/Coins │         │
│   │ Map Pick │    │ Loadout  │    │ Trivia   │    │ Stats    │         │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Differentiators

| Feature | Description |
|---------|-------------|
| 2D Animated Arena | Real-time canvas rendering, not static quiz screens |
| PvP Combat System | Health, weapons, projectiles, respawning |
| Power-up Strategy | SOS, Time Steal, Shield, Double Points, EMP |
| Multiple Maps | Cyber Arena, Volcanic Vortex with unique mechanics |
| Progression System | XP, Battle Pass, Achievements, Leaderboards |
| Cosmetic Economy | Skins, Emotes, Player Cards, Shop Rotations |
| Real-time Sync | WebSocket-based opponent visibility |

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                     React 19 + TypeScript + Vite                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │    │
│  │  │  Pages   │ │Components│ │  Hooks   │ │  Stores  │ │  Game    │      │    │
│  │  │ (Routes) │ │   (UI)   │ │ (Logic)  │ │(Zustand) │ │ (Canvas) │      │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │         REST API + WebSocket       │
                    │         (HTTPS + WSS)              │
                    └─────────────────┬─────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                     FastAPI + Python 3.11+                               │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │    │
│  │  │   API    │ │ Services │ │  Repos   │ │WebSocket │ │   Game   │      │    │
│  │  │ (Routes) │ │ (Logic)  │ │  (Data)  │ │(Realtime)│ │ (Engine) │      │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
┌───────────────────▼───────────────┐ ┌────────────────▼────────────────────┐
│           SUPABASE                 │ │              REDIS                  │
│  ┌─────────────────────────────┐  │ │  ┌─────────────────────────────┐   │
│  │  PostgreSQL + Auth + RLS    │  │ │  │  Session Cache + Pub/Sub    │   │
│  │  + Storage Buckets          │  │ │  │  + Rate Limiting            │   │
│  └─────────────────────────────┘  │ │  └─────────────────────────────┘   │
└───────────────────────────────────┘ └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │           STRIPE                   │
                    │  ┌─────────────────────────────┐  │
                    │  │  Payments + Webhooks        │  │
                    │  └─────────────────────────────┘  │
                    └───────────────────────────────────┘
```

### Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Language | TypeScript | 5.9.3 |
| State Management | Zustand | 5.0.9 |
| Styling | Tailwind CSS | 4.1.17 |
| Animation | Framer Motion | 12.23.25 |
| Backend Framework | FastAPI | 0.109.0+ |
| Backend Language | Python | 3.11+ |
| Database | Supabase (PostgreSQL) | Latest |
| Cache | Redis | 5.0.0+ |
| Payments | Stripe | 7.0.0+ |
| Testing (FE) | Vitest + fast-check | 4.0.15 / 4.3.0 |
| Testing (BE) | pytest + Hypothesis | Latest |

---

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   │
│   ├── api/                       # REST API Layer
│   │   ├── __init__.py
│   │   ├── deps.py                # Dependency injection
│   │   └── v1/                    # API Version 1
│   │       ├── router.py          # Main router aggregator
│   │       ├── auth.py            # Authentication endpoints
│   │       ├── battlepass.py      # Battle pass endpoints
│   │       ├── coins.py           # Coin purchase endpoints
│   │       ├── cosmetics.py       # Cosmetics/inventory endpoints
│   │       ├── friend.py          # Friend system endpoints
│   │       ├── game.py            # Game state endpoints
│   │       ├── health.py          # Health check endpoint
│   │       ├── leaderboards.py    # Leaderboard endpoints
│   │       ├── lobby.py           # Lobby management endpoints
│   │       ├── matchmaking.py     # Queue/matchmaking endpoints
│   │       ├── messages.py        # Chat/messaging endpoints
│   │       ├── profiles.py        # User profile endpoints
│   │       ├── questions.py       # Trivia question endpoints
│   │       ├── settings.py        # User settings endpoints
│   │       ├── stats.py           # Player statistics endpoints
│   │       ├── storage.py         # File storage endpoints
│   │       ├── telemetry.py       # Replay/telemetry endpoints
│   │       ├── webhooks.py        # Stripe webhook handlers
│   │       ├── admin_cosmetics.py # Admin CMS endpoints
│   │       └── admin_rotations.py # Shop rotation admin
│   │
│   ├── cache/                     # Caching Layer
│   │   ├── __init__.py
│   │   ├── cache_manager.py       # Cache abstraction
│   │   └── redis_client.py        # Redis connection
│   │
│   ├── core/                      # Core Utilities
│   │   ├── __init__.py
│   │   ├── config.py              # Environment configuration
│   │   ├── exceptions.py          # Custom exceptions
│   │   ├── logging.py             # Logging configuration
│   │   └── responses.py           # Standardized API responses
│   │
│   ├── database/                  # Data Access Layer
│   │   ├── __init__.py
│   │   ├── supabase_client.py     # Supabase connection
│   │   ├── migrations/            # SQL migration files (22+)
│   │   └── repositories/          # Data repositories (21 repos)
│   │
│   ├── events/                    # Event System
│   │   ├── __init__.py
│   │   ├── handlers.py            # Event handlers
│   │   ├── publisher.py           # Event publishing
│   │   └── subscriber.py          # Event subscription
│   │
│   ├── game/                      # Game Logic Layer
│   │   ├── __init__.py
│   │   ├── arena_systems.py       # Arena game systems
│   │   ├── buffs.py               # Buff/debuff system
│   │   ├── combat.py              # Combat calculations
│   │   ├── config.py              # Game configuration
│   │   ├── dynamic_spawns.py      # Power-up spawning
│   │   ├── lag_compensation.py    # Network lag handling
│   │   ├── models.py              # Game state models
│   │   ├── quiz_rewards.py        # Quiz scoring
│   │   ├── tick_system.py         # Server tick rate
│   │   ├── validation.py          # Input validation
│   │   └── arena/                 # Arena subsystems
│   │       ├── barriers.py        # Barrier mechanics
│   │       ├── doors.py           # Door systems
│   │       ├── hazards.py         # Damage zones
│   │       ├── platforms.py       # Moving platforms
│   │       ├── powerups.py        # Power-up logic
│   │       ├── systems.py         # System coordination
│   │       ├── transport.py       # Teleporters/jump pads
│   │       ├── traps.py           # Trap mechanics
│   │       └── types.py           # Type definitions
│   │
│   ├── matchmaking/               # Matchmaking System
│   │   ├── __init__.py
│   │   ├── models.py              # Queue models
│   │   └── queue_manager.py       # Queue management
│   │
│   ├── middleware/                # HTTP Middleware
│   │   ├── __init__.py
│   │   ├── auth.py                # JWT authentication
│   │   ├── error_handler.py       # Global error handling
│   │   ├── rate_limit.py          # Rate limiting
│   │   ├── request_context.py     # Request context
│   │   └── request_logging.py     # Request logging
│   │
│   ├── schemas/                   # Pydantic Models (20 schemas)
│   │   ├── achievement.py
│   │   ├── admin_cosmetic.py
│   │   ├── auth.py
│   │   ├── base.py
│   │   ├── battlepass.py
│   │   ├── coin.py
│   │   ├── cosmetic.py
│   │   ├── friend.py
│   │   ├── game.py
│   │   ├── leaderboard.py
│   │   ├── lobby.py
│   │   ├── match_history.py
│   │   ├── message.py
│   │   ├── player.py
│   │   ├── profile.py
│   │   ├── question.py
│   │   ├── settings.py
│   │   ├── stats.py
│   │   └── ws_messages.py
│   │
│   ├── services/                  # Business Logic Layer (24 services)
│   │   ├── achievement_service.py
│   │   ├── asset_service.py
│   │   ├── auth_service.py
│   │   ├── balance_service.py
│   │   ├── base.py
│   │   ├── battlepass_service.py
│   │   ├── coin_webhook_handler.py
│   │   ├── cosmetics_service.py
│   │   ├── friend_service.py
│   │   ├── game_service.py
│   │   ├── leaderboard_service.py
│   │   ├── lobby_service.py
│   │   ├── matchmaking_service.py
│   │   ├── message_service.py
│   │   ├── powerup_service.py
│   │   ├── presence_service.py
│   │   ├── profile_service.py
│   │   ├── progression_service.py
│   │   ├── question_service.py
│   │   ├── rotation_service.py
│   │   ├── settings_service.py
│   │   ├── stats_service.py
│   │   ├── storage_service.py
│   │   ├── stripe_service.py
│   │   └── game/                  # Game-specific services
│   │
│   ├── telemetry/                 # Telemetry/Replay System
│   │   ├── __init__.py
│   │   ├── replay_service.py      # Replay recording/playback
│   │   └── schemas.py             # Telemetry data models
│   │
│   ├── utils/                     # Utility Functions
│   │   ├── __init__.py
│   │   ├── combat_tracker.py      # Combat event tracking
│   │   ├── constants.py           # Global constants
│   │   ├── helpers.py             # Helper functions
│   │   └── lobby_cache.py         # Lobby state caching
│   │
│   └── websocket/                 # WebSocket Layer
│       ├── __init__.py
│       ├── events.py              # Event definitions
│       ├── handlers.py            # Legacy handlers
│       ├── manager.py             # Connection management
│       └── handlers/              # Modular handlers
│           ├── arena.py           # Arena game events
│           ├── base.py            # Base handler class
│           ├── combat.py          # Combat events
│           ├── emote.py           # Emote events
│           ├── lobby.py           # Lobby events
│           ├── matchmaking.py     # Queue events
│           ├── powerup.py         # Power-up events
│           ├── quiz.py            # Quiz events
│           ├── router.py          # Event routing
│           └── telemetry.py       # Telemetry events
│
├── tests/                         # Test Suite
│   ├── conftest.py                # Pytest fixtures
│   ├── integration/               # Integration tests (14 files)
│   ├── property/                  # Property-based tests (33 files)
│   └── unit/                      # Unit tests (12 files)
│
├── docs/                          # Documentation
│   └── api/                       # API documentation
│
├── deploy/                        # Deployment configs
│   └── cloudrun.yaml              # Google Cloud Run config
│
├── requirements.txt               # Production dependencies
├── requirements-dev.txt           # Development dependencies
├── pytest.ini                     # Pytest configuration
└── Dockerfile                     # Container definition
```


### Backend Module Details

#### API Layer (`app/api/v1/`)

| Endpoint File | Routes | Description |
|---------------|--------|-------------|
| `auth.py` | `/auth/*` | Register, login, logout, JWT refresh, current user |
| `battlepass.py` | `/battlepass/*` | Season info, tier progress, reward claims |
| `coins.py` | `/coins/*` | Coin packages, purchase initiation, balance |
| `cosmetics.py` | `/cosmetics/*` | Inventory, loadout, equip/unequip |
| `friend.py` | `/friends/*` | Friend requests, accept/reject, friend list |
| `game.py` | `/games/*` | Game history, game details, active games |
| `health.py` | `/health` | Service health check |
| `leaderboards.py` | `/leaderboards/*` | Global/category rankings, player rank |
| `lobby.py` | `/lobbies/*` | Create, join, leave, ready up |
| `matchmaking.py` | `/matchmaking/*` | Queue join/leave, status |
| `messages.py` | `/messages/*` | Conversations, send/receive messages |
| `profiles.py` | `/profiles/*` | Profile CRUD, avatar upload |
| `questions.py` | `/questions/*` | Question categories, random questions |
| `settings.py` | `/settings/*` | User preferences, game settings |
| `stats.py` | `/stats/*` | Player statistics, match stats |
| `storage.py` | `/storage/*` | Signed URLs for asset uploads |
| `telemetry.py` | `/telemetry/*` | Replay data, match recordings |
| `webhooks.py` | `/webhooks/*` | Stripe payment webhooks |
| `admin_cosmetics.py` | `/admin/cosmetics/*` | CMS for cosmetic items |
| `admin_rotations.py` | `/admin/rotations/*` | Shop rotation management |

#### Service Layer (`app/services/`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  AUTH SERVICE   │  │ PROFILE SERVICE │  │SETTINGS SERVICE │             │
│  │                 │  │                 │  │                 │             │
│  │ • Registration  │  │ • Profile CRUD  │  │ • Preferences   │             │
│  │ • Login/Logout  │  │ • Avatar Upload │  │ • Game Settings │             │
│  │ • JWT Tokens    │  │ • Display Name  │  │ • Audio/Video   │             │
│  │ • 2FA (TOTP)    │  │ • Bio/Status    │  │ • Controls      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  GAME SERVICE   │  │ LOBBY SERVICE   │  │MATCHMAKING SVC  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Game State    │  │ • Create/Join   │  │ • Queue Mgmt    │             │
│  │ • Round Mgmt    │  │ • Ready System  │  │ • ELO Matching  │             │
│  │ • Scoring       │  │ • Map Selection │  │ • Category Pick │             │
│  │ • Results       │  │ • Category Pick │  │ • Match Found   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │COSMETICS SERVICE│  │BATTLEPASS SVC   │  │PROGRESSION SVC  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Inventory     │  │ • Season Data   │  │ • XP Calculation│             │
│  │ • Loadout       │  │ • Tier Progress │  │ • Level Up      │             │
│  │ • Equip/Unequip │  │ • Reward Claims │  │ • Achievements  │             │
│  │ • Shop Purchase │  │ • Premium Track │  │ • Milestones    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ BALANCE SERVICE │  │ STRIPE SERVICE  │  │LEADERBOARD SVC  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Coin Balance  │  │ • Checkout      │  │ • Global Ranks  │             │
│  │ • Transactions  │  │ • Webhooks      │  │ • Category Ranks│             │
│  │ • Credit/Debit  │  │ • Product Sync  │  │ • Seasonal      │             │
│  │ • History       │  │ • Refunds       │  │ • Friends Only  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ FRIEND SERVICE  │  │ MESSAGE SERVICE │  │PRESENCE SERVICE │             │
│  │                 │  │                 │  │                 │             │
│  │ • Send Request  │  │ • Conversations │  │ • Online Status │             │
│  │ • Accept/Reject │  │ • Send/Receive  │  │ • Last Seen     │             │
│  │ • Friend List   │  │ • Read Receipts │  │ • In-Game State │             │
│  │ • Block/Unblock │  │ • Notifications │  │ • Activity      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │QUESTION SERVICE │  │ ROTATION SERVICE│  │  ASSET SERVICE  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Categories    │  │ • Daily Shop    │  │ • Image Upload  │             │
│  │ • Random Select │  │ • Featured      │  │ • CDN URLs      │             │
│  │ • Difficulty    │  │ • Time-Limited  │  │ • Thumbnails    │             │
│  │ • Validation    │  │ • Scheduling    │  │ • Optimization  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ POWERUP SERVICE │  │  STATS SERVICE  │  │ACHIEVEMENT SVC  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Spawn Logic   │  │ • Match Stats   │  │ • Unlock Check  │             │
│  │ • Collection    │  │ • Career Stats  │  │ • Progress Track│             │
│  │ • Activation    │  │ • Win Rate      │  │ • Reward Grant  │             │
│  │ • Effects       │  │ • Accuracy      │  │ • Display       │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Repository Layer (`app/database/repositories/`)

| Repository | Table(s) | Operations |
|------------|----------|------------|
| `user_repo.py` | `users` | CRUD, auth lookup |
| `profile_repo.py` | `profiles` | Profile data, avatar |
| `lobby_repo.py` | `lobbies` | Lobby state, players |
| `game_repo.py` | `games`, `game_rounds` | Game state, rounds |
| `cosmetics_repo.py` | `cosmetics`, `user_cosmetics` | Items, ownership |
| `battlepass_repo.py` | `seasons`, `battlepass_tiers`, `user_battlepass` | Season progress |
| `balance_repo.py` | `user_balances`, `transactions` | Coin economy |
| `friend_repo.py` | `friendships`, `friend_requests` | Social graph |
| `message_repo.py` | `conversations`, `messages` | Chat data |
| `leaderboard_repo.py` | `leaderboards` | Rankings |
| `stats_repo.py` | `player_stats` | Statistics |
| `unified_stats_repo.py` | `unified_stats` | Aggregated stats |
| `settings_repo.py` | `user_settings` | Preferences |
| `questions_repo.py` | `questions`, `categories` | Trivia content |
| `matchmaking_repo.py` | `matchmaking_queue` | Queue state |
| `ratings_repo.py` | `elo_ratings` | Skill ratings |
| `rotation_repo.py` | `shop_rotations` | Shop schedule |
| `asset_metadata_repo.py` | `asset_metadata` | File metadata |
| `match_results_repo.py` | `match_results` | Game outcomes |

#### WebSocket Handler Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WEBSOCKET EVENT FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Client                    Router                     Handlers              │
│     │                         │                           │                  │
│     │  ──── WS Connect ────▶  │                           │                  │
│     │                         │  ──── Authenticate ────▶  │                  │
│     │                         │  ◀──── User Context ────  │                  │
│     │  ◀──── Connected ─────  │                           │                  │
│     │                         │                           │                  │
│     │  ──── Event Message ──▶ │                           │                  │
│     │                         │  ──── Route Event ─────▶  │                  │
│     │                         │                           │                  │
│     │                         │         ┌─────────────────┴──────────────┐  │
│     │                         │         │                                │  │
│     │                         │    ┌────▼────┐  ┌────────┐  ┌────────┐  │  │
│     │                         │    │  Lobby  │  │ Arena  │  │ Combat │  │  │
│     │                         │    │ Handler │  │Handler │  │Handler │  │  │
│     │                         │    └────┬────┘  └────┬───┘  └────┬───┘  │  │
│     │                         │         │           │           │       │  │
│     │                         │    ┌────▼────┐  ┌───▼────┐  ┌───▼────┐ │  │
│     │                         │    │  Quiz   │  │Powerup │  │ Emote  │ │  │
│     │                         │    │ Handler │  │Handler │  │Handler │ │  │
│     │                         │    └────┬────┘  └────┬───┘  └────┬───┘ │  │
│     │                         │         │           │           │       │  │
│     │                         │    ┌────▼────┐  ┌───▼─────┐            │  │
│     │                         │    │Matchmkg │  │Telemetry│            │  │
│     │                         │    │ Handler │  │ Handler │            │  │
│     │                         │    └─────────┘  └─────────┘            │  │
│     │                         │         └────────────────┬──────────────┘  │
│     │                         │                          │                  │
│     │                         │  ◀──── Response ────────  │                  │
│     │  ◀──── Broadcast ─────  │                           │                  │
│     │                         │                           │                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Handler | Events | Description |
|---------|--------|-------------|
| `lobby.py` | `join_lobby`, `leave_lobby`, `ready`, `start_game` | Lobby management |
| `arena.py` | `position_update`, `game_state` | Arena movement |
| `combat.py` | `attack`, `damage`, `death`, `respawn` | PvP combat |
| `quiz.py` | `answer`, `question_result`, `round_end` | Trivia gameplay |
| `powerup.py` | `collect_powerup`, `use_powerup` | Power-up system |
| `emote.py` | `play_emote` | Emote display |
| `matchmaking.py` | `join_queue`, `leave_queue`, `match_found` | Queue system |
| `telemetry.py` | `record_frame`, `replay_request` | Replay system |

#### Game Engine (`app/game/`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVER GAME ENGINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         TICK SYSTEM (60 Hz)                          │    │
│  │  • Server authoritative game loop                                    │    │
│  │  • State synchronization every 16.67ms                               │    │
│  │  • Lag compensation for fairness                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│           ┌────────────────────────┼────────────────────────┐               │
│           │                        │                        │               │
│           ▼                        ▼                        ▼               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  COMBAT SYSTEM  │    │  ARENA SYSTEMS  │    │   QUIZ SYSTEM   │         │
│  │                 │    │                 │    │                 │         │
│  │ • Damage Calc   │    │ • Barriers      │    │ • Question Pick │         │
│  │ • Health Mgmt   │    │ • Hazards       │    │ • Answer Valid  │         │
│  │ • Respawn       │    │ • Transport     │    │ • Score Calc    │         │
│  │ • Buffs/Debuffs │    │ • Traps         │    │ • Round Mgmt    │         │
│  │ • Projectiles   │    │ • Platforms     │    │ • Time Tracking │         │
│  └─────────────────┘    │ • Doors         │    └─────────────────┘         │
│                         │ • Power-ups     │                                 │
│                         └─────────────────┘                                 │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        VALIDATION LAYER                              │    │
│  │  • Input sanitization                                                │    │
│  │  • Movement validation (speed limits, collision)                     │    │
│  │  • Action validation (cooldowns, resource checks)                    │    │
│  │  • Anti-cheat checks                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── App.tsx                    # Root component with routing
│   ├── main.tsx                   # Application entry point
│   ├── index.css                  # Global styles
│   │
│   ├── pages/                     # Route Components (23 pages)
│   │   ├── ArenaGame.tsx          # Main arena gameplay
│   │   ├── ArenaTest.tsx          # Arena testing/debug
│   │   ├── BattlePass.tsx         # Battle pass progression
│   │   ├── BotGame.tsx            # Single-player vs bot
│   │   ├── CoinShop.tsx           # Coin purchase store
│   │   ├── CoinSuccess.tsx        # Purchase confirmation
│   │   ├── FortniteQuiz.tsx       # Fortnite category quiz
│   │   ├── Game.tsx               # Legacy game page
│   │   ├── Home.tsx               # Dashboard home
│   │   ├── Inventory.tsx          # Cosmetic inventory
│   │   ├── Landing.tsx            # Marketing landing page
│   │   ├── LeaderboardDetail.tsx  # Specific leaderboard
│   │   ├── LeaderboardHub.tsx     # Leaderboard overview
│   │   ├── Lobby.tsx              # Pre-game lobby
│   │   ├── Login.tsx              # Authentication
│   │   ├── MatchHistory.tsx       # Past games
│   │   ├── Profile.tsx            # User profile
│   │   ├── Register.tsx           # Account creation
│   │   ├── Results.tsx            # Post-game results
│   │   ├── Settings.tsx           # User settings
│   │   └── Shop.tsx               # Cosmetic shop
│   │
│   ├── components/                # UI Components (19 categories)
│   │   ├── battlepass/            # Battle pass UI
│   │   │   ├── enterprise/        # Enterprise-grade components
│   │   │   ├── BattlePassTrack.tsx
│   │   │   ├── PremiumUpsell.tsx
│   │   │   ├── SeasonHeader.tsx
│   │   │   ├── TierCard.tsx
│   │   │   ├── XPProgress.tsx
│   │   │   └── XPProgressBar.tsx
│   │   │
│   │   ├── coins/                 # Coin economy UI
│   │   │   ├── BalanceDisplay.tsx
│   │   │   ├── CoinPackageCard.tsx
│   │   │   └── TransactionHistory.tsx
│   │   │
│   │   ├── cosmetics/             # Cosmetic display
│   │   │   ├── InventoryGrid.tsx
│   │   │   ├── LoadoutDisplay.tsx
│   │   │   └── ShopGrid.tsx
│   │   │
│   │   ├── dashboard/             # Dashboard widgets
│   │   │   ├── BattlePassWidget.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── FriendsWidget.tsx
│   │   │   ├── MatchHistoryWidget.tsx
│   │   │   ├── QuickActionsWidget.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── friends/               # Social features
│   │   │   ├── FriendRequests.tsx
│   │   │   ├── FriendsButton.tsx
│   │   │   ├── FriendsList.tsx
│   │   │   ├── FriendsNotifications.tsx
│   │   │   ├── FriendsPanel.tsx
│   │   │   ├── GameInviteToast.tsx
│   │   │   └── UserSearch.tsx
│   │   │
│   │   ├── game/                  # In-game UI
│   │   │   ├── ArenaQuizPanel.tsx
│   │   │   ├── ArenaScoreboard.tsx
│   │   │   ├── GameArena.tsx
│   │   │   ├── LatencyIndicator.tsx
│   │   │   ├── MobileControls.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── QuestionOverlay.tsx
│   │   │   ├── QuestionPanel.tsx
│   │   │   ├── RespawnOverlay.tsx
│   │   │   ├── RoundResultOverlay.tsx
│   │   │   ├── Scoreboard.tsx
│   │   │   └── Timer.tsx
│   │   │
│   │   ├── inventory/             # Inventory management
│   │   │   └── enterprise/
│   │   │       ├── CollectionStats.tsx
│   │   │       ├── EquipCTA.tsx
│   │   │       ├── FilterBar.tsx
│   │   │       ├── InventoryHeader.tsx
│   │   │       ├── InventoryItemBox.tsx
│   │   │       └── LoadoutPanel.tsx
│   │   │
│   │   ├── landing/               # Landing page
│   │   │   ├── animations/
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── FeatureShowcase.tsx
│   │   │   ├── FooterCTA.tsx
│   │   │   ├── HeroBackground.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── StickyMobileCTA.tsx
│   │   │   └── TechShowcase.tsx
│   │   │
│   │   ├── leaderboard/           # Leaderboard display
│   │   │   ├── LeaderboardCard.tsx
│   │   │   ├── LeaderboardRow.tsx
│   │   │   └── RankBadge.tsx
│   │   │
│   │   ├── lobby/                 # Lobby UI
│   │   │   ├── HeadToHeadDisplay.tsx
│   │   │   ├── LobbyCode.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   └── PlayerCardBanner.tsx
│   │   │
│   │   ├── matchmaking/           # Queue UI
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── MapSelector.tsx
│   │   │   ├── MatchFoundModal.tsx
│   │   │   └── QueueStatus.tsx
│   │   │
│   │   ├── messages/              # Chat UI
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   └── MessageBubble.tsx
│   │   │
│   │   ├── profile/               # Profile UI
│   │   │   └── enterprise/
│   │   │       ├── AchievementBadge.tsx
│   │   │       ├── LoadoutPreview.tsx
│   │   │       ├── MatchHistoryItem.tsx
│   │   │       ├── ProfileEditorForm.tsx
│   │   │       ├── ProfileErrorBoundary.tsx
│   │   │       ├── ProfileHeader.tsx
│   │   │       ├── ProfileSection.tsx
│   │   │       └── StatsCard.tsx
│   │   │
│   │   ├── progression/           # XP/Level UI
│   │   │   ├── ProgressionProvider.tsx
│   │   │   ├── TierUpCelebration.tsx
│   │   │   └── XPNotification.tsx
│   │   │
│   │   ├── quiz/                  # Quiz UI
│   │   │   ├── PersonalityQuiz.tsx
│   │   │   ├── QuizCard.tsx
│   │   │   ├── QuizGame.tsx
│   │   │   ├── QuizResults.tsx
│   │   │   └── QuizSetup.tsx
│   │   │
│   │   ├── replay/                # Replay UI
│   │   │   ├── DeathReplayModal.tsx
│   │   │   ├── LatencyGraph.tsx
│   │   │   └── ReplayControls.tsx
│   │   │
│   │   ├── settings/              # Settings UI
│   │   │   └── enterprise/
│   │   │       ├── AccountDangerZone.tsx
│   │   │       ├── SettingsSection.tsx
│   │   │       ├── SettingsSelect.tsx
│   │   │       ├── SettingsSlider.tsx
│   │   │       ├── SettingsToggle.tsx
│   │   │       └── TwoFactorSetup.tsx
│   │   │
│   │   ├── shop/                  # Shop UI
│   │   │   ├── enterprise/
│   │   │   │   └── ItemDisplayBox.tsx
│   │   │   ├── DynamicImage.tsx
│   │   │   ├── FeaturedItem.tsx
│   │   │   ├── PurchaseModal.tsx
│   │   │   ├── ShopCard.tsx
│   │   │   ├── ShopFilters.tsx
│   │   │   └── SkinPreview.tsx
│   │   │
│   │   └── ui/                    # Base UI components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Confetti.tsx
│   │       ├── EmptyState.tsx
│   │       ├── GlassCard.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── OptimizedImage.tsx
│   │       ├── Pagination.tsx
│   │       ├── Progress.tsx
│   │       ├── SearchInput.tsx
│   │       ├── Select.tsx
│   │       ├── ServerBusyModal.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Toast.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── hooks/                     # Custom React Hooks (25 hooks)
│   │   ├── arena/
│   │   │   └── useArenaGame.ts    # Arena game state
│   │   ├── landing/               # Landing page hooks
│   │   ├── useAchievements.ts     # Achievement tracking
│   │   ├── useArenaGame.ts        # Arena gameplay
│   │   ├── useAuth.ts             # Authentication
│   │   ├── useBalance.ts          # Coin balance
│   │   ├── useBattlePass.ts       # Battle pass data
│   │   ├── useCategories.ts       # Question categories
│   │   ├── useCoinPurchase.ts     # Stripe checkout
│   │   ├── useConfetti.ts         # Celebration effects
│   │   ├── useCosmetics.ts        # Inventory/loadout
│   │   ├── useCountdown.ts        # Timer utility
│   │   ├── useDashboard.ts        # Dashboard data
│   │   ├── useDynamicImage.ts     # CDN image loading
│   │   ├── useFriends.ts          # Friend system
│   │   ├── useGame.ts             # Game state
│   │   ├── useLobby.ts            # Lobby state
│   │   ├── useMatchHistory.ts     # Past games
│   │   ├── useMatchmaking.ts      # Queue state
│   │   ├── useMessages.ts         # Chat
│   │   ├── usePresence.ts         # Online status
│   │   ├── useProfile.ts          # Profile data
│   │   ├── useProgressionEvents.ts # XP notifications
│   │   ├── useSettings.ts         # User settings
│   │   └── useToast.ts            # Toast notifications
│   │
│   ├── stores/                    # Zustand State Stores (12 stores)
│   │   ├── authStore.ts           # Authentication state
│   │   ├── balanceStore.ts        # Coin balance state
│   │   ├── friendStore.ts         # Friends state
│   │   ├── gameStore.ts           # Game state
│   │   ├── lobbyStore.ts          # Lobby state
│   │   ├── matchmakingStore.ts    # Queue state
│   │   ├── messageStore.ts        # Chat state
│   │   ├── quizStore.ts           # Quiz state
│   │   └── settingsStore.ts       # Settings state
│   │
│   ├── services/                  # API Services
│   │   ├── api.ts                 # REST API client
│   │   ├── landingAPI.ts          # Landing page API
│   │   ├── matchmakingAPI.ts      # Matchmaking API
│   │   └── websocket.ts           # WebSocket client
│   │
│   ├── types/                     # TypeScript Definitions (14 files)
│   │   ├── api.ts                 # API response types
│   │   ├── battlepass.ts          # Battle pass types
│   │   ├── coin.ts                # Coin economy types
│   │   ├── cosmetic.ts            # Cosmetic types
│   │   ├── friend.ts              # Friend types
│   │   ├── leaderboard.ts         # Leaderboard types
│   │   ├── matchHistory.ts        # Match history types
│   │   ├── message.ts             # Message types
│   │   ├── profile.ts             # Profile types
│   │   ├── quiz.ts                # Quiz types
│   │   ├── settings.ts            # Settings types
│   │   └── websocket.ts           # WebSocket types
│   │
│   ├── utils/                     # Utility Functions
│   │   ├── constants.ts           # Global constants
│   │   └── helpers.ts             # Helper functions
│   │
│   ├── styles/                    # Styling
│   │   └── tokens.css             # Design tokens
│   │
│   ├── data/                      # Static Data
│   │   └── fortnite-quiz-data.ts  # Quiz questions
│   │
│   ├── assets/                    # Static Assets
│   │   └── game/                  # Game assets
│   │
│   └── game/                      # 2D Game Engine (see below)
│
├── public/                        # Public assets
├── dist/                          # Build output
├── package.json                   # Dependencies
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind config
└── eslint.config.js               # ESLint config
```


### Frontend Game Engine (`src/game/`)

The game engine is a comprehensive 2D canvas-based rendering system with multiple subsystems:

```
frontend/src/game/
├── GameEngine.ts                  # Main engine orchestrator
├── index.ts                       # Public exports
│
├── arena/                         # Arena Management
│   ├── ArenaManager.ts            # Arena state coordination
│   ├── DynamicSpawnManager.ts     # Power-up spawn logic
│   ├── MapLoader.ts               # Map loading system
│   ├── ProceduralGenerator.ts     # Procedural map generation
│   ├── TileMap.ts                 # Tile-based map system
│   └── types.ts                   # Arena type definitions
│
├── assets/                        # Asset Management
│   ├── ArenaAssetLoader.ts        # Arena-specific assets
│   ├── AssetLoader.ts             # General asset loading
│   ├── DynamicAssetLoader.ts      # CDN asset loading
│   ├── ImageProcessor.ts          # Image manipulation
│   ├── SpriteAnimator.ts          # Sprite animation
│   ├── SpriteSheetProcessor.ts    # Sprite sheet parsing
│   └── components/
│       └── library.json           # Component library
│
├── backdrop/                      # Background Systems
│   ├── BackdropSystem.ts          # Base backdrop system
│   ├── CyberBackdropSystem.ts     # Cyber theme backdrop
│   ├── types.ts                   # Backdrop types
│   └── layers/
│       ├── SmokeHazeLayer.ts      # Smoke effect layer
│       └── VolcanicCavernLayer.ts # Volcanic theme layer
│
├── barriers/                      # Barrier System
│   ├── BarrierManager.ts          # Barrier coordination
│   ├── BarrierTypes.ts            # Barrier definitions
│   ├── DestructibleBarrier.ts     # Breakable barriers
│   └── OneWayBarrier.ts           # Directional barriers
│
├── collision/                     # Collision Detection
│   ├── CollisionLayers.ts         # Layer-based collision
│   └── SpatialHash.ts             # Spatial partitioning
│
├── combat/                        # Combat System
│   ├── BuffManager.ts             # Buff/debuff management
│   ├── CombatSystem.ts            # Combat coordination
│   ├── HealthManager.ts           # Health tracking
│   ├── ProjectileManager.ts       # Projectile physics
│   ├── RespawnManager.ts          # Respawn logic
│   └── WeaponManager.ts           # Weapon handling
│
├── config/                        # Configuration
│   ├── arena.ts                   # Arena settings
│   ├── colors.ts                  # Color palette
│   ├── combat.ts                  # Combat settings
│   ├── emotes.ts                  # Emote definitions
│   └── maps/                      # Map configurations
│       └── vortex-arena.ts        # Volcanic Vortex map
│
├── emotes/                        # Emote System
│   ├── EmoteAssetLoader.ts        # Emote asset loading
│   ├── EmoteManager.ts            # Emote playback
│   └── types.ts                   # Emote types
│
├── engine/                        # Core Engine
│   ├── CombatWiring.ts            # Combat system wiring
│   ├── GameEngine.ts              # Main game loop
│   ├── GameLoop.ts                # Frame loop
│   ├── PlayerController.ts        # Player input handling
│   ├── RenderPipeline.ts          # Render orchestration
│   ├── ServerSync.ts              # Server synchronization
│   ├── TelemetryManager.ts        # Telemetry recording
│   └── types.ts                   # Engine types
│
├── hazards/                       # Environmental Hazards
│   ├── DamageZone.ts              # Damage dealing zones
│   ├── EMPZone.ts                 # EMP effect zones
│   ├── HazardManager.ts           # Hazard coordination
│   └── SlowField.ts               # Movement slow zones
│
├── interactive/                   # Interactive Elements
│   ├── DoorSystem.ts              # Door mechanics
│   └── MovingPlatform.ts          # Platform movement
│
├── particles/                     # Particle Effects
│   └── ParticleSystem.ts          # Particle rendering
│
├── renderers/                     # Rendering Components (16 renderers)
│   ├── BarrierRenderer.ts         # Barrier drawing
│   ├── BaseRenderer.ts            # Base renderer class
│   ├── BuffRenderer.ts            # Buff effect drawing
│   ├── CombatEffectsRenderer.ts   # Combat VFX
│   ├── EmoteRenderer.ts           # Emote display
│   ├── GridRenderer.ts            # Grid floor
│   ├── HealthBarRenderer.ts       # Health bars
│   ├── HubRenderer.ts             # Central hub
│   ├── LavaVortexRenderer.ts      # Lava effects
│   ├── PlayerRenderer.ts          # Player sprites
│   ├── PowerUpRenderer.ts         # Power-up items
│   ├── ProjectileRenderer.ts      # Projectile drawing
│   ├── QuestionBroadcastRenderer.ts # Question display
│   └── TileBatchRenderer.ts       # Tile batching
│
├── rendering/                     # Render Management
│   ├── LayerEffects.ts            # Layer post-processing
│   ├── LayerManager.ts            # Layer ordering
│   └── RenderLayer.ts             # Layer abstraction
│
├── systems/                       # Game Systems
│   ├── ClientPrediction.ts        # Client-side prediction
│   ├── CollisionSystem.ts         # Collision handling
│   ├── InputSystem.ts             # Input processing
│   ├── PositionInterpolator.ts    # Position smoothing
│   └── PowerUpManager.ts          # Power-up logic
│
├── telemetry/                     # Replay System
│   ├── ReplayPlayer.ts            # Replay playback
│   ├── ReplayRenderer.ts          # Replay rendering
│   ├── TelemetryRecorder.ts       # Frame recording
│   └── types.ts                   # Telemetry types
│
├── terrain/                       # Terrain System
│   ├── AnimatedTiles.ts           # Animated tile support
│   ├── MapThemes.ts               # Theme definitions
│   ├── ScreenEffects.ts           # Screen-wide effects
│   └── TerrainTypes.ts            # Terrain definitions
│
├── themes/                        # Visual Themes
│   └── volcanic/
│       ├── manifest.json          # Theme manifest
│       └── props.json             # Theme props
│
├── transport/                     # Transport Systems
│   ├── JumpPad.ts                 # Jump pad mechanics
│   ├── Teleporter.ts              # Teleporter mechanics
│   └── TransportManager.ts        # Transport coordination
│
├── traps/                         # Trap System
│   ├── PressureTrap.ts            # Pressure-activated traps
│   ├── ProjectileTrap.ts          # Projectile-shooting traps
│   ├── TimedTrap.ts               # Time-based traps
│   ├── TrapEffects.ts             # Trap visual effects
│   └── TrapManager.ts             # Trap coordination
│
├── types/                         # Type Definitions
│   ├── combat.ts                  # Combat types
│   └── index.ts                   # Type exports
│
├── visual/                        # Visual Systems
│   ├── AnimationLifeSystem.ts     # Animation lifecycle
│   ├── DynamicLightingSystem.ts   # Dynamic lighting
│   ├── EnvironmentalPropSystem.ts # Environmental props
│   ├── ParallaxDepthSystem.ts     # Parallax scrolling
│   ├── QualityManager.ts          # Quality settings
│   ├── ThemeAssetLoader.ts        # Theme asset loading
│   ├── TileArtSystem.ts           # Tile art rendering
│   ├── types.ts                   # Visual types
│   ├── VisualHierarchySystem.ts   # Visual layering
│   └── VisualSystemCoordinator.ts # Visual coordination
│
└── zones/                         # Zone System
    ├── EffectStack.ts             # Effect stacking
    ├── ZoneManager.ts             # Zone coordination
    └── ZoneTypes.ts               # Zone definitions
```

### Game Engine Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GAME ENGINE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                            GAME LOOP (60 FPS)                            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │  │  Input   │─▶│  Update  │─▶│ Physics  │─▶│  Render  │─▶│  Sync    │  │    │
│  │  │ Process  │  │  State   │  │ Resolve  │  │  Frame   │  │  Server  │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                       │                                          │
│       ┌───────────────────────────────┼───────────────────────────────┐         │
│       │                               │                               │         │
│       ▼                               ▼                               ▼         │
│  ┌─────────────┐               ┌─────────────┐               ┌─────────────┐   │
│  │   INPUT     │               │   SYSTEMS   │               │  RENDERING  │   │
│  │   SYSTEM    │               │             │               │   PIPELINE  │   │
│  │             │               │ ┌─────────┐ │               │             │   │
│  │ • Keyboard  │               │ │Collision│ │               │ ┌─────────┐ │   │
│  │ • Touch     │               │ └─────────┘ │               │ │Backdrop │ │   │
│  │ • Gamepad   │               │ ┌─────────┐ │               │ └─────────┘ │   │
│  │             │               │ │ Combat  │ │               │ ┌─────────┐ │   │
│  └─────────────┘               │ └─────────┘ │               │ │  Grid   │ │   │
│                                │ ┌─────────┐ │               │ └─────────┘ │   │
│                                │ │PowerUps │ │               │ ┌─────────┐ │   │
│                                │ └─────────┘ │               │ │Barriers │ │   │
│                                │ ┌─────────┐ │               │ └─────────┘ │   │
│                                │ │ Hazards │ │               │ ┌─────────┐ │   │
│                                │ └─────────┘ │               │ │ Players │ │   │
│                                │ ┌─────────┐ │               │ └─────────┘ │   │
│                                │ │Transport│ │               │ ┌─────────┐ │   │
│                                │ └─────────┘ │               │ │  HUD    │ │   │
│                                │ ┌─────────┐ │               │ └─────────┘ │   │
│                                │ │  Traps  │ │               │ ┌─────────┐ │   │
│                                │ └─────────┘ │               │ │Particles│ │   │
│                                └─────────────┘               │ └─────────┘ │   │
│                                                              └─────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                          NETWORK LAYER                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │    │
│  │  │   Client     │  │   Position   │  │    Server    │  │   Lag      │  │    │
│  │  │  Prediction  │  │ Interpolator │  │     Sync     │  │Compensation│  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### State Management (Zustand Stores)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ZUSTAND STATE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   AUTH STORE    │  │   GAME STORE    │  │  LOBBY STORE    │                 │
│  │                 │  │                 │  │                 │                 │
│  │ • user          │  │ • gameState     │  │ • lobbyCode     │                 │
│  │ • token         │  │ • players       │  │ • players       │                 │
│  │ • isLoading     │  │ • currentRound  │  │ • isHost        │                 │
│  │ • login()       │  │ • scores        │  │ • isReady       │                 │
│  │ • logout()      │  │ • powerUps      │  │ • category      │                 │
│  │ • register()    │  │ • updateState() │  │ • selectedMap   │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ MATCHMAKING     │  │  FRIEND STORE   │  │ MESSAGE STORE   │                 │
│  │    STORE        │  │                 │  │                 │                 │
│  │                 │  │ • friends       │  │ • conversations │                 │
│  │ • queueStatus   │  │ • requests      │  │ • activeChat    │                 │
│  │ • estimatedWait │  │ • online        │  │ • unreadCount   │                 │
│  │ • category      │  │ • addFriend()   │  │ • sendMessage() │                 │
│  │ • joinQueue()   │  │ • removeFriend()│  │ • markRead()    │                 │
│  │ • leaveQueue()  │  │ • acceptRequest │  │                 │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ BALANCE STORE   │  │  QUIZ STORE     │  │ SETTINGS STORE  │                 │
│  │                 │  │                 │  │                 │                 │
│  │ • coins         │  │ • questions     │  │ • audio         │                 │
│  │ • transactions  │  │ • currentIndex  │  │ • video         │                 │
│  │ • addCoins()    │  │ • answers       │  │ • controls      │                 │
│  │ • spendCoins()  │  │ • submitAnswer()│  │ • updateSetting │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---

## Database Schema

### Migration History

| Migration | Description | Tables Affected |
|-----------|-------------|-----------------|
| `001_initial_schema.sql` | Core tables | `users`, `lobbies`, `games` |
| `002_player_stats.sql` | Statistics | `player_stats` |
| `003_friends.sql` | Social system | `friendships`, `friend_requests` |
| `004_death_replays.sql` | Replay system | `death_replays` |
| `004_matchmaking.sql` | Queue system | `matchmaking_queue` |
| `005_messages.sql` | Chat system | `conversations`, `messages` |
| `006_profiles_extended.sql` | Extended profiles | `profiles` |
| `007_cosmetics.sql` | Cosmetic system | `cosmetics`, `user_cosmetics`, `loadouts` |
| `008_battlepass.sql` | Battle pass | `seasons`, `battlepass_tiers`, `user_battlepass` |
| `009_elo_ratings.sql` | Skill ratings | `elo_ratings` |
| `010_dynamic_shop_cms.sql` | Shop CMS | `shop_rotations`, `featured_items` |
| `011_shop_preview_url.sql` | Preview URLs | `cosmetics` (column) |
| `012_playercard_type.sql` | Player cards | `cosmetics` (type) |
| `013_achievements.sql` | Achievements | `achievements`, `user_achievements` |
| `013_loadout_playercard.sql` | Loadout cards | `loadouts` (column) |
| `014_settings_tables.sql` | User settings | `user_settings` |
| `015_add_loadout_slots.sql` | Loadout slots | `loadout_slots` |
| `016_coin_purchase_system.sql` | Coin economy | `user_balances`, `transactions`, `coin_packages` |
| `017_questions_system.sql` | Questions | `questions`, `categories` |
| `018_battlepass_shop_exclusion.sql` | Shop exclusion | `cosmetics` (column) |
| `019_avatar_storage_buckets.sql` | Avatar storage | Storage buckets |
| `020_lobby_category.sql` | Lobby categories | `lobbies` (column) |
| `020_unified_stats.sql` | Unified stats | `unified_stats` |
| `021_map_selection.sql` | Map selection | `lobbies`, `maps` |
| `022_stripe_product_ids.sql` | Stripe products | `coin_packages` (column) |

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA (ERD)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │     USERS       │────────▶│    PROFILES     │         │   USER_SETTINGS │   │
│  │                 │    1:1  │                 │         │                 │   │
│  │ • id (PK)       │         │ • user_id (FK)  │◀────────│ • user_id (FK)  │   │
│  │ • email         │         │ • display_name  │    1:1  │ • audio_volume  │   │
│  │ • password_hash │         │ • avatar_url    │         │ • sfx_volume    │   │
│  │ • created_at    │         │ • bio           │         │ • controls      │   │
│  │ • last_login    │         │ • status        │         │ • quality       │   │
│  └────────┬────────┘         └─────────────────┘         └─────────────────┘   │
│           │                                                                      │
│           │ 1:N                                                                  │
│           ▼                                                                      │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │  USER_COSMETICS │◀───────▶│    COSMETICS    │◀────────│ SHOP_ROTATIONS  │   │
│  │                 │    N:1  │                 │    N:M  │                 │   │
│  │ • user_id (FK)  │         │ • id (PK)       │         │ • id (PK)       │   │
│  │ • cosmetic_id   │         │ • name          │         │ • start_date    │   │
│  │ • acquired_at   │         │ • type          │         │ • end_date      │   │
│  │ • source        │         │ • rarity        │         │ • items         │   │
│  └─────────────────┘         │ • price         │         └─────────────────┘   │
│                              │ • image_url     │                                │
│                              │ • preview_url   │                                │
│                              └─────────────────┘                                │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │    LOADOUTS     │         │  LOADOUT_SLOTS  │         │   ELO_RATINGS   │   │
│  │                 │────────▶│                 │         │                 │   │
│  │ • user_id (FK)  │    1:N  │ • loadout_id    │         │ • user_id (FK)  │   │
│  │ • name          │         │ • slot_type     │         │ • category      │   │
│  │ • is_active     │         │ • cosmetic_id   │         │ • rating        │   │
│  │ • playercard_id │         │                 │         │ • games_played  │   │
│  └─────────────────┘         └─────────────────┘         └─────────────────┘   │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │    LOBBIES      │────────▶│     GAMES       │────────▶│  GAME_ROUNDS    │   │
│  │                 │    1:1  │                 │    1:N  │                 │   │
│  │ • code (PK)     │         │ • id (PK)       │         │ • game_id (FK)  │   │
│  │ • host_id (FK)  │         │ • lobby_code    │         │ • round_number  │   │
│  │ • player_ids    │         │ • status        │         │ • question_id   │   │
│  │ • category      │         │ • winner_id     │         │ • answers       │   │
│  │ • selected_map  │         │ • final_scores  │         │ • scores        │   │
│  │ • status        │         │ • created_at    │         │                 │   │
│  └─────────────────┘         └─────────────────┘         └─────────────────┘   │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │   FRIENDSHIPS   │         │ FRIEND_REQUESTS │         │  CONVERSATIONS  │   │
│  │                 │         │                 │         │                 │   │
│  │ • user_id (FK)  │         │ • from_user (FK)│         │ • id (PK)       │   │
│  │ • friend_id (FK)│         │ • to_user (FK)  │         │ • participants  │   │
│  │ • created_at    │         │ • status        │         │ • created_at    │   │
│  │                 │         │ • created_at    │         │                 │   │
│  └─────────────────┘         └─────────────────┘         └────────┬────────┘   │
│                                                                   │            │
│                                                                   │ 1:N        │
│                                                                   ▼            │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │    SEASONS      │────────▶│ BATTLEPASS_TIERS│         │    MESSAGES     │   │
│  │                 │    1:N  │                 │         │                 │   │
│  │ • id (PK)       │         │ • season_id (FK)│         │ • conv_id (FK)  │   │
│  │ • name          │         │ • tier_number   │         │ • sender_id     │   │
│  │ • start_date    │         │ • xp_required   │         │ • content       │   │
│  │ • end_date      │         │ • free_reward   │         │ • sent_at       │   │
│  │ • is_active     │         │ • premium_reward│         │ • read_at       │   │
│  └─────────────────┘         └─────────────────┘         └─────────────────┘   │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │ USER_BATTLEPASS │         │   QUESTIONS     │         │   CATEGORIES    │   │
│  │                 │         │                 │◀────────│                 │   │
│  │ • user_id (FK)  │         │ • id (PK)       │    N:1  │ • id (PK)       │   │
│  │ • season_id (FK)│         │ • category_id   │         │ • name          │   │
│  │ • current_tier  │         │ • question_text │         │ • description   │   │
│  │ • current_xp    │         │ • answers       │         │ • icon_url      │   │
│  │ • is_premium    │         │ • correct_index │         │ • is_active     │   │
│  │ • claimed_tiers │         │ • difficulty    │         │                 │   │
│  └─────────────────┘         └─────────────────┘         └─────────────────┘   │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │  USER_BALANCES  │         │  TRANSACTIONS   │         │  COIN_PACKAGES  │   │
│  │                 │────────▶│                 │         │                 │   │
│  │ • user_id (PK)  │    1:N  │ • id (PK)       │         │ • id (PK)       │   │
│  │ • coins         │         │ • user_id (FK)  │         │ • name          │   │
│  │ • updated_at    │         │ • amount        │         │ • coins         │   │
│  │                 │         │ • type          │         │ • price_usd     │   │
│  │                 │         │ • reference_id  │         │ • stripe_id     │   │
│  │                 │         │ • created_at    │         │ • bonus_percent │   │
│  └─────────────────┘         └─────────────────┘         └─────────────────┘   │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │  ACHIEVEMENTS   │         │USER_ACHIEVEMENTS│         │  UNIFIED_STATS  │   │
│  │                 │◀────────│                 │         │                 │   │
│  │ • id (PK)       │    N:1  │ • user_id (FK)  │         │ • user_id (FK)  │   │
│  │ • name          │         │ • achievement_id│         │ • category      │   │
│  │ • description   │         │ • progress      │         │ • wins          │   │
│  │ • icon_url      │         │ • unlocked_at   │         │ • losses        │   │
│  │ • xp_reward     │         │                 │         │ • total_score   │   │
│  │ • requirements  │         │                 │         │ • avg_accuracy  │   │
│  └─────────────────┘         └─────────────────┘         └─────────────────┘   │
│                                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                               │
│  │MATCHMAKING_QUEUE│         │  DEATH_REPLAYS  │                               │
│  │                 │         │                 │                               │
│  │ • user_id (FK)  │         │ • id (PK)       │                               │
│  │ • category      │         │ • game_id (FK)  │                               │
│  │ • elo_rating    │         │ • victim_id     │                               │
│  │ • joined_at     │         │ • killer_id     │                               │
│  │ • status        │         │ • frames        │                               │
│  │                 │         │ • created_at    │                               │
│  └─────────────────┘         └─────────────────┘                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Database Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Profile | 1:1 | Each user has one profile |
| User → Settings | 1:1 | Each user has one settings record |
| User → Cosmetics | N:M | Users own multiple cosmetics |
| User → Loadouts | 1:N | Users have multiple loadouts |
| User → Friends | N:M | Bidirectional friendship |
| User → Games | N:M | Users participate in games |
| Lobby → Game | 1:1 | Each lobby creates one game |
| Game → Rounds | 1:N | Games have multiple rounds |
| Season → Tiers | 1:N | Seasons have multiple tiers |
| User → BattlePass | N:M | Users progress through seasons |
| Category → Questions | 1:N | Categories contain questions |
| User → Balance | 1:1 | Each user has one balance |
| User → Transactions | 1:N | Users have transaction history |


---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Create new account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user | No |
| `POST` | `/api/v1/auth/logout` | End session | Yes |
| `GET` | `/api/v1/auth/me` | Get current user | Yes |
| `POST` | `/api/v1/auth/refresh` | Refresh JWT token | Yes |
| `POST` | `/api/v1/auth/2fa/setup` | Setup 2FA | Yes |
| `POST` | `/api/v1/auth/2fa/verify` | Verify 2FA code | Yes |

### Lobby Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/lobbies` | Create lobby | Yes |
| `GET` | `/api/v1/lobbies/{code}` | Get lobby info | Yes |
| `POST` | `/api/v1/lobbies/{code}/join` | Join lobby | Yes |
| `DELETE` | `/api/v1/lobbies/{code}` | Leave lobby | Yes |
| `POST` | `/api/v1/lobbies/{code}/ready` | Toggle ready | Yes |
| `POST` | `/api/v1/lobbies/{code}/start` | Start game | Yes |
| `PUT` | `/api/v1/lobbies/{code}/category` | Set category | Yes |
| `PUT` | `/api/v1/lobbies/{code}/map` | Set map | Yes |

### Game Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/games/history` | Get match history | Yes |
| `GET` | `/api/v1/games/{id}` | Get game details | Yes |
| `GET` | `/api/v1/games/{id}/replay` | Get replay data | Yes |

### Matchmaking Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/matchmaking/queue` | Join queue | Yes |
| `DELETE` | `/api/v1/matchmaking/queue` | Leave queue | Yes |
| `GET` | `/api/v1/matchmaking/status` | Get queue status | Yes |

### Profile Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/profiles/me` | Get own profile | Yes |
| `PUT` | `/api/v1/profiles/me` | Update profile | Yes |
| `GET` | `/api/v1/profiles/{user_id}` | Get user profile | Yes |
| `POST` | `/api/v1/profiles/avatar` | Upload avatar | Yes |

### Cosmetics Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/cosmetics/inventory` | Get owned items | Yes |
| `GET` | `/api/v1/cosmetics/shop` | Get shop items | Yes |
| `POST` | `/api/v1/cosmetics/purchase/{id}` | Purchase item | Yes |
| `GET` | `/api/v1/cosmetics/loadout` | Get active loadout | Yes |
| `PUT` | `/api/v1/cosmetics/loadout` | Update loadout | Yes |
| `POST` | `/api/v1/cosmetics/equip/{id}` | Equip item | Yes |

### Battle Pass Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/battlepass/current` | Get current season | Yes |
| `GET` | `/api/v1/battlepass/progress` | Get user progress | Yes |
| `POST` | `/api/v1/battlepass/claim/{tier}` | Claim tier reward | Yes |
| `POST` | `/api/v1/battlepass/purchase-premium` | Buy premium pass | Yes |

### Coin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/coins/balance` | Get coin balance | Yes |
| `GET` | `/api/v1/coins/packages` | Get coin packages | Yes |
| `POST` | `/api/v1/coins/checkout` | Create checkout session | Yes |
| `GET` | `/api/v1/coins/transactions` | Get transaction history | Yes |

### Leaderboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/leaderboards` | Get all leaderboards | No |
| `GET` | `/api/v1/leaderboards/{category}` | Get category leaderboard | No |
| `GET` | `/api/v1/leaderboards/me` | Get own rankings | Yes |
| `GET` | `/api/v1/leaderboards/friends` | Get friends rankings | Yes |

### Friend Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/friends` | Get friend list | Yes |
| `POST` | `/api/v1/friends/request/{user_id}` | Send friend request | Yes |
| `POST` | `/api/v1/friends/accept/{request_id}` | Accept request | Yes |
| `POST` | `/api/v1/friends/reject/{request_id}` | Reject request | Yes |
| `DELETE` | `/api/v1/friends/{friend_id}` | Remove friend | Yes |
| `GET` | `/api/v1/friends/requests` | Get pending requests | Yes |

### Message Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/messages/conversations` | Get conversations | Yes |
| `GET` | `/api/v1/messages/{conv_id}` | Get messages | Yes |
| `POST` | `/api/v1/messages/{conv_id}` | Send message | Yes |
| `POST` | `/api/v1/messages/{conv_id}/read` | Mark as read | Yes |

### Settings Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/settings` | Get user settings | Yes |
| `PUT` | `/api/v1/settings` | Update settings | Yes |
| `PUT` | `/api/v1/settings/audio` | Update audio settings | Yes |
| `PUT` | `/api/v1/settings/video` | Update video settings | Yes |
| `PUT` | `/api/v1/settings/controls` | Update control settings | Yes |

### Stats Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/stats/me` | Get own stats | Yes |
| `GET` | `/api/v1/stats/{user_id}` | Get user stats | Yes |
| `GET` | `/api/v1/stats/me/category/{category}` | Get category stats | Yes |

### Question Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/questions/categories` | Get categories | No |
| `GET` | `/api/v1/questions/random` | Get random questions | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/admin/cosmetics` | List all cosmetics | Admin |
| `POST` | `/api/v1/admin/cosmetics` | Create cosmetic | Admin |
| `PUT` | `/api/v1/admin/cosmetics/{id}` | Update cosmetic | Admin |
| `DELETE` | `/api/v1/admin/cosmetics/{id}` | Delete cosmetic | Admin |
| `GET` | `/api/v1/admin/rotations` | List rotations | Admin |
| `POST` | `/api/v1/admin/rotations` | Create rotation | Admin |
| `PUT` | `/api/v1/admin/rotations/{id}` | Update rotation | Admin |

---

## WebSocket Protocol

### Connection

```
WebSocket URL: wss://api.1v1bro.com/ws/{lobby_code}?token={jwt_token}
```

### Message Format

```json
{
  "type": "event_type",
  "payload": { ... },
  "timestamp": 1702000000000
}
```

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby_state` | `{ players, host, status, category, map }` | Full lobby state |
| `player_joined` | `{ player_id, display_name, avatar }` | Player joined lobby |
| `player_left` | `{ player_id }` | Player left lobby |
| `player_ready` | `{ player_id, is_ready }` | Ready status changed |
| `game_start` | `{ game_id, players, map }` | Game starting |
| `question` | `{ question, answers, time_limit }` | New question |
| `round_result` | `{ scores, correct_answer, player_answers }` | Round ended |
| `game_end` | `{ winner, final_scores, xp_earned }` | Game ended |
| `position_update` | `{ player_id, x, y, velocity }` | Player moved |
| `powerup_spawned` | `{ id, type, position }` | Power-up appeared |
| `powerup_collected` | `{ player_id, powerup_id, type }` | Power-up grabbed |
| `powerup_used` | `{ player_id, type, target_id }` | Power-up activated |
| `damage_dealt` | `{ attacker_id, victim_id, damage, weapon }` | Damage event |
| `player_death` | `{ victim_id, killer_id, position }` | Player died |
| `player_respawn` | `{ player_id, position }` | Player respawned |
| `emote_played` | `{ player_id, emote_id }` | Emote displayed |
| `match_found` | `{ lobby_code, opponent }` | Match found in queue |
| `error` | `{ code, message }` | Error occurred |

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | `{ is_ready }` | Toggle ready status |
| `start_game` | `{}` | Host starts game |
| `answer` | `{ answer_index, time_ms }` | Submit answer |
| `position_update` | `{ x, y, velocity }` | Player movement |
| `collect_powerup` | `{ powerup_id }` | Collect power-up |
| `use_powerup` | `{ type, target_id? }` | Use power-up |
| `attack` | `{ weapon, direction }` | Attack action |
| `play_emote` | `{ emote_id }` | Play emote |
| `join_queue` | `{ category }` | Join matchmaking |
| `leave_queue` | `{}` | Leave matchmaking |
| `ping` | `{ timestamp }` | Latency check |

### Event Flow Diagrams

#### Lobby Flow
```
Client A                    Server                    Client B
   │                          │                          │
   │──── create_lobby ───────▶│                          │
   │◀─── lobby_state ─────────│                          │
   │                          │                          │
   │                          │◀──── join_lobby ─────────│
   │◀─── player_joined ───────│──── lobby_state ────────▶│
   │                          │                          │
   │──── ready ──────────────▶│                          │
   │◀─── player_ready ────────│──── player_ready ───────▶│
   │                          │                          │
   │                          │◀──── ready ──────────────│
   │◀─── player_ready ────────│──── player_ready ───────▶│
   │                          │                          │
   │──── start_game ─────────▶│                          │
   │◀─── game_start ──────────│──── game_start ─────────▶│
   │                          │                          │
```

#### Game Flow
```
Client A                    Server                    Client B
   │                          │                          │
   │◀─── question ────────────│──── question ───────────▶│
   │                          │                          │
   │──── position_update ────▶│                          │
   │                          │──── position_update ────▶│
   │                          │                          │
   │                          │◀──── position_update ────│
   │◀─── position_update ─────│                          │
   │                          │                          │
   │──── answer ─────────────▶│                          │
   │                          │◀──── answer ─────────────│
   │                          │                          │
   │◀─── round_result ────────│──── round_result ───────▶│
   │                          │                          │
   │        ... (15 rounds) ...                          │
   │                          │                          │
   │◀─── game_end ────────────│──── game_end ───────────▶│
   │                          │                          │
```


---

## Game Engine

### Arena Maps

#### Cyber Arena (Default)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CYBER ARENA MAP                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────┐                                                         ┌─────┐       │
│   │ P1  │                                                         │ P2  │       │
│   │Spawn│                                                         │Spawn│       │
│   └─────┘                                                         └─────┘       │
│                                                                                  │
│        ┌───────┐                                    ┌───────┐                   │
│        │Barrier│                                    │Barrier│                   │
│        └───────┘                                    └───────┘                   │
│                                                                                  │
│   [PWR]                    ┌─────────────┐                    [PWR]             │
│                            │             │                                       │
│                            │   CENTRAL   │                                       │
│        ┌───────┐           │     HUB     │           ┌───────┐                  │
│        │Barrier│           │  (Contest)  │           │Barrier│                  │
│        └───────┘           │             │           └───────┘                  │
│                            └─────────────┘                                       │
│   [PWR]                                                        [PWR]             │
│                                                                                  │
│        ┌───────┐                                    ┌───────┐                   │
│        │Barrier│                                    │Barrier│                   │
│        └───────┘                                    └───────┘                   │
│                                                                                  │
│   [PWR]                                                        [PWR]             │
│                                                                                  │
│   Legend: [PWR] = Power-up Spawn                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Volcanic Vortex Map
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VOLCANIC VORTEX MAP                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────┐     ████████████████████████████████████████     ┌─────┐             │
│   │ P1  │     █                                      █     │ P2  │             │
│   │Spawn│     █   ┌────────────────────────────┐    █     │Spawn│             │
│   └─────┘     █   │                            │    █     └─────┘             │
│               █   │    ╔════════════════╗      │    █                         │
│   [JUMP]      █   │    ║  LAVA VORTEX   ║      │    █      [JUMP]             │
│               █   │    ║    (Hazard)    ║      │    █                         │
│   ┌───────┐   █   │    ╚════════════════╝      │    █   ┌───────┐             │
│   │ Lava  │   █   │                            │    █   │ Lava  │             │
│   │ Pool  │   █   └────────────────────────────┘    █   │ Pool  │             │
│   └───────┘   █                                      █   └───────┘             │
│               ████████████████████████████████████████                         │
│                                                                                  │
│   [PWR]       ┌─────────┐              ┌─────────┐       [PWR]                 │
│               │  Rock   │              │  Rock   │                             │
│               │ Barrier │              │ Barrier │                             │
│   [TELE]──────┤         │              │         ├──────[TELE]                 │
│               └─────────┘              └─────────┘                             │
│                                                                                  │
│   ┌───────┐                ┌────────┐                ┌───────┐                 │
│   │ Trap  │                │ Moving │                │ Trap  │                 │
│   │ Zone  │                │Platform│                │ Zone  │                 │
│   └───────┘                └────────┘                └───────┘                 │
│                                                                                  │
│   [PWR]                                                        [PWR]             │
│                                                                                  │
│   Legend: [PWR] = Power-up, [JUMP] = Jump Pad, [TELE] = Teleporter             │
│           ████ = Lava Wall (Damage), ╔══╗ = Vortex (Pull Effect)               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Power-Up System

| Power-Up | Effect | Duration | Cooldown |
|----------|--------|----------|----------|
| **SOS** | Eliminates 2 wrong answers | Instant | Once per game |
| **Time Steal** | Adds 5 seconds to opponent's timer | Instant | 30 seconds |
| **Shield** | Blocks next Time Steal | Until used | 45 seconds |
| **Double Points** | 2x score for next question | 1 question | 60 seconds |
| **EMP** | Disables opponent's power-ups | 10 seconds | 90 seconds |
| **Speed Boost** | 50% movement speed increase | 8 seconds | 20 seconds |

### Combat System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            COMBAT SYSTEM                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HEALTH SYSTEM                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Base Health: 100 HP                                                     │    │
│  │  Regeneration: 5 HP/second (out of combat for 5 seconds)                │    │
│  │  Respawn Time: 3 seconds                                                 │    │
│  │  Respawn Invulnerability: 2 seconds                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  DAMAGE SOURCES                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Projectile Hit: 25 damage                                               │    │
│  │  Melee Attack: 15 damage                                                 │    │
│  │  Lava/Hazard: 10 damage/second                                          │    │
│  │  Trap Activation: 20 damage                                              │    │
│  │  Fall Damage: 5-30 damage (based on height)                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  BUFF/DEBUFF SYSTEM                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Speed Boost: +50% movement speed (8s)                                   │    │
│  │  Slow: -30% movement speed (5s)                                          │    │
│  │  Stun: Cannot move or attack (2s)                                        │    │
│  │  Shield: Absorbs next 50 damage                                          │    │
│  │  Damage Boost: +25% damage dealt (10s)                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Scoring System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SCORING FORMULA                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BASE SCORE = 1000 - (answer_time_ms / 30)                                      │
│                                                                                  │
│  MODIFIERS:                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Correct Answer: Base Score                                              │    │
│  │  Wrong Answer: 0 points                                                  │    │
│  │  Double Points Active: Base Score × 2                                    │    │
│  │  Streak Bonus (3+): +50 points per streak level                         │    │
│  │  First Blood (first correct): +100 points                               │    │
│  │  Comeback (behind by 2000+): +150 points                                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  EXAMPLES:                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Answer in 0ms:    1000 - (0/30)     = 1000 points                      │    │
│  │  Answer in 5s:     1000 - (5000/30)  = 833 points                       │    │
│  │  Answer in 15s:    1000 - (15000/30) = 500 points                       │    │
│  │  Answer in 30s:    1000 - (30000/30) = 0 points                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  TIEBREAKER: Total answer time (faster wins)                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### XP & Progression System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          XP & PROGRESSION                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  XP SOURCES                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Game Completion: 100 XP                                                 │    │
│  │  Win Bonus: +150 XP                                                      │    │
│  │  Per Correct Answer: 10 XP                                               │    │
│  │  Perfect Round (all correct): +50 XP                                     │    │
│  │  First Win of Day: +200 XP                                               │    │
│  │  Achievement Unlock: 50-500 XP (varies)                                  │    │
│  │  Daily Challenge: 100-300 XP                                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  BATTLE PASS TIERS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Tier 1-10:   500 XP per tier                                           │    │
│  │  Tier 11-30:  750 XP per tier                                           │    │
│  │  Tier 31-50:  1000 XP per tier                                          │    │
│  │  Tier 51-100: 1500 XP per tier                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  TIER REWARDS                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Free Track: Coins, basic cosmetics, emotes                             │    │
│  │  Premium Track: Exclusive skins, player cards, premium emotes           │    │
│  │  Every 10 Tiers: Featured cosmetic item                                 │    │
│  │  Tier 100: Legendary exclusive reward                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Infrastructure

### Backend Tests

```
backend/tests/
├── conftest.py                    # Shared fixtures
│
├── integration/                   # Integration Tests (14 files)
│   ├── test_auth_flow.py          # Authentication flow
│   ├── test_battlepass_flow.py    # Battle pass progression
│   ├── test_cosmetics_flow.py     # Cosmetic purchase/equip
│   ├── test_elo_flow.py           # ELO rating changes
│   ├── test_event_flow.py         # Event system
│   ├── test_friend_flow.py        # Friend system
│   ├── test_game_flow.py          # Full game flow
│   ├── test_item_lifecycle.py     # Item lifecycle
│   ├── test_lobby_flow.py         # Lobby creation/join
│   ├── test_message_flow.py       # Messaging
│   ├── test_profile_flow.py       # Profile updates
│   ├── test_unified_progression.py # XP/progression
│   └── test_websocket_flow.py     # WebSocket events
│
├── property/                      # Property-Based Tests (33 files)
│   ├── test_api.py                # API response properties
│   ├── test_arena_authority.py    # Server authority
│   ├── test_auth.py               # Auth properties
│   ├── test_auth_enhanced.py      # Enhanced auth
│   ├── test_battlepass.py         # Battle pass properties
│   ├── test_cache.py              # Cache properties
│   ├── test_combat_tracker.py     # Combat tracking
│   ├── test_cosmetics.py          # Cosmetic properties
│   ├── test_dynamic_shop_cms.py   # Shop CMS
│   ├── test_elo.py                # ELO calculations
│   ├── test_emote_system.py       # Emote system
│   ├── test_events.py             # Event properties
│   ├── test_game.py               # Game logic
│   ├── test_leaderboards.py       # Leaderboard properties
│   ├── test_lobby.py              # Lobby properties
│   ├── test_map_selection.py      # Map selection
│   ├── test_matchmaking.py        # Matchmaking
│   ├── test_matchmaking_category.py # Category matching
│   ├── test_migrations.py         # Migration properties
│   ├── test_nfl_category_events.py # NFL category
│   ├── test_nfl_parser.py         # NFL question parser
│   ├── test_powerups.py           # Power-up properties
│   ├── test_profiles.py           # Profile properties
│   ├── test_progression.py        # Progression properties
│   ├── test_responses.py          # Response properties
│   ├── test_schemas.py            # Schema validation
│   ├── test_services.py           # Service properties
│   ├── test_settings.py           # Settings properties
│   ├── test_stats.py              # Stats properties
│   ├── test_tick_system.py        # Tick system
│   ├── test_unified_stats.py      # Unified stats
│   └── test_ws_messages.py        # WebSocket messages
│
└── unit/                          # Unit Tests (12 files)
    ├── test_buff_system.py        # Buff calculations
    ├── test_connection_manager.py # WS connections
    ├── test_health.py             # Health endpoint
    ├── test_lobby_cache.py        # Lobby caching
    ├── test_profile_repo.py       # Profile repository
    ├── test_profile_schemas.py    # Profile schemas
    ├── test_profile_service.py    # Profile service
    ├── test_rate_limit.py         # Rate limiting
    ├── test_replay_service.py     # Replay service
    └── test_storage_service.py    # Storage service
```

### Frontend Tests

```
frontend/src/
├── __tests__/
│   └── integration/               # Integration tests
│
├── components/
│   ├── battlepass/battlepass.test.ts
│   ├── dashboard/dashboard.test.ts
│   ├── game/Timer.test.tsx
│   ├── inventory/enterprise/inventory.test.tsx
│   ├── leaderboard/leaderboard.test.ts
│   ├── lobby/HeadToHeadDisplay.test.tsx
│   ├── lobby/PlayerCardBanner.test.tsx
│   ├── matchmaking/__tests__/
│   ├── profile/profile.test.ts
│   ├── settings/enterprise/settings.test.tsx
│   ├── shop/shop.test.ts
│   ├── ui/ServerBusyModal.test.tsx
│   └── ui/ui.test.ts
│
├── game/
│   ├── __tests__/e2e/
│   ├── arena/arena.test.ts
│   ├── arena/DynamicSpawnManager.test.ts
│   ├── assets/DynamicAssetLoader.test.ts
│   ├── assets/ImageProcessor.test.ts
│   ├── backdrop/__tests__/volcanic-theme.test.ts
│   ├── barriers/barriers.test.ts
│   ├── combat/CombatSystem.test.ts
│   ├── combat/HealthManager.test.ts
│   ├── combat/ProjectileManager.test.ts
│   ├── combat/RespawnManager.test.ts
│   ├── combat/WeaponManager.test.ts
│   ├── config/maps/__tests__/map-loader.test.ts
│   ├── config/maps/__tests__/vortex-arena.test.ts
│   ├── emotes/emotes.test.ts
│   ├── renderers/CombatEffectsRenderer.test.ts
│   ├── telemetry/ReplayPlayer.test.ts
│   ├── telemetry/TelemetryRecorder.test.ts
│   ├── telemetry/telemetry-e2e.test.ts
│   └── visual/__tests__/
│       ├── animation-system.test.ts
│       ├── lighting-system.test.ts
│       ├── prop-system.test.ts
│       ├── quality-manager.test.ts
│       ├── tile-art-system.test.ts
│       └── visual-hierarchy.test.ts
│
├── services/
│   ├── api.test.ts
│   └── websocket.test.ts
│
├── stores/
│   ├── authStore.test.ts
│   ├── gameStore.test.ts
│   └── lobbyStore.test.ts
│
├── styles/
│   ├── accessibility.test.ts
│   └── design-system.test.ts
│
├── types/
│   └── leaderboard.test.ts
│
└── utils/
    └── helpers.test.ts
```

### Test Commands

```bash
# Backend
cd backend
pytest                              # Run all tests
pytest tests/unit/                  # Unit tests only
pytest tests/integration/           # Integration tests only
pytest tests/property/              # Property-based tests only
pytest -v --tb=short               # Verbose with short traceback
pytest --cov=app                   # With coverage

# Frontend
cd frontend
npm run test                        # Run all tests
npm run test:watch                  # Watch mode
npm run test:coverage              # With coverage
```


---

## Deployment

### Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=${REDIS_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=${API_URL}
      - VITE_WS_URL=${WS_URL}

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Environment Variables

#### Backend (.env)
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false
CORS_ORIGINS=https://1v1bro.com
```

#### Frontend (.env)
```bash
VITE_API_URL=https://api.1v1bro.com
VITE_WS_URL=wss://api.1v1bro.com/ws
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
```

### Cloud Run Deployment

```yaml
# backend/deploy/cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: 1v1bro-api
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: gcr.io/PROJECT_ID/1v1bro-api
          ports:
            - containerPort: 8000
          resources:
            limits:
              cpu: "2"
              memory: "2Gi"
          env:
            - name: SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: supabase-credentials
                  key: url
```

---

## Scripts & Utilities

### Available Scripts

| Script | Description |
|--------|-------------|
| `scripts/seed_questions.py` | Seed trivia questions |
| `scripts/seed_season.py` | Create battle pass season |
| `scripts/seed_battlepass_season1.py` | Seed Season 1 data |
| `scripts/seed_cosmetics_battlepass.py` | Seed cosmetic rewards |
| `scripts/seed_dynamic_cosmetics.py` | Seed shop cosmetics |
| `scripts/parse_nfl_questions.py` | Parse NFL trivia |
| `scripts/parse_ch1_5_questions.py` | Parse Fortnite Ch1-5 |
| `scripts/parse_chapter6_questions.py` | Parse Fortnite Ch6 |
| `scripts/generate_fortnite_questions.py` | Generate questions |
| `scripts/migrate_tier_zero_users.py` | Migration utility |
| `scripts/check_cosmetic.py` | Verify cosmetics |
| `scripts/check_db.py` | Database health check |
| `scripts/cleanup_fake_cosmetics.py` | Clean test data |
| `scripts/start.sh` | Start development |

### Makefile Commands

```makefile
# Development
make dev           # Start development servers
make backend       # Start backend only
make frontend      # Start frontend only

# Testing
make test          # Run all tests
make test-backend  # Backend tests only
make test-frontend # Frontend tests only
make coverage      # Generate coverage report

# Database
make migrate       # Run migrations
make seed          # Seed database
make reset-db      # Reset database

# Docker
make build         # Build containers
make up            # Start containers
make down          # Stop containers
make logs          # View logs

# Deployment
make deploy        # Deploy to production
make deploy-staging # Deploy to staging
```

---

## Feature Specifications

### Implemented Specs (`.kiro/specs/`)

| Spec | Status | Description |
|------|--------|-------------|
| `aaa-arena-system` | ✅ Complete | Arena game system |
| `aaa-arena-visual-system` | ✅ Complete | Visual effects system |
| `arena-design` | ✅ Complete | Arena layout design |
| `arena-e2e-testing` | ✅ Complete | End-to-end tests |
| `arena-redesign` | ✅ Complete | Arena improvements |
| `arena-server-authority-audit` | ✅ Complete | Server authority |
| `battlepass-enterprise-upgrade` | ✅ Complete | Battle pass system |
| `coin-purchase-system` | ✅ Complete | Coin economy |
| `dashboard-redesign` | ✅ Complete | Dashboard UI |
| `dynamic-shop-cms` | ✅ Complete | Shop CMS |
| `emote-system` | ✅ Complete | Emote system |
| `frontend-2025-redesign` | ✅ Complete | UI redesign |
| `inventory-enterprise-redesign` | ✅ Complete | Inventory system |
| `inventory-loadout-playercard-fix` | ✅ Complete | Loadout fixes |
| `launch-scaling` | ✅ Complete | Scaling prep |
| `leaderboard-stats-audit` | ✅ Complete | Stats audit |
| `lobby-playercard-redesign` | ✅ Complete | Lobby UI |
| `map-selection` | ✅ Complete | Map selection |
| `matchmaking-queue` | ✅ Complete | Matchmaking |
| `nfl-trivia-category` | ✅ Complete | NFL category |
| `player-stats-leaderboards` | ✅ Complete | Leaderboards |
| `profile-enterprise-upgrade` | ✅ Complete | Profile system |
| `pvp-combat` | ✅ Complete | Combat system |
| `settings-enterprise-system` | ✅ Complete | Settings |
| `telemetry-replay` | ✅ Complete | Replay system |
| `trivia-battle-frontend` | ✅ Complete | Quiz UI |
| `trivia-battle-mvp` | ✅ Complete | Core quiz |
| `unified-progression-system` | ✅ Complete | XP system |
| `unified-stats-leaderboard` | ✅ Complete | Stats system |
| `user-services-microservices` | ✅ Complete | User services |
| `vortex-arena-map` | ✅ Complete | Volcanic map |
| `vortex-visual-theme` | ✅ Complete | Volcanic theme |
| `2025-landing-page` | ✅ Complete | Landing page |

---

## Project Statistics

### Codebase Metrics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~50,000+ |
| Backend Python Files | 100+ |
| Frontend TypeScript Files | 200+ |
| Database Migrations | 22 |
| API Endpoints | 60+ |
| WebSocket Events | 30+ |
| React Components | 150+ |
| Custom Hooks | 25 |
| Zustand Stores | 12 |
| Game Engine Systems | 25+ |
| Backend Tests | 59 files |
| Frontend Tests | 40+ files |
| Spec Documents | 33 |

### Technology Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND                          BACKEND                                       │
│  ┌─────────────────────────┐      ┌─────────────────────────┐                   │
│  │ React 19.2.0            │      │ FastAPI 0.109.0+        │                   │
│  │ TypeScript 5.9.3        │      │ Python 3.11+            │                   │
│  │ Vite 7.2.4              │      │ Pydantic 2.5.0+         │                   │
│  │ Tailwind CSS 4.1.17     │      │ Supabase 2.3.0+         │                   │
│  │ Zustand 5.0.9           │      │ Redis 5.0.0+            │                   │
│  │ Framer Motion 12.23.25  │      │ Stripe 7.0.0+           │                   │
│  │ React Router 7.10.0     │      │ WebSockets 12.0+        │                   │
│  └─────────────────────────┘      └─────────────────────────┘                   │
│                                                                                  │
│  TESTING                           INFRASTRUCTURE                                │
│  ┌─────────────────────────┐      ┌─────────────────────────┐                   │
│  │ Vitest 4.0.15           │      │ Docker                  │                   │
│  │ fast-check 4.3.0        │      │ Google Cloud Run        │                   │
│  │ pytest                  │      │ Supabase (PostgreSQL)   │                   │
│  │ Hypothesis              │      │ Redis Cloud             │                   │
│  │ Testing Library         │      │ Stripe Payments         │                   │
│  └─────────────────────────┘      └─────────────────────────┘                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Development URLs

| Service | URL |
|---------|-----|
| Frontend Dev | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| WebSocket | ws://localhost:8000/ws |
| Arena Test | http://localhost:5173/arena-test |

### Key Files

| Purpose | File |
|---------|------|
| Backend Entry | `backend/app/main.py` |
| Frontend Entry | `frontend/src/main.tsx` |
| API Router | `backend/app/api/v1/router.py` |
| WS Manager | `backend/app/websocket/manager.py` |
| Game Engine | `frontend/src/game/GameEngine.ts` |
| Auth Store | `frontend/src/stores/authStore.ts` |
| API Client | `frontend/src/services/api.ts` |
| WS Client | `frontend/src/services/websocket.ts` |

---

*Document Generated: December 8, 2025*  
*Version: 2.0 Enterprise*  
*Repository: https://github.com/dadbodgeoff/1v1bro*
