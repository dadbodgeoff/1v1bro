# Survival Game Analytics Suite - Comprehensive Audit

## Executive Summary

This document audits all analytics tracking needed for your survival-based game, covering both unauthenticated (landing page, instant play) and authenticated (full game) user journeys.

---

## Part 1: Non-Authenticated Analytics (Landing Page & Guest Play)

### 1.1 Landing Page Tracking

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `page_visit` | ✅ Exists | Landing page load | session_id, visitor_id, referrer, utm_* |
| `arcade_boot_start` | ✅ Exists | Arcade boot sequence starts | timestamp |
| `arcade_boot_phase` | ✅ Exists | Boot phase transitions | phase name |
| `arcade_boot_skip` | ✅ Exists | User skips boot | time_elapsed_ms |
| `arcade_boot_complete` | ✅ Exists | Boot sequence done | total_duration_ms, was_skipped |
| `arcade_cta_visible` | ✅ Exists | CTA becomes visible | - |
| `arcade_cta_click` | ✅ Exists | CTA clicked | - |
| `scroll_depth` | ✅ Exists | Scroll tracking | max_depth_percent |
| `time_on_page` | ✅ Exists | Page duration | seconds |
| `demo_play` | ✅ Exists | Demo started | - |
| `demo_complete` | ✅ Exists | Demo finished | duration |
| `click_signup` | ✅ Exists | Signup button clicked | - |
| `click_login` | ✅ Exists | Login button clicked | - |
| `instant_play_start` | ✅ Exists | Instant play clicked | - |
| `feature_section_view` | 🆕 NEW | Feature section scrolled into view | section_name |
| `video_play` | 🆕 NEW | Promo video started | video_id |
| `video_complete` | 🆕 NEW | Promo video finished | video_id, watch_percent |
| `social_link_click` | 🆕 NEW | Social media link clicked | platform |

### 1.2 Guest Survival Play Tracking (SurvivalInstantPlay)

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `game_load` | ✅ Exists | Game assets loaded | session_id, device_type, browser |
| `first_run_start` | ✅ Exists | First run begins | - |
| `first_run_complete` | ✅ Exists | First run ends | - |
| `second_run_start` | ✅ Exists | Second run begins | - |
| `run_complete` | ✅ Exists | Any run ends | Full RunAnalytics |
| `reached_100m` | ✅ Exists | Distance milestone | - |
| `reached_500m` | ✅ Exists | Distance milestone | - |
| `reached_1000m` | ✅ Exists | Distance milestone | - |
| `session_end` | ✅ Exists | Session closes | total_runs, playtime, best_distance |
| `trivia_answer` | 🆕 NEW | Trivia question answered | correct, category, time_to_answer_ms |
| `trivia_timeout` | 🆕 NEW | Trivia question timed out | category |
| `trivia_streak` | 🆕 NEW | Streak milestone reached | streak_count |
| `conversion_prompt_shown` | ✅ Exists | Save prompt displayed | prompt_id, match_count |
| `conversion_prompt_clicked` | ✅ Exists | User clicks to sign up | prompt_id |
| `conversion_prompt_dismissed` | ✅ Exists | User dismisses prompt | prompt_id |
| `leaderboard_preview_view` | 🆕 NEW | Guest views rank preview | estimated_rank |
| `guest_session_transfer` | 🆕 NEW | Guest converts to account | runs_transferred, xp_transferred |

### 1.3 Guest Session Data (Local Storage)

| Data Point | Status | Description |
|------------|--------|-------------|
| `total_runs` | ✅ Exists | Number of runs played |
| `best_distance` | ✅ Exists | Personal best distance |
| `best_score` | ✅ Exists | Personal best score |
| `preview_xp_earned` | ✅ Exists | XP that would be earned |
| `questions_answered` | ✅ Exists | Total trivia questions |
| `questions_correct` | ✅ Exists | Correct answers |
| `trivia_streak` | ✅ Exists | Best trivia streak |
| `session_start_time` | 🆕 NEW | When session began |
| `total_playtime_ms` | 🆕 NEW | Total time playing |
| `runs_history` | 🆕 NEW | Array of run summaries |

---

## Part 2: Authenticated Analytics (Full Game)

### 2.1 Authentication Events

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `signup_form_start` | ✅ Exists | Registration form opened | - |
| `signup_form_complete` | ✅ Exists | Registration successful | - |
| `signup_form_error` | ✅ Exists | Registration failed | error_type |
| `login_success` | 🆕 NEW | User logged in | method (email/oauth) |
| `login_failure` | 🆕 NEW | Login failed | error_type |
| `logout` | 🆕 NEW | User logged out | session_duration_ms |
| `session_resume` | 🆕 NEW | Returning user session | days_since_last_visit |
| `password_reset_request` | 🆕 NEW | Password reset initiated | - |
| `password_reset_complete` | 🆕 NEW | Password successfully reset | - |
| `account_settings_change` | 🆕 NEW | Settings modified | setting_type |
| `profile_update` | 🆕 NEW | Profile info changed | fields_changed |

### 2.2 Authenticated Survival Play Tracking

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `survival_session_start` | ✅ Exists | Game session begins | user_id, device_type |
| `survival_run_start` | ✅ Exists | Run begins | run_number |
| `survival_run_complete` | ✅ Exists | Run ends | Full RunAnalytics + user_id |
| `survival_personal_best` | 🆕 NEW | New PB achieved | distance, previous_best, improvement |
| `survival_rank_change` | 🆕 NEW | Leaderboard rank changed | old_rank, new_rank |
| `survival_milestone` | 🆕 NEW | Distance milestone reached | milestone_type, distance |
| `survival_achievement_unlock` | 🆕 NEW | Achievement earned | achievement_id, achievement_name |
| `survival_ghost_loaded` | 🆕 NEW | Ghost replay loaded | ghost_distance |
| `survival_ghost_beaten` | 🆕 NEW | Player beat their ghost | margin_distance |
| `survival_cosmetic_equipped` | 🆕 NEW | Runner skin changed | cosmetic_id, cosmetic_rarity |
| `survival_quick_restart` | 🆕 NEW | Quick restart used | previous_distance |
| `survival_pause` | 🆕 NEW | Game paused | distance_at_pause |
| `survival_resume` | 🆕 NEW | Game resumed | pause_duration_ms |
| `survival_quit` | 🆕 NEW | Game quit mid-run | distance_at_quit, reason |

### 2.3 Trivia/Quiz Analytics (Both Auth & Guest)

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `trivia_question_shown` | 🆕 NEW | Question displayed | question_id, category, difficulty |
| `trivia_answer_submitted` | 🆕 NEW | Answer given | question_id, answer, correct, time_ms |
| `trivia_streak_started` | 🆕 NEW | Streak begins | - |
| `trivia_streak_broken` | 🆕 NEW | Streak ends | streak_count, broken_by |
| `trivia_streak_milestone` | 🆕 NEW | Streak milestone | streak_count (5, 10, 25, 50) |
| `trivia_category_performance` | 🆕 NEW | Category stats | category, correct_rate, avg_time |
| `trivia_difficulty_performance` | 🆕 NEW | Difficulty stats | difficulty, correct_rate |

### 2.4 Leaderboard Analytics

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `leaderboard_view` | 🆕 NEW | Leaderboard page opened | user_rank |
| `leaderboard_scroll` | 🆕 NEW | Scrolled through ranks | max_rank_viewed |
| `leaderboard_player_click` | 🆕 NEW | Clicked on a player | target_rank, target_user_id |
| `leaderboard_filter_change` | 🆕 NEW | Filter applied | filter_type, filter_value |
| `leaderboard_refresh` | 🆕 NEW | Manual refresh | - |

### 2.5 Shop/Cosmetics Analytics

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `shop_view` | 🆕 NEW | Shop page opened | - |
| `shop_item_view` | 🆕 NEW | Item details viewed | item_id, item_type, price |
| `shop_item_preview` | 🆕 NEW | 3D preview opened | item_id |
| `shop_purchase_start` | 🆕 NEW | Purchase initiated | item_id, price, currency |
| `shop_purchase_complete` | 🆕 NEW | Purchase successful | item_id, price, currency |
| `shop_purchase_failed` | 🆕 NEW | Purchase failed | item_id, error_type |
| `cosmetic_equip` | 🆕 NEW | Item equipped | item_id, slot |
| `cosmetic_unequip` | 🆕 NEW | Item unequipped | item_id, slot |

### 2.6 Battle Pass Analytics

| Event | Status | Description | Data Points |
|-------|--------|-------------|-------------|
| `battlepass_view` | 🆕 NEW | Battle pass page opened | current_level, current_xp |
| `battlepass_level_up` | 🆕 NEW | Level increased | new_level, xp_earned |
| `battlepass_reward_claim` | 🆕 NEW | Reward claimed | level, reward_type, reward_id |
| `battlepass_purchase` | 🆕 NEW | Premium pass bought | price |
| `battlepass_tier_skip` | 🆕 NEW | Tier skipped with currency | tiers_skipped, cost |

---

## Part 3: Game Balance Analytics (For Tuning)

### 3.1 Death Analysis

| Metric | Status | Description |
|--------|--------|-------------|
| `death_by_obstacle_type` | ✅ Exists | Deaths per obstacle |
| `death_by_distance_bucket` | ✅ Exists | Deaths at distance ranges |
| `death_by_speed` | ✅ Exists | Deaths at speed ranges |
| `death_by_pattern` | ✅ Exists | Deaths by pattern type |
| `death_heatmap` | ✅ Exists | X/Z position of deaths |
| `death_during_combo` | ✅ Exists | Deaths while in combo |
| `death_after_trivia` | 🆕 NEW | Deaths within 2s of trivia |
| `death_by_lane` | ✅ Exists | Deaths per lane |
| `death_reaction_time` | 🆕 NEW | Time since last input at death |

### 3.2 Difficulty Curve Analysis

| Metric | Status | Description |
|--------|--------|-------------|
| `survival_rate_by_distance` | ✅ Exists | % surviving each 100m |
| `avg_speed_by_distance` | ✅ Exists | Speed progression |
| `obstacle_density_by_distance` | 🆕 NEW | Obstacles per 100m |
| `pattern_frequency_by_distance` | 🆕 NEW | Pattern distribution |
| `player_skill_distribution` | 🆕 NEW | Distance percentiles |

### 3.3 Input Analysis (Game Feel)

| Metric | Status | Description |
|--------|--------|-------------|
| `inputs_per_second` | ✅ Exists | Input frequency |
| `reaction_time_distribution` | ✅ Exists | Reaction time stats |
| `coyote_jump_usage` | ✅ Exists | Coyote time utilization |
| `input_buffer_usage` | ✅ Exists | Buffer utilization |
| `double_tap_frequency` | ✅ Exists | Double tap patterns |
| `input_spam_detection` | ✅ Exists | Spam patterns |
| `lane_change_patterns` | 🆕 NEW | L-R-L patterns |
| `jump_slide_ratio` | 🆕 NEW | Jump vs slide preference |

### 3.4 Combo System Analysis

| Metric | Status | Description |
|--------|--------|-------------|
| `combo_distribution` | ✅ Exists | Combo count buckets |
| `combo_end_reasons` | ✅ Exists | Why combos end |
| `combo_score_contribution` | ✅ Exists | % of score from combos |
| `combo_duration_avg` | ✅ Exists | Average combo length |
| `max_combo_by_skill` | 🆕 NEW | Max combo vs player skill |

---

## Part 4: Performance Analytics

### 4.1 Client Performance

| Metric | Status | Description |
|--------|--------|-------------|
| `fps_average` | ✅ Exists | Average FPS |
| `fps_minimum` | ✅ Exists | Minimum FPS |
| `frame_drops` | ✅ Exists | Count of drops <30fps |
| `performance_grade` | ✅ Exists | A-F grade |
| `load_time` | ✅ Exists | Asset load duration |
| `memory_usage` | 🆕 NEW | JS heap size |
| `gpu_tier` | 🆕 NEW | Detected GPU capability |

### 4.2 Error Tracking

| Metric | Status | Description |
|--------|--------|-------------|
| `js_errors` | ✅ Exists | JavaScript errors |
| `webgl_errors` | 🆕 NEW | WebGL/Three.js errors |
| `asset_load_failures` | 🆕 NEW | Failed asset loads |
| `api_errors` | 🆕 NEW | Backend API errors |

---

## Part 5: Conversion Funnels

### 5.1 Guest to Signup Funnel

```
Landing Page Visit
    ↓ (track: page_visit)
Arcade Boot Complete
    ↓ (track: arcade_boot_complete)
Instant Play Click
    ↓ (track: instant_play_start)
Game Load Complete
    ↓ (track: game_load)
First Run Start
    ↓ (track: first_run_start)
First Run Complete
    ↓ (track: first_run_complete)
Second Run Start
    ↓ (track: second_run_start)
Conversion Prompt Shown
    ↓ (track: conversion_prompt_shown)
Signup Click
    ↓ (track: conversion_prompt_clicked)
Signup Complete
    ↓ (track: signup_form_complete)
```

### 5.2 Retention Funnel

```
Day 0: First Visit
    ↓
Day 1: Return Visit
    ↓
Day 3: Return Visit
    ↓
Day 7: Return Visit
    ↓
Day 14: Return Visit
    ↓
Day 30: Return Visit
```

### 5.3 Monetization Funnel

```
Shop View
    ↓ (track: shop_view)
Item View
    ↓ (track: shop_item_view)
Item Preview
    ↓ (track: shop_item_preview)
Purchase Start
    ↓ (track: shop_purchase_start)
Purchase Complete
    ↓ (track: shop_purchase_complete)
```

---

## Summary: New Events to Implement

### High Priority (Core Game Balance)
1. `trivia_answer` - Track every trivia interaction
2. `survival_personal_best` - Track PB achievements
3. `survival_milestone` - Track distance milestones
4. `death_after_trivia` - Balance trivia timing
5. `death_reaction_time` - Tune difficulty

### Medium Priority (User Experience)
6. `login_success` / `login_failure` - Auth tracking
7. `survival_ghost_beaten` - Engagement metric
8. `leaderboard_view` - Feature usage
9. `shop_view` / `shop_item_view` - Monetization funnel
10. `battlepass_level_up` - Progression tracking

### Lower Priority (Polish)
11. `feature_section_view` - Landing page optimization
12. `video_play` / `video_complete` - Content engagement
13. `cosmetic_equip` - Customization usage
14. `gpu_tier` / `memory_usage` - Performance profiling
