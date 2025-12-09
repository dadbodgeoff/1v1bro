# Implementation Plan

- [x] 1. Fix WebSocket token security vulnerability
  - [x] 1.1 Update frontend WebSocket service to use subprotocol authentication
    - Modify `frontend/src/services/websocket.ts` to pass token via `Sec-WebSocket-Protocol` header
    - Remove token from URL query parameters
    - Use format: `new WebSocket(url, ['auth.' + token])`
    - _Requirements: 2.1, 2.4_
  - [x] 1.2 Update frontend matchmaking hook to use subprotocol authentication
    - Modify `frontend/src/hooks/useMatchmaking.ts` to pass token via subprotocol
    - Remove token from URL query parameters
    - _Requirements: 2.1, 2.4_
  - [x] 1.3 Update backend WebSocket endpoints to extract token from subprotocol
    - Modify `backend/app/main.py` matchmaking endpoint to read from `sec-websocket-protocol` header
    - Modify `backend/app/main.py` lobby endpoint to read from `sec-websocket-protocol` header
    - Accept connection with matching subprotocol to complete handshake
    - Remove `token: str = Query(None)` parameter
    - _Requirements: 2.2, 2.3_
  - [x] 1.4 Write property test for WebSocket token security
    - **Property 2: WebSocket Token Not In URL**
    - **Property 3: WebSocket Subprotocol Authentication**
    - **Validates: Requirements 2.1, 2.2, 2.4**

- [x] 2. Fix react-refresh/only-export-components errors (78 errors)
  - [x] 2.1 Audit and fix component export patterns
    - Add eslint-disable comments for legitimate non-component exports (constants, types, utilities)
    - Move non-component exports to separate files where appropriate
    - _Requirements: 1.2_

- [x] 3. Fix @typescript-eslint/no-unused-vars errors (38 errors)
  - [x] 3.1 Remove or prefix unused variables
    - Remove truly unused variables
    - Prefix intentionally unused variables with underscore (e.g., `_unused`)
    - _Requirements: 1.3_

- [x] 4. Fix @typescript-eslint/no-explicit-any errors (24 errors)
  - [x] 4.1 Replace any types with proper TypeScript types
    - Define proper interfaces/types for all `any` usages
    - Use `unknown` where type is truly unknown and add type guards
    - _Requirements: 1.4_

- [x] 5. Fix react-hooks errors (44 errors total)
  - [x] 5.1 Fix react-hooks/set-state-in-effect errors (21 errors)
    - Refactor setState calls in useEffect to use proper initialization patterns
    - Use useMemo for derived state, useCallback for stable callbacks
    - Initialize state from props/context directly where possible
    - _Requirements: 1.5_
  - [x] 5.2 Fix react-hooks/purity errors (9 errors)
    - Ensure hooks don't have side effects during render
    - Move side effects to useEffect
    - _Requirements: 3.1_
  - [x] 5.3 Fix react-hooks/refs errors (8 errors)
    - Fix ref mutation patterns to not mutate during render
    - Use useEffect for ref mutations
    - _Requirements: 3.2_
  - [x] 5.4 Fix react-hooks/immutability errors (5 errors)
    - Replace direct state mutations with immutable updates
    - Use spread operator or immer for complex updates
    - _Requirements: 3.4_
  - [x] 5.5 Fix react-hooks/preserve-manual-memoization error (1 error)
    - Ensure manual useMemo/useCallback are preserved correctly
    - _Requirements: 3.3_

- [x] 6. Fix remaining errors (11 errors)
  - [x] 6.1 Fix no-useless-catch errors (8 errors)
    - Remove catch blocks that only rethrow
    - Add meaningful error handling or context where needed
    - _Requirements: 4.1_
  - [x] 6.2 Fix no-case-declarations errors (2 errors)
    - Wrap case blocks containing declarations in braces
    - _Requirements: 4.2_
  - [x] 6.3 Fix @typescript-eslint/ban-ts-comment error (1 error)
    - Remove or justify ts-ignore comment
    - _Requirements: 1.1_

- [x] 7. Checkpoint - Verify all ESLint errors resolved
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npx eslint src --ext .ts,.tsx` and verify zero errors
  - **Property 1: ESLint Zero Errors**
  - **Validates: Requirements 1.1**
