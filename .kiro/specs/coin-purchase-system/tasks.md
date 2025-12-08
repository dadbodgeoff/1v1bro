# Coin Purchase System - Implementation Plan

## Overview

This implementation plan creates a complete coin purchase system with Stripe integration, enabling players to buy in-game currency through micro-transactions ($1-$20) with bonus multipliers.

**Estimated Time:** 1-2 weeks
**New Files:** 15+ files
**Modified Files:** 3-5 files

---

## Phase 1: Database Schema and Backend Foundation

- [x] 1. Create Database Migration
  - [x] 1.1 Create `backend/app/database/migrations/016_coin_purchase_system.sql`
    - Create user_balances table with coins, lifetime_purchased, lifetime_spent
    - Create coin_packages table with price, coins, bonus, badges
    - Create coin_transactions table with type, amount, source, stripe IDs
    - Create credit_coins and debit_coins atomic functions
    - Add RLS policies for user access
    - Add indexes for performance
    - _Requirements: 3.5, 4.1, 5.3_

  - [ ]* 1.2 Write property test for balance non-negativity
    - **Property 10: Balance non-negativity invariant**
    - **Validates: Requirements 5.5**

- [x] 2. Create Coin Package Schemas
  - [x] 2.1 Create `backend/app/schemas/coin.py`
    - Define CoinPackage schema with all fields
    - Define CoinTransaction schema
    - Define UserBalance schema
    - Define CheckoutSessionRequest/Response schemas
    - Define PurchaseVerifyResponse schema
    - _Requirements: 1.1, 1.2, 4.1_

  - [ ]* 2.2 Write property test for package total calculation
    - **Property 1: Package total calculation**
    - **Validates: Requirements 1.1, 1.3**

  - [ ]* 2.3 Write property test for package serialization round-trip
    - **Property 14: Package serialization round-trip**
    - **Validates: Requirements 1.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Balance and Transaction Services

- [x] 4. Create Balance Repository
  - [x] 4.1 Create `backend/app/database/repositories/balance_repo.py`
    - Implement get_balance method
    - Implement credit_coins using RPC function
    - Implement debit_coins using RPC function
    - Implement check_fulfillment for idempotency
    - Implement get_transactions with pagination
    - _Requirements: 3.5, 5.3, 3.4_

- [x] 5. Create Balance Service
  - [x] 5.1 Create `backend/app/services/balance_service.py`
    - Implement get_balance with user creation fallback
    - Implement credit_coins with transaction recording
    - Implement debit_coins with insufficient funds check
    - Implement get_transaction_history with pagination
    - _Requirements: 3.1, 5.3, 5.5, 4.1_

  - [ ]* 5.2 Write property test for balance credit atomicity
    - **Property 8: Balance credit atomicity**
    - **Validates: Requirements 3.1, 3.5, 5.2**

  - [ ]* 5.3 Write property test for balance debit with insufficient funds
    - **Property 9: Balance debit with insufficient funds**
    - **Validates: Requirements 5.5**

  - [ ]* 5.4 Write property test for transaction record completeness
    - **Property 11: Transaction record completeness**
    - **Validates: Requirements 4.1**

  - [ ]* 5.5 Write property test for transaction ordering
    - **Property 12: Transaction ordering**
    - **Validates: Requirements 4.2**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Stripe Integration

- [x] 7. Create Stripe Service
  - [x] 7.1 Create `backend/app/services/stripe_service.py`
    - Implement create_checkout_session with metadata
    - Implement verify_webhook_signature
    - Implement get_session for verification
    - Add idempotency key generation
    - _Requirements: 2.1, 2.5, 3.1, 7.3_

  - [ ]* 7.2 Write property test for checkout session metadata
    - **Property 3: Checkout session metadata**
    - **Validates: Requirements 2.1**

  - [ ]* 7.3 Write property test for idempotency key uniqueness
    - **Property 5: Idempotency key uniqueness**
    - **Validates: Requirements 2.5**

- [x] 8. Create Webhook Handler
  - [x] 8.1 Create `backend/app/services/coin_webhook_handler.py`
    - Implement handle_checkout_completed
    - Add idempotency check before fulfillment
    - Credit coins and record transaction
    - Handle missing metadata gracefully
    - _Requirements: 3.1, 3.4_

  - [ ]* 8.2 Write property test for fulfillment idempotency
    - **Property 7: Fulfillment idempotency**
    - **Validates: Requirements 3.4**

  - [ ]* 8.3 Write property test for webhook signature verification
    - **Property 6: Webhook signature verification**
    - **Validates: Requirements 3.1, 6.2, 7.3**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: API Endpoints

- [x] 10. Create Coin API Endpoints
  - [x] 10.1 Create `backend/app/api/v1/coins.py`
    - GET /coins/packages - List active packages
    - POST /coins/checkout - Create checkout session
    - GET /coins/verify - Verify purchase completion
    - GET /coins/balance - Get current balance
    - GET /coins/transactions - Get transaction history
    - _Requirements: 1.4, 2.1, 3.2, 5.1, 4.1_

  - [x] 10.2 Create `backend/app/api/v1/webhooks.py`
    - POST /webhooks/stripe - Handle Stripe webhooks
    - Verify signature before processing
    - Route to appropriate handler by event type
    - _Requirements: 3.1, 7.3_

  - [x] 10.3 Register routes in `backend/app/api/v1/__init__.py`
    - Add coins router
    - Add webhooks router
    - _Requirements: 1.4_

- [x] 11. Add Stripe Configuration
  - [x] 11.1 Update `backend/app/core/config.py`
    - Add STRIPE_SECRET_KEY setting
    - Add STRIPE_WEBHOOK_SECRET setting
    - Add STRIPE_PUBLISHABLE_KEY setting
    - _Requirements: 7.2_

  - [x] 11.2 Create dependency injection for Stripe service
    - Add StripeServiceDep to deps.py
    - Add BalanceServiceDep to deps.py
    - _Requirements: 7.2_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Frontend Types and Hooks

- [x] 13. Create Frontend Types
  - [x] 13.1 Create `frontend/src/types/coin.ts`
    - Define CoinPackage interface
    - Define CoinTransaction interface
    - Define UserBalance interface
    - Define CheckoutResponse interface
    - Define PurchaseResult interface
    - _Requirements: 1.1, 4.1_

- [x] 14. Create Coin Purchase Hook
  - [x] 14.1 Create `frontend/src/hooks/useCoinPurchase.ts`
    - Implement fetchPackages
    - Implement createCheckout with redirect
    - Implement verifyPurchase
    - Handle loading and error states
    - _Requirements: 1.4, 2.2, 3.2_

- [x] 15. Create Balance Hook
  - [x] 15.1 Create `frontend/src/hooks/useBalance.ts`
    - Implement fetchBalance
    - Implement refreshBalance
    - Add real-time update support
    - _Requirements: 5.1, 5.2_

- [x] 16. Create Balance Store
  - [x] 16.1 Create `frontend/src/stores/balanceStore.ts`
    - Store current balance
    - Implement credit/debit actions
    - Persist across navigation
    - _Requirements: 5.2_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Frontend Components

- [x] 18. Create Coin Package Card Component
  - [x] 18.1 Create `frontend/src/components/coins/CoinPackageCard.tsx`
    - Display price with currency formatting
    - Show base coins and bonus breakdown
    - Display badge (Best Value, Most Popular)
    - Add buy button with loading state
    - Implement hover lift effect
    - Use gold/yellow accent colors
    - _Requirements: 1.2, 1.3, 8.2, 8.3, 8.4_

  - [ ]* 18.2 Write property test for package display completeness
    - **Property 2: Package display completeness**
    - **Validates: Requirements 1.2, 1.3**

- [x] 19. Create Balance Display Component
  - [x] 19.1 Create `frontend/src/components/coins/BalanceDisplay.tsx`
    - Display coin icon and balance
    - Format large numbers with commas
    - Support size variants (sm, md, lg)
    - Add loading skeleton
    - _Requirements: 5.1, 5.4_

  - [ ]* 19.2 Write property test for balance formatting
    - **Property 13: Balance formatting**
    - **Validates: Requirements 5.4**

- [x] 20. Create Transaction History Component
  - [x] 20.1 Create `frontend/src/components/coins/TransactionHistory.tsx`
    - Display transaction list with date, amount, source
    - Show payment status indicators
    - Implement pagination
    - Add empty state
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Coin Shop Page

- [x] 22. Create Coin Shop Page
  - [x] 22.1 Create `frontend/src/pages/CoinShop.tsx`
    - Add page header with "Get Coins" title
    - Display current balance in header
    - Render package grid (responsive)
    - Add trust indicators (Stripe badge, secure text)
    - Add FAQ section
    - _Requirements: 8.1, 8.5_

  - [x] 22.2 Create `frontend/src/pages/CoinSuccess.tsx`
    - Parse session_id from URL
    - Verify purchase with backend
    - Display success message with coins received
    - Show updated balance
    - Add navigation to shop
    - Handle invalid session_id
    - _Requirements: 3.2, 6.3_

  - [x] 22.3 Add routes to `frontend/src/App.tsx`
    - Add /coins route for shop
    - Add /coins/success route for success page
    - Add /coins/history route for transaction history
    - _Requirements: 8.1_

- [x] 23. Integrate Balance in Navigation
  - [x] 23.1 Update navigation component
    - Add BalanceDisplay to header/nav
    - Fetch balance on auth
    - Update on purchase completion
    - _Requirements: 5.1, 5.2_

- [ ] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Integration with Existing Systems

- [x] 25. Update Shop Purchase Flow
  - [x] 25.1 Update cosmetic purchase to use balance
    - Check balance before purchase
    - Debit coins on successful purchase
    - Show insufficient funds error
    - Add "Get Coins" link when balance low
    - _Requirements: 5.5_

- [x] 26. Update Battle Pass Purchase
  - [x] 26.1 Update battle pass purchase to use balance
    - Check balance for premium upgrade
    - Debit coins on purchase
    - Show insufficient funds with upsell
    - _Requirements: 5.5_

- [x] 27. Seed Initial Packages
  - [x] 27.1 Packages seeded via migration `016_coin_purchase_system.sql`
    - Insert 5 predefined packages
    - Set correct pricing and bonuses
    - Mark popular/value packages with badges
    - _Requirements: 1.1_

- [ ] 28. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Quick Reference

### New Backend Files
| File | Purpose |
|------|---------|
| database/migrations/016_coin_purchase_system.sql | Database schema |
| schemas/coin.py | Pydantic schemas |
| database/repositories/balance_repo.py | Database operations |
| services/balance_service.py | Balance management |
| services/stripe_service.py | Stripe integration |
| services/coin_webhook_handler.py | Webhook processing |
| api/v1/coins.py | Coin API endpoints |
| api/v1/webhooks.py | Webhook endpoint |

### New Frontend Files
| File | Purpose |
|------|---------|
| types/coin.ts | TypeScript interfaces |
| hooks/useCoinPurchase.ts | Purchase flow hook |
| hooks/useBalance.ts | Balance fetching hook |
| stores/balanceStore.ts | Balance state store |
| components/coins/CoinPackageCard.tsx | Package display card |
| components/coins/BalanceDisplay.tsx | Balance display |
| components/coins/TransactionHistory.tsx | Transaction list |
| pages/CoinShop.tsx | Main shop page |
| pages/CoinSuccess.tsx | Purchase success page |

### Property Tests Summary
| Property | Test File | Validates |
|----------|-----------|-----------|
| 1. Package total calculation | test_coins.py | 1.1, 1.3 |
| 2. Package display completeness | coins.test.tsx | 1.2, 1.3 |
| 3. Checkout session metadata | test_coins.py | 2.1 |
| 5. Idempotency key uniqueness | test_coins.py | 2.5 |
| 6. Webhook signature verification | test_coins.py | 3.1, 6.2, 7.3 |
| 7. Fulfillment idempotency | test_coins.py | 3.4 |
| 8. Balance credit atomicity | test_coins.py | 3.1, 3.5, 5.2 |
| 9. Balance debit insufficient funds | test_coins.py | 5.5 |
| 10. Balance non-negativity | test_coins.py | 5.5 |
| 11. Transaction record completeness | test_coins.py | 4.1 |
| 12. Transaction ordering | test_coins.py | 4.2 |
| 13. Balance formatting | coins.test.tsx | 5.4 |
| 14. Package serialization round-trip | test_coins.py | 1.4 |

### Coin Package Configuration
| Package | Price | Base | Bonus | Total | Bonus % | Badge |
|---------|-------|------|-------|-------|---------|-------|
| Starter | $0.99 | 100 | 0 | 100 | 0% | - |
| Basic | $2.99 | 300 | 50 | 350 | 17% | - |
| Popular | $4.99 | 500 | 150 | 650 | 30% | Most Popular |
| Value | $9.99 | 1000 | 500 | 1500 | 50% | Best Value |
| Premium | $19.99 | 2000 | 1500 | 3500 | 75% | - |

### Environment Variables Required
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

*Total Tasks: 28 phases with sub-tasks*
*Estimated Time: 1-2 weeks*
*New Files: 17*
*Property Tests: 14*
