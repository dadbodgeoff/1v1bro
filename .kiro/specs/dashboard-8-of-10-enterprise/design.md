# Design Document: Dashboard 8/10+ Enterprise Upgrade

## Overview

This design document outlines the enhancements needed to bring the Dashboard to a true 8/10+ enterprise rating. Building on the existing `dashboard-enterprise-upgrade` implementation, this upgrade focuses on accessibility, error handling, performance, real-time updates, and polish.

The implementation follows progressive enhancement principles, ensuring the dashboard remains functional while adding advanced features.

## Architecture

### Component Hierarchy

```
Home.tsx (Page)
├── DashboardLayout (existing)
│   ├── Sidebar (existing)
│   ├── DashboardHeader (existing)
│   │   └── NotificationDropdown (new)
│   └── OfflineBanner (new)
├── CommandPalette (new - global)
├── KeyboardShortcutsModal (new)
└── Dashboard Content
    ├── WidgetErrorBoundary (new - wraps each widget)
    │   └── [Widget Component]
    ├── HeroPlaySection (existing - enhanced)
    ├── BattlePassWidget (existing - enhanced)
    ├── ShopPreviewWidget (existing - enhanced)
    ├── LoadoutPreviewWidget (existing - enhanced)
    ├── StatsSummaryWidget (existing - enhanced)
    ├── MatchHistoryWidget (existing - enhanced)
    └── FriendsWidget (existing - enhanced)
```

### Data Flow

```
┌─────────────────────┐     ┌──────────────────┐
│   WebSocket Hub     │────▶│  Real-time Store │
│   (friends, match)  │     │                  │
└─────────────────────┘     └──────────────────┘
                                    │
                                    ▼
┌─────────────────────┐     ┌──────────────────┐
│   useDashboard      │────▶│  Dashboard Page  │
│   (orchestrator)    │     │                  │
└─────────────────────┘     └──────────────────┘
        │
        ├── useAccessibility() ──▶ Focus management, ARIA
        ├── useOfflineStatus() ──▶ Network state, cached data
        ├── useAnalytics() ──────▶ Event tracking
        └── useKeyboardShortcuts() ▶ Command palette, shortcuts
```

## Components and Interfaces

### WidgetErrorBoundary

Error boundary wrapper for individual widgets.

```typescript
interface WidgetErrorBoundaryProps {
  widgetName: string
  children: ReactNode
  onError?: (error: Error, widgetName: string) => void
  fallback?: ReactNode
  isCritical?: boolean
}

interface WidgetErrorState {
  hasError: boolean
  error: Error | null
  retryCount: number
}
```

### NotificationDropdown

Notification panel component for the header.

```typescript
interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLButtonElement>
}

interface Notification {
  id: string
  type: 'friend_request' | 'match_invite' | 'reward' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
}

interface NotificationGroup {
  type: Notification['type']
  label: string
  notifications: Notification[]
}
```

### CommandPalette

Global command palette component.

```typescript
interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface Command {
  id: string
  label: string
  shortcut?: string
  icon?: ReactNode
  action: () => void
  category: 'navigation' | 'action' | 'recent'
}
```

### OfflineBanner

Network status indicator component.

```typescript
interface OfflineBannerProps {
  isOffline: boolean
  lastOnline?: Date
  onRetry: () => void
}
```

### Enhanced Widget Props

All widgets receive enhanced props for accessibility and analytics.

```typescript
interface EnhancedWidgetProps {
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
  tabIndex?: number
  onKeyDown?: (e: KeyboardEvent) => void
  
  // Analytics
  onInteraction?: (action: string, metadata?: Record<string, unknown>) => void
  
  // Data freshness
  lastUpdated?: Date
  isStale?: boolean
  onRefresh?: () => void
  
  // Loading states
  isRefreshing?: boolean
  loadingTimeout?: number
}
```

## Data Models

### Notification State

```typescript
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  lastFetched: Date | null
}
```

### Offline State

```typescript
interface OfflineState {
  isOffline: boolean
  lastOnline: Date | null
  cachedData: {
    profile: Profile | null
    battlePass: PlayerBattlePass | null
    friends: Friend[]
    matches: RecentMatch[]
    shop: Cosmetic[]
  }
  staleness: Record<string, Date>
}
```

### Analytics Event

```typescript
interface AnalyticsEvent {
  name: string
  timestamp: Date
  sessionId: string
  userId?: string
  properties: Record<string, unknown>
}

type DashboardEvent = 
  | { name: 'dashboard_viewed'; properties: { source: string } }
  | { name: 'widget_clicked'; properties: { widget: string; destination: string } }
  | { name: 'widget_error'; properties: { widget: string; error: string; retryCount: number } }
  | { name: 'matchmaking_started'; properties: { category: string; map: string } }
  | { name: 'notification_clicked'; properties: { type: string; notificationId: string } }
```

### Keyboard Shortcuts

```typescript
interface KeyboardShortcut {
  key: string
  modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt')[]
  action: string
  description: string
  handler: () => void
}

const DASHBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'k', modifiers: ['cmd'], action: 'openCommandPalette', description: 'Open command palette' },
  { key: 'f', modifiers: ['cmd', 'shift'], action: 'findMatch', description: 'Find Match' },
  { key: 'p', modifiers: ['cmd'], action: 'goToProfile', description: 'Go to Profile' },
  { key: '?', modifiers: [], action: 'showHelp', description: 'Show keyboard shortcuts' },
]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Focus Order Consistency

*For any* dashboard state with N interactive widgets, pressing Tab N times from the first widget SHALL cycle through all widgets in the defined order (HeroPlaySection → BattlePassWidget → ShopPreviewWidget → LoadoutPreviewWidget → StatsSummaryWidget → MatchHistoryWidget → FriendsWidget) and return to the first widget.

**Validates: Requirements 1.2**

### Property 2: ARIA Label Completeness

*For any* widget with data, the widget container SHALL have aria-label containing the widget title and aria-describedby referencing an element containing the current state summary.

**Validates: Requirements 1.4**

### Property 3: Error Boundary Isolation

*For any* widget that throws an error, the error boundary SHALL catch the error and render a fallback UI, while all other widgets SHALL continue to render normally without errors.

**Validates: Requirements 2.1, 2.4**

### Property 4: Loading State Consistency

*For any* widget in loading state, the widget SHALL render a skeleton loader with the same dimensions as the loaded content, and the skeleton SHALL have animation-delay based on widget index (index * 50ms).

**Validates: Requirements 3.1, 3.2**

### Property 5: Hover Effect Application

*For any* clickable widget, hovering SHALL apply transform: translateY(-2px) and transition-duration: 150ms, and removing hover SHALL restore the original position.

**Validates: Requirements 4.2**

### Property 6: WebSocket Friend Status Update

*For any* WebSocket message with type 'friend_status_change', the FriendsWidget SHALL update within 2 seconds to reflect the new online/offline status of the specified friend.

**Validates: Requirements 5.1, 5.2**

### Property 7: Notification Grouping

*For any* list of notifications, the NotificationDropdown SHALL group notifications by type and display groups in order: friend_request, match_invite, reward, system.

**Validates: Requirements 8.2**

### Property 8: Command Palette Fuzzy Search

*For any* search query in the command palette, the results SHALL include all commands where the query matches any substring of the command label (case-insensitive), ordered by match position.

**Validates: Requirements 9.3**

### Property 9: Data Staleness Detection

*For any* widget data with lastUpdated timestamp older than 5 minutes, the widget SHALL display a "Data may be outdated" indicator and the isStale flag SHALL be true.

**Validates: Requirements 10.6**

### Property 10: Analytics Event Logging

*For any* widget click event, the analytics service SHALL receive a 'widget_clicked' event containing the widget name, destination URL, and timestamp within 100ms of the click.

**Validates: Requirements 11.2**

## Error Handling

### Widget Error Recovery

```typescript
// Error boundary recovery flow
1. Widget throws error
2. ErrorBoundary catches error
3. Log error to telemetry with widget name
4. Display fallback UI with retry button
5. On retry: increment retryCount, reset error state, re-render widget
6. If retryCount > 3: show "Contact support" message
```

### Network Error Handling

```typescript
// Offline handling flow
1. Network goes offline (navigator.onLine = false)
2. Display OfflineBanner at top of dashboard
3. Switch all widgets to cached data mode
4. Show "Offline - showing cached data" on each widget
5. Disable actions that require network (Find Match, etc.)
6. On reconnect: hide banner, refresh stale data, re-enable actions
```

### WebSocket Reconnection

```typescript
// WebSocket reconnection strategy
1. Connection lost
2. Show connection status indicator
3. Attempt reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
4. After 5 failed attempts: show "Connection lost" with manual retry
5. On reconnect: sync missed events, update UI
```

## Testing Strategy

### Dual Testing Approach

The implementation uses both unit tests and property-based tests:

**Unit Tests:**
- Component rendering with various states
- User interaction flows (keyboard, mouse)
- Error boundary behavior
- Notification panel interactions
- Command palette search and selection

**Property-Based Tests:**
- Use `fast-check` library for TypeScript
- Minimum 100 iterations per property
- Test accessibility, data transformations, and state management
- Verify invariants across random inputs

### Property Test Implementation

```typescript
// Example: Property 3 - Error Boundary Isolation
import fc from 'fast-check'

describe('WidgetErrorBoundary', () => {
  /**
   * **Feature: dashboard-8-of-10-enterprise, Property 3: Error Boundary Isolation**
   * **Validates: Requirements 2.1, 2.4**
   */
  it('isolates errors to individual widgets', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }), // widget index that throws
        (errorWidgetIndex) => {
          const widgets = renderDashboardWithError(errorWidgetIndex)
          
          // Error widget should show fallback
          expect(widgets[errorWidgetIndex].hasError).toBe(true)
          
          // All other widgets should render normally
          widgets.forEach((widget, index) => {
            if (index !== errorWidgetIndex) {
              expect(widget.hasError).toBe(false)
              expect(widget.isRendered).toBe(true)
            }
          })
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test File Structure

```
frontend/src/components/dashboard/enterprise/__tests__/
├── WidgetErrorBoundary.test.tsx
├── NotificationDropdown.test.tsx
├── CommandPalette.test.tsx
├── OfflineBanner.test.tsx
├── accessibility.test.ts
├── keyboard-shortcuts.test.ts
└── dashboard-8-of-10-properties.test.ts  // Property-based tests

frontend/src/hooks/__tests__/
├── useAccessibility.test.ts
├── useOfflineStatus.test.ts
├── useAnalytics.test.ts
└── useKeyboardShortcuts.test.ts
```

### Test Tags

Each property-based test will be tagged with:
```typescript
/**
 * **Feature: dashboard-8-of-10-enterprise, Property N: [Property Name]**
 * **Validates: Requirements X.Y**
 */
```

## Performance Considerations

### Virtualization

- MatchHistoryWidget: Virtualize when > 20 items
- NotificationDropdown: Virtualize when > 50 notifications
- Use `react-virtual` or `@tanstack/react-virtual`

### Memoization

- Wrap all widgets with `React.memo`
- Use `useMemo` for computed values (filtered friends, grouped notifications)
- Use `useCallback` for event handlers passed to children

### Lazy Loading

- Images: `loading="lazy"` with blur-up placeholder
- Command palette: Dynamic import on first Cmd+K
- Notification panel: Load notifications on first open

### Prefetching

- After 5s idle: prefetch profile, battlepass data
- On hover over nav item: prefetch that page's data
- Use `<link rel="prefetch">` for likely next pages

