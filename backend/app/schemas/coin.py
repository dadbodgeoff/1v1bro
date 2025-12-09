"""
Coin purchase system schemas.
Requirements: 1.1, 1.2, 4.1
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


# ============================================
# Enums
# ============================================

class TransactionType(str, Enum):
    """Transaction type. Requirements: 4.1"""
    CREDIT = "credit"
    DEBIT = "debit"


class TransactionSource(str, Enum):
    """Source of coin transaction. Requirements: 4.1"""
    STRIPE_PURCHASE = "stripe_purchase"
    COSMETIC_PURCHASE = "cosmetic_purchase"
    BATTLEPASS = "battlepass"
    REFUND = "refund"
    ADMIN = "admin"


# ============================================
# Coin Package Schemas
# ============================================

class CoinPackage(BaseSchema):
    """
    A purchasable coin bundle.
    Requirements: 1.1, 1.2
    """
    
    id: str = Field(..., description="Package ID (e.g., 'pkg_starter')")
    name: str = Field(..., description="Display name (e.g., 'Starter')")
    price_cents: int = Field(..., ge=1, description="Price in cents (e.g., 299 = $2.99)")
    base_coins: int = Field(..., ge=1, description="Base coins without bonus")
    bonus_coins: int = Field(default=0, ge=0, description="Bonus coins from multiplier")
    total_coins: int = Field(..., ge=1, description="Total coins received")
    bonus_percent: int = Field(default=0, ge=0, le=100, description="Bonus percentage (e.g., 17 = 17%)")
    badge: Optional[str] = Field(None, description="Badge text (e.g., 'Best Value')")
    sort_order: int = Field(default=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether package is available")
    stripe_price_id: Optional[str] = Field(None, description="Stripe Price ID")
    stripe_product_id: Optional[str] = Field(None, description="Stripe Product ID")
    
    @field_validator('total_coins')
    @classmethod
    def validate_total_coins(cls, v, info):
        """Validate that total_coins equals base_coins + bonus_coins."""
        values = info.data
        if 'base_coins' in values and 'bonus_coins' in values:
            expected = values['base_coins'] + values['bonus_coins']
            if v != expected:
                raise ValueError(f'total_coins ({v}) must equal base_coins + bonus_coins ({expected})')
        return v


class CoinPackageList(BaseSchema):
    """List of coin packages. Requirements: 1.4"""
    
    packages: List[CoinPackage] = Field(default_factory=list)


# ============================================
# User Balance Schemas
# ============================================

class UserBalance(BaseSchema):
    """
    User's coin balance.
    Requirements: 5.1, 5.3
    """
    
    user_id: str = Field(..., description="User UUID")
    coins: int = Field(default=0, ge=0, description="Current coin balance")
    lifetime_purchased: int = Field(default=0, ge=0, description="Total coins ever purchased")
    lifetime_spent: int = Field(default=0, ge=0, description="Total coins ever spent")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class BalanceResponse(BaseSchema):
    """Balance response for API. Requirements: 5.1"""
    
    coins: int = Field(..., ge=0, description="Current coin balance")


# ============================================
# Transaction Schemas
# ============================================

class CoinTransaction(BaseSchema):
    """
    A coin transaction record.
    Requirements: 4.1
    """
    
    id: str = Field(..., description="Transaction UUID")
    user_id: str = Field(..., description="User UUID")
    type: TransactionType = Field(..., description="Transaction type (credit/debit)")
    amount: int = Field(..., ge=1, description="Amount of coins")
    source: str = Field(..., description="Source of transaction")
    package_id: Optional[str] = Field(None, description="Package ID if from purchase")
    stripe_session_id: Optional[str] = Field(None, description="Stripe session ID")
    stripe_payment_intent: Optional[str] = Field(None, description="Stripe payment intent ID")
    amount_cents: Optional[int] = Field(None, description="USD amount paid in cents")
    balance_after: int = Field(..., description="Balance after transaction")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(..., description="Transaction timestamp")


class TransactionListResponse(BaseSchema):
    """Paginated transaction list. Requirements: 4.1, 4.4"""
    
    items: List[CoinTransaction] = Field(default_factory=list)
    total: int = Field(default=0, description="Total number of transactions")
    page: int = Field(default=1, ge=1, description="Current page")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")


# ============================================
# Checkout Schemas
# ============================================

class CheckoutRequest(BaseSchema):
    """Request to create checkout session. Requirements: 2.1"""
    
    package_id: str = Field(..., description="ID of package to purchase")


class CheckoutResponse(BaseSchema):
    """Response with checkout session details. Requirements: 2.1"""
    
    session_id: str = Field(..., description="Stripe Checkout Session ID")
    checkout_url: str = Field(..., description="URL to redirect user to Stripe")


class PurchaseVerifyRequest(BaseSchema):
    """Request to verify purchase completion. Requirements: 3.2"""
    
    session_id: str = Field(..., description="Stripe Checkout Session ID")


class PurchaseVerifyResponse(BaseSchema):
    """Response after verifying purchase. Requirements: 3.2"""
    
    success: bool = Field(..., description="Whether purchase was successful")
    coins_credited: int = Field(default=0, description="Coins credited to account")
    new_balance: int = Field(default=0, description="New coin balance")
    message: Optional[str] = Field(None, description="Status message")
    already_fulfilled: bool = Field(default=False, description="Whether already processed")


# ============================================
# Webhook Schemas
# ============================================

class WebhookResult(BaseSchema):
    """Result of webhook processing. Requirements: 3.1"""
    
    success: bool = Field(..., description="Whether webhook was processed successfully")
    message: str = Field(..., description="Status message")
    duplicate: bool = Field(default=False, description="Whether this was a duplicate")
    new_balance: Optional[int] = Field(None, description="New balance if coins credited")


# ============================================
# Error Schemas
# ============================================

class InsufficientFundsError(Exception):
    """Raised when user has insufficient coin balance. Requirements: 5.5"""
    
    def __init__(self, message: str, current_balance: int = 0, required: int = 0):
        self.message = message
        self.current_balance = current_balance
        self.required = required
        super().__init__(self.message)
