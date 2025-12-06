# Launch Scaling - Requirements

## Problem Statement
The app could go viral overnight (TikTok/Reels). Current architecture handles ~100-200 CCU but would melt under sudden traffic spikes. First impressions matter - users who experience a broken launch rarely return.

## Goals
1. Increase CCU capacity from ~200 to ~500-1000 without infrastructure changes
2. Graceful degradation when capacity is exceeded
3. Visibility into server health before/during traffic spikes

## Non-Goals
- Full horizontal scaling (Redis pub/sub) - that's phase 2 if needed
- Database optimization beyond caching
- CDN/static asset optimization

---

## Requirements

### REQ-1: Lobby Cache Layer
**Priority:** Critical
**Rationale:** `get_lobby()` is called on every position update (60Hz per player). This hits Supabase on every call, creating massive unnecessary load.

**Acceptance Criteria:**
- [ ] Lobby data cached in-memory with configurable TTL (default 5 seconds)
- [ ] Cache invalidated on lobby state changes (join, leave, start, complete)
- [ ] Cache hit rate logged for monitoring
- [ ] No behavior change from user perspective

### REQ-2: Connection Limits & Graceful Degradation
**Priority:** Critical  
**Rationale:** Better to show "servers busy" than crash and corrupt game state.

**Acceptance Criteria:**
- [ ] Configurable max concurrent WebSocket connections (default: 500)
- [ ] Configurable max connections per lobby (default: 2, for future expansion)
- [ ] New connections rejected with friendly error when at capacity
- [ ] Frontend shows user-friendly "servers are busy" message
- [ ] Existing games unaffected when limit reached

### REQ-3: Health & Metrics Endpoint
**Priority:** High
**Rationale:** Need to know when we're dying before users tell us.

**Acceptance Criteria:**
- [ ] `/health` endpoint returns detailed metrics:
  - Active WebSocket connections (total and per-lobby)
  - Active game sessions
  - Cache hit/miss rates
  - Memory usage estimate
- [ ] Metrics suitable for CloudWatch/Datadog ingestion
- [ ] Response time < 50ms (no DB calls)

### REQ-4: Request Rate Limiting
**Priority:** Medium
**Rationale:** Prevent abuse and reduce load from misbehaving clients.

**Acceptance Criteria:**
- [ ] Rate limit on lobby creation (5 per minute per user)
- [ ] Rate limit on lobby joins (10 per minute per user)
- [ ] Rate limit on API endpoints (100 per minute per user)
- [ ] WebSocket message rate limiting (60 messages/second per connection)

---

## Success Metrics
- Handle 500 CCU without degradation
- < 1% error rate under load
- < 100ms p95 latency for game actions
- Zero data corruption during capacity events
