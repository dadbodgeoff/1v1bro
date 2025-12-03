# Implementation Plan

## Overview

This implementation plan follows a **progressive complexity** approach:
1. Get the simplest version working first
2. Test each layer before adding the next
3. Complex features (power-ups, animations) come LAST

**Key Principle:** At each checkpoint, you should have a WORKING game at that complexity level.

---

## Phase 1: Project Setup and Configuration

### Task 1: Initialize Vite React Project
- [ ] 1.1 Create Vite project with React + TypeScript template
- [ ] 1.2 Configure path aliases in tsconfig.json (@/ for src/)
- [ ] 1.3 Set up ESLint and Prettier with project rules
- [ ] 1.4 Configure Vite proxy for /api and /ws endpoints
- [ ] 1.5 Install Vitest for testing

### Task 2: Install Core Dependencies
- [ ] 2.1 Install Zustand for state management
- [ ] 2.2 Install React Router v6 for routing
- [ ] 2.3 Install TailwindCSS and configure
- [ ] 2.4 DO NOT install Phaser yet (comes later)

### Task 3: Set Up Project Structure
- [ ] 3.1 Create folder structure (pages, components, hooks, stores, services)
- [ ] 3.2 Set up CSS variables and global styles
- [ ] 3.3 Create utility helpers (cn, formatTime, etc.)

### Task 4: Checkpoint - Verify Setup
- [ ] 4.1 Dev server runs without errors
- [ ] 4.2 Tailwind classes apply correctly
- [ ] 4.3 Vitest runs with sample test

---

## Phase 2: Auth System (Minimal)

### Task 5: Implement Auth Store
- [ ] 5.1 Create authStore.ts with Zustand (user, token, isAuthenticated)
- [ ] 5.2 Implement persist middleware for token storage
- [ ] 5.3 Add setUser, logout actions
- [ ] 5.4 Write unit tests for auth store

### Task 6: Implement REST API Client
- [ ] 6.1 Create api.ts with base request function
- [ ] 6.2 Implement authAPI methods (register, login, logout, me)
- [ ] 6.3 Add error handling and token injection
- [ ] 6.4 Write unit tests for API client

### Task 7: Implement Auth UI
- [ ] 7.1 Create basic Button and Input components
- [ ] 7.2 Create Login.tsx page
- [ ] 7.3 Create Register.tsx page
- [ ] 7.4 Create ProtectedRoute component
- [ ] 7.5 Write component tests

### Task 8: Checkpoint - Auth Works
- [ ] 8.1 Can register new account
- [ ] 8.2 Can login with existing account
- [ ] 8.3 Token persists across refresh
- [ ] 8.4 Protected routes redirect correctly
- [ ] 8.5 All auth tests pass

---

## Phase 3: Lobby System (Minimal)

### Task 9: Implement Lobby Store
- [ ] 9.1 Create lobbyStore.ts (code, players, canStart)
- [ ] 9.2 NO game state yet - just lobby
- [ ] 9.3 Write unit tests

### Task 10: Implement Lobby API
- [ ] 10.1 Add lobbyAPI methods (create, get, join, leave)
- [ ] 10.2 Write unit tests

### Task 11: Implement WebSocket Service (Basic)
- [ ] 11.1 Create websocket.ts singleton
- [ ] 11.2 Implement connect/disconnect
- [ ] 11.3 Implement send and on/off methods
- [ ] 11.4 Handle player_joined, player_left events ONLY
- [ ] 11.5 Write unit tests

### Task 12: Implement Lobby UI
- [ ] 12.1 Create Home.tsx with create/join buttons
- [ ] 12.2 Create Lobby.tsx with code display and player list
- [ ] 12.3 Create LobbyCode.tsx with copy button
- [ ] 12.4 Create PlayerCard.tsx
- [ ] 12.5 Write component tests

### Task 13: Checkpoint - Lobby Works
- [ ] 13.1 Can create lobby and see code
- [ ] 13.2 Can join lobby with code
- [ ] 13.3 Both players see each other in real-time
- [ ] 13.4 Host sees "Start Game" button when opponent joins
- [ ] 13.5 All lobby tests pass

---

## Phase 4: Basic Trivia Game (NO 2D World)

**This is the MVP checkpoint - a working trivia game without the fancy 2D stuff.**

### Task 14: Implement Game Store (Minimal)
- [ ] 14.1 Create gameStore.ts with ONLY:
  - status (waiting, playing, round_result, finished)
  - currentQuestion (qNum, text, options, startTime)
  - selectedAnswer, answerSubmitted
  - localScore, opponentScore
  - questionNumber, totalQuestions
- [ ] 14.2 NO position, NO inventory, NO power-ups yet
- [ ] 14.3 Write unit tests for all actions

### Task 15: Extend WebSocket for Game Events
- [ ] 15.1 Add handlers for: game_start, question, round_result, game_end
- [ ] 15.2 Add sendAnswer, sendStartGame methods
- [ ] 15.3 Wire events to game store
- [ ] 15.4 Write integration tests

### Task 16: Implement Timer Component
- [ ] 16.1 Create Timer.tsx
- [ ] 16.2 Calculate from server startTime
- [ ] 16.3 Color transitions (green→yellow→red)
- [ ] 16.4 Call onTimeout
- [ ] 16.5 Write component tests

### Task 17: Implement Question UI (Full Screen, Not Overlay)
- [ ] 17.1 Create QuestionCard.tsx (full screen for now)
- [ ] 17.2 Display question text and 4 options
- [ ] 17.3 Implement answer selection
- [ ] 17.4 Keyboard shortcuts (1-4)
- [ ] 17.5 Disable after submission
- [ ] 17.6 Write component tests

### Task 18: Implement Scoreboard
- [ ] 18.1 Create Scoreboard.tsx
- [ ] 18.2 Display both scores and round number
- [ ] 18.3 Write component tests

### Task 19: Implement Basic Game Page
- [ ] 19.1 Create Game.tsx that shows:
  - Scoreboard at top
  - QuestionCard when question active
  - "Waiting for next question" between rounds
- [ ] 19.2 Wire up WebSocket hook
- [ ] 19.3 Handle game_end → navigate to results

### Task 20: Implement Results Page
- [ ] 20.1 Create Results.tsx
- [ ] 20.2 Show winner and final scores
- [ ] 20.3 "Play Again" and "Return to Menu" buttons

### Task 21: Checkpoint - PLAYABLE TRIVIA GAME
- [ ] 21.1 Can start game from lobby
- [ ] 21.2 Questions appear with timer
- [ ] 21.3 Can answer with click or keyboard
- [ ] 21.4 Scores update after each round
- [ ] 21.5 Game ends after 15 questions
- [ ] 21.6 Results show correctly
- [ ] 21.7 Can play multiple games
- [ ] 21.8 All tests pass

**🎯 STOP HERE AND THOROUGHLY TEST before adding 2D world!**

---

## Phase 5: 2D World Foundation

### Task 22: Install and Configure Phaser
- [ ] 22.1 Install Phaser.js
- [ ] 22.2 Create game/config.ts
- [ ] 22.3 Create PhaserGame.tsx bridge component

### Task 23: Create Minimal Assets
- [ ] 23.1 Create/source simple player sprite (can be placeholder)
- [ ] 23.2 Create simple tileset (solid colors OK)
- [ ] 23.3 Create minimal arena map in Tiled

### Task 24: Implement Boot Scene
- [ ] 24.1 Create BootScene.ts with loading bar
- [ ] 24.2 Load player sprite and tilemap
- [ ] 24.3 Create basic walk animation (4 directions OK for now)

### Task 25: Implement Basic Game Scene
- [ ] 25.1 Create GameScene.ts
- [ ] 25.2 Render tilemap
- [ ] 25.3 Create player sprite at spawn
- [ ] 25.4 Camera follows player

### Task 26: Implement Input Manager
- [ ] 26.1 Create InputManager.ts
- [ ] 26.2 WASD + arrow keys
- [ ] 26.3 Return movement vector

### Task 27: Implement Player Movement
- [ ] 27.1 Create Player.ts sprite class
- [ ] 27.2 Move based on input
- [ ] 27.3 Play walk/idle animations
- [ ] 27.4 Collision with obstacles

### Task 28: Checkpoint - Player Moves on Map
- [ ] 28.1 Map renders correctly
- [ ] 28.2 Player moves with WASD
- [ ] 28.3 Collision works
- [ ] 28.4 Camera follows
- [ ] 28.5 Animations play

---

## Phase 6: Question Overlay (Non-Blocking)

### Task 29: Convert QuestionCard to Overlay
- [ ] 29.1 Rename to QuestionOverlay.tsx
- [ ] 29.2 Style as semi-transparent modal
- [ ] 29.3 Position over game canvas
- [ ] 29.4 Ensure pointer-events work correctly

### Task 30: Integrate Overlay with Game Scene
- [ ] 30.1 Game.tsx renders both PhaserGame and QuestionOverlay
- [ ] 30.2 Overlay appears when question active
- [ ] 30.3 Movement continues while overlay visible
- [ ] 30.4 Can answer while moving

### Task 31: Checkpoint - Questions Don't Block Movement
- [ ] 31.1 Question appears as overlay
- [ ] 31.2 Can still move character while question visible
- [ ] 31.3 Can answer with keyboard while moving
- [ ] 31.4 Timer works correctly
- [ ] 31.5 All previous tests still pass

---

## Phase 7: Multiplayer Position Sync

### Task 32: Add Position to Game Store
- [ ] 32.1 Add localPosition: {x, y} to game store
- [ ] 32.2 Add opponentPosition: {x, y}
- [ ] 32.3 Write unit tests

### Task 33: Extend WebSocket for Position
- [ ] 33.1 Add position_update handler
- [ ] 33.2 Add sendPosition method
- [ ] 33.3 Write tests

### Task 34: Implement Position Sync in Phaser
- [ ] 34.1 Emit local position every 100ms via gameEvents
- [ ] 34.2 Create useGameBridge.ts hook
- [ ] 34.3 Bridge position events between React and Phaser

### Task 35: Implement Opponent Sprite
- [ ] 35.1 Create Opponent.ts class
- [ ] 35.2 Interpolate to target position
- [ ] 35.3 Visual distinction (tint)
- [ ] 35.4 Handle join/leave events

### Task 36: Implement Off-Screen Indicator
- [ ] 36.1 Create OpponentIndicator.tsx
- [ ] 36.2 Show arrow when opponent off-screen

### Task 37: Checkpoint - See Opponent Moving
- [ ] 37.1 Opponent appears when they join
- [ ] 37.2 Opponent moves smoothly
- [ ] 37.3 Off-screen indicator works
- [ ] 37.4 Both players see each other's movement
- [ ] 37.5 All previous tests still pass

---

## Phase 8: Touch Controls

### Task 38: Implement Virtual Joystick
- [ ] 38.1 Add touch detection to InputManager
- [ ] 38.2 Create joystick UI on touch
- [ ] 38.3 Calculate direction from touch position
- [ ] 38.4 Test on mobile device/emulator

### Task 39: Mobile-Friendly Question Overlay
- [ ] 39.1 Ensure touch targets are 48px+
- [ ] 39.2 Test answer selection on touch
- [ ] 39.3 Adjust layout for small screens

### Task 40: Checkpoint - Works on Mobile
- [ ] 40.1 Can move with virtual joystick
- [ ] 40.2 Can answer questions on touch
- [ ] 40.3 UI readable on mobile
- [ ] 40.4 All previous tests still pass

---

## Phase 9: Power-Up System

**Only add this AFTER everything above works perfectly.**

### Task 41: Add Power-Up State to Store
- [ ] 41.1 Add inventory: string[] to player state (max 3)
- [ ] 41.2 Add mapPowerUps: array to game store
- [ ] 41.3 Add eliminatedOptions: string[] for SOS
- [ ] 41.4 Write unit tests

### Task 42: Extend WebSocket for Power-Ups
- [ ] 42.1 Add powerup_spawn, powerup_collected handlers
- [ ] 42.2 Add powerup_use, sos_used, time_stolen handlers
- [ ] 42.3 Add sendPowerUpCollect, sendPowerUpUse methods
- [ ] 42.4 Write tests

### Task 43: Create Power-Up Sprites
- [ ] 43.1 Create/source 4 power-up sprites
- [ ] 43.2 Add to asset loading

### Task 44: Implement PowerUp Sprite Class
- [ ] 44.1 Create PowerUp.ts
- [ ] 44.2 Floating animation
- [ ] 44.3 Collection detection
- [ ] 44.4 Destroy on collect

### Task 45: Implement Power-Up Spawning
- [ ] 45.1 Handle powerup_spawn in GameScene
- [ ] 45.2 Track power-ups in Map
- [ ] 45.3 Handle powerup_collected (remove from map)

### Task 46: Implement Power-Up Collection
- [ ] 46.1 Detect overlap with player
- [ ] 46.2 Send to server
- [ ] 46.3 Add to inventory on confirmation

### Task 47: Implement PowerUpBar UI
- [ ] 47.1 Create PowerUpBar.tsx
- [ ] 47.2 Display 3 slots with icons
- [ ] 47.3 Click to use
- [ ] 47.4 Keyboard shortcuts (Q, E, R)
- [ ] 47.5 Disable when no question active

### Task 48: Implement Power-Up Effects
- [ ] 48.1 SOS: strike through 2 wrong options
- [ ] 48.2 Time Steal: show notification to victim
- [ ] 48.3 Shield/Double Points: visual indicators

### Task 49: Checkpoint - Power-Ups Work
- [ ] 49.1 Power-ups spawn on map
- [ ] 49.2 Can collect (max 3)
- [ ] 49.3 Can use during question
- [ ] 49.4 Effects apply correctly
- [ ] 49.5 Both players see collections
- [ ] 49.6 All previous tests still pass

---

## Phase 10: Audio System

### Task 50: Implement Audio Manager
- [ ] 50.1 Create useAudio.ts hook
- [ ] 50.2 Background music control
- [ ] 50.3 SFX playback
- [ ] 50.4 Volume settings in localStorage

### Task 51: Add Sound Effects
- [ ] 51.1 Question appear
- [ ] 51.2 Correct/wrong answer
- [ ] 51.3 Power-up collect
- [ ] 51.4 Timer tick (last 5s)

### Task 52: Add Background Music
- [ ] 52.1 Lobby music
- [ ] 52.2 Game music
- [ ] 52.3 Victory/defeat music

### Task 53: Audio Settings UI
- [ ] 53.1 Settings button
- [ ] 53.2 Volume sliders
- [ ] 53.3 Mute toggle

### Task 54: Checkpoint - Audio Works
- [ ] 54.1 Music plays and loops
- [ ] 54.2 SFX trigger correctly
- [ ] 54.3 Settings persist

---

## Phase 11: Visual Polish

### Task 55: Improve Animations
- [ ] 55.1 8-direction walk animations
- [ ] 55.2 Score floating numbers
- [ ] 55.3 Answer feedback (checkmark/X)
- [ ] 55.4 Countdown overlay (3, 2, 1, GO!)

### Task 56: Improve Assets
- [ ] 56.1 Better character sprites
- [ ] 56.2 Better tileset
- [ ] 56.3 Power-up glow effects
- [ ] 56.4 Victory confetti

### Task 57: Checkpoint - Looks Good
- [ ] 57.1 Animations smooth
- [ ] 57.2 Visual feedback clear
- [ ] 57.3 Consistent art style

---

## Phase 12: Error Handling and Edge Cases

### Task 58: Connection Handling
- [ ] 58.1 Reconnection with exponential backoff
- [ ] 58.2 "Reconnecting..." overlay
- [ ] 58.3 "Opponent disconnected" handling
- [ ] 58.4 Forfeit after 30s disconnect

### Task 59: Error States
- [ ] 59.1 Error boundaries
- [ ] 59.2 Toast notifications
- [ ] 59.3 Network error handling
- [ ] 59.4 Invalid lobby code handling

### Task 60: Loading States
- [ ] 60.1 Skeleton loaders
- [ ] 60.2 Loading spinners
- [ ] 60.3 Asset loading progress

### Task 61: Checkpoint - Handles Errors Gracefully
- [ ] 61.1 Survives network blips
- [ ] 61.2 Clear error messages
- [ ] 61.3 Can recover from errors

---

## Phase 13: Accessibility

### Task 62: Keyboard Navigation
- [ ] 62.1 All interactive elements focusable
- [ ] 62.2 Visible focus indicators
- [ ] 62.3 Tab order makes sense

### Task 63: Screen Reader Support
- [ ] 63.1 ARIA labels on buttons
- [ ] 63.2 Question text announced
- [ ] 63.3 Score changes announced

### Task 64: Visual Accessibility
- [ ] 64.1 Color contrast WCAG AA
- [ ] 64.2 Don't rely on color alone
- [ ] 64.3 prefers-reduced-motion support

### Task 65: Checkpoint - Accessibility Audit
- [ ] 65.1 Lighthouse accessibility score 90+
- [ ] 65.2 Keyboard-only navigation works
- [ ] 65.3 Screen reader usable

---

## Phase 14: Performance

### Task 66: Phaser Optimization
- [ ] 66.1 Object pooling for effects
- [ ] 66.2 Culling off-screen objects
- [ ] 66.3 Profile and fix frame drops

### Task 67: React Optimization
- [ ] 67.1 Memoize components
- [ ] 67.2 Optimize selectors
- [ ] 67.3 React.lazy for routes

### Task 68: Asset Optimization
- [ ] 68.1 Compress sprites
- [ ] 68.2 Compress audio
- [ ] 68.3 Lazy load non-critical assets

### Task 69: Performance Mode
- [ ] 69.1 Toggle in settings
- [ ] 69.2 Reduce particle effects
- [ ] 69.3 Simpler animations

### Task 70: Checkpoint - Performance Targets
- [ ] 70.1 60 FPS on target devices
- [ ] 70.2 Initial load < 3s
- [ ] 70.3 Memory stable over time

---

## Phase 15: PWA and Deployment

### Task 71: PWA Configuration
- [ ] 71.1 manifest.json
- [ ] 71.2 Service worker
- [ ] 71.3 Offline caching
- [ ] 71.4 Install prompt

### Task 72: App Icons
- [ ] 72.1 192x192 and 512x512 icons
- [ ] 72.2 Favicon
- [ ] 72.3 Splash screens

### Task 73: Production Build
- [ ] 73.1 Environment variables
- [ ] 73.2 Build optimization
- [ ] 73.3 Bundle analysis

### Task 74: Deployment
- [ ] 74.1 Nginx configuration
- [ ] 74.2 SSL setup
- [ ] 74.3 Caching headers

### Task 75: Checkpoint - Production Ready
- [ ] 75.1 PWA installs
- [ ] 75.2 Offline works
- [ ] 75.3 Production build runs

---

## Phase 16: Final Testing

### Task 76: E2E Tests
- [ ] 76.1 Full game flow (login → lobby → game → results)
- [ ] 76.2 Power-up usage
- [ ] 76.3 Reconnection
- [ ] 76.4 Mobile flow

### Task 77: Cross-Browser Testing
- [ ] 77.1 Chrome
- [ ] 77.2 Firefox
- [ ] 77.3 Safari
- [ ] 77.4 Mobile browsers

### Task 78: Load Testing
- [ ] 78.1 Multiple concurrent games
- [ ] 78.2 WebSocket stability

### Task 79: Final Checkpoint
- [ ] 79.1 All tests pass
- [ ] 79.2 No console errors
- [ ] 79.3 Performance targets met
- [ ] 79.4 Accessibility audit passes
- [ ] 79.5 Ready for launch 🚀

---

## Summary

**Total Phases:** 16  
**Total Tasks:** 79  
**Key Milestones:**

| Phase | Milestone | What You Can Test |
|-------|-----------|-------------------|
| 4 | Task 21 | Full trivia game (no 2D) |
| 5 | Task 28 | Player moves on map |
| 6 | Task 31 | Questions as overlay |
| 7 | Task 37 | See opponent moving |
| 8 | Task 40 | Works on mobile |
| 9 | Task 49 | Power-ups work |

**Rule:** Don't start Phase N+1 until Phase N checkpoint passes completely.
