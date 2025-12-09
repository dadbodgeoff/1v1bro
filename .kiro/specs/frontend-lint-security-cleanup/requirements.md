# Requirements Document

## Introduction

This specification addresses two critical issues in the frontend codebase: 195 ESLint errors that need resolution for code quality and maintainability, and a security vulnerability where WebSocket authentication tokens are passed via query parameters (exposing them in server logs, browser history, and referrer headers). The cleanup will improve code quality, reduce technical debt, and enhance security posture before production deployment.

## Glossary

- **ESLint**: A static code analysis tool for identifying problematic patterns in JavaScript/TypeScript code
- **WebSocket**: A protocol providing full-duplex communication channels over a single TCP connection
- **JWT**: JSON Web Token, used for authentication
- **Query Parameter**: Data appended to a URL after the `?` character
- **Subprotocol**: A WebSocket feature allowing custom protocols to be negotiated during handshake

## Requirements

### Requirement 1

**User Story:** As a developer, I want all ESLint errors resolved, so that the codebase maintains consistent quality standards and CI/CD pipelines pass.

#### Acceptance Criteria

1. WHEN the ESLint linter runs on the frontend source code THEN the system SHALL report zero errors
2. WHEN a component file exports non-component values THEN the system SHALL separate exports into dedicated files or use named exports appropriately
3. WHEN variables are declared but unused THEN the system SHALL remove them or prefix with underscore if intentionally unused
4. WHEN `any` type is used THEN the system SHALL replace it with proper TypeScript types
5. WHEN setState is called synchronously in useEffect THEN the system SHALL refactor to use proper initialization patterns or useMemo/useCallback

### Requirement 2

**User Story:** As a security engineer, I want WebSocket authentication tokens removed from query parameters, so that tokens are not exposed in server logs, browser history, or referrer headers.

#### Acceptance Criteria

1. WHEN a WebSocket connection is established THEN the system SHALL transmit the authentication token via the WebSocket subprotocol header instead of query parameters
2. WHEN the backend receives a WebSocket connection THEN the system SHALL extract and validate the token from the Sec-WebSocket-Protocol header
3. WHEN an invalid or missing token is provided THEN the system SHALL reject the connection with appropriate error code
4. WHEN the token is transmitted THEN the system SHALL ensure it never appears in URL strings

### Requirement 3

**User Story:** As a developer, I want React hooks to follow best practices, so that the application avoids subtle bugs and performance issues.

#### Acceptance Criteria

1. WHEN useEffect dependencies are specified THEN the system SHALL include all referenced values or document why exclusions are intentional
2. WHEN refs are used in components THEN the system SHALL follow React ref patterns without direct mutation of current values during render
3. WHEN memoization is applied THEN the system SHALL preserve manual memoization decisions consistently
4. WHEN state updates occur THEN the system SHALL use immutable update patterns

### Requirement 4

**User Story:** As a developer, I want error handling to be meaningful, so that debugging is easier and errors are properly propagated.

#### Acceptance Criteria

1. WHEN a try-catch block catches an error THEN the system SHALL either transform the error, add context, or remove the useless catch
2. WHEN switch statements contain variable declarations THEN the system SHALL wrap case blocks in braces to create proper scope
