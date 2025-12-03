# Design Document

## Overview

This document outlines the technical design for the 1v1 Trivia Battle frontend — a 2D animated game experience built with React, TypeScript, and Phaser.js. The frontend delivers an immersive, always-active game world where trivia questions appear as overlays rather than interrupting gameplay.

The architecture separates concerns between the React application layer (routing, auth, state management) and the Phaser game engine (rendering, physics, animation). Communication with the backend occurs via REST API for auth/lobby operations and WebSocket for real-time game synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              React Application                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Router    │  │   Zustand   │  │  React      │  │   Hooks     │        │
│  │  (Routes)   │  │   (State)   │  │  Query      │  │  (Custom)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                         Page Components                         │        │
│  │  Home │ Login │ Register │ Lobby │ Game │ Results │ Profile    │        │
│  └────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────┐
│         Phaser Game Engine       │   │           WebSocket Layer           │
│  ┌───────────┐  ┌───────────┐   │   │  ┌───────────┐  ┌───────────┐      │
│  │   Scenes  │  │  Sprites  │   │   │  │  Manager  │  │  Events   │      │
│  │  (World)  │  │ (Players) │   │   │  │(Connect)  │  │ (Handle)  │      │
│  └───────────┘  └───────────┘   │   │  └───────────┘  └───────────┘      │
│  ┌───────────┐  ┌───────────┐   │   └─────────────────────────────────────┘
│  │  Physics  │  │   Input   │   │
│  │(Collision)│  │ (Controls)│   │
│  └───────────┘  └───────────┘   │
└─────────────────────────────────┘
```

## Project Structure

```
frontend/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── icons/                     # App icons (192, 512)
│   └── assets/
│       ├── sprites/
│       │   ├── characters/        # Player sprite sheets
│       │   ├── items/             # Power-up sprites
│       │   ├── tiles/             # Map tile sets
│       │   └── effects/           # Particle effects
│       ├── audio/
│       │   ├── music/             # Background tracks
│       │   └── sfx/               # Sound effects
│       └── maps/
│           └── arena.json         # Tiled map export
├── src/
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component with router
│   ├── vite-env.d.ts              # Vite type declarations
│   │
│   ├── pages/
│   │   ├── Home.tsx               # Landing page
│   │   ├── Login.tsx              # Login form
│   │   ├── Register.tsx           # Registration form
│   │   ├── Lobby.tsx              # Lobby waiting room
│   │   ├── Game.tsx               # Main game container
│   │   ├── Results.tsx            # Post-game results
│   │   └── Profile.tsx            # User profile/history
│   │
│   ├── components/
│   │   ├── ui/                    # Generic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Toast.tsx
│   │   ├── game/                  # Game-specific UI
│   │   │   ├── QuestionOverlay.tsx
│   │   │   ├── Scoreboard.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── PowerUpBar.tsx
│   │   │   ├── MiniMap.tsx
│   │   │   ├── OpponentIndicator.tsx
│   │   │   └── CountdownOverlay.tsx
│   │   ├── lobby/
│   │   │   ├── LobbyCode.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   └── WaitingAnimation.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── GameLayout.tsx
│   │
│   ├── game/                      # Phaser game code
│   │   ├── config.ts              # Phaser configuration
│   │   ├── PhaserGame.tsx         # React-Phaser bridge component
│   │   ├── scenes/
│   │   │   ├── BootScene.ts       # Asset preloading
│   │   │   ├── MenuScene.ts       # Main menu (if needed)
│   │   │   ├── GameScene.ts       # Main gameplay scene
│   │   │   └── UIScene.ts         # HUD overlay scene
│   │   ├── sprites/
│   │   │   ├── Player.ts          # Player character class
│   │   │   ├── Opponent.ts        # Opponent character class
│   │   │   └── PowerUp.ts         # Collectible item class
│   │   ├── systems/
│   │   │   ├── InputManager.ts    # Keyboard/touch input
│   │   │   ├── CollisionManager.ts # Physics collisions
│   │   │   └── CameraManager.ts   # Camera follow/bounds
│   │   └── utils/
│   │       ├── animations.ts      # Animation definitions
│   │       └── constants.ts       # Game constants
│   │
│   ├── hooks/
│   │   ├── useAuth.ts             # Authentication hook
│   │   ├── useWebSocket.ts        # WebSocket connection hook
│   │   ├── useGame.ts             # Game state hook
│   │   ├── useLobby.ts            # Lobby operations hook
│   │   ├── useAudio.ts            # Audio management hook
│   │   └── useGameBridge.ts       # React-Phaser communication
│   │
│   ├── stores/
│   │   ├── authStore.ts           # Auth state (Zustand)
│   │   ├── gameStore.ts           # Game state (Zustand)
│   │   ├── lobbyStore.ts          # Lobby state (Zustand)
│   │   └── settingsStore.ts       # User preferences
│   │
│   ├── services/
│   │   ├── api.ts                 # REST API client
│   │   ├── websocket.ts           # WebSocket client
│   │   └── storage.ts             # Local storage wrapper
│   │
│   ├── types/
│   │   ├── api.ts                 # API response types
│   │   ├── game.ts                # Game state types
│   │   ├── websocket.ts           # WebSocket message types
│   │   └── phaser.d.ts            # Phaser type extensions
│   │
│   ├── utils/
│   │   ├── constants.ts           # App constants
│   │   ├── helpers.ts             # Utility functions
│   │   └── validators.ts          # Form validation
│   │
│   └── styles/
│       ├── globals.css            # Global styles
│       ├── variables.css          # CSS custom properties
│       └── animations.css         # Keyframe animations
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Components and Interfaces

### Core Configuration

#### Vite Configuration (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: '1v1 Bro - Trivia Battle',
        short_name: '1v1 Bro',
        description: 'Real-time 1v1 trivia battles',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
});
```

#### Phaser Configuration (game/config.ts)
```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [BootScene, GameScene, UIScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
};

export const GAME_CONSTANTS = {
  PLAYER_SPEED: 200,
  TILE_SIZE: 32,
  MAP_WIDTH: 60,  // tiles
  MAP_HEIGHT: 40, // tiles
  POWERUP_SPAWN_INTERVAL: 15000, // ms
  POSITION_SYNC_INTERVAL: 100,   // ms
  INTERPOLATION_SPEED: 0.15,
};
```

### State Management

#### Auth Store (stores/authStore.ts)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  gamesPlayed: number;
  gamesWon: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: '1v1bro-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

#### Game Store (stores/gameStore.ts)
```typescript
import { create } from 'zustand';

interface PlayerState {
  id: string;
  displayName: string | null;
  score: number;
  position: { x: number; y: number };
  inventory: PowerUpType[];
  isConnected: boolean;
  lastAnswer: { correct: boolean; score: number } | null;
}

interface Question {
  qNum: number;
  text: string;
  options: string[];
  startTime: number;
}

type PowerUpType = 'sos' | 'time_steal' | 'shield' | 'double_points';

interface GameState {
  // Game session
  lobbyId: string | null;
  status: 'idle' | 'waiting' | 'countdown' | 'playing' | 'round_result' | 'finished';
  
  // Players
  localPlayer: PlayerState | null;
  opponent: PlayerState | null;
  
  // Question state
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  answerSubmitted: boolean;
  eliminatedOptions: string[]; // For SOS power-up
  
  // Round results
  roundResult: {
    correctAnswer: string;
    localScore: number;
    opponentScore: number;
  } | null;
  
  // Final results
  finalResult: {
    winnerId: string | null;
    isTie: boolean;
    localScore: number;
    opponentScore: number;
  } | null;
  
  // Power-ups on map
  mapPowerUps: Array<{ id: string; type: PowerUpType; x: number; y: number }>;
  
  // Actions
  setLobbyId: (id: string) => void;
  setStatus: (status: GameState['status']) => void;
  setLocalPlayer: (player: PlayerState) => void;
  setOpponent: (player: PlayerState | null) => void;
  updatePlayerPosition: (playerId: string, x: number, y: number) => void;
  setQuestion: (question: Question) => void;
  selectAnswer: (answer: string) => void;
  submitAnswer: () => void;
  setRoundResult: (result: GameState['roundResult']) => void;
  setFinalResult: (result: GameState['finalResult']) => void;
  addPowerUp: (powerUp: GameState['mapPowerUps'][0]) => void;
  removePowerUp: (id: string) => void;
  collectPowerUp: (playerId: string, type: PowerUpType) => void;
  usePowerUp: (type: PowerUpType) => void;
  eliminateOptions: (options: string[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  lobbyId: null,
  status: 'idle',
  localPlayer: null,
  opponent: null,
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 15,
  selectedAnswer: null,
  answerSubmitted: false,
  eliminatedOptions: [],
  roundResult: null,
  finalResult: null,
  mapPowerUps: [],
  
  setLobbyId: (lobbyId) => set({ lobbyId }),
  setStatus: (status) => set({ status }),
  setLocalPlayer: (localPlayer) => set({ localPlayer }),
  setOpponent: (opponent) => set({ opponent }),
  
  updatePlayerPosition: (playerId, x, y) => set((state) => {
    if (state.localPlayer?.id === playerId) {
      return { localPlayer: { ...state.localPlayer, position: { x, y } } };
    }
    if (state.opponent?.id === playerId) {
      return { opponent: { ...state.opponent, position: { x, y } } };
    }
    return state;
  }),
  
  setQuestion: (question) => set({
    currentQuestion: question,
    questionNumber: question.qNum,
    selectedAnswer: null,
    answerSubmitted: false,
    eliminatedOptions: [],
    roundResult: null,
  }),
  
  selectAnswer: (answer) => set({ selectedAnswer: answer }),
  submitAnswer: () => set({ answerSubmitted: true }),
  
  setRoundResult: (roundResult) => set({ roundResult, status: 'round_result' }),
  setFinalResult: (finalResult) => set({ finalResult, status: 'finished' }),
  
  addPowerUp: (powerUp) => set((state) => ({
    mapPowerUps: [...state.mapPowerUps, powerUp],
  })),
  
  removePowerUp: (id) => set((state) => ({
    mapPowerUps: state.mapPowerUps.filter((p) => p.id !== id),
  })),
  
  collectPowerUp: (playerId, type) => set((state) => {
    const updateInventory = (player: PlayerState | null) => {
      if (!player || player.id !== playerId) return player;
      if (player.inventory.length >= 3) return player; // Max 3 power-ups
      return { ...player, inventory: [...player.inventory, type] };
    };
    return {
      localPlayer: updateInventory(state.localPlayer),
      opponent: updateInventory(state.opponent),
    };
  }),
  
  usePowerUp: (type) => set((state) => {
    if (!state.localPlayer) return state;
    const index = state.localPlayer.inventory.indexOf(type);
    if (index === -1) return state;
    const newInventory = [...state.localPlayer.inventory];
    newInventory.splice(index, 1);
    return {
      localPlayer: { ...state.localPlayer, inventory: newInventory },
    };
  }),
  
  eliminateOptions: (options) => set({ eliminatedOptions: options }),
  
  reset: () => set({
    lobbyId: null,
    status: 'idle',
    localPlayer: null,
    opponent: null,
    currentQuestion: null,
    questionNumber: 0,
    selectedAnswer: null,
    answerSubmitted: false,
    eliminatedOptions: [],
    roundResult: null,
    finalResult: null,
    mapPowerUps: [],
  }),
}));
```

### WebSocket Layer

#### WebSocket Service (services/websocket.ts)
```typescript
import { useAuthStore } from '../stores/authStore';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private lobbyCode: string | null = null;

  connect(lobbyCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().token;
      if (!token) {
        reject(new Error('Not authenticated'));
        return;
      }

      this.lobbyCode = lobbyCode;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${lobbyCode}?token=${token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.dispatch(message.type, message.payload);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.lobbyCode) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        if (this.lobbyCode) {
          this.connect(this.lobbyCode).catch(console.error);
        }
      }, delay);
    } else {
      this.dispatch('connection_lost', {});
    }
  }

  disconnect() {
    this.lobbyCode = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: string, payload?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected, cannot send:', type);
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  private dispatch(type: string, payload: any) {
    this.handlers.get(type)?.forEach((handler) => handler(payload));
    this.handlers.get('*')?.forEach((handler) => handler({ type, payload }));
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
```

#### WebSocket Hook (hooks/useWebSocket.ts)
```typescript
import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket';
import { useGameStore } from '../stores/gameStore';

export function useWebSocket(lobbyCode: string | null) {
  const {
    setStatus,
    setOpponent,
    setQuestion,
    setRoundResult,
    setFinalResult,
    updatePlayerPosition,
    addPowerUp,
    removePowerUp,
    collectPowerUp,
    eliminateOptions,
  } = useGameStore();

  useEffect(() => {
    if (!lobbyCode) return;

    wsService.connect(lobbyCode).catch(console.error);

    // Player events
    const unsubPlayerJoined = wsService.on('player_joined', (data) => {
      if (data.opponent) {
        setOpponent({
          id: data.opponent.id,
          displayName: data.opponent.display_name,
          score: 0,
          position: { x: 400, y: 300 },
          inventory: [],
          isConnected: true,
          lastAnswer: null,
        });
      }
    });

    const unsubPlayerLeft = wsService.on('player_left', () => {
      setOpponent(null);
    });

    // Game flow events
    const unsubGameStart = wsService.on('game_start', () => {
      setStatus('countdown');
    });

    const unsubQuestion = wsService.on('question', (data) => {
      setQuestion({
        qNum: data.q_num,
        text: data.text,
        options: data.options,
        startTime: data.start_time,
      });
      setStatus('playing');
    });

    const unsubRoundResult = wsService.on('round_result', (data) => {
      setRoundResult({
        correctAnswer: data.correct_answer,
        localScore: data.scores[useGameStore.getState().localPlayer?.id || ''] || 0,
        opponentScore: data.scores[useGameStore.getState().opponent?.id || ''] || 0,
      });
    });

    const unsubGameEnd = wsService.on('game_end', (data) => {
      setFinalResult({
        winnerId: data.winner_id,
        isTie: data.is_tie,
        localScore: data.final_scores[useGameStore.getState().localPlayer?.id || ''] || 0,
        opponentScore: data.final_scores[useGameStore.getState().opponent?.id || ''] || 0,
      });
    });

    // Position sync events
    const unsubPosition = wsService.on('position_update', (data) => {
      updatePlayerPosition(data.player_id, data.x, data.y);
    });

    // Power-up events
    const unsubPowerUpSpawn = wsService.on('powerup_spawn', (data) => {
      addPowerUp({ id: data.id, type: data.type, x: data.x, y: data.y });
    });

    const unsubPowerUpCollected = wsService.on('powerup_collected', (data) => {
      removePowerUp(data.powerup_id);
      collectPowerUp(data.player_id, data.type);
    });

    const unsubSosUsed = wsService.on('sos_used', (data) => {
      eliminateOptions(data.eliminated_options);
    });

    const unsubTimeStolen = wsService.on('time_stolen', (data) => {
      // Handle time steal notification
      console.log(`Time stolen by ${data.stealer_id}!`);
    });

    return () => {
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubGameStart();
      unsubQuestion();
      unsubRoundResult();
      unsubGameEnd();
      unsubPosition();
      unsubPowerUpSpawn();
      unsubPowerUpCollected();
      unsubSosUsed();
      unsubTimeStolen();
      wsService.disconnect();
    };
  }, [lobbyCode]);

  const sendAnswer = useCallback((qNum: number, answer: string, timeMs: number) => {
    wsService.send('answer', { q_num: qNum, answer, time_ms: timeMs });
  }, []);

  const sendPosition = useCallback((x: number, y: number) => {
    wsService.send('position_update', { x, y });
  }, []);

  const sendPowerUpUse = useCallback((type: string) => {
    wsService.send('powerup_use', { type });
  }, []);

  const sendStartGame = useCallback(() => {
    wsService.send('start_game');
  }, []);

  return {
    sendAnswer,
    sendPosition,
    sendPowerUpUse,
    sendStartGame,
    isConnected: wsService.isConnected,
  };
}
```

### Phaser Game Layer

#### Boot Scene (game/scenes/BootScene.ts)
```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.createLoadingBar();

    // Character sprites (8-direction walk cycle)
    this.load.spritesheet('player', '/assets/sprites/characters/player.png', {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.spritesheet('opponent', '/assets/sprites/characters/opponent.png', {
      frameWidth: 32,
      frameHeight: 48,
    });

    // Power-up sprites
    this.load.image('powerup_sos', '/assets/sprites/items/sos.png');
    this.load.image('powerup_time_steal', '/assets/sprites/items/time_steal.png');
    this.load.image('powerup_shield', '/assets/sprites/items/shield.png');
    this.load.image('powerup_double', '/assets/sprites/items/double_points.png');

    // Tilemap and tileset
    this.load.tilemapTiledJSON('arena', '/assets/maps/arena.json');
    this.load.image('tileset', '/assets/sprites/tiles/tileset.png');

    // Effects
    this.load.spritesheet('collect_effect', '/assets/sprites/effects/collect.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Audio
    this.load.audio('bgm', '/assets/audio/music/game_bgm.mp3');
    this.load.audio('sfx_correct', '/assets/audio/sfx/correct.wav');
    this.load.audio('sfx_wrong', '/assets/audio/sfx/wrong.wav');
    this.load.audio('sfx_collect', '/assets/audio/sfx/collect.wav');
    this.load.audio('sfx_tick', '/assets/audio/sfx/tick.wav');
    this.load.audio('sfx_question', '/assets/audio/sfx/question.wav');

    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x6366f1, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4,
        this.cameras.main.height / 2 - 15,
        (this.cameras.main.width / 2) * value,
        30
      );
    });
  }

  private createLoadingBar() {
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x1e293b, 1);
    this.loadingBar.fillRect(
      this.cameras.main.width / 4 - 2,
      this.cameras.main.height / 2 - 17,
      this.cameras.main.width / 2 + 4,
      34
    );

    this.progressBar = this.add.graphics();
  }

  create() {
    this.createAnimations();
    this.scene.start('GameScene');
  }

  private createAnimations() {
    // Player walk animations (8 directions)
    const directions = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right'];
    
    directions.forEach((dir, index) => {
      this.anims.create({
        key: `player_walk_${dir}`,
        frames: this.anims.generateFrameNumbers('player', {
          start: index * 4,
          end: index * 4 + 3,
        }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `player_idle_${dir}`,
        frames: [{ key: 'player', frame: index * 4 }],
        frameRate: 1,
      });

      // Same for opponent
      this.anims.create({
        key: `opponent_walk_${dir}`,
        frames: this.anims.generateFrameNumbers('opponent', {
          start: index * 4,
          end: index * 4 + 3,
        }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `opponent_idle_${dir}`,
        frames: [{ key: 'opponent', frame: index * 4 }],
        frameRate: 1,
      });
    });

    // Collect effect animation
    this.anims.create({
      key: 'collect_effect',
      frames: this.anims.generateFrameNumbers('collect_effect', { start: 0, end: 7 }),
      frameRate: 15,
      hideOnComplete: true,
    });
  }
}
```

#### Game Scene (game/scenes/GameScene.ts)
```typescript
import Phaser from 'phaser';
import { Player } from '../sprites/Player';
import { Opponent } from '../sprites/Opponent';
import { PowerUp } from '../sprites/PowerUp';
import { InputManager } from '../systems/InputManager';
import { GAME_CONSTANTS } from '../config';

// Event bridge for React communication
export const gameEvents = new Phaser.Events.EventEmitter();

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private opponent!: Opponent | null;
  private powerUps: Map<string, PowerUp> = new Map();
  private inputManager!: InputManager;
  private map!: Phaser.Tilemaps.Tilemap;
  private obstacleLayer!: Phaser.Tilemaps.TilemapLayer;
  private lastPositionSync = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Create tilemap
    this.map = this.make.tilemap({ key: 'arena' });
    const tileset = this.map.addTilesetImage('tileset', 'tileset')!;
    
    // Ground layer
    this.map.createLayer('ground', tileset, 0, 0);
    
    // Obstacle layer with collision
    this.obstacleLayer = this.map.createLayer('obstacles', tileset, 0, 0)!;
    this.obstacleLayer.setCollisionByProperty({ collides: true });

    // Create player at spawn point
    const playerSpawn = this.map.findObject('spawns', (obj) => obj.name === 'player_spawn');
    this.player = new Player(
      this,
      playerSpawn?.x || 200,
      playerSpawn?.y || 200
    );

    // Set up physics collision
    this.physics.add.collider(this.player, this.obstacleLayer);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Input manager
    this.inputManager = new InputManager(this);

    // Listen for React events
    this.setupEventListeners();

    // Start background music
    const bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    bgm.play();
  }

  private setupEventListeners() {
    // Opponent joined
    gameEvents.on('opponent_joined', (data: { id: string; x: number; y: number }) => {
      const opponentSpawn = this.map.findObject('spawns', (obj) => obj.name === 'opponent_spawn');
      this.opponent = new Opponent(
        this,
        opponentSpawn?.x || 600,
        opponentSpawn?.y || 200,
        data.id
      );
      this.physics.add.collider(this.opponent, this.obstacleLayer);
    });

    // Opponent position update
    gameEvents.on('opponent_position', (data: { x: number; y: number }) => {
      this.opponent?.setTargetPosition(data.x, data.y);
    });

    // Power-up spawn
    gameEvents.on('powerup_spawn', (data: { id: string; type: string; x: number; y: number }) => {
      const powerUp = new PowerUp(this, data.x, data.y, data.type, data.id);
      this.powerUps.set(data.id, powerUp);
      
      // Set up collection overlap
      this.physics.add.overlap(this.player, powerUp, () => {
        this.collectPowerUp(data.id);
      });
    });

    // Power-up collected (by either player)
    gameEvents.on('powerup_collected', (data: { id: string }) => {
      const powerUp = this.powerUps.get(data.id);
      if (powerUp) {
        powerUp.playCollectAnimation();
        this.powerUps.delete(data.id);
      }
    });

    // Opponent left
    gameEvents.on('opponent_left', () => {
      this.opponent?.destroy();
      this.opponent = null;
    });
  }

  private collectPowerUp(id: string) {
    const powerUp = this.powerUps.get(id);
    if (!powerUp) return;

    // Play collect sound
    this.sound.play('sfx_collect');

    // Emit to React
    gameEvents.emit('local_powerup_collected', { id, type: powerUp.powerUpType });
  }

  update(time: number, delta: number) {
    // Handle input
    const velocity = this.inputManager.getMovementVector();
    this.player.move(velocity.x, velocity.y);

    // Sync position to server periodically
    if (time - this.lastPositionSync > GAME_CONSTANTS.POSITION_SYNC_INTERVAL) {
      this.lastPositionSync = time;
      gameEvents.emit('local_position', {
        x: this.player.x,
        y: this.player.y,
      });
    }

    // Update opponent interpolation
    this.opponent?.update(delta);
  }

  getPlayerPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }
}
```

#### Player Sprite (game/sprites/Player.ts)
```typescript
import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private currentDirection = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.setSize(24, 24);
    this.setOffset(4, 24);
    
    this.play('player_idle_down');
  }

  move(vx: number, vy: number) {
    const speed = GAME_CONSTANTS.PLAYER_SPEED;
    
    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = 0.707; // 1/sqrt(2)
      vx *= factor;
      vy *= factor;
    }

    this.setVelocity(vx * speed, vy * speed);

    // Determine direction for animation
    if (vx !== 0 || vy !== 0) {
      this.currentDirection = this.getDirection(vx, vy);
      this.play(`player_walk_${this.currentDirection}`, true);
    } else {
      this.play(`player_idle_${this.currentDirection}`, true);
    }
  }

  private getDirection(vx: number, vy: number): string {
    const angle = Math.atan2(vy, vx) * (180 / Math.PI);
    
    if (angle >= -22.5 && angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'down_right';
    if (angle >= 67.5 && angle < 112.5) return 'down';
    if (angle >= 112.5 && angle < 157.5) return 'down_left';
    if (angle >= 157.5 || angle < -157.5) return 'left';
    if (angle >= -157.5 && angle < -112.5) return 'up_left';
    if (angle >= -112.5 && angle < -67.5) return 'up';
    if (angle >= -67.5 && angle < -22.5) return 'up_right';
    
    return 'down';
  }
}
```

#### Opponent Sprite (game/sprites/Opponent.ts)
```typescript
import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config';

export class Opponent extends Phaser.Physics.Arcade.Sprite {
  private targetX: number;
  private targetY: number;
  private currentDirection = 'down';
  public opponentId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
    super(scene, x, y, 'opponent');
    
    this.opponentId = id;
    this.targetX = x;
    this.targetY = y;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.setSize(24, 24);
    this.setOffset(4, 24);
    
    // Add visual distinction (tint or outline)
    this.setTint(0xff6b6b);
    
    this.play('opponent_idle_down');
  }

  setTargetPosition(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  update(delta: number) {
    // Interpolate towards target position
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      const speed = GAME_CONSTANTS.INTERPOLATION_SPEED;
      this.x += dx * speed;
      this.y += dy * speed;

      // Update animation
      this.currentDirection = this.getDirection(dx, dy);
      this.play(`opponent_walk_${this.currentDirection}`, true);
    } else {
      this.play(`opponent_idle_${this.currentDirection}`, true);
    }
  }

  private getDirection(dx: number, dy: number): string {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (angle >= -22.5 && angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'down_right';
    if (angle >= 67.5 && angle < 112.5) return 'down';
    if (angle >= 112.5 && angle < 157.5) return 'down_left';
    if (angle >= 157.5 || angle < -157.5) return 'left';
    if (angle >= -157.5 && angle < -112.5) return 'up_left';
    if (angle >= -112.5 && angle < -67.5) return 'up';
    if (angle >= -67.5 && angle < -22.5) return 'up_right';
    
    return 'down';
  }
}
```

#### Input Manager (game/systems/InputManager.ts)
```typescript
import Phaser from 'phaser';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private virtualJoystick: { x: number; y: number } = { x: 0, y: 0 };
  private isTouchDevice: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isTouchDevice = 'ontouchstart' in window;

    // Keyboard input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Touch input (virtual joystick)
    if (this.isTouchDevice) {
      this.setupTouchControls();
    }
  }

  private setupTouchControls() {
    const joystickZone = this.scene.add.zone(100, this.scene.cameras.main.height - 100, 150, 150);
    joystickZone.setScrollFactor(0);
    joystickZone.setInteractive();

    let joystickBase: Phaser.GameObjects.Arc | null = null;
    let joystickThumb: Phaser.GameObjects.Arc | null = null;
    let startX = 0;
    let startY = 0;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < this.scene.cameras.main.width / 2) {
        startX = pointer.x;
        startY = pointer.y;
        
        joystickBase = this.scene.add.circle(startX, startY, 50, 0x000000, 0.3);
        joystickBase.setScrollFactor(0);
        joystickBase.setDepth(1000);
        
        joystickThumb = this.scene.add.circle(startX, startY, 25, 0x6366f1, 0.8);
        joystickThumb.setScrollFactor(0);
        joystickThumb.setDepth(1001);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (joystickThumb && pointer.isDown) {
        const dx = pointer.x - startX;
        const dy = pointer.y - startY;
        const distance = Math.min(50, Math.sqrt(dx * dx + dy * dy));
        const angle = Math.atan2(dy, dx);

        joystickThumb.x = startX + Math.cos(angle) * distance;
        joystickThumb.y = startY + Math.sin(angle) * distance;

        this.virtualJoystick.x = (distance / 50) * Math.cos(angle);
        this.virtualJoystick.y = (distance / 50) * Math.sin(angle);
      }
    });

    this.scene.input.on('pointerup', () => {
      joystickBase?.destroy();
      joystickThumb?.destroy();
      joystickBase = null;
      joystickThumb = null;
      this.virtualJoystick = { x: 0, y: 0 };
    });
  }

  getMovementVector(): { x: number; y: number } {
    let vx = 0;
    let vy = 0;

    // Keyboard input
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    // Virtual joystick (if active)
    if (this.virtualJoystick.x !== 0 || this.virtualJoystick.y !== 0) {
      vx = this.virtualJoystick.x;
      vy = this.virtualJoystick.y;
    }

    return { x: vx, y: vy };
  }
}
```

### React Components

#### Question Overlay (components/game/QuestionOverlay.tsx)
```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Timer } from './Timer';
import { cn } from '../../utils/helpers';

interface QuestionOverlayProps {
  onAnswer: (answer: string, timeMs: number) => void;
}

export function QuestionOverlay({ onAnswer }: QuestionOverlayProps) {
  const {
    currentQuestion,
    selectedAnswer,
    answerSubmitted,
    eliminatedOptions,
    selectAnswer,
    submitAnswer,
  } = useGameStore();

  const [startTime] = useState(() => Date.now());

  const handleSelect = useCallback((answer: string) => {
    if (answerSubmitted || eliminatedOptions.includes(answer)) return;
    
    selectAnswer(answer);
    submitAnswer();
    
    const timeMs = Date.now() - (currentQuestion?.startTime || startTime);
    onAnswer(answer, timeMs);
  }, [answerSubmitted, eliminatedOptions, currentQuestion, startTime, onAnswer, selectAnswer, submitAnswer]);

  const handleTimeout = useCallback(() => {
    if (!answerSubmitted) {
      submitAnswer();
      onAnswer('', 30000); // Timeout
    }
  }, [answerSubmitted, onAnswer, submitAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (answerSubmitted) return;
      
      const keyMap: Record<string, string> = {
        '1': 'A', '2': 'B', '3': 'C', '4': 'D',
        'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
      };
      
      const answer = keyMap[e.key.toLowerCase()];
      if (answer && !eliminatedOptions.includes(answer)) {
        handleSelect(answer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answerSubmitted, eliminatedOptions, handleSelect]);

  if (!currentQuestion) return null;

  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full mx-4 pointer-events-auto shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-400 font-medium">
            Question {currentQuestion.qNum} of 15
          </span>
          <Timer
            startTime={currentQuestion.startTime}
            duration={30000}
            onTimeout={handleTimeout}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
          {currentQuestion.text}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((letter, index) => {
            const isEliminated = eliminatedOptions.includes(letter);
            const isSelected = selectedAnswer === letter;
            
            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={answerSubmitted || isEliminated}
                className={cn(
                  'p-4 rounded-xl text-left transition-all duration-200',
                  'flex items-center gap-3 min-h-[60px]',
                  isEliminated && 'opacity-30 line-through cursor-not-allowed',
                  isSelected && 'bg-indigo-600 ring-2 ring-indigo-400',
                  !isSelected && !isEliminated && 'bg-slate-800 hover:bg-slate-700',
                  answerSubmitted && !isSelected && 'opacity-50'
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  isSelected ? 'bg-white text-indigo-600' : 'bg-slate-700 text-white'
                )}>
                  {letter}
                </span>
                <span className="text-white font-medium">
                  {currentQuestion.options[index]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <p className="text-slate-500 text-sm text-center mt-4">
          Press 1-4 or A-D to answer quickly
        </p>
      </div>
    </div>
  );
}
```

#### Timer Component (components/game/Timer.tsx)
```typescript
import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/helpers';

interface TimerProps {
  startTime: number;
  duration: number;
  onTimeout: () => void;
}

export function Timer({ startTime, duration, onTimeout }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, duration - elapsed);
      setRemaining(newRemaining);

      if (newRemaining === 0 && !hasTimedOut) {
        setHasTimedOut(true);
        onTimeout();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, onTimeout, hasTimedOut]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = remaining / duration;

  // Color based on time remaining
  const getColor = () => {
    if (progress > 0.5) return 'text-green-400';
    if (progress > 0.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = () => {
    if (progress > 0.5) return 'bg-green-500';
    if (progress > 0.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Numeric display */}
      <span className={cn('text-2xl font-bold tabular-nums', getColor())}>
        {seconds}s
      </span>

      {/* Progress bar */}
      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-100', getBarColor())}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
```

#### Power-Up Bar (components/game/PowerUpBar.tsx)
```typescript
import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { cn } from '../../utils/helpers';

interface PowerUpBarProps {
  onUsePowerUp: (type: string) => void;
}

const POWERUP_INFO: Record<string, { icon: string; name: string; key: string }> = {
  sos: { icon: '🆘', name: 'SOS (50/50)', key: 'Q' },
  time_steal: { icon: '⏱️', name: 'Time Steal', key: 'E' },
  shield: { icon: '🛡️', name: 'Shield', key: 'R' },
  double_points: { icon: '✨', name: '2x Points', key: 'T' },
};

export function PowerUpBar({ onUsePowerUp }: PowerUpBarProps) {
  const { localPlayer, currentQuestion, answerSubmitted } = useGameStore();
  const inventory = localPlayer?.inventory || [];

  const canUse = currentQuestion && !answerSubmitted;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canUse) return;
      
      const keyMap: Record<string, string> = { q: 'sos', e: 'time_steal', r: 'shield', t: 'double_points' };
      const type = keyMap[e.key.toLowerCase()];
      
      if (type && inventory.includes(type as any)) {
        onUsePowerUp(type);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUse, inventory, onUsePowerUp]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex gap-2 bg-slate-900/80 backdrop-blur-sm rounded-xl p-2 border border-slate-700">
        {[0, 1, 2].map((slot) => {
          const type = inventory[slot];
          const info = type ? POWERUP_INFO[type] : null;

          return (
            <button
              key={slot}
              onClick={() => type && canUse && onUsePowerUp(type)}
              disabled={!type || !canUse}
              className={cn(
                'w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-all',
                type && canUse
                  ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
                  : 'bg-slate-800 cursor-not-allowed opacity-50'
              )}
              title={info ? `${info.name} (${info.key})` : 'Empty slot'}
            >
              {info ? (
                <>
                  <span className="text-2xl">{info.icon}</span>
                  <span className="text-[10px] text-slate-300">{info.key}</span>
                </>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

#### Scoreboard (components/game/Scoreboard.tsx)
```typescript
import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { cn } from '../../utils/helpers';

export function Scoreboard() {
  const { localPlayer, opponent, questionNumber, totalQuestions } = useGameStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-700">
        {/* Local player */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-white font-medium">
            {localPlayer?.displayName || 'You'}
          </span>
          <span className="text-2xl font-bold text-indigo-400 tabular-nums">
            {localPlayer?.score || 0}
          </span>
        </div>

        {/* Divider with question count */}
        <div className="flex flex-col items-center px-4">
          <span className="text-slate-500 text-xs">Round</span>
          <span className="text-white font-bold">
            {questionNumber}/{totalQuestions}
          </span>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-red-400 tabular-nums">
            {opponent?.score || 0}
          </span>
          <span className="text-white font-medium">
            {opponent?.displayName || 'Opponent'}
          </span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>
    </div>
  );
}
```

#### Game Page (pages/Game.tsx)
```typescript
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameBridge } from '../hooks/useGameBridge';
import { PhaserGame } from '../game/PhaserGame';
import { QuestionOverlay } from '../components/game/QuestionOverlay';
import { Scoreboard } from '../components/game/Scoreboard';
import { PowerUpBar } from '../components/game/PowerUpBar';
import { CountdownOverlay } from '../components/game/CountdownOverlay';
import { DisconnectOverlay } from '../components/game/DisconnectOverlay';

export function Game() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { status, currentQuestion, finalResult, reset } = useGameStore();
  const { sendAnswer, sendPosition, sendPowerUpUse, isConnected } = useWebSocket(code || null);
  
  // Bridge between React and Phaser
  useGameBridge(sendPosition);

  // Redirect to results when game ends
  useEffect(() => {
    if (finalResult) {
      navigate(`/results/${code}`);
    }
  }, [finalResult, code, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleAnswer = (answer: string, timeMs: number) => {
    if (currentQuestion) {
      sendAnswer(currentQuestion.qNum, answer, timeMs);
    }
  };

  const handleUsePowerUp = (type: string) => {
    sendPowerUpUse(type);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Phaser game canvas */}
      <PhaserGame />

      {/* UI Overlays */}
      <Scoreboard />
      <PowerUpBar onUsePowerUp={handleUsePowerUp} />

      {/* Countdown before game starts */}
      {status === 'countdown' && <CountdownOverlay />}

      {/* Question overlay (non-blocking) */}
      {status === 'playing' && currentQuestion && (
        <QuestionOverlay onAnswer={handleAnswer} />
      )}

      {/* Disconnection overlay */}
      {!isConnected && <DisconnectOverlay />}
    </div>
  );
}
```

#### React-Phaser Bridge Hook (hooks/useGameBridge.ts)
```typescript
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { gameEvents } from '../game/scenes/GameScene';

export function useGameBridge(sendPosition: (x: number, y: number) => void) {
  const {
    opponent,
    mapPowerUps,
    updatePlayerPosition,
    removePowerUp,
    collectPowerUp,
  } = useGameStore();

  const sendPositionRef = useRef(sendPosition);
  sendPositionRef.current = sendPosition;

  useEffect(() => {
    // Local player position updates -> WebSocket
    const handleLocalPosition = (data: { x: number; y: number }) => {
      sendPositionRef.current(data.x, data.y);
    };

    // Local power-up collection -> WebSocket + Store
    const handleLocalPowerUpCollected = (data: { id: string; type: string }) => {
      // This will be sent to server via WebSocket in the component
      // The server will broadcast to both players
    };

    gameEvents.on('local_position', handleLocalPosition);
    gameEvents.on('local_powerup_collected', handleLocalPowerUpCollected);

    return () => {
      gameEvents.off('local_position', handleLocalPosition);
      gameEvents.off('local_powerup_collected', handleLocalPowerUpCollected);
    };
  }, []);

  // Push opponent position updates to Phaser
  useEffect(() => {
    if (opponent) {
      gameEvents.emit('opponent_position', opponent.position);
    }
  }, [opponent?.position]);

  // Push power-up spawns to Phaser
  useEffect(() => {
    mapPowerUps.forEach((powerUp) => {
      gameEvents.emit('powerup_spawn', powerUp);
    });
  }, [mapPowerUps]);
}
```

### API Client

#### REST API Service (services/api.ts)
```typescript
import { useAuthStore } from '../stores/authStore';

const API_BASE = '/api/v1';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data: APIResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data.data as T;
}

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string, displayName?: string) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<any>('/auth/me'),
};

// Lobby endpoints
export const lobbyAPI = {
  create: (gameMode = 'fortnite') =>
    request<any>('/lobbies', {
      method: 'POST',
      body: JSON.stringify({ game_mode: gameMode }),
    }),

  get: (code: string) =>
    request<any>(`/lobbies/${code}`),

  join: (code: string) =>
    request<any>(`/lobbies/${code}/join`, { method: 'POST' }),

  leave: (code: string) =>
    request<void>(`/lobbies/${code}`, { method: 'DELETE' }),
};

// Game endpoints
export const gameAPI = {
  history: (limit = 20) =>
    request<any[]>(`/games/history?limit=${limit}`),

  get: (id: string) =>
    request<any>(`/games/${id}`),
};
```

## Correctness Properties

*Properties that should hold true across all valid executions of the frontend system.*

### Property 1: Frame Rate Consistency

*For any* game session running on a device meeting minimum requirements, the frame rate SHALL remain at or above 55 FPS for at least 95% of frames.

**Validates: Requirements 1.3, 10.3**

### Property 2: Input Responsiveness

*For any* user input (keyboard, touch), the corresponding character movement SHALL begin within 16ms (one frame at 60 FPS).

**Validates: Requirements 2.1, 2.2**

### Property 3: Position Synchronization

*For any* two players in the same game, the displayed position of the opponent SHALL be within 200ms of their actual position on the server.

**Validates: Requirements 3.2, 12.3**

### Property 4: Question Overlay Non-Blocking

*For any* question overlay displayed, character movement input SHALL continue to be processed and rendered.

**Validates: Requirements 4.2**

### Property 5: Timer Accuracy

*For any* question timer, the displayed remaining time SHALL be within 100ms of the actual server-calculated remaining time.

**Validates: Requirements 4.4, 6.7**

### Property 6: Answer Submission Idempotency

*For any* question, only the first answer submission SHALL be sent to the server; subsequent clicks SHALL be ignored.

**Validates: Requirements 4.5**

### Property 7: Power-Up Inventory Limit

*For any* player, the inventory SHALL never contain more than 3 power-ups at any time.

**Validates: Requirements 5.4**

### Property 8: Score Display Consistency

*For any* score update received from the server, the displayed score SHALL match the server value within one render cycle.

**Validates: Requirements 6.2, 6.3**

### Property 9: WebSocket Reconnection

*For any* WebSocket disconnection, the client SHALL attempt reconnection with exponential backoff up to 5 attempts.

**Validates: Requirements 12.4**

### Property 10: State Reconciliation

*For any* conflict between optimistic local state and server state, the server state SHALL take precedence within 100ms of receiving the server update.

**Validates: Requirements 12.3**

### Property 11: Asset Loading Order

*For any* game load, critical assets (player sprite, UI elements) SHALL be loaded before decorative assets.

**Validates: Requirements 10.2**

### Property 12: Touch Target Size

*For any* interactive element on mobile, the touch target SHALL be at least 48x48 CSS pixels.

**Validates: Requirements 4.8, 11.1**

### Property 13: Audio State Persistence

*For any* audio preference change, the setting SHALL persist across browser sessions via localStorage.

**Validates: Requirements 8.6**

### Property 14: PWA Offline Behavior

*For any* network disconnection after initial load, cached assets SHALL remain available and the app SHALL display appropriate offline messaging.

**Validates: Requirements 9.4**

### Property 15: Animation Frame Budget

*For any* animation frame, the total JavaScript execution time SHALL not exceed 10ms to maintain 60 FPS.

**Validates: Requirements 1.3, 10.3**

### Property 16: Keyboard Shortcut Consistency

*For any* question displayed, pressing keys 1-4 or A-D SHALL select the corresponding answer option.

**Validates: Requirements 4.7**

### Property 17: Color Contrast Compliance

*For any* text element, the contrast ratio against its background SHALL meet WCAG AA standards (4.5:1 for normal text).

**Validates: Requirements 11.1**

### Property 18: Reduced Motion Respect

*For any* user with prefers-reduced-motion enabled, non-essential animations SHALL be disabled or minimized.

**Validates: Requirements 11.5**

## Testing Strategy

### Testing Framework

- **Unit Tests**: Vitest for React components and hooks
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright for full user flows
- **Visual Tests**: Storybook with Chromatic
- **Performance Tests**: Lighthouse CI

### Test Categories

#### Unit Tests
- Store actions and selectors
- Utility functions
- API client methods
- WebSocket message parsing

#### Component Tests
- QuestionOverlay rendering and interaction
- Timer countdown accuracy
- PowerUpBar state management
- Scoreboard display

#### Integration Tests
- Auth flow (login → lobby → game)
- WebSocket connection lifecycle
- React-Phaser bridge communication

#### E2E Tests
- Full game flow from login to results
- Power-up collection and usage
- Reconnection after disconnect

### Test File Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── QuestionOverlay.test.tsx
│   │   │   ├── Timer.test.tsx
│   │   │   └── Scoreboard.test.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.test.ts
│   │   │   └── useGameBridge.test.ts
│   │   ├── stores/
│   │   │   ├── gameStore.test.ts
│   │   │   └── authStore.test.ts
│   │   └── services/
│   │       ├── api.test.ts
│   │       └── websocket.test.ts
│   └── ...
├── e2e/
│   ├── auth.spec.ts
│   ├── lobby.spec.ts
│   ├── game.spec.ts
│   └── fixtures/
└── ...
```
