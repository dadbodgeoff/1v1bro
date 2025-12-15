# Survival Mode UX/UI Design Plan
## AAA Enterprise Studio Standards

**Date:** December 13, 2025  
**Status:** Phase 1 Complete - Breathing HUD Implemented

---

## Executive Summary

This document outlines the UX/UI design plan for the Survival Runner game mode and its upcoming Trivia Integration (Knowledge Gates). The design philosophy follows AAA studio standards: **every element should feel alive, responsive, and rewarding**.

---

## Part 1: Survival Runner HUD (✅ Implemented)

### Design Philosophy: "UI That Breathes"

Every HUD element responds to game events with physics-based animations that feel organic rather than mechanical.

### 1.1 Score Counter
- **Spring physics** for smooth value transitions (stiffness: 300, damping: 20)
- **Punch-in pulse** on score increase (1.0 → 1.4 → 1.0 with elastic overshoot)
- **Escalating glow** intensity based on total score
- **Color shift** from orange to gold at high scores

### 1.2 Health Hearts
- **Trauma-based shake** when hit (decaying over 500ms)
- **Individual heart animation** - lost heart scales up 1.3x during shake
- **Grayscale + opacity** for lost hearts
- **Drop shadow glow** on filled hearts

### 1.3 Distance Meter
- **Smooth spring interpolation** (stiffness: 100, damping: 15)
- **Color progression** white → cyan as distance increases
- **Subtle glow** that intensifies with progress

### 1.4 Speed Indicator
- **Dynamic color coding**: green → yellow → red
- **Pulsing dot** indicator
- **Pulse on significant speed changes** (threshold: 5 u/s)

### 1.5 Combo Display
- **Bouncy spring** (stiffness: 200, damping: 10)
- **Tier-based colors**: cyan → purple → orange → red → gold
- **Escalating glow** per tier (every 5 combo)
- **Multiplier display** with matching color

---

## Part 2: Persistent Quiz Panel (✅ Implemented)

### 2.1 Design Philosophy: "Always Active, Never Blocking"

The quiz runs alongside the survival game - players must multitask between dodging obstacles and answering questions. This creates a unique dual-challenge experience.

### 2.2 Quiz Panel Design

```
┌──────────────────────────────┐
│  ⏱️ 24   Q3  │  5✓ | 83%    │  ← Compact header with timer & stats
├──────────────────────────────┤
│                              │
│  What year did Fortnite      │  ← Question (max 3 lines)
│  Battle Royale launch?       │
│                              │
│  ┌────────────────────────┐  │
│  │ A │ 2016               │  │  ← Compact answer buttons
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ B │ 2017  ← Correct    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ C │ 2018               │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ D │ 2019               │  │
│  └────────────────────────┘  │
│                              │
│  Press 1-4 or A-D            │  ← Keyboard hint
└──────────────────────────────┘
```

### 2.3 Quiz Mechanics

**Timer:**
- 30 seconds per question
- Timeout = lose 1 life
- Color progression: green (>18s) → yellow (>9s) → orange (>4.5s) → red (<4.5s)
- Pulse animation in final 5 seconds

**Scoring:**
- Max points: 1000 (answer within 10 seconds)
- Min points: 200 (correct but slow)
- Fast bonus threshold: 20+ seconds remaining = max points
- Linear interpolation between thresholds
- Wrong answer: 0 points + lose 1 life

**Flow:**
1. Question appears immediately when game starts
2. Player answers while running
3. Brief result feedback (1.2s)
4. Next question auto-loads
5. Continues until game over

### 2.4 Accessibility Features

- Keyboard navigation: 1-4 or A-D keys
- High contrast colors for readability
- Clear visual feedback for correct/wrong
- Timer visible at all times
- Stats bar shows progress (question #, correct count, accuracy %)

### 2.5 Position & Layout

- Fixed position: top-right, below main HUD
- Width: 288px (w-72)
- Semi-transparent background with blur
- Doesn't overlap with game controls or main HUD elements

---

## Part 3: Implementation Roadmap

### Phase 1: Breathing HUD ✅ Complete
- [x] Spring physics system (HUDAnimations.ts)
- [x] useAnimatedValue hook
- [x] Score counter with pulse
- [x] Health hearts with shake
- [x] Distance meter with easing
- [x] Combo display with tiers
- [x] Speed indicator with color

### Phase 2: Persistent Quiz Panel ✅ Complete
- [x] QuizPanel.tsx component (compact, always-visible)
- [x] useQuizRunner hook (manages question queue)
- [x] 30-second timer per question
- [x] Speed-based scoring (max 1000pts, min 200pts)
- [x] Timeout = lose life
- [x] Auto-advance to next question
- [x] Keyboard navigation (1-4, A-D)
- [x] Stats display (question #, correct count, accuracy)
- [x] Quiz score tracking separate from game score
- [x] Streak tracking with visual indicator

### Phase 3: Polish & Audio
- [ ] Timer tick sounds (final 5 seconds)
- [ ] Correct/wrong feedback sounds
- [ ] Touch support for mobile
- [ ] Accessibility (screen reader)
- [ ] Reduced motion mode

---

## Part 4: Technical Architecture

### 4.1 Component Structure

```
frontend/src/survival/
├── components/
│   ├── SurvivalHUD.tsx          ✅ Implemented
│   ├── HUDAnimations.ts         ✅ Implemented
│   ├── useAnimatedValue.ts      ✅ Implemented
│   ├── QuizPanel.tsx            ✅ Implemented (persistent quiz)
│   ├── TriviaModal.tsx          ✅ Implemented (legacy modal)
│   └── TransitionOverlay.tsx    ✅ Implemented
├── hooks/
│   ├── useSurvivalGame.ts       ✅ Updated (loseLife, addScore)
│   ├── useQuizRunner.ts         ✅ Implemented (quiz state management)
│   └── useTriviaGate.ts         ✅ Implemented (legacy)
└── types/
    └── survival.ts              ✅ Has trivia types
```

### 4.2 State Flow (Persistent Quiz)

```
SurvivalTest.tsx
    │
    ├── useSurvivalGame() ─────────────────┐
    │   └── loseLife(), addScore()         │
    │                                       │
    └── useQuizRunner() ───────────────────┤
        │                                   │
        ├── startQuiz() on game start      │
        ├── pauseQuiz() on game pause      │
        ├── resumeQuiz() on game resume    │
        │                                   │
        └── QuizPanel ─────────────────────┘
            │
            ├── onAnswer(correct) → addScore(points)
            ├── onAnswer(wrong) → loseLife()
            └── onTimeout() → loseLife()
```

### 4.3 Integration Points

**Existing Quiz System:**
- `frontend/src/stores/quizStore.ts` - Question management
- `frontend/src/types/quiz.ts` - Question types
- `frontend/src/data/fortnite-quiz-data.ts` - Question bank

**Survival Engine:**
- `SurvivalCallbacks.onKnowledgeGate` - Trigger point
- `TransitionSystem` - Slow-mo and overlays
- `FeedbackSystem` - Sound/haptic events

---

## Part 5: Visual Design Tokens

### Colors
```css
--trivia-gate-glow: #22d3ee;      /* Cyan */
--trivia-correct: #22c55e;         /* Green */
--trivia-wrong: #ef4444;           /* Red */
--trivia-timer-safe: #22c55e;      /* Green */
--trivia-timer-warn: #eab308;      /* Yellow */
--trivia-timer-danger: #ef4444;    /* Red */
```

### Typography
```css
--trivia-question: 'Rajdhani', sans-serif;
--trivia-answer: 'Inter', sans-serif;
--trivia-timer: 'Orbitron', monospace;
```

### Animations
```css
--spring-snappy: cubic-bezier(0.34, 1.56, 0.64, 1);
--spring-bouncy: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

---

## Part 6: Accessibility

### Keyboard Navigation
- Tab through answers
- Enter to select
- Escape to skip (if allowed)
- Number keys 1-4 for quick select

### Screen Reader
- Question announced on modal open
- Answer options with letter prefix
- Timer countdown announced at 5s, 3s, 1s
- Result announced with explanation

### Reduced Motion
- Disable spring animations
- Instant transitions
- Static timer (no pulse)
- Simple color changes only

---

## Conclusion

The survival mode now features:
1. **Breathing HUD** - AAA-quality feedback for score, health, distance, speed, and combo
2. **Persistent Quiz Panel** - Always-visible quiz that runs alongside gameplay

Players must multitask between dodging obstacles and answering trivia questions. Fast correct answers earn up to 1000 points, while timeouts or wrong answers cost a life. This creates an engaging dual-challenge experience that tests both reflexes and knowledge.
