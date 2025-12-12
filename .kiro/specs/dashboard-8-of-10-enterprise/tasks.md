# Implementation Plan: Dashboard 8/10+ Enterprise Upgrade

## Overview

This implementation plan enhances the Dashboard to achieve 8/10+ enterprise quality. The plan builds incrementally on the existing dashboard-enterprise-upgrade implementation, adding accessibility, error handling, real-time updates, and polish.

**Estimated Time:** 2-3 weeks
**New Files:** 12 files
**Modified Files:** 10 files

---

## Phase 1: Error Boundaries and Resilience

- [x] 1. Create WidgetErrorBoundary Component
  - [x] 1.1 Create `frontend/src/components/dashboard/enterprise/WidgetErrorBoundary.tsx`
    - Implement React error boundary class component
    - Add widgetName prop for error identification
    - Display fallback UI with error message and retry button
    - Track retryCount in state (max 3 retries)
    - Show "Contact support" after max retries for critical widgets
    - Log errors to telemetry service with widget name and error details
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.2 Write property test for error boundary isolation
    - **Property 3: Error Boundary Isolation**
    - **Validates: Requirements 2.1, 2.4**

- [x] 1.3 Wrap all dashboard widgets with WidgetErrorBoundary
  - Update Home.tsx to wrap each widget with WidgetErrorBoundary
  - Pass appropriate widgetName and isCritical props
  - Mark HeroPlaySection as critical widget
  - _Requirements: 2.1, 2.4_

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Accessibility Foundation

- [x] 3. Create useAccessibility Hook
  - [x] 3.1 Create `frontend/src/hooks/useAccessibility.ts`
    - Implement focus management utilities
    - Add useFocusTrap hook for modals/dropdowns
    - Add useArrowNavigation hook for widget internal navigation
    - Add useAnnounce hook for ARIA live region announcements
    - Export focus ring CSS class utility
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [ ]* 3.2 Write property test for focus order consistency
    - **Property 1: Focus Order Consistency**
    - **Validates: Requirements 1.2**

- [x] 4. Add ARIA Labels to All Widgets
  - [x] 4.1 Update all enterprise widgets with ARIA attributes
    - Add aria-label to widget containers with title
    - Add aria-describedby referencing state summary element
    - Add role="region" to widget containers
    - Add aria-live="polite" for data update announcements
    - Ensure all buttons have accessible names
    - _Requirements: 1.4, 1.5_

  - [ ]* 4.2 Write property test for ARIA label completeness
    - **Property 2: ARIA Label Completeness**
    - **Validates: Requirements 1.4**

- [x] 5. Add Keyboard Navigation
  - [x] 5.1 Implement tab order and focus indicators
    - Add tabIndex to all interactive widgets
    - Add visible focus indicator (2px indigo-500 outline)
    - Implement arrow key navigation within widgets
    - Add focus trap to modals and dropdowns
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Loading States and Animations

- [x] 7. Enhance Loading States
  - [x] 7.1 Create consistent skeleton loaders for all widgets
    - Add stagger animation with 50ms delay between widgets
    - Implement shimmer animation effect
    - Add "Taking longer than expected" message after 5s timeout
    - Show subtle refresh indicator when refreshing (not replacing content)
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 7.2 Write property test for loading state consistency
    - **Property 4: Loading State Consistency**
    - **Validates: Requirements 3.1, 3.2**

- [x] 8. Add Micro-interactions and Animations
  - [x] 8.1 Implement entrance animations
    - Add staggered fade-up effect on dashboard load (100ms delay)
    - Add fade-up effect when widget finishes loading (200ms)
    - Use framer-motion for smooth animations
    - _Requirements: 4.1, 3.3_

  - [x] 8.2 Implement hover and click effects
    - Add lift effect on hover (translateY -2px, 150ms transition)
    - Add press effect on click (scale 0.98, 100ms transition)
    - Add pulse animation for data value changes
    - Add bounce animation for notification badges
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 8.3 Write property test for hover effect application
    - **Property 5: Hover Effect Application**
    - **Validates: Requirements 4.2**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Real-time Updates

- [x] 10. Enhance WebSocket Integration
  - [x] 10.1 Create `frontend/src/hooks/useRealtimeUpdates.ts`
    - Subscribe to friend status change events
    - Subscribe to match found events
    - Subscribe to ELO change events
    - Handle WebSocket reconnection with exponential backoff
    - Display connection status indicator on disconnect
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 10.2 Write property test for WebSocket friend status update
    - **Property 6: WebSocket Friend Status Update**
    - **Validates: Requirements 5.1, 5.2**

- [x] 11. Add Toast Notifications for Real-time Events
  - [x] 11.1 Create toast notification system
    - Show toast when friend comes online
    - Show toast for new notifications
    - Use existing toast library or create minimal implementation
    - _Requirements: 5.1, 8.5_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Notification System

- [x] 13. Create NotificationDropdown Component
  - [x] 13.1 Create `frontend/src/components/dashboard/NotificationDropdown.tsx`
    - Implement dropdown panel anchored to bell icon
    - Group notifications by type (friend_request, match_invite, reward, system)
    - Display notification title, message, and relative timestamp
    - Mark individual notifications as read on click
    - Add "Mark all as read" button
    - Navigate to relevant page on notification click
    - Implement focus trap within dropdown
    - Close on Escape key or click outside
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ]* 13.2 Write property test for notification grouping
    - **Property 7: Notification Grouping**
    - **Validates: Requirements 8.2**

- [x] 14. Integrate NotificationDropdown with DashboardHeader
  - [x] 14.1 Update DashboardHeader to use NotificationDropdown
    - Add state for dropdown open/close
    - Fetch notifications on mount and periodically
    - Update badge count from notification state
    - Handle new notification arrivals
    - _Requirements: 8.1, 8.5_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Command Palette and Keyboard Shortcuts

- [x] 16. Create useKeyboardShortcuts Hook
  - [x] 16.1 Create `frontend/src/hooks/useKeyboardShortcuts.ts`
    - Register global keyboard shortcuts
    - Handle Cmd/Ctrl+K for command palette
    - Handle Cmd/Ctrl+Shift+F for Find Match
    - Handle Cmd/Ctrl+P for Profile navigation
    - Handle ? for help modal
    - Prevent conflicts with browser shortcuts
    - _Requirements: 9.1, 9.4, 9.5, 9.6_

- [x] 17. Create CommandPalette Component
  - [x] 17.1 Create `frontend/src/components/dashboard/CommandPalette.tsx`
    - Implement modal with search input
    - Display recent actions, navigation options, quick commands
    - Implement fuzzy search filtering in real-time
    - Show keyboard shortcuts next to commands
    - Navigate/execute on Enter or click
    - Close on Escape or click outside
    - Use dynamic import for lazy loading
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 17.2 Write property test for command palette fuzzy search
    - **Property 8: Command Palette Fuzzy Search**
    - **Validates: Requirements 9.3**

- [x] 18. Create KeyboardShortcutsModal Component
  - [x] 18.1 Create `frontend/src/components/dashboard/KeyboardShortcutsModal.tsx`
    - Display all available keyboard shortcuts
    - Group shortcuts by category (navigation, actions, general)
    - Show key combinations with visual key caps
    - Close on Escape or click outside
    - _Requirements: 9.6_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Data Freshness and Offline Support

- [x] 20. Create useOfflineStatus Hook
  - [x] 20.1 Create `frontend/src/hooks/useOfflineStatus.ts`
    - Monitor navigator.onLine status
    - Track lastOnline timestamp
    - Manage cached data for offline display
    - Track data staleness per widget
    - Trigger refresh on reconnection
    - _Requirements: 10.3, 10.4, 10.5_

- [x] 21. Create OfflineBanner Component
  - [x] 21.1 Create `frontend/src/components/dashboard/OfflineBanner.tsx`
    - Display banner when offline
    - Show "Offline - showing cached data" message
    - Add manual retry button
    - Animate in/out smoothly
    - _Requirements: 10.3_

- [x] 22. Add Data Freshness Indicators
  - [x] 22.1 Add "Last updated" timestamps to widgets
    - Show timestamp on hover
    - Add refresh icon button to manually refresh
    - Display "Data may be outdated" for data > 5 minutes old
    - _Requirements: 10.1, 10.2, 10.6_

  - [ ]* 22.2 Write property test for data staleness detection
    - **Property 9: Data Staleness Detection**
    - **Validates: Requirements 10.6**

- [x] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Analytics and Telemetry

- [x] 24. Create useAnalytics Hook
  - [x] 24.1 Create `frontend/src/hooks/useAnalytics.ts`
    - Implement event logging interface
    - Track dashboard_viewed on mount
    - Track widget_clicked on widget interactions
    - Track widget_error on error boundary catches
    - Track matchmaking_started on Find Match
    - Track action duration and success/failure
    - Respect user privacy settings
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 24.2 Write property test for analytics event logging
    - **Property 10: Analytics Event Logging**
    - **Validates: Requirements 11.2**

- [x] 25. Integrate Analytics with Dashboard
  - [x] 25.1 Add analytics tracking to all widgets
    - Track widget clicks with destination
    - Track error events with retry count
    - Track Find Match with category and map
    - Track notification interactions
    - _Requirements: 11.2, 11.3, 11.4_

- [x] 26. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 9: Performance Optimization

- [x] 27. Add Memoization to Widgets
  - [x] 27.1 Wrap all widgets with React.memo
    - Add React.memo to all enterprise widget components
    - Use useMemo for computed values (filtered lists, grouped data)
    - Use useCallback for event handlers
    - Verify render counts with React DevTools
    - _Requirements: 6.3_

- [ ] 28. Add Virtualization for Long Lists
  - [ ] 28.1 Virtualize MatchHistoryWidget for large histories
    - Use @tanstack/react-virtual for virtualization
    - Apply when match count > 20
    - Maintain scroll position on data updates
    - _Requirements: 6.2_

- [x] 29. Add Lazy Loading and Prefetching
  - [x] 29.1 Implement image lazy loading
    - Add loading="lazy" to all images
    - Add blur-up placeholder effect
    - _Requirements: 6.4_

  - [ ] 29.2 Implement data prefetching
    - Prefetch profile and battlepass data after 5s idle
    - Prefetch page data on nav item hover
    - _Requirements: 6.6_

- [x] 30. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 10: Empty State Polish

- [x] 31. Enhance Empty States
  - [x] 31.1 Add illustrated empty states to all widgets
    - Create or source simple illustrations for each widget
    - Add contextual messages and CTAs
    - MatchHistoryWidget: "No matches yet" + "Play Your First Match" ✓ (already implemented)
    - FriendsWidget: "No friends online" + "Invite Friends" with share link ✓ (already implemented)
    - ShopPreviewWidget: "Shop refreshing soon" + countdown ✓ (already implemented)
    - LoadoutPreviewWidget: Slot-specific prompts ("Get your first skin!") ✓ (already implemented)
    - StatsSummaryWidget: "Play to earn stats" + first achievement indicators ✓ (already implemented)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 32. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 11: Integration and Polish

- [x] 33. Update Dashboard Exports
  - [x] 33.1 Update `frontend/src/components/dashboard/enterprise/index.ts`
    - Export WidgetErrorBoundary
    - Export NotificationDropdown
    - Export CommandPalette
    - Export KeyboardShortcutsModal
    - Export OfflineBanner
    - _Requirements: 1.4_

- [x] 34. Final Integration
  - [x] 34.1 Update Home.tsx with all enhancements
    - Integrate all new components
    - Add keyboard shortcut listeners
    - Add analytics tracking
    - Add offline status handling
    - Verify all accessibility features work together
    - _Requirements: All_

- [x] 35. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 35. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Files
| File | Purpose |
|------|---------|
| components/dashboard/enterprise/WidgetErrorBoundary.tsx | Error boundary wrapper |
| components/dashboard/NotificationDropdown.tsx | Notification panel |
| components/dashboard/CommandPalette.tsx | Command palette modal |
| components/dashboard/KeyboardShortcutsModal.tsx | Shortcuts help modal |
| components/dashboard/OfflineBanner.tsx | Offline status banner |
| hooks/useAccessibility.ts | Focus management utilities |
| hooks/useKeyboardShortcuts.ts | Keyboard shortcut handling |
| hooks/useOfflineStatus.ts | Network status tracking |
| hooks/useRealtimeUpdates.ts | WebSocket event handling |
| hooks/useAnalytics.ts | Analytics event logging |
| __tests__/dashboard-8-of-10-properties.test.ts | Property-based tests |
| __tests__/accessibility.test.ts | Accessibility tests |

### Modified Files
| File | Changes |
|------|---------|
| pages/Home.tsx | Integrate all enhancements |
| components/dashboard/DashboardHeader.tsx | Add NotificationDropdown |
| components/dashboard/DashboardLayout.tsx | Add OfflineBanner, CommandPalette |
| components/dashboard/enterprise/*.tsx | Add ARIA, analytics, animations |
| components/dashboard/enterprise/index.ts | Export new components |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Focus Order Consistency | dashboard-8-of-10-properties.test.ts | 1.2 |
| 2. ARIA Label Completeness | dashboard-8-of-10-properties.test.ts | 1.4 |
| 3. Error Boundary Isolation | dashboard-8-of-10-properties.test.ts | 2.1, 2.4 |
| 4. Loading State Consistency | dashboard-8-of-10-properties.test.ts | 3.1, 3.2 |
| 5. Hover Effect Application | dashboard-8-of-10-properties.test.ts | 4.2 |
| 6. WebSocket Friend Status Update | dashboard-8-of-10-properties.test.ts | 5.1, 5.2 |
| 7. Notification Grouping | dashboard-8-of-10-properties.test.ts | 8.2 |
| 8. Command Palette Fuzzy Search | dashboard-8-of-10-properties.test.ts | 9.3 |
| 9. Data Staleness Detection | dashboard-8-of-10-properties.test.ts | 10.6 |
| 10. Analytics Event Logging | dashboard-8-of-10-properties.test.ts | 11.2 |

---

*Total Tasks: 35 phases with sub-tasks*
*Estimated Time: 2-3 weeks*
*New Files: 12*
*Property Tests: 10*
