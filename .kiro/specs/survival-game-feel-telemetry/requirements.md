# Requirements Document

## Introduction

This specification defines the game feel enhancements and telemetry system for Survival Mode. The system adds AAA-quality polish features (slow-mo death, combo system, perfect timing bonuses) alongside full-stack telemetry for ghost replays, death analytics, and leaderboards. The goal is to create a satisfying, responsive gameplay experience while capturing data to improve game balance and enable competitive features.

## Glossary

- **Survival_Mode**: An endless runner game mode where players dodge obstacles to achieve maximum distance
- **Ghost_Replay**: A recording of player inputs that can be played back to show a previous run as a semi-transparent character
- **Hitstop**: A brief freeze-frame effect on collision to add impact weight
- **Combo_System**: A multiplier that increases when players chain near-misses and perfect dodges
- **Near_Miss**: When a player passes within a threshold distance of an obstacle without collision
- **Perfect_Dodge**: A last-frame dodge where the player avoids collision with minimal margin
- **Death_Telemetry**: Analytics data capturing where and how players die
- **Input_Recording**: A timestamped log of all player inputs during a run
- **Personal_Best**: A user's highest-scoring run, stored with ghost data for comparison
- **Slow_Mo_Death**: A dramatic time-slowdown effect when the player dies

## Requirements

### Requirement 1

**User Story:** As a player, I want dramatic slow-motion when I die, so that deaths feel impactful and I can see what killed me.

#### Acceptance Criteria

1. WHEN the player collides with an obstacle THEN the Survival_Mode SHALL reduce game time scale to 0.2x for 1.5 seconds
2. WHEN slow-mo death begins THEN the Survival_Mode SHALL apply a camera zoom toward the collision point
3. WHEN slow-mo death ends THEN the Survival_Mode SHALL restore normal time scale and transition to game over state
4. WHEN slow-mo is active THEN the Survival_Mode SHALL continue rendering at full framerate with interpolated positions

### Requirement 2

**User Story:** As a player, I want a combo system that rewards skillful play, so that I feel rewarded for taking risks and playing well.

#### Acceptance Criteria

1. WHEN a player achieves a near-miss (passes within 0.5 units of an obstacle) THEN the Combo_System SHALL increment the combo counter by 1
2. WHEN a player achieves a perfect dodge (passes within 0.2 units) THEN the Combo_System SHALL increment the combo counter by 3
3. WHEN a player collides with an obstacle THEN the Combo_System SHALL reset the combo counter to 0
4. WHEN 3 seconds pass without a near-miss or perfect dodge THEN the Combo_System SHALL decay the combo counter by 1 per second
5. WHEN the combo counter changes THEN the Combo_System SHALL emit an event with the new combo value and multiplier
6. WHEN calculating score THEN the Survival_Mode SHALL multiply base points by (1 + combo * 0.1)

### Requirement 3

**User Story:** As a player, I want visual and audio feedback for perfect timing, so that I know when I've executed a skillful dodge.

#### Acceptance Criteria

1. WHEN a near-miss occurs THEN the Survival_Mode SHALL display a "Close!" indicator near the obstacle
2. WHEN a perfect dodge occurs THEN the Survival_Mode SHALL display a "Perfect!" indicator with particle effects
3. WHEN a perfect dodge occurs THEN the Survival_Mode SHALL trigger a brief hitstop (3 frames) for impact feel
4. WHEN the combo reaches multiples of 5 THEN the Survival_Mode SHALL display a combo milestone notification
5. WHEN feedback is displayed THEN the Survival_Mode SHALL position indicators in screen space relative to the triggering obstacle

### Requirement 4

**User Story:** As a player, I want to record my inputs during gameplay, so that my runs can be saved and replayed as ghosts.

#### Acceptance Criteria

1. WHEN a survival run starts THEN the Input_Recording system SHALL begin capturing timestamped input events
2. WHEN the player provides input (lane change, jump, slide) THEN the Input_Recording system SHALL store the input type, timestamp, and player position
3. WHEN a survival run ends THEN the Input_Recording system SHALL serialize the recording to a compressed JSON format
4. WHEN serializing input data THEN the Input_Recording system SHALL produce output smaller than 50KB for a 5-minute run
5. WHEN deserializing input data THEN the Input_Recording system SHALL reconstruct the original input sequence with frame-accurate timing

### Requirement 5

**User Story:** As a player, I want to race against my personal best as a ghost, so that I can see my improvement and compete against myself.

#### Acceptance Criteria

1. WHEN a player starts a run and has a personal best THEN the Ghost_Replay system SHALL spawn a semi-transparent ghost character
2. WHEN the ghost replays THEN the Ghost_Replay system SHALL execute recorded inputs at their original timestamps
3. WHEN the ghost reaches the end of its recording THEN the Ghost_Replay system SHALL fade out and despawn
4. WHEN the player beats their personal best distance THEN the Survival_Mode SHALL update the stored ghost data with the new run
5. WHEN rendering the ghost THEN the Ghost_Replay system SHALL use 50% opacity and a distinct color tint

### Requirement 6

**User Story:** As a player, I want my runs saved to a leaderboard, so that I can compete with other players.

#### Acceptance Criteria

1. WHEN a survival run ends THEN the Survival_Mode SHALL send run data to the backend API
2. WHEN saving a run THEN the backend SHALL store distance, score, duration, max combo, and death information
3. WHEN a run exceeds the player's personal best THEN the backend SHALL update the personal best record with ghost data
4. WHEN querying the leaderboard THEN the backend SHALL return the top 100 players ranked by distance
5. WHEN querying the leaderboard THEN the backend SHALL include the requesting player's rank if outside top 100

### Requirement 7

**User Story:** As a game designer, I want death telemetry data, so that I can identify problematic obstacles and balance difficulty.

#### Acceptance Criteria

1. WHEN a player dies THEN the Survival_Mode SHALL record the death position, obstacle type, speed, and player state
2. WHEN recording death telemetry THEN the backend SHALL store individual death events for heatmap analysis
3. WHEN aggregating telemetry THEN the backend SHALL compute death counts by obstacle type and distance buckets
4. WHEN querying telemetry THEN the backend SHALL return aggregated data for a specified time period
5. WHEN storing telemetry THEN the backend SHALL batch events to minimize API calls (max 1 call per run)

### Requirement 8

**User Story:** As a developer, I want the input recording to support deterministic replay, so that ghost playback matches the original run exactly.

#### Acceptance Criteria

1. WHEN recording inputs THEN the Input_Recording system SHALL capture the random seed used for obstacle generation
2. WHEN replaying a ghost THEN the Ghost_Replay system SHALL use the recorded seed to regenerate identical obstacles
3. WHEN replaying inputs THEN the Ghost_Replay system SHALL apply inputs at the exact recorded game-time offset
4. WHEN a recording is played back with the same seed THEN the Ghost_Replay system SHALL produce identical player positions within 0.01 units tolerance
