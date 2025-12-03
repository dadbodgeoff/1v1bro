# Implementation Plan

## Phase 1: Backend Core Infrastructure

- [x] 1. Set up backend project structure and dependencies




  - [x] 1.1 Create backend directory structure with all folders (app/core, app/middleware, app/database, app/services, app/api, app/websocket, app/schemas, app/utils)


    - Initialize Python package structure with __init__.py files


    - _Requirements: 9.5_


  - [x] 1.2 Create requirements.txt with all dependencies




    - FastAPI, uvicorn, pydantic, pydantic-settings, supabase, python-jose, websockets, python-multipart


    - _Requirements: 9.1_


  - [x] 1.3 Create requirements-dev.txt for testing dependencies


    - pytest, pytest-asyncio, hypothesis, httpx, pytest-cov


    - _Requirements: Testing Strategy_


  - [ ] 1.4 Create .env.example and .env with Supabase credentials
    - Include all config variables from design document
    - _Requirements: 9.5_







- [x] 2. Implement core infrastructure modules


  - [x] 2.1 Implement core/config.py with Pydantic Settings




    - Settings class with all environment variables, lru_cache for get_settings()


    - _Requirements: 9.5_


  - [x] 2.2 Implement core/exceptions.py with exception hierarchy


    - AppException base, AuthenticationError, AuthorizationError, NotFoundError, ValidationError, LobbyFullError, GameStateError


    - _Requirements: 9.3_


  - [ ] 2.3 Implement core/responses.py with APIResponse generic model
    - Generic APIResponse[T] with ok() and fail() class methods
    - _Requirements: 9.2_




  - [x] 2.4 Implement core/logging.py with structured logging


    - Configure logging with JSON format for production


    - _Requirements: 9.3_


  - [x] 2.5 Write property test for API response envelope


    - **Property 14: API Response Envelope**

    - **Validates: Requirements 9.2**


- [ ] 3. Checkpoint - Verify core infrastructure
  - Ensure all tests pass, ask the user if questions arise.




## Phase 2: Database Layer

- [ ] 4. Implement Supabase client and base repository
  - [x] 4.1 Implement database/supabase_client.py




    - get_supabase_client() and get_supabase_service_client() with lru_cache
    - _Requirements: 10.1_


  - [x] 4.2 Implement database/repositories/base.py with BaseRepository

    - Generic CRUD operations: get_by_id, get_all, create, update, delete
    - _Requirements: 10.1, 10.4_

  - [ ] 4.3 Create database/migrations/001_initial_schema.sql
    - user_profiles, lobbies, games tables with indexes and triggers



    - _Requirements: 10.1, 10.2, 10.4_





- [x] 5. Implement entity repositories


  - [x] 5.1 Implement database/repositories/user_repo.py


    - UserRepository with get_by_id, create_profile, update_stats

    - _Requirements: 1.2, 10.3_
  - [x] 5.2 Implement database/repositories/lobby_repo.py

    - LobbyRepository with get_by_code, code_exists, update_status, get_active_by_code
    - _Requirements: 2.1, 2.2, 3.1, 10.4_

  - [ ] 5.3 Write property test for lobby code uniqueness
    - **Property 1: Lobby Code Uniqueness and Format**
    - **Validates: Requirements 2.1, 2.4**
  - [ ] 5.4 Implement database/repositories/game_repo.py
    - GameRepository with create_game, get_by_id, get_user_history



    - _Requirements: 7.3, 10.1, 10.2, 10.3_
  - [ ] 5.5 Write property test for game persistence round trip
    - **Property 11: Game Persistence Round Trip**
    - **Validates: Requirements 7.3, 10.1, 10.2**





- [x] 6. Checkpoint - Verify database layer

  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Schemas




- [-] 7. Implement Pydantic schemas



  - [x] 7.1 Implement schemas/base.py with BaseSchema and TimestampMixin


    - Configure from_attributes for ORM compatibility
    - _Requirements: 9.1_


  - [x] 7.2 Implement schemas/auth.py

    - LoginRequest, RegisterRequest, AuthResponse, UserResponse
    - _Requirements: 1.1, 1.2_
  - [ ] 7.3 Implement schemas/lobby.py
    - LobbyCreate, LobbyJoin, LobbyResponse, PlayerInfo, LobbyCodeResponse
    - _Requirements: 2.1, 3.1_
  - [ ] 7.4 Implement schemas/game.py
    - Question, QuestionPublic, PlayerScore, GameState, GameResult
    - _Requirements: 5.2, 6.1, 7.1_
  - [ ] 7.5 Write property test for question structure completeness
    - **Property 5: Question Structure Completeness**
    - **Validates: Requirements 5.2**
  - [ ] 7.6 Implement schemas/player.py
    - PlayerInfo, PlayerState schemas
    - _Requirements: 3.4, 3.5_
  - [ ] 7.7 Implement schemas/ws_messages.py
    - WSEventType enum, WSMessage, QuestionPayload, AnswerPayload, RoundResultPayload, GameEndPayload
    - _Requirements: 8.5_
  - [ ] 7.8 Write property test for WebSocket message format
    - **Property 13: WebSocket Message Format**
    - **Validates: Requirements 8.5**

- [ ] 8. Checkpoint - Verify schemas
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Middleware

- [ ] 9. Implement middleware components
  - [ ] 9.1 Implement middleware/auth.py
    - AuthenticatedUser NamedTuple, get_current_user, get_current_user_optional, create_jwt_token
    - Support both cookie and Authorization header
    - _Requirements: 1.2, 1.4, 9.4_
  - [ ] 9.2 Write property test for protected endpoint authentication
    - **Property 16: Protected Endpoint Authentication**
    - **Validates: Requirements 9.4**
  - [ ] 9.3 Implement middleware/error_handler.py
    - app_exception_handler for AppException → JSONResponse mapping
    - _Requirements: 9.3_
  - [ ] 9.4 Implement middleware/request_context.py
    - Request ID generation, timing middleware
    - _Requirements: 9.3_

- [ ] 10. Checkpoint - Verify middleware
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Services

- [ ] 11. Implement business logic services
  - [ ] 11.1 Implement services/base.py with BaseService
    - Common service patterns and dependency injection setup
    - _Requirements: 9.1_
  - [ ] 11.2 Implement services/auth_service.py
    - AuthService with register, login, logout, validate_token methods
    - _Requirements: 1.2, 1.3, 1.5_
  - [ ] 11.3 Implement services/lobby_service.py
    - LobbyService with create_lobby, join_lobby, get_lobby, start_game, leave_lobby
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_
  - [ ] 11.4 Write property test for lobby creation state
    - **Property 2: Lobby Creation State**
    - **Validates: Requirements 2.2**
  - [ ] 11.5 Write property test for invalid lobby code rejection
    - **Property 3: Invalid Lobby Code Rejection**
    - **Validates: Requirements 3.2**
  - [ ] 11.6 Write property test for full lobby rejection
    - **Property 4: Full Lobby Rejection**
    - **Validates: Requirements 3.3**
  - [ ] 11.7 Implement services/question_service.py
    - QuestionService with load_questions, get_question, shuffle_options
    - Hardcoded Fortnite questions for MVP
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 11.8 Write property test for game question count
    - **Property 7: Game Question Count**
    - **Validates: Requirements 5.1, 5.5**
  - [ ] 11.9 Implement services/game_service.py
    - GameService with start_game, submit_answer, calculate_score, end_game, get_game_state
    - _Requirements: 4.1, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3_
  - [ ] 11.10 Write property test for scoring formula correctness
    - **Property 8: Scoring Formula Correctness**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [ ] 11.11 Write property test for final score calculation
    - **Property 10: Final Score Calculation**
    - **Validates: Requirements 7.1**

- [ ] 12. Checkpoint - Verify services
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: WebSocket Layer

- [ ] 13. Implement WebSocket infrastructure
  - [ ] 13.1 Implement websocket/events.py
    - WSEventType enum with all event types, message payload models
    - _Requirements: 8.5_
  - [ ] 13.2 Implement websocket/manager.py
    - ConnectionManager with connect, disconnect, broadcast_to_lobby, send_personal, get_lobby_connections
    - _Requirements: 8.1, 8.2_
  - [ ] 13.3 Implement websocket/handlers.py
    - Message handlers for ready, start_game, answer events
    - Game loop orchestration with question timing
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 6.5, 7.2_
  - [ ] 13.4 Write property test for question delivery consistency
    - **Property 6: Question Delivery Consistency**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 14. Checkpoint - Verify WebSocket layer
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: API Layer

- [ ] 15. Implement API dependencies and routers
  - [ ] 15.1 Implement api/deps.py
    - Shared FastAPI dependencies: get_db, get_current_user, get_lobby_service, get_game_service
    - _Requirements: 9.1, 9.4_
  - [ ] 15.2 Implement api/v1/auth.py
    - POST /register, POST /login, POST /logout, GET /me endpoints
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ] 15.3 Write property test for request validation
    - **Property 15: Request Validation**
    - **Validates: Requirements 9.1**
  - [ ] 15.4 Implement api/v1/lobby.py
    - POST /lobbies, GET /lobbies/{code}, POST /lobbies/{code}/join, DELETE /lobbies/{code}
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_
  - [ ] 15.5 Implement api/v1/game.py
    - GET /games/history, GET /games/{id} endpoints
    - _Requirements: 10.3_
  - [ ] 15.6 Write property test for game history retrieval
    - **Property 12: Game History Retrieval**
    - **Validates: Requirements 10.3**
  - [ ] 15.7 Implement api/v1/router.py
    - Aggregate all v1 routes with proper prefixes
    - _Requirements: 9.5_
  - [ ] 15.8 Implement WebSocket endpoint in main.py
    - /ws/{lobby_code} endpoint with token validation
    - _Requirements: 8.1_

- [ ] 16. Checkpoint - Verify API layer
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Main Application Assembly

- [ ] 17. Assemble FastAPI application
  - [ ] 17.1 Implement app/main.py
    - FastAPI app with CORS, exception handlers, routers, WebSocket endpoint
    - _Requirements: 9.5_
  - [ ] 17.2 Implement utils/helpers.py
    - Lobby code generation, timestamp helpers
    - _Requirements: 2.1_
  - [ ] 17.3 Implement utils/constants.py
    - Game constants, status enums
    - _Requirements: 10.4_
  - [ ] 17.4 Write property test for lobby status transitions
    - **Property 17: Lobby Status Transitions**
    - **Validates: Requirements 10.4, 10.5**

- [ ] 18. Checkpoint - Verify main application
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Integration Testing

- [ ] 19. Create integration test suite
  - [ ] 19.1 Create tests/conftest.py with shared fixtures
    - Test client, mock Supabase, test user fixtures
    - _Requirements: Testing Strategy_
  - [ ] 19.2 Create tests/integration/test_auth_flow.py
    - Full auth flow: register → login → access protected → logout
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ] 19.3 Create tests/integration/test_lobby_flow.py
    - Full lobby flow: create → join → start → complete
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_
  - [ ] 19.4 Create tests/integration/test_game_flow.py
    - Full game flow: start → questions → answers → results
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 7.3_
  - [ ] 19.5 Create tests/integration/test_websocket_flow.py
    - WebSocket connection, message exchange, game sync
    - _Requirements: 8.1, 8.5_

- [ ] 20. Checkpoint - Verify integration tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Remaining Property Tests

- [ ] 21. Complete remaining property-based tests
  - [ ] 21.1 Write property test for answer recording completeness
    - **Property 9: Answer Recording Completeness**
    - **Validates: Requirements 6.1**
  - [ ] 21.2 Write property test for timer calculation consistency
    - **Property 18: Timer Calculation Consistency**
    - **Validates: Requirements 4.3**
  - [ ] 21.3 Write property test for timeout scoring
    - **Property 19: Timeout Scoring**
    - **Validates: Requirements 4.4**
  - [ ] 21.4 Write property test for reconnection state restoration
    - **Property 20: Reconnection State Restoration**
    - **Validates: Requirements 8.3**

- [ ] 22. Final Checkpoint - Complete backend verification
  - Ensure all tests pass, ask the user if questions arise.
  - Run full test suite with coverage report
  - Verify all 20 correctness properties are tested
  - Document any API changes for frontend development
