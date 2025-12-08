# Implementation Plan

- [ ] 1. Add emote definitions to seed script
  - [x] 1.1 Add BATTLEPASS_EMOTES constant with 8 emote entries
    - Define emote data: name, type="emote", rarity, description, image_url, price_coins=0
    - Use storage_url() helper for image URLs
    - Assign sort_order 300-307 for emotes
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create seed_battlepass_emotes() function
    - Insert or update emotes in cosmetics_catalog table
    - Return dict mapping emote names to IDs
    - Log each emote creation/update
    - _Requirements: 1.1_

  - [x] 1.3 Write property test for emote data validity
    - **Property 1: Emote Data Validity**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1. Add emote definitions to seed script

- [ ] 2. Implement tier distribution logic
  - [x] 2.1 Add emote tier selection with fixed seed
    - Define reserved tiers: skins {1,8,15,22,29,35}, playercards {2,9,16,23,30,34}
    - Calculate available tiers: set(range(1,36)) - reserved
    - Use random.seed(42) for reproducibility
    - Select 8 random tiers from available
    - _Requirements: 2.1, 5.1_

  - [x] 2.2 Update create_tier_rewards() to include emotes
    - Add emote_tiers dict mapping tier numbers to emote names
    - Integrate emote rewards into tier creation loop
    - Preserve existing skin and playercard logic
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Write property test for tier non-overlap
    - **Property 2: Emote Tier Non-Overlap**
    - **Validates: Requirements 2.1**

  - [x] 2.4 Write property test for tier distribution invariant
    - **Property 3: Tier Distribution Invariant**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 2.5 Write property test for reproducible tier selection
    - **Property 4: Reproducible Tier Selection**
    - **Validates: Requirements 5.1**

- [x] 2. Implement tier distribution logic

- [ ] 3. Update main() function and logging
  - [x] 3.1 Integrate emote seeding into main flow
    - Call seed_battlepass_emotes() after playercards
    - Pass emote_ids to create_tier_rewards()
    - Update final summary to include emote distribution
    - _Requirements: 5.3_

  - [x] 3.2 Add emote tier logging
    - Print emote tier assignments in summary
    - Log total cosmetic count (20 = 6 skins + 6 playercards + 8 emotes)
    - _Requirements: 5.3_

- [x] 3. Update main() function and logging

- [x] 4. Checkpoint - Verify seed script works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add frontend property tests for image processing
  - [x] 5.1 Write property test for background removal pixel processing
    - **Property 5: Background Removal Pixel Processing**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test in `frontend/src/game/assets/ImageProcessor.test.ts`
    - Use fast-check to generate pixel values

  - [x] 5.2 Write property test for emote type display
    - **Property 6: Emote Type Display**
    - **Validates: Requirements 3.2**
    - Verify emote cosmetics have type="emote" when loaded

- [x] 6. Final Checkpoint - Make sure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
