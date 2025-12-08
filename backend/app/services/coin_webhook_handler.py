"""
Webhook handler for Stripe coin purchase events.
Requirements: 3.1, 3.4
"""

import logging
from typing import Optional

import stripe

from app.services.stripe_service import StripeService
from app.services.balance_service import BalanceService
from app.schemas.coin import WebhookResult


logger = logging.getLogger(__name__)


class CoinWebhookHandler:
    """Handler for Stripe webhook events related to coin purchases."""

    def __init__(
        self,
        stripe_service: StripeService,
        balance_service: BalanceService,
    ):
        """
        Initialize webhook handler.
        
        Args:
            stripe_service: Stripe service for API operations
            balance_service: Balance service for coin operations
        """
        self.stripe_service = stripe_service
        self.balance_service = balance_service

    async def handle_event(self, event: stripe.Event) -> WebhookResult:
        """
        Route webhook event to appropriate handler.
        
        Args:
            event: Parsed Stripe event
            
        Returns:
            WebhookResult indicating success/failure
        """
        event_type = event.type
        
        if event_type == "checkout.session.completed":
            return await self.handle_checkout_completed(event)
        elif event_type == "checkout.session.expired":
            return await self.handle_checkout_expired(event)
        else:
            # Acknowledge unhandled events
            logger.info(f"Unhandled webhook event type: {event_type}")
            return WebhookResult(
                success=True,
                message=f"Event type {event_type} acknowledged but not processed",
            )

    async def handle_checkout_completed(
        self,
        event: stripe.Event,
    ) -> WebhookResult:
        """
        Handle checkout.session.completed event.
        
        Credits coins to user and records transaction.
        Requirements: 3.1, 3.4
        
        Args:
            event: Stripe checkout.session.completed event
            
        Returns:
            WebhookResult with fulfillment status
        """
        session = event.data.object
        session_id = session.id
        
        logger.info(f"Processing checkout.session.completed: {session_id}")
        
        # Check for duplicate fulfillment (idempotency)
        if await self.balance_service.check_fulfillment(session_id):
            logger.info(f"Session {session_id} already fulfilled, skipping")
            return WebhookResult(
                success=True,
                message="Already fulfilled",
                duplicate=True,
            )
        
        # Extract metadata
        metadata = session.metadata or {}
        user_id = metadata.get("user_id")
        package_id = metadata.get("package_id")
        coin_amount_str = metadata.get("coin_amount", "0")
        
        # Validate metadata
        if not user_id:
            logger.error(f"Session {session_id} missing user_id in metadata")
            return WebhookResult(
                success=False,
                message="Missing user_id in metadata",
            )
        
        if not package_id:
            logger.error(f"Session {session_id} missing package_id in metadata")
            return WebhookResult(
                success=False,
                message="Missing package_id in metadata",
            )
        
        try:
            coin_amount = int(coin_amount_str)
        except (ValueError, TypeError):
            logger.error(f"Session {session_id} has invalid coin_amount: {coin_amount_str}")
            return WebhookResult(
                success=False,
                message=f"Invalid coin_amount: {coin_amount_str}",
            )
        
        if coin_amount <= 0:
            logger.error(f"Session {session_id} has non-positive coin_amount: {coin_amount}")
            return WebhookResult(
                success=False,
                message=f"Invalid coin_amount: {coin_amount}",
            )
        
        # Credit coins to user
        try:
            new_balance = await self.balance_service.credit_coins(
                user_id=user_id,
                amount=coin_amount,
                transaction_id=session_id,
                source="stripe_purchase",
            )
            
            logger.info(
                f"Credited {coin_amount} coins to user {user_id}, "
                f"new balance: {new_balance}"
            )
            
            return WebhookResult(
                success=True,
                message=f"Credited {coin_amount} coins",
                new_balance=new_balance,
            )
            
        except Exception as e:
            logger.exception(f"Failed to credit coins for session {session_id}: {e}")
            return WebhookResult(
                success=False,
                message=f"Failed to credit coins: {str(e)}",
            )

    async def handle_checkout_expired(
        self,
        event: stripe.Event,
    ) -> WebhookResult:
        """
        Handle checkout.session.expired event.
        
        Logs expiration for monitoring, no action needed.
        
        Args:
            event: Stripe checkout.session.expired event
            
        Returns:
            WebhookResult acknowledging the event
        """
        session = event.data.object
        session_id = session.id
        metadata = session.metadata or {}
        user_id = metadata.get("user_id", "unknown")
        
        logger.info(f"Checkout session expired: {session_id} for user {user_id}")
        
        return WebhookResult(
            success=True,
            message="Session expiration acknowledged",
        )
