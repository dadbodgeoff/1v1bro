"""
Balance repository - Database operations for coin balances and transactions.
Requirements: 3.4, 3.5, 4.1, 5.3
"""

import logging
from typing import Optional, List
from datetime import datetime

from supabase import Client

logger = logging.getLogger(__name__)


class BalanceRepository:
    """Repository for coin balance database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _balances(self):
        return self._client.table("user_balances")

    def _transactions(self):
        return self._client.table("coin_transactions")

    def _packages(self):
        return self._client.table("coin_packages")

    # ============================================
    # Balance Operations
    # ============================================

    async def get_balance(self, user_id: str) -> Optional[dict]:
        """
        Get user's current balance.
        
        Returns balance record or None if not found.
        """
        result = (
            self._balances()
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_balance_coins(self, user_id: str) -> int:
        """
        Get user's current coin count.
        
        Returns 0 if user has no balance record.
        """
        balance = await self.get_balance(user_id)
        return balance["coins"] if balance else 0

    async def credit_coins(
        self,
        user_id: str,
        amount: int,
        transaction_id: str,
        source: str,
    ) -> int:
        """
        Credit coins to user's balance atomically using RPC.
        
        Args:
            user_id: User UUID
            amount: Coins to credit
            transaction_id: Stripe session ID or unique transaction ID
            source: Source of credit (e.g., 'stripe_purchase')
            
        Returns:
            New balance after credit
        """
        result = self._client.rpc(
            "credit_coins",
            {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_transaction_id": transaction_id,
                "p_source": source,
            }
        ).execute()
        
        return result.data if result.data is not None else 0

    async def debit_coins(
        self,
        user_id: str,
        amount: int,
        transaction_id: str,
        source: str,
    ) -> Optional[int]:
        """
        Debit coins from user's balance atomically using RPC.
        
        Args:
            user_id: User UUID
            amount: Coins to debit
            transaction_id: Unique transaction ID
            source: Source of debit (e.g., 'cosmetic_purchase')
            
        Returns:
            New balance after debit, or None if insufficient funds
        """
        logger.info(f"debit_coins RPC: user_id={user_id}, amount={amount}")
        
        result = self._client.rpc(
            "debit_coins",
            {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_transaction_id": transaction_id,
                "p_source": source,
            }
        ).execute()
        
        logger.info(f"debit_coins RPC result: data={result.data}")
        
        return result.data  # Returns None if insufficient funds

    async def create_balance(self, user_id: str) -> dict:
        """Create a new balance record for a user with 0 coins."""
        result = (
            self._balances()
            .insert({
                "user_id": user_id,
                "coins": 0,
                "lifetime_purchased": 0,
                "lifetime_spent": 0,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .execute()
        )
        return result.data[0] if result.data else {}

    # ============================================
    # Transaction Operations
    # ============================================

    async def check_fulfillment(self, stripe_session_id: str) -> bool:
        """
        Check if a Stripe session has already been fulfilled.
        
        Used for idempotency - prevents double-crediting.
        """
        result = (
            self._transactions()
            .select("id")
            .eq("stripe_session_id", stripe_session_id)
            .limit(1)
            .execute()
        )
        return bool(result.data)

    async def get_transactions(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get user's transaction history.
        
        Returns transactions ordered by created_at descending (newest first).
        """
        result = (
            self._transactions()
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or []

    async def get_transaction_count(self, user_id: str) -> int:
        """Get total count of user's transactions."""
        result = (
            self._transactions()
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0

    async def record_transaction(
        self,
        user_id: str,
        type: str,
        amount: int,
        source: str,
        balance_after: int,
        package_id: Optional[str] = None,
        stripe_session_id: Optional[str] = None,
        stripe_payment_intent: Optional[str] = None,
        amount_cents: Optional[int] = None,
        metadata: Optional[dict] = None,
    ) -> Optional[dict]:
        """
        Record a transaction manually (for non-RPC operations).
        
        Note: credit_coins and debit_coins RPC functions record transactions
        automatically. This is for special cases.
        """
        insert_data = {
            "user_id": user_id,
            "type": type,
            "amount": amount,
            "source": source,
            "balance_after": balance_after,
            "package_id": package_id,
            "stripe_session_id": stripe_session_id,
            "stripe_payment_intent": stripe_payment_intent,
            "amount_cents": amount_cents,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = self._transactions().insert(insert_data).execute()
        return result.data[0] if result.data else None

    # ============================================
    # Package Operations
    # ============================================

    async def get_active_packages(self) -> List[dict]:
        """Get all active coin packages ordered by sort_order."""
        result = (
            self._packages()
            .select("*")
            .eq("is_active", True)
            .order("sort_order")
            .execute()
        )
        return result.data or []

    async def get_package(self, package_id: str) -> Optional[dict]:
        """Get a single package by ID."""
        result = (
            self._packages()
            .select("*")
            .eq("id", package_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
