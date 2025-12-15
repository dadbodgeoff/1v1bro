# Requirements Document

## Introduction

This specification defines enterprise-grade juice and feedback systems for Survival Mode. The goal is to ensure every player action has a satisfying visual and tactile reaction, creating AAA-quality game feel. This builds upon the existing FeedbackSystem, ParticleSystem, and CameraController to add screen shake, dodge particles, enhanced speed lines, and camera tilt on lane changes.

## Glossary

- **Screen_Shake**: Camera displacement effect triggered by impacts, using trauma-based decay
- **Trauma**: A 0-1 value representing current shake intensity, decays over time
- **Dodge_Particles**: Burst of particles emitted when player successfully dodges an obstacle
- **Speed_Lines**: Radial lines that appear at high velocity to convey speed
- **Camera_Tilt**: Roll rotation of camera during lane changes for kinetic feel
- **Hitstop**: Brief time freeze on impact (already implemented in GameLoop)
- **Juice**: Game feel polish that makes actions feel satisfying and responsive

## Requirements

### Requirement 1: Screen Shake System

**User Story:** As a player, I want the screen to shake when I hit obstacles, so that impacts feel powerful and consequential.

#### Acceptance Criteria

1. WHEN the player collides with an obstacle THEN the Camera SHALL apply screen shake with trauma value of 0.6
2. WHEN screen shake is active THEN the Camera SHALL displace position using Perlin noise for organic movement
3. WHEN trauma is applied THEN the Camera SHALL decay trauma by 0.8 per second (exponential decay)
4. WHEN calculating shake offset THEN the Camera SHALL use trauma² for intensity (quadratic falloff)
5. WHEN shake is active THEN the Camera SHALL apply both positional and rotational shake
6. WHEN multiple impacts occur THEN the Camera SHALL add trauma values (capped at 1.0)

### Requirement 2: Dodge Particle Bursts

**User Story:** As a player, I want particle bursts when I successfully dodge obstacles, so that skillful play feels rewarding.

#### Acceptance Criteria

1. WHEN a near-miss occurs THEN the ParticleSystem SHALL emit 15-20 spark particles in the dodge direction
2. WHEN a perfect dodge occurs THEN the ParticleSystem SHALL emit 30-40 particles with enhanced color and size
3. WHEN dodge particles emit THEN the ParticleSystem SHALL use the obstacle's position as origin
4. WHEN dodge particles emit THEN the ParticleSystem SHALL direct particles away from the obstacle
5. WHEN a perfect dodge occurs THEN the ParticleSystem SHALL also emit a brief flash/glow effect
6. WHEN emitting dodge particles THEN the ParticleSystem SHALL use brand colors (orange for near-miss, cyan for perfect)

### Requirement 3: Enhanced Speed Lines

**User Story:** As a player, I want dynamic speed lines at high velocity, so that I feel the rush of going fast.

#### Acceptance Criteria

1. WHEN speed exceeds 25 units/sec THEN the Renderer SHALL begin showing speed lines
2. WHEN speed increases THEN the Renderer SHALL increase speed line opacity and count proportionally
3. WHEN speed lines are active THEN the Renderer SHALL animate lines moving toward the player
4. WHEN at maximum speed THEN the Renderer SHALL show speed lines at 60% opacity with chromatic aberration
5. WHEN speed drops below threshold THEN the Renderer SHALL smoothly fade out speed lines
6. WHEN speed lines are active THEN the Renderer SHALL pulse line brightness in sync with distance milestones

### Requirement 4: Camera Tilt on Lane Changes

**User Story:** As a player, I want the camera to tilt when I change lanes, so that movement feels dynamic and responsive.

#### Acceptance Criteria

1. WHEN the player initiates a lane change THEN the Camera SHALL tilt (roll) in the direction of movement
2. WHEN tilting THEN the Camera SHALL apply maximum tilt of 3 degrees
3. WHEN the lane change completes THEN the Camera SHALL smoothly return to neutral tilt
4. WHEN calculating tilt THEN the Camera SHALL use ease-out curve for snappy response
5. WHEN multiple lane changes occur rapidly THEN the Camera SHALL blend tilt values smoothly
6. WHEN the player is airborne THEN the Camera SHALL apply reduced tilt (50% intensity)

### Requirement 5: Impact Flash Effect

**User Story:** As a player, I want a brief screen flash on collision, so that hits are unmistakably communicated.

#### Acceptance Criteria

1. WHEN the player collides with an obstacle THEN the Renderer SHALL display a brief white flash overlay
2. WHEN flash is triggered THEN the Renderer SHALL fade from 30% opacity to 0% over 150ms
3. WHEN flash is active THEN the Renderer SHALL use additive blending for the overlay
4. WHEN the player loses their last life THEN the Renderer SHALL use red flash instead of white

### Requirement 6: Combo Visual Escalation

**User Story:** As a player, I want visual effects to escalate with my combo, so that building combos feels increasingly exciting.

#### Acceptance Criteria

1. WHEN combo reaches 5 THEN the ParticleSystem SHALL add a subtle glow trail behind the player
2. WHEN combo reaches 10 THEN the ParticleSystem SHALL intensify the glow and add spark particles
3. WHEN combo reaches 15+ THEN the ParticleSystem SHALL add screen edge glow effect
4. WHEN combo resets THEN the visual effects SHALL fade out over 0.5 seconds
5. WHEN combo milestone is reached THEN the FeedbackSystem SHALL trigger a brief time pulse (1.1x for 100ms)

### Requirement 7: Landing Impact Effects

**User Story:** As a player, I want satisfying visual feedback when landing from jumps, so that the physics feel weighty.

#### Acceptance Criteria

1. WHEN landing from a jump THEN the ParticleSystem SHALL emit dust particles proportional to fall velocity
2. WHEN landing with high velocity (>15 units/sec) THEN the Camera SHALL apply minor shake (trauma 0.15)
3. WHEN landing THEN the PlayerController SHALL apply squash animation (already implemented)
4. WHEN landing on track THEN the Renderer SHALL briefly brighten nearby track lights
5. WHEN landing THEN the FeedbackSystem SHALL trigger haptic feedback proportional to velocity

### Requirement 8: Continuous Speed Feedback

**User Story:** As a player, I want continuous visual feedback about my speed, so that velocity feels tangible.

#### Acceptance Criteria

1. WHEN speed exceeds 30 units/sec THEN the Renderer SHALL apply subtle motion blur to environment
2. WHEN speed exceeds 40 units/sec THEN the Renderer SHALL increase FOV dynamically (already implemented)
3. WHEN at high speed THEN the ParticleSystem SHALL emit continuous engine trail particles
4. WHEN speed changes significantly THEN the audio system SHALL adjust wind sound intensity
5. WHEN approaching maximum speed THEN the screen edges SHALL show subtle vignette effect
