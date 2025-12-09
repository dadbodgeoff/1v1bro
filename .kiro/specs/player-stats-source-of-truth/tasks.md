# Implementation Plan

## Summary

The source of truth architecture has been established and implemented:

- [x] 1. Establish `user_profiles` as single source of truth for all aggregated stats
  - All stats columns exist in user_profiles table
  - StatsRepository and UnifiedStatsRepository both update user_profiles
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement ELO update in game end flow
  - [x] 2.1 Add LeaderboardService.update_ratings() call to GameService.end_game()
    - Added import and call after persistence.update_player_stats()
    - Updates current_elo in user_profiles
    - Creates audit record in match_results
    - _Requirements: 2.2, 2.3_

- [x] 3. Verify read paths use correct source
  - [x] 3.1 StatsService reads from user_profiles via StatsRepository
    - _Requirements: 3.1_
  - [x] 3.2 LeaderboardService reads from user_profiles via UnifiedStatsRepository
    - _Requirements: 4.1, 4.2_
  - [x] 3.3 Match history reads from games + match_results for ELO changes
    - _Requirements: 5.1, 5.2_

## Architecture Verification

### Write Flow (Match End)
```
GameService.end_game()
├── persistence.save_game()           → games table ✅
├── persistence.update_player_stats() → user_profiles ✅
└── leaderboard_service.update_ratings()
    ├── user_profiles (ELO) ✅
    └── match_results (audit) ✅
```

### Read Flow
| Feature | Source | Status |
|---------|--------|--------|
| Profile Stats | user_profiles | ✅ |
| ELO Leaderboard | user_profiles | ✅ |
| Category Leaderboards | user_profiles | ✅ |
| Match History | games + match_results | ✅ |

## Files Modified

1. `backend/app/services/game/game_service.py`
   - Added ELO update call in end_game() method
   - Added elo_result to GameResult

2. `backend/app/schemas/game.py`
   - Added elo_result field to GameResult schema

## No Changes Needed

The following were already correctly implemented:
- StatsRepository updates user_profiles
- LeaderboardRepository reads from user_profiles
- GameRepository.get_user_history_enhanced joins with match_results for ELO
- UnifiedStatsRepository reads/writes user_profiles
