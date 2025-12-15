"""
Balance service for coin balance management.
Requirements: 3.1, 3.4, 4.1, 5.3, 5.5
"""

import logging
from typing import Optional, List
from uuid import uuid4

from supabase import Client

logger = logging.getLogger(__name__)

from app.database.repositories.balance_repo import BalanceRepository
from app.schemas.coin import (
    UserBalance,
    CoinTransaction,
    CoinPackage,
    TransactionListResponse,
    InsufficientFundsError,
)


class BalanceService:
    """Service for managing user coin balances."""

    def __init__(self, client: Client):
        self.balance_repo = BalanceRepository(client)

    # ============================================
    # Balance Operations
    # ============================================

    async def get_balance(self, user_id: str) -> int:
        """
        Get user's current coin balance.
        
        Returns 0 if user has no balance record.
        Requirements: 5.3
        """
        return await self.balance_repo.get_balance_coins(user_id)

    async def get_balance_details(self, user_id: str) -> UserBalance:
        """
        Get full balance details including lifetime stats.
        
        Creates balance record if not exists.
        """
        balance_data = await self.balance_repo.get_balance(user_id)
        
        if not balance_data:
            # Create balance record for new user
            balance_data = await self.balance_repo.create_balance(user_id)
            if not balance_data:
                # Return default if creation failed
                return UserBalance(
                    user_id=user_id,
                    coins=0,
                    lifetime_purchased=0,
                    lifetime_spent=0,
                )
        
        return UserBalance(
            user_id=balance_data["user_id"],
            coins=balance_data["coins"],
            lifetime_purchased=balance_data.get("lifetime_purchased", 0),
            lifetime_spent=balance_data.get("lifetime_spent", 0),
            updated_at=balance_data.get("updated_at"),
        )

    async def credit_coins(
        self,
        user_id: str,
        amount: int,
        transaction_id: str,
        source: str = "stripe_purchase",
    ) -> int:
        """
        Credit coins to user's balance.
        
        Uses atomic database function to ensure consistency.
        Requirements: 3.1, 3.5
        
        Args:
            user_id: User UUID
            amount: Coins to credit (must be positive)
            transaction_id: Unique ID for idempotency (e.g., Stripe session ID)
            source: Source of credit
            
        Returns:
            New balance after credit
        """
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        
        return await self.balance_repo.credit_coins(
            user_id=user_id,
            amount=amount,
            transaction_id=transaction_id,
            source=source,
        )

    async def debit_coins(
        self,
        user_id: str,
        amount: int,
        source: str = "cosmetic_purchase",
        transaction_id: Optional[str] = None,
    ) -> int:
        """
        Debit coins from user's balance.
        
        Uses atomic database function with row locking.
        Requirements: 5.5
        
        Args:
            user_id: User UUID
            amount: Coins to debit (must be positive)
            source: Source of debit
            transaction_id: Optional unique ID
            
        Returns:
            New balance after debit
            
        Raises:
            InsufficientFundsError: If balance is too low
        """
        if amount <= 0:
            raise ValueError("Debit amount must be positive")
        
        # Generate transaction ID if not provided
        if not transaction_id:
            transaction_id = str(uuid4())
        
        logger.info(f"debit_coins: user_id={user_id}, amount={amount}, source={source}")
        
        new_balance = await self.balance_repo.debit_coins(
            user_id=user_id,
            amount=amount,
            transaction_id=transaction_id,
            source=source,
        )
        
        logger.info(f"debit_coins: result from repo = {new_balance}")
        
        if new_balance is None:
            current_balance = await self.get_balance(user_id)
            logger.error(f"debit_coins: INSUFFICIENT FUNDS - have {current_balance}, need {amount}")
            raise InsufficientFundsError(
                message=f"Insufficient balance: have {current_balance}, need {amount}",
                current_balance=current_balance,
                required=amount,
            )
        
        return new_balance

    async def check_balance(self, user_id: str, amount: int) -> bool:
        """
        Check if user has sufficient balance for a purchase.
        
        Requirements: 5.5
        """
        balance = await self.get_balance(user_id)
        return balance >= amount

    # ============================================
    # Transaction Operations
    # ============================================

    async def check_fulfillment(self, stripe_session_id: str) -> bool:
        """
        Check if a Stripe session has already been fulfilled.
        
        Used for idempotency in webhook handling.
        Requirements: 3.4
        """
        return await self.balance_repo.check_fulfillment(stripe_session_id)

    async def get_transaction_history(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> TransactionListResponse:
        """
        Get user's transaction history with pagination.
        
        Requirements: 4.1, 4.2
        """
        offset = (page - 1) * page_size
        
        transactions_data = await self.balance_repo.get_transactions(
            user_id=user_id,
            limit=page_size,
            offset=offset,
        )
        
        total = await self.balance_repo.get_transaction_count(user_id)
        
        transactions = [
            CoinTransaction(
                id=t["id"],
                user_id=t["user_id"],
                type=t["type"],
                amount=t["amount"],
                source=t["source"],
                package_id=t.get("package_id"),
                stripe_session_id=t.get("stripe_session_id"),
                stripe_payment_intent=t.get("stripe_payment_intent"),
                amount_cents=t.get("amount_cents"),
                balance_after=t["balance_after"],
                metadata=t.get("metadata", {}),
                created_at=t["created_at"],
            )
            for t in transactions_data
        ]
        
        return TransactionListResponse(
            items=transactions,
            total=total,
            page=page,
            page_size=page_size,
        )

    # ============================================
    # Package Operations
    # ============================================

    async def get_packages(self) -> List[CoinPackage]:
        """
        Get all active coin packages.
        
        Requirements: 1.4
        """
        packages_data = await self.balance_repo.get_active_packages()
        
        return [
            CoinPackage(
                id=p["id"],
                name=p["name"],
                price_cents=p["price_cents"],
                base_coins=p["base_coins"],
                bonus_coins=p["bonus_coins"],
                total_coins=p["total_coins"],
                bonus_percent=p["bonus_percent"],
                badge=p.get("badge"),
                sort_order=p.get("sort_order", 0),
                is_active=p.get("is_active", True),
                stripe_price_id=p.get("stripe_price_id"),
            )
            for p in packages_data
        ]

    async def get_package(self, package_id: str) -> Optional[CoinPackage]:
        """Get a single package by ID."""
        package_data = await self.balance_repo.get_package(package_id)
        
        if not package_data:
            return None
        
        return CoinPackage(
            id=package_data["id"],
            name=package_data["name"],
            price_cents=package_data["price_cents"],
            base_coins=package_data["base_coins"],
            bonus_coins=package_data["bonus_coins"],
            total_coins=package_data["total_coins"],
            bonus_percent=package_data["bonus_percent"],
            badge=package_data.get("badge"),
            sort_order=package_data.get("sort_order", 0),
            is_active=package_data.get("is_active", True),
            stripe_price_id=package_data.get("stripe_price_id"),
        )
