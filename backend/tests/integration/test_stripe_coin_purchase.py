"""
Integration tests for Stripe coin purchase webhook handling.

Tests simulate Stripe webhook events and verify:
1. Coins are credited correctly for all package amounts
2. Idempotency - duplicate webhooks don't double-credit
3. Balance updates correctly after purchase
4. Transaction history is recorded

Uses property-based testing with Hypothesis for comprehensive coverage.
"""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import uuid4
from datetime import datetime
from typing import NamedTuple

from hypothesis import given, strategies as st, settings, assume

from app.services.coin_webhook_handler import CoinWebhookHandler
from app.services.balance_service import BalanceService
from app.services.stripe_service import StripeService
from app.schemas.coin import CoinPackage, WebhookResult


# ============================================
# Test Data: Coin Packages
# ============================================

COIN_PACKAGES = [
    CoinPackage(
        id="pkg_starter",
        name="Starter",
        price_cents=99,
        base_coins=100,
        bonus_coins=0,
        total_coins=100,
        bonus_percent=0,
        badge=None,
        sort_order=1,
        is_active=True,
    ),
    CoinPackage(
        id="pkg_basic",
        name="Basic",
        price_cents=299,
        base_coins=300,
        bonus_coins=50,
        total_coins=350,
        bonus_percent=17,
        badge=None,
        sort_order=2,
        is_active=True,
    ),
    CoinPackage(
        id="pkg_popular",
        name="Popular",
        price_cents=499,
        base_coins=500,
        bonus_coins=150,
        total_coins=650,
        bonus_percent=30,
        badge="Most Popular",
        sort_order=3,
        is_active=True,
    ),
    CoinPackage(
        id="pkg_value",
        name="Value",
        price_cents=999,
        base_coins=1000,
        bonus_coins=500,
        total_coins=1500,
        bonus_percent=50,
        badge="Best Value",
        sort_order=4,
        is_active=True,
    ),
    CoinPackage(
        id="pkg_premium",
        name="Premium",
        price_cents=1999,
        base_coins=2000,
        bonus_coins=1500,
        total_coins=3500,
        bonus_percent=75,
        badge=None,
        sort_order=5,
        is_active=True,
    ),
]


class MockStripeSession(NamedTuple):
    """Mock Stripe checkout session."""
    id: str
    metadata: dict
    payment_status: str = "paid"


class MockStripeEvent(NamedTuple):
    """Mock Stripe webhook event."""
    type: str
    data: object


class MockEventData:
    """Mock event data container."""
    def __init__(self, session: MockStripeSession):
        self.object = session


def create_checkout_completed_event(
    session_id: str,
    user_id: str,
    package_id: str,
    coin_amount: int,
) -> MockStripeEvent:
    """Create a mock checkout.session.completed event."""
    session = MockStripeSession(
        id=session_id,
        metadata={
            "user_id": user_id,
            "package_id": package_id,
            "coin_amount": str(coin_amount),
        },
    )
    return MockStripeEvent(
        type="checkout.session.completed",
        data=MockEventData(session),
    )


# ============================================
# Mock Balance Service
# ============================================

class MockBalanceService:
    """Mock balance service that tracks state in memory."""
    
    def __init__(self):
        self.balances: dict[str, int] = {}
        self.fulfilled_sessions: set[str] = set()
        self.transactions: list[dict] = []
    
    async def check_fulfillment(self, session_id: str) -> bool:
        """Check if session already fulfilled."""
        return session_id in self.fulfilled_sessions
    
    async def credit_coins(
        self,
        user_id: str,
        amount: int,
        transaction_id: str,
        source: str = "stripe_purchase",
    ) -> int:
        """Credit coins and return new balance."""
        # Mark as fulfilled
        self.fulfilled_sessions.add(transaction_id)
        
        # Update balance
        current = self.balances.get(user_id, 0)
        new_balance = current + amount
        self.balances[user_id] = new_balance
        
        # Record transaction
        self.transactions.append({
            "user_id": user_id,
            "amount": amount,
            "transaction_id": transaction_id,
            "source": source,
            "balance_after": new_balance,
        })
        
        return new_balance
    
    async def get_balance(self, user_id: str) -> int:
        """Get user balance."""
        return self.balances.get(user_id, 0)
    
    def reset(self):
        """Reset state for new test."""
        self.balances.clear()
        self.fulfilled_sessions.clear()
        self.transactions.clear()


# ============================================
# Fixtures
# ============================================

@pytest.fixture
def mock_balance_service():
    """Create mock balance service."""
    return MockBalanceService()


@pytest.fixture
def mock_stripe_service():
    """Create mock stripe service."""
    return MagicMock(spec=StripeService)


@pytest.fixture
def webhook_handler(mock_stripe_service, mock_balance_service):
    """Create webhook handler with mocks."""
    return CoinWebhookHandler(
        stripe_service=mock_stripe_service,
        balance_service=mock_balance_service,
    )


# ============================================
# Property 1: All packages credit correct coin amounts
# ============================================

@pytest.mark.asyncio
@pytest.mark.parametrize("package", COIN_PACKAGES, ids=lambda p: p.id)
async def test_package_credits_correct_coins(
    package: CoinPackage,
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: For each coin package, webhook credits exactly total_coins.
    
    **Feature: stripe-coin-purchase, Property 1: Package coin amounts**
    **Validates: Requirements 3.1 - Webhook credits correct coin amount**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    user_id = str(uuid4())
    session_id = f"cs_test_{uuid4().hex[:24]}"
    
    event = create_checkout_completed_event(
        session_id=session_id,
        user_id=user_id,
        package_id=package.id,
        coin_amount=package.total_coins,
    )
    
    result = await handler.handle_event(event)
    
    # Verify success
    assert result.success is True
    assert result.duplicate is False
    
    # Verify correct coin amount credited
    balance = await mock_balance_service.get_balance(user_id)
    assert balance == package.total_coins, (
        f"Package {package.id} should credit {package.total_coins} coins, "
        f"but balance is {balance}"
    )
    
    # Verify new_balance in result
    assert result.new_balance == package.total_coins


# ============================================
# Property 2: Idempotency - duplicate webhooks don't double-credit
# ============================================

@pytest.mark.asyncio
@pytest.mark.parametrize("package", COIN_PACKAGES, ids=lambda p: p.id)
async def test_duplicate_webhook_idempotency(
    package: CoinPackage,
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Processing same webhook twice credits coins only once.
    
    **Feature: stripe-coin-purchase, Property 2: Webhook idempotency**
    **Validates: Requirements 3.4 - Idempotent webhook handling**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    user_id = str(uuid4())
    session_id = f"cs_test_{uuid4().hex[:24]}"
    
    event = create_checkout_completed_event(
        session_id=session_id,
        user_id=user_id,
        package_id=package.id,
        coin_amount=package.total_coins,
    )
    
    # Process first time
    result1 = await handler.handle_event(event)
    assert result1.success is True
    assert result1.duplicate is False
    balance_after_first = await mock_balance_service.get_balance(user_id)
    
    # Process second time (duplicate)
    result2 = await handler.handle_event(event)
    assert result2.success is True
    assert result2.duplicate is True
    balance_after_second = await mock_balance_service.get_balance(user_id)
    
    # Balance should not change
    assert balance_after_first == balance_after_second == package.total_coins, (
        f"Duplicate webhook should not change balance. "
        f"Expected {package.total_coins}, got {balance_after_second}"
    )


# ============================================
# Property 3: Multiple purchases accumulate correctly
# ============================================

@pytest.mark.asyncio
async def test_multiple_purchases_accumulate(
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Multiple purchases from same user accumulate correctly.
    
    **Feature: stripe-coin-purchase, Property 3: Balance accumulation**
    **Validates: Requirements 5.3 - Balance updates correctly**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    user_id = str(uuid4())
    expected_total = 0
    
    # Purchase each package once
    for package in COIN_PACKAGES:
        session_id = f"cs_test_{uuid4().hex[:24]}"
        
        event = create_checkout_completed_event(
            session_id=session_id,
            user_id=user_id,
            package_id=package.id,
            coin_amount=package.total_coins,
        )
        
        result = await handler.handle_event(event)
        assert result.success is True
        
        expected_total += package.total_coins
    
    # Verify total balance
    final_balance = await mock_balance_service.get_balance(user_id)
    assert final_balance == expected_total, (
        f"Expected total balance {expected_total}, got {final_balance}"
    )


# ============================================
# Property 4: Transaction history recorded
# ============================================

@pytest.mark.asyncio
@pytest.mark.parametrize("package", COIN_PACKAGES, ids=lambda p: p.id)
async def test_transaction_recorded(
    package: CoinPackage,
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Each successful purchase records a transaction.
    
    **Feature: stripe-coin-purchase, Property 4: Transaction recording**
    **Validates: Requirements 4.1 - Transaction history**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    user_id = str(uuid4())
    session_id = f"cs_test_{uuid4().hex[:24]}"
    
    event = create_checkout_completed_event(
        session_id=session_id,
        user_id=user_id,
        package_id=package.id,
        coin_amount=package.total_coins,
    )
    
    await handler.handle_event(event)
    
    # Verify transaction recorded
    assert len(mock_balance_service.transactions) == 1
    tx = mock_balance_service.transactions[0]
    
    assert tx["user_id"] == user_id
    assert tx["amount"] == package.total_coins
    assert tx["transaction_id"] == session_id
    assert tx["source"] == "stripe_purchase"
    assert tx["balance_after"] == package.total_coins


# ============================================
# Property 5: Invalid metadata handling
# ============================================

@pytest.mark.asyncio
async def test_missing_user_id_fails(
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Webhook without user_id fails gracefully.
    
    **Feature: stripe-coin-purchase, Property 5: Error handling**
    **Validates: Requirements 3.1 - Webhook validation**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    session = MockStripeSession(
        id=f"cs_test_{uuid4().hex[:24]}",
        metadata={
            "package_id": "pkg_starter",
            "coin_amount": "100",
            # Missing user_id
        },
    )
    event = MockStripeEvent(
        type="checkout.session.completed",
        data=MockEventData(session),
    )
    
    result = await handler.handle_event(event)
    
    assert result.success is False
    assert "user_id" in result.message.lower()


@pytest.mark.asyncio
async def test_invalid_coin_amount_fails(
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Webhook with invalid coin_amount fails gracefully.
    
    **Feature: stripe-coin-purchase, Property 5: Error handling**
    **Validates: Requirements 3.1 - Webhook validation**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    session = MockStripeSession(
        id=f"cs_test_{uuid4().hex[:24]}",
        metadata={
            "user_id": str(uuid4()),
            "package_id": "pkg_starter",
            "coin_amount": "invalid",  # Not a number
        },
    )
    event = MockStripeEvent(
        type="checkout.session.completed",
        data=MockEventData(session),
    )
    
    result = await handler.handle_event(event)
    
    assert result.success is False
    assert "coin_amount" in result.message.lower()


@pytest.mark.asyncio
async def test_zero_coin_amount_fails(
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Webhook with zero coin_amount fails gracefully.
    
    **Feature: stripe-coin-purchase, Property 5: Error handling**
    **Validates: Requirements 3.1 - Webhook validation**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    session = MockStripeSession(
        id=f"cs_test_{uuid4().hex[:24]}",
        metadata={
            "user_id": str(uuid4()),
            "package_id": "pkg_starter",
            "coin_amount": "0",  # Zero coins
        },
    )
    event = MockStripeEvent(
        type="checkout.session.completed",
        data=MockEventData(session),
    )
    
    result = await handler.handle_event(event)
    
    assert result.success is False


# ============================================
# Property 6: Expired session handling
# ============================================

@pytest.mark.asyncio
async def test_expired_session_acknowledged(
    mock_balance_service: MockBalanceService,
    mock_stripe_service,
):
    """
    Property: Expired checkout sessions are acknowledged without error.
    
    **Feature: stripe-coin-purchase, Property 6: Session expiry**
    **Validates: Requirements 3.1 - Webhook event handling**
    """
    handler = CoinWebhookHandler(mock_stripe_service, mock_balance_service)
    
    user_id = str(uuid4())
    session = MockStripeSession(
        id=f"cs_test_{uuid4().hex[:24]}",
        metadata={
            "user_id": user_id,
            "package_id": "pkg_starter",
            "coin_amount": "100",
        },
    )
    event = MockStripeEvent(
        type="checkout.session.expired",
        data=MockEventData(session),
    )
    
    result = await handler.handle_event(event)
    
    # Should succeed (acknowledge) but not credit coins
    assert result.success is True
    
    # Balance should remain 0
    balance = await mock_balance_service.get_balance(user_id)
    assert balance == 0


# ============================================
# Property-Based Tests with Hypothesis
# ============================================

@given(
    num_purchases=st.integers(min_value=1, max_value=10),
    package_indices=st.lists(
        st.integers(min_value=0, max_value=4),
        min_size=1,
        max_size=10,
    ),
)
@settings(max_examples=50)
@pytest.mark.asyncio
async def test_random_purchase_sequences(
    num_purchases: int,
    package_indices: list[int],
):
    """
    Property: Any sequence of purchases results in correct total balance.
    
    **Feature: stripe-coin-purchase, Property 7: Purchase sequence invariant**
    **Validates: Requirements 5.3 - Balance consistency**
    """
    mock_balance = MockBalanceService()
    mock_stripe = MagicMock(spec=StripeService)
    handler = CoinWebhookHandler(mock_stripe, mock_balance)
    
    user_id = str(uuid4())
    expected_total = 0
    
    for idx in package_indices[:num_purchases]:
        package = COIN_PACKAGES[idx]
        session_id = f"cs_test_{uuid4().hex[:24]}"
        
        event = create_checkout_completed_event(
            session_id=session_id,
            user_id=user_id,
            package_id=package.id,
            coin_amount=package.total_coins,
        )
        
        result = await handler.handle_event(event)
        assert result.success is True
        
        expected_total += package.total_coins
    
    final_balance = await mock_balance.get_balance(user_id)
    assert final_balance == expected_total


@given(
    duplicate_count=st.integers(min_value=2, max_value=5),
)
@settings(max_examples=20)
@pytest.mark.asyncio
async def test_multiple_duplicates_idempotent(duplicate_count: int):
    """
    Property: Processing same webhook N times credits coins exactly once.
    
    **Feature: stripe-coin-purchase, Property 8: Multi-duplicate idempotency**
    **Validates: Requirements 3.4 - Idempotent webhook handling**
    """
    mock_balance = MockBalanceService()
    mock_stripe = MagicMock(spec=StripeService)
    handler = CoinWebhookHandler(mock_stripe, mock_balance)
    
    user_id = str(uuid4())
    session_id = f"cs_test_{uuid4().hex[:24]}"
    package = COIN_PACKAGES[2]  # Popular package
    
    event = create_checkout_completed_event(
        session_id=session_id,
        user_id=user_id,
        package_id=package.id,
        coin_amount=package.total_coins,
    )
    
    # Process multiple times
    for i in range(duplicate_count):
        result = await handler.handle_event(event)
        assert result.success is True
        
        if i == 0:
            assert result.duplicate is False
        else:
            assert result.duplicate is True
    
    # Balance should equal single purchase
    final_balance = await mock_balance.get_balance(user_id)
    assert final_balance == package.total_coins


# ============================================
# Summary Test: All packages end-to-end
# ============================================

@pytest.mark.asyncio
async def test_all_packages_summary():
    """
    Summary test: Verify all 5 packages credit correct amounts.
    
    Packages:
    - Starter: $0.99 -> 100 coins (0% bonus)
    - Basic: $2.99 -> 350 coins (17% bonus)
    - Popular: $4.99 -> 650 coins (30% bonus)
    - Value: $9.99 -> 1500 coins (50% bonus)
    - Premium: $19.99 -> 3500 coins (75% bonus)
    """
    mock_balance = MockBalanceService()
    mock_stripe = MagicMock(spec=StripeService)
    handler = CoinWebhookHandler(mock_stripe, mock_balance)
    
    expected_amounts = {
        "pkg_starter": 100,
        "pkg_basic": 350,
        "pkg_popular": 650,
        "pkg_value": 1500,
        "pkg_premium": 3500,
    }
    
    for package in COIN_PACKAGES:
        mock_balance.reset()
        user_id = str(uuid4())
        session_id = f"cs_test_{uuid4().hex[:24]}"
        
        event = create_checkout_completed_event(
            session_id=session_id,
            user_id=user_id,
            package_id=package.id,
            coin_amount=package.total_coins,
        )
        
        result = await handler.handle_event(event)
        
        assert result.success is True, f"Package {package.id} failed"
        
        balance = await mock_balance.get_balance(user_id)
        expected = expected_amounts[package.id]
        
        assert balance == expected, (
            f"Package {package.id}: expected {expected} coins, got {balance}"
        )
        
        print(f"✓ {package.name} (${package.price_cents/100:.2f}): {balance} coins")
