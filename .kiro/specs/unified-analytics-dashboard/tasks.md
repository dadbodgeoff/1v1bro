    # Implementation Plan

- [x] 1. Create core enterprise UI components and types
  - [x] 1.1 Create SessionLink component for clickable session IDs
    - Create `frontend/src/components/analytics/enterprise/SessionLink.tsx`
    - Render session ID as clickable link with hover state
    - Accept onClick handler to open Session Explorer
    - _Requirements: 2.1_
  - [x] 1.2 Create SessionExplorer modal component
    - Create `frontend/src/components/analytics/enterprise/SessionExplorer.tsx`
    - Display session context (device, browser, OS, UTM params)
    - Display chronological event timeline with timestamps
    - Highlight conversion events with distinct styling
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 1.3 Write property test for session events chronological ordering
    - **Property 2: Session events are chronologically ordered**
    - **Validates: Requirements 2.3**
  - [x] 1.4 Create enhanced MetricCard with trend comparison
    - Update `frontend/src/components/analytics/enterprise/MetricCard.tsx`
    - Add previousValue prop for trend calculation
    - Display trend indicator (up/down arrow with percentage)
    - _Requirements: 10.4_
  - [x] 1.5 Write property test for MetricCard required fields
    - **Property 11: Metric card displays all required fields**
    - **Validates: Requirements 10.4**
  - [x] 1.6 Create PanelHeader component for consistent panel headers
    - Create `frontend/src/components/analytics/enterprise/PanelHeader.tsx`
    - Display title, description, and action buttons
    - _Requirements: 4.4_

- [x] 2. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add backend API endpoint for session events
  - [x] 3.1 Create session events endpoint in analytics API
    - Add `/analytics/dashboard/session/{session_id}/events` endpoint
    - Return session details, events, and pageviews for the session
    - Include conversion event flagging
    - _Requirements: 2.2, 2.3_
  - [x] 3.2 Write unit tests for session events endpoint
    - Test event ordering
    - Test session context retrieval
    - _Requirements: 2.3, 2.4_

- [x] 4. Update SessionsPanel with clickable session IDs
  - [x] 4.1 Integrate SessionLink into SessionsPanel
    - Replace plain session ID text with SessionLink component
    - Add state for selected session ID
    - _Requirements: 2.1_
  - [x] 4.2 Add SessionExplorer modal to SessionsPanel
    - Render SessionExplorer when session is selected
    - Fetch session events on modal open
    - _Requirements: 2.2_

- [x] 5. Update JourneysPanel with session drill-down
  - [x] 5.1 Add SessionLink to JourneysPanel table
    - Make session IDs clickable in journey list
    - _Requirements: 2.1_
  - [x] 5.2 Integrate SessionExplorer modal
    - Allow viewing full session from journey context
    - _Requirements: 2.2_

- [x] 6. Update EventsPanel with session drill-down
  - [x] 6.1 Add SessionLink to EventsPanel table
    - Make session IDs clickable in events list
    - _Requirements: 2.1_

- [x] 7. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance OverviewPanel with advertiser metrics
  - [x] 8.1 Add device breakdown chart with percentages
    - Display mobile/tablet/desktop as donut chart
    - Show percentages that sum to 100%
    - _Requirements: 1.2_
  - [x] 8.2 Write property test for device breakdown percentages
    - **Property 1: Device breakdown percentages sum to 100%**
    - **Validates: Requirements 1.2**
  - [x] 8.3 Add trend comparison to metric cards
    - Fetch previous period data for comparison
    - Display trend indicators on all key metrics
    - _Requirements: 1.1, 10.4_
  - [x] 8.4 Add top traffic sources with conversion rates
    - Display referrer sources with visitor counts
    - Calculate and display conversion rate per source
    - _Requirements: 1.3_

- [x] 9. Enhance FunnelsPanel with drop-off analysis
  - [x] 9.1 Add drop-off percentage display
    - Calculate drop-off as 100% - conversion rate
    - Display visual drop-off indicators
    - _Requirements: 3.2_
  - [x] 9.2 Write property test for funnel calculations
    - **Property 4: Funnel conversion rates are correctly calculated**
    - **Property 5: Funnel drop-off is inverse of conversion**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 9.3 Add time-to-conversion metrics
    - Display average time between funnel steps
    - _Requirements: 3.5_

- [x] 10. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Enhance PerformancePanel with Web Vitals grading
  - [x] 11.1 Add grade indicators to Web Vitals cards
    - Implement grading logic based on standard thresholds
    - Display Good/Needs Improvement/Poor badges
    - _Requirements: 13.1_
  - [x] 11.2 Write property test for Web Vitals grading
    - **Property 14: Web Vitals grading follows thresholds**
    - **Validates: Requirements 13.1**
  - [x] 11.3 Add percentile display (p75, p95)
    - Display p75 and p95 alongside averages
    - _Requirements: 13.2_
  - [x] 11.4 Write property test for percentile ordering
    - **Property 15: Percentile ordering**
    - **Validates: Requirements 13.2**
  - [x] 11.5 Add warning indicators for degraded performance
    - Highlight metrics below thresholds
    - _Requirements: 13.4_

- [x] 12. Enhance CohortsPanel with retention matrix
  - [x] 12.1 Add visual retention matrix with color coding
    - Display retention percentages in grid format
    - Color-code cells based on retention rate
    - _Requirements: 7.4_
  - [x] 12.2 Write property test for retention percentages
    - **Property 8: Cohort retention percentages are bounded**
    - **Validates: Requirements 7.3**

- [x] 13. Enhance ExperimentsPanel with statistical significance
  - [x] 13.1 Add variant weight validation
    - Ensure variant weights sum to 100%
    - _Requirements: 8.3_
  - [x] 13.2 Write property test for variant weights
    - **Property 9: Experiment variant weights sum to 100%**
    - **Validates: Requirements 8.3**
  - [x] 13.3 Add winning variant highlighting
    - Highlight variant with statistical significance
    - _Requirements: 8.4_

- [x] 14. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Enhance SurvivalPanel with progression funnel
  - [x] 15.1 Add player progression funnel visualization
    - Display page visit → game load → first run → milestones
    - _Requirements: 9.4_
  - [x] 15.2 Write property test for survival funnel
    - **Property 10: Survival funnel is monotonically decreasing**
    - **Validates: Requirements 9.4**

- [x] 16. Enhance UTMPanel with campaign metrics
  - [x] 16.1 Add conversion rate calculation
    - Calculate and display conversion rate per campaign
    - _Requirements: 14.2_
  - [x] 16.2 Write property test for conversion rate calculation
    - **Property 16: Campaign conversion rate calculation**
    - **Validates: Requirements 14.2**
  - [x] 16.3 Add trend comparison to previous period
    - Display trend indicators for each campaign
    - _Requirements: 14.4_

- [x] 17. Enhance HeatmapPanel with scroll depth milestones
  - [x] 17.1 Add scroll depth milestone display
    - Show 25%, 50%, 75%, 100% milestone percentages
    - _Requirements: 12.3_
  - [x] 17.2 Write property test for scroll depth ordering
    - **Property 13: Scroll depth milestones are monotonically decreasing**
    - **Validates: Requirements 12.3**

- [ ] 18. Add export functionality enhancements
  - [ ] 18.1 Add date range to export filenames
    - Include start and end date in exported file names
    - _Requirements: 11.3_
  - [ ] 18.2 Write property test for export date range inclusion
    - **Property 12: Export includes date range**
    - **Validates: Requirements 11.3**

- [ ] 19. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Update AnalyticsDashboard page with tab categories
  - [ ] 20.1 Organize tabs into logical categories
    - Group tabs: Traffic, Engagement, Technical, Experiments, Game
    - Add visual category separators
    - _Requirements: 4.1_
  - [ ] 20.2 Implement date range preservation across tabs
    - Ensure date range state persists when switching tabs
    - _Requirements: 4.2_
  - [ ] 20.3 Write property test for date range preservation
    - **Property 6: Date range preservation across navigation**
    - **Validates: Requirements 4.2**
  - [ ] 20.4 Implement lazy loading for panels
    - Only fetch data when tab becomes active
    - _Requirements: 4.3_

- [ ] 21. Update routing and redirects
  - [ ] 21.1 Verify legacy route redirects
    - Ensure `/admin/analytics/*` redirects to `/analytics`
    - _Requirements: 4.1_
  - [ ] 21.2 Remove deprecated analytics pages
    - Clean up AdminAnalytics.tsx, AdminAnalyticsEnterprise.tsx, AdminSurvivalAnalytics.tsx
    - Update imports and references
    - _Requirements: 4.1_

- [ ] 22. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
