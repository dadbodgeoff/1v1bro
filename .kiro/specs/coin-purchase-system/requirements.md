# Requirements Document

## Introduction

This specification defines a coin purchase system for the 1v1bro gaming platform that enables players to buy in-game currency (coins) through real-money transactions. The system is designed around micro-transactions with small purchase amounts ($1-$20) and bonus multipliers that incentivize larger purchases.

The coin economy is calibrated so that:
- A legendary skin costs approximately $2.99 worth of coins
- The Battle Pass costs approximately $3.99 worth of coins
- Players can make small impulse purchases starting at $1

The system integrates with Stripe for payment processing and includes:
1. **Coin Package Catalog** - 5-6 predefined coin bundles with bonus multipliers
2. **Stripe Checkout Integration** - Secure payment flow with redirect-based checkout
3. **Purchase Fulfillment** - Automatic coin crediting upon successful payment
4. **Transaction History** - Record of all purchases for player reference
5. **Balance Management** - Real-time coin balance tracking and display

## Glossary

- **Coin**: The primary in-game currency used to purchase cosmetics and Battle Pass
- **Coin_Package**: A predefined bundle of coins available for purchase at a fixed price
- **Bonus_Multiplier**: A percentage increase in coins received for larger purchases (e.g., 1.1x = 10% bonus)
- **Stripe_Checkout**: Stripe's hosted payment page for secure card processing
- **Checkout_Session**: A Stripe object representing a single payment attempt
- **Webhook**: An HTTP callback from Stripe notifying the backend of payment events
- **Fulfillment**: The process of crediting coins to a player's account after successful payment
- **Transaction**: A record of a completed coin purchase
- **Balance**: The current amount of coins in a player's account
- **Success_URL**: The URL players are redirected to after successful payment
- **Cancel_URL**: The URL players are redirected to if they cancel the checkout

## Requirements

### Requirement 1: Coin Package Catalog

**User Story:** As a player, I want to see available coin packages with clear pricing and bonus amounts, so that I can choose the best value for my purchase.

#### Acceptance Criteria

1.1. WHEN the coin shop page loads THEN the system SHALL display 5-6 coin packages with the following structure:
- $0.99: 100 coins (base rate, no bonus)
- $2.99: 350 coins (1.17x bonus - ~17% extra)
- $4.99: 650 coins (1.30x bonus - ~30% extra)
- $9.99: 1500 coins (1.50x bonus - ~50% extra)
- $19.99: 3500 coins (1.75x bonus - ~75% extra)

1.2. WHEN displaying a coin package THEN the system SHALL show:
- Price in USD with currency symbol
- Base coin amount
- Bonus percentage (if applicable)
- Total coins received
- "Best Value" or "Most Popular" badge for recommended packages

1.3. WHEN a package has a bonus THEN the system SHALL visually highlight the bonus amount with accent styling

1.4. WHEN the coin shop loads THEN the system SHALL fetch package data from the backend API to allow future price adjustments without code changes

### Requirement 2: Stripe Checkout Integration

**User Story:** As a player, I want to securely purchase coins using my credit card, so that I can buy items in the shop.

#### Acceptance Criteria

2.1. WHEN a player clicks "Buy" on a coin package THEN the system SHALL create a Stripe Checkout Session with:
- The selected package price
- Package metadata (package_id, coin_amount, user_id)
- Success URL pointing back to the app with session_id parameter
- Cancel URL pointing back to the coin shop

2.2. WHEN the Checkout Session is created THEN the system SHALL redirect the player to Stripe's hosted checkout page

2.3. WHEN the player completes payment on Stripe THEN Stripe SHALL redirect to the success URL with the session_id

2.4. WHEN the player cancels payment on Stripe THEN Stripe SHALL redirect to the cancel URL

2.5. WHEN creating a Checkout Session THEN the system SHALL include idempotency key to prevent duplicate charges

### Requirement 3: Purchase Fulfillment

**User Story:** As a player, I want my coins credited immediately after payment, so that I can start spending them right away.

#### Acceptance Criteria

3.1. WHEN Stripe sends a checkout.session.completed webhook THEN the system SHALL:
- Verify the webhook signature
- Extract user_id and coin_amount from session metadata
- Credit coins to the player's balance
- Record the transaction

3.2. WHEN the player returns to the success URL THEN the system SHALL:
- Display a success message with coins received
- Show updated coin balance
- Provide navigation to the shop

3.3. WHEN fulfillment completes THEN the system SHALL send a confirmation notification to the player

3.4. IF a webhook is received for an already-fulfilled session THEN the system SHALL ignore the duplicate and return success (idempotent)

3.5. WHEN crediting coins THEN the system SHALL use a database transaction to ensure atomicity

### Requirement 4: Transaction History

**User Story:** As a player, I want to see my purchase history, so that I can track my spending and verify transactions.

#### Acceptance Criteria

4.1. WHEN a player views their transaction history THEN the system SHALL display:
- Date and time of purchase
- Package purchased (name and price)
- Coins received
- Payment status (completed, pending, failed)
- Stripe payment ID for reference

4.2. WHEN displaying transactions THEN the system SHALL order them by date descending (newest first)

4.3. WHEN a player has no transactions THEN the system SHALL display an empty state with a prompt to visit the coin shop

4.4. WHEN displaying transaction history THEN the system SHALL paginate results with 20 items per page

### Requirement 5: Balance Management

**User Story:** As a player, I want to see my current coin balance, so that I know how much I can spend.

#### Acceptance Criteria

5.1. WHEN a player is logged in THEN the system SHALL display their coin balance in the navigation header

5.2. WHEN coins are credited or spent THEN the system SHALL update the displayed balance in real-time without page refresh

5.3. WHEN fetching balance THEN the system SHALL return the current balance from the database, not a cached value

5.4. WHEN displaying balance THEN the system SHALL format large numbers with commas (e.g., 1,500 coins)

5.5. WHEN a player attempts to spend more coins than their balance THEN the system SHALL reject the transaction and display an insufficient funds message

### Requirement 6: Error Handling and Edge Cases

**User Story:** As a player, I want clear feedback when something goes wrong with my purchase, so that I know what to do next.

#### Acceptance Criteria

6.1. WHEN Stripe Checkout fails to create THEN the system SHALL display an error message and allow retry

6.2. WHEN webhook signature verification fails THEN the system SHALL reject the webhook and log the attempt

6.3. WHEN the success URL is accessed without a valid session_id THEN the system SHALL redirect to the coin shop with an error message

6.4. WHEN a network error occurs during checkout THEN the system SHALL display a retry option

6.5. WHEN the backend is unavailable THEN the system SHALL display a maintenance message and disable purchase buttons

### Requirement 7: Security and Compliance

**User Story:** As a platform operator, I want secure payment processing, so that player payment data is protected.

#### Acceptance Criteria

7.1. WHEN processing payments THEN the system SHALL never store or transmit raw card numbers (handled entirely by Stripe)

7.2. WHEN creating Checkout Sessions THEN the system SHALL use server-side API calls with secret key (never expose secret key to frontend)

7.3. WHEN receiving webhooks THEN the system SHALL verify the Stripe signature before processing

7.4. WHEN logging transactions THEN the system SHALL not log sensitive payment details (only Stripe IDs and metadata)

7.5. WHEN a player requests a refund THEN the system SHALL process through Stripe dashboard (manual process initially)

### Requirement 8: Coin Shop UI

**User Story:** As a player, I want an attractive and easy-to-use coin shop, so that purchasing feels premium and trustworthy.

#### Acceptance Criteria

8.1. WHEN the coin shop page renders THEN the system SHALL display:
- Page header with "Get Coins" title and current balance
- Grid of coin packages with visual hierarchy
- Trust indicators (Stripe badge, secure payment text)
- FAQ section for common questions

8.2. WHEN a package card is hovered THEN the system SHALL apply a lift effect and highlight border

8.3. WHEN a package is selected THEN the system SHALL show a loading state on the buy button during checkout creation

8.4. WHEN displaying packages THEN the system SHALL use coin icon and gold/yellow accent colors for premium feel

8.5. WHEN on mobile THEN the system SHALL stack packages vertically with full-width cards

