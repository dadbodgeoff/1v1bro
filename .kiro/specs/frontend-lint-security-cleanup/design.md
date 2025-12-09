# Design Document: Frontend Lint & Security Cleanup

## Overview

This design addresses 195 ESLint errors in the frontend codebase and a security vulnerability where WebSocket authentication tokens are exposed in query parameters. The solution involves batch-fixing lint errors by category and migrating WebSocket authentication from query parameters to the Sec-WebSocket-Protocol header.

## Architecture

### ESLint Error Resolution Strategy

The 195 errors break down into fixable categories:

| Rule | Count | Fix Strategy |
|------|-------|--------------|
| react-refresh/only-export-components | 78 | Add `// eslint-disable-next-line` for legitimate non-component exports (constants, types) |
| @typescript-eslint/no-unused-vars | 38 | Remove unused vars or prefix with `_` |
| @typescript-eslint/no-explicit-any | 24 | Replace with proper types |
| react-hooks/set-state-in-effect | 21 | Refactor to use initialization patterns |
| react-hooks/purity | 9 | Fix impure hook patterns |
| react-hooks/refs | 8 | Fix ref mutation patterns |
| no-useless-catch | 8 | Remove or enhance catch blocks |
| react-hooks/immutability | 5 | Use immutable update patterns |
| no-case-declarations | 2 | Add braces to case blocks |
| react-hooks/preserve-manual-memoization | 1 | Fix memoization |
| @typescript-eslint/ban-ts-comment | 1 | Remove or justify ts-ignore |

### WebSocket Token Security Architecture

**Current (Insecure):**
```
Frontend → ws://host/ws/lobby?token=JWT_TOKEN → Backend
                              ↑
                    Token exposed in:
                    - Server access logs
                    - Browser history
                    - Referrer headers
```

**Proposed (Secure):**
```
Frontend → ws://host/ws/lobby → Backend
           Sec-WebSocket-Protocol: auth.JWT_TOKEN
                              ↑
                    Token in header only:
                    - Not logged by default
                    - Not in browser history
                    - Not in referrer
```

## Components and Interfaces

### Frontend WebSocket Changes

```typescript
// websocket.ts - Updated connection method
connect(lobbyCode: string): Promise<void> {
  const token = useAuthStore.getState().token;
  const wsUrl = `${protocol}//${host}/ws/${lobbyCode}`;
  
  // Pass token via subprotocol header
  this.ws = new WebSocket(wsUrl, [`auth.${token}`]);
}
```

### Backend WebSocket Changes

```python
# main.py - Updated WebSocket endpoint
@app.websocket("/ws/{lobby_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    lobby_code: str,
):
    # Extract token from Sec-WebSocket-Protocol header
    protocols = websocket.headers.get("sec-websocket-protocol", "")
    token = None
    for protocol in protocols.split(","):
        protocol = protocol.strip()
        if protocol.startswith("auth."):
            token = protocol[5:]  # Remove "auth." prefix
            break
    
    # Validate token
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return
    
    # Accept with the auth protocol to complete handshake
    await websocket.accept(subprotocol=f"auth.{token}")
```

## Data Models

No new data models required. This is a refactoring effort.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ESLint Zero Errors
*For any* frontend source file, running ESLint SHALL produce zero errors.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2**

### Property 2: WebSocket Token Not In URL
*For any* WebSocket connection URL constructed by the frontend, the URL string SHALL NOT contain the authentication token as a query parameter.
**Validates: Requirements 2.1, 2.4**

### Property 3: WebSocket Subprotocol Authentication
*For any* WebSocket connection, the authentication token SHALL be transmitted via the Sec-WebSocket-Protocol header with "auth." prefix.
**Validates: Requirements 2.1, 2.2**

### Property 4: Invalid Token Rejection
*For any* WebSocket connection attempt with an invalid or missing token, the backend SHALL reject the connection with close code 4001.
**Validates: Requirements 2.3**

## Error Handling

### WebSocket Authentication Errors

| Scenario | Close Code | Reason |
|----------|------------|--------|
| No token in subprotocol | 4001 | "Authentication required" |
| Invalid/expired token | 4001 | "Invalid token" |
| Token validation failure | 4001 | "Authentication failed" |

### ESLint Error Categories

Errors will be fixed in batches by category to minimize risk:
1. **Safe auto-fixes**: unused vars, useless catch
2. **Type fixes**: explicit any → proper types
3. **Hook refactors**: setState in effect, refs, purity
4. **Export restructuring**: component-only exports

## Testing Strategy

### Unit Tests
- Verify WebSocket URL construction does not include token
- Verify subprotocol header format is correct

### Property-Based Tests
- **Property 1**: Run ESLint on all source files, assert zero errors
- **Property 2**: Generate random tokens, verify URL never contains them
- **Property 3**: Verify all WebSocket connections use subprotocol auth
- **Property 4**: Test invalid token scenarios return 4001

### Integration Tests
- End-to-end WebSocket connection with subprotocol auth
- Verify existing game functionality works with new auth method

### Testing Framework
- Frontend: Vitest with property-based testing via fast-check
- Backend: pytest with hypothesis for property-based tests
- Each property test runs minimum 100 iterations
