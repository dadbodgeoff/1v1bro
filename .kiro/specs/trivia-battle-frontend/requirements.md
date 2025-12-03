# Requirements Document

## Introduction

This document defines the requirements for the 1v1 Trivia Battle frontend — a 2025-era immersive 2D animated game experience that revolutionizes the trivia genre. Unlike traditional quiz apps (Kahoot, Quizizz) that present static question screens, this platform features a persistent 2D world where players control animated characters, explore a map, collect power-ups, and engage with trivia questions as overlay modals — all in real-time.

The core innovation is eliminating "dead time" between questions. When a player answers quickly (e.g., 5 seconds on a 30-second question), they continue exploring the map, finding items, and gaining strategic advantages rather than staring at a waiting screen. Questions appear as non-blocking overlays, allowing continued movement and exploration.

The frontend is built as a React PWA using TypeScript, Vite, and a 2D game engine (Phaser.js or PixiJS) for smooth character animation and map rendering. It connects to the existing FastAPI backend via REST and WebSocket APIs.

## Glossary

- **Game World**: The persistent 2D map where player characters exist and move throughout the entire game session
- **Character**: An animated 2D sprite representing a player, capable of walking in 8 directions
- **Question Overlay**: A semi-transparent modal that appears over the game world when a question is active, allowing continued movement
- **Power-Up**: Collectible items scattered on the map that provide strategic advantages (SOS lifeline, time steal, etc.)
- **SOS Lifeline**: A power-up that eliminates two wrong answers from the current question
- **Time Steal**: A power-up that removes 5 seconds from the opponent's timer for the current question
- **Dead Time**: The period after answering a question before the next one appears — traditionally wasted, now used for exploration
- **Exploration Mode**: The default state where players move freely on the map, collecting items and seeing opponent position
- **Question Mode**: When a question overlay is active; players can still move but have a timer counting down
- **Spawn Point**: Designated locations on the map where power-ups randomly appear
- **Fog of War**: Optional mechanic where parts of the map are hidden until explored
- **Mini-Map**: A small overview showing player positions and discovered areas
- **Emote**: Quick animated expressions players can trigger (celebration, taunt, etc.)

## Requirements

### Requirement 1: Game World Rendering

**User Story:** As a player, I want to see a visually engaging 2D world, so that the trivia experience feels like a game rather than a quiz app.

#### Acceptance Criteria

1. WHEN the game loads THEN the System SHALL render a 2D tile-based map at minimum 1920x1080 logical pixels
2. WHEN the map renders THEN the System SHALL display terrain, obstacles, and decorative elements using sprite-based graphics
3. WHEN the game is active THEN the System SHALL maintain a minimum of 60 FPS on modern devices (2020+)
4. WHEN the viewport changes THEN the System SHALL smoothly pan the camera to follow the local player's character
5. WHEN rendering the world THEN the System SHALL use layered rendering (ground, objects, characters, UI) for proper depth
6. WHEN the game initializes THEN the System SHALL preload all sprite assets before showing the game world

### Requirement 2: Character Movement and Animation

**User Story:** As a player, I want to control my character smoothly, so that exploring the map feels responsive and fun.

#### Acceptance Criteria

1. WHEN a player presses WASD or arrow keys THEN the System SHALL move the character in the corresponding direction at a consistent speed
2. WHEN a player uses touch controls THEN the System SHALL display a virtual joystick and move the character based on joystick direction
3. WHEN a character moves THEN the System SHALL play a walking animation corresponding to the movement direction (8 directions)
4. WHEN a character stops moving THEN the System SHALL transition to an idle animation facing the last movement direction
5. WHEN movement input is received THEN the System SHALL update character position at 60Hz locally with server reconciliation every 100ms
6. WHEN a character collides with an obstacle THEN the System SHALL prevent movement through the obstacle while allowing sliding along edges

### Requirement 3: Opponent Visualization

**User Story:** As a player, I want to see my opponent's character on the map, so that I feel the competitive presence.

#### Acceptance Criteria

1. WHEN an opponent is in the game THEN the System SHALL render their character on the map at their current position
2. WHEN the opponent moves THEN the System SHALL interpolate their position smoothly between server updates
3. WHEN the opponent is off-screen THEN the System SHALL display a directional indicator showing their relative position
4. WHEN the opponent collects a power-up THEN the System SHALL play a visual effect visible to both players
5. WHEN the opponent answers a question THEN the System SHALL display a brief indicator (checkmark or X) above their character
6. WHEN rendering the opponent THEN the System SHALL use a distinct color scheme or outline to differentiate from the local player

### Requirement 4: Question Overlay System

**User Story:** As a player, I want questions to appear as overlays without stopping the game, so that I can keep moving while answering.

#### Acceptance Criteria

1. WHEN a question is received THEN the System SHALL display a semi-transparent overlay modal within 100ms
2. WHEN the overlay appears THEN the System SHALL NOT pause character movement or world rendering
3. WHEN displaying a question THEN the System SHALL show question text, four answer buttons (A/B/C/D), and a countdown timer
4. WHEN the timer is active THEN the System SHALL display remaining time as both a numeric countdown and a visual progress bar
5. WHEN a player selects an answer THEN the System SHALL immediately send the answer to the server and disable further selection
6. WHEN the question timer expires THEN the System SHALL automatically submit a timeout and close the overlay
7. WHEN the overlay is visible THEN the System SHALL allow keyboard shortcuts (1/2/3/4 or A/B/C/D) for quick answer selection
8. WHEN displaying options THEN the System SHALL ensure touch targets are minimum 48x48 pixels for mobile accessibility

### Requirement 5: Power-Up System

**User Story:** As a player, I want to find and use power-ups on the map, so that I have strategic options beyond just answering questions.

#### Acceptance Criteria

1. WHEN the game starts THEN the System SHALL spawn power-ups at designated spawn points on the map
2. WHEN a player's character overlaps a power-up THEN the System SHALL collect it and add it to the player's inventory
3. WHEN a power-up is collected THEN the System SHALL play a collection animation and sound effect
4. WHEN a player has power-ups THEN the System SHALL display them in a hotbar UI element (max 3 slots)
5. WHEN a player activates a power-up THEN the System SHALL apply its effect and remove it from inventory
6. WHEN an SOS power-up is used THEN the System SHALL visually strike through two incorrect answers on the current question
7. WHEN a Time Steal power-up is used THEN the System SHALL notify the opponent and reduce their timer by 5 seconds
8. WHEN power-ups are collected THEN the System SHALL broadcast the collection to the opponent via WebSocket

### Requirement 6: Scoring and Feedback

**User Story:** As a player, I want immediate visual feedback on my answers and score, so that I stay engaged and know how I'm performing.

#### Acceptance Criteria

1. WHEN an answer is submitted THEN the System SHALL display a pending state until the round result is received
2. WHEN round results arrive THEN the System SHALL animate the score change with a floating number effect
3. WHEN displaying scores THEN the System SHALL show both players' current scores in a persistent scoreboard UI
4. WHEN a correct answer is submitted THEN the System SHALL play a success animation and sound
5. WHEN an incorrect answer is submitted THEN the System SHALL play a failure animation and sound
6. WHEN the opponent answers THEN the System SHALL show their answer result (correct/incorrect) after the round ends
7. WHEN displaying the timer THEN the System SHALL change color (green → yellow → red) as time decreases

### Requirement 7: Game Flow and Transitions

**User Story:** As a player, I want smooth transitions between game phases, so that the experience feels polished and professional.

#### Acceptance Criteria

1. WHEN entering the lobby THEN the System SHALL display a waiting room with the lobby code prominently shown
2. WHEN an opponent joins THEN the System SHALL animate their character appearing and play a notification sound
3. WHEN the host starts the game THEN the System SHALL play a countdown animation (3, 2, 1, GO!)
4. WHEN transitioning between questions THEN the System SHALL display a brief "Round X of 15" indicator
5. WHEN the game ends THEN the System SHALL transition to a results screen with final scores and winner announcement
6. WHEN on the results screen THEN the System SHALL offer "Play Again" and "Return to Menu" options
7. WHEN a player disconnects THEN the System SHALL display a "Waiting for opponent to reconnect" overlay with countdown

### Requirement 8: Audio System

**User Story:** As a player, I want appropriate sound effects and music, so that the game feels immersive and exciting.

#### Acceptance Criteria

1. WHEN the game world loads THEN the System SHALL play background music that loops seamlessly
2. WHEN a question appears THEN the System SHALL play an alert sound to draw attention
3. WHEN the timer is below 5 seconds THEN the System SHALL play an escalating tick sound
4. WHEN collecting a power-up THEN the System SHALL play a distinct collection sound
5. WHEN the game ends THEN the System SHALL play victory music for the winner and different music for the loser
6. WHEN audio settings are changed THEN the System SHALL persist preferences to local storage
7. WHEN the app is in background THEN the System SHALL pause or mute audio appropriately

### Requirement 9: Responsive Design and PWA

**User Story:** As a player, I want to play on any device, so that I can compete with friends regardless of platform.

#### Acceptance Criteria

1. WHEN accessed on mobile THEN the System SHALL display touch controls and scale UI appropriately
2. WHEN accessed on desktop THEN the System SHALL support keyboard/mouse controls with hover states
3. WHEN the viewport is resized THEN the System SHALL adjust the game canvas and UI layout without reload
4. WHEN installed as PWA THEN the System SHALL function offline for cached assets and show appropriate offline messaging
5. WHEN the app is installed THEN the System SHALL display a custom app icon and splash screen
6. WHEN network connectivity is lost THEN the System SHALL display a connection status indicator

### Requirement 10: Performance and Loading

**User Story:** As a player, I want the game to load quickly and run smoothly, so that I don't lose interest or experience lag.

#### Acceptance Criteria

1. WHEN the app first loads THEN the System SHALL display an animated loading screen with progress indicator
2. WHEN loading assets THEN the System SHALL prioritize critical assets (UI, player sprite) before decorative elements
3. WHEN the game is running THEN the System SHALL maintain 60 FPS with no more than 5% frame drops
4. WHEN memory usage exceeds thresholds THEN the System SHALL unload unused assets and textures
5. WHEN on low-end devices THEN the System SHALL offer a "performance mode" with reduced visual effects
6. WHEN initial load completes THEN the System SHALL cache assets for faster subsequent loads

### Requirement 11: Accessibility

**User Story:** As a player with accessibility needs, I want the game to be usable, so that I can participate equally.

#### Acceptance Criteria

1. WHEN displaying text THEN the System SHALL use minimum 16px font size with sufficient contrast (WCAG AA)
2. WHEN using color to convey information THEN the System SHALL also use icons or patterns for colorblind users
3. WHEN keyboard navigation is used THEN the System SHALL provide visible focus indicators
4. WHEN screen readers are active THEN the System SHALL announce question text and answer options
5. WHEN animations are displayed THEN the System SHALL respect prefers-reduced-motion settings
6. WHEN audio cues are used THEN the System SHALL provide visual alternatives

### Requirement 12: State Management and Sync

**User Story:** As a player, I want the game state to stay synchronized, so that both players have a fair experience.

#### Acceptance Criteria

1. WHEN WebSocket messages arrive THEN the System SHALL update local state within 16ms (one frame)
2. WHEN local state changes THEN the System SHALL optimistically update UI before server confirmation
3. WHEN server state conflicts with local state THEN the System SHALL reconcile to server state with smooth interpolation
4. WHEN reconnecting after disconnect THEN the System SHALL restore full game state from server
5. WHEN the browser tab loses focus THEN the System SHALL continue processing WebSocket messages
6. WHEN state updates occur THEN the System SHALL batch React re-renders to prevent unnecessary updates

